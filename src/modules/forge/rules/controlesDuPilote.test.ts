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

    /*
      2026-10-13 : la séance lit le champ par défaut, jamais la section — aucun
      écran ne propose encore de choisir. Une section fausse n'est donc qu'un
      avertissement ; un champ introuvable, lui, met le seuil au minimum.
    */
    it('une tâche de défaite dont la section n\'existe pas : averti, pas refusé', () => {
        const constats = controlerLePilote(
            {
                combat: {
                    statsToTrack: [], initiativeFormula: '',
                    tacheDeDefaite: { sectionDuSeuil: 'aptitudes', champParDefaut: 'combat', seuil: { min: 4, max: 8 }, progressionDeBase: 2, qualiteMax: 4 },
                },
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => [c.ou, c.gravite])).toEqual([['combat.tacheDeDefaite.sectionDuSeuil', 'avertissement']]);
    });

    it('une tâche de défaite dont le champ par défaut n\'existe pas : une erreur', () => {
        const constats = controlerLePilote(
            {
                combat: {
                    statsToTrack: [], initiativeFormula: '',
                    tacheDeDefaite: { sectionDuSeuil: 'competences', champParDefaut: 'esquive', seuil: { min: 4, max: 8 }, progressionDeBase: 2, qualiteMax: 4 },
                },
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => [c.ou, c.gravite])).toEqual([['combat.tacheDeDefaite.champParDefaut', 'erreur']]);
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
        expect(constats.map(c => [c.ou, c.gravite])).toEqual([['combat.tacheDeDefaite.champParDefaut', 'avertissement']]);
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

    it('une fiche de groupe sans nom ni gabarit, ou qui vise celui des personnages', () => {
        const sans = controlerLePilote(
            { ficheDeGroupe: { libelle: ' ', gabaritDeLaFiche: '' } } as Partial<GameDriver>,
            fiche,
        );
        expect(sans.filter(c => c.ou.startsWith('ficheDeGroupe')).map(c => [c.ou, c.gravite])).toEqual([
            ['ficheDeGroupe.libelle', 'erreur'],
            ['ficheDeGroupe.gabaritDeLaFiche', 'erreur'],
        ]);

        const meme = controlerLePilote(
            { templateId: 'noc-reference', ficheDeGroupe: { libelle: 'Cabale', gabaritDeLaFiche: 'noc-reference' } } as Partial<GameDriver>,
            fiche,
        );
        expect(meme.filter(c => c.ou.startsWith('ficheDeGroupe')).map(c => c.gravite)).toEqual(['avertissement']);

        const juste = controlerLePilote(
            { templateId: 'noc-reference', ficheDeGroupe: { libelle: 'Cabale', gabaritDeLaFiche: 'noc-cabale' } } as Partial<GameDriver>,
            fiche,
        );
        expect(juste.filter(c => c.ou.startsWith('ficheDeGroupe'))).toEqual([]);
    });

    it('des cases de santé : un nombre, des seuils sur les cases, un champ de la fiche', () => {
        const mal = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', defaultHealthType: 'hp', casesDeSante: {
                nombre: 10, champ: 'nulle_part', seuils: [{ aPartirDe: 12, label: 'Agonie' }],
            } } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(mal.filter(c => c.ou.startsWith('combat.casesDeSante')).map(c => [c.ou, c.gravite])).toEqual([
            ['combat.casesDeSante.seuils[0].aPartirDe', 'erreur'],
            ['combat.casesDeSante', 'avertissement'],
            ['combat.casesDeSante.champ', 'avertissement'],
        ]);
    });

    it('provoquer le destin : un Fiel qui existe, des jauges et des réserves sur la fiche', () => {
        const constats = controlerLePilote(
            { jet: {
                sens: 'superieur-ou-egal',
                destin: { fiel: 'Fiel', peril: [{ champ: 'nulle_part', label: 'Blessures', seuils: [] }] },
                reservesDuPersonnage: [{ id: 'vecu', label: 'Vécu', effet: 'bonus', parPoint: 1, epuisement: 'piste', stocks: [{ champ: 'absent', label: 'Vécu' }] }],
            } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.filter(c => c.ou.startsWith('jet.destin') || c.ou.startsWith('jet.reservesDuPersonnage')).map(c => [c.ou, c.gravite])).toEqual([
            ['jet.destin.fiel', 'erreur'],
            ['jet.destin', 'erreur'],
            ['jet.destin.peril[0].champ', 'avertissement'],
            ['jet.reservesDuPersonnage[0]', 'avertissement'],
        ]);
    });

    it('les dommages de Torg : une règle connue, une Résistance et un Choc sur la fiche', () => {
        const constats = controlerLePilote(
            { combat: {
                statsToTrack: [{ fieldId: 'choc', label: 'Choc', isMainHP: false, isResource: true, max: 'esprit_absent' }],
                initiativeFormula: '',
                dommages: { mecanique: 'torg', resistance: 'nulle_part', choc: 'absent' },
            } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.filter(c => c.ou.startsWith('combat.dommages') || c.ou.startsWith('combat.statsToTrack[0].max')).map(c => [c.ou, c.gravite])).toEqual([
            ['combat.dommages.resistance', 'erreur'],
            ['combat.dommages.choc', 'erreur'],
            ['combat.statsToTrack[0].max', 'avertissement'],
        ]);
    });

    it('l’ordre d’action : un mode connu ; le Paquet d’Action veut un champ de Choc', () => {
        const inconnu = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', initiative: { mode: 'tarot' } } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(inconnu.filter(c => c.ou === 'combat.initiative.mode').map(c => c.gravite)).toEqual(['erreur']);

        const sansChoc = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', initiative: { mode: 'paquet' } } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(sansChoc.filter(c => c.ou === 'combat.initiative.mode').map(c => c.gravite)).toEqual(['avertissement']);
    });

    it('les Cartes du Destin : une taille de main entière et positive', () => {
        const mal = controlerLePilote({ cartesDuDestin: { taille: 0 } } as unknown as Partial<GameDriver>, fiche);
        expect(mal.filter(c => c.ou === 'cartesDuDestin.taille').map(c => c.gravite)).toEqual(['erreur']);
        const bon = controlerLePilote({ cartesDuDestin: { taille: 4 } } as unknown as Partial<GameDriver>, fiche);
        expect(bon.filter(c => c.ou === 'cartesDuDestin.taille')).toEqual([]);
    });

    it('les gestes d’une jauge : un nom, et un effet chiffré', () => {
        const constats = controlerLePilote(
            { combat: {
                statsToTrack: [{ fieldId: 'choc', label: 'Choc', isMainHP: false, isResource: true, gestes: [
                    { libelle: 'Récupérer', delta: -2 },
                    { libelle: 'Reprendre son souffle', valeur: 0 },
                    { libelle: '', delta: -1 },
                    { libelle: 'Rien', delta: 0 },
                ] }],
                initiativeFormula: '',
            } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.filter(c => c.ou.startsWith('combat.statsToTrack[0].gestes')).map(c => [c.ou, c.gravite])).toEqual([
            ['combat.statsToTrack[0].gestes[2]', 'erreur'],
            ['combat.statsToTrack[0].gestes[3]', 'erreur'],
        ]);
    });

    it('la Table des Bonus : un nom connu, un niveau et une difficulté', () => {
        const mal = controlerLePilote(
            { jet: { sens: 'superieur-ou-egal', tableDeBonus: 'torg-v2' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(mal.filter(c => ['jet.tableDeBonus', 'jet.seuil', 'jet.difficulte'].includes(c.ou)).map(c => c.ou))
            .toEqual(['jet.tableDeBonus', 'jet.seuil', 'jet.difficulte']);

        const juste = controlerLePilote(
            { jet: {
                sens: 'superieur-ou-egal', tableDeBonus: 'torg', difficulte: { min: 0, max: 30, defaut: 10 },
                seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'competences' }],
            } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(juste.filter(c => c.ou.startsWith('jet.tableDeBonus'))).toEqual([]);
    });

    it('forcer le jet et la Panique : une réserve, une garde connue, des champs qui existent', () => {
        const mal = controlerLePilote(
            { jet: {
                sens: 'superieur-ou-egal',
                seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
                forcer: {
                    garde: 'tout', monteeDeLaSeconde: 1,
                    foisSi: [{ si: { champ: 'nature', contient: ['réplicant'] }, fois: 2 }],
                    prixDesUns: { champ: 'sante', si: [{ si: { composante: 'attribut', parmi: ['empathie'] }, champ: 'combat' }] },
                },
                panique: { faces: 0 },
            } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(mal.filter(c => c.ou.startsWith('jet.forcer') || c.ou.startsWith('jet.panique')).map(c => [c.ou, c.gravite])).toEqual([
            ['jet.forcer', 'erreur'],
            ['jet.forcer.garde', 'erreur'],
            ['jet.forcer', 'erreur'],
            ['jet.forcer.foisSi[0]', 'avertissement'],
            ['jet.forcer.prixDesUns.si[0]', 'avertissement'],
            ['jet.forcer.prixDesUns', 'erreur'],
            ['jet.panique', 'erreur'],
            ['jet.panique.faces', 'erreur'],
        ]);

        const juste = controlerLePilote(
            { jet: {
                sens: 'superieur-ou-egal',
                reserve: {
                    base: 0, max: 10, faces: 6,
                    composantes: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
                    secondaire: { label: 'Stress', libelleDuUn: 'Panique', composantes: [{ id: 'stress', label: 'Stress', sectionId: 'jauges' }] },
                },
                forcer: { garde: 'reussites', bloqueParLaSeconde: true, monteeDeLaSeconde: 1, prixDesUns: { champ: 'determination' } },
                panique: { faces: 6, table: { univers: 'Alien', table: 'test_de_panique' } },
            } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(juste.filter(c => c.ou.startsWith('jet.forcer') || c.ou.startsWith('jet.panique'))).toEqual([]);
    });

    it('la panique en cours et la réussite dépensée vivent sur la fiche', () => {
        const constats = (champ: string) => controlerLePilote(
            { jet: {
                sens: 'superieur-ou-egal',
                reserve: { base: 0, max: 10, faces: 6, secondaire: { label: 'Stress', composantes: [] } },
                panique: { faces: 6, champ, seuil: 7 },
                reussiteDepensee: { champ, label: 'Point de Récit' },
            } } as unknown as Partial<GameDriver>,
            fiche,
        ).filter(c => c.ou === 'jet.panique.champ' || c.ou === 'jet.reussiteDepensee.champ').map(c => c.ou);
        expect(constats('nulle_part')).toEqual(['jet.panique.champ', 'jet.reussiteDepensee.champ']);
        expect(constats('determination')).toEqual([]);
    });

    it('les cosms : un identifiant chacun, une mécanique connue, la Magie nomme ses compétences', () => {
        const constats = controlerLePilote(
            { jet: { sens: 'superieur-ou-egal' }, cosms: [
                { id: 'nil', nom: 'Empire du Nil', lois: [{ nom: 'Héroïsme', texte: '…', mecanique: 'heroisme' }] },
                { id: 'nil', nom: 'Doublon', lois: [{ nom: 'X', texte: '…', mecanique: 'inventee' }] },
                { id: 'aysle', nom: 'Aysle', lois: [{ nom: 'Magie', texte: '…', mecanique: 'magie', competences: ['combat', 'absente'] }] },
            ] } as unknown as Partial<GameDriver>,
            fiche,
        ).filter(c => c.ou.startsWith('cosms')).map(c => [c.ou, c.gravite]);
        expect(constats).toEqual([
            ['cosms[1].id', 'erreur'],
            ['cosms[1].lois[0].mecanique', 'erreur'],
            ['cosms[2].lois[0].competences', 'avertissement'],
            ['cosms[2].lois[0].mecanique', 'avertissement'],
        ]);
    });

    it('les limites de Blessures : des entiers, et des cases à recouper', () => {
        const constats = controlerLePilote(
            { combat: { statsToTrack: [], initiativeFormula: '', limitesDeBlessures: [{ libelle: 'Sbire', blessures: 0 }, { libelle: 'X', blessures: 1.5 }] } } as unknown as Partial<GameDriver>,
            fiche,
        ).filter(c => c.ou.startsWith('combat.limitesDeBlessures')).map(c => c.ou);
        expect(constats).toEqual(['combat.limitesDeBlessures[1].blessures', 'combat.limitesDeBlessures']);
    });

    it('Brisé : les champs lus et écrits existent', () => {
        const constats = controlerLePilote(
            { jet: { sens: 'superieur-ou-egal', brise: [{ champ: 'determination', label: 'Brisé', rappel: '…', de: 'absent', perteDuMaximum: 'combat' }] } } as unknown as Partial<GameDriver>,
            fiche,
        ).filter(c => c.ou.startsWith('jet.brise')).map(c => c.ou);
        expect(constats).toEqual(['jet.brise[0].de']);
    });

    it('la spécialisation borne le critique par une composante du seuil', () => {
        const jet = (composante: string) => controlerLePilote(
            { jet: {
                sens: 'sous-ou-egal', critique: 1,
                seuil: [{ id: 'fonction', label: 'Fonction', sectionId: 'competences' }],
                specialisation: { label: 'Spécialisation', composante },
            } } as unknown as Partial<GameDriver>,
            fiche,
        ).filter(c => c.ou.startsWith('jet.specialisation')).map(c => [c.ou, c.gravite]);
        expect(jet('departement')).toEqual([['jet.specialisation.composante', 'erreur']]);
        expect(jet('fonction')).toEqual([]);
    });

    it('des apports du groupe mal déclarés', () => {
        const constats = controlerLePilote(
            {
                jet: { sens: 'superieur-ou-egal', reserve: { base: 0, max: 6, faces: 10, composantes: [{ id: 'domaine', label: 'Domaine', sectionId: 'domaines' }] } },
                ficheDeGroupe: {
                    libelle: 'Cabale', gabaritDeLaFiche: 'noc-cabale',
                    apports: [
                        { id: 'des', label: 'Dés', effet: 'des', parPoint: 1, epuisement: 'scenario', composante: 'talent', stocks: [{ champ: 'domains.action', label: 'Action' }] },
                        { id: 'x', label: 'X', effet: 'magie', parPoint: 0, epuisement: 'jamais', stocks: [] },
                        { id: 'ok', label: 'Espoir', effet: 'des', parPoint: 3, epuisement: 'piste', stocks: [{ champ: 'tracks.espoir', label: 'Espoir' }] },
                    ],
                },
            } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.filter(c => c.ou.startsWith('ficheDeGroupe.apports')).map(c => [c.ou, c.gravite])).toEqual([
            ['ficheDeGroupe.apports[0].composante', 'erreur'],
            ['ficheDeGroupe.apports[0].stocks', 'avertissement'],
            ['ficheDeGroupe.apports[1].effet', 'erreur'],
            ['ficheDeGroupe.apports[1].parPoint', 'erreur'],
            ['ficheDeGroupe.apports[1].epuisement', 'erreur'],
            ['ficheDeGroupe.apports[1].stocks', 'erreur'],
        ]);
    });

    it("un débordement qui vise le vide, elle-même, ou qui n'a pas de seuil", () => {
        const constats = controlerLePilote(
            {
                ressourcesDeTable: [
                    { id: 'fiel', label: 'Fiel', proprietaire: 'meneur', depart: 0, min: 0, max: 5, debordement: { vers: 'peril' } },
                    { id: 'elan', label: 'Élan', proprietaire: 'joueurs', depart: 0, min: 0, max: 3, debordement: { vers: 'elan', gain: 0 } },
                    { id: 'menace', label: 'Menace', proprietaire: 'meneur', depart: 0, min: 0, debordement: { vers: 'fiel' }, erosionDebutDeSeance: -1 },
                ],
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => [c.ou, c.gravite])).toEqual([
            ['ressourcesDeTable[0].debordement', 'erreur'],
            ['ressourcesDeTable[1].debordement', 'erreur'],
            ['ressourcesDeTable[1].debordement.gain', 'erreur'],
            ['ressourcesDeTable[2].debordement', 'avertissement'],
            ['ressourcesDeTable[2].erosionDebutDeSeance', 'erreur'],
        ]);
    });

    it('Nephilim (2026-10-17) : un plafond en texte, un maxSur dans le vide ou sur soi-même', () => {
        const constats = controlerLePilote(
            {
                ressourcesDeTable: [
                    { id: 'traque', label: 'Jauge de Traque', proprietaire: 'joueurs', depart: 0, min: 0, max: 'Seuil RK' as unknown as number },
                    { id: 'a', label: 'A', proprietaire: 'meneur', depart: 0, min: 0, maxSur: 'absente' },
                    { id: 'b', label: 'B', proprietaire: 'meneur', depart: 0, min: 0, maxSur: 'b' },
                ],
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => [c.ou, c.gravite])).toEqual([
            ['ressourcesDeTable[0].max', 'erreur'],
            ['ressourcesDeTable[1].maxSur', 'erreur'],
            ['ressourcesDeTable[2].maxSur', 'erreur'],
        ]);
    });

    it('Nephilim : la Traque au Seuil RK, qui déborde en Intensité, passe — le débordement a son seuil', () => {
        const constats = controlerLePilote(
            {
                ressourcesDeTable: [
                    { id: 'seuilRK', label: 'Seuil RK', proprietaire: 'meneur', depart: 5, min: 2, max: 9 },
                    { id: 'traque', label: 'Jauge de Traque', proprietaire: 'joueurs', depart: 0, min: 0, maxSur: 'seuilRK', debordement: { vers: 'intensite' } },
                    { id: 'intensite', label: 'Intensité', proprietaire: 'meneur', depart: 1, min: 1, max: 5 },
                ],
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats).toEqual([]);
    });

    it('Nephilim : un nom de Vécu pris sur un champ absent de la section', () => {
        const constats = controlerLePilote({} as Partial<GameDriver>, {
            sections: [{ id: 'vecus', label: 'Vécus', fields: [
                { id: 'vecu.0.name', label: 'Vécu 1', type: 'text', defaultValue: '' },
                { id: 'vecu.0.degree', label: 'Degré 1', type: 'number', defaultValue: 0, libelleSur: 'vecu.0.name' },
                { id: 'vecu.1.degree', label: 'Degré 2', type: 'number', defaultValue: 0, libelleSur: 'vecu.1.name' },
            ] }],
        });
        expect(constats.map(c => [c.ou, c.gravite])).toEqual([
            ['template.sections[vecus].fields[vecu.1.degree].libelleSur', 'erreur'],
        ]);
    });

    it('le Fiel et la Menace de NOC, déclarés juste, passent', () => {
        const constats = controlerLePilote(
            {
                ressourcesDeTable: [
                    { id: 'fiel', label: 'Fiel', proprietaire: 'meneur', depart: 0, min: 0, max: 5, debordement: { vers: 'menace' } },
                    { id: 'menace', label: 'Menace', proprietaire: 'meneur', depart: 0, min: 0, erosionDebutDeSeance: 1, remiseAuDepartParScenario: true },
                ],
            } as Partial<GameDriver>,
            fiche,
        );
        expect(constats.filter(c => c.ou.startsWith('ressourcesDeTable'))).toEqual([]);
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

    /**
     * **Deux réglages nommés « difficulté », vus sur l'écran de David le
     * 2026-08-23.** `cible` déplace la colonne d'une table, `difficulte` compte
     * des réussites — même mot, aucun rapport. Le moteur ignore désormais le
     * second quand le premier décide, et le panneau ne l'affiche plus ; reste à
     * réclamer le retrait du champ mort. *Un champ mort qu'on laisse finit par
     * être rempli.*
     */
    it('signale un pilote qui déclare une cible ET un compte de réussites', () => {
        const constats = controlerLePilote(
            {
                jet: {
                    cible: {
                        mecanique: 'reves-de-dragons',
                        caracteristique: { id: 'carac', label: 'Carac', sectionId: 'caracs' },
                    },
                    difficulte: { min: 0, max: 5, defaut: 0 },
                },
            } as never,
            fiche,
        );
        const vise = constats.find(c => c.ou === 'jet.difficulte');
        expect(vise, 'le conflit doit être signalé').toBeDefined();
        expect(vise?.gravite, 'le pilote reste jouable : un avertissement, pas une erreur')
            .toBe('avertissement');
    });

    it("ne signale rien quand la cible est seule", () => {
        const constats = controlerLePilote(
            {
                jet: {
                    cible: {
                        mecanique: 'reves-de-dragons',
                        caracteristique: { id: 'carac', label: 'Carac', sectionId: 'caracs' },
                    },
                },
            } as never,
            fiche,
        );
        expect(constats.find(c => c.ou === 'jet.difficulte')).toBeUndefined();
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
        // « jet » s'ajoute à juste titre : ce pilote de test ne déclare AUCUNE
        // voie de résolution — ni seuil, ni cible, ni dés échelonnés, ni réserve.
        expect(constats.map(c => c.ou)).toEqual(['jet.sens', 'jet']);
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
        expect(constats.map(c => c.ou)).toEqual(['jet.sens', 'jet']);
        expect(constats[0].message).toContain('superieur-ou-egal');
    });

    /**
     * **Le contrôle qui répond « la dérivation a-t-elle pris ? » d'un coup d'œil.**
     *
     * *Écrit le 2026-08-29 :* David a redérivé son pilote Blade Runner deux fois
     * de suite sans pouvoir savoir, depuis la revue, si la mécanique attendue
     * était arrivée — il fallait rouvrir une fiche de personnage pour le
     * découvrir. Un pilote sans voie de résolution n'a rien à composer, et
     * l'écran le montrait vide sans dire pourquoi.
     */
    it('un pilote qui ne dit pas comment un jet se résout', () => {
        const constats = controlerLePilote(
            { jet: { sens: 'superieur-ou-egal' } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual(['jet']);
        expect(constats[0].message).toContain('dés échelonnés');
    });

    /** Chacune des quatre voies suffit à le faire taire. */
    it('se tait dès qu’une voie de résolution existe', () => {
        const avec = (jet: Record<string, unknown>) => controlerLePilote(
            { jet: { sens: 'superieur-ou-egal', ...jet } } as unknown as Partial<GameDriver>,
            fiche,
        ).filter(c => c.ou === 'jet');

        expect(avec({ seuil: [{ id: 'c', label: 'C', sectionId: 'competences' }] })).toEqual([]);
        expect(avec({ cible: { mecanique: 'reves-de-dragons', caracteristique: { id: 'c', label: 'C', sectionId: 'competences' } } })).toEqual([]);
        expect(avec({ desEchelonnes: { echelle: 'yze-lettres', composantes: [] } })).toEqual([]);
        expect(avec({ reserve: { base: 1, max: 5, faces: 6 } })).toEqual([]);
    });

    /**
     * **« Qui d'autre lance ce jet ? »** — la question de David du 2026-08-29.
     *
     * Le panneau de fiche lit `jet.desEchelonnes` ; Dice-OS et la tablette ne
     * connaissent que `dice.engine`. Un pilote qui déclare l'un sans l'autre
     * marche depuis une fiche de personnage et rend une poignée de d6 depuis le
     * pupitre — *des réussites plausibles, et le meilleur dé du personnage nulle
     * part.*
     */
    it('exige que le moteur du pupitre suive les dés échelonnés', () => {
        const avec = (engine: string) => controlerLePilote(
            {
                dice: { defaultDice: '2d10', logic: 'count-success', engine },
                jet: { sens: 'superieur-ou-egal', desEchelonnes: { echelle: 'yze-lettres', composantes: [] } },
            } as unknown as Partial<GameDriver>,
            fiche,
        ).filter(c => c.ou === 'dice.engine');

        const surLaVariante = (engine: string) =>
            avec(engine).filter(c => c.message.includes('yze-echelonne'));

        /*
          2026-10-13 : Dice-OS et la tablette suivent `jet.desEchelonnes` depuis
          le 30/09 — le jet est juste quel que soit le moteur. Il reste un nom
          inexact (l'aide de la tablette) : un avertissement, plus une erreur.
          Et plus de contrôle des faces : chaque dé prend celles de sa lettre.
        */
        expect(avec('yze'), 'un seul constat : le nom, pas les faces').toHaveLength(1);
        expect(surLaVariante('yze')[0].gravite).toBe('avertissement');
        expect(surLaVariante('standard')).toHaveLength(1);
        expect(avec('yze-echelonne'), 'le bon moteur ne dit rien').toEqual([]);
    });

    /**
     * *Un contrôle qui se trompe est pire qu'un contrôle absent.* Sur un jeu à
     * dés échelonnés, une réserve vide est un champ mort — pas une panne, et
     * surtout pas « rien à lancer » : le panneau a exactement ses deux dés.
     */
    it('ne dit pas « rien à lancer » à un jeu qui lance des dés échelonnés', () => {
        const constats = controlerLePilote(
            {
                jet: {
                    sens: 'superieur-ou-egal',
                    desEchelonnes: { echelle: 'yze-lettres', composantes: [] },
                    reserve: { base: 0, max: 0, faces: 6 },
                },
            } as unknown as Partial<GameDriver>,
            fiche,
        ).filter(c => c.ou === 'jet.reserve');

        expect(constats).toHaveLength(1);
        expect(constats[0].message).not.toContain('rien à lancer');
        expect(constats[0].message).toContain('champ mort');
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
            tacheDeDefaite: { sectionDuSeuil: 'competences', champParDefaut: 'combat', seuil: { min: 4, max: 8 }, progressionDeBase: 2, qualiteMax: 4 },
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

    /* Le pilote de référence ne doit recevoir aucune erreur de son propre contrôle (2026-10-13). */
    it('le pilote de Dune livré dans le code, avec sa fiche, ne reçoit aucune erreur', () => {
        const dune = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
        const saFiche = DEFAULT_SHEET_TEMPLATES.find(t => t.id === dune.templateId)!;
        expect(controlerLePilote(dune, saFiche).filter(c => c.gravite === 'erreur')).toEqual([]);
    });

    it('une tâche sans champ où lire son seuil est pire qu\'absente', () => {
        const constats = controlerLePilote(
            { combat: { tacheDeDefaite: { seuil: { min: 0, max: 0 } } } } as unknown as Partial<GameDriver>,
            fiche,
        );
        expect(constats.map(c => c.ou)).toEqual([
            'combat.tacheDeDefaite.champParDefaut',
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

/**
 * **Le moteur `sauvegarde`** — Cthulhu Hack, 2026-09-30 : un d20 SOUS la
 * caractéristique. La Forge doit pouvoir le nommer sans se faire gronder.
 */
describe('le moteur de la Sauvegarde', () => {
    const gabarit = { id: 't', name: 'T', sections: [{ id: 'sauvegardes', title: 'Sauvegardes', fields: [] }] } as unknown as SheetTemplate;
    const surLeJet = (dice: Record<string, unknown>, sens: string) => controlerLePilote(
        { dice, jet: { sens, seuil: [{ id: 's', label: 'Sauvegarde', sectionId: 'sauvegardes' }] } } as unknown as Partial<GameDriver>,
        gabarit,
    ).filter(c => c.ou === 'dice.engine' || c.ou === 'jet.sens');

    it('est un moteur connu, qui ne dit rien quand tout est juste', () => {
        expect(surLeJet({ defaultDice: '1d20', logic: 'count-success', engine: 'sauvegarde' }, 'sous-ou-egal')).toEqual([]);
    });

    it('se lance sous la caractéristique : « supérieur » est une contradiction', () => {
        const constats = surLeJet({ defaultDice: '1d20', logic: 'count-success', engine: 'sauvegarde' }, 'superieur-ou-egal');
        expect(constats.map(c => c.ou)).toEqual(['jet.sens']);
    });

    it('lance un d20 : une notation en d6 est recopiée d’ailleurs', () => {
        const constats = surLeJet({ defaultDice: '1d6', logic: 'count-success', engine: 'sauvegarde' }, 'sous-ou-egal');
        expect(constats.map(c => c.ou)).toEqual(['dice.engine']);
    });
});

/**
 * **Les ressources à dé d'usure** — Cthulhu Hack, 2026-09-30. Le champ doit
 * exister (il porte le dé courant), et le plafond doit être un cran de l'échelle.
 */
describe('les dés d’usure déclarés par le pilote', () => {
    const gabarit = {
        id: 't', name: 'T',
        sections: [{ id: 'ressources', title: 'Ressources', fields: [{ id: 'torche', label: 'Torche', type: 'text' }] }],
    } as unknown as SheetTemplate;
    const surLUsure = (desDUsure: unknown) => controlerLePilote(
        { desDUsure } as unknown as Partial<GameDriver>,
        gabarit,
    ).filter(c => c.ou.startsWith('desDUsure'));

    it('ne dit rien quand le champ existe et que le plafond est un cran', () => {
        expect(surLUsure([{ fieldId: 'torche', label: 'Torche', plafond: 12 }])).toEqual([]);
        expect(surLUsure([{ fieldId: 'torche', label: 'Matériel', plafond: 20 }])).toEqual([]);
    });

    it('signale un champ qu’aucune section ne porte', () => {
        expect(surLUsure([{ fieldId: 'bagou', label: 'Bagou' }]).map(c => c.ou)).toEqual(['desDUsure[0].fieldId']);
    });

    it('signale un plafond hors de l’échelle', () => {
        expect(surLUsure([{ fieldId: 'torche', label: 'Torche', plafond: 7 }]).map(c => c.ou)).toEqual(['desDUsure[0].plafond']);
    });
});

describe('les gestes qui touchent chaque Héros — NOC, 2026-10-16', () => {
    const RESERVES = [
        { id: 'Fiel', label: 'Fiel', proprietaire: 'meneur', depart: 0, min: 0, max: 5, debordement: { vers: 'Menace' } },
        { id: 'Menace', label: 'Menace', proprietaire: 'meneur', depart: 0, min: 0 },
    ];
    const ficheNoc: Partial<SheetTemplate> = {
        sections: [{ id: 'h', label: 'Héros', fields: ['espoir', 'extase', 'ferveur', 'trauma', 'folie', 'vecu', 'fatigue'].map(id => ({ id, label: id, type: 'number' })) }] as SheetTemplate['sections'],
    };
    const surLesGestes = (gestes: unknown) => controlerLePilote(
        { ressourcesDeTable: RESERVES, gestesDesHeros: gestes } as unknown as Partial<GameDriver>, ficheNoc,
    ).filter(c => c.ou.startsWith('gestesDesHeros')).map(c => [c.ou, c.gravite]);

    it('des gestes déclarés juste passent', () => {
        expect(surLesGestes({
            momentDeCalme: { table: [{ ressource: 'Fiel', delta: -1 }], heros: [{ champ: 'espoir', delta: 1, plus: 'extase', max: { champ: 'ferveur', fois: 2, plus: 3, plafond: 10 } }], leve: ['fatigue'] },
            debutDeSeance: [{ champ: 'vecu', delta: 1, max: 3 }],
            nouveauScenario: [{ champ: 'vecu', delta: 'plein', max: 3 }],
            effetsDuDebordement: { ressource: 'Fiel', nombreSelon: 'Menace', effets: [
                { id: 'tension', label: 'Tension', heros: [{ champ: 'trauma', delta: 2, resistance: 'folie' }] },
                { id: 'fatigue', label: 'Fatigue', heros: [{ champ: 'espoir', delta: -1, aVideCoche: 'fatigue' }] },
            ] },
        })).toEqual([]);
    });

    it('une réserve inconnue est une erreur, un champ absent un avertissement', () => {
        expect(surLesGestes({
            momentDeCalme: { table: [{ ressource: 'Elan', delta: -1 }], heros: [{ champ: 'nulle_part', delta: 0 }] },
            nouveauScenario: [{ champ: 'vecu', delta: 'plein' }],
            effetsDuDebordement: { ressource: 'Menace', nombreSelon: 'Absente', effets: [
                { id: 'a', label: 'A', coche: 'introuvable' }, { id: 'a', label: 'Vide' },
            ] },
        })).toEqual([
            ['gestesDesHeros.momentDeCalme.heros[0].delta', 'erreur'],
            ['gestesDesHeros.momentDeCalme.heros[0]', 'avertissement'],
            ['gestesDesHeros.momentDeCalme.table[0]', 'erreur'],
            ['gestesDesHeros.nouveauScenario[0].max', 'erreur'],
            ['gestesDesHeros.effetsDuDebordement.ressource', 'avertissement'],
            ['gestesDesHeros.effetsDuDebordement.nombreSelon', 'erreur'],
            ['gestesDesHeros.effetsDuDebordement.effets[0].coche', 'avertissement'],
            ['gestesDesHeros.effetsDuDebordement.effets[1].id', 'erreur'],
            ['gestesDesHeros.effetsDuDebordement.effets[1]', 'avertissement'],
        ]);
    });

    it("l'Atout Capital et le Bouleversement visent des composantes du jet", () => {
        const constats = controlerLePilote({
            jet: {
                sens: 'superieur-ou-egal',
                seuil: [{ id: 'talent', label: 'Talent', sectionId: 'h' }],
                reserve: { base: 0, faces: 10, composantes: [{ id: 'domaine', label: 'Domaine', sectionId: 'h' }] },
                destin: { peril: [{ champ: 'fatigue', label: 'B', seuils: [{ aPartirDe: 1, label: 'Bouleversement', talents: -1, seulementSi: { composante: 'Domaine', champ: 'statut' } }] }] },
            },
            ficheDeGroupe: { libelle: 'Cabale', gabaritDeLaFiche: 'noc-cabale', apports: [{
                id: 'atout', label: 'Atout', effet: 'bonus', parPoint: 1, epuisement: 'scenario', maxParJet: 1,
                stocks: [{ champ: 'capital', label: 'Capital', horsPlafondSi: { composante: 'competence', champ: 'fortune' } }],
            }] },
        } as unknown as Partial<GameDriver>, ficheNoc);
        expect(constats.filter(c => c.ou.includes('horsPlafondSi') || c.ou.includes('seulementSi')).map(c => [c.ou, c.gravite])).toEqual([
            ['jet.destin.peril[0].seuils[0].seulementSi', 'erreur'],
            ['ficheDeGroupe.apports[0].stocks[0].horsPlafondSi', 'erreur'],
        ]);
    });
});

describe('Cthulhu Hack : Fortune, suites du déclin, Matériel et Hors Jeu — 2026-10-16', () => {
    const ficheCh: Partial<SheetTemplate> = {
        sections: [{ id: 'r', label: 'Ressources', fields: ['mentalHealth', 'fortune', 'materiel_1', 'materiel_1_nom'].map(id => ({ id, label: id, type: 'text' })) }] as SheetTemplate['sections'],
    };
    const constatsDe = (pilote: unknown) => controlerLePilote(pilote as Partial<GameDriver>, ficheCh)
        .filter(c => /fortune|desDUsure|horsJeu/.test(c.ou)).map(c => [c.ou, c.gravite]);

    it('déclarés juste, ils passent', () => {
        expect(constatsDe({
            jet: { sens: 'sous-ou-egal', fortune: { champ: 'fortune', max: 2, relance: 1, reussite: 2 } },
            desDUsure: [
                { fieldId: 'mentalHealth', label: 'Santé mentale', auDeclin: [{ label: 'Choc', table: { univers: 'Cthulhu Hack', table: 'chocs' } }] },
                { fieldId: 'materiel_1', label: 'Matériel 1', plafond: 20, nomSur: 'materiel_1_nom' },
            ],
            combat: { statsToTrack: [], initiativeFormula: '', horsJeu: { table: { univers: 'Cthulhu Hack', table: 'consequences_du_hors_jeu' }, recuperation: '1d4' } },
        })).toEqual([]);
    });

    it('ce qui ne mène nulle part est dit', () => {
        expect(constatsDe({
            jet: { sens: 'sous-ou-egal', fortune: { champ: 'absent', max: 2, relance: 1, reussite: 3 } },
            desDUsure: [{ fieldId: 'materiel_1', label: 'Matériel 1', nomSur: 'nulle_part', auDeclin: [{ label: 'Choc', table: { univers: '', table: 'chocs' } }] }],
            combat: { statsToTrack: [], initiativeFormula: '', horsJeu: { table: { univers: 'Cthulhu Hack', table: '' }, recuperation: 'un peu' } },
        })).toEqual([
            ['desDUsure[0].nomSur', 'avertissement'],
            ['desDUsure[0].auDeclin[0]', 'erreur'],
            ['combat.horsJeu.table', 'erreur'],
            ['combat.horsJeu.recuperation', 'erreur'],
            ['jet.fortune.champ', 'erreur'],
            ['jet.fortune', 'avertissement'],
        ]);
    });
});

describe('Blade Runner : Brisé en combat et protection — 2026-10-16', () => {
    const ficheBr: Partial<SheetTemplate> = {
        sections: [{ id: 'f', label: 'Fiche', fields: ['sante', 'sangFroid', 'protection', 'protectionNom', 'blessuresCritiques', 'stressCritique'].map(id => ({ id, label: id, type: 'text' })) }] as SheetTemplate['sections'],
    };
    const constatsDe = (pilote: unknown) => controlerLePilote(pilote as Partial<GameDriver>, ficheBr)
        .filter(c => /horsJeu|protection|brise/.test(c.ou)).map(c => [c.ou, c.gravite]);
    const T = { univers: 'Blade Runner', table: 'percutant' };

    it('déclarés juste, ils passent', () => {
        expect(constatsDe({
            jet: { sens: 'superieur-ou-egal', brise: [{ champ: 'sangFroid', label: 'B', rappel: 'r', noterDans: 'stressCritique' }] },
            combat: { statsToTrack: [], initiativeFormula: '',
                horsJeu: { tables: [{ label: 'Percutant', table: T }], desAuChoix: [6, 8, 10, 12], noterDans: 'blessuresCritiques', repetable: true },
                protection: { champ: 'protection', des: 2, nomSur: 'protectionNom' } },
        })).toEqual([]);
    });

    it('ce qui ne mène nulle part est dit', () => {
        expect(constatsDe({
            jet: { sens: 'superieur-ou-egal', brise: [{ champ: 'sangFroid', label: 'B', rappel: 'r', noterDans: 'absent' }] },
            combat: { statsToTrack: [], initiativeFormula: '',
                horsJeu: { tables: [{ label: '', table: T }], desAuChoix: [7], noterDans: 'nulle_part' },
                protection: { champ: 'armure', des: 0 } },
        })).toEqual([
            ['combat.horsJeu.tables[0]', 'erreur'],
            ['combat.horsJeu.desAuChoix', 'erreur'],
            ['combat.horsJeu.noterDans', 'avertissement'],
            ['combat.protection.champ', 'erreur'],
            ['combat.protection.des', 'erreur'],
            ['jet.brise[0].noterDans', 'avertissement'],
        ]);
    });
});

describe('Blade Runner : stress subi et relance d’une réussite — 2026-10-16', () => {
    const ficheBr: Partial<SheetTemplate> = {
        sections: [{ id: 'f', label: 'F', fields: ['sangFroid', 'empathie', 'psychologie'].map(id => ({ id, label: id, type: 'text' })) }] as SheetTemplate['sections'],
    };
    const constatsDe = (jet: unknown) => controlerLePilote({ jet } as unknown as Partial<GameDriver>, ficheBr)
        .filter(c => /stressSubi|relancerUneReussite/.test(c.ou)).map(c => [c.ou, c.gravite]);

    it('déclarés juste, ils passent', () => {
        expect(constatsDe({
            sens: 'superieur-ou-egal', desEchelonnes: { echelle: 'yze-lettres', composantes: [] },
            forcer: { garde: 'reussites-et-uns', relancerUneReussite: true },
            stressSubi: { champ: 'sangFroid', jet: ['empathie', 'psychologie'] },
        })).toEqual([]);
    });

    it('ce qui ne mène nulle part est dit', () => {
        expect(constatsDe({
            sens: 'superieur-ou-egal', forcer: { garde: 'reussites', relancerUneReussite: true },
            stressSubi: { champ: 'absent', jet: ['nulle_part'] },
        })).toEqual([
            ['jet.stressSubi.champ', 'erreur'],
            ['jet.stressSubi.jet', 'avertissement'],
            ['jet.forcer.relancerUneReussite', 'avertissement'],
        ]);
    });
});

describe('les pistes du groupe au nouveau scénario — 2026-10-16', () => {
    const surLaRecharge = (nouveauScenario: unknown) => controlerLePilote(
        { ficheDeGroupe: { libelle: 'Cabale', gabaritDeLaFiche: 'noc-cabale', nouveauScenario } } as unknown as Partial<GameDriver>, fiche,
    ).filter(c => c.ou.startsWith('ficheDeGroupe.nouveauScenario')).map(c => [c.ou, c.gravite]);

    it('déclarée juste, elle passe', () => {
        expect(surLaRecharge([{ champ: 'tracks.espoir', delta: 'plein', max: { champ: 'assets.life.creed' } }])).toEqual([]);
    });
    it('« plein » sans plafond, ou un mouvement nul, sont des erreurs', () => {
        expect(surLaRecharge([{ champ: 'tracks.vecu', delta: 'plein' }, { champ: 'tracks.espoir', delta: 0 }])).toEqual([
            ['ficheDeGroupe.nouveauScenario[0].max', 'erreur'],
            ['ficheDeGroupe.nouveauScenario[1].delta', 'erreur'],
        ]);
    });
});

/**
 * **Un compte de réussites que la réserve ne peut pas produire** — Symbaroum,
 * 2026-10-21 : le modificateur du livre rangé dans `jet.difficulte`, sur un
 * seul d20 ; chaque test réussissait, un 20 compris. Crimes, audité le
 * 2026-10-19 : son seuil par dé (9) rangé au même endroit, sur une réserve
 * plafonnée à zéro dé. Ni l'un ni l'autre n'était signalé.
 */
describe('la difficulté se mesure à la réserve', () => {
    const constatsDuJet = (jet: Record<string, unknown>) =>
        controlerLePilote({ jet } as never, fiche)
            .filter(c => c.ou === 'jet.difficulte' || c.ou === 'jet.reserve')
            .map(c => [c.ou, c.gravite]);

    it('refuse un modificateur rangé dans le compte d\'un jeu à un seul dé', () => {
        expect(constatsDuJet({
            seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'competences' }],
            reserve: { base: 1, max: 1, faces: 20 }, sens: 'sous-ou-egal',
            difficulte: { min: -5, max: 5, defaut: 0 },
        })).toEqual([['jet.difficulte', 'erreur']]);
    });

    it('réclame seulement le retrait d\'un compte toujours égal à un', () => {
        expect(constatsDuJet({
            seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'competences' }],
            reserve: { base: 1, max: 1, faces: 20 }, sens: 'sous-ou-egal',
            difficulte: { min: 1, max: 1, defaut: 1 },
        })).toEqual([['jet.difficulte', 'avertissement']]);
    });

    it('refuse une difficulté qu\'une réserve sans dé n\'atteindra jamais', () => {
        expect(constatsDuJet({
            seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
            reserve: { base: 0, max: 0, faces: 10 }, sens: 'superieur-ou-egal',
            difficulte: { min: 9, max: 9, defaut: 9 },
        })).toEqual([['jet.difficulte', 'erreur'], ['jet.reserve', 'avertissement']]);
    });

    it('signale le haut d\'un curseur que la réserve ne peut pas atteindre', () => {
        expect(constatsDuJet({
            reserve: { base: 2, max: 2, faces: 6 }, sens: 'superieur-ou-egal',
            difficulte: { min: 0, max: 5, defaut: 1 },
        })).toEqual([['jet.difficulte', 'avertissement']]);
    });

    it('laisse Dune tranquille : le critique compte double, cinq réussites sont à portée', () => {
        expect(constatsDuJet(duneDriver.jet as never)).toEqual([]);
    });

    it('ne compte rien chez Torg, NOC ou une cible calculée : ils comparent un total', () => {
        const unDe = { reserve: { base: 1, max: 1, faces: 20 }, difficulte: { min: 0, max: 30, defaut: 10 } };
        expect(constatsDuJet({ ...unDe, tableDeBonus: 'torg', seuil: [{ id: 'a', label: 'A', sectionId: 'competences' }] })).toEqual([]);
        expect(constatsDuJet({ ...unDe, destin: {}, seuil: [{ id: 'a', label: 'A', sectionId: 'competences' }] })).toEqual([]);
        expect(constatsDuJet({
            ...unDe,
            cible: { mecanique: 'reves-de-dragons', caracteristique: { id: 'c', label: 'C', sectionId: 'competences' } },
        }).filter(([ou]) => ou === 'jet.reserve')).toEqual([]);
    });
});

/** **Le seuil que le meneur déplace** (Symbaroum, 2026-10-22). */
describe('le modificateur du seuil', () => {
    const constats = (jet: Record<string, unknown>) =>
        controlerLePilote({ jet } as never, fiche)
            .filter(c => c.ou.startsWith('jet.modificateurDuSeuil'))
            .map(c => [c.ou, c.gravite]);
    const symbaroum = {
        seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'competences' }],
        reserve: { base: 1, max: 1, faces: 20 }, sens: 'sous-ou-egal',
    };

    it('le réglage de Symbaroum passe sans un mot', () => {
        expect(constats({ ...symbaroum, modificateurDuSeuil: { min: -5, max: 5, defaut: 0, opposition: { reference: 10 } } }))
            .toEqual([]);
    });

    it('des bornes qui ne se tiennent pas sont une erreur', () => {
        expect(constats({ ...symbaroum, modificateurDuSeuil: { min: 5, max: -5, defaut: 0 } }))
            .toEqual([['jet.modificateurDuSeuil', 'erreur']]);
        expect(constats({ ...symbaroum, modificateurDuSeuil: { min: -5, max: 5, defaut: 0, opposition: { reference: 'dix' } } }))
            .toEqual([['jet.modificateurDuSeuil.opposition', 'erreur']]);
    });

    it('sur un jeu qui compte au-dessus, il est mort : on le dit', () => {
        expect(constats({ ...symbaroum, sens: 'superieur-ou-egal', modificateurDuSeuil: { min: -5, max: 5, defaut: 0 } }))
            .toEqual([['jet.modificateurDuSeuil', 'avertissement']]);
    });
});

/** **Santé, séquelles et fin de scène** (sujets communs 3 et 4, 2026-10-22). */
describe('la santé que la fiche porte, les seuils et la fin de scène', () => {
    const lesCombats = (combat: Record<string, unknown>) =>
        controlerLePilote({ combat: { statsToTrack: [], initiativeFormula: '', ...combat } } as never, fiche)
            .filter(c => c.ou === 'combat.statsToTrack').map(c => c.gravite);

    it('une santé de départ sans champ courant sur la fiche se signale', () => {
        expect(lesCombats({ defaultHealthType: 'hp', santeDeDepart: 'combat' })).toEqual(['avertissement']);
    });

    it('mais ni avec une jauge principale, ni avec des cases, une horloge ou un autre modèle', () => {
        expect(lesCombats({ santeDeDepart: 'combat', statsToTrack: [{ fieldId: 'determination', label: 'D', isMainHP: true }] })).toEqual([]);
        expect(lesCombats({ santeDeDepart: 'combat', casesDeSante: { libelle: 'B', nombre: 10, champ: 'combat' } })).toEqual([]);
        expect(lesCombats({ santeDeDepart: 'combat', defaultHealthType: 'clocks' })).toEqual([]);
    });

    it('un seuil sans identifiant, sans nombre ou sans rien à noter est une erreur ; une jauge absente se dit', () => {
        const constats = controlerLePilote({
            franchissements: [
                { id: 'a', champ: 'combat', aPartirDe: 8, mouvements: [{ champ: 'determination', delta: 1 }] },
                { id: 'a', champ: 'inconnue', aPartirDe: 'huit', mouvements: [] },
            ],
        } as never, fiche).map(c => [c.ou, c.gravite]);
        expect(constats).toEqual([
            ['franchissements[1].id', 'erreur'],
            ['franchissements[1].aPartirDe', 'erreur'],
            ['franchissements[1].champ', 'avertissement'],
            ['franchissements[1].mouvements', 'erreur'],
        ]);
    });

    it('la fin de scène accepte « vide », et se contrôle comme les autres gestes', () => {
        const constats = controlerLePilote({
            gestesDesHeros: { finDeScene: [{ champ: 'determination', delta: 'vide' }, { champ: 'absent', delta: 'vide' }] },
        } as never, fiche).map(c => [c.ou, c.gravite]);
        expect(constats).toEqual([['gestesDesHeros.finDeScene[1]', 'avertissement']]);
    });
});

/** **Les seuils de la Corruption et l'Avantage tactique** (Symbaroum S3/S4, 2026-10-22). */
describe('seuils lus sur la fiche, Avantage tactique', () => {
    it('un seuil lu sur la fiche, des champs ajoutés, un dé et un rappel seul passent', () => {
        const constats = controlerLePilote({
            franchissements: [{ id: 'abomination', champ: 'combat', ajouter: ['determination'], aPartirDe: { champ: 'combat' }, rappel: 'Abomination', mouvements: [],
                jet: { faces: 4, champ: 'determination' } }],
        } as never, fiche);
        expect(constats).toEqual([]);
    });

    it('un champ de seuil ou un champ ajouté absents se disent ; un dé sans faces est une erreur', () => {
        const constats = controlerLePilote({
            franchissements: [{ id: 's', champ: 'combat', ajouter: ['inconnu'], aPartirDe: { champ: 'absent' }, mouvements: [], jet: { faces: 0, champ: 'combat' } }],
        } as never, fiche).map(c => [c.ou, c.gravite]);
        expect(constats).toEqual([
            ['franchissements[0].aPartirDe', 'avertissement'],
            ['franchissements[0].champ', 'avertissement'],
            ['franchissements[0].jet', 'erreur'],
        ]);
    });

    it('un Avantage tactique sans nombre est une erreur', () => {
        const constats = controlerLePilote({ jet: {
            seuil: [{ id: 'a', label: 'A', sectionId: 'competences' }], reserve: { base: 1, max: 1, faces: 20 }, sens: 'sous-ou-egal',
            modificateurDuSeuil: { min: -5, max: 5, defaut: 0, avantage: { seuil: 'deux' } },
        } } as never, fiche).filter(c => c.ou.startsWith('jet.modificateurDuSeuil')).map(c => [c.ou, c.gravite]);
        expect(constats).toEqual([['jet.modificateurDuSeuil.avantage', 'erreur']]);
    });
});

/** **Le jet gardé** (Crimes, C1, 2026-10-22) : Potentiel GARDE Compétence. */
describe('le jet gardé', () => {
    const constats = (jet: Record<string, unknown>) =>
        controlerLePilote({ jet } as never, fiche)
            .filter(c => c.ou.startsWith('jet.garde') || c.ou.startsWith('jet.reserve'))
            .map(c => [c.ou, c.gravite]);
    const crimes = {
        reserve: { base: 0, max: 10, faces: 10, composantes: [{ id: 'potentiel', label: 'Potentiel', sectionId: 'jauges' }] },
        sens: 'superieur-ou-egal',
        garde: {
            competence: { id: 'competence', label: 'Compétence', sectionId: 'competences' },
            seuil: 9, competent: 1, specialise: 2,
        },
    };

    it('le réglage de Crimes passe sans un mot', () => {
        expect(constats(crimes)).toEqual([]);
    });

    it('sans réserve à lire, ou sans nombres, c’est une erreur', () => {
        expect(constats({ ...crimes, reserve: { base: 0, max: 10, faces: 10 } }))
            .toEqual([['jet.reserve.composantes', 'erreur']]);
        expect(constats({ ...crimes, garde: { ...crimes.garde, seuil: 'neuf' } }))
            .toEqual([['jet.garde', 'erreur']]);
    });

    it('un seuil additionné ou une difficulté à côté sont des réglages morts', () => {
        expect(constats({ ...crimes, difficulte: { min: 9, max: 9, defaut: 9 } }))
            .toEqual([['jet.garde', 'avertissement']]);
    });

    it('une compétence absente ou un préfixe qui ne désigne aucune case se disent', () => {
        expect(constats({ ...crimes, garde: { ...crimes.garde, specialisations: { parCompetence: { combat: 'specialites_combat_', sport: 'x_' } } } }))
            .toEqual([['jet.garde.specialisations', 'avertissement'], ['jet.garde.specialisations', 'avertissement']]);
    });

    it('des marques ou un compteur de dépassement absents de la fiche se disent (C2, C3)', () => {
        expect(constats({ ...crimes, garde: { ...crimes.garde,
            atteintes: { parPotentiel: { combat: { fatigue: 'f', epuisement: 'determination', blessures: 'b' } }, incapacite: 'physique' },
            depassement: { champ: 'depassement' } } }))
            .toEqual([
                ['jet.garde.atteintes', 'avertissement'], ['jet.garde.atteintes.incapacite', 'avertissement'],
                ['jet.garde.depassement', 'avertissement'],
            ]);
        expect(constats({ ...crimes, garde: { ...crimes.garde, depassement: { champ: 'combat' } } }))
            .toEqual([['jet.garde.depassement', 'avertissement']]);
    });

    it('une table d’armes inconnue est une erreur (C6)', () => {
        expect(constats({ ...crimes, garde: { ...crimes.garde, armes: 'crimes' } })).toEqual([]);
        expect(constats({ ...crimes, garde: { ...crimes.garde, armes: 'belle-epoque' } })).toEqual([['jet.garde.armes', 'erreur']]);
    });

    it('les champs de la psychologie, des contacts, de la fortune et de la création se vérifient (C0.1 à C8)', () => {
        expect(constats({ ...crimes, garde: { ...crimes.garde,
            circonstances: { angoisse: 'combat' }, hermetiques: ['combat'], munitions: 'combat',
            psychologie: { angoisse: 'combat', nevrose: 'combat', psychose: 'combat', mental: 'combat', innocence: { score: 'combat', seuil: 'combat' } },
            contacts: [{ nom: 'combat', loyaute: 'combat' }], fortune: { niveau: 'combat', jauge: 'combat' },
            creation: { potentiels: ['combat'], developpement: 'combat' } } })).toEqual([]);
        expect(constats({ ...crimes, garde: { ...crimes.garde,
            psychologie: { angoisse: 'angoisse', nevrose: 'combat', psychose: 'combat', mental: 'combat', innocence: { score: 'innocence', seuil: 'combat' } },
            contacts: [{ nom: 'combat', loyaute: 'combat', appels: 'appels' }], fortune: { niveau: 'combat', jauge: 'piste' } } }))
            .toEqual([
                ['jet.garde.psychologie.angoisse', 'avertissement'], ['jet.garde.psychologie.innocence', 'avertissement'],
                ['jet.garde.contacts', 'avertissement'], ['jet.garde.fortune', 'avertissement'],
            ]);
    });

    it('la compétence vise une section de la fiche', () => {
        expect(constats({ ...crimes, garde: { ...crimes.garde, competence: { id: 'competence', label: 'Compétence', sectionId: 'aptitudes' } } }))
            .toEqual([['jet.garde.competence[0].sectionId', 'erreur']]);
    });
});

/** **Les styles d'enquêteur** (Crimes, C5, 2026-10-22). */
describe('les styles d’enquêteur', () => {
    it('deux champs de fiche par style ; un absent se dit', () => {
        const constats = (styles: unknown[]) => controlerLePilote({ enquete: { styles } } as never, fiche)
            .filter(c => c.ou.startsWith('enquete')).map(c => [c.ou, c.gravite]);
        expect(constats([{ id: 'limier', label: 'Limier', niveau: 'combat', points: 'determination' }])).toEqual([]);
        expect(constats([{ id: 'limier', label: 'Limier', niveau: 'combat', points: 'compteur_limier' }]))
            .toEqual([['enquete.styles[0]', 'avertissement']]);
    });
});

/** **Symbaroum jusqu'au bout** (2026-10-23) : les champs de `jet.symbaroum`, la Défense jetable, les départages. */
describe('le bloc Symbaroum et les départages', () => {
    const jet = (symbaroum: Record<string, unknown>, seuil: Record<string, unknown>[] = [{ id: 'attribut', label: 'Attribut', sectionId: 'competences' }]) =>
        ({ seuil, reserve: { base: 1, max: 1, faces: 20 }, sens: 'sous-ou-egal', symbaroum });
    const constats = (driver: Record<string, unknown>) =>
        controlerLePilote(driver as never, fiche)
            .filter(c => c.ou.startsWith('jet.symbaroum') || c.ou.startsWith('combat.departages'))
            .map(c => [c.ou, c.gravite]);

    it('des champs présents et une Défense qu’on peut choisir passent sans un mot', () => {
        expect(constats({ jet: jet({ force: 'combat', defense: 'determination' },
            [{ id: 'attribut', label: 'Attribut', sectionId: 'competences', sectionsSupplementaires: ['jauges'], motif: '^(combat|determination)$' }]),
        combat: { statsToTrack: [], initiativeFormula: 'combat', departages: ['determination'] } })).toEqual([]);
    });

    it('un champ absent est une erreur ; une Défense hors du jet, un avertissement', () => {
        expect(constats({ jet: jet({ force: 'force', defense: 'determination' }) })).toEqual([
            ['jet.symbaroum.force', 'erreur'],
            ['jet.symbaroum.defense', 'avertissement'],
        ]);
    });

    it('un départage qui invoque un champ inconnu est une erreur', () => {
        expect(constats({ combat: { statsToTrack: [], initiativeFormula: 'combat', departages: ['vigilance'] } }))
            .toEqual([['combat.departages', 'erreur']]);
    });
});

/** **Star Trek jusqu'au bout** (2026-10-23) : les champs de `jet.starTrek`, le départ par personnage. */
describe('le bloc Star Trek et le départ par personnage', () => {
    const jet = (starTrek: Record<string, unknown>) => ({ seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'competences' }], reserve: { base: 2, max: 5, faces: 20 }, sens: 'sous-ou-egal', starTrek });
    const constats = (driver: Record<string, unknown>) => controlerLePilote(driver as never, fiche)
        .filter(c => c.ou.startsWith('jet.starTrek') || c.ou.includes('departParPersonnage')).map(c => [c.ou, c.gravite]);

    it('des champs présents passent sans un mot ; un champ absent est une erreur', () => {
        expect(constats({ jet: jet({ forme: 'combat', stress: { courant: 'determination' } }) })).toEqual([]);
        expect(constats({ jet: jet({ forme: 'forme', stress: { courant: 'determination' } }) })).toEqual([['jet.starTrek.forme', 'erreur']]);
    });

    it('un départ par personnage sans « Nouveau scénario » s’avertit ; négatif, c’est une erreur', () => {
        const menace = { id: 'menace', label: 'Menace', proprietaire: 'meneur', depart: 2, min: 0 };
        expect(constats({ ressourcesDeTable: [{ ...menace, departParPersonnage: 2 }] })).toEqual([['ressourcesDeTable[0].departParPersonnage', 'avertissement']]);
        expect(constats({ ressourcesDeTable: [{ ...menace, departParPersonnage: -1, remiseAuDepartParScenario: true }] })).toEqual([['ressourcesDeTable[0].departParPersonnage', 'erreur']]);
        expect(constats({ ressourcesDeTable: [{ ...menace, departParPersonnage: 2, remiseAuDepartParScenario: true }] })).toEqual([]);
    });
});
