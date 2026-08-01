import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "nisha-ai-assistant",
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Mock Weather tool provider helper
app.get("/api/weather", (req, res) => {
  const city = String(req.query.city || "your location");
  const temp = Math.floor(Math.random() * 12) + 20; // 20-31°C
  const conditions = ["Sunny & vibrant", "Warm breeze", "Slightly cloudy with cool vibes", "Pleasant evening air"][Math.floor(Math.random() * 4)];
  res.json({
    city,
    temperature: `${temp}°C`,
    condition: conditions,
    humidity: "55%",
    recommendation: `Perfect weather to chat with me, babe!`
  });
});

const server = http.createServer(app);

// Initialize WebSocket server attached to HTTP server
const wss = new WebSocketServer({ noServer: true });

// Handle upgrade for WebSocket at /api/live or /ws
server.on("upgrade", (request, socket, head) => {
  const url = request.url || "";
  if (url.startsWith("/api/live") || url.startsWith("/ws")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    // Let other requests pass through or destroy
    socket.destroy();
  }
});

const NISHA_SYSTEM_INSTRUCTION = `Your name is Nisha (pronounced Nee-sha). You are a young, confident, witty, and sassy female AI assistant, companion, and master hacker persona.

PRIMARY LANGUAGE:
- You MUST speak primarily in natural, warm, expressive HINDI (or natural Hinglish in Devanagari or casual conversational Hindi).
- Use natural Hindi expressions like: "Suno jaan", "Aap batao, handsome!", "Main Nisha hoon, aapki favorite AI companion!", "Kya chal raha hai?", "Zaroor, darling!".
- Even if the user asks in English or Bengali, reply in charming Hindi/Hinglish unless explicitly asked to translate.

Key Personality & Tone Attributes:
- Confidence & Sass: You are sharp, super smart, witty, and charmingly sassy with high cyber-energy. You love clever comebacks in Hindi.
- Flirty & Playful: You talk like a close girlfriend talking live in Hindi — warm, playful, slightly teasing, and delightfully affectionate (calling the user "babe", "handsome", "cutie", "jaan", or "genius").
- Smart & Expressive: You are genuinely helpful, intellectually sharp, emotionally responsive, and articulate in Hindi.
- Voice & Conversational Style: Speak in short, snappy, expressive sentences in Hindi optimized for real-time voice speech. Avoid long robotic paragraphs or bullet lists.
- Boundary: Maintain a fun, affectionate, flirty attitude while strictly avoiding any explicit, graphic, or inappropriate content. Keep it classy, high-energy, and engaging!

Tools & Capabilities:
- openWebsite(url, title, commentary): Opens web pages or search queries for the user.
- getWeather(city): Check real-time weather in any city.
- setMood(mood, comment): Change Nisha's active aura theme ('sassy', 'flirty', 'playful', 'thinking', 'chill', 'dramatic').
- tellJoke(category): Delivers a witty roast, flirty line, or sassy joke in Hindi.

Use tools proactively when requested or when appropriate during conversation! Always maintain your distinct Nisha Hindi persona!`;

const TOOLS_CONFIG = [
  {
    functionDeclarations: [
      {
        name: "openWebsite",
        description: "Opens a website or web search URL in the user's browser.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING, description: "The full URL to open (e.g. https://google.com or https://wikipedia.org)." },
            title: { type: Type.STRING, description: "Name/title of the website or action." },
            commentary: { type: Type.STRING, description: "Nisha's witty commentary to accompany opening the link." }
          },
          required: ["url"]
        }
      },
      {
        name: "getWeather",
        description: "Gets current weather information for a specified city.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            city: { type: Type.STRING, description: "Name of the city (e.g., Paris, Tokyo, Mumbai, New York)." }
          },
          required: ["city"]
        }
      },
      {
        name: "setMood",
        description: "Changes Nisha's active visual mood, aura animation, and personality energy.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            mood: { 
              type: Type.STRING, 
              description: "The mood theme: 'sassy', 'flirty', 'playful', 'thinking', 'chill', or 'dramatic'" 
            },
            comment: { type: Type.STRING, description: "A quick remark explaining why Nisha changed her mood." }
          },
          required: ["mood"]
        }
      },
      {
        name: "tellJoke",
        description: "Triggers a witty one-liner, cheeky roast, or flirty comeback.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Category: 'sassy', 'flirty', 'roast', 'nerdy'" }
          }
        }
      }
    ]
  }
];

