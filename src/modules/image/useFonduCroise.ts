import { useEffect, useRef, useState } from 'react';

/**
 * **Deux images à l'écran le temps d'un fondu — l'ancienne dessous, la nouvelle
 * dessus, et aucune ne bouge avant d'être prête.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUI N'ALLAIT PAS — DEUX DÉFAUTS, DEUX JOURS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **1. Le passage par le noir (2026-09-13, au matin).** Le projecteur jouait un
 * fondu d'entrée et un fondu de sortie, mais d'une image à l'autre l'ancienne
 * était **démontée à l'instant même** où la nouvelle arrivait : la nouvelle
 * montait donc depuis le fond de l'écran. *Entre deux images il y avait un
 * passage par le noir, pas un fondu croisé.* Le Player Hub faisait pire, avec
 * `mode="wait"` : trois secondes d'écran noir.
 *
 * **2. ⛔ Le fondu s'animait sur du vide (2026-09-13, au soir).** David, après
 * essai : *« le mécanisme de fondu ne fonctionne pas bien »* — **un temps mort,
 * puis un saut**, et sur les deux écrans.
 *
 * La cause : l'adresse d'une image arrive **avant l'image**. `useMediaUrl` rend
 * un `data:` base64 sorti d'IndexedDB, et le navigateur doit encore le décoder —
 * de quelques dizaines à quelques centaines de millisecondes pour une grande
 * image. La couche entrante démarrait son animation d'opacité **à la seconde où
 * elle recevait l'adresse**, donc sur un cadre vide : on voyait l'ancienne image
 * immobile, puis la nouvelle apparaître d'un coup à mi-fondu.
 *
 * ⭐ **Le remède est de retarder le fondu, pas de l'allonger.** On décode
 * l'image d'abord ; le fondu ne commence que quand il a quelque chose à faire
 * apparaître. *Une transition qui démarre avant son sujet n'est pas une
 * transition trop courte, c'est une transition qui joue à vide.*
 *
 * ⚠️ **Ce que ça change pour la table** : une image lourde s'affiche un instant
 * plus tard qu'avant — mais elle s'affiche **en fondu**. Le temps mort existait
 * déjà ; il était simplement pris sur le fondu au lieu d'être pris avant.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ **Le minutage est partagé, le balisage non.** Le projecteur pose l'image
 * sur un flou d'elle-même, le Hub la couvre en fond : *c'est le comportement qui
 * se partage, pas le balisage* — la leçon inverse, deux copies d'un même fond
 * qui divergent, a coûté la vidéo du Player Hub le 2026-09-05.
 */
export interface FonduCroise {
    /**
     * L'image à montrer — **la dernière qui soit prête**, jamais une adresse
     * qu'on vient de recevoir. `null` quand il n'y a rien à montrer.
     */
    entrante: string | null;
    /**
     * Celle qu'elle recouvre, gardée montée le temps du fondu — puis `null`.
     *
     * ⚠️ Elle vaut `null` à la toute première image : il n'y a rien à croiser,
     * et poser un fond noir sous elle rendrait son arrivée plus sourde.
     */
    sortante: string | null;
}

/**
 * **Le fondu des surfaces côté joueurs — une seconde et demie.**
 *
 * Contre 700 ms au projecteur : c'est le langage du Player Hub depuis toujours,
 * et *l'écran de la table est un décor, pas un instrument.*
 *
 * ⭐ **Les tablettes suivent le Hub**, décision de David le 2026-09-14 : elles
 * reflètent l'écran de la table, donc même rythme, même lecture. La constante
 * vit ici et non dans un écran, *parce qu'une durée recopiée dans deux fichiers
 * finit par diverger le jour où l'un des deux se règle.*
 */
export const FONDU_COTE_JOUEURS_MS = 1500;

/** Ce qui décide qu'une image est **prête à être montrée**. */
export type ChargeurDImage = (url: string) => Promise<void>;

/**
 * **Le chargeur réel : télécharger *et* décoder.**
 *
 * ⛔ `onload` ne suffit pas : il se déclenche quand les octets sont là, pas
 * quand le navigateur a des pixels. `decode()` attend la seconde étape — c'est
 * elle qui coûte sur une image de plusieurs milliers de pixels.
 *
 * ⚠️ **Une image illisible résout quand même.** Un fichier corrompu ou effacé
 * ne doit pas figer l'écran sur l'image d'avant, pour toujours : *mieux vaut un
 * cadre vide qu'un écran qui n'obéit plus.*
 */
export const chargerLImage: ChargeurDImage = (url) => new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
        if (typeof image.decode !== 'function') { resolve(); return; }
        image.decode().then(() => resolve(), () => resolve());
    };
    image.onerror = () => resolve();
    image.src = url;
});

export function useFonduCroise(
    url: string | null | undefined,
    dureeMs: number,
    charger: ChargeurDImage = chargerLImage,
): FonduCroise {
    const [entrante, setEntrante] = useState<string | null>(null);
    const [sortante, setSortante] = useState<string | null>(null);

    /*
      L'image montrée est tenue **aussi** dans une référence : l'effet doit la
      lire sans figurer dans ses dépendances, sinon il se relancerait à chaque
      fondu et rechargerait l'image qu'il vient d'afficher.
    */
    const montree = useRef<string | null>(null);
    const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const cible = url ?? null;

        /*
          **Plus rien à montrer est une transition comme une autre** : `entrante`
          tombe à `null`, et l'ancienne reste en `sortante` le temps du fondu.

          C'est ce dont le **Player Hub** a besoin pour éteindre en fondu ; le
          projecteur, lui, ne rend rien quand `entrante` est nulle — il a son
          propre mécanisme d'extinction, qui garde le chemin le temps du fondu.
          *Une valeur rendue n'oblige personne à la dessiner.*
        */
        if (cible === null) {
            const ancienne = montree.current;
            montree.current = null;
            setEntrante(null);
            if (ancienne === null) return;
            setSortante(ancienne);
            if (minuterie.current) clearTimeout(minuterie.current);
            minuterie.current = setTimeout(() => {
                setSortante(null);
                minuterie.current = null;
            }, dureeMs);
            return;
        }

        /* Déjà à l'écran : un rendu de plus ne rejoue pas un fondu. */
        if (cible === montree.current) return;

        let abandonne = false;
        void charger(cible).then(() => {
            /*
              ⚠️ **Une demande plus récente a pu passer devant.** Sur un
              diaporama rapide, deux décodages peuvent se chevaucher et finir
              dans le désordre : sans ce garde-fou, la table verrait revenir une
              image qu'elle avait déjà quittée.
            */
            if (abandonne) return;

            const ancienne = montree.current;
            montree.current = cible;
            setEntrante(cible);

            if (ancienne === null || ancienne === cible) return;

            setSortante(ancienne);
            if (minuterie.current) clearTimeout(minuterie.current);
            minuterie.current = setTimeout(() => {
                setSortante(null);
                minuterie.current = null;
            }, dureeMs);
        });

        return () => { abandonne = true; };
    }, [url, dureeMs, charger]);

    /* Au démontage seulement : une fenêtre de projection qu'on ferme ne doit pas
       laisser un minuteur écrire dans un composant parti. */
    useEffect(() => () => {
        if (minuterie.current) clearTimeout(minuterie.current);
    }, []);

    return { entrante, sortante };
}
