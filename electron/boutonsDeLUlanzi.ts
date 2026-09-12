/**
 * **Les trois boutons de l'afficheur, reçus par le pont de Home Assistant.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE CHEMIN, ET PAS MQTT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le registre gare cette direction depuis le 2026-08-30, avec **une seule
 * raison mesurée** : les boutons ne remontent pas en HTTP (`/api/buttons` →
 * 404), donc MQTT — *« et un courtier est un service de plus à faire vivre, à
 * démarrer avec GM-OS et à rendre en partant »*.
 *
 * ⭐ **Cette objection tombe le 2026-09-12 : David a un Home Assistant sur son
 * réseau.** Il porte déjà un courtier, il tourne sans GM-OS et n'a rien à rendre
 * en partant. La direction se rouvre donc *moins chère* qu'elle n'était garée :
 * HA écoute MQTT, et pousse ici un simple appui.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUI TRAVERSE CE PONT — ET CE QUI N'A PAS LE DROIT DE LE TRAVERSER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Un appui, jamais une action.** Home Assistant dit « on a appuyé à gauche ».
 * Il ne dit pas *quoi faire*, et rien dans ce fichier ne sait le faire : le
 * geste associé vit dans les réglages du meneur, côté écran, et c'est **sa
 * propre fenêtre** qui le construit.
 *
 * *La conséquence est la propriété de sécurité de tout ce chemin* : même si le
 * secret d'appairage fuitait, on ne pourrait déclencher que ce que le meneur a
 * lui-même posé sur ses trois boutons. Un pont qui transporterait un type
 * d'action donnerait, lui, la main sur tout le registre.
 *
 * ⛔ **Le `SyncServer` écoute sur `0.0.0.0`.** Tout ce qu'on y ajoute est offert
 * au réseau — celui de la maison comme celui d'un hôtel. D'où le secret
 * d'appairage, qui est **déjà** celui des tablettes : rien de neuf à inventer,
 * et `pairingManager.rotate()` révoque le pont avec le reste.
 */

/** Les trois boutons physiques, de gauche à droite. */
export const BOUTONS = ['gauche', 'milieu', 'droite'] as const;
export type BoutonUlanzi = (typeof BOUTONS)[number];

/**
 * L'en-tête qui porte le secret.
 *
 * ⚠️ **Un en-tête, et pas un paramètre d'URL.** Une adresse se retrouve dans
 * les journaux du serveur, dans l'historique de Home Assistant et dans tout
 * mandataire qui passerait par là. *Un secret qui voyage dans un chemin n'est
 * plus un secret, c'est une chaîne de caractères qu'on a écrite partout.*
 */
export const ENTETE_DU_JETON = 'x-gmos-jeton';

export type LectureDeLAppui =
    | { ok: true; bouton: BoutonUlanzi }
    | { ok: false; code: 401 | 404 | 405 | 413 | 400; motif: string };

/** Un corps de requête plus gros que ça ne décrit pas un appui sur un bouton. */
export const TAILLE_MAX_DU_CORPS = 1024;

interface Appui {
    methode: string | undefined;
    jeton: string | undefined;
    corps: string;
    /** `pairingManager.verify` — injecté pour que ce module reste pur. */
    leSecretEstBon: (jeton: unknown) => boolean;
}

function estUnBouton(valeur: unknown): valeur is BoutonUlanzi {
    return typeof valeur === 'string' && (BOUTONS as readonly string[]).includes(valeur);
}

/**
 * Lit une requête d'appui, ou dit pourquoi elle est refusée.
 *
 * ⛔ **L'ordre des contrôles est le contrôle.** Le secret est vérifié **avant**
 * que le corps ne soit seulement regardé : un appelant sans jeton reçoit `401`
 * quoi qu'il envoie, et n'apprend donc **rien** — ni quels noms de boutons
 * existent, ni quelle forme le corps doit avoir. *Une erreur qui renseigne est
 * une erreur qui aide celui qui cherche.*
 *
 * C'est le même idiome que `perimetreDeLInstance.test.ts` impose aux appareils :
 * *une garde posée après l'ouverture de la requête ne protège rien.*
 */
export function lireLAppui(appui: Appui): LectureDeLAppui {
    if (appui.methode !== 'POST') {
        return { ok: false, code: 405, motif: 'POST attendu' };
    }

    if (!appui.leSecretEstBon(appui.jeton)) {
        return { ok: false, code: 401, motif: 'jeton absent ou invalide' };
    }

    if (appui.corps.length > TAILLE_MAX_DU_CORPS) {
        return { ok: false, code: 413, motif: 'corps trop volumineux' };
    }

    let charge: unknown;
    try {
        charge = JSON.parse(appui.corps);
    } catch {
        return { ok: false, code: 400, motif: 'JSON illisible' };
    }

    const bouton = (charge as { bouton?: unknown } | null)?.bouton;
    if (!estUnBouton(bouton)) {
        return { ok: false, code: 400, motif: `bouton attendu parmi ${BOUTONS.join(', ')}` };
    }

    return { ok: true, bouton };
}
