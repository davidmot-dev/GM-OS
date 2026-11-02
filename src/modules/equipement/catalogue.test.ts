import { describe, it, expect } from 'vitest';
import type { CatalogueDEquipement, ObjetDuCatalogue } from '../../types/drivers';
import {
    ajouterUneColonne, ajouterUnObjet, catalogueVide, chercherDansLeCatalogue, controlerLeCatalogue, identifiantDObjet,
    modifierUnObjet, objetsContenus, objetsDeLaFamille, rangDuConstat, rangerParCategorie, retirerUneColonne, retirerUnObjet,
    valeursDeLaColonne,
} from './catalogue';
import { controlerLePilote } from '../forge/rules/controlesDuPilote';
import { SessionOSModuleSchema } from '../../types/schemas';

/**
 * Le catalogue d'équipement — § 203, étape A. Les exemples sont ceux de
 * Colonial Marines, relus contre le livre le 02/11/2026.
 */
const colonnesAlien: CatalogueDEquipement['colonnes'] = {
    arme: [
        { id: 'bonus', libelle: 'Bonus', nature: 'nombre' },
        { id: 'degats', libelle: 'Dégâts', nature: 'nombre' },
        { id: 'portee', libelle: 'Portée', nature: 'texte' },
    ],
    protection: [
        { id: 'protection', libelle: 'Protection', nature: 'nombre' },
        { id: 'reserveDAir', libelle: 'Réserve d’air', nature: 'nombre' },
    ],
};
const ak104s: ObjetDuCatalogue = {
    id: 'ak-104s', famille: 'arme', nom: 'Canon à impulsion intégré Norcomm AK-104S',
    valeurs: { bonus: 0, degats: 2, portee: 'Longue' }, proprietes: ['Mode automatique', 'Perce-armure'],
    source: { livre: 'Marines Coloniaux', page: 69 },
};
const ccc5: ObjetDuCatalogue = {
    id: 'ccc5', famille: 'protection', nom: 'Combinaison de compression offensive CCC5',
    valeurs: { protection: 2, reserveDAir: 5 }, contient: ['ak-104s'],
    effets: [{ cible: 'observation', valeur: -1, texte: '-1 aux tests d’Observation (visière étroite)' }],
};
const palmes: ObjetDuCatalogue = {
    id: 'palmes-m11', famille: 'materiel', nom: 'Palmes d’ornithorynque M11', valeurs: {}, poids: '½', cout: '100 $',
    effets: [{ cible: 'mobilite', valeur: 2, condition: 'sous l’eau', texte: '+2 aux tests de Mobilité sous l’eau' }],
};
const catalogue = (objets: ObjetDuCatalogue[], colonnes = colonnesAlien): CatalogueDEquipement => ({ colonnes, objets });

describe('controlerLeCatalogue', () => {
    it('ne dit rien d’un catalogue qui se tient, ni d’un pilote qui n’en a pas', () => {
        expect(controlerLeCatalogue(catalogue([ak104s, ccc5, palmes]))).toEqual([]);
        expect(controlerLeCatalogue(undefined)).toEqual([]);
    });

    it('refuse un objet contenu introuvable, et l’objet qui se contient lui-même', () => {
        const c = controlerLeCatalogue(catalogue([{ ...ccc5, contient: ['m41a', 'ccc5'] }]));
        expect(c.map(x => x.message)).toEqual([
            expect.stringContaining('« m41a », absent du catalogue'),
            expect.stringContaining('se contient lui-même'),
        ]);
        expect(c.every(x => x.gravite === 'erreur')).toBe(true);
    });

    it('signale une seule fois les objets qui s’emportent en cercle', () => {
        const a = { ...ak104s, contient: ['ccc5'] };
        const c = controlerLeCatalogue(catalogue([a, ccc5])).filter(x => x.message.includes('cercle'));
        expect(c).toHaveLength(1);
        expect(c[0].message).toContain('→');
    });

    it('refuse une valeur dans une colonne que le jeu ne déclare pas pour la famille', () => {
        const c = controlerLeCatalogue(catalogue([{ ...ak104s, valeurs: { ...ak104s.valeurs, protection: 3 } }]));
        expect(c).toEqual([{ gravite: 'erreur', ou: 'catalogue.objets[0].valeurs.protection',
            message: expect.stringContaining('n\'est pas une colonne des armes') }]);
    });

    it('avertit, sans refuser, d’un texte dans une colonne de nombres', () => {
        // Les dégâts d'une grenade s'écrivent « Puissance 9 » : lisibles, pas comptables.
        const m40 = { id: 'm40', famille: 'arme' as const, nom: 'Grenade HEDE Armat M40', valeurs: { degats: 'Puissance 9' } };
        expect(controlerLeCatalogue(catalogue([m40]))).toEqual([expect.objectContaining({ gravite: 'avertissement', ou: 'catalogue.objets[0].valeurs.degats' })]);
        // « +2 », « -1 », « 1,5 » sont des nombres.
        expect(controlerLeCatalogue(catalogue([{ ...ak104s, valeurs: { bonus: '+2', degats: '1,5' } }]))).toEqual([]);
    });

    it('refuse les identifiants en double, les familles inconnues et les colonnes mal déclarées', () => {
        const c = controlerLeCatalogue({
            colonnes: { ...colonnesAlien, arme: [...colonnesAlien.arme!, { id: 'bonus', libelle: '', nature: 'nombre' }], gadget: [] } as CatalogueDEquipement['colonnes'],
            objets: [ak104s, { ...ak104s }, { ...palmes, famille: 'bijou' as never }],
        });
        const ou = c.map(x => x.ou);
        expect(ou).toEqual(expect.arrayContaining(['catalogue.colonnes.arme[3].id', 'catalogue.colonnes.arme[3].libelle', 'catalogue.colonnes.gadget', 'catalogue.objets[1].id', 'catalogue.objets[2].famille']));
    });

    it('refuse un effet muet et une page qui n’en est pas une', () => {
        const c = controlerLeCatalogue(catalogue([{ ...palmes, effets: [{ cible: 'mobilite', texte: ' ' }], source: { livre: 'x', page: 0 } }]));
        expect(c.map(x => x.ou)).toEqual(['catalogue.objets[0].effets[0]', 'catalogue.objets[0].source.page']);
    });

    it('survit à la validation de l’état sauvegardé', () => {
        // Les pilotes passent par `SessionOSModuleSchema` en `passthrough` : le
        // resserrer effacerait le catalogue au rechargement, sans un mot.
        const cat = catalogue([ak104s, ccc5]);
        const etat = SessionOSModuleSchema.parse({ customGameDrivers: [{ id: 'alien', name: 'Alien', catalogue: cat }] });
        expect((etat.customGameDrivers?.[0] as { catalogue?: unknown }).catalogue).toEqual(cat);
    });

    it('passe par controlerLePilote', () => {
        const constats = controlerLePilote({ catalogue: catalogue([{ ...ccc5, contient: ['m41a'] }]) }, { sections: [] });
        expect(constats).toEqual(expect.arrayContaining([expect.objectContaining({ ou: 'catalogue.objets[0].contient[0]', gravite: 'erreur' })]));
    });
});

