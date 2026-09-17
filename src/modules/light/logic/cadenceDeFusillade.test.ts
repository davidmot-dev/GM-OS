import { describe, it, expect } from 'vitest';
import {
    BATTEMENT_MS,
    COUPS_MAX,
    COUPS_MIN,
    PAUSE_MAX_MS,
    RAFALE_AU_REPOS,
    plancherDePause,
    prochainBattement,
    type EtatDeRafale,
} from './cadenceDeFusillade';
import { CADENCE_PLANCHER_MS } from '../HueEngine';

/**
 * **Ce que ces essais protègent : une fusillade ne doit pas noyer le pont.**
 *
 * ⛔ Le pont Hue tient de l'ordre de **dix commandes par seconde, toutes lampes
 * confondues.** Le plancher de cadence protège de **une** lampe emballée ; il ne
 * protège de rien quand elles sont quatre. La fusillade est le premier effet à
 * vouloir battre vite *et* longtemps — donc le premier à devoir compter.
 *
 * ⭐ Le dernier groupe d'essais est le seul qui prouve vraiment la conception :
 * il **simule** plusieurs lampes sur une minute et mesure le débit. *Les autres
 * décrivent le rythme ; celui-là dit s'il est jouable.* Et il a servi dès le
 * premier jour : la première version du plancher rendait **11,9 commandes par
 * seconde à six lampes**, parce qu'elle raisonnait sur une rafale moyenne.
 */

/** Un hasard prévisible, pour que le rythme soit lisible dans les essais. */
const hasardFixe = (valeur: number) => () => valeur;

/** Déroule une lampe sur `n` battements et rend la suite obtenue. */
const derouler = (n: number, lampes: number, hasard = Math.random) => {
    const suite: { eclair: boolean; attenteMs: number }[] = [];
    let etat: EtatDeRafale = RAFALE_AU_REPOS;
    for (let i = 0; i < n; i++) {
        const b = prochainBattement(etat, lampes, hasard);
        etat = b.etat;
        suite.push({ eclair: b.eclair, attenteMs: b.attenteMs });
    }
    return suite;
};

describe('le rythme d’une rafale', () => {
    it('commence toujours par un éclair', () => {
        expect(prochainBattement(RAFALE_AU_REPOS, 1, hasardFixe(0)).eclair).toBe(true);
    });

    /**
     * Un coup de feu, c'est l'éclair **et** le noir d'après. Sans le second, la
     * lampe resterait allumée et il n'y aurait pas de coup — juste une lumière.
     */
    it('alterne l’éclair et le noir', () => {
        const suite = derouler(8, 1, hasardFixe(0.99));
        expect(suite.map(b => b.eclair)).toEqual([
            true, false, true, false, true, false, true, false,
        ]);
    });

    /**
     * *On ne laisse jamais la pièce en pleine lumière pendant le silence* — la
     * pause doit donc s'ouvrir sur un noir, jamais sur un éclair resté allumé.
     */
    it('finit la rafale sur un noir, et c’est lui qui ouvre la pause', () => {
        const suite = derouler(40, 1, hasardFixe(0.5));
        const pauses = suite.filter(b => b.attenteMs > BATTEMENT_MS);
        expect(pauses.length).toBeGreaterThan(0);
        expect(pauses.every(b => !b.eclair)).toBe(true);
    });

    it('tire entre deux et cinq coups par rafale', () => {
        expect(prochainBattement(RAFALE_AU_REPOS, 1, hasardFixe(0)).etat.coups).toBe(COUPS_MIN);
        expect(prochainBattement(RAFALE_AU_REPOS, 1, hasardFixe(0.999)).etat.coups).toBe(COUPS_MAX);
    });

    /** Le battement ne descend jamais sous le plancher que le pont impose. */
    it('ne bat jamais plus vite que le plancher du pont', () => {
        const suite = derouler(300, 1);
        expect(Math.min(...suite.map(b => b.attenteMs))).toBeGreaterThanOrEqual(CADENCE_PLANCHER_MS);
    });
});

