import { cibleDeNephilim } from './nephilim';
import { degreDuDe, margeDuJet, estUneReussite, type DegreDeReussite } from '../degresDeReussite';

/**
 * **Finir Nephilim Légende** — 23/10/2026, à la demande de David (« je propose que
 * l'on s'attaque à finir Nephilim Legend » ; périmètre complet N1 à N9). Livre 0
 * *Quintessence* et errata V1.3 ; les pages citées sont celles du livre.
 *
 * Tout ici est pur : la fiche entre, des nombres et des phrases sortent. Le
 * panneau de jet et ses cartes écrivent, jamais ce module.
 */

export type Element = 'Feu' | 'Air' | 'Eau' | 'Terre' | 'Lune';
export const ELEMENTS: readonly Element[] = ['Feu', 'Air', 'Eau', 'Terre', 'Lune'];

/** Les deux Ka opposés de chaque élément (table des oppositions élémentaires, p. 111). */
export const OPPOSES: Record<Element, readonly Element[]> = {
    Feu: ['Lune', 'Eau'], Air: ['Lune', 'Terre'], Eau: ['Feu', 'Terre'], Terre: ['Eau', 'Air'], Lune: ['Feu', 'Air'],
};

const SUFFIXES: Record<string, Element> = { fire: 'Feu', air: 'Air', water: 'Eau', earth: 'Terre', moon: 'Lune' };

/** L'élément d'un champ de Ka — `ka_fire`, `alchemy_constructs_retort_water` : par son suffixe. */
export function elementDuChamp(id: string | undefined): Element | undefined {
    const m = id?.match(/_(fire|air|water|earth|moon)$/);
    return m ? SUFFIXES[m[1]] : undefined;
}

/** Un choix de la fiche (« Feu ») lu comme un élément ; rien d'autre ne passe. */
export function element(v: unknown): Element | undefined {
    return ELEMENTS.find(e => e === String(v ?? '').trim());
}

const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const coche = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';

// ——— Le pilote ———

/** Une piste de santé (p. 136) : ses cases de dommages et ses lignes de Conséquences. */
export interface PisteDeSante {
    /** Les cases, dans l'ordre de la fiche : leur valeur, et le Ka-Terre qui les ouvre (les cases de bonus). */
    cases: { champ: string; valeur: number; kaTerre?: number }[];
    /** Mineure, sérieuse, grave : ce que chaque ligne absorbe, et son malus (p. 137-138). */
    consequences: { champ: string; label: string; absorbe: number }[];
    /** Le compte des cases cochées, tenu pour la fiche HTML. */
    compte?: string;
}

/**
 * **Ce que le pilote nomme pour Nephilim** (`jet.nephilim`). Chaque clé est
 * facultative : une partie absente ne fait rien, elle ne casse rien.
 */
export interface RegleDeNephilim {
    /** Les identifiants des composantes du jet : le Vécu ou l'Art, l'approche, la formule, le sort. */
    composantes?: { vecu?: string; approche?: string; formule?: string; sort?: string };
    /** Les sections des Arts occultes : leurs tests sont des actions magiques. */
    arts?: { magie?: string[]; kabbale?: string[]; alchimie?: string[] };
    /** Les sections des Vécus passés, pour l'Effet Mnémos en tant que Vécu (p. 118). */
    vecusPasses?: string[];
    /** Le Vécu contemporain du Simulacre : ni Mnémos en tant que Vécu, ni Chute à son sujet. */
    vecuContemporain?: string;
    /** Le choix du Ka dominant (« Feu ») et son degré. */
    kaDominant?: { choix: string; degre?: string };
    /** Le champ de chaque Ka-élément du Pentacle : le degré du Ka dominant s'y lit quand sa formule n'est pas calculée. */
    pentacle?: Partial<Record<Element, string>>;
    /** Le Ka-Terre : les cases de bonus et les durées de guérison (11 − Ka-Terre). */
    kaTerre?: string;
    sapience?: string;
    stase?: string;
    /** Les Chutes, la forme du Khaïba, les mises en jeu de la séance et leurs Points de Sapience. */
    chutes?: {
        khaiba: string; ombre: string; narcose: string;
        forme?: string;
        misesEnJeu?: { khaiba?: string; ombre?: string; narcose?: string };
        sapienceDeChute?: string;
    };
    /**
     * Le métamorphe : son degré, et les degrés devenus visibles en permanence — un
     * nombre (`visibles`), ou les cases « permanente » des métamorphoses de la fiche.
     */
    metamorphe?: { degre: string; visibles?: string; permanentes?: string[] };
    /** Les réserves de table : le lieu magique, la conjonction et son intensité ; le Seuil RK et la Traque. */
    table?: { lieu?: string; conjonction?: string; intensite?: string; seuilRK?: string; traque?: string };
    sante?: { physique?: PisteDeSante; magique?: PisteDeSante };
    /** Les invocations de Kabbale : le motif de leur degré, pour le pacte (p. 198). Le nom se lit en remplaçant `_degree`. */
    pacte?: { motif: string; ordonnances?: string };
    /** L'Alchimie : l'Œuvre de chaque Art (1 à 3) et, par construct, le champ qui dit avec quel Art il est assemblé. */
    alchimie?: { oeuvres?: Record<string, 1 | 2 | 3>; assemblage?: Record<string, string>; secondElement?: { remplacer: string; par: string } };
    /**
     * L'expérience de fin de séance (p. 155) : les sections dont chaque champ
     * se paie à la table, les Ka (valeur visée × 10), et les champs à 1 PS le
     * degré (le maximum d'une jauge de Materiae Primae).
     */
    experience?: { sections?: string[]; champs?: string[]; ka?: string[]; unPoint?: string[] };
}

