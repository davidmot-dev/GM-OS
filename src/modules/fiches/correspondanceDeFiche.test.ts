import { describe, it, expect, vi } from 'vitest';
import {
    NIVEAU_ET_DE, cheminDeLaCorrespondance, lireLaCorrespondance,
    verifierLaCorrespondance, versLaFiche, versGmOs,
    type CorrespondanceDeFiche,
} from './correspondanceDeFiche';
import type { InventoryItem } from '../../types/player.types';

/**
 * **La table de correspondance — la logique, sur des tables écrites à la main.**
 *
 * Les **vraies** tables du dépôt sont éprouvées contre le **vrai** moteur de
 * fiches par `electron/correspondanceDesFiches.test.ts` : les tests de `src/`
 * tournent avec le shim `fs` d'Electron et ne peuvent pas lire le disque.
 */

const TABLE: CorrespondanceDeFiche = {
    version: 1,
    gabaritDeLaFiche: 'controle',
    champs: [
        { gmos: 'nom', fiche: 'identity.name' },
        { gmos: 'nature', fiche: 'identity.type', valeurs: { human: 'Humain', replicant: 'Réplicant' } },
        { gmos: 'vigueur', fiche: ['attributes.vigor.level', 'attributes.vigor.base_die'], transforme: 'niveauEtDe' },
    ],
    objets: [{
        destination: 'inventoryItems',
        prefixe: 'weapons',
        emplacements: [0, 1],
        type: 'weapon',
        nom: 'name',
        proprietes: { damage: 'degats' },
    }],
    absents: [{ fiche: 'points.humanity', pourquoi: 'Doit revenir par la Forge.' }],
};

const CLES_DE_LA_FICHE = [
    'identity.name', 'identity.type',
    'attributes.vigor.level', 'attributes.vigor.base_die',
    'weapons.0.name', 'weapons.0.damage', 'weapons.1.name', 'weapons.1.damage',
    'points.humanity',
];

const arme = (id: string, name: string, degats: string): InventoryItem => ({
    id, name, type: 'weapon', rarity: 'common', weight: 0, quantity: 1,
    description: '', properties: { degats },
});

describe('niveauEtDe — la lettre détermine le dé', () => {
    it('décompose et recompose sans ambiguïté', () => {
        expect(NIVEAU_ET_DE.decomposer('C (D8)')).toEqual(['C', 'D8']);
        expect(NIVEAU_ET_DE.composer('C', 'D8')).toBe('C (D8)');
        expect(NIVEAU_ET_DE.composer('A', 'D12')).toBe('A (D12)');
    });

    /** La fiche est saisie à la main : refuser une forme lisible n'aurait servi personne. */
    it('accepte les formes qu’un humain écrit', () => {
        expect(NIVEAU_ET_DE.decomposer('b (d10)')).toEqual(['B', 'D10']);
        expect(NIVEAU_ET_DE.decomposer('D')).toEqual(['D', 'D6']);
    });

    /**
     * Le dé se dérive de la lettre, jamais l'inverse — c'est la règle du jeu.
     * Une fiche où quelqu'un a tapé un dé qui ne va pas avec sa lettre est
     * corrigée au passage plutôt que propagée dans GM-OS.
     */
    it('corrige un dé qui contredit sa lettre', () => {
        expect(NIVEAU_ET_DE.composer('B', 'D8')).toBe('B (D10)');
    });

    /** Une fiche à moitié remplie rend tout de même un niveau. */
    it('retombe sur le dé quand la lettre manque', () => {
        expect(NIVEAU_ET_DE.composer('', 'D12')).toBe('A (D12)');
        expect(NIVEAU_ET_DE.composer('', '')).toBe('');
        expect(NIVEAU_ET_DE.decomposer('')).toEqual(['', '']);
        expect(NIVEAU_ET_DE.decomposer('Z')).toEqual(['', '']);
    });
});

