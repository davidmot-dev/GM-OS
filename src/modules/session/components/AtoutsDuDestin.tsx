import React, { useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import type { DeckManifest } from '../../../types/deck.types';

/**
 * **Les Atouts qui touchent aux Cartes du Destin** — Torg, 2026-10-16 (carnet
 * « Torg »). Deux gestes du meneur, que les Atouts déclenchent :
 *
 * - **piocher plusieurs cartes et en garder une**, les autres défaussées —
 *   Aspect effrayant (deux au lieu d'une), Occultiste et Ingénieux (une à trois
 *   selon le succès) ; la carte va à qui le meneur choisit ;
 * - **chercher une carte** dans la pioche ou la défausse — Populaire, une carte
 *   Relation une fois par Acte.
 *
 * Le reste passe déjà par les gestes de la main : poser en Réserve hors du tour
 * (Conscience environnementale), puis donner la carte posée (Chef naturel),
 * piocher une carte de plus (Rayonnant, Carnifex Princeps). GM-OS ne lit pas les
 * Atouts des fiches : c'est le meneur qui sait quand ils jouent.
 */
const AtoutsDuDestin: React.FC<{ deck: DeckManifest; personnages: { id: string; name: string }[] }> = ({ deck, personnages }) => {
    const etat = useSessionOSStore(s => s.deckStates[deck.id]);
    const regarder = useSessionOSStore(s => s.regarderLesCartesDuDestin);
    const garder = useSessionOSStore(s => s.garderUneCarteDuDestin);
    const prendre = useSessionOSStore(s => s.prendreUneCarteDuDestin);
    const [porteurChoisi, setPorteur] = useState('');
    const [nombre, setNombre] = useState(2);
    const [regardees, setRegardees] = useState<number[] | null>(null);
    const [chercher, setChercher] = useState(false);

    const porteur = personnages.some(p => p.id === porteurChoisi) ? porteurChoisi : personnages[0]?.id ?? '';
    if (!etat || personnages.length === 0) return null;

    /*
      **L'image, pas le nom.** Un paquet chargé d'images n'a souvent aucun nom de
      carte : « Carte #12 » ne permet ni de choisir ni de trouver la Relation.
    */
    const nom = (i: number) => DeckInterpreter.getCardMetadata(deck, i)?.name ?? `Carte #${i}`;
    const vignette = (i: number, hauteur: string) => (
        <img src={`/${DeckInterpreter.getCardImageUrl(deck.folderPath, i, deck)}`} alt={nom(i)} className={`${hauteur} rounded-md border border-app-border object-cover`} />
    );
    const tas = (titre: string, indices: readonly number[]) => indices.length > 0 && (
        <div className="space-y-1">
            <p className="font-black uppercase tracking-widest text-app-text/40">{titre} · {indices.length}</p>
            <div className="flex flex-wrap gap-1">
                {indices.map(i => (
                    <button key={i} type="button" aria-label={`Prendre « ${nom(i)} »`} title={nom(i)}
                        className="rounded-md transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        onClick={() => { prendre(deck.id, i, porteur); setChercher(false); }}>
                        {vignette(i, 'h-20')}
                    </button>
                ))}
            </div>
        </div>
    );
    const choix = 'cursor-pointer rounded-lg border border-app-border bg-app-surface px-2 py-1.5 text-ui-10 font-bold text-app-text outline-none';
    const bouton = 'flex items-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest text-app-text transition-all hover:border-accent/50 hover:text-accent disabled:opacity-30';

    return (
        <div className="basis-full space-y-2 border-t border-accent/20 pt-2 text-ui-10" data-atouts-du-destin>
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-black uppercase tracking-widest text-app-text/50">Atouts · pour</span>
                <select value={porteur} onChange={e => { setPorteur(e.target.value); setRegardees(null); }} aria-label="Pour quel personnage" className={choix}>
                    {personnages.map(p => <option key={p.id} value={p.id} className="bg-app-bg">{p.name}</option>)}
                </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <select value={nombre} onChange={e => { setNombre(Number(e.target.value)); setRegardees(null); }} aria-label="Combien de cartes piocher" className={choix}>
                    {[1, 2, 3].map(n => <option key={n} value={n} className="bg-app-bg">{n} carte{n > 1 ? 's' : ''}</option>)}
                </select>
                <button type="button" className={bouton} onClick={() => setRegardees(regarder(deck.id, nombre))}
                    title="Aspect effrayant, Occultiste, Ingénieux : piocher, en garder une, défausser les autres">
                    <Eye size={12} /> Piocher, en garder une
                </button>
                {regardees && regardees.length > 0 && (
                    <span className="flex flex-wrap items-center gap-1" data-cartes-regardees>
                        {regardees.map(i => (
                            <button key={i} type="button" aria-label={`Garder « ${nom(i)} »`}
                                className="flex flex-col items-center gap-1 rounded-lg border border-accent/40 p-1 font-black uppercase tracking-widest text-accent transition-all hover:bg-accent/10"
                                onClick={() => { garder(deck.id, regardees, i, porteur); setRegardees(null); }}
                                title={regardees.length > 1 ? 'Garder celle-ci, défausser les autres' : 'La garder'}>
                                {vignette(i, 'h-28')}
                                Garder
                            </button>
                        ))}
                        <button type="button" className={bouton} onClick={() => setRegardees(null)}>Annuler</button>
                    </span>
                )}
            </div>

            <div className="space-y-2">
                <button type="button" className={bouton} onClick={() => setChercher(o => !o)} aria-expanded={chercher}
                    title="Populaire : une carte Relation cherchée dans la pioche ou la défausse, en main — une fois par Acte">
                    <Search size={12} /> Chercher une carte…
                </button>
                {chercher && (
                    <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-app-border/40 p-2" data-chercher-une-carte>
                        {tas('Défausse', [...etat.discardedIndices].reverse())}
                        {tas('Pioche', [...etat.remainingIndices].sort((a, b) => a - b))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AtoutsDuDestin;
