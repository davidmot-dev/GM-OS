import type { AtlasMap } from '../../../types/chronicle.types';

/**
 * **Ce que l'application sait déjà au moment où une scène naît.**
 *
 * § 3 du plan du 2026-08-08 : *« au moment où une scène est créée, l'application
 * sait déjà : la carte active, les jetons visibles, les combattants en piste, le
 * moment de storyboard en cours, l'heure, les PNJ présents. »* Donc une scène
 * improvisée **se crée en un clic, sans rien taper** — elle capture l'état, le
 * titre viendra plus tard.
 *
 * Le plan disait aussi pourquoi c'est la seule version qui survivra : *« tout ce
 * qui demande de la frappe pendant que les joueurs attendent ne sera pas
 * fait. »* Il avait raison — le bouton existait depuis le 2026-08-17, il exigeait
 * un titre, et la trame ne se remplissait pas.
 *
 * **DES RÉFÉRENCES, JAMAIS DES CONTENUS**, et c'est le piège que le plan
 * signalait dès son § 3 : `SessionModuleSnapshot` capture déjà musique, son,
 * ambiance et lumières — mais il embarque les playlists et atmosphères
 * **complètes en charge utile**. Une scène qui ferait pareil pèserait des
 * mégaoctets par marquage, et il y en aura une dizaine par séance. Ici, quatre
 * identifiants et rien d'autre.
 */

/** Ce qu'une scène née en cours de partie emporte de la table. */
export interface EtatDeLaTable {
    lieuId?: string;
    entiteIds: string[];
    personnagesIds: string[];
    momentDeStoryboardId?: string;
}

/** Les ingrédients, tels que les magasins les portent. */
export interface IngredientsDeLaTable {
    /** Les lieux de la campagne, pour reconnaître celui qui est sur la table. */
    atlasMaps: readonly AtlasMap[];
    /** La carte réellement projetée, s'il y en a une. */
    carteProjetee?: string | null;
    /** Le lieu sélectionné dans l'Atlas — repli quand rien n'est projeté. */
    lieuSelectionne?: string | null;
    /** Les combattants en piste : on y lit les PNJ engagés. */
    combattants?: readonly { sourceEntityId?: string }[];
    /** Les PJ que la séance déclare présents ce soir. */
    personnagesDeLaSeance?: readonly string[];
    /** Le moment de storyboard en cours, s'il y en a un. */
    momentEnCours?: string | null;
}

/**
 * L'état de la table, réduit à quatre renvois.
 *
 * **La carte projetée l'emporte sur la carte sélectionnée.** C'est *« la carte
 * active »* du § 3 : ce que les joueurs ont sous les yeux, et non ce que le
 * meneur a ouvert dans son atlas pour y jeter un œil. Le repli n'existe que
 * parce qu'une scène de dialogue se joue souvent sans rien projeter.
 *
 * **Aucun champ n'est deviné.** Un lieu introuvable, une piste vide, une séance
 * qui ne déclare personne : chacun rend son absence plutôt qu'une valeur
 * plausible. Une scène improvisée est une scène ordinaire dont le taux de
 * remplissage est bas — *l'outil suit l'état, il n'arbitre pas.*
 */
export function releverLEtatDeLaTable(ing: IngredientsDeLaTable): EtatDeLaTable {
    const projete = ing.carteProjetee
        ? ing.atlasMaps.find(m => m.fileUrl && m.fileUrl === ing.carteProjetee)
        : undefined;
    const lieuId = projete?.id
        ?? (ing.lieuSelectionne && ing.atlasMaps.some(m => m.id === ing.lieuSelectionne)
            ? ing.lieuSelectionne
            : undefined);

    return {
        ...(lieuId ? { lieuId } : {}),
        // Les PNJ en piste, dédoublonnés : un même adversaire peut tenir
        // plusieurs jetons sur le plateau.
        entiteIds: [...new Set(
            (ing.combattants ?? []).map(c => c.sourceEntityId).filter((id): id is string => !!id),
        )],
        personnagesIds: [...(ing.personnagesDeLaSeance ?? [])],
        ...(ing.momentEnCours ? { momentDeStoryboardId: ing.momentEnCours } : {}),
    };
}

/**
 * Le titre d'une scène qu'on n'a pas nommée.
 *
 * **Il doit être reconnaissable, pas joli.** Le meneur le corrigera à la revue
 * de fin de séance, qui sait éditer le titre sur place depuis le 2026-08-20 ; ce
 * qu'il lui faut d'ici là, c'est retrouver la scène dans une liste. Le lieu la
 * situe mieux que l'heure — *« l'entrepôt »* se reconnaît, *« 21 h 14 »* non.
 */
export function titreParDefaut(lieu: string | undefined, quand: Date): string {
    if (lieu?.trim()) return lieu.trim();
    const h = String(quand.getHours()).padStart(2, '0');
    const m = String(quand.getMinutes()).padStart(2, '0');
    return `Scène de ${h}h${m}`;
}

/* ─────────────────────────────────────────────
   LA LECTURE DU MONDE RÉEL — séparée de ce qui précède
   ───────────────────────────────────────────── */

/** Ce que le slice de trame sait déjà, et qu'il passe plutôt qu'on n'aille le chercher. */
export interface CeQueLaTrameSait {
    atlasMaps: readonly AtlasMap[];
    lieuSelectionne?: string | null;
    personnagesDeLaSeance?: readonly string[];
}

/**
 * L'état de la table, ici et maintenant.
 *
 * **Le plateau de combat et le storyboard se lisent par le global**, comme le
 * fait déjà le combat pour la trame : un import direct fermerait un cycle. Le
 * reste est passé par l'appelant, qui l'a sous la main.
 *
 * **Rien de tout cela n'est obligatoire.** Un magasin absent, une piste vide, un
 * moment qui ne tourne pas : la capture rend simplement moins de choses. *Créer
 * une scène ne doit jamais échouer parce qu'un module ne répond pas* — c'est le
 * geste qu'on veut gratuit, et une capture partielle vaut infiniment mieux
 * qu'un clic qui ne fait rien.
 */
export function releverLaTableMaintenant(su: CeQueLaTrameSait): EtatDeLaTable {
    let carteProjetee: string | null | undefined;
    let combattants: readonly { sourceEntityId?: string }[] | undefined;
    let momentEnCours: string | null | undefined;

    try {
        const g = window as unknown as {
            useMapStore?: { getState: () => { mapUrl?: string | null } };
            useCombatStore?: { getState: () => { combatants?: { sourceEntityId?: string }[] } };
            useStoryboardStore?: { getState: () => { activeMomentId?: string | null } };
        };
        carteProjetee = g.useMapStore?.getState()?.mapUrl;
        combattants = g.useCombatStore?.getState()?.combatants;
        momentEnCours = g.useStoryboardStore?.getState()?.activeMomentId;
    } catch {
        // Un magasin qui ne répond pas ne doit pas empêcher de marquer une scène.
    }

    return releverLEtatDeLaTable({
        atlasMaps: su.atlasMaps,
        carteProjetee,
        lieuSelectionne: su.lieuSelectionne,
        combattants,
        personnagesDeLaSeance: su.personnagesDeLaSeance,
        momentEnCours,
    });
}
