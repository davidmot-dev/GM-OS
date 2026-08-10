// src/data/defaultGameDrivers.ts
import type { GameDriver } from '../types/drivers';

/**
 * Pilote de « Dune : Aventures dans l'Imperium » — **le pilote de référence**.
 *
 * **Pourquoi il existe.** Ce tableau était vide. L'application ne livrait aucun
 * exemple de pilote correct, et le seul gabarit de fiche s'appelait « Generic »
 * avec des champs `stat1`, `stat2`. Impossible, dans ces conditions, de juger ce
 * que la Forge Système rendait : il n'y avait rien à quoi le comparer. David l'a
 * dit le 2026-08-10 — « je n'ai jamais réussi à savoir comment utiliser
 * correctement les informations de la forge système ». Ce n'était pas lui.
 *
 * **Chaque valeur est tirée du corpus vérifié**, pas d'une supposition. Les
 * fiches v3 de `docs/systems/dune/rules/` citent leurs sections, et
 * `electron/bookIndex.ts` les résout en pages du livre. Quand une valeur ne
 * pouvait pas être tirée du corpus, elle est signalée.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES QUATRE MURS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Écrire ce pilote a servi d'épreuve au modèle, et le modèle a cédé sur quatre
 * points. Ils sont laissés **visibles** plutôt que contournés : un contournement
 * silencieux se serait fait passer pour un pilote correct, et c'est exactement
 * le genre de mensonge que ce fichier est censé rendre impossible.
 *
 * `src/data/duneReference.test.ts` les tient par des tests qui échoueront quand
 * le modèle saura enfin les exprimer — c'est le signal qu'on attend.
 *
 * **1. Dune n'a pas de points de vie.** « Il n'existe aucune jauge numérique de
 *    santé ou de fatigue sur la feuille de personnage » (`sante-et-blessures.md`,
 *    `jauges-et-ressources-individuelles.md`). Or `Combatant` impose `hp` et
 *    `hpMax`, et `calculateDamageImpact` calcule `target.hp - amount`. Vaincre un
 *    personnage est une **tâche étendue** dont le seuil de résistance vaut sa
 *    compétence défensive (4 à 8). Aucun champ du modèle ne peut porter ça :
 *    `statsToTrack` ne déclare donc **aucun `isMainHP`**, ce qui est vrai pour
 *    Dune et inattendu pour le reste de l'application.
 *
 * **2. L'initiative n'est pas une valeur par combattant.** « L'initiative alterne
 *    de manière binaire entre les camps » : le meneur désigne qui ouvre, puis
 *    chaque camp passe la main ou paie deux points d'Impulsion pour la conserver
 *    (`initiative-et-deroulement-du-tour.md`). Le modèle n'offre qu'une
 *    `initiativeFormula` évaluée par personnage. La formule ci-dessous est donc
 *    **un pis-aller assumé** : elle range les combattants par Mobilité, ce que
 *    le livre ne demande nulle part. Il manque un *mode* d'initiative.
 *
 * **3. Le seuil de réussite est dynamique.** Il vaut **compétence + principe**,
 *    choisis test par test — de 8 à 16. `DiceConfig.successThreshold` est un
 *    nombre fixe. On y met 8, qui est le **minimum** et non la valeur : lancer
 *    avec ce seuil sous-estime systématiquement le personnage. Il manque un
 *    descripteur de jet disant *de quels champs* le seuil se compose.
 *
 * **4. Les ressources de table n'existent pas dans le modèle.** L'Impulsion est
 *    une réserve **commune aux joueurs**, bornée de 0 à 6, qui perd un point en
 *    fin de scène ; la Menace est celle du meneur, sans maximum
 *    (`monnaie-de-table.md`). Ce sont les ressources les plus manipulées d'une
 *    partie de Dune, et le pilote n'a nulle part où les déclarer — tout ce qu'il
 *    connaît sont des champs de fiche, donc individuels.
 */
