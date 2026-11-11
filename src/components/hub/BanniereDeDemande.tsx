import React from 'react';
import { Check, Dices, Play } from 'lucide-react';
import type { DemandeDeJet } from '../../modules/dice/demandeDeJet';
import { precisionsDeLaDemande } from '../../modules/dice/demandesDeLaTablette';

/**
 * **« Le meneur te demande un jet »** — la bannière de la tablette, plan
 * `2026-11-11-jets-demandes-et-caches.md`, T8 ; maquette Stitch adoptée par
 * David le 11/11 (`documentation/Planning/stitch/jets-demandes/1-tablette-banniere.png`).
 *
 * Une bande pleine largeur, bordée de l'accent du jeu, qui ne couvre rien : le
 * jet demandé en grand, ce que le meneur a fixé dessous, et « Lancer » à portée
 * de pouce (48 px). Après le jet, une ligne discrète : « Jet envoyé au meneur ».
 * Elle se dessine aux jetons du thème (`--app-*`), comme le reste de la fiche.
 */

interface Props {
    aLancer: DemandeDeJet[];
    envoyees: { id: string; titre: string }[];
    onLancer: (demande: DemandeDeJet) => void;
    className?: string;
}

export const BanniereDeDemande: React.FC<Props> = ({ aLancer, envoyees, onLancer, className = '' }) => {
    if (aLancer.length === 0 && envoyees.length === 0) return null;
    return (
        <div className={`flex flex-col gap-2 ${className}`} data-banniere-de-demande>
            {aLancer.map(demande => {
                const precisions = precisionsDeLaDemande(demande);
                return (
                    <section key={demande.id} aria-label="Le meneur te demande un jet"
                        className="flex flex-wrap items-center gap-4 border border-app-border border-l-4 border-l-accent bg-accent/10 rounded-xl px-4 py-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/40 text-accent" aria-hidden>
                            <Dices size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-muted">Le meneur te demande un jet</p>
                            <p className="text-lg font-bold text-app-text break-words">{demande.titre}</p>
                            {precisions && <p className="text-ui-11 font-bold uppercase tracking-widest text-accent">{precisions}</p>}
                        </div>
                        <button type="button" onClick={() => onLancer(demande)}
                            className="flex min-h-[48px] items-center gap-2 rounded-lg bg-accent px-6 text-sm font-black uppercase tracking-[0.2em] text-app-on-accent active:scale-95 transition-transform">
                            <Play size={16} aria-hidden /> Lancer
                        </button>
                    </section>
                );
            })}
            {envoyees.map(e => (
                <p key={e.id} role="status"
                    className="flex items-center gap-2 border border-app-border rounded-xl px-4 py-2 text-ui-11 text-app-muted">
                    <Check size={13} aria-hidden /> Jet envoyé au meneur{e.titre ? ` : ${e.titre}` : ''}
                </p>
            ))}
        </div>
    );
};

export default BanniereDeDemande;
