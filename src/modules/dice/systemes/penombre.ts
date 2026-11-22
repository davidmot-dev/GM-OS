import type { DieResult, RollResult } from '../DiceEngine';
import type { DegreDeReussite } from '../degresDeReussite';

/**
 * **Le jet de Pénombre** — 22/11/2026, à la demande de David (« oui je joue à Pénombre, fais
 * tout dans l'ordre »). Livre de base Æther Labs, pages imprimées = pages du PDF.
 *
 * Le pilote forgé écrivait ses dés « 1d harmonique + 1-3d atout », que le moteur ne lit pas :
 * chaque jet rendait des dés vides et un total `NaN`. Le livre compose une réserve de dés de
 * tailles différentes et lit **chaque dé à part** (p. 31) :
 *
 * - le **dé harmonique** de l'harmonique désignée par l'action, de D4 à D12 (p. 28, 54) ;
 * - autant de **D6** que le niveau d'**un** atout (1 à 3) ; chaque atout de plus coûte 1 jeton ;
 * - tenter des merveilles remplace le dé harmonique par le **D20 merveilleux**, pour 1 jeton ;
 * - chaque dé donne **1 succès par tranche de 4** (4-7 : 1 … 20 : 5) ; réussite si les succès
 *   égalent la difficulté, sinon réussite mitigée, prolongation ou échec (p. 32-33) ;
 * - fausse note, envolée, incident magique et merveille, même après une relance (p. 34-37).
 *
 * Tout ici est pur : des dés et des nombres entrent, un résultat sort. Le panneau de jet lance
 * les dés, débite les jetons et écrit sur la fiche, jamais ce module.
 */

/** Les cinq harmoniques, dans l'ordre du livre (p. 28). */
export const HARMONIQUES = ['ame', 'esprit', 'etincelle', 'nature', 'nuit'] as const;
export type Harmonique = typeof HARMONIQUES[number];

export const LIBELLES_DES_HARMONIQUES: Record<Harmonique, string> = {
    ame: 'Âme', esprit: 'Esprit', etincelle: 'Étincelle', nature: 'Nature', nuit: 'Nuit',
};

/** Ce que le pilote nomme pour Pénombre (`jet.penombre`). */
export interface RegleDePenombre {
    /** Le champ de chaque harmonique : il porte « D4 » à « D12 » (p. 22, 54). */
    harmoniques: Record<Harmonique, string>;
    /** La composante du seuil qui désigne l'harmonique de l'action (`jet.seuil`). */
    composanteHarmonique: string;
    /** La composante facultative de l'atout gratuit ; absente : pas d'atout gratuit au menu. */
    composanteAtout?: string;
    /** Les champs de niveau des atouts (1 à 3), avec le champ de leur intitulé. */
    atouts: { niveau: string; libelle?: string }[];
    /** Le champ de la clé, en texte (« nature », « Âme ») : une merveille de la clé donne un pouvoir (p. 36). */
    cle?: string;
    /**
     * Les jetons conscience (p. 24-25) : `restants` ceux qui ne sont pas perdus (actifs et
     * inactifs), `actifs` ceux qu'on peut encore dépenser, `max` la valeur de conscience.
     */
    conscience?: { restants: string; actifs: string; max: string };
    /** Le champ du timbre : « harmonieux », « faux » ou « dissonant » (p. 23, 46). */
    timbre?: string;
    /** La partition : la case « clé » et les quatre cases « note » (p. 36). */
    partition?: { cle: string; notes: string[] };
    /** L'identifiant de la réserve collégiale parmi les ressources de table (p. 24). */
    reserveCollegiale?: string;
    /**
     * L'identifiant de la ressource de table, hors du bandeau, qui porte la **taille** de la réserve
     * collégiale — 10, 5 ou 0 selon les timbres du groupe — et lui sert de plafond (`maxSur`).
     */
    tailleCollegiale?: string;
    /** Le champ du nom de la peste : rempli, l'Éminence grise est pestiférée (p. 103). */
    peste?: string;
}

