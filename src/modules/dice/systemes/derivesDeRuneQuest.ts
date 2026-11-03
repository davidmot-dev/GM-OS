import { LOCALISATIONS, type Localisation } from './runequest';

/**
 * **Les attributs de RuneQuest, calculés depuis les caractéristiques** — RQ-A5,
 * 03/11/2026, à la demande de David (« on va faire RQ-A5 et RQ-A6 »). Livre de base
 * français, pages **imprimées** (PDF − 1), tables relues p. 55-59 :
 *
 * - points de vie : CON, modifiée par la TAI et le POU (p. 55) ;
 * - points de vie des sept localisations, selon les PV totaux (p. 55) ;
 * - points de magie : le POU (p. 54) ;
 * - bonus aux dégâts (FOR + TAI), dégâts de combat spirituel (POU + CHA), vitesse de
 *   guérison (CON), ENC maximum (moyenne de FOR et CON, plafonnée à la FOR) (p. 56) ;
 * - rangs d'action de DEX et de TAI (p. 57) ;
 * - les sept modificateurs de catégorie de compétences (p. 57-59).
 *
 * **Rien ne s'écrit seul** : le calcul se propose ligne à ligne, avec son détail, et la
 * meneuse l'applique ou garde sa valeur. Choix de David du 03/11 : les **compétences ne
 * bougent pas** quand un modificateur de catégorie change — leur score mêle base, culture,
 * occupation et expérience ; l'écart se dit seulement.
 *
 * Un maximum qui change **garde les blessures** : les PV actuels suivent le nouveau
 * maximum moins les dégâts déjà reçus, et les dégâts des zones (`degats_<zone>`) ne sont
 * pas touchés — seuls les maxima des zones changent.
 *
 * Cas témoin, Vasana (p. 54-58) : FOR 16, CON 12, TAI 10, DEX 11, INT 15, POU 15, CHA 19
 * → 12 PV, jambes 4, abdomen 4, poitrine 5, bras 3, tête 4 ; +1D4 ; guérison 2 ; ENC 14 ;
 * RA de DEX 3, de TAI 2 ; Communication +10 %, Connaissances +5 %, Manipulation +5 %,
 * Perception +5 %, Magie +10 %.
 */

export type Caracteristique = 'for' | 'con' | 'tai' | 'dex' | 'int' | 'pou' | 'cha';

export const CATEGORIES_DE_RUNEQUEST = ['agilite', 'communication', 'connaissances', 'magie', 'manipulation', 'perception', 'discretion'] as const;
export type CategorieDeRuneQuest = typeof CATEGORIES_DE_RUNEQUEST[number];

export const LIBELLES_DES_CATEGORIES: Record<CategorieDeRuneQuest, string> = {
    agilite: 'Agilité', communication: 'Communication', connaissances: 'Connaissances', magie: 'Magie',
    manipulation: 'Manipulation', perception: 'Perception', discretion: 'Discrétion',
};

/** Ce que le pilote nomme pour les attributs (`jet.runequest.derives`, pilote 2.3.0). */
export interface RegleDesDerives {
    caracteristiques: Record<Caracteristique, string>;
    pvMax?: string;
    /** La jauge des PV actuels : elle suit un nouveau maximum sans soigner ni blesser. */
    pv?: string;
    pmMax?: string;
    pm?: string;
    bonusAuxDegats?: string;
    degatsSpirituels?: string;
    vitesseGuerison?: string;
    encMax?: string;
    raDex?: string;
    raTai?: string;
    /** Le maximum de PV de chaque zone ; ses dégâts reçus vivent ailleurs et ne bougent pas. */
    zones?: Partial<Record<Localisation, string>>;
    /** Les modificateurs de catégorie de la fiche. */
    modificateurs?: Partial<Record<CategorieDeRuneQuest, string>>;
    /**
     * Les modificateurs d'armes que la feuille imprime à part (mêlée, distance, boucliers,
     * armes naturelles) : le livre range toutes les armes en **Manipulation** (p. 59).
     */
    modificateursDArmes?: { champ: string; libelle: string }[];
}

const nombre = (v: unknown): number | undefined => {
    if (v === undefined || v === null || String(v).trim() === '') return undefined;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
};
const signe = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '—');
const pourcent = (n: number) => (n > 0 ? `+${n} %` : n < 0 ? `−${-n} %` : '0 %');

