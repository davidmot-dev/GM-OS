import React from 'react';
import { Globe2 } from 'lucide-react';
import type { CosmDuJeu } from '../../../types/drivers';

/**
 * **Le rappel des Lois du Monde** — Torg, 2026-10-14. Le cosm courant (deux en
 * zone mixte) et chacune de ses Lois. Celles que GM-OS applique ou annonce le
 * disent : le meneur sait ce qu'il n'a pas à faire de tête.
 */
const LoisDuCosm: React.FC<{ cosms: readonly CosmDuJeu[]; compact?: boolean }> = ({ cosms, compact = false }) => {
    if (cosms.length === 0) return null;
    return (
        <section data-lois-du-cosm className="space-y-2 rounded-xl border border-accent/20 bg-accent/5 p-3">
            <h4 className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-[0.18em] text-accent">
                <Globe2 size={13} /> {cosms.map(c => c.nom).join(' · ')}
                {cosms.length > 1 && <span className="text-app-text/40 normal-case tracking-normal font-bold">zone mixte</span>}
            </h4>
            <ul className={compact ? 'space-y-1' : 'space-y-1.5'}>
                {cosms.flatMap(c => c.lois.map(loi => (
                    <li key={`${c.id}-${loi.nom}`} className="text-ui-11 leading-snug" title={compact ? loi.texte : undefined}>
                        <span className="font-bold text-app-text/85">{loi.nom}</span>
                        {loi.mecanique && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-accent/15 text-accent text-ui-9 font-black uppercase tracking-wider"
                                title="GM-OS l'applique ou l'annonce au moment où elle joue">GM-OS</span>
                        )}
                        {!compact && <span className="text-app-text/60"> — {loi.texte}</span>}
                    </li>
                )))}
            </ul>
        </section>
    );
};

export default LoisDuCosm;