/** Un effet magique ajouté à l'action (p. 29-30). */
export interface EffetMagiqueDePenombre {
    /** Le niveau de l'effet, 1 à 5. */
    niveau: number;
    /** Le niveau de maîtrise de l'Éminence grise dans cette magie : chaque niveau manquant coûte 1 jeton. */
    maitrise: number;
    cible: 'mortel' | 'groupe' | 'foule';
    distance: 'proche' | 'lointain' | 'hors-champ';
    prerequis: 'action' | 'tour' | 'deux-tours' | 'rituel';
    /** L'effet est-il l'objectif principal de l'action ? Alors sa difficulté remplace celle de l'action (p. 30). */
    principal: boolean;
}

/** Ce que le joueur règle avant de lancer. */
export interface ChoixDePenombre {
    /** La difficulté annoncée, sur l'échelle du livre (p. 30). */
    difficulte: number;
    /** Les éléments avantageux (−1 chacun) et désavantageux (+1 chacun) (p. 30). */
    avantages: number;
    desavantages: number;
    /** Les champs des atouts mobilisés en plus de l'atout gratuit : 1 jeton chacun (p. 31). */
    atoutsEnPlus: string[];
    /** Tenter des merveilles : le D20 remplace le dé harmonique, 1 jeton (p. 31). */
    merveilles: boolean;
    /** Rendre l'action collégiale : 1 jeton (p. 29). Les succès des autres participants s'ajoutent à la main. */
    collegiale: boolean;
    /** Un effet magique : 1 jeton, plus 1 par niveau de maîtrise manquant (p. 29). */
    magie: EffetMagiqueDePenombre | null;
    /** Les succès ajoutés ou retirés : modification, riposte (+1), participants d'une action collégiale (p. 34, 44-45). */
    succesEnPlus: number;
    /** Qui paie les jetons : la conscience de l'Éminence grise, ou la réserve collégiale (p. 24). */
    payeur: 'conscience' | 'collegiale';
}

export const CHOIX_DE_PENOMBRE: ChoixDePenombre = {
    difficulte: 1, avantages: 0, desavantages: 0, atoutsEnPlus: [], merveilles: false,
    collegiale: false, magie: null, succesEnPlus: 0, payeur: 'conscience',
};

/** L'échelle des difficultés du livre, de la plus aisée à la plus haute (p. 30). */
export const DIFFICULTES_DE_PENOMBRE = [
    { valeur: 1, label: 'Par défaut' },
    { valeur: 2, label: 'Difficile' },
    { valeur: 3, label: 'Très difficile' },
    { valeur: 4, label: 'Exceptionnelle' },
    { valeur: 6, label: 'Phénoménale' },
    { valeur: 8, label: 'Inouïe' },
    { valeur: 10, label: 'Surréaliste' },
    { valeur: 12, label: 'Digne d’une fable' },
    { valeur: 16, label: 'Digne d’un mythe' },
    { valeur: 20, label: 'Digne d’une muse' },
] as const;

/** Les succès d'un dé : un par tranche de 4 (p. 31). */
export function succesDuDe(valeur: number): number {
    return Math.max(0, Math.floor((Math.trunc(valeur) || 0) / 4));
}

const sansAccents = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim();

const FACES_EN_LETTRES: Record<string, number> = { quatre: 4, six: 6, huit: 8, dix: 10, douze: 12 };

/**
 * Le nombre de faces d'un dé harmonique, ou `null`. La fiche porte « D8 » ; le pilote forgé
 * écrivait « dé à huit faces » : les deux se lisent. Seuls D4, D6, D8, D10 et D12 existent —
 * « un dé harmonique ne peut jamais être supérieur au D12 » (p. 102).
 */
export function facesDuDeHarmonique(valeur: unknown): number | null {
    if (typeof valeur === 'number') return [4, 6, 8, 10, 12].includes(valeur) ? valeur : null;
    const brut = sansAccents(String(valeur ?? ''));
    if (!brut) return null;
    const chiffre = /^(?:1?d)?\s*(4|6|8|10|12)$/.exec(brut)?.[1];
    if (chiffre) return Number(chiffre);
    const lettres = Object.keys(FACES_EN_LETTRES).find(m => new RegExp(`\\b${m}\\b`).test(brut) && /face/.test(brut));
    return lettres ? FACES_EN_LETTRES[lettres] : null;
}

