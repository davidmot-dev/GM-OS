import type { Corpus } from '../../../../electron/corpusSysteme';

/**
 * Les personas du corpus — celles que l'Oracle emploie vraiment.
 *
 * **Le défaut que ce module corrige, relevé par David le 2026-08-14.**
 * « Il n'a pas récupéré les personas. » Il avait toutes les raisons de le
 * croire : l'éditeur du moteur de règles montre huit cartes avec des zones de
 * texte **vides**, parce qu'il n'affiche que `driver.aiPersonas` — un *override*
 * — pendant que `docs/systems/alien/gems.json` contient les huit personas
 * écrites, soignées, et effectivement employées en séance.
 *
 * C'est le miroir du défaut que ce projet traque partout : ici, quelque chose
 * **fonctionne** sans le dire. Le résultat est le même — personne ne peut le
 * savoir, et on refait le travail qui existait déjà.
 *
 * **L'ordre d'autorité, tel que `AIService.prepareSystemPrompt` l'applique** :
 * la persona par défaut de la gemme, puis le `gems.json` du corpus qui
 * l'écrase, puis `template.aiPersonas` qui écrase encore. Les écrans doivent
 * montrer cet ordre, et non le seul dernier maillon.
 */

/** Ce que le corpus dit de ses personas, et si on a pu le lire. */
export interface PersonasDuCorpus {
    /** `gemId` → instructions. Vide si le corpus n'en déclare aucune. */
    personas: Record<string, string>;
    /** Le fichier existe-t-il ? Un corpus sans personas n'est pas un corpus fautif. */
    present: boolean;
    /** Renseigné quand le fichier existe mais ne se lit pas — jamais une exception. */
    erreur?: string;
}

/**
 * Interprète le contenu de `gems.json`.
 *
 * **Un JSON illisible ne fait pas échouer l'écran.** Il se signale, comme tout
 * le reste : un corpus dont le fichier de personas est corrompu doit pouvoir
 * être ouvert pour être réparé, ce qu'un écran blanc interdirait.
 *
 * Les valeurs qui ne sont pas des chaînes sont écartées plutôt que rendues
 * telles quelles : la zone de texte qui les afficherait écrirait « [object
 * Object] » dans le corpus à la première sauvegarde.
 */
export function lirePersonas(brut: string | null | undefined): PersonasDuCorpus {
    if (brut === null || brut === undefined || brut.trim() === '') {
        return { personas: {}, present: false };
    }
    try {
        const analyse: unknown = JSON.parse(brut);
        if (!analyse || typeof analyse !== 'object' || Array.isArray(analyse)) {
            return { personas: {}, present: true, erreur: 'Le fichier ne contient pas un objet.' };
        }
        const personas: Record<string, string> = {};
        for (const [gemId, valeur] of Object.entries(analyse)) {
            if (typeof valeur === 'string' && valeur.trim() !== '') personas[gemId] = valeur;
        }
        return { personas, present: true };
    } catch (erreur) {
        return {
            personas: {},
            present: true,
            erreur: erreur instanceof Error ? erreur.message : String(erreur),
        };
    }
}

/**
 * Sérialise les personas pour le disque.
 *
 * **Indenté, et trié par identifiant.** Ce fichier est versionné avec le corpus
 * et David le relit : un JSON sur une seule ligne rendrait illisible le
 * moindre `git diff`, et un ordre qui suit les caprices de l'objet ferait
 * apparaître comme modifiées des personas auxquelles personne n'a touché.
 *
 * Une persona vidée est **retirée** plutôt qu'écrite à blanc : une chaîne vide
 * dans `gems.json` écraserait la persona par défaut de la gemme par du vide,
 * là où son absence la laisse jouer.
 */
export function ecrirePersonas(personas: Record<string, string>): string {
    const propre: Record<string, string> = {};
    for (const gemId of Object.keys(personas).sort()) {
        const texte = personas[gemId]?.trim();
        if (texte) propre[gemId] = texte;
    }
    return `${JSON.stringify(propre, null, 2)}\n`;
}

/** Ce qu'il faut dire d'un corpus pour qu'on sache où l'on écrit. */
export interface EtatDuCorpus {
    corpus: Corpus;
    personas: PersonasDuCorpus;
}

/**
 * Pourquoi ce dossier-là, en une phrase lisible.
 *
 * `resoudreCorpus` rend déjà cette raison ; elle ne s'affichait nulle part,
 * alors que c'est exactement ce qu'on cherche à savoir quand un pilote lit le
 * mauvais corpus — et le cas est arrivé : un pilote forgé porte un identifiant
 * `custom-<horodatage>`, et tant que `corpusId` n'existait pas, la résolution
 * se rabattait sur le nom affiché, en silence.
 */
export function raisonLisible(corpus: Corpus): string {
    switch (corpus.raison) {
        case 'chemin-de-campagne':
            return 'chemin déclaré sur la campagne';
        case 'corpus-declare':
            return 'corpus déclaré par le pilote';
        case 'chemin-rag-herite':
            return 'déduit du chemin RAG hérité';
        case 'identifiant':
            return "l'identifiant du pilote nomme ce dossier";
        case 'nom-affiche':
            return 'rapproché du nom affiché, faute de corpus déclaré';
        default:
            return 'aucune piste : dossier déduit par défaut';
    }
}
