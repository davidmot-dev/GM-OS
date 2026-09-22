import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    reserverLesLumieres, libererLesLumieres, lesLumieresSontReservees,
    appliquerLaSceneLiee, relacherLesLumieresBientot, ecarteesJusquIci,
} from './lumiereReservee';
import { effetsManques, traceDuMoment } from '../../storyboard/logic/rapportDuMoment';

/* Les quatre chemins qui peuvent appliquer une scène liée à un son. */
import AMBIANCE from '../../ambient/useAmbientStore.ts?raw';
import BRUITAGES from '../../sound/SoundController.ts?raw';
import MUSIQUE from '../../music/useMusicStore.ts?raw';

/**
 * **Ce que le meneur a déclaré dans le moment gagne sur ce qu'un enchaînement
 * propose.**
 *
 * ⛔ **Le défaut trouvé par David le 2026-09-22** : *« quand je joue la lumière
 * Intro de Light-OS et dans une séquence de storyboard, l'effet n'est pas le
 * même »* — les couleurs différaient, et **rejouer la tuile réparait**.
 *
 * Les deux chemins posaient pourtant des états identiques. Le moment appliquait
 * sa scène, puis déclenchait ses sons — et **quatre chemins** appliquaient la
 * leur par-dessus. *Plusieurs écrivains pour une même donnée*, le motif que ce
 * dépôt paie le plus souvent.
 */

beforeEach(() => { libererLesLumieres(); });

const moteur = () => ({ applyScene: vi.fn() });

describe('la porte unique des scènes liées', () => {
    it('laisse passer quand personne ne tient les lampes', () => {
        const hue = moteur();
        expect(appliquerLaSceneLiee(hue, 'SCENE_07')).toBe(true);
        expect(hue.applyScene).toHaveBeenCalledWith('SCENE_07', true);
    });

    /** ⭐ Le cœur du correctif. */
    it('s’abstient pendant qu’un moment tient les lampes', () => {
        const hue = moteur();
        reserverLesLumieres('m-1');

        expect(appliquerLaSceneLiee(hue, 'SCENE_07')).toBe(false);
        expect(hue.applyScene, 'la scène du moment a été écrasée').not.toHaveBeenCalled();
    });

    it('et recommence à passer une fois les lampes rendues', () => {
        const hue = moteur();
        reserverLesLumieres('m-1');
        appliquerLaSceneLiee(hue, 'SCENE_07');
        libererLesLumieres();

        expect(appliquerLaSceneLiee(hue, 'SCENE_07')).toBe(true);
        expect(hue.applyScene).toHaveBeenCalledTimes(1);
    });

    it('ne fait rien sans moteur ni sans scène', () => {
        expect(appliquerLaSceneLiee(null, 'SCENE_07')).toBe(false);
        expect(appliquerLaSceneLiee(moteur(), null)).toBe(false);
        expect(appliquerLaSceneLiee(moteur(), undefined)).toBe(false);
    });
});

/**
 * ⭐ *Un réglage ignoré sans un mot se lit comme un réglage qui ne marche pas* :
 * le meneur chercherait pourquoi le lien lumineux de son bruitage est cassé.
 */
describe('ce qui a été écarté se retient', () => {
    it('garde chaque scène refusée, une seule fois', () => {
        reserverLesLumieres('m-1');
        appliquerLaSceneLiee(moteur(), 'SCENE_07');
        appliquerLaSceneLiee(moteur(), 'SCENE_07');
        appliquerLaSceneLiee(moteur(), 'SCENE_12');

        expect(ecarteesJusquIci()).toEqual(['SCENE_07', 'SCENE_12']);
        expect(libererLesLumieres().ecartees).toEqual(['SCENE_07', 'SCENE_12']);
    });

    it('et repart à vide au moment suivant', () => {
        reserverLesLumieres('m-1');
        appliquerLaSceneLiee(moteur(), 'SCENE_07');
        libererLesLumieres();

        reserverLesLumieres('m-2');
        expect(ecarteesJusquIci()).toEqual([]);
    });
});

