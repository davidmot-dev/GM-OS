import { normaliserPourLaRecherche } from './rechercheDeMedia';

/**
 * **Le vocabulaire des étiquettes — le tenir propre, et pouvoir le réparer.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT QUI LES ENGENDRE TOUS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * David, le 2026-09-20 : *« je voudrais que la gestion des tags dans le Media
 * Hub soit plus intelligente »*.
 *
 * ⛔ Le champ de saisie ne proposait **rien**. Chaque étiquette se retapait de
 * mémoire, et chaque frappe était donc une occasion de créer un quasi-doublon :
 * `taverne`, `tavernes`, `Taverne`, `taverne ` — quatre entrées dans la liste
 * latérale, quatre filtres qui rendent chacun un quart des fichiers. Et comme
 * rien ne permettait de les **fusionner** ensuite, l'erreur était définitive.
 *
 * ⭐ ***Un vocabulaire qu'on ne peut pas corriger se corrompt à chaque
 * ajout.*** C'est pour cela que ce fichier tient les deux bouts : ce qui
 * **empêche** le doublon à la saisie, et ce qui **répare** celui qui est déjà
 * là.
 */

/**
 * **La forme sous laquelle une étiquette est rangée.**
 *
 * ⚠️ **Les accents sont GARDÉS.** On range `forêt`, pas `foret` : l'étiquette
 * s'affiche au meneur, et une bibliothèque française qui s'écrit sans accents
 * a l'air cassée. La désaccentuation ne sert qu'à **comparer** — voir
 * {@link memeTag}.
 */
export function formeCanonique(brut: string): string {
    return brut.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * **La clé qui dit si deux étiquettes sont la même.**
 *
 * Minuscules, sans accents, et **sans le pluriel** : `Torches`, `torche` et
 * `TORCHE` désignent une seule chose. *Deux étiquettes qu'on ne sait pas
 * distinguer à l'œil ne doivent pas se distinguer dans la liste.*
 *
 * ⚠️ Le `s` final ne tombe qu'à partir de **quatre** lettres : sinon `bois`
 * deviendrait `boi`, et `os` deviendrait `o`.
 */
export function cleDeComparaison(tag: string): string {
    const propre = normaliserPourLaRecherche(formeCanonique(tag));
    return propre.length >= 4 && propre.endsWith('s') ? propre.slice(0, -1) : propre;
}

/** Deux étiquettes désignent-elles la même chose ? */
export const memeTag = (a: string, b: string): boolean =>
    cleDeComparaison(a) === cleDeComparaison(b);

/**
 * **La distance d'édition, bornée à ce qui nous intéresse.**
 *
 * On ne veut pas mesurer la ressemblance de deux mots : on veut savoir si l'un
 * est **une faute de frappe** de l'autre. Au-delà de deux corrections, la
 * réponse est non, et la calculer exactement ne servirait à rien — d'où l'arrêt
 * anticipé, qui est aussi ce qui la rend tenable sur une liste de cent
 * étiquettes tapée lettre à lettre.
 */
export function distance(a: string, b: string, plafond = 2): number {
    if (Math.abs(a.length - b.length) > plafond) return plafond + 1;

    let precedente = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const courante = [i];
        let minimum = i;
        for (let j = 1; j <= b.length; j++) {
            const cout = a[i - 1] === b[j - 1] ? 0 : 1;
            const valeur = Math.min(
                precedente[j] + 1,
                courante[j - 1] + 1,
                precedente[j - 1] + cout,
            );
            courante.push(valeur);
            if (valeur < minimum) minimum = valeur;
        }
        /* Toute une ligne au-dessus du plafond : la suite ne peut plus
           redescendre, on s'arrête. */
        if (minimum > plafond) return plafond + 1;
        precedente = courante;
    }
    return precedente[b.length];
}

/**
 * **Les étiquettes connues qu'on est en train de retaper de travers.**
 *
 * Rendues à la saisie, avant validation : c'est le seul moment où la corriger
 * ne coûte rien. *Un avertissement qui arrive après l'enregistrement demande un
 * second geste, et personne ne le fait.*
 *
 * ⚠️ Une étiquette **identique** n'est pas proche : elle est la même, et
 * l'appelant a déjà de quoi le dire.
 */
export function tagsProches(saisie: string, connus: readonly string[]): string[] {
    const cle = cleDeComparaison(saisie);
    if (cle.length < 3) return [];

    return connus
        .filter(t => !memeTag(t, saisie))
        .filter(t => distance(cle, cleDeComparaison(t)) <= 1)
        .sort();
}

/**
 * **Ce qu'on propose pendant la frappe.**
 *
 * Ce qui **commence** par la saisie d'abord — c'est ce qu'on cherchait dans
 * neuf cas sur dix —, puis ce qui la contient. *Un classement par ordre
 * alphabétique mettrait « bataille navale » avant « bat » pour qui tape
 * « bat ».*
 *
 * Une saisie vide rend les étiquettes les plus employées : à l'ouverture du
 * champ, **montrer le vocabulaire existant est la meilleure façon de ne pas en
 * inventer un second**.
 */
