import {
    composerDefile,
    SEUIL_SANS_PAUSE,
    type EtatDesQuarts,
} from './defileDesQuarts';
import type { ChargeDeWidget } from '../UlanziService';

/**
 * **La librairie de widgets — le catalogue, et ce qui décide de ce qui défile.**
 *
 * Demandée par David le 2026-08-23 (§ 12 du plan), construite le 2026-08-30 :
 * *« un tableau de bord qui me permet de choisir un script pour un jeu […] ; si
 * je choisis plus d'un widget, ils doivent défiler. »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE § 12 DIT « DES DONNÉES, PAS DES FONCTIONS » — ET C'EST VRAI À MOITIÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un widget doit quand même être **dessiné**. Pris au pied de la lettre, le plan
 * aurait fait passer le défilé des Quarts pour un widget générique — or son
 * dessin est propre à *Blade Runner* : les noms des Quarts, une couleur par
 * moment du jour, la barre des consécutifs. Ce n'est pas une jauge, c'est une
 * **composition**.
 *
 * D'où **deux étagères**, assumées plutôt que découvertes en route :
 *
 * | | Ce que c'est | Coût d'un jeu de plus |
 * | --- | --- | --- |
 * | **composé** | un dessin qui lui est propre | du code, et il faut le justifier |
 * | **générique** | un des quatre types, nourri par une source déclarée | **zéro ligne** |
 *
 * La promesse « ajouter un jeu ne coûte aucune ligne » vaut pour l'étagère
 * générique — celle des miroirs à venir (Clock-OS, les réserves des pilotes).
 * L'étagère composée reste rare et explicite : c'est le prix d'un objet qui dit
 * vraiment quelque chose sur 32 × 8, et le défilé l'a prouvé à la table.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER NE FAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il ne connaît ni le réseau, ni l'appareil, ni React — comme `defileDesQuarts`.
 * Il ne résout pas non plus la **disponibilité** d'une source : aujourd'hui rien
 * ne vient d'un pilote, donc rien ne peut manquer. Cette résolution arrive avec
 * le premier miroir, et le § 12 en fixe déjà la règle : *un widget dont la
 * source disparaît s'affiche indisponible, jamais ne s'évapore.*
 */

/** Les quatre types du § 2 du plan. Vingt idées y tombent, aucune n'en déborde. */
export type TypeDeWidget = 'jauge' | 'compte-a-rebours' | 'rang' | 'icone-etat';

/**
 * D'où vient la valeur — c'est la distinction miroir / instrument du § 4.
 *
 * `pilote` : le jeu déclare le champ, et **si le widget ment c'est un bug**.
 * `main` : personne ne le suit, c'est le meneur qui pousse — et c'est le but.
 */
export type SourceDeWidget =
    | { de: 'pilote'; champ: string }
    | { de: 'main' };

export interface WidgetDeTable {
    /** Court et stable : il sert à nommer l'application sur l'appareil. */
    id: string;
    nom: string;
    type: TypeDeWidget;
    /** Le jeu auquel il appartient. **Absent = universel.** */
    systemId?: string;
    source: SourceDeWidget;
    /**
     * Allumé d'office quand un jeu n'a encore rien choisi.
     *
     * **Absent vaut éteint, et c'est délibéré.** Si « rien de choisi » voulait
     * dire « tout allumé », ajouter une entrée au catalogue **allumerait un
     * widget chez quelqu'un qui ne l'a jamais demandé** — la famille de défauts
     * que ce projet paie le plus cher. Le défilé le porte parce qu'il marchait
     * déjà sans tableau de bord : le lui retirer serait une régression.
     */
    parDefaut?: boolean;
}

/**
 * Ce que le meneur pousse à la main, et que les compositeurs lisent.
 *
 * Un seul instrument aujourd'hui. Ce type grandira ; il est nommé pour que
 * l'ajout d'un second se voie à la signature plutôt qu'au fond d'un composant.
 */
export interface EtatDesInstruments {
    quarts: EtatDesQuarts;
    seuilSansPause: number;
}

/**
 * **Le catalogue.** Des données, pas des fonctions.
 *
 * ⚠️ L'identifiant `quarts` est conservé tel quel : il donne le nom de
 * l'application sur l'appareil (`gmos_quarts`). En changer orphelinerait celle
 * qui s'y trouve déjà — elle finirait par expirer, mais entre-temps l'afficheur
 * en montrerait deux.
 */
export const LIBRAIRIE: readonly WidgetDeTable[] = [
    {
        id: 'quarts',
        nom: 'Défilé des quarts',
        type: 'rang',
        systemId: 'blade-runner',
        source: { de: 'main' },
        parDefaut: true,
    },
] as const;

/**
 * Les compositeurs de l'étagère **composée** : un dessin propre par widget.
 *
 * Volontairement séparés du catalogue, qui reste sérialisable. Un widget
 * générique n'apparaîtra jamais ici — il sera dessiné par un rendu **par type**,
 * et c'est toute la différence entre les deux étagères.
 */
export const COMPOSITEURS: Record<string, (etat: EtatDesInstruments) => ChargeDeWidget> = {
    quarts: ({ quarts, seuilSansPause }) =>
        composerDefile(quarts, seuilSansPause ?? SEUIL_SANS_PAUSE) as unknown as ChargeDeWidget,
};

/** Une entrée du tableau de bord : un widget choisi, et sa part d'écran. */
export interface EntreeActive {
    widgetId: string;
    /** Secondes pendant lesquelles il reste à l'écran. Écrit dans `duration`. */
    secondes: number;
}

/** La sélection du meneur, par jeu. Absente pour un jeu : on suit `parDefaut`. */
export type SelectionParJeu = Record<string, EntreeActive[] | undefined>;

