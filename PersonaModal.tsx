import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { NishaMood } from "../types";
import { X, Terminal, Flame, Shield, Volume2, Cpu, Zap } from "lucide-react";

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMood: NishaMood;
  onSelectMood: (mood: NishaMood) => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  isOpen,
  onClose,
  currentMood,
  onSelectMood,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono scanlines">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-md bg-black border border-emerald-500/60 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,255,102,0.25)] relative overflow-hidden"
        >
          {/* Header background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-emerald-600 hover:text-emerald-400 rounded-lg hover:bg-emerald-950/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/60 flex items-center justify-center shadow-[0_0_15px_#00FF66]">
              <Terminal className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-400">NISHA_AI SYSTEM_CORE</h2>
              <p className="text-xs text-emerald-600">Cyberpunk Witty & Flirty AI Assistant</p>
            </div>
          </div>

          {/* Persona Characteristics */}
          <div className="space-y-3.5 my-4">
            <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-400" /> SASS & WIT MATRIX
                </span>
                <span className="font-bold text-emerald-300">9.9 / 10</span>
              </div>
              <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-900">
                <div className="h-full bg-emerald-400 shadow-[0_0_8px_#00FF66] w-[99%]" />
              </div>
            </div>

            <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" /> CHARM & FLIRTINESS
                </span>
                <span className="font-bold text-cyan-300">9.7 / 10</span>
              </div>
              <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-900">
                <div className="h-full bg-cyan-400 shadow-[0_0_8px_#00F0FF] w-[97%]" />
              </div>
            </div>

            <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" /> VOICE MODEL ENGINE
                </span>
                <span className="font-bold text-emerald-300">Kore (Expressive)</span>
              </div>
            </div>

            {/* Mood selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-400 block">
                CHOOSE NISHA'S ACTIVE VIBE:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "sassy", label: "Sassy & Bold", emoji: "⚡" },
                  { id: "flirty", label: "Flirty & Playful", emoji: "💋" },
                  { id: "playful", label: "Witty & Hacker", emoji: "👾" },
                  { id: "chill", label: "Chill Matrix", emoji: "🔋" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectMood(m.id as NishaMood);
                    }}
                    className={`p-2.5 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                      currentMood === m.id
                        ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_12px_#00FF66]"
                        : "bg-emerald-950/20 border border-emerald-900/60 text-emerald-600 hover:text-emerald-300 hover:border-emerald-500"
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-500 text-black rounded-xl text-xs font-bold shadow-[0_0_15px_#00FF66] hover:bg-emerald-400 transition-all cursor-pointer"
            >
              SAVE CONFIGURATION
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

