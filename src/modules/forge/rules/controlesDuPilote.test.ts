import { describe, it, expect } from 'vitest';
import { champsInvoques, controlerLePilote } from './controlesDuPilote';
import { GROUPES } from './GroupesDeChamps';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * Ce que ces tests protègent : **un pilote forgé se raccorde à sa fiche**.
 *
 * Le défaut visé est toujours le même — `CombatCard` lit une valeur **par son
 * identifiant** en pleine séance, et un identifiant qui ne correspond à rien
 * affiche une jauge à zéro, qui ressemble à un personnage en pleine forme.
 *
 * Le premier test est le plus important, et c'est le seul qui porte sur une
 * charge réelle : **le pilote Dune de référence, vérifié à la main, doit passer
 * sans un constat.** Si les contrôles le condamnaient, ce seraient eux qu'il
 * faudrait corriger — c'est l'étalon, pas le suspect.
 */

const duneDriver = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const duneFiche = DEFAULT_SHEET_TEMPLATES.find(t => t.id === 'dune')!;

/** Une fiche minimale, mais réelle dans sa forme : deux sections, deux champs. */
const fiche: Partial<SheetTemplate> = {
    sections: [
        { id: 'competences', label: 'Compétences', fields: [{ id: 'combat', label: 'Combat', type: 'number' }] },
        { id: 'jauges', label: 'Jauges', fields: [{ id: 'determination', label: 'Détermination', type: 'number' }] },
    ] as SheetTemplate['sections'],
};

describe('l\'étalon passe les contrôles', () => {
    it('le pilote Dune de référence ne produit aucun constat', () => {
        expect(controlerLePilote(duneDriver, duneFiche)).toEqual([]);
    });
});

