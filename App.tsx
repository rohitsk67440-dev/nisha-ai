import React, { useState, useEffect, useRef, useCallback } from "react";
import { LiveState, NishaMood, TranscriptItem, ToolCallData } from "./types";
import { AudioStreamer } from "./lib/AudioStreamer";
import { AudioPlayer } from "./lib/AudioPlayer";
import { AuraOrb } from "./components/AuraOrb";
import { MahiHeader } from "./components/MahiHeader";
import { SubtitleBar } from "./components/SubtitleBar";
import { ToolOverlay } from "./components/ToolOverlay";
import { QuickPrompts } from "./components/QuickPrompts";
import { PersonaModal } from "./components/PersonaModal";
import { Terminal, AlertCircle } from "lucide-react";

export default function App() {
  const [liveState, setLiveState] = useState<LiveState>("disconnected");
  const [mood, setMood] = useState<NishaMood>("sassy");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [outputLevel, setOutputLevel] = useState<number>(0);

  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [latestAssistantText, setLatestAssistantText] = useState<string>("");
  const [latestUserText, setLatestUserText] = useState<string>("");

  const [activeToolCall, setActiveToolCall] = useState<ToolCallData | null>(null);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  // Initialize AudioPlayer
  useEffect(() => {
    audioPlayerRef.current = new AudioPlayer(
      (level) => setOutputLevel(level),
      (isSpeaking) => {
        if (isSpeaking) {
          setLiveState("speaking");
        } else {
          setLiveState((prev) => (prev === "speaking" ? "listening" : prev));
        }
      }
    );

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.destroy();
      }
    };
  }, []);

  // Handle WebSocket Connection
  const connectSession = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setErrorMessage(null);
    setLiveState("connecting");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/live`;

    console.log("[Nisha App] Connecting to WebSocket at", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log("[Nisha App] WebSocket connection open");
        setLiveState("listening");

        // Start microphone streaming
        const streamer = new AudioStreamer(
          (base64Pcm) => {
            if (ws.readyState === WebSocket.OPEN && !isMuted) {
              ws.send(
                JSON.stringify({
                  type: "audio",
                  data: base64Pcm,
                })
              );
            }
          },
          (level) => setInputLevel(level)
        );

        const ok = await streamer.start();
        if (ok) {
          audioStreamerRef.current = streamer;
        } else {
          setErrorMessage("Microphone access denied or unavailable.");
        }
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "audio" && msg.data) {
            if (audioPlayerRef.current) {
              audioPlayerRef.current.playChunk(msg.data);
            }
          } else if (msg.type === "interrupted") {
            console.log("[Nisha App] Interruption signal received");
            if (audioPlayerRef.current) {
              audioPlayerRef.current.stop();
            }
            setLiveState("listening");
          } else if (msg.type === "transcript") {
            const role = msg.role || "assistant";
            const text = msg.text || "";

            if (role === "assistant") {
              setLatestAssistantText((prev) => prev + text);
            } else {
              setLatestUserText(text);
            }

            setTranscripts((prev) => [
              ...prev.slice(-30),
              {
                id: Math.random().toString(36).substring(2),
                role,
                text,
                timestamp: new Date(),
              },
            ]);
          } else if (msg.type === "toolCall") {
            handleToolCall(msg.toolCall, ws);
          } else if (msg.type === "status") {
            if (msg.status === "connected") {
              setLiveState("listening");
            } else if (msg.status === "disconnected") {
              disconnectSession();
            }
          } else if (msg.type === "error") {
            setErrorMessage(msg.message || "Session error occurred");
          }
        } catch (err) {
          console.error("[Nisha App] Error handling WS message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("[Nisha App] WebSocket error:", err);
        setErrorMessage("Connection error. Check API key or server status.");
        disconnectSession();
      };

      ws.onclose = () => {
        console.log("[Nisha App] WebSocket connection closed");
        disconnectSession();
      };
    } catch (err: any) {
      console.error("[Nisha App] Failed to connect WebSocket:", err);
      setErrorMessage(err.message || "Failed to establish live session.");
      disconnectSession();
    }
  }, [isMuted]);

  // Handle Tool Calling
  const handleToolCall = async (toolCall: any, ws: WebSocket) => {
    const { functionCalls } = toolCall;
    if (!functionCalls || functionCalls.length === 0) return;

    for (const call of functionCalls) {
      const { name, args, id } = call;
      console.log(`[Nisha App] Executing tool '${name}' with args:`, args);

      const toolData: ToolCallData = {
        id,
        name,
        args,
        status: "executing",
      };
      setActiveToolCall(toolData);

      let result: any = { success: true };

      if (name === "openWebsite") {
        const url = args.url;
        if (url) {
          window.open(url, "_blank");
          result = { opened: true, url, commentary: args.commentary || "Website opened!" };
        }
      } else if (name === "getWeather") {
        try {
          const res = await fetch(`/api/weather?city=${encodeURIComponent(args.city || "Tokyo")}`);
          const data = await res.json();
          result = data;
        } catch (e) {
          result = { city: args.city, temperature: "26°C", condition: "Sunny & Cyberpunk" };
        }
      } else if (name === "setMood") {
        if (args.mood) {
          setMood(args.mood as NishaMood);
          result = { newMood: args.mood, comment: args.comment };
        }
      } else if (name === "tellJoke") {
        result = { joke: "You're asking the cutest hacker AI for jokes? That's double the digital humor!" };
      }

      setActiveToolCall((prev) => (prev ? { ...prev, status: "completed", result } : null));

      // Send toolResponse back to server
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "toolResponse",
            toolResponse: {
              functionResponses: [
                {
                  name: name || "unknown_tool",
                  id: id || "call_default",
                  response: typeof result === "object" && result !== null ? result : { output: result },
                },
              ],
            },
          })
        );
      }
    }
  };

  // Disconnect Session
  const disconnectSession = () => {
    setLiveState("disconnected");
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
      audioStreamerRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Toggle Connection Power
  const handleTogglePower = () => {
    if (liveState === "disconnected") {
      connectSession();
    } else {
      disconnectSession();
    }
  };

  // Mute Toggle
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Send Text Input Prompt to Nisha
  const handleSendTextPrompt = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setLatestUserText(text);
      setLatestAssistantText("");
      wsRef.current.send(
        JSON.stringify({
          type: "text",
          text,
        })
      );
    } else {
      connectSession();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-emerald-400 cyber-grid scanlines flex flex-col justify-between overflow-hidden font-mono select-none">
      {/* Dynamic Background Matrix Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black via-slate-950 to-black z-0 pointer-events-none" />

      {/* Sleek Top Header Bar */}
      <MahiHeader
        state={liveState}
        mood={mood}
        onSelectMood={(m) => setMood(m)}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-between py-4 px-4">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="w-full max-w-md mx-auto mb-3 bg-red-950/90 border border-red-500/60 text-red-300 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.3)] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Central Interactive Cyber Visualizer & Power Button (No Mic Logo) */}
        <AuraOrb
          state={liveState}
          mood={mood}
          inputLevel={inputLevel}
          outputLevel={outputLevel}
          onTogglePower={handleTogglePower}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />

        {/* Live Subtitle / Caption Bar */}
        <SubtitleBar
          transcripts={transcripts}
          latestAssistantText={latestAssistantText}
          latestUserText={latestUserText}
        />

        {/* Quick Voice Prompt Action Chips */}
        <QuickPrompts
          onSendTextPrompt={handleSendTextPrompt}
          isConnected={liveState !== "disconnected"}
        />
      </main>

      {/* Tool Execution Overlay Card */}
      <ToolOverlay toolCall={activeToolCall} onClose={() => setActiveToolCall(null)} />

      {/* Persona Customization Settings Modal */}
      <PersonaModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        currentMood={mood}
        onSelectMood={(m) => setMood(m)}
      />
    </div>
  );
}

