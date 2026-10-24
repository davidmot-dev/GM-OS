/**
 * **Le round de combat de Rêve de Dragon** — 24/10/2026, à la demande de David
 * (« on va finir rêve de dragons »), Livre des Voyageurs 2.3.1, p. 120–131 et
 * le résumé p. 138–139. Pages **imprimées** (PDF = imprimée + 1).
 *
 * Le pilote triait par Agilité : le livre ne classe jamais tout le monde d'un
 * bloc. Le round a **sept phases** ; dans chacune, ceux qui tirent, puis ceux
 * qui lancent, puis ceux qui se battent en mêlée se départagent par
 * « facteur d'initiative + 1d6 », le facteur dépendant **de l'arme utilisée**.
 *
 * Tout ici est pur : des déclarations entrent, un ordre et des phrases sortent.
 * Le meneur reste maître de la table — rien n'est refusé, tout est dit.
 */

export interface PhaseDuRound {
    numero: number;
    nom: string;
    /** Ce que la phase fait, en une ligne (résumé p. 139). */
    aide: string;
}

/** Les sept phases, dans l'ordre (p. 120, résumé p. 139). */
export const PHASES_DU_ROUND: readonly PhaseDuRound[] = [
    { numero: 1, nom: 'Déclaration d’intention', aide: 'Chacun dit ce qu’il tente et, s’il attaque, sa cible. Une action déclarée peut être annulée, jamais modifiée.' },
    { numero: 2, nom: 'Magie', aide: 'Montée et déplacement en TMR, lancer du sort, ciblage et effet des sorts du round précédent.' },
    { numero: 3, nom: 'Tirs', aide: 'Initiative entre tireurs ; Tir/arme moins la difficulté du tir ; parade au bouclier seulement.' },
    { numero: 4, nom: 'Lancers', aide: 'Initiative entre lanceurs ; Lancer/arme moins la difficulté ; parade ou esquive.' },
    { numero: 5, nom: 'Mêlée', aide: 'Initiative ; l’attaquant choisit sa difficulté (0 à −10) ; parade ou esquive à la même difficulté.' },
    { numero: 6, nom: 'Actualisation des mouvements', aide: 'Les déplacements déclarés : engagement, désengagement, fuite.' },
    { numero: 7, nom: 'Santé et actions diverses', aide: '−1 endurance par blessure grave, jets de vie, soins ; conditions du round suivant.' },
];

/** Ce qu'un combattant déclare en phase 1. Chaque catégorie a sa phase. */
export type CategorieDAction = 'magie' | 'tir' | 'lancer' | 'melee' | 'deplacement' | 'divers';

export const PHASE_DE_LA_CATEGORIE: Readonly<Record<CategorieDAction, number>> = {
    magie: 2, tir: 3, lancer: 4, melee: 5, deplacement: 6, divers: 7,
};

export const LIBELLE_DE_LA_CATEGORIE: Readonly<Record<CategorieDAction, string>> = {
    magie: 'Magie', tir: 'Tir', lancer: 'Lancer', melee: 'Mêlée', deplacement: 'Déplacement', divers: 'Actions diverses',
};

/** La caractéristique dérivée qui porte l'arme : Mêlée, Tir ou Lancer. */
export const DERIVEE_DE_LA_CATEGORIE: Partial<Record<CategorieDAction, 'melee' | 'tir' | 'lancer'>> = {
    tir: 'tir', lancer: 'lancer', melee: 'melee',
};

/**
 * Le facteur d'initiative d'une arme : **la moitié de la caractéristique
 * utilisée, arrondie à l'inférieur, plus le niveau de compétence** (p. 120).
 * Nitouche, 10 en Lancer et 0 en Dague de jet : 5. Brucelin, 14 en Mêlée et +3
 * à l'Épée : 10.
 */
export function facteurDInitiative(caracteristique: number, niveau: number): number {
    return Math.floor(caracteristique / 2) + niveau;
}

/**
 * L'initiative prioritaire du round d'engagement : **l'arme la plus longue**
 * (p. 121, table reprise p. 138). Du premier au dernier.
 */
export const LONGUEUR_DES_ARMES: readonly string[] = [
    'Arme d’hast', 'Lance', 'Bâton', 'Double dragonne', 'Esparlongue', 'Épée dragonne', 'Épée bâtarde',
    'Épée cyane', 'Épée sorde', 'Grande hache', 'Hache de bataille', 'Épée gnome', 'Masses', 'Gourdin',
    'Fléaux', 'Dague', 'Armes naturelles',
];

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, ' ');

