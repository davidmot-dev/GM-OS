import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { useJournalStore } from '../../modules/journal/useJournalStore';
import { useStoryboardStore } from '../../modules/storyboard/useStoryboardStore';
import { useRessourcesDeTableStore } from '../../modules/table/useRessourcesDeTableStore';
import { useFavoriteStore } from '../../modules/favorite/useFavoriteStore';
import { useMusicStore } from '../../modules/music/useMusicStore';
import { useCombatStore } from '../../modules/combat/useCombatStore';
import { useSoundStore } from '../../modules/sound/useSoundStore';
import { useLightStore } from '../../modules/light/useLightStore';
import { tuilePorteUnEtat } from '../../modules/light/logic/tuilePorteUnEtat';
import type { Detenteur } from './typesDeLaPurge';

/**
 * **Qui détient quelque chose au nom d'une campagne — une liste, et une seule.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `SessionManager.deleteCampaign` nettoyait huit collections de son propre
 * magasin et s'arrêtait là. Ce qui vit ailleurs survivait : le journal des
 * séances, les moments de storyboard, les réserves de table, les favoris, les
 * combats garés. Invisible partout — tous les écrans filtrent par campagne,
 * donc de la donnée dont plus aucune campagne ne porte l'identifiant n'apparaît
 * nulle part. Elle revient le jour où l'on reforge une campagne du même nom.
 *
 * *C'est exactement le motif payé par `deleteCampaign` lui-même en août :* actes
 * et scènes lui avaient été ajoutés à deux listes sur trois, et ils survivaient
 * à leur campagne. Le remède n'est pas d'allonger la cascade d'un cran à chaque
 * fois qu'on s'en aperçoit : c'est d'avoir **une liste que l'on ouvre**, et un
 * test qui refuse un magasin persisté qui ne s'y est pas déclaré.
 *
 * ⚠️ **Les noms de champ ne sont pas tous les mêmes, et c'est le piège
 * principal.** Music-OS écrit `campagneId`, en français ; tout le reste écrit
 * `campaignId`. Un nettoyage écrit à la main, ou pire une recherche de texte sur
 * `campaignId`, serait passé à côté sans rien signaler. *Un magasin ne se
 * déclare pas par la forme de ses clés — il se déclare ici.*
 */

/**
 * La campagne visée, et **ce qui s'en déduit, figé**.
 *
 * ⛔ Les scènes sont dans la cible et non relues par chaque détenteur, parce que
 * Session-OS les efface. Un détenteur appelé après lui — Combat-OS, dont les
 * combats garés sont rangés par `sceneId` — ne saurait plus lesquels étaient de
 * cette campagne. *Une dépendance à l'ordre d'une liste est un défaut qui
 * attend d'être réveillé par un tri.*
 */
export interface CibleCampagne {
    id: string;
    nom: string;
    /** Les scènes de la campagne au moment de l'aperçu. */
    sceneIds: string[];
}

/** Construit la cible. Un seul endroit sait ce qu'il faut figer. */
export function cibleDeLaCampagne(campaignId: string): CibleCampagne | null {
    const etat = useSessionOSStore.getState();
    const campagne = etat.campaigns.find(c => c.id === campaignId);
    if (!campagne) return null;

    return {
        id: campagne.id,
        nom: campagne.name,
        sceneIds: (etat.scenes ?? []).filter(s => s.campaignId === campaignId).map(s => s.id),
    };
}

const compte = (sujet: string, n: number) => ({ sujet, compte: n });

