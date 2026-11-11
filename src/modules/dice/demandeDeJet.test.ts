import { describe, it, expect } from 'vitest';
import {
    composantesARetenir, champsProposes, compositionValable, composerLaDemande,
    lireLaDemande, titreDeLaComposition, type DemandeDeJet,
} from './demandeDeJet';
import type { DescripteurDeJet } from './DescripteurDeJet';
import { DEFAULT_SHEET_TEMPLATES, type SheetSection } from '../../data/defaultSheetTemplates';
import { DEFAULT_GAME_DRIVERS } from '../../data/defaultGameDrivers';

/**
 * Ce que ces essais protègent (plan `2026-11-11-jets-demandes-et-caches.md`, T1) :
 * une demande de jet ne précompose **que** ce que le menu de la fiche proposerait,
 * pour chaque famille de jet, et rien de ce qui arrive du réseau n'est cru sans
 * relecture.
 */

const champ = (id: string, label = id, extra: Record<string, unknown> = {}) =>
    ({ id, label, type: 'number', defaultValue: 0, ...extra });

const SECTIONS = [
    { id: 'attributs', label: 'Attributs', fields: [champ('agilite', 'Agilité'), champ('force', 'Force')] },
    { id: 'competences', label: 'Compétences', fields: [champ('mobilite', 'Mobilité'), champ('combat', 'Combat')] },
    { id: 'speciales', label: 'Spéciales', fields: [champ('esquive', 'Esquive')] },
] as unknown as SheetSection[];

const SEUIL: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        { id: 'competence', label: 'Compétence', sectionId: 'competences' },
    ],
} as DescripteurDeJet;

const RESERVE: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: {
        base: 0, max: 20, faces: 6,
        composantes: [
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
            { id: 'competence', label: 'Compétence', sectionId: 'competences' },
        ],
    },
} as unknown as DescripteurDeJet;

const CIBLE: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    cible: {
        mecanique: 'reves-de-dragons',
        caracteristique: { id: 'carac', label: 'Caractéristique', sectionId: 'attributs' },
        ajustement: [{ id: 'competence', label: 'Compétence', sectionId: 'competences', sectionsSupplementaires: ['speciales'] }],
    },
} as unknown as DescripteurDeJet;

const FACULTATIVE: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    seuil: [
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        { id: 'competence', label: 'Compétence', sectionId: 'competences', facultative: true },
    ],
} as DescripteurDeJet;

describe('composantesARetenir — une règle pour toutes les familles', () => {
    it('seuil, réserve et cible donnent leurs composantes, dans l’ordre du panneau', () => {
        expect(composantesARetenir(SEUIL).map(c => c.id)).toEqual(['attribut', 'competence']);
        expect(composantesARetenir(RESERVE).map(c => c.id)).toEqual(['attribut', 'competence']);
        expect(composantesARetenir(CIBLE).map(c => c.id)).toEqual(['carac', 'competence']);
    });

    it('les dés échelonnés décident seuls, même si un seuil traîne encore', () => {
        const echelonnes = {
            ...SEUIL,
            desEchelonnes: { echelle: 'blade-runner', composantes: [{ id: 'att', label: 'Attribut', sectionId: 'attributs' }] },
        } as unknown as DescripteurDeJet;
        expect(composantesARetenir(echelonnes).map(c => c.id)).toEqual(['att']);
    });

    it('la garde de Crimes ajoute sa compétence', () => {
        const garde = { ...SEUIL, garde: { competence: { id: 'gardee', label: 'Compétence', sectionId: 'competences' }, seuil: 7 } } as unknown as DescripteurDeJet;
        expect(composantesARetenir(garde).map(c => c.id)).toEqual(['attribut', 'competence', 'gardee']);
    });

    it('rien sans descripteur', () => {
        expect(composantesARetenir(undefined)).toEqual([]);
    });
});