// ---- Les tables du livre ------------------------------------------------------

/** Modificateur de PV par la TAI (p. 55) : 1-4 −2, 5-8 −1, 9-12 —, 13-16 +1… puis +1 tous les 4. */
export const modificateurDePvParLaTai = (tai: number) => Math.max(-2, Math.floor((tai - 9) / 4));
/** Modificateur de PV par le POU (p. 55) : 1-4 −1, 5-16 —, 17-20 +1, 21-24 +2… */
export const modificateurDePvParLePou = (pou: number) => (pou <= 4 ? -1 : pou <= 16 ? 0 : Math.floor((pou - 13) / 4));
export const pointsDeVie = (con: number, tai: number, pou: number) => con + modificateurDePvParLaTai(tai) + modificateurDePvParLePou(pou);

/**
 * La colonne de la table Localisation (p. 55) : 1-6, 7-9, 10-12, 13-15, 16-18, 19-21,
 * puis une de plus tous les 3 points.
 */
export const colonneDesLocalisations = (pv: number) => (pv <= 6 ? 0 : Math.floor((pv - 7) / 3) + 1);
const LIGNE_DES_ZONES: Record<Localisation, number> = {
    'jambe-droite': 2, 'jambe-gauche': 2, abdomen: 2, poitrine: 3, 'bras-droit': 1, 'bras-gauche': 1, tete: 2,
};
export const pointsDeVieDeLaZone = (zone: Localisation, pvTotaux: number) => LIGNE_DES_ZONES[zone] + colonneDesLocalisations(pvTotaux);
const PLAGES_DES_COLONNES = ['1-6', '7-9', '10-12', '13-15', '16-18', '19-21'];
const plageDeLaColonne = (c: number) => PLAGES_DES_COLONNES[c] ?? `${7 + 3 * (c - 1)}-${9 + 3 * (c - 1)}`;

/** Bonus aux dégâts (FOR + TAI, p. 56) : ≤ 12 −1D4, 13-24 —, 25-32 +1D4, 33-40 +1D6, 41-56 +2D6, puis +1D6 tous les 16. */
export function bonusAuxDegats(forTai: number): { texte: string; plage: string } {
    if (forTai <= 12) return { texte: '−1D4', plage: '12 ou moins' };
    if (forTai <= 24) return { texte: '—', plage: '13-24' };
    if (forTai <= 32) return { texte: '+1D4', plage: '25-32' };
    if (forTai <= 40) return { texte: '+1D6', plage: '33-40' };
    if (forTai <= 56) return { texte: '+2D6', plage: '41-56' };
    const tranches = Math.ceil((forTai - 56) / 16);
    return { texte: `+${2 + tranches}D6`, plage: `${57 + 16 * (tranches - 1)}-${56 + 16 * tranches}` };
}

/** Dégâts de combat spirituel (POU + CHA, p. 56) : 2-12 1D3 … 41-56 2D6+3, puis +1D6+1 tous les 16. */
export function degatsDeCombatSpirituel(pouCha: number): { texte: string; plage: string } {
    if (pouCha <= 12) return { texte: '1D3', plage: '2-12' };
    if (pouCha <= 24) return { texte: '1D6', plage: '13-24' };
    if (pouCha <= 32) return { texte: '1D6+1', plage: '25-32' };
    if (pouCha <= 40) return { texte: '1D6+3', plage: '33-40' };
    if (pouCha <= 56) return { texte: '2D6+3', plage: '41-56' };
    const tranches = Math.ceil((pouCha - 56) / 16);
    return { texte: `${2 + tranches}D6+${3 + tranches}`, plage: `${57 + 16 * (tranches - 1)}-${56 + 16 * tranches}` };
}

/** Vitesse de guérison (CON, p. 56) : ≤ 6 1, 7-12 2, 13-18 3, puis +1 tous les 6. */
export const vitesseDeGuerison = (con: number) => (con <= 6 ? 1 : Math.floor((con - 7) / 6) + 2);

/**
 * ENC maximum (p. 56) : la moyenne de la FOR et de la CON, sans dépasser la FOR. Le livre
 * ne dit pas comment arrondir une moyenne en demi : on l'arrondit au plus proche, et le
 * détail le dit.
 */