/** Ce que le joueur règle au panneau pour Nephilim. */
export interface ChoixDeNephilim {
    /** L'action est physique : les Conséquences physiques en malus (p. 137). */
    actionPhysique?: boolean;
    /** Degrés de métamorphe exprimés (p. 112), sur une approche du Ka dominant. */
    metamorphe?: number;
    /** Impressionner : +2 à une action sociale, un jeton de Traque (p. 113). */
    impressionner?: boolean;
    /** Effet Mnémos en tant que Vécu : autant de PS que de degrés (p. 118-119). */
    mnemosVecu?: number;
    /** Sacrifice : 5 PS, le rituel de sortilège réussit d'office (p. 183). */
    sacrifice?: boolean;
    /** Les réserves de table lues au moment du jet. */
    lieu?: number; conjonction?: number; intensite?: number; seuilRK?: number;
}

// ——— N8 · Lieux et conjonctions ———

/** Le lieu magique, tel que la réserve de table l'encode : 0 aucun, 1 à 5 un Plexus, 6 un Nexus. */
export const LIBELLES_DU_LIEU = ['Aucun lieu magique', 'Plexus de Feu', 'Plexus d’Air', 'Plexus d’Eau', 'Plexus de Terre', 'Plexus de Lune', 'Nexus'];
/** La conjonction du jour : 0 aucune, 1 à 5 l'élément. */
export const LIBELLES_DE_LA_CONJONCTION = ['Aucune conjonction', 'Conjonction de Feu', 'Conjonction d’Air', 'Conjonction d’Eau', 'Conjonction de Terre', 'Conjonction de Lune'];

/**
 * Le bonus du lieu et de la conjonction pour un jet qui use de ce Ka (p. 160 ;
 * errata p. 160). Il ne vaut que pour les Sciences occultes et les approches :
 * sans Ka-élément au jet, rien.
 *
 * - Plexus : +1 au Ka du Plexus, −1 à ses opposés. Nexus : +3 à tous.
 * - Conjonction (intensité 1) : +1 au Ka de la conjonction, sans malus.
 *   Grande conjonction (2 à 5) : +N à ce Ka, −N à ses opposés.
 */
export function bonusDuLieu(elementDuJet: Element | undefined, lieu = 0, conjonction = 0, intensite = 1): { total: number; details: string[] } {
    const details: string[] = [];
    if (!elementDuJet) return { total: 0, details };
    let total = 0;
    if (lieu === 6) { total += 3; details.push('Nexus +3'); }
    else if (lieu >= 1 && lieu <= 5) {
        const e = ELEMENTS[lieu - 1];
        if (e === elementDuJet) { total += 1; details.push(`Plexus de ${e} +1`); }
        else if (OPPOSES[e].includes(elementDuJet)) { total -= 1; details.push(`Plexus de ${e} −1 (Ka opposé)`); }
    }
    if (conjonction >= 1 && conjonction <= 5) {
        const e = ELEMENTS[conjonction - 1], i = Math.min(5, Math.max(1, Math.trunc(intensite)));
        const nom = i === 1 ? 'Conjonction' : 'Grande conjonction';
        if (e === elementDuJet) { total += i; details.push(`${nom} de ${e} +${i}`); }
        else if (i > 1 && OPPOSES[e].includes(elementDuJet)) { total -= i; details.push(`${nom} de ${e} −${i} (Ka opposé)`); }
    }
    return { total, details };
}

// ——— N1 · Les Conséquences au jet ———

