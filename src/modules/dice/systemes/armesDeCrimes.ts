/**
 * **Les armes de Crimes et l'attaque** — C6 (2026-10-22), livre p. 344–346
 * (tableaux des armes), p. 389–395 (combat).
 *
 * Les tableaux sont transcrits ici, et non dans le pilote : un nombre de table
 * se relit contre le livre et se protège par des essais (règle de la Forge).
 *
 * L'attaque (p. 393) : « nombre de succès excédentaires de l'attaquant + dégât
 * de l'arme − Potentiel physique de la victime − sa protection », **au moins 1**.
 * Une arme blanche frappe du Potentiel physique de l'attaquant plus son bonus ;
 * une arme à feu a des dégâts fixes. Au-delà de la portée utile, une réussite
 * de moins ; au-delà du double, le tir est impossible (p. 389).
 */

export type FamilleDArme = 'blanche' | 'feu';
export type AtteinteDeLArme = 'epuisement' | 'blessures';
export type IncidentDeTir = 'E' | 'T' | 'C';

export interface ArmeDeCrimes {
    id: string;
    nom: string;
    famille: FamilleDArme;
    /** Blanche : le bonus ajouté au Physique de l'attaquant. À feu : les dégâts fixes (le premier nombre). */
    degats: number;
    /** À feu, « 5/4 » : les dégâts minorés des tirs suivants d'un tir multiple. */
    degatsMinores?: number;
    atteinte: AtteinteDeLArme;
    /** À feu : la portée utile, en mètres ; la portée maximale en vaut le double. */
    portee?: number;
    coups?: number;
    munitions?: number;
    /** Assauts pour recharger. */
    rechargement?: number;
    critiques?: IncidentDeTir[];
    dissimulation: string;
    prix: string;
}

const blanche = (id: string, nom: string, degats: number, atteinte: AtteinteDeLArme, prix: string, dissimulation: string): ArmeDeCrimes =>
    ({ id, nom, famille: 'blanche', degats, atteinte, prix, dissimulation });
const feu = (
    id: string, nom: string, portee: number, coups: number, munitions: number, degats: number | [number, number],
    prix: string, dissimulation: string, rechargement: number, critiques: IncidentDeTir[],
): ArmeDeCrimes => ({
    id, nom, famille: 'feu', portee, coups, munitions, atteinte: 'blessures', prix, dissimulation, rechargement, critiques,
    ...(Array.isArray(degats) ? { degats: degats[0], degatsMinores: degats[1] } : { degats }),
});

/** « Descriptif des armes blanches », p. 344. */
export const ARMES_BLANCHES: ArmeDeCrimes[] = [
    blanche('aiguille', 'Aiguille à cheveu', 0, 'epuisement', '1 franc', 'Main'),
    blanche('coup-de-poing', 'Coup de poing', 0, 'epuisement', '1 fr. 50', 'Main'),
    blanche('rasoir', 'Rasoir', 0, 'blessures', '1 fr. 50', 'Main'),
    blanche('baton', 'Bâton', 1, 'epuisement', 'Rien', 'Non'),
    blanche('matraque', 'Matraque en caoutchouc', 1, 'epuisement', '2 fr. 50', 'Non'),
    blanche('canne-cloutee', 'Canne cloutée', 1, 'blessures', '10 francs', 'Non'),
    blanche('couteau-de-boucher', 'Couteau de boucher', 1, 'blessures', '2 francs', 'Veste'),
    blanche('scalpel', 'Scalpel', 1, 'blessures', '1 fr. 50', 'Main'),
    blanche('canne-de-combat', 'Canne de combat', 2, 'epuisement', '15 francs', 'Non'),
    blanche('baionnette', 'Baïonnette', 2, 'blessures', '10 francs', 'Non'),
    blanche('canne-epee', 'Canne-épée', 2, 'blessures', '10 francs', 'Non'),
    blanche('epee', 'Épée d’escrime', 3, 'blessures', '20 francs', 'Non'),
    blanche('sabre', 'Sabre militaire', 3, 'blessures', '35 francs', 'Non'),
];