/** L'harmonique qu'un texte désigne (« Âme », « étincelle », « nuit »), ou `null`. */
export function harmoniqueNommee(texte: unknown): Harmonique | null {
    const brut = sansAccents(String(texte ?? ''));
    return HARMONIQUES.find(h => brut === h || brut.startsWith(h)) ?? null;
}

/** L'état de la conscience (p. 25, 46). */
export type EtatDeLaConscience = 'determinee' | 'troublee' | 'epuisee';

export const LIBELLES_DES_ETATS: Record<EtatDeLaConscience, string> = {
    determinee: 'Déterminée', troublee: 'Troublée', epuisee: 'Épuisée',
};

export interface Conscience {
    /** Les jetons qui ne sont pas perdus, actifs et inactifs. */
    restants: number;
    /** Les jetons actifs, jamais plus que les restants. */
    actifs: number;
    /** La valeur de conscience. */
    max: number;
}

const entier = (v: unknown, defaut = 0) => {
    const n = Math.trunc(Number(v));
    return Number.isFinite(n) ? n : defaut;
};

/** La conscience lue sur la fiche, bornée : 0 ≤ actifs ≤ restants ≤ max. */
export function lireLaConscience(regle: RegleDePenombre, valeurs: Record<string, unknown>): Conscience | null {
    const c = regle.conscience;
    if (!c) return null;
    const max = Math.max(0, entier(valeurs[c.max], 7));
    const restants = Math.min(max, Math.max(0, entier(valeurs[c.restants], max)));
    const actifs = Math.min(restants, Math.max(0, entier(valeurs[c.actifs], restants)));
    return { restants, actifs, max };
}

/** Déterminée avec un jeton actif, troublée sans jeton actif, épuisée sans jeton (p. 25). */
export function etatDeLaConscience(c: Conscience): EtatDeLaConscience {
    if (c.restants <= 0) return 'epuisee';
    return c.actifs <= 0 ? 'troublee' : 'determinee';
}

/** Dépenser : retourner des jetons actifs (p. 24). Rend `null` s'il n'y en a pas assez. */
export function depenserDesJetons(c: Conscience, n: number): Conscience | null {
    if (n <= 0) return c;
    return c.actifs >= n ? { ...c, actifs: c.actifs - n } : null;
}

/** Perdre : retirer des jetons, les inactifs d'abord (p. 24). Jamais en dessous de zéro. */
export function perdreDesJetons(c: Conscience, n: number): Conscience {
    if (n <= 0) return c;
    const inactifs = c.restants - c.actifs;
    const restants = Math.max(0, c.restants - n);
    const actifs = Math.max(0, c.actifs - Math.max(0, n - inactifs));
    return { ...c, restants, actifs: Math.min(actifs, restants) };
}

/** Réactiver un jeton dépensé (envolée, p. 34) : un inactif redevient actif. */
export function reactiverUnJeton(c: Conscience): Conscience {
    return { ...c, actifs: Math.min(c.restants, c.actifs + 1) };
}

/** La difficulté d'un effet magique, jamais sous son niveau (p. 30). */
export function difficulteDeLEffet(effet: EffetMagiqueDePenombre, avantages = 0, desavantages = 0): number {
    const niveau = Math.min(5, Math.max(1, entier(effet.niveau, 1)));
    const cible = effet.cible === 'groupe' ? niveau : effet.cible === 'foule' ? niveau * 2 : 0;
    const distance = effet.distance === 'lointain' ? 2 : effet.distance === 'hors-champ' ? 5 : 0;
    const prerequis = effet.prerequis === 'tour' ? -1 : effet.prerequis === 'deux-tours' ? -2 : effet.prerequis === 'rituel' ? -5 : 0;
    return Math.max(niveau, niveau + cible + distance + prerequis - Math.max(0, avantages) + Math.max(0, desavantages));
}