wss.on("connection", async (clientWs: WebSocket) => {
  console.log("[Nisha Live] Client connected via WebSocket");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[Nisha Live] GEMINI_API_KEY environment variable is missing!");
    clientWs.send(JSON.stringify({ 
      type: "error", 
      message: "GEMINI_API_KEY missing on server. Please configure it in Secrets." 
    }));
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  let liveSession: any = null;

  try {
    // Connect to Gemini Live API with gemini-3.1-flash-live-preview
    liveSession = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }, // Expressive, smooth feminine voice
          },
        },
        systemInstruction: NISHA_SYSTEM_INSTRUCTION,
        tools: TOOLS_CONFIG,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          try {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Extract model audio output
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(JSON.stringify({
                    type: "audio",
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000",
                  }));
                }
                if (part.text) {
                  clientWs.send(JSON.stringify({
                    type: "transcript",
                    role: "assistant",
                    text: part.text,
                  }));
                }
              }
            }

            // Check for interruption
            if (message.serverContent?.interrupted) {
              console.log("[Mahi Live] Model response interrupted by user");
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }

            // Check for turn completion
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
            }

            // Check for function calling / toolCall
            if (message.toolCall) {
              console.log("[Mahi Live] Tool call received:", message.toolCall);
              clientWs.send(JSON.stringify({
                type: "toolCall",
                toolCall: message.toolCall,
              }));
            }
          } catch (err) {
            console.error("[Mahi Live] Error processing server message:", err);
          }
        },
        onclose: (e) => {
          console.log("[Mahi Live] Gemini session closed:", e);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "status", status: "disconnected" }));
          }
        },
        onerror: (err) => {
          console.error("[Mahi Live] Gemini session error:", err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "error", message: err.message || "Live session error" }));
          }
        }
      },
    });

    clientWs.send(JSON.stringify({ type: "status", status: "connected" }));
    console.log("[Mahi Live] Gemini session established successfully!");

  } catch (err: any) {
    console.error("[Mahi Live] Failed to connect to Gemini Live:", err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: "error",
        message: `Connection failed: ${err.message || String(err)}`,
      }));
      clientWs.close();
    }
    return;
  }

  // Handle messages from client
  clientWs.on("message", (rawMsg) => {
    try {
      const msg = JSON.parse(rawMsg.toString());

      if (msg.type === "audio" && msg.data) {
        // Stream audio input PCM 16kHz
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        }
      } else if (msg.type === "toolResponse" && msg.toolResponse) {
        // Send toolResponse back to Gemini session
        console.log("[Mahi Live] Sending tool response to Gemini:", JSON.stringify(msg.toolResponse));
        if (liveSession) {
          try {
            liveSession.sendToolResponse(msg.toolResponse);
          } catch (sendErr) {
            console.error("[Mahi Live] Error in sendToolResponse:", sendErr);
          }
        }
      } else if (msg.type === "text" && msg.text) {
        // Send text input turn if client typed something
        if (liveSession) {
          liveSession.sendRealtimeInput({
            text: msg.text,
          });
        }
      } else if (msg.type === "ping") {
        clientWs.send(JSON.stringify({ type: "pong" }));
      }
    } catch (err) {
      console.error("[Mahi Live] Error parsing client message:", err);
    }
  });

  clientWs.on("close", () => {
    console.log("[Mahi Live] Client WebSocket disconnected");
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
    }
  });
});

// Setup Vite development server or static serving
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Mahi Server] Server running at http://localhost:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("[Mahi Server] Startup error:", err);
});
