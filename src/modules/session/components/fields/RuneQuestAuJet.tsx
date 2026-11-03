import React, { useState } from 'react';
import {
    AUGMENTATIONS_DE_RUNEQUEST, LIBELLES_DE_L_OPPOSITION, LIBELLES_DE_RUNEQUEST, MULTIPLICATEURS_DE_RUNEQUEST, LOCALISATIONS,
    degreAdverse, issueDeLOpposition, localisationDuCoup, niveauDeRuneQuest, plagesDeRuneQuest,
    type CalculDeRuneQuest, type ChoixDeRuneQuest, type JetDeRuneQuest, type RegleDeRuneQuest, type Localisation, type NiveauDeRuneQuest,
} from '../../../dice/systemes/runequest';
import {
    LIBELLES_DES_SPECIAUX, apresLaParade, composerLesDegats, direLIssue, issueDuCoup, lancerLesDegats,
    lireLesDegats, retirerLeBonusCompris, speciauxDeLArme, testDeLaceration, usageDuBonusDeLArme,
    type DegatsSpeciaux, type GenreDeDefense, type UsageDuBonus,
} from '../../../dice/systemes/degatsDeRuneQuest';
import { useCombatStore } from '../../../combat/useCombatStore';
import { porterUnCoupLocalise } from '../../../combat/coupsLocalises';
import { useSessionOSStore } from '../../useSessionOSStore';
import type { SheetSection } from '../../../../data/defaultSheetTemplates';
import { coutDuSort, nomDuCulte, payerLeSort, LIBELLES_DES_MAGIES, type GenreDeMagie, type Paiement } from '../../../dice/systemes/magieDeRuneQuest';
import {
    cocher, ecrireLEtat, finDeLaSituation, genreDeLaSource, inspirationImpossible, inspirer, lireLEtat, perteDInspiration, BONUS_D_INSPIRATION,
} from '../../../dice/systemes/progressionDeRuneQuest';
import { aptitudesDeLaFiche, libelleDuChamp } from './runequestALaFiche';

