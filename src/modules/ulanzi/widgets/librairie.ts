import {
    composerDefile,
    SEUIL_SANS_PAUSE,
    type EtatDesQuarts,
} from './defileDesQuarts';
import { composerCompteARebours } from './compteARebours';
import { composerMinuteur, ilYAUnMinuteur, type MinuteurAAfficher } from './minuteur';
import { composerLHeure, type TempsAAfficher } from './heureDuMonde';
import { composerJaugeDeTable, type ReserveAAfficher } from './jaugeDeTable';
import { visiblePourUnJoueur, type RessourceDeTable } from '../../table/RessourcesDeTable';
import { composerVoightKampff, SIGNAL_INITIAL, type EtatDuSignal } from './voightKampff';
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
    /**
     * **Miroir d'un module de GM-OS** — les horloges de tension de Clock-OS.
     *
     * Ajouté à l'étape B. Le § 12 n'avait prévu que `pilote` et `main`, mais un
     * moteur de GM-OS n'est ni l'un ni l'autre : il n'est pas déclaré par un jeu,
     * et personne ne le pousse à la main. *Le nommer plutôt que le faire passer
     * pour l'un des deux* — c'est la même exigence que « scellée » contre « face
     * visible ».
     */
    | { de: 'horloge' }
    /** Miroir du minuteur de Clock-OS. Le seul qui change à la seconde. */
    | { de: 'minuteur' }
    /** Miroir de l'heure de Clock-OS — réelle, statique ou fantastique. */
    | { de: 'temps' }
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
    /**
     * **Sa couleur se règle-t-elle depuis le tableau de bord ?**
     *
     * Absent pour le défilé des Quarts, et c'est délibéré : **il se colore par
     * moment du jour** — chaud le matin, froid la nuit. C'est de l'information,
     * pas de la décoration ; l'aplatir sous une couleur unique la perdrait.
     * *On ne rend pas réglable ce qui dit quelque chose.*
     */
    couleurReglable?: boolean;
    /**
     * **Ce widget demande-t-il une seconde de fraîcheur ?**
     *
     * Le minuteur affiche `MM:SS`, l'heure change de minute, le signal du
     * Voight-Kampff dérive. Les autres ne bougent que quand le meneur les
     * pousse.
     *
     * Déclaré ici plutôt que déduit de la source : *une propriété qu'on devine
     * en énumérant des cas se trompe le jour où un cas s'ajoute*, et c'est déjà
     * ce qui a failli arriver en ajoutant l'heure à côté du minuteur.
     */
    cadenceRapide?: boolean;
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
    /** Le rythme du Voight-Kampff, poussé à la main lui aussi. */
    signal: EtatDuSignal;
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
    {
        /*
          **Le premier miroir — étape B, le 2026-08-30.**

          Universel : toute campagne peut porter des horloges de tension, alors
          qu'une réserve de table appartient à un jeu. C'est ce qui l'a fait
          passer avant les jauges des pilotes.

          **Pas `parDefaut`.** Il ne s'allumera donc chez personne sans qu'on le
          coche — *ajouter une entrée au catalogue ne doit jamais allumer un
          widget chez quelqu'un qui ne l'a pas demandé.*
        */
        id: 'horloges',
        nom: 'Horloges de tension',
        type: 'compte-a-rebours',
        source: { de: 'horloge' },
        couleurReglable: true,
    },
    {
        /*
          **Le widget que le § 8.1 classait premier**, arrivé en dernier parce
          qu'il demandait ce que les deux autres n'ont pas demandé : que le
          minuteur descende hors de son écran, et que l'afficheur sache
          rafraîchir à la seconde. Universel — tout jeu peut poser un minuteur.
        */
        id: 'minuteur',
        nom: 'Minuteur',
        type: 'compte-a-rebours',
        source: { de: 'minuteur' },
        couleurReglable: true,
        cadenceRapide: true,
    },
    {
        /*
          ⚠️ **Le seul widget qui défile**, et donc le seul qui déroge au § 1.
          Décision de David le 2026-08-30 : *« l'heure ne suffit pas, alors fais
          défiler la date et l'heure »*. Une date fantastique ne tiendra jamais
          sur 32 pixels, et c'est l'information qu'aucun autre écran de la table
          ne porte.
        */
        id: 'heure',
        nom: 'Heure du monde',
        type: 'rang',
        source: { de: 'temps' },
        couleurReglable: true,
        cadenceRapide: true,
    },
    {
        /*
          **Étape C — celle qui démontre la thèse du § 12.** Si ajouter Dune
          coûte zéro ligne de code, la librairie est juste. Universel : ce sont
          les **pilotes** qui déclarent leurs réserves, pas ce catalogue.
        */
        id: 'reserves',
        nom: 'Réserves de table',
        type: 'jauge',
        source: { de: 'pilote', champ: 'ressourcesDeTable' },
        couleurReglable: true,
    },
    {
        /*
          **Le second widget composé** — demandé par David le 2026-08-31, et le
          seul autre à mériter son propre dessin. Un tracé n'est aucun des quatre
          types du § 2 ; l'étagère composée existe pour ça, et doit rester rare.

          **Pas `couleurReglable`** : la couleur monte avec le rythme, du vert au
          rouge. *On ne rend pas réglable ce qui dit quelque chose* — la même
          raison que pour les Quarts.
        */
        id: 'vk',
        nom: 'Signal Voight-Kampff',
        type: 'icone-etat',
        systemId: 'blade-runner',
        source: { de: 'main' },
        /*
          **Plus de cadence rapide depuis le 2026-08-31**, et c'est le gain caché
          des icônes animées. Le tracé se redessinait toutes les 500 ms pour
          dériver d'une colonne ; l'animation vit désormais dans l'appareil, qui
          la joue seul. Le signal n'a plus rien à republier entre deux
          changements de niveau.

          *Une contrainte qu'on croyait structurelle — la cadence rapide de tout
          le battement — tenait à un seul widget.*
        */
        cadenceRapide: false,
    },
] as const;

