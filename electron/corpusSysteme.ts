/**
 * Où vit le corpus d'un système — une question, une réponse, un seul endroit.
 *
 * **Le défaut qu'il corrige.** Quatre mécanismes concurrents désignaient le
 * dossier d'un système, et ils n'étaient d'accord ni entre eux, ni surtout entre
 * la lecture et l'écriture :
 *
 * | Mécanisme | Lu par | Écrit par |
 * |---|---|---|
 * | `campaign.systemPath` (« Chemin des Règles ») | la sélection RAG | personne |
 * | `driver.ragPath` | personne | la Forge |
 * | `campaign.system` (l'identifiant du pilote) | tout | tout |
 * | le **nom affiché** du système | la sélection RAG | personne |
 *
 * Conséquence mesurée le 2026-08-10 : un pilote nommé « Dune : Aventures dans
 * l'Imperium » porte l'identifiant `custom-1754…`, parce que la Forge le
 * fabrique avec `custom-${Date.now()}`. La **lecture** retrouvait quand même
 * `docs/systems/dune` par le repli sur le nom affiché — l'Oracle citait donc les
 * bonnes fiches. L'**écriture** n'avait pas ce repli : les personas se cherchaient
 * dans `systems/custom-1754…/gems.json`, qui n'existe pas, et le `catch {}` de
 * `AIService` avalait le vide. Les personas de Dune n'ont jamais servi, et rien
 * ne l'a jamais dit.
 *
 * **Le principe retenu : l'écriture résout exactement comme la lecture.** Une
 * asymétrie entre les deux est indétectable par construction — ça marche jusqu'au
 * jour où ça écrit à côté.
 *
 * Module sans dépendance à `electron` ni à `node` : utilisable des deux côtés du
 * pont, et testé en environnement node.
 */

/** Dossier racine des systèmes, relatif à `docs/`. */
export const DOSSIER_SYSTEMES = 'systems';