/** Les mots qui reconnaissent une arme de la table, du plus précis au plus vague. */
const RECONNAISSANCE: readonly [RegExp, string][] = [
    [/hast|hallebarde/, 'Arme d’hast'],
    [/double dragonne/, 'Double dragonne'],
    [/esparlongue/, 'Esparlongue'],
    [/dragonne/, 'Épée dragonne'],
    [/batarde/, 'Épée bâtarde'],
    [/cyane/, 'Épée cyane'],
    [/sorde/, 'Épée sorde'],
    [/gnome/, 'Épée gnome'],
    [/grande hache/, 'Grande hache'],
    [/hache/, 'Hache de bataille'],
    [/lance|javelin/, 'Lance'],
    [/baton/, 'Bâton'],
    [/masse/, 'Masses'],
    [/gourdin/, 'Gourdin'],
    [/fleau/, 'Fléaux'],
    [/dague|couteau/, 'Dague'],
    [/corps a corps|naturel|poing|griffe|morsure|mains nues/, 'Armes naturelles'],
];

/** Le rang de longueur d'une arme nommée (0 : la plus longue), ou `null` si la table ne la connaît pas. */
export function rangDeLongueur(arme: string): number | null {
    const nom = sansAccent(arme);
    const trouvee = RECONNAISSANCE.find(([motif]) => motif.test(nom));
    return trouvee ? LONGUEUR_DES_ARMES.indexOf(trouvee[1]) : null;
}

/**
 * **Armes lentes** (p. 125) : force ou finesse, jamais la rapidité. Toutes les
 * armes à deux mains, et l'épée bâtarde, l'épée sorde, la hache de bataille, la
 * masse lourde et les fléaux même à une main.
 */
export function armeLente(arme: string, deuxMains = false): boolean {
    return deuxMains || /batarde|sorde|hache de bataille|masse lourde|fleau/.test(sansAccent(arme));
}

/** Ce que le meneur a noté pour un combattant ce round-ci. */
export interface DeclarationDeRound {
    id: string;
    nom: string;
    categorie: CategorieDAction;
    /** L'arme, pour la priorité de longueur et les rappels. */
    arme: string;
    facteur: number;
    /** L'état général, négatif ou nul : fatigue, vie manquante… (p. 120). */
    etatGeneral: number;
    /** Défenseur à terre, se relevant, sonné, surpris de face : il n'a jamais l'initiative (p. 127). */
    demiSurprise: boolean;
    /** Charge : initiative toujours aléatoire, la longueur ne joue pas (p. 128). */
    charge: boolean;
    /**
     * Mêlée inégale : la taille du groupe qui fait face à un seul adversaire.
     * Chaque membre ajoute ce nombre à son initiative (2 à deux contre un…).
     * 0 ou 1 : pas de groupe.
     */
    groupe: number;
    /** Le d6 tiré, une fois le round ouvert. */
    d6?: number;
}

/** L'initiative d'un combattant pour son arme : facteur + 1d6 + état général + mêlée inégale (p. 120–121, 138). */
export function initiativeDuRound(d: DeclarationDeRound): number | null {
    if (d.d6 === undefined) return null;
    const groupe = d.categorie === 'melee' && d.groupe >= 2 ? d.groupe : 0;
    return d.facteur + d.d6 + Math.min(0, d.etatGeneral) + groupe;
}

/** Un rang dans une phase : le combattant, sa valeur, et pourquoi il passe là. */
export interface RangDansLaPhase {
    id: string;
    nom: string;
    initiative: number | null;
    motif: string;
}

export interface PhaseOrdonnee {
    phase: PhaseDuRound;
    rangs: RangDansLaPhase[];
    /** Ce que le meneur doit savoir : égalités, priorité de longueur, demi-surprise. */
    remarques: string[];
}

/**
 * L'ordre du round, phase par phase.
 *
 * - Tirs et lancers : initiative décroissante ; une égalité tire **simultanément**.
 * - Mêlée : au **round d'engagement**, l'arme la plus longue frappe d'abord —
 *   sauf si quelqu'un charge, auquel cas l'initiative est aléatoire pour tous
 *   (la table ne sait pas comparer une charge et une longueur). À égalité de
 *   longueur, l'initiative tirée départage. Ensuite, initiative décroissante ;
 *   une égalité laisse les deux en garde, **round nul**, sauf mêlée inégale où
 *   le groupe l'emporte (p. 121).
 * - Le demi-surpris n'a **jamais** l'initiative : il passe après les autres de
 *   sa phase (p. 127).
 * - Magie, déplacements et actions diverses : dans l'ordre des déclarations.
 */
