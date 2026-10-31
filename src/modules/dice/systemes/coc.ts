import type { DieResult, RollResult } from '../DiceEngine';
import type { DegreDeReussite } from '../degresDeReussite';

/**
 * **Le test de Chroniques Oubliées Contemporain** — 31/10/2026, à la demande de David
 * (« finir le pilote », livre de règles de la 2e édition, pages **imprimées**, PDF − 3).
 *
 * Le pilote forgé comparait chaque d20 à l'Agilité plus l'Intelligence et exigeait dix
 * réussites d'un seul dé : tout test échouait ; il comptait aussi un 1 pour deux réussites
 * et un 20 pour une complication. Le livre additionne : **d20 + caractéristique +
 * modificateurs, réussi si le total atteint la difficulté** (5 à 25, p. 56-58). Un 20
 * naturel est une réussite critique, un 1 naturel un échec critique, et leur plage peut
 * s'élargir (18-20, 1-3, p. 58-59). Dé bonus et dé malus : deux d20, le meilleur ou le
 * pire, sans cumul et s'annulant (p. 59).
 *
 * **L'option du 3d6** (p. 60-61), réglable dans le pilote à la demande de David : trois d6
 * additionnés (quatre en gardant les trois meilleurs avec un dé bonus, deux seulement avec
 * un dé malus), difficultés 8 à 20, modificateurs de 2, 5 et 10 ramenés à 1, 3 et 5, ceux
 * des échelles (1, 3, 5, 10) à 1, 2, 3 et 5.
 *
 * Tout ici est pur : des dés et des nombres entrent, un résultat sort. Le panneau de jet
 * lance les dés et écrit sur la fiche, jamais ce module.
 */

export type DesDeCoc = 'd20' | '3d6';

/** Ce que le pilote nomme pour COC (`jet.coc`). */
export interface RegleDeCoc {
    /** Le d20, ou l'option du 3d6 (p. 60). Absent : le d20. */
    des?: DesDeCoc;
    /** L'échelle de santé (échelons noircis, 0 à 20) : son état pèse sur les actions physiques (p. 71-72). */
    sante?: string;
    /** Les champs dont le test est une action physique — les caractéristiques et les attaques. */
    physiques?: string[];
    /** Les champs d'attaque — ATC, ATD, le bonus de chaque arme : la difficulté est la DEF de la cible (p. 87). */
    attaques?: string[];
    /** L'échelle d'évolution et le champ qui dit son modèle (« Héros », « Blues », p. 80-84). */
    evolution?: { champ: string; modele?: string };
    /** La Volonté : le blues l'aide d'office (p. 84). */
    volonte?: string;
}

/** La table des difficultés (p. 58), et celle de l'option du 3d6 (p. 61). */
export const DIFFICULTES_DE_COC: Record<DesDeCoc, readonly { valeur: number; label: string }[]> = {
    d20: [
        { valeur: 5, label: 'Très facile' }, { valeur: 10, label: 'Facile' }, { valeur: 15, label: 'Moyenne' },
        { valeur: 20, label: 'Difficile' }, { valeur: 25, label: 'Très difficile' },
    ],
    '3d6': [
        { valeur: 8, label: 'Très facile' }, { valeur: 11, label: 'Facile' }, { valeur: 14, label: 'Moyenne' },
        { valeur: 17, label: 'Difficile' }, { valeur: 20, label: 'Très difficile' },
    ],
};

/** Ramène un modificateur du livre à l'option du 3d6 : 2, 5, 10 → 1, 3, 5 (p. 60). */
export function auTroisD6(valeur: number, des: DesDeCoc): number {
    if (des === 'd20') return valeur;
    const signe = Math.sign(valeur), v = Math.abs(valeur);
    return signe * (v >= 10 ? 5 : v >= 5 ? 3 : v >= 2 ? 1 : v);
}

/** Les modificateurs des échelles, 1, 3, 5, 10 → 1, 2, 3, 5 au 3d6 (p. 60). */
export function echelleAuTroisD6(valeur: number, des: DesDeCoc): number {
    if (des === 'd20') return valeur;
    const signe = Math.sign(valeur), v = Math.abs(valeur);
    return signe * (v >= 10 ? 5 : v >= 5 ? 3 : v >= 3 ? 2 : v);
}

/**
 * Les conditions favorables et défavorables se cumulent et se compensent : une de reste,
 * +2 ou −2 ; deux, ±5 ; trois et plus, ±10, jamais au-delà (p. 87-88).
 */
