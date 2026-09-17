/**
 * **Trois styles de dés, et pourquoi celui d'avant ne pouvait pas marcher.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE VERRE N'AVAIT RIEN À RÉFRACTER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le matériau d'origine demandait `transmission: 0.7`, `roughness: 0.05` et
 * `metalness: 0.2` — du cristal poli. Mais la scène n'avait **aucune carte
 * d'environnement**, et le fond du rendu était **transparent**.
 *
 * ⭐ ***Un matériau physique sans environnement n'a rien à réfléchir : il rend du
 * gris.*** La transmission échantillonne ce qu'il y a derrière l'objet ; derrière,
 * il n'y avait rien. Le poli spéculaire réfléchit l'environnement ; il n'y en
 * avait pas. Les deux réglages les plus coûteux de la scène ne produisaient donc
 * qu'un aplat laiteux — *plus le rendu se voulait physique, plus il était plat.*
 *
 * S'ajoutaient quatre lumières qui s'annulaient : une ambiante à 1,2 et une
 * hémisphérique à 1,0 **suppriment le relief** — elles éclairent toutes les faces
 * pareil, ce qui est exactement ce qu'un dé ne doit pas être.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI CHANGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une carte d'environnement est générée (`RoomEnvironment` + `PMREMGenerator`),
 * l'ambiante tombe très bas, et une lumière-clé dessine les arêtes. *Le relief
 * d'un dé vient de l'écart entre ses faces, pas de leur éclairement.*
 *
 * ⚠️ **Le code couleur reste intact** dans les trois styles : accent pour un jet
 * ordinaire, vert pour un critique haut, rouge pour un critique bas, jaune pour
 * un dé d'équipement. *Un style est une matière, pas une signification.*
 */

/** Les trois matières proposées au meneur. */
export type StyleDeDes = 'resine' | 'verre' | 'metal';

export const STYLES_DE_DES: StyleDeDes[] = ['resine', 'verre', 'metal'];

export const STYLE_PAR_DEFAUT: StyleDeDes = 'resine';

/** Ce qu'un style fait au matériau, hors couleur. */
export interface RecetteDeStyle {
    metalness: number;
    roughness: number;
    /** 0 = opaque. Au-delà, il faut quelque chose derrière à réfracter. */
    transmission: number;
    thickness: number;
    ior: number;
    clearcoat: number;
    clearcoatRoughness: number;
    /** Combien la carte d'environnement compte dans le rendu. */
    envMapIntensity: number;
    /** Couleur des chiffres gravés, en hexadécimal. */
    chiffres: string;
    /**
     * Le volume teinte-t-il ce qui le traverse ? **Seulement pour le verre** —
     * c'est ce qui fait qu'un dé translucide a une couleur au lieu d'être un
     * glaçon. Sans atténuation, `transmission` lave la couleur du dé.
     */
    attenue: boolean;
}

export const RECETTES: Record<StyleDeDes, RecetteDeStyle> = {
    /**
     * **Résine** — le dé de jeu de rôle ordinaire : opaque, un vernis par-dessus,
     * des chiffres clairs. *C'est celui qui se lit de loin, donc celui par défaut.*
     */
    resine: {
        metalness: 0,
        /* Assez mat pour que la lumière s'étale sur la face : c'est ce qui
           distingue un plastique d'un miroir. */
        roughness: 0.55,
        transmission: 0,
        thickness: 0,
        ior: 1.5,
        /* Le vernis par-dessus — un reflet net sur une matière mate. */
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 0.8,
        chiffres: '#ffffff',
        attenue: false,
    },

    /**
     * **Verre** — l'intention d'origine, cette fois avec un environnement à
     * réfracter. ⚠️ Les chiffres y sont **sombres et opaques** : sur un dé
     * translucide, un chiffre clair disparaît dans le fond.
     */
    verre: {
        metalness: 0,
        roughness: 0.02,
        transmission: 0.92,
        /* Une vraie épaisseur : c'est elle qui donne sa profondeur au volume. */
        thickness: 2.6,
        ior: 1.55,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.2,
        chiffres: '#080d16',
        attenue: true,
    },

    /**
     * **Métal** — brossé, chiffres gravés sombres. Le plus lisible des trois de
     * près, le plus froid de loin.
     */
    metal: {
        metalness: 1,
        /*
          ⚠️ **Poli, et c'est ce qui le rend reconnaissable.** À 0,28 un métal
          rend une bouillie grise qu'on prend pour du plastique : *ce qui dit
          « métal » à l'œil, ce n'est pas la couleur, c'est la netteté du reflet.*
        */
        roughness: 0.14,
        transmission: 0,
        thickness: 0,
        ior: 2.5,
        clearcoat: 0,
        clearcoatRoughness: 0,
        envMapIntensity: 2,
        chiffres: '#05080d',
        attenue: false,
    },
};

