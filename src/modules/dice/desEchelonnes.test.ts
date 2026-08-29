import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    facesDuNiveau, appliquerLeModificateur, bornerLaPoignee, taillesDe, MAX_D12,
    type DeEchelonne,
} from './desEchelonnes';
import { DiceEngine } from './DiceEngine';
import { preparerLeJet, type DescripteurDeJet } from './DescripteurDeJet';
import type { SheetSection } from '../../data/defaultSheetTemplates';

/**
 * **Les dés échelonnés — la variante Year Zero que le moteur ne savait pas dire.**
 *
 * Signalé par David à l'écran le 2026-08-29 : le panneau annonçait « agilite est
 * absent de la fiche » sur un personnage dont le menu affichait
 * « Agilité (B (D10)) ».
 *
 * Les règles éprouvées ici sont celles du dépôt, et elles concordent :
 * `docs/systems/srd-yze/rules/resolution-des-jets.md` et
 * `docs/systems/blade-runner/rules/resolution-des-jets.md`.
 */

const de = (label: string, faces: number, niveau = ''): DeEchelonne =>
    ({ label, champ: label.toLowerCase(), niveau, faces });

describe('l’échelle des lettres', () => {
    /** « Niveau A : dé à douze faces… Niveau D : dé à six faces. » */
    it('traduit A, B, C et D comme le livre', () => {
        expect(facesDuNiveau('A')).toBe(12);
        expect(facesDuNiveau('B')).toBe(10);
        expect(facesDuNiveau('C')).toBe(8);
        expect(facesDuNiveau('D')).toBe(6);
        expect(taillesDe('yze-lettres')).toEqual([12, 10, 8, 6]);
    });

    /**
     * La fiche est saisie à la main, et le gabarit de GM-OS accepte du texte
     * libre : refuser une forme lisible par un humain n'aurait servi personne.
     */
    it('accepte les formes qu’un humain écrit', () => {
        for (const ecrit of ['C (D8)', 'c (d8)', ' C ', 'C(D8)']) {
            expect(facesDuNiveau(ecrit), ecrit).toBe(8);
        }
    });

    /**
     * **La lettre fait foi, le dé écrit à côté n'en est que la conséquence.**
     * Une fiche où quelqu'un a tapé « B (D8) » est corrigée au passage plutôt que
     * propagée — même décision que la table de correspondance des fiches.
     */
    it('lit la lettre, jamais le dé écrit à côté', () => {
        expect(facesDuNiveau('B (D8)')).toBe(10);
    });

    it('rend null sur ce qui ne désigne aucun niveau', () => {
        for (const rien of ['', '   ', null, undefined, 'Z', 12, 'niveau']) {
            expect(facesDuNiveau(rien), String(rien)).toBeNull();
        }
    });
});

describe('avantage et désavantage', () => {
    /** « Ajout d'un troisième dé de base identique au plus faible des deux. » */
    it('l’avantage copie le PLUS PETIT dé, jamais le plus gros', () => {
        const apres = appliquerLeModificateur([de('Attribut', 10), de('Compétence', 6)], 'avantage');

        expect(apres.map(d => d.faces)).toEqual([10, 6, 6]);
        expect(apres[2].label).toContain('avantage');
    });

    /** « Retrait du dé de base le plus faible (un seul dé est lancé). » */
    it('le désavantage retire le plus petit', () => {
        expect(appliquerLeModificateur([de('Attribut', 12), de('Compétence', 8)], 'desavantage')
            .map(d => d.faces)).toEqual([12]);
    });

    /**
     * « Minimum de un dé à six faces. » Un jet sans dé n'échoue pas : il ne se
     * lance pas — et le joueur ne saurait pas pourquoi.
     */
    it('ne vide jamais la poignée', () => {
        expect(appliquerLeModificateur([de('Attribut', 6)], 'desavantage')).toHaveLength(1);
        expect(appliquerLeModificateur([], 'avantage')).toEqual([]);
    });

    it('ne touche à rien sans modificateur', () => {
        const des = [de('Attribut', 10), de('Compétence', 8)];
        expect(appliquerLeModificateur(des, 'aucun')).toEqual(des);
    });
});

