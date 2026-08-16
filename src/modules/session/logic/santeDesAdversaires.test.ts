import { describe, it, expect } from 'vitest';
import { rattacherLaSanteDesAdversaires, santeSelonLeJeu, santeAAnnoncer } from './santeDesAdversaires';
import type { GameDriver } from '../../../types/drivers';
import type { Entity } from '../../../types/entity.types';

/**
 * Ce que ces tests protègent : **on déclare ce qui est là, on n'écrase rien**.
 *
 * Les PNJ créés avant le 2026-08-15 ne portaient aucun `healthSystem` — le
 * formulaire n'en écrivait pas. Restait `hp`/`maxHp`, les points de vie de D&D,
 * sur tous les jeux.
 *
 * **La charge réelle a changé la conception de ce module.** Sur les 50 PNJ de
 * David, les valeurs ne sont pas des défauts oubliés : ses adversaires de Dune
 * portent des `ac` de 4 à 8 et des `speed` de 4 à 6, ses créatures de Rêve de
 * Dragon montent à 100 points de vie. Un correctif qui aurait remis « les
 * défauts » à zéro aurait détruit du contenu.
 */

const pilote = (id: string, combat: Record<string, unknown>) =>
    ({ id, name: id, emoji: '🎲', templateId: 'tpl', combat } as unknown as GameDriver);

const ALIEN = pilote('alien', { defaultHealthType: 'hp', statsToTrack: [], initiativeFormula: '' });
const DUNE = pilote('dune', {
    defaultHealthType: 'clocks', statsToTrack: [], initiativeFormula: '',
    tacheDeDefaite: { sectionDuSeuil: 'stats', seuil: { min: 4, max: 8 }, progressionDeBase: 2, qualiteMax: 4 },
});

const CAMPAGNES = [{ id: 'c-alien', system: 'alien' }, { id: 'c-dune', system: 'dune' }];

const pnj = (patch: Partial<Entity>): Entity => ({
    id: 'e-1', name: 'Adversaire', type: 'npc', role: 'hostile', status: 'alive',
    avatar: '', hp: 10, maxHp: 10, ac: 0, speed: 0, initiative: 0,
    description: '', roleplayingNotes: '', gmSecretInfo: '', linkedMapIds: [],
    campaignId: 'c-alien', ...patch,
} as Entity);

const santeDe = (r: { entities: Entity[] }) => r.entities[0].healthSystem;

describe('rattacher la santé d\'un adversaire au modèle de son jeu', () => {
    it('un jeu à points de vie déclare CE QUE LE PNJ PORTE DÉJÀ', () => {
        // Ses 7/10 sont une donnée réelle, souvent posée à la main : on ne fait
        // que la déclarer, on n'invente pas les dix de `createDefault`.
        const r = rattacherLaSanteDesAdversaires([pnj({ hp: 7, maxHp: 10 })], CAMPAGNES, [ALIEN, DUNE]);

        expect(santeDe(r)!.type).toBe('hp');
        expect(santeDe(r)!.data).toMatchObject({ current: 7, max: 10 });
    });

    it('un jeu à tâche de défaite reçoit le plancher du pilote, et le signale', () => {
        /**
         * **Le seul cas de la journée où l'on pose une valeur non lue**, et
         * c'est assumé : le seuil vaut « la compétence défensive » de la cible,
         * et un PNJ n'a pas de fiche où la lire — pas aujourd'hui, pas demain.
         * Se taire aurait laissé ces PNJ afficher une barre de vie à 130 % sur
         * un jeu qui n'a pas de points de vie.
         */
        const r = rattacherLaSanteDesAdversaires(
            [pnj({ campaignId: 'c-dune', hp: 13, maxHp: 10 })], CAMPAGNES, [ALIEN, DUNE],
        );

        expect(santeDe(r)!.type).toBe('clocks');
        expect(santeDe(r)!.data).toMatchObject({ filled: 0, segments: 4 });
        expect(r.rattachees[0].aAjuster, 'le meneur doit le relire').toBe(true);
    });

    it('des points de vie non numériques ne se convertissent pas', () => {
        /**
         * Relevé dans l'état réel : la Forge de chronique a écrit
         * `hp: "Inférieure à 1 (gravement battu)"`. Fabriquer un nombre à partir
         * d'une phrase perdrait ce qu'elle dit ; on garde le défaut du modèle et
         * la phrase reste dans la fiche.
         */
        const r = rattacherLaSanteDesAdversaires(
            [pnj({ hp: 'Inférieure à 1 (gravement battu)' as unknown as number })], CAMPAGNES, [ALIEN, DUNE],
        );

        expect(santeDe(r)!.type).toBe('hp');
        expect(santeDe(r)!.data).toMatchObject({ current: 10, max: 10 });
    });
});

