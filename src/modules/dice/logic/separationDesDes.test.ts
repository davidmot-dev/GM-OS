import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    CORRECTION_PAR_PASSE,
    placementDuJet,
    separerLesDes,
    type CorpsDeDe,
} from './separationDesDes';
import SCENE from '../DiceBox3D.tsx?raw';

/**
 * **Ce que ces essais protègent : deux dés n'occupent jamais la même place.**
 *
 * ⛔ Demande de David le 2026-09-17 : *« est-ce que tu peux faire en sorte que les
 * dés ne s'imbriquent pas les uns dans les autres »*. La chute ne connaissait que
 * le sol et les murs — **les dés ne se voyaient pas entre eux.**
 */

const corps = (x: number, y: number, z: number, rayon = 1): CorpsDeDe => ({
    position: new THREE.Vector3(x, y, z),
    vitesse: new THREE.Vector3(),
    rayonDeCollision: rayon,
});

/** Applique la séparation jusqu'à ce que plus rien ne se chevauche. */
const detendre = (des: CorpsDeDe[], passes = 600): number => {
    let derniersChocs = 0;
    for (let i = 0; i < passes; i++) derniersChocs = separerLesDes(des);
    return derniersChocs;
};

/**
 * De combien le pire couple se chevauche encore.
 *
 * ⭐ **On mesure une grandeur, on ne compte pas des chocs.** Une première version
 * de ces essais exigeait `separerLesDes(...) === 0`, c'est-à-dire *aucune
 * inégalité stricte sur des flottants* — il en reste toujours. Mesuré : après
 * 600 passes sur dix dés empilés, le pire chevauchement vaut **2,2 × 10⁻¹⁶**.
 * L'amas était parfaitement démêlé, et l'essai le déclarait en échec.
 *
 * *Un seuil de comptage sur des flottants mesure l'arithmétique, pas le
 * phénomène.*
 */
const pireChevauchement = (des: CorpsDeDe[]): number => {
    let pire = 0;
    des.forEach((a, i) => des.forEach((b, j) => {
        if (j <= i) return;
        pire = Math.max(pire, a.rayonDeCollision + b.rayonDeCollision - a.position.distanceTo(b.position));
    }));
    return pire;
};

/** Un chevauchement qu'aucun œil ne verrait sur un dé de rayon ~1,2. */
const INVISIBLE = 1e-3;

describe('séparer deux dés', () => {
    it('ne touche pas à ceux qui ne se chevauchent pas', () => {
        const des = [corps(0, 1, 0), corps(5, 1, 0)];
        expect(separerLesDes(des)).toBe(0);
        expect(des[0].position.x).toBe(0);
        expect(des[1].position.x).toBe(5);
    });

    it('écarte deux dés qui se croisent', () => {
        const des = [corps(0, 1, 0), corps(1, 1, 0)];
        expect(separerLesDes(des)).toBe(1);
        expect(des[0].position.distanceTo(des[1].position)).toBeGreaterThan(1);
    });

    it('les écarte jusqu’au contact, pas au-delà', () => {
        const des = [corps(0, 1, 0), corps(1, 1, 0)];
        detendre(des);
        expect(des[0].position.distanceTo(des[1].position)).toBeCloseTo(2, 2);
    });

    /** Chacun recule d'autant : *un dé ne pousse pas l'autre tout seul.* */
    it('partage la correction entre les deux', () => {
        const des = [corps(0, 1, 0), corps(1, 1, 0)];
        separerLesDes(des);
        expect(des[0].position.x).toBeCloseTo(-des[1].position.x + 1, 5);
    });

    /**
     * ⛔ **Le cas qui casse tout si on l'oublie.** `normalize()` sur un vecteur
     * nul rend un vecteur nul : *aucune séparation, et les deux dés restent
     * imbriqués pour toujours, sans erreur nulle part.*
     */
    it('sépare même deux dés exactement au même point', () => {
        const des = [corps(2, 1, 3), corps(2, 1, 3)];
        detendre(des);
        expect(des[0].position.distanceTo(des[1].position)).toBeGreaterThan(1.9);
        expect(Number.isFinite(des[0].position.x)).toBe(true);
    });

    /** La séparation d'un point commun reste horizontale : *un dé ne décolle pas.* */
    it('ne fait pas décoller un dé posé', () => {
        const des = [corps(0, 0.75, 0), corps(0, 0.75, 0)];
        detendre(des);
        expect(des[0].position.y).toBeCloseTo(0.75, 5);
        expect(des[1].position.y).toBeCloseTo(0.75, 5);
    });

    it('tient compte de rayons différents', () => {
        const des = [corps(0, 1, 0, 0.8), corps(1, 1, 0, 1.6)];
        detendre(des);
        expect(des[0].position.distanceTo(des[1].position)).toBeCloseTo(2.4, 2);
    });
});

