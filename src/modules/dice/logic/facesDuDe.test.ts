import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    facesDeLaGeometrie,
    geometrieAPlat,
    geometrieDuD10,
    orientationPourMontrer,
    poserLesChiffres,
    valeursDesFaces,
} from './facesDuDe';
import {
    AXES_QUI_SEPARENT,
    COULEURS_DU_DE,
    couleurDuDe,
    FACES_DU_SOLIDE,
    grilleDeLAtlas,
    inscriptionDeLaFace,
    RECETTES,
    TAILLE_DU_CHIFFRE,
    type StyleDeDes,
} from './stylesDeDes';
import { RAPPORT_DU_TRAPEZOEDRE } from './facesDuDe';

/**
 * **Ce que ces essais protègent : qu'un dé montre le nombre qu'il a fait.**
 *
 * ⛔ Défaut trouvé par David à l'écran le 2026-09-17 : *« les dés en 3D sont
 * affreux »*. Deux des trois causes ne sont pas des réglages :
 *
 * - **aucun chiffre** sur les faces ;
 * - l'orientation finale était `Math.round(Math.random() * 4) * Math.PI / 2` —
 *   **tirée au sort**, donc sans aucun rapport avec le résultat du jet.
 *
 * ⚠️ *Aucun essai ne pouvait le voir* : rien dans ce code ne prétendait montrer
 * une valeur. La correction n'est pas cosmétique, c'est une notion qui manquait —
 * *la face qui porte la valeur.*
 */

/** Les six dés du catalogue, avec la géométrie que le moteur leur donne. */
const DES: { nom: string; faces: number; geometrie: () => THREE.BufferGeometry }[] = [
    { nom: 'd4', faces: 4, geometrie: () => new THREE.TetrahedronGeometry(1.2) },
    { nom: 'd6', faces: 6, geometrie: () => new THREE.BoxGeometry(1.4, 1.4, 1.4) },
    { nom: 'd8', faces: 8, geometrie: () => new THREE.OctahedronGeometry(1.4) },
    { nom: 'd10', faces: 10, geometrie: () => geometrieDuD10(1.2) },
    { nom: 'd12', faces: 12, geometrie: () => new THREE.DodecahedronGeometry(1.4) },
    { nom: 'd20', faces: 20, geometrie: () => new THREE.IcosahedronGeometry(1.4) },
];

describe('retrouver les faces sous les triangles', () => {
    it.each(DES)('$nom a bien $faces faces', ({ faces, geometrie }) => {
        const plate = geometrieAPlat(geometrie());
        expect(facesDeLaGeometrie(plate)).toHaveLength(faces);
    });

    /**
     * ⛔ **Le refus qui empêche les chiffres de tomber sur les mauvaises faces.**
     *
     * Une première version dé-indexait en silence : les indices rendus parlaient
     * d'une **copie**, pendant que `poserLesChiffres` lisait l'original. Sur le d6
     * — la seule géométrie indexée du lot — *rien n'aurait signalé quoi que ce
     * soit.*
     */
    it('refuse une géométrie indexée plutôt que de deviner', () => {
        const indexee = new THREE.BoxGeometry(1, 1, 1);
        expect(indexee.index).not.toBeNull();
        expect(() => facesDeLaGeometrie(indexee)).toThrow(/à plat/);
    });

    it('rend des normales unitaires et des centres hors du centre du dé', () => {
        const plate = geometrieAPlat(new THREE.IcosahedronGeometry(1.4));
        facesDeLaGeometrie(plate).forEach(face => {
            expect(face.normale.length()).toBeCloseTo(1, 5);
            expect(face.centre.length()).toBeGreaterThan(0.5);
            /* Le centre d'une face est dans la direction de sa normale. */
            expect(face.centre.clone().normalize().dot(face.normale)).toBeGreaterThan(0.99);
        });
    });
});

