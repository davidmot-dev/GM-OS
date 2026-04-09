import React from 'react';

export type PartStatus = 'healthy' | 'injured' | 'crippled';

interface AnatomicalSilhouetteProps {
  parts: Record<string, { status: PartStatus }>;
  onPartClick?: (partId: string, isRecovery: boolean) => void;
}

/**
 * AnatomicalSilhouette component
 * Visualizes a humanoid figure with zone-based health states.
 * Zones: head, torso, leftArm, rightArm, leftLeg, rightLeg.
 * Styling: Sleek SVG, neon glows on health status.
 */
export const AnatomicalSilhouette: React.FC<AnatomicalSilhouetteProps> = ({ parts, onPartClick }) => {
  const getPartColor = (status: PartStatus) => {
    switch (status) {
      case 'crippled': 
        return 'fill-rose-500/80 stroke-rose-300 drop-shadow-[0_0_15px_rgba(244,63,94,0.9)] animate-pulse';
      case 'injured': 
        return 'fill-orange-500/60 stroke-orange-300 drop-shadow-[0_0_10px_rgba(249,115,22,0.7)]';
      case 'healthy':
        return 'fill-emerald-500/40 stroke-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]';
      default: 
        return 'fill-slate-500/20 stroke-slate-400/40';
    }
  };

  const renderPart = (id: string, path: string, label: string) => {
    const status = parts[id]?.status || 'healthy';
    return (
      <path
        d={path}
        id={id}
        className={`transition-all duration-500 cursor-pointer ${getPartColor(status)} hover:stroke-white/60 hover:fill-opacity-80 active:scale-95`}
        onClick={(e) => {
          e.stopPropagation();
          onPartClick?.(id, false);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPartClick?.(id, true);
        }}
      >
        <title>{`${label}: ${
          status === 'healthy' ? 'SAIN' : 
          status === 'injured' ? 'BLESSÉ' : 
          status === 'crippled' ? 'CRITIQUE' : (status as string).toUpperCase()
        }`}</title>
      </path>
    );
  };

  return (
    <div className="flex items-center justify-center h-full w-full">
      <svg viewBox="0 0 100 160" className="h-full w-auto drop-shadow-2xl">
        {/* Head */}
        {renderPart('head', "M 50,5 C 45,5 41,10 41,18 C 41,26 45,31 50,31 C 55,31 59,26 59,18 C 59,10 55,5 50,5 Z", 'Tête')}
        
        {/* Torso */}
        {renderPart('torso', "M 41,33 L 59,33 C 64,33 66,38 65,65 L 59,85 L 41,85 L 35,65 C 34,38 36,33 41,33 Z", 'Torse')}
        
        {/* Left Arm */}
        {renderPart('leftArm', "M 34,35 L 22,65 C 20,70 20,75 22,77 L 26,80 L 38,45 Z", 'Bras Gauche')}
        
        {/* Right Arm */}
        {renderPart('rightArm', "M 66,35 L 78,65 C 80,70 80,75 78,77 L 74,80 L 62,45 Z", 'Bras Droit')}
        
        {/* Left Leg */}
        {renderPart('leftLeg', "M 41,87 L 38,140 C 37,145 38,150 42,150 L 48,150 L 49,87 Z", 'Jambe Gauche')}
        
        {/* Right Leg */}
        {renderPart('rightLeg', "M 59,87 L 62,140 C 63,145 62,150 58,150 L 52,150 L 51,87 Z", 'Jambe Droite')}
        
        {/* Center alignment guides (Subtle) */}
        <line x1="50" y1="35" x2="50" y2="85" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
      </svg>
    </div>
  );
};
