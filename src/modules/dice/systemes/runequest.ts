import type { RollResult } from '../DiceEngine';
import { degreDuDe, estUneReussite, rangDuDegre, type DegreDeReussite, type EchelleDuJet } from '../degresDeReussite';

/**
 * **Le jet de RuneQuest** — 30/10/2026, à la demande de David (« finir le pilote »,
 * livre de base français Deadcrows et son errata, pages **imprimées** : PDF − 1).
 *
 * Le pilote forgé lançait un d100 sous la compétence et ne rendait que réussite ou
 * échec. Le livre a cinq niveaux, **calculés sur les chances modifiées** (p. 142-143) :
 * réussite critique au vingtième, réussite spéciale au cinquième, échec critique dans
 * les 5 % supérieurs des chances d'échec — 00 toujours. 1-5 réussit toujours, 96-00
 * échoue toujours, même au-delà de 100 %. Les nombres de la table p. 143 ne sont pas
 * recopiés : ils se retrouvent tous par ces trois arrondis, et un essai les compare
 * ligne à ligne.
 *
 * S'y ajoutent ce que David a demandé le même jour : le test de caractéristique
 * (×5 à ×0,5, p. 141), la table de résistance (p. 145, errata p. 147), l'augmentation
 * (p. 144-145), l'opposition au-delà de 100 % (p. 144, errata p. 142) et la localisation
 * des coups (p. 146).
 *
 * Tout ici est pur : des nombres entrent, un résultat sort. Le panneau de jet lance le
 * dé ; ce module ne lit ni n'écrit la fiche.
 */

/** Les sept localisations d'un humain, et leur plage au D20 (p. 146). */
export const LOCALISATIONS = [
    { cle: 'jambe-droite', label: 'Jambe droite', de: 1, a: 4 },
    { cle: 'jambe-gauche', label: 'Jambe gauche', de: 5, a: 8 },
    { cle: 'abdomen', label: 'Abdomen', de: 9, a: 11 },
    { cle: 'poitrine', label: 'Poitrine', de: 12, a: 12 },
    { cle: 'bras-droit', label: 'Bras droit', de: 13, a: 15 },
    { cle: 'bras-gauche', label: 'Bras gauche', de: 16, a: 18 },
    { cle: 'tete', label: 'Tête', de: 19, a: 20 },
] as const;

export type Localisation = typeof LOCALISATIONS[number]['cle'];

/** Ce que le pilote nomme pour RuneQuest (`jet.runequest`). */
export interface RegleDeRuneQuest {
    /**
     * Les champs des sept caractéristiques. Retenu au jet, un de ces champs fait un
     * **test de caractéristique** ou un **test de résistance**, jamais un jet sous sa
     * valeur brute : FOR 13 ne donne pas 13 %, mais 65 % à ×5 (p. 141).
     */
    caracteristiques?: string[];
    /** Les points de vie de chaque localisation, pour dire au jet ce que vaut la zone touchée. */
    localisations?: Partial<Record<Localisation, string>>;
}

/** Les multiplicateurs du test de caractéristique (p. 141). */
export const MULTIPLICATEURS_DE_RUNEQUEST = [
    { facteur: 5, label: 'Action simple' },
    { facteur: 4, label: 'Facile' },
    { facteur: 3, label: 'Modérée' },
    { facteur: 2, label: 'Difficile' },
    { facteur: 1, label: 'Très difficile' },
    { facteur: 0.5, label: 'Presque impossible' },
] as const;

/** Les cinq niveaux de résultat du livre (p. 142). */
export type NiveauDeRuneQuest = 'reussite-critique' | 'reussite-speciale' | 'reussite' | 'echec' | 'echec-critique';

export const LIBELLES_DE_RUNEQUEST: Record<NiveauDeRuneQuest, string> = {
    'reussite-critique': 'Réussite critique',
    'reussite-speciale': 'Réussite spéciale',
    reussite: 'Réussite',
    echec: 'Échec',
    'echec-critique': 'Échec critique',
};

