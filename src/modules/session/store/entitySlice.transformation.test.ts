import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from './index';
import type { Entity } from '../../../types/entity.types';
import type { Scene } from '../../../types/trame.types';

/**
 * § 268 (21/11/2026) — les deux actions du magasin de séance. Ce que l'essai de
 * la logique ne voit pas : **une seule écriture** pour les entités, les joueurs
 * et les scènes, qui vivent dans deux tranches différentes du même magasin.
 * Un abonné ne doit jamais voir le personnage dans les deux listes, ou dans
 * aucune.
 */

const magasin = () => useSessionOSStore.getState();

const marta: Entity = {
    id: 'e-marta', name: 'Marta', type: 'npc', role: 'ally', status: 'alive', avatar: 'media:marta',
    hp: 7, maxHp: 10, ac: 0, speed: 0, initiative: 0, description: '', roleplayingNotes: '', gmSecretInfo: '',
    linkedMapIds: [], campaignId: 'c1', templateId: 'generic', sheetData: { force: 3 },
};

beforeEach(() => {
    useSessionOSStore.setState({
        entities: [marta],
        players: [{
            id: 'p1', realName: 'Ana', avatarUrl: '', isOnline: true,
            characters: [{ id: 'pc1', name: 'Rachel', portraitUrl: '', campaignId: 'c1', templateId: 'generic', sheetData: {} }],
        }],
        scenes: [{ id: 's1', entiteIds: ['e-marta'], personnagesIds: ['pc1'] } as unknown as Scene],
    });
});

/** Chaque état vu par un abonné : le personnage y est-il exactement une fois ? */
function suivreLesEcritures(id: string) {
    const vus: number[] = [];
    const arreter = useSessionOSStore.subscribe(s => {
        vus.push(s.entities.filter(e => e.id === id).length + s.players.flatMap(p => p.characters).filter(c => c.id === id).length);
    });
    return { vus, arreter };
}

describe('transformer depuis le magasin de séance', () => {
    it('un PNJ devient PJ en une seule écriture, scènes comprises', () => {
        const { vus, arreter } = suivreLesEcritures('e-marta');
        expect(magasin().transformerEnPersonnage('e-marta', 'p1')).toBeNull();
        arreter();
        expect(vus).toEqual([1]);
        expect(magasin().entities).toEqual([]);
        expect(magasin().players[0].characters.map(c => c.id)).toEqual(['pc1', 'e-marta']);
        expect(magasin().scenes[0].personnagesIds).toEqual(['pc1', 'e-marta']);
        expect(magasin().scenes[0].entiteIds).toEqual([]);
    });

    it('un PJ devient PNJ en une seule écriture, au rôle choisi', () => {
        const { vus, arreter } = suivreLesEcritures('pc1');
        expect(magasin().transformerEnPnj('p1', 'pc1', 'hostile')).toBeNull();
        arreter();
        expect(vus).toEqual([1]);
        expect(magasin().players[0].characters).toEqual([]);
        expect(magasin().entities.find(e => e.id === 'pc1')).toMatchObject({ role: 'hostile', campaignId: 'c1', isVisibleByPlayers: true });
        expect(magasin().scenes[0].entiteIds).toEqual(['e-marta', 'pc1']);
    });

    it('un refus n’écrit rien', () => {
        const { vus, arreter } = suivreLesEcritures('e-marta');
        expect(magasin().transformerEnPersonnage('e-marta', 'joueur-absent')).toBe('joueur-introuvable');
        arreter();
        expect(vus).toEqual([]);
        expect(magasin().entities).toEqual([marta]);
    });

    it('l’aller-retour par le magasin rend le PNJ', () => {
        magasin().transformerEnPersonnage('e-marta', 'p1');
        magasin().transformerEnPnj('p1', 'e-marta', 'ally');
        const { reserveDeTransformation: _r, ...retour } = magasin().entities.find(e => e.id === 'e-marta')!;
        expect(retour).toEqual(marta);
    });
});