export function ordreDuRound(declarations: readonly DeclarationDeRound[], engagement: boolean): PhaseOrdonnee[] {
    return PHASES_DU_ROUND.filter(p => p.numero > 1).map(phase => {
        const dansLaPhase = declarations.filter(d => PHASE_DE_LA_CATEGORIE[d.categorie] === phase.numero);
        const remarques: string[] = [];
        const versRang = (d: DeclarationDeRound, motif: string): RangDansLaPhase => ({ id: d.id, nom: d.nom, initiative: initiativeDuRound(d), motif });
        if (!['tir', 'lancer', 'melee'].some(c => PHASE_DE_LA_CATEGORIE[c as CategorieDAction] === phase.numero)) {
            return { phase, rangs: dansLaPhase.map(d => versRang(d, 'ordre des déclarations')), remarques };
        }
        const libres = dansLaPhase.filter(d => !d.demiSurprise);
        const surpris = dansLaPhase.filter(d => d.demiSurprise);
        const parInitiative = (a: DeclarationDeRound, b: DeclarationDeRound) => (initiativeDuRound(b) ?? -Infinity) - (initiativeDuRound(a) ?? -Infinity);
        let tries: DeclarationDeRound[];
        let motif = 'facteur + 1d6';
        const melee = phase.numero === PHASE_DE_LA_CATEGORIE.melee;
        if (melee && engagement && !libres.some(d => d.charge)) {
            motif = 'longueur d’arme (engagement)';
            const rang = (d: DeclarationDeRound) => rangDeLongueur(d.arme) ?? LONGUEUR_DES_ARMES.length;
            tries = [...libres].sort((a, b) => rang(a) - rang(b) || parInitiative(a, b));
            const inconnues = libres.filter(d => rangDeLongueur(d.arme) === null).map(d => d.nom);
            if (inconnues.length) remarques.push(`Longueur inconnue (${inconnues.join(', ')}) : rangée après les armes de la table ; au meneur de corriger.`);
        } else {
            if (melee && engagement) remarques.push('Une charge : l’initiative est aléatoire, la longueur des armes ne joue pas.');
            tries = [...libres].sort(parInitiative);
        }
        const rangs = [...tries.map(d => versRang(d, motif)), ...surpris.map(d => versRang(d, 'demi-surprise : jamais l’initiative'))];
        if (motif === 'facteur + 1d6') {
            const valeurs = tries.map(initiativeDuRound).filter((v): v is number => v !== null);
            const egales = [...new Set(valeurs.filter((v, i) => valeurs.indexOf(v) !== i))];
            for (const v of egales) {
                const noms = tries.filter(d => initiativeDuRound(d) === v).map(d => d.nom).join(', ');
                remarques.push(melee
                    ? `Égalité à ${v} (${noms}) : en garde, round nul entre eux — sauf mêlée inégale, où le groupe l’emporte.`
                    : `Égalité à ${v} (${noms}) : les projectiles partent simultanément.`);
            }
        }
        if (tries.some(d => d.d6 === undefined)) remarques.push('Initiative non tirée pour certains combattants.');
        return { phase, rangs, remarques };
    });
}

/** Les conditions et tactiques, telles que le résumé les donne (p. 139). */
export interface ConditionDeCombat {
    id: 'surprise' | 'demi-surprise' | 'charge' | 'feinte';
    nom: string;
    initiative: string;
    attaque: number;
    defense: string;
    dommages: number;
    note: string;
}

export const CONDITIONS_DE_COMBAT: readonly ConditionDeCombat[] = [
    { id: 'surprise', nom: 'Complète surprise', initiative: 'automatique', attaque: 6, defense: 'ni parade ni esquive', dommages: 10, note: 'Défenseur surpris de dos, endormi ; à terre et sonné à la fois. En mêlée seulement pour les bonus.' },
    { id: 'demi-surprise', nom: 'Demi-surprise', initiative: 'automatique', attaque: 0, defense: 'significative exigée (contre la finesse : la moitié encore)', dommages: 1, note: 'Défenseur sonné, à terre, se relevant, surpris de face. Ses échecs en attaque sont des maladresses.' },
    { id: 'charge', nom: 'Charge', initiative: 'aléatoire', attaque: 4, defense: 'le chargeur : −4 à la parade, pas d’esquive', dommages: 2, note: 'Round d’engagement seulement ; toujours en force.' },
    { id: 'feinte', nom: 'Feinte', initiative: 'on y renonce', attaque: 1, defense: '—', dommages: 1, note: 'En duel seulement ; perdue si le feinteur est blessé ou sonné avant son tour.' },
];

/** Les trois options d'une particulière en mêlée (p. 125). */
export const OPTIONS_DE_PARTICULIERE = [
    { id: 'force', nom: 'Force', effet: '+5 au +dom si la défense échoue. Obligatoire à difficulté zéro et en charge.' },
    { id: 'finesse', nom: 'Finesse', effet: 'Le défenseur doit obtenir une significative ; dommages non majorés. Difficulté −1 au moins.' },
    { id: 'rapidite', nom: 'Rapidité', effet: 'Un second usage de l’arme ce round, comme prochaine action. Jamais avec une arme lente. Difficulté −1 au moins.' },
] as const;

