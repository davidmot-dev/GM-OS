import { describe, it, expect } from 'vitest';
import {
    ceQueLaPriseDeMainFaitALaLumiere, ceQuUnArretFaitALaLumiere,
} from './lumiereDuMoment';

/**
 * **La lumière entre deux séquences — demande de David du 2026-09-13.**
 *
 * *« Quand je passe d'une séquence à l'autre, il faut respecter les paramètres
 * de la scène suivante — s'il n'y a pas de configuration pour la lumière, il
 * faut retourner vers le "Home" de Light-OS. Et quand j'arrête une séquence, il
 * faut tout arrêter, sauf Light-OS qui va vers son "Home". »*
 *
 * ⭐ La règle en une phrase : **un moment décrit l'état complet de la table, pas
 * ce qui change.** Le son l'applique depuis le 02/09, l'image depuis le 31/08 ;
 * la lumière était la dernière à ne pas le faire.
 */

describe('quand une séquence prend la main sur une autre', () => {
    it('une scène déclarée s’applique', () => {
        expect(ceQueLaPriseDeMainFaitALaLumiere('scene-a', 'scene-b')).toBe('appliquer');
    });

    it('même quand rien n’était posé avant', () => {
        expect(ceQueLaPriseDeMainFaitALaLumiere(null, 'scene-b')).toBe('appliquer');
    });

    /*
      ⛔ **LE DÉFAUT QUE CECI REFERME.** `if (moment.lightSceneId)` appliquait
      une scène ; son absence ne faisait **rien du tout**, et la lumière du
      moment précédent restait sur la pièce toute la séquence suivante.
    */
    it('pas de scène déclarée, et la séquence en avait posé une : retour au Home', () => {
        expect(ceQueLaPriseDeMainFaitALaLumiere('scene-a', null)).toBe('revenir-au-home');
        expect(ceQueLaPriseDeMainFaitALaLumiere('scene-a', undefined)).toBe('revenir-au-home');
    });

    /*
      ⭐ **La garde du réglage manuel — tranchée par David le 13/09.** Même
      doctrine que le son : *on ne ramène que ce que la séquence a posé.* Si le
      meneur a choisi son éclairage à la main, un moment muet sur la lumière n'a
      rien à dire dessus.
    */
    it('mais rien du tout si la séquence n’avait rien posé', () => {
        expect(ceQueLaPriseDeMainFaitALaLumiere(null, null)).toBe('rien');
        expect(ceQueLaPriseDeMainFaitALaLumiere(undefined, undefined)).toBe('rien');
    });

    /* Une chaîne vide n'est pas une scène : elle ne doit ni s'appliquer ni
       compter comme une lumière posée. */
    it('une scène vide se lit comme absente', () => {
        expect(ceQueLaPriseDeMainFaitALaLumiere('', '')).toBe('rien');
        expect(ceQueLaPriseDeMainFaitALaLumiere('scene-a', '')).toBe('revenir-au-home');
    });
});

describe('quand on arrête une séquence', () => {
    /*
      ⭐ **C'est le seul point où la lumière se distingue du reste** : tout
      s'arrête, elle rentre au Home. *La pièce ne doit rester ni dans le noir, ni
      dans l'ambiance rouge du moment qu'on vient de fermer.*
    */
    it('la lumière posée par la séquence rentre au Home', () => {
        expect(ceQuUnArretFaitALaLumiere('scene-a')).toBe('revenir-au-home');
    });

    it('et un arrêt ne touche pas à un éclairage choisi à la main', () => {
        expect(ceQuUnArretFaitALaLumiere(null)).toBe('rien');
        expect(ceQuUnArretFaitALaLumiere(undefined)).toBe('rien');
        expect(ceQuUnArretFaitALaLumiere('')).toBe('rien');
    });

    /*
      ⚠️ L'arrêt ne rend **jamais** « appliquer » : il n'y a pas de scène à
      poser quand on referme. Sans quoi arrêter une séquence en rallumerait une.
    */
    it('un arrêt n’applique jamais de scène', () => {
        for (const posee of ['scene-a', null, undefined, '']) {
            expect(ceQuUnArretFaitALaLumiere(posee)).not.toBe('appliquer');
        }
    });
});
