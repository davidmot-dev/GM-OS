import React from 'react';
import { Award } from 'lucide-react';
import { useOrdreDuTourStore } from '../useOrdreDuTourStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { ACTIONS_APPROUVEES, carteDecrite } from '../logic/paquetDAction';
import { paquetDuDestinDuJeu } from '../../session/logic/cartesDuDestin';
import type { Combatant } from '../types';

/**
 * **L'Action approuvée, sur la carte d'un Héros** — Torg, 2026-10-14.
 *
 * Décision de David : c'est le meneur qui la constate, sur la carte du
 * combattant. Réussie, elle met **une Carte du Destin dans sa main** (pas dans
 * sa Réserve) — une fois par action et par round : deux actions approuvées sur
 * la carte, deux cartes possibles, jamais deux pour la même.
 *
 * Rien ne s'affiche tant qu'il n'y a ni carte d'Action décrite au round, ni
 * Paquet du Destin pour le jeu : un bouton qui ne peut rien piocher serait un
 * mensonge.
 */
const ActionsApprouvees: React.FC<{ combatant: Combatant }> = ({ combatant }) => {
    const tour = useOrdreDuTourStore(s => s.tour);
    const carte = useOrdreDuTourStore(s => s.carte);
    const enAttente = useOrdreDuTourStore(s => s.carteEnAttente);
    const dejaApplique = useOrdreDuTourStore(s => s.dejaApplique);
    const noterLApplication = useOrdreDuTourStore(s => s.noterLApplication);
    const decks = useSessionOSStore(s => s.decks);
    const systeme = useSessionOSStore(s => s.campaigns.find(c => c.id === s.activeCampaignId)?.system);
    const piocher = useSessionOSStore(s => s.piocherUneCarteDuDestin);

    if (!combatant.isPlayer || !combatant.sourcePlayerId || !tour || !carte || enAttente) return null;
    const approuvees = carteDecrite(decks.find(d => d.id === carte.deckId), carte.index)?.approuvees ?? [];
    const destin = paquetDuDestinDuJeu(decks, systeme);
    if (approuvees.length === 0 || !destin) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 px-3" data-actions-approuvees={combatant.id}>
            <span className="flex items-center gap-1 text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                <Award size={12} /> Action approuvée
            </span>
            {approuvees.map(action => {
                const cle = `approuvee:${combatant.id}:${action}`;
                const prise = dejaApplique.includes(cle);
                return (
                    <button
                        key={action}
                        type="button"
                        disabled={prise}
                        onClick={() => { piocher(destin.id, combatant.sourcePlayerId!); noterLApplication(cle); }}
                        title={`${combatant.name} a réussi : ${ACTIONS_APPROUVEES[action]} — une Carte du Destin en main`}
                        className="px-2 py-0.5 rounded-md border border-accent/40 text-ui-10 font-bold text-accent disabled:opacity-30"
                    >
                        {ACTIONS_APPROUVEES[action]} {prise ? '✓' : '+1 carte'}
                    </button>
                );
            })}
        </div>
    );
};

export default ActionsApprouvees;