describe('les bornes du livre', () => {
    /** « Maximum de deux dés à douze faces. » */
    it('laisse passer deux D12', () => {
        const { des, remarques } = bornerLaPoignee([de('A', 12), de('B', 12)]);
        expect(des.map(d => d.faces)).toEqual([12, 12]);
        expect(remarques).toEqual([]);
    });

    /**
     * On dégrade d'un cran plutôt que de retirer : le livre plafonne la TAILLE,
     * il ne réduit pas le nombre de dés lancés.
     */
    it('ramène le troisième D12 à dix faces, et le dit', () => {
        const { des, remarques } = bornerLaPoignee([de('A', 12), de('B', 12), de('C', 12)]);

        expect(des.map(d => d.faces)).toEqual([12, 12, 10]);
        expect(des).toHaveLength(3);
        expect(remarques[0]).toContain(String(MAX_D12));
    });

    /** *Une correction muette est une règle perdue.* */
    it('ne corrige jamais en silence', () => {
        expect(bornerLaPoignee([de('A', 12), de('B', 12), de('C', 12)]).remarques).toHaveLength(1);
    });
});

describe('le lancer', () => {
    const rendre = (...valeurs: number[]) => {
        let i = 0;
        vi.spyOn(DiceEngine, 'roll').mockImplementation(() => valeurs[i++] ?? 1);
    };
    afterEach(() => vi.restoreAllMocks());

    /** « Six ou plus est un Succès. » */
    it('compte une réussite à partir de six', () => {
        rendre(5, 6);
        const r = DiceEngine.rollYZEEchelonne([10, 8]);
        expect(r.successes).toBe(1);
        expect(r.tagSuccess).toBe(true);
    });

    /**
     * **« Un dix ou plus sur un dé donne deux Succès. »** Compter les six et
     * s'arrêter là volerait au personnage compétent exactement ce que son
     * meilleur dé lui apporte — *et le total aurait l'air juste.*
     */
    it('compte DEUX réussites à partir de dix', () => {
        rendre(10, 12, 9);
        const r = DiceEngine.rollYZEEchelonne([10, 12, 10]);
        expect(r.successes, '10 → 2, 12 → 2, 9 → 1').toBe(5);
    });

    it('ne réussit rien en dessous de six', () => {
        rendre(1, 5);
        const r = DiceEngine.rollYZEEchelonne([6, 8]);
        expect(r.successes).toBe(0);
        expect(r.tagSuccess).toBe(false);
    });

    /** Les Écueils se comptent — la poussée les fera coûter, plus tard. */
    it('relève les Écueils sans rien prélever', () => {
        rendre(1, 1, 6);
        const r = DiceEngine.rollYZEEchelonne([6, 8], [6]);
        expect(r.fails, 'deux 1').toBe(2);
        expect(r.totalDisplay).toContain('Écueils');
        expect(r.rolls.filter(x => x.source === 'gear')).toHaveLength(1);
    });

    it('lance chaque dé à sa propre taille', () => {
        rendre(4, 4, 4);
        expect(DiceEngine.rollYZEEchelonne([12, 8, 6]).rolls.map(r => r.sides)).toEqual([12, 8, 6]);
    });
});

