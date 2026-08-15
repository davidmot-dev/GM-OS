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
 * **2. ABATTU le 2026-08-11.** L'initiative n'est pas une valeur par combattant :
 *    « elle alterne de manière binaire entre les camps ». `combat.initiative`
 *    porte désormais le mode, le prix de la rétention et le plafond
 *    d'activations consécutives ; `initiativeFormula` est vide, parce que le
 *    livre ne classe personne. Voir `src/modules/combat/logic/OrdreDuTour.ts`.
 *
 * **3. Le seuil de réussite est dynamique.** Il vaut **compétence + principe**,
 *    choisis test par test — de 8 à 16. `DiceConfig.successThreshold` est un
 *    nombre fixe. On y met 8, qui est le **minimum** et non la valeur : lancer
 *    avec ce seuil sous-estime systématiquement le personnage. Il manque un
 *    descripteur de jet disant *de quels champs* le seuil se compose.
 *
 * **4. ABATTU le 2026-08-11.** Les ressources de table se déclarent —
 *    `ressourcesDeTable`, plus bas. L'Impulsion est une réserve commune aux
 *    joueurs, la Menace appartient au meneur, et ce qu'on ne peut pas payer en
 *    Impulsion passe en Menace. Il reste un résidu, signalé sur la Menace : sa
 *    valeur de départ dépend du type de Maison **et du nombre de joueurs**, ce
 *    que `depart` ne sait pas dire.
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
        // s'achètent 1, 2 puis 3 points d'Impulsion — et de Menace quand
        // l'Impulsion manque, ce que `reportSurEpuisement` porte plus bas.
        reserve: { base: 2, max: 5, faces: 20, cout: [1, 2, 3], ressource: 'impulsion' },
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
        /**
         * **Vide, et c'est la bonne valeur.** Elle portait `mobilite`, un
         * pis-aller : le livre ne classe jamais les combattants. Maintenant que
         * `initiative` sait dire l'alternance, garder une formule laisserait
         * traîner un tri que rien ne justifie — et le bouton « Jet Système »
         * l'aurait relancé.
         */
        initiativeFormula: '',
        /** Ce qui abat le mur n° 2. Valeurs de `initiative-et-deroulement-du-tour.md`. */
        initiative: {
            mode: 'alternance',
            // « Deux points d'Impulsion dépensés par les joueurs, ou deux points
            // de Menace ajoutés à la réserve du meneur » — le report de la
            // réserve traite le « ou » tout seul.
            coutDeRetention: { montant: 2, ressource: 'impulsion' },
            coutDOuverture: { montant: 2, ressource: 'impulsion' },
            // « Deux tours consécutifs au maximum, l'action de Conserver
            // l'initiative ne pouvant être répétée tant qu'au moins un ennemi
            // n'a pas agi. »
            activationsConsecutivesMax: 2,
        },
        defaultHealthType: 'clocks',
        /**
         * Ce qui achève le mur n° 1. « L'attrition corporelle est gérée à
         * travers une tâche étendue de défaite », dont le seuil vaut la
         * compétence défensive de la cible — donc un champ de sa fiche, et non
         * un nombre du système. Valeurs de `sante-et-blessures.md`.
         */
        tacheDeDefaite: {
            sectionDuSeuil: 'competences',
            // Le champ le plus souvent défensif ; le meneur en retient un autre
            // quand la joute n'est pas physique.
            champParDefaut: 'combat',
            seuil: { min: 4, max: 8 },  // « de quatre (rudimentaire) à huit (maîtrise absolue) »
            progressionDeBase: 2,       // « deux points de progression vers la défaite »
            qualiteMax: 4,              // « qualité de l'atout, de zéro à quatre »
            label: 'Défaite',
        },
    },

    /**
     * Ce qui abat le mur n° 4 — les deux monnaies de la table.
     *
     * Toutes les valeurs viennent de `monnaie-de-table.md`, fiche v3 résolue
     * contre l'index. Ce ne sont pas des champs de fiche : les mettre sur la
     * feuille de personnage aurait donné six Impulsions à six joueurs, et fait
     * de la Menace la propriété d'un personnage.
     */
    ressourcesDeTable: [
        {
            id: 'impulsion',
            label: 'Impulsion',
            proprietaire: 'joueurs',
            depart: 0,          // « Début : zéro point. »
            min: 0,
            max: 6,             // « Bornes : de zéro à six. À six points, tout gain est perdu. »
            erosionFinDeScene: 1, // « Érosion automatique de moins un point en fin de scène. »
            // « À zéro, l'achat de d20 coûte de la Menace » : le manque ne bloque
            // pas la dépense, il alimente la réserve du meneur.
            reportSurEpuisement: 'menace',
            description: "Réserve commune aux joueurs. Chaque réussite excédentaire l'alimente ; elle paie les dés supplémentaires, les informations et les traits.",
        },
        {
            id: 'menace',
            label: 'Menace',
            proprietaire: 'meneur',
            /**
             * **Le résidu du mur n° 4.** « De zéro à trois points **par joueur**
             * selon la Maison. » La valeur de départ dépend donc d'un choix de
             * campagne et du nombre de joueurs — `depart` est un nombre, il ne
             * sait dire ni l'un ni l'autre. Zéro est le plancher honnête : le
             * meneur pose sa réserve au début de la chronique.
             */
            depart: 0,
            min: 0,             // « Bornes : minimale de zéro, sans maximum. »
            description: "Réserve du meneur. Elle monte quand les joueurs prennent des risques, et se dépense pour compliquer, hausser une difficulté ou déclencher un danger.",
        },
    ],

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