describe('le plancher de pause', () => {
    /** Une lampe seule ne partage rien : elle ne doit qu'un battement. */
    it('ne contraint presque pas une lampe seule', () => {
        expect(plancherDePause(3, 1)).toBe(BATTEMENT_MS);
        expect(plancherDePause(5, 1)).toBe(BATTEMENT_MS);
    });

    it('s’allonge avec chaque lampe supplémentaire', () => {
        expect(plancherDePause(3, 2)).toBe(700);
        expect(plancherDePause(3, 4)).toBe(1900);
    });

    /**
     * ⭐ **La correction du premier jour.** Une rafale de cinq coups occupe le
     * pont plus longtemps qu'une rafale de deux : elle doit payer plus cher.
     * *Une moyenne n'acquitte pas les cas au-dessus d'elle.*
     */
    it('fait payer une longue rafale plus cher qu’une courte', () => {
        expect(plancherDePause(COUPS_MAX, 4)).toBeGreaterThan(plancherDePause(COUPS_MIN, 4));
    });

    /** Une valeur absente ou abîmée ne doit pas rendre une pause absurde. */
    it('retombe sur des valeurs jouables si le compte n’est pas lisible', () => {
        expect(plancherDePause(Number.NaN, Number.NaN)).toBe(BATTEMENT_MS);
        expect(plancherDePause(0, 0)).toBe(BATTEMENT_MS);
    });

    it('impose son plancher même quand le hasard tire court', () => {
        const suite = derouler(80, 6, hasardFixe(0));
        const pauses = suite.filter(b => b.attenteMs > BATTEMENT_MS).map(b => b.attenteMs);
        expect(pauses.length).toBeGreaterThan(0);
        /* `hasardFixe(0)` tire la rafale la plus courte ET la pause la plus
           courte : à six lampes, c'est le plancher qui parle. */
        expect(Math.min(...pauses)).toBe(plancherDePause(COUPS_MIN, 6));
    });

    /** Le hasard garde la main quand il tire plus long que le plancher. */
    it('laisse le hasard décider quand il tire assez long', () => {
        const suite = derouler(80, 1, hasardFixe(0.999));
        const pauses = suite.filter(b => b.attenteMs > BATTEMENT_MS).map(b => b.attenteMs);
        expect(Math.max(...pauses)).toBeLessThanOrEqual(PAUSE_MAX_MS);
        expect(Math.max(...pauses)).toBeGreaterThan(plancherDePause(COUPS_MAX, 1));
    });
});

/**
 * ⭐ **Les essais qui prouvent la conception.**
 *
 * Ils simulent chaque lampe sur une minute de fusillade et comptent les
 * commandes. Le pont en tient **dix par seconde, toutes lampes confondues** —
 * c'est la seule limite qui compte, et aucun autre essai du dépôt ne la vérifie.
 *
 * *Si l'un d'eux rougit un jour, ce n'est pas lui qu'il faut détendre : c'est la
 * pièce qui répondra en retard, et le retard d'un pont ne se voit pas à
 * l'écran — il se voit dans la pièce, une demi-minute plus tard.*
 */
describe('le budget du pont', () => {
    const DEBIT_MAX_PAR_SECONDE = 10;
    const DUREE_MS = 60_000;

    /*
      ⚠️ **Chaque lampe finit sa rafale avant qu'on arrête de compter**, et son
      débit se mesure sur le temps qu'elle a *réellement* consommé.

      La première version s'arrêtait au milieu d'une rafale et divisait par une
      durée fixe : elle comptait les commandes d'un cycle entamé sans compter sa
      pause, et annonçait **10,7 cmd/s à douze lampes** pour une conception qui
      en tient dix. *Un biais de mesure ressemble trait pour trait à un défaut de
      conception — et il envoie corriger le mauvais fichier.*
    */
    const commandesParSeconde = (lampes: number): number => {
        let debit = 0;
        for (let lampe = 0; lampe < lampes; lampe++) {
            let etat: EtatDeRafale = RAFALE_AU_REPOS;
            let ecoule = 0;
            let commandes = 0;
            while (ecoule < DUREE_MS || etat.restants !== 0) {
                const b = prochainBattement(etat, lampes);
                etat = b.etat;
                ecoule += b.attenteMs;
                commandes++;
            }
            debit += (commandes / ecoule) * 1000;
        }
        return debit;
    };

    it.each([1, 2, 3, 4, 6, 8, 12])('tient le budget à %i lampe(s)', (lampes) => {
        expect(commandesParSeconde(lampes)).toBeLessThanOrEqual(DEBIT_MAX_PAR_SECONDE);
    });

    /**
     * L'autre moitié de la promesse : le budget est tenu **sans étouffer
     * l'effet**. Une fusillade qui respecterait le pont en ne tirant qu'une fois
     * toutes les dix secondes ne serait plus une fusillade.
     */
    it('crépite encore à quatre lampes', () => {
        expect(commandesParSeconde(4)).toBeGreaterThan(4);
    });
});
