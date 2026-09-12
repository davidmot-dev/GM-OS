import { spatialTriggerService } from '../../map/SpatialTriggerService';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useAIStore } from '../../../stores/useAIStore';
import { useLightStore } from '../../light/useLightStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useImageStore } from '../../image/useImageStore';
import { useMapStore } from '../../map/useMapStore';
import { gmToast } from '../../../stores/useToastStore';
import { useDemarrageStore } from '../useDemarrageStore';
import {
    menerLeDemarrage, alerteDuDemarrage, type EtapeDeDemarrage,
} from './etapesDuDemarrage';

/**
 * Service centralisé pour orchestrer le démarrage de GM-OS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE SERVICE A ÉTÉ L'ÉCRAN BLOQUÉ DU 2026-09-12 — NE PAS REVENIR EN ARRIÈRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il attendait ses trois étapes **sans borne**, et son `catch` final laissait
 * `isSystemReady` à `false` *délibérément* — commentaire d'époque : « pour
 * bloquer l'interface si critique ». L'application restait alors sur
 * `GM-OS BOOTING...`, **pour toujours, sans message et sans reprise**.
 *
 * Trois chemins y menaient, et chacun suffisait :
 *
 * 1. `initDB()` — `openDB` **ne résout jamais** quand une autre fenêtre tient la
 *    base media à une version antérieure. Projecteur, Player Hub et tablette
 *    partagent l'origine du meneur : il suffit qu'une reste ouverte.
 * 2. les deux `syncWithKeychain()` dans un `Promise.all` — **un seul rejet** et
 *    les étapes suivantes ne partaient pas.
 * 3. n'importe quelle exception — rattrapée, tracée, et le système restait mort.
 *
 * ⭐ **Le remède n'a pas été de chercher lequel des trois a bloqué ce jour-là.**
 * Sans reproduction, ç'aurait été deviner. C'est de retirer la possibilité :
 * chaque étape est **nommée**, **bornée**, et le démarrage **aboutit toujours**.
 * Voir `etapesDuDemarrage.ts`, qui porte la mécanique et ses 17 tests.
 *
 * ⚠️ **Ce qui reste vrai, et qu'il ne faut pas relire de travers** : aucune de
 * ces étapes ne porte les campagnes. Elles arrivent par la réhydratation du
 * magasin persisté, qui ne passe pas d'ici. *Rien de ce que fait ce service ne
 * justifie de garder le meneur dehors.*
 */
export class BootstrapService {
    private static isInitialized = false;

    /**
     * Le budget de chaque étape.
     *
     * ⚠️ **Généreux exprès.** Sur une grosse médiathèque, un démarrage à froid
     * peut légitimement prendre quelques secondes ; expirer trop tôt priverait
     * le meneur de ses médias sans qu'aucune panne n'existe. *Cette borne est là
     * contre l'infini, pas contre la lenteur.*
     */
    private static readonly DELAI_PAR_ETAPE_MS = 15_000;

    private static lesEtapes(): EtapeDeDemarrage[] {
        const delaiMs = this.DELAI_PAR_ETAPE_MS;

        return [
            {
                /* Essentielle à la résolution des URLs `m-ID`. */
                nom: 'Médiathèque',
                delaiMs,
                /*
                  ⛔ **`initDB()` n'échoue jamais — elle avale sa propre
                  exception**, pose `isInitialized: true` et laisse la liste
                  vide. *Une lecture ratée se présente donc comme une
                  médiathèque vide* : le motif exact qui a coûté les campagnes
                  le 27/08. Sans cette relecture de `error`, l'étape serait
                  déclarée « faite » sur une base morte.

                  ⚠️ **Et on ne corrige pas ça en remettant `isInitialized` à
                  `false`** : `MediaBrowser` rappelle `initDB` dès qu'il le voit
                  faux, et une base en panne deviendrait une boucle — celle de
                  Light-OS, à l'identique. On laisse le drapeau dire « tentée »,
                  et c'est ici qu'on dit qu'elle a manqué.
                */
                faire: async () => {
                    await useMediaStore.getState().initDB();

                    const { error } = useMediaStore.getState();
                    if (error) throw new Error(error);
                },
            },
            {
                /* Les clés d'API depuis le stockage sécurisé de l'OS. */
                nom: 'Trousseau IA',
                delaiMs,
                faire: () => useAIStore.getState().syncWithKeychain(),
            },
            {
                nom: 'Trousseau Hue',
                delaiMs,
                faire: () => useLightStore.getState().syncWithKeychain(),
            },
            {
                nom: 'Services de fond',
                delaiMs,
                faire: async () => { spatialTriggerService.startWatching(); },
            },
        ];
    }

    static async bootstrap(): Promise<void> {
        if (this.isInitialized) return;

        console.log('[Bootstrap] ⚙️ Initialisation du système...');

        /*
          Nettoyage des projections résiduelles de la session précédente : sans
          lui, une image projetée hier se rouvrirait toute seule aujourd'hui.
          Purement local, rien à attendre — il n'a pas besoin d'être une étape.
        */
        useImageStore.getState().clearActiveProjections();
        useMapStore.getState().resetProjectionState();

        /*
          **La sauvegarde automatique n'a rien à démarrer ici, et ce n'est pas un oubli.**

          Cette ligne portait un appel commenté à `sessionBackupManager.start()`, avec
          pour explication « désactivation du cycle de sauvegarde automatique ». Les deux
          sont faux aujourd'hui : **`start()` n'existe plus**, et la sauvegarde tourne.

          Elle ne bat plus à intervalle fixe — c'était bien la cause des blocages sur
          les grosses séances. Elle se déclenche sur des faits : deux minutes après le
          DERNIER changement (`signalerUnChangement`), à la fermeture, avant la
          suppression d'une campagne, à la clôture d'une séance.

          *Un commentaire qui décrit un mécanisme retiré est pire qu'une absence de
          commentaire : il fait croire que le filet est décroché.*
        */

        const { avancer, conclure } = useDemarrageStore.getState();

        const rapport = await menerLeDemarrage(this.lesEtapes(), (enCours, rendus) => {
            if (enCours) console.log(`[Bootstrap] … ${enCours}`);
            avancer(enCours, rendus);
        });

        conclure(rapport);

        /*
          ⛔ **Prêt dans tous les cas — c'est tout le correctif.** L'ancien code
          avait ici un chemin qui ne posait jamais ce drapeau, et l'interface
          n'avait alors plus aucun moyen d'apparaître.
        */
        useSessionStore.getState().setSystemReady(true);
        this.isInitialized = true;

        const alerte = alerteDuDemarrage(rapport);
        if (alerte) {
            /*
              ⚠️ **Un démarrage amputé doit se voir.** Sans ce mot, on aurait
              échangé un blocage visible contre une panne muette — la
              médiathèque vide, l'Oracle sans clé, et rien à l'écran pour le
              dire. *Une panne muette se découvre en séance.*
            */
            console.warn(`[Bootstrap] ⚠️ ${alerte}`);
            gmToast(`⚠️ ${alerte}`);
        } else {
            console.log('[Bootstrap] ✅ Système prêt.');
        }
    }
}