/** « Descriptif des armes à feu », p. 345–346. Les astérisques du livre (réarmement, maîtres) restent au meneur. */
export const ARMES_A_FEU: ArmeDeCrimes[] = [
    feu('protector', 'Revolver Protector', 15, 1, 10, 3, '25 francs', 'Main', 2, ['T']),
    feu('clic-clac', 'Revolver Clic-clac', 20, 1, 6, 4, '35 francs', 'Main', 2, ['T']),
    feu('novo', 'Revolver Novo', 20, 1, 6, 3, '50 francs', 'Main', 2, ['T']),
    feu('le-gaulois', 'Revolver Le Gaulois', 20, 2, 5, 3, '40 francs', 'Main', 2, ['T', 'C']),
    feu('revol-cycle', 'Revolver Revol-cycle', 20, 1, 6, 4, '40 francs', 'Main, adaptable sur un guidon', 2, ['E', 'C', 'T']),
    feu('dague-pistolet', 'Dague pistolet Dumonthier', 10, 1, 2, 4, '120 francs', 'Confusion avec une dague', 3, ['E']),
    feu('couteau-pistolet', 'Couteau pistolet Dumonthier', 10, 1, 1, 3, '90 francs', 'Confusion avec un couteau', 3, ['E']),
    feu('apache', 'Coup de poing poignard Apache', 10, 1, 6, 4, '55 francs', 'Confusion avec un coup de poing', 3, ['T']),
    feu('my-friend', 'Poivrière coup de poing My Friend', 10, 1, 7, 4, '40 francs', 'Confusion avec un coup de poing', 2, ['C']),
    feu('derringer', 'Pistolet Derringer Remington Elliot', 20, 2, 4, [5, 4], '40 francs', 'Veste', 1, ['C']),
    feu('deprez', 'Revolver Deprez', 30, 1, 6, 5, '50 francs', 'Veste', 2, ['C']),
    feu('savage-navy', 'Revolver Savage Navy', 40, 1, 6, 5, '30 francs', 'Veste', 2, ['E']),
    feu('chaineux', 'Revolver à 12 coups Chaineux', 30, 1, 12, 5, '60 francs', 'Veste', 2, ['E', 'C']),
    feu('galand', 'Revolver Galand', 40, 1, 6, 5, '45 francs', 'Veste', 2, ['C']),
    feu('duplex', 'Revolver Duplex', 25, 2, 9, [5, 4], '75 francs', 'Poche si tir multiple', 2, ['C']),
    feu('chattuck', 'Revolver Chattuck', 30, 1, 5, 5, '60 francs', 'Veste', 0, ['E']),
    feu('brun-latrige', 'Pistolet Brun-Latrige', 25, 3, 8, 3, '40 francs', 'Veste', 0, ['E']),
    feu('canne-fusil', 'Canne-fusil', 10, 1, 2, 5, '25 francs', 'Confusion avec une canne', 3, ['T']),
    feu('sw-silver', 'Revolver SW Silver & Co', 30, 2, 6, [5, 4], '55 francs', 'Veste', 1, ['C']),
    feu('webley-fosbery', 'Revolver Webley Fosbery', 40, 2, 6, [5, 4], '60 francs', 'Veste', 1, ['E']),
    feu('charola-anitua', 'Revolver Charola et Anitua', 40, 2, 6, [5, 4], '50 francs', 'Veste', 1, ['E']),
    feu('bergmann', 'Pistolet semi-automatique Bergmann', 50, 2, 5, [6, 4], '60 francs', 'Veste', 1, ['E']),
    feu('pieper', 'Pistolet semi-automatique Pieper', 50, 2, 6, [6, 4], '70 francs', 'Veste', 1, ['E']),
    feu('chassepot', 'Fusil de guerre Chassepot', 200, 1, 6, 7, '100 francs', 'Non', 3, ['C']),
    feu('chasse-10', 'Fusil de chasse calibre 10', 100, 1, 6, 7, '120 francs', 'Non', 3, ['C']),
    feu('chasse-20', 'Fusil de chasse calibre 20', 150, 1, 6, 8, '200 francs', 'Non', 3, ['C']),
    feu('lebel', 'Fusil de guerre Lebel (amélioration Kropatcheck)', 400, 1, 10, 9, '215 francs', 'Non', 3, ['C']),
    feu('lebel-africain', 'Mousqueton Lebel africain (gros gibier)', 150, 1, 5, 10, '220 francs', 'Non', 3, ['C']),
];

