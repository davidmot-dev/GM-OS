import { describe, it, expect } from 'vitest';
import { champsInvoques, controlerLePilote, estUnePhrase } from './controlesDuPilote';
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

/**
 * **Le test est structurel, pas lexical** : deux identifiants côte à côte sans
 * opérateur entre eux, ce qu'aucune expression arithmétique ne peut contenir.
 * Une liste de mots vides français aurait vieilli avec la langue du corpus.
 */
describe('reconnaître une phrase déguisée en formule', () => {
    it('les vraies formules passent, quelle que soit leur forme', () => {
        for (const bonne of [
            'dex', 'dex + int', '1d10', 'agilite / 2 + melee + 1d6',
            '(dexterite + reflexes) / 2', 'dé_de_vie + 8', '',
        ]) {
            expect(estUnePhrase(bonne), bonne).toBe(false);
        }
    });

    it('les phrases sont reconnues sur leur structure, pas sur leurs mots', () => {
        for (const mauvaise of [
            'une demi-caractéristique plus le niveau de la compétence',
            'la moyenne de la taille et de la constitution',
            // Anglais : la règle ne connaît aucune langue, seulement la syntaxe.
            'half your agility plus your melee skill',
        ]) {
            expect(estUnePhrase(mauvaise), mauvaise).toBe(true);
        }
    });
});

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

    /**
     * **Deux défauts du même message, relevés sur Rêves de Dragons le
     * 2026-08-21.** Il écrivait « nulle part où choisir sa » suivi du label —
     * donc *« sa état général »* — et, quand aucune section ne ressemblait, il
     * s'arrêtait là. Or c'est précisément ce cas qui appelle le seul conseil
     * utile : la composante « Les difficultés » n'avait pas de section parce
     * qu'elle n'aurait pas dû exister.
     */
    it('le message cite le label sans l\'accorder, et dit quoi faire quand rien ne ressemble', () => {
        const constats = controlerLePilote(
            { jet: { seuil: [{ id: 'etat', label: 'État général', sectionId: 'Fonctionnement' }] } } as Partial<GameDriver>,
            fiche,
        );

        expect(constats[0].message).toContain('choisir « État général »');
        expect(constats[0].message).not.toContain('sa état');
        expect(constats[0].message).toContain("c'est l'entrée elle-même qui est de trop");
    });

    it('un SOUS-GROUPE supplementaire introuvable se signale aussi', () => {
        /*
          **Chaque section déclarée se vérifie, pas seulement la première.**
          Depuis le 2026-08-23 une composante peut nommer plusieurs sous-groupes
          — chez Rêves de Dragons les compétences y sont découpées. Ne contrôler
          que `sectionId` laisserait un sous-groupe fantôme passer sans un mot :
          le menu du joueur serait simplement plus court, et *un menu plus court
          qu'il ne devrait est indiscernable d'un menu complet.*
        */
        const constats = controlerLePilote(
            { jet: { seuil: [{
                id: 'competence', label: 'Compétence', sectionId: 'competences',
                sectionsSupplementaires: ['competences_draconiques'],
            }] } } as Partial<GameDriver>,
            fiche,
        );

        expect(constats.map(c => c.ou)).toEqual(['jet.seuil[0].sectionsSupplementaires[0]']);
        expect(constats[0].gravite).toBe('erreur');
        expect(constats[0].message).toContain('competences_draconiques');
        expect(constats[0].message).toContain("n'apparaîtra pas dans le menu");
    });

    it('un sous-groupe qui se raccorde ne dit rien', () => {
        const constats = controlerLePilote(
            { jet: { seuil: [{
                id: 'competence', label: 'Compétence', sectionId: 'competences',
                sectionsSupplementaires: ['jauges'],
            }] } } as Partial<GameDriver>,
            fiche,
        );

        expect(constats).toEqual([]);
    });

    it('deux composantes qui se recouvrent sur un sous-groupe avertissent', () => {
        /*
          Le même défaut que « deux entrées sur la même section », vu par les
          sous-groupes : le joueur pourrait prendre deux fois la même compétence,
          et les deux composantes s'ADDITIONNENT.
        */
        const constats = controlerLePilote(
            { jet: { seuil: [
                { id: 'a', label: 'A', sectionId: 'competences' },
                { id: 'b', label: 'B', sectionId: 'jauges', sectionsSupplementaires: ['competences'] },
            ] } } as Partial<GameDriver>,
            fiche,
        );

        expect(constats.some(c => c.gravite === 'avertissement' && c.message.includes('Compétences'))).toBe(true);
    });

    it('mais quand une section ressemble, c\'est elle qu\'on propose', () => {
        const constats = controlerLePilote(
            { jet: { seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'Les compétences' }] } } as Partial<GameDriver>,
            fiche,
        );

        expect(constats[0].message).toContain('(competences)');
        expect(constats[0].message).not.toContain('de trop');
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

    /**
     * **Relevé par David le 2026-08-21 sur Rêves de Dragons.** La dérivation a
     * rendu la règle d'initiative **rédigée en français**, et le contrôle a crié
     * une fois par mot : vingt lignes rouges pour un seul défaut, sur un écran
     * qui en comptait vingt-cinq. *Un contrôle qui répète vingt fois la même
     * chose ne se lit pas mieux qu'un contrôle absent.*
     */
    it('une règle rédigée ne produit qu\'UN reproche, et il dit lequel', () => {
        const phrase = '(une demi-caractéristique concernée (arrondie à l\'inférieur) plus le '
            + 'niveau de la compétence) + un dé à six faces - malus d\'état général';

        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: phrase } } as Partial<GameDriver>,
            fiche,
        );

        expect(constats).toHaveLength(1);
        expect(constats[0].ou).toBe('combat.initiativeFormula');
        expect(constats[0].message).toContain('est une phrase, pas une formule');
    });

    it('la santé de départ rédigée se reproche une fois elle aussi', () => {
        const constats = controlerLePilote(
            {
                combat: {
                    statsToTrack: [], initiativeFormula: '',
                    santeDeDepart: 'la moyenne de la taille et de la constitution',
                },
            } as Partial<GameDriver>,
            fiche,
        );

        expect(constats).toHaveLength(1);
        expect(constats[0].ou).toBe('combat.santeDeDepart');
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

    it('six composantes sur la même section : une somme là où le jeu offre un choix', () => {
        /**
         * **Charge réelle du 2026-08-17, sur Cthulhu Hack — et c'est l'invite
         * qui l'avait commandé.** Elle exigeait que les six Sauvegardes
         * figurent dans `jet.seuil`. Or les composantes s'additionnent : le
         * panneau a réclamé six menus, `LANCER` est resté mort, et un joueur
         * patient aurait obtenu un seuil de 60 pour un seul d20.
         *
         * Le jeu jette un d20 sous UNE Sauvegarde. C'est donc une composante,
         * sur la section qui porte les six — le menu offre le choix.
         */
        const sauvegardes = ['force', 'dexterite', 'constitution', 'sagesse', 'intelligence', 'charisme'];
        const constats = controlerLePilote(
            {
                jet: {
                    seuil: sauvegardes.map(id => ({ id, label: id, sectionId: 'competences' })),
                    sens: 'sous-ou-egal',
                },
            } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['jet.seuil']);
        expect(constats[0].gravite, 'deux attributs additionnés restent concevables').toBe('avertissement');
        expect(constats[0].message).toContain('ADDITIONNENT');
        expect(constats[0].message).toContain('UNE SEULE');
        expect(constats[0].message, 'la section est nommée telle que la fiche la nomme')
            .toContain('Compétences');
    });

    it('mais deux composantes sur deux sections ne disent rien — c\'est Dune', () => {
        expect(controlerLePilote(
            {
                jet: {
                    seuil: [
                        { id: 'competence', label: 'Compétence', sectionId: 'competences' },
                        { id: 'jauge', label: 'Jauge', sectionId: 'jauges' },
                    ],
                    sens: 'sous-ou-egal',
                },
            } as unknown as Partial<GameDriver>,
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

describe('la réserve composée depuis la fiche se contrôle comme le seuil', () => {
    /**
     * **Depuis le 2026-08-15**, `jet.reserve.composantes` porte les valeurs que
     * le joueur additionne pour former sa **poignée de dés** — chez Alien, un
     * attribut plus une compétence. Elles désignent des sections de la fiche,
     * donc elles peuvent les manquer, exactement comme celles du seuil.
     *
     * Sans ce contrôle, le menu correspondant serait vide en séance et le joueur
     * lancerait la seule base du pilote, sans que rien ne le dise — le silence
     * habituel.
     */
    const fiche = {
        sections: [
            { id: 'attributs', label: 'Attributs', fields: [{ id: 'force', label: 'Force', type: 'number' as const, defaultValue: 2 }] },
            { id: 'competences', label: 'Compétences', fields: [{ id: 'pilotage', label: 'Pilotage', type: 'number' as const, defaultValue: 0 }] },
        ],
    };

    const piloteAvec = (sectionId: string) => ({
        jet: {
            sens: 'superieur-ou-egal' as const,
            reserve: {
                base: 0, max: 10, faces: 6,
                composantes: [{ id: 'attribut', label: 'Attribut', sectionId }],
            },
        },
        dice: { defaultDice: '1d6', logic: 'count-success' as const, engine: 'yze' as const },
    });

    it('ne dit rien quand la section existe', () => {
        const constats = controlerLePilote(piloteAvec('attributs'), fiche);
        expect(constats.filter(c => c.ou.startsWith('jet.reserve.composantes'))).toEqual([]);
    });

    it('signale une section introuvable, et nomme celle qui répond', () => {
        const constats = controlerLePilote(piloteAvec('les attributs du personnage'), fiche);
        const constat = constats.find(c => c.ou.startsWith('jet.reserve.composantes'));

        expect(constat?.gravite).toBe('erreur');
        expect(constat?.message).toContain('Attributs');
    });

    it('une formule dans « base » renvoie désormais vers le bon champ', () => {
        /**
         * Relevé sur Alien le 2026-08-12 : `base: "attribut+comp_level"`. Le
         * modèle avait compris la règle et l'avait écrite là où le panneau
         * attendait un entier, faute d'un endroit pour l'exprimer. Le message
         * doit maintenant dire OÙ l'écrire, au lieu de la condamner.
         */
        const constats = controlerLePilote(
            { jet: { sens: 'superieur-ou-egal', reserve: { base: 'attribut+comp_level' as unknown as number, max: 10, faces: 6 } } },
            fiche,
        );
        const constat = constats.find(c => c.ou === 'jet.reserve.base');

        expect(constat?.gravite).toBe('erreur');
        expect(constat?.message).toContain('jet.reserve.composantes');
    });
});

/**
 * Ce que ces tests protègent : **un moteur de dés faux se voit à la revue, pas
 * à la table**.
 *
 * Dérivé le 2026-08-16, le pilote de Cthulhu Hack est ressorti avec
 * `engine: '2d20'` et `logic: 'd100-low'` sur un jeu qui lance UN SEUL d20 sous
 * une Sauvegarde. `rollFromConfig` intercepte `2d20` avant toute logique et
 * lance une réserve de deux d20 à la Modiphius ; `d100-low` lance un d100 quoi
 * que dise `defaultDice`.
 *
 * Aucun des deux ne plante. Ils rendent des réussites plausibles et fausses.
 */
describe('le moteur de dés', () => {
    const piloteDeDes = (dice: Record<string, unknown>) =>
        controlerLePilote({ dice } as never, { sections: [] } as never);

    it("refuse « 2d20 » quand le pilote ne lance qu'un dé", () => {
        const constats = piloteDeDes({ defaultDice: '1d20', logic: 'count-success', engine: '2d20' });

        const trouve = constats.find(c => c.ou === 'dice.engine');
        expect(trouve?.gravite).toBe('erreur');
        expect(trouve?.message).toContain('Modiphius');
    });

    it('accepte « 2d20 » sur une vraie réserve', () => {
        const constats = piloteDeDes({ defaultDice: '2d20', logic: 'count-success', engine: '2d20' });
        expect(constats.some(c => c.ou === 'dice.engine')).toBe(false);
    });

    it("refuse « d100-low » sur un jeu qui ne jette pas de percentile", () => {
        const constats = piloteDeDes({ defaultDice: '1d20', logic: 'd100-low', engine: 'standard' });

        const trouve = constats.find(c => c.ou === 'dice.logic');
        expect(trouve?.gravite).toBe('erreur');
        expect(trouve?.message).toContain('count-success');
    });

    it('accepte « d100-low » sur un vrai percentile', () => {
        const constats = piloteDeDes({ defaultDice: '1d100', logic: 'd100-low', engine: 'standard' });
        expect(constats.some(c => c.ou === 'dice.logic')).toBe(false);
    });
});

/**
 * Ce que ces tests protègent : **un contrôle qui se trompe est pire qu'un
 * contrôle absent**.
 *
 * Le 2026-08-17, la revue de Cthulhu Hack affichait DEUX erreurs pour une seule
 * formule, « dé_de_vie + 8 » : elle reprochait au pilote d'invoquer « d », puis
 * « _de_vie ». Ni l'un ni l'autre n'existait — c'était `[a-zA-Z_]` qui coupait
 * le mot sur son « é ».
 *
 * Il envoyait donc corriger ce qui n'avait rien, et il apprenait à ne plus être
 * lu.
 */
describe('champsInvoques et les lettres accentuées', () => {
    it('ne coupe pas un identifiant sur son accent', () => {
        expect(champsInvoques('dé_de_vie + 8')).toEqual(['dé_de_vie']);
    });

    it('tient les autres lettres non anglaises', () => {
        expect(champsInvoques('força + agilité')).toEqual(['força', 'agilité']);
    });

    it('retire toujours la notation de dés', () => {
        expect(champsInvoques('1d10 + agilité')).toEqual(['agilité']);
        expect(champsInvoques('d6 + constitution')).toEqual(['constitution']);
    });

    it("ne crie plus sur une formule dont le champ accentué existe", () => {
        const constats = controlerLePilote(
            { combat: { santeDeDepart: 'dé_de_vie + 8' } } as never,
            { sections: [{ id: 'ressources', label: 'Ressources', fields: [{ id: 'dé_de_vie', label: 'Dé de vie', type: 'number' }] }] } as never,
        );

        expect(constats.filter(c => c.ou === 'combat.santeDeDepart')).toEqual([]);
    });

    it("crie UNE fois, et sur le vrai nom, quand le champ manque", () => {
        const constats = controlerLePilote(
            { combat: { santeDeDepart: 'dé_de_vie + 8' } } as never,
            { sections: [{ id: 'ressources', label: 'Ressources', fields: [{ id: 'hp', label: 'PV', type: 'number' }] }] } as never,
        );

        const sante = constats.filter(c => c.ou === 'combat.santeDeDepart');
        expect(sante).toHaveLength(1);
        expect(sante[0].message).toContain('« dé_de_vie »');
    });
});

/**
 * Ce que ces tests protègent : **une formule ne s'additionne que sur des
 * nombres**.
 *
 * Cthulhu Hack, 2026-08-17. La dérivation a proposé
 * `santeDeDepart: "dé_de_vie + 8"` — et le « dé de vie » de ce jeu est une
 * TAILLE DE DÉ, `d6` ou `d8`. `"d8" + 8` n'est pas une addition.
 *
 * Ce que ça coûte : rien de visible. `santeDeDepart` refuse un champ illisible
 * et rend `null`, l'appelant garde son comportement — donc la santé de départ
 * ne s'applique jamais, sans un mot. C'est le pire endroit où poser une valeur
 * fausse : celui où elle ne fait rien.
 */
describe('une formule de santé sur un champ non numérique', () => {
    const avecChamp = (type: string) => controlerLePilote(
        { combat: { santeDeDepart: 'dé_de_vie + 8' } } as never,
        { sections: [{ id: 'ressources', label: 'Ressources', fields: [{ id: 'dé_de_vie', label: 'Dé de vie', type }] }] } as never,
    ).filter(c => c.ou === 'combat.santeDeDepart');

    it('refuse un champ texte, où vit une notation de dé', () => {
        const constats = avecChamp('text');
        expect(constats).toHaveLength(1);
        expect(constats[0].message).toContain('non un nombre');
    });

    it('accepte un nombre, une jauge ou une note', () => {
        for (const type of ['number', 'gauge', 'rating']) {
            expect(avecChamp(type), type).toEqual([]);
        }
    });

    it("ne crie pas deux fois pour un champ absent", () => {
        // L'absence est déjà dite ; y ajouter « et il n'est pas numérique »
        // serait redondant et ferait douter du reste.
        const constats = controlerLePilote(
            { combat: { santeDeDepart: 'inconnu + 8' } } as never,
            { sections: [{ id: 'x', label: 'X', fields: [] }] } as never,
        ).filter(c => c.ou === 'combat.santeDeDepart');

        expect(constats).toHaveLength(1);
        expect(constats[0].message).toContain("d'aucune section");
    });
});

/**
 * Ce que ces tests protègent : **un pilote qui CALCULE sa cible se contrôle
 * comme un autre, et pas moins.**
 *
 * La mécanique est nommée par un modèle de langage — il peut écrire
 * « runequest » avec l'aplomb de ce qui existe —, et son ajustement se lit sur
 * la fiche exactement comme un seuil : il peut désigner une section absente, ou
 * en désigner douze fois la même. *C'est précisément ce qu'a rendu la
 * dérivation de Rêves de Dragons : « Compétence 1 » à « Compétence 12 ».*
 */
describe('une cible qui se calcule', () => {
    const cible = (ajustement: { id: string; label: string; sectionId: string }[]) => ({
        mecanique: 'reves-de-dragons' as const,
        caracteristique: { id: 'carac', label: 'Caractéristique', sectionId: 'competences' },
        ajustement,
    });

    it('accepte une mécanique connue sans un constat', () => {
        const constats = controlerLePilote(
            {
                jet: {
                    cible: cible([{ id: 'competence', label: 'Compétence', sectionId: 'jauges' }]),
                    sens: 'sous-ou-egal',
                },
            } as unknown as Partial<GameDriver>,
            fiche,
        );

        expect(constats).toEqual([]);
    });

    it('refuse une mécanique inventée, et dit lesquelles existent', () => {
        const constats = controlerLePilote(
            { jet: { cible: { ...cible([]), mecanique: 'runequest' }, sens: 'sous-ou-egal' } } as unknown as Partial<GameDriver>,
            fiche,
        );

        const dit = constats.find(c => c.ou === 'jet.cible.mecanique')!;
        expect(dit.gravite).toBe('erreur');
        expect(dit.message).toContain('reves-de-dragons');
    });

    /**
     * **Le faux positif qu'il fallait éviter.** « sous-ou-egal » sans seuil
     * n'avait aucun sens tant que le seuil était la seule cible possible. Un
     * pilote en pourcentage en porte une, calculée — le lui reprocher aurait
     * condamné tout jeu en pourcentage dès sa première dérivation.
     */
    it('ne reproche pas au pourcentage de jeter sous une cible qu’il porte', () => {
        const constats = controlerLePilote(
            { jet: { cible: cible([]), seuil: [], sens: 'sous-ou-egal' } } as unknown as Partial<GameDriver>,
            fiche,
        );

        expect(constats.filter(c => c.ou === 'jet.sens')).toEqual([]);
    });

    it('signale un pilote qui dirait la cible deux fois', () => {
        const constats = controlerLePilote(
            {
                jet: {
                    cible: cible([]),
                    seuil: [{ id: 'autre', label: 'Autre', sectionId: 'competences' }],
                    sens: 'sous-ou-egal',
                },
            } as unknown as Partial<GameDriver>,
            fiche,
        );

        const dit = constats.find(c => c.ou === 'jet.seuil')!;
        expect(dit.gravite).toBe('avertissement');
        expect(dit.message).toContain('C\'est la cible qui décide');
    });

    /**
     * **Le défaut de Rêves de Dragons, contrôlé sans une ligne de plus.** La
     * liste de l'ajustement est versée dans le même tableau que les seuils :
     * les douze compétences y déclenchent l'avertissement qui existait déjà.
     */
    it('attrape les douze compétences additionnées, par le contrôle du seuil', () => {
        const douze = Array.from({ length: 12 }, (_, i) => ({
            id: `competence${i + 1}`, label: `Compétence ${i + 1}`, sectionId: 'jauges',
        }));
        const constats = controlerLePilote(
            { jet: { cible: cible(douze), sens: 'sous-ou-egal' } } as unknown as Partial<GameDriver>,
            fiche,
        );

        const dit = constats.find(c => c.ou === 'jet.cible.ajustement')!;
        expect(dit.gravite).toBe('avertissement');
        expect(dit.message).toContain('12 composantes lisent la même section');
    });

    it('attrape aussi une section que la fiche ne porte pas', () => {
        const constats = controlerLePilote(
            {
                jet: {
                    cible: {
                        ...cible([]),
                        caracteristique: { id: 'carac', label: 'Caractéristique', sectionId: 'caracteristiques' },
                    },
                    sens: 'sous-ou-egal',
                },
            } as unknown as Partial<GameDriver>,
            fiche,
        );

        expect(constats.some(c => c.ou === 'jet.cible.caracteristique[0].sectionId')).toBe(true);
    });
});

/**
 * Ce que ces tests protègent : **la Revue du Pilote survit à un mauvais
 * pilote.**
 *
 * Le 2026-08-22, la première dérivation qui ait produit une cible a rendu
 * `jet.cible` sans caractéristique. `undefined.sectionId` a fait tomber TOUT
 * l'écran — *celui qui existe précisément pour signaler ce genre de défaut,
 * mis hors service par le défaut qu'il devait nommer.*
 *
 * La règle était pourtant écrite en tête de `DescripteurDeJet` : **aucun champ
 * d'un pilote n'est garanti à l'exécution**, puisqu'il vient d'un modèle de
 * langage. Elle a été enfreinte en ajoutant la cible aux contrôles.
 */
describe('un pilote mal formé se dit, il ne fait pas tomber la revue', () => {
    const fauxPilote = (jet: unknown) => ({ jet } as unknown as Partial<GameDriver>);

    it('survit à une cible sans caractéristique, et la nomme', () => {
        const constats = controlerLePilote(
            fauxPilote({
                cible: {
                    mecanique: 'reves-de-dragons',
                    ajustement: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
                },
                sens: 'sous-ou-egal',
            }),
            fiche,
        );

        const dit = constats.find(c => c.ou === 'jet.cible.caracteristique')!;
        expect(dit.gravite).toBe('erreur');
        expect(dit.message).toContain('zéro pour cent');
    });

    it('survit à une composante vide dans une liste', () => {
        const constats = controlerLePilote(
            fauxPilote({ seuil: [undefined, { id: 'ok', label: 'Ok', sectionId: 'competences' }] }),
            fiche,
        );

        expect(constats.some(c => c.ou === 'jet.seuil[0]')).toBe(true);
    });

    it('survit à une composante sans sectionId', () => {
        const constats = controlerLePilote(
            fauxPilote({ seuil: [{ id: 'orphelin', label: 'Orphelin' }] }),
            fiche,
        );

        expect(constats.some(c => c.ou === 'jet.seuil[0]')).toBe(true);
    });

    /**
     * **Les autres constats valent toujours.** C'est justement quand un pilote
     * est mauvais qu'on a le plus besoin de lire la revue en entier.
     */
    it('continue de contrôler le reste après une entrée fautive', () => {
        const constats = controlerLePilote(
            fauxPilote({
                cible: { mecanique: 'runequest', ajustement: [] },
                sens: 'sous-ou-egal',
            }),
            fiche,
        );

        expect(constats.some(c => c.ou === 'jet.cible.caracteristique')).toBe(true);
        expect(constats.some(c => c.ou === 'jet.cible.mecanique')).toBe(true);
    });
});