/**
 * Les compositeurs de l'étagère **composée** : un dessin propre par widget.
 *
 * Volontairement séparés du catalogue, qui reste sérialisable. Un widget
 * générique n'apparaîtra jamais ici — il sera dessiné par un rendu **par type**,
 * et c'est toute la différence entre les deux étagères.
 */
export const COMPOSITEURS: Record<
    string,
    (etat: EtatDesInstruments, maintenant: number) => ChargeDeWidget
> = {
    quarts: ({ quarts, seuilSansPause }) =>
        composerDefile(quarts, seuilSansPause ?? SEUIL_SANS_PAUSE) as unknown as ChargeDeWidget,
    // `maintenant` porte la dérive du tracé : une colonne par seconde.
    vk: ({ signal }) =>
        composerVoightKampff(signal ?? SIGNAL_INITIAL) as unknown as ChargeDeWidget,
};

/** Une entrée du tableau de bord : un widget choisi, et sa part d'écran. */
export interface EntreeActive {
    widgetId: string;
    /** Secondes pendant lesquelles il reste à l'écran. Écrit dans `duration`. */
    secondes: number;
    /**
     * La couleur choisie, ou absente pour celle du widget.
     *
     * **Absente n'est pas noire.** Un widget dont on n'a jamais touché la
     * couleur doit garder la sienne, et non recevoir une valeur par défaut
     * enregistrée — sans quoi changer la couleur d'usine d'un widget ne
     * changerait rien chez qui ne l'a jamais réglée.
     */
    couleur?: string;
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
): { widget: WidgetDeTable; secondes: number; couleur?: string }[] {
    const disponibles = widgetsDuJeu(systemId, catalogue);
    const choisis = systemId ? selection?.[systemId] : undefined;

    if (!choisis) {
        return disponibles
            .filter(w => w.parDefaut)
            .map(widget => ({ widget, secondes: SECONDES_PAR_DEFAUT }));
    }

    return choisis.flatMap(entree => {
        const widget = disponibles.find(w => w.id === entree.widgetId);
        return widget
            ? [{ widget, secondes: bornerLesSecondes(entree.secondes), couleur: entree.couleur }]
            : [];
    });
}

/**
 * **Un widget actif demande-t-il une seconde de fraîcheur ?**
 *
 * Le minuteur affiche `MM:SS` : republié toutes les trente secondes, il serait
 * faux vingt-neuf secondes sur trente. Rien d'autre n'a ce besoin — un Quart et
 * une horloge de tension ne bougent que quand le meneur les pousse.
 *
 * *La cadence est une propriété de ce qu'on affiche, pas un réglage global* :
 * faire battre l'afficheur à la seconde en permanence coûterait un tour de
 * boucle par seconde pour ne rien publier la plupart du temps.
 */