/**
 * ⚠️ **Ce qui sépare vraiment les trois matières.**
 *
 * ⛔ David le 2026-09-17 : *« je ne vois aucune différence entre résine / verre /
 * métal »*. La cause première était le **transport** — le réglage n'arrivait pas
 * au Hub —, mais les trois recettes se ressemblaient aussi trop pour être
 * reconnues d'un coup d'œil.
 *
 * Elles s'écartent maintenant sur les trois axes que l'œil lit en premier :
 *
 * | | Métal | Transmission | Rugosité |
 * | --- | --- | --- | --- |
 * | Résine | 0 | 0 | **0,55** — mate, sous un vernis net |
 * | Verre | 0 | **0,92** | 0,02 |
 * | Métal | **1** | 0 | **0,14** — reflets nets |
 *
 * *Deux matériaux qui ne diffèrent que par une décimale de rugosité sont le même
 * matériau* — c'est la leçon des trois feux de Light-OS, transposée.
 */
export const AXES_QUI_SEPARENT = ['metalness', 'transmission', 'roughness'] as const;

/**
 * La couleur d'un dé d'après ce qu'il raconte.
 *
 * ⚠️ **Cette table est une reprise fidèle de l'ancien rendu**, et elle ne doit pas
 * bouger avec le style : *c'est de l'information, pas de la décoration.* Un
 * joueur qui voit du vert doit savoir que c'est un critique, quelle que soit la
 * matière choisie par le meneur.
 */
export interface SignesDuDe {
    isCritMax?: boolean;
    isCritMin?: boolean;
    source?: string;
}

export const COULEURS_DU_DE = {
    critiqueHaut: 0x10b981,
    critiqueBas: 0xf43f5e,
    equipement: 0xfacc15,
    ordinaire: 0x06b6d4,
} as const;

export const couleurDuDe = (de: SignesDuDe): number => {
    if (de.isCritMax) return COULEURS_DU_DE.critiqueHaut;
    if (de.isCritMin) return COULEURS_DU_DE.critiqueBas;
    if (de.source === 'gear') return COULEURS_DU_DE.equipement;
    return COULEURS_DU_DE.ordinaire;
};

/**
 * La disposition de l'atlas de chiffres pour un dé de `n` faces.
 *
 * On cherche la grille la plus carrée possible : *une case large et plate
 * gaspillerait la résolution sur du vide, et le chiffre y serait plus petit.*
 */
export const grilleDeLAtlas = (nombreDeFaces: number): { colonnes: number; lignes: number } => {
    const colonnes = Math.ceil(Math.sqrt(nombreDeFaces));
    return { colonnes, lignes: Math.ceil(nombreDeFaces / colonnes) };
};

/**
 * Ce qui est écrit sur la face qui porte la valeur `v`.
 *
 * ⚠️ **Le d100 est un d10 qui compte par dizaines** — `00, 10, … 90` — et le zéro
 * d'un d10 s'écrit `0`, pas `10`. *Un d10 numéroté de 1 à 10 est un dé qu'aucun
 * joueur n'a jamais tenu.*
 */
export const inscriptionDeLaFace = (nombreDeFaces: number, valeur: number): string => {
    if (nombreDeFaces === 100) return valeur === 10 ? '00' : `${valeur * 10}`;
    if (nombreDeFaces === 10) return valeur === 10 ? '0' : `${valeur}`;
    return `${valeur}`;
};

/**
 * Les chiffres qu'on souligne pour lever une ambiguïté à la lecture.
 *
 * *Un 6 et un 9 posés sur une table sont le même dessin.* Les vrais dés règlent
 * ça par un point ou un trait ; on souligne.
 */
export const inscriptionAmbigue = (texte: string): boolean => texte === '6' || texte === '9';

/**
 * Les dés du catalogue, et le nombre de **faces** de leur solide.
 *
 * ⚠️ **Le d100 est un d10** : dix faces qui portent `00, 10, … 90`. Le confondre
 * avec un solide à cent faces, c'est ce qui donnait une *sphère* dans l'ancien
 * rendu — *et une sphère n'est pas un dé.*
 */
export const FACES_DU_SOLIDE: Record<number, number> = {
    4: 4, 6: 6, 8: 8, 10: 10, 12: 12, 20: 20, 100: 10,
};

/**
 * La hauteur du chiffre, en fraction de sa case d'atlas.
 *
 * ⚠️ **Ce n'est pas un goût, c'est de la place.** Les sommets d'une face touchent
 * le bord de sa case ; le chiffre doit tenir dans le cercle **inscrit** du
 * polygone. Sur un triangle — d4, d8, d20 — ce cercle est bien plus petit que sur
 * un pentagone. *Un chiffre réglé à l'œil sur un d6 déborde des arêtes d'un d20.*
 */
export const TAILLE_DU_CHIFFRE: Record<number, number> = {
    4: 0.26, 6: 0.46, 8: 0.26, 10: 0.34, 12: 0.40, 20: 0.22, 100: 0.26,
};