export function bonusDesConditions(solde: number, des: DesDeCoc = 'd20'): number {
    const n = Math.trunc(solde) || 0;
    const v = Math.abs(n) >= 3 ? 10 : Math.abs(n) === 2 ? 5 : Math.abs(n) === 1 ? 2 : 0;
    return auTroisD6(Math.sign(n) * v, des);
}

/** Les états de santé de l'échelle (p. 71-72) : malus à l'Init., à la DEF et aux actions physiques. */
export const ETATS_DE_SANTE = [
    { echelon: 5, label: 'Contusionné', malus: 1, guerison: 0 },
    { echelon: 10, label: 'Affaibli', malus: 3, guerison: 10 },
    { echelon: 15, label: 'Blessé', malus: 5, guerison: 15 },
    { echelon: 20, label: 'Mourant', malus: 10, guerison: 20 },
] as const;

/** L'état de santé atteint à tant d'échelons noircis ; les malus ne se cumulent pas (p. 71). */
export function etatDeSante(echelons: number): (typeof ETATS_DE_SANTE)[number] | undefined {
    return [...ETATS_DE_SANTE].reverse().find(e => echelons >= e.echelon);
}

/** Le malus de l'état de santé, positif — 0 en bonne santé. */
export function malusDeSante(echelons: number, des: DesDeCoc = 'd20'): number {
    return echelleAuTroisD6(etatDeSante(Math.trunc(echelons) || 0)?.malus ?? 0, des);
}

/**
 * Les états préjudiciables qui pèsent sur un test (p. 64-65). Ils ne se cumulent pas : le
 * meneur retient le pire. Immobilisé, inconscient et surpris interdisent d'agir : ils ne
 * se lancent pas.
 */
export const ETATS_PREJUDICIABLES = [
    { id: 'fatigue', label: 'Fatigué', malus: 2, sur: 'tous les tests' },
    { id: 'epuise', label: 'Épuisé', malus: 5, sur: 'tous les tests' },
    { id: 'asphyxie', label: 'Asphyxié', malus: 5, sur: 'toutes les actions' },
    { id: 'ralenti', label: 'Ralenti', malus: 5, sur: 'les attaques' },
    { id: 'renverse', label: 'Renversé', malus: 5, sur: "l'attaque" },
    { id: 'aveugle-autre-sens', label: 'Aveuglé, un autre sens', malus: 5, sur: 'les actions de la vue' },
    { id: 'aveugle', label: 'Aveuglé', malus: 10, sur: 'les actions de la vue' },
] as const;

export type IdDEtat = (typeof ETATS_PREJUDICIABLES)[number]['id'] | '';

/** Les états de l'échelle du blues (p. 84) : + aux tests de VOL et de coercition, − aux autres interactions. */
export const ETATS_DU_BLUES = [
    { echelon: 5, label: 'Perturbé', valeur: 1 },
    { echelon: 10, label: 'Déstabilisé', valeur: 3 },
    { echelon: 15, label: 'Tourmenté', valeur: 5 },
    { echelon: 20, label: 'Cramé', valeur: 10 },
] as const;

export function etatDuBlues(echelon: number): (typeof ETATS_DU_BLUES)[number] | undefined {
    return [...ETATS_DU_BLUES].reverse().find(e => echelon >= e.echelon);
}

export type ModeleDEvolution = 'heros' | 'blues' | 'autre';

/** Le modèle de l'échelle, lu sur la fiche : « Héros », « Blues », ou une échelle d'univers. */
export function modeleDEvolution(valeur: unknown): ModeleDEvolution {
    const t = String(valeur ?? '').toLowerCase();
    return /blues/.test(t) ? 'blues' : /h[ée]ros/.test(t) ? 'heros' : 'autre';
}

/**
 * Ce que coûte et rapporte l'échelle du héros après un test (p. 81-82) : un échelon pour
 * +2 (palier 1, dès le premier échelon) ou +5 (palier 2, au 10e), deux pour doubler ; au
 * 20e, Légende : +10, qui ne se double pas.
 */
export function bonusDuHeros(echelon: number, des: DesDeCoc = 'd20'): { echelons: number; bonus: number; label: string }[] {
    const e = Math.trunc(echelon) || 0;
    if (e <= 0) return [];
    const palier = e >= 10 ? 5 : 2;
    const options = [
        { echelons: 1, bonus: auTroisD6(palier, des), label: e >= 10 ? 'Héros' : 'Aventurier' },
        ...(e >= 2 ? [{ echelons: 2, bonus: 2 * auTroisD6(palier, des), label: `${e >= 10 ? 'Héros' : 'Aventurier'}, doublé` }] : []),
    ];
    return e >= 20 ? [...options, { echelons: 1, bonus: auTroisD6(10, des), label: 'Légende' }] : options;
}

