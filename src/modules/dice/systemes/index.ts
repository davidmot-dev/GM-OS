/**
 * Les mécaniques de cible — **le seul endroit qui sache qu'un jeu ne compose
 * pas son seuil par addition.**
 *
 * **Pourquoi un registre plutôt qu'un `import` direct.** `DescripteurDeJet` est
 * l'infrastructure commune à tous les jeux : lui faire connaître la table de
 * Rêves de Dragons l'obligerait à connaître ensuite celle de L'Appel de Cthulhu,
 * puis celle de RuneQuest. Il ne connaît que ce fichier, et ce fichier ne connaît
 * que des fonctions pures.
 *
 * **Ce que le pilote déclare, c'est un NOM.** Il dit *« ma cible se calcule par
 * la table de résolution de RdD »* ; il ne porte aucun des nombres de cette
 * table. C'est la même frontière que partout ailleurs : le pilote décrit le jeu,
 * il ne réimplémente pas ses tables — et un modèle qui « dérive » une table de
 * nombres produit des nombres plausibles et faux.
 */

import type { EchelleDuJet } from '../degresDeReussite';
import { bandesDuJet, expliquerLesChances } from './revesDeDragons';

/** Ce qu'une mécanique de cible rend, quelle que soit sa table. */
export interface CibleCalculee {
    /** Le pourcentage à ne pas dépasser au dé. */
    chances: number;
    /**
     * Comment ce nombre a été obtenu, en une ligne, pour l'écran et le journal.
     *
     * **Elle vient de la mécanique et jamais de l'affichage.** Le panneau
     * joignait les composantes par « + » en dur : sur un jeu qui multiplie, il
     * aurait montré « 12 + 3 » sous un seuil de 78, et *un écran qui explique
     * faux est pire qu'un écran qui n'explique rien.*
     */
    explication: string;
    /** Ce que le calcul a dû supposer — dit, jamais tu. */
    remarques: string[];
    /**
     * Les bornes des six degrés, pour qualifier le dé une fois lancé.
     *
     * **Elles voyagent avec la cible parce qu'elles en dépendent** : les bandes
     * se lisent SUR le pourcentage obtenu. Les calculer ailleurs supposerait de
     * refaire le calcul de la cible, et deux calculs de la même chose finissent
     * par diverger.
     */
    echelle: EchelleDuJet;
}

/**
 * Le nom d'une mécanique, tel qu'un pilote peut le déclarer.
 *
 * *Une chaîne libre laisserait passer une faute de frappe jusqu'en séance, où
 * elle se lirait comme un jet raté.*
 */
export type NomDeMecanique = 'reves-de-dragons';

export const MECANIQUES_DE_CIBLE: Readonly<Record<
    NomDeMecanique,
    (caracteristique: number, ajustement: number) => CibleCalculee
>> = {
    'reves-de-dragons': (caracteristique, ajustement) => {
        const bandes = bandesDuJet(caracteristique, ajustement);
        return {
            chances: bandes.chances,
            explication: expliquerLesChances(caracteristique, ajustement),
            remarques: bandes.remarques,
            echelle: bandes,
        };
    },
};