export const ARMES_DE_CRIMES: ArmeDeCrimes[] = [...ARMES_BLANCHES, ...ARMES_A_FEU];

export const INCIDENTS_DE_TIR: Record<IncidentDeTir, string> = {
    E: 'Enrayée : débloquée en trois assauts avec la spécialisation armes à feu, sinon par un armurier',
    T: 'Elle tombe aux pieds du tireur, un coup inopiné peut partir',
    C: 'Le tir part de travers : une victime proche de la cible peut être touchée',
};

/**
 * **Les manœuvres** (« Options de combat », p. 391-394) — des possibilités en
 * plus : « une attaque simple, bien portée, vaut toutes les tactiques ».
 */
export type Manoeuvre = 'aucune' | 'viser' | 'assommer' | 'desequilibrer' | 'immobiliser' | 'feinter';

export const LIBELLES_DES_MANOEUVRES: Record<Manoeuvre, string> = {
    aucune: 'Attaque simple', viser: 'Viser une localisation', assommer: 'Assommer (viser la tête)',
    desequilibrer: 'Déséquilibrer (viser les jambes)', immobiliser: 'Immobiliser (mains nues)', feinter: 'Feinter',
};

/** « Localisation des coups portés » (p. 391) : le chiffre de la plus forte occurrence du jet. */
export const LOCALISATIONS: Record<number, string> = {
    1: 'Thorax', 2: 'Thorax', 3: 'Abdomen', 4: 'Bras droit', 6: 'Bras droit', 5: 'Bras gauche', 7: 'Bras gauche',
    8: 'Jambe droite', 9: 'Jambe gauche', 10: 'Tête',
};

/** La localisation d'un coup au hasard : les chiffres les plus fréquents du jet ; à égalité, le vainqueur choisit. */
export function localisationsDuJet(des: readonly number[]): string[] {
    const comptes = new Map<number, number>();
    for (const d of des) comptes.set(d, (comptes.get(d) ?? 0) + 1);
    const max = Math.max(0, ...comptes.values());
    return [...new Set([...comptes.entries()].filter(([, n]) => n === max).map(([v]) => LOCALISATIONS[v]).filter(Boolean))];
}

/** Ce que l'attaque sait : le jet de l'attaquant, l'adversaire, la cible. */
export interface Attaque {
    arme: ArmeDeCrimes;
    /** Réussites gardées par l'attaquant. */
    reussites: number;
    /** Réussites de l'adversaire en opposition (mêlée) ; 0 pour un tir sur une cible passive. */
    adverses: number;
    /** Potentiel physique (actuel) de l'attaquant : il frappe avec une arme blanche. */
    physiqueAttaquant: number;
    /** Potentiel physique (actuel) de la victime, et sa protection — couvert compris (1 à 3). */
    physiqueCible: number;
    protection: number;
    /** À feu : la distance de la cible, en mètres. */
    distance?: number;
    manoeuvre?: Manoeuvre;
    /** Viser : la localisation voulue. */
    localisation?: string;
    /** Les dés du jet de l'attaquant : la localisation d'un coup au hasard (p. 391). */
    des?: readonly number[];
    /** Le degré de maîtrise de l'attaquant (1 à 3) : la feinte s'y limite. */
    maitrise?: number;
}

