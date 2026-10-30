import React, { useState } from 'react';
import {
    AUGMENTATIONS_DE_RUNEQUEST, LIBELLES_DE_L_OPPOSITION, LIBELLES_DE_RUNEQUEST, MULTIPLICATEURS_DE_RUNEQUEST,
    degreAdverse, issueDeLOpposition, localisationDuCoup, niveauDeRuneQuest, plagesDeRuneQuest,
    type CalculDeRuneQuest, type ChoixDeRuneQuest, type JetDeRuneQuest, type RegleDeRuneQuest,
} from '../../../dice/systemes/runequest';
import { useCombatStore } from '../../../combat/useCombatStore';
import { porterUnCoupLocalise } from '../../../combat/coupsLocalises';

/**
 * **Le jet de RuneQuest** — 30/10/2026, à la demande de David (« finir le pilote »).
 * Avant de lancer : le test de caractéristique ou la table de résistance quand une
 * caractéristique est retenue, la situation, l'augmentation, la nouvelle tentative et
 * l'aptitude adverse. Après : l'opposition tranchée, la localisation du coup, et le
 * résultat servi d'augmentation au jet suivant. Rien ne s'écrit sur la fiche du lanceur ;
 * au meneur, le coup localisé se porte à un combattant de Combat-OS (2026-10-30).
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };
const signe = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const NIVEAUX = ['reussite-critique', 'reussite-speciale', 'reussite', 'echec', 'echec-critique'] as const;

export const PreparationRuneQuest: React.FC<{
    choix: ChoixDeRuneQuest;
    setChoix: (maj: (c: ChoixDeRuneQuest) => ChoixDeRuneQuest) => void;
    /** Le calcul du jet préparé ; absent tant qu'aucune aptitude n'est retenue. */
    calcul?: CalculDeRuneQuest;
}> = ({ choix, setChoix, calcul }) => {
    const caracteristique = calcul?.mode === 'caracteristique' || calcul?.mode === 'resistance';
    return (
        <div data-preparation-runequest className="flex flex-col gap-2 text-xs">
            {caracteristique && (
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1" title="Une caractéristique se teste ×5 en temps normal ; ou s'oppose à une autre sur la table de résistance (p. 141, 145).">
                        <span className={etiquette}>Caractéristique</span>
                        <select aria-label="Test de caractéristique" className={champ}
                            value={choix.mode === 'resistance' ? 'resistance' : String(choix.multiplicateur)}
                            onChange={e => {
                                const v = e.target.value;
                                setChoix(c => v === 'resistance' ? { ...c, mode: 'resistance' } : { ...c, mode: 'test', multiplicateur: Number(v) });
                            }}>
                            {MULTIPLICATEURS_DE_RUNEQUEST.map(m => (
                                <option key={m.facteur} value={m.facteur}>×{String(m.facteur).replace('.', ',')} — {m.label}</option>
                            ))}
                            <option value="resistance">Table de résistance</option>
                        </select>
                    </label>
                    {choix.mode === 'resistance' && (
                        <label className="flex items-center gap-1" title="POU de la cible d'un sort, TAI de l'objet à soulever, PUI d'un poison… (p. 145).">
                            Caractéristique passive
                            <input aria-label="Caractéristique passive" type="number" min={0} value={choix.passive} className={`w-14 ${champ}`}
                                onChange={e => setChoix(c => ({ ...c, passive: Math.max(0, entier(e.target.value)) }))} />
                        </label>
                    )}
                </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1" title="Les modificateurs de situation de la meneuse, en pourcentage.">
                    <span className={etiquette}>Situation</span>
                    <input aria-label="Modificateur de situation" type="number" step={5} value={choix.modificateur} className={`w-16 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, modificateur: entier(e.target.value) }))} />
                    %
                </label>
                <label className="flex items-center gap-1" title="Le test d'augmentation se lance d'abord ; son niveau ajoute ou retire à l'aptitude augmentée (p. 144-145).">
                    <span className={etiquette}>Augmentation</span>
                    <select aria-label="Augmentation" className={champ} value={choix.augmentation}
                        onChange={e => setChoix(c => ({ ...c, augmentation: entier(e.target.value) }))}>
                        <option value={0}>Aucune</option>
                        {NIVEAUX.map(n => (
                            <option key={n} value={AUGMENTATIONS_DE_RUNEQUEST[n]}>{LIBELLES_DE_RUNEQUEST[n]} ({signe(AUGMENTATIONS_DE_RUNEQUEST[n])} %)</option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-1" title="Après un échec, si la meneuse permet un autre lancer (p. 142).">
                    <input type="checkbox" checked={choix.nouvelleTentative} onChange={e => setChoix(c => ({ ...c, nouvelleTentative: e.target.checked }))} />
                    Nouvelle tentative (−25 %)
                </label>
                <label className="flex items-center gap-1" title="L'aptitude de l'adversaire dans une opposition, modificateurs compris. Au-delà de 100 %, l'excédent se retire aux deux camps (p. 144).">
                    Aptitude adverse
                    <input aria-label="Aptitude adverse" type="number" min={0} placeholder="—" value={choix.adverse ?? ''} className={`w-16 ${champ}`}
                        onChange={e => {
                            const texte = e.target.value.trim();
                            setChoix(c => ({ ...c, adverse: texte === '' ? undefined : Math.max(0, entier(texte)) }));
                        }} />
                </label>
            </div>
            {calcul && (
                <span data-composition-runequest className="text-app-text/60">
                    {calcul.explication ? `${calcul.explication} · ` : ''}{plagesDeRuneQuest(calcul.echelle)}.
                    {calcul.adverseReduite !== undefined ? ` Adversaire à ${calcul.adverseReduite} %.` : ''}
                </span>
            )}
        </div>
    );
};

export const SuitesRuneQuest: React.FC<{
    jet: JetDeRuneQuest;
    calcul: CalculDeRuneQuest;
    regle: RegleDeRuneQuest;
    valeurs: Record<string, unknown>;
    /** Lance un D20, pour la localisation. */
    d20: () => number;
    /** Sert ce résultat d'augmentation au prochain jet (p. 144-145). */
    augmenter: (bonus: number) => void;
    /** Coche la nouvelle tentative pour le prochain jet (p. 142). */
    retenter: () => void;
    consigner: (ligne: string) => void;
    /** Au meneur seulement : porter le coup localisé à un combattant (`porterUnCoupLocalise`). */
    porterLeCoup?: boolean;
}> = ({ jet, calcul, regle, valeurs, d20, augmenter, retenter, consigner, porterLeCoup = false }) => {
    const [deAdverse, setDeAdverse] = useState('');
    const [issue, setIssue] = useState<string | null>(null);
    const [localisation, setLocalisation] = useState<string | null>(null);
    const [zoneTouchee, setZoneTouchee] = useState<string | null>(null);
    const niveau = jet.runequest.niveau;
    const bonus = AUGMENTATIONS_DE_RUNEQUEST[niveau];
    const reussi = niveau !== 'echec' && niveau !== 'echec-critique';

    const trancher = () => {
        const de = entier(deAdverse);
        if (calcul.adverseReduite === undefined || de < 1 || de > 100) return;
        const sien = degreAdverse(de, calcul.adverseReduite);
        const texte = `Opposition : ${LIBELLES_DE_RUNEQUEST[niveauDeRuneQuest(sien)].toLowerCase()} adverse (${String(de).padStart(2, '0')} contre ${calcul.adverseReduite} %) — ${LIBELLES_DE_L_OPPOSITION[issueDeLOpposition(jet.degre!, sien)]}.`;
        setIssue(texte);
        consigner(texte);
    };

    const localiser = () => {
        const de = d20();
        const zone = localisationDuCoup(de);
        const champPV = regle.localisations?.[zone.cle];
        const pv = champPV !== undefined ? valeurs[champPV] : undefined;
        const texte = `Localisation : ${de} → ${zone.label}${pv !== undefined && pv !== '' ? ` (${String(pv)} PV sur la fiche)` : ''} (p. 146).`;
        setLocalisation(texte);
        setZoneTouchee(zone.cle);
        consigner(texte);
    };

    return (
        <div data-suites-runequest className="flex w-full flex-col gap-2 text-xs">
            {calcul.adverseReduite !== undefined && (
                <div className="flex flex-wrap items-center gap-2" data-opposition-runequest>
                    <label className="flex items-center gap-1" title="Le meilleur niveau de réussite l'emporte ; deux niveaux égaux font une égalité (errata, p. 142 et 144).">
                        Jet de l’adversaire
                        <input aria-label="Jet de l’adversaire" type="number" min={1} max={100} value={deAdverse} className={`w-16 ${champ}`}
                            onChange={e => setDeAdverse(e.target.value)} />
                    </label>
                    <button type="button" className={bouton} onClick={trancher} disabled={entier(deAdverse) < 1 || entier(deAdverse) > 100}>Trancher</button>
                    {issue && <span className="font-bold">{issue}</span>}
                </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={bouton} onClick={localiser} title="1D20 sur la table des localisations (p. 146).">Localiser le coup (1D20)</button>
                {localisation && <span data-localisation-runequest className="font-bold">{localisation}</span>}
            </div>
            {porterLeCoup && zoneTouchee && <PorterLeCoup zone={zoneTouchee} />}
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={bouton} onClick={() => augmenter(bonus)}
                    title="Ce jet était un test d'augmentation : son niveau s'applique à l'aptitude lancée ensuite (p. 144-145).">
                    Augmenter le prochain jet ({signe(bonus)} %)
                </button>
                {!reussi && (
                    <button type="button" className={bouton} onClick={retenter} title="Si la meneuse permet un autre lancer (p. 142).">
                        Tenter à nouveau (−25 %)
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * **Le coup localisé, porté à un combattant** — demandé par David le 2026-10-30. La
 * zone vient du D20 ci-dessus ; la cible par défaut est celle du combattant dont c'est
 * le tour, l'attaquant d'ordinaire. Les dégâts saisis passent par l'armure, la zone et
 * le total, par la même porte que la carte du combattant.
 */
const PorterLeCoup: React.FC<{ zone: string }> = ({ zone }) => {
    const combattants = useCombatStore(s => s.combatants);
    const cibleDuTour = useCombatStore(s => s.combatants[s.currentTurnIdx]?.targetId ?? '');
    const [cible, setCible] = useState(cibleDuTour);
    const [points, setPoints] = useState('');
    const [porte, setPorte] = useState<string | null>(null);
    if (combattants.length === 0) return null;
    const vise = combattants.find(c => c.id === cible);
    const n = Math.max(0, entier(points));
    const porter = () => {
        if (!vise || n === 0) return;
        porterUnCoupLocalise(vise, zone, n);
        setPorte(`Porté à ${vise.name}.`);
        setPoints('');
    };
    return (
        <div className="flex flex-wrap items-center gap-2" data-porter-le-coup>
            <label className="flex items-center gap-1">
                <span className={etiquette}>Cible</span>
                <select aria-label="Cible du coup" value={cible} onChange={e => { setCible(e.target.value); setPorte(null); }} className={champ}>
                    <option value="">— choisir —</option>
                    {combattants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </label>
            <input aria-label="Dégâts portés" type="number" min={0} value={points} placeholder="Dégâts" className={`w-16 ${champ}`}
                onChange={e => setPoints(e.target.value)} />
            <button type="button" className={bouton} disabled={!vise || n === 0} onClick={porter}
                title="L'armure de la zone se retire ; un membre ne prend pas plus du double de ses PV en un coup (p. 146-148).">
                Porter le coup
            </button>
            {porte && <span className="font-bold">{porte}</span>}
        </div>
    );
};