/** Un dé de la réserve. */
export interface DeDePenombre {
    role: 'harmonique' | 'merveilleux' | 'atout';
    faces: number;
    /** « Âme D8 », « D20 merveilleux », « Je connais mon métier ». */
    label: string;
}

/** La réserve composée, avant le lancer. */
export interface ReserveDePenombre {
    harmonique: { harmonique: Harmonique | null; champ: string; label: string; faces: number } | null;
    /** L'harmonique de l'action est-elle la clé ? Une merveille donne alors un pouvoir (p. 36). */
    estLaCle: boolean;
    merveilleux: boolean;
    atouts: { champ: string; label: string; niveau: number; paye: boolean }[];
    des: DeDePenombre[];
    difficulte: number;
    succesEnPlus: number;
    /** Les jetons à dépenser avant de lancer, et pourquoi (p. 29, 31). */
    cout: number;
    detailDuCout: string[];
    payeur: ChoixDePenombre['payeur'];
    /** L'état de la conscience avant le lancer ; `null` : le pilote ne nomme pas la conscience. */
    etat: EtatDeLaConscience | null;
    /** « Âme D8 + Je connais mon métier 2 », pour le titre du jet. */
    titre: string;
    avertissements: string[];
    remarques: string[];
}

/** L'intitulé d'un atout : son nom saisi, sinon l'intitulé du champ. */
function intituleDe(champ: string, regle: RegleDePenombre, valeurs: Record<string, unknown>, labels: Record<string, string>): string {
    const libelle = regle.atouts.find(a => a.niveau === champ)?.libelle;
    const nom = libelle ? String(valeurs[libelle] ?? '').trim() : '';
    return nom || labels[champ] || champ;
}

/**
 * Compose la réserve : le dé de l'harmonique retenue (ou le D20 merveilleux), les D6 de l'atout
 * gratuit et des atouts payés, la difficulté et le coût en jetons. Ne lance rien.
 */
