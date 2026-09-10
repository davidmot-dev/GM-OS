import type { FournisseurReseau } from './hotesDesFournisseurs';

/**
 * **Où va la clé d'un fournisseur, et qui la détient.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LE RENDERER NE DOIT PLUS LA PORTER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * L'appariement clé ↔ hôte (`hotesDesFournisseurs.ts`) ferme le cas d'une clé
 * partie vers le mauvais hôte. Il ne ferme pas le **mélange entre
 * fournisseurs** : rien n'empêchait un appel déclaré `custom` de porter la clé
 * d'Anthropic, puisque c'est l'écran qui assemblait les en-têtes.
 *
 * La seule parade qui tienne est de retirer la clé du chemin : le renderer dit
 * **pour qui** il parle, le processus principal va chercher la clé dans le
 * coffre et la pose lui-même. Une clé qui ne traverse pas le pont ne peut pas
 * être posée sur la mauvaise requête — *ce qui n'est pas parti ne peut pas être
 * lu.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ELLES NE SE POSENT PAS TOUTES AU MÊME ENDROIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * C'est le relevé des appels qui l'a montré, et c'est ce qui interdit une
 * fonction unique : **Gemini met sa clé dans l'URL** (`?key=…`), Anthropic dans
 * un en-tête `x-api-key`, les autres dans un `Authorization: Bearer`. Une clé
 * dans une URL voyage dans les journaux du serveur d'en face, ce qui en fait la
 * plus exposée des trois — et c'est celle qui a le plus d'appels.
 */

/** Comment la clé s'attache à la requête sortante. */
type PortDeLaCle =
    /** En-tête, sous ce nom. */
    | { ou: 'entete'; nom: string; prefixe?: string }
    /** Paramètre de requête, sous ce nom — le cas de Gemini. */
    | { ou: 'requete'; nom: string }
    /** Ce fournisseur n'a pas de clé : réseau local. */
    | { ou: 'aucune' };

interface CarteDeLaCle {
    /** L'entrée du coffre qui porte la clé, ou `null` s'il n'y en a pas. */
    secret: string | null;
    port: PortDeLaCle;
}

/**
 * ⚠️ Les identifiants suivent ceux qu'écrit déjà `useAIStore`
 * (`ai-key-<fournisseur>`), avec **une exception** : le jeton d'image est rangé
 * sous `ai-key-image` et non `ai-key-image-cloudflare`. Le renommer viderait le
 * coffre des meneurs qui l'ont déjà saisi.
 */
const CARTES: Record<FournisseurReseau, CarteDeLaCle> = {
    anthropic: {
        secret: 'ai-key-anthropic',
        port: { ou: 'entete', nom: 'x-api-key' },
    },
    gemini: {
        secret: 'ai-key-gemini',
        port: { ou: 'requete', nom: 'key' },
    },
    custom: {
        secret: 'ai-key-custom',
        port: { ou: 'entete', nom: 'Authorization', prefixe: 'Bearer ' },
    },
    'image-cloudflare': {
        secret: 'ai-key-image',
        port: { ou: 'entete', nom: 'Authorization', prefixe: 'Bearer ' },
    },
    /* Réseau local : il n'y a pas de clé à égarer. */
    ollama: { secret: null, port: { ou: 'aucune' } },
    ollama_cloud: { secret: null, port: { ou: 'aucune' } },
};

export type RequetePreparee =
    | { prete: true; url: string; entetes: Record<string, string> }
    | { prete: false; raison: string };

/**
 * Pose la clé du fournisseur sur la requête.
 *
 * `lireLeSecret` est passé plutôt qu'importé : le coffre ne doit être touché que
 * par le processus principal, et le passer en paramètre rend ce module testable
 * sans lui.
 *
 * ⚠️ **Le `custom` sans clé est un cas légitime**, pas un échec : un serveur
 * d'inférence maison n'en demande pas. Refuser l'appel casserait un usage réel.
 * Anthropic et Gemini, eux, ne répondent à rien sans clé — l'annoncer ici vaut
 * mieux qu'un 401 illisible trois écrans plus loin.
 */
export function poserLaCle(
    fournisseur: FournisseurReseau,
    url: string,
    entetes: Record<string, string>,
    lireLeSecret: (id: string) => string | null,
): RequetePreparee {
    const carte = CARTES[fournisseur];
    if (!carte) return { prete: false, raison: `Fournisseur inconnu : ${fournisseur}` };

    if (carte.port.ou === 'aucune' || carte.secret === null) {
        return { prete: true, url, entetes };
    }

    const cle = lireLeSecret(carte.secret)?.trim();
    if (!cle) {
        /* Un endpoint maison sans authentification : on laisse passer. */
        if (fournisseur === 'custom') return { prete: true, url, entetes };
        return {
            prete: false,
            raison: `Aucune clé « ${carte.secret} » dans le trousseau : saisissez-la dans les réglages de l'IA.`,
        };
    }

    if (carte.port.ou === 'requete') {
        let visee: URL;
        try {
            visee = new URL(url);
        } catch {
            return { prete: false, raison: `URL illisible : ${url}` };
        }
        /*
          `searchParams.set` remplace au lieu d'ajouter : si l'appelant avait
          laissé un `?key=` traîner, on ne se retrouve pas avec deux clés dont
          le serveur choisirait la première.
        */
        visee.searchParams.set(carte.port.nom, cle);
        return { prete: true, url: visee.toString(), entetes };
    }

    return {
        prete: true,
        url,
        entetes: { ...entetes, [carte.port.nom]: `${carte.port.prefixe ?? ''}${cle}` },
    };
}

/** Le fournisseur a-t-il une clé enregistrée ? Sert à l'écran des réglages. */
export function identifiantDuSecret(fournisseur: FournisseurReseau): string | null {
    return CARTES[fournisseur]?.secret ?? null;
}