/**
 * Le niveau du livre depuis le degré commun. L'échelle de RuneQuest n'a pas d'« échec
 * particulier » : `echecParticulier` vaut `null`, et ce degré ne sort jamais du moteur.
 */
export function niveauDeRuneQuest(degre: DegreDeReussite): NiveauDeRuneQuest {
    switch (degre) {
        case 'reussite-particuliere': return 'reussite-critique';
        case 'reussite-significative': return 'reussite-speciale';
        case 'reussite-normale': return 'reussite';
        case 'echec-total': return 'echec-critique';
        default: return 'echec';
    }
}

/** Ce qu'un test d'augmentation ajoute à l'aptitude augmentée, selon son niveau (p. 144-145). */
export const AUGMENTATIONS_DE_RUNEQUEST: Record<NiveauDeRuneQuest, number> = {
    'reussite-critique': 50,
    'reussite-speciale': 30,
    reussite: 20,
    echec: -20,
    'echec-critique': -50,
};

/** Ce que le joueur règle avant de lancer. */
export interface ChoixDeRuneQuest {
    /** Une caractéristique retenue se teste ×N, ou s'oppose sur la table de résistance. */
    mode: 'test' | 'resistance';
    /** Le multiplicateur du test de caractéristique : 5 dans des circonstances normales (p. 141). */
    multiplicateur: number;
    /** La caractéristique passive de la table de résistance — POU de la cible, TAI de l'objet, PUI du poison. */
    passive: number;
    /** Les modificateurs de situation de la meneuse, en points de pourcentage. */
    modificateur: number;
    /** Retenter après un échec : −25 % (p. 142). */
    nouvelleTentative: boolean;
    /** Ce qu'un test d'augmentation, lancé d'abord, ajoute ou retire (p. 144-145). */
    augmentation: number;
    /** L'aptitude adverse dans une opposition, modificateurs compris. Absente : pas d'opposition. */
    adverse?: number;
}

export const CHOIX_DE_RUNEQUEST: ChoixDeRuneQuest = {
    mode: 'test', multiplicateur: 5, passive: 10, modificateur: 0, nouvelleTentative: false, augmentation: 0,
};

/**
 * Les bornes des niveaux, depuis les chances modifiées.
 *
 * **Trois arrondis au plus proche, et la table p. 143 en sort entière** : critique =
 * 5 % des chances (1 au moins), spéciale = 20 % (1 au moins), échec critique = 5 % des
 * chances d'échec (00 au moins). Calculés en entiers pour qu'un 30 × 0,05 ne tombe
 * jamais à 1,4999… : 30 % donne bien un critique sur 01-02.
 *
 * Les chances de réussite, elles, restent entre 5 et 95 (p. 142, 144), alors que les
 * critiques et spéciales suivent le score au-delà de 100 : 120 % critique sur 01-06.
 */
export function echelleDeRuneQuest(chancesModifiees: number): EchelleDuJet {
    const v = Math.max(0, Math.round(chancesModifiees));
    const critique = Math.max(1, Math.floor((v + 10) / 20));
    const speciale = Math.max(1, Math.floor((2 * v + 5) / 10));
    const echecCritique = Math.max(1, Math.floor((Math.max(0, 100 - v) + 10) / 20));
    return {
        chances: Math.min(95, Math.max(5, v)),
        particuliere: critique,
        significative: speciale,
        echecParticulier: null,
        echecTotal: 101 - echecCritique,
    };
}

const deux = (n: number) => (n >= 100 ? '00' : String(n).padStart(2, '0'));

/** Les plages, dites comme le livre les imprime : « critique 01-03 · spéciale 01-13 · échec critique 99-00 ». */
export function plagesDeRuneQuest(echelle: EchelleDuJet): string {
    const plage = (a: number, b: number) => (a === b ? deux(a) : `${deux(a)}-${deux(b)}`);
    return [
        `critique ${plage(1, echelle.particuliere ?? 1)}`,
        `spéciale ${plage(1, echelle.significative ?? 1)}`,
        `réussite ${plage(1, echelle.chances)}`,
        `échec critique ${plage(echelle.echecTotal ?? 100, 100)}`,
    ].join(' · ');
}

