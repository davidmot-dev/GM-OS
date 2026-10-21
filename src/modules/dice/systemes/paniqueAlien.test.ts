import { describe, expect, it } from 'vitest';
import {
    CLE_PANIQUE_ALIEN, appliquerLaPaniqueAlien, arreterLaPaniqueAlien, changerLeStressAlien,
    cumulAlien, demanderUnePaniqueAlien, desApresTremblement, effetDePanique, lireLaPaniqueAlien, resultatAvecPanique,
    type RegleDePaniqueAlien,
} from './paniqueAlien';
import type { RollResult } from '../DiceEngine';

const regle: RegleDePaniqueAlien = { mecanique: 'alien', stress: 'stress', agilite: 'agilite', empathie: 'empathie', androide: 'androide' };
const jet: RollResult = { total: 2, successes: 2, tagSuccess: true, degre: 'reussite-normale', modifier: 0,
    totalDisplay: '2 réussites', rolls: [{ val: 6, sides: 6, source: 'base' }, { val: 1, sides: 6, source: 'gear' }] };

describe('Alien français p. 103–105 : conséquences et événements de Panique', () => {
    it('deux six restent provisoires, puis sont annulés à 10 ; neuf laisse réussir', () => {
        expect(resultatAvecPanique(jet).tagSuccess).toBeUndefined();
        expect(resultatAvecPanique(jet, 9)).toEqual(jet);
        const res = resultatAvecPanique(jet, 10);
        expect(res).toMatchObject({ successes: 0, tagSuccess: false, degre: 'echec-normal' });
        expect(res.rolls).toEqual(jet.rolls);
    });
    it.each([[7, 4], [9, 4], [10, 4], [11, 2], [12, 2], [13, 2], [14, 3], [15, 3]])('total %i : Stress devient %i', (total, attendu) => {
        expect(appliquerLaPaniqueAlien(regle, 'panique', { stress: 3 }, 'evt', total).stress ?? 3).toBe(attendu);
    });
    it('un effet enregistré ne se paie pas de nouveau après sérialisation et reconnexion', () => {
        const fiche = { stress: 3, ...appliquerLaPaniqueAlien(regle, 'panique', { stress: 3 }, 'evt', 10) };
        expect(appliquerLaPaniqueAlien(regle, 'panique', JSON.parse(JSON.stringify(fiche)), 'evt', 10)).toEqual({});
        expect(changerLeStressAlien(regle, fiche, 'autre-degat', 1).stress).toBe(5);
    });
    it('la contagion demande des cibles selon le résultat, sans toucher toute la campagne', () => {
        expect(effetDePanique('a', 7)?.contagion).toMatchObject({ effet: 'stress', traites: [] });
        expect(effetDePanique('a', 12)?.contagion).toMatchObject({ effet: 'panique', critere: expect.stringContaining('entendent') });
        expect(effetDePanique('a', 13)?.contagion?.critere).toContain('voient');
        const fiche = demanderUnePaniqueAlien({}, 'contagion', 'Hurlement');
        expect(demanderUnePaniqueAlien(fiche, 'contagion', 'Hurlement')).toEqual({});
        expect(lireLaPaniqueAlien(appliquerLaPaniqueAlien(regle, 'panique', fiche, 'contagion', 3)).demandes).toEqual([]);
    });
    it('13+ persiste comme rappel de traumatisme, même une fois calmé', () => {
        const fiche = appliquerLaPaniqueAlien(regle, 'panique', {}, 'fuite', 13);
        const calme = arreterLaPaniqueAlien(fiche, 'panique');
        expect(calme.panique).toBe(0);
        expect(lireLaPaniqueAlien(calme)).toMatchObject({ effet: undefined, traumaEnAttente: true });
    });
    it('un androïde avec du Stress ancien ne reçoit ni gain ni effet de Panique', () => {
        expect(appliquerLaPaniqueAlien(regle, 'p', { androide: true, stress: 4 }, 'a', 15)).toEqual({});
        expect(changerLeStressAlien(regle, { androide: true }, 'a', 1)).toEqual({});
    });
    it('la Folie meurtrière remplace l’effet 11+, sans baisser le Stress, et sa fin exige Brisé', () => {
        const fiche = appliquerLaPaniqueAlien(regle, 'p', { stress: 5 }, 'a', 13, true);
        expect(fiche.stress).toBeUndefined();
        expect(lireLaPaniqueAlien(fiche).effet).toMatchObject({ titre: 'Folie meurtrière', duree: 'brise' });
    });
    it('Tremblement déborde sur le Stress si la base ne suffit pas', () => {
        expect(desApresTremblement(1, 3, -2)).toEqual({ base: 0, stress: 2 });
        expect(desApresTremblement(4, 2, -2)).toEqual({ base: 2, stress: 2 });
        expect(desApresTremblement(0, 1, -2)).toEqual({ base: 0, stress: 0 });
    });
    it('la fin d’un effet ne supprime ni les demandes ni les reçus', () => {
        const fiche = appliquerLaPaniqueAlien(regle, 'p', demanderUnePaniqueAlien({}, 'b', 'Horreur'), 'a', 10);
        const suivi = lireLaPaniqueAlien(arreterLaPaniqueAlien(fiche, 'p'));
        expect(suivi.traites).toContain('a');
        expect(suivi.demandes).toEqual([{ id: 'b', cause: 'Horreur' }]);
        expect(suivi.historique).toHaveLength(1);
        expect(fiche[CLE_PANIQUE_ALIEN]).toBeTruthy();
    });
    it('le cumul français distingue un résultat inférieur et une égalité', () => {
        expect(cumulAlien(9, 10)).toEqual({ effectif: 11, cumule: true });
        expect(cumulAlien(10, 10)).toEqual({ effectif: 10, cumule: false });
        expect(cumulAlien(12, 10)).toEqual({ effectif: 12, cumule: false });
    });
});
