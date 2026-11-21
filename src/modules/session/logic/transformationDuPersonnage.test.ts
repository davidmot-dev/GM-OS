import { describe, it, expect } from 'vitest';
import type { Entity } from '../../../types/entity.types';
import type { Player, PlayerCharacter } from '../../../types/player.types';
import type { Scene } from '../../../types/trame.types';
import {
    pnjEnPersonnage,
    personnageEnPnj,
    transformerEnPersonnage,
    transformerEnPnj,
    reecrireLesRelations,
    deplacerDansLesScenes,
    suitesDeLaTransformation,
    type EtatDesPersonnages,
} from './transformationDuPersonnage';

/**
 * § 268 (21/11/2026) — David : « je voudrais pouvoir transformer un PNJ en
 * Personnage Joueur, et vice-versa ». Décisions : déplacer (même identifiant),
 * données sans équivalent gardées en réserve et rendues au retour.
 */

const sante = { type: 'hp' as const, data: { current: 7, max: 10 }, state: 'wounded' as const, badges: [] };

const marta: Entity = {
    id: 'e-marta',
    name: 'Marta',
    type: 'npc',
    role: 'ally',
    status: 'alive',
    avatar: 'media:marta',
    hp: 7,
    maxHp: 10,
    ac: 2,
    speed: 0,
    initiative: 3,
    description: 'Contrebandière',
    roleplayingNotes: 'Parle vite',
    gmSecretInfo: 'Doit de l’argent au cartel',
    linkedMapIds: ['carte-1'],
    campaignId: 'camp-1',
    templateId: 'tpl-jeu',
    sheetData: { force: 3 },
    healthSystem: sante,
    relations: [{ targetId: 'pc-rachel', targetType: 'pc', type: 'ally', description: 'amies' }],
    faction: 'Cartel',
    isVisibleByPlayers: true,
    vuParLesJoueurs: { le: 1000, sceneId: 's-1' },
    voiceProfile: { pitch: 2 } as unknown as Entity['voiceProfile'],
};

const rachel: PlayerCharacter = {
    id: 'pc-rachel',
    name: 'Rachel',
    portraitUrl: 'media:rachel',
    campaignId: 'camp-1',
    systemId: 'blade-runner',
    templateId: 'tpl-jeu',
    sheetData: { force: 2 },
    healthSystem: sante,
    hp: 7,
    maxHp: 10,
    description: 'Réplicante',
    gmNotes: 'Ne sait pas',
    playerNotes: 'Mes souvenirs',
    ficheId: 'fiche-42',
    inventoryItems: [{ id: 'i1', name: 'Blaster', type: 'weapon', rarity: 'common', weight: 1, quantity: 1, description: '', properties: {} }],
    relations: [{ targetId: 'e-marta', targetType: 'npc', type: 'ally', description: 'amies' }],
};

const joueurs = (personnages: PlayerCharacter[] = [rachel]): Player[] => [
    { id: 'j-ana', realName: 'Ana', avatarUrl: '', isOnline: true, characters: personnages },
    { id: 'j-bob', realName: 'Bob', avatarUrl: '', isOnline: true, characters: [] },
];

const scene = (entiteIds: string[], personnagesIds?: string[]): Scene => ({ id: 's-1', entiteIds, personnagesIds } as unknown as Scene);

describe('la correspondance des champs', () => {
    it('un PNJ devient un PJ : même identifiant, fiche, santé, relations, image ; le propre au PNJ en réserve', () => {
        const pj = pnjEnPersonnage(marta, { systemId: 'blade-runner' });
        expect(pj).toMatchObject({
            id: 'e-marta', name: 'Marta', portraitUrl: 'media:marta', campaignId: 'camp-1', systemId: 'blade-runner',
            templateId: 'tpl-jeu', sheetData: { force: 3 }, healthSystem: sante, hp: 7, maxHp: 10,
            relations: marta.relations, faction: 'Cartel', description: 'Contrebandière', gmNotes: 'Doit de l’argent au cartel',
        });
        expect(pj.reserveDeTransformation?.pnj).toMatchObject({ role: 'ally', ac: 2, initiative: 3, roleplayingNotes: 'Parle vite', voiceProfile: { pitch: 2 } });
        expect(pj).not.toHaveProperty('avatar');
        expect(pj).not.toHaveProperty('ac');
    });

    it('un PNJ sans gabarit prend celui du jeu : un PJ en exige un', () => {
        expect(pnjEnPersonnage({ ...marta, templateId: undefined }, { templateIdDuJeu: 'tpl-du-pilote' }).templateId).toBe('tpl-du-pilote');
    });

    it('un PJ devient un PNJ : rôle choisi, visible et « rencontré » ; Sac à dos, fiche HTML, notes du joueur en réserve', () => {
        const pnj = personnageEnPnj(rachel, { role: 'hostile', maintenant: 5000 });
        expect(pnj).toMatchObject({
            id: 'pc-rachel', name: 'Rachel', avatar: 'media:rachel', campaignId: 'camp-1', role: 'hostile', type: 'npc',
            status: 'alive', sheetData: { force: 2 }, healthSystem: sante, hp: 7, maxHp: 10, gmSecretInfo: 'Ne sait pas',
            isVisibleByPlayers: true, vuParLesJoueurs: { le: 5000 },
        });
        expect(pnj.reserveDeTransformation?.pj).toMatchObject({ systemId: 'blade-runner', ficheId: 'fiche-42', playerNotes: 'Mes souvenirs', inventoryItems: rachel.inventoryItems });
        expect(pnj).not.toHaveProperty('inventoryItems');
        expect(pnj).not.toHaveProperty('portraitUrl');
    });

    it('un PJ mort devient un PNJ mort', () => {
        expect(personnageEnPnj({ ...rachel, healthSystem: { ...sante, state: 'dead' } }, { role: 'neutral', maintenant: 1 }).status).toBe('dead');
    });
});