export function demandeUneCadenceRapide(
    systemId: string | null | undefined,
    selection: SelectionParJeu | undefined,
    catalogue: readonly WidgetDeTable[] = LIBRAIRIE,
): boolean {
    /*
      Elle ne coûte pas ce qu'elle en a l'air : le battement ne republie que ce
      qui a **changé**. L'heure ne part qu'une fois par minute, le défilé qu'au
      renouvellement de sa durée de vie. *La cadence rapide fait tourner une
      boucle, pas le réseau.*
    */
    return widgetsActifs(systemId, selection, catalogue)
        .some(({ widget }) => widget.cadenceRapide);
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
        .map(({ widget, secondes: actuelles, couleur }) => ({
            widgetId: widget.id,
            secondes: widget.id === widgetId ? bornerLesSecondes(secondes) : actuelles,
            couleur,
        }));
}

/**
 * Change la couleur d'un widget actif.
 *
 * Rendre la couleur **vide** l'efface plutôt que d'enregistrer du noir : un
 * widget sans couleur choisie doit garder la sienne, et non figer la valeur
 * d'usine du jour où on l'a effleuré.
 */
export function reglerLaCouleur(
    widgetId: string,
    couleur: string | null,
    systemId: string,
    selection: SelectionParJeu | undefined,
    catalogue: readonly WidgetDeTable[] = LIBRAIRIE,
): EntreeActive[] {
    return widgetsActifs(systemId, selection, catalogue)
        .map(({ widget, secondes, couleur: actuelle }) => ({
            widgetId: widget.id,
            secondes,
            couleur: widget.id === widgetId ? (couleur || undefined) : actuelle,
        }));
}

/* ──────────────── Ce qui part vers l'appareil : N applications ─────────────── */

/** Une horloge de tension, réduite à ce que l'afficheur en montre. */
export interface HorlogeAAfficher {
    id: string;
    nom: string;
    remplis: number;
    total: number;
    couleur?: string;
}

/**
 * L'état du monde que les widgets reflètent ou poussent.
 *
 * ⚠️ **`horloges` ne contient que ce que la table a le droit de voir.** Le
 * caviardage se fait **en amont**, chez l'appelant qui lit `isClockProjected` :
 * l'afficheur est public par construction (§ 1), et filtrer au dessin
 * reviendrait à envoyer un secret en comptant sur l'affichage pour le taire —
 * la faute déjà refusée sur les cartes scellées de Deck-OS.
 */
export interface MondeDesWidgets {
    instruments: EtatDesInstruments;
    horloges: HorlogeAAfficher[];
    /** Le minuteur, ou `null` s'il n'y en a pas de posé. Caviardé en amont aussi. */
    minuteur: MinuteurAAfficher | null;
    /** L'heure du monde, ou `null` si elle n'est pas montrable. */
    temps: TempsAAfficher | null;
    /** Les réserves de table **que la table a le droit de voir**. Caviardé en amont. */
    reserves: ReserveAAfficher[];
    /**
     * L'heure système, pour le mode temps réel **uniquement**.
     *
     * Passée plutôt que lue, pour que tout ce fichier reste pur — et parce que
     * le `timestamp` du magasin ne fait pas foi dans ce mode-là.
     */
    maintenant: number;
}

/**
 * **L'heure que la table a le droit de voir.**
 *
 * Même interrupteur que les horloges et le minuteur : `isClockProjected`.
 * L'afficheur est public par construction, et une heure de jeu que le meneur ne
 * projette pas n'a pas à paraître au milieu de la table.
 */
export function tempsPourLaTable(etat: {
    isClockProjected?: boolean;
    mode?: TempsAAfficher['mode'];
    timestamp?: number;
    getFantasyDate?: () => {
        day: number; monthIndex: number; year: number;
        hour: number; minute: number; dayOfWeek?: string;
    } | null;
    activeCalendarId?: string | null;
    calendars?: Record<string, { months: { name: string; displayName?: string; isIntercalary?: boolean }[] }>;
}): TempsAAfficher | null {
    if (!etat.isClockProjected) return null;

    const mode = etat.mode ?? 'realtime';
    const temps: TempsAAfficher = { mode, timestamp: etat.timestamp ?? 0, dateFantastique: null };
    if (mode !== 'fantasy') return temps;

    /*
      Le nom du mois vit dans le calendrier, pas dans la date : `getFantasyDate`
      rend un `monthIndex`. On le résout ici plutôt que dans le rendu, qui n'a
      pas à connaître la forme d'un calendrier.
    */
    const date = etat.getFantasyDate?.();
    const calendrier = etat.activeCalendarId ? etat.calendars?.[etat.activeCalendarId] : undefined;
    const mois = date && calendrier ? calendrier.months[date.monthIndex] : undefined;
    if (!date || !mois) return temps;

    return {
        ...temps,
        dateFantastique: {
            jour: date.day,
            mois: mois.displayName || mois.name,
            annee: date.year,
            heure: date.hour,
            minute: date.minute,
            jourDeLaSemaine: date.dayOfWeek,
            intercalaire: mois.isIntercalary,
        },
    };
}

