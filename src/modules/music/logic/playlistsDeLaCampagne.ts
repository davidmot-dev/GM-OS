/**
 * **À qui appartient une atmosphère — étiquette et pool commun.**
 *
 * Demandé par David le 2026-08-30 : *« lier une config Music-OS à une
 * campagne »*. La bibliothèque reste **une seule**, et chaque playlist porte un
 * propriétaire : une campagne, ou personne — et « personne » veut dire
 * *commune*, visible partout. Une nappe de tension écrite une fois sert dans
 * les trois campagnes, sans être recopiée trois fois ; corriger un chemin de
 * fichier se fait alors une fois, pas trois.
 *
 * **Une playlist sans propriétaire est commune.** C'est ce qui rend la bascule
 * indolore : les atmosphères écrites avant ce jour n'ont pas d'étiquette, donc
 * aucune ne disparaît le jour de la mise à jour. *Un choix de conception qui
 * fait s'évanouir du travail existant n'est pas un choix, c'est une perte.*
 *
 * Ces fonctions sont pures et ignorent tout des magasins : c'est ici que se
 * décide ce qu'on voit, et le même verdict doit servir à **l'écran comme au
 * clavier**. Deux filtres écrits séparément finiraient par diverger, et
 * l'écart ne se verrait qu'en séance — une touche qui lance la musique d'une
 * autre campagne.
 */

/** Le propriétaire d'une playlist commune. Aucune campagne ne la revendique. */
export const COMMUNE = null;

export interface PlaylistAttribuable {
    id: string;
    /**
     * La campagne propriétaire, `null`/absent pour une playlist commune.
     *
     * *Absent* et *`null`* disent exactement la même chose, et c'est
     * délibéré : la première signature vient des playlists d'avant, la
     * seconde d'un rattachement retiré à la main.
     */
    campagneId?: string | null;
}

export interface PlaylistsClassees<T> {
    /** Écrites pour la campagne ouverte. */
    deLaCampagne: T[];
    /** Sans propriétaire : utilisables partout. */
    communes: T[];
    /**
     * Rattachées à une campagne qui n'existe plus.
     *
     * Elles restent **visibles**. Une campagne supprimée emporterait sinon ses
     * atmosphères dans un angle mort dont rien ne signalerait l'existence :
     * le meneur verrait du travail s'évanouir sans cause apparente. Montrées,
     * elles se re-rattachent ou se suppriment en un geste.
     */
    orphelines: T[];
    /** Rattachées à une autre campagne, bien vivante. Masquées. */
    desAutres: T[];
}

/**
 * Range les playlists selon leur propriétaire, vu depuis une campagne donnée.
 *
 * `campagnesConnues` est facultatif : sans lui, on ne peut pas distinguer une
 * playlist d'une autre campagne d'une playlist orpheline, et tout ce qui est
 * rattaché ailleurs tombe dans `desAutres`.
 */
export function classerLesPlaylists<T extends PlaylistAttribuable>(
    playlists: readonly T[],
    campagneId: string | null,
    campagnesConnues?: Iterable<string>,
): PlaylistsClassees<T> {
    const connues = campagnesConnues ? new Set(campagnesConnues) : null;
    const classees: PlaylistsClassees<T> = {
        deLaCampagne: [],
        communes: [],
        orphelines: [],
        desAutres: [],
    };

    for (const playlist of playlists) {
        const proprietaire = playlist.campagneId ?? COMMUNE;

        if (proprietaire === COMMUNE) classees.communes.push(playlist);
        else if (campagneId !== null && proprietaire === campagneId) classees.deLaCampagne.push(playlist);
        else if (connues && !connues.has(proprietaire)) classees.orphelines.push(playlist);
        else classees.desAutres.push(playlist);
    }

    return classees;
}

/**
 * Les playlists que l'écran doit montrer — celles de la campagne, puis les
 * communes, puis les orphelines.
 *
 * **Aucune campagne ouverte : rien n'est masqué.** Il n'existe alors aucun
 * critère de tri, et masquer sur un critère absent reviendrait à cacher la
 * bibliothèque entière derrière un écran vide — indiscernable d'une perte de
 * données pour qui la regarde.
 */
export function playlistsVisibles<T extends PlaylistAttribuable>(
    playlists: readonly T[],
    campagneId: string | null,
    campagnesConnues?: Iterable<string>,
): T[] {
    if (campagneId === null) return [...playlists];

    const classees = classerLesPlaylists(playlists, campagneId, campagnesConnues);
    return [...classees.deLaCampagne, ...classees.communes, ...classees.orphelines];
}

/**
 * La playlist qui doit être sélectionnée après un changement de campagne.
 *
 * On garde celle en cours si elle reste visible — changer de campagne ne doit
 * pas déplacer la sélection sans raison. Sinon on prend la première visible :
 * **une sélection pointant sur une playlist masquée laisserait des pastilles à
 * l'écran sans qu'aucun onglet ne soit allumé**, ou pire, celles d'une autre
 * campagne.
 *
 * Rend `null` quand il n'y a rien à sélectionner — c'est un état légitime
 * (campagne neuve, aucune atmosphère commune), pas une erreur.
 */
export function playlistActiveApresChangement<T extends PlaylistAttribuable>(
    playlists: readonly T[],
    campagneId: string | null,
    actuelle: string | null,
    campagnesConnues?: Iterable<string>,
): string | null {
    const visibles = playlistsVisibles(playlists, campagneId, campagnesConnues);
    if (actuelle !== null && visibles.some(p => p.id === actuelle)) return actuelle;
    return visibles[0]?.id ?? null;
}

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
