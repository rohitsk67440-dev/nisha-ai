import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TranscriptItem } from "../types";
import { Terminal, Sparkles, ChevronUp, ChevronDown, History, Cpu } from "lucide-react";

interface SubtitleBarProps {
  transcripts: TranscriptItem[];
  latestAssistantText: string;
  latestUserText: string;
}

export const SubtitleBar: React.FC<SubtitleBarProps> = ({
  transcripts,
  latestAssistantText,
  latestUserText,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  const hasContent = Boolean(latestAssistantText || latestUserText || transcripts.length > 0);

  return (
    <div className="w-full max-w-xl mx-auto px-4 z-20 font-mono">
      <AnimatePresence>
        {hasContent && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="rounded-xl bg-black/90 border border-emerald-500/40 backdrop-blur-2xl p-3.5 shadow-[0_0_20px_rgba(0,255,102,0.15)] relative overflow-hidden scanlines"
          >
            {/* Header / Toggle History */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-900/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>NISHA_LIVE_LOGS</span>
              </div>

              <button
                id="nisha-toggle-history-btn"
                onClick={() => setShowHistory(!showHistory)}
                className="text-[10px] text-emerald-600 hover:text-emerald-400 flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-900/40 hover:bg-emerald-950/60 transition-colors cursor-pointer"
              >
                <History className="w-3 h-3" />
                <span>{showHistory ? "CLOSE_LOGS" : `LOGS (${transcripts.length})`}</span>
                {showHistory ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>

            {/* Expanded History Mode */}
            {showHistory ? (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {transcripts.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col text-xs rounded-lg p-2 font-mono ${
                      item.role === "assistant"
                        ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                        : "bg-cyan-950/40 border border-cyan-500/30 text-cyan-300"
                    }`}
                  >
                    <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-500 mb-0.5">
                      {item.role === "assistant" ? "> NISHA_AI:" : "> USER_TERMINAL:"}
                    </span>
                    <p className="leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* Live Caption Display Mode */
              <div className="space-y-1.5 min-h-[40px] flex flex-col justify-center text-xs">
                {latestUserText && (
                  <div className="text-cyan-300 flex items-start gap-1.5">
                    <span className="text-[10px] text-cyan-500 uppercase font-bold shrink-0 mt-0.5">
                      &gt; USER:
                    </span>
                    <p className="line-clamp-2 italic">"{latestUserText}"</p>
                  </div>
                )}

                {latestAssistantText ? (
                  <div className="text-emerald-300 font-medium flex items-start gap-1.5">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold shrink-0 mt-0.5">
                      &gt; NISHA:
                    </span>
                    <p className="leading-snug text-emerald-200 drop-shadow-[0_0_5px_rgba(0,255,102,0.5)]">
                      {latestAssistantText}
                    </p>
                  </div>
                ) : (
                  !latestUserText && (
                    <div className="text-[11px] text-emerald-600/90 text-center py-1 flex items-center justify-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>NISHA is connected on matrix. Speak to initiate audio stream...</span>
                    </div>
                  )
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

