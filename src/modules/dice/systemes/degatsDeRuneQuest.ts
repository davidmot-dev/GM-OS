import type { NiveauDeRuneQuest } from './runequest';

/**
 * **Les dégâts de RuneQuest, du résultat d'attaque jusqu'au coup** — RQ-A3, 03/11/2026,
 * à la demande de David (« on va faire RQ-A3 et RQ-A4 »). Livre de base Deadcrows,
 * pages imprimées (PDF − 1), tables relues en image.
 *
 * Avant : « Porter le coup » recevait une zone et un nombre saisi, et l'armure se
 * retirait toujours. Ici :
 * - **les dégâts de l'arme et le bonus** (p. 202) ; une arme lancée n'a que la moitié du
 *   bonus, arrondie au supérieur (p. 212) ; un arc n'en a aucun (Vasana, p. 85) ;
 * - **les dégâts spéciaux** sur une réussite spéciale (p. 203-204) : l'empalement et la
 *   lacération doublent les dés ET la constante de l'arme (épée large 2D8+2), le bonus
 *   n'est pas doublé ; l'écrasement ajoute le maximum du bonus ;
 * - **la réussite critique** : le maximum des dégâts spéciaux, plus le bonus lancé
 *   normalement, et l'armure ignorée (p. 200, 203) ;
 * - **la parade et l'esquive** (tables p. 199 et 201) décident de ce qui passe : dégâts
 *   normaux, spéciaux ou maximaux, armure retirée ou non, ce que bloque l'arme qui pare
 *   (sa durabilité actuelle, p. 198), et vers quelle localisation va l'excédent.
 *
 * Les pertes de durabilité et les tables d'échecs critiques sont **annoncées**, pas
 * écrites sur les fiches (choix de David, 03/11). Tout est pur : le panneau lance les dés.
 */

/** Un terme d'une formule de dégâts : `n` dés à `faces` faces, ou la constante `n` (signée). */
export interface Terme { n: number; faces?: number }

/** Les dégâts spéciaux d'une réussite spéciale (p. 203). */
export type DegatsSpeciaux = 'empalement' | 'laceration' | 'ecrasement';

export const LIBELLES_DES_SPECIAUX: Record<DegatsSpeciaux, string> = {
    empalement: 'Empalement', laceration: 'Lacération', ecrasement: 'Écrasement',
};

/** Combien du bonus aux dégâts s'ajoute : une arme lancée n'en a que la moitié (p. 212). */
export type UsageDuBonus = 'entier' | 'moitie' | 'aucun';

/** Ce que l'attaque inflige, une fois la défense passée. */
export type NiveauDesDegats = 'aucun' | 'normaux' | 'speciaux' | 'speciaux-max';

/**
 * Lit « 1D8+1 », « 1D10+1+3D6 », « −1D4 », « +1D6* ». Rend `[]` pour une case vide ou
 * « — », `null` pour ce qui n'est pas une formule (« Réussite particulière »).
 */
export function lireLesDegats(texte: string | number | undefined | null): Terme[] | null {
    if (typeof texte === 'number') return Number.isFinite(texte) && texte !== 0 ? [{ n: Math.trunc(texte) }] : [];
    const propre = String(texte ?? '').replace(/[\s*]/g, '').replace(/[−–]/g, '-').toUpperCase();
    if (propre === '' || /^[—-]$/.test(propre) || propre === '0' || propre === 'AUCUN') return [];
    const termes: Terme[] = [];
    const motif = /([+-]?)(\d*)D(\d+)|([+-]?)(\d+)/gy;
    let m: RegExpExecArray | null;
    let lu = 0;
    while ((m = motif.exec(propre)) !== null && m[0] !== '') {
        if (m[3] !== undefined) {
            const n = m[2] === '' ? 1 : Number(m[2]);
            termes.push({ n: m[1] === '-' ? -n : n, faces: Number(m[3]) });
        } else {
            termes.push({ n: m[4] === '-' ? -Number(m[5]) : Number(m[5]) });
        }
        lu = motif.lastIndex;
    }
    return lu === propre.length && termes.length ? termes : null;
}