/**
 * Le degré du Ka dominant : le Ka du Pentacle de l'élément choisi, sinon le
 * champ calculé. Les valeurs brutes d'une fiche ne portent pas le résultat de
 * leurs formules, ou un zéro périmé (la Stase plafonnée, 23/10).
 */
export function degreDuKaDominant(regle: RegleDeNephilim, valeurs: Record<string, unknown>): number | undefined {
    const dominant = regle.kaDominant ? element(valeurs[regle.kaDominant.choix]) : undefined;
    const champ = dominant ? regle.pentacle?.[dominant] : undefined;
    if (champ) return n(valeurs[champ]);
    const brut = regle.kaDominant?.degre ? valeurs[regle.kaDominant.degre] : undefined;
    return brut === undefined || brut === null || brut === '' || !Number.isFinite(Number(brut)) ? undefined : Number(brut);
}

/** Les degrés de métamorphe visibles en permanence (p. 112) : le nombre noté, et les métamorphoses cochées « permanente ». */
export function degresVisibles(regle: RegleDeNephilim, valeurs: Record<string, unknown>): number {
    const m = regle.metamorphe;
    if (!m) return 0;
    return (m.visibles ? Math.max(0, n(valeurs[m.visibles])) : 0) + (m.permanentes ?? []).filter(c => coche(valeurs[c])).length;
}

/** Les malus des Conséquences cochées : physiques et magiques, cumulés (p. 137-138). */
export function malusDesConsequences(regle: RegleDeNephilim, valeurs: Record<string, unknown>): { physique: number; magique: number } {
    const total = (p?: PisteDeSante) => (p?.consequences ?? []).reduce((s, c) => s + (coche(valeurs[c.champ]) ? c.absorbe : 0), 0);
    return { physique: total(regle.sante?.physique), magique: total(regle.sante?.magique) };
}

// ——— N3 · Les Chutes ———

export type NomDeChute = 'khaiba' | 'ombre' | 'narcose';
export const NOMS_DES_CHUTES: Record<NomDeChute, string> = { khaiba: 'Khaïba', ombre: 'Ombre', narcose: 'Narcose' };
export const FORMES_DU_KHAIBA = ['Nanisme', 'Gigantisme', 'Forme éthérale', 'Forme élémentaire'] as const;

/** Le palier d'une Chute (p. 149) : 0 sans degré, 1 (1-4), 2 (5-7), 3 (8-9), 4 (10 et plus). */
export function palierDeChute(degre: number): 0 | 1 | 2 | 3 | 4 {
    return degre <= 0 ? 0 : degre <= 4 ? 1 : degre <= 7 ? 2 : degre <= 9 ? 3 : 4;
}

const EFFETS_DU_KHAIBA: Record<typeof FORMES_DU_KHAIBA[number], string[]> = {
    Nanisme: ['Le métamorphe rapetisse, le Simulacre se recroqueville.', 'Plus aucun sort de Magie de degré 5 ou plus.'],
    Gigantisme: ['Le métamorphe grandit au-delà du Simulacre.', 'Plus aucune Magie du Ka dominant ; le Simulacre devient très maladroit.'],
    'Forme éthérale': ['Le métamorphe perd sa substance.', 'Plus aucune formule d’Alchimie du Ka dominant.'],
    'Forme élémentaire': ['Manifestations incontrôlées du Ka dominant, visibles en vision-Ka.', 'Plus aucune invocation de Kabbale du Ka dominant.'],
};
const EFFETS: Record<'ombre' | 'narcose', string[]> = {
    ombre: ['Le Simulacre cherche à reprendre le contrôle : hagard sur son Vécu contemporain.', 'Chaque jour, le Simulacre teste son Ka-Soleil : réussi, le Nephilim part en Ombre pour la journée.'],
    narcose: ['Attachement croissant à un type de lieu.', 'Il ne peut plus quitter le lieu ; menacé, son Ka dominant s’y échappe d’un degré par semaine.'],
};

export interface EtatDUneChute { nom: NomDeChute; label: string; degre: number; palier: 0 | 1 | 2 | 3 | 4; effet?: string }

