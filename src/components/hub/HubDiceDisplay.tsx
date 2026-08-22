import React from 'react';
import { EtiquetteDuDegre } from '../../modules/dice/EtiquetteDuDegre';
import { useTranslation } from 'react-i18next';
import { getFateRankLabel, getDieCssClass } from '../../modules/dice/DiceUIUtils';
import type { DieResult } from '../../modules/dice/DiceEngine';

interface HubDiceDisplayProps {
    showDice: boolean;
    lastRoll: any;
    enable3D: boolean;
}

export const HubDiceDisplay: React.FC<HubDiceDisplayProps> = ({ showDice, lastRoll, enable3D }) => {
    const { t } = useTranslation(['modules', 'common']);

    if (!lastRoll) return null;


    return (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-12 pointer-events-none transition-all duration-1000 ${
            showDice ? 'opacity-100' : 'opacity-0'
        }`}>
            <div className={`bg-app-surface/90 backdrop-blur-3xl border-2 border-accent/30 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(var(--accent-rgb),0.3)] flex flex-col items-center gap-8 max-w-2xl w-full transform transition-all duration-1000 ${
                showDice 
                    ? `scale-100 translate-y-0 animate-in zoom-in ${enable3D ? 'delay-[1500ms]' : ''}` 
                    : 'scale-95 translate-y-8 duration-700'
            } ${showDice && enable3D ? 'opacity-40 hover:opacity-100 transition-opacity' : ''}`}>
                <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-accent text-xs font-black uppercase tracking-[0.5em] animate-pulse">{t('dice.status.success').toUpperCase()}</span>
                    <h2 className="text-app-text/80 text-xl font-black tracking-tight uppercase drop-shadow-lg">{lastRoll.title}</h2>
                </div>

                <div className="text-6xl md:text-8xl leading-tight font-black text-app-text drop-shadow-[0_0_40px_rgba(var(--accent-rgb),0.4)] transition-all text-center break-words max-w-full">
                    {lastRoll.totalDisplay}
                </div>

                {lastRoll.fateRank !== undefined && (
                    <div className="text-sm text-accent font-black uppercase tracking-widest -mt-4 drop-shadow-md">
                        {getFateRankLabel(lastRoll.fateRank, t)}
                    </div>
                )}

                <div className="flex flex-wrap gap-4 justify-center mt-4">
                    {(lastRoll.rolls as DieResult[]).map((r, i) => (
                        <div 
                            key={i} 
                            className={`size-16 flex flex-col items-center justify-center rounded-2xl text-2xl font-black border transition-all relative group ${getDieCssClass(r)}`}
                        >
                            {r.displayStr || r.val}
                        </div>
                    ))}
                </div>
                
                <EtiquetteDuDegre
                    resultat={lastRoll}
                    classes={reussi => 'mt-4 px-12 py-3 rounded-full border-2 text-xl font-black uppercase tracking-[0.25em] backdrop-blur-md shadow-2xl transition-all '
                        + (reussi
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-glow-emerald/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-glow-rose/30')}
                />
            </div>
        </div>
    );
};
