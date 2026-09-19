/**
 * **Un effet fabriqué par le meneur — de la DONNÉE, là où les quarante-huit
 * sont du CODE.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE N'EST PAS UNE VARIANTE DE PLUS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `varianteDEffet.ts` sait **décliner** : « la torche, mais bleue et plus
 * lente ». Elle emprunte le corps d'un des quarante-huit et ne change que ce
 * qui se pose après — la teinte et le rythme.
 *
 * ⛔ **Elle ne sait donc pas inventer un geste.** Un orage lointain — deux
 * éclairs blancs rapprochés, puis vingt secondes de bleu sombre — n'est la
 * déclinaison d'aucun effet existant : c'est une **suite**, et aucune des
 * quarante-huit n'a cette forme-là.
 *
 * Demandé par David le 2026-09-20 : *un atelier d'effets à part entière, créer
 * un effet de zéro plutôt que copier un des 48*.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ CE QU'UN EFFET EST, RÉDUIT À CE QUE LE PONT SAIT FAIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une lampe Hue ne sait qu'une chose : *va à cette couleur et à cette
 * brillance, en tant de dixièmes de seconde.* Tout le catalogue n'est que des
 * façons d'enchaîner cet ordre-là.
 *
 * Un effet d'atelier est donc **une suite d'étapes jouées en boucle**, chacune
 * portant les quatre seules choses qui existent vraiment : une couleur, une
 * brillance, un temps pour y aller (le **fondu**), un temps pour y rester (la
 * **durée**).
 *
 * ⭐ *Ce qui sépare une bougie d'un gyrophare tient entièrement dans ces quatre
 * nombres, répétés.* Le reste — les trois feux, la canopée, la rafale — est du
 * hasard **par-dessus** la suite, et c'est le rôle de l'aléa.
 */

/**
 * **Le plancher d'une étape, en millisecondes.**
 *
 * ⛔ Il recopie `CADENCE_PLANCHER_MS` du moteur, et `effetDAtelier.test.ts`
 * relit le moteur pour exiger l'accord — *une seconde déclaration de la même
 * vérité dérive toujours.* On le recopie parce que la logique ne doit pas
 * importer le moteur : le moteur importe la logique, et l'inverse fermerait un
 * cycle.
 *
 * Il n'est pas là pour l'esthétique : le pont tient une dizaine de commandes
 * par seconde, **toutes lampes confondues**.
 */
export const DUREE_MINIMALE_MS = 100;

/** Une étape ne dure pas plus d'une minute : au-delà ce n'est plus un effet. */
export const DUREE_MAXIMALE_MS = 60000;

/** Ce qu'on ne peut pas demander à une lampe allumée : ne rien émettre. */
export const BRILLANCE_MINIMALE = 1;
export const BRILLANCE_MAXIMALE = 254;

/** Une étape de la suite : où la lampe va, comment, et pour combien de temps. */
export interface EtapeDEffet {
    /** La couleur visée, en hexadécimal. */
    couleur: string;
    /** La brillance visée, en **pourcentage** — le meneur ne parle pas en 0-254. */
    brillance: number;
    /** Le temps passé sur cette étape, fondu compris, en millisecondes. */
    duree: number;
    /** Le temps mis pour y arriver, en millisecondes. Zéro = d'un coup. */
    fondu: number;
}

/** Un effet du meneur, joué en boucle tant que la lampe le porte. */
export interface EffetDAtelier {
    id: string;
    /** Le nom qu'il donne — c'est lui qui s'affiche partout. */
    nom: string;
    /** La suite, dans l'ordre. Une seule étape est licite : une couleur tenue. */
    etapes: EtapeDEffet[];
    /**
     * **Le désordre, de 0 à 100.** Il tire au sort, à chaque passage, un écart
     * sur la brillance et sur la durée de l'étape.
     *
     * ⭐ *C'est lui qui fait la différence entre une suite et un geste.* Une
     * bougie sans aléa est un métronome ; le même cycle à 30 % de désordre
     * devient une flamme. Les quarante-huit effets du catalogue tirent tous au
     * sort quelque part — aucun n'est une boucle pure.
     */
    alea: number;
}

/** L'ordre à envoyer au pont pour un passage donné. */
export interface ImageDUneEtape {
    /** La couleur de l'étape, telle qu'elle est écrite — le moteur la convertit. */
    couleur: string;
    /** La brillance **nominale**, en 1-254, aléa compris. Zéro = éteindre. */
    bri: number;
    /** Le fondu, en dixièmes de seconde — l'unité du pont Hue. */
    transitiontime: number;
    /** L'attente avant le passage suivant, en millisecondes. */
    interval: number;
}

/** Ramène une valeur entre deux bornes. */
const borner = (valeur: number, bas: number, haut: number): number =>
    Math.min(haut, Math.max(bas, valeur));

/** Un nombre, ou zéro : `NaN` et `undefined` ne doivent pas voyager plus loin. */
const nombre = (valeur: unknown): number => {
    const n = Number(valeur);
    return Number.isFinite(n) ? n : 0;
};

/**
 * **L'étape remise dans ses bornes.**
 *
 * ⚠️ Appliquée à l'**écriture** comme à la **lecture** : un effet rangé avant
 * qu'une borne existe ne doit pas pouvoir emballer le pont en revenant d'une
 * sauvegarde. *Une donnée qu'on n'a pas écrite aujourd'hui se relit comme une
 * donnée étrangère.*
 *
 * ⛔ **Le fondu est ramené à la durée.** Demander un fondu de trois secondes sur
 * une étape qui en dure une, c'est demander une couleur que la lampe
 * n'atteindra jamais : l'étape suivante la détourne en chemin. *Un réglage qui
 * ne peut pas se produire doit être corrigé, pas obéi à moitié.*
 */
