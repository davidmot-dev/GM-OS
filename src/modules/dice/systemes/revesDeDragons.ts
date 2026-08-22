/**
 * Rêves de Dragons — la table de Résolution et les résultats spéciaux.
 *
 * **Ces nombres viennent du livre, jamais d'un modèle.** *Livre du Voyageur*
 * 2.3.1, sections « Extension de la table de Résolution » et « Résultats
 * spéciaux », pages 33-34. Ils se saisissent une fois et se protègent par un
 * test — *une Forge qui « dérive » une table de nombres produit des nombres
 * plausibles et faux que personne ne verra avant six séances.*
 *
 * **Le dégât que ce fichier corrige.** Le pilote RdD composait
 * `seuil = caractéristique + compétence`. Or la compétence n'est pas dans
 * l'ordonnée de la table, elle est dans l'**abscisse** : elle ne s'ajoute pas au
 * pourcentage, elle déplace la colonne, **donc elle multiplie**. Agilité 12 avec
 * +3 en compétence à difficulté moyenne vaut **78 %** et non 15 % — facteur
 * cinq, dans le sens qui fait échouer les personnages compétents. *Les joueurs
 * concluent que leurs personnages sont mauvais, jamais que l'outil se trompe.*
 *
 * Le module est **pur et sans dépendance** : un jet faux ne se voit jamais en
 * séance, donc il se vérifie par des tests et non par l'œil.
 */

import type { EchelleDuJet } from '../degresDeReussite';

/** Le dé à cent faces rend 1 à 100 ; le livre écrit « 00 » pour 100. */
export const FACES_DU_DE = 100;

/**
 * Multiplicateur appliqué à la caractéristique, par Ajustement Général.
 *
 * Section « Extension de la table de Résolution » : **−8 vaut ×1**, et chaque
 * colonne vers la droite ajoute 0,5 — donc 0 (difficulté moyenne) vaut ×5 et +10
 * vaut ×10. **En dessous, deux paliers à part** : −9 divise par deux, −10 divise
 * par quatre. *Ce n'est pas une progression régulière qu'on pourrait prolonger :
 * c'est là que la courbe casse, et c'est pourquoi elle est écrite en toutes
 * lettres.*
 */
export const MULTIPLICATEUR_PAR_AJUSTEMENT: Readonly<Record<number, number>> = {
    [-10]: 0.25,
    [-9]: 0.5,
    [-8]: 1,
    [-7]: 1.5,
    [-6]: 2,
    [-5]: 2.5,
    [-4]: 3,
    [-3]: 3.5,
    [-2]: 4,
    [-1]: 4.5,
    [0]: 5,
    [1]: 5.5,
    [2]: 6,
    [3]: 6.5,
    [4]: 7,
    [5]: 7.5,
    [6]: 8,
    [7]: 8.5,
    [8]: 9,
    [9]: 9.5,
    [10]: 10,
};

export const AJUSTEMENT_MAXIMAL = 10;
/** En dessous, on quitte la table de Résolution pour celle du § « Ajustement inférieur ». */
export const AJUSTEMENT_MINIMAL_DE_LA_TABLE = -10;

/**
 * Une ligne de la table des résultats spéciaux.
 *
 * `part` est un **plafond** (le dé lui est inférieur ou égal) ; `echP` et `echT`
 * sont des **planchers** (le dé leur est supérieur ou égal). `null` signifie que
 * le livre imprime « — » : le degré **n'existe pas** à ce niveau de chances.
 */
interface LigneDesResultatsSpeciaux {
    /** Borne haute du palier de chances — la ligne « 26-30 » porte 30. */
    jusqua: number;
    part: number;
    echP: number | null;
    echT: number | null;
}

/**
 * Table des résultats spéciaux, transcrite ligne à ligne, page 33.
 *
 * **La table fait foi, y compris contre la phrase qui prétend la résumer.** La
 * règle en prose annonce « les derniers 20 % de la marge d'échec » : à 30 % de
 * chances, la marge vaut 70, ses derniers 20 % feraient 14 points, donc un échec
 * particulier à partir de **87**. *La table imprime 86.* C'est une approximation
 * linéaire — `echP` vaut 80 plus le numéro de palier — et non la fraction
 * annoncée. On transcrit ce qui est imprimé.
 *
 * **Et la régularité a une exception, qui est la raison même de transcrire** :
 * `echT` monte d'un point tous les deux paliers (92, 92, 93, 93, …) **sauf à la
 * dernière ligne qui la porte, 91-95, où elle plafonne à 100** au lieu du 101
 * que la régularité annoncerait.
 */