/**
 * ⛔ **Libérer à la fin du déclenchement ne suffit pas.** Music-OS applique sa
 * scène liée **300 ms plus tard**, et les pistes d'ambiance démarrent de façon
 * asynchrone : une libération immédiate laisserait passer exactement les
 * retardataires qu'on cherche à retenir.
 */
describe('la relâche différée', () => {
    it('garde les lampes après la fin du moment', () => {
        vi.useFakeTimers();
        reserverLesLumieres('m-1');
        relacherLesLumieresBientot();

        expect(lesLumieresSontReservees(), 'rendues trop tôt : le retardataire passerait').toBe(true);

        const hue = moteur();
        vi.advanceTimersByTime(299);
        expect(appliquerLaSceneLiee(hue, 'SCENE_07'), 'le délai de Music-OS').toBe(false);

        vi.advanceTimersByTime(1_000);
        expect(lesLumieresSontReservees()).toBe(false);
        expect(appliquerLaSceneLiee(hue, 'SCENE_07')).toBe(true);
        vi.useRealTimers();
    });

    it('rend ce qui était déjà écarté, sans attendre', () => {
        vi.useFakeTimers();
        reserverLesLumieres('m-1');
        appliquerLaSceneLiee(moteur(), 'SCENE_07');

        expect(relacherLesLumieresBientot()).toEqual(['SCENE_07']);
        vi.useRealTimers();
    });

    /** ⚠️ Une réservation qu'une erreur laisserait ouverte rendrait toutes les
        scènes liées muettes jusqu'au prochain rechargement. */
    it('une libération directe annule la relâche en attente', () => {
        vi.useFakeTimers();
        reserverLesLumieres('m-1');
        relacherLesLumieresBientot();
        libererLesLumieres();

        expect(lesLumieresSontReservees()).toBe(false);
        vi.advanceTimersByTime(5_000);
        expect(lesLumieresSontReservees()).toBe(false);
        vi.useRealTimers();
    });
});

/**
 * ⭐ **« Celle du moment, et le dire »** — la règle telle que David l'a tranchée.
 * Écartée n'est pas manquée : le rapport le **dit** sans crier à la panne.
 */
describe('ce que le rapport du moment en fait', () => {
    const rapport = {
        moment: 'Intro',
        effets: [
            { nom: 'Lumières', sort: 'joue' as const },
            { nom: 'Lumières', sort: 'liee-ecartee' as const, cherche: 'SCENE_07' },
        ],
    };

    it('ne compte pas pour un manque — aucune bulle d’avertissement', () => {
        expect(effetsManques(rapport)).toEqual([]);
    });

    it('mais apparaît dans la trace du journal', () => {
        expect(traceDuMoment(rapport)).toContain('liee-ecartee');
    });
});

/**
 * ⭐⭐ **LA GARDE DES QUATRE CHEMINS.**
 *
 * Quatre endroits appliquaient une scène liée à un son. *Quatre gardes écrites
 * séparément finissent par ne plus dire la même chose, et la quatrième manquera
 * le jour où on l'oubliera.* Aucun type n'exprime cette règle : on relit la
 * source.
 */
describe('aucun enchaînement ne parle au pont directement', () => {
    const CHEMINS: [string, string][] = [
        ['Ambient-OS', AMBIANCE],
        ['Sound-OS', BRUITAGES],
        ['Music-OS', MUSIQUE],
    ];

    it.each(CHEMINS)('%s passe par la porte unique', (_nom, source) => {
        expect(source).toContain('appliquerLaSceneLiee');
    });

    it.each(CHEMINS)('%s n’applique plus de scène liée à la main', (_nom, source) => {
        const directs = source.split('\n').filter(ligne =>
            /applyScene\s*\(/.test(ligne) && /linkedLightSceneId/.test(ligne));

        expect(directs, 'cette ligne écraserait la lumière déclarée par un moment').toEqual([]);
    });
});