export function etapeBornee(etape: Partial<EtapeDEffet> | null | undefined): EtapeDEffet {
    const duree = borner(nombre(etape?.duree) || DUREE_MINIMALE_MS, DUREE_MINIMALE_MS, DUREE_MAXIMALE_MS);
    return {
        couleur: typeof etape?.couleur === 'string' && /^#[0-9a-fA-F]{6}$/.test(etape.couleur)
            ? etape.couleur
            : '#ffffff',
        brillance: borner(nombre(etape?.brillance), 0, 100),
        duree,
        fondu: borner(nombre(etape?.fondu), 0, duree),
    };
}

/** L'effet entier remis dans ses bornes, étapes comprises. */
export function effetBorne(effet: EffetDAtelier): EffetDAtelier {
    return {
        ...effet,
        etapes: (effet.etapes ?? []).map(etapeBornee),
        alea: borner(nombre(effet.alea), 0, 100),
    };
}

/**
 * **L'image d'un passage : ce qu'on envoie à la lampe, et quand on revient.**
 *
 * `tick` est le numéro du passage depuis le début — le moteur le tient déjà
 * pour tous les autres effets. `hasard` est injecté pour que les essais
 * puissent le tenir : *un effet dont le désordre n'est pas testable n'est testé
 * qu'à moitié.*
 */
export function imageDeLEtape(
    effet: EffetDAtelier,
    tick: number,
    hasard: () => number = Math.random,
): ImageDUneEtape | null {
    const etapes = (effet.etapes ?? []).map(etapeBornee);
    if (etapes.length === 0) return null;

    const etape = etapes[Math.abs(Math.floor(tick)) % etapes.length];
    const alea = borner(nombre(effet.alea), 0, 100) / 100;

    /** Un écart centré : de -alea à +alea, tiré à chaque passage. */
    const ecart = () => 1 + (hasard() * 2 - 1) * alea;

    const briVoulue = (etape.brillance / 100) * BRILLANCE_MAXIMALE * ecart();

    return {
        couleur: etape.couleur,
        /* ⚠️ Une étape à 0 % reste à 0 % : l'aléa ne rallume pas ce que le
           meneur a voulu éteindre. Le moteur traduit ce zéro en extinction. */
        bri: etape.brillance === 0
            ? 0
            : Math.round(borner(briVoulue, BRILLANCE_MINIMALE, BRILLANCE_MAXIMALE)),
        transitiontime: Math.round(etape.fondu / 100),
        interval: Math.round(borner(etape.duree * ecart(), DUREE_MINIMALE_MS, DUREE_MAXIMALE_MS)),
    };
}

/**
 * **La cadence nominale de l'effet : son étape la plus courte.**
 *
 * C'est ce que le moteur donne à `cadencePartagee` pour tenir le budget du
 * pont. ⚠️ *On prend la plus courte et non la moyenne* : c'est le pic qui
 * sature le pont, et un effet dont une étape sur dix bat à 100 ms le sature un
 * dixième du temps — assez pour prendre un retard qu'il ne rattrape pas.
 */
export function cadenceNominale(effet: EffetDAtelier): number {
    const etapes = (effet.etapes ?? []).map(etapeBornee);
    if (etapes.length === 0) return DUREE_MINIMALE_MS;
    return Math.min(...etapes.map(e => e.duree));
}

/** L'identifiant d'effet que porte une lampe qui joue un effet d'atelier. */
export const PREFIXE_ATELIER = 'atelier:';

export const estUnEffetDAtelier = (effet: string | undefined | null): boolean =>
    typeof effet === 'string' && effet.startsWith(PREFIXE_ATELIER);

export const identifiantDAtelier = (id: string): string => `${PREFIXE_ATELIER}${id}`;

export const idDepuisLAtelier = (effet: string): string => effet.slice(PREFIXE_ATELIER.length);

/**
 * **Un nom libre.** Deux effets homonymes dans la liste sont deux effets qu'on
 * ne sait plus distinguer — et l'un des deux sera posé par erreur.
 */
export function nomLibre(base: string, nomsPris: readonly string[]): string {
    if (!nomsPris.includes(base)) return base;
    for (let n = 2; n < 100; n++) {
        const essai = `${base} ${n}`;
        if (!nomsPris.includes(essai)) return essai;
    }
    return `${base} ${Date.now()}`;
}

/**
 * **L'effet qu'on obtient en cliquant « Créer ».**
 *
 * ⚠️ **Deux étapes, pas une.** Un effet d'une seule étape est une couleur fixe :
 * l'atelier s'ouvrirait sur quelque chose qui ne bouge pas, et ne montrerait
 * pas ce qu'il sait faire. *Un écran vide n'enseigne rien ; un exemple minimal,
 * si.*
 */
export function effetNeuf(id: string, nom: string): EffetDAtelier {
    return {
        id,
        nom,
        etapes: [
            { couleur: '#ffb46b', brillance: 70, duree: 1200, fondu: 800 },
            { couleur: '#ff7a2f', brillance: 35, duree: 900, fondu: 600 },
        ],
        alea: 25,
    };
}