/**
 * **Le jet de RuneQuest** — 30/10/2026, à la demande de David (« finir le pilote »).
 * Avant de lancer : le test de caractéristique ou la table de résistance quand une
 * caractéristique est retenue, la situation, l'augmentation, la nouvelle tentative et
 * l'aptitude adverse. Après : l'opposition tranchée, la localisation du coup, et le
 * résultat servi d'augmentation au jet suivant. Rien ne s'écrit sur la fiche du lanceur ;
 * au meneur, le coup localisé se porte à un combattant de Combat-OS (2026-10-30).
 *
 * Depuis RQ-A3 (03/11/2026, « on va faire RQ-A3 et RQ-A4 ») : une attaque avec une arme
 * de la feuille prépare ses dégâts — arme, bonus, dégâts spéciaux, défense — et le coup
 * porté reçoit ce qui passe, l'armure ignorée sur un critique (`degatsDeRuneQuest.ts`).
 *
 * Depuis RQ-A6 (03/11/2026, « on va faire RQ-A5 et RQ-A6 ») : le jet **écrit** sur la fiche
 * du lanceur ce que la meneuse décide — le sort payé, l'inspiration et ses malus, la coche
 * d'expérience — quand le panneau lui en donne le moyen (`ecrire`).
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
    /** Lance un D20, pour la localisation. */
    d20: () => number;
    /** Sert ce résultat d'augmentation au prochain jet (p. 144-145). */
    augmenter: (bonus: number) => void;
    /** Coche la nouvelle tentative pour le prochain jet (p. 142). */
    retenter: () => void;
    consigner: (ligne: string) => void;
    /** Au meneur seulement : porter le coup localisé à un combattant (`porterUnCoupLocalise`). */
    porterLeCoup?: boolean;
    /** La fiche du lanceur : ses armes et son bonus aux dégâts (RQ-A3). */
    valeurs?: Record<string, unknown>;
    /** Lance un dé, pour les dégâts. */
    de?: (faces: number) => number;
    /**
     * Écrit sur la fiche du lanceur (RQ-A6, 03/11/2026) : le sort payé, l'inspiration, la
     * coche d'expérience. Absente, ces blocs ne se proposent pas.
     */
    ecrire?: (maj: Record<string, unknown>) => void;
    /** Les sections de la fiche, pour nommer les aptitudes. */
    sections?: SheetSection[];
}> = ({ jet, calcul, regle, d20, augmenter, retenter, consigner, porterLeCoup = false, valeurs = {}, de = d20, ecrire, sections = [] }) => {
    const [deAdverse, setDeAdverse] = useState('');
    const [issue, setIssue] = useState<string | null>(null);
    const [localisation, setLocalisation] = useState<string | null>(null);
    const [zoneTouchee, setZoneTouchee] = useState<Localisation | null>(null);
    const [degats, setDegats] = useState<DegatsPrets | null>(null);
    // Une attaque avec une arme que le pilote déclare (2.2.0) : ses dégâts se préparent ici.
    const attaque = !!calcul.champ && !!regle.armes?.some(a => a.score === calcul.champ);
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
        // La localisation ne dépend pas du lanceur. Les PV se lisent sur la cible
        // choisie ci-dessous, qui peut encore changer après le D20 (RQ-A2, 01/11/2026).
        const texte = `Localisation : ${de} → ${zone.label} (p. 146).`;
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
            {attaque && (
                <DegatsRuneQuest regle={regle} valeurs={valeurs} champLance={calcul.champ!} niveau={niveau} de={de}
                    consigner={consigner} onLance={setDegats} />
            )}
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={bouton} onClick={localiser} title="1D20 sur la table des localisations (p. 146).">Localiser le coup (1D20)</button>
                {localisation && <span data-localisation-runequest className="font-bold">{localisation}</span>}
            </div>
            {porterLeCoup && zoneTouchee && <PorterLeCoup key={`${zoneTouchee}-${degats?.cle ?? 0}`} zone={zoneTouchee} regle={regle} degats={degats ?? undefined} />}
            {ecrire && regle.magie && (
                <MagieAuJet regle={regle} valeurs={valeurs} champ={calcul.champ} niveau={niveau} ecrire={ecrire} consigner={consigner} />
            )}
            {ecrire && regle.progression && calcul.champ && genreDeLaSource(regle.progression, calcul.champ) && (
                <InspirationAuJet regle={regle} valeurs={valeurs} sections={sections} champ={calcul.champ} niveau={niveau} de={de} ecrire={ecrire} consigner={consigner} />
            )}
            {ecrire && regle.progression && calcul.champ && reussi && calcul.mode === 'aptitude' && (
                <CocherLExperience regle={regle} valeurs={valeurs} sections={sections} champ={calcul.champ} ecrire={ecrire} consigner={consigner} />
            )}
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

/** Les dégâts lancés, prêts à porter : ce qui passe la défense, et si l'armure compte. */
interface DegatsPrets {
    cle: number;
    passent: number;
    sansArmure: boolean;
    adjacente: boolean;
    /** Une lacération : le test contre l'inconscience se lit sur la zone touchée (p. 204). */
    laceration: boolean;
}

const texteDe = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());

/**
 * **Les dégâts de l'attaque** — RQ-A3, 03/11/2026. L'arme de la feuille, son type de
 * dégâts spéciaux (choisi avant le test pour une arme de taille et d'estoc, p. 203), la
 * part du bonus, puis la défense : la case des tables p. 199 et 201 dit ce qui passe.
 * Rien ne s'écrit : le résultat part au coup localisé, que la meneuse porte.
 */
