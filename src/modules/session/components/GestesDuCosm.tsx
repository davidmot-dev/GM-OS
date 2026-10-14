import React, { useMemo, useState } from 'react';
import { Globe2, Flag, Shuffle } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { useCosmsCourants } from '../hooks/useCosmsCourants';
import { mainDuPorteur } from '../logic/mainsDuPaquet';
import { paquetsDeCosm, paquetsDesCosmsCourants } from '../logic/cartesDeCosm';
import type { DeckManifest } from '../../../types/deck.types';

/**
 * **Les gestes des Cartes de Cosm** — Torg, 2026-10-14 (livre p. 113). Dans le
 * lecteur de Deck-OS d'un Paquet de Cosm : qui tient quelle carte, qui a joué la
 * sienne cet Acte, et les deux distributions. En zone mixte, le joueur choisit son
 * paquet ; le meneur le reporte ici.
 */
const GestesDuCosm: React.FC<{ deck: DeckManifest }> = ({ deck }) => {
    const {
        decks, deckStates, players, activeCampaignId, cartesDeCosmDuDebutDActe, cartesDeCosmAuChangement,
    } = useSessionOSStore();
    const cosms = useCosmsCourants();
    const paquets = useMemo(() => paquetsDeCosm(decks, deck.systemId), [decks, deck.systemId]);
    const courants = paquetsDesCosmsCourants(paquets, cosms.map(c => c.id));
    const personnages = (players ?? []).flatMap(p => p.characters ?? []).filter(c => c.campaignId === activeCampaignId);
    const [choix, setChoix] = useState<Record<string, string>>({});
    const joues = new Set(paquets.flatMap(p => deckStates[p.id]?.cosmJoues ?? []));

    /** La carte de Cosm que tient un personnage, et de quel paquet. */
    const tenue = (id: string) => {
        for (const p of paquets) {
            const carte = deckStates[p.id] ? mainDuPorteur(deckStates[p.id], id)[0] : undefined;
            if (carte) return p.name;
        }
        return null;
    };

    const bouton = 'flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-ui-10 font-black uppercase tracking-widest text-app-text transition-all hover:border-accent/50 hover:text-accent disabled:opacity-30';
    const aucun = courants.length === 0;

    return (
        <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/5 p-3" data-gestes-du-cosm>
            <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 flex items-center gap-1.5 text-ui-9 font-black uppercase tracking-widest text-accent">
                    <Globe2 size={12} /> Cartes de Cosm · {cosms.length ? cosms.map(c => c.nom).join(' + ') : 'aucun cosm courant'}
                </span>
                <button type="button" disabled={aucun} className={bouton}
                    title="Chacun défausse sa carte non jouée ; le paquet du cosm est remélangé ; une carte chacun"
                    onClick={() => gmConfirm(
                        'Début d’Acte : chacun défausse sa Carte de Cosm non jouée, le paquet du cosm courant est remélangé, et chacun en reçoit une.',
                        () => cartesDeCosmDuDebutDActe(choix), undefined, 'Distribuer',
                    )}>
                    <Flag size={14} /> Début d’Acte
                </button>
                <button type="button" disabled={aucun} className={bouton}
                    title="Une carte d’un cosm quitté s’échange contre une du nouveau ; qui a déjà joué la sienne cet Acte ne reçoit rien"
                    onClick={() => cartesDeCosmAuChangement(choix)}>
                    <Shuffle size={14} /> Changement de cosm
                </button>
            </div>
            {aucun && cosms.length > 0 && (
                <p className="text-ui-11 text-etat-alerte/80">
                    Aucun paquet marqué « Paquet de Cosm » pour {cosms.map(c => c.nom).join(' ou ')} : rattachez-le dans la bibliothèque.
                </p>
            )}
            {!deck.cosm && <p className="text-ui-11 text-etat-alerte/80">Ce paquet n’est rattaché à aucun cosm : choisissez-le dans la bibliothèque.</p>}
            <ul className="space-y-1">
                {personnages.map(p => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 text-ui-11">
                        <span className="font-bold text-app-text/85">{p.name}</span>
                        <span className="text-app-text/50">
                            {tenue(p.id) ? `tient une carte (${tenue(p.id)})` : joues.has(p.id) ? 'a joué la sienne cet Acte' : 'aucune carte'}
                        </span>
                        {courants.length > 1 && (
                            <select
                                aria-label={`Paquet choisi par ${p.name}`}
                                value={choix[p.id] ?? courants[0].id}
                                onChange={e => setChoix(c => ({ ...c, [p.id]: e.target.value }))}
                                className="rounded-md border border-app-border bg-app-surface px-2 py-0.5 text-ui-10 font-bold text-app-text"
                            >
                                {courants.map(c => <option key={c.id} value={c.id}>pioche dans {c.name}</option>)}
                            </select>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GestesDuCosm;