describe('champsProposes — les règles du menu', () => {
    it('sections supplémentaires comprises', () => {
        const comp = CIBLE.cible!.ajustement![0];
        expect(champsProposes(comp, SECTIONS, {}).map(c => c.id)).toEqual(['mobilite', 'combat', 'esquive']);
    });

    it('un nom n’est pas une valeur, un nom vide n’a rien à proposer, le motif filtre', () => {
        const sections = [{
            id: 'vecus', label: 'Vécus', fields: [
                champ('vecu_1_nom', 'Nom'), champ('vecu_1', 'Vécu 1', { libelleSur: 'vecu_1_nom' }),
                champ('vecu_2_nom', 'Nom'), champ('vecu_2', 'Vécu 2', { libelleSur: 'vecu_2_nom' }),
                champ('formule_aire', 'Aire'),
            ],
        }] as unknown as SheetSection[];
        const comp = { id: 'vecu', label: 'Vécu', sectionId: 'vecus', motif: '^vecu_\\d$' };
        expect(champsProposes(comp, sections, { vecu_1_nom: 'Marin' })).toEqual([
            { id: 'vecu_1', label: 'Marin', sectionId: 'vecus' },
        ]);
    });
});

describe('compositionValable', () => {
    it('garde une composition complète et ses réglages', () => {
        expect(compositionValable(
            { champs: { attribut: 'agilite', competence: 'mobilite' }, difficulte: 2, modificateurDuSeuil: -1 },
            SEUIL, SECTIONS, {},
        )).toEqual({ champs: { attribut: 'agilite', competence: 'mobilite' }, difficulte: 2, modificateurDuSeuil: -1 });
    });

    it('refuse un champ que la composante ne propose pas', () => {
        expect(compositionValable({ champs: { attribut: 'mobilite', competence: 'combat' } }, SEUIL, SECTIONS, {})).toBeNull();
    });

    it('refuse une composante obligatoire sans champ', () => {
        expect(compositionValable({ champs: { attribut: 'agilite' } }, RESERVE, SECTIONS, {})).toBeNull();
    });

    it('accepte une composante facultative laissée vide (Torg, non entraîné)', () => {
        expect(compositionValable({ champs: { attribut: 'force' } }, FACULTATIVE, SECTIONS, {}))
            .toEqual({ champs: { attribut: 'force' } });
    });

    it('jette les composantes que le jet ne connaît pas', () => {
        expect(compositionValable({ champs: { attribut: 'agilite', competence: 'combat', intrus: 'force' } }, SEUIL, SECTIONS, {}))
            .toEqual({ champs: { attribut: 'agilite', competence: 'combat' } });
    });

    it('un jeu qui ne compose rien n’a rien à demander', () => {
        expect(compositionValable({ champs: {} }, { sens: 'superieur-ou-egal' } as DescripteurDeJet, SECTIONS, {})).toBeNull();
    });
});

describe('composerLaDemande', () => {
    it('compose une demande titrée dans l’ordre des composantes', () => {
        const demande = composerLaDemande({
            id: 'd1', characterId: 'wilson', emiseLe: 1000, descripteur: RESERVE, sections: SECTIONS, valeurs: {},
            composition: { champs: { competence: 'mobilite', attribut: 'agilite' } },
        });
        expect(demande).toEqual({
            genre: 'test', id: 'd1', characterId: 'wilson', emiseLe: 1000, titre: 'Agilité + Mobilité',
            composition: { champs: { attribut: 'agilite', competence: 'mobilite' } },
        });
    });

    it('rien sans personnage ni composition valable', () => {
        const base = { id: 'd1', emiseLe: 1, descripteur: SEUIL, sections: SECTIONS, valeurs: {} };
        expect(composerLaDemande({ ...base, characterId: '', composition: { champs: { attribut: 'agilite', competence: 'combat' } } })).toBeNull();
        expect(composerLaDemande({ ...base, characterId: 'w', composition: { champs: {} } })).toBeNull();
    });

    it('le titre suit le nom saisi d’un champ nommé', () => {
        expect(titreDeLaComposition({ champs: { competence: 'esquive', carac: 'force' } }, CIBLE, SECTIONS, {}))
            .toBe('Force + Esquive');
    });

    it('un libellé à espace final donne le même titre chez le meneur et sur la tablette', () => {
        // Rêve de Dragon : « Bricolage␣ » et « Chirurgie␣ » dans la fiche exportée le 11/11.
        const sections = [
            { id: 'attributs', label: 'Attributs', fields: [champ('agilite', 'Agilité')] },
            { id: 'competences', label: 'Compétences', fields: [champ('bricolage', 'Bricolage ')] },
        ] as unknown as SheetSection[];
        const demande = composerLaDemande({
            id: 'd', characterId: 'c', emiseLe: 1, descripteur: SEUIL, sections, valeurs: {},
            composition: { champs: { attribut: 'agilite', competence: 'bricolage' } },
        });
        expect(demande!.titre).toBe('Agilité + Bricolage');
        expect(lireLaDemande(JSON.parse(JSON.stringify(demande)))).toEqual(demande);
    });
});

