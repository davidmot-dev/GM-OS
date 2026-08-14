import type { FicheDuCorpus, GroupeDeChamps } from './GroupesDeChamps';
import { fichesDuGroupe } from './GroupesDeChamps';

/**
 * Le socle mécanique dont plusieurs jeux héritent — YZE, 2d20, d20.
 *
 * **Ce qui a motivé ce module, mesuré le 2026-08-14.** Le SRD Year Zero Engine
 * forgé en corpus rend **13 des 14 sujets du canevas**, et surtout il porte ce
 * qu'un livre de jeu suppose connu et ne réexplique pas : la mécanique de
 * poussée — le cœur de YZE — que le corpus d'Alien n'a qu'en v1 hors canevas,
 * et le principe que la santé de départ *se calcule depuis des attributs de la
 * fiche*, là où `createDefault('hp')` écrit dix en dur.
 *
 * **La règle qui gouverne tout ici : le jeu l'emporte toujours sur sa famille.**
 * Alien *modifie* YZE — le stress, la panique, les dés de stress lui
 * appartiennent. Une famille qui prendrait le dessus produirait un pilote
 * générique et faux, ce qui est **pire qu'un pilote incomplet** : un manque se
 * voit à la revue, une valeur plausible et fausse se joue en séance.
 *
 * La famille n'intervient donc que là où le corpus du jeu **n'a aucune fiche**,
 * jamais pour compléter ni corriger celles qu'il a.
 *
 * **Et une lacune peut être une réponse.** La Monnaie de table d'Alien est vide
 * parce que le jeu n'a pas de réserve partagée ; le SRD ne la couvre pas non
 * plus, et c'est heureux — un comblement automatique lui en aurait inventé une.
 * D'où le principe : on comble, et **on le dit**.
 */

/** Ce qu'un corpus déclare de lui-même, à la racine dans `corpus.json`. */
export interface NatureDuCorpus {
    /** `famille` : un socle partagé, sans pilote. `jeu` : un jeu, le défaut. */
    nature: 'famille' | 'jeu';
    /**
     * La famille de moteur, quand `nature` vaut `famille`.
     *
     * Les mêmes valeurs que `dice.engine` — `yze`, `2d20`… — pour qu'un pilote
     * et son socle se reconnaissent sans table de correspondance.
     */
    moteur?: string;
}

/**
 * Interprète `corpus.json`. Rend `null` quand le fichier manque ou ne dit rien.
 *
 * **Un corpus sans déclaration est un jeu**, et c'est le bon défaut : neuf des
 * dix corpus de David n'en ont aucune, et ils n'ont pas à en acquérir une pour
 * continuer de fonctionner. On ne fait pas payer une nouveauté à l'existant.
 */
export function lireNature(brut: string | null | undefined): NatureDuCorpus | null {
    if (!brut?.trim()) return null;
    try {
        const lu: unknown = JSON.parse(brut);
        if (!lu || typeof lu !== 'object') return null;
        const { nature, moteur } = lu as Record<string, unknown>;
        if (nature !== 'famille' && nature !== 'jeu') return null;
        return {
            nature,
            moteur: typeof moteur === 'string' && moteur.trim() ? moteur.trim() : undefined,
        };
    } catch {
        return null;
    }
}

/** Ce qu'un groupe a trouvé à lire, et d'où ça vient. */
export interface SourceDuGroupe {
    fiches: FicheDuCorpus[];
    /** Vrai quand aucune fiche du jeu ne couvrait le groupe. */
    venuDeLaFamille: boolean;
}

/**
 * Les fiches d'un groupe : celles du jeu, ou à défaut celles de la famille.
 *
 * **Jamais un mélange des deux.** Additionner les fiches ferait cohabiter deux
 * descriptions de la même mécanique — la générique et celle du jeu — dans une
 * seule invite, et le modèle trancherait au hasard. C'est le défaut du doublon
 * de corpus, qu'on a mis des semaines à voir : *l'Oracle recevait les deux, dont
 * la version que la reforge venait de remplacer.*
 *
 * Le jeu d'abord, entier ; la famille seulement s'il ne dit rien.
 */
export function sourceDuGroupe(
    groupe: GroupeDeChamps,
    fichesDuJeu: readonly FicheDuCorpus[],
    fichesDeLaFamille: readonly FicheDuCorpus[] = [],
): SourceDuGroupe {
    const duJeu = fichesDuGroupe(groupe, fichesDuJeu as FicheDuCorpus[]);
    if (duJeu.length > 0) return { fiches: duJeu, venuDeLaFamille: false };

    const deLaFamille = fichesDuGroupe(groupe, fichesDeLaFamille as FicheDuCorpus[]);
    return { fiches: deLaFamille, venuDeLaFamille: deLaFamille.length > 0 };
}
