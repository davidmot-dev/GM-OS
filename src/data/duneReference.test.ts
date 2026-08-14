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

    it('mur 1 — ABATTU le 2026-08-11 : vaincre est une tâche étendue', () => {
        /**
         * Le dernier des quatre. Il est tombé en trois temps : `applyDamage`
         * branché sur `HealthInterpreter`, `hp`/`hpMax` rendus facultatifs, et
         * enfin le seuil de défaite lu **sur la fiche** — « égal à la valeur de
         * la compétence défensive de la cible, de quatre à huit ».
         *
         * Voir `src/modules/combat/logic/TacheDeDefaite.ts`.
         */
        const tache = dune.combat.tacheDeDefaite;
        expect(tache, 'une tâche de défaite rendrait ce constat caduc').toBeDefined();
        expect(tache!.seuil).toEqual({ min: 4, max: 8 });
        expect(tache!.progressionDeBase, '« deux points de progression »').toBe(2);
        expect(tache!.qualiteMax, '« qualité de l\'atout, de zéro à quatre »').toBe(4);

        // Le seuil se lit dans une section réelle de la fiche — même chaîne
        // d'identifiants que le descripteur de jet, et même silence si elle
        // manque : une section absente donnerait un seuil au minimum.
        const sections = new Set(fiche.sections.map(s => s.id));
        expect(sections.has(tache!.sectionDuSeuil), `section « ${tache!.sectionDuSeuil} » absente`).toBe(true);
        expect(idsDeChamps.has(tache!.champParDefaut!), 'le champ par défaut doit exister').toBe(true);

        // Ce qui restait vrai et le reste : aucune jauge de vie principale.
        expect(dune.combat.defaultHealthType).toBe('clocks');
        expect(dune.combat.statsToTrack.every(s => !s.isMainHP)).toBe(true);
    });

    it('mur 2 — ABATTU le 2026-08-11 : l\'initiative alterne entre les camps', () => {
        /**
         * « L'initiative alterne de manière binaire entre les camps. » Le livre
         * ne classe jamais les combattants — trier par Mobilité était une
         * invention de notre part, assumée faute de mieux.
         *
         * Voir `src/modules/combat/logic/OrdreDuTour.ts`.
         */
        expect(dune.combat.initiative?.mode).toBe('alternance');
        expect(
            dune.combat.initiativeFormula,
            'une formule résiduelle relancerait le tri que le livre ne demande pas',
        ).toBe('');
    });

    it('conserver la main coûte deux points, sur une réserve qui existe', () => {
        // « Deux points d'Impulsion dépensés par les joueurs, ou deux points de
        // Menace ajoutés à la réserve du meneur. » Le « ou » est traité par le
        // report de la réserve, pas par deux coûts concurrents.
        const initiative = dune.combat.initiative!;
        expect(initiative.coutDeRetention).toEqual({ montant: 2, ressource: 'impulsion' });
        expect(initiative.coutDOuverture).toEqual({ montant: 2, ressource: 'impulsion' });
        expect(initiative.activationsConsecutivesMax, '« deux tours consécutifs au maximum »').toBe(2);
        expect(
            (dune.ressourcesDeTable ?? []).some(r => r.id === initiative.coutDeRetention!.ressource),
            'la réserve qui paie la rétention doit exister',
        ).toBe(true);
    });

    it('mur 3 — ABATTU le 2026-08-10 : le seuil se compose depuis la fiche', () => {
        /**
         * Le premier des quatre murs à tomber. Le seuil réel vaut compétence +
         * principe (8 à 16), choisi test par test ; `successThreshold: 8` reste
         * dans `dice` comme plancher pour les appelants qui ignorent le
         * descripteur, mais ce n'est plus lui qui décide.
         *
         * Voir `src/modules/dice/DescripteurDeJet.ts`.
         */
        expect(dune.jet, 'le descripteur de jet est ce qui abat ce mur').toBeDefined();
        expect(dune.jet!.seuil!.map(c => c.id)).toEqual(['competence', 'principe']);
        expect(dune.jet!.sens, 'la famille 2d20 compte sous le seuil').toBe('sous-ou-egal');
        // Le prix des dés est venu s'ajouter avec le mur 4 ; ce qui compte ici
        // reste la réserve elle-même.
        expect(dune.jet!.reserve).toMatchObject({ base: 2, max: 5, faces: 20 });
    });

    it('les sections du descripteur existent dans la fiche', () => {
        // Même chaîne d'identifiants que les jauges : une section absente donne
        // un seuil à zéro, en silence.
        const sections = new Set(fiche.sections.map(s => s.id));
        for (const composante of dune.jet!.seuil ?? []) {
            expect(sections.has(composante.sectionId), `section « ${composante.sectionId} » absente`).toBe(true);
        }
    });

    it('mur 4 — ABATTU le 2026-08-11 : les ressources de table se déclarent', () => {
        /**
         * Le deuxième mur à tomber. Impulsion et Menace ne sont ni des champs de
         * fiche ni des statistiques de combattant : ce sont des réserves de
         * table, et le pilote sait maintenant le dire.
         *
         * Voir `src/modules/table/RessourcesDeTable.ts`.
         */
        const reserves = dune.ressourcesDeTable ?? [];
        expect(reserves.map(r => r.id)).toEqual(['impulsion', 'menace']);

        const impulsion = reserves.find(r => r.id === 'impulsion')!;
        expect(impulsion.proprietaire, 'l\'Impulsion est commune aux joueurs').toBe('joueurs');
        expect(impulsion.max, '« bornes : de zéro à six »').toBe(6);
        expect(impulsion.erosionFinDeScene, '« érosion de moins un point en fin de scène »').toBe(1);
        expect(impulsion.reportSurEpuisement, '« à zéro, l\'achat de d20 coûte de la Menace »').toBe('menace');

        const menace = reserves.find(r => r.id === 'menace')!;
        expect(menace.proprietaire, 'la Menace est celle du meneur').toBe('meneur');
        expect(menace.max, 'la Menace n\'a pas de maximum — l\'absence est la donnée').toBeUndefined();

        // Ce qui reste vrai, et qui l'était déjà : ces réserves n'ont rien à
        // faire sur une fiche. Six joueurs auraient eu six Impulsions.
        expect(idsDeChamps.has('impulsion'), 'l\'Impulsion n\'est pas individuelle : elle ne doit pas être sur la fiche').toBe(false);
        expect(idsDeChamps.has('menace'), 'la Menace appartient au meneur, pas au personnage').toBe(false);
    });

    it('le résidu du mur 4 — la Menace de départ dépend du nombre de joueurs', () => {
        /**
         * **Ce test-ci constate encore une limite.** « Menace initiale par
         * joueur : de zéro (Maison naissante) à trois points (Grande Maison). »
         * La valeur de départ est donc un produit — un choix de campagne fois un
         * effectif — et `depart` est un nombre.
         *
         * Zéro est le plancher honnête : le meneur pose sa réserve lui-même. Ce
         * test échouera le jour où le modèle saura exprimer une valeur dérivée.
         */
        const menace = (dune.ressourcesDeTable ?? []).find(r => r.id === 'menace')!;
        expect(menace.depart, 'un départ calculé rendrait ce constat caduc').toBe(0);
    });

    it('les dés achetés ont un prix, et il est payé par une réserve de table', () => {
        // « Achat de d20 par test (maximum trois) : un, deux et trois points. »
        // Le prix croît : un seul nombre n'aurait pas suffi.
        expect(dune.jet!.reserve!.cout).toEqual([1, 2, 3]);
        expect(dune.jet!.reserve!.ressource).toBe('impulsion');
        expect(
            (dune.ressourcesDeTable ?? []).some(r => r.id === dune.jet!.reserve!.ressource),
            'la réserve qui paie les dés doit exister',
        ).toBe(true);
    });
});
