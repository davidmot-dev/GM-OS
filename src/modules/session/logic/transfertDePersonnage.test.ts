import { describe, it, expect } from 'vitest';
import { transfererLePersonnage, leVerrouDeLAncienJoueur } from './transfertDePersonnage';
import type { Player, PlayerCharacter } from '../store/types';

/**
 * **Un PJ change de joueur, et rien d'autre ne bouge.**
 *
 * Demandé par David le 2026-09-14 : *« je voudrais pouvoir échanger un PJ d'un
 * joueur vers un autre joueur »*. Transfert simple, tranché avec lui.
 *
 * ⭐ **Ce que ces essais gardent vraiment, ce n'est pas le déplacement — c'est
 * tout ce qui ne doit PAS être touché.** Le personnage garde son identifiant, et
 * c'est lui que visent la fiche, les notes, la séance du soir, les cartes en
 * main. *Un transfert qui renuméroterait le personnage aurait à réécrire tout
 * cela ; celui-ci n'a rien à réécrire, et c'est la seule chose à protéger.*
 */

const pj = (id: string, nom: string): PlayerCharacter => ({
    id,
    name: nom,
    portraitUrl: '',
    campaignId: 'c-1',
    templateId: 'tpl-1',
    sheetData: { force: 3, notes: 'écrites avant le transfert' },
    playerNotes: 'ce que le joueur a noté',
    inventory: 'un blaster',
    hp: 7,
    maxHp: 10,
});

const joueurs = (): Player[] => ([
    {
        id: 'j-anne', realName: 'Anne', avatarUrl: '', isOnline: true,
        characters: [pj('pc-1', 'Rick'), pj('pc-2', 'Gaff')],
    },
    { id: 'j-bruno', realName: 'Bruno', avatarUrl: '', isOnline: false, characters: [pj('pc-3', 'Rachael')] },
    { id: 'j-carla', realName: 'Carla', avatarUrl: '', isOnline: false, characters: [] },
]);

const nomsDe = (liste: Player[], joueurId: string) =>
    liste.find(j => j.id === joueurId)!.characters.map(c => c.name);

describe('transfererLePersonnage', () => {
    it('retire le personnage du départ et l’ajoute à l’arrivée', () => {
        const { joueurs: apres, refus } = transfererLePersonnage(joueurs(), 'j-anne', 'j-bruno', 'pc-1');

        expect(refus).toBeNull();
        expect(nomsDe(apres, 'j-anne')).toEqual(['Gaff']);
        expect(nomsDe(apres, 'j-bruno')).toEqual(['Rachael', 'Rick']);
    });

    /** *Un arrivant est le dernier venu* — l'ordre d'un joueur est celui de ses créations. */
    it('le pose en fin de liste', () => {
        const { joueurs: apres } = transfererLePersonnage(joueurs(), 'j-anne', 'j-bruno', 'pc-1');
        expect(nomsDe(apres, 'j-bruno').at(-1)).toBe('Rick');
    });

    it('marche vers un joueur qui n’a encore aucun personnage', () => {
        const { joueurs: apres, refus } = transfererLePersonnage(joueurs(), 'j-anne', 'j-carla', 'pc-2');
        expect(refus).toBeNull();
        expect(nomsDe(apres, 'j-carla')).toEqual(['Gaff']);
    });

    /**
     * ⛔ **Le cœur du geste.** Le personnage doit arriver **identique** : c'est
     * son identifiant que visent `sessionEntityIds`, les cartes tenues
     * (`porteur`) et les combattants issus d'un PJ. Rien ne doit être recopié,
     * régénéré, ni « nettoyé » au passage.
     */
    it('arrive intact, identifiant compris', () => {
        const avant = joueurs()[0].characters[0];
        const { joueurs: apres } = transfererLePersonnage(joueurs(), 'j-anne', 'j-bruno', 'pc-1');
        const arrive = apres.find(j => j.id === 'j-bruno')!.characters.find(c => c.id === 'pc-1')!;

        expect(arrive).toEqual(avant);
        expect(arrive.id).toBe('pc-1');
        expect(arrive.sheetData).toEqual({ force: 3, notes: 'écrites avant le transfert' });
        expect(arrive.playerNotes).toBe('ce que le joueur a noté');
        expect(arrive.inventory).toBe('un blaster');
        expect(arrive.campaignId).toBe('c-1');
        expect(arrive.hp).toBe(7);
    });

    it('ne touche à aucun autre joueur', () => {
        const { joueurs: apres } = transfererLePersonnage(joueurs(), 'j-anne', 'j-bruno', 'pc-1');
        expect(nomsDe(apres, 'j-carla')).toEqual([]);
        expect(apres.map(j => j.id)).toEqual(['j-anne', 'j-bruno', 'j-carla']);
    });

    it('n’existe qu’en un seul exemplaire après le passage', () => {
        const { joueurs: apres } = transfererLePersonnage(joueurs(), 'j-anne', 'j-bruno', 'pc-1');
        const porteurs = apres.flatMap(j => j.characters.filter(c => c.id === 'pc-1').map(() => j.id));
        expect(porteurs).toEqual(['j-bruno']);
    });
});

