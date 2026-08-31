import { describe, it, expect } from 'vitest';
import { TacticalNarrativeService } from '../logic/TacticalNarrativeService';
import type { Combatant } from '../../combat/useCombatStore';
import type { MapToken, DangerZone } from '../../map/types';
import type { TacticalConfig } from '../../../types/drivers';

/** Les seules lignes de cibles du rapport — « * Nom à N unités […] ». */
const lignesDeCibles = (rapport: string) => {
    const apres = rapport.split('- Proximité Ennemi :')[1] ?? '';
    return apres.split(String.fromCharCode(10))
        .filter(l => l.trim().startsWith('*'))
        .join(String.fromCharCode(10));
};

describe('TacticalNarrativeService', () => {
    const mockActor: Partial<Combatant> = {
        id: '1',
        name: 'Elara',
        faction: 'player',
        hp: 20,
        hpMax: 20,
        statuses: []
    };

    const mockEnemies: Partial<Combatant>[] = [
        { id: '2', name: 'Orc 1', faction: 'enemy', hp: 10, hpMax: 10, statuses: [] },
        { id: '3', name: 'Orc 2', faction: 'enemy', hp: 5, hpMax: 10, statuses: [] }
    ];

    const mockTokens: Partial<MapToken>[] = [
        { id: 't1', name: 'Elara', x: 100, y: 100 },
        { id: 't2', name: 'Orc 1', x: 150, y: 100 }, // 50px away (1 unit)
        { id: 't3', name: 'Orc 2', x: 50, y: 100 }   // 50px away (1 unit)
    ];

    const mockZones: Partial<DangerZone>[] = [
        { id: 'z1', name: 'Feu', x: 110, y: 110, radius: 1 }
    ];

    it('should generate a correct narrative report', () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            mockZones as DangerZone[],
            50
        );

        expect(report).toContain('## ANALYSE TACTIQUE MICRO : Elara');
        expect(report).toContain('* Orc 1 à 1 unités [Portée Contact]');
        expect(report).toContain('* Orc 2 à 1 unités [Portée Contact]');
        expect(report).toContain('ALERTE : FLANQUÉ par Orc 1 et Orc 2 !');
        expect(report).toContain('RISQUES TERRAIN : Feu');
    });

    /**
     * **Cette fixture décrivait en réalité un combat SANS CARTE** — aucun jeton,
     * pour personne — et non un acteur oublié sur une carte peuplée. La
     * distinction date du 2026-08-23 : *une absence isolée est un oubli, une
     * absence universelle est un choix.* Les deux cas sont couverts, chacun par
     * son test.
     */
    it('traite un combat sans aucun jeton comme un combat sans carte', () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor] as Combatant[],
            [] as MapToken[],
            [] as DangerZone[]
        );

        expect(report).toContain('SANS CARTE');
        expect(report, "il ne s'excuse pas d'une absence").not.toContain('Absent de la carte Atlas');
    });

    /**
     * **Le rapport parle la langue DU JEU.**
     *
     * Il écrivait « à 3 cases » sur tous les systèmes, alors qu'Alien compte en
     * zones et d'autres en mètres — *une convention d'un système appliquée à
     * tous.* Et il annonçait « Portée Contact » quand le pilote déclare « au
     * toucher » : cinq libellés collectés par la Forge depuis les fiches, et
     * rien ne les lisait. **Un champ rempli que rien ne lit est un champ qui
     * finira faux sans qu'on le sache.**
     */
    const configZones: TacticalConfig = {
        uniteDeDistance: 'zones',
        useTacticalAI: true,
        ranges: {
            contact: { label: 'au toucher', maxUnits: 1, modifier: 0 },
            courte: { label: 'tranche courte', maxUnits: 2, modifier: 0 },
            moyenne: { label: 'tranche moyenne', maxUnits: 3, modifier: -1 },
            longue: { label: 'tranche longue', maxUnits: 4, modifier: -2 },
            extreme: { label: 'hors de portée', maxUnits: 5, modifier: -3 },
        },
    };

    it("emploie l'unité du pilote, et le nom qu'il donne à la bande", () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[],
            50,
            undefined,
            configZones,
        );

        expect(report).toContain('à 1 zones');
        expect(report, 'la bande porte le nom du jeu').toContain('[Portée au toucher]');
        expect(report, 'et plus jamais la grille de personne').not.toContain('cases');
    });

    it('dit « unités » quand le pilote ne nomme rien — jamais « cases »', () => {
        // *On ne remplace pas une convention inventée par une autre.* Sans
        // déclaration, le mot ne prétend ni grille, ni mètre, ni zone.
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[],
        );

        expect(report).toContain('à 1 unités');
        expect(report).not.toContain('cases');
    });

    /**
     * **La ligne du soutien direct, restée en « cases » jusqu'au 2026-08-31.**
     *
     * Les deux tests ci-dessus interdisent le mot depuis le 22/08 — et ils
     * passaient, parce qu'ils **ne mettaient aucun allié en scène**. *Un test
     * qui interdit un mot ne vaut que sur les lignes qu'il fait écrire.*
     *
     * Le mot n'était d'ailleurs pas le pire : le seuil `<= 2` comptait en
     * unités de grille, ce qui ne désigne rien sur un jeu en zones. Le soutien
     * se lit désormais sur la **bande déclarée par le pilote**.
     */
    describe('le soutien direct', () => {
        /** Un allié à une unité — donc « au toucher » sur le pilote en zones. */
        const alliePresent = { id: '5', name: 'Kaï', faction: 'ally', hp: 9, hpMax: 9, statuses: [] };
        const tokensAvecAllie = [...mockTokens, { id: 't5', name: 'Kaï', x: 100, y: 150 }];

        const rapportAvecAllie = (config?: TacticalConfig) =>
            TacticalNarrativeService.getSituationalReport(
                mockActor as Combatant,
                [mockActor, alliePresent, ...mockEnemies] as Combatant[],
                tokensAvecAllie as MapToken[],
                [] as DangerZone[],
                50,
                undefined,
                config,
            );

        it("annonce l'allié dans l'unité du jeu, et plus jamais en « cases »", () => {
            const rapport = rapportAvecAllie(configZones);

            expect(rapport).toContain('- Soutien direct : Kaï à 1 zones [Portée au toucher]');
            expect(rapport, 'la grille de personne').not.toContain('cases');
        });

        it('sans pilote, dit « unités » comme le reste du rapport', () => {
            expect(rapportAvecAllie()).toContain('- Soutien direct : Kaï à 1 unités [Portée Contact]');
        });

        /**
         * **Le vrai défaut était le seuil, pas le mot.** `<= 2` unités de
         * grille laissait passer un allié que le pilote place hors de sa bande
         * courte — et en écartait un qu'il y met. Ici, un pilote dont la bande
         * courte s'arrête à 1 unité : l'allié à 2 unités n'est plus un soutien
         * direct, alors que l'ancien seuil l'aurait compté.
         */
        it('suit la bande du pilote, et non un nombre de cases', () => {
            const serre: TacticalConfig = {
                ...configZones,
                ranges: {
                    ...configZones.ranges!,
                    contact: { label: 'au toucher', maxUnits: 0.5, modifier: 0 },
                    courte: { label: 'tranche courte', maxUnits: 1, modifier: 0 },
                    moyenne: { label: 'tranche moyenne', maxUnits: 3, modifier: -1 },
                },
            };
            const loin = [...mockTokens, { id: 't5', name: 'Kaï', x: 100, y: 200 }]; // 2 unités

            const rapport = TacticalNarrativeService.getSituationalReport(
                mockActor as Combatant,
                [mockActor, alliePresent, ...mockEnemies] as Combatant[],
                loin as MapToken[],
                [] as DangerZone[],
                50,
                undefined,
                serre,
            );

            expect(rapport, "l'ancien seuil de 2 l'aurait compté").not.toContain('Soutien direct');
        });
    });

    /**
     * **Le défaut le plus severe du plan du 2026-08-07, et il était pire que
     * décrit.**
     *
     * Le plan disait : « tout combattant non-joueur devient enemy par défaut ».
     * Vrai — mais la séparation elle-même était fautive :
     * `c.faction === actor.faction`. Un PNJ **explicitement marqué allié** n'est
     * pas `player`, donc il tombait du côté des cibles. *Le meneur déclarait un
     * allié, et le Cortex proposait de le tuer.*
     *
     * L'écran d'alternance, lui, savait déjà le contraire : il appelle `campDe`.
     * **Deux écritures de « qui est de mon côté », et elles se contredisaient.**
     */
    it("range un PNJ allié du côté des alliés, et non des cibles", () => {
        const allie = { id: '4', name: 'Sœur Maël', faction: 'ally', hp: 8, hpMax: 8, statuses: [] };
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, allie, ...mockEnemies] as Combatant[],
            [...mockTokens, { id: 't4', name: 'Sœur Maël', x: 100, y: 150 }] as MapToken[],
            [] as DangerZone[],
            50,
        );

        expect(lignesDeCibles(report), "l'allié n'est pas une cible").not.toContain('Sœur Maël');
    });

    it("nomme un combattant sans camp établi au lieu d'en faire une cible", () => {
        const inconnu = { id: '5', name: 'Silhouette', faction: 'neutral', hp: 6, hpMax: 6, statuses: [] };
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, inconnu, ...mockEnemies] as Combatant[],
            [...mockTokens, { id: 't5', name: 'Silhouette', x: 100, y: 200 }] as MapToken[],
            [] as DangerZone[],
            50,
        );

        expect(report).toContain('Ni alliés ni cibles');
        expect(report).toContain('Silhouette');
        expect(report, 'et le modèle est prévenu').toContain('Ne propose pas de les attaquer');

        expect(lignesDeCibles(report)).not.toContain('Silhouette');
    });

    it('ne compte pas un allié dans la santé du camp adverse', () => {
        // La « Morphologie du Combat » est l'un des rares éléments stratégiques
        // du rapport : la fausser fait conseiller une retraite devant ses
        // propres renforts.
        const allie = { id: '4', name: 'Sœur Maël', faction: 'ally', hp: 8, hpMax: 8, statuses: [] };
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, allie, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[],
        );

        // Elara 20/20 + Maël 8/8 = 100 % ; les orcs restent à 15/20 = 75 %.
        expect(report).toContain('Allies 100% vs Enemies 75%');
    });

    /**
     * **Ce que le rapport SAIT, distingué de ce qu'il SUPPOSE.**
     *
     * Il présentait tout au même rang : une distance mesurée sur une grille
     * réglée et une distance calculée sur les 50 px par défaut s'y lisaient
     * pareil. *Un conseil de placement fondé sur une unité arbitraire est faux
     * sans jamais se plaindre.*
     */
    it("nomme les combattants absents de la carte au lieu de les taire", () => {
        // Aucun jeton pour lui : il disparaissait de l'analyse sans un mot.
        const invisible = { id: '9', name: 'Sentinelle', faction: 'enemy', hp: 4, hpMax: 4, statuses: [] };
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, invisible, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[],
        );

        expect(report).toContain('FIABILITÉ DES ENTRÉES');
        expect(report).toContain('Sentinelle');
        expect(report).toContain('hors de cette analyse');
    });

    it("avoue une grille éteinte, dont l'échelle est arbitraire", () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[],
            50, undefined, undefined,
            false,
        );

        expect(report).toContain('la grille de la carte est éteinte');
        expect(report).toContain('indicatives');
    });

    it("signale une position appariée par le nom plutôt que par un lien", () => {
        // Les jetons de ce test n'ont pas de `linkedCombatantId` : ils se lient
        // par égalité de noms, ce qui est un repli et non une méthode.
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[],
        );

        expect(report).toContain('appariée par son NOM');
    });

    it("se tait sur la fiabilité quand tout est mesuré", () => {
        // *Un rapport qui se justifie à chaque ligne finit non lu, et la ligne
        // qui compte s'y noie.*
        const lies = mockTokens.map((t, i) => ({
            ...t,
            linkedCombatantId: [mockActor, ...mockEnemies][i]?.id,
        }));
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            lies as MapToken[],
            [] as DangerZone[],
            50, undefined, undefined,
            true,
        );

        expect(report).not.toContain('FIABILITÉ DES ENTRÉES');
    });

    it("interdit tout conseil de placement quand l'acteur n'est pas sur la carte", () => {
        // L'information était là — « Absent de la carte » — et rien n'interdisait
        // au modèle de conseiller un déplacement quand même.
        //
        // **La carte est PEUPLÉE ici** : les ennemis ont leurs jetons, l'acteur
        // non. C'est un défaut, et il se distingue du combat mené sans carte.
        const jetonsDesEnnemis = mockEnemies.map((e, i) => ({
            id: `t-${i}`, name: e.name, x: 100 + i * 50, y: 100, linkedCombatantId: e.id,
        }));
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            jetonsDesEnnemis as MapToken[],
            [] as DangerZone[],
        );

        expect(report).toContain('AUCUNE POSITION CONNUE');
        expect(report).toContain('ne conseille aucun déplacement');
        expect(report, 'et il reste quelque chose à dire').toContain('santé, états, moral');
        expect(report, "ce n'est pas le mode sans carte").not.toContain('SANS CARTE');
    });

    /**
     * **Le mode hors carte doit NOMMER les adversaires.**
     *
     * David, le 2026-08-23 : *« oui je joue souvent des combats sans cartes »*.
     * Le rapport devait conseiller « sur la seule base des PV, des états et du
     * moral » — mais les listes d'ennemis ne se remplissaient que si l'acteur
     * avait un jeton : **il ne recevait pas les PV des autres.** Le Cortex
     * ignorait jusqu'à leur existence.
     */
    /**
     * **Un jeton sans nom faisait planter le rapport entier.** `name` est
     * facultatif sur `MapToken` et le repli par nom l'appelait sans garde :
     * pas une analyse dégradée, une exception. *Un repli qui suppose ce qu'il
     * cherche n'est pas un repli.*
     */
    it('survit à un jeton anonyme sur la carte', () => {
        const anonyme = [{ id: 't-x', x: 10, y: 10 }];
        expect(() => TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            anonyme as MapToken[],
            [] as DangerZone[],
        )).not.toThrow();
    });

    it('nomme les adversaires et leur état quand il n’y a pas de carte', () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            [] as MapToken[],
            [] as DangerZone[],
        );

        expect(report).toContain('Adversaires');
        for (const e of mockEnemies) {
            expect(report, `${e.name} doit être nommé`).toContain(e.name);
        }
        expect(report, 'aucune notion de terrain').not.toContain('Portée');
        expect(report, 'le rapport de force reste dit').toContain('Morphologie du Combat');
    });

    it("ne se justifie d'aucune fiabilité de position quand il n'y a pas de carte", () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            [] as MapToken[],
            [] as DangerZone[],
        );
        expect(report).not.toContain('FIABILITÉ DES ENTRÉES');
    });

    it('should calculate faction health correctly', () => {
        const report = TacticalNarrativeService.getSituationalReport(
            mockActor as Combatant,
            [mockActor, ...mockEnemies] as Combatant[],
            mockTokens as MapToken[],
            [] as DangerZone[]
        );

        // My faction: Elara (20/20) = 100%
        // Enemy faction: Orc 1 (10/10) + Orc 2 (5/10) = 15/20 = 75%
        expect(report).toContain('Morphologie du Combat : Allies 100% vs Enemies 75%');
    });
});
