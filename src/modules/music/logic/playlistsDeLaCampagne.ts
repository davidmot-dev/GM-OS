/**
 * **À qui appartient une atmosphère — le vocabulaire de Music-OS.**
 *
 * Demandé par David le 2026-08-30 : *« lier une config Music-OS à une
 * campagne »*. La bibliothèque reste **une seule**, et chaque playlist porte un
 * propriétaire : une campagne, ou personne — et « personne » veut dire
 * *commune*, visible partout.
 *
 * ⭐ **La règle elle-même a déménagé le 2026-09-19** dans
 * `src/logic/rattachementALaCampagne.ts` : les tuiles de Light-OS en avaient
 * besoin à l'identique, et *deux copies auraient divergé le jour où l'une
 * apprend quelque chose que l'autre ignore*. Ce fichier n'en garde que les noms
 * — ceux que Music-OS emploie partout — et la seule fonction qui lui soit
 * propre : `padDuRaccourci`.
 */
import {
    COMMUNE,
    classerParCampagne,
    visiblesDansLaCampagne,
    selectionApresChangement,
    type Rattachable,
    type ClasseesParCampagne,
} from '../../../logic/rattachementALaCampagne';

export { COMMUNE };

/** Une playlist, vue par le classement : un identifiant et un propriétaire. */
export type PlaylistAttribuable = Rattachable;

/** Le rangement d'une bibliothèque vu depuis une campagne. */
export type PlaylistsClassees<T> = ClasseesParCampagne<T>;

/** Range les playlists selon leur propriétaire, vu depuis une campagne donnée. */
export const classerLesPlaylists = classerParCampagne;

/** Les playlists que l'écran doit montrer — campagne, communes, orphelines. */
export const playlistsVisibles = visiblesDansLaCampagne;

/** La playlist à sélectionner après un changement de campagne. */
export const playlistActiveApresChangement = selectionApresChangement;

interface PadDuRaccourci {
    keybind?: string;
    url: string;
}

/**
 * La pastille qu'une touche doit lancer, cherchée **dans les seules playlists
 * visibles**.
 *
 * Sans ce filtre, le clavier resterait le seul chemin non cloisonné : deux
 * campagnes finiraient par attribuer `Numpad1` à leur ambiance d'ouverture, et
 * la première trouvée gagnerait — celle d'une campagne qu'on ne joue pas. Un
 * jour où l'on ne peut rien rattraper : la musique part devant les joueurs.
 *
 * L'ordre compte : les atmosphères de la campagne passent avant les communes,
 * pour qu'une campagne puisse redéfinir une touche générique.
 */
export function padDuRaccourci<P extends PadDuRaccourci>(
    playlists: readonly (PlaylistAttribuable & { pads: readonly P[] })[],
    campagneId: string | null,
    touche: string,
    campagnesConnues?: Iterable<string>,
): P | null {
    for (const playlist of playlistsVisibles(playlists, campagneId, campagnesConnues)) {
        // `url` vide : la pastille existe mais ne porte aucun fichier. La
        // lancer ne produirait rien et masquerait une pastille plus loin qui,
        // elle, joue.
        const pad = playlist.pads.find(p => p.keybind === touche && p.url);
        if (pad) return pad;
    }
    return null;
}
