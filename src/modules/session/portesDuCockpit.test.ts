import { describe, it, expect } from 'vitest';
/*
  Le source est importé comme texte par Vite (`?raw`) plutôt que lu par
  `node:fs` : les tests tournent sous jsdom, où `fs` n'existe pas, et le
  passage en environnement Node fait tomber le fichier de mise en place commun.
*/
import COCKPIT from './components/CampaignCockpit.tsx?raw';
import { AFFINITE_DES_VUES } from './affiniteDesVues';
import type { CurrentView } from '../../types/campaign.types';

/**
 * **Une vue qui convient aux deux moments doit avoir une porte dans le cockpit.**
 *
 * Trouvé par David le 2026-09-05 : *« je n'ai plus, quand une session est en
 * cours, l'accès à la chronologie et au wiki »*.
 *
 * Le mécanisme est en trois temps, et aucun des trois n'est fautif seul :
 * `timeline-wiki` n'avait qu'une porte, dans le panneau de campagne ; ce panneau
 * est classé `'preparation'` ; et `useLayoutManager` renvoie au cockpit toute
 * vue d'atelier dès qu'une séance commence. La vue restait donc **autorisée et
 * inatteignable** — le classement disait `'les-deux'`, la navigation disait
 * `'preparation'`.
 *
 * ⚠️ **Ce que ce test ne prouve pas.** Il lit le source du cockpit et y cherche
 * un `setCurrentView`. Il ne dit rien de la visibilité réelle du bouton — un
 * repli, une condition, un `hidden` lui échapperaient. *Il garde l'existence
 * d'une porte, pas qu'elle s'ouvre.* C'est peu, et c'est exactement ce qui
 * manquait.
 */

/** Les vues vers lesquelles le cockpit sait naviguer. */
const portes = new Set(
    [...COCKPIT.matchAll(/setCurrentView\('([^']+)'\)/g)].map((m) => m[1]),
);

describe('les portes du cockpit', () => {
    const desDeuxCotes = (Object.keys(AFFINITE_DES_VUES) as CurrentView[])
        .filter((v) => AFFINITE_DES_VUES[v] === 'les-deux' && v !== 'cockpit');

    it.each(desDeuxCotes)('« %s » est atteignable depuis le cockpit', (vue) => {
        expect(portes.has(vue)).toBe(true);
    });

    it('en couvre bien six — sans quoi la boucle ci-dessus ne prouverait rien', () => {
        /* Une liste vide fait passer `it.each` sans exécuter un seul cas. */
        expect(desDeuxCotes.length).toBe(6);
    });

    it('trouve les portes en lisant vraiment le fichier', () => {
        /*
          Si la lecture échouait ou si le motif changeait, `portes` serait vide
          et tous les cas au-dessus échoueraient — mais autant le dire ici.
        */
        expect(portes.size).toBeGreaterThan(3);
    });
});

describe('ce que le classement promet', () => {
    it('timeline-wiki reste classée des deux côtés — c’est le classement qui avait raison', () => {
        /*
          Le remède au défaut du 05/09 était d'ajouter la porte, **pas** de
          reclasser la vue en `'preparation'`. On la consulte en jouant : c'est
          même ce que le commentaire d'`affiniteDesVues` dit depuis le 23/08.
        */
        expect(AFFINITE_DES_VUES['timeline-wiki']).toBe('les-deux');
    });
});
