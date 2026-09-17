import { describe, it, expect } from 'vitest';
import {
    DUREE_DE_DISPARITION_MS,
    DUREE_DE_MAINTIEN_MS,
    DUREE_DU_RESULTAT_MS,
    dureeTotaleDuJet,
    PLAFOND_DE_CHUTE_MS,
} from './choregraphieDuJet';
import CROCHET from '../../session/hooks/useHubSync.ts?raw';
import SCENE from '../DiceBox3D.tsx?raw';
import HUB from '../../../components/PlayerHub.tsx?raw';

/**
 * **Ce que ces essais protègent : un joueur a cinq secondes pour lire son jet,
 * et il les a APRÈS que les dés se soient posés.**
 *
 * ⛔ Demande de David le 2026-09-17 : *« les dés doivent disparaître et le
 * résultat doit rester affiché 5 secondes supplémentaires après »*.
 *
 * L'ancien déroulé n'avait **qu'une** durée — tout disparaissait cinq secondes
 * après le lancer. Or le panneau n'apparaît qu'au bout de 1,5 s quand la 3D est
 * active : *il restait trois secondes et demie pour lire*, pendant que les dés
 * roulaient par-dessus.
 *
 * ⚠️ **Ces essais ne mesurent pas le temps** — *un essai qui mesure une durée
 * devient rouge sur une machine chargée.* Ils vérifient les valeurs déclarées et
 * le **branchement** : que le compte part bien de la pose, et qu'il a un filet.
 */

describe('les durées du déroulé', () => {
    it('le résultat reste cinq secondes, comme demandé', () => {
        expect(DUREE_DU_RESULTAT_MS).toBe(5000);
    });

    /** *Un dé qui micro-rebondit ne doit pas retenir le résultat en otage.* */
    it('la chute a un plafond, et il est plus court que le résultat', () => {
        expect(PLAFOND_DE_CHUTE_MS).toBeGreaterThan(0);
        expect(PLAFOND_DE_CHUTE_MS).toBeLessThan(DUREE_DU_RESULTAT_MS);
    });

    /** Le fondu de sortie des dés doit tenir dans le temps du résultat. */
    it('la disparition des dés tient dans la fenêtre du résultat', () => {
        expect(DUREE_DE_DISPARITION_MS).toBeLessThan(DUREE_DU_RESULTAT_MS);
    });

    /** *Se poser et disparaître dans le même instant ne laisse pas voir ce qu'on vient de lancer.* */
    it('les dés restent deux secondes posés, comme demandé', () => {
        expect(DUREE_DE_MAINTIEN_MS).toBe(2000);
    });

    it('la durée totale se lit en une ligne', () => {
        expect(dureeTotaleDuJet(2500))
            .toBe(2500 + DUREE_DE_MAINTIEN_MS + DUREE_DU_RESULTAT_MS);
    });

    /** ⛔ Une chute interminable ne rallonge pas l'affichage au-delà du plafond. */
    it('borne une chute qui n’en finirait pas', () => {
        expect(dureeTotaleDuJet(60_000))
            .toBe(PLAFOND_DE_CHUTE_MS + DUREE_DE_MAINTIEN_MS + DUREE_DU_RESULTAT_MS);
    });
});

/**
 * ⭐ **Le branchement, que les constantes seules ne prouvent pas.**
 *
 * *Une durée déclarée et non branchée est une durée absente* — la leçon des
 * quatre étages de l'Oracle, écrits et inatteignables.
 */
/**
 * Le corps de l'effet du hub qui réarme le drapeau, et lui seul.
 *
 * *Un repère cherché dans tout un fichier ne dit rien de l'endroit où il compte.*
 */
const blocDeLEffetDuJet = (): string => {
    const depart = HUB.lastIndexOf('useEffect(', HUB.indexOf('setDesPoses(false);'));
    const fin = HUB.indexOf('}, [', depart);
    expect(depart, 'l’effet du jet est introuvable').toBeGreaterThan(0);
    return HUB.slice(depart, fin);
};

