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
}> = ({ jet, calcul, regle, d20, augmenter, retenter, consigner, porterLeCoup = false, valeurs = {}, de = d20 }) => {
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
