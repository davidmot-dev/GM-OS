import React, { useState } from 'react';
import {
    DIFFICULTES_DE_DEGENESIS, EGO_PAR_ROUND, MODIFICATEURS_DE_DEGENESIS, lancerDegenesis, reserveDeDegenesis,
    type ChoixDeDegenesis, type JetDeDegenesis, type ReserveDeDegenesis,
} from '../../../dice/systemes/degenesis';
import {
    calculerLeCoup, contreLActive, contreLaPassive, defensePassive, FACTEURS_DE_DEFENSE, LIBELLES_DES_DEFENSES,
    LIBELLES_DES_FACTEURS, LIBELLES_DES_PISTES, lireLesDegats, lireLesProprietes, sommeDesChamps, actionsRestantes,
    type FacteursDeDefense, type GenreDeDefense, type IssueDeLaDefense, type ProprietesDeLArme, type RegleDuCombatDeDegenesis,
} from '../../../dice/systemes/combatDeDegenesis';
import { useCombatStore } from '../../../combat/useCombatStore';
import { useRoundDeDegenesisStore } from '../../../combat/useRoundDeDegenesisStore';
import { porterUnCoupDegenesis, valeursDuCombattant } from '../../../combat/coupsDeDegenesis';

/**
 * **Le jet de Degenesis** — 30/10/2026, à la demande de David (« finir le pilote »).
 * Avant de lancer : la difficulté du livre en succès requis, les modificateurs en dés,
 * l'Égo dépensé ; la valeur d'action se lit en entier, Traumatismes et succès d'office
 * compris. Après : les déclencheurs et ce qu'ils valent au combat.
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };
const signe = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

/** Ce que le round dit du personnage qui lance (DEG-A1). */
export interface CombatDuJet {
    nom: string;
    restantes: number;
    /** Les dés d'Égo payés à l'initiative, dus à sa première action. */
    bonus: number;
    /** Ce jet compte pour une action du round. */
    action: boolean;
    setAction: (oui: boolean) => void;
}

export interface ArmeDuJet { cle: string; libelle: string; maniabilite: number }