export function suggestionsDeTag(
    saisie: string,
    connus: readonly string[],
    maximum = 8,
): string[] {
    const cle = cleDeComparaison(saisie);
    if (!cle) return [...connus].slice(0, maximum);

    const commencent: string[] = [];
    const contiennent: string[] = [];
    for (const tag of connus) {
        const c = cleDeComparaison(tag);
        if (c === cle) continue;
        if (c.startsWith(cle)) commencent.push(tag);
        else if (c.includes(cle)) contiennent.push(tag);
    }
    return [...commencent.sort(), ...contiennent.sort()].slice(0, maximum);
}

/** Une étiquette classée par le nombre de médias qui la portent, la plus employée d'abord. */
export function tagsParUsage(medias: readonly { tags: string[] }[]): { tag: string; compte: number }[] {
    const comptes = new Map<string, { tag: string; compte: number }>();
    for (const media of medias) {
        for (const brut of media.tags ?? []) {
            const cle = cleDeComparaison(brut);
            const entree = comptes.get(cle);
            if (entree) entree.compte += 1;
            else comptes.set(cle, { tag: formeCanonique(brut), compte: 1 });
        }
    }
    return [...comptes.values()].sort(
        (a, b) => b.compte - a.compte || a.tag.localeCompare(b.tag),
    );
}

/**
 * **Renommer ou fusionner une étiquette dans toute la bibliothèque.**
 *
 * ⭐ **Renommer et fusionner sont le MÊME geste**, et c'est ce qui rend l'écran
 * simple : renommer `tavernes` en `taverne` alors que `taverne` existe déjà,
 * *c'est* une fusion. Les traiter séparément aurait demandé au meneur de savoir
 * d'avance lequel des deux il fait.
 *
 * `nouveau` vide **supprime** l'étiquette partout — troisième geste, même
 * fonction.
 *
 * ⚠️ Elle rend **uniquement les médias qui changent**, avec leur nouvelle
 * liste : l'appelant n'écrit que ceux-là. *Réécrire les deux cents autres pour
 * rien, c'est deux cents écritures IndexedDB et un miroir qui recopie tout.*
 */
export function renommerDansLaBibliotheque<T extends { id: string; tags: string[] }>(
    medias: readonly T[],
    ancien: string,
    nouveau: string,
): { id: string; tags: string[] }[] {
    const cleAncienne = cleDeComparaison(ancien);
    if (!cleAncienne) return [];

    const cible = formeCanonique(nouveau);
    const changements: { id: string; tags: string[] }[] = [];

    for (const media of medias) {
        const actuels = media.tags ?? [];
        if (!actuels.some(t => cleDeComparaison(t) === cleAncienne)) continue;

        /* On retire l'ancienne **et** la cible, puis on repose la cible une
           seule fois : c'est ce qui évite le doublon quand le média portait
           déjà les deux. */
        const cleCible = cleDeComparaison(cible);
        const restants = actuels.filter(t => {
            const c = cleDeComparaison(t);
            return c !== cleAncienne && c !== cleCible;
        });

        changements.push({
            id: media.id,
            tags: cible ? [...restants, cible] : restants,
        });
    }

    return changements;
}

/**
 * **Poser ou retirer des étiquettes sur toute une sélection.**
 *
 * ⛔ Sans ce geste, quarante fichiers importés d'un bloc se taguaient **un par
 * un**, dans le panneau de détail, en rouvrant la sélection à chaque fois. *Le
 * coût n'était pas le clic : c'était que personne ne le faisait, donc que la
 * bibliothèque restait sans étiquettes.*
 *
 * ⚠️ Elle rend **uniquement les médias qui changent**, comme
 * {@link renommerDansLaBibliotheque} et pour la même raison : un média qui
 * porte déjà l'étiquette qu'on ajoute n'a pas à être réécrit.
 */
export function appliquerEnLot<T extends { id: string; tags: string[] }>(
    medias: readonly T[],
    geste: { ajouter?: readonly string[]; retirer?: readonly string[] },
): { id: string; tags: string[] }[] {
    const aAjouter = (geste.ajouter ?? []).map(formeCanonique).filter(Boolean);
    const aRetirer = (geste.retirer ?? []).map(cleDeComparaison).filter(Boolean);
    if (aAjouter.length === 0 && aRetirer.length === 0) return [];

    const changements: { id: string; tags: string[] }[] = [];

    for (const media of medias) {
        const actuels = media.tags ?? [];
        const restants = actuels.filter(t => !aRetirer.includes(cleDeComparaison(t)));

        const suite = [...restants];
        for (const tag of aAjouter) {
            if (!suite.some(t => memeTag(t, tag))) suite.push(tag);
        }

        /* Rien n'a bougé : on ne réécrit pas. La comparaison porte sur le
           contenu, pas sur l'ordre — remettre les mêmes étiquettes dans un
           ordre différent n'est pas un changement. */
        const identique = suite.length === actuels.length
            && suite.every(t => actuels.some(a => memeTag(a, t)));
        if (identique) continue;

        changements.push({ id: media.id, tags: suite });
    }

    return changements;
}
