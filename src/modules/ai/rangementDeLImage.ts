import { useMediaStore } from '../../stores/useMediaStore';
import { useSessionOSStore } from '../session/useSessionOSStore';

/**
 * **Ce qu'on rend quand une image vient d'être fabriquée — un identifiant, et
 * jamais un mégaoctet.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE DÉFAUT, MESURÉ DANS LA SAUVEGARDE DU 2026-09-18
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Sur 2 746 Ko de sauvegarde automatique, **2 078 Ko étaient deux images en
 * base64** : un indice à 1 250 Ko et l'avatar d'un PNJ à 828 Ko. Les 51 autres
 * indices portaient sagement un identifiant `m-652dcfa1…`.
 *
 * Les quatre fournisseurs de `generateImage` finissaient tous par la même
 * forme :
 *
 * ```ts
 * const localUrl = await saveAvatar(octets, nom);   // un chemin de fichier
 * try { await addMedia(fichier, etiquettes); } catch { }   // ⛔ le retour jeté
 * if (localUrl) return localUrl;
 * return `data:image/jpeg;base64,${base64}`;        // ⛔ le repli muet
 * ```
 *
 * **`addMedia` rend l'identifiant du média — et les quatre le jetaient.** Le
 * repli, lui, rendait l'image entière, encodée. Les appelants nomment ce
 * résultat `mediaId` et l'écrivent dans un magasin **persisté** : c'est le nom
 * de la variable qui a caché le défaut pendant des mois. *L'image s'affiche
 * parfaitement — une data URI est une image valide — donc rien ne se plaint.*
 *
 * ⚠️ **Ce que ça coûtait au-delà du poids.** Une image qui n'a pas d'entrée au
 * Media Hub est **hors du système** : le miroir des médias ne la sauvegarde
 * pas, `MediaCleanupService` ne la voit ni comme usage ni comme orphelin, et
 * elle n'est pas dédupliquée. Et comme un magasin persisté réécrit **tout** à
 * chaque `set()`, ce mégaoctet était re-sérialisé à chaque lancer de dés.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * L'ORDRE, ET POURQUOI IL EST DANS CE SENS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. **Le Media Hub d'abord**, parce que son identifiant est la seule référence
 *    que tout le reste de l'application sait suivre — sauvegarde comprise.
 * 2. **Le fichier sur le disque ensuite**, en repli : il marche, il ne pèse rien
 *    dans l'état, mais il échappe au miroir. On le dit dans la console.
 * 3. **On lève**, s'il ne reste rien. *Dégrader plutôt qu'échouer* est la règle
 *    de ce service, et elle vaut pour une image qu'on peut encore montrer —
 *    pas pour une image qu'on colle dans l'état persisté. ⚠️ Les quatre
 *    appelants attrapent déjà et affichent la raison au meneur, depuis la revue
 *    du 2026-09-16 qui avait trouvé les quatre générateurs muets.
 */

/**
 * L'échec du **rangement**, et non celui de la fabrication.
 *
 * ⛔ Les deux ne doivent pas se confondre, et c'est pourquoi cette classe
 * existe. `generateImage` se termine par un `catch` qui rend un avatar-robot de
 * Dicebear : *dégrader plutôt qu'échouer*, quand c'est le fournisseur qui n'a
 * rien rendu. Mais une image **fabriquée** qu'on n'a pas su ranger n'est pas un
 * fournisseur en panne : c'est du travail perdu, et un placeholder le cacherait
 * exactement comme la data URI le cachait avant.
 */
export class ErreurDeRangement extends Error {}

/** Ce qu'il faut savoir d'une image fraîchement fabriquée pour la ranger. */
export interface ImageFabriquee {
    octets: Uint8Array;
    /** `cloudflare_1789…jpg` — il sert de nom au fichier comme au média. */
    nomDeFichier: string;
    mimeType: string;
    /** Les étiquettes du Media Hub — « AI Generated » et le fournisseur. */
    etiquettes: string[];
}

/**
 * Range l'image et rend la référence à écrire dans l'état.
 *
 * @throws si ni le Media Hub ni le disque n'ont voulu d'elle. L'appelant le
 * dit au meneur ; personne ne persiste quoi que ce soit.
 */
export async function rangerLImageFabriquee(image: ImageFabriquee): Promise<string> {
    const { octets, nomDeFichier, mimeType, etiquettes } = image;

    /*
      La campagne ouverte voyage avec le média : c'est elle qui permettra plus
      tard de dire à qui cette image appartient. Absente, on range sans — une
      image sans campagne vaut mieux qu'une image sans entrée.
    */
    const campagne = useSessionOSStore.getState().activeCampaignId;

    try {
        const fichier = new File(
            [new Blob([octets as unknown as BlobPart], { type: mimeType })],
            nomDeFichier,
            { type: mimeType },
        );
        const identifiant = await useMediaStore.getState()
            .addMedia(fichier, etiquettes, campagne ? [campagne] : []);
        if (identifiant) return identifiant;
        console.warn('[Image] Le Media Hub n’a pas rendu d’identifiant.');
    } catch (err) {
        console.warn('[Image] Enregistrement au Media Hub impossible :', err);
    }

    /*
      Le repli du disque. ⚠️ Il **échappe au miroir des médias** : l'image
      survivra à la fermeture, pas à une restauration sur une autre machine.
      C'est une dégradation, elle se dit, et elle ne se découvre pas six mois
      plus tard dans une sauvegarde incomplète.
    */
    if (window.appBridge?.npc?.saveAvatar) {
        try {
            const copie = (octets.buffer as ArrayBuffer).slice(0);
            const chemin = await window.appBridge.npc.saveAvatar(copie, nomDeFichier);
            if (chemin) {
                console.warn(
                    `[Image] Rangée sur le disque faute de Media Hub : ${chemin}.`
                    + ' Elle n’entrera PAS dans le miroir des médias.',
                );
                return chemin;
            }
        } catch (err) {
            console.warn('[Image] Écriture sur le disque impossible :', err);
        }
    }

    throw new ErreurDeRangement(
        'image fabriquée mais impossible à ranger — ni le Media Hub ni le disque n’en ont voulu',
    );
}

/** Les octets d'une chaîne base64, sans passer par une boucle de caractères. */
export function octetsDuBase64(base64: string): Uint8Array {
    const binaire = atob(base64);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    return octets;
}

/**
 * Vrai pour une référence qui porte l'image **elle-même** au lieu de la
 * désigner.
 *
 * Employé par la réparation et par son contrôle : *c'est la même question posée
 * à l'écriture et à la relecture, donc elle vit à un seul endroit.*
 */
export function estUneImageEnLigne(reference: unknown): reference is string {
    return typeof reference === 'string' && reference.startsWith('data:');
}
