import { useEffect, useRef } from 'react';
import { useLightStore } from '../useLightStore';
import { useVoiceStore } from '../../voice/useVoiceStore';
import { hueEngine } from '../HueEngine';
import {
    CADENCE_MS,
    brillanceDeLaVoix,
    doitEnvoyer,
    lisser,
} from '../logic/suivreLaVoix';

/**
 * **La boucle qui fait suivre la voix à la lumière.**
 *
 * La règle vit dans `logic/suivreLaVoix.ts`, testée sans micro ni pont ; ce
 * crochet ne fait que la brancher sur les deux magasins et sur le pont.
 *
 * **Il est monté dans `Shell`, jamais dans le panneau des lumières**, et c'est
 * la même leçon que le battement de l'afficheur Ulanzi et celui du minuteur :
 * accroché à une vue, il s'arrêterait dès que le meneur en change — or c'est en
 * pleine scène qu'on veut l'effet, pas devant l'écran qui le règle. *Un émetteur
 * attaché à une vue émet ce que la vue veut bien.*
 *
 * **On n'écoute pas `inputLevel` par abonnement React.** Il se rafraîchit à la
 * cadence de l'écran ; le lire par `useVoiceStore(e => e.inputLevel)` ferait
 * rendre `Shell` — donc toute l'application — soixante fois par seconde. On le
 * lit dans la boucle, avec `getState()`, qui ne provoque aucun rendu.
 */
export function useLumiereQuiSuitLaVoix(): void {
    const suivreLaVoix = useLightStore(e => e.suivreLaVoix);
    const statut = useLightStore(e => e.status);
    const voixActive = useVoiceStore(e => e.isActive);

    /** Le niveau lissé, entre deux tours de boucle. */
    const niveau = useRef(0);
    /** La dernière brillance réellement envoyée au pont. */
    const derniere = useRef<number | null>(null);

    useEffect(() => {
        /*
          **Trois conditions, et la voix en fait partie.** Le mode peut rester
          armé toute la soirée ; tant que le micro est coupé, `inputLevel` reste
          à zéro et la pièce resterait bloquée dans sa pénombre de plancher —
          *une lumière figée au minimum ressemble à une panne, pas à un
          réglage.*
        */
        if (!suivreLaVoix || !voixActive) return;
        if (statut !== 'connected' && statut !== 'mock') return;

        /*
          **Une commande à la fois.** Une requête au pont peut dépasser
          l'intervalle — réseau lent, pont occupé — et `setInterval` n'attend
          rien : les envois se doubleraient, et c'est le plus lent qui écrirait
          en dernier. C'est le défaut exact mesuré sur l'afficheur Ulanzi le
          2026-08-31, où deux publications se chevauchaient à 500 ms.
        */
        let enVol = false;
        niveau.current = 0;
        derniere.current = null;

        const battre = () => {
            niveau.current = lisser(niveau.current, useVoiceStore.getState().inputLevel);
            const brillance = brillanceDeLaVoix(niveau.current);

            if (enVol || !doitEnvoyer(brillance, derniere.current)) return;

            enVol = true;
            derniere.current = brillance;
            void hueEngine.modulerLaBrillance(brillance)
                .catch(() => {
                    // Le pont n'a pas répondu : on oublie ce qu'on croyait avoir
                    // posé, pour que le tour suivant reparte plutôt que de
                    // s'abstenir sur un écart devenu faux.
                    derniere.current = null;
                })
                .finally(() => { enVol = false; });
        };

        const minuteur = setInterval(battre, CADENCE_MS);

        return () => {
            clearInterval(minuteur);
            /*
              **Rendre la scène en partant.** La commande de groupe a aplani le
              contraste de brillance entre les lampes ; la réappliquer est la
              seule façon de le rétablir, et elle existe déjà.

              *Une restitution ne s'invente pas : on rejoue ce que le meneur
              avait demandé.* Sans elle, éteindre le mode laisserait la pièce sur
              la dernière syllabe prononcée.
            */
            const { activeSceneId } = useLightStore.getState();
            if (activeSceneId) void hueEngine.applyScene(activeSceneId, true).catch(() => undefined);
        };
    }, [suivreLaVoix, voixActive, statut]);
}