/** Ce que le joueur règle avant de lancer. */
export interface ChoixDeCoc {
    /** La difficulté, ou la DEF de la cible pour une attaque (p. 58, 87). */
    difficulte: number;
    /** Conditions favorables moins défavorables (p. 87). */
    conditions: number;
    /** Dés bonus et dés malus : ils ne se cumulent pas et s'annulent (p. 59). */
    bonus: number;
    malus: number;
    /** Les alliés qui aident : +2 chacun (p. 61). */
    aides: number;
    /** Ce que le meneur ajoute : rang de voie, sentiment, approche, avantage… */
    autre: number;
    /** Le pire état préjudiciable qui touche ce test (p. 64-65). */
    etat: IdDEtat;
    /** Le test est-il une action physique ? Absent : selon la caractéristique. */
    physique?: boolean;
    /** Le blues joue-t-il : + sur la VOL et la coercition, − sur les autres interactions (p. 84) ? Absent : sur la VOL seule. */
    blues?: 'aucun' | 'plus' | 'moins';
    /** La plage de réussite critique commence à… (20, 18 avec « Cibler » ou un fusil de précision, p. 58, 90, 94). */
    critiqueDes?: number;
    /** La plage d'échec critique va jusqu'à… (1, 3 face à un événement de rang 2, p. 77). */
    echecJusqua?: number;
    /** Lancer, prendre son temps (10, p. 59), ou la réussite automatique du mode rapide et furieux (p. 59). */
    facon: 'lancer' | 'temps' | 'rapide';
}

export const CHOIX_DE_COC: ChoixDeCoc = { difficulte: 15, conditions: 0, bonus: 0, malus: 0, aides: 0, autre: 0, etat: '', facon: 'lancer' };

export interface PreparationDeCoc {
    des: DesDeCoc;
    /** La valeur de la caractéristique, de l'attaque ou de l'arme retenue. */
    base: number;
    /** Chaque modificateur, nommé, pour se relire : « Blessé −5 », « 2 aides +4 ». */
    modificateurs: { label: string; valeur: number }[];
    /** Tout ce qui s'ajoute au dé : la base et les modificateurs. */
    total: number;
    difficulte: number;
    /** Le solde des dés bonus et malus : positif, un dé bonus ; négatif, un dé malus. */
    solde: number;
    critiqueDes: number;
    echecJusqua: number;
    facon: ChoixDeCoc['facon'];
}

const entier = (v: unknown) => { const n = Math.trunc(Number(v)); return Number.isFinite(n) ? n : 0; };

/** Prépare le test : la base retenue, les modificateurs du livre, la difficulté et les plages. */
export function preparerCoc(
    regle: RegleDeCoc,
    choix: ChoixDeCoc,
    base: { valeur: number; champ?: string },
    valeurs: Record<string, unknown>,
): PreparationDeCoc {
    const des: DesDeCoc = regle.des === '3d6' ? '3d6' : 'd20';
    const modificateurs: { label: string; valeur: number }[] = [];
    const ajouter = (label: string, valeur: number) => { if (valeur) modificateurs.push({ label, valeur }); };

    const conditions = entier(choix.conditions);
    ajouter(`${Math.abs(conditions)} condition${Math.abs(conditions) > 1 ? 's' : ''} ${conditions > 0 ? 'favorable' : 'défavorable'}${Math.abs(conditions) > 1 ? 's' : ''}`,
        bonusDesConditions(conditions, des));
    const aides = Math.max(0, entier(choix.aides));
    ajouter(`${aides} aide${aides > 1 ? 's' : ''}`, aides * auTroisD6(2, des));
    const etat = ETATS_PREJUDICIABLES.find(e => e.id === choix.etat);
    if (etat) ajouter(etat.label, -auTroisD6(etat.malus, des));

    const physique = choix.physique ?? (!!base.champ && (regle.physiques ?? []).includes(base.champ));
    const echelons = regle.sante ? entier(valeurs[regle.sante]) : 0;
    const sante = etatDeSante(echelons);
    if (physique && sante) ajouter(sante.label, -malusDeSante(echelons, des));

    if (regle.evolution && modeleDEvolution(valeurs[regle.evolution.modele ?? '']) === 'blues') {
        const blues = etatDuBlues(entier(valeurs[regle.evolution.champ]));
        const sens = choix.blues ?? (base.champ && base.champ === regle.volonte ? 'plus' : 'aucun');
        if (blues && sens !== 'aucun') ajouter(`Blues : ${blues.label}`, (sens === 'plus' ? 1 : -1) * echelleAuTroisD6(blues.valeur, des));
    }
    ajouter('Autre', entier(choix.autre));

    const valeurDeBase = entier(base.valeur);
    const naturelMax = des === 'd20' ? 20 : 18;
    const naturelMin = des === 'd20' ? 1 : 3;
    return {
        des,
        base: valeurDeBase,
        modificateurs,
        total: valeurDeBase + modificateurs.reduce((s, m) => s + m.valeur, 0),
        difficulte: entier(choix.difficulte),
        solde: Math.sign(Math.max(0, entier(choix.bonus)) - Math.max(0, entier(choix.malus))),
        critiqueDes: Math.min(naturelMax, Math.max(naturelMin + 1, choix.critiqueDes ? entier(choix.critiqueDes) : naturelMax)),
        echecJusqua: Math.max(naturelMin, Math.min(naturelMax - 1, choix.echecJusqua ? entier(choix.echecJusqua) : naturelMin)),
        facon: choix.facon,
    };
}