describe('numéroter les faces', () => {
    it.each(DES)('$nom porte chaque valeur une fois et une seule', ({ faces, geometrie }) => {
        const valeurs = valeursDesFaces(facesDeLaGeometrie(geometrieAPlat(geometrie())));
        expect([...valeurs].sort((a, b) => a - b))
            .toEqual(Array.from({ length: faces }, (_, i) => i + 1));
    });

    /**
     * ⭐ **La règle des vrais dés : deux faces opposées font `n + 1`.** Sur un dé
     * posé on voit la face du dessus *et* ses flancs ; un 20 collé à un 19 se
     * remarque tout de suite.
     */
    it.each(DES.filter(d => d.nom !== 'd4'))('$nom : deux faces opposées font n + 1', ({ faces, geometrie }) => {
        const lesFaces = facesDeLaGeometrie(geometrieAPlat(geometrie()));
        const valeurs = valeursDesFaces(lesFaces);

        let paires = 0;
        lesFaces.forEach((face, i) => {
            const oppose = lesFaces.findIndex((f, j) =>
                j !== i && f.normale.distanceTo(face.normale.clone().negate()) < 1e-3);
            if (oppose < 0) return;
            paires++;
            expect(valeurs[i] + valeurs[oppose]).toBe(faces + 1);
        });
        expect(paires).toBe(faces);
    });

    it('refuse un remplissage qui ferait déborder les faces de leur case', () => {
        const plate = geometrieAPlat(new THREE.OctahedronGeometry(1.4));
        const lesFaces = facesDeLaGeometrie(plate);
        expect(() => poserLesChiffres(plate, lesFaces, valeursDesFaces(lesFaces), 3, 3, 0.51))
            .toThrow(/déborderaient/);
    });

    /**
     * ⚠️ **Le tétraèdre n'a pas de faces opposées** — il n'est pas symétrique par
     * rapport à son centre. Le vérifier évite qu'on « corrige » un jour une règle
     * qui ne s'applique pas à lui.
     */
    it('le d4 n’a aucune face opposée, et c’est normal', () => {
        const lesFaces = facesDeLaGeometrie(geometrieAPlat(new THREE.TetrahedronGeometry(1.2)));
        const opposees = lesFaces.filter((face, i) => lesFaces.some((f, j) =>
            j !== i && f.normale.distanceTo(face.normale.clone().negate()) < 1e-3));
        expect(opposees).toHaveLength(0);
    });

    it('numérote de la même façon à chaque exécution', () => {
        const uneFois = () => valeursDesFaces(facesDeLaGeometrie(geometrieAPlat(new THREE.OctahedronGeometry(1.4))));
        expect(uneFois()).toEqual(uneFois());
    });
});

/**
 * ⭐ **L'essai central : le dé montre-t-il sa valeur ?**
 *
 * On prend la face qui porte la valeur, on demande l'orientation, on l'applique,
 * et on vérifie que cette face pointe **vers le ciel**. C'est exactement ce que
 * l'ancien code ne faisait pas.
 */
describe('poser le dé sur la face qui gagne', () => {
    it.each(DES)('$nom : chaque valeur peut être montrée en haut', ({ faces, geometrie }) => {
        const lesFaces = facesDeLaGeometrie(geometrieAPlat(geometrie()));
        const valeurs = valeursDesFaces(lesFaces);

        for (let v = 1; v <= faces; v++) {
            const face = lesFaces[valeurs.indexOf(v)];
            const tournee = face.normale.clone().applyQuaternion(orientationPourMontrer(face.normale));
            expect(tournee.y).toBeCloseTo(1, 5);
        }
    });

    /** Le lacet fait tourner le dé sans décoller la face du dessus. */
    it('le lacet ne change pas quelle face est en haut', () => {
        const lesFaces = facesDeLaGeometrie(geometrieAPlat(new THREE.IcosahedronGeometry(1.4)));
        const face = lesFaces[7];
        [0, 1, 2.5, -3].forEach(lacet => {
            const tournee = face.normale.clone().applyQuaternion(orientationPourMontrer(face.normale, lacet));
            expect(tournee.y).toBeCloseTo(1, 5);
        });
    });

    /** Et il fait réellement tourner : sinon deux dés se figeraient pareil. */
    it('le lacet tourne vraiment le dé autour de la verticale', () => {
        const lesFaces = facesDeLaGeometrie(geometrieAPlat(new THREE.IcosahedronGeometry(1.4)));
        const face = lesFaces[3];
        const repere = lesFaces[9].normale.clone();
        const sans = repere.clone().applyQuaternion(orientationPourMontrer(face.normale, 0));
        const avec = repere.clone().applyQuaternion(orientationPourMontrer(face.normale, Math.PI / 2));
        expect(sans.distanceTo(avec)).toBeGreaterThan(0.5);
    });
});

