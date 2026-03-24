import React from 'react';

interface WoundLevelsDriverProps {
  levels: string[];
  currentIndex: number;
}

export const WoundLevelsDriver: React.FC<WoundLevelsDriverProps & { onLevelClick?: (index: number) => void }> = ({ 
  levels, 
  currentIndex, 
  onLevelClick 
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {levels.map((label, i) => {
        const isSelected = i === currentIndex;
        const isPast = i < currentIndex;
        
        return (
          <div 
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onLevelClick?.(i);
            }}
            className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all duration-300 cursor-pointer ${
              isSelected 
                ? 'bg-accent/20 border-accent text-white shadow-glow-accent/20 translate-x-1' 
                : isPast 
                  ? 'bg-white/5 border-white/10 text-white/40' 
                  : 'bg-transparent border-white/5 text-white/20'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              isSelected ? 'bg-accent animate-pulse shadow-glow-accent' : isPast ? 'bg-white/40' : 'bg-white/10'
            }`} />
            <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? 'text-accent' : 'text-app-text/60'}`}>
              {label}
            </span>
            {isSelected && (
              <div className="ml-auto text-xs font-black text-accent/80 bg-accent/20 px-2 py-0.5 rounded border border-accent/40 shadow-glow-accent/10">
                ACTIF
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
