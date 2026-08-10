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
    | 'defaut'
    /** Choisi à la main dans l'atelier — aucune déduction, aucune ambiguïté. */
    | 'choisi';

export interface Corpus {
    /** Racine relative à `docs/` — par exemple `systems/dune`. */
    racine: string;
    /** Nom du dossier seul — `dune`. C'est ce qu'attend `bookIndex.chargerIndex`. */
    id: string;
    raison: RaisonCorpus;
    /** Vrai quand le dossier n'existe pas encore parmi ceux connus. */
    aCreer: boolean;
    /**
     * Dossier que le **nom du système** désignait, quand il diffère de la racine
     * retenue.
     *
     * Relevé en réel le 2026-08-10 : une campagne dont le pilote s'appelle
     * « Dune : Aventures dans l'Imperium » portait `systems/blade-runner` en
     * « Chemin des Règles ». Le chemin déclaré l'emporte — c'est la règle, il est
     * explicite — mais une contradiction pareille ne doit pas se lire entre les
     * lignes : elle enverrait treize fiches Dune dans le corpus d'un autre jeu.
     */
    contradiction?: string;
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

    /** Dossier réel que le nom affiché désigne, s'il en désigne un. */
    const parNomAffiche = (): string | null => {
        const nom = slug(demande.systemName ?? '');
        if (!nom) return null;
        const trouve = connus.find(d => memeIdentite(slug(d), nom));
        return trouve ? normaliseChemin(trouve) : null;
    };