/**
 * **Le minuteur que la table a le droit de voir.**
 *
 * Même règle et même interrupteur que les horloges : l'afficheur est public par
 * construction, et `isClockProjected` décide déjà de ce que les tablettes
 * voient. Un minuteur non posé ne se montre pas — un `00:00` permanent
 * occuperait un tour de rotation pour ne rien dire.
 */
export function minuteurPourLaTable(etat: {
    isClockProjected?: boolean;
    timerRemaining?: number;
    timerDuration?: number;
}): MinuteurAAfficher | null {
    if (!etat.isClockProjected || !ilYAUnMinuteur(etat)) return null;
    return { restant: etat.timerRemaining ?? 0, duree: etat.timerDuration ?? 0 };
}

/**
 * **Les horloges que la table a le droit de voir.**
 *
 * L'afficheur est **public par construction** (§ 1) : il ne doit jamais montrer
 * une horloge que le meneur garde pour lui. On suit donc `isClockProjected`, le
 * même interrupteur qui décide de ce que les tablettes voient.
 *
 * *Le caviardage se fait à la source, pas à l'affichage* — la règle déjà payée
 * sur les cartes scellées de Deck-OS. Elle vit ici, pure et testée, parce que
 * cachée dans le crochet **elle n'était couverte par rien** : la dégradation a
 * montré qu'on pouvait la supprimer sans faire tomber un seul test.
 */
export function horlogesPourLaTable(etat: {
    isClockProjected?: boolean;
    tensions?: {
        id: string; name: string; totalSegments: number; filledSegments: number;
        color?: string; surLAfficheur?: boolean;
    }[];
}): HorlogeAAfficher[] {
    if (!etat.isClockProjected) return [];

    return (etat.tensions ?? [])
        /*
          **Le drapeau choisit lesquelles, l'interrupteur décide si.** Deux
          questions différentes : `isClockProjected` dit si la table voit les
          jauges, `surLAfficheur` dit lesquelles vont sur les 32 pixels. Absent,
          elle y va — comme avant ce champ.
        */
        .filter(t => t.surLAfficheur ?? true)
        .map(t => ({
        id: t.id,
        nom: t.name,
        remplis: t.filledSegments,
        total: t.totalSegments,
        couleur: t.color,
    }));
}

/**
 * **Les réserves que la table a le droit de voir — étape C.**
 *
 * ⚠️ **Le point sensible de toute l'étape.** L'afficheur est **public par
 * construction** (§ 1) : il est posé au milieu de la table et tout le monde le
 * lit. Le modèle des réserves distingue justement `proprietaire` — à qui elle
 * appartient — et `visibleAuxJoueurs` — qui a le droit de la lire. Chez Dune la
 * Menace est **celle du meneur et pourtant publique** ; une table qui la joue à
 * couvert existe aussi, et c'est le pilote qui tranche.
 *
 * On s'en remet donc à `visiblePourUnJoueur`, la règle du module des réserves,
 * plutôt que d'en réécrire une ici. *Le caviardage se fait à la source, pas à
 * l'affichage* — et deux règles pour la même question finiraient par diverger,
 * cette fois sur un secret du meneur affiché au milieu de la table.
 */
export function reservesPourLaTable(
    declarees: readonly RessourceDeTable[] | undefined,
    valeurs: Record<string, number> | undefined,
): ReserveAAfficher[] {
    return (declarees ?? [])
        .filter(visiblePourUnJoueur)
        .map(r => ({
            id: r.id,
            nom: r.label,
            valeur: valeurs?.[r.id] ?? r.depart,
            min: r.min,
            max: r.max,
        }));
}

/** Une application AWTRIX prête à pousser. */
export interface ApplicationAPousser {
    nom: string;
    charge: ChargeDeWidget;
    secondes: number;
}

