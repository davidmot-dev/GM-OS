import React from 'react';

interface HealthBarDriverProps {
  current: number;
  max: number;
  onCurrentChange?: (val: number) => void;
  onMaxChange?: (val: number) => void;
  lastDamageType?: string;
  isHealing?: boolean;
}

/**
 * HealthBarDriver component
 * Visualizes HP as a premium, cinematic progress bar with inline editing.
 */
export const HealthBarDriver: React.FC<HealthBarDriverProps> = ({ 
    current, 
    max, 
    onCurrentChange, 
    onMaxChange, 
    lastDamageType, 
    isHealing 
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  // Dynamic color orchestration
  const getBarColor = () => {
    if (isHealing) return 'from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(52,211,153,0.5)]';
    
    // Elemental overrides
    if (lastDamageType === 'fire') return 'from-orange-500 to-rose-600 shadow-[0_0_15px_rgba(249,115,22,0.6)]';
    if (lastDamageType === 'cold') return 'from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.6)]';
    if (lastDamageType === 'psychic') return 'from-purple-400 to-fuchsia-600 shadow-[0_0_15px_rgba(192,132,252,0.6)]';
    if (lastDamageType === 'necrotic') return 'from-lime-600 to-green-900 shadow-[0_0_15px_rgba(74,222,128,0.4)]';
    if (lastDamageType === 'radiant') return 'from-amber-300 to-yellow-500 shadow-[0_0_15px_rgba(251,191,36,0.6)]';
    if (lastDamageType === 'electric') return 'from-yellow-200 to-blue-300 shadow-[0_0_15px_rgba(254,240,138,0.7)]';
    if (lastDamageType === 'acid') return 'from-green-400 to-emerald-900 shadow-[0_0_15px_rgba(52,211,153,0.5)]';

    if (percentage > 50) return 'from-emerald-500 to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
    if (percentage > 20) return 'from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]';
    return 'from-rose-500 to-red-700 shadow-[0_0_20px_rgba(239,68,68,0.5)]';
  };

  const isLow = percentage <= 20;

  return (
    <div className="w-full h-8 flex flex-col justify-center gap-1 px-1 relative group/hp">
        {/* PV Labels */}
        <div className="flex justify-between items-end px-0.5">
            <span className="text-[10px] font-display font-black text-white/40 uppercase tracking-tighter">Vitality</span>
            <div className={`flex items-baseline gap-1 font-display font-black tracking-tight ${percentage <= 25 ? 'text-rose-500' : 'text-white/80'}`}>
                <input 
                    type="number" 
                    value={current}
                    onChange={(e) => onCurrentChange?.(parseInt(e.target.value) || 0)}
                    className="w-8 bg-transparent text-right outline-none focus:text-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 border-none"
                    title="Actuel"
                />
                <span className="text-[10px] opacity-30 select-none">/</span>
                <input 
                    type="number" 
                    value={max}
                    onChange={(e) => onMaxChange?.(parseInt(e.target.value) || 1)}
                    className="w-8 bg-transparent text-left opacity-30 focus:opacity-100 outline-none focus:text-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 border-none text-[10px]"
                    title="Max"
                />
            </div>
        </div>

        {/* Progress Container */}
        <div className="h-3 w-full bg-black/60 rounded-full border border-white/10 overflow-hidden shadow-inner flex items-center p-[2px]">
            <div 
                className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out-back relative ${getBarColor()}`}
                style={{ width: `${percentage}%` }}
            >
                {/* Visual texture overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                
                {/* Low health alert pulse */}
                {isLow && (
                    <div className="absolute inset-0 bg-white/40 animate-ping rounded-full opacity-20" />
                )}

                {/* Leading edge glow */}
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 blur-[2px]" />
            </div>
        </div>

        {/* Subtle background glow when active */}
        <div className={`absolute -inset-1 rounded-full blur-2xl opacity-0 group-hover/hp:opacity-10 transition-opacity duration-1000 ${
            percentage <= 25 ? 'bg-rose-500' : 'bg-emerald-500'
        }`} />
    </div>
  );
};