describe('le déroulé est vraiment branché', () => {
    it('le hub ne garde plus de cinq secondes écrites à la main', () => {
        /* L'ancien code : `setTimeout(() => setShowDice(false), 5000)`. */
        expect(CROCHET).not.toMatch(/setShowDice\(false\),\s*\d+/);
        expect(CROCHET).toContain('DUREE_DU_RESULTAT_MS');
    });

    /**
     * ⭐ **Le compte est armé au lancer ET relancé à la pose.** C'est ce qui fait
     * que l'absence de signal — la tablette n'a pas de 3D — dégrade vers le
     * comportement d'avant au lieu de figer l'écran.
     */
    it('le compte est armé au lancer et relancé à la pose', () => {
        const appels = CROCHET.match(/fermerApresLeResultat\(\)/g) ?? [];
        expect(appels.length).toBeGreaterThanOrEqual(1);
        expect(CROCHET).toContain('signalerLesDesPoses: fermerApresLeResultat');
    });

    /** La scène doit annoncer la pose, et l'annoncer **une seule fois**. */
    it('la scène signale la pose, avec son plafond', () => {
        expect(SCENE).toContain('PLAFOND_DE_CHUTE_MS');
        expect(SCENE).toContain('onReposRef.current?.()');
        expect(SCENE).toContain('reposAnnonceRef.current = true');
    });

    /** Et le hub joueur retire les dés quand elle l'annonce. */
    it('le hub joueur retire les dés une fois posés', () => {
        expect(HUB).toContain('active={showDice && enable3D && !desPoses}');
        expect(HUB).toContain('onRepos={auReposDesDes}');
    });

    /**
     * ⚠️ **Le maintien passe par un minuteur qu'il faut annuler.** Sans
     * l'annulation, un second jet lancé pendant le maintien du premier ferait
     * disparaître ses dés au bout du compte de l'ancien — *et on chercherait
     * pourquoi un jet sur deux est plus court.*
     */
    it('le maintien est annulé quand un nouveau jet arrive', () => {
        expect(HUB).toContain('DUREE_DE_MAINTIEN_MS');

        /*
          ⛔ **Une première version cherchait `clearTimeout(maintienRef.current)`
          dans tout le fichier** — et la chaîne existe aussi dans
          `auReposDesDes`. L'essai restait donc vert alors que l'annulation avait
          été retirée de l'effet, vérifié en dégradant le code.

          ⭐ ***Un repère cherché dans tout un fichier ne dit rien de l'endroit où
          il compte.*** C'est la quatrième fois de la journée qu'un repère non
          situé me mord. On regarde donc **le bloc de l'effet**, et lui seul.
        */
        const effet = blocDeLEffetDuJet();
        expect(effet).toContain('clearTimeout(maintienRef.current)');
        /* Deux fois : au réarmement, et au nettoyage du démontage. */
        expect(effet.match(/clearTimeout\(maintienRef\.current\)/g)).toHaveLength(2);
    });

    /**
     * ⚠️ **Le réarmement se fait sur l'identifiant du jet.** Deux jets successifs
     * dans la même fenêtre d'affichage ne font pas repasser `showDice` par
     * `false` : s'y fier laisserait *le second jet sans dés, sans que rien ne le
     * dise.*
     */
    it('le drapeau se réarme sur le jet, pas sur l’affichage', () => {
        const depart = HUB.indexOf('setDesPoses(false);');
        expect(depart, 'le réarmement du drapeau est introuvable').toBeGreaterThan(0);

        /* Les dépendances de l'effet qui contient ce réarmement. */
        const dependances = HUB.slice(depart).match(/\}, \[([^\]]*)\]\);/);
        expect(dependances?.[1]).toBe('lastRoll?.id');
    });
});