/** Les trois Chutes, leur palier et ce qu'il fait (p. 149-152). */
export function etatDesChutes(regle: RegleDeNephilim, valeurs: Record<string, unknown>): { chutes: EtatDUneChute[]; alerte?: string } {
    const c = regle.chutes;
    if (!c) return { chutes: [] };
    const forme = FORMES_DU_KHAIBA.find(f => f === String(valeurs[c.forme ?? ''] ?? '').trim());
    const chutes = (['khaiba', 'ombre', 'narcose'] as const).map(nom => {
        const degre = Math.max(0, n(valeurs[c[nom]])), palier = palierDeChute(degre);
        const textes = nom === 'khaiba' ? (forme ? EFFETS_DU_KHAIBA[forme] : undefined) : EFFETS[nom];
        const effet = palier === 1 ? textes?.[0] : palier === 2 ? textes?.[1]
            : palier === 3 ? 'Le Nephilim n’est plus jouable : le MJ le joue comme un PNJ, des soins restent possibles.'
            : palier === 4 ? 'Perte définitive : le personnage n’est plus jouable.' : undefined;
        return { nom, label: nom === 'khaiba' && forme ? `Khaïba (${forme})` : NOMS_DES_CHUTES[nom], degre, palier, ...(effet ? { effet } : {}) };
    });
    const pire = Math.max(...chutes.map(ch => ch.palier));
    const alerte = pire === 4 ? 'Une Chute atteint 10 : le Nephilim est perdu (p. 149).'
        : pire === 3 ? 'Une Chute atteint 8 : le joueur confie son Nephilim au MJ jusqu’à ce qu’elle redescende (p. 148).' : undefined;
    return { chutes, ...(alerte ? { alerte } : {}) };
}

/** La mise en jeu d'une Chute (p. 152) : de 1 à 4, une fois par séance ; autant de PS que de degrés. */
export function miseEnJeuPossible(degre: number, dejaMiseEnJeu: boolean): { possible: boolean; sapience: number; raison?: string } {
    if (degre <= 0) return { possible: false, sapience: 0, raison: 'Aucun degré à mettre en jeu.' };
    if (degre > 4) return { possible: false, sapience: 0, raison: 'Au-delà de 4, la Chute ne se met plus en jeu (p. 149).' };
    if (dejaMiseEnJeu) return { possible: false, sapience: 0, raison: 'Déjà mise en jeu cette séance (p. 152).' };
    return { possible: true, sapience: degre };
}

// ——— N1, N3, N8, N9 · Le jet de Nephilim ———

export interface JetDeNephilim {
    /** Le Vécu ou l'Art après les malus et l'Effet Mnémos en tant que Vécu. */
    vecu: number;
    /** Ce qui s'ajoute aux degrés : lieu, conjonction, métamorphe, Impressionner. */
    bonus: number;
    /** Ce que le panneau affiche, et ce qu'il refuse de lancer. */
    remarques: string[];
    avertissements: string[];
    /**
     * Ce que le lancer coûtera : PS (Mnémos, Sacrifice), jeton de Traque (Impressionner).
     * `deChute` : la part de l'Effet Mnémos payée d'abord par les PS d'une Chute mise en jeu (p. 152).
     */
    couts: { sapience: number; traque: number; deChute: number };
    /** Ce que le panneau propose ici. */
    actionMagique: boolean;
    art?: 'magie' | 'kabbale' | 'alchimie';
    elementDuJet?: Element;
    malus: { physique: number; magique: number };
    metamorphe?: { possible: number; exprimes: number };
    mnemos?: { possible: boolean; max: number; degres: number };
    sacrifice?: { possible: boolean; raison?: string; retenu: boolean };
    /** Ce qui compte pour le Seuil RK (errata p. 146) : approche, métamorphe, Khaïba et Narcose au-delà de 4. */
    rk?: { valeur: number; seuil?: number; depasse: boolean; detail: string };
}

type Sections = readonly { id: string; fields: readonly { id: string }[] }[];

/**
 * Ce que Nephilim change au jet composé par `preparerLeJet` : la fiche, les
 * choix, les champs retenus et le Vécu lu. Rien ne s'écrit ici.
 */
