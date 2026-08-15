// src/types/drivers.ts

export type DiceRollLogic = 'sum' | 'highest' | 'lowest' | 'count-success' | 'd100-low' | 'd100-high';
export type LootRollMode = 'weighted' | 'independent';

export interface LootEntry {
    name: string;
    weight: number; // Probabilité ou poids relatif
    type: 'item' | 'table' | 'currency' | 'other';
    minAmount?: number | string; // Supporte les formules comme "1d6"
    maxAmount?: number;
    metadata?: Record<string, any>; // Rareté, poids, description, etc.
}

export interface LootTable {
    id: string;
    name: string;
    description?: string;
    rollMode: LootRollMode;
    rolls?: number | string; // Nombre de tirages (ex: 3 ou "1d4")
    entries: LootEntry[];
}

export interface DiceConfig {
    defaultDice: string; // e.g. "1d20", "3d6"
    logic: DiceRollLogic;
    engine?: 'standard' | 'formula' | 'pool' | 'pool_explode' | 'threshold' | 'advantage' | 'disadvantage' | 'exploding' | 'fate' | 'rolemaster' | 'yze' | '2d20'; // Specific specialized logic
    successThreshold?: number; // e.g. 8 for WoD, or dynamic
}

export interface TacticalRangeThreshold {
    label: string;
    maxUnits: number; // renamed from maxDistance for clarity (grid units)
    modifier: number;
}

export interface TacticalConfig {
    ranges: {
        contact: TacticalRangeThreshold;
        courte: TacticalRangeThreshold;
        moyenne: TacticalRangeThreshold;
        longue: TacticalRangeThreshold;
        extreme: TacticalRangeThreshold;
    };
    useTacticalAI: boolean;
}

export interface GaugeConfig {
    fieldId: string;
    label: string;
    color: string; // Tailwind color class or hex, e.g. "bg-emerald-500" or "#10b981"
    style: 'bar' | 'segmented' | 'neon';
}

export interface CombatStatMapping {
    fieldId: string; // ID from the sheet template
    label: string;
    isMainHP: boolean;
    isResource: boolean; // Magic points, Sanity, etc.
}

export interface UIConfig {
    gauges: GaugeConfig[];
    initiativeStyle?: 'list' | 'grid';
    themeColor?: string; // Global accent for this system
}

export interface GameDriver {
    id: string;
    name: string;
    author: string;
    version: string;
    description: string;
    emoji: string;
    
    // Mechanics
    dice: DiceConfig;
    
    // Tactical configuration
    tactical?: TacticalConfig;

    // Combat configuration
    combat: {
        statsToTrack: CombatStatMapping[];
        initiativeFormula: string; // e.g. "dex", "dex + int", "1d10"
        initiativeSort?: 'asc' | 'desc'; // Default: 'desc'
        initiativeCards?: number; // If set, use a unique card pool 1-N
        /**
         * Comment l'ordre d'action se décide, quand ce n'est pas un classement.
         *
         * **Ce qu'il rend possible** : dire qu'un jeu n'ordonne pas ses
         * combattants. Chez Dune le meneur désigne qui ouvre, puis les
         * activations alternent entre les camps ; le tour se garde en payant. Une
         * formule évaluée par personnage ne pouvait rien exprimer de tout cela,
         * et trier par Mobilité était une invention.
         *
         * Absent, l'ordre reste celui de `initiativeFormula` — c'est le cas de
         * tous les pilotes antérieurs, et ils continuent de fonctionner.
         */
        initiative?: import('../modules/combat/logic/OrdreDuTour').DescripteurDInitiative;
        damageTypes?: string[]; // e.g. ["Feu", "Froid", "Physique", "Psychique"]
        /**
         * Les cinq modèles, pas trois. `HealthInterpreter` gère `wounds` et
         * `boxes` depuis toujours et `HealthManager` les propose — mais un
         * pilote ne pouvait pas les déclarer, et rien ne le disait.
         */
        defaultHealthType?: import('./entity.types').HealthSystemType;
        /**
         * Où lire la santé de départ **sur la fiche**, en formule.
         *
         * **Le défaut qu'il corrige, relevé le 2026-08-14.** Les points de vie
         * naissaient à `10` en dur, à sept endroits. Chez Alien la Santé vaut
         * la **Force** du personnage — deux à cinq — et tous les combattants
         * entraient avec dix. C'est mot pour mot le défaut que `65bbd84` a
         * réglé pour les horloges, où `createDefault('clocks')` donnait six
         * segments à tout le monde : *une valeur qui dépend du personnage ne
         * peut pas vivre dans le pilote.*
         *
         * **Une formule et non un champ unique**, parce qu'un champ suffirait à
         * Alien mais pas à sa famille : le SRD Year Zero Engine compose « la
         * moyenne des scores de Force et d'Agilité, arrondie à l'entier
         * supérieur, plus un ». Même forme que `initiativeFormula`, et les
         * mêmes contrôles la vérifient.
         *
         * Exemples : `force` (Alien), `(force + agilite) / 2 + 1` (SRD YZE).
         *
         * Facultatif : sans lui, chaque écran garde les points de vie qu'il
         * fournissait. On ne fait pas payer une nouveauté à l'existant.
         */
        santeDeDepart?: string;
        /**
         * Vaincre comme tâche étendue, quand le jeu n'a pas de jauge.
         *
         * Chez Dune, le seuil de défaite **vaut la compétence défensive de la
         * cible**, de quatre à huit : il se lit sur la fiche, pas dans le
         * pilote. `defaultHealthType: 'clocks'` disait déjà « une horloge », mais
         * `createDefault` en donnait six segments à tout le monde — un
         * duelliste médiocre et un maître tombaient au même rythme.
         *
         * Facultatif : un système à jauge fixe n'en déclare pas.
         */
        tacheDeDefaite?: import('../modules/combat/logic/TacheDeDefaite').TacheDeDefaite;
    };