describe('ce que la reprise refuse de faire', () => {
    it('n\'écrase JAMAIS un mécanisme déjà présent', () => {
        const existante = { type: 'boxes' as const, data: { boxes: [] }, state: 'healthy' as const, badges: [] };
        const r = rattacherLaSanteDesAdversaires([pnj({ healthSystem: existante })], CAMPAGNES, [ALIEN, DUNE]);

        expect(santeDe(r)).toBe(existante);
        expect(r.rattachees).toEqual([]);
    });

    it('ne touche pas aux valeurs que le meneur a posées', () => {
        /**
         * La leçon de la charge réelle : `ac: 6`, `speed: 5` sur un PNJ de Dune
         * ne sont pas des défauts oubliés mais des choix. Ce module ne les
         * regarde même pas.
         */
        const r = rattacherLaSanteDesAdversaires(
            [pnj({ campaignId: 'c-dune', ac: 6, speed: 5, initiative: 7 })], CAMPAGNES, [ALIEN, DUNE],
        );

        expect(r.entities[0]).toMatchObject({ ac: 6, speed: 5, initiative: 7 });
    });

    it('ne fait rien pour un PNJ dont la campagne n\'a pas de pilote', () => {
        const r = rattacherLaSanteDesAdversaires(
            [pnj({ campaignId: 'c-orpheline' })], [{ id: 'c-orpheline', system: 'generic' }], [ALIEN],
        );
        expect(r.rattachees).toEqual([]);
    });

    it('rend le tableau d\'origine quand il n\'y a rien à faire, et reste idempotente', () => {
        const entities = [pnj({ healthSystem: { type: 'hp', data: {}, state: 'healthy', badges: [] } })];
        const premier = rattacherLaSanteDesAdversaires(entities, CAMPAGNES, [ALIEN]);
        expect(premier.entities, 'même référence : pas de rendu inutile').toBe(entities);

        const neuf = rattacherLaSanteDesAdversaires([pnj({})], CAMPAGNES, [ALIEN]);
        const second = rattacherLaSanteDesAdversaires(neuf.entities, CAMPAGNES, [ALIEN]);
        expect(neuf.rattachees).toHaveLength(1);
        expect(second.rattachees).toEqual([]);
    });
});

describe('la même règle vaut à la création, quel que soit l\'écran', () => {
    /**
     * **La demande de David, le 2026-08-15** : *« peux-tu utiliser le même
     * modèle quand je crée un PNJ de zéro ? »* — et elle porte plus loin qu'elle
     * n'en a l'air. **Trois chemins** créent des adversaires : le formulaire,
     * l'export depuis NPC-OS, et la Forge de chronique. Un seul connaissait le
     * pilote.
     *
     * La règle vit donc dans `santeSelonLeJeu`, appelée par `addEntity` — le
     * point unique par lequel les trois passent. C'est le geste que
     * `addCombatant` a déjà fait pour le combat : *on complète à cet endroit
     * unique plutôt que d'instruire chaque écran, et surtout plutôt que d'en
     * oublier un.*
     */
    it('un jeu à tâche de défaite donne une horloge, pas des points de vie', () => {
        const sante = santeSelonLeJeu(DUNE, { hp: 10, maxHp: 10 });

        expect(sante!.type).toBe('clocks');
        expect(sante!.data).toMatchObject({ filled: 0, segments: 4 });
    });

    it('un jeu à points de vie reprend ceux qu\'on lui donne', () => {
        expect(santeSelonLeJeu(ALIEN, { hp: 4, maxHp: 4 })!.data).toMatchObject({ current: 4, max: 4 });
    });

    it('sans points lisibles, le modèle garde son défaut', () => {
        expect(santeSelonLeJeu(ALIEN, { hp: 'Immobile', maxHp: 0 })!.data).toMatchObject({ current: 10, max: 10 });
        expect(santeSelonLeJeu(ALIEN)!.type).toBe('hp');
    });

    it('un jeu qui ne déclare rien ne reçoit AUCUN modèle', () => {
        // *L'absence n'est pas un zéro* : un modèle inventé se jouerait comme un
        // vrai, et c'est exactement ce qu'on a passé la journée à défaire.
        expect(santeSelonLeJeu(null)).toBeUndefined();
        expect(santeSelonLeJeu(pilote('muet', { statsToTrack: [], initiativeFormula: '' }))).toBeUndefined();
    });

    it('la reprise et la création rendent le MÊME modèle', () => {
        /**
         * Deux règles jumelles auraient produit deux populations de PNJ que rien
         * ne distinguerait à l'œil : ceux d'avant et ceux d'après, soignés
         * différemment en combat.
         */
        const aLaCreation = santeSelonLeJeu(DUNE, { hp: 13, maxHp: 10 });
        const aLaReprise = rattacherLaSanteDesAdversaires(
            [pnj({ campaignId: 'c-dune', hp: 13, maxHp: 10 })], CAMPAGNES, [DUNE],
        );

        expect(santeDe(aLaReprise)).toEqual(aLaCreation);
    });
});

