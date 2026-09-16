import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * **Un curseur qui suit le doigt, et un magasin qui n'apprend la valeur qu'au
 * relâchement.**
 *
 * Signalé par David le 2026-09-16 sur le crossfader de Music-OS — *« le slider
 * entre A et B n'a plus un mouvement fluide »* —, puis étendu aux deux autres
 * curseurs du même bandeau, qui portaient le défaut sans qu'on l'ait remarqué.
 *
 * Un `<input type="range">` branché directement sur un magasin Zustand écrit
 * **une fois par cran**, soit une centaine d'écritures pour une traversée. Dans
 * ce projet, chacune coûte deux choses qui n'ont rien à faire dans un mouvement
 * de doigt :
 *
 * 1. **la persistance** — `persist` sérialise à chaque `set` *tout* ce que
 *    `partialize` retient (pour Music-OS : les playlists entières et les sonies
 *    mesurées) puis écrit dans `localStorage`, **de façon synchrone** ; c'est le
 *    fil du rendu qui paie, et l'addition grossit avec la bibliothèque ;
 * 2. **le réseau** — `useNexusSynchronizer` est abonné aux magasins, et une
 *    synchronisation complète (tous les modules, résolution des médias) repart
 *    toutes les 500 ms pendant le glissé.
 *
 * D'où un curseur qui avance par à-coups. *Ce qui doit suivre le doigt à
 * l'image près, c'est l'EFFET — le son, la lumière ; la valeur rangée, elle,
 * peut attendre qu'on lâche.* Le hook tient donc la position du geste dans
 * l'état local, appelle `pendantLeGeste` à chaque cran (le moteur audio, par
 * exemple, qui ne persiste ni ne diffuse rien), et n'appelle `deposer` **qu'une
 * fois, au relâchement**.
 *
 * Le paramètre `valeurRangee` est la valeur qui fait foi hors geste ; elle
 * reprend la main dès que le curseur est lâché — y compris si elle a changé
 * entre-temps pour une autre raison.
 */
export function useCurseurLisse(
    valeurRangee: number,
    deposer: (valeur: number) => void,
    pendantLeGeste?: (valeur: number) => void
) {
    const [saisie, setSaisie] = useState<number | null>(null);
    const saisieEnCours = useRef<number | null>(null);

    /*
      Les deux fonctions passent par des `ref` pour que `tirer` et `deposerLaSaisie`
      gardent une identité stable : un appelant qui écrit sa lambda dans le JSX
      (le cas courant) ferait sinon repartir l'effet de démontage à chaque
      rendu — et cet effet-là *dépose la valeur*.
    */
    const deposerRef = useRef(deposer);
    deposerRef.current = deposer;
    const pendantLeGesteRef = useRef(pendantLeGeste);
    pendantLeGesteRef.current = pendantLeGeste;

    /** Un cran de plus : l'effet suit tout de suite, le magasin attend. */
    const tirer = useCallback((valeur: number) => {
        saisieEnCours.current = valeur;
        setSaisie(valeur);
        pendantLeGesteRef.current?.(valeur);
    }, []);

    /** Range la valeur tirée, et rend la main à `valeurRangee`. */
    const deposerLaSaisie = useCallback(() => {
        const valeur = saisieEnCours.current;
        if (valeur === null) return;
        saisieEnCours.current = null;
        setSaisie(null);
        deposerRef.current(valeur);
    }, []);

    /*
      Démonter l'écran au milieu d'un glissé ne doit pas perdre la valeur : le
      moteur l'a déjà, mais ni la persistance ni les autres écrans. *Une valeur
      qui ne vit que dans le moteur ressuscite à l'ancienne au rechargement.*
    */
    useEffect(() => deposerLaSaisie, [deposerLaSaisie]);

    /**
     * À poser tel quel sur l'`<input type="range">`.
     *
     * Quatre sorties, parce qu'un curseur se lâche de quatre façons : la souris
     * et le doigt (`pointerup` couvre les deux, l'élément capturant le
     * pointeur), un geste interrompu, le clavier, et le focus perdu. *Une seule
     * oubliée, et la valeur reste dans l'effet sans jamais être rangée.*
     */
    const gestesDeRelachement = {
        onPointerUp: deposerLaSaisie,
        onPointerCancel: deposerLaSaisie,
        onKeyUp: deposerLaSaisie,
        onBlur: deposerLaSaisie
    };

    return {
        /** Ce qu'il faut afficher : le geste s'il a lieu, sinon la valeur rangée. */
        position: saisie ?? valeurRangee,
        /** Vrai tant que le curseur est tenu. */
        enCoursDeSaisie: saisie !== null,
        tirer,
        deposerLaSaisie,
        gestesDeRelachement
    };
}
