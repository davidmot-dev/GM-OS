/**
 * **Ce qu'un corpus contient, rangé en lots qu'un humain peut cocher.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE MODULE EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Supprimer un pilote ne retirait qu'une ligne d'un tableau — `deleteGameDriver`
 * filtre `customGameDrivers`, et c'est tout ce qu'il a jamais fait. Le dossier
 * `docs/systems/<jeu>/` restait entier : fiches forgées, personas, index,
 * brouillons, `gems.json`. Reforger le même jeu retombe sur le même slug, et la
 * Forge **enrichit** un corpus existant au lieu de le doubler — décision du
 * 2026-08-16, qui est une bonne chose partout **sauf** quand on voulait
 * précisément repartir de zéro.
 *
 * *La pollution n'était donc pas un résidu oublié : c'était une fonctionnalité
 * qui faisait son travail sur une base qu'on croyait effacée.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI DES LOTS, ET PAS UN BOUTON « TOUT EFFACER »
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Dans un même dossier cohabitent deux choses qui n'ont pas du tout le même
 * prix :
 *
 * - ce que la Forge a produit — `rules/`, `drafts/`, `personas/` : une heure de
 *   modèle, refaite en une heure de modèle ;
 * - ce que le meneur a **apporté** — le PDF du livre, son extraction, l'index
 *   paginé, le thème : des heures de sa main, et parfois irremplaçables.
 *
 * Un unique bouton devrait trancher pour lui. Il ne peut pas, donc il ne tranche
 * pas : il **montre**, lot par lot, avec un compte et des octets, et coche
 * d'avance ce qui se refabrique. ⚠️ **Ce qu'on ne sait pas attribuer à la Forge
 * part décoché** — l'inconnu se penche du côté qui ne détruit pas.
 *
 * Module sans dépendance à `electron` ni à `node` : la règle est éprouvable sans
 * disque, et l'écran qui affiche les lots lit le même type que le processus qui
 * les déplace.
 */

/** Un fichier vu sous la racine d'un corpus — chemin relatif à cette racine. */
export interface FichierDuCorpus {
    /** Par exemple `rules/degats-et-types-de-degats.md`. Séparateurs en `/`. */
    chemin: string;
    octets: number;
}

/** Un lot que le meneur coche ou décoche, d'un bloc. */
export interface GroupeDuCorpus {
    cle: string;
    /** Son nom à l'écran, en français et sans jargon de chemin. */
    nom: string;
    /** Ce qu'on perd si on le coche — dit une fois, au moment de décider. */
    quoi: string;
    /** Les chemins relatifs à la racine du corpus, dans l'ordre du disque. */
    fichiers: string[];
    octets: number;
    /**
     * Coché d'avance ?
     *
     * Vrai pour ce que la Forge refabrique, faux pour ce que le meneur a
     * apporté. *Un défaut qui détruit doit se mériter à la main.*
     */
    parDefaut: boolean;
}

/** Ce que le corpus abrite — les deux racines n'ont pas les mêmes dossiers. */
export type GenreDeCorpus = 'systeme' | 'campagne';

interface Regle {
    cle: string;
    nom: string;
    quoi: string;
    parDefaut: boolean;
    /** Vrai si ce chemin relatif tombe dans ce lot. */
    prend: (chemin: string) => boolean;
}

/** Le premier segment d'un chemin relatif, en minuscules. */
function tete(chemin: string): string {
    return chemin.split('/')[0]?.toLowerCase() ?? '';
}

/** Vrai pour un fichier **posé dans** ce sous-dossier, à n'importe quelle profondeur. */
const sousDossier = (nom: string) => (chemin: string) =>
    chemin.includes('/') && tete(chemin) === nom;

const fichierRacine = (nom: string) => (chemin: string) => chemin.toLowerCase() === nom;

const REGLES_SYSTEME: Regle[] = [
    {
        cle: 'regles', nom: 'Fiches de règles forgées', parDefaut: true,
        quoi: "Ce que la Forge Système a écrit dans `rules/`. C'est la sortie du modèle, et c'est elle qui pollue une reforge.",
        prend: sousDossier('rules'),
    },
    {
        cle: 'regles-v1', nom: 'Fiches supplantées (v1)', parDefaut: true,
        quoi: "Les fiches qu'une reforge précédente a mises de côté dans `rules-v1/`.",
        prend: sousDossier('rules-v1'),
    },
    {
        cle: 'brouillons', nom: 'Brouillons de la Forge', parDefaut: true,
        quoi: "Ce qui est revenu du carnet sans avoir été relu — `drafts/`.",
        prend: sousDossier('drafts'),
    },
    {
        cle: 'personas', nom: 'Personas et voix du jeu', parDefaut: true,
        quoi: "La voix du jeu et les fiches de voix, que la Forge produit avec le pilote.",
        prend: sousDossier('personas'),
    },
    {
        cle: 'gemmes', nom: 'Gemmes du corpus', parDefaut: true,
        quoi: "`gems.json` — les consignes taillées pour ce jeu.",
        prend: fichierRacine('gems.json'),
    },
    {
        cle: 'manifeste', nom: 'Manifeste du corpus', parDefaut: true,
        quoi: "`manifest.json` — ce que le corpus déclare de lui-même.",
        prend: fichierRacine('manifest.json'),
    },
    {
        cle: 'index', nom: 'Index du livre', parDefaut: false,
        quoi: "⚠️ La pagination extraite du manuel. Sans elle, l'Oracle ne sait plus dire « c'est page 214 », et la vérification des citations s'éteint.",
        prend: sousDossier('index'),
    },
    {
        cle: 'theme', nom: 'Thème du jeu', parDefaut: false,
        quoi: "⚠️ Le `theme.css` du jeu — 22 jetons réglés à la main dans l'Atelier de thème.",
        prend: sousDossier('theme'),
    },
    {
        cle: 'correspondance', nom: 'Correspondance des fiches', parDefaut: false,
        quoi: "⚠️ La table qui coud les champs de la fiche HTML à ceux du pilote.",
        prend: sousDossier('fiche'),
    },
];