export function composerLaReserveDePenombre(
    regle: RegleDePenombre,
    valeurs: Record<string, unknown>,
    champs: Record<string, string>,
    choix: Partial<ChoixDePenombre> | undefined,
    labels: Record<string, string> = {},
): ReserveDePenombre {
    const c: ChoixDePenombre = { ...CHOIX_DE_PENOMBRE, ...(choix ?? {}) };
    const avertissements: string[] = [];
    const remarques: string[] = [];
    const detailDuCout: string[] = [];

    const champH = champs[regle.composanteHarmonique];
    let harmonique: ReserveDePenombre['harmonique'] = null;
    if (!champH) avertissements.push('Harmonique : aucune retenue.');
    else {
        const faces = facesDuDeHarmonique(valeurs[champH]);
        const nommee = (Object.keys(regle.harmoniques) as Harmonique[]).find(h => regle.harmoniques[h] === champH) ?? null;
        const label = nommee ? LIBELLES_DES_HARMONIQUES[nommee] : labels[champH] ?? champH;
        if (faces === null) {
            const brut = valeurs[champH];
            avertissements.push(brut === undefined || brut === null || brut === ''
                ? `${label} : aucun dé harmonique sur la fiche (répartir D4, D6, D8, D10 et D12, p. 54).`
                : `${label} vaut « ${String(brut)} » : un dé harmonique est un D4, D6, D8, D10 ou D12 (p. 22, 102).`);
        } else harmonique = { harmonique: nommee, champ: champH, label, faces };
    }
    const cle = regle.cle ? harmoniqueNommee(valeurs[regle.cle]) : null;
    const estLaCle = !!harmonique?.harmonique && harmonique.harmonique === cle;

    const atouts: ReserveDePenombre['atouts'] = [];
    const gratuit = regle.composanteAtout ? champs[regle.composanteAtout] : undefined;
    const ajouterAtout = (champ: string, paye: boolean) => {
        if (atouts.some(a => a.champ === champ)) return;
        const niveau = Math.min(3, Math.max(0, entier(valeurs[champ])));
        const label = intituleDe(champ, regle, valeurs, labels);
        if (niveau <= 0) { remarques.push(`${label} : niveau 0, aucun dé.`); return; }
        atouts.push({ champ, label, niveau, paye });
        if (paye) detailDuCout.push(`atout supplémentaire « ${label} »`);
    };
    if (gratuit) ajouterAtout(gratuit, false);
    for (const champ of c.atoutsEnPlus) if (champ !== gratuit) ajouterAtout(champ, true);

    if (c.merveilles) detailDuCout.push('tenter des merveilles (D20)');
    if (c.collegiale) detailDuCout.push('action collégiale');
    let difficulte = Math.max(1, entier(c.difficulte, 1)) - Math.max(0, c.avantages) + Math.max(0, c.desavantages);
    if (c.magie) {
        detailDuCout.push('effet magique');
        const manque = Math.max(0, entier(c.magie.niveau, 1) - Math.max(0, entier(c.magie.maitrise)));
        for (let i = 0; i < manque; i++) detailDuCout.push('niveau de maîtrise manquant');
        if (c.magie.principal) {
            difficulte = difficulteDeLEffet(c.magie, c.avantages, c.desavantages);
            remarques.push(`Effet magique de niveau ${c.magie.niveau} : difficulté ${difficulte}, jamais sous le niveau de l'effet (p. 30).`);
        }
    }
    difficulte = Math.max(c.magie?.principal ? Math.max(1, entier(c.magie.niveau, 1)) : 0, difficulte);
    if (difficulte <= 0) remarques.push('Difficulté ramenée sous 1 par les éléments avantageux : le livre ne fixe pas de plancher (p. 30).');

    const des: DeDePenombre[] = [];
    if (c.merveilles) des.push({ role: 'merveilleux', faces: 20, label: 'D20 merveilleux' });
    else if (harmonique) des.push({ role: 'harmonique', faces: harmonique.faces, label: `${harmonique.label} D${harmonique.faces}` });
    for (const a of atouts) for (let i = 0; i < a.niveau; i++) des.push({ role: 'atout', faces: 6, label: a.label });

    const conscience = lireLaConscience(regle, valeurs);
    const etat = conscience ? etatDeLaConscience(conscience) : null;
    const cout = detailDuCout.length;
    if (etat === 'epuisee') avertissements.push('Épuisée : tous ses jetons sont perdus, elle ne peut plus entreprendre d’actions (p. 25, 47).');
    else if (etat === 'troublee' && cout > 0) avertissements.push('Troublée : tous ses jetons sont inactifs, elle ne profite plus des dépenses de jetons (p. 25).');
    else if (cout > 0 && c.payeur === 'conscience' && conscience && conscience.actifs < cout) {
        avertissements.push(`Il faut ${cout} jeton${cout > 1 ? 's' : ''} actif${cout > 1 ? 's' : ''} : la conscience n’en a que ${conscience.actifs}.`);
    }
    if (c.payeur === 'collegiale' && cout > 0 && regle.timbre && sansAccents(String(valeurs[regle.timbre] ?? '')).startsWith('dissonant')) {
        avertissements.push('Dissonante : elle ne peut plus dépenser de jetons collégiaux (p. 103).');
    }

    const titre = [
        c.merveilles ? `${harmonique ? `${harmonique.label} ` : ''}D20 merveilleux` : harmonique ? `${harmonique.label} D${harmonique.faces}` : 'Harmonique ?',
        ...atouts.map(a => `${a.label} ${a.niveau}`),
    ].join(' + ') + (c.collegiale ? ' · collégiale' : '') + (c.magie ? ` · effet magique ${c.magie.niveau}` : '');

    return {
        harmonique, estLaCle, merveilleux: c.merveilles, atouts, des, difficulte: Math.max(0, difficulte),
        succesEnPlus: entier(c.succesEnPlus), cout, detailDuCout, payeur: c.payeur, etat, titre, avertissements, remarques,
    };
}