export function jetDeNephilim(
    regle: RegleDeNephilim,
    valeurs: Record<string, unknown>,
    retenus: Record<string, string>,
    choix: ChoixDeNephilim,
    vecuLu: number,
    sections: Sections = [],
): JetDeNephilim {
    const remarques: string[] = [], avertissements: string[] = [];
    const ids = regle.composantes ?? {};
    const champVecu = retenus[ids.vecu ?? 'vecu'], champApproche = retenus[ids.approche ?? 'approche'];
    const champFormule = retenus[ids.formule ?? 'formule'], champSort = retenus[ids.sort ?? 'sort'];
    const sectionDe = (champ?: string) => champ ? sections.find(s => s.fields.some(f => f.id === champ))?.id : undefined;
    const sectionDuVecu = sectionDe(champVecu);
    const art = (['magie', 'kabbale', 'alchimie'] as const).find(a => (regle.arts?.[a] ?? []).includes(sectionDuVecu ?? ''));
    const dominant = regle.kaDominant ? element(valeurs[regle.kaDominant.choix]) : undefined;
    const elementDuJet = elementDuChamp(champApproche);
    const malus = malusDesConsequences(regle, valeurs);
    let vecu = vecuLu, bonus = 0;
    const couts = { sapience: 0, traque: 0, deChute: 0 };

    // N6 · L'Effet Mnémos en tant que Vécu : 1 PS par degré, sans dépasser le Vécu passé (p. 119).
    const passe = !!champVecu && (regle.vecusPasses ?? []).includes(sectionDuVecu ?? '') && champVecu !== regle.vecuContemporain;
    const sapience = regle.sapience ? Math.max(0, n(valeurs[regle.sapience])) : 0;
    const deChute = regle.chutes?.sapienceDeChute ? Math.max(0, n(valeurs[regle.chutes.sapienceDeChute])) : 0;
    let mnemos: JetDeNephilim['mnemos'];
    if (regle.sapience && passe) {
        const max = Math.max(0, Math.min(vecuLu, sapience + deChute));
        const degres = Math.min(max, Math.max(0, Math.trunc(choix.mnemosVecu ?? 0)));
        mnemos = { possible: max > 0, max, degres };
        if (degres > 0) {
            vecu = degres; couts.deChute = Math.min(deChute, degres); couts.sapience += degres - couts.deChute;
            remarques.push(`Effet Mnémos en tant que Vécu : ${degres} degré${degres > 1 ? 's' : ''} pour ${degres} PS, le temps d’une action (p. 119).`);
        }
    }

    // N1 · Les Conséquences : on retire le malus au Vécu (minimum 0), puis l'approche s'ajoute (p. 137).
    const actionMagique = !!art;
    const retire = (actionMagique ? malus.magique : 0) + (choix.actionPhysique ? malus.physique : 0);
    if (retire > 0) {
        const avant = vecu;
        vecu = Math.max(0, vecu - retire);
        remarques.push(`Conséquences ${[actionMagique && malus.magique ? `magiques −${malus.magique}` : '', choix.actionPhysique && malus.physique ? `physiques −${malus.physique}` : ''].filter(Boolean).join(', ')} : ${avant} → ${vecu} avant l’approche (p. 137-138).`);
        if (retire >= avant && avant > 0) remarques.push('Le malus atteint le Vécu : sans soins, chaque approche coûte un degré de dommages magiques (p. 137).');
    }
    if (malus.physique > 0 && !choix.actionPhysique && !actionMagique) {
        remarques.push(`Conséquences physiques cochées (−${malus.physique}) : à retirer si l’action est physique.`);
    }

    // N8 · Le lieu et la conjonction, pour un jet qui use d'un Ka.
    const lieu = bonusDuLieu(elementDuJet, choix.lieu, choix.conjonction, choix.intensite);
    if (lieu.total) { bonus += lieu.total; remarques.push(`${lieu.details.join(', ')} (p. 160).`); }

    // N9 · Le métamorphe exprimé, sur une approche du Ka dominant (p. 112).
    let metamorphe: JetDeNephilim['metamorphe'];
    const degreMeta = regle.metamorphe ? Math.max(0, n(valeurs[regle.metamorphe.degre])) : 0;
    const visibles = degresVisibles(regle, valeurs);
    if (regle.metamorphe && elementDuJet && dominant === elementDuJet) {
        const possible = Math.max(0, degreMeta - visibles);
        const exprimes = Math.min(possible, Math.max(0, Math.trunc(choix.metamorphe ?? 0)));
        metamorphe = { possible, exprimes };
        if (exprimes > 0) {
            bonus += exprimes;
            remarques.push(`Métamorphe exprimé +${exprimes} : visible ${exprimes} heure${exprimes > 1 ? 's' : ''} ; une maladresse en rend un degré visible pour toujours (p. 112).`);
        }
    }
    if (choix.impressionner) {
        bonus += 2; couts.traque += 1;
        remarques.push('Impressionner : +2 à l’action sociale, un jeton de Traque (p. 113).');
    }

    // N3 · Les interdits du Khaïba, du palier 5-7 (p. 150-151). Ils empêchent de lancer.
    const c = regle.chutes;
    const khaiba = c ? Math.max(0, n(valeurs[c.khaiba])) : 0;
    const forme = c?.forme ? String(valeurs[c.forme] ?? '').trim() : '';
    const degreDe = (champ?: string) => (champ ? n(valeurs[champ]) : 0);
    const elementSur = (champ?: string) => champ ? element(valeurs[champ.replace(/_degree$/, '_element')]) : undefined;
    if (khaiba >= 5) {
        if (forme === 'Nanisme' && art === 'magie' && champSort && degreDe(champSort) >= 5) avertissements.push(`Khaïba ${khaiba}, Nanisme : plus aucun sort de Magie de degré 5 ou plus (p. 150).`);
        if (forme === 'Gigantisme' && art === 'magie' && dominant && elementDuJet === dominant) avertissements.push(`Khaïba ${khaiba}, Gigantisme : plus aucune Magie du Ka dominant (${dominant}, p. 150).`);
        if (forme === 'Forme éthérale' && art === 'alchimie' && dominant && elementSur(champFormule) === dominant) avertissements.push(`Khaïba ${khaiba}, forme éthérale : plus aucune formule d’Alchimie du Ka dominant (${dominant}, p. 150).`);
        if (forme === 'Forme élémentaire' && art === 'kabbale' && dominant && elementDuJet === dominant) avertissements.push(`Khaïba ${khaiba}, forme élémentaire : plus aucune invocation de Kabbale du Ka dominant (${dominant}, p. 151).`);
    }
    // N7 · L'Alchimie : le construct assemblé pour cette Œuvre (errata p. 217) ; l'Œuvre au blanc prend le Ka le moins développé (p. 220).
    const construct = champApproche?.match(/^(.*_)(fire|air|water|earth|moon)$/);
    const assemblage = construct ? regle.alchimie?.assemblage?.[construct[1].replace(/_$/, '')] : undefined;
    if (art === 'alchimie' && assemblage) {
        const oeuvre = regle.alchimie?.oeuvres?.[champVecu ?? ''] ?? 0;
        const assemble = ['', 'Œuvre au noir', 'Œuvre au blanc', 'Œuvre au rouge'].indexOf(String(valeurs[assemblage] ?? '').trim());
        if (assemble <= 0) remarques.push('L’assemblage de ce construct n’est pas noté sur la fiche (errata p. 217).');
        else if (assemble < oeuvre) avertissements.push(`Ce construct est assemblé pour l’${['', 'Œuvre au noir', 'Œuvre au blanc', 'Œuvre au rouge'][assemble]} : il ne transmute pas les formules d’une Œuvre supérieure (p. 216).`);
    }
    const second = regle.alchimie?.secondElement;
    const element2 = champFormule && second ? element(valeurs[champFormule.replace(new RegExp(second.remplacer), second.par)]) : undefined;
    if (art === 'alchimie' && construct && element2) {
        const suffixe = Object.keys(SUFFIXES).find(k => SUFFIXES[k] === element2)!;
        const premier = n(valeurs[champApproche!]), autre = n(valeurs[`${construct[1]}${suffixe}`]);
        if (autre < premier) {
            bonus -= premier - autre;
            remarques.push(`Œuvre au blanc : le Ka-${element2} du construct (${autre}) est le moins développé, il remplace le Ka-${elementDuJet} (${premier}) (p. 220).`);
        }
    }

    if (art === 'magie' && champSort && elementDuJet && elementSur(champSort) && elementSur(champSort) !== elementDuJet) {
        remarques.push(`Le sort est de ${elementSur(champSort)} : son Ka est le Ka à utiliser pour le lancer (p. 183).`);
    }

    // N6 · Le Sacrifice : 5 PS, réussite d'office, pas au-delà de l'Art (p. 183).
    let sacrifice: JetDeNephilim['sacrifice'];
    if (art === 'magie' && regle.sapience) {
        const raison = sapience < 5 ? 'Il faut 5 Points de Sapience.'
            : champSort && degreDe(champSort) > vecuLu ? `Le sort (degré ${degreDe(champSort)}) dépasse l’Art (${vecuLu}).` : undefined;
        sacrifice = { possible: !raison, ...(raison ? { raison } : {}), retenu: !!choix.sacrifice && !raison };
        if (sacrifice.retenu) { couts.sapience += 5; remarques.push('Sacrifice : 5 PS, le rituel réussit d’office (p. 183).'); }
    }
    if (couts.sapience > sapience) avertissements.push(`Il faut ${couts.sapience} Points de Sapience ; la fiche en porte ${sapience}.`);

    // N9 · Le Seuil RK : approche + métamorphe exprimé et visible + Khaïba et Narcose au-delà de 4 (errata p. 146).
    let rk: JetDeNephilim['rk'];
    if (champApproche || art) {
        const ka = champApproche ? n(valeurs[champApproche]) : 0;
        const narcose = c ? Math.max(0, n(valeurs[c.narcose])) : 0;
        const exprimes = metamorphe?.exprimes ?? 0;
        const parts = [`approche ${ka}`, ...(exprimes ? [`métamorphe ${exprimes}`] : []), ...(visibles ? [`visible ${visibles}`] : []),
            ...(khaiba > 4 ? [`Khaïba ${khaiba}`] : []), ...(narcose > 4 ? [`Narcose ${narcose}`] : [])];
        const valeur = ka + exprimes + visibles + (khaiba > 4 ? khaiba : 0) + (narcose > 4 ? narcose : 0);
        const seuil = choix.seuilRK;
        rk = { valeur, ...(seuil !== undefined ? { seuil } : {}), depasse: seuil !== undefined && (valeur > seuil || !!art), detail: parts.join(' + ') };
    }

    return { vecu, bonus, remarques, avertissements, couts, actionMagique, ...(art ? { art } : {}), ...(elementDuJet ? { elementDuJet } : {}), malus,
        ...(metamorphe ? { metamorphe } : {}), ...(mnemos ? { mnemos } : {}), ...(sacrifice ? { sacrifice } : {}), ...(rk ? { rk } : {}) };
}

