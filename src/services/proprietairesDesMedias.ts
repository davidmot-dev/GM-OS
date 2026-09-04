import { useNPCStore } from '../modules/npc/useNPCStore';
import { useImageStore } from '../modules/image/useImageStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useCombatStore } from '../modules/combat/useCombatStore';
import { useSoundStore } from '../modules/sound/useSoundStore';
import { useMusicStore } from '../modules/music/useMusicStore';
import { useAmbientStore } from '../modules/ambient/useAmbientStore';
import { useMapStore } from '../modules/map/useMapStore';
import { useStoryboardStore } from '../modules/storyboard/useStoryboardStore';
import { useFavoriteStore } from '../modules/favorite/useFavoriteStore';

/**
 * **Qui se sert de quel média — une liste, et une seule.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `MediaCleanupService` construisait cette connaissance dans une méthode privée,
 * sous la forme d'un `Set<string>`, s'en servait pour trancher, et la jetait.
 * Deux conséquences, toutes deux payées :
 *
 * **1. La liste des propriétaires vieillissait en silence.** Chaque module qui
 * apprenait à retenir un média devait penser à se déclarer dans un service que
 * personne n'ouvre en écrivant une fonctionnalité. La revue du 2026-09-04 en a
 * trouvé **six** qui ne l'avaient pas fait : Map-OS (la carte du plateau **et**
 * celle de chaque configuration sauvée), les indices, le storyboard, les
 * documents liés à un personnage, l'avatar d'un joueur, et les favoris. Un
 * fichier qui n'existait que là était compté comme orphelin — et supprimé.
 *
 * **2. Personne ne pouvait voir venir la suppression.** L'application savait
 * répondre « cette image ne sert à rien » et ne savait pas dire « elle sert
 * ici » : la même donnée, dans l'autre sens, et elle n'était affichée nulle
 * part.
 *
 * *Le remède n'est pas d'ajouter six lignes au service : c'est de n'avoir qu'une
 * liste, et de la faire lire par les deux qui en ont besoin.* Même motif que
 * `donneesDeLaSession.ts`, pour la même raison, après le même genre de perte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LE RECENSEMENT NE FAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il ne regarde **que** les identifiants du Media Hub — ceux qui commencent par
 * `m-`. Une illustration désignée par une URL web n'appartient pas au Hub : elle
 * n'a rien à y faire ni comme usage, ni comme orphelin.
 *
 * Il ne lit **aucune** préférence d'affichage : ce qui est *projeté en ce
 * moment* n'est pas un usage durable. Seul ce qui survit à la fermeture compte,
 * puisque c'est ce qui décide si un fichier a encore un propriétaire demain.
 *
 * Et il ne prétend jamais être complet quand il ne l'est pas : un magasin qui
 * échoue est signalé (`complet: false`), et le nettoyage refuse alors d'agir.
 */

/** Un endroit qui retient un média, dit en français et pas en identifiants. */
export interface UsageDunMedia {
    /** Le module qui détient la référence, tel qu'il se nomme à l'écran. */
    module: string;
    /** Ce qui, dans ce module, s'en sert — un nom, jamais un identifiant. */
    sujet: string;
}

/** Pour chaque média encore utilisé, la liste de ses usages. */
export type RegistreDesUsages = Map<string, UsageDunMedia[]>;

/**
 * Un propriétaire de médias : un magasin, et la façon de lui demander ce qu'il
 * retient.
 *
 * **Ajouter un module qui retient une image, c'est ajouter une entrée ici.**
 * Rien d'autre : le nettoyage et l'écran des médias lisent tous deux cette
 * liste.
 */
interface Proprietaire {
    module: string;
    recenser: (noter: (ref: string | undefined | null, sujet: string) => void) => void;
}

const SANS_NOM = 'Sans titre';