export const RESULTATS_SPECIAUX: readonly LigneDesResultatsSpeciaux[] = [
    { jusqua: 5, part: 1, echP: 81, echT: 92 },
    { jusqua: 10, part: 2, echP: 82, echT: 92 },
    { jusqua: 15, part: 3, echP: 83, echT: 93 },
    { jusqua: 20, part: 4, echP: 84, echT: 93 },
    { jusqua: 25, part: 5, echP: 85, echT: 94 },
    { jusqua: 30, part: 6, echP: 86, echT: 94 },
    { jusqua: 35, part: 7, echP: 87, echT: 95 },
    { jusqua: 40, part: 8, echP: 88, echT: 95 },
    { jusqua: 45, part: 9, echP: 89, echT: 96 },
    { jusqua: 50, part: 10, echP: 90, echT: 96 },
    { jusqua: 55, part: 11, echP: 91, echT: 97 },
    { jusqua: 60, part: 12, echP: 92, echT: 97 },
    { jusqua: 65, part: 13, echP: 93, echT: 98 },
    { jusqua: 70, part: 14, echP: 94, echT: 98 },
    { jusqua: 75, part: 15, echP: 95, echT: 99 },
    { jusqua: 80, part: 16, echP: 96, echT: 99 },
    { jusqua: 85, part: 17, echP: 97, echT: 100 },
    { jusqua: 90, part: 18, echP: 98, echT: 100 },
    // Dernière ligne à porter un échec total, et la seule à rompre la régularité.
    { jusqua: 95, part: 19, echP: 99, echT: 100 },
    // 96-00 : plus d'échec particulier. Le seul résultat qui rate, 100, est TOTAL.
    { jusqua: 100, part: 20, echP: null, echT: 100 },
    // Au-delà de cent pour cent, plus aucun échec : « 00 » y est un échec normal.
    { jusqua: 105, part: 21, echP: null, echT: null },
    { jusqua: 110, part: 22, echP: null, echT: null },
];

/**
 * Seuil d'échec total quand l'Ajustement Général tombe sous −10, page 34.
 *
 * **Elle corrige une erreur des fiches du corpus**, qui écrivent que *« l'échec
 * total s'élève de 90 % à 98 % »* : elles confondent le **seuil** et la
 * **probabilité**. Le seuil **descend** de 90 à 02 ; c'est la probabilité qui
 * monte, de 11 % à 99 %.
 *
 * Dans toute cette zone la réussite vaut **01 sec**, il n'y a ni particulière ni
 * significative, et **tout échec qui n'est pas total est particulier**.
 */
export const AJUSTEMENT_INFERIEUR: Readonly<Record<number, number>> = {
    [-11]: 90,
    [-12]: 70,
    [-13]: 50,
    [-14]: 30,
    [-15]: 10,
    [-16]: 2,
};

/** À partir de cet ajustement, plus aucune réussite : tout jet est un échec total. */
export const AJUSTEMENT_SANS_RETOUR = -17;

/**
 * Ce qu'un jet peut rendre, une fois la cible et ses bandes connues.
 *
 * Les quatre bandes valent `null` quand le degré **n'existe pas** pour ces
 * chances — ce que le livre imprime « — ». *Zéro aurait voulu dire « la bande
 * commence à zéro », ce qui est faux et se serait vu au premier jet.*
 */
export interface BandesDuJet extends EchelleDuJet {
    /**
     * Ce que le calcul a dû supposer, dit au joueur plutôt que tu.
     *
     * *Un pourcentage faux ne se plaint de rien* : si l'on sort du domaine que
     * le livre imprime, on le dit ici au lieu de rendre un nombre plausible.
     */
    remarques: string[];
}

/**
 * Les chances de réussite : **caractéristique × multiplicateur(ajustement)**.
 *
 * `ajustement` est la somme de la difficulté, de la compétence et du malus
 * d'état général (section « Fonctionnement ») — **c'est l'appelant qui la
 * compose**, parce que c'est lui qui sait ce que la fiche porte.
 *
 * Arrondi **toujours à l'inférieur** : *« tous les pourcentages obtenus par
 * multiplication ou division sont systématiquement arrondis au chiffre
 * inférieur »* (section « Extension de la table de Résolution »).
 */
export function chancesDeReussite(
    caracteristique: number,
    ajustement: number,
    remarques: string[] = [],
): number {
    if (ajustement <= AJUSTEMENT_SANS_RETOUR) return 0;

    if (ajustement < AJUSTEMENT_MINIMAL_DE_LA_TABLE) {
        // De −11 à −16, les chances ne dépendent plus de la caractéristique :
        // elles tombent uniformément à 1 %. Le personnage compétent et le
        // maladroit sont à égalité, et c'est voulu par le jeu.
        return 1;
    }

    /*
      **Au-delà de +10, le livre ne dit rien.** On borne au dernier ajustement
      imprimé plutôt que de prolonger la courbe : prolonger produirait un nombre
      crédible que rien ne fonde. Et on le dit, parce qu'un jet borné en silence
      est un jet faux qui a l'air juste.
    */
    let effectif = ajustement;
    if (ajustement > AJUSTEMENT_MAXIMAL) {
        effectif = AJUSTEMENT_MAXIMAL;
        remarques.push(
            `Ajustement +${ajustement} : la table de Résolution s'arrête à `
            + `+${AJUSTEMENT_MAXIMAL}, le calcul s'y tient.`,
        );
    }

    const multiplicateur = MULTIPLICATEUR_PAR_AJUSTEMENT[effectif];
    return Math.floor(caracteristique * multiplicateur);
}

