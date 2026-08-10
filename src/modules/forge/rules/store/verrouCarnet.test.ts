import { describe, it, expect, beforeEach } from 'vitest';
import {
  reserverLeCarnet,
  libererLeCarnet,
  abandonnerLaRequete,
  carnetEstOccupe,
} from './useBrainstormStore';

/**
 * Le verrou du carnet, mesure avant d etre ecrit.
 *
 * Le 2026-08-10, en surveillant une forge reelle : trois inventaires identiques
 * partis dans la meme milliseconde, quatre requetes sur six jamais revenues.
 * `BrainstormOverlay` etait monte deux fois — par `App.tsx` et par
 * `ForgeDashboard` — donc aucun garde-fou porte par le composant ne pouvait les
 * departager. D ou un verrou de **module**, partage quelle que soit la forme de
 * l arbre.
 */
describe('verrou du carnet', () => {
  beforeEach(() => abandonnerLaRequete());

  it('accorde la premiere reservation', () => {
    expect(reserverLeCarnet()).not.toBeNull();
    expect(carnetEstOccupe()).toBe(true);
  });

  it('refuse la seconde tant que la premiere n a pas rendu la main', () => {
    expect(reserverLeCarnet()).not.toBeNull();
    expect(reserverLeCarnet()).toBeNull();
    expect(reserverLeCarnet()).toBeNull();
  });

  it('rouvre apres liberation', () => {
    const gen = reserverLeCarnet()!;
    libererLeCarnet(gen);
    expect(reserverLeCarnet()).not.toBeNull();
  });

  it('tient face a des appels simultanes dans le meme tick', () => {
    // C est exactement le cas mesure : deux instances, meme milliseconde.
    const accordees = [reserverLeCarnet(), reserverLeCarnet(), reserverLeCarnet()];
    expect(accordees.filter(g => g !== null)).toHaveLength(1);
  });

  it('rouvre le carnet des l abandon, sans attendre le serveur', () => {
    // On ne peut pas arreter la requete : on cesse de l attendre.
    reserverLeCarnet();
    abandonnerLaRequete();
    expect(carnetEstOccupe()).toBe(false);
    expect(reserverLeCarnet()).not.toBeNull();
  });

  it('une requete abandonnee ne libere pas le verrou de sa remplacante', () => {
    /**
     * Le piege du rattrapage : la requete abandonnee finit par retomber, et son
     * `finally` s execute. Sans la generation, elle libererait le verrou tenu
     * par la requete SUIVANTE — et deux appels partiraient de front, ce que le
     * verrou existe precisement pour empecher.
     */
    const perimee = reserverLeCarnet()!;
    abandonnerLaRequete();
    const courante = reserverLeCarnet()!;
    expect(courante).not.toBe(perimee);

    libererLeCarnet(perimee);
    expect(carnetEstOccupe()).toBe(true);

    libererLeCarnet(courante);
    expect(carnetEstOccupe()).toBe(false);
  });
});
