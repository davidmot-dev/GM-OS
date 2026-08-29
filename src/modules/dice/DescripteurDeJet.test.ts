import { describe, it, expect } from 'vitest';
import {
    preparerLeJet, sectionDeLaComposante, sectionsDeLaComposante, verdict,
    type ComposanteDeJet, type DescripteurDeJet,
} from './DescripteurDeJet';
import type { SheetSection } from '../../data/defaultSheetTemplates';
import { DiceEngine } from './DiceEngine';
import { DEFAULT_GAME_DRIVERS } from '../../data/defaultGameDrivers';

/**
 * Ce que ces tests protègent : **un jet lancé depuis la fiche est un jet juste**.
 *
 * Avant le descripteur, un pilote ne pouvait annoncer qu'un seuil constant. Chez
 * Dune il vaut une compétence plus un principe — de 8 à 16 — et l'on y
 * inscrivait 8, le minimum. Tout jet sous-estimait donc le personnage, et rien
 * ne le signalait : le résultat avait l'air d'un résultat.
 */

const dune = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const jetDune = dune.jet!;

/** Un personnage plausible : Combat 6, Devoir 5, Mobilité 7. */
const FICHE = { combat: 6, devoir: 5, mobilite: 7, analyse: 4, determination: 1 };

describe('composition du seuil', () => {
    it('additionne la compétence et le principe retenus', () => {
        const jet = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat', principe: 'devoir' } });

        expect(jet.seuil, 'Combat 6 + Devoir 5').toBe(11);
        expect(jet.composantes).toEqual([
            { label: 'Compétence', champ: 'combat', valeur: 6 },
            { label: 'Principe', champ: 'devoir', valeur: 5 },
        ]);
        expect(jet.avertissements).toEqual([]);
    });

    it('change de seuil quand le joueur invoque un autre principe', () => {
        // C'est tout l'intérêt : « ce que fait le personnage » et « pourquoi il
        // agit » sont deux choix, et le second déplace réellement le seuil.
        const a = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat', principe: 'devoir' } });
        const b = preparerLeJet(jetDune, { ...FICHE, justice: 8 }, { champs: { competence: 'combat', principe: 'justice' } });

        expect(a.seuil).toBe(11);
        expect(b.seuil).toBe(14);
    });

    it('reste dans les bornes du livre', () => {
        // « Seuil minimal : huit. Seuil maximal : seize. »
        const min = preparerLeJet(jetDune, { analyse: 4, foi: 4 }, { champs: { competence: 'analyse', principe: 'foi' } });
        const max = preparerLeJet(jetDune, { analyse: 8, foi: 8 }, { champs: { competence: 'analyse', principe: 'foi' } });

        expect(min.seuil).toBe(8);
        expect(max.seuil).toBe(16);
    });
});

describe('ce qui manque se dit, et n\'empêche pas de lancer', () => {
    /**
     * **Jamais d'exception.** Un champ absent est une erreur de configuration,
     * pas une raison d'empêcher un joueur de lancer en pleine partie. On lance
     * avec ce qu'on a et on dit ce qui manquait — l'inverse de la jauge à zéro
     * qui se tait, qui est le défaut dont vient toute cette série.
     */
    it('signale un champ absent de la fiche sans échouer', () => {
        const jet = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat', principe: 'sagesse' } });

        expect(jet.seuil, 'seul le Combat a pu être lu').toBe(6);
        expect(jet.avertissements).toHaveLength(1);
        expect(jet.avertissements[0]).toContain('sagesse');
        expect(jet.nombreDeDes, 'le jet reste lançable').toBe(2);
    });

    it('signale une composante que le joueur n\'a pas choisie', () => {
        const jet = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat' } });

        expect(jet.avertissements[0]).toContain('Principe');
    });

    /**
     * **Absent et « pas un nombre » ne sont pas la même panne**, et le message
     * les confondait — signalé en réel par David le 2026-08-29 sur Blade Runner.
     *
     * Le menu du jet affichait « Agilité (B (D10)) », le champ était donc là et
     * rempli, et le panneau répondait *« agilite est absent de la fiche »*. Il
     * envoyait chercher un oubli du joueur alors que le fautif est le pilote :
     * il compose un seuil là où ce jeu lance une réserve de dés dont la TAILLE
     * vient de la lettre. *Un message qui désigne le mauvais fautif coûte plus
     * cher qu'un message absent.*
     */
    it('distingue un champ absent d\'un champ qui n\'est pas un nombre', () => {
        const absent = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat', principe: 'sagesse' } });
        expect(absent.avertissements[0]).toContain('est absent de la fiche');

        const bladeRunner = preparerLeJet(
            jetDune,
            { combat: 'B (D10)', devoir: 'D (D6)' },
            { champs: { competence: 'combat', principe: 'devoir' } },
        );

        expect(bladeRunner.avertissements).toHaveLength(2);
        for (const dit of bladeRunner.avertissements) {
            expect(dit, 'le champ est là : ne pas dire qu\'il manque').not.toContain('est absent');
            expect(dit).toContain("n'est pas un nombre");
            // La valeur elle-même dit de quelle mécanique il s'agit.
            expect(dit).toMatch(/« [BD] \(D\d+\) »/);
        }
        expect(bladeRunner.seuil, 'rien de lisible : aucun seuil inventé').toBe(0);
    });

    /** Zéro se lit, et ne doit surtout pas passer pour une absence. */
    it('ne confond pas zéro avec un manque', () => {
        const jet = preparerLeJet(jetDune, { combat: 0, devoir: 5 }, { champs: { competence: 'combat', principe: 'devoir' } });
        expect(jet.avertissements).toEqual([]);
        expect(jet.composantes).toContainEqual({ label: 'Compétence', champ: 'combat', valeur: 0 });
    });
});