/** Les conséquences supplémentaires d'un jet (p. 34-37). */
export interface ConsequencesDePenombre {
    /** 1 sur le dé harmonique : 1 jeton perdu (p. 34). */
    fausseNote: boolean;
    /** Le score maximal du dé harmonique : 1 jeton réactivé (p. 34). */
    envolee: boolean;
    /** 1 sur le dé merveilleux (p. 35). */
    incident: boolean;
    /** 20 sur le dé merveilleux (p. 36). */
    merveille: boolean;
}

export interface JetDePenombre extends RollResult {
    penombre: {
        des: (DeDePenombre & { val: number; succes: number })[];
        succes: number;
        succesEnPlus: number;
        difficulte: number;
        manquants: number;
        reussite: boolean;
        estLaCle: boolean;
        /** Les conséquences restent acquises même si le dé est relancé (p. 34). */
        consequences: ConsequencesDePenombre;
        relances: number;
        libelle: string;
    };
}

const AUCUNE: ConsequencesDePenombre = { fausseNote: false, envolee: false, incident: false, merveille: false };

function consequencesDes(des: readonly (DeDePenombre & { val: number })[]): ConsequencesDePenombre {
    const h = des.find(d => d.role === 'harmonique');
    const m = des.find(d => d.role === 'merveilleux');
    return {
        fausseNote: !!h && h.val === 1,
        envolee: !!h && h.val === h.faces,
        incident: !!m && m.val === 1,
        merveille: !!m && m.val === 20,
    };
}

function rendre(
    des: (DeDePenombre & { val: number })[], difficulte: number, succesEnPlus: number, estLaCle: boolean,
    acquises: ConsequencesDePenombre, relances: number,
): JetDePenombre {
    const lus = des.map(d => ({ ...d, succes: succesDuDe(d.val) }));
    const succes = Math.max(0, lus.reduce((s, d) => s + d.succes, 0) + succesEnPlus);
    const manquants = Math.max(0, difficulte - succes);
    const reussite = manquants === 0;
    const nouvelles = consequencesDes(des);
    const consequences: ConsequencesDePenombre = {
        fausseNote: acquises.fausseNote || nouvelles.fausseNote,
        envolee: acquises.envolee || nouvelles.envolee,
        incident: acquises.incident || nouvelles.incident,
        merveille: acquises.merveille || nouvelles.merveille,
    };
    const libelle = reussite ? 'Réussite' : `${manquants} succès manquant${manquants > 1 ? 's' : ''}`;
    const degre: DegreDeReussite = reussite ? 'reussite-normale' : 'echec-normal';
    const rolls: DieResult[] = lus.map(d => ({
        val: d.val, sides: d.faces,
        isCritMax: (d.role === 'harmonique' && d.val === d.faces) || (d.role === 'merveilleux' && d.val === 20),
        isCritMin: (d.role === 'harmonique' || d.role === 'merveilleux') && d.val === 1,
    }));
    const extras = [consequences.fausseNote && 'fausse note', consequences.envolee && 'envolée',
        consequences.incident && 'incident magique', consequences.merveille && 'merveille'].filter(Boolean);
    return {
        total: succes, modifier: succesEnPlus, rolls, successes: succes, fails: 0, tagSuccess: reussite, degre,
        totalDisplay: `${libelle} — ${succes} succès pour une difficulté de ${difficulte}${succesEnPlus ? ` (dont ${succesEnPlus > 0 ? '+' : ''}${succesEnPlus} ajouté${Math.abs(succesEnPlus) > 1 ? 's' : ''})` : ''}${extras.length ? ` ; ${extras.join(', ')}` : ''}`,
        penombre: { des: lus, succes, succesEnPlus, difficulte, manquants, reussite, estLaCle, consequences, relances, libelle },
    };
}

/** Lance la réserve : `de(faces)` rend un dé (le panneau lui passe le moteur). */
export function lancerPenombre(reserve: ReserveDePenombre, de: (faces: number) => number): JetDePenombre {
    const des = reserve.des.map(d => ({ ...d, val: de(d.faces) }));
    return rendre(des, reserve.difficulte, reserve.succesEnPlus, reserve.estLaCle, AUCUNE, 0);
}