describe('de la fiche aux dés, bout en bout', () => {
    const SECTIONS: SheetSection[] = [
        { id: 'attributs', label: 'Attributs', fields: [] },
        { id: 'competences', label: 'Compétences', fields: [] },
    ] as unknown as SheetSection[];

    const BLADE_RUNNER: DescripteurDeJet = {
        sens: 'superieur-ou-egal',
        desEchelonnes: {
            echelle: 'yze-lettres',
            composantes: [
                { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
                { id: 'competence', label: 'Compétence', sectionId: 'competences' },
            ],
        },
    };

    /** La fiche réelle de Willem Novak, telle que la session la porte. */
    const WILLEM = { agilite: 'B (D10)', endurance: 'D (D6)', armesAFeu: 'A (D12)' };

    it('compose deux dés de tailles différentes depuis la fiche', () => {
        const jet = preparerLeJet(
            BLADE_RUNNER, WILLEM,
            { champs: { attribut: 'agilite', competence: 'endurance' } },
            SECTIONS,
        );

        expect(jet.desEchelonnes.map(d => d.faces), 'B → D10, D → D6').toEqual([10, 6]);
        expect(jet.nombreDeDes, 'deux dés, pas zéro').toBe(2);
        expect(jet.avertissements, 'plus rien ne manque').toEqual([]);
        expect(jet.seuil, 'ce jeu ne compose AUCUN seuil').toBe(0);
    });

    /**
     * **Le défaut exact que David a vu.** Le champ était là, rempli, et le
     * panneau le déclarait absent — parce que `Number("B (D10)")` ne vaut rien.
     */
    it('ne déclare plus « absent » un champ parfaitement rempli', () => {
        const jet = preparerLeJet(
            BLADE_RUNNER, WILLEM,
            { champs: { attribut: 'agilite', competence: 'endurance' } },
            SECTIONS,
        );
        expect(jet.avertissements.join(' ')).not.toContain('absent');
    });

    it('dit ce qui manque vraiment, et lance quand même le reste', () => {
        const jet = preparerLeJet(
            BLADE_RUNNER, WILLEM,
            { champs: { attribut: 'agilite', competence: 'pilotage' } },
            SECTIONS,
        );

        expect(jet.desEchelonnes).toHaveLength(1);
        expect(jet.avertissements[0]).toContain('« pilotage » est absent');
    });

    it('signale une valeur qui ne désigne aucun niveau', () => {
        const jet = preparerLeJet(
            BLADE_RUNNER, { agilite: 7 }, { champs: { attribut: 'agilite' } }, SECTIONS,
        );
        expect(jet.avertissements[0]).toContain('aucun niveau connu');
    });

    it('porte l’avantage jusqu’à la poignée', () => {
        const jet = preparerLeJet(
            BLADE_RUNNER, WILLEM,
            { champs: { attribut: 'agilite', competence: 'endurance' }, modificateurDeDes: 'avantage' },
            SECTIONS,
        );
        expect(jet.desEchelonnes.map(d => d.faces)).toEqual([10, 6, 6]);
        expect(jet.nombreDeDes).toBe(3);
    });

    /**
     * **Le cas qui décide si le correctif sert à quelque chose.**
     *
     * La Forge **enrichit** : « on remplit ce qui est vide, on ne remplace jamais
     * ce qui est rempli ». Un pilote qui portait déjà un `seuil` le garde donc
     * après une nouvelle dérivation, même parfaite — `desEchelonnes` s'ajoute à
     * côté. Si le seuil continuait de composer, il crierait « ce n'est pas un
     * nombre » sur chaque attribut et le bouton resterait gris.
     *
     * *Une dérivation juste qui ne change rien à l'écran est le pire des cas :
     * on croit que la correction a échoué.*
     */
    it('l’emporte sur un seuil resté dans le pilote', () => {
        const cohabitation: DescripteurDeJet = {
            ...BLADE_RUNNER,
            seuil: [
                { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
                { id: 'competence', label: 'Compétence', sectionId: 'competences' },
            ],
        };

        const jet = preparerLeJet(
            cohabitation, WILLEM,
            { champs: { attribut: 'agilite', competence: 'endurance' } },
            SECTIONS,
        );

        expect(jet.avertissements, 'le seuil ne compose plus, donc ne crie plus').toEqual([]);
        expect(jet.desEchelonnes.map(d => d.faces)).toEqual([10, 6]);
        expect(jet.composantes, 'aucun terme de somme').toEqual([]);
        expect(jet.seuil).toBe(0);
    });

    /** Les autres jeux ne doivent rien voir changer. */
    it('reste vide sur un jeu qui n’en déclare pas', () => {
        const jet = preparerLeJet(
            { sens: 'sous-ou-egal', seuil: [{ id: 'c', label: 'C', sectionId: 'attributs' }] },
            { force: 5 }, { champs: { c: 'force' } },
        );
        expect(jet.desEchelonnes).toEqual([]);
        expect(jet.seuil).toBe(5);
    });
});
