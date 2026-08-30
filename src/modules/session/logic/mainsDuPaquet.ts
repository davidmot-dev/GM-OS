import type { CarteEnMain, DeckSessionState, FaceDeCarte } from '../../../types/deck.types';

/**
 * **Les cartes tenues en main — le quatrième tas.**
 *
 * Idée de David du 2026-08-23, garée faute de deux décisions, reprise et
 * tranchée le 2026-08-30 : les joueurs aussi peuvent garder une carte, chaque
 * carte gardée est face visible ou face cachée au choix, et **c'est le paquet
 * qui détient la vérité** — la fiche du personnage l'affiche sans la posséder.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * L'INVARIANT QUE TOUT CE FICHIER SERT À TENIR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Chaque carte est à un seul endroit.** Pioche, défausse, carte retournée,
 * main : quatre tas, aucune intersection, aucune carte perdue en route.
 *
 * C'est la seule chose qui casse vraiment dans un paquet, et elle casse **en
 * silence** : un paquet qui distribue deux fois la même carte reste plausible
 * pendant toute une séance, et un paquet qui en perd une ne se remarque qu'au
 * remélange, plusieurs semaines plus tard. Toutes les fonctions d'ici sont
 * pures, et `placesDesCartes` sait dire l'état de n'importe quelle situation.
 */

/** Le nom du tas où se trouve une carte. */
export type TasDuPaquet = 'pioche' | 'defausse' | 'retournee' | 'main';

const mains = (etat: DeckSessionState): CarteEnMain[] => etat.enMain ?? [];

/** Retire un index de partout — pioche, défausse, main, carte retournée. */
function retirerDePartout(etat: DeckSessionState, index: number): DeckSessionState {
    return {
        ...etat,
        remainingIndices: etat.remainingIndices.filter(i => i !== index),
        discardedIndices: etat.discardedIndices.filter(i => i !== index),
        currentCardIndex: etat.currentCardIndex === index ? null : etat.currentCardIndex,
        enMain: mains(etat).filter(c => c.index !== index),
    };
}

/**
 * **Où se trouve chaque carte** — la carte, puis le tas qui la contient.
 *
 * Quand une carte apparaît à deux endroits, elle est **comptée une fois par
 * endroit** dans `doublons`. C'est le rapport qu'un test lit, et c'est aussi ce
 * qu'un écran de diagnostic pourrait montrer le jour où un paquet se met à
 * mentir.
 */
export function placesDesCartes(etat: DeckSessionState): {
    places: Map<number, TasDuPaquet[]>;
    doublons: number[];
} {
    const places = new Map<number, TasDuPaquet[]>();

    const noter = (index: number, tas: TasDuPaquet) => {
        const deja = places.get(index) ?? [];
        deja.push(tas);
        places.set(index, deja);
    };

    etat.remainingIndices.forEach(i => noter(i, 'pioche'));
    etat.discardedIndices.forEach(i => noter(i, 'defausse'));
    if (etat.currentCardIndex !== null) noter(etat.currentCardIndex, 'retournee');
    mains(etat).forEach(c => noter(c.index, 'main'));

    const doublons = [...places.entries()]
        .filter(([, tas]) => tas.length > 1)
        .map(([index]) => index);

    return { places, doublons };
}

/**
 * La carte retournée passe en main.
 *
 * Rend l'état inchangé s'il n'y a rien de retourné : *garder ce qu'on n'a pas
 * tiré n'est pas une erreur à signaler, c'est un geste sans objet.*
 */
export function garderLaCarteRetournee(
    etat: DeckSessionState,
    porteur: string | null,
    face: FaceDeCarte = 'scellee',
): DeckSessionState {
    if (etat.currentCardIndex === null) return etat;

    const index = etat.currentCardIndex;
    const propre = retirerDePartout(etat, index);
    return { ...propre, enMain: [...mains(propre), { index, porteur, face }] };
}

/** Donne une carte tenue à quelqu'un d'autre — ou au meneur, avec `null`. */
export function changerLePorteur(
    etat: DeckSessionState,
    index: number,
    porteur: string | null,
): DeckSessionState {
    return { ...etat, enMain: mains(etat).map(c => (c.index === index ? { ...c, porteur } : c)) };
}

/** Retourne une carte tenue : face visible ↔ face cachée. */
export function retournerUneCarte(etat: DeckSessionState, index: number): DeckSessionState {
    return {
        ...etat,
        enMain: mains(etat).map(c =>
            c.index === index ? { ...c, face: c.face === 'revelee' ? 'scellee' : 'revelee' } : c),
    };
}

/**
 * La carte tenue est jouée : elle part en défausse.
 *
 * `avecDefausse` suit le manifeste du paquet — un paquet sans défausse remet
 * ses cartes dans la pioche, et il n'y a pas de raison qu'une carte tenue
 * échappe à cette règle.
 */
