import { useEffect, useRef } from 'react';
import { useUlanziStore } from '../useUlanziStore';
import { actionDuGeste } from '../logic/gestesDesBoutons';
import type { BoutonUlanzi } from '../../../../electron/boutonsDeLUlanzi';

/** Ce qu'on fait d'une action une fois qu'on sait laquelle — `handleAction` d'`App`. */
type Declencheur = (action: { type: string; payload?: unknown }) => void;

/**
 * **Un appui sur l'afficheur devient le geste que le meneur y a posé.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OÙ SE FAIT LA TRADUCTION, ET POURQUOI ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Home Assistant envoie « on a appuyé à gauche ». Le processus principal
 * transmet ce mot et **rien d'autre** : il ne connaît pas les réglages, qui
 * vivent dans un magasin persisté de l'écran. C'est donc la fenêtre du meneur —
 * la seule qui les détienne — qui décide de l'action.
 *
 * ⭐ *La conséquence est la propriété de sécurité de tout le chemin* : même si
 * le secret d'appairage fuitait, un inconnu ne pourrait déclencher que ce que le
 * meneur a lui-même posé sur ses trois boutons. Un pont qui transporterait un
 * type d'action donnerait, lui, la main sur les soixante-six du registre.
 *
 * ⚠️ **Fenêtre du MJ seulement.** Le projecteur et les tablettes n'ont ni les
 * réglages ni le droit d'agir ; et sans cette garde, un appui serait exécuté
 * autant de fois qu'il y a de fenêtres ouvertes.
 */
export const useBoutonsDeLUlanzi = (isMainPC: boolean, declencher: Declencheur) => {
    /*
      ⛔ **Le déclencheur vit dans une référence, et l'effet n'en dépend pas.**

      `handleAction` est reconstruit à chaque changement de campagne : le mettre
      dans les dépendances rebrancherait l'écouteur du pont à chaque fois.
      *C'est le défaut déjà trouvé dans `App.tsx`* — deux abonnements de plus par
      rendu, jamais retirés — et celui de `useHueAutoConnect`, qui se rappelait
      lui-même sur ce qu'il écrivait.
    */
    const dernierDeclencheur = useRef(declencher);
    dernierDeclencheur.current = declencher;

    useEffect(() => {
        if (!isMainPC) return;

        const pont = window.appBridge?.ulanzi;
        if (!pont?.surAppuiDeBouton) return;

        return pont.surAppuiDeBouton((bouton: string) => {
            /*
              Les réglages se lisent **à l'appui**, jamais à l'abonnement : une
              fermeture qui capture les réglages d'hier exécuterait le geste
              d'hier.
            */
            const reglages = useUlanziStore.getState().boutons;
            const action = actionDuGeste(reglages?.[bouton as BoutonUlanzi]);

            if (!action) {
                /* « Rien », ou un jet sans formule : c'est un choix, pas une panne. */
                console.log(`[Ulanzi] Bouton « ${bouton} » : aucun geste réglé.`);
                return;
            }

            console.log(`[Ulanzi] Bouton « ${bouton} » → ${action.type}`);
            dernierDeclencheur.current(action);
        });
    }, [isMainPC]);
};