export interface IssueDeLAttaque {
    /** Au-delà du double de la portée utile : le tir est impossible. */
    impossible?: string;
    /** Une réussite de moins au-delà de la portée utile. */
    malusDePortee: number;
    touche: boolean;
    /** Les points d'atteinte infligés, au moins 1 sur une touche. */
    degats: number;
    /** Assommer change les blessures en fatigue (p. 392). */
    atteinte: AtteinteDeLArme | 'fatigue';
    /** Où porte le coup : la localisation visée, ou celles que le jet désigne. */
    localisations?: string[];
    /** Ce que la manœuvre produit en plus des dégâts, dit au meneur. */
    effets?: string[];
    /** Le calcul, dit comme le livre : « 2 succès + 4 (Clic-clac) − 0 − 3 (Physique) − 0 = 3 ». */
    calcul: string;
}

/** Résout une attaque déjà jetée : touche-t-elle, et combien d'atteintes ? */
export function resoudreLAttaque(a: Attaque): IssueDeLAttaque {
    const { arme } = a;
    const portee = arme.famille === 'feu' ? arme.portee ?? 0 : 0;
    if (arme.famille === 'feu' && a.distance !== undefined && portee > 0 && a.distance > portee * 2) {
        return {
            impossible: `${a.distance} m : au-delà de la portée maximale (${portee * 2} m), le tir est impossible.`,
            malusDePortee: 0, touche: false, degats: 0, atteinte: arme.atteinte, calcul: '',
        };
    }
    const malusDePortee = arme.famille === 'feu' && a.distance !== undefined && portee > 0 && a.distance > portee ? 1 : 0;
    const reussites = Math.max(0, a.reussites - malusDePortee);
    const manoeuvre = a.manoeuvre ?? 'aucune';
    const marge = reussites - a.adverses;
    const auHasard = localisationsDuJet(a.des ?? []);
    const effets: string[] = [];

    // Feinter (p. 392) : aucun dégât ; sacrifier du Physique pour baisser d'autant le potentiel adverse.
    if (manoeuvre === 'feinter') {
        const n = Math.max(1, Math.min(3, a.maitrise ?? 1));
        return {
            malusDePortee, touche: false, degats: 0, atteinte: arme.atteinte, calcul: '',
            effets: [`Feinte : aucun dégât. Sacrifier jusqu'à ${n} point${n > 1 ? 's' : ''} de Physique (selon la maîtrise) pour baisser d'autant le potentiel adverse et aggraver les coups suivants (p. 392).`],
        };
    }
    // Immobiliser (p. 392) : au contact et à mains nues, réussites + Physique contre le Physique adverse.
    if (manoeuvre === 'immobiliser') {
        const total = reussites + a.physiqueAttaquant;
        const reussi = total > a.physiqueCible;
        return {
            malusDePortee, touche: false, degats: 0, atteinte: arme.atteinte,
            calcul: `${reussites} succès + ${a.physiqueAttaquant} (Physique) = ${total} contre ${a.physiqueCible} (Physique adverse)`,
            effets: [reussi ? 'Immobilisé : il ne se défera de l’emprise qu’en gagnant un assaut suivant (p. 392).' : 'L’emprise échoue : il faut dépasser le Physique adverse (p. 392).'],
        };
    }

    /*
      Viser (p. 392) : une réussite sacrifiée ; il faut deux succès de plus que
      l'adversaire pour toucher où l'on veut, sinon le coup porte au hasard.
      Assommer vise la tête, Déséquilibrer les jambes.
    */
    const vise = manoeuvre === 'viser' || manoeuvre === 'assommer' || manoeuvre === 'desequilibrer';
    const cible = manoeuvre === 'assommer' ? 'Tête' : manoeuvre === 'desequilibrer' ? 'Jambes' : a.localisation;
    const ouIlVoulait = vise && marge >= 2;
    const touche = marge > 0;
    const localisations = touche ? (ouIlVoulait && cible ? [cible] : auHasard) : undefined;
    let margeUtile = vise ? marge - 1 : marge;
    let atteinte: AtteinteDeLArme | 'fatigue' = arme.atteinte;
    if (vise && touche && !ouIlVoulait) effets.push(`Visé : ${cible ?? 'une localisation'} sans deux succès d'avance, le coup porte au hasard (p. 392).`);
    if (manoeuvre === 'assommer' && ouIlVoulait) {
        // La marge doublée, les blessures comptées comme de la fatigue (exemple p. 392 : « marge de réussite de 2 »).
        margeUtile = marge * 2;
        atteinte = 'fatigue';
        effets.push('Assommer, si les circonstances le permettent : marge doublée, les dégâts comptent comme de la fatigue — on peut le maîtriser en amenant son Physique à 0 sans le tuer (p. 392).');
    }
    if (manoeuvre === 'desequilibrer' && ouIlVoulait) {
        const ecart = a.physiqueCible - a.physiqueAttaquant;
        effets.push(ecart > 0 && reussites < ecart
            ? `Pas déséquilibré : il fallait ${ecart} succès, l'écart de Physique (p. 392).`
            : 'À terre et abasourdi tant qu’il y reste ; il ne se relève qu’en gagnant un assaut suivant (p. 392).');
    }
    const base = arme.famille === 'feu' ? arme.degats : a.physiqueAttaquant + arme.degats;
    const brut = margeUtile + base - a.physiqueCible - a.protection;
    const degats = touche ? Math.max(1, brut) : 0;
    const dArme = arme.famille === 'feu' ? `${arme.degats} (${arme.nom})` : `${a.physiqueAttaquant} + ${arme.degats} (Physique + ${arme.nom})`;
    const dMarge = manoeuvre === 'assommer' && ouIlVoulait ? `${marge} × 2 (marge doublée)`
        : vise ? `${reussites} succès − 1 (visé) − ${a.adverses}` : `${reussites} succès − ${a.adverses}`;
    const calcul = `${dMarge}${malusDePortee ? ' (−1 hors portée utile)' : ''} + ${dArme} − ${a.physiqueCible} (Physique) − ${a.protection} (protection) = ${brut}${touche && brut < 1 ? ', au moins 1' : ''}`;
    return {
        malusDePortee, touche, degats, atteinte, calcul,
        ...(localisations?.length ? { localisations } : {}),
        ...(effets.length ? { effets } : {}),
    };
}