describe('poser les chiffres sur les faces', () => {
    it.each(DES)('$nom : chaque sommet reçoit une coordonnée de texture valide', ({ faces, geometrie }) => {
        const plate = geometrieAPlat(geometrie());
        const lesFaces = facesDeLaGeometrie(plate);
        const valeurs = valeursDesFaces(lesFaces);
        const { colonnes, lignes } = grilleDeLAtlas(faces);

        poserLesChiffres(plate, lesFaces, valeurs, colonnes, lignes);

        const uv = plate.getAttribute('uv');
        expect(uv.count).toBe(plate.getAttribute('position').count);
        for (let i = 0; i < uv.count; i++) {
            expect(uv.getX(i)).toBeGreaterThanOrEqual(0);
            expect(uv.getX(i)).toBeLessThanOrEqual(1);
            expect(uv.getY(i)).toBeGreaterThanOrEqual(0);
            expect(uv.getY(i)).toBeLessThanOrEqual(1);
        }
    });

    /**
     * ⭐ **Chaque face doit atterrir dans SA case**, sans quoi un dé afficherait le
     * chiffre d'un autre. On vérifie que tous les sommets d'une face tombent dans
     * la case de sa valeur.
     */
    it('les sommets d’une face restent dans la case de leur valeur', () => {
        const plate = geometrieAPlat(new THREE.IcosahedronGeometry(1.4));
        const lesFaces = facesDeLaGeometrie(plate);
        const valeurs = valeursDesFaces(lesFaces);
        const { colonnes, lignes } = grilleDeLAtlas(20);
        poserLesChiffres(plate, lesFaces, valeurs, colonnes, lignes);

        const uv = plate.getAttribute('uv');
        lesFaces.forEach((face, iFace) => {
            const colonne = (valeurs[iFace] - 1) % colonnes;
            const ligne = Math.floor((valeurs[iFace] - 1) / colonnes);
            face.sommets.forEach(i => {
                expect(Math.floor(uv.getX(i) * colonnes + 1e-6)).toBe(colonne);
                expect(Math.floor((1 - uv.getY(i)) * lignes + 1e-6)).toBe(ligne);
            });
        });
    });
});

describe('ce qui est écrit sur la face', () => {
    /** *Un d10 numéroté de 1 à 10 est un dé qu'aucun joueur n'a jamais tenu.* */
    it('le d10 porte un zéro, pas un dix', () => {
        expect(inscriptionDeLaFace(10, 9)).toBe('9');
        expect(inscriptionDeLaFace(10, 10)).toBe('0');
    });

    it('le d100 compte par dizaines et commence à 00', () => {
        expect(inscriptionDeLaFace(100, 1)).toBe('10');
        expect(inscriptionDeLaFace(100, 9)).toBe('90');
        expect(inscriptionDeLaFace(100, 10)).toBe('00');
    });

    it('les autres portent leur nombre', () => {
        expect(inscriptionDeLaFace(20, 20)).toBe('20');
        expect(inscriptionDeLaFace(6, 3)).toBe('3');
    });

    it('la grille de l’atlas reste la plus carrée possible', () => {
        expect(grilleDeLAtlas(4)).toEqual({ colonnes: 2, lignes: 2 });
        expect(grilleDeLAtlas(6)).toEqual({ colonnes: 3, lignes: 2 });
        expect(grilleDeLAtlas(20)).toEqual({ colonnes: 5, lignes: 4 });
    });
});

/**
 * ⭐ **LE DÉFAUT QUE CES ESSAIS ONT TROUVÉ SANS LE CHERCHER.**
 *
 * Le d10 d'origine posait ses pôles à `1,5 r` et son anneau à `0,5 r` — des
 * « coordonnées standard » recopiées de quelque part. ⛔ **Elles ne décrivent pas
 * un trapézoèdre** : chaque cerf-volant est plié, donc le solide avait **vingt**
 * facettes au lieu de dix. Et les cinq du bas étaient enroulées à l'envers, ce que
 * le code compensait par `side: THREE.DoubleSide` — *une rustine qui décrivait le
 * symptôme sans nommer la cause.*
 *
 * ⭐ ***Un dé n'a de faces que le jour où on veut écrire dessus.*** Rien ne
 * regardait les faces auparavant ; rien ne pouvait donc voir que le solide n'en
 * avait pas.
 */
describe('le d10 est un vrai trapézoèdre', () => {
    it('ses cerfs-volants sont plans — dix faces, pas vingt', () => {
        expect(facesDeLaGeometrie(geometrieDuD10(1.2))).toHaveLength(10);
    });

    /** Sur un solide fermé, la moitié des normales pointe vers le bas. */
    it('ses normales sortent vraiment, en haut comme en bas', () => {
        const normales = facesDeLaGeometrie(geometrieDuD10(1.2)).map(f => f.normale);
        expect(normales.filter(n => n.y > 0)).toHaveLength(5);
        expect(normales.filter(n => n.y < 0)).toHaveLength(5);
        /* Et chaque normale sort bien du centre, pas vers lui. */
        facesDeLaGeometrie(geometrieDuD10(1.2)).forEach(face => {
            expect(face.centre.dot(face.normale)).toBeGreaterThan(0);
        });
    });

    /** Le rapport n'est pas un réglage : c'est la solution de la planéité. */
    it('tient son rapport exact entre le pôle et l’anneau', () => {
        expect(RAPPORT_DU_TRAPEZOEDRE).toBeCloseTo(9.472136, 5);
    });

    it('est rendu à plat, donc utilisable tel quel', () => {
        expect(geometrieDuD10(1.2).index).toBeNull();
    });
});

