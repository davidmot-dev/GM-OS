import { memeTag } from './vocabulaireDesTags';

/**
 * **Écrire ses étiquettes dans la barre de recherche — et surtout en exclure.**
 *
 * ⛔ **Il n'y avait aucune façon de dire « pas ça ».** On pouvait demander
 * *taverne ET nuit*, jamais *taverne SANS combat* — et c'est pourtant la moitié
 * des recherches d'un meneur qui range : *« montre-moi mes décors de taverne,
 * sauf ceux que j'ai déjà employés en combat ».*
 *
 * ⭐ **Et l'exclusion ne se met pas dans une liste à cocher.** Une liste dit ce
 * qu'on veut ; dire ce qu'on ne veut pas demande un troisième état par
 * étiquette, sur cent étiquettes. *La barre de recherche le fait en un
 * caractère.*
 */

export interface RechercheAnalysee {
    /** Ce qui reste à chercher dans le nom et le type. */
    texte: string;
    /** Les étiquettes exigées (`#taverne`). */
    inclus: string[];
    /** Les étiquettes refusées (`-taverne` ou `-#taverne`). */
    exclus: string[];
}

/**
 * **Lire une recherche : du texte, des étiquettes, des refus.**
 *
 * | Ce qu'on tape | Ce que ça veut dire |
 * | :--- | :--- |
 * | `taverne` | du texte — nom, type, étiquette, comme avant |
 * | `#taverne` | **exige** l'étiquette |
 * | `-taverne` | **refuse** l'étiquette |
 * | `-#taverne` | pareil, pour qui aime être explicite |
 *
 * ⚠️ **Un `-` seul, ou un `#` seul, reste du texte.** Un fichier peut s'appeler
 * `plan-B.jpg` ; couper la recherche sur un tiret isolé ferait disparaître ce
 * qu'on cherche, *et la barre de recherche serait devenue un piège.*
 */
export function analyserLaRecherche(recherche: string): RechercheAnalysee {
    const inclus: string[] = [];
    const exclus: string[] = [];
    const mots: string[] = [];

    for (const jeton of (recherche ?? '').split(/\s+/).filter(Boolean)) {
        if (jeton.startsWith('-')) {
            const tag = jeton.slice(1).replace(/^#/, '');
            if (tag) exclus.push(tag);
            else mots.push(jeton);
            continue;
        }
        if (jeton.startsWith('#')) {
            const tag = jeton.slice(1);
            if (tag) inclus.push(tag);
            else mots.push(jeton);
            continue;
        }
        mots.push(jeton);
    }

    return { texte: mots.join(' '), inclus, exclus };
}

/**
 * **Ce média passe-t-il le filtre d'étiquettes ?**
 *
 * ⚠️ **Un refus ne se négocie pas.** Il s'applique quelle que soit la logique
 * choisie pour les exigences : *dire « sauf les combats » en mode OU et voir
 * quand même des combats serait un réglage qui ment.* L'exclusion est donc
 * toujours un ET NON.
 */
export function passeLeFiltreDeTags(
    tagsDuMedia: readonly string[],
    filtre: { inclus?: readonly string[]; exclus?: readonly string[]; logique?: 'ET' | 'OU' },
): boolean {
    const tags = tagsDuMedia ?? [];

    for (const refuse of filtre.exclus ?? []) {
        if (tags.some(t => memeTag(t, refuse))) return false;
    }

    const exiges = filtre.inclus ?? [];
    if (exiges.length === 0) return true;

    return (filtre.logique ?? 'OU') === 'ET'
        ? exiges.every(e => tags.some(t => memeTag(t, e)))
        : exiges.some(e => tags.some(t => memeTag(t, e)));
}
