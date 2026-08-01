import React from "react";
import { LiveState, NishaMood } from "../types";
import { Terminal, Settings2, ShieldCheck, Cpu, Flame, Zap } from "lucide-react";

interface NishaHeaderProps {
  state: LiveState;
  mood: NishaMood;
  onSelectMood: (mood: NishaMood) => void;
  onOpenPersonaModal: () => void;
}

export const MahiHeader: React.FC<NishaHeaderProps> = ({
  state,
  mood,
  onSelectMood,
  onOpenPersonaModal,
}) => {
  const moodsList: { id: NishaMood; label: string; emoji: string }[] = [
    { id: "sassy", label: "Sassy", emoji: "⚡" },
    { id: "flirty", label: "Flirty", emoji: "💋" },
    { id: "playful", label: "Playful", emoji: "👾" },
    { id: "chill", label: "Chill", emoji: "🔋" },
    { id: "dramatic", label: "Dramatic", emoji: "💥" },
  ];

  return (
    <header className="w-full px-4 py-2.5 flex items-center justify-between border-b border-emerald-500/30 bg-black/90 backdrop-blur-xl z-30 font-mono scanlines">
      {/* Brand & Persona Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/60 p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(0,255,102,0.4)]">
          <Terminal className="w-5 h-5 text-emerald-400" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-emerald-400 tracking-wider flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]">
              <span>NISHA_AI</span>
            </h1>
            <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-widest rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              v2.0_HACKER
            </span>
          </div>
          <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>GEMINI_LIVE_LINK</span>
          </p>
        </div>
      </div>

      {/* Mood Selector Pills */}
      <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-emerald-900/60">
        {moodsList.map((m) => {
          const isActive = mood === m.id;
          return (
            <button
              key={m.id}
              id={`nisha-mood-${m.id}`}
              onClick={() => onSelectMood(m.id)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                isActive
                  ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(0,255,102,0.8)]"
                  : "text-emerald-600 hover:text-emerald-300 hover:bg-emerald-950/60"
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Settings & Status Badge */}
      <div className="flex items-center gap-2">
        <div
          className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 border ${
            state === "speaking"
              ? "bg-pink-950/80 text-pink-400 border-pink-500/60 shadow-[0_0_10px_rgba(255,0,122,0.4)] animate-pulse"
              : state === "listening"
              ? "bg-cyan-950/80 text-cyan-400 border-cyan-500/60 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
              : state === "connecting"
              ? "bg-amber-950/80 text-amber-400 border-amber-500/60"
              : "bg-emerald-950/40 text-emerald-700 border-emerald-900/40"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              state === "speaking"
                ? "bg-pink-400"
                : state === "listening"
                ? "bg-cyan-400"
                : state === "connecting"
                ? "bg-amber-400 animate-ping"
                : "bg-emerald-800"
            }`}
          />
          <span>{state}</span>
        </div>

        <button
          id="nisha-persona-settings-btn"
          onClick={onOpenPersonaModal}
          className="p-2 rounded-lg bg-black border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950 hover:border-emerald-400 transition-colors cursor-pointer"
          title="Nisha Cyber Personality Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

