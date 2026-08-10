import { describe, it, expect } from 'vitest';
import { DEFAULT_GAME_DRIVERS } from './defaultGameDrivers';
import { DEFAULT_SHEET_TEMPLATES } from './defaultSheetTemplates';
import { resoudreCorpus, cheminDesFiches } from '../../electron/corpusSysteme';

/**
 * Ce que ces tests protègent : **la référence reste une référence**.
 *
 * Le pilote Dune est le seul exemple, dans toute l'application, de ce à quoi
 * ressemble un système correctement renseigné. S'il dérive, on perd le seul
 * étalon disponible — et avec lui la possibilité de juger ce que la Forge
 * Système produit.
 *
 * La seconde moitié du fichier est d'une autre nature : elle **constate les
 * limites du modèle**. Ces tests-là sont écrits pour échouer le jour où le
 * modèle saura exprimer Dune. C'est leur but : rendre le progrès visible au
 * lieu de le laisser passer inaperçu.
 */

const dune = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const fiche = DEFAULT_SHEET_TEMPLATES.find(t => t.id === 'dune')!;
const champs = fiche.sections.flatMap(s => s.fields);
const idsDeChamps = new Set(champs.map(f => f.id));

describe('le système Dune de référence existe', () => {
    it('le pilote et sa fiche sont livrés ensemble', () => {
        // Un pilote sans fiche ne décrit rien : il dit comment lire une fiche.
        expect(dune, 'aucun pilote Dune').toBeDefined();
        expect(fiche, 'aucune fiche Dune').toBeDefined();
        expect(dune.templateId).toBe(fiche.id);
    });

    it('le pilote désigne le corpus vérifié', () => {
        // `corpusId` est ce que lisent l'Oracle, l'Atelier et le Grimoire.
        const corpus = resoudreCorpus({ systemId: dune.id, systemName: dune.name, corpusId: dune.corpusId });
        expect(corpus.id).toBe('dune');
        expect(cheminDesFiches(corpus)).toBe('systems/dune/rules');
    });
});

describe('cohérence des identifiants — le contrôle qui manque à l\'application', () => {
    /**
     * **Le défaut que cela attrape.** Le prompt de la Forge Système demande que
     * les `fieldId` de `statsToTrack` correspondent aux `id` des champs de la
     * fiche. Rien ne le vérifie. Or `CombatCard` va chercher la valeur du
     * personnage **par cet identifiant** en pleine séance : un `fieldId` qui ne
     * correspond à rien affiche une jauge à zéro. Pas d'erreur, pas de champ en
     * rouge — une jauge à zéro, qui ressemble à un personnage en pleine forme.
     */
    it('chaque stat suivie pointe un champ réel de la fiche', () => {
        for (const stat of dune.combat.statsToTrack) {
            expect(idsDeChamps.has(stat.fieldId), `statsToTrack → « ${stat.fieldId} » n'existe pas dans la fiche`).toBe(true);
        }
    });

    it('chaque jauge pointe un champ réel de la fiche', () => {
        for (const jauge of dune.ui_config?.gauges ?? []) {
            expect(idsDeChamps.has(jauge.fieldId), `ui_config.gauges → « ${jauge.fieldId} » n'existe pas dans la fiche`).toBe(true);
        }
    });

    it('la formule d\'initiative n\'invoque que des champs réels', () => {
        // `resolveInitiativeFormula` remplace par 0 tout mot qu'il ne résout pas :
        // une formule qui cite un champ inexistant rend donc une initiative nulle,
        // en silence, pour tous les combattants à la fois.
        const mots = dune.combat.initiativeFormula.match(/[a-zA-ZÀ-ÿ_]+/g) ?? [];
        for (const mot of mots.filter(m => m.toLowerCase() !== 'd')) {
            expect(idsDeChamps.has(mot), `initiativeFormula → « ${mot} » n'existe pas dans la fiche`).toBe(true);
        }
    });
});