export type BilanDeCoc = 'reussite-critique' | 'reussite' | 'echec' | 'echec-critique';

export const LIBELLES_DE_COC: Record<BilanDeCoc, string> = {
    'reussite-critique': 'Réussite critique',
    reussite: 'Réussite',
    echec: 'Échec',
    'echec-critique': 'Échec critique',
};

const DEGRES: Record<BilanDeCoc, DegreDeReussite> = {
    'reussite-critique': 'reussite-particuliere',
    reussite: 'reussite-normale',
    echec: 'echec-normal',
    'echec-critique': 'echec-total',
};

export interface JetDeCoc extends RollResult {
    coc: {
        des: number[];
        /** Les positions des dés gardés. */
        gardes: number[];
        /** Le résultat naturel : le d20 gardé, ou la somme des d6 gardés ; 10 pour qui prend son temps. */
        naturel: number;
        total: number;
        resultat: number;
        difficulte: number;
        bilan: BilanDeCoc;
        libelle: string;
        /** Ce que l'échelle du héros a ajouté après le jet (p. 81). */
        heros: number;
        facon: ChoixDeCoc['facon'];
        /** La marge sur la difficulté : les indices d'une recherche à seuils (p. 68). */
        marge: number;
    };
}

const signe = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);

/** Les dés gardés : le meilleur ou le pire d20 ; au 3d6, les trois meilleurs de quatre ou deux d6 (p. 59-60). */
export function desGardes(des: readonly number[], solde: number, mode: DesDeCoc): number[] {
    const ordre = des.map((v, i) => ({ v, i }));
    if (mode === 'd20') {
        if (solde === 0 || des.length < 2) return [0];
        ordre.sort((a, b) => (solde > 0 ? b.v - a.v : a.v - b.v) || a.i - b.i);
        return [ordre[0].i];
    }
    if (solde > 0) {
        ordre.sort((a, b) => b.v - a.v || a.i - b.i);
        return ordre.slice(0, 3).map(d => d.i).sort((a, b) => a - b);
    }
    return des.map((_, i) => i);
}

/** Combien de dés lancer : un d20, deux avec un dé bonus ou malus ; 3d6, 4d6 ou 2d6. */
export function nombreDeDesDeCoc(solde: number, mode: DesDeCoc): { nombre: number; faces: number } {
    if (mode === 'd20') return { nombre: solde === 0 ? 1 : 2, faces: 20 };
    return { nombre: solde > 0 ? 4 : solde < 0 ? 2 : 3, faces: 6 };
}

function rendre(prep: PreparationDeCoc, des: number[], gardes: number[], naturel: number, heros: number, rolls: DieResult[]): JetDeCoc {
    const resultat = naturel + prep.total + heros;
    const lance = prep.facon === 'lancer';
    // Un 20 naturel réussit et un 1 naturel échoue, quel que soit le total (p. 58) ; qui ne lance pas n'en obtient aucun (p. 59).
    const bilan: BilanDeCoc = lance && naturel >= prep.critiqueDes ? 'reussite-critique'
        : lance && naturel <= prep.echecJusqua ? 'echec-critique'
        : resultat >= prep.difficulte ? 'reussite' : 'echec';
    const libelle = LIBELLES_DE_COC[bilan];
    const reussi = bilan === 'reussite' || bilan === 'reussite-critique';
    const naturelDit = prep.facon === 'temps' ? '10 (pris son temps)' : `${naturel}`;
    return {
        total: resultat,
        rolls,
        modifier: prep.total + heros,
        successes: reussi ? 1 : 0,
        fails: 0,
        tagSuccess: reussi,
        degre: DEGRES[bilan],
        totalDisplay: prep.facon === 'rapide'
            ? `${libelle} automatique — ${prep.total} contre ${prep.difficulte}, sans lancer (mode rapide et furieux)`
            : `${libelle} — ${naturelDit} ${signe(prep.total)}${heros ? ` ${signe(heros)} (héros)` : ''} = ${resultat} contre ${prep.difficulte}`,
        coc: { des, gardes, naturel, total: prep.total, resultat, difficulte: prep.difficulte, bilan, libelle, heros, facon: prep.facon, marge: resultat - prep.difficulte },
    };
}