/** Une ligne de la table des maladresses (2d10, p. 126). */
export interface Maladresse { nom: string; effet: string }

const MALADRESSES: Record<string, Maladresse> = {
    assomme: { nom: 'Assommé net', effet: 'Endurance à 0 et −1 point de vie.' },
    bouscule: { nom: 'Ami bousculé', effet: 'Le compagnon bousculé réussit EMPATHIE/Vigilance à −1d6 ou reste en demi-surprise jusqu’à la fin du round suivant.' },
    chute: { nom: 'Chute', effet: 'Encaissement à −1d6 sur la table des Coups non mortels.' },
    desarme: { nom: 'Désarmé', effet: 'L’arme échappe des mains.' },
    choquee: { nom: 'Arme choquée', effet: 'L’arme joue un jet de Résistance à −2d6 et perd ce nombre de points de résistance en cas d’échec.' },
    desequilibre: { nom: 'Déséquilibré', effet: 'Réussir AGILITÉ/Vigilance à −1d6 ou rester en demi-surprise jusqu’à la fin du round suivant.' },
    faux: { nom: 'Faux mouvement', effet: 'Perte de 2d6 points d’endurance.' },
};

/** Les bornes de la table, lues sur la page imprimée. */
const TABLE_ARMEE: readonly [number, keyof typeof MALADRESSES][] = [
    [2, 'assomme'], [3, 'bouscule'], [4, 'chute'], [5, 'desarme'], [7, 'choquee'], [9, 'desequilibre'],
    [12, 'faux'], [14, 'desequilibre'], [16, 'choquee'], [17, 'desarme'], [18, 'chute'], [19, 'bouscule'], [20, 'assomme'],
];
const TABLE_NON_ARMEE: readonly [number, keyof typeof MALADRESSES][] = [
    [2, 'assomme'], [3, 'bouscule'], [4, 'chute'], [7, 'desequilibre'], [14, 'faux'], [17, 'desequilibre'],
    [18, 'chute'], [19, 'bouscule'], [20, 'assomme'],
];

/** La maladresse d'un échec total en combat, au 2d10 (p. 126). Le meneur peut en décider autrement. */
export function maladresse(total2d10: number, arme: boolean): Maladresse {
    if (!Number.isInteger(total2d10) || total2d10 < 2 || total2d10 > 20) throw new Error('Maladresse : un total de 2d10, de 2 à 20.');
    const table = arme ? TABLE_ARMEE : TABLE_NON_ARMEE;
    return MALADRESSES[table.find(([borne]) => total2d10 <= borne)![1]];
}

/** Les difficultés de tir et de lancer (p. 122) : elles se cumulent. */
export const DIFFICULTES_DE_TIR = {
    portee: { courte: 0, moyenne: -3, extreme: -5 },
    taille: { ogre: 2, humaine: 0, chien: -2, chat: -4, souris: -8 },
    activite: { immobile: 0, active: -3, mouvement: -4, zigzag: -5 },
} as const;

/** Parade et esquive contre un projectile (p. 122). Flèches, carreaux et pierres ne s'esquivent pas. */
export const DIFFICULTES_DE_PARADE = {
    activite: { pret: 0, autre: -3 },
    bouclier: { leger: -3, moyen: 0, lourd: 3 },
    projectile: { fleche: -5, pierre: -4, dague: -2, fouet: 0 },
} as const;

/** Les portées des armes de jet, en mètres (p. 122) ; `null` : pas de cette portée. */
export const PORTEES_DES_ARMES: Readonly<Record<string, readonly [number, number | null, number | null]>> = {
    Arc: [10, 20, 50], Arbalète: [15, 30, 70], Fronde: [8, 15, 25], Dague: [3, 8, 15], Javelot: [6, 12, 20], Fouet: [2, null, null],
};

/**
 * La portée d'une arme selon la distance. Pour la dague et le javelot, chaque
 * point de FORCE au-dessus de 10 allonge chaque portée d'un mètre, chaque point
 * sous 9 la raccourcit d'autant (p. 121). Brucelin, 15 en FORCE : 8, 13 et 20 m.
 */
export function porteeDuTir(arme: keyof typeof PORTEES_DES_ARMES, distance: number, force = 10): 'courte' | 'moyenne' | 'extreme' | 'hors' {
    const bornes = PORTEES_DES_ARMES[arme];
    const decalage = arme === 'Dague' || arme === 'Javelot' ? (force > 10 ? force - 10 : force < 9 ? force - 9 : 0) : 0;
    const [courte, moyenne, extreme] = bornes.map(b => b === null ? null : b + decalage);
    if (distance <= courte!) return 'courte';
    if (moyenne !== null && distance <= moyenne) return 'moyenne';
    return extreme !== null && distance <= extreme ? 'extreme' : 'hors';
}
