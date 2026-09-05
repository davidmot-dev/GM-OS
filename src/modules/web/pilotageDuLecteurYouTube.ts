import { useEffect, useRef } from 'react';

/**
 * **Piloter le volume d'une vidéo YouTube, depuis GM-OS.**
 *
 * Écrit le 2026-09-05, après avoir dit à David que c'était impossible. *Ça ne
 * l'était pas.* Ce qui reste hors de portée est l'**enceinte de sortie** — un
 * cadre distant ne se branche sur aucun contexte audio, et `setSinkId` n'a pas
 * de prise dessus. Le **niveau**, lui, se commande.
 *
 * ⛔ **On ne charge pas la bibliothèque de YouTube.** Le lecteur intégré accepte
 * des ordres par `postMessage` dès lors que l'adresse porte `enablejsapi=1` :
 * c'est la voie qu'emploient les greffons sérieux, et elle évite un script
 * distant de plus, une dépendance de plus, et un point de panne de plus.
 *
 * ⚠️ **C'est un envoi sans accusé de réception, et il faut le dire.** Le lecteur
 * ignore ce qui lui arrive avant d'être prêt, et **rien ne nous dit quand il
 * l'est** sans monter tout l'appareillage d'événements. On répète donc l'ordre
 * quelques fois après le chargement du cadre. *Un ordre répété quatre fois en
 * deux secondes coûte moins qu'une poignée de main qu'il faut maintenir.*
 */

/** L'origine du lecteur : on ne parle qu'à lui. */
const ORIGINE_DU_LECTEUR = 'https://www.youtube-nocookie.com';

/**
 * Les instants où l'on répète l'ordre après le chargement, en millisecondes.
 *
 * Le premier part tout de suite ; les suivants rattrapent un lecteur encore en
 * train de s'installer. Au-delà de deux secondes et demie, s'il n'écoute
 * toujours pas, c'est qu'il n'écoutera pas.
 */
export const RELANCES_MS = [0, 300, 900, 2500] as const;

/** Envoie un ordre au lecteur logé dans ce cadre. */
export function commandeAuLecteur(
    cadre: HTMLIFrameElement | null,
    fonction: string,
    args: unknown[] = [],
): void {
    const fenetre = cadre?.contentWindow;
    if (!fenetre) return;

    try {
        fenetre.postMessage(
            JSON.stringify({ event: 'command', func: fonction, args }),
            ORIGINE_DU_LECTEUR,
        );
    } catch {
        /*
          Un cadre détruit entre-temps, ou une origine qui ne correspond plus.
          Il n'y a rien à réparer et rien à dire : le niveau sera reposé au
          prochain changement.
        */
    }
}

/**
 * Pose un niveau sur le lecteur, une fois.
 *
 * ⚠️ **`setVolume` seul ne suffit pas.** Le lecteur garde un état « muet »
 * distinct du niveau : une vidéo démarrée en sourdine resterait silencieuse même
 * à cent. On lève donc la sourdine, ou on la pose, selon le niveau demandé.
 */
export function poserLeNiveau(cadre: HTMLIFrameElement | null, niveau: number): void {
    const borne = Math.min(1, Math.max(0, Number.isFinite(niveau) ? niveau : 1));

    if (borne === 0) {
        commandeAuLecteur(cadre, 'mute');
        return;
    }

    commandeAuLecteur(cadre, 'unMute');
    commandeAuLecteur(cadre, 'setVolume', [Math.round(borne * 100)]);
}

/**
 * Tient le lecteur de ce cadre au niveau voulu, tant qu'il est monté.
 *
 * `actif` vaut faux là où le son n'est pas permis — les tablettes des joueurs.
 * On y pose alors la sourdine, plutôt que de ne rien faire : *ne rien dire à un
 * lecteur qui démarre à plein volume revient à autoriser le bruit.*
 */
export function useNiveauDuLecteurYouTube(
    cadre: React.RefObject<HTMLIFrameElement | null>,
    niveau: number,
    actif: boolean,
): void {
    /* Le niveau lu au moment de la relance, et non celui figé à sa création. */
    const dernier = useRef(niveau);
    dernier.current = niveau;

    useEffect(() => {
        const voulu = () => (actif ? dernier.current : 0);

        // Un ordre tout de suite pour le lecteur déjà prêt…
        poserLeNiveau(cadre.current, voulu());

        // …et quelques rattrapages pour celui qui s'installe encore.
        const minuteries = RELANCES_MS.filter((d) => d > 0).map((delai) =>
            setTimeout(() => poserLeNiveau(cadre.current, voulu()), delai),
        );

        return () => { minuteries.forEach(clearTimeout); };
    }, [cadre, niveau, actif]);
}