/** Le calcul des chances, tel que le panneau le montre et que le dé le lit. */
export interface CalculDeRuneQuest {
    mode: 'aptitude' | 'caracteristique' | 'resistance';
    /** Les chances modifiées, avant d'être bornées à 5-95 : c'est sur elles que se lisent critique et spéciale. */
    chancesModifiees: number;
    echelle: EchelleDuJet;
    /** Comment les chances sont obtenues ; vide pour une aptitude lancée telle quelle. */
    explication: string;
    remarques: string[];
    /** L'aptitude adverse après l'opposition au-delà de 100 %. */
    adverseReduite?: number;
}

const signe = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);
const decimal = (n: number) => String(n).replace('.', ',');

/**
 * Compose les chances du jet.
 *
 * `valeur` est le score de l'aptitude retenue ; `caracteristique`, son nom quand c'est
 * une caractéristique — elle se teste alors ×N ou sur la table de résistance.
 */
export function calculerRuneQuest(
    retenue: { label: string; valeur: number; caracteristique: boolean },
    choix: ChoixDeRuneQuest,
): CalculDeRuneQuest {
    const remarques: string[] = [];
    const mode: CalculDeRuneQuest['mode'] = !retenue.caracteristique ? 'aptitude' : choix.mode === 'resistance' ? 'resistance' : 'caracteristique';

    // La base : le score de l'aptitude, la caractéristique ×N (p. 141), ou la table de résistance (p. 145).
    let base: number;
    let enTete: string;
    if (mode === 'caracteristique') {
        base = retenue.valeur * choix.multiplicateur;
        enTete = `${retenue.label} ${retenue.valeur} × ${decimal(choix.multiplicateur)}`;
    } else if (mode === 'resistance') {
        base = 50 + 5 * (retenue.valeur - choix.passive);
        enTete = `50 ${signe(5 * (retenue.valeur - choix.passive))} (${retenue.label} ${retenue.valeur} contre ${choix.passive})`;
    } else {
        base = retenue.valeur;
        enTete = `${retenue.label} ${retenue.valeur} %`;
    }

    const parts: string[] = [];
    let total = base;
    if (choix.augmentation) { total += choix.augmentation; parts.push(`${signe(choix.augmentation)} augmentation`); }
    if (choix.modificateur) { total += choix.modificateur; parts.push(`${signe(choix.modificateur)} situation`); }
    if (choix.nouvelleTentative) { total -= 25; parts.push('− 25 nouvelle tentative'); }

    const arrondi = Math.round(total);
    if (arrondi !== total) remarques.push(`${decimal(total)} % arrondi à ${arrondi} %.`);
    let chances = Math.max(0, arrondi);

    /*
      **L'opposition au-delà de 100 %** (p. 144) : si la meilleure aptitude dépasse 100,
      l'excédent se retire à TOUS les protagonistes, lui compris. Critique et spéciale se
      lisent alors sur le score réduit.
    */
    let adverseReduite: number | undefined;
    if (choix.adverse !== undefined && Number.isFinite(choix.adverse)) {
        const excedent = Math.max(chances, choix.adverse) - 100;
        if (excedent > 0) {
            chances = Math.max(0, chances - excedent);
            adverseReduite = Math.max(0, choix.adverse - excedent);
            parts.push(`− ${excedent} opposition au-delà de 100 %`);
            remarques.push(`Opposition : l’excédent de ${excedent} se retire aux deux camps ; l’adversaire passe à ${adverseReduite} % (p. 144).`);
        } else {
            adverseReduite = choix.adverse;
        }
    }

    const echelle = echelleDeRuneQuest(chances);
    if (chances > 95) remarques.push('Au-delà de 95 %, 96-00 échoue toujours ; le surplus élargit critique et spéciale (p. 144).');
    if (chances < 5) remarques.push('1-5 réussit toujours, quel que soit le score (p. 142).');
    if (mode === 'aptitude' && retenue.valeur <= 0) remarques.push('Un score de 00 % est une chance nulle (p. 57) : à la meneuse de dire si le test a lieu.');

    return {
        mode,
        chancesModifiees: chances,
        echelle,
        // Une aptitude sans modificateur n'a rien à expliquer : « 65 % = 65 % » ne dirait rien.
        explication: parts.length || mode !== 'aptitude' ? `${enTete} ${parts.join(' ')} = ${chances} %`.replace(/\s+/g, ' ') : '',
        remarques,
        ...(adverseReduite !== undefined ? { adverseReduite } : {}),
    };
}