describe('le pilote Dune livré dans le code', () => {
    it('compose « Compétence + Principe » sur son gabarit', () => {
        const pilote = DEFAULT_GAME_DRIVERS.find(p => p.id === 'dune')!;
        const gabarit = DEFAULT_SHEET_TEMPLATES.find(t => t.id === pilote.templateId)!;
        const champs = Object.fromEntries(composantesARetenir(pilote.jet)
            .map(c => [c.id, champsProposes(c, gabarit.sections, {})[0]?.id]));
        const demande = composerLaDemande({
            id: 'd', characterId: 'paul', emiseLe: 1, descripteur: pilote.jet, sections: gabarit.sections, valeurs: {},
            composition: { champs, difficulte: 2 },
        });
        expect(Object.keys(demande!.composition.champs)).toEqual(['competence', 'principe']);
        expect(demande!.composition.difficulte).toBe(2);
    });
});

describe('lireLaDemande — ce qui arrive du réseau', () => {
    const valide: DemandeDeJet = {
        genre: 'test', id: 'd1', characterId: 'wilson', emiseLe: 5, titre: 'Agilité + Mobilité',
        composition: { champs: { attribut: 'agilite', competence: 'mobilite' }, difficulte: 1 },
    };

    it('relit une demande de test intacte', () => {
        expect(lireLaDemande(JSON.parse(JSON.stringify(valide)))).toEqual(valide);
    });

    it('relit une Sauvegarde de Cthulhu Hack', () => {
        expect(lireLaDemande({ genre: 'sauvegarde', id: 's', characterId: 'c', emiseLe: 1, titre: 'Force', champ: 'force', modificateur: 'avantage' }))
            .toEqual({ genre: 'sauvegarde', id: 's', characterId: 'c', emiseLe: 1, titre: 'Force', champ: 'force', modificateur: 'avantage' });
    });

    it('jette les champs inattendus et les nombres absurdes', () => {
        const lu = lireLaDemande({ ...valide, resultat: 66, composition: { ...valide.composition, difficulte: 1e9, modificateurDuSeuil: 1.5, desAchetes: 3 } });
        expect(lu).toEqual({ ...valide, composition: { champs: valide.composition.champs } });
    });

    it.each([
        ['rien', null],
        ['sans identifiant', { ...valide, id: '' }],
        ['sans personnage', { ...valide, characterId: 42 }],
        ['sans date', { ...valide, emiseLe: 'hier' }],
        ['genre inconnu', { ...valide, genre: 'degats' }],
        ['champs vides', { ...valide, composition: { champs: {} } }],
        ['champ non textuel', { ...valide, composition: { champs: { attribut: 3 } } }],
        ['champs en tableau', { ...valide, composition: { champs: ['agilite'] } }],
        ['sauvegarde sans champ', { genre: 'sauvegarde', id: 's', characterId: 'c', emiseLe: 1 }],
    ])('refuse : %s', (_nom, entree) => {
        expect(lireLaDemande(entree)).toBeNull();
    });
});
