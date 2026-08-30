import type { ModuleID } from '../store/useSessionStore';

/**
 * **Les modules, sous forme de données — pour la palette et les raccourcis.**
 *
 * La barre latérale les écrit un par un en JSX, avec ses séparateurs et ses
 * cas particuliers ; elle n'est pas réutilisable telle quelle. Ce catalogue est
 * donc une **seconde** énumération, et une seconde énumération finit toujours
 * par diverger.
 *
 * Sauf si le compilateur l'en empêche : le type est un `Record<ModuleID, …>`,
 * **exhaustif par construction**. Le jour où un module s'ajoute à `ModuleID`,
 * ce fichier cesse de compiler tant qu'on ne l'y a pas décrit. *Un garde-fou
 * qui refuse de construire vaut mieux qu'un test qu'on peut oublier d'écrire.*
 *
 * Les noms ne sont pas repris ici : ils viennent de `modules:names.<id>`, la
 * même clé que la barre latérale emploie. Un module renommé l'est donc partout
 * à la fois.
 */
/**
 * **Ce qu'on fait du module**, et non l'endroit où il se trouve.
 *
 * C'est le classement de la page d'aide, et il répond à la question qu'on se
 * pose en séance — *« comment je leur montre ça ? »* — plutôt qu'à l'ordre
 * d'une barre latérale, que personne ne mémorise.
 */
export type FamilleDeModule = 'mener' | 'montrer' | 'sonner' | 'preparer' | 'technique';

export const FAMILLES: Record<FamilleDeModule, { titre: string; sous: string }> = {
    mener: { titre: 'Mener', sous: "Ce qu'on tient pendant qu'on parle." },
    montrer: { titre: 'Montrer', sous: "Ce qui part vers l'écran des joueurs." },
    sonner: { titre: 'Faire sonner', sous: 'Trois façons de tenir une salle.' },
    preparer: { titre: 'Préparer & retrouver', sous: "Ce qu'on ouvre entre deux parties." },
    technique: { titre: 'Technique', sous: "Ce qu'on n'ouvre que quand ça va mal." },
};

export interface EntreeDuCatalogue {
    /** La clé de traduction du nom, partagée avec la barre latérale. */
    cle: string;
    /**
     * Proposable comme destination de raccourci ?
     *
     * `debug` ne l'est pas : lui donner une place parmi neuf reviendrait à la
     * retirer à un module de séance.
     */
    atteignable: boolean;
    famille: FamilleDeModule;
    /**
     * Une ligne sur ce que le module sert à faire, pour la page d'aide.
     *
     * **En français dans le fichier, et pas dans les traductions.** Les noms,
     * eux, passent par `modules:names.<id>` parce que la barre latérale les
     * emploie déjà : les traduire deux fois les ferait diverger. Ces résumés-là
     * n'ont qu'un lecteur ; le jour où l'anglais servira, ils prendront une clé
     * comme les autres.
     */
    resume: string;
}

export const CATALOGUE_DES_MODULES: Record<ModuleID, EntreeDuCatalogue> = {
    dashboard: { cle: 'modules:names.dashboard', atteignable: true, famille: 'mener', resume: 'Campagnes, séances, PNJ, lieux, trame.' },
    combat: { cle: 'modules:names.combat', atteignable: true, famille: 'mener', resume: "Ordre d'initiative, santé, cibles." },
    dice: { cle: 'modules:names.dice', atteignable: true, famille: 'mener', resume: 'Les jets, réglés sur le pilote du jeu ouvert.' },
    clock: { cle: 'modules:names.clock', atteignable: true, famille: 'mener', resume: 'Horloge, minuteur, calendriers, jauges de tension.' },
    journal: { cle: 'modules:names.journal', atteignable: true, famille: 'mener', resume: 'Le fil de la séance et ses comptes rendus.' },
    table: { cle: 'modules:names.table', atteignable: true, famille: 'mener', resume: "Les tirages qu'on ne veut pas improviser." },

    image: { cle: 'modules:names.image', atteignable: true, famille: 'montrer', resume: 'Illustrations, portraits, projection.' },
    map: { cle: 'modules:names.map', atteignable: true, famille: 'montrer', resume: 'Cartes, brouillard de guerre, jetons.' },
    whiteboard: { cle: 'modules:names.whiteboard', atteignable: true, famille: 'montrer', resume: "Le croquis qu'on trace à deux mains." },
    light: { cle: 'modules:names.light', atteignable: true, famille: 'montrer', resume: 'Les lampes de la pièce, liées aux scènes.' },

    music: { cle: 'modules:names.music', atteignable: true, famille: 'sonner', resume: 'Deux platines et un fondu croisé.' },
    sound: { cle: 'modules:names.sound', atteignable: true, famille: 'sonner', resume: 'Les pastilles ponctuelles, sous les doigts.' },
    ambient: { cle: 'modules:names.ambient', atteignable: true, famille: 'sonner', resume: "Les nappes qui durent toute une scène." },
    voice: { cle: 'modules:names.voice', atteignable: true, famille: 'sonner', resume: "La voix, et ce qu'elle fait baisser autour d'elle." },

    forge: { cle: 'modules:names.forge', atteignable: true, famille: 'preparer', resume: 'Dérive un pilote de jeu depuis ses fiches de règles.' },
    npc: { cle: 'modules:names.npc', atteignable: true, famille: 'preparer', resume: 'Les visages, prêts à entrer en scène.' },
    favorite: { cle: 'modules:names.favorite', atteignable: true, famille: 'preparer', resume: "Ce qu'on veut retrouver sans chercher." },
    obsidian: { cle: 'modules:names.obsidian', atteignable: true, famille: 'preparer', resume: "Le coffre Obsidian, en seconde racine de l'Oracle." },
    web: { cle: 'modules:names.web', atteignable: true, famille: 'preparer', resume: 'Le web sans quitter le pupitre.' },

    debug: { cle: 'modules:names.debug', atteignable: false, famille: 'technique', resume: "L'état interne, quand quelque chose ne répond plus." },
};

/** Les modules d'une famille, dans l'ordre du catalogue. */
export function modulesDeLaFamille(famille: FamilleDeModule): ModuleID[] {
    return (Object.keys(CATALOGUE_DES_MODULES) as ModuleID[])
        .filter(id => CATALOGUE_DES_MODULES[id].famille === famille);
}

/**
 * L'ordre dans lequel les modules se présentent — celui de la barre latérale,
 * pour que la palette ne dise pas autre chose que ce que l'œil a appris.
 */
export const MODULES_ATTEIGNABLES = (Object.keys(CATALOGUE_DES_MODULES) as ModuleID[])
    .filter(id => CATALOGUE_DES_MODULES[id].atteignable);

/** Le nombre de places de raccourci direct : `Ctrl+1` à `Ctrl+9`. */
export const PLACES_DE_RACCOURCI = 9;

/**
 * Les modules assignés par défaut aux neuf places.
 *
 * Choisis pour une séance qui se joue, pas pour une qui se prépare : la Forge
 * et le Nexus Wiki n'y sont pas, on les ouvre entre deux parties.
 */
export const RACCOURCIS_PAR_DEFAUT: (ModuleID | null)[] = [
    'dashboard', 'combat', 'music', 'image', 'map',
    'clock', 'dice', 'sound', 'journal',
];
