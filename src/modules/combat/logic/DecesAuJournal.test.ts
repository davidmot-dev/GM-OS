import { describe, it, expect, vi } from 'vitest';
import { chutesEntre, raconterLeDeces, observerLesChutes, type ChuteObservable } from './DecesAuJournal';

/**
 * **Ce que ces tests protègent : un décès est écrit une fois, quand il arrive,
 * pour tout le monde.**
 *
 * Étape 2 de l'ordre de travail du 2026-08-08. Ce qui existait était gardé par
 * `!c.isPlayer` — la mort d'un PJ ne laissait aucune trace — et n'était émis
 * qu'au bouton d'export, donc daté de la fin du combat, ou jamais.
 */

const combattant = (over: Partial<ChuteObservable> & { id: string }): ChuteObservable => ({
    name: 'Sans nom', isPlayer: false, statuses: [], hp: 10, hpMax: 10, ...over,
});

const mort = { id: 's', name: 'Mort', duration: 99, icon: '💀' };

describe('les chutes entre deux plateaux', () => {
    it('voit tomber celui qui passe à zéro', () => {
        const chutes = chutesEntre(
            [combattant({ id: 'a', hp: 4 })],
            [combattant({ id: 'a', hp: 0 })],
        );
        expect(chutes.map(c => c.id)).toEqual(['a']);
    });

    it('voit tomber un PJ comme les autres', () => {
        // Le défaut : `!c.isPlayer` écartait le seul décès qu'une table raconte
        // encore des années après.
        const chutes = chutesEntre(
            [combattant({ id: 'pj', isPlayer: true, hp: 2 })],
            [combattant({ id: 'pj', isPlayer: true, hp: 0 })],
        );
        expect(chutes.map(c => c.id)).toEqual(['pj']);
    });

    it('voit tomber celui qu\'on étiquette, sur un jeu sans jauge', () => {
        const chutes = chutesEntre(
            [combattant({ id: 'd', hp: undefined, hpMax: undefined })],
            [combattant({ id: 'd', hp: undefined, hpMax: undefined, statuses: [mort] })],
        );
        expect(chutes.map(c => c.id)).toEqual(['d']);
    });

    it('ne retue pas un mort à chaque changement du plateau', () => {
        // Une chute est une transition, pas un état : sans cela, chaque coup
        // porté à son voisin réécrirait le décès du voisin d'à côté.
        const tombe = combattant({ id: 'a', hp: 0 });
        expect(chutesEntre([tombe], [tombe, combattant({ id: 'b', hp: 3 })])).toHaveLength(0);
    });

    it('ne fait pas tomber celui qui arrive déjà tombé', () => {
        // Un PNJ ajouté à zéro, un plateau garé qu'on restaure, un plateau relu
        // au démarrage : rien de tout cela ne s'est produit maintenant.
        expect(chutesEntre([], [combattant({ id: 'nouveau', hp: 0 })])).toHaveLength(0);
    });

    it('ne dit rien de celui qu\'on relève', () => {
        expect(chutesEntre(
            [combattant({ id: 'a', hp: 0 })],
            [combattant({ id: 'a', hp: 5 })],
        )).toHaveLength(0);
    });
});

describe('le récit du décès', () => {
    it('nomme un PJ un personnage, et un adversaire un PNJ', () => {
        expect(raconterLeDeces(combattant({ id: 'a', name: 'Ripley', isPlayer: true })).content)
            .toContain('Le personnage **Ripley**');
        expect(raconterLeDeces(combattant({ id: 'b', name: 'Goule' })).content)
            .toContain('Le PNJ **Goule**');
    });
});

describe('l\'observation du plateau', () => {
    /** Un magasin réduit à son abonnement, qu'on déclenche à la main. */
    const magasinFactice = () => {
        let ecouteur: ((e: { combatants: ChuteObservable[] }, p: { combatants: ChuteObservable[] }) => void) | null = null;
        return {
            magasin: { subscribe: (f: typeof ecouteur) => { ecouteur = f; return () => { ecouteur = null; }; } },
            changer: (avant: ChuteObservable[], apres: ChuteObservable[]) =>
                ecouteur?.({ combatants: apres }, { combatants: avant }),
        };
    };

    it('écrit la chute qu\'elle observe', () => {
        const { magasin, changer } = magasinFactice();
        const ecrire = vi.fn();
        observerLesChutes(magasin, ecrire, () => true);

        changer([combattant({ id: 'a', hp: 3 })], [combattant({ id: 'a', hp: 0 })]);

        expect(ecrire).toHaveBeenCalledTimes(1);
        expect(ecrire.mock.calls[0][0].id).toBe('a');
    });

    it('n\'écrit rien depuis une fenêtre secondaire', () => {
        // Le Player Hub et le projecteur reçoivent le même plateau : sans ce
        // garde, un décès s'écrirait autant de fois qu'il y a d'écrans ouverts.
        const { magasin, changer } = magasinFactice();
        const ecrire = vi.fn();
        observerLesChutes(magasin, ecrire, () => false);

        changer([combattant({ id: 'a', hp: 3 })], [combattant({ id: 'a', hp: 0 })]);

        expect(ecrire).not.toHaveBeenCalled();
    });

    it('ignore un changement qui ne touche pas le plateau', () => {
        const { magasin, changer } = magasinFactice();
        const ecrire = vi.fn();
        observerLesChutes(magasin, ecrire, () => true);

        const plateau = [combattant({ id: 'a', hp: 0 })];
        changer(plateau, plateau);

        expect(ecrire).not.toHaveBeenCalled();
    });
});