/** Minuscules, sans accents, non-alphanumériques réduits à des tirets. */
export function slug(value: string): string {
    return value
        .normalize('NFD')
        // Marques combinantes séparées par NFD. `\p{Mn}` garde la source en
        // ASCII pur — un intervalle de diacritiques littéraux ne survit pas
        // toujours à un aller-retour d'encodage sous Windows.
        .replace(/\p{Mn}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Deux identifiants désignent-ils la même chose ?
 *
 * Égalité de slug, ou préfixe suivi d'une frontière — `dnd` retrouve `dnd-5e`,
 * « Cthulhu Hack » retrouve le dossier `cthulhu hack`, et « Dune : Aventures
 * dans l'Imperium » retrouve `dune`. Pas de `includes` libre : c'est lui qui
 * faisait passer n'importe quoi dans la version d'avant l'axe B.
 */
export function memeIdentite(a: string, b: string): boolean {
    if (!a || !b) return false;
    if (a === b) return true;
    return a.startsWith(`${b}-`) || b.startsWith(`${a}-`);
}

/** Chemin relatif à `docs/`, séparateurs unifiés, sans `docs/` de tête. */
export function normaliseChemin(value: string): string {
    const nu = value.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').toLowerCase();
    return nu.replace(/^docs\//, '');
}

export type RaisonCorpus =
    /** « Chemin des Règles » de la fiche de campagne. Déclaré, donc souverain. */
    | 'chemin-de-campagne'
    /** `driver.corpusId` — le dossier que ce système déclare habiter. */
    | 'corpus-declare'
    /** `driver.ragPath`, hérité : il vise les fiches, on en déduit la racine. */
    | 'chemin-rag-herite'
    /** `systems/<identifiant>` existe sur disque. */
    | 'identifiant'
    /** Rapproché par le nom affiché — le repli qui sauvait déjà la lecture. */
    | 'nom-affiche'
    /** Rien ne correspond : le dossier sera créé sous l'identifiant. */
    | 'defaut';

export interface Corpus {
    /** Racine relative à `docs/` — par exemple `systems/dune`. */
    racine: string;
    /** Nom du dossier seul — `dune`. C'est ce qu'attend `bookIndex.chargerIndex`. */
    id: string;
    raison: RaisonCorpus;
    /** Vrai quand le dossier n'existe pas encore parmi ceux connus. */
    aCreer: boolean;
}

export interface DemandeCorpus {
    /** `campaign.system` : l'identifiant du pilote, souvent `custom-<horodatage>`. */
    systemId: string;
    /** Nom affiché du pilote — « Dune : Aventures dans l'Imperium ». */
    systemName?: string;
    /** « Chemin des Règles » de la fiche de campagne. */
    systemPath?: string;
    /** Dossier de corpus déclaré par le pilote. */
    corpusId?: string;
    /** Champ hérité du pilote, qui visait le dossier des fiches. */
    ragPath?: string;
    /**
     * Dossiers présents sous `docs/systems/`.
     *
     * Sans cette liste, le rapprochement par nom affiché est impossible : on ne
     * peut pas reconnaître un dossier qu'on ne sait pas exister. La résolution
     * retombe alors sur l'identifiant, ce qui est le comportement d'avant.
     */
    dossiersConnus?: readonly string[];
}

/** Retire un `/rules` terminal : `ragPath` vise les fiches, pas la racine. */
function racineDepuisRagPath(ragPath: string): string {
    return normaliseChemin(ragPath).replace(/\/rules$/, '');
}

function dernierSegment(chemin: string): string {
    const segments = chemin.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? '';
}

/**
 * Résout la racine du corpus d'un système.
 *
 * **L'ordre est un ordre d'autorité, pas de commodité.** Ce qui est déclaré à la
 * main l'emporte sur ce qui est deviné, et ce qui est deviné à partir d'un
 * dossier réel l'emporte sur ce qui n'est qu'un nom. Ne rend jamais `null` :
 * même sans correspondance, il faut un endroit où écrire — et `aCreer` dit
 * alors que ce sera un dossier neuf, ce qui mérite d'être montré avant d'écrire.
 */
export function resoudreCorpus(demande: DemandeCorpus): Corpus {
    const connus = demande.dossiersConnus ?? [];
    const existe = (id: string) => connus.some(d => normaliseChemin(d) === normaliseChemin(id));

    const rendre = (racine: string, raison: RaisonCorpus): Corpus => {
        const id = dernierSegment(racine);
        return { racine, id, raison, aCreer: connus.length > 0 && !existe(id) };
    };

    // 1. Le chemin déclaré sur la campagne. Explicite, donc souverain — c'est
    //    déjà la règle côté lecture, et la faire valoir ici supprime l'écart.
    if (demande.systemPath?.trim()) {
        return rendre(normaliseChemin(demande.systemPath), 'chemin-de-campagne');
    }

    // 2. Le corpus déclaré par le pilote lui-même.
    if (demande.corpusId?.trim()) {
        const nu = normaliseChemin(demande.corpusId);
        const racine = nu.includes('/') ? nu : `${DOSSIER_SYSTEMES}/${nu}`;
        return rendre(racine, 'corpus-declare');
    }

    // 3. `ragPath`, hérité. Conservé parce que des pilotes le portent déjà.
    if (demande.ragPath?.trim()) {
        return rendre(racineDepuisRagPath(demande.ragPath), 'chemin-rag-herite');
    }

    // 4. L'identifiant, s'il nomme un dossier réel.
    const parId = slug(demande.systemId);
    if (parId && existe(parId)) {
        return rendre(`${DOSSIER_SYSTEMES}/${parId}`, 'identifiant');
    }

    // 5. Le nom affiché, rapproché des dossiers réels. C'est ce repli qui
    //    sauvait la lecture ; il sauve désormais l'écriture de la même façon.
    const parNom = slug(demande.systemName ?? '');
    if (parNom) {
        const trouve = connus.find(d => memeIdentite(slug(d), parNom));
        if (trouve) return rendre(`${DOSSIER_SYSTEMES}/${normaliseChemin(trouve)}`, 'nom-affiche');
    }

    // 6. Rien ne correspond. On écrira sous l'identifiant, et `aCreer` le dira.
    return rendre(`${DOSSIER_SYSTEMES}/${parId || slug(demande.systemName ?? '') || 'inconnu'}`, 'defaut');
}

/** Dossier des fiches de règles. */
export function cheminDesFiches(corpus: Corpus): string {
    return `${corpus.racine}/rules`;
}

/**
 * Fichier des personas.
 *
 * `AIService` lit exactement ce chemin ; un fichier rangé ailleurs n'est jamais
 * lu, sans le moindre message. `electron/systemPersonas.test.ts` en tient le
 * contrat côté disque.
 */
export function cheminDesPersonas(corpus: Corpus): string {
    return `${corpus.racine}/gems.json`;
}

/** Dossier des index de livre, d'où `bookIndex.chargerIndex` charge. */
export function cheminDeLIndex(corpus: Corpus): string {
    return `${corpus.racine}/index`;
}
