import { describe, it, expect } from 'vitest';
import { etatARendre } from './etatARendre';
import { brillanceEffective } from '../HueEngine';
import MOTEUR from '../HueEngine.ts?raw';
import PIED_DE_PAGE from '../components/BulbFooter.tsx?raw';

/**
 * **Ce que ces essais protègent : une lampe qui sort d'un effet retrouve l'état
 * qu'elle avait avant.**
 *
 * Le défaut, trouvé le 2026-09-17 en auditant le catalogue : une boucle d'effet
 * écrit `bri`, `xy` et `on` **directement sur le pont**, sans passer par le
 * magasin — c'est voulu, sans quoi React rendrait dix fois par seconde.
 * Mais `stopSoftwareEffect` ne faisait que couper la boucle : **la lampe restait
 * là où le dernier battement l'avait laissée.**
 *
 * En pratique : choisir « Fixe » sur un fantôme pouvait rendre une lampe presque
 * éteinte, et sur un stroboscope une lampe au minimum. *Sans message, sans
 * erreur — on croyait la lampe cassée.*
 *
 * ⭐ C'est aussi le **prérequis du vrai stroboscope** : tant que l'arrêt ne
 * restaurait rien, on ne pouvait pas faire le temps noir avec `on: false`, sous
 * peine de laisser la lampe éteinte pour de bon.
 */

/** Le curseur global au repos : la brillance passe telle quelle. */
const pleineBrillance = (bri: number) => brillanceEffective(bri, 100);

describe('l’état rendu à la fin d’un effet', () => {
    it('rend la brillance et la couleur d’avant l’effet', () => {
        const charge = etatARendre(
            { on: true, bri: 180, xy: [0.4, 0.4] } as never,
            pleineBrillance,
        );

        expect(charge).toMatchObject({ on: true, bri: 180, xy: [0.4, 0.4] });
    });

    /**
     * ⚠️ **La règle physique : le pont refuse qu'on modifie une ampoule
     * éteinte.** Lui envoyer une couleur en même temps que l'extinction fait
     * échouer la commande entière — donc la lampe ne s'éteint même pas.
     */
    it('n’envoie ni couleur ni brillance à une lampe éteinte', () => {
        const charge = etatARendre(
            { on: false, bri: 180, xy: [0.4, 0.4] } as never,
            pleineBrillance,
        );

        expect(charge.on).toBe(false);
        expect(charge).not.toHaveProperty('bri');
        expect(charge).not.toHaveProperty('xy');
    });

    /** *Une restauration qui ne sait pas quoi rendre ne doit rien inventer.* */
    it('ne rend rien d’une lampe inconnue', () => {
        expect(etatARendre(undefined, pleineBrillance)).toEqual({});
    });

    /**
     * Le curseur global s'applique au retour comme il s'applique partout
     * ailleurs : sans lui, sortir d'un effet rallumerait la pièce à fond alors
     * que le meneur l'avait baissée.
     */
    it('passe la brillance par le curseur global', () => {
        const charge = etatARendre(
            { on: true, bri: 200 } as never,
            (bri) => brillanceEffective(bri, 50),
        );

        expect(charge.bri).toBe(100);
    });

    /**
     * Un fondu court. *Instantané claquerait ; les cinq secondes du passage
     * d'ambiance feraient traîner la pièce derrière la main.*
     */
    it('revient en un fondu court', () => {
        const charge = etatARendre({ on: true, bri: 100 } as never, pleineBrillance);
        expect(charge.transitiontime).toBe(2);
    });
});

/**
 * ⛔ **La plage de brillance d'une lampe Hue est 1 à 254.** Zéro est hors
 * spécification et — surtout — **n'éteint pas** : seul `on: false` coupe.
 *
 * Deux effets posaient `bri: 0` à la main et ont été corrigés le 2026-09-17.
 * *La vraie question était « qui d'autre a la même rustine à poser ? »* — et la
 * réponse était la racine : un produit de multiplicateurs y arrive tout seul.
 */
describe('le plancher de brillance', () => {
    it('n’arrondit jamais à zéro par accident', () => {
        /* 2 × 10 % = 0,2 → arrondi à 0 avant le correctif. */
        expect(brillanceEffective(2, 10)).toBe(1);
        expect(brillanceEffective(1, 1)).toBe(1);
    });

    /**
     * ⭐ **Mais zéro reste atteignable quand il est demandé.** Un curseur posé
     * *exactement* à zéro est une décision — « rien » — prise avant ce
     * correctif et gardée par `intensiteDesScenes`.
     *
     * *Deux intentions tombaient sur la même valeur : « rien », et « aussi
     * faible que possible ». C'est toujours là que se cachent les défauts
     * muets.*
     */
    it('laisse passer le zéro qu’on demande vraiment', () => {
        expect(brillanceEffective(254, 0)).toBe(0);
        expect(brillanceEffective(254, 100, 0)).toBe(0);
    });
});