const LES_PROPRIETAIRES: Proprietaire[] = [
    {
        module: 'NPC-OS',
        recenser: (noter) => {
            const npc = useNPCStore.getState();
            noter(npc.currentEntity?.avatar, npc.currentEntity?.name || SANS_NOM);
            npc.savedEntities.forEach((e) => noter(e.avatar, e.name || SANS_NOM));
        },
    },
    {
        module: 'Image-OS',
        recenser: (noter) => {
            const image = useImageStore.getState();
            image.mediaList.forEach((m) => {
                noter(m.id, m.name || SANS_NOM);
                noter(m.path, m.name || SANS_NOM);
            });
        },
    },
    {
        module: 'Campagnes',
        recenser: (noter) => {
            const session = useSessionOSStore.getState();
            session.campaigns.forEach((c) => noter(c.wallpaperUrl, `Fond de « ${c.name} »`));
            session.entities.forEach((e) => noter(e.avatar, e.name || SANS_NOM));
            session.atlasMaps?.forEach((m) => noter(m.fileUrl, `Atlas — ${m.name || SANS_NOM}`));
            session.wikiEntries?.forEach((w) => {
                w.imageUrls?.forEach((url: string) => noter(url, `Wiki — ${w.title || SANS_NOM}`));
            });
        },
    },
    {
        module: 'Joueurs',
        recenser: (noter) => {
            const session = useSessionOSStore.getState();
            session.players?.forEach((p) => {
                /*
                  **L'avatar du joueur n'est pas celui de son personnage.**
                  Le nettoyage ne descendait que dans `characters` : la photo du
                  joueur autour de la table n'appartenait donc à personne.
                */
                noter(p.avatarUrl, `Joueur — ${p.realName || SANS_NOM}`);
                p.characters?.forEach((c) => {
                    noter(c.portraitUrl, `Portrait de ${c.name || SANS_NOM}`);
                    noter(c.tokenUrl, `Jeton de ${c.name || SANS_NOM}`);
                    /* Les documents attachés à une fiche : la seule famille de
                       médias non visuelle que quelqu'un range volontairement. */
                    c.linkedDocumentIds?.forEach((id: string) =>
                        noter(id, `Document de ${c.name || SANS_NOM}`),
                    );
                });
            });
        },
    },
    {
        module: 'Indices',
        recenser: (noter) => {
            useSessionOSStore
                .getState()
                .clues?.forEach((c) => noter(c.mediaUrl, c.title || SANS_NOM));
        },
    },
    {
        module: 'Combat-OS',
        recenser: (noter) => {
            useCombatStore
                .getState()
                .combatants.forEach((c) => noter(c.avatar, c.name || SANS_NOM));
        },
    },
    {
        module: 'Map-OS',
        recenser: (noter) => {
            const map = useMapStore.getState();
            noter(map.mapUrl, map.mapName || 'Carte du plateau');
            /*
              **Chaque configuration sauvée retient sa carte.** C'est le trou le
              plus coûteux des six : un preset est de la préparation, donc par
              construction une carte qu'on ne joue pas aujourd'hui — exactement
              le profil que le nettoyage prenait pour un déchet.
            */
            map.mapPresets?.forEach((p) => noter(p.mapUrl, `Configuration « ${p.name} »`));
        },
    },
    {
        module: 'Storyboard',
        recenser: (noter) => {
            useStoryboardStore.getState().moments.forEach((m) => {
                noter(m.imageMediaId, `Moment « ${m.name || SANS_NOM} »`);
                noter(m.mapUrl, `Moment « ${m.name || SANS_NOM} » (carte)`);
            });
        },
    },
    {
        module: 'Favoris',
        recenser: (noter) => {
            useFavoriteStore.getState().favorites.forEach((f) => {
                noter(f.imageUrl, f.name || SANS_NOM);
                noter(f.tokenUrl, `${f.name || SANS_NOM} (jeton)`);
            });
        },
    },
    {
        module: 'Sound-OS',
        recenser: (noter) => {
            useSoundStore.getState().atmospheres.forEach((a) => {
                Object.values(a.pads).forEach((p) => {
                    const pad = p as { filePath?: string; name?: string };
                    noter(pad.filePath, `${a.name || SANS_NOM} — ${pad.name || SANS_NOM}`);
                });
            });
        },
    },
    {
        module: 'Music-OS',
        recenser: (noter) => {
            useMusicStore.getState().playlists.forEach((playlist) => {
                playlist.pads.forEach((pad) =>
                    noter(pad.url, `${playlist.name || SANS_NOM} — ${pad.label || SANS_NOM}`),
                );
            });
        },
    },
    {
        module: 'Ambient-OS',
        recenser: (noter) => {
            const ambient = useAmbientStore.getState();
            ambient.presets.forEach((preset) => {
                preset.tracks.forEach((track) =>
                    noter(track.url, `${preset.name || SANS_NOM} — ${track.label || SANS_NOM}`),
                );
            });
            ambient.tracks.forEach((track) => noter(track.url, track.label || SANS_NOM));
        },
    },
];

/** Les noms des modules recensés, dans l'ordre. Sert aux tests et à l'écran. */
export const LES_MODULES_RECENSES = LES_PROPRIETAIRES.map((p) => p.module);

/** Ce qu'un passage de recensement a pu établir. */
export interface Recensement {
    /** Pour chaque média retenu, la liste de ses usages. */
    usages: RegistreDesUsages;
    /**
     * Vrai quand **tous** les propriétaires ont répondu.
     *
     * ⛔ **Faux, on ne supprime rien.** Un magasin qui échoue rendrait orphelin
     * tout ce qu'il détenait — et un nettoyage lancé derrière effacerait
     * précisément les fichiers qu'on n'a pas su interroger. *Le pire résultat
     * acceptable est d'épargner trop ; effacer trop ne l'est jamais.*
     */
    complet: boolean;
    /** Les modules qui n'ont pas pu être interrogés, pour le dire à l'écran. */
    modulesEnEchec: string[];
}

/**
 * Parcourt tous les propriétaires et rend, pour chaque média retenu, la liste
 * de ses usages.
 *
 * Un même média peut être retenu plusieurs fois — une image servant à deux PNJ,
 * par exemple. Chaque usage est conservé : c'est ce qui rend la réponse utile à
 * l'écran, où l'on veut lire *qui* s'en sert avant de décider.
 */
export function usagesDesMedias(): Recensement {
    const usages: RegistreDesUsages = new Map();
    const modulesEnEchec: string[] = [];

    for (const proprietaire of LES_PROPRIETAIRES) {
        const noter = (ref: string | undefined | null, sujet: string) => {
            if (!ref || !ref.startsWith('m-')) return;
            const dejaLa = usages.get(ref);
            const usage: UsageDunMedia = { module: proprietaire.module, sujet };
            if (dejaLa) dejaLa.push(usage);
            else usages.set(ref, [usage]);
        };

        try {
            proprietaire.recenser(noter);
        } catch (err) {
            console.error(`[Médias] Recensement impossible pour ${proprietaire.module} :`, err);
            modulesEnEchec.push(proprietaire.module);
        }
    }

    return { usages, complet: modulesEnEchec.length === 0, modulesEnEchec };
}