const DegatsRuneQuest: React.FC<{
    regle: RegleDeRuneQuest;
    valeurs: Record<string, unknown>;
    champLance: string;
    niveau: NiveauDeRuneQuest;
    de: (faces: number) => number;
    consigner: (ligne: string) => void;
    onLance: (d: DegatsPrets) => void;
}> = ({ regle, valeurs, champLance, niveau, de, consigner, onLance }) => {
    // L'arme lancée, et les autres armes renseignées : on attaque parfois avec une autre que celle du score.
    const armes = (regle.armes ?? []).map(a => ({ ...a, libelle: texteDe(valeurs[a.nom ?? '']) || a.score }))
        .filter(a => a.score === champLance || texteDe(valeurs[a.degats]) !== '');
    const premiere = armes.find(a => a.score === champLance) ?? armes[0];
    const [score, setScore] = useState(premiere?.score ?? '');
    const arme = armes.find(a => a.score === score) ?? premiere;
    const speciauxDuNom = speciauxDeLArme(arme?.libelle ?? '');
    const [special, setSpecial] = useState<DegatsSpeciaux | ''>(speciauxDuNom[0] ?? '');
    const [usage, setUsage] = useState<UsageDuBonus>(usageDuBonusDeLArme(arme?.libelle ?? '', arme?.genre ?? 'melee'));
    const [defense, setDefense] = useState<GenreDeDefense>('aucune');
    const [niveauDeDefense, setNiveauDeDefense] = useState<NiveauDeRuneQuest>('reussite');
    const [durabilite, setDurabilite] = useState('');
    const [lance, setLance] = useState<string | null>(null);
    // Chaque lancer a son numéro : le coup porté se remet à zéro avec lui.
    const [lancers, setLancers] = useState(0);
    if (!arme) return null;

    const texteDuBonus = texteDe(valeurs[regle.bonusAuxDegats ?? '']);
    const bonus = lireLesDegats(texteDuBonus) ?? [];
    const lu = lireLesDegats(texteDe(valeurs[arme.degats]));
    const { arme: termes, compris } = retirerLeBonusCompris(lu ?? [], bonus);
    const issue = issueDuCoup(niveau, defense, niveauDeDefense);
    const composition = composerLesDegats({ arme: termes, bonus, usage, niveau: issue.degats, special: special || undefined });
    const dura = durabilite.trim() === '' ? undefined : entier(durabilite);
    const changer = <T,>(poser: (v: T) => void) => (v: T) => { poser(v); setLance(null); };

    const lancer = () => {
        const { total, detail } = lancerLesDegats(composition, de);
        const apres = apresLaParade(total, issue, dura);
        const texte = `Dégâts (${arme.libelle}) : ${total} (${detail})`
            + (issue.bloque ? ` − ${dura ?? '?'} durabilité = ${apres.passent} passent` : '')
            + (issue.sansArmure ? ', armure ignorée' : '') + '.'
            + (apres.note ? ` ${apres.note}` : '');
        setLance(texte);
        setLancers(n => n + 1);
        consigner(texte);
        onLance({
            cle: lancers + 1, passent: apres.passent, sansArmure: issue.sansArmure, adjacente: issue.bloque && issue.zone === 'adjacente',
            laceration: special === 'laceration' && (issue.degats === 'speciaux' || issue.degats === 'speciaux-max'),
        });
    };

    return (
        <div data-degats-runequest className="flex flex-col gap-1.5 border-t border-app-border/30 pt-2">
            <span className={etiquette}>Dégâts</span>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1">Arme
                    <select aria-label="Arme de l’attaque" className={champ} value={arme.score} onChange={e => {
                        const a = armes.find(x => x.score === e.target.value)!;
                        setScore(a.score);
                        setSpecial(speciauxDeLArme(a.libelle)[0] ?? '');
                        setUsage(usageDuBonusDeLArme(a.libelle, a.genre));
                        setLance(null);
                    }}>
                        {armes.map(a => <option key={a.score} value={a.score}>{a.libelle} — {texteDe(valeurs[a.degats]) || '?'}</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-1" title="Une arme de taille et d'estoc choisit avant le test (p. 203).">Dégâts spéciaux
                    <select aria-label="Dégâts spéciaux" className={champ} value={special} onChange={e => changer(setSpecial)(e.target.value as DegatsSpeciaux | '')}>
                        {!special && <option value="">— choisir —</option>}
                        {(speciauxDuNom.length ? speciauxDuNom : (Object.keys(LIBELLES_DES_SPECIAUX) as DegatsSpeciaux[])).map(k =>
                            <option key={k} value={k}>{LIBELLES_DES_SPECIAUX[k]}</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-1" title="Une arme lancée n'a que la moitié du bonus ; un arc ou une fronde n'en a pas (p. 212).">Bonus aux dégâts
                    <select aria-label="Bonus aux dégâts" className={champ} value={usage} onChange={e => changer(setUsage)(e.target.value as UsageDuBonus)}>
                        <option value="entier">Entier ({texteDuBonus || 'aucun'})</option>
                        <option value="moitie">Moitié — arme lancée</option>
                        <option value="aucun">Aucun — arc ou fronde</option>
                    </select>
                </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1">Défense
                    <select aria-label="Défense" className={champ} value={defense} onChange={e => changer(setDefense)(e.target.value as GenreDeDefense)}>
                        <option value="aucune">Aucune</option>
                        <option value="parade">Parade</option>
                        <option value="esquive">Esquive</option>
                    </select>
                </label>
                {defense !== 'aucune' && (
                    <label className="flex items-center gap-1">Niveau de la défense
                        <select aria-label="Niveau de la défense" className={champ} value={niveauDeDefense} onChange={e => changer(setNiveauDeDefense)(e.target.value as NiveauDeRuneQuest)}>
                            {NIVEAUX.map(n => <option key={n} value={n}>{LIBELLES_DE_RUNEQUEST[n]}</option>)}
                        </select>
                    </label>
                )}
                {defense === 'parade' && (
                    <label className="flex items-center gap-1" title="Une parade bloque jusqu'aux points de durabilité actuels de l'arme ou du bouclier (p. 198).">Durabilité de l’arme qui pare
                        <input aria-label="Durabilité de l’arme qui pare" type="number" min={0} value={durabilite} className={`w-14 ${champ}`}
                            onChange={e => changer(setDurabilite)(e.target.value)} />
                    </label>
                )}
            </div>
            <span data-issue-runequest className="rounded-md border border-app-border/40 px-2 py-1">{direLIssue(issue, defense)}</span>
            {(lu === null || compris || composition.remarques.length > 0) && (
                <span className="text-app-text/60">
                    {lu === null ? `Dégâts de l’arme illisibles (« ${texteDe(valeurs[arme.degats])} »). ` : ''}
                    {compris ? `Le bonus ${texteDuBonus} était compris dans les dégâts de l’arme : il n’est compté qu’une fois. ` : ''}
                    {composition.remarques.join(' ')}
                </span>
            )}
            {composition.parts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold" data-formule-runequest>{composition.formule}</span>
                    <button type="button" className={bouton} onClick={lancer}>Lancer les dégâts</button>
                    {lance && <span data-degats-lances className="font-bold">{lance}</span>}
                </div>
            )}
        </div>
    );
};

/**
 * **Le coup localisé, porté à un combattant** — demandé par David le 2026-10-30. La
 * zone vient du D20 ci-dessus ; la cible par défaut est celle du combattant dont c'est
 * le tour, l'attaquant d'ordinaire. Les dégâts saisis passent par l'armure, la zone et
 * le total, par la même porte que la carte du combattant.
 */
const PorterLeCoup: React.FC<{ zone: Localisation; regle: RegleDeRuneQuest; degats?: DegatsPrets }> = ({ zone: tiree, regle, degats }) => {
    const combattants = useCombatStore(s => s.combatants);
    const cibleDuTour = useCombatStore(s => s.combatants[s.currentTurnIdx]?.targetId ?? '');
    // Lu sans abonnement : le pilote ne change pas pendant le coup, et un objet neuf ferait boucler React.
    const champsDesZones = useSessionOSStore.getState().getActiveDriver()?.combat?.coupsLocalises?.zones;
    const [cible, setCible] = useState(cibleDuTour);
    // Les dégâts lancés arrivent tout prêts ; une parade peut envoyer l'excédent à une zone adjacente (p. 199).
    const [zone, setZone] = useState<Localisation>(tiree);
    const [points, setPoints] = useState(degats ? String(degats.passent) : '');
    const [porte, setPorte] = useState<string | null>(null);
    const sansArmure = !!degats?.sansArmure;
    if (combattants.length === 0) return null;
    const vise = combattants.find(c => c.id === cible);
    const champPV = regle.localisations?.[zone];
    const valeurPV = champPV ? vise?.sheetData?.[champPV] : undefined;
    const pv = (typeof valeurPV === 'number' || (typeof valeurPV === 'string' && valeurPV.trim() !== ''))
        && Number.isFinite(Number(valeurPV)) ? Number(valeurPV) : undefined;
    const libelleZone = LOCALISATIONS.find(l => l.cle === zone)!.label;
    const n = Math.max(0, entier(points));
    // La lacération : si les dégâts nets égalent les PV de la zone, test de (CON − dégâts) ×5 (p. 204).
    const champArmure = champsDesZones?.[zone]?.armure;
    const armure = champArmure ? Number(vise?.sheetData?.[champArmure]) : 0;
    const net = Math.max(0, n - (sansArmure || !Number.isFinite(armure) ? 0 : armure));
    const con = regle.con ? Number(vise?.sheetData?.[regle.con]) : NaN;
    const testLaceration = degats?.laceration && pv !== undefined && net > 0 && net >= pv && Number.isFinite(con)
        ? `Lacération : test de (CON ${con} − ${net}) ×5 = ${testDeLaceration(con, net)} % pour rester conscient (p. 204).` : null;
    const porter = () => {
        if (!vise || n === 0) return;
        porterUnCoupLocalise(vise, zone, n, false, sansArmure);
        // Un coup se porte une fois : le champ se vide, et d'autres dégâts se ressaisissent.
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
            <label className="flex items-center gap-1">Zone
                <select aria-label="Zone du coup" value={zone} onChange={e => setZone(e.target.value as Localisation)} className={champ}>
                    {LOCALISATIONS.map(l => <option key={l.cle} value={l.cle}>{l.label}{l.cle === tiree ? ' (tirée)' : ''}</option>)}
                </select>
            </label>
            <span data-pv-cible-runequest aria-live="polite">
                {vise ? `${vise.name} · ${libelleZone} : ${pv === undefined ? 'PV inconnus sur la fiche' : `${pv} PV max. sur la fiche`}`
                    : 'Choisir une cible pour lire les PV de la zone.'}
            </span>
            <input aria-label="Dégâts portés" type="number" min={0} value={points} placeholder="Dégâts" className={`w-16 ${champ}`}
                onChange={e => setPoints(e.target.value)} />
            <button type="button" className={bouton} disabled={!vise || n === 0} onClick={porter}
                title="L'armure de la zone se retire, sauf sur un critique ; un membre ne prend pas plus du double de ses PV en un coup (p. 146-148, 200).">
                Porter le coup
            </button>
            {degats && <span data-armure-runequest className="rounded border border-app-border/40 px-1 italic text-app-text/60">{sansArmure ? 'armure ignorée' : 'armure retirée'}</span>}
            {degats?.adjacente && zone === tiree && <span className="text-app-text/60">L’excédent va à une localisation adjacente : choisir la zone.</span>}
            {testLaceration && <span data-laceration-runequest className="font-bold">{testLaceration}</span>}
            {porte && <span className="font-bold">{porte}</span>}
        </div>
    );
};

/**
 * **Payer le sort** — RQ-A6, 03/11/2026. Le sort se saisit au lancement (choix de David) ;
 * son coût suit le niveau du jet, comme le livre le dit pour chaque magie (p. 254, 314,
 * sorcellerie) ; le culte du sort paie ses points de Rune, jamais un autre (p. 313).
 * Un seul paiement par lancer, qu'on peut annuler.
 */
const MagieAuJet: React.FC<{
    regle: RegleDeRuneQuest;
    valeurs: Record<string, unknown>;
    champ?: string;
    niveau: NiveauDeRuneQuest;
    ecrire: (maj: Record<string, unknown>) => void;
    consigner: (ligne: string) => void;
}> = ({ regle, valeurs, champ: champLance, niveau, ecrire, consigner }) => {
    const magie = regle.magie!;
    const parDefaut: GenreDeMagie | null = champLance === magie.pou ? 'spirituelle'
        : champLance && regle.progression?.runes.includes(champLance) ? 'runique' : null;
    const [ouvert, setOuvert] = useState(parDefaut !== null);
    const [genre, setGenre] = useState<GenreDeMagie>(parDefaut ?? 'spirituelle');
    const [sort, setSort] = useState('');
    const [cout, setCout] = useState('1');
    const [plus, setPlus] = useState('0');
    const [culte, setCulte] = useState(0);
    const [paiement, setPaiement] = useState<Paiement | null>(null);
    const [refus, setRefus] = useState<string | null>(null);
    if (!ouvert) {
        return (
            <button type="button" className={`${bouton} self-start`} onClick={() => setOuvert(true)}
                title="Payer un sort lancé par ce jet : POU×5, affinité runique ou compétence de sorcellerie.">
                Ce jet lance un sort…
            </button>
        );
    }
    const prix = coutDuSort(genre, niveau, entier(cout), genre === 'sorcellerie' ? 0 : entier(plus));
    const nomCulte = nomDuCulte(magie, valeurs, culte);
    const prActuels = Number(valeurs[magie.cultes[culte]?.pr ?? '']) || 0;
    const pmActuels = Number(valeurs[magie.pm]) || 0;
    const reste = [
        prix.pr ? `PR ${nomCulte} ${prActuels - prix.pr}` : '',
        prix.pm ? `PM ${pmActuels - prix.pm}` : '',
    ].filter(Boolean).join(', ');
    const payer = () => {
        const p = payerLeSort(magie, valeurs, prix, culte, sort);
        if (p.refus) { setRefus(p.refus); return; }
        setRefus(null);
        if (Object.keys(p.maj).length) ecrire(p.maj);
        consigner([p.ligne, ...p.alertes].join(' '));
        setPaiement(p);
    };
    const annuler = () => {
        if (!paiement) return;
        ecrire(paiement.avant);
        consigner(`Paiement annulé : ${paiement.ligne}`);
        setPaiement(null);
    };
    return (
        <div data-magie-runequest className="flex flex-col gap-1.5 border-t border-app-border/30 pt-2">
            <span className={etiquette}>Magie</span>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1">Type
                    <select aria-label="Type de magie" className={champ} value={genre} disabled={!!paiement} onChange={e => setGenre(e.target.value as GenreDeMagie)}>
                        {(Object.keys(LIBELLES_DES_MAGIES) as GenreDeMagie[]).map(g => <option key={g} value={g}>{LIBELLES_DES_MAGIES[g]}</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-1">Sort
                    <input aria-label="Sort" value={sort} disabled={!!paiement} placeholder="Vent tempétueux" className={`w-40 ${champ}`} onChange={e => setSort(e.target.value)} />
                </label>
                <label className="flex items-center gap-1" title={genre === 'sorcellerie' ? 'Le total : Runes, techniques et intensité.' : genre === 'runique' ? 'En points de Rune.' : 'En points de magie.'}>Coût
                    <input aria-label="Coût du sort" type="number" min={0} value={cout} disabled={!!paiement} className={`w-14 ${champ}`} onChange={e => setCout(e.target.value)} />
                </label>
                {genre === 'runique' && (
                    <label className="flex items-center gap-1">Payé par
                        <select aria-label="Culte qui paie" className={champ} value={culte} disabled={!!paiement} onChange={e => setCulte(Number(e.target.value))}>
                            {magie.cultes.map((c, i) => <option key={c.pr} value={i}>Culte {i + 1} — {nomDuCulte(magie, valeurs, i)} (PR {Number(valeurs[c.pr]) || 0}/{Number(valeurs[c.prMax ?? '']) || 0})</option>)}
                        </select>
                    </label>
                )}
                {genre !== 'sorcellerie' && (
                    <label className="flex items-center gap-1" title="Des PM ajoutés pour percer un Bouclier ou une Contremagie (p. 254, 314).">PM en plus
                        <input aria-label="PM en plus" type="number" min={0} value={plus} disabled={!!paiement} className={`w-14 ${champ}`} onChange={e => setPlus(e.target.value)} />
                    </label>
                )}
            </div>
            <span className="text-app-text/70" data-cout-runequest>{prix.explication}</span>
            {!paiement && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{prix.pm || prix.pr
                        ? `Coût : ${[prix.pr ? `${prix.pr} PR (${nomCulte})` : '', prix.pm ? `${prix.pm} PM` : ''].filter(Boolean).join(' et ')} — il restera ${reste}.`
                        : 'Rien à payer.'}</span>
                    {(prix.pm > 0 || prix.pr > 0) && <button type="button" className={bouton} onClick={payer}>Payer le sort</button>}
                </div>
            )}
            {refus && <span className="font-bold text-etat-danger">{refus}</span>}
            {paiement && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-app-border/40 px-2 py-1">
                    <span data-paiement-runequest>Payé : {paiement.ligne}{paiement.alertes.length ? ` ${paiement.alertes.join(' ')}` : ''} · journal</span>
                    <button type="button" className={bouton} onClick={annuler}>Annuler le paiement</button>
                </div>
            )}
        </div>
    );
};

/**
 * **Ce jet était un test d'inspiration** — RQ-A6, 03/11/2026. Une Rune ou une Passion
 * inspire une aptitude choisie pour toute la situation (p. 229, 236) ; un échec pose le
 * malus du livre ; un échec critique fait lancer la perte de 1D10 % et la durée du trouble.
 * Rien ne s'applique sans un geste de la meneuse.
 */
const InspirationAuJet: React.FC<{
    regle: RegleDeRuneQuest;
    valeurs: Record<string, unknown>;
    sections: SheetSection[];
    champ: string;
    niveau: NiveauDeRuneQuest;
    de: (faces: number) => number;
    ecrire: (maj: Record<string, unknown>) => void;
    consigner: (ligne: string) => void;
}> = ({ regle, valeurs, sections, champ: champLance, niveau, de, ecrire, consigner }) => {
    const progression = regle.progression!;
    const genre = genreDeLaSource(progression, champLance)!;
    const source = { champ: champLance, libelle: libelleDuChamp(sections, valeurs, champLance), genre };
    const competences = aptitudesDeLaFiche(progression, sections, valeurs).filter(a => a.genre === 'competence');
    const [aptitude, setAptitude] = useState(competences[0]?.champ ?? '');
    const [fait, setFait] = useState<string | null>(null);
    const etat = lireLEtat(valeurs);
    const impossible = inspirationImpossible(etat, champLance, genre);
    const bonus = BONUS_D_INSPIRATION[niveau];
    const page = genre === 'rune' ? 'p. 229' : 'p. 236';
    const libelleAptitude = competences.find(a => a.champ === aptitude)?.libelle ?? aptitude;

    const appliquer = () => {
        const issue = inspirer(etat, source, niveau, { champ: aptitude, libelle: libelleAptitude });
        let maj = ecrireLEtat(issue.etat);
        let ligne = issue.ligne;
        if (issue.echecCritique) {
            const perte = perteDInspiration(progression, valeurs, source, de(10), de(10));
            maj = { ...perte.maj, ...maj };
            ligne = `${ligne} ${perte.ligne}`;
        }
        ecrire(maj);
        consigner(ligne);
        setFait(ligne);
    };
    const finir = () => {
        ecrire(ecrireLEtat(finDeLaSituation(lireLEtat(valeurs))));
        consigner(`Fin de la situation : l’inspiration (${source.libelle}) prend fin.`);
        setFait(null);
    };

    return (
        <div data-inspiration-runequest className="flex flex-col gap-1.5 border-t border-app-border/30 pt-2">
            <span className={etiquette}>Inspiration ({page})</span>
            {fait ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-app-border/40 px-2 py-1">
                    <span data-inspiration-faite>{fait}</span>
                    {bonus && <button type="button" className={bouton} onClick={finir}>Fin de la situation</button>}
                </div>
            ) : impossible ? (
                <span className="text-app-text/60">{impossible}</span>
            ) : bonus ? (
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1">Aptitude inspirée
                        <select aria-label="Aptitude inspirée" className={champ} value={aptitude} onChange={e => setAptitude(e.target.value)}>
                            {competences.map(a => <option key={a.champ} value={a.champ}>{a.libelle} ({a.valeur})</option>)}
                        </select>
                    </label>
                    <span className="font-bold">+{bonus} % à {libelleAptitude} jusqu’à la fin de la situation (une seule inspiration par situation).</span>
                    <button type="button" className={bouton} disabled={!aptitude} onClick={appliquer}>Inspirer</button>
                </div>
            ) : (
                <div className="flex flex-col gap-1 rounded-md border border-etat-danger/40 px-2 py-1">
                    <span className={etiquette}>L’inspiration échoue</span>
                    {niveau === 'echec' ? (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>{genre === 'passion'
                                ? 'Découragé : −10 % à tous les tests suivants tant que dure la situation.'
                                : `−20 % à tous les tests suivants faisant appel à ${source.libelle}, jusqu’à une journée entière de méditation.`}</span>
                            <button type="button" className={bouton} onClick={appliquer}>Appliquer</button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>Échec critique : {source.libelle} perd 1D10 %{genre === 'rune' ? ' (l’opposée monte d’autant)' : ''}, et {genre === 'rune' ? 'le tourment' : 'le désespoir'}, dont la durée se lit sur 1D10.</span>
                            <button type="button" className={bouton} onClick={appliquer}>Lancer 1D10</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/** **Cocher l'expérience** d'une aptitude réussie (RQ-A6, p. 415) ; ni la Réputation, ni une caractéristique. */
const CocherLExperience: React.FC<{
    regle: RegleDeRuneQuest;
    valeurs: Record<string, unknown>;
    sections: SheetSection[];
    champ: string;
    ecrire: (maj: Record<string, unknown>) => void;
    consigner: (ligne: string) => void;
}> = ({ regle, valeurs, sections, champ: champLance, ecrire, consigner }) => {
    const progression = regle.progression!;
    const cochable = aptitudesDeLaFiche(progression, sections, valeurs).some(a => a.champ === champLance);
    if (!cochable) return null;
    const etat = lireLEtat(valeurs);
    const libelle = libelleDuChamp(sections, valeurs, champLance);
    if (etat.coches.includes(champLance)) return <span className="italic text-app-text/60" data-experience-cochee>Expérience cochée — {libelle}.</span>;
    return (
        <button type="button" className={`${bouton} self-start`} data-cocher-experience
            title="Une réussite qui compte vaut un test d'expérience en fin de saison, si la meneuse l'accorde (p. 415)."
            onClick={() => { ecrire(ecrireLEtat(cocher(etat, champLance))); consigner(`Test d’expérience coché : ${libelle}.`); }}>
            Cocher l’expérience — {libelle}
        </button>
    );
};
