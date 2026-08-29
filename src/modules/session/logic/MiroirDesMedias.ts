import { useMediaStore, type MediaItem } from '../../../stores/useMediaStore';
import { fogDB } from '../../../utils/indexedDB';
import { Logger } from '../../../utils/logger';

/**
 * **Le miroir des médias, côté rendu — chantier n° 4.**
 *
 * Le process principal porte les règles qui protègent l'application (aucune
 * commande de version, jamais sous `APP_ROOT`, ne touche que ses fichiers) :
 * voir `electron/miroirDesMedias.ts`. Ce module-ci porte **ce qu'il faut
 * envoyer**, et surtout **ce qu'il ne faut pas renvoyer**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * L'INCRÉMENT EST LA SEULE CHOSE QUI REND CE CHANTIER POSSIBLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 115 images, 261 Mo, mesurés le 2026-08-29. Les relire toutes à chaque
 * sauvegarde prendrait des dizaines de secondes et rendrait la sauvegarde de
 * sortie impossible — elle dispose de quatre secondes. On demande donc au miroir
 * ce qu'il a déjà, et **on n'envoie que la différence**. Le premier passage est
 * long ; tous les suivants ne coûtent que les nouveautés.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX GARDE-FOUS QUI NE SE DEVINENT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **On ne bloque jamais la sauvegarde de session.** Une image illisible, un
 * disque plein, un blob disparu : chacun se journalise et le passage continue.
 * *Un filet qui refuse de poser la moitié qu'il peut poser ne vaut pas mieux
 * qu'un filet absent.*
 *
 * **Une seule copie à la fois.** Envoyer 115 images en parallèle sur le pont
 * IPC les charge toutes en mémoire d'un coup — un quart de gigaoctet dans le
 * renderer, pour un travail que le disque sérialise de toute façon.
 */

/** Ce qu'un passage a fait, pour le journaliser honnêtement. */
export interface BilanDuMiroir {
    /** Images effectivement copiées pendant ce passage. */
    copiees: number;
    /** Octets écrits — zéro quand tout était déjà là, ce qui est le cas normal. */
    octets: number;
    /** Images qui n'ont pas pu être copiées, et qui restent donc à faire. */
    echecs: number;
    /** Le miroir n'était pas joignable : tablette, navigateur, ou pont absent. */
    horsService?: boolean;
}

/** Le catalogue veut savoir ce que chaque octet représente — pas seulement qu'il existe. */
function ficheDe(media: MediaItem): Record<string, unknown> {
    return {
        id: media.id,
        name: media.name,
        type: media.type,
        size: media.size,
        createdAt: media.createdAt,
        tags: media.tags,
        campaignIds: media.campaignIds,
        copieLe: new Date().toISOString(),
    };
}

/**
 * L'identifiant sous lequel le brouillard de guerre est copié.
 *
 * **Inclus à la demande de David le 2026-08-29** : c'était la troisième base non
 * sauvegardée, elle pèse quelques centaines de kilo-octets, et le brouillard
 * peint carte par carte est du travail de préparation qui se perdrait avec le
 * reste. Il porte un identifiant réservé, hors de l'espace des `m-<uuid>`, pour
 * qu'aucun média ne puisse jamais le recouvrir.
 */
export const ID_DU_BROUILLARD = 'brouillard-de-guerre.json';

/**
 * Recopie ce qui manque au miroir.
 *
 * Rend un bilan plutôt que de lever : l'appelant est la sauvegarde automatique,
 * et **rien ici ne doit pouvoir l'empêcher d'écrire l'état de session**, qui est
 * la partie irremplaçable.
 */
export async function refletterLesMedias(): Promise<BilanDuMiroir> {
    const pont = typeof window === 'undefined' ? undefined : window.appBridge?.sauvegarde;
    if (!pont?.mediasCopies || !pont.copierUnMedia) {
        return { copiees: 0, octets: 0, echecs: 0, horsService: true };
    }

    const { mediaList, getMediaBlob } = useMediaStore.getState();
    const dejaLa = new Set(await pont.mediasCopies());
    const aCopier = mediaList.filter(m => !dejaLa.has(m.id));

    const bilan: BilanDuMiroir = { copiees: 0, octets: 0, echecs: 0 };

    // Une à la fois : 115 blobs en parallèle, c'est un quart de gigaoctet en
    // mémoire pour un travail que le disque sérialise de toute façon.
    for (const media of aCopier) {
        try {
            const blob = await getMediaBlob(media.id);
            if (!blob) {
                // Une référence sans octets : la base de session la cite, la base
                // des médias ne l'a plus. Le dire, et continuer.
                Logger.warn(`[Miroir] « ${media.name} » (${media.id}) n'a plus d'octets.`);
                bilan.echecs++;
                continue;
            }

            const resultat = await pont.copierUnMedia(media.id, await blob.arrayBuffer());
            if (resultat && 'ecrit' in resultat) {
                if (resultat.ecrit) { bilan.copiees++; bilan.octets += resultat.octets; }
            } else {
                bilan.echecs++;
            }
        } catch (err) {
            Logger.warn(`[Miroir] Copie impossible pour « ${media.name} » :`, err);
            bilan.echecs++;
        }
    }

    /*
      Le catalogue s'écrit même quand rien n'a été copié : un renommage ou un
      changement de campagne dans GM-OS doit se propager, sinon la restauration
      rendrait des fichiers portant le nom qu'ils avaient il y a six mois.
    */
    try {
        await pont.inscrireAuCatalogue?.(mediaList.map(ficheDe));
    } catch (err) {
        Logger.warn('[Miroir] Catalogue non écrit :', err);
    }

    await refletterLeBrouillard(pont, bilan);
    return bilan;
}