/** Le résultat d'un jet de RuneQuest : celui du moteur, nommé comme le livre. */
export interface JetDeRuneQuest extends RollResult {
    runequest: {
        de: number;
        chances: number;
        niveau: NiveauDeRuneQuest;
        libelle: string;
        plages: string;
    };
}

/**
 * Nomme le jet du moteur. Le degré vient de l'échelle de `preparerLeJet`, déjà posée
 * sur le dé : ce module ne le recalcule pas, il le dit avec les mots du livre.
 */
export function nommerLeJetDeRuneQuest(brut: RollResult, echelle: EchelleDuJet): JetDeRuneQuest {
    // Le total, et jamais le premier dé : le d100 se lance en deux d10, dizaines puis unités.
    const de = brut.total;
    const degre = brut.degre ?? degreDuDe(de, echelle);
    const niveau = niveauDeRuneQuest(degre);
    const libelle = LIBELLES_DE_RUNEQUEST[niveau];
    const plages = plagesDeRuneQuest(echelle);
    return {
        ...brut,
        degre,
        tagSuccess: estUneReussite(degre),
        totalDisplay: `${libelle} — ${deux(de)} contre ${echelle.chances} % (${plages})`,
        runequest: { de, chances: echelle.chances, niveau, libelle, plages },
    };
}

/** L'issue d'une opposition, vue du personnage qui lance. */
export type IssueDeLOpposition = 'gagne' | 'perd' | 'egalite' | 'deux-perdants';

export const LIBELLES_DE_L_OPPOSITION: Record<IssueDeLOpposition, string> = {
    gagne: 'Il l’emporte',
    perd: 'L’adversaire l’emporte',
    egalite: 'Égalité : la situation reste en suspens',
    'deux-perdants': 'Deux perdants : aucun camp n’atteint son objectif',
};

/**
 * Qui l'emporte. **Errata, p. 142 et 144** : si les deux réussissent, le **meilleur
 * niveau de réussite** gagne, et deux niveaux égaux font une égalité — le livre
 * imprimé disait « le plus haut résultat », que l'errata corrige.
 */
export function issueDeLOpposition(lui: DegreDeReussite, adversaire: DegreDeReussite): IssueDeLOpposition {
    const a = estUneReussite(lui);
    const b = estUneReussite(adversaire);
    if (!a && !b) return 'deux-perdants';
    if (a && !b) return 'gagne';
    if (!a && b) return 'perd';
    const ecart = rangDuDegre(adversaire) - rangDuDegre(lui);
    return ecart > 0 ? 'gagne' : ecart < 0 ? 'perd' : 'egalite';
}

/** Le degré du jet adverse, lu sur son aptitude (réduite par l'opposition s'il le faut). */
export function degreAdverse(de: number, chancesAdverses: number): DegreDeReussite {
    return degreDuDe(de, echelleDeRuneQuest(chancesAdverses));
}

/** La localisation touchée par un D20 (p. 146). */
export function localisationDuCoup(d20: number): typeof LOCALISATIONS[number] {
    const de = Math.min(20, Math.max(1, Math.trunc(d20)));
    return LOCALISATIONS.find(l => de >= l.de && de <= l.a)!;
}