/**
 * **Un widget, plusieurs applications — et c'est le cœur de l'étape B.**
 *
 * Le catalogue reste **statique** : une entrée « Horloges de tension », cochée
 * ou non. Mais une campagne peut en porter six, et 32 × 8 n'en montre qu'une à
 * la fois. On déplie donc l'entrée en **une application par horloge**, et la
 * rotation native de l'appareil fait le reste — *toujours aucun ordonnanceur à
 * écrire*, ce qui était déjà la bonne nouvelle du § 12.
 *
 * Chaque application hérite de la part d'écran réglée sur son widget : six
 * horloges à 8 s font 48 s de tour, ce qui se règle depuis le tableau de bord
 * sans rien changer ici.
 */
export function applicationsAPousser(
    systemId: string | null | undefined,
    selection: SelectionParJeu | undefined,
    monde: MondeDesWidgets,
    catalogue: readonly WidgetDeTable[] = LIBRAIRIE,
): ApplicationAPousser[] {
    return widgetsActifs(systemId, selection, catalogue).flatMap(({ widget, secondes, couleur }) => {
        if (widget.source.de === 'pilote') {
            // Une application par réserve, comme pour les horloges : 32 × 8
            // n'en montre qu'une, et la rotation native fait le reste.
            return monde.reserves.map(reserve => ({
                nom: nomAwtrixDeLaReserve(reserve.id),
                charge: composerJaugeDeTable(reserve, couleur) as unknown as ChargeDeWidget,
                secondes,
            }));
        }

        if (widget.source.de === 'temps') {
            return monde.temps
                ? [{
                    nom: nomAwtrix(widget.id),
                    charge: composerLHeure(monde.temps, monde.maintenant, couleur) as unknown as ChargeDeWidget,
                    secondes,
                }]
                : [];
        }

        if (widget.source.de === 'minuteur') {
            return monde.minuteur
                ? [{
                    nom: nomAwtrix(widget.id),
                    charge: composerMinuteur(monde.minuteur, couleur) as unknown as ChargeDeWidget,
                    secondes,
                }]
                : [];
        }

        if (widget.source.de === 'horloge') {
            /*
              **La plus précise gagne.** L'horloge porte sa propre couleur,
              posée jauge par jauge dans Clock-OS ; le widget en porte une pour
              toutes celles qui n'en ont pas. *Le réglage le plus proche de
              l'objet l'emporte sur le réglage collectif*, sinon le second
              effacerait le premier sans qu'on comprenne pourquoi.
            */
            return monde.horloges.map(horloge => ({
                nom: nomAwtrixDeLHorloge(horloge.id),
                charge: composerCompteARebours({
                    ...horloge,
                    couleur: horloge.couleur || couleur,
                }) as unknown as ChargeDeWidget,
                secondes,
            }));
        }

        /*
          Un widget sans compositeur est **sauté en silence** : le catalogue peut
          annoncer une entrée dont le rendu par type n'existe pas encore, et une
          exception ici arrêterait la publication de toutes les autres.
        */
        const composer = COMPOSITEURS[widget.id];
        if (!composer) return [];

        return [{
            nom: nomAwtrix(widget.id),
            charge: composer(monde.instruments, monde.maintenant),
            secondes,
        }];
    });
}

/* ────────────────────────── Le nom sur l'appareil ──────────────────────────── */

/** Le préfixe de toutes nos applications AWTRIX. Sert aussi à les reprendre. */
const PREFIXE = 'gmos_';

/** Le nom de l'application AWTRIX d'un widget. Stable : republier remplace. */
export function nomAwtrix(widgetId: string): string {
    return `${PREFIXE}${widgetId}`;
}

/**
 * Le nom de l'application d'**une** horloge.
 *
 * L'identifiant vient du magasin (`clock-1754…`) et sert de nom d'application :
 * on le réduit à ce qu'une URL et l'appareil acceptent sans surprise. Il doit
 * rester **stable pour une même horloge** — c'est ce qui fait qu'une
 * republication remplace au lieu d'empiler.
 */
export function nomAwtrixDeLHorloge(horlogeId: string): string {
    return `${PREFIXE}h_${assainir(horlogeId)}`;
}

/**
 * Le nom de l'application d'**une** réserve.
 *
 * Préfixe distinct de celui des horloges : deux identifiants pourraient se
 * ressembler, et *deux widgets qui se disputent un nom d'application se
 * remplacent l'un l'autre en silence.*
 */
export function nomAwtrixDeLaReserve(reserveId: string): string {
    return `${PREFIXE}r_${assainir(reserveId)}`;
}

/** Réduit un identifiant à ce qu'une URL et l'appareil acceptent sans surprise. */
function assainir(id: string): string {
    return id.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'sans_id';
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
