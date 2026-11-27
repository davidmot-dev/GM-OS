import React from 'react';
import { useInitiativeDeTravellerStore } from '../useInitiativeDeTravellerStore';
import type { CampDeTraveller } from '../logic/initiativeDeTraveller';

/**
 * **Préparer l'initiative de Traveller** — TRV-A4, 27/11/2026 (C5, C6 ; David : « Tactique +
 * embuscade »). Avant « Jet système » : l'Effet du test de Tactique de chaque camp, ajouté à
 * l'Initiative de tous ses membres, et le camp qui tend une embuscade — MD+6 pour lui, MD−6 pour
 * l'autre, au premier round seulement (p. 71). Le jet lui-même : DEX ou INT, le meilleur MD, contre 8.
 */
const CAMPS: { id: CampDeTraveller; label: string }[] = [
    { id: 'voyageurs', label: 'Voyageurs' },
    { id: 'adversaires', label: 'Adversaires' },
];

export const PreparationDInitiativeTraveller: React.FC = () => {
    const tactique = useInitiativeDeTravellerStore(s => s.tactique);
    const embuscade = useInitiativeDeTravellerStore(s => s.embuscade);
    const poserLaTactique = useInitiativeDeTravellerStore(s => s.poserLaTactique);
    const poserLEmbuscade = useInitiativeDeTravellerStore(s => s.poserLEmbuscade);
    const reinitialiser = useInitiativeDeTravellerStore(s => s.reinitialiser);
    const champ = 'w-14 rounded border border-app-border/50 bg-app-bg px-1 py-0.5 text-center text-ui-11';
    return (
        <section data-initiative-traveller className="space-y-2 rounded-xl border border-app-border/40 p-3 text-ui-11 text-app-text">
            <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/70">Initiative de Traveller</p>
            <p className="text-app-muted">Chacun : 2D + le meilleur MD entre DEX et INT, contre 8 ; l’Effet est son Initiative (p. 71).</p>
            <div className="flex flex-wrap items-center gap-3">
                {CAMPS.map(c => (
                    <label key={c.id} className="flex items-center gap-1" title="L’Effet du test de Tactique, ajouté à l’Initiative de tout le camp (p. 71).">
                        Tactique — {c.label}
                        <input aria-label={`Effet de Tactique des ${c.label}`} type="number" className={champ} value={tactique[c.id]}
                            onChange={e => poserLaTactique(c.id, Number(e.target.value))} />
                    </label>
                ))}
                <label className="flex items-center gap-1" title="MD+6 au camp qui surprend, MD−6 à l’autre, au premier round seulement (p. 71).">
                    Embuscade
                    <select aria-label="Camp qui tend l’embuscade" className="rounded border border-app-border/50 bg-app-bg px-1 py-0.5 text-ui-11"
                        value={embuscade ?? ''} onChange={e => poserLEmbuscade((e.target.value || null) as CampDeTraveller | null)}>
                        <option value="">Aucune</option>
                        {CAMPS.map(c => <option key={c.id} value={c.id}>{c.label} surprennent</option>)}
                    </select>
                </label>
                <button type="button" onClick={reinitialiser}
                    className="rounded border border-app-border/40 px-2 py-0.5 text-ui-10 hover:border-accent/50">Remettre à zéro</button>
            </div>
        </section>
    );
};