describe('réserve de dés', () => {
    it('lance deux dés de base', () => {
        expect(preparerLeJet(jetDune, FICHE, { champs: {} }).nombreDeDes).toBe(2);
    });

    it('ajoute les dés achetés', () => {
        expect(preparerLeJet(jetDune, FICHE, { champs: {}, desSupplementaires: 3 }).nombreDeDes).toBe(5);
    });

    it('plafonne à cinq dés et le dit', () => {
        // « Réserve de dés : de deux à cinq. » Trois achats au maximum.
        const jet = preparerLeJet(jetDune, FICHE, { champs: {}, desSupplementaires: 9 });

        expect(jet.nombreDeDes).toBe(5);
        expect(jet.avertissements.some(a => a.includes('5'))).toBe(true);
    });
});

describe('difficulté', () => {
    it('ramène une difficulté hors bornes dans l\'intervalle du livre', () => {
        // « Difficulté : de zéro à cinq. »
        const jet = preparerLeJet(jetDune, FICHE, { champs: {}, difficulte: 12 });

        expect(jet.difficulte).toBe(5);
        expect(jet.avertissements.some(a => a.includes('0') && a.includes('5'))).toBe(true);
    });

    it('tranche la réussite et rend l\'excédent', () => {
        // Les réussites au-delà de la difficulté deviennent de l'Impulsion.
        expect(verdict(4, 2)).toEqual({ reussi: true, excedent: 2 });
        expect(verdict(1, 2)).toEqual({ reussi: false, excedent: 0 });
    });

    it('un jeu sans difficulté déclarée ne s\'en voit pas imposer une', () => {
        /**
         * **Le plantage du 2026-08-15, à l'ouverture d'une fiche d'Alien** :
         * *« Cannot read properties of undefined (reading 'defaut') »*.
         *
         * `difficulte` était obligatoire dans le type parce que Dune en a une,
         * de 0 à 5. Mais **Alien compte les six et réussir n'en demande qu'un**
         * — son pilote n'en déclare donc aucune, à juste titre. Encore un champ
         * tenu pour universel parce qu'un seul jeu s'en servait.
         *
         * Sans bornes, il n'y a rien à borner : la difficulté vaut ce que le
         * meneur demande, et zéro à défaut. Aucun avertissement, puisque rien
         * n'a été ramené.
         */
        const alien: DescripteurDeJet = {
            seuil: [],
            reserve: { base: 1, max: 10, faces: 6 },
            sens: 'superieur-ou-egal',
        };

        const parDefaut = preparerLeJet(alien, FICHE, { champs: {} });
        expect(parDefaut.difficulte).toBe(0);
        expect(parDefaut.avertissements.some(a => a.includes('Difficulté'))).toBe(false);

        // Le meneur reste libre d'en demander une : elle n'est simplement pas bornée.
        expect(preparerLeJet(alien, FICHE, { champs: {}, difficulte: 3 }).difficulte).toBe(3);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Le jet réellement lancé
// ─────────────────────────────────────────────────────────────────────────────

describe('le moteur compte SOUS le seuil', () => {
    /**
     * **Le défaut mesuré le 2026-08-10.** Le moteur `2d20` comptait les dés
     * au-dessus du seuil : sur 4 000 dés au seuil 12, il rendait 1 859 réussites
     * — exactement celles qu'il fallait rejeter. Toute la famille 2d20 de
     * Modiphius compte l'inverse, c'est la définition du système.
     */
    it('un dé sous le seuil réussit, un dé au-dessus échoue', () => {
        const resultats = Array.from({ length: 400 }, () =>
            DiceEngine.rollFromConfig(
                { defaultDice: '2d20', logic: 'count-success', successThreshold: 11, engine: '2d20' },
                { baseCount: 2 },
            ),
        );

        for (const r of resultats) {
            for (const de of r.rolls) {
                const v = typeof de.val === 'number' ? de.val : 0;
                expect(de.isCritMax, `le dé ${v} face au seuil 11`).toBe(v <= 11);
            }
        }
    });

    it('le 1 naturel vaut deux réussites', () => {
        // « Réussite critique standard : un naturel, valant deux réussites. »
        // Auparavant le 1 était compté comme un fléau et RETRANCHÉ du total.
        let vuUnUn = false;
        for (let i = 0; i < 600 && !vuUnUn; i++) {
            const r = DiceEngine.rollPool(20, 5, 0, 11, false, { sens: 'under', doubleSous: 1 });
            const uns = r.rolls.filter(d => d.val === 1).length;
            const autresReussites = r.rolls.filter(d => typeof d.val === 'number' && d.val !== 1 && d.val <= 11).length;
            if (uns > 0) {
                vuUnUn = true;
                expect(r.successes, `${uns} × 1 + ${autresReussites} autres`).toBe(uns * 2 + autresReussites);
                expect(r.fails, 'un 1 n\'est pas un fléau en comptage « sous »').toBe(0);
            }
        }
        expect(vuUnUn, 'aucun 1 tiré en 600 lancers de 5d20 — improbable').toBe(true);
    });

    it('la spécialisation élargit le critique à la compétence seule', () => {
        // « Réussite critique spécialisée : résultat inférieur ou égal à la
        // compétence, valant deux réussites. » Combat 6 → tout dé ≤ 6 vaut 2.
        const r = DiceEngine.rollPool(20, 5, 0, 11, false, { sens: 'under', doubleSous: 6 });
        const attendu = r.rolls.reduce((acc, d) => {
            const v = typeof d.val === 'number' ? d.val : 21;
            return acc + (v <= 6 ? 2 : v <= 11 ? 1 : 0);
        }, 0);
        expect(r.successes).toBe(attendu);
    });

    it('ne change rien aux réserves qui comptent au-dessus', () => {
        // Year Zero, Vampire et consorts : le comportement d'origine est le
        // défaut, et il ne bouge pas.
        const r = DiceEngine.rollPool(6, 10, 0, 5, false);
        for (const d of r.rolls) {
            const v = typeof d.val === 'number' ? d.val : 0;
            expect(d.isCritMax).toBe(v >= 5);
        }
    });
});

describe('de la fiche aux dés, bout en bout', () => {
    it('un personnage Combat 6 / Devoir 5 lance 2d20 sous 11', () => {
        const jet = preparerLeJet(jetDune, FICHE, {
            champs: { competence: 'combat', principe: 'devoir' },
            difficulte: 2,
        });

        const resultat = DiceEngine.rollFromConfig(
            { defaultDice: '2d20', logic: 'count-success', successThreshold: jet.seuil, engine: '2d20' },
            { baseCount: jet.nombreDeDes, doubleSous: jet.doubleSous },
        );

        expect(resultat.rolls).toHaveLength(2);
        const attendu = resultat.rolls.reduce((acc, d) => {
            const v = typeof d.val === 'number' ? d.val : 21;
            return acc + (v <= 1 ? 2 : v <= 11 ? 1 : 0);
        }, 0);
        expect(resultat.successes).toBe(attendu);

        const v = verdict(resultat.successes ?? 0, jet.difficulte);
        expect(typeof v.reussi).toBe('boolean');
    });

    it('les champs du descripteur existent tous dans la fiche de référence', async () => {
        /**
         * Le descripteur désigne des **sections** de la fiche ; si elles n'y sont
         * pas, le joueur n'aura rien à choisir et le seuil vaudra zéro — en
         * silence. C'est la même chaîne d'identifiants que celle des jauges.
         */
        const { DEFAULT_SHEET_TEMPLATES } = await import('../../data/defaultSheetTemplates');
        const fiche = DEFAULT_SHEET_TEMPLATES.find(t => t.id === dune.templateId)!;
        const sections = new Set(fiche.sections.map(s => s.id));

        for (const composante of jetDune.seuil ?? []) {
            expect(sections.has(composante.sectionId), `section « ${composante.sectionId} » absente de la fiche`).toBe(true);
        }
    });
});

describe('le descripteur réel d\'Alien, tel que la Forge le produit', () => {
    /**
     * **Deux plantages successifs le 2026-08-15, à l'ouverture d'une fiche.**
     * D'abord `difficulte` manquant, puis `seuil`. Chaque fois, j'ai corrigé le
     * champ signalé au lieu de confronter le descripteur **entier** au pilote
     * réel — ce qui a fait perdre un aller-retour à David.
     *
     * D'où ce test : le descripteur d'Alien tel qu'il est **réellement
     * enregistré**, sans seuil ni difficulté, avec sa seule réserve. Il n'a
     * jamais existé dans la suite parce qu'aucun pilote de test n'omettait ces
     * champs — la limite d'une suite écrite à partir des cas qu'on connaît.
     *
     * *Un pilote est forgé par un modèle de langage : le type dit ce qu'on
     * espère, jamais ce qu'on reçoit.*
     */
    const alien: DescripteurDeJet = {
        reserve: { base: 1, max: 10, faces: 6 },
        sens: 'superieur-ou-egal',
    };

    it('se prépare sans seuil ni difficulté', () => {
        const jet = preparerLeJet(alien, FICHE, { champs: {} });

        expect(jet.seuil, 'rien à composer depuis la fiche').toBe(0);
        expect(jet.composantes).toEqual([]);
        expect(jet.difficulte).toBe(0);
        expect(jet.nombreDeDes, 'un dé de base, comme le pilote le déclare').toBe(1);
        expect(jet.faces).toBe(6);
        expect(jet.avertissements).toEqual([]);
    });

    it('les dés supplémentaires restent plafonnés à la réserve', () => {
        expect(preparerLeJet(alien, FICHE, { champs: {}, desSupplementaires: 20 }).nombreDeDes).toBe(10);
    });

    it('un descripteur réduit au strict minimum ne fait rien exploser', () => {
        /**
         * Le pire cas : un modèle qui n'aurait rendu que le sens. On ne
         * **fabrique pas** de dés pour sauver l'écran — un jet inventé a l'air
         * d'un jet — mais on le dit, et rien ne plante.
         */
        const presqueVide = { sens: 'superieur-ou-egal' } as DescripteurDeJet;
        const jet = preparerLeJet(presqueVide, FICHE, { champs: {} });

        expect(jet.nombreDeDes).toBe(0);
        expect(jet.faces).toBe(0);
        expect(jet.cout).toEqual({ total: 0, ressource: undefined });
        expect(jet.avertissements.some(a => a.includes('réserve'))).toBe(true);
    });
});

describe('un système sans descripteur continue de fonctionner', () => {
    it('le champ est facultatif', () => {
        // Les pilotes antérieurs n'en ont pas ; ils ne doivent pas se casser.
        const sansJet: DescripteurDeJet | undefined = undefined;
        expect(sansJet).toBeUndefined();
        expect(DEFAULT_GAME_DRIVERS.every(d => d.jet === undefined || (d.jet.seuil ?? []).length > 0)).toBe(true);
    });
});

describe('le pilote désigne une section, la fiche la nomme autrement', () => {
    /**
     * **Le défaut, relevé par David le 2026-08-15 sur sa fiche de Dune.** Les
     * deux menus « Compétence » et « Principe » étaient vides, et le panneau
     * répondait *« aucun champ retenu »* — comme s'il avait négligé de choisir.
     * Il n'y avait rien à choisir.
     *
     * Les sections ci-dessous sont **celles de son gabarit persisté**
     * (`tpl-1774724573418`), relevées dans son IndexedDB : son pilote réclame
     * `competences` et `principes`, les identifiants du gabarit de référence
     * livré dans le code, alors qu'il est attaché à cette fiche-là.
     *
     * *Vérifier sur la charge réelle, jamais sur un exemple qu'on a écrit
     * soi-même* — un cas inventé aurait porté les bons identifiants.
     */
    const SECTIONS_DE_DAVID: SheetSection[] = [
        { id: 'identity', label: 'Identité', fields: [
            { id: 'char_name', label: 'Nom', type: 'text', defaultValue: '' },
        ] },
        { id: 'stats', label: 'Compétences', fields: [
            { id: 'analyse', label: 'Analyse', type: 'number', defaultValue: 4 },
            { id: 'combat', label: 'Combat', type: 'number', defaultValue: 4 },
        ] },
        { id: 'principles', label: 'Principes & Maximes', fields: [
            { id: 'devotion', label: 'Devoir', type: 'number', defaultValue: 5 },
            { id: 'justice', label: 'Justice', type: 'number', defaultValue: 4 },
        ] },
    ];

    it('reconnaît la section à son intitulé quand l\'identifiant a dérivé', () => {
        const competence = sectionDeLaComposante(SECTIONS_DE_DAVID, jetDune.seuil![0]);
        const principe = sectionDeLaComposante(SECTIONS_DE_DAVID, jetDune.seuil![1]);

        expect(competence.section?.id, '« competences » → « Compétences »').toBe('stats');
        expect(competence.par).toBe('label');
        expect(principe.section?.id, '« principes » → « Principes & Maximes »').toBe('principles');
        expect(principe.par).toBe('label');
    });

    it('le jet se compose alors normalement, et la dérive se dit', () => {
        const jet = preparerLeJet(
            jetDune,
            { combat: 6, devotion: 5 },
            { champs: { competence: 'combat', principe: 'devotion' } },
            SECTIONS_DE_DAVID,
        );

        expect(jet.seuil, 'Combat 6 + Devoir 5').toBe(11);
        expect(jet.avertissements, 'rien ne doit empêcher de lancer').toEqual([]);
        expect(jet.remarques).toHaveLength(2);
        expect(jet.remarques[0]).toContain('stats');
    });

    it('l\'identifiant exact l\'emporte toujours, et ne remarque rien', () => {
        // La résolution par intitulé est un rattrapage, pas une préférence : un
        // pilote juste ne doit pas voir sa section changer sous ses pieds.
        const sections: SheetSection[] = [
            { id: 'competences', label: 'Rien à voir', fields: [] },
            ...SECTIONS_DE_DAVID,
        ];
        const retenue = sectionDeLaComposante(sections, jetDune.seuil![0]);

        expect(retenue.section?.id).toBe('competences');
        expect(retenue.par).toBe('id');
    });

    it('ne tranche jamais entre deux sections qui répondent au même nom', () => {
        /**
         * *L'outil suit l'état, il n'arbitre pas.* Trois sections de compétences
         * — c'est la fiche de Rêve de Dragon — et l'outil n'a aucun moyen de
         * savoir laquelle le pilote visait. Il le dit, un humain tranche.
         */
        const reveDeDragon: SheetSection[] = [
            { id: 'competences_generales', label: 'Compétences Générales', fields: [] },
            { id: 'competences_particulieres', label: 'Compétences Particulières', fields: [] },
        ];
        const retenue = sectionDeLaComposante(reveDeDragon, jetDune.seuil![0]);

        expect(retenue.section).toBeNull();
        expect(retenue.ambigues).toHaveLength(2);
    });

    it('une section introuvable accuse le pilote, pas le joueur', () => {
        const jet = preparerLeJet(
            jetDune, {}, { champs: {} },
            [{ id: 'identity', label: 'Identité', fields: [] }],
        );

        expect(jet.avertissements[0]).toContain('le pilote désigne');
        expect(jet.avertissements[0]).toContain('competences');
        expect(
            jet.avertissements.some(a => a.includes('aucun champ retenu')),
            "on ne reproche pas au joueur de n'avoir pas choisi dans un menu vide",
        ).toBe(false);
    });

    it('sans sections fournies, rien ne change pour les appelants d\'avant', () => {
        const jet = preparerLeJet(jetDune, FICHE, { champs: { competence: 'combat', principe: 'devoir' } });

        expect(jet.seuil).toBe(11);
        expect(jet.avertissements).toEqual([]);
        expect(jet.remarques).toEqual([]);
    });
});

describe('la réserve se compose depuis la fiche — le dernier mur', () => {
    /**
     * **La règle, telle que le corpus d'Alien l'écrit** (`resolution-des-jets.md`,
     * fiche v3) : *« Pour agir, on lance des dés de base égaux à son attribut
     * plus sa compétence, ou ses seuls dés d'attribut. S'y ajoute un nombre de
     * dés de stress égal au Niveau de Stress actuel. »*
     *
     * Le descripteur ne savait composer que des **seuils**. Le pilote n'avait
     * donc qu'un nombre fixe à offrir, et tous les personnages entraient dans la
     * scène avec la même poignée de dés — sans que rien ne le dise.
     *
     * La preuve que le modèle avait compris la règle est dans le journal du
     * 2026-08-12 : il a rendu `base: "attribut+comp_level"`. C'est l'invite qui
     * lui commandait ensuite d'y renoncer — *« en NOMBRES et jamais en
     * formule »*.
     */
    const alien: DescripteurDeJet = {
        reserve: {
            base: 0,
            composantes: [
                { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
                { id: 'competence', label: 'Compétence', sectionId: 'competences' },
            ],
            max: 10,
            faces: 6,
        },
        sens: 'superieur-ou-egal',
    };

    const RIPLEY = { force: 4, agilite: 3, pilotage: 2, combat_rapproche: 1 };

    it('lance attribut + compétence, et le dit', () => {
        const jet = preparerLeJet(alien, RIPLEY, {
            champs: { attribut: 'force', competence: 'combat_rapproche' },
        });

        expect(jet.nombreDeDes, 'Force 4 + Combat rapproché 1').toBe(5);
        expect(jet.composantesDeLaReserve).toEqual([
            { label: 'Attribut', champ: 'force', valeur: 4 },
            { label: 'Compétence', champ: 'combat_rapproche', valeur: 1 },
        ]);
        expect(jet.avertissements).toEqual([]);
    });

    it('deux personnages n\'entrent pas dans la scène avec la même réserve', () => {
        // C'est tout l'objet du mur : avant, `base` était un nombre du système.
        const fort = preparerLeJet(alien, RIPLEY, { champs: { attribut: 'force', competence: 'pilotage' } });
        const agile = preparerLeJet(alien, RIPLEY, { champs: { attribut: 'agilite', competence: 'pilotage' } });

        expect(fort.nombreDeDes).toBe(6);
        expect(agile.nombreDeDes).toBe(5);
    });

    it('« ses seuls dés d\'attribut » — une compétence à zéro reste une réserve', () => {
        const jet = preparerLeJet(alien, { ...RIPLEY, xenologie: 0 }, {
            champs: { attribut: 'force', competence: 'xenologie' },
        });
        expect(jet.nombreDeDes).toBe(4);
        expect(jet.avertissements, 'zéro est une valeur lue, pas un manque').toEqual([]);
    });

    it('le plafond du système s\'applique à la réserve composée', () => {
        const colosse = preparerLeJet(alien, { force: 8, athletisme: 7 }, {
            champs: { attribut: 'force', competence: 'athletisme' },
        });
        expect(colosse.nombreDeDes, 'plafonné à dix').toBe(10);
        expect(colosse.avertissements.some(a => a.includes('plafonnée'))).toBe(true);
    });

    it('la base s\'ajoute aux composantes, pour un jeu qui garantit un dé', () => {
        const avecBase = { ...alien, reserve: { ...alien.reserve!, base: 1 } };
        const jet = preparerLeJet(avecBase, RIPLEY, {
            champs: { attribut: 'force', competence: 'pilotage' },
        });
        expect(jet.nombreDeDes, '1 + Force 4 + Pilotage 2').toBe(7);
    });

    it('un champ non retenu se dit, et n\'invente pas de dés', () => {
        const jet = preparerLeJet(alien, RIPLEY, { champs: { attribut: 'force' } });

        expect(jet.nombreDeDes, 'la Force seule, sans compétence inventée').toBe(4);
        expect(jet.avertissements.some(a => a.includes('Compétence'))).toBe(true);
    });

    it('les dés achetés se comptent au-delà de la réserve du personnage', () => {
        const jet = preparerLeJet(alien, RIPLEY, {
            champs: { attribut: 'force', competence: 'pilotage' },
            desSupplementaires: 2,
        });
        expect(jet.nombreDeDes, '4 + 2 + 2 achetés').toBe(8);
        expect(jet.desAchetes).toBe(2);
    });

    it('un pilote sans composantes garde exactement son comportement d\'avant', () => {
        // Les pilotes déjà forgés portent une réserve à base fixe : ils ne
        // doivent rien voir changer.
        const ancien: DescripteurDeJet = {
            reserve: { base: 1, max: 10, faces: 6 },
            sens: 'superieur-ou-egal',
        };
        const jet = preparerLeJet(ancien, RIPLEY, { champs: {} });

        expect(jet.nombreDeDes).toBe(1);
        expect(jet.composantesDeLaReserve).toEqual([]);
        expect(jet.avertissements).toEqual([]);
    });
});

describe('les dés de stress se comptent à part', () => {
    /**
     * **La question de David, le 2026-08-15** : *« dans Alien, dans la réserve
     * de dés on doit aussi rajouter le stress — est-ce que tu vas traiter cela
     * correctement ? »*
     *
     * Pas en l'ajoutant comme une composante ordinaire. Le corpus
     * (`resolution-des-jets.md`) écrit : *« S'y ajoute un nombre de dés de
     * stress égal au Niveau de Stress actuel. »* Et sur ces dés-là, **un 1
     * déclenche la Panique**, ce qu'un dé de base ne fait jamais.
     *
     * Les fondre dans la première réserve donnerait le bon **nombre** de dés et
     * perdrait la **mécanique** : le compte des réussites serait juste, et la
     * Panique ne se déclencherait jamais. *Un jet qui rend le bon total en
     * perdant sa règle est le pire des deux mondes — il a l'air juste.*
     */
    const alien: DescripteurDeJet = {
        reserve: {
            base: 0,
            composantes: [
                { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
                { id: 'competence', label: 'Compétence', sectionId: 'competences' },
            ],
            max: 10,
            faces: 6,
            secondaire: {
                label: 'Stress',
                composantes: [{ id: 'stress', label: 'Stress', sectionId: 'jauges' }],
                libelleDuUn: 'Panique',
            },
        },
        sens: 'superieur-ou-egal',
    };

    const RIPLEY = { force: 4, pilotage: 2, niveau_de_stress: 3 };
    const CHOIX = { champs: { attribut: 'force', competence: 'pilotage', stress: 'niveau_de_stress' } };

    it('les deux poules se comptent séparément', () => {
        const jet = preparerLeJet(alien, RIPLEY, CHOIX);

        expect(jet.nombreDeDes, 'Force 4 + Pilotage 2').toBe(6);
        expect(jet.desSecondaires, 'Niveau de Stress 3').toBe(3);
        expect(jet.composantesDeLaSecondeReserve).toEqual([
            { label: 'Stress', champ: 'niveau_de_stress', valeur: 3 },
        ]);
    });

    it('le stress échappe au plafond de la réserve de base', () => {
        /**
         * Chez Alien le stress s'ajoute **par-dessus** : le borner reviendrait à
         * effacer la pression que le jeu met précisément là.
         */
        const tendu = preparerLeJet(alien, { force: 5, pilotage: 5, niveau_de_stress: 8 }, CHOIX);

        expect(tendu.nombreDeDes, 'la base plafonne à dix').toBe(10);
        expect(tendu.desSecondaires, 'le stress, lui, ne plafonne pas').toBe(8);
    });

    it('sans stress, la seconde poule est vide et le jet ne change pas', () => {
        const calme = preparerLeJet(alien, { ...RIPLEY, niveau_de_stress: 0 }, CHOIX);

        expect(calme.desSecondaires).toBe(0);
        expect(calme.nombreDeDes).toBe(6);
        expect(calme.avertissements).toEqual([]);
    });

    it('un pilote sans seconde poule rend zéro, et rien ne change pour lui', () => {
        const sansStress: DescripteurDeJet = {
            reserve: { base: 1, max: 10, faces: 6 },
            sens: 'superieur-ou-egal',
        };
        const jet = preparerLeJet(sansStress, RIPLEY, { champs: {} });

        expect(jet.desSecondaires).toBe(0);
        expect(jet.composantesDeLaSecondeReserve).toEqual([]);
    });

    it('le moteur reçoit bien deux poules, et ses 1 ne comptent que sur la seconde', () => {
        /**
         * La vérification qui compte : ce n'est pas une supposition sur
         * `rollYZE`, c'est sa sortie. Les dés de la seconde poule portent
         * `source: 'gear'` et leurs 1 alimentent `fails` — le compte que le
         * panneau affiche sous le nom que le pilote donne, « Panique ».
         */
        const jet = preparerLeJet(alien, RIPLEY, CHOIX);
        const res = DiceEngine.rollFromConfig(
            { defaultDice: '1d6', logic: 'count-success', engine: 'yze' },
            { baseCount: jet.nombreDeDes, gearCount: jet.desSecondaires },
        );

        expect(res.rolls).toHaveLength(9);
        expect(res.rolls.filter(d => d.source === 'base')).toHaveLength(6);
        expect(res.rolls.filter(d => d.source === 'gear')).toHaveLength(3);
        expect(res.fails, 'seuls les 1 de la seconde poule comptent').toBe(
            res.rolls.filter(d => d.source === 'gear' && d.val === 1).length,
        );
    });
});

describe('combien de réussites il faut vraiment', () => {
    /**
     * **Relevé par David le 2026-08-15, capture à l'appui.** Un jet d'Alien à
     * deux six annonçait *« 2 réussites / difficulté 0 »* et **deux excédents**.
     * Il n'y en a qu'un : le premier six **est** la réussite, les suivants sont
     * le surplus.
     *
     * Alien ne gradue pas ses tests — son pilote ne déclare aucune difficulté —
     * et `difficulte` retombait à zéro. Or zéro n'est pas la règle du jeu : la
     * fiche dit « réussir exige d'obtenir au moins un six ». *Zéro déclaré et
     * zéro par absence ne sont pas la même valeur.*
     *
     * Le défaut jumeau était plus grave et parfaitement invisible : un jet sans
     * aucun six s'affichait **« RÉUSSITE »**.
     */
    const alien: DescripteurDeJet = {
        reserve: { base: 1, max: 10, faces: 6 },
        sens: 'superieur-ou-egal',
    };

    it('sans difficulté déclarée, il en faut une — et une seule', () => {
        const jet = preparerLeJet(alien, {}, { champs: {} });
        expect(jet.reussitesRequises).toBe(1);
    });

    it('deux six sur Alien font UN excédent, pas deux', () => {
        const jet = preparerLeJet(alien, {}, { champs: {} });
        expect(verdict(2, jet.reussitesRequises)).toEqual({ reussi: true, excedent: 1 });
    });

    it('aucun six n\'est pas une réussite — le défaut le plus silencieux', () => {
        const jet = preparerLeJet(alien, {}, { champs: {} });
        expect(verdict(0, jet.reussitesRequises).reussi).toBe(false);
    });

    it('un jeu qui gradue ses tests garde sa difficulté, zéro compris', () => {
        /**
         * Chez Dune la difficulté 0 est une valeur **déclarée** — une tâche
         * automatiquement réussie —, pas une absence. On ne lui impose donc pas
         * la réussite minimale d'Alien.
         */
        const facile = preparerLeJet(jetDune, FICHE, { champs: {}, difficulte: 0 });
        expect(facile.reussitesRequises).toBe(0);
        expect(verdict(0, facile.reussitesRequises).reussi, 'D0 passe sans réussite').toBe(true);

        const ardu = preparerLeJet(jetDune, FICHE, { champs: {}, difficulte: 3 });
        expect(ardu.reussitesRequises).toBe(3);
        expect(verdict(5, ardu.reussitesRequises)).toEqual({ reussi: true, excedent: 2 });
    });
});

/**
 * **Le mur du 2026-08-22 : une cible qui se calcule au lieu de s'additionner.**
 *
 * Le descripteur ne savait qu'additionner. Chez Rêves de Dragons, la compétence
 * n'est pas dans l'ordonnée de la table, elle est dans l'abscisse : elle
 * déplace la colonne, donc elle multiplie. Agilité 12 avec +3 vaut 78 % et non
 * 15 — *facteur cinq, et rien ne le disait.*
 */
describe('une cible qui se calcule', () => {
    /** Un pilote qui nomme sa mécanique et ne porte aucun de ses nombres. */
    const jetRdD: DescripteurDeJet = {
        cible: {
            mecanique: 'reves-de-dragons',
            caracteristique: { id: 'carac', label: 'Caractéristique', sectionId: 'caracs' },
            ajustement: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
        },
        reserve: { base: 1, max: 1, faces: 100 },
        sens: 'sous-ou-egal',
    };

    const FICHE_RDD = { agilite: 12, discretion: 3, vue: 14 };
    const retenus = { champs: { carac: 'agilite', competence: 'discretion' } };

    /**
     * **Le piège des deux « difficulté », vu sur l'écran de David le 2026-08-23.**
     *
     * `cible` déplace la colonne d'une table, `difficulte` compte des réussites
     * à atteindre — même mot, mécaniques sans rapport. Son pilote de Rêves de
     * Dragons redérivé déclarait **les deux**, et le panneau affichait donc deux
     * réglages homonymes côte à côte.
     *
     * Exiger deux réussites d'un seul d100 condamnerait tous les jets. Quand la
     * cible décide, on en demande **une**, quoi que le pilote traîne.
     */
    it("ignore un compte de réussites quand une cible décide", () => {
        const avecLesDeux: DescripteurDeJet = {
            ...jetRdD,
            difficulte: { min: 0, max: 5, defaut: 0 },
        };

        // Une difficulté que le meneur aurait poussée à deux : sans la garde,
        // `reussitesRequises` vaudrait 2 pour un unique dé.
        const jet = preparerLeJet(avecLesDeux, FICHE_RDD, { ...retenus, difficulte: 2 });

        expect(jet.reussitesRequises, 'un seul d100, une seule réussite').toBe(1);
        expect(jet.seuil, 'et la cible reste juste').toBe(78);
    });

    /** Sans cible, le compte de réussites reprend tous ses droits — Dune. */
    it('garde le compte de réussites quand aucune cible ne décide', () => {
        const compteur: DescripteurDeJet = {
            seuil: [{ id: 'carac', label: 'Caractéristique', sectionId: 'caracs' }],
            reserve: { base: 2, max: 5, faces: 20 },
            sens: 'sous-ou-egal',
            difficulte: { min: 0, max: 5, defaut: 0 },
        };
        const jet = preparerLeJet(compteur, FICHE_RDD, { champs: { carac: 'agilite' }, difficulte: 2 });
        expect(jet.reussitesRequises).toBe(2);
    });

    it('multiplie au lieu d’additionner — le défaut d’origine', () => {
        const jet = preparerLeJet(jetRdD, FICHE_RDD, retenus);

        expect(jet.seuil, 'Agilité 12 × 6,5').toBe(78);
        expect(jet.seuil, "et surtout pas l'addition").not.toBe(15);
        expect(jet.avertissements).toEqual([]);
    });

    it('montre d’où sort le nombre, sans jamais écrire « + »', () => {
        const jet = preparerLeJet(jetRdD, FICHE_RDD, retenus);

        expect(jet.explicationDuSeuil).toBe('12 × 6,5 (ajustement +3)');
        expect(jet.explicationDuSeuil).not.toContain('+ 3');
        // Les composantes restent lisibles : le joueur voit ce qu'il a retenu.
        expect(jet.composantes.map(c => c.champ)).toEqual(['agilite', 'discretion']);
    });

    it('laisse la difficulté du meneur déplacer la colonne', () => {
        const facile = preparerLeJet(jetRdD, FICHE_RDD, { ...retenus, ajustementDeDifficulte: 2 });
        const ardu = preparerLeJet(jetRdD, FICHE_RDD, { ...retenus, ajustementDeDifficulte: -4 });

        expect(facile.seuil, 'ajustement +5 : ×7,5').toBe(90);
        expect(ardu.seuil, 'ajustement −1 : ×4,5').toBe(54);
    });

    it('ne confond pas l’ajustement avec le nombre de réussites requises', () => {
        // `difficulte` compte des réussites — hérité de Dune. Sur un jeu en
        // pourcentage il ne doit RIEN déplacer : même mot, mécanique sans
        // rapport, et les faire partager un champ scellerait le piège.
        const avec = preparerLeJet(jetRdD, FICHE_RDD, { ...retenus, difficulte: 3 });

        expect(avec.seuil).toBe(78);
    });

    it('l’emporte sur un seuil additionné, si un pilote déclare les deux', () => {
        const confus: DescripteurDeJet = {
            ...jetRdD,
            seuil: [{ id: 'autre', label: 'Autre', sectionId: 'caracs' }],
        };
        const jet = preparerLeJet(confus, FICHE_RDD, { champs: { ...retenus.champs, autre: 'vue' } });

        expect(jet.seuil, 'la mécanique décide, pas la somme').toBe(78);
    });

    it('refuse d’inventer un pourcentage sur une mécanique inconnue', () => {
        const inconnu = {
            ...jetRdD,
            cible: { ...jetRdD.cible!, mecanique: 'runequest' as unknown as 'reves-de-dragons' },
        };
        const jet = preparerLeJet(inconnu, FICHE_RDD, retenus);

        expect(jet.seuil).toBe(0);
        expect(jet.avertissements[0]).toContain('runequest');
    });

    it('dit ce qu’il a supposé quand il sort de la table', () => {
        const jet = preparerLeJet(jetRdD, { agilite: 12, discretion: 14 }, retenus);

        expect(jet.remarques.join(' ')).toMatch(/s'arrête à \+10/);
        expect(jet.avertissements, 'une remarque n’empêche pas de lancer').toEqual([]);
    });
});

describe('sous-groupes de la fiche', () => {
    /**
     * *Le mur du 2026-08-23, signalé par David sur Rêves de Dragons.* Les
     * compétences y sont découpées en sous-groupes — et un sous-groupe **est**
     * une section de la fiche. Une composante qui n'en nommait qu'une ne pouvait
     * offrir qu'une partie des compétences du personnage : les autres étaient
     * sur sa fiche, visibles, et absentes du menu du jet.
     *
     * La fixture est celle du test « ne tranche jamais entre deux sections »
     * plus haut, complétée : c'est le même corpus, vu depuis la solution.
     */
    const FICHE_RDD: SheetSection[] = [
        { id: 'caracteristiques', label: 'Caractéristiques', fields: [
            { id: 'agilite', label: 'Agilité', type: 'number', defaultValue: 12 },
        ] },
        { id: 'competences_generales', label: 'Compétences Générales', fields: [
            { id: 'esquive', label: 'Esquive', type: 'number', defaultValue: 3 },
        ] },
        { id: 'competences_particulieres', label: 'Compétences Particulières', fields: [
            { id: 'acrobatie', label: 'Acrobatie', type: 'number', defaultValue: 5 },
        ] },
        { id: 'competences_combat', label: 'Compétences de Combat', fields: [
            { id: 'melee', label: 'Mêlée', type: 'number', defaultValue: 7 },
        ] },
    ];

    const COMPETENCE: ComposanteDeJet = {
        id: 'competence', label: 'Compétence',
        sectionId: 'competences_generales',
        sectionsSupplementaires: ['competences_particulieres', 'competences_combat'],
    };

    // La réserve est déclarée : sans elle, chaque jet porterait en plus
    // « le pilote ne décrit aucune réserve de dés », qui n'a rien à voir avec
    // les sous-groupes et masquerait ce que ces tests mesurent.
    const JET_RDD: DescripteurDeJet = {
        seuil: [COMPETENCE], sens: 'sous-ou-egal',
        reserve: { base: 1, max: 1, faces: 100 },
    };

    it('rend les sous-groupes dans l ordre declare, sans doublon', () => {
        const trouvees = sectionsDeLaComposante(FICHE_RDD, COMPETENCE);

        expect(trouvees.sections.map(s => s.id)).toEqual([
            'competences_generales', 'competences_particulieres', 'competences_combat',
        ]);
        expect(trouvees.introuvables).toEqual([]);
    });

    it('ne rend pas deux fois la section quand elle est declaree deux fois', () => {
        // Le pilote se corrige à la main : rien n'empêche d'y laisser un doublon,
        // et le menu du jet proposerait alors deux fois le même sous-groupe.
        const trouvees = sectionsDeLaComposante(FICHE_RDD, {
            ...COMPETENCE, sectionsSupplementaires: ['competences_generales', 'competences_combat'],
        });

        expect(trouvees.sections.map(s => s.id)).toEqual([
            'competences_generales', 'competences_combat',
        ]);
    });

    it('nomme le sous-groupe introuvable, au lieu de les compter', () => {
        // « trois sections introuvables » n'aide personne ; « la section combat
        // est introuvable » se corrige.
        const trouvees = sectionsDeLaComposante(FICHE_RDD, {
            ...COMPETENCE, sectionsSupplementaires: ['competences_draconiques'],
        });

        expect(trouvees.sections.map(s => s.id)).toEqual(['competences_generales']);
        expect(trouvees.introuvables).toEqual(['competences_draconiques']);
    });

    it('le jet se compose depuis N IMPORTE LEQUEL des sous-groupes', () => {
        /*
          Le cœur du chantier : avant, « Mêlée » n'était proposable nulle part
          parce qu'elle vit dans un autre sous-groupe que celui que le pilote
          nommait. Le joueur la voyait sur sa fiche et pas dans son menu.
        */
        const valeurs = { esquive: 3, acrobatie: 5, melee: 7 };

        const enMelee = preparerLeJet(JET_RDD, valeurs, { champs: { competence: 'melee' } }, FICHE_RDD);
        const enEsquive = preparerLeJet(JET_RDD, valeurs, { champs: { competence: 'esquive' } }, FICHE_RDD);

        expect(enMelee.seuil).toBe(7);
        expect(enEsquive.seuil).toBe(3);
        expect(enMelee.avertissements).toEqual([]);
    });

    it('un sous-groupe manquant AVERTIT sans empecher de lancer', () => {
        /*
          **Un menu plus court qu'il ne devrait est indiscernable d'un menu
          complet.** Le joueur peut choisir dans les sous-groupes qui répondent ;
          les compétences de celui qui manque sont sur sa fiche et n'apparaissent
          nulle part. Le taire serait le pire des deux.
        */
        const jet = preparerLeJet(
            { ...JET_RDD, seuil: [{ ...COMPETENCE, sectionsSupplementaires: ['competences_draconiques'] }] },
            { esquive: 3 }, { champs: { competence: 'esquive' } }, FICHE_RDD,
        );

        expect(jet.seuil, 'le jet se compose quand même').toBe(3);
        expect(jet.avertissements).toHaveLength(1);
        expect(jet.avertissements[0]).toContain('competences_draconiques');
    });

    it('aucun sous-groupe ne repond : la composante ne rentre pas dans le calcul', () => {
        const jet = preparerLeJet(
            { ...JET_RDD, seuil: [{
                ...COMPETENCE, sectionId: 'inexistante', sectionsSupplementaires: ['inexistante_aussi'],
            }] },
            { esquive: 3 }, { champs: { competence: 'esquive' } }, FICHE_RDD,
        );

        expect(jet.seuil, "rien à additionner").toBe(0);
        expect(jet.avertissements).toHaveLength(2);
        expect(jet.avertissements.join(' ')).toContain('inexistante_aussi');
    });

    it('un pilote qui ne nomme QU UNE section se comporte comme avant', () => {
        // La migration : `sectionId` reste la section principale, et un pilote
        // écrit avant le 2026-08-23 ne porte aucun `sectionsSupplementaires`.
        const seule: ComposanteDeJet = { id: 'competence', label: 'Compétence', sectionId: 'competences_generales' };

        expect(sectionsDeLaComposante(FICHE_RDD, seule).sections.map(s => s.id))
            .toEqual(['competences_generales']);
        expect(sectionDeLaComposante(FICHE_RDD, seule).section?.id).toBe('competences_generales');
    });
});
