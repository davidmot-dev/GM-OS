import { describe, it, expect } from 'vitest';
import { CADENCE_DE_DIFFUSION_MS, limiteurDeCadence } from './limiteurDeCadence';
import SERVICE from '../services/CrossWindowEventService.ts?raw';

/**
 * **Ce que ces essais protègent : la diffusion d'un tracé coûte ce que le réseau
 * en consomme, et pas cinq fois plus.**
 *
 * ⛔ Défaut trouvé par David à l'écran le 2026-09-17 : *« whiteboard os saccade
 * un peu »*. `CrossWindowEventService` jetait déjà quatre points sur cinq
 * (`WB_THROTTLE = 50`), mais le magasin les avait tous sérialisés et écrits.
 */

describe('le limiteur de cadence', () => {
    it('laisse passer le premier geste', () => {
        const l = limiteurDeCadence(50);
        expect(l.tenter(0)).toBe(true);
    });

    it('refuse ce qui arrive trop tôt', () => {
        const l = limiteurDeCadence(50);
        expect(l.tenter(1000)).toBe(true);
        expect(l.tenter(1020)).toBe(false);
        expect(l.tenter(1049)).toBe(false);
        expect(l.tenter(1050)).toBe(true);
    });

    /** ⭐ Un refus ne doit PAS repousser la fenêtre, sinon rien ne passe jamais. */
    it('un refus ne repousse pas la fenêtre', () => {
        const l = limiteurDeCadence(50);
        l.tenter(0);
        for (let t = 1; t < 50; t++) expect(l.tenter(t)).toBe(false);
        expect(l.tenter(50)).toBe(true);
    });

    /**
     * ⛔ **Le piège qui laisserait un trait tronqué sur les autres écrans.** Le
     * dernier point d'un geste doit passer même s'il tombe dans une fenêtre
     * fermée.
     */
    it('se rouvre pour laisser passer la fin d’un geste', () => {
        const l = limiteurDeCadence(50);
        l.tenter(1000);
        expect(l.tenter(1010)).toBe(false);
        l.rouvrir();
        expect(l.tenter(1010)).toBe(true);
    });

    it('compte bien cinq points sur cent dans une seconde de dessin', () => {
        const l = limiteurDeCadence(200);
        /* Cent points en une seconde, soit un toutes les 10 ms. */
        const passes = Array.from({ length: 100 }, (_, i) => l.tenter(i * 10))
            .filter(Boolean).length;
        expect(passes).toBe(5);
    });

    it('emploie sa propre horloge quand on ne lui donne pas d’instant', () => {
        let faux = 0;
        const l = limiteurDeCadence(50, () => faux);
        expect(l.tenter()).toBe(true);
        faux = 30;
        expect(l.tenter()).toBe(false);
        faux = 60;
        expect(l.tenter()).toBe(true);
    });

    /**
     * ⭐ La cadence de diffusion doit rester **alignée sur `WB_THROTTLE`** dans
     * `CrossWindowEventService`. Diffuser plus vite, c'est payer pour du travail
     * que le service jette ; diffuser plus lentement, c'est saccader le tracé
     * chez les spectateurs.
     */
    it('annonce la même cadence que le service qui diffuse', () => {
        /*
          ⛔ **On ne recopie pas le nombre, on va le lire.** *Une seconde
          déclaration de la même vérité dérive toujours* — ce dépôt l'a payé cinq
          fois le 2026-08-24. Si quelqu'un change `WB_THROTTLE`, c'est cet essai
          qui le dit, pas une saccade six mois plus tard.
        */
        const declare = SERVICE.match(/const WB_THROTTLE = (\d+)/);
        expect(declare, 'WB_THROTTLE introuvable dans le service').not.toBeNull();
        expect(CADENCE_DE_DIFFUSION_MS).toBe(Number(declare![1]));
    });
});