describe('les refus', () => {
    it.each([
        ['vers le même joueur', 'j-anne', 'j-anne', 'pc-1', 'meme-joueur'],
        ['un personnage que le départ ne porte pas', 'j-anne', 'j-bruno', 'pc-3', 'personnage-introuvable'],
        ['un personnage qui n’existe pas', 'j-anne', 'j-bruno', 'pc-inconnu', 'personnage-introuvable'],
        ['un joueur de départ inconnu', 'j-fantome', 'j-bruno', 'pc-1', 'personnage-introuvable'],
        ['un joueur d’arrivée inconnu', 'j-anne', 'j-fantome', 'pc-1', 'joueur-introuvable'],
    ])('refuse %s', (_cas, de, vers, pcId, motif) => {
        const avant = joueurs();
        const { joueurs: apres, refus } = transfererLePersonnage(avant, de, vers, pcId);

        expect(refus).toBe(motif);
        /* ⛔ **Par RÉFÉRENCE, et c'est le point.** Un refus qui rendrait une
           copie ferait croire à un changement à tout ce qui compare par
           identité — la diffusion vers les tablettes en premier, qui
           rediffuserait la liste entière des joueurs pour un geste qui n'a pas
           eu lieu. */
        expect(apres).toBe(avant);
    });

    /** Deux personnages du même identifiant chez un joueur rendraient toute
        écriture ambiguë : `updateCharacter` frappe le premier trouvé. */
    it('refuse de créer un doublon chez le joueur d’arrivée', () => {
        const avant = joueurs();
        avant[1].characters.push(pj('pc-1', 'Rick, deuxième du nom'));

        const { joueurs: apres, refus } = transfererLePersonnage(avant, 'j-anne', 'j-bruno', 'pc-1');
        expect(refus).toBe('deja-present');
        expect(apres).toBe(avant);
    });

    it('ne s’étrangle pas sur une liste absente', () => {
        expect(transfererLePersonnage(undefined, 'a', 'b', 'pc-1').refus).toBe('personnage-introuvable');
    });
});

/**
 * Le verrou n'est pas un champ qu'on écrit : c'est le reflet des appareils
 * connectés. Le transfert ne peut donc pas le défaire — l'écran le **dit**.
 */
describe('leVerrouDeLAncienJoueur', () => {
    it('nomme l’appareil qui tient encore le personnage', () => {
        expect(leVerrouDeLAncienJoueur({ 'pc-1': 'tablette-anne' }, 'pc-1')).toBe('tablette-anne');
    });

    it('rend null quand personne ne le tient', () => {
        expect(leVerrouDeLAncienJoueur({ 'pc-2': 'tablette-anne' }, 'pc-1')).toBeNull();
        expect(leVerrouDeLAncienJoueur({}, 'pc-1')).toBeNull();
        expect(leVerrouDeLAncienJoueur(undefined, 'pc-1')).toBeNull();
    });
});