const REGLES_CAMPAGNE: Regle[] = [
    {
        cle: 'fiches', nom: 'Fiches de campagne forgées', parDefaut: true,
        quoi: "Ce que l'Atelier de campagne a écrit dans `fiches/`.",
        prend: sousDossier('fiches'),
    },
    {
        cle: 'fiches-v1', nom: 'Fiches supplantées (v1)', parDefaut: true,
        quoi: "Les fiches mises de côté par une reforge précédente.",
        prend: sousDossier('fiches-v1'),
    },
    {
        cle: 'brouillons', nom: 'Brouillons', parDefaut: true,
        quoi: "Ce qui est revenu du carnet sans avoir été relu — `drafts/`.",
        prend: sousDossier('drafts'),
    },
];

/**
 * Le lot de repli : tout ce qu'aucune règle ne réclame.
 *
 * ⚠️ **Il est décoché, et ce n'est pas un détail.** C'est lui qui attrape le PDF
 * du livre, son extraction en texte, l'archive du RAG et les documents que le
 * meneur a déposés à la racine — exactement ce dont la perte se compte en
 * soirées. *Un lot fourre-tout coché d'avance serait un piège qui se referme au
 * premier clic distrait.*
 */
function repli(genre: GenreDeCorpus): Omit<Regle, 'prend'> {
    return {
        cle: 'source',
        nom: genre === 'systeme' ? 'Manuel source et documents de la racine' : 'Notes et documents déposés',
        quoi: genre === 'systeme'
            ? "⚠️ Le PDF ou le texte du livre, ses extractions, et tout ce qui traîne à la racine. C'est ce qui coûte le plus cher à refaire : décoché d'avance."
            : "⚠️ Tout ce que le meneur a déposé lui-même dans le dossier de la campagne. Décoché d'avance.",
        parDefaut: false,
    };
}

/**
 * Range les fichiers d'un corpus en lots.
 *
 * Les lots vides ne sont pas rendus : *annoncer un lot à zéro fichier ferait
 * croire qu'il reste quelque chose à décider.* L'ordre est celui des règles,
 * puis le repli en dernier — le plus dangereux se lit en bas, une fois le reste
 * compris.
 */
export function grouperLeCorpus(
    fichiers: readonly FichierDuCorpus[],
    genre: GenreDeCorpus,
): GroupeDuCorpus[] {
    const regles = genre === 'systeme' ? REGLES_SYSTEME : REGLES_CAMPAGNE;
    const lots = new Map<string, GroupeDuCorpus>();

    const deposer = (modele: Omit<Regle, 'prend'>, fichier: FichierDuCorpus) => {
        const deja = lots.get(modele.cle);
        if (deja) {
            deja.fichiers.push(fichier.chemin);
            deja.octets += fichier.octets;
            return;
        }
        lots.set(modele.cle, {
            cle: modele.cle, nom: modele.nom, quoi: modele.quoi,
            parDefaut: modele.parDefaut,
            fichiers: [fichier.chemin], octets: fichier.octets,
        });
    };

    for (const fichier of fichiers) {
        const regle = regles.find(r => r.prend(fichier.chemin));
        deposer(regle ?? repli(genre), fichier);
    }

    const ordre = [...regles.map(r => r.cle), 'source'];
    return [...lots.values()].sort((a, b) => ordre.indexOf(a.cle) - ordre.indexOf(b.cle));
}

/**
 * Ce qu'un corpus contient — la réponse du canal `purge:inventaire-corpus`.
 *
 * ⚠️ **Le contrat vit ici, et pas dans `purgeDesCorpus.ts`, exprès.** Ce
 * module-ci ne dépend ni d'`electron` ni de `node` ; son voisin dépend des deux.
 * Le typage de `window.electronAPI` traverse la frontière des projets
 * TypeScript : il peut importer d'ici, il ne peut pas importer de là-bas. C'est
 * la même règle que `hotesDesFournisseurs` et `mcpActivity` avant lui — *ce
 * qu'on partage, c'est le contrat, jamais le code qui le remplit.*
 */
export interface InventaireDuCorpus {
    /** Faux quand le dossier n'existe pas — ce n'est pas une erreur, c'est une réponse. */
    trouve: boolean;
    relatif: string;
    genre: GenreDeCorpus | null;
    groupes: GroupeDuCorpus[];
    fichiers: number;
    octets: number;
}

/** Ce qu'une mise en quarantaine a réellement fait. */
export interface BilanDeQuarantaine {
    ok: boolean;
    /** Chemin absolu du dossier de quarantaine, pour le montrer au meneur. */
    destination: string;
    deplaces: number;
    octets: number;
    /** Ce qui n'a pas pu être déplacé, nommé. Le silence serait un mensonge. */
    echecs: string[];
}
