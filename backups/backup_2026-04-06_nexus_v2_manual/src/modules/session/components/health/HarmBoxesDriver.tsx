import React from 'react';

interface HarmBoxesDriverProps {
  boxes: { label: string; filled: boolean }[];
}

export const HarmBoxesDriver: React.FC<HarmBoxesDriverProps> = ({ boxes }) => {
  return (
    <div className="flex flex-nowrap gap-2 w-full justify-center py-2 overflow-x-auto custom-scrollbar">
      {boxes.map((box, i) => (
        <div 
          key={i} 
          className="flex flex-col items-center gap-0.5 group/box cursor-help min-w-[40px]"
          title={box.label}
        >
          <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-500 ${
            box.filled 
              ? 'bg-rose-500/30 border-rose-500 shadow-glow-red/30 rotate-45' 
              : 'bg-white/10 border-white/20 group-hover/box:border-white/40'
          }`}>
            {box.filled && (
              <div className="w-2 h-2 bg-rose-500 rounded-sm -rotate-45" />
            )}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${
            box.filled ? 'text-rose-400' : 'text-app-text/30'
          }`}>
            {box.label}
          </span>
        </div>
      ))}
    </div>
  );
};
