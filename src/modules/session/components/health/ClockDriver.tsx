import React from 'react';
import { Shield, ShieldAlert, ShieldOff } from 'lucide-react';

interface ClockDriverProps {
  filled: number;
  total: number;
}

/**
 * ClockDriver component
 * Visualizes segmented clocks with premium v5 aesthetics.
 */
export const ClockDriver: React.FC<ClockDriverProps> = ({ filled, total }) => {
  const segments = Array.from({ length: total }, (_, i) => i < filled);
  const percentage = (filled / total) * 100;
  
  return (
    <div className="flex items-center justify-center relative group/clock">
      {/* SVG Container - Scaled for compact bar */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx="50" cy="50" r="45"
            className="fill-none stroke-white/5 stroke-[10]"
          />
          
          {/* Segmented Stroke */}
          {segments.map((isFilled, i) => {
            const angle = (360 / total);
            const startAngle = i * angle;
            const endAngle = (i + 1) * angle - (total > 8 ? 1 : 2); // Small gap
            
            const x1 = 50 + 45 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 45 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 45 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 45 * Math.sin((endAngle * Math.PI) / 180);

            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A 45 45 0 0 1 ${x2} ${y2}`}
                className={`fill-none stroke-[10] transition-all duration-700 ease-out-back ${
                  isFilled 
                    ? (percentage >= 100 ? 'stroke-rose-600 shadow-glow-red' : 'stroke-gm-cyan shadow-glow-cyan') 
                    : 'stroke-white/10'
                }`}
              />
            );
          })}
        </svg>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[12px] font-black font-display text-white mt-1">{filled}<span className="opacity-40 text-[10px]">/</span>{total}</span>
        </div>
      </div>
    </div>
  );
};
