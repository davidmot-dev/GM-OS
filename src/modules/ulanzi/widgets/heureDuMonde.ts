import { nomPourLaMatrice } from './compteARebours';

/**
 * **L'heure du monde — date et heure qui défilent.**
 *
 * *Demandé par David le 2026-08-30 :* **« est-ce qu'on pourrait afficher
 * l'horloge — temps réel, statique ou fantastique — tu fais défiler
 * horizontalement »**, puis, après que j'aie proposé de garder l'heure fixe et
 * de ne faire défiler que la date : **« l'heure ne suffit pas, alors fais
 * défiler la date et l'heure »**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE WIDGET DÉROGE AU § 1 DU PLAN, ET C'EST UNE DÉCISION DE DAVID
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le § 1 dit : *« des nombres, des barres, des icônes — jamais de phrases ; un
 * texte qui défile n'est pas consultable d'un coup d'œil. »* C'est la règle qui
 * a décidé de tout le reste, et tous les autres widgets la respectent
 * (`noScroll: true`).
 *
 * Celui-ci **défile**, sciemment. La raison est réelle : `HH:MM` seul tient sur
 * la matrice, mais une date fantastique — `LUNDI 15 SARPEDON 8241` — ne tiendra
 * jamais, et c'est justement l'information qu'aucun autre écran de la table ne
 * porte. *Ne pas confondre une règle avec une loi : celle-ci protège la lecture
 * d'un coup d'œil, et le meneur a jugé que la date valait ce prix.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE PIÈGE DU MODE TEMPS RÉEL
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **En temps réel, le `timestamp` du magasin n'avance pas.** `ClockVisualizer`
 * tient sa propre horloge locale et n'écrit rien dans le magasin — le timestamp
 * persisté y est celui de la dernière pose manuelle. Lire le magasin en mode
 * `realtime` afficherait donc une heure figée, plausible, et fausse.
 *
 * D'où `maintenant` en paramètre : l'appelant fournit l'heure système, et ce
 * fichier reste pur.
 */

/** Ce que l'afficheur doit connaître du temps de Clock-OS. */
export interface TempsAAfficher {
    mode: 'realtime' | 'static' | 'timer' | 'fantasy';
    /** Le point dans le temps du magasin. Ignoré en mode temps réel. */
    timestamp: number;
    /** La date fantastique déjà calculée, ou `null` hors de ce mode. */
    dateFantastique?: {
        jour: number;
        mois: string;
        annee: number;
        heure: number;
        minute: number;
        jourDeLaSemaine?: string;
        /** Un mois intercalaire n'a pas de quantième. */
        intercalaire?: boolean;
    } | null;
}

export interface CompositionDeLHeure {
    text: string;
    color: string;
    center: true;
    /** Pourcentage de la vitesse de défilement d'origine. */
    scrollSpeed: number;
    /** Absent : **le texte défile**, et c'est le seul widget dans ce cas. */
    draw?: never;
}

/**
 * **La vitesse de défilement, en pourcentage de celle de l'appareil.**
 *
 * *Demandé par David le 2026-08-31, après l'avoir vu tourner : « diminue la
 * vitesse de défilement de l'horloge ».* La valeur d'usine (`SSPEED: 100` dans
 * les réglages de l'appareil) fait passer une date fantastique trop vite pour
 * qu'on la lise en levant les yeux une seconde.
 *
 * ⚠️ **Le sens de ce réglage n'a pas été mesuré sur l'appareil.** AWTRIX le
 * documente comme *« un pourcentage de la vitesse d'origine »*, ce qui se lit
 * naturellement comme « 50 % = deux fois plus lent » — mais la même formulation
 * couvrirait un multiplicateur de délai, où 50 % irait plus vite. *Un réglage
 * dont on n'a pas vérifié le sens ressemble à un réglage qui marche.* Une seule
 * ligne à changer si l'objet dit le contraire.
 */
export const VITESSE_DE_DEFILEMENT = 50;

/** Une couleur froide, pour ne pas se confondre avec un compteur qui alerte. */
export const COULEUR_DE_L_HEURE = '#8AB4F8';

const deuxChiffres = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

/** `HH:MM`, toujours cinq caractères. */
export function heureEnTexte(heures: number, minutes: number): string {
    return `${deuxChiffres(heures % 24)}:${deuxChiffres(minutes % 60)}`;
}

/**
 * La date et l'heure, dans l'ordre où on les lit.
 *
 * **Sans accents et en majuscules**, comme tout ce qui part vers la matrice :
 * l'appareil force les majuscules et rien ne garantit que sa fonte porte un
 * « É » — un caractère absent se dessine en case vide, et on ne le verrait qu'à
 * la table.
 *
 * `maximum` est volontairement large : ce texte est **fait pour défiler**, il
 * n'a donc pas à tenir dans les sept caractères de la matrice.
 */
export function texteDuTemps(temps: TempsAAfficher, maintenant: number): string {
    if (temps.mode === 'fantasy' && temps.dateFantastique) {
        const d = temps.dateFantastique;
        const quantieme = d.intercalaire ? `${d.mois} ${d.annee}` : `${d.jour} ${d.mois} ${d.annee}`;
        const avecJour = d.jourDeLaSemaine ? `${d.jourDeLaSemaine} ${quantieme}` : quantieme;
        return nomPourLaMatrice(`${avecJour} ${heureEnTexte(d.heure, d.minute)}`, 64);
    }

    /*
      **Le magasin ne fait pas foi en temps réel.** Son `timestamp` est celui de
      la dernière pose manuelle ; l'horloge vivante est locale à l'écran. On
      prend donc l'heure système ici, et le timestamp dans les autres modes.
    */
    const quand = new Date(temps.mode === 'realtime' ? maintenant : temps.timestamp);
    const jour = quand.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    return nomPourLaMatrice(`${jour} ${heureEnTexte(quand.getHours(), quand.getMinutes())}`, 64);
}

/**
 * Le temps, traduit en ce que l'afficheur doit montrer.
 *
 * **`noScroll` est absent, et c'est tout l'objet de ce widget.** Son absence est
 * ce qui autorise AWTRIX à faire défiler un texte plus long que la matrice.
 */
export function composerLHeure(temps: TempsAAfficher, maintenant: number): CompositionDeLHeure {
    return {
        text: texteDuTemps(temps, maintenant),
        color: COULEUR_DE_L_HEURE,
        center: true,
        scrollSpeed: VITESSE_DE_DEFILEMENT,
    };
}