export const PreparationDegenesis: React.FC<{
    choix: ChoixDeDegenesis;
    setChoix: (maj: (c: ChoixDeDegenesis) => ChoixDeDegenesis) => void;
    reserve?: ReserveDeDegenesis;
    difficulte: number;
    setDifficulte: (n: number) => void;
    /** Les points d'Égo de la fiche ; absents, l'Égo ne se dépense pas d'ici. */
    ego?: number;
    /** En combat, l'Égo vient de l'initiative et ne se dépense plus ici (choix de David, 03/11). */
    combat?: CombatDuJet;
    /** Une compétence d'attaque : les armes de la fiche, leur maniabilité en dés (p. 103). */
    armes?: ArmeDuJet[];
    arme?: string;
    setArme?: (cle: string) => void;
}> = ({ choix, setChoix, reserve, difficulte, setDifficulte, ego, combat, armes, arme, setArme }) => {
    const egoMax = ego === undefined ? 0 : Math.min(EGO_PAR_ROUND, ego);
    const armeChoisie = armes?.find(a => a.cle === arme);
    return (
        <div data-preparation-degenesis className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1">
                <span className={etiquette}>Difficulté</span>
                {DIFFICULTES_DE_DEGENESIS.map(d => (
                    <button key={d.succes} type="button" aria-pressed={difficulte === d.succes}
                        className={`${bouton} ${difficulte === d.succes ? 'border-accent text-accent' : ''}`}
                        title={`${d.succes} succès requis (p. 18)`} onClick={() => setDifficulte(d.succes)}>
                        {d.label} ({d.succes})
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
                <span className={etiquette}>Modificateurs</span>
                {MODIFICATEURS_DE_DEGENESIS.map(m => (
                    <button key={m.label} type="button" className={bouton} title="S'ajoute à la valeur d'action (p. 102-106)."
                        onClick={() => setChoix(c => ({ ...c, modificateur: c.modificateur + m.des }))}>
                        {m.label} {signe(m.des)}D
                    </button>
                ))}
            </div>
            {armes && armes.length > 0 && setArme && (
                <label className="flex items-center gap-1">
                    <span className={etiquette}>Arme</span>
                    <select aria-label="Arme de l’attaque" className={champ} value={arme ?? ''} onChange={e => setArme(e.target.value)}>
                        <option value="">— sans arme de la fiche —</option>
                        {armes.map(a => <option key={a.cle} value={a.cle}>{a.libelle}{a.maniabilite ? `, maniabilité ${signe(a.maniabilite)}D` : ''}</option>)}
                    </select>
                </label>
            )}
            {combat && (
                <div data-round-du-jet className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1" title="Une attaque, une défense active, recharger… coûtent une action (p. 101-102).">
                        <input type="checkbox" checked={combat.action} disabled={combat.restantes === 0} onChange={e => combat.setAction(e.target.checked)} />
                        Ce jet est une action du round
                        <span className="text-app-text/50">— {combat.nom} : {combat.restantes} restante{combat.restantes > 1 ? 's' : ''}</span>
                    </label>
                    {combat.action && combat.bonus > 0 && (
                        <span data-ego-de-l-initiative className="rounded border border-accent/40 px-1.5 font-bold text-accent">
                            Égo de l’initiative : +{combat.bonus}D, première action du round (déjà payé)
                        </span>
                    )}
                </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1" title="Encombrement, Potentiels, couverture… toujours en dés. La maniabilité de l'arme s'y ajoute d'elle-même.">
                    Total des modificateurs (D)
                    <input aria-label="Modificateurs en dés" type="number" value={choix.modificateur} className={`w-14 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, modificateur: entier(e.target.value) }))} />
                </label>
                {ego !== undefined && !combat && (
                    <label className="flex items-center gap-1"
                        title="Dépensés au jet d'initiative : +1D à l'initiative et à la première action du round, trois au plus (p. 100). Retirés de la fiche au lancer.">
                        Égo dépensé
                        <select aria-label="Égo dépensé" value={Math.min(choix.ego, egoMax)} className={champ}
                            onChange={e => setChoix(c => ({ ...c, ego: entier(e.target.value) }))}>
                            {Array.from({ length: egoMax + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="text-app-text/50">sur {ego}</span>
                    </label>
                )}
            </div>
            {reserve && (
                <span data-composition-degenesis className="text-app-text/60">
                    Valeur d'action {reserve.base}
                    {reserve.modificateur !== 0 && ` ${signe(reserve.modificateur)}D`}
                    {armeChoisie?.maniabilite ? ` (dont ${signe(armeChoisie.maniabilite)}D de maniabilité)` : ''}
                    {reserve.ego > 0 && ` +${reserve.ego}D d'Égo`}
                    {reserve.traumatismes > 0 && ` −${reserve.traumatismes}D de Traumatisme${reserve.traumatismes > 1 ? 's' : ''}`}
                    {' '}= <strong className="text-app-text">{reserve.valeur}</strong> : {reserve.des} dé{reserve.des > 1 ? 's' : ''}
                    {reserve.automatiques > 0 && ` et ${reserve.automatiques} succès d'office`}, réussis sur 4, 5 ou 6.
                </span>
            )}
        </div>
    );
};

export const SuitesDegenesis: React.FC<{ jet: JetDeDegenesis }> = ({ jet }) => {
    const d = jet.degenesis;
    return (
        <div data-suites-degenesis className="flex w-full flex-col gap-1 text-xs text-app-text/70">
            {d.bilan === 'reussite' && d.declencheurs > 0 && (
                <span>
                    {d.declencheurs} déclencheur{d.declencheurs > 1 ? 's' : ''} : au combat, +{d.declencheurs} dégât{d.declencheurs > 1 ? 's' : ''} (p. 107) ;
                    ils activent aussi les Potentiels et les propriétés des armes sans s'épuiser (p. 19).
                </span>
            )}
            {d.bilan === 'echec-critique' && (
                <span className="text-etat-danger">{d.uns} « 1 » pour {d.succes} succès : l'action prend mauvaise tournure (p. 19).</span>
            )}
            {d.bilan !== 'reussite' && d.six > 0 && (
                <span>{d.six} six obtenu{d.six > 1 ? 's' : ''} : ils départagent une confrontation à égalité de succès (p. 19).</span>
            )}
        </div>
    );
};

/** Ce que le panneau sait de l'attaque qu'il vient de lancer (DEG-A2). */
export interface AttaqueLancee {
    compte: number;
    /** La clé de l'arme de la fiche (`regle.armes[i].nom`), vide sans arme. */
    arme: string;
    /** Corps à corps ou Lutte : la parade peut y contre-attaquer (p. 106). */
    corpsACorps: boolean;
    /** Le combattant qui attaque, pour proposer sa cible. */
    attaquantId?: string;
}

const DEFENSES = Object.keys(LIBELLES_DES_DEFENSES) as GenreDeDefense[];
const texteDe = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());

/**
 * **L'attaque, jusqu'aux dégâts nets** — DEG-A2, 03/11/2026, dessinée dans Stitch
 * (`stitch/degenesis-attaque/`) et validée par David.
 *
 * La cible, puis sa défense : **passive**, la difficulté se compose de ses facteurs (p. 106) ;
 * **active**, GM-OS lance sa réserve depuis sa fiche (choix de David) et lui retire une action
 * du round — il n'en a plus : la passive seule (p. 102). Touché, les dégâts de l'arme (F lu sur
 * la fiche de l'attaquant) + les déclencheurs + les Potentiels, moins **une** armure de la cible ;
 * les propriétés lues dans la fiche (choix de David) se décochent. Le net part aux pistes.
 */
export const AttaqueDegenesis: React.FC<{
    regle: RegleDuCombatDeDegenesis;
    /** Le champ des Traumatismes : −1D chacun à la défense active (p. 105). */
    champTraumatismes?: string;
    valeurs: Record<string, unknown>;
    jet: JetDeDegenesis;
    attaque: AttaqueLancee;
    de: () => number;
    consigner: (ligne: string) => void;
}> = ({ regle, champTraumatismes, valeurs, jet, attaque, de, consigner }) => {
    const combattants = useCombatStore(s => s.combatants);
    const etats = useRoundDeDegenesisStore(s => s.etats);
    const roundDesEtats = useRoundDeDegenesisStore(s => s.round);
    const roundDuPlateau = useCombatStore(s => s.round);
    const attaquant = combattants.find(c => c.id === attaque.attaquantId);
    const [cibleId, setCibleId] = useState(attaquant?.targetId ?? combattants.find(c => c.id !== attaque.attaquantId)?.id ?? '');
    const [mode, setMode] = useState<'passive' | 'active'>('passive');
    const [facteurs, setFacteurs] = useState<FacteursDeDefense>(FACTEURS_DE_DEFENSE);
    const [genre, setGenre] = useState<GenreDeDefense>(attaque.corpsACorps ? 'parade-corps-a-corps' : 'esquive');
    const [active, setActive] = useState<IssueDeLaDefense | null>(null);
    const [potentiels, setPotentiels] = useState(0);
    const [porte, setPorte] = useState<string | null>(null);
    const succes = jet.degenesis.succes;

    const arme = regle.armes.find(a => a.nom === attaque.arme);
    const texteDesDegats = arme ? texteDe(valeurs[arme.degats]) : '';
    const lues = lireLesProprietes(arme?.proprietes ? texteDe(valeurs[arme.proprietes]) : '', texteDesDegats);
    const [proprietes, setProprietes] = useState<ProprietesDeLArme>(lues);
    const force = sommeDesChamps(valeurs, regle.force);
    const degatsLus = lireLesDegats(texteDesDegats, force) ?? (lues.etourdissement?.degats ? lireLesDegats(lues.etourdissement.degats, force) : null);
    const [saisis, setSaisis] = useState('');

    const cible = combattants.find(c => c.id === cibleId);
    const ficheCible = cible ? valeursDuCombattant(cible) : {};
    const armures = regle.armures
        .map((a, i) => ({ i, nom: texteDe(ficheCible[a.nom ?? '']) || `Armure ${i + 1}`, valeur: Math.max(0, Math.trunc(Number(ficheCible[a.valeur]) || 0)) }))
        .filter(a => a.valeur > 0);
    const [armureChoisie, setArmureChoisie] = useState<string>('');
    const armure = armureChoisie === 'aucune' ? undefined : armures.find(a => String(a.i) === armureChoisie) ?? armures[0];

    if (combattants.length === 0) return null;
    const etatCible = cible && roundDesEtats === roundDuPlateau ? etats[cible.id] : undefined;
    const restantes = etatCible ? actionsRestantes(etatCible) : undefined;

    const passive = defensePassive(facteurs);
    const issue = mode === 'passive' ? contreLaPassive(succes, passive) : active;

    const lancerLaDefense = () => {
        if (!cible) return;
        // Une défense active coûte une action ; la première du round reçoit l'Égo de l'initiative (p. 100, 102).
        const bonus = etatCible ? useRoundDeDegenesisStore.getState().depenser(cible.id) : 0;
        if (bonus === null) return;
        const traumatismes = champTraumatismes ? Math.max(0, Math.trunc(Number(ficheCible[champTraumatismes]) || 0)) : 0;
        const reserve = reserveDeDegenesis(sommeDesChamps(ficheCible, regle.defenses[genre]), { ego: bonus }, traumatismes);
        const d = lancerDegenesis(reserve, 1, de);
        const r = contreLActive(succes, { succes: d.degenesis.succes, six: d.degenesis.six }, genre, attaque.corpsACorps);
        setActive(r);
        setPorte(null);
        consigner(`${cible.name}, ${LIBELLES_DES_DEFENSES[genre]} (${reserve.des} dés${bonus ? `, +${bonus}D d’Égo` : ''}) : ${d.degenesis.des.join(' ')}. ${r.texte}`
            + (etatCible ? '' : ' Hors du round : aucune action décomptée.'));
    };

    const base = degatsLus?.base ?? Math.max(0, Math.trunc(Number(saisis) || 0));
    const coup = calculerLeCoup({ base, declencheurs: jet.degenesis.six, potentiels, armure: armure?.valeur ?? 0, proprietes });
    const porter = () => {
        if (!cible || coup.nets === 0) return;
        porterUnCoupDegenesis(cible, coup.nets, coup.piste);
        const texte = `Coup porté à ${cible.name} : ${coup.texte}.`;
        consigner(texte);
        setPorte(`Porté à ${cible.name} : ${coup.nets} → ${LIBELLES_DES_PISTES[coup.piste]}.`);
    };
    const basculer = (k: 'mortel' | 'etourdissement' | 'sonique' | 'penetration') => {
        setPorte(null);
        setProprietes(p => {
            if (k === 'mortel') return { ...p, mortel: !p.mortel };
            if (k === 'etourdissement') return p.etourdissement ? (({ etourdissement: _e, ...r }) => r)(p) : { ...p, etourdissement: {} };
            if (k === 'sonique') return p.sonique ? (({ sonique: _s, ...r }) => r)(p) : { ...p, sonique: lues.sonique ?? 'traumatismes' };
            return p.penetration !== undefined ? (({ penetration: _p, ...r }) => r)(p) : { ...p, penetration: lues.penetration ?? 0 };
        });
    };

    return (
        <div data-attaque-degenesis className="flex w-full flex-col gap-2 border-t border-app-border/30 pt-2 text-xs">
            <span className={etiquette}>Attaque</span>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"><span className={etiquette}>Cible</span>
                    <select aria-label="Cible de l’attaque" className={champ} value={cibleId} onChange={e => { setCibleId(e.target.value); setActive(null); setPorte(null); setArmureChoisie(''); }}>
                        <option value="">— choisir —</option>
                        {combattants.filter(c => c.id !== attaque.attaquantId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </label>
                <div role="group" aria-label="Défense de la cible" className="flex">
                    {(['passive', 'active'] as const).map(m => (
                        <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setPorte(null); }}
                            className={`${bouton} ${mode === m ? 'border-accent bg-accent/10 text-accent' : ''}`}>
                            Défense {m}
                        </button>
                    ))}
                </div>
            </div>
            {mode === 'passive' ? (
                <div className="flex flex-wrap items-center gap-3">
                    {(Object.keys(LIBELLES_DES_FACTEURS) as (keyof typeof LIBELLES_DES_FACTEURS)[]).map(k => (
                        <label key={k} className="flex items-center gap-1">
                            <input type="checkbox" checked={facteurs[k]} onChange={e => { setFacteurs(f => ({ ...f, [k]: e.target.checked })); setPorte(null); }} />
                            {LIBELLES_DES_FACTEURS[k].label} +{LIBELLES_DES_FACTEURS[k].valeur}
                        </label>
                    ))}
                    <label className="flex items-center gap-1">Divers
                        <input aria-label="Défense, divers" type="number" className={`w-12 ${champ}`} value={facteurs.divers}
                            onChange={e => setFacteurs(f => ({ ...f, divers: entier(e.target.value) }))} />
                    </label>
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-3">
                    <select aria-label="Défense active" className={champ} value={genre} onChange={e => { setGenre(e.target.value as GenreDeDefense); setActive(null); }}>
                        {DEFENSES.filter(g => regle.defenses[g]?.length && (attaque.corpsACorps || g === 'esquive')).map(g => (
                            <option key={g} value={g}>{LIBELLES_DES_DEFENSES[g]} ({sommeDesChamps(ficheCible, regle.defenses[g])}D)</option>
                        ))}
                    </select>
                    <button type="button" className={bouton} disabled={!cible || restantes === 0} onClick={lancerLaDefense}>
                        Lancer la défense (1 action)
                    </button>
                    {cible && (
                        <span className="text-app-text/60">
                            {restantes === undefined ? `${cible.name} : hors du round` : `${cible.name} : ${restantes} action${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`}
                            {restantes === 0 ? ' — défense passive seulement (p. 102)' : ''}
                        </span>
                    )}
                </div>
            )}
            {issue && (
                <span data-issue-degenesis className={`rounded-md border px-2 py-1 ${issue.touche ? 'border-etat-succes/40' : 'border-app-border/40'}`}>{issue.texte}</span>
            )}

            {issue?.touche && (
                <div data-degats-degenesis className="flex flex-col gap-1.5 border-t border-app-border/30 pt-2">
                    <span className={etiquette}>Dégâts</span>
                    <span>
                        {arme ? `${texteDe(valeurs[arme.nom]) || 'Arme'} : ` : ''}
                        {degatsLus ? degatsLus.detail : (
                            <input aria-label="Dégâts de l’arme" type="number" min={0} placeholder="Dégâts" className={`w-16 ${champ}`} value={saisis}
                                onChange={e => { setSaisis(e.target.value); setPorte(null); }} />
                        )}
                        {` + ${jet.degenesis.six} déclencheur${jet.degenesis.six > 1 ? 's' : ''} + Potentiels `}
                        <input aria-label="Dégâts des Potentiels" type="number" className={`w-12 ${champ}`} value={potentiels}
                            onChange={e => { setPotentiels(entier(e.target.value)); setPorte(null); }} />
                        {' = '}<strong>{coup.bruts}</strong>
                    </span>
                    <div className="flex flex-wrap items-center gap-2" title="Lues dans les propriétés et les dégâts de l'arme (p. 155-156, 160) ; à décocher si la fiche se trompe.">
                        {([
                            ['mortel', 'Mortel', proprietes.mortel],
                            ['penetration', `Pénétration${proprietes.penetration !== undefined ? ` (${proprietes.penetration})` : ''}`, proprietes.penetration !== undefined],
                            ['etourdissement', 'Étourdissement', !!proprietes.etourdissement],
                            ['sonique', `Sonique${proprietes.sonique ? ` (${proprietes.sonique === 'ego' ? 'Égo' : 'Traumatismes'})` : ''}`, !!proprietes.sonique],
                        ] as const).map(([k, label, coche]) => (
                            <label key={k} className="flex items-center gap-1 rounded border border-app-border/40 px-1.5 py-0.5">
                                <input type="checkbox" checked={coche} onChange={() => basculer(k)} />{label}
                            </label>
                        ))}
                        {proprietes.penetration !== undefined && (
                            <input aria-label="Pénétration" type="number" min={0} className={`w-12 ${champ}`} value={proprietes.penetration}
                                onChange={e => setProprietes(p => ({ ...p, penetration: Math.max(0, entier(e.target.value)) }))} />
                        )}
                    </div>
                    <label className="flex flex-wrap items-center gap-1"><span className={etiquette}>Armure de la cible</span>
                        <select aria-label="Armure de la cible" className={champ} value={armure ? String(armure.i) : 'aucune'} onChange={e => { setArmureChoisie(e.target.value); setPorte(null); }}>
                            {armures.map(a => <option key={a.i} value={String(a.i)}>{a.nom} ({a.valeur})</option>)}
                            <option value="aucune">Aucune</option>
                        </select>
                        <span className="italic text-app-text/50">Une seule armure compte : elles ne s’additionnent pas.</span>
                    </label>
                    <span data-coup-degenesis className="rounded-md border border-app-border/40 px-2 py-1">{coup.texte}</span>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className={bouton} disabled={!cible || coup.nets === 0} onClick={porter}
                            title="Les dégâts nets vont aux pistes de la cible : Blessures superficielles puis Traumatismes, ou l'Égo (p. 107).">
                            Porter le coup{cible ? ` à ${cible.name}` : ''}
                        </button>
                        {porte && <span className="font-bold">{porte}</span>}
                    </div>
                </div>
            )}
        </div>
    );
};
