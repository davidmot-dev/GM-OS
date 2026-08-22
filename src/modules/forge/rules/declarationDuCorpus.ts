import { lireNature, type NatureDuCorpus } from './familleDuCorpus';

/**
 * Écrire ce qu'un corpus déclare de lui-même — **sans perdre ce qu'il déclarait
 * déjà.**
 *
 * **Le réglage n'avait pas d'écran, et c'est le seul défaut.** Un corpus dit sa
 * nature, son moteur et sa langue dans `corpus.json` ; les trois se saisissaient
 * à la main, dans un éditeur de texte, hors de l'application. C'est l'un des
 * deux restes « code » du corpus au § 5 de la réconciliation du 2026-08-19 —
 * *« une UI manquante, rien de plus »*.
 *
 * **Et l'inverse de la règle du projet.** On répète qu'*une valeur qu'on ne peut
 * pas corriger à la main est une valeur qu'on subit* — le type d'un PNJ, le sens
 * d'un dé, la faction d'un combattant. Ici la valeur ne se corrigeait **QUE** à
 * la main, ce qui revient au même : elle est hors de portée de qui n'ouvre pas
 * le dossier.
 *
 * **Pourquoi une fusion et pas une réécriture.** C'est la leçon du trousseau de
 * clés, payée le 2026-08-16 : *retaper une clé détruisait les autres*, parce
 * qu'on réécrivait le coffre entier depuis ce qu'un seul écran connaissait.
 * `corpus.json` peut porter demain des champs que cet écran ignore ; les écraser
 * en réglant la langue serait exactement la même faute.
 */

/** Ce que l'écran sait régler. Une valeur vide **retire** la déclaration. */
export interface DeclarationSaisie {
    nature: 'famille' | 'jeu';
    moteur?: string;
    langue?: string;
}

export type ResultatDeFusion =
    | { json: string; erreur?: undefined }
    | { json?: undefined; erreur: string };

/**
 * Compose le nouveau `corpus.json` à partir de l'ancien et de ce qui est saisi.
 *
 * **Refuse plutôt que d'écraser un fichier illisible.** Un `corpus.json` cassé —
 * une virgule de trop, une main malheureuse — serait silencieusement remplacé
 * par notre version, et ce qu'il portait disparaîtrait sans un mot. *Un fichier
 * qu'on ne sait pas lire est un fichier qu'on ne réécrit pas.*
 *
 * Un fichier **absent**, lui, est un cas normal : neuf corpus sur onze n'en ont
 * pas, et c'est ce qui en fait des jeux.
 */
export function fusionnerLaDeclaration(
    brut: string | null | undefined,
    saisie: DeclarationSaisie,
): ResultatDeFusion {
    let existant: Record<string, unknown> = {};

    if (brut?.trim()) {
        try {
            const lu: unknown = JSON.parse(brut);
            if (!lu || typeof lu !== 'object' || Array.isArray(lu)) {
                return { erreur: 'Le fichier corpus.json existe mais ne contient pas un objet.' };
            }
            existant = lu as Record<string, unknown>;
        } catch {
            return {
                erreur: 'Le fichier corpus.json existe et n’est pas un JSON valide : '
                    + 'il n’a pas été touché, pour ne rien en perdre.',
            };
        }
    }

    const fusionne: Record<string, unknown> = { ...existant, nature: saisie.nature };

    /*
      **Vider un champ le RETIRE**, il ne le met pas à la chaîne vide. Une chaîne
      vide se relit comme une déclaration — « ce corpus est en langue "" » — et
      `lireNature` devrait alors la démentir. L'absence, elle, se lit déjà comme
      une absence partout ailleurs.
    */
    for (const clef of ['moteur', 'langue'] as const) {
        const valeur = saisie[clef]?.trim();
        if (valeur) fusionne[clef] = valeur;
        else delete fusionne[clef];
    }

    return { json: `${JSON.stringify(fusionne, null, 2)}\n` };
}

/**
 * Ce que l'écran doit afficher pour un corpus, avant toute saisie.
 *
 * Un corpus sans déclaration est un **jeu** : c'est le défaut documenté, et
 * l'écran doit le montrer tel quel plutôt que vide — *un champ vide invite à
 * remplir, un champ juste invite à vérifier.*
 */
export function declarationAffichee(brut: string | null | undefined): DeclarationSaisie {
    const nature: NatureDuCorpus | null = lireNature(brut);
    return {
        nature: nature?.nature ?? 'jeu',
        moteur: nature?.moteur ?? '',
        langue: nature?.langue ?? '',
    };
}
