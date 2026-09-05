/**
 * Le défilé des quarts — le premier widget de l'afficheur Ulanzi.
 *
 * **Ce qu'il montre**, et rien d'autre : où en est la journée d'enquête de
 * *Blade Runner*, et combien de Quarts ont été enchaînés sans pause.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE, TIRÉE DU CORPUS VÉRIFIÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `docs/systems/blade-runner/rules/structure-temporelle-par-quarts-et-pauses.md`
 * et `jauges-et-ressources-individuelles.md` :
 *
 * - La journée compte **quatre Quarts** — matin, journée, soirée, nuit — de 5 à
 *   10 heures chacun. Un personnage visite **un seul lieu par Quart**.
 * - **Le seuil est à trois.** Au-delà de 3 Quarts d'affilée sans pause, chaque
 *   Quart supplémentaire coûte **1 point de stress**. *(La spécialité « Bourreau
 *   de travail » repousse ce seuil à 4 — voir `SEUIL_SANS_PAUSE`.)*
 * - **Une pause consomme elle-même un Quart** : « Pause d'un Quart ». Elle fait
 *   donc avancer la journée en même temps qu'elle remet le compteur à zéro.
 *   *C'est le détail qu'on aurait raté en codant de mémoire.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER NE PARLE À PERSONNE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il ne connaît ni le réseau, ni l'appareil, ni React. Il transforme un état en
 * commandes de dessin, et c'est tout. **Un jet faux ne se voit jamais en
 * séance** — la leçon du pupitre de dés vaut ici : la seule façon de savoir que
 * l'afficheur dit vrai est de pouvoir l'éprouver sans lui.
 */

/** Les quatre Quarts d'une journée, dans l'ordre où ils se succèdent. */
export const QUARTS = ['matin', 'journee', 'soiree', 'nuit'] as const;
export type Quart = (typeof QUARTS)[number];

/**
 * Le seuil du livre : au-delà, chaque Quart coûte un point de stress.
 *
 * Paramétrable parce que « Bourreau de travail » le repousse à 4. Le widget
 * n'a pas à savoir qui possède la spécialité — il affiche le seuil qu'on lui
 * donne.
 */
export const SEUIL_SANS_PAUSE = 3;

/** Ce que l'afficheur doit connaître de la journée. */
export interface EtatDesQuarts {
    /** Index dans `QUARTS` : 0 = matin, 3 = nuit. */
    quartDuJour: number;
    /** Quarts enchaînés sans pause. Vaut 0 juste après une pause. */
    consecutifs: number;
    /**
     * **Le jour d'enquête, à partir de 1.**
     *
     * Demandé par David le 2026-09-05. Le défilé disait déjà *où* on en est dans
     * la journée et **repassait au matin après la nuit** — mais rien ne disait
     * **quelle** journée. Or une enquête de *Blade Runner* dure plusieurs jours,
     * et le nombre de jours écoulés est un fait de partie qu'on annonce à la
     * table.
     *
     * ⚠️ **Facultatif à la lecture.** Un état enregistré avant ce champ n'en a
     * pas : `jourDe()` le lit comme le premier jour, plutôt que d'afficher
     * « JOUR NaN » sur l'afficheur. *Une valeur absente doit se lire comme un
     * début, jamais comme une erreur.*
     */
    jour?: number;
}

export const ETAT_INITIAL: EtatDesQuarts = { quartDuJour: 0, consecutifs: 0, jour: 1 };

/** Le jour d'un état, en traitant l'absence comme le premier. */
export function jourDe(etat: EtatDesQuarts): number {
    return etat.jour && etat.jour > 0 ? etat.jour : 1;
}

/**
 * Le jour suivant, **quand et seulement quand la nuit se referme**.
 *
 * C'est le passage de `nuit` à `matin` qui fait le jour, et non un compteur de
 * quatre : *une pause prise en pleine nuit fait aussi lever le soleil*, puisque
 * elle consomme un Quart comme les autres.
 */
function jourApres(etat: EtatDesQuarts, quartSuivantIndex: number): number {
    const aBoucle = quartSuivantIndex === 0;
    return jourDe(etat) + (aBoucle ? 1 : 0);
}

/**
 * Un Quart de travail de plus.
 *
 * La journée avance d'un cran — et **repasse au matin après la nuit**, parce
 * qu'une enquête dure plusieurs jours.
 */