/**
 * Ce qu'un échec critique fait à une arme à feu (p. 389) : ses incidents, au
 * choix du meneur ; et à partir de deux 1 gardés, elle peut exploser — « 1
 * réussite + 4 pour les dégâts », au visage du tireur.
 */
export function incidentsDuTir(arme: ArmeDeCrimes, unsGardes: number): string[] {
    if (arme.famille !== 'feu') return [];
    const dits = (arme.critiques ?? []).map(c => `${c} — ${INCIDENTS_DE_TIR[c]}.`);
    if (unsGardes >= 2) dits.push('Deux 1 gardés : l’arme peut exploser au visage du tireur (1 réussite + 4 pour les dégâts).');
    return dits;
}

/** Les réglages de l'attaque au panneau, tels que le meneur les saisit (des textes : un champ peut rester vide). */
export interface ReglagesDAttaque {
    arme: string;
    manoeuvre: Manoeuvre;
    localisation: string;
    distance: string;
    adverses: string;
    cible: string;
    physiqueCible: string;
    protection: string;
}
export const REGLAGES_D_ATTAQUE: ReglagesDAttaque = { arme: '', manoeuvre: 'aucune', localisation: 'Thorax', distance: '', adverses: '0', cible: '', physiqueCible: '', protection: '0' };
