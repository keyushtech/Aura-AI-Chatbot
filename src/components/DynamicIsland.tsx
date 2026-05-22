import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check } from 'lucide-react';

export type IslandState = 'idle' | 'thinking' | 'saved' | 'hud';

interface DynamicIslandProps {
  islandState: IslandState;
  setIslandState: (state: IslandState) => void;
  islandEventText: string;
  memoriesCount: number;
  sessionsCount: number;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  islandState,
  setIslandState,
  islandEventText,
  memoriesCount,
  sessionsCount
}) => {
  const getIslandDimensions = () => {
    switch (islandState) {
      case 'thinking':
        return { width: 175, height: 32, borderRadius: 16 };
      case 'saved':
        return { width: 330, height: 38, borderRadius: 19 };
      case 'hud':
        return { width: 340, height: 160, borderRadius: 24 };
      case 'idle':
      default:
        return { width: 105, height: 24, borderRadius: 12 };
    }
  };

  return (
    <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 z-40 select-none cursor-pointer">
      <motion.div
        layout
        onClick={() => {
          if (islandState === 'hud') {
            setIslandState('idle');
          } else {
            setIslandState('hud');
          }
        }}
        animate={getIslandDimensions()}
        transition={{ type: 'spring', stiffness: 240, damping: 25 }}
        className="bg-black text-[#fafafc] flex items-center justify-center shadow-lg relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {islandState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
              <div className="w-3 h-1 bg-[#1a1a1a] rounded-full" />
            </motion.div>
          )}

          {islandState === 'thinking' && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-3 w-full justify-between"
            >
              <Sparkles className="w-3 h-3 text-pink-400 animate-spin-slow" />
              <span className="text-[9px] font-semibold text-neutral-300 truncate">Aura focuses...</span>
              <div className="flex gap-1 items-center">
                <span className="w-0.5 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-3.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {islandState === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between px-3 w-full h-full gap-2"
            >
              <div className="flex items-center gap-1.5">
                <div className="p-0.5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </div>
                <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest">Aura Synced</span>
              </div>
              <span className="text-[9px] text-[#8a8a93] font-medium truncate max-w-[200px] italic">
                "{islandEventText || "Learned preference"}"
              </span>
            </motion.div>
          )}

          {islandState === 'hud' && (
            <motion.div
              key="hud"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col justify-between p-4.5 w-full h-full text-left bg-black text-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-neutral-400">Aura OS Core</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-400">9:41 AM</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 font-sans">
                <div className="bg-neutral-900/60 p-2 text-center rounded-xl border border-white/5">
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block leading-none">Register Nodes</span>
                  <span className="text-xs font-bold text-white mt-1 block">{memoriesCount} Persisted</span>
                </div>
                <div className="bg-neutral-900/60 p-2 text-center rounded-xl border border-white/5">
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block leading-none">Synced Threads</span>
                  <span className="text-xs font-bold text-white mt-1 block">{sessionsCount} Channels</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[8.5px] text-[#8a8a93] font-semibold">
                <span>Model: Gemini 3.5 Flash</span>
                <span>Click outer to fold</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
