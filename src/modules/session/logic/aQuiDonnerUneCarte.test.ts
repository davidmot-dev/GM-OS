import { describe, it, expect } from 'vitest';
import { voisinsAQuiDonner } from './aQuiDonnerUneCarte';

/**
 * **La liste « Donner à » de la tablette — signalé par David le 2026-08-30 :**
 * *« la liste des donner à, ce sont les PJ liés à la campagne en cours et
 * actifs »*. Elle montrait tout le monde.
 *
 * Le filtre par connexion n'est pas cosmétique : **une carte proposée perd ses
 * gestes tant que la demande est en attente.** L'offrir à un personnage que
 * personne ne tient la gèle jusqu'à ce que le meneur tranche depuis son écran.
 */

const RICK = { id: 'pc-rick', name: 'Rick', campaignId: 'c-blade' };
const WILLEM = { id: 'pc-willem', name: 'Willem', campaignId: 'c-blade' };
/** Un personnage d'une chronique en sommeil. */
const MAGICIEN = { id: 'pc-mage', name: 'Elandra', campaignId: 'c-eldoria' };

const JOUEURS = [{ characters: [RICK, WILLEM] }, { characters: [MAGICIEN] }];

/** Tout le monde est connecté, sauf mention contraire. */
const TOUS_CONNECTES = {
    'pc-rick': 'tab-1',
    'pc-willem': 'tab-2',
    'pc-mage': 'tab-3',
};

const noms = (v: { nom: string }[]) => v.map(x => x.nom);

describe('à qui proposer une carte', () => {
    it('ne garde que les personnages de la campagne ouverte', () => {
        const voisins = voisinsAQuiDonner(JOUEURS, 'pc-rick', 'c-blade', TOUS_CONNECTES);
        expect(noms(voisins)).toEqual(['Willem']);
    });

    /** *Offrir à quelqu'un qui n'est pas là immobilise la carte.* */
    it('écarte un personnage que personne ne tient', () => {
        const voisins = voisinsAQuiDonner(JOUEURS, 'pc-rick', 'c-blade', { 'pc-rick': 'tab-1' });
        expect(voisins).toEqual([]);
    });

    it('ne se propose pas à soi-même', () => {
        const voisins = voisinsAQuiDonner(JOUEURS, 'pc-willem', 'c-blade', TOUS_CONNECTES);
        expect(noms(voisins)).toEqual(['Rick']);
    });

    /**
     * La même tolérance que l'écran du meneur, `??` compris. Deux listes qui se
     * contredisent seraient pires qu'une liste large.
     */
    it('compte un personnage sans campagne comme étant dans la campagne ouverte', () => {
        const orphelin = { id: 'pc-x', name: 'Sans Chronique', campaignId: null };
        const voisins = voisinsAQuiDonner(
            [{ characters: [orphelin] }], 'pc-rick', 'c-blade', { 'pc-x': 'tab-9' });

        expect(noms(voisins)).toEqual(['Sans Chronique']);
    });

    it('rend une liste vide plutôt que de casser quand rien n’est encore arrivé', () => {
        expect(voisinsAQuiDonner(undefined, 'pc-rick', 'c-blade', TOUS_CONNECTES)).toEqual([]);
        expect(voisinsAQuiDonner(JOUEURS, 'pc-rick', 'c-blade', undefined)).toEqual([]);
        expect(voisinsAQuiDonner([{ characters: null }], 'pc-rick', 'c-blade', TOUS_CONNECTES)).toEqual([]);
    });

    it('ne rend que l’identifiant et le nom', () => {
        const voisins = voisinsAQuiDonner(JOUEURS, 'pc-rick', 'c-blade', TOUS_CONNECTES);
        expect(voisins).toEqual([{ id: 'pc-willem', nom: 'Willem' }]);
    });
});