/*
  Au retour, le personnage porte en plus la réserve de la vie qu'il vient de
  quitter — c'est voulu : redevenu PJ, un ancien PNJ garde de quoi retrouver son
  rôle et sa voix s'il repasse PNJ. On compare donc sans elle, puis on vérifie
  qu'un second aller-retour ne change plus rien.
*/
const sansReserve = <T extends { reserveDeTransformation?: unknown }>({ reserveDeTransformation: _r, ...reste }: T) => reste;

describe('l’aller-retour ne perd rien (C4)', () => {
    it('PNJ → PJ → PNJ rend le même PNJ ; la réserve garde sa vie de PJ', () => {
        const pj = pnjEnPersonnage(marta, { systemId: 'blade-runner' });
        const retour = personnageEnPnj(pj, { role: 'ally', maintenant: 9999 });
        expect(sansReserve(retour)).toEqual(marta);
        expect(retour.reserveDeTransformation?.pj).toMatchObject({ systemId: 'blade-runner' });
        expect(personnageEnPnj(pnjEnPersonnage(retour), { role: 'ally', maintenant: 1 })).toEqual(retour);
    });

    it('PJ → PNJ → PJ rend le même PJ ; la réserve garde sa vie de PNJ', () => {
        const pnj = personnageEnPnj(rachel, { role: 'hostile', maintenant: 5000 });
        const retour = pnjEnPersonnage(pnj);
        expect(sansReserve(retour)).toEqual(rachel);
        expect(retour.reserveDeTransformation?.pnj).toMatchObject({ role: 'hostile', vuParLesJoueurs: { le: 5000 } });
        expect(pnjEnPersonnage(personnageEnPnj(retour, { role: 'hostile', maintenant: 1 }))).toEqual(retour);
    });

    it('un PJ sans points de vie (Dune) n’en gagne pas au retour', () => {
        const { hp: _hp, maxHp: _max, ...duncan } = rachel;
        const pnj = personnageEnPnj(duncan, { role: 'ally', maintenant: 1 });
        expect(pnj).toMatchObject({ hp: 0, maxHp: 0 });
        expect(sansReserve(pnjEnPersonnage(pnj))).toEqual(duncan);
    });

    it('un PNJ qui n’était pas montré aux joueurs ne le devient pas au retour', () => {
        const { isVisibleByPlayers: _v, vuParLesJoueurs: _vu, ...cache } = marta;
        expect(sansReserve(personnageEnPnj(pnjEnPersonnage(cache), { role: 'ally', maintenant: 1 }))).toEqual(cache);
    });
});

describe('les liens qui nomment le genre (C3)', () => {
    it('les relations des autres vers lui changent de genre ; les autres porteurs gardent leur référence', () => {
        const autre: Entity = { ...marta, id: 'e-autre', relations: [{ targetId: 'e-x', targetType: 'npc', type: 'rival', description: '' }] };
        const avant = { entities: [autre], players: joueurs() };
        const apres = reecrireLesRelations(avant.entities, avant.players, 'e-marta', true);
        expect(apres.players[0].characters[0].relations?.[0].targetType).toBe('pc');
        expect(apres.entities[0]).toBe(autre);
        expect(apres.players[1]).toBe(avant.players[1]);
    });

    it('dans les scènes, il passe des PNJ présents aux PJ présents, et revient', () => {
        const [versPj] = deplacerDansLesScenes([scene(['e-marta', 'e-x'])], 'e-marta', true);
        expect(versPj.entiteIds).toEqual(['e-x']);
        expect(versPj.personnagesIds).toEqual(['e-marta']);
        const [retour] = deplacerDansLesScenes([versPj], 'e-marta', false);
        expect(retour.entiteIds).toEqual(['e-x', 'e-marta']);
        expect(retour.personnagesIds).toEqual([]);
    });

    it('une scène où il n’est pas garde sa référence', () => {
        const s = scene(['e-x']);
        expect(deplacerDansLesScenes([s], 'e-marta', true)[0]).toBe(s);
    });
});