export function encMaximum(force: number, con: number): { valeur: number; moyenne: number } {
    const moyenne = (force + con) / 2;
    return { valeur: Math.min(force, Math.round(moyenne)), moyenne };
}

/** Rang d'action de DEX (p. 57) : 1-5 5, 6-8 4, 9-12 3, 13-15 2, 16-18 1, 19+ 0. */
export const rangDActionDeDex = (dex: number) => (dex <= 5 ? 5 : dex <= 8 ? 4 : dex <= 12 ? 3 : dex <= 15 ? 2 : dex <= 18 ? 1 : 0);
/** Rang d'action de TAI (p. 57) : 1-6 3, 7-14 2, 15-21 1, 22+ 0. */
export const rangDActionDeTai = (tai: number) => (tai <= 6 ? 3 : tai <= 14 ? 2 : tai <= 21 ? 1 : 0);

/**
 * Une ligne des tables de catégorie (p. 57-59) : les colonnes 1-4, 5-8, 9-12, 13-16,
 * 17-20, puis « tous les +4 ».
 */
type LigneDeCategorie = readonly [number, number, number, number, number, number];
const LIGNES = {
    forte: [-10, -5, 0, 5, 10, 5],      // INT, DEX, CHA, POU selon la table
    douce: [-5, 0, 0, 0, 5, 5],         // l'appoint d'une caractéristique secondaire
    inverseDouce: [5, 0, 0, 0, -5, -5], // la TAI en Agilité, le POU en Discrétion
    inverseForte: [10, 5, 0, -5, -10, -5], // la TAI en Discrétion
} as const satisfies Record<string, LigneDeCategorie>;

export const TABLES_DES_CATEGORIES: Record<CategorieDeRuneQuest, { car: Caracteristique; ligne: LigneDeCategorie }[]> = {
    agilite: [{ car: 'for', ligne: LIGNES.douce }, { car: 'tai', ligne: LIGNES.inverseDouce }, { car: 'dex', ligne: LIGNES.forte }, { car: 'pou', ligne: LIGNES.douce }],
    communication: [{ car: 'int', ligne: LIGNES.douce }, { car: 'pou', ligne: LIGNES.douce }, { car: 'cha', ligne: LIGNES.forte }],
    connaissances: [{ car: 'int', ligne: LIGNES.forte }, { car: 'pou', ligne: LIGNES.douce }],
    magie: [{ car: 'pou', ligne: LIGNES.forte }, { car: 'cha', ligne: LIGNES.douce }],
    manipulation: [{ car: 'for', ligne: LIGNES.douce }, { car: 'dex', ligne: LIGNES.forte }, { car: 'int', ligne: LIGNES.forte }, { car: 'pou', ligne: LIGNES.douce }],
    perception: [{ car: 'int', ligne: LIGNES.forte }, { car: 'pou', ligne: LIGNES.douce }],
    discretion: [{ car: 'tai', ligne: LIGNES.inverseForte }, { car: 'dex', ligne: LIGNES.forte }, { car: 'int', ligne: LIGNES.forte }, { car: 'pou', ligne: LIGNES.inverseDouce }],
};
const PAGES_DES_CATEGORIES: Record<CategorieDeRuneQuest, number> = {
    agilite: 58, communication: 58, connaissances: 58, magie: 59, manipulation: 59, perception: 59, discretion: 59,
};

export function apportDeLaCaracteristique(valeur: number, ligne: LigneDeCategorie): number {
    if (valeur <= 0) return ligne[0];
    if (valeur <= 20) return ligne[Math.min(4, Math.floor((valeur - 1) / 4))];
    return ligne[4] + ligne[5] * Math.ceil((valeur - 20) / 4);
}

export function modificateurDeCategorie(categorie: CategorieDeRuneQuest, c: Record<Caracteristique, number>): { valeur: number; detail: string } {
    const apports = TABLES_DES_CATEGORIES[categorie].map(({ car, ligne }) => ({ car, v: c[car], apport: apportDeLaCaracteristique(c[car], ligne) }));
    const valeur = apports.reduce((s, a) => s + a.apport, 0);
    const detail = apports.map(a => `${a.car.toUpperCase()} ${a.v}${a.apport ? ` ${pourcent(a.apport)}` : ''}`).join(' · ');
    return { valeur, detail };
}

