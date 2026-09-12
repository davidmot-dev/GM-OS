import { describe, it, expect } from 'vitest';
import {
    GESTES, GESTE_PAR_DEFAUT, leGeste, actionDuGeste,
} from './gestesDesBoutons';
import { isKnownActionType } from '../../remote/actions';

/**
 * **Ce qu'un bouton physique a le droit de porter.**
 *
 * ⛔ Le test qui compte est le dernier de la première section : **chaque geste
 * se résout en une action que le registre connaît déjà**. Sans lui, ce
 * catalogue pourrait nommer une action disparue ou mal orthographiée, et
 * l'appui ne ferait rien — *en silence, pendant une séance, sur un objet posé
 * au milieu de la table.*
 */

describe('le catalogue', () => {
    it('commence par « Rien », et c’est le défaut', () => {
        expect(GESTES[0].id).toBe(GESTE_PAR_DEFAUT);
        expect(leGeste(GESTE_PAR_DEFAUT)?.action).toBeNull();
    });

    it('n’a aucun identifiant en double', () => {
        const ids = GESTES.map(g => g.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    /*
      ⛔ **LA GARDE DU CATALOGUE.** Un geste qui nomme `combat:next-turn` mal
      orthographié passerait tous les autres tests : le réglage s'enregistrerait,
      l'écran l'afficherait, et l'appui serait ignoré sans un mot. *Une chaîne
      complète sans rien au bout — le motif que ce dépôt a payé quatre fois.*
    */
    it('chaque geste vise une action que le registre connaît', () => {
        for (const geste of GESTES) {
            if (geste.action === null) continue;

            const action = typeof geste.action === 'function' ? geste.action('1d20') : geste.action;

            expect(
                isKnownActionType(action.type),
                `« ${geste.id} » vise « ${action.type} », absent du registre`,
            ).toBe(true);
        }
    });

    /* Un geste sans libellé s'afficherait comme une ligne vide dans la liste
       déroulante — impossible à choisir, et impossible à diagnostiquer. */
    it('chaque geste porte un libellé lisible', () => {
        for (const geste of GESTES) {
            expect(geste.libelle?.trim(), `« ${geste.id} » n’a pas de libellé`).toBeTruthy();
        }
    });

    it('et deux gestes ne portent jamais le même', () => {
        const libelles = GESTES.map(g => g.libelle);
        expect(new Set(libelles).size).toBe(libelles.length);
    });
});

describe('résoudre un réglage', () => {
    it('un geste simple rend son action', () => {
        expect(actionDuGeste({ geste: 'tour-suivant' })).toEqual({ type: 'combat:next-turn' });
    });

    it('« Rien » ne rend rien', () => {
        expect(actionDuGeste({ geste: 'rien' })).toBeNull();
    });

    it('aucun réglage ne rend rien', () => {
        expect(actionDuGeste(undefined)).toBeNull();
    });

    /*
      ⚠️ Un réglage écrit par une version plus récente de GM-OS, relu par une
      plus ancienne. Il ne doit pas lever — il doit ne rien faire.
    */
    it('un geste inconnu ne rend rien, et ne lève pas', () => {
        expect(actionDuGeste({ geste: 'teleporter-les-joueurs' })).toBeNull();
    });

    describe('le jet préréglé', () => {
        it('emporte sa formule, et la montre comme titre', () => {
            expect(actionDuGeste({ geste: 'jet-preregle', formule: '2d6+3' }))
                .toEqual({ type: 'dice:roll', payload: { formula: '2d6+3', title: '2d6+3' } });
        });

        it('les espaces autour de la formule sont retirés', () => {
            const action = actionDuGeste({ geste: 'jet-preregle', formule: '  1d20  ' });

            expect(action?.payload).toEqual({ formula: '1d20', title: '1d20' });
        });

        /*
          ⛔ **Sans formule, on ne lance RIEN.** Un `dice:roll` avec une formule
          vide ferait rouler un jet creux sur le pupitre, au milieu d'une scène,
          et le meneur chercherait d'où il vient. *Un geste qui ne peut pas
          s'accomplir doit ne rien faire, jamais faire à peu près.*
        */
        it.each([undefined, '', '   '])('sans formule utilisable (%p), il ne rend rien', (formule) => {
            expect(actionDuGeste({ geste: 'jet-preregle', formule })).toBeNull();
        });

        it('et il se déclare comme demandant une formule', () => {
            expect(leGeste('jet-preregle')?.demandeUneFormule).toBe(true);
        });

        /* Les autres n'en demandent pas : l'écran ne doit pas offrir un champ
           qui ne servira à rien. */
        it('les autres gestes n’en demandent pas', () => {
            const demandeurs = GESTES.filter(g => g.demandeUneFormule).map(g => g.id);
            expect(demandeurs).toEqual(['jet-preregle']);
        });
    });
});