describe('lireLaCorrespondance', () => {
    it('lit une table valide', () => {
        expect(lireLaCorrespondance(JSON.stringify(TABLE))?.gabaritDeLaFiche).toBe('controle');
    });

    /** Une table illisible est un incident, pas un cas normal : elle doit parler. */
    it('refuse et dit pourquoi', () => {
        const erreur = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(lireLaCorrespondance('{ pas du json')).toBeNull();
        expect(lireLaCorrespondance('{"version":2,"champs":[]}')).toBeNull();
        expect(lireLaCorrespondance('{"version":1}')).toBeNull();
        expect(erreur).toHaveBeenCalledTimes(3);
        erreur.mockRestore();
    });

    it('donne le chemin, à côté de la fiche', () => {
        expect(cheminDeLaCorrespondance('systems/blade-runner')).toBe('systems/blade-runner/fiche/correspondance.json');
    });
});

describe('verifierLaCorrespondance', () => {
    it('ne relève rien sur une table complète', () => {
        expect(verifierLaCorrespondance(TABLE, CLES_DE_LA_FICHE)).toEqual([]);
    });

    it('attrape une clé citée qui n’existe pas', () => {
        const defauts = verifierLaCorrespondance(TABLE, CLES_DE_LA_FICHE.filter(c => c !== 'identity.type'));
        expect(defauts.map(d => d.message).join(' ')).toContain('« identity.type » n\'existe pas');
    });

    /**
     * **Le sens qui compte.** Une clé ajoutée par une régénération ne se voit
     * pas autrement : la table continue de marcher, et un champ de la fiche
     * n'arrive simplement jamais dans GM-OS.
     */
    it('attrape une clé que la fiche a gagnée', () => {
        const defauts = verifierLaCorrespondance(TABLE, [...CLES_DE_LA_FICHE, 'identity.nickname']);
        expect(defauts).toHaveLength(1);
        expect(defauts[0].message).toContain('« identity.nickname », que la table ne cite nulle part');
    });

    it('refuse une transformation absente, inconnue, ou seule', () => {
        const sansNom = { ...TABLE, champs: [{ gmos: 'v', fiche: ['a', 'b'] as [string, string] }] };
        const inconnue = { ...TABLE, champs: [{ gmos: 'v', fiche: ['a', 'b'] as [string, string], transforme: 'nimporte' }] };
        const seule = { ...TABLE, champs: [{ gmos: 'v', fiche: 'a', transforme: 'niveauEtDe' }] };

        expect(verifierLaCorrespondance(sansNom, ['a', 'b']).some(d => d.message.includes('sans transformation'))).toBe(true);
        expect(verifierLaCorrespondance(inconnue, ['a', 'b']).some(d => d.message.includes('inconnue'))).toBe(true);
        expect(verifierLaCorrespondance(seule, ['a']).some(d => d.message.includes('demande deux clés'))).toBe(true);
    });

    it('refuse une traduction de valeurs non inversible', () => {
        const table = {
            ...TABLE,
            champs: [{ gmos: 'n', fiche: 'k', valeurs: { a: 'Même', b: 'Même' } }],
            objets: undefined, absents: undefined,
        };
        expect(verifierLaCorrespondance(table, ['k']).some(d => d.message.includes('inversible'))).toBe(true);
    });

    it('refuse deux citations d’une même clé, et deux fois le même identifiant', () => {
        const table = { ...TABLE, champs: [{ gmos: 'a', fiche: 'k' }, { gmos: 'a', fiche: 'k' }], objets: undefined, absents: undefined };
        const messages = verifierLaCorrespondance(table, ['k']).map(d => d.message).join(' ');
        expect(messages).toContain('citée deux fois');
        expect(messages).toContain('déclaré deux fois');
    });

    /**
     * Le gabarit de GM-OS vient de la Forge et n'est pas sur le disque : ce sens
     * ne se vérifie qu'à l'exécution, et il avertit — un gabarit qu'on enrichit
     * n'est pas une panne.
     */
    it('avertit sans échouer quand GM-OS ignore un champ cité', () => {
        const defauts = verifierLaCorrespondance(TABLE, CLES_DE_LA_FICHE, ['nom', 'vigueur']);
        expect(defauts).toHaveLength(1);
        expect(defauts[0]).toMatchObject({ gravite: 'avertissement' });
        expect(defauts[0].message).toContain('« nature »');
    });
});

