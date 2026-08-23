import { describe, it, expect, beforeEach } from 'vitest';
import { useGemStore } from './useGemStore';

/**
 * Ce que ces tests protègent : **le penchant d'un cortex, une fois choisi par
 * le meneur, lui appartient.**
 *
 * Le champ est né le 2026-08-23 — idée de David : *« le Sage privilégie les
 * règles, le Scribe privilégierait la campagne »*. Aucun cortex enregistré
 * avant n'en porte, d'où le rattrapage ; mais c'est un champ **éditable**, et
 * un rattrapage qui écrase reprend en silence ce que le meneur a réglé.
 */

const etat = () => useGemStore.getState();

describe('le penchant des cortex', () => {
    beforeEach(() => {
        useGemStore.setState({ gems: [], activeGemId: 'sage' });
        etat().syncGemsWithDefaults();
    });

    it('le découpage livré : Sage, Alchimiste et Stratège aux règles', () => {
        // Le choix de David, 2026-08-23. Il se relit ici plutôt que dans huit
        // objets épars : c'est une décision, pas une donnée.
        const parId = Object.fromEntries(etat().gems.map(g => [g.id, g.penchant]));

        expect(parId.sage).toBe('regles');
        expect(parId.alchemist).toBe('regles');
        expect(parId.strategist).toBe('regles');

        for (const id of ['scribe', 'oracle', 'bard', 'actor', 'cartographer']) {
            expect(parId[id], id).toBe('campagne');
        }
    });

    it('REMPLIT le penchant absent d un cortex enregistré avant', () => {
        /*
          Sans ce rattrapage, le réglage n'aurait servi à rien tant que le meneur
          n'aurait pas repris ses huit cortex un par un — et il n'aurait eu
          aucune raison de le faire, puisque rien ne le lui aurait dit.
        */
        const sansPenchant = etat().gems.map(g => {
            const copie = { ...g };
            delete copie.penchant;
            return copie;
        });
        useGemStore.setState({ gems: sansPenchant });

        etat().syncGemsWithDefaults();

        expect(etat().gems.find(g => g.id === 'scribe')?.penchant).toBe('campagne');
    });

    it('mais ne REMPLACE JAMAIS celui que le meneur a choisi', () => {
        /*
          **C'est la règle d'`enrichirLePilote`** : remplir ce qui est vide, ne
          jamais remplacer ce qui est rempli. Écraser à chaque synchronisation
          reprendrait le réglage au prochain démarrage, sans un mot.

          **Dégradation à l'identique** : retirer la garde `=== undefined` fait
          tomber ce test, et lui seul.
        */
        etat().updateGem('sage', { penchant: 'campagne' });

        etat().syncGemsWithDefaults();

        expect(etat().gems.find(g => g.id === 'sage')?.penchant).toBe('campagne');
    });

    it('un cortex écrit par le meneur n hérite d aucune intention', () => {
        // On ne prête pas un penchant à qui n'en a pas déclaré : absent vaut le
        // classement d'avant, et c'est le bon défaut.
        useGemStore.setState({
            gems: [...etat().gems, {
                id: 'le-mien', name: 'Le mien', icon: 'Brain',
                description: '', baseInstructions: '',
            }],
        });

        etat().syncGemsWithDefaults();

        expect(etat().gems.find(g => g.id === 'le-mien')?.penchant).toBeUndefined();
    });
});
