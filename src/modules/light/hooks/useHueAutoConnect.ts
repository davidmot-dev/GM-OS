import { useEffect } from 'react';
import { useLightStore } from '../useLightStore';
import { hueEngine } from '../HueEngine'; // Instance en minuscule
import { useSessionStore } from '../../../store/useSessionStore';
import { gmToast } from '../../../stores/useToastStore';
import {
    decisionDeReconnexion, delaiAvantLaTentative, TENTATIVES_MAX,
} from '../logic/reconnexionAuPont';

/**
 * Reconnexion automatique au pont Hue au démarrage.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LA BOUCLE DU 2026-09-12 — À NE PAS RÉINTRODUIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Cet effet avait `status` dans ses dépendances **et il écrit `status`**. Il se
 * rappelait donc lui-même, indéfiniment, dès que le pont ne répondait plus :
 * `disconnected` → `discovering` → expiration à 5 s → `disconnected` → …
 *
 * David l'a trouvé **en déplacement** : le pont était resté à la maison. Tant
 * qu'il répond, le cycle s'arrête au premier succès et rien ne se voit ; c'est
 * son absence qui révèle le défaut. *Un défaut qui ne se déclenche qu'ailleurs
 * ne se voit jamais au bureau.*
 *
 * ⭐ **La règle : un effet ne se rejoue pas sur ce qu'il écrit.** `status` a donc
 * quitté les dépendances — l'état frais se lit par `getState()`, comme avant.
 * Il ne reste que ce qui décrit **un autre pont** (`bridgeIp`, `username`) ou un
 * autre moment (`isSystemReady`, `isMainPC`).
 *
 * ⚠️ Et ça ne suffisait pas : une seule chaîne de rappels aurait suffi à
 * reconstituer la boucle. La terminaison est donc portée par une politique
 * séparée et testée — `logic/reconnexionAuPont.ts` —, qui plafonne les
 * tentatives et impose un recul entre elles.
 */
export const useHueAutoConnect = (isMainPC: boolean) => {
    const { status, bridgeIp, username } = useLightStore();
    const isSystemReady = useSessionStore(state => state.isSystemReady);

    useEffect(() => {
        if (isMainPC) {
            console.log(`[Light OS] 🕵️ Surveillance Token: ${username ? 'PRÉSENT (' + username.substring(0, 5) + '...)' : 'ABSENT'} | Status: ${status}`);
        }
    }, [username, status, isMainPC]);

    useEffect(() => {
        // On n'active l'auto-connexion QUE sur le PC du MJ et une fois le bootstrap fini
        if (!isMainPC || !isSystemReady) return;

        /*
          Portées par la fermeture et non par des `useRef` : leur durée de vie
          est exactement celle de cet effet. Un changement de pont doit repartir
          d'un compteur neuf, et c'est ce que le remontage produit gratuitement.
        */
        let annule = false;
        let minuteur: ReturnType<typeof setTimeout> | undefined;
        let tentatives = 0;

        const planifier = (): void => {
            const magasin = useLightStore.getState();
            const decision = decisionDeReconnexion({
                statut: magasin.status,
                ip: magasin.bridgeIp,
                jeton: magasin.username,
                tentativesFaites: tentatives,
            });

            if (decision === 'rien-a-faire') return;

            if (decision === 'renoncer') {
                /*
                  **On s'arrête, et on le dit.** Le meneur doit pouvoir
                  distinguer « GM-OS n'a pas essayé » de « le pont ne répond
                  pas » : un abandon silencieux se lit comme une panne de
                  l'application. Le bouton de connexion de Light-OS reste
                  disponible, et il n'est pas concerné par ce plafond.
                */
                console.warn(
                    `[Light OS] ⛔ Pont injoignable après ${TENTATIVES_MAX} tentatives. ` +
                    'Reconnexion automatique abandonnée.',
                );
                gmToast(
                    `Pont Hue injoignable (${magasin.bridgeIp}) — reconnexion abandonnée. ` +
                    'Relance-la depuis Light-OS quand il répondra.',
                    'warning',
                );
                return;
            }

            minuteur = setTimeout(() => {
                void (async () => {
                    if (annule) return;
                    tentatives += 1;

                    const { setConnection, bridgeIp } = useLightStore.getState();
                    console.log(
                        `[Light OS] 📡 Tentative de reconnexion ${tentatives}/${TENTATIVES_MAX} vers ${bridgeIp}...`,
                    );

                    try {
                        setConnection('discovering');
                        await hueEngine.fetchLights();
                        if (annule) return;

                        setConnection('connected');
                        tentatives = 0;
                        console.log('[Light OS] ✅ Reconnexion automatique réussie.');
                    } catch (err) {
                        if (annule) return;
                        console.error('[Light OS] ❌ Échec de la reconnexion automatique:', err);

                        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
                            /*
                              Le pont a répondu — il a dit non. Retirer le jeton
                              change une dépendance : l'effet se remonte, et la
                              politique rend « rien-a-faire ». Pas de nouvelle
                              tentative, et c'est voulu : réessayer avec un jeton
                              qu'on vient de déclarer invalide n'a aucun sens.
                            */
                            console.warn('[Light OS] ⚠️ Le jeton est invalide. L\'appairage a été perdu côté Pont.');
                            setConnection('disconnected', undefined, null);
                            return;
                        }

                        // Erreur réseau ou autre : on reste en déconnecté mais on garde le token
                        setConnection('disconnected');
                        planifier();
                    }
                })();
            }, delaiAvantLaTentative(tentatives + 1));
        };

        planifier();

        return () => {
            annule = true;
            if (minuteur) clearTimeout(minuteur);
        };
    }, [isSystemReady, isMainPC, bridgeIp, username]);
};