export function ecrireLesDegats(termes: Terme[]): string {
    return termes.map((t, i) => {
        const corps = t.faces ? `${Math.abs(t.n)}D${t.faces}` : String(Math.abs(t.n));
        return t.n < 0 ? `−${corps}` : i === 0 ? corps : `+${corps}`;
    }).join('') || '0';
}

const valeurMax = (termes: Terme[]) => termes.reduce((s, t) => s + (t.faces ? (t.n > 0 ? t.n * t.faces : t.n) : t.n), 0);
const memeTerme = (a: Terme, b: Terme) => a.n === b.n && (a.faces ?? 0) === (b.faces ?? 0);

/**
 * **Le bonus déjà compris dans les dégâts de l'arme.** Les prétirés du livre notent
 * « 1D8+1+1D4 », bonus compris (p. 85) ; l'ajouter encore le compterait deux fois. Si la
 * formule de l'arme finit par le bonus de la fiche, il en est retiré.
 */
export function retirerLeBonusCompris(arme: Terme[], bonus: Terme[]): { arme: Terme[]; compris: boolean } {
    if (!bonus.length || arme.length <= bonus.length) return { arme, compris: false };
    const fin = arme.slice(arme.length - bonus.length);
    return fin.every((t, i) => memeTerme(t, bonus[i])) ? { arme: arme.slice(0, arme.length - bonus.length), compris: true } : { arme, compris: false };
}

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * **Le type de l'arme d'après son nom**, tables p. 208-212 : ÉC écrasement, TE taille et
 * estoc (empalement OU lacération, choisi avant le test), CC corps à corps (écrasement),
 * E empalement, L lacération. Les haches restent en lacération, même lancées : « la
 * plupart des armes à distance (à l'exception des haches et des pierres) » empalent
 * (p. 203), bien que la table p. 212 marque E la hache de lancer. Un nom inconnu ne
 * décide rien : la meneuse choisit.
 */
const TYPES_DU_LIVRE: [RegExp, DegatsSpeciaux[]][] = [
    [/hache|faucille|kopis|epee longue|rhomphaia|khepesh/, ['laceration']],
    [/dague de lancer|javelot|lance|epieu|sarisse|arc|arbalete|flechette|atlatl/, ['empalement']],
    [/dague|epee|rapiere|griffe/, ['empalement', 'laceration']],
    [/marteau|massue|masse|baton|gourdin|pierre|fronde|ceste|poing|pied|bouclier/, ['ecrasement']],
];

export function speciauxDeLArme(nom: string): DegatsSpeciaux[] {
    const n = sansAccents(nom);
    return TYPES_DU_LIVRE.find(([motif]) => motif.test(n))?.[1] ?? [];
}

/** Le bonus d'une arme à distance : aucun pour ce qui projette (arc, fronde), la moitié pour ce qui se lance (p. 212). */
export function usageDuBonusDeLArme(nom: string, genre: 'melee' | 'distance' | 'bouclier'): UsageDuBonus {
    if (genre !== 'distance') return 'entier';
    return /arc|arbalete|fronde|atlatl/.test(sansAccents(nom)) ? 'aucun' : 'moitie';
}

/** Une part des dégâts : lancée, ou à son maximum ; divisée par deux pour une arme lancée. */
export interface PartDesDegats {
    quoi: 'arme' | 'bonus' | 'maximum-du-bonus';
    termes: Terme[];
    maximum: boolean;
    moitie: boolean;
}

export interface CompositionDesDegats {
    parts: PartDesDegats[];
    formule: string;
    remarques: string[];
}

const doubler = (termes: Terme[]) => termes.map(t => ({ ...t, n: t.n * 2 }));

/** La formule de l'attaque, selon ce qui passe la défense (p. 200, 202-204). */
export function composerLesDegats(o: {
    arme: Terme[]; bonus: Terme[]; usage: UsageDuBonus; niveau: NiveauDesDegats; special?: DegatsSpeciaux;
}): CompositionDesDegats {
    const remarques: string[] = [];
    if (o.niveau === 'aucun') return { parts: [], formule: '', remarques };
    const moitie = o.usage === 'moitie';
    const bonus: PartDesDegats[] = o.usage !== 'aucun' && o.bonus.length ? [{ quoi: 'bonus', termes: o.bonus, maximum: false, moitie }] : [];
    const parts: PartDesDegats[] = [];
    const special = o.niveau === 'normaux' ? undefined : o.special;
    if (o.niveau !== 'normaux' && !special) remarques.push('Type de dégâts spéciaux à choisir : dégâts normaux en attendant.');
    if (!special) {
        parts.push({ quoi: 'arme', termes: o.arme, maximum: false, moitie: false }, ...bonus);
    } else if (special === 'ecrasement') {
        // Le maximum du bonus s'ajoute aux dégâts et au bonus normaux ; un malus (−1D4) n'a rien à ajouter.
        const max = o.niveau === 'speciaux-max';
        parts.push({ quoi: 'arme', termes: o.arme, maximum: max, moitie: false });
        if (bonus.length && valeurMax(o.bonus) > 0) parts.push({ quoi: 'maximum-du-bonus', termes: o.bonus, maximum: true, moitie });
        else remarques.push('Écrasement sans bonus aux dégâts positif : rien ne s’ajoute aux dégâts normaux (p. 203).');
        parts.push(...bonus);
    } else {
        // Empalement et lacération : les dés et la constante de l'arme doublés, le bonus une fois.
        parts.push({ quoi: 'arme', termes: doubler(o.arme), maximum: o.niveau === 'speciaux-max', moitie: false }, ...bonus);
    }
    return { parts, formule: parts.map(direLaPart).join(' + '), remarques };
}

function direLaPart(p: PartDesDegats): string {
    const f = ecrireLesDegats(p.termes);
    const max = p.maximum ? `max ${f} (${valeurDeLaPart(p, () => 0)})` : f;
    return p.moitie ? `½ ${p.maximum ? max : `(${f})`}` : max;
}

function valeurDeLaPart(p: PartDesDegats, de: (faces: number) => number): number {
    const brut = p.maximum ? valeurMax(p.termes)
        : p.termes.reduce((s, t) => {
            if (!t.faces) return s + t.n;
            let v = 0;
            for (let i = 0; i < Math.abs(t.n); i++) v += de(t.faces);
            return s + Math.sign(t.n) * v;
        }, 0);
    return p.moitie ? Math.ceil(brut / 2) : brut;
}

/** Lance la composition ; les dégâts ne descendent pas sous zéro. */
export function lancerLesDegats(c: CompositionDesDegats, de: (faces: number) => number): { total: number; detail: string } {
    const valeurs = c.parts.map(p => valeurDeLaPart(p, de));
    return {
        total: Math.max(0, valeurs.reduce((s, v) => s + v, 0)),
        detail: c.parts.map((p, i) => `${direLaPart(p)} : ${valeurs[i]}`).join(' · '),
    };
}

/** Ce que l'attaque devient contre la défense (tables p. 199 et 201). */
export type GenreDeDefense = 'aucune' | 'parade' | 'esquive';

/** Comment une arme est entamée (p. 198-200). */
export type Usure = 'un-si-depasse' | 'au-dessus' | 'tous-les-degats';

export interface IssueDuCoup {
    degats: NiveauDesDegats;
    /** L'armure ne compte pas. */
    sansArmure: boolean;
    /** L'arme qui pare bloque jusqu'à sa durabilité actuelle ; le reste passe (p. 198). */
    bloque: boolean;
    /** Où va ce qui passe une parade : la localisation tirée, ou une adjacente — le plus souvent le bras. */
    zone: 'tiree' | 'adjacente';
    /** L'arme qui pare, entamée par les dégâts de l'attaque. */
    usureDeLaParade?: Usure;
    /** Le défenseur lance les dégâts de son arme de parade contre l'arme d'attaque. */
    riposte?: { degats: 'normaux' | 'speciaux'; usure: Usure | 'tous' };
    echecsCritiques: ('attaquant' | 'defenseur')[];
}

const NIVEAUX: NiveauDeRuneQuest[] = ['reussite-critique', 'reussite-speciale', 'reussite', 'echec', 'echec-critique'];
type Case = Partial<IssueDuCoup> & Pick<IssueDuCoup, 'degats'>;
const bloque = (zone: 'tiree' | 'adjacente', usure: Usure, sansArmure = false): Omit<Case, 'degats'> =>
    ({ bloque: true, zone, usureDeLaParade: usure, sansArmure });
const pare = (degats: 'normaux' | 'speciaux', usure: Usure | 'tous'): Case => ({ degats: 'aucun', riposte: { degats, usure } });
const A = ['attaquant'] as const, D = ['defenseur'] as const;

/** Table « Résultats des attaques et des parades » (p. 199) : ligne = attaque, colonne = parade. */
const PARADE: Case[][] = [
    // Attaque critique. Contre une parade critique, les deux comptent comme réussites normales (p. 198).
    [{ degats: 'normaux', ...bloque('tiree', 'un-si-depasse') },
        { degats: 'speciaux-max', ...bloque('adjacente', 'un-si-depasse', true) },
        { degats: 'speciaux-max', ...bloque('adjacente', 'tous-les-degats', true) },
        { degats: 'speciaux-max', sansArmure: true },
        { degats: 'speciaux-max', sansArmure: true, echecsCritiques: [...D] }],
    // Attaque spéciale.
    [pare('normaux', 'un-si-depasse'),
        { degats: 'normaux', ...bloque('tiree', 'un-si-depasse') },
        { degats: 'speciaux', ...bloque('adjacente', 'au-dessus') },
        { degats: 'speciaux' },
        { degats: 'speciaux', echecsCritiques: [...D] }],
    // Attaque normale.
    [pare('speciaux', 'au-dessus'), pare('normaux', 'un-si-depasse'),
        { degats: 'normaux', ...bloque('tiree', 'un-si-depasse') },
        { degats: 'normaux' },
        { degats: 'normaux', echecsCritiques: [...D] }],
    // Attaque manquée : contre un échec critique à la parade, elle touche.
    [pare('speciaux', 'tous'), pare('speciaux', 'au-dessus'), pare('normaux', 'un-si-depasse'),
        { degats: 'aucun' },
        { degats: 'normaux', echecsCritiques: [...D] }],
    // Échec critique à l'attaque. La dernière case nomme deux fois l'attaquant (p. 199).
    [{ ...pare('speciaux', 'tous'), echecsCritiques: [...A] }, { ...pare('speciaux', 'au-dessus'), echecsCritiques: [...A] },
        { ...pare('normaux', 'un-si-depasse'), echecsCritiques: [...A] },
        { degats: 'aucun', echecsCritiques: [...A] }, { degats: 'aucun', echecsCritiques: [...A] }],
];

/** Table « Résultat d'une Esquive » (p. 201), retournée : ligne = attaque, colonne = esquive. */
const ESQUIVE: Case[][] = [
    [{ degats: 'aucun' }, { degats: 'speciaux' }, { degats: 'speciaux', sansArmure: true },
        { degats: 'speciaux-max', sansArmure: true }, { degats: 'speciaux-max', sansArmure: true, echecsCritiques: [...D] }],
    [{ degats: 'aucun' }, { degats: 'aucun' }, { degats: 'speciaux' }, { degats: 'speciaux' }, { degats: 'speciaux', echecsCritiques: [...D] }],
    [{ degats: 'aucun' }, { degats: 'aucun' }, { degats: 'aucun' }, { degats: 'normaux' }, { degats: 'normaux', echecsCritiques: [...D] }],
    [{ degats: 'aucun' }, { degats: 'aucun' }, { degats: 'aucun' }, { degats: 'aucun' }, { degats: 'normaux', echecsCritiques: [...D] }],
    [{ degats: 'aucun', echecsCritiques: [...A] }, { degats: 'aucun', echecsCritiques: [...A] }, { degats: 'aucun', echecsCritiques: [...A] },
        { degats: 'aucun', echecsCritiques: [...A] }, { degats: 'aucun', echecsCritiques: ['attaquant', 'defenseur'] }],
];

/** Sans défense : le résumé des résultats d'un combat (p. 200). */
const SANS_DEFENSE: Case[] = [
    { degats: 'speciaux-max', sansArmure: true }, { degats: 'speciaux' }, { degats: 'normaux' },
    { degats: 'aucun' }, { degats: 'aucun', echecsCritiques: [...A] },
];

export function issueDuCoup(attaque: NiveauDeRuneQuest, defense: GenreDeDefense, niveauDeDefense: NiveauDeRuneQuest = 'echec'): IssueDuCoup {
    const a = NIVEAUX.indexOf(attaque), d = NIVEAUX.indexOf(niveauDeDefense);
    const c = defense === 'aucune' ? SANS_DEFENSE[a] : (defense === 'parade' ? PARADE : ESQUIVE)[a][d];
    return { sansArmure: false, bloque: false, zone: 'tiree', echecsCritiques: [], ...c };
}

const LIBELLES_DES_DEGATS: Record<NiveauDesDegats, string> = {
    aucun: 'aucun dégât', normaux: 'dégâts normaux', speciaux: 'dégâts spéciaux', 'speciaux-max': 'maximum des dégâts spéciaux',
};

/** La case de la table, dite en une phrase, avec sa page. */
export function direLIssue(issue: IssueDuCoup, defense: GenreDeDefense): string {
    const page = defense === 'parade' ? 'p. 199' : defense === 'esquive' ? 'p. 201' : 'p. 200';
    const morceaux: string[] = [];
    if (issue.riposte) morceaux.push(`attaque parée ou déviée ; le défenseur lance les dégâts ${issue.riposte.degats} de son arme de parade contre l’arme d’attaque`);
    else if (issue.degats === 'aucun') morceaux.push(defense === 'esquive' ? 'attaque esquivée ou manquée' : 'l’attaque manque sa cible');
    else {
        morceaux.push(LIBELLES_DES_DEGATS[issue.degats]);
        if (issue.bloque) morceaux.push(`l’arme qui pare bloque jusqu’à sa durabilité, l’excédent va à ${issue.zone === 'adjacente' ? 'une localisation adjacente' : 'la localisation touchée'}`);
        morceaux.push(issue.sansArmure ? 'sans tenir compte de l’armure' : 'armure retirée');
    }
    if (issue.echecsCritiques.length) morceaux.push(`${issue.echecsCritiques.map(q => (q === 'attaquant' ? 'l’attaquant' : 'le défenseur')).join(' et ')} sur la table des échecs critiques`);
    const phrase = morceaux.join(' ; ');
    return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} (${page}).`;
}

/** Ce qui passe après l'arme qui pare, et ce qu'elle perd (p. 198-200). */
export function apresLaParade(total: number, issue: IssueDuCoup, durabilite: number | undefined): {
    passent: number; usure?: number; note?: string;
} {
    if (!issue.bloque) return { passent: total };
    if (durabilite === undefined || !Number.isFinite(durabilite)) {
        return { passent: total, note: 'Durabilité de l’arme qui pare inconnue : rien n’est bloqué en attendant.' };
    }
    const dura = Math.max(0, Math.trunc(durabilite));
    const passent = Math.max(0, total - dura);
    const usure = issue.usureDeLaParade === 'tous-les-degats' ? total
        : issue.usureDeLaParade === 'au-dessus' ? passent
        : total > dura ? 1 : 0;
    return { passent, usure, note: usure ? `L’arme qui pare perd ${usure} point${usure > 1 ? 's' : ''} de durabilité, à noter.` : undefined };
}

/** Le test contre l'inconscience d'une lacération qui égale les PV de la zone (p. 204). */
export function testDeLaceration(con: number, degatsSubis: number): number {
    return Math.max(0, (con - degatsSubis) * 5);
}