// ---- Le calcul, ligne à ligne -------------------------------------------------

export interface LigneDeDerive {
    /** Une clé stable, pour appliquer cette ligne seule. */
    cle: string;
    libelle: string;
    /** Le champ de la fiche qui reçoit la valeur. */
    champ: string;
    groupe: 'attribut' | 'zone' | 'categorie';
    /** Ce que porte la fiche, tel qu'on le lit. */
    surLaFiche: string;
    /** Ce que donnent les tables. */
    calcule: number | string;
    detail: string;
    identique: boolean;
    /** Ce qu'appliquer annonce sans l'écrire — les compétences d'une catégorie. */
    note?: string;
}

export interface DerivesDeRuneQuest {
    /** Les caractéristiques lues ; absent s'il en manque une, et rien ne se calcule. */
    caracteristiques?: Record<Caracteristique, number>;
    manquantes: Caracteristique[];
    pvTotaux?: number;
    lignes: LigneDeDerive[];
}

const ORDRE: Caracteristique[] = ['for', 'con', 'tai', 'dex', 'int', 'pou', 'cha'];

const lu = (v: unknown) => {
    if (v === undefined || v === null || String(v).trim() === '') return '—';
    return String(v).trim();
};
// Un « — » saisi, un « 0 » ou un vide disent tous trois l'absence de bonus aux dégâts.
const memeTexte = (a: string, b: string) => {
    const norme = (s: string) => s.replace(/\s+/g, '').replace(/[−–—]/g, '-').toUpperCase().replace(/^\+/, '');
    const vide = (s: string) => ['', '-', '0'].includes(norme(s));
    return vide(a) && vide(b) ? true : norme(a) === norme(b);
};