export function jouerUneCarteTenue(
    etat: DeckSessionState,
    index: number,
    avecDefausse: boolean,
): DeckSessionState {
    if (!mains(etat).some(c => c.index === index)) return etat;

    const propre = retirerDePartout(etat, index);
    return avecDefausse
        ? { ...propre, discardedIndices: [...propre.discardedIndices, index] }
        : { ...propre, remainingIndices: [...propre.remainingIndices, index] };
}

/** La carte tenue retourne dans la pioche. L'appelant remélange s'il le veut. */
export function rendreUneCarteAuPaquet(etat: DeckSessionState, index: number): DeckSessionState {
    if (!mains(etat).some(c => c.index === index)) return etat;

    const propre = retirerDePartout(etat, index);
    return { ...propre, remainingIndices: [...propre.remainingIndices, index] };
}

/**
 * Vide les mains et rend tout à la pioche — ce que fait un remélange.
 *
 * Rend aussi **le compte de ce qui a été repris**. `shuffleDeck` et `resetDeck`
 * reconstruisent l'état de zéro : sans ce compte, ils reprendraient les cartes
 * des joueurs sans un mot. *Une correction muette est une règle perdue* —
 * celle-ci se dit dans un toast.
 */
export function reprendreToutesLesMains(etat: DeckSessionState): {
    etat: DeckSessionState;
    reprises: number;
} {
    const tenues = mains(etat);
    if (tenues.length === 0) return { etat, reprises: 0 };

    return {
        etat: {
            ...etat,
            enMain: [],
            remainingIndices: [...etat.remainingIndices, ...tenues.map(c => c.index)],
        },
        reprises: tenues.length,
    };
}

/** Les cartes tenues par quelqu'un — `null` pour celles du meneur. */
export function mainDuPorteur(etat: DeckSessionState, porteur: string | null): CarteEnMain[] {
    return mains(etat).filter(c => c.porteur === porteur);
}

/** Tous ceux qui tiennent au moins une carte, meneur compris. */
export function porteursDeCartes(etat: DeckSessionState): (string | null)[] {
    return [...new Set(mains(etat).map(c => c.porteur))];
}

/**
 * **Ce personnage tient-il vraiment cette carte ?**
 *
 * Le contrôle qui compte dès qu'un joueur agit depuis sa tablette. Le
 * `characterId` d'un message vient du **client** : sans cette vérification, un
 * message fabriqué jouerait la carte du voisin, ou la lui prendrait.
 *
 * C'est précisément pour cela que le paquet détient la vérité — il est le seul
 * à pouvoir répondre. Un inventaire, lui, aurait dû croire l'expéditeur sur
 * parole.
 */
export function tientLaCarte(
    etat: DeckSessionState,
    index: number,
    porteur: string | null,
): boolean {
    return mains(etat).some(c => c.index === index && c.porteur === porteur);
}

/* ────────────────────────── Ce qui part vers la table ────────────────────── */

/**
 * Ce que les tablettes reçoivent d'une main : les cartes **révélées**, et le
 * simple compte de celles qui ne le sont pas.
 */
export interface MainDiffusee {
    porteur: string | null;
    /** Les indices des cartes face visible. */
    revelees: number[];
    /** Combien de cartes sont tenues face cachée. Leur identité ne sort pas. */
    scellees: number;
}

/**
 * **Les mains telles qu'on peut les diffuser — l'index d'une carte cachée ne
 * sort jamais.**
 *
 * La diffusion est **un seul message pour toutes les tablettes** : il n'existe
 * pas de version par destinataire. Envoyer l'index d'une carte face cachée en
 * comptant sur l'affichage pour la masquer la déposerait sur l'appareil de
 * chaque joueur, lisible par quiconque ouvre les outils du navigateur. *Un
 * secret caviardé à l'affichage n'est pas un secret, c'est un secret affiché
 * plus tard.*
 *
 * Conséquence assumée, et elle est réelle : **un joueur ne voit pas sa propre
 * carte cachée** sur sa tablette. Le meneur, lui, voit tout sur son écran, et
 * la retourne quand il veut qu'elle paraisse. Montrer à un seul joueur ce que
 * les autres ignorent demanderait un message par destinataire — ce que le
 * transport ne fait pas aujourd'hui.
 */
export function mainsPourLaTable(etat: DeckSessionState): MainDiffusee[] {
    return porteursDeCartes(etat).map(porteur => {
        const tenues = mainDuPorteur(etat, porteur);
        return {
            porteur,
            revelees: tenues.filter(c => c.face === 'revelee').map(c => c.index),
            scellees: tenues.filter(c => c.face === 'scellee').length,
        };
    });
}
