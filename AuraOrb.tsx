import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { LiveState, NishaMood } from "../types";
import { Power, Sparkles, Terminal, Cpu, Radio, Volume2, VolumeX } from "lucide-react";

interface AuraOrbProps {
  state: LiveState;
  mood: NishaMood;
  inputLevel: number;
  outputLevel: number;
  onTogglePower: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const MOOD_COLORS: Record<NishaMood, { primary: string; secondary: string; accent: string; glow: string }> = {
  sassy: { primary: "#00FF66", secondary: "#00F0FF", accent: "#FF007A", glow: "rgba(0, 255, 102, 0.6)" },
  flirty: { primary: "#FF007A", secondary: "#FF00FF", accent: "#00FF66", glow: "rgba(255, 0, 122, 0.6)" },
  playful: { primary: "#00F0FF", secondary: "#3A86FF", accent: "#00FF66", glow: "rgba(0, 240, 255, 0.6)" },
  thinking: { primary: "#7000FF", secondary: "#00FF66", accent: "#00F0FF", glow: "rgba(112, 0, 255, 0.6)" },
  chill: { primary: "#00FFCC", secondary: "#0099FF", accent: "#3A86FF", glow: "rgba(0, 255, 204, 0.6)" },
  dramatic: { primary: "#FF0033", secondary: "#FF007A", accent: "#00FF66", glow: "rgba(255, 0, 51, 0.6)" },
};

export const AuraOrb: React.FC<AuraOrbProps> = ({
  state,
  mood,
  inputLevel,
  outputLevel,
  onTogglePower,
  isMuted,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = MOOD_COLORS[mood] || MOOD_COLORS.sassy;

  // Render hacker canvas matrix visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 88; // radius around central orb

      ctx.clearRect(0, 0, width, height);

      const currentLevel = state === "speaking" ? outputLevel : state === "listening" ? inputLevel : 0.08;

      // 1. Smooth 100% Circular Radial Background Glow (fades to 100% transparent at 160px)
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        160
      );
      auraGradient.addColorStop(0, colors.primary);
      auraGradient.addColorStop(0.5, colors.secondary);
      auraGradient.addColorStop(1, "rgba(0,0,0,0)"); // 100% transparent edge

      ctx.beginPath();
      ctx.arc(centerX, centerY, 160, 0, Math.PI * 2);
      ctx.fillStyle = auraGradient;
      ctx.globalAlpha = 0.2 + currentLevel * 0.3;
      ctx.fill();

      // 2. Smooth Concentric Cyber Rings
      ctx.lineWidth = 1.5;
      for (let r = 1; r <= 3; r++) {
        const ringRadius = baseRadius + r * 14 + Math.sin(angle * r) * 3 + currentLevel * 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = colors.primary;
        ctx.globalAlpha = 0.25 / r;
        ctx.stroke();
      }

      // 3. Smooth Flowing Liquid Audio Wave Ring (No spiky gear teeth!)
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      const points = 120;
      for (let i = 0; i <= points; i++) {
        const pAngle = (i / points) * Math.PI * 2;
        // Smooth sine harmonics (3 and 2) instead of spiky 12 gear teeth
        const wave1 = Math.sin(pAngle * 3 + angle * 2) * (3 + currentLevel * 12);
        const wave2 = Math.cos(pAngle * 2 - angle * 1.5) * (2 + currentLevel * 8);
        const r = baseRadius + wave1 + wave2;
        const x = centerX + Math.cos(pAngle) * r;
        const y = centerY + Math.sin(pAngle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2.5 + currentLevel * 3;
      ctx.shadowColor = colors.primary;
      ctx.shadowBlur = 12;
      ctx.stroke();

      // 4. Secondary Delicate Particle Ring
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.6;
      for (let p = 0; p < 8; p++) {
        const pAngle = (p / 8) * Math.PI * 2 + angle * 0.5;
        const pRadius = baseRadius + 22 + Math.sin(angle * 2 + p) * 4;
        const px = centerX + Math.cos(pAngle) * pRadius;
        const py = centerY + Math.sin(pAngle) * pRadius;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.fill();
      }

      angle += 0.03;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, mood, inputLevel, outputLevel, colors]);

  const isConnected = state !== "disconnected";

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-md mx-auto my-auto py-2">
      {/* Background cyber radial glow - rounded full */}
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: colors.primary,
        }}
      />

      {/* Main Interactive Matrix Canvas Visualizer */}
      <div className="relative w-90 h-90 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="absolute inset-0 w-full h-full pointer-events-none z-0 rounded-full"
        />

        {/* Central Hacker Core Power Orb (NO MIC LOGO) */}
        <motion.button
          id="nisha-main-power-btn"
          onClick={onTogglePower}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isConnected
              ? [
                  `0 0 30px ${colors.glow}, inset 0 0 20px ${colors.glow}`,
                  `0 0 60px ${colors.glow}, inset 0 0 30px ${colors.glow}`,
                  `0 0 30px ${colors.glow}, inset 0 0 20px ${colors.glow}`,
                ]
              : "0 0 15px rgba(0,255,102,0.15)",
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center backdrop-blur-2xl border-2 transition-all duration-500 cursor-pointer font-mono ${
            isConnected
              ? "bg-black/90 border-emerald-400/80 text-emerald-400"
              : "bg-slate-950/90 border-emerald-900/60 text-slate-500 hover:border-emerald-500 hover:text-emerald-400"
          }`}
        >
          {/* Cyber matrix border pulse ring */}
          <div
            className="absolute inset-1 rounded-full opacity-30 pointer-events-none transition-all duration-500"
            style={{
              background: `radial-gradient(circle, ${colors.primary} 0%, transparent 80%)`,
            }}
          />

          {/* Central AI Hacker Core Visual Element (NO MIC ICON) */}
          {state === "connecting" ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="text-emerald-400 mb-2"
            >
              <Cpu className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_#00FF66]" />
            </motion.div>
          ) : isConnected ? (
            <div className="flex flex-col items-center justify-center mb-1">
              {/* Cyber Waveform Soundwave / Frequency Node (No Mic Icon) */}
              <div className="flex items-center gap-1 h-10 mb-1">
                {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5].map((heightScale, idx) => (
                  <motion.span
                    key={idx}
                    animate={
                      state === "speaking" || state === "listening"
                        ? {
                            scaleY: [0.3, heightScale * (1 + (state === "speaking" ? outputLevel : inputLevel) * 2), 0.3],
                          }
                        : { scaleY: 0.4 }
                    }
                    transition={{
                      duration: 0.4 + idx * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-1.5 h-8 bg-gradient-to-t from-emerald-500 via-cyan-400 to-pink-500 rounded-full shadow-[0_0_8px_#00FF66]"
                  />
                ))}
              </div>
            </div>
          ) : (
            <Power className="w-10 h-10 mb-2 text-emerald-600/80 group-hover:text-emerald-400 transition-colors" />
          )}

          {/* Cyber Terminal Text Label */}
          <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-400 drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]">
            {state === "disconnected" && "[SYSTEM.START]"}
            {state === "connecting" && "[LINKING...]"}
            {state === "listening" && "[NISHA.READY]"}
            {state === "speaking" && "[NISHA.LIVE]"}
            {state === "thinking" && "[PROCESSING]"}
          </span>

          <span className="text-[9px] font-mono text-emerald-600/80 mt-0.5">
            {isConnected ? "ONLINE" : "OFFLINE"}
          </span>
        </motion.button>
      </div>

      {/* Floating Hacker Bar (Mute & Quick Mood) */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-3 px-4 py-2 rounded-xl bg-black/90 border border-emerald-500/40 backdrop-blur-xl shadow-[0_0_15px_rgba(0,255,102,0.2)] font-mono"
        >
          <button
            id="nisha-mute-toggle-btn"
            onClick={onToggleMute}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isMuted
                ? "bg-red-950/80 text-red-400 border border-red-500/50"
                : "bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-900/80"
            }`}
            title={isMuted ? "Unmute Audio Stream" : "Mute Audio Stream"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? "MUTED" : "LIVE_MIC"}</span>
          </button>

          <div className="h-4 w-px bg-emerald-800/80" />

          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: colors.primary }}
            />
            <span className="uppercase tracking-widest">{mood}_VIBE</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

