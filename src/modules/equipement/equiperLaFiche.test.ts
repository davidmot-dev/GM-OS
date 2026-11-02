import { describe, it, expect } from 'vitest';
import type { CatalogueDEquipement, GameDriver } from '../../types/drivers';
import {
    appliquerLesEcritures, champsDEquipement, ecrituresDeLObjet, effetsAuJet, emportesEquipables, famillesEquipables, objetPourLeSac,
    objetsPortes, sectionDuCatalogue, valeurDesEffetsCoches,
} from './equiperLaFiche';
import { equipementsAlien, type RegleDesJetsAlien } from '../dice/systemes/jetsAlien';

/**
 * « Prendre dans le catalogue » — § 203, étape D. Les identifiants des champs
 * sont ceux du pilote d'Alien de David (`docs/systems/alien/fiche/correspondance.json`).
 */
const EQUIPEMENT = { noms: 'field-1786783108730', bonus: 'bonus_armes', degats: 'degats_armes', portees: 'portees_armes' };
const pilote = {
    jet: { alien: { competence: 'competence', competences: {}, equipement: EQUIPEMENT } as unknown as RegleDesJetsAlien },
    combat: { alien: { protection: 'field-1786783170092', proprietesArmes: 'proprietes_armes' } },
} as unknown as GameDriver;
const CATALOGUE: CatalogueDEquipement = {
    colonnes: {
        arme: [{ id: 'bonus', libelle: 'Bonus', nature: 'nombre' }, { id: 'degats', libelle: 'Dégâts', nature: 'nombre' }, { id: 'portee', libelle: 'Portée', nature: 'texte' }],
        protection: [{ id: 'protection', libelle: 'Protection', nature: 'nombre' }],
    },
    objets: [
        { id: 'm41a', famille: 'arme', nom: 'Fusil à impulsion Armat M41A', valeurs: { bonus: '+1', degats: 2, portee: 'Longue' }, proprietes: ['Lance-grenades intégré', 'Mode auto', 'Perce-armure'] },
        { id: 'ak-104s', famille: 'arme', nom: 'Canon à impulsion intégré Norcomm AK-104S', valeurs: { degats: 2, portee: 'Longue' }, proprietes: ['Mode automatique', 'Perce-armure'] },
        { id: 'ccc5', famille: 'protection', nom: 'Combinaison de compression offensive CCC5', valeurs: { protection: 2 }, contient: ['ak-104s'] },
        { id: 'palmes', famille: 'materiel', nom: 'Palmes', valeurs: {} },
    ],
};
const objet = (id: string) => CATALOGUE.objets.find(o => o.id === id)!;
const champs = champsDEquipement(pilote);
const FICHE = { [EQUIPEMENT.noms]: 'Arme de recette', [EQUIPEMENT.bonus]: '0', [EQUIPEMENT.degats]: '1', [EQUIPEMENT.portees]: 'Courte', 'field-1786783170092': '0' };