/**
 * Ce que ces tests protègent : **on ne demande à un modèle que ce que le jeu
 * déclare compter**.
 *
 * **Le symptôme, relevé par David le 2026-08-15** : ses PNJ de Dune portaient
 * `hp: "Inférieure à 1 (gravement battu)"` et `speed: "Normal"` — des phrases
 * dans des champs typés `number`.
 *
 * La cause n'était pas le modèle. L'invite disait « Remplis "hp", "ac", "speed",
 * "initiative" en fonction du Driver » et montrait `"hp": 10, "ac": 10`. Sur
 * Dune, dont la mise hors de combat est une tâche étendue, il n'existe aucun
 * point de vie à donner : sommé de répondre, le modèle a répondu en mots.
 * *Ce n'est pas le modèle qui dérape, c'est la question qui n'a pas de réponse.*
 *
 * Ces tests ont suivi la fonction quand elle a quitté `ChronicleService` le
 * 2026-08-16, avec le retrait de la Forge de chronique.
 */
const piloteDeTest = (combat: Partial<GameDriver['combat']>): GameDriver =>
    ({ id: 'x', name: 'Jeu', combat: { statsToTrack: [], initiativeFormula: '', ...combat } } as GameDriver);
describe('santeAAnnoncer — on ne demande que ce que le jeu compte', () => {
    it('un jeu à tâche de défaite ne se voit demander aucun point', () => {
        // Dune : le seuil vaut « la compétence défensive » de la cible, qui se lit
        // sur sa fiche. Une IA qui écrit une chronique ne la connaît pas.
        const { demandeDesPoints, consigne } = santeAAnnoncer(piloteDeTest({
            defaultHealthType: 'clocks',
            tacheDeDefaite: { sectionDuSeuil: 'competences', seuil: { min: 4, max: 8 } },
        } as Partial<GameDriver['combat']>));

        expect(demandeDesPoints, 'le défaut exact que David subissait').toBe(false);
        expect(consigne).toContain("N'A PAS DE POINTS DE VIE");
    });

    it('la tâche de défaite l\'emporte sur le modèle déclaré', () => {
        // `defaultHealthType: 'clocks'` ET des points seraient contradictoires ;
        // c'est la tâche qui décrit vraiment la mise hors de combat.
        const { demandeDesPoints } = santeAAnnoncer(piloteDeTest({
            defaultHealthType: 'hp',
            tacheDeDefaite: { sectionDuSeuil: 's', seuil: { min: 4, max: 8 } },
        } as Partial<GameDriver['combat']>));

        expect(demandeDesPoints).toBe(false);
    });

    it('un jeu à points demande des points, et dit à quelle échelle', () => {
        const { demandeDesPoints, consigne } = santeAAnnoncer(piloteDeTest({
            defaultHealthType: 'hp',
            santeDeDepart: 'force',
        }));

        expect(demandeDesPoints).toBe(true);
        // Chez Alien la Santé vaut la Force — deux à cinq. Sans le dire, le
        // modèle donne dix, parce que dix est ce qu'un autre jeu donne.
        expect(consigne).toContain('force');
        expect(consigne).toContain("à l'échelle de CE jeu");
    });

    it.each(['clocks', 'anatomy', 'wounds', 'boxes'] as const)(
        'un jeu qui compte en %s ne se voit demander aucun point',
        (modele) => {
            const { demandeDesPoints, consigne } = santeAAnnoncer(piloteDeTest({ defaultHealthType: modele }));
            expect(demandeDesPoints).toBe(false);
            expect(consigne).toContain('PAS par points');
        },
    );

    it('un pilote muet ne fait rien inventer', () => {
        // *L'absence n'est pas un zéro* : un pilote qui ne déclare pas de modèle
        // de santé n'en a pas un par défaut, il n'en a pas.
        const { demandeDesPoints, consigne } = santeAAnnoncer(piloteDeTest({}));
        expect(demandeDesPoints).toBe(false);
        expect(consigne).toContain('ne déclare aucun modèle de santé');
    });
});