/**
 * ⛔ **La restauration est fausse par défaut, et ce n'est pas de la prudence :
 * l'activer ailleurs casserait un geste.**
 *
 * `stopSoftwareEffect` a neuf appelants. Huit posent un état juste après — une
 * scène, un flash tactique, une extinction — et y restaurer serait une commande
 * pour rien, dans un budget qui en tient dix par seconde.
 *
 * ⚠️ **Deux d'entre eux la poseraient même à l'envers.** `handleColorChange` et
 * `toggleLight` appellent `setLightState` **avant**, *sans l'attendre* : le
 * magasin n'est pas encore à jour quand l'arrêt survient. Restaurer y renverrait
 * l'état **précédent** — la couleur que l'utilisateur vient de choisir serait
 * effacée par son propre geste, et il n'y aurait ni erreur ni message.
 *
 * *C'est la quatrième fois dans ce module que des gestes de retour se
 * ressemblent sans viser la même chose. On ne les aligne pas : on les compte.*
 */
describe('qui a le droit de restaurer', () => {
    /*
      ⭐ **Le vocabulaire a changé le 2026-09-17, et cet essai l'a su le premier.**

      L'arrêt prenait un booléen. Il prend maintenant un mot — `'sansRien'`,
      `'rendreLEtat'`, `'eteindre'` — parce qu'il y a **trois** fins et non deux :
      *l'impact rend la lumière d'avant, l'explosion laisse le noir.*

      Cet essai est devenu rouge à la seconde où la signature a bougé, ce qui est
      exactement son travail. *Une garde qui ne rougit pas quand le mot qu'elle
      cherche disparaît n'est pas une garde, c'est un commentaire.*
    */
    const RESTAURANT = /stopSoftwareEffect\([^)]*,\s*'rendreLEtat'\s*\)/g;

    /**
     * **Le pied de page** : choisir « Fixe ». Le seul geste d'arrêt de
     * l'interface qui ne soit suivi d'aucune pose d'état.
     */
    it('le pied de page restaure quand on repasse en Fixe', () => {
        expect(PIED_DE_PAGE.match(RESTAURANT) ?? []).toHaveLength(1);
    });

    /**
     * **Le moteur, une fois en clair** : une lampe qui n'est pas soliste
     * découvre qu'elle est en trop pour le budget du pont et se retire — *en
     * retrouvant la couleur que la scène lui avait posée, ce qui est exactement
     * le but : elle ne s'éteint pas, elle arrête de battre.*
     */
    it('le moteur restaure quand une lampe se retire du budget', () => {
        expect(MOTEUR.match(RESTAURANT) ?? []).toHaveLength(1);
    });

    /**
     * **La seconde fois passe par une variable**, et c'est le changement du
     * 2026-09-17 : la fin d'un coup unique n'est plus la même pour tout le
     * monde. Chaque coup déclare ce qu'il laisse derrière lui.
     */
    it('un coup unique déclare la fin qu’il laisse', () => {
        expect(MOTEUR).toContain('this.stopSoftwareEffect(id, fini)');
        expect(MOTEUR.match(/fini = 'rendreLEtat'/g) ?? []).toHaveLength(1);
    });

    /**
     * ⭐ **Un seul effet éteint, et c'est l'explosion.**
     *
     * ⛔ David le 2026-09-17 : *« explosion […] à la fin cela doit devenir
     * noir »*. C'est la seule fin qui laisse une lampe éteinte, donc la seule
     * qui oblige le meneur à un geste pour la ranimer. *Une lampe qui ne revient
     * pas doit être une décision, jamais un effet de bord* — d'où ce compte.
     */
    it('seule l’explosion laisse la pièce dans le noir', () => {
        const eteignent = MOTEUR.match(/fini = 'eteindre'/g) ?? [];
        expect(eteignent).toHaveLength(1);

        const debut = MOTEUR.indexOf("case 'deflagration':");
        const fin = MOTEUR.indexOf("case 'impact':", debut);
        expect(debut).toBeGreaterThan(0);
        expect(MOTEUR.slice(debut, fin)).toContain("fini = 'eteindre'");
    });

    /**
     * ⭐ **Et nulle part ailleurs.**
     *
     * Ce compte a déjà servi **deux fois dans la même journée** : à l'arrivée
     * des coups uniques, puis à celle des solistes. Les deux fois il a forcé à
     * *justifier* le nouvel appel au lieu de le glisser.
     *
     * *Une garde qu'on se contente d'ajuster au nouveau chiffre ne garde plus
     * rien.* Celle-ci nomme ses ayants droit un par un — le jour où le total
     * bouge sans qu'un `it` le décrive, c'est qu'un appel s'est ajouté sans
     * raison écrite.
     */
    it('personne d’autre ne restaure', () => {
        const source = MOTEUR + PIED_DE_PAGE;
        expect(source.match(RESTAURANT) ?? []).toHaveLength(2);
    });

    /**
     * ⚠️ **Et le booléen ne doit pas revenir.** Il portait deux valeurs pour
     * trois intentions ; le laisser survivre quelque part rouvrirait la porte.
     */
    it('plus personne n’arrête un effet avec un booléen', () => {
        const source = MOTEUR + PIED_DE_PAGE;
        expect(source.match(/stopSoftwareEffect\([^)]*,\s*(true|false)\s*\)/g) ?? []).toEqual([]);
    });
});