export function quartSuivant(etat: EtatDesQuarts): EtatDesQuarts {
    const quartDuJour = (etat.quartDuJour + 1) % QUARTS.length;
    return {
        quartDuJour,
        consecutifs: etat.consecutifs + 1,
        jour: jourApres(etat, quartDuJour),
    };
}

/**
 * Une pause.
 *
 * **Elle consomme un Quart elle aussi** : le livre dit « Pause d'un Quart ». La
 * journée avance donc, et le compteur d'enchaînement retombe à zéro.
 */
export function pause(etat: EtatDesQuarts): EtatDesQuarts {
    const quartDuJour = (etat.quartDuJour + 1) % QUARTS.length;
    return {
        quartDuJour,
        consecutifs: 0,
        /* La pause consomme un Quart : elle fait donc lever le jour comme le
           reste, si c'est elle qui referme la nuit. */
        jour: jourApres(etat, quartDuJour),
    };
}

/**
 * Le stress que coûte le Quart en cours, en points.
 *
 * Zéro tant qu'on est dans les trois premiers. Un par Quart au-delà.
 */
export function stressDuQuart(etat: EtatDesQuarts, seuil = SEUIL_SANS_PAUSE): number {
    return etat.consecutifs > seuil ? 1 : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Le dessin
// ─────────────────────────────────────────────────────────────────────────────

/** Un rectangle plein, au format que comprend AWTRIX : `[x, y, l, h, couleur]`. */
export interface RectanglePlein {
    df: [number, number, number, number, string];
}

/** La matrice de l'Ulanzi TC001. */
export const LARGEUR = 32;
export const HAUTEUR = 8;

/**
 * Combien de pastilles d'enchaînement tiennent sur la largeur.
 *
 * Six de quatre pixels avec un interstice : 6 × 5 = 30, il reste deux pixels.
 * Au-delà de six Quarts enchaînés, on ne peut plus compter — mais à ce stade le
 * message n'est plus « combien », il est « beaucoup trop », et le rouge le dit.
 */
export const PASTILLES = 6;

/** Les couleurs, nommées pour qu'un test puisse parler d'elles. */
export const COULEURS = {
    /** Le moment du jour, du plus chaud au plus froid. */
    moment: ['#FF8C1A', '#FFC94A', '#E8622A', '#3A6EA5'] as const,
    /** Un Quart déjà passé : la même teinte, en sourdine. */
    passe: '#4A3208',
    /** Un Quart à venir : presque éteint, mais présent. */
    aVenir: '#1A1206',
    /** Sous le seuil : on peut encore enchaîner. */
    sous: '#00C853',
    /** Au-delà du seuil : chaque Quart coûte un point de stress. */
    au_dela: '#FF1744',
    /** Une pastille non atteinte. */
    vide: '#141414',
} as const;

/**
 * Le nom du Quart, tel qu'il part vers l'afficheur.
 *
 * **Sans accents, et c'est délibéré.** L'appareil force déjà les majuscules
 * (`UPPERCASE: true` dans ses réglages) et rien ne garantit que sa fonte porte
 * un « É ». Un caractère absent se dessine en case vide ou en glyphe de
 * remplacement — et on ne le verrait qu'à la table. L'écran de GM-OS, lui,
 * affiche les accents : c'est `LIBELLES` qui les porte, côté application.
 */
export const NOMS_POUR_LA_MATRICE: Record<Quart, string> = {
    matin: 'MATIN',
    journee: 'JOURNEE',
    soiree: 'SOIREE',
    nuit: 'NUIT',
};

/**
 * La barre des Quarts consécutifs — **tout ce qui reste du dessin.**
 *
 * David, le 2026-08-23 : *« à la place des blocs verts, tu peux écrire Matin,
 * Journée, Soirée et Nuit sur la largeur de l'écran ? »* Le nom prend donc la
 * place, et les six pastilles se réduisent à **deux pixels de haut** tout en bas.
 *
 * *On ne supprime pas l'information, on la range.* Le compte d'enchaînement est
 * la seule chose que le livre sanctionne : le faire disparaître aurait rendu
 * l'afficheur joli et muet sur la règle.
 */
export function dessinerDefile(
    etat: EtatDesQuarts,
    seuil = SEUIL_SANS_PAUSE,
): RectanglePlein[] {
    const commandes: RectanglePlein[] = [];
    const largeur = 4;
    const pas = 5; // 6 × 5 = 30, il reste deux pixels sur les trente-deux

    for (let n = 0; n < PASTILLES; n++) {
        const rang = n + 1;
        let couleur: string;
        if (rang > etat.consecutifs) couleur = COULEURS.vide;
        else if (rang > seuil) couleur = COULEURS.au_dela;
        else couleur = COULEURS.sous;
        commandes.push({ df: [n * pas, HAUTEUR - 2, largeur, 2, couleur] });
    }

    return commandes;
}

/** Ce qu'une application personnalisée d'AWTRIX attend pour ce widget. */
export interface CompositionDuDefile {
    text: string;
    color: string;
    center: true;
    /** Pas de défilement : *un texte qui défile n'est pas consultable d'un coup d'œil.* */
    noScroll: true;
    draw: RectanglePlein[];
}

/**
 * L'état, traduit en ce que l'afficheur doit montrer.
 *
 * **Le nom du moment en toutes lettres**, centré sur les trente-deux pixels et
 * coloré selon l'heure — chaud le matin, froid la nuit. Et sous lui, la barre
 * des Quarts enchaînés : *le passage au rouge reste tout le message.*
 */
export function composerDefile(
    etat: EtatDesQuarts,
    seuil = SEUIL_SANS_PAUSE,
): CompositionDuDefile {
    return {
        text: NOMS_POUR_LA_MATRICE[QUARTS[etat.quartDuJour]],
        color: COULEURS.moment[etat.quartDuJour],
        center: true,
        noScroll: true,
        draw: dessinerDefile(etat, seuil),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE COMPTEUR DE JOUR — une seconde application, 2026-09-05
// ─────────────────────────────────────────────────────────────────────────────

/**
 * **Pourquoi une application à part, et non une ligne de plus.**
 *
 * Demandé par David : *« en plus de faire progresser les Quarts, je voudrais un
 * compteur du jour — Jour 1, Jour 2… cela peut défiler de l'un à l'autre. »*
 *
 * Trente-deux pixels de large. « JOURNEE » en occupe déjà près de trente : y
 * ajouter « J3 » forcerait le texte à défiler, et *un texte qui défile n'est pas
 * consultable d'un coup d'œil* — c'est la règle que ce widget s'est donnée dès
 * le premier jour, et elle vaut toujours.
 *
 * ⭐ **L'afficheur fait déjà défiler ses applications tout seul.** Poser le jour
 * comme une seconde application, c'est obtenir l'alternance que David demande
 * **sans une seule requête de plus** : le TC001 tourne entre ses apps, on ne
 * pousse que quand l'état change. *La fonction existait dans l'appareil ; il
 * suffisait de s'en servir plutôt que de la refaire.*
 */

/** Le jour, tel qu'il part vers la matrice. Sans accent, comme les Quarts. */
export function texteDuJour(etat: EtatDesQuarts): string {
    return `JOUR ${jourDe(etat)}`;
}

/**
 * La couleur du compteur de jour.
 *
 * **Elle suit le moment**, exactement comme le nom du Quart : les deux
 * applications se succèdent à l'écran, et deux teintes différentes pour un même
 * instant se liraient comme deux informations sans rapport.
 */
export function couleurDuJour(etat: EtatDesQuarts): string {
    return COULEURS.moment[etat.quartDuJour];
}

/**
 * La barre du bas reprend **le rang du Quart dans la journée**, et non
 * l'enchaînement.
 *
 * Sur cette application-là, le compte d'enchaînement serait redondant — il est
 * déjà sur l'autre, deux secondes plus tôt. Ce qui manque ici, c'est *où l'on en
 * est dans ce jour-ci* : quatre segments, celui du moment allumé.
 */
export function dessinerLeJour(etat: EtatDesQuarts): RectanglePlein[] {
    const largeur = 7;
    const pas = 8; // 4 × 8 = 32, la largeur exacte
    return QUARTS.map((_, n) => ({
        df: [
            n * pas, HAUTEUR - 2, largeur, 2,
            n === etat.quartDuJour ? COULEURS.moment[n]
                : n < etat.quartDuJour ? COULEURS.passe
                    : COULEURS.aVenir,
        ] as [number, number, number, number, string],
    }));
}

/** L'état, traduit en ce que la seconde application doit montrer. */
export function composerLeJour(etat: EtatDesQuarts): CompositionDuDefile {
    return {
        text: texteDuJour(etat),
        color: couleurDuJour(etat),
        center: true,
        noScroll: true,
        draw: dessinerLeJour(etat),
    };
}
