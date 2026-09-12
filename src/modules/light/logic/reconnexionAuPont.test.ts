import { describe, it, expect } from 'vitest';
import {
    decisionDeReconnexion, delaiAvantLaTentative, TENTATIVES_MAX,
} from './reconnexionAuPont';

/**
 * **La boucle du 2026-09-12, et pourquoi elle ne peut plus revenir.**
 *
 * David, en déplacement, a trouvé Light-OS en train d'appeler un pont resté à la
 * maison — sans fin. La cause tenait en une ligne : un effet qui avait `status`
 * dans ses dépendances et qui écrivait `status`.
 *
 * ⚠️ **Ces tests ne gardent pas le tableau des délais, ils gardent la
 * TERMINAISON.** Ajuster un recul est une décision de confort ; ne jamais
 * s'arrêter est un défaut. Les deux ne se protègent pas de la même façon.
 */

const etat = (p: Partial<Parameters<typeof decisionDeReconnexion>[0]> = {}) => ({
    statut: 'disconnected' as const,
    ip: '192.168.0.195',
    jeton: 'un-jeton',
    tentativesFaites: 0,
    ...p,
});

describe('quand il n’y a rien à reconnecter', () => {
    /*
      Une absence n'est pas un échec : le meneur qui n'a jamais branché de lampes
      ne doit voir passer ni tentative, ni message d'abandon.
    */
    it.each([
        ['sans adresse', { ip: null }],
        ['sans jeton', { jeton: null }],
    ])('%s, on ne tente rien', (_: string, p: object) => {
        expect(decisionDeReconnexion(etat(p))).toBe('rien-a-faire');
    });

    /*
      ⛔ **LA GARDE QUI BRISE LA BOUCLE.** `discovering` est l'état que la
      tentative pose elle-même. Le reprendre pour un appel à l'aide, c'est le
      rappel qui se mord la queue — le défaut, exactement.
    */
    it.each(['discovering', 'connected', 'pairing', 'mock'] as const)(
        'en « %s », on ne relance pas',
        (statut) => {
            expect(decisionDeReconnexion(etat({ statut }))).toBe('rien-a-faire');
        },
    );
});

describe('quand le pont ne répond pas', () => {
    it('essaie tant qu’il reste des tentatives', () => {
        for (let faites = 0; faites < TENTATIVES_MAX; faites++) {
            expect(decisionDeReconnexion(etat({ tentativesFaites: faites }))).toBe('essayer');
        }
    });

    /*
      ⛔ L'assertion qui aurait évité la journée du 12/09 : au bout du compte,
      **ça s'arrête**. Sans elle, tout le reste du correctif serait décoratif.
    */
    it('renonce une fois le plafond atteint, et n’en démord plus', () => {
        expect(decisionDeReconnexion(etat({ tentativesFaites: TENTATIVES_MAX }))).toBe('renoncer');
        expect(decisionDeReconnexion(etat({ tentativesFaites: TENTATIVES_MAX + 50 }))).toBe('renoncer');
    });
});

describe('le recul entre deux tentatives', () => {
    /*
      Le premier délai ne sert pas à attendre le pont : il laisse l'état Zustand
      se propager après le bootstrap. Le raccourcir ramènerait le défaut d'avant
      ce hook.
    */
    it('commence court — c’est la propagation de l’état, pas une attente', () => {
        expect(delaiAvantLaTentative(1)).toBeLessThanOrEqual(1_000);
    });

    it('s’espace strictement à chaque tentative', () => {
        for (let n = 2; n <= TENTATIVES_MAX; n++) {
            expect(delaiAvantLaTentative(n)).toBeGreaterThan(delaiAvantLaTentative(n - 1));
        }
    });

    /*
      Une échelle plus courte que le plafond rendrait `undefined` — donc un
      `setTimeout` immédiat, donc la boucle serrée qu'on vient de retirer.
    */
    it('répond pour chaque tentative permise, et borne au-delà', () => {
        for (let n = 1; n <= TENTATIVES_MAX; n++) {
            expect(Number.isFinite(delaiAvantLaTentative(n)), `tentative ${n}`).toBe(true);
        }
        expect(delaiAvantLaTentative(99)).toBe(delaiAvantLaTentative(TENTATIVES_MAX));
        expect(delaiAvantLaTentative(0)).toBe(delaiAvantLaTentative(1));
    });

    /*
      ⚠️ Le total borne ce qu'un pont absent peut coûter. Chaque tentative ajoute
      en plus son expiration réseau (5 s), et c'est ce cumul qui se voyait.
    */
    it('le cumul des attentes reste sous deux minutes', () => {
        let total = 0;
        for (let n = 1; n <= TENTATIVES_MAX; n++) total += delaiAvantLaTentative(n);
        expect(total).toBeLessThan(120_000);
    });
});
