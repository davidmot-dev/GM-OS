import { useEffect, useRef } from 'react';
import { SessionService } from '../store/SessionService';
import { validateSession } from '../types/schemas';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { rienQueLaDemonstration } from '../modules/session/data/sessionMocks';
import { Logger } from '../utils/logger';

/**
 * **Semer une instance de répétition depuis une sauvegarde.**
 *
 * `npm run repetition` ouvre GM-OS sur un profil jetable — base vide, campagnes
 * absentes. Sans semence, il n'y a rien à répéter : *un environnement d'essai
 * sans données réalistes ne dit rien de ce qu'on veut essayer.*
 *
 * ⭐ Et la semence n'a pas à être inventée : les sauvegardes automatiques
 * portent l'état complet, avec les vraies campagnes. **Le dépôt produit chaque
 * jour, sans le chercher, le jeu d'essai qu'il lui faut.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ TROIS GARDES, ET AUCUNE N'EST DE TROP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ce hook peut **remplacer l'état du meneur**. C'est la catégorie exacte qui a
 * coûté les campagnes deux fois. D'où :
 *
 * 1. **La variable doit exister.** Sans `GMOS_SEMENCE`, le processus principal
 *    rend `null` sans ouvrir le moindre fichier. *Un mécanisme qui peut écraser
 *    demande à exister, il ne demande pas à être désactivé.*
 * 2. **Après l'hydratation seulement.** `isHydrated` attend que le magasin de
 *    session — celui d'IndexedDB, donc asynchrone — ait fini de se relire.
 *    Semer avant, c'est écrire par-dessus une base qu'on n'a pas encore lue :
 *    *le mécanisme du 2026-08-24, mot pour mot.*
 * 3. **Sur un état d'usine seulement.** Dès qu'une campagne du meneur existe, on
 *    ne sème pas et on le dit. C'est la garde qui tient même si les deux autres
 *    tombent — et c'est celle qui protège le vrai profil si la variable
 *    traînait dans un environnement où elle n'a rien à faire.
 *
 *    ⚠️ **« Vide » aurait été faux, et la première version l'a été :** une base
 *    neuve n'est pas vide, elle porte `INITIAL_DATA` — « The Eternal Quest » et
 *    « Les Ombres d'Eldoria ». La garde refusait donc **toujours**, sur tout
 *    profil jetable, et la semence n'a jamais pu s'appliquer. *Une garde qui
 *    refuse tout ressemble beaucoup à une garde qui marche.* Le critère est
 *    maintenant celui de la sauvegarde automatique, partagé avec elle.
 */
export function useSemence(estLaFenetreDuMJ: boolean, estHydrate: boolean): void {
    const dejaTente = useRef(false);

    useEffect(() => {
        if (!estLaFenetreDuMJ || !estHydrate || dejaTente.current) return;

        const pont = window.appBridge?.semence;
        if (!pont) return;

        dejaTente.current = true;

        void (async () => {
            const brut = await pont.lire().catch(err => {
                Logger.warn('[Semence] Lecture impossible', err);
                return null;
            });
            if (!brut) return;

            /*
              La troisième garde. Elle est volontairement **après** la lecture :
              on veut pouvoir dire au meneur pourquoi rien n'a été semé, plutôt
              que de rester muet.
            */
            const campagnes = useSessionOSStore.getState().campaigns ?? [];
            if (!rienQueLaDemonstration(campagnes)) {
                Logger.warn(
                    `[Semence] ${campagnes.length} campagne(s) du meneur : rien n'est semé. ` +
                    'Une semence ne remplace jamais un état existant.',
                );
                return;
            }

            try {
                /* Le même chemin que « charger une session » — validation
                   comprise. *Une seconde porte vers les mêmes données finirait
                   par diverger de la première.* */
                SessionService.distributeData(validateSession(brut));
                Logger.info('[Semence] Instance de répétition semée.');
            } catch (err) {
                Logger.error('[Semence] Sauvegarde refusée par la validation', err);
            }
        })();
    }, [estLaFenetreDuMJ, estHydrate]);
}
