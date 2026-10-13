import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { ActionApprouvee, CarteDAction, DeckManifest, EffetDeConflit, LigneDeConflit } from '../../../types/deck.types';
import { ACTIONS_APPROUVEES, CARTE_VIERGE, EFFETS_DE_CONFLIT } from '../../combat/logic/paquetDAction';

/**
 * **Ce qu'une carte d'Action dit, saisi une fois** — Torg, 2026-10-13.
 *
 * Les cartes sont des images que David charge lui-même ; ce qui est imprimé
 * dessus, GM-OS ne le lit pas. Décision de David : on la décrit **à la première
 * retourne** (Combat-OS) **ou d'avance** (Deck-OS) — le même formulaire, pour
 * qu'une carte ne se décrive jamais de deux façons.
 */

interface Props {
    deck: DeckManifest;
    index: number;
    /** Après l'enregistrement — Combat-OS ouvre alors le round. */
    onEnregistree?: (carte: CarteDAction) => void;
    onAnnuler?: () => void;
}

const Pastille: React.FC<{ actif: boolean; onClick: () => void; children: React.ReactNode; ton?: 'avantage' | 'desavantage' | 'neutre' }> = ({ actif, onClick, children, ton = 'neutre' }) => (
    <button
        type="button"
        aria-pressed={actif}
        onClick={onClick}
        className={`px-2 py-0.5 rounded-md border text-ui-10 font-bold transition-colors ${
            actif
                ? ton === 'desavantage' ? 'border-etat-danger/60 bg-etat-danger/15 text-etat-danger'
                : ton === 'avantage' ? 'border-etat-succes/60 bg-etat-succes/15 text-etat-succes'
                : 'border-accent/60 bg-accent/15 text-accent'
                : 'border-app-border/40 text-app-text/50 hover:text-app-text'
        }`}
    >
        {children}
    </button>
);

const basculer = <T,>(liste: readonly T[] | undefined, x: T): T[] =>
    (liste ?? []).includes(x) ? (liste ?? []).filter(y => y !== x) : [...(liste ?? []), x];

const EditeurDeLigne: React.FC<{ titre: string; ligne: LigneDeConflit; onChange: (l: LigneDeConflit) => void }> = ({ titre, ligne, onChange }) => (
    <div className="space-y-1.5 rounded-lg border border-app-border/30 p-2" data-ligne-de-conflit={titre}>
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/50">{titre}</span>
            <span className="text-ui-10 text-app-text/40 ml-auto">Commence :</span>
            <Pastille actif={ligne.premier === 'H'} onClick={() => onChange({ ...ligne, premier: 'H' })}>H — Héros</Pastille>
            <Pastille actif={ligne.premier === 'V'} onClick={() => onChange({ ...ligne, premier: 'V' })}>V — Vilains</Pastille>
        </div>
        {(['heros', 'vilains'] as const).map(cote => (
            <div key={cote} className="flex flex-wrap items-center gap-1">
                <span className="w-14 text-ui-10 text-app-text/40">{cote === 'heros' ? 'Héros' : 'Vilains'}</span>
                {(Object.keys(EFFETS_DE_CONFLIT) as EffetDeConflit[]).map(e => (
                    <Pastille
                        key={e}
                        ton={EFFETS_DE_CONFLIT[e].sorte}
                        actif={(ligne[cote] ?? []).includes(e)}
                        onClick={() => onChange({ ...ligne, [cote]: basculer(ligne[cote], e) })}
                    >
                        {EFFETS_DE_CONFLIT[e].libelle}
                    </Pastille>
                ))}
            </div>
        ))}
    </div>
);

const FicheDeCarteDAction: React.FC<Props> = ({ deck, index, onEnregistree, onAnnuler }) => {
    const updateDeck = useSessionOSStore(s => s.updateDeck);
    const [carte, setCarte] = useState<CarteDAction>(deck.cardMetadata?.[index]?.action ?? CARTE_VIERGE);

    const enregistrer = () => {
        const meta = deck.cardMetadata ?? {};
        updateDeck(deck.id, { cardMetadata: { ...meta, [index]: { ...meta[index], action: carte } } });
        onEnregistree?.(carte);
    };

    return (
        <div className="space-y-2" data-fiche-de-carte-d-action={index}>
            <p className="text-ui-10 text-app-text/50 leading-snug">
                Ce que dit la carte n° {index} — une fois décrite, elle l’est pour toujours.
            </p>
            <EditeurDeLigne titre="Scène standard" ligne={carte.standard} onChange={standard => setCarte({ ...carte, standard })} />
            <EditeurDeLigne titre="Scène dramatique" ligne={carte.dramatique} onChange={dramatique => setCarte({ ...carte, dramatique })} />
            <div className="flex flex-wrap items-center gap-1">
                <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/50 mr-1">Action approuvée</span>
                {(Object.keys(ACTIONS_APPROUVEES) as ActionApprouvee[]).map(a => (
                    <Pastille key={a} actif={carte.approuvees.includes(a)} onClick={() => setCarte({ ...carte, approuvees: basculer(carte.approuvees, a) })}>
                        {ACTIONS_APPROUVEES[a]}
                    </Pastille>
                ))}
            </div>
            <div className="flex justify-end gap-2">
                {onAnnuler && (
                    <button type="button" onClick={onAnnuler} className="px-3 py-1 rounded-lg border border-app-border/40 text-ui-10 font-bold text-app-text/60">
                        Annuler
                    </button>
                )}
                <button type="button" onClick={enregistrer} className="px-3 py-1 rounded-lg border border-accent/50 bg-accent/10 text-ui-10 font-black uppercase tracking-widest text-accent">
                    Enregistrer la carte
                </button>
            </div>
        </div>
    );
};

export default FicheDeCarteDAction;
