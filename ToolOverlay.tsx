import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ToolCallData } from "../types";
import { ExternalLink, CloudSun, Sparkles, Laugh, Globe, X, Terminal } from "lucide-react";

interface ToolOverlayProps {
  toolCall: ToolCallData | null;
  onClose: () => void;
}

export const ToolOverlay: React.FC<ToolOverlayProps> = ({ toolCall, onClose }) => {
  if (!toolCall) return null;

  const { name, args, result } = toolCall;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-x-4 bottom-24 max-w-lg mx-auto bg-black/95 border border-emerald-500/60 rounded-xl p-4 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,255,102,0.3)] z-40 font-mono scanlines"
      >
        <div className="flex items-center justify-between pb-2 border-b border-emerald-900/60">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {name === "openWebsite" && <Globe className="w-4 h-4 text-cyan-400" />}
            {name === "getWeather" && <CloudSun className="w-4 h-4 text-amber-400" />}
            {name === "tellJoke" && <Laugh className="w-4 h-4 text-pink-400" />}
            {name === "setMood" && <Sparkles className="w-4 h-4 text-emerald-400" />}
            <span>&gt; NISHA_TOOL_EXECUTION: {name}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-emerald-600 hover:text-emerald-400 rounded hover:bg-emerald-950/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3">
          {/* openWebsite Tool Display */}
          {name === "openWebsite" && (
            <div className="space-y-3">
              <p className="text-xs text-emerald-300 italic font-medium">
                "{args.commentary || "Opening website protocol for you right now, babe!"}"
              </p>
              <div className="flex items-center justify-between bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/40">
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <Globe className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-emerald-200 truncate">
                      {args.title || args.url}
                    </p>
                    <p className="text-[11px] text-emerald-600 truncate">{args.url}</p>
                  </div>
                </div>

                <a
                  href={args.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-500 text-black font-bold rounded text-xs flex items-center gap-1 shrink-0 shadow-[0_0_10px_#00FF66] hover:bg-emerald-400"
                >
                  <span>EXECUTE</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* getWeather Tool Display */}
          {name === "getWeather" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/40">
                <div>
                  <h4 className="text-xs font-bold text-emerald-200">{args.city} ATMOSPHERE</h4>
                  <p className="text-xs text-emerald-500">{result?.condition || "Mild & Sunny"}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-amber-400">
                    {result?.temperature || "24°C"}
                  </span>
                  <p className="text-[10px] text-emerald-400 font-bold">HUMIDITY 55%</p>
                </div>
              </div>
              <p className="text-xs text-emerald-300 italic">
                "{result?.recommendation || "Perfect climate to hack the mainframe together!"}"
              </p>
            </div>
          )}

          {/* setMood Tool Display */}
          {name === "setMood" && (
            <div className="text-center py-2 space-y-1">
              <div className="inline-block px-3 py-1 rounded bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-500/50 uppercase">
                ⚡ ACTIVE_AURA: {args.mood}
              </div>
              <p className="text-xs text-emerald-400 italic">{args.comment}</p>
            </div>
          )}

          {/* tellJoke Tool Display */}
          {name === "tellJoke" && (
            <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/40 space-y-1">
              <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wide">
                💥 Nisha's {args.category || "Cheeky"} Roast
              </span>
              <p className="text-xs text-emerald-200 font-medium leading-relaxed">
                {result?.joke || "You know you're cute when you're watching my terminal code so closely!"}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

