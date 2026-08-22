import { describe, it, expect } from 'vitest';
import { tenterLaDiffusionLocale } from './modeDeContexte';
import { estEnPause } from '../session/pauseDeSeance';

/**
 * Ce que ces tests protègent : **la règle que l'axe F.4 applique à l'image.**
 *
 * *« Jamais de diffusion locale en partie — cloud direct pour les images. »*
 *
 * L'axe D.2 a posé un délai d'abandon de quatre-vingt-dix secondes sur la
 * diffusion locale. Mais en partie, ces quatre-vingt-dix secondes sont **de
 * l'attente avant même de commencer**, et elles occupent l'unique créneau de
 * `NUM_PARALLEL: 1` — *donc l'Oracle et le Cortex avec elles.* Un plafond
 * empêche le blocage sans fin ; il ne rend pas l'attente acceptable.
 *
 * La condition est `momentDeJeu(...) === 'partie'`, et ces tests la tiennent au
 * plus près de ce que l'image en fait.
 */

const T0 = 1_000_000_000_000;
const enCours = { status: 'active' };
const enPause = { status: 'active', pausedAt: T0 };

/*
  **La fonction que `AIService.generateImage` appelle vraiment**, et non une
  copie de sa condition. La première rédaction de ce fichier réimplémentait le
  test — *la vérification dans les deux sens l'a montré : remettre le défaut ne
  faisait échouer aucun de ces trois tests.*
*/
const tenteLeLocal = tenterLaDiffusionLocale;

describe('le moteur d’image suit le moment', () => {
    it('tente le local en préparation, où personne n’attend', () => {
        expect(tenteLeLocal([])).toBe(true);
        expect(tenteLeLocal([{ status: 'planned' }])).toBe(true);
        expect(tenteLeLocal([{ status: 'done' }])).toBe(true);
    });

    it('va droit au distant dès qu’une séance est ouverte', () => {
        expect(tenteLeLocal([enCours])).toBe(false);
    });

    /**
     * **La pause rouvre le local**, comme elle rouvre tout le reste — c'est ce
     * que l'axe G a rendu possible, et la raison pour laquelle cette condition
     * passe par `momentDeJeu` plutôt que par un test de statut écrit sur place.
     */
    it('rouvre le local pendant la pause', () => {
        expect(estEnPause(enPause)).toBe(true);
        expect(tenteLeLocal([enPause])).toBe(true);
    });
});