describe('versLaFiche', () => {
    it('renomme, traduit et décompose', () => {
        const lot = versLaFiche({ sheetData: { nom: 'Rick', nature: 'Réplicant', vigueur: 'C (D8)' } }, TABLE);

        expect(lot['identity.name']).toBe('Rick');
        expect(lot['identity.type']).toBe('replicant');
        expect(lot['attributes.vigor.level']).toBe('C');
        expect(lot['attributes.vigor.base_die']).toBe('D8');
    });

    /**
     * Écrire vide plutôt qu'omettre : sinon effacer un champ dans GM-OS
     * laisserait l'ancienne valeur affichée sur la fiche.
     */
    it('écrit vide au lieu d’omettre', () => {
        const lot = versLaFiche({ sheetData: {} }, TABLE);
        expect(lot).toHaveProperty('identity.name', '');
        expect(lot['attributes.vigor.level']).toBe('');
        expect(lot['weapons.0.name']).toBe('');
    });

    it('remplit les emplacements d’armes dans l’ordre', () => {
        const lot = versLaFiche({
            sheetData: {},
            inventoryItems: [
                { ...arme('i1', 'Sac', ''), type: 'other' },
                arme('i2', 'Blaster', '3'),
            ],
        }, TABLE);

        expect(lot['weapons.0.name']).toBe('Blaster');
        expect(lot['weapons.0.damage']).toBe('3');
        expect(lot['weapons.1.name']).toBe('');
    });
});

describe('versGmOs', () => {
    it('fait l’aller-retour sans rien perdre', () => {
        const depart = {
            sheetData: { nom: 'Rick', nature: 'Humain', vigueur: 'B (D10)' },
            inventoryItems: [arme('i1', 'Blaster', '3')],
        };
        const retour = versGmOs(versLaFiche(depart, TABLE), TABLE, depart.inventoryItems);

        expect(retour.sheetData).toEqual(depart.sheetData);
        expect(retour.inventoryItems).toEqual(depart.inventoryItems);
    });

    /** L'identifiant survit : un transfert d'objet ne doit pas viser un disparu. */
    it('garde l’identifiant de l’objet qu’il réécrit', () => {
        const avant = [arme('i1', 'Blaster', '3')];
        const retour = versGmOs({ 'weapons.0.name': 'Blaster lourd', 'weapons.0.damage': '4' }, TABLE, avant);

        expect(retour.inventoryItems).toHaveLength(1);
        expect(retour.inventoryItems![0]).toMatchObject({ id: 'i1', name: 'Blaster lourd', properties: { degats: '4' } });
    });

    /**
     * La fiche de Blade Runner imprime trois lignes d'armes. Ce n'est pas une
     * raison pour perdre la quatrième ramassée en jeu, ni le sac à dos.
     */
    it('ne touche ni les autres types ni ce qui dépasse les emplacements', () => {
        const avant: InventoryItem[] = [
            { ...arme('sac', 'Sac', ''), type: 'other' },
            arme('a0', 'Blaster', '3'),
            arme('a1', 'Matraque', '1'),
            arme('a2', 'Fusil', '5'),
        ];
        const retour = versGmOs({ 'weapons.0.name': 'Blaster', 'weapons.0.damage': '3' }, TABLE, avant);

        const noms = retour.inventoryItems!.map(o => o.name);
        expect(noms).toContain('Sac');
        expect(noms).toContain('Fusil');
        expect(noms).not.toContain('Matraque'); // l'emplacement 1 a été vidé dans la fiche
    });

    /**
     * Une table sans bloc `objets` ne dit **rien** de l'inventaire. Rendre une
     * liste vide l'effacerait à chaque remontée.
     */
    it('ne dit rien de l’inventaire quand la table n’en parle pas', () => {
        const sansObjets = { ...TABLE, objets: undefined };
        expect(versGmOs({}, sansObjets, [arme('i1', 'Blaster', '3')])).not.toHaveProperty('inventoryItems');
    });
});
