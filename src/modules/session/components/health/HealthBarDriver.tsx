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
    if (isHealing) return 'from-etat-succes to-etat-succes shadow-[0_0_15px_rgba(52,211,153,0.5)]';
    
    // Elemental overrides
    if (lastDamageType === 'fire') return 'from-etat-alerte to-etat-danger shadow-[0_0_15px_rgba(249,115,22,0.6)]';
    if (lastDamageType === 'cold') return 'from-gm-cyan to-etat-info shadow-[0_0_15px_rgba(34,211,238,0.6)]';
    if (lastDamageType === 'psychic') return 'from-gm-violet to-gm-violet shadow-[0_0_15px_rgba(192,132,252,0.6)]';
    if (lastDamageType === 'necrotic') return 'from-etat-succes to-etat-succes shadow-[0_0_15px_rgba(74,222,128,0.4)]';
    if (lastDamageType === 'radiant') return 'from-etat-alerte to-etat-alerte shadow-[0_0_15px_rgba(251,191,36,0.6)]';
    if (lastDamageType === 'electric') return 'from-etat-alerte to-etat-info shadow-[0_0_15px_rgba(254,240,138,0.7)]';
    if (lastDamageType === 'acid') return 'from-etat-succes to-etat-succes shadow-[0_0_15px_rgba(52,211,153,0.5)]';

    if (percentage > 50) return 'from-etat-succes to-etat-succes shadow-[0_0_15px_rgba(16,185,129,0.3)]';
    if (percentage > 20) return 'from-etat-alerte to-etat-alerte shadow-[0_0_15px_rgba(251,191,36,0.3)]';
    return 'from-etat-danger to-etat-danger shadow-[0_0_20px_rgba(239,68,68,0.5)]';
  };

  const isLow = percentage <= 20;

  return (
    /*
      ⛔ **`min-h-8`, et la barre `shrink-0`** (2026-09-30). Le conteneur était
      fixé à `h-8` : la ligne des chiffres et la barre n'y tenaient pas, et
      flexbox comprimait la barre — qui coupe ce qui dépasse — jusqu'à un
      trait. **La jauge de vie était vide à 148 / 155**, sur la carte de combat
      comme sur la fiche de PNJ. Trouvé en réagençant Combat-OS.
    */
    <div className="w-full min-h-8 flex flex-col justify-center gap-1 px-1 relative group/hp">
        {/* PV Labels */}
        <div className="flex justify-between items-end px-0.5">
            <span className="text-ui-10 font-display font-black text-app-text/40 uppercase tracking-tighter">PV</span>
            <div className={`flex items-baseline gap-1 font-display font-black tracking-tight ${percentage <= 25 ? 'text-etat-danger' : 'text-app-text/80'}`}>
                <input 
                    type="number" 
                    value={current}
                    onChange={(e) => onCurrentChange?.(parseInt(e.target.value) || 0)}
                    className="w-8 bg-transparent text-right outline-none focus:text-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 border-none"
                    title="Actuel"
                />
                <span className="text-ui-10 opacity-30 select-none">/</span>
                <input 
                    type="number" 
                    value={max}
                    onChange={(e) => onMaxChange?.(parseInt(e.target.value) || 1)}
                    className="w-8 bg-transparent text-left opacity-30 focus:opacity-100 outline-none focus:text-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 border-none text-ui-10"
                    title="Max"
                />
            </div>
        </div>

        {/* Progress Container */}
        <div className="h-3 shrink-0 w-full bg-app-bg/60 rounded-full border border-app-text/10 overflow-hidden shadow-inner flex items-center p-[2px]">
            <div 
                className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out-back relative ${getBarColor()}`}
                style={{ width: `${percentage}%` }}
            >
                {/*
                  ⛔ Il y avait ici une texture « fibre de carbone » chargée
                  depuis **un site externe** (transparenttextures.com), à chaque
                  barre affichée : GM-OS contactait un tiers pendant la partie,
                  et hors ligne l'image échouait sans un mot. Retirée le
                  2026-09-30 — la matière d'un panneau vient du thème.
                */}
                
                {/* Low health alert pulse */}
                {isLow && (
                    <div className="absolute inset-0 bg-app-text/40 animate-ping rounded-full opacity-20" />
                )}

                {/* Leading edge glow */}
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-app-text/40 blur-[2px]" />
            </div>
        </div>

        {/* Subtle background glow when active */}
        <div className={`absolute -inset-1 rounded-full blur-2xl opacity-0 group-hover/hp:opacity-10 transition-opacity duration-1000 ${
            percentage <= 25 ? 'bg-etat-danger' : 'bg-etat-succes'
        }`} />
    </div>
  );
};