describe('lire le catalogue', () => {
    const cat = catalogue([ak104s, ccc5, palmes]);

    it('déplie les objets emportés, en ignorant une référence introuvable', () => {
        expect(objetsContenus(cat, ccc5).map(o => o.id)).toEqual(['ak-104s']);
        expect(objetsContenus(cat, { ...ccc5, contient: ['inconnu', 'ak-104s'] }).map(o => o.id)).toEqual(['ak-104s']);
    });

    it('range par famille', () => {
        expect(objetsDeLaFamille(cat, 'materiel').map(o => o.id)).toEqual(['palmes-m11']);
        expect(objetsDeLaFamille(undefined, 'arme')).toEqual([]);
    });

    it('tire un identifiant unique du nom', () => {
        expect(identifiantDObjet('Fusil à impulsion M41A', [])).toBe('fusil-a-impulsion-m41a');
        expect(identifiantDObjet('Fusil à impulsion M41A', ['fusil-a-impulsion-m41a', 'fusil-a-impulsion-m41a-2'])).toBe('fusil-a-impulsion-m41a-3');
        expect(identifiantDObjet('  ', [])).toBe('objet');
    });
});

describe('les gestes de l’éditeur (étape B)', () => {
    it('ajoute une colonne dont l’identifiant vient du libellé, sans doublon', () => {
        let c = ajouterUneColonne(catalogueVide(), 'protection', 'Réserve d’air', 'nombre');
        c = ajouterUneColonne(c, 'protection', 'Réserve d’air', 'nombre');
        expect(c.colonnes.protection!.map(x => x.id)).toEqual(['reserve-d-air', 'reserve-d-air-2']);
        expect(controlerLeCatalogue(c)).toEqual([]);
    });

    it('retire une colonne avec ses valeurs, sans laisser d’erreur derrière elle', () => {
        const c = catalogue([ak104s, ccc5, palmes]);
        expect(valeursDeLaColonne(c, 'arme', 'portee')).toBe(1);
        const sans = retirerUneColonne(c, 'arme', 'portee');
        expect(sans.objets[0].valeurs).toEqual({ bonus: 0, degats: 2 });
        expect(sans.objets[1]).toBe(ccc5); // une autre famille n'est pas touchée
        expect(controlerLeCatalogue(sans)).toEqual([]);
    });

    it('supprime un objet et les renvois qui le visaient', () => {
        const sans = retirerUnObjet(catalogue([ak104s, ccc5]), 'ak-104s');
        expect(sans.objets.map(o => o.id)).toEqual(['ccc5']);
        expect(sans.objets[0].contient).toEqual([]);
        expect(controlerLeCatalogue(sans)).toEqual([]);
    });

    it('ajoute un objet nommé et garde son identifiant quand on le renomme', () => {
        const { catalogue: c, id } = ajouterUnObjet(catalogue([ak104s]), 'arme', 'Fusil à impulsion M41A');
        expect(id).toBe('fusil-a-impulsion-m41a');
        const renomme = modifierUnObjet(c, id, { nom: 'Fusil à impulsion M41A1' });
        expect(renomme.objets[1]).toMatchObject({ id, famille: 'arme', nom: 'Fusil à impulsion M41A1', valeurs: {} });
    });

    it('range par catégorie, les objets sans catégorie à la fin, et cherche sans accents', () => {
        const objets = [{ ...palmes, categorie: undefined }, { ...ak104s, categorie: 'Fusils' }, { ...ccc5, categorie: 'Armures' }];
        expect(rangerParCategorie(objets).map(g => g.categorie)).toEqual(['Fusils', 'Armures', 'Sans catégorie']);
        expect(chercherDansLeCatalogue(objets, 'ORNITHO').map(o => o.id)).toEqual(['palmes-m11']);
        expect(chercherDansLeCatalogue(objets, 'perce').map(o => o.id)).toEqual(['ak-104s']);
        expect(chercherDansLeCatalogue(objets, '  ')).toHaveLength(3);
    });

    it('retrouve l’objet que vise un constat', () => {
        expect(rangDuConstat('catalogue.objets[12].valeurs.degats')).toBe(12);
        expect(rangDuConstat('catalogue.colonnes.arme[0].id')).toBeNull();
    });
});