describe('ce qui ne se raccorde à rien est nommé', () => {
    it('une jauge suivie qui ne pointe aucun champ', () => {
        const constats = controlerLePilote(
            { combat: { statsToTrack: [{ fieldId: 'points-de-progression', label: 'Points de progression' }], initiativeFormula: '' } } as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toHaveLength(1);
        expect(constats[0].gravite).toBe('erreur');
        expect(constats[0].ou).toBe('combat.statsToTrack[0].fieldId');
        expect(constats[0].message).toContain('jauge affichera zéro');
    });

    it('une composante de jet qui vise un titre de chapitre plutôt qu\'une section', () => {
        /**
         * Relevé en réel le 2026-08-12 : le modèle a rendu
         * `sectionId: "Les compétences"` — le titre de la section **du livre** —
         * là où le pilote attend l'identifiant d'une section **de la fiche**.
         * Les deux groupes de champs étant forgés séparément, rien ne les
         * accorde : c'est précisément ce que ce contrôle rattrape.
         */
        const constats = controlerLePilote(
            { jet: { seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'Les compétences' }] } } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['jet.seuil[0].sectionId']);
    });

    it('une réserve qui paie les dés sans exister', () => {
        const constats = controlerLePilote(
            { dice: { engine: '2d20' }, jet: { seuil: [], reserve: { base: 2, max: 5, faces: 20, ressource: 'impulsion' } } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['jet.reserve.ressource']);
    });

    it('une formule d\'initiative qui invoque un champ absent', () => {
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: 'dex + int' } } as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toHaveLength(2);
        expect(constats.every(c => c.ou === 'combat.initiativeFormula')).toBe(true);
    });

    it('mais une formule à dés purs ne déclenche rien', () => {
        // `1d10` n'est pas un champ de fiche. Un faux positif est le plus sûr
        // moyen de faire ignorer les vrais.
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '1d10' } } as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toEqual([]);
    });

    it('une tâche de défaite dont la section n\'existe pas', () => {
        const constats = controlerLePilote(
            {
                combat: {
                    statsToTrack: [], initiativeFormula: '',
                    tacheDeDefaite: { sectionDuSeuil: 'aptitudes', seuil: { min: 4, max: 8 }, progressionDeBase: 2, qualiteMax: 4 },
                },
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['combat.tacheDeDefaite.sectionDuSeuil']);
    });

    it('un champ par défaut pris dans la mauvaise section', () => {
        const constats = controlerLePilote(
            {
                combat: {
                    statsToTrack: [], initiativeFormula: '',
                    tacheDeDefaite: { sectionDuSeuil: 'competences', champParDefaut: 'determination', seuil: { min: 4, max: 8 }, progressionDeBase: 2, qualiteMax: 4 },
                },
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['combat.tacheDeDefaite.champParDefaut']);
    });

    it('une réserve qui se déverse dans le vide, ou dans elle-même', () => {
        const constats = controlerLePilote(
            {
                ressourcesDeTable: [
                    { id: 'impulsion', label: 'Impulsion', proprietaire: 'joueurs', depart: 0, min: 0, reportSurEpuisement: 'menace' },
                    { id: 'elan', label: 'Élan', proprietaire: 'joueurs', depart: 0, min: 0, reportSurEpuisement: 'elan' },
                ],
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toHaveLength(2);
        expect(constats[1].message).toContain('elle-même');
    });

    it('une logique de dés que le moteur ne connaît pas', () => {
        const constats = controlerLePilote(
            { dice: { defaultDice: '2d20', logic: 'compte-les-reussites' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['dice.logic']);
    });
});

describe('ce qui manque est signalé sans être refusé', () => {
    it('une fiche sans section est un avertissement, pas une erreur', () => {
        // Un pilote incomplet se corrige ; le déclarer fautif empêcherait de
        // voir ce qui a été correctement dérivé par ailleurs.
        const constats = controlerLePilote({}, { sections: [] });
        expect(constats).toEqual([
            expect.objectContaining({ gravite: 'avertissement', ou: 'template.sections' }),
        ]);
    });

    it('un jeu sans réserve, sans tâche de défaite et sans initiative reste valide', () => {
        expect(controlerLePilote({ combat: { statsToTrack: [], initiativeFormula: '' } }, fiche)).toEqual([]);
    });
});

describe('ce qui vient de l\'exemple et non des fiches', () => {
    it('un nom recopié mot pour mot d\'un exemple de l\'invite', () => {
        /**
         * Charge réelle du 2026-08-12 : dérivée du corpus **d'Alien**, la Forge
         * a rendu « Dune : Aventures dans l'Imperium » et `#d97706` — l'exemple
         * d'identité au caractère près, sur un corpus qui ne mentionne Dune
         * nulle part. Le décodage glouton, adopté le même jour, y est pour
         * beaucoup : la continuation la plus probable d'un champ `name`, c'est
         * le nom qu'on vient de montrer.
         */
        const exemple = GROUPES.find(g => g.id === 'fiche')!.exemple;
        const nomEmprunte = /"name":"([^"]+)"/.exec(exemple)![1];

        const constats = controlerLePilote({ name: nomEmprunte } as Partial<GameDriver>, fiche);
        expect(constats.map(c => c.ou)).toEqual(['name']);
        expect(constats[0].message).toContain('ne vient pas des fiches');
    });

    it('mais une couleur identique à celle d\'un exemple ne condamne rien', () => {
        /**
         * La première version de ce contrôle surveillait aussi `themeColor` —
         * et condamnait aussitôt l'étalon, dont le `#d97706` figure
         * légitimement dans l'exemple des jauges puisque c'est de lui qu'il a
         * été tiré. **C'est le test de l'étalon qui l'a attrapé.** Sept
         * caractères hexadécimaux se rencontrent ; une phrase entière, non.
         */
        expect(controlerLePilote({ ui_config: { gauges: [], themeColor: '#d97706' } }, fiche))
            .toEqual([]);
    });

    it('l\'exemple d\'identité ne porte plus aucune valeur copiable', () => {
        // C'est le seul groupe où l'exemple est une *réponse plausible* : un
        // nom de jeu se recopie, un `2d20` se heurte aux fiches.
        const identite = GROUPES.find(g => g.id === 'identite')!;
        expect(identite.exemple).not.toMatch(/Dune|Modiphius|#d97706/);
        expect(identite.exemple).toContain('<');
    });
});

describe('la famille du moteur de dés', () => {
    /**
     * Relevé sur la dérivation d'Alien du 2026-08-13 : `dice.engine` **absent**.
     *
     * Ce que ça coûtait : `DiceBoard` et `RemoteDicePad` lisent ce champ pour
     * choisir leur mode et retombent tous deux sur `standard`. `rollYZE` — qui
     * compte les six et distingue les dés d'équipement — n'aurait jamais été
     * appelé, et la table aurait lancé des dés génériques toute la séance.
     *
     * La cause était dans l'invite : `logic` et `sens` avaient leur énumération
     * écrite, `engine` avait douze valeurs et pas une ligne. Il n'existait que
     * dans l'exemple, où il vaut `2d20`.
     */
    const reserveDeD6 = { base: 1, max: 10, faces: 6 };

    it('une réserve de dés sans moteur nommé : le pupitre retombe sur standard', () => {
        const constats = controlerLePilote(
            { jet: { reserve: reserveDeD6 } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['dice.engine']);
        expect(constats[0].gravite).toBe('avertissement');
        expect(constats[0].message).toContain('yze');
    });

    it('mais un jeu sans réserve ne dit rien : « standard » lui va', () => {
        expect(controlerLePilote(
            { dice: { defaultDice: '1d20', logic: 'sum' } } as Partial<GameDriver>,
            fiche,
        )).toEqual([]);
    });

    it('le nom du moteur en toutes lettres n\'est pas une valeur', () => {
        // La recopie qu'on attendait le plus : les fiches disent « Year Zero
        // Engine », et rien n'apprenait au modèle que le champ veut un code.
        const constats = controlerLePilote(
            { dice: { defaultDice: '10d6', logic: 'count-success', engine: 'Year Zero Engine' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['dice.engine']);
        expect(constats[0].gravite).toBe('erreur');
    });

    it('« year-zero » passe, parce que les trois lecteurs l\'acceptent', () => {
        expect(controlerLePilote(
            { dice: { defaultDice: '10d6', logic: 'count-success', engine: 'year-zero' } } as unknown as Partial<GameDriver>,
            fiche,
        )).toEqual([]);
    });

    it('un moteur qui ne lance pas les dés du jeu est recopié de l\'exemple', () => {
        // Le désastre évité de justesse : `2d20` posé sur un jeu à d6. Le
        // modèle avait le choix entre recopier l'exemple et omettre ; il a
        // omis, et c'est la chance qui a tranché.
        const constats = controlerLePilote(
            { dice: { defaultDice: '2d20', logic: 'count-success', engine: '2d20' }, jet: { reserve: reserveDeD6 } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['dice.engine']);
        expect(constats[0].message).toContain('20 faces');
    });

    it('« yze » sur une réserve de d6 ne dit rien — c\'est Alien', () => {
        expect(controlerLePilote(
            { dice: { defaultDice: '10d6', logic: 'count-success', engine: 'yze' }, jet: { reserve: reserveDeD6 } } as unknown as Partial<GameDriver>,
            fiche,
        )).toEqual([]);
    });
});

describe('un jet que le moteur ne saurait pas résoudre', () => {
    it('un sens de comparaison inconnu', () => {
        const constats = controlerLePilote(
            { jet: { seuil: [], sens: 'none' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['jet.sens']);
    });

    it('un jet par défaut qui ne lance aucun dé', () => {
        const constats = controlerLePilote(
            { dice: { defaultDice: '0d6', logic: 'count-success' } } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['dice.defaultDice']);
    });

    it('« sous un seuil » sans aucun seuil : le jet serait résolu à l\'envers', () => {
        /**
         * Charge réelle du 2026-08-12, sur Alien. La fiche dit « réussir exige
         * d'obtenir **au moins un six** » ; le pilote a rendu
         * `sens: 'sous-ou-egal'` avec un `seuil` vide. Tous les jets se
         * seraient résolus à l'envers **sans qu'un seul écran ne s'en
         * aperçoive** — le défaut du moteur 2d20 du 2026-08-10, qui rendait
         * précisément les réussites qu'il fallait rejeter.
         */
        const constats = controlerLePilote(
            { jet: { seuil: [], sens: 'sous-ou-egal' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['jet.sens']);
        expect(constats[0].message).toContain('superieur-ou-egal');
    });

    it('mais « sous un seuil » avec un seuil composé ne dit rien — c\'est Dune', () => {
        expect(controlerLePilote(
            { jet: { seuil: [{ id: 'c', label: 'C', sectionId: 'competences' }], sens: 'sous-ou-egal' } } as unknown as Partial<GameDriver>,
            fiche,
        )).toEqual([]);
    });

    it('une réserve écrite en formule plutôt qu\'en dés', () => {
        // Relevé sur Alien : `base: "attribut+comp_level"`. Le panneau de jet
        // n'aurait rien lancé.
        const constats = controlerLePilote(
            { dice: { engine: 'yze' }, jet: { seuil: [{ id: 'c', label: 'C', sectionId: 'competences' }], reserve: { base: 'attribut+comp_level', max: 6, faces: 6 } } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['jet.reserve.base']);
    });

    it('une réserve vide est signalée sans être refusée', () => {
        const constats = controlerLePilote(
            { dice: { engine: 'yze' }, jet: { seuil: [], reserve: { base: 0, max: 0, faces: 6 } } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toEqual([
            expect.objectContaining({ gravite: 'avertissement', ou: 'jet.reserve' }),
        ]);
    });
});

describe('un ordre d\'action que le moteur ne saurait pas lire', () => {
    it('une phrase à la place d\'un descripteur', () => {
        // Relevé sur Alien : `"initiative": "ordre croissant des numéros"`.
        // `OrdreDuTour` y lit un mode, un prix de rétention, un plafond — une
        // phrase le fait retomber sur son défaut, sans rien dire.
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', initiative: 'ordre croissant' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['combat.initiative']);
    });

    it('un tri qui n\'est ni « asc » ni « desc »', () => {
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', initiativeSort: 'croissant' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['combat.initiativeSort']);
    });
});

describe('un type de champ que la fiche ne sait pas rendre', () => {
    it('« string » n\'existe pas, et le composant de fiche retomberait sur son cas par défaut', () => {
        // Relevé en réel le 2026-08-12 sur le gabarit dérivé de Dune.
        const constats = controlerLePilote({}, {
            sections: [{ id: 'identite', label: 'Identité', fields: [{ id: 'role', label: 'Rôle', type: 'string' }] }],
        } as unknown as Partial<SheetTemplate>);
        expect(constats).toHaveLength(1);
        expect(constats[0].ou).toBe('template.sections[identite].fields[role].type');
    });
});

describe('un modèle de santé hors énumération', () => {
    it('« Santé » est le nom d\'une section de fiche, pas une façon de compter les dégâts', () => {
        /**
         * Relevé en réel sur la dérivation d'Alien du 2026-08-13.
         * `HealthInterpreter` n'interprète que cinq modèles ; une valeur hors
         * énumération ne plante pas, elle retombe sur le cas par défaut — et la
         * mise hors de combat se joue sur un modèle que personne n'a choisi.
         */
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', defaultHealthType: 'Santé' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['combat.defaultHealthType']);
        expect(constats[0].message).toContain('hp, clocks, anatomy, wounds, boxes');
    });

    it('les cinq modèles connus passent', () => {
        for (const modele of ['hp', 'clocks', 'anatomy', 'wounds', 'boxes']) {
            const constats = controlerLePilote(
                { combat: { statsToTrack: [], initiativeFormula: '', defaultHealthType: modele } } as unknown as Partial<GameDriver>,
                fiche,
            );
            expect(constats).toEqual([]);
        }
    });
});

describe('la tâche de défaite, qui l\'emporte sur ce que le pilote annonce', () => {
    /**
     * Relevé sur Alien le 2026-08-14 : `defaultHealthType: "hp"` accompagné de
     * `tacheDeDefaite: {seuil:{min:0,max:0}}` — un objet croupion, sans section
     * ni progression.
     *
     * Ce que ça faisait : `santeSelonLeSysteme` consulte la tâche **dès qu'un
     * combattant a une fiche** et rend `horlogeDeDefaite`, qui écrit
     * `type: 'clocks'` en dur avec `segments = seuil`. Chaque personnage serait
     * entré en combat avec une horloge à **zéro segment**, pendant que sa jauge
     * `sante` n'était jamais lue et que le pilote affichait « hp ».
     */
    const avecTache = (extra: Record<string, unknown>) => ({
        combat: {
            tacheDeDefaite: { sectionDuSeuil: 'competences', seuil: { min: 4, max: 8 }, progressionDeBase: 2, qualiteMax: 4 },
            ...extra,
        },
    }) as unknown as Partial<GameDriver>;

    it('« hp » et une tâche de défaite se contredisent', () => {
        const constats = controlerLePilote(avecTache({ defaultHealthType: 'hp' }), fiche);
        expect(constats.map(c => c.ou)).toEqual(['combat.tacheDeDefaite']);
        expect(constats[0].message).toContain('SANS points de vie');
    });

    it('« clocks » et une tâche de défaite vont ensemble — c\'est Dune', () => {
        expect(controlerLePilote(avecTache({ defaultHealthType: 'clocks' }), fiche)).toEqual([]);
    });

    it('une tâche sans section où lire son seuil est pire qu\'absente', () => {
        const constats = controlerLePilote(
            { combat: { tacheDeDefaite: { seuil: { min: 0, max: 0 } } } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual([
            'combat.tacheDeDefaite.sectionDuSeuil',
            'combat.tacheDeDefaite.seuil',
        ]);
        expect(constats[0].message).toContain("l'omettre");
    });
});

describe('les portées, et ce qu\'on renonce à y contrôler', () => {
    /** Les cinq bandes, écrites en un mot : `[maxUnits, modifier]` par portée. */
    const portees = (valeurs: [number, number][]) => ({
        tactical: {
            useTacticalAI: false,
            ranges: Object.fromEntries(
                ['contact', 'courte', 'moyenne', 'longue', 'extreme'].map((nom, i) => [
                    nom, { label: nom, maxUnits: valeurs[i][0], modifier: valeurs[i][1] },
                ]),
            ),
        },
    }) as unknown as Partial<GameDriver>;

    it('une courbe en U ne dit RIEN : c\'est la règle d\'Alien, pas un décalage', () => {
        /**
         * **Le contrôle que ce test remplace était faux, et deux dérivations
         * l'ont payé.** Posé le 2026-08-13, il voyait dans `contact −3,
         * courte 0, moyenne −1, longue −2, extreme −3` la signature d'un
         * décalage d'un rang, et accusait `contact` d'avoir hérité du −3
         * d'`extreme`.
         *
         * La fiche des portées d'Alien écrit exactement ces cinq valeurs, et le
         * livre les justifie : tirer sur une cible collée à soi est difficile,
         * tirer à un kilomètre aussi. **Les deux pilotes avaient raison ; c'est
         * le contrôle qui avait tort.**
         *
         * Ce test tient la place du contrôle retiré pour qu'il ne revienne pas.
         * L'outil suit l'état, il n'arbitre pas — et la consigne jumelle qui
         * était partie dans l'invite commandait au modèle de casser la règle du
         * jeu pour satisfaire l'outil.
         */
        expect(controlerLePilote(portees([[1, -3], [2, 0], [3, -1], [4, -2], [8, -3]]), fiche)).toEqual([]);
    });

    it('une pénalité qui ne fait que descendre est légitime — le signe n\'est pas arbitré', () => {
        // Alien correctement ordonné : le tir devient plus dur en s'éloignant.
        expect(controlerLePilote(portees([[1, 0], [2, -1], [3, -2], [4, -3], [8, -4]]), fiche)).toEqual([]);
    });

    it('une bande plus lointaine qui porte moins loin', () => {
        const constats = controlerLePilote(
            portees([[1, 0], [5, 1], [3, 2], [7, 3], [9, 4]]),
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['tactical.ranges.moyenne.maxUnits']);
    });
});

describe('champsInvoques', () => {
    it('retire la notation de dés et dédoublonne', () => {
        expect(champsInvoques('2d6 + dex + dex + int')).toEqual(['dex', 'int']);
    });
});