/**
 * Relance les dés choisis, pour 1 jeton (p. 31). Les conséquences déjà obtenues restent
 * acquises : « elles sont prises en compte […] même si le dé est ensuite relancé » (p. 34).
 */
export function relancerPenombre(jet: JetDePenombre, rangs: readonly number[], de: (faces: number) => number): JetDePenombre {
    const p = jet.penombre;
    const des = p.des.map((d, i) => (rangs.includes(i) ? { role: d.role, faces: d.faces, label: d.label, val: de(d.faces) } : { role: d.role, faces: d.faces, label: d.label, val: d.val }));
    return rendre(des, p.difficulte, p.succesEnPlus, p.estLaCle, p.consequences, p.relances + 1);
}

/** Les trois issues d'un jet aux succès insuffisants, que le Psycholune choisit ou laisse choisir (p. 32-33). */
export type IssueDePenombre = 'mitigee' | 'prolongation' | 'echec';

export const LIBELLES_DES_ISSUES: Record<IssueDePenombre, string> = {
    mitigee: 'Réussite mitigée', prolongation: 'Prolongation', echec: 'Échec',
};

/** Ce que chaque issue coûte, en mots du livre. */
export function direLIssue(issue: IssueDePenombre, manquants: number): string {
    const n = `${manquants} jeton${manquants > 1 ? 's' : ''}`;
    if (issue === 'mitigee') return `Les succès manquants se paient : ${n} dépensé${manquants > 1 ? 's' : ''}, et l'action réussit de justesse (p. 32).`;
    if (issue === 'prolongation') return `${n} conscience perdu${manquants > 1 ? 's' : ''} (jamais de jeton collégial) ; une nouvelle action vise ${manquants} succès (p. 33).`;
    return "L'action échoue ; le Psycholune laisse ouverte une autre voie, jamais une impasse (p. 33).";
}

/** Le timbre lu sur la fiche (p. 23). */
export type Timbre = 'harmonieux' | 'faux' | 'dissonant';

export function lireLeTimbre(valeur: unknown): Timbre {
    const brut = sansAccents(String(valeur ?? ''));
    if (brut.startsWith('dissonant')) return 'dissonant';
    if (brut.startsWith('faux') || brut === 'false') return 'faux';
    return 'harmonieux';
}

/** La partition et le timbre, tels qu'une merveille les change. */
export interface EtatHarmonique {
    cle: boolean;
    notes: boolean[];
    timbre: Timbre;
    conscience: Conscience;
}

export interface EffetDeLaMerveille {
    apres: EtatHarmonique;
    /** L'harmonique de l'action est la clé : un pouvoir supplémentaire (p. 36). */
    pouvoir: boolean;
    /** La partition était complète : +1 en conscience et toutes les cases effacées (p. 36). */
    partitionComplete: boolean;
    texte: string[];
}

/**
 * Les conséquences harmoniques d'une merveille, l'arbre de la p. 37 : clé ou note cochée, timbre
 * qui se rétablit ou se dégrade, partition complète qui augmente la conscience.
 */