/**
 * D'où sort le pourcentage, en une ligne — pour l'écran et pour le journal.
 *
 * **L'explication appartient au calcul, jamais à l'affichage.** Le panneau de
 * jet joignait les composantes par « + » : sur un jeu qui multiplie, il aurait
 * montré « 12 + 3 » sous un seuil de 78. *Un écran qui explique faux est pire
 * qu'un écran qui n'explique rien* — il apprend au joueur une règle que le jeu
 * n'a pas.
 */
export function expliquerLesChances(caracteristique: number, ajustement: number): string {
    const signe = ajustement >= 0 ? '+' : '−';
    const ajuste = `ajustement ${signe}${Math.abs(ajustement)}`;

    if (ajustement <= AJUSTEMENT_SANS_RETOUR) {
        return `${ajuste} : aucune réussite n'est possible.`;
    }

    if (ajustement < AJUSTEMENT_MINIMAL_DE_LA_TABLE) {
        return `${ajuste} : 1 % quel que soit le personnage.`;
    }

    const effectif = Math.min(ajustement, AJUSTEMENT_MAXIMAL);
    const multiplicateur = String(MULTIPLICATEUR_PAR_AJUSTEMENT[effectif]).replace('.', ',');
    return `${caracteristique} × ${multiplicateur} (${ajuste})`;
}

/**
 * La ligne des résultats spéciaux qui couvre ces chances, ou `null` au-delà de
 * ce que le livre imprime.
 */
function ligneDesResultats(chances: number): LigneDesResultatsSpeciaux | null {
    return RESULTATS_SPECIAUX.find(ligne => chances <= ligne.jusqua) ?? null;
}

/**
 * La cible d'un jet et ses quatre bandes, prêtes à qualifier un dé.
 */
export function bandesDuJet(caracteristique: number, ajustement: number): BandesDuJet {
    const remarques: string[] = [];
    const chances = chancesDeReussite(caracteristique, ajustement, remarques);

    if (ajustement <= AJUSTEMENT_SANS_RETOUR) {
        return {
            chances: 0,
            particuliere: null,
            significative: null,
            // Aucune réussite n'est possible et TOUT jet est un échec total :
            // la bande commence donc au premier résultat du dé.
            echecParticulier: null,
            echecTotal: 1,
            remarques,
        };
    }

    if (ajustement < AJUSTEMENT_MINIMAL_DE_LA_TABLE) {
        const echecTotal = AJUSTEMENT_INFERIEUR[ajustement] ?? AJUSTEMENT_INFERIEUR[-16];
        return {
            chances,
            // Ni particulière ni significative dans cette zone : tout succès est
            // une réussite normale (section « Ajustement inférieur »).
            particuliere: null,
            significative: null,
            // « Tout échec devient un échec particulier » : la bande s'ouvre
            // donc au premier résultat qui rate.
            echecParticulier: chances + 1,
            echecTotal,
            remarques,
        };
    }

    const ligne = ligneDesResultats(chances);

    if (!ligne) {
        /*
          Au-delà de 110 %, la table s'arrête. Le cas est atteignable — une
          caractéristique de 20 à +10 d'ajustement donne 200 % — donc il faut
          rendre quelque chose. **On applique alors la règle en prose**, la seule
          chose que le livre dise encore : la particulière vaut le cinquième des
          chances. On le signale, parce que ce n'est plus une transcription.
        */
        remarques.push(
            `${chances} % de chances dépasse la table des résultats spéciaux (110 %) : `
            + 'la réussite particulière est calculée au cinquième des chances.',
        );
        return {
            chances,
            particuliere: Math.floor(chances / 5),
            significative: Math.floor(chances / 2),
            echecParticulier: null,
            echecTotal: null,
            remarques,
        };
    }

    /*
      **La réussite significative n'est PAS dans la table** — trois colonnes
      seulement. Elle se calcule : les chances divisées par deux, arrondies à
      l'inférieur (section « Résultats spéciaux »). À 30 % : 15.
    */
    const significative = Math.floor(chances / 2);

    return {
        chances,
        particuliere: ligne.part,
        // À très basses chances la moitié tombe sous la particulière (à 1 %,
        // 0 contre 1) : la bande n'existe alors pas, et la dire nulle vaut mieux
        // que de la laisser recouvrir la particulière.
        significative: significative > ligne.part ? significative : null,
        echecParticulier: ligne.echP,
        echecTotal: ligne.echT,
        remarques,
    };
}
