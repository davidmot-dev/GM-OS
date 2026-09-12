/**
 * **Ce qu'on peut poser sur les trois boutons de l'afficheur.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LA CONTRAINTE QUI CHOISIT CETTE LISTE : UN BOUTON NE PORTE AUCUN ARGUMENT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le registre des actions en compte soixante-six. La plupart sont
 * **inposables** : `map:ping` veut des coordonnées, `storyboard:trigger` veut
 * l'identifiant d'un moment, `deck:jouer-carte` veut une carte. *Un bouton dit
 * « on a appuyé », et c'est tout ce qu'il dit.*
 *
 * Ne restent donc que les gestes qui se suffisent — plus **un** qui reçoit son
 * argument du réglage lui-même, et non de l'appui : le jet préréglé. C'est la
 * bonne frontière : *l'argument est figé au moment où l'on règle, jamais au
 * moment où l'on appuie.*
 *
 * ⚠️ **Le catalogue n'invente aucune capacité.** Chaque geste se résout en une
 * action **déjà** au registre, et passe par le même `dispatchRemoteAction` que
 * les tablettes. Ajouter un geste ici ne peut donc jamais ouvrir plus que ce que
 * la télécommande du meneur pouvait déjà faire.
 */

/** L'action télécommandée qu'un geste produit — la forme qu'attend le registre. */
export interface ActionDuGeste {
    type: string;
    payload?: Record<string, unknown>;
}

export interface GesteDeBouton {
    id: string;
    /**
     * Le libellé montré dans les réglages.
     *
     * ⚠️ **En français en dur, comme tout ce module.** `TableauDeBordUlanzi`
     * n'emploie pas `useTranslation` et aucune clé `ulanzi.*` n'existe dans les
     * locales : ouvrir un îlot traduit pour une seule liste déroulante ferait
     * deux conventions dans un même écran. *Le jour où le module se traduit, il
     * se traduira en entier.*
     */
    libelle: string;
    /**
     * L'action à émettre. `null` pour « Rien » — voir `actionDuGeste`.
     *
     * Une fonction pour le jet préréglé, parce que sa charge dépend du réglage.
     */
    action: ActionDuGeste | ((formule: string) => ActionDuGeste) | null;
    /** Le geste demande-t-il une formule de dés ? */
    demandeUneFormule?: boolean;
}

/**
 * **Le catalogue, et l'ordre dans lequel il s'affiche.**
 *
 * ⚠️ `rien` est **premier et par défaut** : tant que le meneur n'a rien choisi,
 * les boutons gardent leur comportement d'usine. *Un objet qui change de
 * comportement parce qu'on a branché autre chose est un objet qui surprend.*
 */
export const GESTES: readonly GesteDeBouton[] = [
    { id: 'rien', libelle: 'Rien', action: null },
    {
        id: 'tour-suivant',
        libelle: 'Tour suivant (Combat-OS)',
        action: { type: 'combat:next-turn' },
    },
    {
        id: 'quart-suivant',
        libelle: 'Quart suivant',
        action: { type: 'ulanzi:quart-suivant' },
    },
    {
        id: 'pause-des-quarts',
        libelle: 'Pause des Quarts',
        action: { type: 'ulanzi:pause' },
    },
    {
        id: 'effacer-les-des',
        libelle: 'Effacer les dés',
        action: { type: 'dice:clear' },
    },
    {
        id: 'couper-les-sons',
        libelle: 'Couper tous les sons',
        action: { type: 'sound:stop-all' },
    },
    {
        id: 'jet-preregle',
        libelle: 'Lancer un jet préréglé',
        demandeUneFormule: true,
        action: (formule: string) => ({
            type: 'dice:roll',
            payload: { formula: formule, title: formule },
        }),
    },
] as const;

export const GESTE_PAR_DEFAUT = 'rien';

export function leGeste(id: string): GesteDeBouton | undefined {
    return GESTES.find(g => g.id === id);
}

/** Le réglage d'un bouton : un geste, et sa formule quand il en demande une. */
export interface ReglageDeBouton {
    geste: string;
    formule?: string;
}

/**
 * L'action à émettre pour un réglage, ou `null` s'il n'y a rien à faire.
 *
 * ⛔ **Rend `null` dans quatre cas, et chacun compte** : le geste est « Rien »,
 * le geste est inconnu (un réglage venu d'une version plus récente), le geste
 * demande une formule et n'en a pas, ou la formule est vide. *Émettre un
 * `dice:roll` sans formule ferait rouler un jet vide en pleine table — un geste
 * qui ne peut pas s'accomplir doit ne rien faire, pas faire à peu près.*
 */
export function actionDuGeste(reglage: ReglageDeBouton | undefined): ActionDuGeste | null {
    if (!reglage) return null;

    const geste = leGeste(reglage.geste);
    if (!geste || geste.action === null) return null;

    if (typeof geste.action === 'function') {
        const formule = reglage.formule?.trim();
        if (!formule) return null;
        return geste.action(formule);
    }

    return geste.action;
}
