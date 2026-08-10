import { describe, it, expect, beforeEach } from 'vitest';
import { reserverLeCarnet, libererLeCarnet, carnetEstOccupe } from './useBrainstormStore';

/**
 * Le verrou du carnet, mesuré avant d'être écrit.
 *
 * Le 2026-08-10, en surveillant une forge réelle : trois inventaires identiques
 * partis dans la même milliseconde, quatre requêtes sur six jamais revenues.
 * `BrainstormOverlay` était monté deux fois — par `App.tsx` et par
 * `ForgeDashboard` — donc aucun garde-fou porté par le composant ne pouvait les
 * départager. D'où un verrou de **module**, partagé quelle que soit la forme de
 * l'arbre.
 */
describe('verrou du carnet', () => {
  beforeEach(() => libererLeCarnet());

  it('accorde la première réservation', () => {
    expect(reserverLeCarnet()).toBe(true);
    expect(carnetEstOccupe()).toBe(true);
  });

  it('refuse la seconde tant que la première n\'a pas rendu la main', () => {
    expect(reserverLeCarnet()).toBe(true);
    expect(reserverLeCarnet()).toBe(false);
    expect(reserverLeCarnet()).toBe(false);
  });

  it('rouvre après libération', () => {
    reserverLeCarnet();
    libererLeCarnet();
    expect(reserverLeCarnet()).toBe(true);
  });

  it('tient face à des appels simultanés dans le même tick', () => {
    // C'est exactement le cas mesuré : deux instances, même milliseconde.
    const accordees = [reserverLeCarnet(), reserverLeCarnet(), reserverLeCarnet()];
    expect(accordees.filter(Boolean)).toHaveLength(1);
  });

  it('supporte une libération sans réservation', () => {
    // Un `finally` peut s'exécuter sur un chemin qui n'a rien réservé.
    libererLeCarnet();
    expect(carnetEstOccupe()).toBe(false);
    expect(reserverLeCarnet()).toBe(true);
  });
});
