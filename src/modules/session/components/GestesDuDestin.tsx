import React from 'react';
import { Sparkles, Swords, Flag, BookOpen } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { DeckManifest } from '../../../types/deck.types';
import { useCosmsCourants } from '../hooks/useCosmsCourants';
import { tailleDeLaMain } from '../logic/cosmsCourants';
import { gmConfirm } from '../../../stores/useModalStore';
import AtoutsDuDestin from './AtoutsDuDestin';

/**
 * **Les gestes du meneur sur le Paquet du Destin** — Torg, 2026-10-14.
 *
 * Rien ne devine quand un combat, une scène ou un Acte finit : ce sont des
 * gestes, comme ceux du bandeau des réserves. La règle vit dans
 * `logic/cartesDuDestin.ts`.
 */
const GestesDuDestin: React.FC<{ deck: DeckManifest }> = ({ deck }) => {
    const {
        reprendreLesReserves, completerLesMainsDuDestin, nouvellesMainsDuDestin, jouerLeMomentCritique,
        players, activeCampaignId, deckStates,
    } = useSessionOSStore();
    const tailleDeBase = useSessionOSStore(s => s.getActiveDriver()?.cartesDuDestin?.taille ?? 4);
    // La Loi de l'Héroïsme (Empire du Nil) porte la main à cinq cartes.
    const taille = tailleDeLaMain(tailleDeBase, useCosmsCourants());
    const personnages = (players ?? []).flatMap(p => p.characters ?? []).filter(c => c.campaignId === activeCampaignId);
    const dejaJoues = new Set(deckStates[deck.id]?.momentsCritiques ?? []);

    const finDActe = () => gmConfirm(
        `Fin d’Acte : chacun défausse toute sa main, Réserve comprise, et en tire ${taille} nouvelles. Les Moments critiques reviennent.`,
        () => nouvellesMainsDuDestin(deck.id),
        undefined,
        'Nouvelles mains',
    );

    const bouton = 'flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-ui-10 font-black uppercase tracking-widest text-app-text transition-all hover:border-accent/50 hover:text-accent';

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3" data-gestes-du-destin>
            <span className="text-ui-9 font-black uppercase tracking-widest text-accent mr-1">Paquet du Destin · main de {taille}</span>
            <button type="button" onClick={() => reprendreLesReserves(deck.id)} className={bouton}
                title="Après un combat : les cartes de Réserve d’Action reviennent en main">
                <Swords size={13} /> Fin du combat
            </button>
            <button type="button" onClick={() => completerLesMainsDuDestin(deck.id)} className={bouton}
                title={`Chaque personnage de la campagne complète sa main à ${taille} — qui en a plus devra défausser`}>
                <Flag size={13} /> Fin de scène
            </button>
            <button type="button" onClick={finDActe} className={bouton}
                title="Mains défaussées, nouvelles mains, Moments critiques rendus">
                <BookOpen size={13} /> Fin d’Acte
            </button>
            <label className="ml-auto flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2">
                <Sparkles size={13} className="text-app-muted" />
                <select
                    value=""
                    onChange={e => e.target.value && jouerLeMomentCritique(deck.id, e.target.value)}
                    aria-label="Moment critique"
                    className="cursor-pointer bg-transparent text-ui-10 font-black uppercase tracking-widest text-app-text outline-none"
                >
                    <option value="">Moment critique…</option>
                    {personnages.map(c => (
                        <option key={c.id} value={c.id} disabled={dejaJoues.has(c.id)} className="bg-app-bg text-app-text">
                            {c.name}{dejaJoues.has(c.id) ? ' — joué cet Acte' : ''}
                        </option>
                    ))}
                </select>
            </label>
            <AtoutsDuDestin deck={deck} personnages={personnages} />
        </div>
    );
};

export default GestesDuDestin;