describe('séparer un amas', () => {
    /** ⭐ Le vrai cas : dix dés lâchés au même endroit doivent tous se démêler. */
    it('démêle dix dés empilés au même point', () => {
        const des = Array.from({ length: 10 }, () => corps(0, 1, 0, 1));
        detendre(des, 600);
        expect(pireChevauchement(des)).toBeLessThan(INVISIBLE);
    });

    /** Et il se démêle **vite** : c'est ce qui compte, la scène n'a que 60 images par seconde. */
    it('démêle l’essentiel en quelques dizaines de passes', () => {
        const des = Array.from({ length: 10 }, () => corps(0, 1, 0, 1));
        detendre(des, 60);
        expect(pireChevauchement(des)).toBeLessThan(INVISIBLE);
    });

    it('démêle un amas serré sans jamais rendre de position invalide', () => {
        const des = Array.from({ length: 8 }, (_, i) =>
            corps(Math.cos(i) * 0.4, 1, Math.sin(i) * 0.4, 1.1));
        detendre(des, 600);
        des.forEach(de => {
            expect(Number.isFinite(de.position.x)).toBe(true);
            expect(Number.isFinite(de.position.z)).toBe(true);
        });
        expect(pireChevauchement(des)).toBeLessThan(INVISIBLE);
    });

    /**
     * ⚠️ **La correction est partielle exprès.** Tout corriger d'un coup fait
     * sauter les dés d'une pile serrée ; en corrigeant un peu par image, l'amas
     * se détend au lieu d'exploser.
     */
    it('corrige par petites touches, pas d’un coup', () => {
        expect(CORRECTION_PAR_PASSE).toBeGreaterThan(0);
        expect(CORRECTION_PAR_PASSE).toBeLessThan(1);

        const des = [corps(0, 1, 0), corps(1, 1, 0)];
        separerLesDes(des);
        /* Une seule passe ne suffit pas à atteindre le contact. */
        expect(des[0].position.distanceTo(des[1].position)).toBeLessThan(2);
    });
});

/**
 * ⭐ **Ce qu'on empêche pendant la chute, il faut d'abord ne pas le créer au
 * départ.**
 *
 * ⛔ L'ancien placement alignait tout le monde avec un écart qui **rétrécissait**
 * quand les dés étaient nombreux : `Math.min(3, 13 / n)`. À dix dés, l'écart
 * tombait à 1,3 — *moins que la largeur d'un dé.*
 */
describe('le placement de départ', () => {
    const ECART = 2.4;
    const TAPIS = 6.5;

    it.each([1, 2, 5, 10, 20])('%i dés naissent tous séparés', nombre => {
        const places = placementDuJet(nombre, ECART, TAPIS);
        expect(places).toHaveLength(nombre);
        places.forEach((a, i) => places.forEach((b, j) => {
            if (j <= i) return;
            const d = Math.hypot(a.x - b.x, a.z - b.z);
            expect(d, `dés ${i} et ${j}`).toBeGreaterThanOrEqual(ECART - 1e-9);
        }));
    });

    it('reste centré sur le tapis', () => {
        const places = placementDuJet(6, ECART, TAPIS);
        const moyenneX = places.reduce((s, p) => s + p.x, 0) / places.length;
        const moyenneZ = places.reduce((s, p) => s + p.z, 0) / places.length;
        expect(moyenneX).toBeCloseTo(0, 6);
        expect(moyenneZ).toBeCloseTo(0, 6);
    });

    it('passe à la rangée suivante quand la première déborde', () => {
        const places = placementDuJet(12, ECART, TAPIS);
        const rangees = new Set(places.map(p => p.z.toFixed(4)));
        expect(rangees.size).toBeGreaterThan(1);
    });

    it('un seul dé tombe au centre', () => {
        expect(placementDuJet(1, ECART, TAPIS)).toEqual([{ x: 0, z: 0 }]);
    });

    it('supporte un jet vide', () => {
        expect(placementDuJet(0, ECART, TAPIS)).toEqual([]);
    });
});

/**
 * ⭐ **Le module est branché, et il l'est à l'endroit qui compte.**
 *
 * *Une séparation écrite et non appelée est une séparation absente* — la leçon
 * des quatre étages de l'Oracle, écrits et inatteignables.
 */
describe('la scène s’en sert vraiment', () => {
    it('la chute sépare les dés à chaque image', () => {
        expect(SCENE).toContain('separerLesDes(des)');
        expect(SCENE).toContain('placementDuJet(');
    });

    /**
     * ⚠️ **La séparation doit s'appliquer AUSSI aux dés posés.** La limiter aux
     * dés en vol laisserait précisément l'imbrication finale — *celle qu'on
     * voit.* On vérifie donc qu'elle est hors de la boucle par dé, et non dans
     * une branche gardée par `pose`.
     */
    it('elle s’applique aussi aux dés déjà posés', () => {
        const appel = SCENE.indexOf('separerLesDes(des)');
        const garde = SCENE.lastIndexOf('if (', appel);
        expect(SCENE.slice(garde, appel)).not.toContain('pose');
        expect(SCENE.slice(garde, appel)).toContain('des.length > 1');
    });

    /** ⛔ Le placement de départ ne doit plus rétrécir quand les dés sont nombreux. */
    it('l’écart de départ n’est plus un plafond', () => {
        expect(SCENE).not.toContain('Math.min(3, (2 * RAYON_DU_TAPIS)');
    });
});