    // UI Customization
    ui_config?: UIConfig;

    // Linked assets
    templateId: string; // The ID of the primary SheetTemplate used by this system
    lootTables?: LootTable[]; // Optional tables for item/treasure generation
    encounterTemplates?: EncounterTemplate[]; // Optional templates for combat encounters
    defaultNotebookUrl?: string; // Default NotebookLM for this system
    
    // Metadata for AI
    /**
     * **Champ mort, rendu facultatif le 2026-08-11.**
     *
     * Vérifié dans `AIService` : l'invite se construit depuis les instructions
     * de la gemme, le `gems.json` du corpus et les `aiPersonas` du gabarit.
     * `driver.aiInstructions` n'y entre jamais. L'exiger obligeait la Forge à le
     * remplir, et *une forge qui remplit des champs morts est invérifiable* —
     * on ne peut ni juger la valeur produite, ni constater qu'elle ne sert pas.
     *
     * Conservé plutôt que supprimé : des pilotes enregistrés le portent, et le
     * retirer du type les rendrait invalides sans rien réparer.
     */
    aiInstructions?: string;
    aiPersonas?: Record<string, string>; // gemId -> instructions override
    /**
     * De quoi un jet se compose, en termes de champs de la fiche.
     *
     * **Ce qu'il rend possible** : lancer depuis la fiche de personnage avec le
     * bon seuil. `dice.successThreshold` est un nombre fixe ; chez Dune le seuil
     * vaut une compétence plus un principe, choisis test par test, de 8 à 16. On
     * y inscrivait le minimum, et tout jet sous-estimait le personnage.
     *
     * Facultatif : un système à seuil constant n'en a pas besoin, et les pilotes
     * antérieurs continuent de fonctionner sans.
     */
    jet?: import('../modules/dice/DescripteurDeJet').DescripteurDeJet;
    /**
     * Les réserves qui appartiennent à la table, pas aux personnages.
     *
     * **Ce qu'elles rendent possible** : déclarer l'Impulsion — commune aux
     * joueurs, bornée de 0 à 6, érodée en fin de scène — et la Menace, celle du
     * meneur, sans plafond. Ce sont les ressources les plus manipulées d'une
     * partie de Dune, et le pilote ne connaissait que des champs de fiche, donc
     * individuels : six joueurs auraient eu six Impulsions.
     *
     * Facultatif. Un système qui n'en a pas n'en déclare pas, et rien ne
     * s'affiche — plutôt qu'un bandeau vide qui suggérerait un oubli.
     */
    ressourcesDeTable?: import('../modules/table/RessourcesDeTable').RessourceDeTable[];
    ragPath?: string; // Hérité : visait le dossier des fiches. Préférer `corpusId`.
    /**
     * Dossier de corpus sous `docs/systems/` — `dune`, `blade-runner`.
     *
     * **Pourquoi ce champ existe.** L'identifiant d'un pilote est fabriqué par
     * la Forge avec `custom-${Date.now()}` : il ne dit rien du jeu. Or trois
     * artefacts doivent se ranger sous le même dossier — les fiches, les
     * personas et l'index du livre — et deux d'entre eux n'ont aucun moyen
     * d'être redirigés ailleurs. Sans ce champ, un pilote nommé « Dune » mais
     * identifié `custom-1754…` écrit son corpus à côté du sien.
     *
     * Absent, `resoudreCorpus` retombe sur le nom affiché puis l'identifiant.
     */
    corpusId?: string;
}

export interface EncounterEntity {
    templateId: string;
    count: string | number;
    role?: 'normal' | 'elite' | 'boss';
}

export interface EncounterTemplate {
    id: string;
    name: string;
    entities: EncounterEntity[];
}