describe('les tables du catalogue', () => {
    /** *Une table qui oublie un dé le laisse sans chiffres, et personne ne le sait.* */
    it('chaque dé jouable a son solide et sa taille de chiffre', () => {
        [4, 6, 8, 10, 12, 20, 100].forEach(faces => {
            expect(FACES_DU_SOLIDE[faces], `solide du d${faces}`).toBeGreaterThan(0);
            expect(TAILLE_DU_CHIFFRE[faces], `chiffre du d${faces}`).toBeGreaterThan(0);
        });
    });

    /** ⛔ *Une sphère n'est pas un dé* — le d100 est un d10 qui compte par dizaines. */
    it('le d100 est un solide à dix faces', () => {
        expect(FACES_DU_SOLIDE[100]).toBe(10);
    });

    /** Les faces triangulaires laissent bien moins de place que les pentagones. */
    it('le chiffre d’un d20 est plus petit que celui d’un d12', () => {
        expect(TAILLE_DU_CHIFFRE[20]).toBeLessThan(TAILLE_DU_CHIFFRE[12]);
        expect(TAILLE_DU_CHIFFRE[8]).toBeLessThan(TAILLE_DU_CHIFFRE[6]);
    });
});

/**
 * ⭐ **Trois matières doivent se reconnaître d'un coup d'œil.**
 *
 * ⛔ David le 2026-09-17 : *« je ne vois aucune différence entre résine / verre /
 * métal »*. La cause première était le transport — le réglage n'arrivait jamais
 * au Hub —, mais les recettes se ressemblaient aussi trop.
 *
 * ⚠️ *Deux matériaux qui ne diffèrent que par une décimale de rugosité sont le
 * même matériau* — la leçon des trois feux de Light-OS, transposée. Cet essai ne
 * juge pas le goût : il exige que les trois **s'écartent** sur les axes que l'œil
 * lit en premier.
 */
describe('les trois matières ne se ressemblent pas', () => {
    it('chaque paire diffère nettement sur au moins un axe', () => {
        const paires: [StyleDeDes, StyleDeDes][] = [
            ['resine', 'verre'], ['resine', 'metal'], ['verre', 'metal'],
        ];
        paires.forEach(([a, b]) => {
            const ecarts = AXES_QUI_SEPARENT.map(axe =>
                Math.abs(RECETTES[a][axe] - RECETTES[b][axe]));
            expect(Math.max(...ecarts), `${a} vs ${b}`).toBeGreaterThan(0.3);
        });
    });

    it('chaque matière tient sa définition', () => {
        expect(RECETTES.metal.metalness).toBe(1);
        expect(RECETTES.verre.transmission).toBeGreaterThan(0.8);
        expect(RECETTES.resine.transmission).toBe(0);
        expect(RECETTES.resine.metalness).toBe(0);
    });

    /** *Ce qui dit « métal » à l'œil, ce n'est pas la couleur, c'est la netteté du reflet.* */
    it('le métal réfléchit plus net que la résine', () => {
        expect(RECETTES.metal.roughness).toBeLessThan(RECETTES.resine.roughness / 2);
    });

    /** Seul le verre teinte son volume — sinon la couleur du dé se lave. */
    it('seul le verre atténue', () => {
        expect(RECETTES.verre.attenue).toBe(true);
        expect(RECETTES.resine.attenue).toBe(false);
        expect(RECETTES.metal.attenue).toBe(false);
    });

    /** ⚠️ **Le code couleur ne bouge pas avec le style** : c'est de l'information. */
    it('la couleur reste dictée par le jet, jamais par la matière', () => {
        expect(couleurDuDe({ isCritMax: true })).toBe(COULEURS_DU_DE.critiqueHaut);
        expect(couleurDuDe({ isCritMin: true })).toBe(COULEURS_DU_DE.critiqueBas);
        expect(couleurDuDe({ source: 'gear' })).toBe(COULEURS_DU_DE.equipement);
        expect(couleurDuDe({})).toBe(COULEURS_DU_DE.ordinaire);
    });
});