// ——— N4 · Les actions opposées et le pacte de Kabbale ———

export type IssueOpposee = 'attaquant' | 'defenseur' | 'aucun';
type Classe = 'critique' | 'succes' | 'echec' | 'maladresse';

const classe = (degre: DegreDeReussite): Classe =>
    degre === 'reussite-particuliere' ? 'critique' : estUneReussite(degre) ? 'succes' : degre === 'echec-total' ? 'maladresse' : 'echec';

/** La table des actions opposées (p. 123) : la ligne de l'actif, la colonne du passif. */
const TABLE: Record<Classe, Record<Classe, IssueOpposee | 'plus-haut'>> = {
    critique: { critique: 'plus-haut', succes: 'attaquant', echec: 'attaquant', maladresse: 'attaquant' },
    succes: { critique: 'defenseur', succes: 'plus-haut', echec: 'attaquant', maladresse: 'attaquant' },
    echec: { critique: 'defenseur', succes: 'defenseur', echec: 'aucun', maladresse: 'attaquant' },
    maladresse: { critique: 'defenseur', succes: 'defenseur', echec: 'defenseur', maladresse: 'aucun' },
};

export interface TestOppose { degres: number; tirage: number }
export interface ResultatOppose {
    attaquant: { degre: DegreDeReussite; marge: number | null; chances: number };
    defenseur: { degre: DegreDeReussite; marge: number | null; chances: number };
    vainqueur: IssueOpposee;
}