/** Bornes de la part d'écran : trop court est illisible, trop long est absent. */
export const SECONDES_MIN = 3;
export const SECONDES_MAX = 60;
export const SECONDES_PAR_DEFAUT = 25;

export function bornerLesSecondes(secondes: number): number {
    return Math.max(SECONDES_MIN, Math.min(SECONDES_MAX, Math.round(secondes || 0)));
}

/**
 * Les widgets qu'un jeu **peut** montrer : les siens, plus les universels.
 *
 * C'est la *disponibilité* au sens du § 12 — ce que le catalogue offre, avant
 * toute sélection.
 */
export function widgetsDuJeu(
    systemId: string | null | undefined,
    catalogue: readonly WidgetDeTable[] = LIBRAIRIE,
): WidgetDeTable[] {
    return catalogue.filter(w => !w.systemId || w.systemId === systemId);
}

/**
 * **Ce qui défile, dans l'ordre où ça défilera.**
 *
 * Trois règles, et chacune corrige un défaut qu'on aurait eu :
 *
 * 1. **Jamais un widget d'un autre jeu**, même s'il traîne dans une sélection
 *    enregistrée — changer la campagne ne doit pas pousser l'Impulsion de Dune
 *    sur une table de Blade Runner.
 * 2. **Jamais un widget disparu du catalogue.** Une sélection est persistée ;
 *    elle survit à une version qui retire une entrée.
 * 3. **Sélection absente ≠ sélection vide.** Absente, on prend les `parDefaut` —
 *    c'est ce qui fait que le défilé marche sans que David ait rien à cocher.
 *    Vide, on ne pousse rien : *c'est un choix, et il doit être respecté.*
 */
export function widgetsActifs(
    systemId: string | null | undefined,
    selection: SelectionParJeu | undefined,
    catalogue: readonly WidgetDeTable[] = LIBRAIRIE,
): { widget: WidgetDeTable; secondes: number }[] {
    const disponibles = widgetsDuJeu(systemId, catalogue);
    const choisis = systemId ? selection?.[systemId] : undefined;

    if (!choisis) {
        return disponibles
            .filter(w => w.parDefaut)
            .map(widget => ({ widget, secondes: SECONDES_PAR_DEFAUT }));
    }

    return choisis.flatMap(entree => {
        const widget = disponibles.find(w => w.id === entree.widgetId);
        return widget ? [{ widget, secondes: bornerLesSecondes(entree.secondes) }] : [];
    });
}

/** Le widget est-il actif pour ce jeu ? Répond aussi quand rien n'est choisi. */
export function estActif(
    widgetId: string,
    systemId: string | null | undefined,
    selection: SelectionParJeu | undefined,
    catalogue: readonly WidgetDeTable[] = LIBRAIRIE,
): boolean {
    return widgetsActifs(systemId, selection, catalogue).some(a => a.widget.id === widgetId);
}

/**
 * Allume ou éteint un widget pour un jeu, et rend la sélection **explicite**.
 *
 * Le premier geste fige donc l'implicite : ce qui était actif par défaut est
 * écrit noir sur blanc avant d'être modifié, sinon éteindre un widget par défaut
 * n'aurait aucun effet — il serait retenu de nouveau au tour suivant.
 */
export function basculer(
    widgetId: string,
    systemId: string,
    selection: SelectionParJeu | undefined,
    catalogue: readonly WidgetDeTable[] = LIBRAIRIE,
): EntreeActive[] {
    const actuels: EntreeActive[] = widgetsActifs(systemId, selection, catalogue)
        .map(({ widget, secondes }) => ({ widgetId: widget.id, secondes }));

    if (actuels.some(e => e.widgetId === widgetId)) {
        return actuels.filter(e => e.widgetId !== widgetId);
    }

    // On ajoute à la fin : l'ordre du tableau de bord est l'ordre du défilé, et
    // un widget qu'on vient d'allumer ne doit pas passer devant les autres.
    return [...actuels, { widgetId, secondes: SECONDES_PAR_DEFAUT }];
}

/** Change la part d'écran d'un widget actif, en la bornant. */
export function reglerLesSecondes(
    widgetId: string,
    secondes: number,
    systemId: string,
    selection: SelectionParJeu | undefined,
    catalogue: readonly WidgetDeTable[] = LIBRAIRIE,
): EntreeActive[] {
    return widgetsActifs(systemId, selection, catalogue)
        .map(({ widget, secondes: actuelles }) => ({
            widgetId: widget.id,
            secondes: widget.id === widgetId ? bornerLesSecondes(secondes) : actuelles,
        }));
}

/* ────────────────────────── Le nom sur l'appareil ──────────────────────────── */

/** Le préfixe de toutes nos applications AWTRIX. Sert aussi à les reprendre. */
const PREFIXE = 'gmos_';

/** Le nom de l'application AWTRIX d'un widget. Stable : republier remplace. */
export function nomAwtrix(widgetId: string): string {
    return `${PREFIXE}${widgetId}`;
}

/**
 * **Tous les noms que GM-OS a pu poser sur l'appareil** — pas seulement ceux
 * qui sont actifs.
 *
 * C'est ce que la restitution doit retirer. Ne retirer que les actifs
 * laisserait sur l'appareil le widget qu'on vient d'éteindre : il expirerait de
 * lui-même au bout de sa durée de vie, mais entre-temps l'afficheur montrerait
 * quelque chose que GM-OS ne pousse plus. *Un afficheur qui ment sur un
 * compteur est pire qu'un afficheur éteint, parce qu'il est crédible.*
 */
export function nomsAwtrixDeTousLesWidgets(
    catalogue: readonly WidgetDeTable[] = LIBRAIRIE,
): string[] {
    return catalogue.map(w => nomAwtrix(w.id));
}