export const LES_DETENTEURS_DE_CAMPAGNE: Detenteur<CibleCampagne>[] = [
    {
        module: 'Session-OS',
        recenser: (cible) => {
            const s = useSessionOSStore.getState();
            const de = <T extends { campaignId?: string | null }>(liste: readonly T[] | undefined) =>
                (liste ?? []).filter(x => x.campaignId === cible.id).length;
            return [
                compte('la campagne elle-même', 1),
                compte('séances', de(s.sessions)),
                compte('PNJ, lieux et objets', de(s.entities)),
                compte('cartes de l’atlas', de(s.atlasMaps)),
                compte('entrées de wiki', de(s.wikiEntries)),
                compte('événements de chronologie', de(s.timelineEvents)),
                compte('indices', de(s.clues)),
                compte('actes', de(s.actes)),
                compte('scènes', cible.sceneIds.length),
                compte('objets de butin', (s.lootPool ?? []).filter(i => i.campaignId === cible.id).length),
                compte('dons consignés', (s.lootHistory ?? []).filter(e => e.campaignId === cible.id).length),
                compte('objets mis de côté', (s.lootReserve ?? []).filter(i => i.campaignId === cible.id).length),
                compte('messages', (s.messages ?? []).filter(m => m.campaignId === cible.id).length),
                compte('rencontres préparées', (s.rencontres ?? []).filter(r => r.campaignId === cible.id).length),
                compte(
                    'personnages détachés (gardés)',
                    (s.players ?? []).reduce(
                        (n, p) => n + (p.characters ?? []).filter(c => c.campaignId === cible.id).length, 0),
                ),
            ];
        },
        /*
          On appelle la cascade existante plutôt que de la recopier. Elle sait
          déjà détacher les personnages au lieu de les détruire — *un PJ
          appartient à son joueur, pas à la campagne* — et elle prévient la
          médiathèque. La recopier ici en ferait un second écrivain de la même
          règle, ce que ce fichier existe précisément pour empêcher.
        */
        purger: (cible) => useSessionOSStore.getState().deleteCampaign(cible.id),
    },
    {
        module: 'Journal de séance',
        recenser: (cible) => [compte(
            'journaux',
            useJournalStore.getState().journals.filter(j => j.campaignId === cible.id).length,
        )],
        /*
          ⚠️ **Seuls les journaux qui portent l'identifiant partent.** Ceux
          d'avant le rattachement n'ont qu'un titre où le nom de la campagne est
          recopié, et `rattacherLesCampagnes` les répare au chargement quand il
          peut. Les effacer sur une ressemblance de chaîne serait exactement le
          raccourci que ce rattachement a été écrit pour supprimer.
        */
        purger: (cible) => useJournalStore.setState(etat => ({
            journals: etat.journals.filter(j => j.campaignId !== cible.id),
        })),
    },
    {
        module: 'Storyboard',
        recenser: (cible) => [compte(
            'moments',
            useStoryboardStore.getState().moments.filter(m => m.campaignId === cible.id).length,
        )],
        purger: (cible) => useStoryboardStore.setState(etat => ({
            moments: etat.moments.filter(m => m.campaignId !== cible.id),
        })),
    },
    {
        module: 'Réserves de table',
        recenser: (cible) => {
            const reserves = useRessourcesDeTableStore.getState().reserves[cible.id];
            return [compte('réserves suivies', reserves ? Object.keys(reserves).length : 0)];
        },
        purger: (cible) => useRessourcesDeTableStore.setState(etat => {
            const reserves = { ...etat.reserves };
            delete reserves[cible.id];
            return { reserves };
        }),
    },
    {
        module: 'Favoris',
        recenser: (cible) => [compte(
            'favoris rattachés',
            useFavoriteStore.getState().favorites.filter(f => f.campaignId === cible.id).length,
        )],
        purger: (cible) => useFavoriteStore.setState(etat => ({
            favorites: etat.favorites.filter(f => f.campaignId !== cible.id),
        })),
    },
    {
        module: 'Combat-OS',
        recenser: (cible) => {
            const gares = useCombatStore.getState().combatsGares ?? {};
            return [compte(
                'combats garés sur ses scènes',
                Object.keys(gares).filter(sceneId => cible.sceneIds.includes(sceneId)).length,
            )];
        },
        purger: (cible) => useCombatStore.setState(etat => {
            const gares = { ...(etat.combatsGares ?? {}) };
            for (const sceneId of cible.sceneIds) delete gares[sceneId];
            return { combatsGares: gares };
        }),
    },
    {
        module: 'Music-OS',
        /*
          ⚠️ **Il détache, il n'efface pas — et le mot compte.** Une playlist est
          un travail d'écoute et de niveaux, réutilisable d'une campagne à
          l'autre ; l'étiquette de campagne est un tri, pas une cloison. David a
          tranché en août : *sans étiquette, elle est commune.* La purge la rend
          donc commune, ce qui est exactement ce qu'on veut d'un résidu — il
          cesse de désigner une campagne morte, sans emporter les morceaux.
        */
        note: 'Les playlists ne sont pas supprimées : elles redeviennent communes.',
        recenser: (cible) => [compte(
            'playlists étiquetées',
            useMusicStore.getState().playlists.filter(p => p.campagneId === cible.id).length,
        )],
        purger: (cible) => useMusicStore.setState(etat => ({
            playlists: etat.playlists.map(p => (p.campagneId === cible.id ? { ...p, campagneId: null } : p)),
        })),
    },
    /*
      **Sound et Light-OS** — lot E1 du chantier des archives (2026-10-19). Ils
      portent `campagneId` depuis septembre, et cette liste les ignorait : une
      campagne supprimée laissait ses ambiances et ses tuiles étiquetées à un
      nom mort. *Une seule liste de ce qui appartient à une campagne* — pour la
      purge, et demain pour l'archive.
    */
    {
        module: 'Sound',
        // La règle de Music-OS : une ambiance est un travail réutilisable, elle redevient commune.
        note: 'Les ambiances ne sont pas supprimées : elles redeviennent communes.',
        recenser: (cible) => [compte(
            'ambiances étiquetées',
            useSoundStore.getState().atmospheres.filter(a => a.campagneId === cible.id).length,
        )],
        purger: (cible) => useSoundStore.setState(etat => ({
            atmospheres: etat.atmospheres.map(a => (a.campagneId === cible.id ? { ...a, campagneId: null } : a)),
        })),
    },
    {
        module: 'Light-OS',
        /*
          Chaque campagne a son râtelier de dix-huit cases. Une tuile qui porte un
          éclairage est un travail : elle redevient commune. Une case **vide** du
          râtelier n'est qu'un emplacement : la rendre commune ajouterait une case
          vide au pot commun à chaque campagne supprimée — elle part.
        */
        note: 'Les tuiles réglées redeviennent communes ; les cases vides de son râtelier sont retirées.',
        recenser: (cible) => {
            const siennes = Object.values(useLightStore.getState().scenes).filter(t => t.campagneId === cible.id);
            return [
                compte('tuiles réglées (rendues communes)', siennes.filter(tuilePorteUnEtat).length),
                compte('cases vides de son râtelier', siennes.filter(t => !tuilePorteUnEtat(t)).length),
            ];
        },
        purger: (cible) => useLightStore.setState(etat => {
            const scenes: typeof etat.scenes = {};
            for (const [id, tuile] of Object.entries(etat.scenes)) {
                if (tuile.campagneId !== cible.id) scenes[id] = tuile;
                else if (tuilePorteUnEtat(tuile)) scenes[id] = { ...tuile, campagneId: null };
            }
            return { scenes };
        }),
    },
];

/** Les modules recensés, dans l'ordre. Sert au test de complétude et à l'écran. */
export const LES_MODULES_DE_CAMPAGNE = LES_DETENTEURS_DE_CAMPAGNE.map(d => d.module);