/**
 * Deux tests de Nephilim l'un contre l'autre (p. 123). « Le plus haut tirage
 * l'emporte » : chaque degré au-delà de dix ajoute un point à la marge (errata
 * p. 123), puis le tirage départage.
 */
export function opposer(attaquant: TestOppose, defenseur: TestOppose): ResultatOppose {
    const lire = (t: TestOppose) => {
        const cible = cibleDeNephilim(t.degres, 0);
        const degre = degreDuDe(t.tirage, cible.echelle);
        return { degre, marge: margeDuJet(t.tirage, cible.echelle), chances: cible.chances };
    };
    const a = lire(attaquant), d = lire(defenseur);
    const caseDeLaTable = TABLE[classe(a.degre)][classe(d.degre)];
    let vainqueur: IssueOpposee;
    if (caseDeLaTable !== 'plus-haut') vainqueur = caseDeLaTable;
    else {
        const ma = a.marge ?? 0, md = d.marge ?? 0;
        vainqueur = ma !== md ? (ma > md ? 'attaquant' : 'defenseur')
            : attaquant.tirage !== defenseur.tirage ? (attaquant.tirage > defenseur.tirage ? 'attaquant' : 'defenseur') : 'aucun';
    }
    return { attaquant: a, defenseur: d, vainqueur };
}

/** Ce que dit le pacte, d'après l'issue (p. 198) : noué, refusé avec ses dommages, ou banni sur une maladresse. */
export function issueDuPacte(r: ResultatOppose, degreDeLInvocation: number): { noue: boolean; texte: string; dommages: number } {
    if (r.vainqueur === 'attaquant') return { noue: true, dommages: 0, texte: 'Pacte noué : la créature est liée jusqu’à nouvel ordre ; il faudra toujours réussir le test d’invocation.' };
    const dommages = r.vainqueur === 'defenseur' ? degreDeLInvocation : 0;
    if (r.attaquant.degre === 'echec-total') return { noue: false, dommages, texte: `Maladresse : banni du fief de la créature jusqu’à un degré de plus dans la Sephirah${dommages ? `, et ${dommages} dommages magiques` : ''}.` };
    if (r.vainqueur === 'defenseur') return { noue: false, dommages, texte: `Pacte refusé : ${dommages} dommages magiques ; pas de nouvelle invocation de la créature avant de les avoir éliminés.` };
    return { noue: false, dommages: 0, texte: 'Aucun gagnant : pas de pacte, rien n’est subi ; le duel peut reprendre plus tard.' };
}