const DUNE: GameDriver = {
    id: 'dune',
    name: "Dune : Aventures dans l'Imperium",
    author: 'GM-OS',
    version: '1.0.0',
    description:
        "Système 2d20 de Modiphius. Le seuil d'un test est la somme d'une compétence et d'un " +
        "principe ; chaque dé sous ce seuil est une réussite. Ni points de vie ni initiative " +
        'individuelle : les blessures sont des traits, et le tour alterne entre les camps.',
    emoji: '🏜️',
    templateId: 'dune',

    /**
     * Réserve de 2d20, extensible à 5. Chaque dé **inférieur ou égal** au seuil
     * est une réussite ; le test passe si les réussites atteignent la difficulté
     * (0 à 5). Un 1 naturel vaut deux réussites, un 20 est une complication.
     *
     * Mur n° 3 : `successThreshold: 8` est le seuil **minimal** (4 + 4), pas le
     * seuil réel, qui se calcule à chaque test depuis la fiche.
     */
    dice: {
        engine: '2d20',
        defaultDice: '2d20',
        logic: 'count-success',
        successThreshold: 8,
        critRange: 1,
    },

    /**
     * Le descripteur qui abat le mur n° 3.
     *
     * Le seuil ne vaut plus 8 par défaut : il se compose d'**une compétence et
     * d'un principe** retenus sur la fiche, de 8 à 16. Le joueur choisit ce que
     * fait son personnage et pourquoi il agit, et le jet en découle.
     */
    jet: {
        seuil: [
            { id: 'competence', label: 'Compétence', sectionId: 'competences' },
            { id: 'principe', label: 'Principe', sectionId: 'principes' },
        ],
        // « Réserve de dés : de deux à cinq dés. » Les trois dés supplémentaires
        // s'achètent 1, 2 puis 3 points d'Impulsion ou de Menace.
        reserve: { base: 2, max: 5, faces: 20 },
        sens: 'sous-ou-egal',
        critique: 1,        // « Réussite critique standard : un naturel, valant deux réussites. »
        complication: 20,   // « Complication standard : résultat de vingt naturel. »
        difficulte: { min: 0, max: 5, defaut: 1 },
    },

    /**
     * Mur n° 1 : **aucune stat n'est marquée `isMainHP`**, parce que Dune n'a pas
     * de points de vie. On suit la Détermination, seule ressource individuelle
     * chiffrée du jeu.
     */
    combat: {
        statsToTrack: [
            { fieldId: 'determination', label: 'Détermination', isMainHP: false, isResource: true },
        ],
        // Mur n° 2 : pis-aller. Le livre ne classe pas les combattants.
        initiativeFormula: 'mobilite',
        initiativeSort: 'desc',
        defaultHealthType: 'clocks',
    },

    ui_config: {
        gauges: [
            { fieldId: 'determination', label: 'Détermination', color: '#d97706', style: 'segmented' },
        ],
        initiativeStyle: 'list',
        themeColor: '#d97706',
    },

    /**
     * Zones de conflit abstraites, **sans conversion métrique**. « L'espace est
     * découpé de manière abstraite en zones liées au décor » : la mêlée exige la
     * même zone, une zone adjacente coûte +1 à la difficulté à distance, s'y
     * déplacer demande un test de difficulté 2 (`distances-et-portees.md`).
     *
     * `TacticalConfig` exige cinq seuils en unités de grille. Les valeurs
     * ci-dessous **traduisent** l'abstraction plutôt qu'elles ne la décrivent :
     * une zone vaut une unité, et au-delà de la zone adjacente le livre ne dit
     * plus rien. À prendre comme une approximation, pas comme la règle.
     */
    tactical: {
        ranges: {
            contact: { label: 'Même zone', maxUnits: 1, modifier: 0 },
            courte: { label: 'Zone adjacente', maxUnits: 2, modifier: 1 },
            moyenne: { label: 'Zone éloignée', maxUnits: 3, modifier: 2 },
            longue: { label: 'Hors de portée', maxUnits: 4, modifier: 3 },
            extreme: { label: 'Hors de portée', maxUnits: 5, modifier: 4 },
        },
        useTacticalAI: false,
    },

    /**
     * Champ requis par le type, **lu par aucun modèle**. Vérifié le 2026-08-10 :
     * `AIService` construit son invite depuis les instructions de la gemme, le
     * `gems.json` du corpus et les `aiPersonas` du gabarit. `driver.aiInstructions`
     * n'y entre jamais. Les vraies personas de Dune sont dans
     * `docs/systems/dune/gems.json`, et celles-là servent.
     */
    aiInstructions: '',

    /** Le dossier du corpus — c'est ce champ que lisent l'Oracle, l'Atelier et le Grimoire. */
    corpusId: 'dune',
};

export const DEFAULT_GAME_DRIVERS: GameDriver[] = [DUNE];
