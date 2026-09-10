/**
 * **Quelle clé a le droit de partir vers quel hôte.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE N'EST PAS UNE LISTE BLANCHE D'HÔTES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `ai:proxy-request` relaie une URL venue du renderer, avec les en-têtes qu'on
 * lui donne. La parade évidente — une liste d'hôtes admis — ne tient pas : le
 * fournisseur **Custom** existe précisément pour joindre l'endpoint que le
 * meneur nomme dans ses réglages, et une liste fermée le casserait.
 *
 * Le risque n'est d'ailleurs pas d'atteindre un hôte : c'est qu'**une clé parte
 * vers le mauvais**. Et le relevé des appels a montré que la plus exposée n'est
 * pas celle qu'on croit — **Gemini met la sienne dans l'URL** (`?key=…`, six
 * endroits), là où Anthropic la met en en-tête. *Une clé dans une URL part avec
 * la moindre erreur d'hôte, et se retrouve dans les journaux du serveur d'en
 * face.*
 *
 * D'où l'appariement : l'appelant déclare **pour quel fournisseur** il parle, et
 * un fournisseur dont l'hôte est connu ne peut joindre que celui-là.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * UN HÔTE LIBRE EST UNE DÉCISION, PAS UN TROU
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `custom` et les deux `ollama` n'ont pas d'hôte fixe, et c'est écrit ici plutôt
 * que sous-entendu par une absence. La différence compte : un fournisseur
 * **oublié** est refusé, un fournisseur **libre** est admis. Ajouter un chemin
 * réseau sans passer par cette table échoue donc au développement, jamais en
 * séance.
 *
 * ⚠️ Ce que cette table ne couvre pas : le mélange entre fournisseurs — porter
 * la clé d'Anthropic dans un appel déclaré `custom`. Le fermer demande que le
 * processus principal **détienne** les clés (il a déjà le trousseau) et que le
 * renderer ne les voie jamais. C'est le chantier d'après.
 */

/** Les fournisseurs qui empruntent le proxy réseau du processus principal. */
export type FournisseurReseau =
    | 'anthropic'
    | 'gemini'
    | 'custom'
    | 'ollama'
    | 'ollama_cloud'
    | 'image-cloudflare';

/**
 * L'hôte admis pour chaque fournisseur, ou `'libre'` quand c'est le meneur qui
 * le nomme.
 *
 * ⚠️ `openai` n'y figure pas **volontairement** : le service n'a aucun chemin
 * qui passe par le proxy aujourd'hui. Inventer son hôte ici reviendrait à
 * autoriser d'avance un appel que personne n'a écrit — le jour où il s'écrira,
 * le refus le signalera au développement.
 */
const HOTES: Record<FournisseurReseau, readonly string[] | 'libre'> = {
    anthropic: ['api.anthropic.com'],
    gemini: ['generativelanguage.googleapis.com'],
    'image-cloudflare': ['api.cloudflare.com'],

    /* Le meneur saisit l'endpoint : Together, un serveur d'inférence maison, ou
       autre chose. C'est la fonction même de ce fournisseur. */
    custom: 'libre',
    /* Réseau local, et sans clé : il n'y a rien à égarer. */
    ollama: 'libre',
    ollama_cloud: 'libre',
};

export type VerdictDHote =
    | { admis: true }
    | { admis: false; raison: string };

/**
 * L'appel est-il admis à partir ?
 *
 * Rend un refus **motivé** plutôt qu'un booléen : le motif part dans le journal
 * d'audit, et un refus qu'on ne sait pas expliquer se fait désactiver.
 */
export function verdictDeLHote(fournisseur: string, url: string): VerdictDHote {
    let hote: string;
    try {
        hote = new URL(url).hostname.toLowerCase();
    } catch {
        return { admis: false, raison: `URL illisible : ${url}` };
    }

    if (!Object.prototype.hasOwnProperty.call(HOTES, fournisseur)) {
        return {
            admis: false,
            raison: `Fournisseur inconnu « ${fournisseur} » : ajoutez-le à hotesDesFournisseurs.ts avant de l'appeler.`,
        };
    }

    const admis = HOTES[fournisseur as FournisseurReseau];
    if (admis === 'libre') return { admis: true };

    /*
      Comparaison EXACTE, et non par suffixe : `api.anthropic.com.piege.net` se
      termine bien par le bon nom, et n'a rien à voir avec Anthropic.
    */
    if (admis.includes(hote)) return { admis: true };

    return {
        admis: false,
        raison: `Le fournisseur « ${fournisseur} » ne peut joindre que ${admis.join(', ')} — appel vers ${hote} refusé.`,
    };
}