// ——— N2 · Encaisser les dommages ———

export interface OptionDEncaissement {
    /** Les champs à cocher. */
    cocher: string[];
    texte: string;
}

/** Les cases ouvertes par le Ka-Terre (p. 136), cochées ou non. */
export function casesOuvertes(piste: PisteDeSante, kaTerre: number): PisteDeSante['cases'] {
    return piste.cases.filter(c => (c.kaTerre ?? 0) <= kaTerre);
}

/**
 * **Les façons permises d'absorber ces dommages** (p. 136) : une case libre de
 * valeur au moins égale — la plus petite —, ou une ou plusieurs Conséquences,
 * le reste dans une case. Vide : hors de combat (physique), ou un degré de
 * Chute (magique). Le joueur choisit ; rien n'est coché ici.
 */
export function optionsDEncaissement(piste: PisteDeSante, valeurs: Record<string, unknown>, kaTerre: number, degres: number): OptionDEncaissement[] {
    if (degres <= 0) return [];
    const libres = casesOuvertes(piste, kaTerre).filter(c => !coche(valeurs[c.champ]));
    const caseQuiAbsorbe = (reste: number) => libres.filter(c => c.valeur >= reste).sort((x, y) => x.valeur - y.valeur)[0];
    const options: OptionDEncaissement[] = [];
    const seule = caseQuiAbsorbe(degres);
    if (seule) options.push({ cocher: [seule.champ], texte: `Cocher la case de ${seule.valeur}` });
    const consequences = piste.consequences.filter(c => !coche(valeurs[c.champ]));
    for (let masque = 1; masque < 1 << consequences.length; masque++) {
        const retenues = consequences.filter((_, i) => masque & (1 << i));
        const absorbe = retenues.reduce((s, c) => s + c.absorbe, 0);
        const reste = degres - absorbe;
        // Une Conséquence de trop n'est pas une option : la plus petite combinaison qui suffit.
        if (reste <= 0 && retenues.some(c => absorbe - c.absorbe >= degres)) continue;
        const noms = retenues.map(c => c.label.toLowerCase()).join(' et ');
        if (reste <= 0) options.push({ cocher: retenues.map(c => c.champ), texte: `Conséquence ${noms}` });
        else {
            const complement = caseQuiAbsorbe(reste);
            if (complement) options.push({ cocher: [...retenues.map(c => c.champ), complement.champ], texte: `Conséquence ${noms}, et la case de ${complement.valeur}` });
        }
    }
    return options;
}

/** La durée de guérison d'une Conséquence : 11 − Ka-Terre (minimum 1), dans l'unité de sa gravité (p. 138-139). */
export function dureeDeGuerison(kaTerre: number, gravite: 'mineure' | 'serieuse' | 'grave', magique: boolean): string {
    const nombre = Math.max(1, 11 - kaTerre);
    const unites = magique ? { mineure: 'heures', serieuse: 'jours', grave: 'semaines' } : { mineure: 'jours', serieuse: 'semaines', grave: 'mois' };
    return `${nombre} ${unites[gravite]}`;
}

// ——— N6 · L'expérience ———

/** Le coût d'un degré, d'après la table de l'expérience (p. 155) : la valeur visée, démultipliée au-delà de 5 et de 10. */
export function coutDeLExperience(cible: number, ka = false): number {
    if (cible <= 0) return 0;
    if (ka) return cible <= 10 ? cible * 10 : 200 + (cible - 11) * 100;
    if (cible <= 5) return cible;
    return ({ 6: 10, 7: 15, 8: 20, 9: 30, 10: 50 } as Record<number, number>)[cible] ?? 100;
}

/** Un test de stase : le Ka actuel de la stase, sans autre modificateur (p. 139). */
export function testDeStase(stase: number, tirage: number): { chances: number; degre: DegreDeReussite; reussi: boolean } {
    const cible = cibleDeNephilim(Math.max(0, stase), 0);
    const degre = degreDuDe(tirage, cible.echelle);
    return { chances: cible.chances, degre, reussi: estUneReussite(degre) };
}