    const rendre = (racine: string, raison: RaisonCorpus): Corpus => {
        const id = dernierSegment(racine);
        const corpus: Corpus = { racine, id, raison, aCreer: connus.length > 0 && !existe(id) };

        // Le nom du système désignait-il un autre dossier réel ? On ne change
        // rien — le déclaré reste souverain — mais on le dit.
        const suggere = parNomAffiche();
        if (suggere && suggere !== normaliseChemin(id)) corpus.contradiction = suggere;
        return corpus;
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
    const trouve = parNomAffiche();
    if (trouve) return rendre(`${DOSSIER_SYSTEMES}/${trouve}`, 'nom-affiche');

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

/**
 * Dossier des brouillons — une fiche revenue du carnet, pas encore relue.
 *
 * **Pourquoi il existe.** Une fiche coûte une à deux minutes de génération, et
 * elle était perdue si l'atelier se fermait pendant la revue. Le brouillon
 * s'écrit dès le retour du carnet, sans revue — un brouillon n'engage rien — et
 * la revue devient une *publication* vers `rules/`, à froid, plus tard.
 *
 * **Exclu de l'index de l'Oracle** par le `.ragignore` de `docs/` : une fiche
 * non relue ne doit pas être citée en séance. Et **supprimé à la publication** :
 * conservé, ce dossier redeviendrait une décharge, avec deux versions de chaque
 * fiche — exactement le défaut corrigé ce matin sur le corpus v1.
 */
export function cheminDesBrouillons(corpus: Corpus): string {
    return `${corpus.racine}/drafts`;
}

/** Dossier des index de livre, d'où `bookIndex.chargerIndex` charge. */
export function cheminDeLIndex(corpus: Corpus): string {
    return `${corpus.racine}/index`;
}

/**
 * Corpus choisi explicitement, sans aucune déduction.
 *
 * **Pourquoi ce chemin existe.** Documenter un corpus est une opération de
 * bibliothèque, pas une opération de campagne : le corpus de Dune est le même
 * pour toutes les campagnes Dune, présentes et à venir. Le déduire de la
 * campagne active obligeait qui voulait écrire dans un corpus à réaffecter
 * d'abord une campagne — et à en abîmer une au passage. Constaté le 2026-08-10 :
 * une campagne Blade Runner s'est retrouvée avec le pilote de Dune parce que
 * c'était le seul moyen de dire « je veux enrichir le corpus Dune ».
 *
 * Un choix explicite ne se contredit avec rien : ni `contradiction`, ni doute.
 */
/**
 * Le corpus qu'un **système neuf** doit déclarer, d'après son seul nom.
 *
 * **Le défaut qu'il corrige.** La Forge Système fabrique ses pilotes avec
 * `custom-${Date.now()}` et ne leur donnait rien d'autre : ni `corpusId`, ni
 * dossier. Un pilote nommé « Dune : Aventures dans l'Imperium » naissait donc
 * sans savoir où vit son corpus, et c'est ce trou que `resoudreCorpus` passe son
 * temps à reboucher par déduction, à chaque lecture et à chaque écriture.
 *
 * **Il rejoint un corpus existant plutôt que d'en créer un jumeau.** Le slug du
 * nom complet est `dune-aventures-dans-l-imperium` ; le dossier réel est `dune`.
 * Créer le premier à côté du second aurait donné deux corpus pour un jeu, dont
 * un vide — et l'Oracle aurait continué de citer l'autre. On passe donc par le
 * même ordre d'autorité que la lecture : une réponse, un seul endroit.
 *
 * `aCreer` dit lequel des deux cas s'est produit, et c'est ce qu'il faut montrer
 * avant d'écrire.
 */
export function corpusPourNouveauSysteme(nom: string, dossiersConnus: readonly string[] = []): Corpus {
    return resoudreCorpus({ systemId: slug(nom), systemName: nom, dossiersConnus });
}

/**
 * Les dossiers qu'un corpus doit posséder pour être utilisable.
 *
 * Trois artefacts, trois destinations, et **aucun n'est facultatif** : sans
 * `rules/` la Forge écrit dans le vide, sans `index/` le résolveur de pages n'a
 * rien à charger et les citations redeviennent invérifiables, sans `personas/`
 * la passe de voix n'a pas de sortie. Les créer vides coûte trois `mkdir` et
 * rend le corpus lisible d'un coup d'œil ; les laisser manquer se paie en
 * `catch {}` silencieux, ce qui est exactement ce qui a rendu les personas de
 * Dune inertes depuis leur création.
 */
export function sousDossiersDuCorpus(corpus: Corpus): string[] {
    return [cheminDesFiches(corpus), cheminDeLIndex(corpus), `${corpus.racine}/personas`];
}

/** Ce qu'il faut savoir d'un pilote pour lui demander où vit son corpus. */
export interface SystemeDeclare {
    systemId: string;
    systemName?: string;
    corpusId?: string;
    ragPath?: string;
}

/**
 * Les corpus présents sur le disque qu'**aucun système ne réclame**.
 *
 * **L'autre moitié du défaut.** La Forge Système créait un pilote sans corpus ;
 * l'inverse existait aussi, et il était plus silencieux encore. Alien a un
 * corpus complet — fiches, index, personas, huit gemmes — et **aucun pilote**.
 * Il n'apparaît donc dans aucun sélecteur de système : le travail est là, sur le
 * disque, et l'application se comporte comme s'il n'existait pas.
 *
 * Rien ne le signalait, parce qu'il n'y a rien à signaler du point de vue du
 * code : on ne remarque pas l'absence de ce qu'on n'a jamais listé. D'où cette
 * fonction, qui pose la question dans l'autre sens — non plus « où est le corpus
 * de ce système ? » mais « quel système réclame ce corpus ? ».
 *
 * Ordre du disque conservé : c'est celui du listage, donc alphabétique.
 */
export function corpusOrphelins(
    dossiersConnus: readonly string[],
    systemes: readonly SystemeDeclare[],
): string[] {
    const reclames = new Set(
        systemes.map(s => resoudreCorpus({ ...s, dossiersConnus }).id),
    );
    return dossiersConnus.filter(d => !reclames.has(normaliseChemin(d)));
}

export function corpusChoisi(dossier: string, dossiersConnus: readonly string[] = []): Corpus {
    const id = normaliseChemin(dossier);
    return {
        racine: `${DOSSIER_SYSTEMES}/${id}`,
        id,
        raison: 'choisi',
        aCreer: dossiersConnus.length > 0 && !dossiersConnus.some(d => normaliseChemin(d) === id),
    };
}