export function appliquerLaMerveille(avant: EtatHarmonique, estLaCle: boolean): EffetDeLaMerveille {
    const texte: string[] = [];
    let { cle, timbre } = avant;
    const notes = [...avant.notes];
    let conscience = { ...avant.conscience };
    if (estLaCle) {
        texte.push('L’harmonique de l’action est la clé : un pouvoir supplémentaire.');
        if (!cle) {
            cle = true;
            texte.push('Case « clé » cochée.');
            if (timbre === 'faux') { timbre = 'harmonieux'; texte.push('Le timbre faux redevient harmonieux.'); }
        } else if (timbre !== 'dissonant') { timbre = 'dissonant'; texte.push('La case « clé » était déjà cochée : le timbre devient dissonant.'); }
        else texte.push('La case « clé » était déjà cochée : le timbre reste dissonant.');
    } else {
        const libre = notes.findIndex(n => !n);
        if (libre >= 0) {
            notes[libre] = true;
            texte.push(`Case « note » ${libre + 1} cochée.`);
            if (timbre === 'dissonant') { timbre = 'harmonieux'; texte.push('Le timbre dissonant redevient harmonieux.'); }
        } else if (timbre !== 'faux') { timbre = 'faux'; texte.push('Toutes les notes étaient cochées : le timbre devient faux.'); }
        else texte.push('Toutes les notes étaient cochées : le timbre reste faux.');
    }
    const partitionComplete = cle && notes.length > 0 && notes.every(Boolean);
    if (partitionComplete) {
        conscience = { max: conscience.max + 1, restants: conscience.restants + 1, actifs: conscience.actifs + 1 };
        cle = false;
        notes.fill(false);
        texte.push(`Partition complète : conscience ${conscience.max - 1} → ${conscience.max}, toutes les cases effacées.`);
    }
    if (timbre !== avant.timbre) texte.push('Le timbre a changé : recompter la réserve collégiale (10, 5 ou aucun jeton, p. 24).');
    return { apres: { cle, notes, timbre, conscience }, pouvoir: estLaCle, partitionComplete, texte };
}

/** L'incident magique selon le timbre (p. 35, 103). */
export function direLIncident(timbre: Timbre, pestiferee: boolean): string {
    if (timbre === 'dissonant' || pestiferee) {
        return 'Incident magique d’une Éminence grise dissonante ou pestiférée : le joueur choisit un personnage, contaminé par la peste harmonique de sa clé (p. 35, 103).';
    }
    return 'Incident magique : le Psycholune imagine un événement inattendu, marquant, potentiellement désastreux, d’après la situation, la magie ou le peuple (p. 35).';
}

/**
 * La taille de la réserve collégiale (p. 24, 102) : 10 jetons si toutes les Éminences grises sont
 * harmonieuses, 5 si une au moins est fausse, aucun si une au moins est dissonante. La variante
 * « réserve héroïque » compte 2, 1 ou 0 jeton par Éminence grise.
 */
export function tailleDeLaReserveCollegiale(timbres: readonly Timbre[], heroique = false): number {
    if (heroique) return timbres.reduce((s, t) => s + (t === 'harmonieux' ? 2 : t === 'faux' ? 1 : 0), 0);
    if (timbres.includes('dissonant')) return 0;
    return timbres.includes('faux') ? 5 : 10;
}

/**
 * Les timbres des Éminences grises du groupe, lus sur leurs fiches ; celle qui vient de changer
 * passe par `remplace` (son écriture n'est peut-être pas encore revenue au magasin).
 */
export function timbresDuGroupe(
    regle: RegleDePenombre,
    fiches: readonly { id: string; sheetData?: Record<string, unknown> }[],
    remplace?: { id: string; timbre: Timbre },
): Timbre[] {
    if (!regle.timbre) return [];
    return fiches.map(f => (remplace && f.id === remplace.id ? remplace.timbre : lireLeTimbre(f.sheetData?.[regle.timbre!])));
}

/**
 * **Recompter la réserve collégiale** — 22/11/2026, à la demande de David (« fais le recompter la
 * réserve collégiale », réponse : seul après une merveille, et un bouton). Quand un timbre change, la
 * réserve « est composée à tout moment » de 10, 5 ou 0 jetons (p. 24, 102). Le livre ne dit pas ce
 * que deviennent les jetons déjà dépensés : on garde leur nombre, la réserve gagne ou perd l'écart de
 * taille, bornée de 0 à la nouvelle taille. Un groupe sans fiche ne change rien.
 */
export function recompterLaReserveCollegiale(
    avant: { valeur: number; taille: number },
    timbres: readonly Timbre[],
): { valeur: number; taille: number; change: boolean } {
    if (timbres.length === 0) return { ...avant, change: false };
    const taille = tailleDeLaReserveCollegiale(timbres);
    const valeur = Math.min(taille, Math.max(0, avant.valeur + taille - avant.taille));
    return { valeur, taille, change: taille !== avant.taille || valeur !== avant.valeur };
}
