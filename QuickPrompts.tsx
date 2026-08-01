import React from "react";
import { Terminal, Flame, Globe, CloudSun, Heart, Zap, Cpu } from "lucide-react";

interface QuickPromptsProps {
  onSendTextPrompt: (prompt: string) => void;
  isConnected: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSendTextPrompt,
  isConnected,
}) => {
  const promptList = [
    { label: "Mera roast koro! ⚡", text: "Nisha, mera ek mazedaar roast karke dikhao!", icon: Flame },
    { label: "YouTube kholo 🌐", text: "Nisha, mere liye YouTube khol do!", icon: Globe },
    { label: "Tareef koro 💋", text: "Nisha, Hindi mein meri ek pyaari si tareef koro!", icon: Heart },
    { label: "Mausam batao 🌤️", text: "Nisha, Mumbai ka mausam batao kaisa hai!", icon: CloudSun },
    { label: "Sassy mode! 👾", text: "Nisha, thoda sassy aur natkhat mood bana lo!", icon: Zap },
  ];

  if (!isConnected) return null;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-2 z-10 font-mono">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {promptList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              id={`quick-prompt-${idx}`}
              onClick={() => onSendTextPrompt(item.text)}
              className="px-3 py-1.5 rounded-lg bg-black/90 border border-emerald-500/40 text-xs font-bold text-emerald-400 hover:text-emerald-200 hover:border-emerald-400 hover:bg-emerald-950/60 transition-all duration-200 flex items-center gap-1.5 shrink-0 shadow-[0_0_10px_rgba(0,255,102,0.1)] cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