/** Ce qu'une restauration a rendu — et ce qu'elle n'a pas pu rendre. */
export interface BilanDuRetour {
    /** Médias remis en base sous leur identifiant d'origine. */
    rendus: number;
    /** Déjà présents : le vivant gagne, on ne l'écrase jamais. */
    dejaLa: number;
    /** Octets introuvables dans le miroir, ou refusés par la base. */
    echecs: number;
    /** Le brouillard a-t-il été remis ? */
    brouillard: boolean;
}

/**
 * **Ce que le miroir peut rendre, et que la bibliothèque n'a plus.**
 *
 * On ne propose pas une restauration à l'aveugle : on dit combien de médias
 * manquent. *Un bouton qui ne dit pas ce qu'il va faire n'est pas cliqué le jour
 * où il faudrait, et il est cliqué le jour où il ne faudrait pas.*
 */
export async function mediasRestituables(): Promise<string[]> {
    const pont = typeof window === 'undefined' ? undefined : window.appBridge?.sauvegarde;
    if (!pont?.lireLeCatalogue) return [];

    const catalogue = await pont.lireLeCatalogue();
    const presents = new Set(useMediaStore.getState().mediaList.map(m => m.id));
    return Object.keys(catalogue).filter(id => !presents.has(id));
}

/**
 * **Remet dans la base ce que le miroir a et qu'elle n'a plus.**
 *
 * Deux règles, et la seconde est celle qui fait qu'une restauration sert à
 * quelque chose :
 *
 * 1. **Jamais d'écrasement.** Un média déjà présent est plus récent que la
 *    copie ; le remplacer ferait du filet un mécanisme de perte.
 * 2. **L'identifiant d'origine est conservé.** Une carte de l'atlas porte
 *    `"fileUrl": "m-<uuid>"` : remettre les octets sous un identifiant neuf
 *    donnerait un disque plein et des cartes toujours mortes — *le pire des
 *    résultats, parce qu'il a l'air d'une réussite.*
 */
export async function restaurerLesMedias(): Promise<BilanDuRetour> {
    const bilan: BilanDuRetour = { rendus: 0, dejaLa: 0, echecs: 0, brouillard: false };
    const pont = typeof window === 'undefined' ? undefined : window.appBridge?.sauvegarde;
    if (!pont?.lireLeCatalogue || !pont.lireUnMedia) return bilan;

    const catalogue = await pont.lireLeCatalogue();
    const { restaurerUnMedia } = useMediaStore.getState();

    for (const [id, fiche] of Object.entries(catalogue)) {
        try {
            const octets = await pont.lireUnMedia(id);
            if (!octets) { bilan.echecs++; continue; }

            const rendu = await restaurerUnMedia(
                {
                    id, name: fiche.name, type: fiche.type as MediaItem['type'],
                    size: fiche.size, createdAt: fiche.createdAt ?? Date.now(),
                    tags: fiche.tags ?? [], campaignIds: fiche.campaignIds ?? [],
                },
                new Blob([octets]),
            );
            if (rendu) bilan.rendus++; else bilan.dejaLa++;
        } catch (err) {
            Logger.warn(`[Miroir] Restauration impossible pour « ${fiche.name} » :`, err);
            bilan.echecs++;
        }
    }

    bilan.brouillard = await restaurerLeBrouillard(pont);
    return bilan;
}

/**
 * Le brouillard, remis **clé par clé et seulement s'il manque**.
 *
 * Le remettre en bloc écraserait ce que le meneur a dévoilé depuis — et sur une
 * base vide, il n'y a rien à écraser. *La même règle que pour les médias, pour
 * la même raison.*
 */
async function restaurerLeBrouillard(
    pont: NonNullable<NonNullable<Window['appBridge']>['sauvegarde']>,
): Promise<boolean> {
    try {
        const octets = await pont.lireUnMedia!(ID_DU_BROUILLARD);
        if (!octets) return false;

        const contenu = JSON.parse(new TextDecoder().decode(octets)) as Record<string, string>;
        let remis = 0;
        for (const [cle, valeur] of Object.entries(contenu)) {
            if (await fogDB.getItem(cle)) continue;
            await fogDB.setItem(cle, valeur);
            remis++;
        }
        return remis > 0;
    } catch (err) {
        Logger.warn('[Miroir] Brouillard non restauré :', err);
        return false;
    }
}

/**
 * Le brouillard de guerre, copié **à chaque passage** et non une seule fois.
 *
 * C'est la différence avec les images : une image ne change pas, un brouillard
 * si — le meneur le dévoile au fil de la séance. On envoie donc toujours la
 * version courante, et le miroir l'écrase. *Le garder figé au premier passage
 * archiverait une carte entièrement masquée, ce qui ne vaudrait rien.*
 */
async function refletterLeBrouillard(
    pont: NonNullable<NonNullable<Window['appBridge']>['sauvegarde']>,
    bilan: BilanDuMiroir,
): Promise<void> {
    try {
        const brouillard = await fogDB.exporterTout();
        if (!brouillard || Object.keys(brouillard).length === 0) return;

        const octets = new TextEncoder().encode(JSON.stringify(brouillard));
        const resultat = await pont.copierUnMedia!(ID_DU_BROUILLARD, octets.buffer as ArrayBuffer);
        if (resultat && 'ecrit' in resultat && resultat.ecrit) {
            bilan.copiees++;
            bilan.octets += resultat.octets;
        }
    } catch (err) {
        Logger.warn('[Miroir] Brouillard de guerre non copié :', err);
        bilan.echecs++;
    }
}