describe('équiper la fiche depuis le catalogue', () => {
    it('lit les champs que le pilote déclare, et rien pour un pilote qui n’en déclare pas', () => {
        expect(famillesEquipables(champs)).toEqual(['arme', 'protection']);
        expect(champsDEquipement({ jet: undefined, combat: {} } as unknown as GameDriver)).toEqual({});
    });

    it('ajoute une arme au rang suivant de chaque champ, et le jet la lit avec ses chiffres', () => {
        const ecritures = ecrituresDeLObjet(champs, CATALOGUE, objet('m41a'), FICHE);
        expect(ecritures.map(e => [e.role, e.texte])).toEqual([
            ['Armes', 'Fusil à impulsion Armat M41A'], ['Bonus', '+1'], ['Dégâts', '2'], ['Portée', 'Longue'],
            ['Propriétés', 'Lance-grenades intégré, Mode auto, Perce-armure'],
        ]);
        const fiche = { ...FICHE, ...appliquerLesEcritures(FICHE, ecritures) };
        // La propriété manquait pour l'arme de recette : sa ligne vide est gardée, la M41A vient au rang 2.
        expect(fiche.proprietes_armes).toBe('\nLance-grenades intégré, Mode auto, Perce-armure');
        const armes = equipementsAlien(pilote.jet!.alien!, fiche);
        expect(armes.map(a => [a.nom, a.bonus, a.degats, a.portee])).toEqual([
            ['Arme de recette', 0, 1, 'Courte'], ['Fusil à impulsion Armat M41A', 1, 2, 'Longue'],
        ]);
    });

    it('n’écrase jamais une ligne : l’arme vient après le plus long des champs', () => {
        const decale = { ...FICHE, [EQUIPEMENT.bonus]: '0\n+3' };
        const modifies = appliquerLesEcritures(decale, ecrituresDeLObjet(champs, CATALOGUE, objet('m41a'), decale));
        expect(modifies[EQUIPEMENT.bonus]).toBe('0\n+3\n+1');
        expect(modifies[EQUIPEMENT.noms]).toBe('Arme de recette\n\nFusil à impulsion Armat M41A');
    });

    it('écrit 0 pour un bonus que le livre laisse vide', () => {
        expect(ecrituresDeLObjet(champs, CATALOGUE, objet('ak-104s'), FICHE).find(e => e.role === 'Bonus')?.texte).toBe('0');
    });

    it('remplace la Protection en disant ce qu’elle était, et propose ce que la combinaison emporte', () => {
        const ecritures = ecrituresDeLObjet(champs, CATALOGUE, objet('ccc5'), { ...FICHE, 'field-1786783170092': '6' });
        expect(ecritures).toEqual([{ champ: 'field-1786783170092', role: 'Protection', mode: 'valeur', texte: '2', avant: '6' }]);
        expect(emportesEquipables(champs, CATALOGUE, objet('ccc5')).map(o => o.id)).toEqual(['ak-104s']);
        // La combinaison et son canon en un geste : une Protection et une ligne d'arme.
        const tout = [...ecritures, ...ecrituresDeLObjet(champs, CATALOGUE, objet('ak-104s'), FICHE)];
        const modifies = appliquerLesEcritures(FICHE, tout);
        expect(modifies['field-1786783170092']).toBe('2');
        expect(modifies[EQUIPEMENT.noms]).toBe('Arme de recette\nCanon à impulsion intégré Norcomm AK-104S');
    });

    it('pose le bouton sur la section qui porte les champs déclarés, et nulle part sans catalogue', () => {
        const sections = [
            { id: 'identite', fields: [{ id: 'nom' }] },
            { id: 'armes-et-protections', fields: [{ id: EQUIPEMENT.noms }, { id: 'field-1786783170092' }] },
        ];
        expect(sectionDuCatalogue({ ...pilote, catalogue: CATALOGUE }, sections)).toBe('armes-et-protections');
        expect(sectionDuCatalogue(pilote, sections)).toBeNull();
        expect(sectionDuCatalogue({ ...pilote, catalogue: CATALOGUE }, [sections[0]])).toBeNull();
    });

    it('range la protection et le matériel dans le Sac à dos, reliés au catalogue, sans les doubler', () => {
        const palmes = { ...objet('palmes'), poids: '½', effets: [{ cible: 'mobilite', valeur: 2, condition: 'sous l’eau', texte: '+2 en Mobilité sous l’eau' }] };
        expect(famillesEquipables(champs, true)).toEqual(['arme', 'protection', 'materiel']);
        expect(ecrituresDeLObjet(champs, CATALOGUE, palmes, FICHE, [])).toEqual([{ champ: '', role: 'Sac à dos', mode: 'sac', texte: 'Palmes' }]);
        expect(ecrituresDeLObjet(champs, CATALOGUE, objet('ccc5'), FICHE, []).map(e => e.role)).toEqual(['Protection', 'Sac à dos']);
        const sac = [{ id: 'i1', ...objetPourLeSac(palmes) }];
        expect(sac[0]).toMatchObject({ name: 'Palmes', type: 'matériel', weight: 0.5, properties: { catalogueId: 'palmes' } });
        expect(ecrituresDeLObjet(champs, CATALOGUE, palmes, FICHE, sac)[0].dejaLa).toBe(true);
        // Le Sac à dos ne touche aucun champ de la fiche.
        expect(appliquerLesEcritures(FICHE, ecrituresDeLObjet(champs, CATALOGUE, palmes, FICHE, []))).toEqual({});
    });

    it('ne sait rien écrire pour du matériel', () => {
        expect(ecrituresDeLObjet(champs, CATALOGUE, objet('palmes'), FICHE)).toEqual([]);
    });
});

describe('les effets portés, rappelés au jet (étape E)', () => {
    const avecEffets: CatalogueDEquipement = {
        ...CATALOGUE,
        objets: CATALOGUE.objets.map(o => (o.id === 'ccc5'
            ? { ...o, effets: [{ cible: 'observation', valeur: -1, texte: 'Malus de -1 aux tests d’Observation' }] }
            : o.id === 'palmes'
                ? { ...o, effets: [{ cible: 'mobilite', valeur: 2, condition: 'sous l’eau', texte: 'Bonus de +2 aux tests de Mobilité sous l’eau' }] }
                : o.id === 'm41a' ? { ...o, effets: [{ cible: 'observation', valeur: 1, texte: 'Lunette' }] } : o)),
    };
    const sac = [
        { id: 'i1', ...objetPourLeSac(avecEffets.objets.find(o => o.id === 'ccc5')!) },
        { id: 'i2', ...objetPourLeSac(avecEffets.objets.find(o => o.id === 'palmes')!) },
        { id: 'i3', name: 'Briquet', type: 'objet', rarity: 'commun', quantity: 1, weight: 0, description: '', properties: {} },
    ];

    it('porte ce qui est au Sac à dos et les armes nommées sur la fiche, chacun une fois', () => {
        const fiche = { ...FICHE, [EQUIPEMENT.noms]: 'Arme de recette\nfusil à impulsion armat m41a' };
        expect(objetsPortes(avecEffets, sac, champs, fiche).map(o => o.id).sort()).toEqual(['ccc5', 'm41a', 'palmes']);
        expect(objetsPortes(undefined, sac, champs, fiche)).toEqual([]);
    });

    it('ne rappelle que les effets qui visent un champ du jet, et compte ceux qui sont cochés', () => {
        const portes = objetsPortes(avecEffets, sac, champs, FICHE);
        const effets = effetsAuJet(portes, ['esprit', 'observation']);
        expect(effets.map(e => [e.objet, e.effet.valeur])).toEqual([['Combinaison de compression offensive CCC5', -1]]);
        expect(effetsAuJet(portes, ['agilite', 'mobilite']).map(e => e.effet.condition)).toEqual(['sous l’eau']);
        expect(valeurDesEffetsCoches(effets, new Set())).toBe(0);
        expect(valeurDesEffetsCoches(effets, new Set([effets[0].cle]))).toBe(-1);
    });
});