/** Résout un test déjà lancé. */
export function resoudreCoc(prep: PreparationDeCoc, des: readonly number[], heros = 0): JetDeCoc {
    if (prep.facon !== 'lancer') {
        // Prendre son temps : 10 et les modificateurs ; le mode rapide : le total seul, réussi s'il atteint la difficulté.
        return rendre(prep, [], [], prep.facon === 'temps' ? 10 : 0, heros, []);
    }
    const faces = prep.des === 'd20' ? 20 : 6;
    const gardes = desGardes(des, prep.solde, prep.des);
    const naturel = gardes.reduce((s, i) => s + des[i], 0);
    const critique = naturel >= prep.critiqueDes, echec = naturel <= prep.echecJusqua;
    const rolls: DieResult[] = des.map((v, i) => {
        const garde = gardes.includes(i);
        return { val: v, sides: faces, isDropped: !garde, isCritMax: garde && critique, isCritMin: garde && echec && !critique };
    });
    return rendre(prep, [...des], gardes, naturel, heros, rolls);
}

/** Lance et résout : `de` rend un dé de `faces` (le panneau lui passe le moteur). */
export function lancerCoc(prep: PreparationDeCoc, de: (faces: number) => number): JetDeCoc {
    // La réussite automatique ne s'offre qu'à qui atteint déjà la difficulté (p. 59) : sinon, on lance.
    if (prep.facon === 'rapide' && prep.total < prep.difficulte) prep = { ...prep, facon: 'lancer' };
    if (prep.facon !== 'lancer') return resoudreCoc(prep, []);
    const { nombre, faces } = nombreDeDesDeCoc(prep.solde, prep.des);
    return resoudreCoc(prep, Array.from({ length: nombre }, () => de(faces)));
}

/**
 * L'échelle du héros après le test : « +2 à un test qu'il vient d'effectuer » (p. 82). Le
 * naturel ne change pas — un 1 reste un échec critique —, le total peut franchir la
 * difficulté.
 */
export function ajouterLeHeros(jet: JetDeCoc, prep: PreparationDeCoc, bonus: number): JetDeCoc {
    const c = jet.coc;
    if (c.facon !== 'lancer' && c.facon !== 'temps') return jet;
    return rendre({ ...prep, facon: c.facon }, c.des, c.gardes, c.naturel, c.heros + bonus, jet.rolls);
}

/**
 * **Ce qu'un coup fait à l'échelle de santé** (p. 71-73, 88) : la RD de la protection se
 * retire des DM ; au-delà de 20 + CON en une fois, le personnage est tué sur le coup ; un
 * coup reçu alors qu'il est déjà mourant demande un test de CON 20.
 */
export function encaisserCoc(dm: number, rd: number, avant: number, constitution: number, nombre = 20): {
    subis: number; apres: number; mortInstantanee: boolean; coupDeGrace: boolean;
    franchis: (typeof ETATS_DE_SANTE)[number][];
} {
    const subis = Math.max(0, Math.trunc(dm) - Math.max(0, Math.trunc(rd) || 0));
    const mortInstantanee = subis > 20 + (Math.trunc(constitution) || 0);
    const apres = mortInstantanee ? nombre : Math.min(nombre, avant + subis);
    return {
        subis, apres, mortInstantanee,
        coupDeGrace: subis > 0 && avant >= nombre,
        franchis: ETATS_DE_SANTE.filter(e => avant < e.echelon && apres >= e.echelon),
    };
}

/** Ce que le livre dit en franchissant un état de santé (p. 72). */
export const EFFETS_DES_ETATS: Record<string, string> = {
    Contusionné: '−1 en Init., en DEF et aux actions physiques',
    Affaibli: '−3 ; test de CON difficulté 10 pour ne pas perdre sa prochaine action',
    Blessé: '−5, déplacements réduits de moitié ; il perd sa prochaine action et fait un test de CON 15 — échec : inconscient 1d6 rounds',
    Mourant: '−10 et plus de déplacement ; inconscient 1d6 rounds, puis test de CON 20 — échec : coma, puis mort au bout de CON minutes sans stabilisation',
};