describe('les valeurs viennent du corpus, pas d\'une supposition', () => {
    it('compétences et principes vont de 4 à 8', () => {
        // « Compétence : de quatre à huit. Principe : de quatre à huit. »
        // Le seuil d'un test est leur somme, soit 8 au minimum et 16 au maximum.
        const stats = champs.filter(f => ['analyse', 'combat', 'devoir', 'verite'].includes(f.id));
        expect(stats).toHaveLength(4);
        for (const f of stats) {
            expect(f.defaultValue, `${f.id} devrait démarrer à 4`).toBe(4);
            expect(f.max, `${f.id} devrait plafonner à 8`).toBe(8);
        }
    });

    it('les cinq compétences et les cinq principes sont là', () => {
        for (const id of ['analyse', 'combat', 'discipline', 'mobilite', 'rhetorique']) {
            expect(idsDeChamps.has(id), `compétence « ${id} » absente`).toBe(true);
        }
        for (const id of ['devoir', 'domination', 'foi', 'justice', 'verite']) {
            expect(idsDeChamps.has(id), `principe « ${id} » absent`).toBe(true);
        }
    });

    it('la Détermination démarre à 1 et plafonne à 3', () => {
        // « Valeur de départ : un point. Bornes : de zéro à trois. »
        const det = champs.find(f => f.id === 'determination')!;
        expect(det.type).toBe('gauge');
        expect(det.defaultValue).toBe(1);
        expect(det.max).toBe(3);
    });

    it('la fiche ne porte AUCUN point de vie', () => {
        /**
         * « Il n'existe aucune jauge numérique de santé ou de fatigue sur la
         * feuille de personnage. » Les blessures sont des traits négatifs et des
         * tâches étendues. Une fiche Dune avec des PV serait une fiche fausse —
         * et c'est la pente naturelle, puisque tout le reste de l'application en
         * suppose.
         */
        for (const interdit of ['hp', 'pv', 'sante', 'health', 'blessures', 'stress']) {
            expect(idsDeChamps.has(interdit), `« ${interdit} » n'a rien à faire sur une fiche Dune`).toBe(false);
        }
        expect(dune.combat.statsToTrack.some(s => s.isMainHP), 'Dune n\'a pas de jauge de vie principale').toBe(false);
    });

    it('le jet est un compte de réussites sur une réserve de d20', () => {
        expect(dune.dice.logic).toBe('count-success');
        expect(dune.dice.defaultDice).toBe('2d20');
        expect(dune.dice.critRange, 'le 1 naturel est la réussite critique').toBe(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Les quatre murs
// ─────────────────────────────────────────────────────────────────────────────

describe('ce que le modèle ne sait PAS exprimer', () => {
    /**
     * **Ces tests constatent des limites, ils ne protègent pas un acquis.**
     *
     * Ils échoueront le jour où le modèle saura porter ces notions — et cet
     * échec est le signal attendu, pas une régression. Les écrire ainsi évite
     * que les contournements ci-dessous se fassent passer, avec le temps, pour
     * des choix délibérés.
     */

    it('mur 1 — la santé de Dune n\'a pas de représentation', () => {
        // Vaincre un personnage est une tâche étendue dont le seuil vaut sa
        // compétence défensive (4 à 8). Ni `defaultHealthType` ni `statsToTrack`
        // ne peuvent dire ça ; `Combatant` impose par ailleurs `hp`/`hpMax`.
        expect(dune.combat.defaultHealthType).toBe('clocks');   // le moins faux des trois
        expect(dune.combat.statsToTrack.every(s => !s.isMainHP)).toBe(true);
    });

    it('mur 2 — l\'initiative par alternance de camps est réduite à une formule', () => {
        // « L'initiative alterne de manière binaire entre les camps. » Le livre
        // ne classe jamais les combattants ; trier par Mobilité est une invention
        // de notre part, assumée faute de mode d'initiative dans le modèle.
        expect(dune.combat.initiativeFormula).toBe('mobilite');
        expect(dune.combat, 'un mode d\'initiative rendrait la formule inutile').not.toHaveProperty('initiativeMode');
    });

    it('mur 3 — le seuil dynamique est réduit à son minimum', () => {
        // Le seuil réel est compétence + principe (8 à 16), choisi test par test.
        // 8 est le plancher : lancer avec cette valeur sous-estime toujours le
        // personnage. Il manque un descripteur disant de quels champs il se compose.
        expect(dune.dice.successThreshold).toBe(8);
        expect(dune.dice, 'un descripteur de jet rendrait ce nombre fixe inutile').not.toHaveProperty('seuilCompose');
    });

    it('mur 4 — les ressources de table n\'ont nulle part où être déclarées', () => {
        // Impulsion : commune aux joueurs, 0 à 6, -1 en fin de scène.
        // Menace : celle du meneur, sans maximum. Ce sont les ressources les plus
        // manipulées du jeu, et le pilote ne connaît que des champs de fiche.
        expect(dune, 'des ressources de table rendraient ce constat caduc').not.toHaveProperty('ressourcesDeTable');
        expect(idsDeChamps.has('impulsion'), 'l\'Impulsion n\'est pas individuelle : elle ne doit pas être sur la fiche').toBe(false);
        expect(idsDeChamps.has('menace'), 'la Menace appartient au meneur, pas au personnage').toBe(false);
    });
});