describe('les suites à annoncer (T5)', () => {
    const autour = {
        deckStates: {
            destin: { enMain: [{ index: 3, porteur: 'pc-rachel' }, { index: 5, porteur: null }, { index: 7, porteur: 'pc-rachel' }] },
            action: { enMain: [{ index: 1, porteur: 'pc-autre' }] },
        },
        rencontres: [
            { nom: 'La patrouille', lignes: [{ genre: 'entite', entiteId: 'e-marta' }, { genre: 'creature' }] },
            { nom: 'Les renforts', lignes: [{ genre: 'entite', entiteId: 'e-x' }] },
        ],
    };

    it('devenu PNJ, il rend les cartes qu’il tient ; aucune rencontre ne compte', () => {
        expect(suitesDeLaTransformation(autour, 'pc-rachel', false)).toEqual({
            cartesTenues: [{ deckId: 'destin', index: 3 }, { deckId: 'destin', index: 7 }], rencontres: [],
        });
    });

    it('devenu PJ, les rencontres qui l’envoyaient sont nommées', () => {
        expect(suitesDeLaTransformation(autour, 'e-marta', true)).toEqual({ cartesTenues: [], rencontres: ['La patrouille'] });
    });

    it('rien autour : rien à dire', () => {
        expect(suitesDeLaTransformation({}, 'e-marta', true)).toEqual({ cartesTenues: [], rencontres: [] });
    });
});

describe('les deux transformations', () => {
    const etat = (): EtatDesPersonnages => ({ entities: [marta], players: joueurs(), scenes: [scene(['e-marta'], ['pc-rachel'])] });

    it('le PNJ quitte la galerie et rejoint le roster du joueur choisi, en fin de liste (C1)', () => {
        const { etat: apres, refus } = transformerEnPersonnage(etat(), 'e-marta', 'j-ana', { systemId: 'blade-runner' });
        expect(refus).toBeNull();
        expect(apres.entities).toEqual([]);
        expect(apres.players[0].characters.map(c => c.id)).toEqual(['pc-rachel', 'e-marta']);
        expect(apres.players[0].characters[0].relations?.[0].targetType).toBe('pc');
        expect(apres.scenes[0].personnagesIds).toEqual(['pc-rachel', 'e-marta']);
        expect(apres.scenes[0].entiteIds).toEqual([]);
    });

    it('le PJ quitte son joueur et rejoint les PNJ (C2)', () => {
        const { etat: apres, refus } = transformerEnPnj(etat(), 'j-ana', 'pc-rachel', { role: 'neutral', maintenant: 1 });
        expect(refus).toBeNull();
        expect(apres.players[0].characters).toEqual([]);
        expect(apres.entities.map(e => e.id)).toEqual(['e-marta', 'pc-rachel']);
        expect(apres.entities[0].relations?.[0].targetType).toBe('npc');
        expect(apres.scenes[0].entiteIds).toEqual(['e-marta', 'pc-rachel']);
    });

    it.each([
        ['un PNJ introuvable', (e: EtatDesPersonnages) => transformerEnPersonnage(e, 'e-inconnu', 'j-ana'), 'introuvable'],
        ['un joueur introuvable', (e: EtatDesPersonnages) => transformerEnPersonnage(e, 'e-marta', 'j-inconnu'), 'joueur-introuvable'],
        ['un PJ introuvable chez ce joueur', (e: EtatDesPersonnages) => transformerEnPnj(e, 'j-bob', 'pc-rachel', { role: 'ally', maintenant: 1 }), 'introuvable'],
    ])('refuse %s et rend l’état d’origine, par référence (C5)', (_cas, faire, motif) => {
        const avant = etat();
        const resultat = faire(avant);
        expect(resultat.refus).toBe(motif);
        expect(resultat.etat).toBe(avant);
    });

    it('refuse un PJ sans campagne : un PNJ en exige une', () => {
        const avant: EtatDesPersonnages = { entities: [], players: joueurs([{ ...rachel, campaignId: null }]), scenes: [] };
        const { etat: apres, refus } = transformerEnPnj(avant, 'j-ana', 'pc-rachel', { role: 'ally', maintenant: 1 });
        expect(refus).toBe('sans-campagne');
        expect(apres).toBe(avant);
    });

    it('refuse un identifiant déjà présent de l’autre côté', () => {
        const avant: EtatDesPersonnages = { entities: [marta], players: joueurs([rachel, { ...rachel, id: 'e-marta' }]), scenes: [] };
        const { etat: apres, refus } = transformerEnPersonnage(avant, 'e-marta', 'j-bob');
        expect(refus).toBe('deja-present');
        expect(apres).toBe(avant);
    });
});
