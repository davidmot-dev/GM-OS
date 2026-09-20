import { describe, it, expect } from 'vitest';
import { gesteDAmbiance, demandeUneAmbiance, laMatiereEstPresente } from './ambianceDuMoment';

/**
 * Ce que ces essais protègent : **un moment pose la matière avant le
 * mélange, et se tait bruyamment quand il n'y a pas de matière.**
 *
 * ⛔ Le défaut d'origine, signalé par David le 2026-09-20 : un moment ne
 * pouvait choisir que la **scène** d'Ambient-OS — les volumes des huit pistes —
 * et jamais le **thème**, c'est-à-dire les sons eux-mêmes. « Tension »
 * s'appliquait donc au thème d'une scène précédente, ou à huit emplacements
 * vides. *Et huit emplacements vides ne produisent aucune erreur.*
 */

describe('l’ordre des gestes', () => {
    it('ne fait rien quand le moment ne demande rien', () => {
        const geste = gesteDAmbiance({});

        expect(geste).toEqual({ themeId: null, sceneId: null, jouerLeTheme: false });
        expect(demandeUneAmbiance(geste)).toBe(false);
    });

    /** Les moments écrits avant le thème continuent de marcher tels quels. */
    it('applique la scène seule, comme avant', () => {
        const geste = gesteDAmbiance({ ambientSceneId: 'tension' });

        expect(geste.themeId).toBeNull();
        expect(geste.sceneId).toBe('tension');
        expect(geste.jouerLeTheme).toBe(false);
    });

    /**
     * ⭐ *Un moment de storyboard est un déclenchement : s'il ne produit aucun
     * son, il passe pour une panne.* Ambient-OS, lui, charge à l'arrêt — c'est
     * juste à l'écran, où l'on prépare avant de lancer.
     */
    it('charge ET lance un thème seul', () => {
        const geste = gesteDAmbiance({ ambientThemeId: 'th-foret' });

        expect(geste.themeId).toBe('th-foret');
        expect(geste.jouerLeTheme, 'le moment se serait tu').toBe(true);
    });

    /**
     * ⛔ **Et surtout pas quand une scène suit.** Tout se mettrait à sonner une
     * seconde avant que la scène n'éteigne ce qu'elle n'a pas demandé — *un
     * coup de tonnerre au mauvais moment est pire qu'un silence.*
     */
    it('charge SANS lancer quand une scène suit', () => {
        const geste = gesteDAmbiance({ ambientThemeId: 'th-foret', ambientSceneId: 'calme' });

        expect(geste.themeId).toBe('th-foret');
        expect(geste.sceneId).toBe('calme');
        expect(geste.jouerLeTheme, 'les huit pistes ont sonné avant la scène').toBe(false);
    });

    it('traite une chaîne vide comme une absence', () => {
        expect(demandeUneAmbiance(gesteDAmbiance({ ambientThemeId: '', ambientSceneId: '' })))
            .toBe(false);
    });
});

/**
 * ⛔ **La question qui transforme un silence en message.** Elle se pose APRÈS
 * le chargement du thème : c'est là seulement qu'on sait s'il y a de quoi
 * jouer.
 */
describe('y a-t-il de quoi jouer', () => {
    it('oui dès qu’une piste porte une adresse', () => {
        expect(laMatiereEstPresente([{ url: '' }, { url: 'C:/sons/vent.ogg' }])).toBe(true);
    });

    it('non quand les huit emplacements sont vides', () => {
        expect(laMatiereEstPresente(Array.from({ length: 8 }, () => ({ url: '' })))).toBe(false);
    });

    it('non quand le module n’a rien à dire', () => {
        expect(laMatiereEstPresente([])).toBe(false);
        expect(laMatiereEstPresente(null)).toBe(false);
    });
});
