import { describe, it, expect } from 'vitest';
import { ecranJoignable, leRepliEstNecessaire, ECRAN_DU_HUB } from './ecranJoignable';
import type { DisplayInfo } from '../types';

/**
 * **Un écran qui n'existe plus doit se dire.**
 *
 * ⛔ **Écrit le 2026-09-22, après une soirée perdue.** David : *« la vidéo ne se
 * lance pas à partir du Master Storyboard »*, puis *« ça fonctionne si je lance
 * à partir d'Image-OS »*.
 *
 * Elle partait bien. La reproduction l'a montré : les deux gestes envoient un
 * ordre **identique au caractère près** — `launchDisplay(["m-…"], "moniteur-2")`.
 * L'écran visé n'existait simplement plus, et **deux silences se sont
 * additionnés** :
 *
 * 1. Image-OS retombait sur le hub sans un mot quand son écran disparaissait ;
 * 2. le processus principal jetait l'ordre dans une console que personne ne
 *    regarde.
 *
 * Résultat à l'écran : **le fond d'écran Windows**. *Une projection qui échoue
 * sans le dire ressemble à une fonctionnalité cassée.*
 */

const ecran = (id: string): DisplayInfo =>
    ({ id, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, label: id });

const BRANCHES = [ecran('2528732444'), ecran('1734281749')];

describe('l’écran visé existe-t-il', () => {
    it('le hub est toujours joignable', () => {
        expect(ecranJoignable(ECRAN_DU_HUB, []).joignable).toBe(true);
        expect(ecranJoignable(ECRAN_DU_HUB, BRANCHES).joignable).toBe(true);
    });

    /** Vide ou absent : « l'écran courant d'Image-OS », qui se résout ailleurs. */
    it('une cible absente passe', () => {
        expect(ecranJoignable('', BRANCHES).joignable).toBe(true);
        expect(ecranJoignable(undefined, BRANCHES).joignable).toBe(true);
    });

    it('un moniteur branché passe', () => {
        expect(ecranJoignable('2528732444', BRANCHES).joignable).toBe(true);
    });

    /** ⭐ Le cas de la soirée du 22/09 : l'identifiant a changé au rebranchement. */
    it('un moniteur qui n’est plus là ne passe pas', () => {
        expect(ecranJoignable('un-identifiant-d-hier', BRANCHES).joignable).toBe(false);
    });

    /**
     * ⛔ **Une liste vide veut dire « je ne sais pas encore », pas « aucun
     * écran ».** `fetchDisplays` est asynchrone et n'a pas forcément tourné :
     * refuser ici bloquerait **toute** projection au démarrage. *Une garde qui
     * refuse tout ressemble à une garde qui marche.*
     */
    it('ne refuse jamais sur une ignorance', () => {
        expect(ecranJoignable('n-importe-quoi', []).joignable).toBe(true);
        expect(ecranJoignable('n-importe-quoi', undefined).joignable).toBe(true);
        expect(ecranJoignable('n-importe-quoi', [])).toMatchObject({ sousReserve: true });
    });

    it('et le sait quand il sait vraiment', () => {
        expect(ecranJoignable('2528732444', BRANCHES)).toEqual({ joignable: true });
    });
});

describe('le repli sur le hub', () => {
    it('n’a lieu que pour un écran qui a disparu', () => {
        expect(leRepliEstNecessaire('un-identifiant-d-hier', BRANCHES)).toBe(true);
        expect(leRepliEstNecessaire('2528732444', BRANCHES)).toBe(false);
        expect(leRepliEstNecessaire(ECRAN_DU_HUB, BRANCHES)).toBe(false);
    });

    /** ⚠️ Sinon, chaque démarrage renverrait le meneur au hub avant le recensement. */
    it('jamais avant le recensement', () => {
        expect(leRepliEstNecessaire('2528732444', [])).toBe(false);
        expect(leRepliEstNecessaire('2528732444', undefined)).toBe(false);
    });
});