export function calculerLesDerives(regle: RegleDesDerives, valeurs: Record<string, unknown>): DerivesDeRuneQuest {
    const lus = Object.fromEntries(ORDRE.map(c => [c, nombre(valeurs[regle.caracteristiques[c]])])) as Record<Caracteristique, number | undefined>;
    const manquantes = ORDRE.filter(c => lus[c] === undefined);
    if (manquantes.length) return { manquantes, lignes: [] };
    const c = lus as Record<Caracteristique, number>;
    const lignes: LigneDeDerive[] = [];
    const ligneNombre = (cle: string, libelle: string, champ: string | undefined, groupe: LigneDeDerive['groupe'], calcule: number, detail: string, note?: string) => {
        if (!champ) return;
        const fiche = nombre(valeurs[champ]);
        lignes.push({ cle, libelle, champ, groupe, surLaFiche: fiche === undefined ? '—' : String(fiche), calcule, detail, identique: fiche === calcule, ...(note ? { note } : {}) });
    };
    const ligneTexte = (cle: string, libelle: string, champ: string | undefined, calcule: string, detail: string) => {
        if (!champ) return;
        const fiche = lu(valeurs[champ]);
        lignes.push({ cle, libelle, champ, groupe: 'attribut', surLaFiche: fiche, calcule, detail, identique: memeTexte(fiche, calcule) });
    };

    const mTai = modificateurDePvParLaTai(c.tai);
    const mPou = modificateurDePvParLePou(c.pou);
    const pv = pointsDeVie(c.con, c.tai, c.pou);
    ligneNombre('pv-max', 'Points de vie maximum', regle.pvMax, 'attribut', pv,
        `CON ${c.con} · TAI ${c.tai} → ${signe(mTai)} · POU ${c.pou} → ${signe(mPou)} (p. 55)`);
    ligneNombre('pm-max', 'Points de magie maximum', regle.pmMax, 'attribut', c.pou, `POU ${c.pou} (p. 54)`);
    const bd = bonusAuxDegats(c.for + c.tai);
    ligneTexte('bonus-degats', 'Bonus aux dégâts', regle.bonusAuxDegats, bd.texte, `FOR+TAI ${c.for + c.tai} → ${bd.plage} (p. 56)`);
    const ds = degatsDeCombatSpirituel(c.pou + c.cha);
    ligneTexte('degats-spirituels', 'Dégâts de combat spirituel', regle.degatsSpirituels, ds.texte, `POU+CHA ${c.pou + c.cha} → ${ds.plage} (p. 56)`);
    const vg = vitesseDeGuerison(c.con);
    ligneNombre('vitesse-guerison', 'Vitesse de guérison', regle.vitesseGuerison, 'attribut', vg,
        `CON ${c.con} → ${c.con <= 6 ? '6 ou moins' : c.con <= 12 ? '7-12' : c.con <= 18 ? '13-18' : 'au-delà de 18, +1 tous les 6'} (p. 56)`);
    const enc = encMaximum(c.for, c.con);
    const moyenne = Number.isInteger(enc.moyenne) ? String(enc.moyenne) : `${String(enc.moyenne).replace('.', ',')} arrondi à ${Math.round(enc.moyenne)}`;
    ligneNombre('enc-max', 'ENC maximum', regle.encMax, 'attribut', enc.valeur,
        `(FOR ${c.for} + CON ${c.con}) / 2 = ${moyenne}${enc.valeur < Math.round(enc.moyenne) ? `, plafonné à la FOR ${c.for}` : ', sans dépasser la FOR'} (p. 56)`);
    ligneNombre('ra-dex', "Rang d'action de DEX", regle.raDex, 'attribut', rangDActionDeDex(c.dex), `DEX ${c.dex} (p. 57)`);
    ligneNombre('ra-tai', "Rang d'action de TAI", regle.raTai, 'attribut', rangDActionDeTai(c.tai), `TAI ${c.tai} (p. 57)`);

    const colonne = colonneDesLocalisations(pv);
    for (const l of LOCALISATIONS) {
        ligneNombre(`zone-${l.cle}`, l.label, regle.zones?.[l.cle], 'zone', pointsDeVieDeLaZone(l.cle, pv),
            `PV totaux ${pv} → colonne ${plageDeLaColonne(colonne)} (p. 55)`);
    }

    const manipulation = modificateurDeCategorie('manipulation', c);
    for (const cat of CATEGORIES_DE_RUNEQUEST) {
        const m = cat === 'manipulation' ? manipulation : modificateurDeCategorie(cat, c);
        const champ = regle.modificateurs?.[cat];
        const fiche = champ ? nombre(valeurs[champ]) ?? 0 : 0;
        ligneNombre(`categorie-${cat}`, LIBELLES_DES_CATEGORIES[cat], champ, 'categorie', m.valeur,
            `${m.detail} (p. ${PAGES_DES_CATEGORIES[cat]})`,
            fiche !== m.valeur ? `Les compétences de ${LIBELLES_DES_CATEGORIES[cat]} ne sont pas modifiées : l’écart (${pourcent(m.valeur - fiche)}) est seulement annoncé.` : undefined);
    }
    for (const { champ, libelle } of regle.modificateursDArmes ?? []) {
        ligneNombre(`armes-${champ}`, `${libelle} (Manipulation)`, champ, 'categorie', manipulation.valeur,
            `les armes sont des compétences de Manipulation (p. 59) : ${manipulation.detail}`,
            'Les compétences d’armes ne sont pas modifiées : l’écart est seulement annoncé.');
    }
    return { caracteristiques: c, manquantes: [], pvTotaux: pv, lignes };
}

/**
 * Ce qu'écrit l'application des lignes choisies. Un maximum de PV ou de PM qui change
 * déplace la jauge actuelle d'autant : 12 PV dont 3 perdus, passés à 14, en laissent 11.
 * Une jauge ne descend pas sous 0 par ce seul calcul.
 */
export function appliquerLesDerives(regle: RegleDesDerives, valeurs: Record<string, unknown>, derives: DerivesDeRuneQuest, cles: Iterable<string>): Record<string, unknown> {
    const choisies = new Set(cles);
    const maj: Record<string, unknown> = {};
    for (const l of derives.lignes) {
        if (!choisies.has(l.cle) || l.identique) continue;
        maj[l.champ] = l.calcule;
        const jauge = l.cle === 'pv-max' ? regle.pv : l.cle === 'pm-max' ? regle.pm : undefined;
        if (jauge) {
            const ancienMax = nombre(valeurs[l.champ]);
            const actuel = nombre(valeurs[jauge]);
            if (ancienMax !== undefined && actuel !== undefined && typeof l.calcule === 'number') {
                maj[jauge] = Math.max(0, actuel + (l.calcule - ancienMax));
            }
        }
    }
    return maj;
}
