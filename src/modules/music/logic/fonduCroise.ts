/**
 * **Le fondu croisé — la partie qui décide, isolée de Web Audio.**
 *
 * `MusicEngine` construit un `AudioContext` dès l'import : rien de ce qu'il
 * contient n'est éprouvable. Ce module tient les arbitrages, il est pur, et
 * c'est le même geste que `ragSelection` extrait de `RAGEngine`.
 *
 * ## Le défaut de fond, signalé par David le 2026-08-30
 *
 * Le fondu était **linéaire** : `gainA = 1 - v`, `gainB = v`. À mi-parcours les
 * deux platines valent 0,5 — et deux sources sans rapport ne s'additionnent pas
 * en amplitude mais **en puissance**. La puissance totale y tombe donc à
 * 0,5² + 0,5² = 0,5, soit **−3 dB : un creux audible au milieu de chaque
 * transition.** C'est le défaut classique du fondu croisé, et c'est ce qu'on
 * entend quand « les fondus ne fonctionnent pas bien ».
 *
 * La correction tient en une identité : `cos²θ + sin²θ = 1`. En prenant
 * `gainA = cos(vπ/2)` et `gainB = sin(vπ/2)`, la puissance vaut **exactement 1
 * en tout point du trajet** — le volume perçu ne bouge plus.
 */

/** Une position de crossfader : 0 = platine A seule, 1 = platine B seule. */
export type Position = number;

export interface GainsDesPlatines {
    a: number;
    b: number;
}

/**
 * Les gains des deux platines pour une position donnée, **à puissance égale**.
 *
 * C'est la seule conversion position → gains du module : la garder unique évite
 * qu'un mouvement manuel et un fondu automatique tracent deux courbes
 * différentes, ce qui s'entendrait au moment où l'un prend la suite de l'autre.
 */
export function gainsALaPosition(v: Position): GainsDesPlatines {
    const borne = Math.min(1, Math.max(0, v));
    return {
        a: Math.cos(borne * Math.PI / 2),
        b: Math.sin(borne * Math.PI / 2),
    };
}

/**
 * Les deux courbes à donner à `setValueCurveAtTime`, de `depart` vers `cible`.
 *
 * On échantillonne la **position**, puis on convertit chaque point par
 * `gainsALaPosition` : le trajet reste à puissance égale sur toute sa longueur,
 * et un fondu déclenché depuis une position intermédiaire — le crossfader laissé
 * à la main quelque part — repart d'où il est au lieu de sauter.
 *
 * `points` gouverne la finesse ; 128 suffit largement pour six secondes, et
 * Web Audio interpole linéairement entre deux points.
 */
export function courbeDuFonduCroise(
    depart: Position,
    cible: Position,
    points = 128,
): { a: Float32Array; b: Float32Array } {
    const n = Math.max(2, Math.floor(points));
    const a = new Float32Array(n);
    const b = new Float32Array(n);

    for (let i = 0; i < n; i++) {
        const v = depart + (cible - depart) * (i / (n - 1));
        const gains = gainsALaPosition(v);
        a[i] = gains.a;
        b[i] = gains.b;
    }
    return { a, b };
}

/** Un fondu en cours : d'où il part, où il va, quand il a commencé, sa durée. */
export interface FonduEnCours {
    depart: Position;
    cible: Position;
    debutSec: number;
    dureeSec: number;
}

/**
 * Où en est le crossfader **à cet instant de l'horloge audio**.
 *
 * ⚠ **C'était la deuxième vérité du mécanisme, et elle mentait.** L'ancien code
 * posait `crossfaderValue = 0 ou 1` dès le déclenchement — donc *avant* que le
 * son ait bougé — pendant qu'une boucle `requestAnimationFrame` du composant
 * `Mixer` animait de son côté une valeur d'affichage. Trois horloges pour une
 * seule position : le son, le curseur, et le magasin.
 *
 * Ici la position **se calcule** à partir de l'horloge audio, celle qui fait
 * réellement le son. L'écran n'a plus qu'à la lire.
 */
export function positionDuFondu(fondu: FonduEnCours, maintenantSec: number): Position {
    if (fondu.dureeSec <= 0) return fondu.cible;
    const avancement = (maintenantSec - fondu.debutSec) / fondu.dureeSec;
    if (avancement <= 0) return fondu.depart;
    if (avancement >= 1) return fondu.cible;
    return fondu.depart + (fondu.cible - fondu.depart) * avancement;
}

export type Platine = 'A' | 'B';

/** L'autre platine. */
export function platineOpposee(p: Platine): Platine {
    return p === 'A' ? 'B' : 'A';
}

/**
 * Sur quelle platine charger le morceau suivant : **celle qu'on n'entend pas**.
 *
 * ⚠ L'ancienne règle consultait d'abord `autoFadeTarget`, un drapeau posé par le
 * magasin et effacé par un `useEffect` du `Mixer`. **Écran fermé, personne ne
 * l'effaçait** — et le drapeau périmé décidait alors de la platine, à l'envers.
 *
 * La position du crossfader suffit et ne peut pas se périmer : sous 0,5 c'est A
 * qu'on entend, donc B qui accueille. *Une donnée dérivable ne mérite pas un
 * drapeau qu'il faut penser à effacer.*
 */
export function platineDeDestination(position: Position): Platine {
    return position < 0.5 ? 'B' : 'A';
}

/** La position d'arrivée d'un fondu vers cette platine. */
export function positionDeLaPlatine(p: Platine): Position {
    return p === 'A' ? 0 : 1;
}
