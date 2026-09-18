import { useLightStore, INTENSITE_SCENE_DEFAUT, VITESSE_EFFET_DEFAUT } from "./useLightStore";
import type { HueLight, HueLightState } from "./useLightStore";
import { sceneDeRepli } from "./logic/sceneDeRepli";
import { etatARendre } from "./logic/etatARendre";
import { prochainBattement, RAFALE_AU_REPOS } from "./logic/cadenceDeFusillade";
import { estSoliste, solistesAdmis } from "./logic/solistesDeLEffet";
import { cadencePartagee } from "./logic/budgetDuPont";
import { BANDE_DE_LA_BOUGIE, BOURRASQUE, etatDuFeu, tirerLaChaleur } from "./logic/echelleDuFeu";
import { EXTINCTION_DS, imageDeDeflagration } from "./logic/deflagration";
import { imageDuSouffle, SOUFFLES } from "./logic/souffle";
import { fonduTenable, teinterVers, estUneVariante, idDepuisLIdentifiant } from "./logic/varianteDEffet";
import { imageDesStores, phaseDeLaLampe } from "./logic/lumiereDesStores";

interface HueApiLight {
    state: {
        on: boolean;
        bri: number;
        hue: number;
        sat: number;
        effect: string;
        xy: [number, number];
        ct: number;
        reachable: boolean;
    };
    type: string;
    name: string;
}

/**
 * **Le plancher d'une cadence d'effet, en millisecondes.**
 *
 * Le pont Hue accepte de l'ordre de dix commandes par seconde, et chaque lampe
 * en effet a sa propre boucle : une scène de quatre lampes à 100 ms tient déjà
 * tout le budget. Accélérer ne doit donc jamais descendre plus bas que ce que
 * le code d'origine s'autorisait déjà (stroboscope, hyperspace : 100 ms).
 */
export const CADENCE_PLANCHER_MS = 100;

/**
 * **Le temps qu'on laisse au curseur d'intensité avant de rejouer la scène.**
 *
 * Un curseur traîné émet des dizaines de valeurs ; rejouer la scène à chacune
 * noierait le pont, qui tient de l'ordre de dix commandes par seconde et qui
 * fait déjà battre les effets. On ne garde que la dernière valeur d'un quart de
 * seconde — le geste reste vivant, le pont ne s'en aperçoit pas.
 */
export const DELAI_INTENSITE_MS = 250;

/**
 * La transition d'un rejeu d'intensité, en millisecondes.
 *
 * ⚠️ Ce n'est **pas** `transitionTimeMs` : celui-là vaut cinq secondes par
 * défaut, ce qui est juste pour passer d'une ambiance à l'autre et absurde pour
 * un curseur qu'on pousse — la pièce répondrait cinq secondes après la main.
 */
export const TRANSITION_INTENSITE_MS = 200;

/**
 * Applique une vitesse à une cadence d'effet.
 *
 * `vitesse` divise l'attente : 2 va deux fois plus vite, 0,5 deux fois moins.
 * Le résultat est borné par {@link CADENCE_PLANCHER_MS} — *un curseur poussé au
 * bout ne doit pas pouvoir noyer le pont.*
 */
export const cadenceEffective = (intervalleMs: number, vitesse: number): number => {
    const facteur = Number.isFinite(vitesse) && vitesse > 0 ? vitesse : VITESSE_EFFET_DEFAUT;
    return Math.max(CADENCE_PLANCHER_MS, Math.round(intervalleMs / facteur));
};

/**
 * **La brillance réellement envoyée au pont**, une fois les deux curseurs passés.
 *
 * `bri` est la brillance nominale — celle qu'a enregistrée la capture d'une
 * tuile, ou celle qu'un effet vient de calculer. Elle est multipliée par le
 * curseur global (*toute la pièce, ce soir*) puis par celui de la tuile
 * (*cette ambiance-là est basse*). **Les deux se composent** : 50 % de global
 * sur une scène à 50 % rend le quart.
 *
 * Deux bornes, et aucune n'est décorative :
 * - **254 en haut**, parce que la tuile monte jusqu'à 150 % et que le pont
 *   refuse la commande entière au-delà — une lampe déjà pleine resterait
 *   simplement pleine, mais elle emmènerait les autres dans son refus ;
 * - **0 en bas**, qui est ce que le code faisait déjà quand le curseur global
 *   est à zéro. On ne le remonte pas à 1 : ce serait décider qu'un global à
 *   zéro veut dire « au plus bas » alors qu'il a toujours voulu dire « rien ».
 *
 * Une valeur illisible (scène d'avant le réglage, sauvegarde abîmée) vaut
 * 100 % : *on joue la scène telle qu'elle a été capturée, on ne l'éteint pas.*
 */
export const brillanceEffective = (
    bri: number,
    pourcentGlobal: number,
    pourcentDeScene: number = INTENSITE_SCENE_DEFAUT
): number => {
    const global = Number.isFinite(pourcentGlobal) ? pourcentGlobal : 100;
    const scene = Number.isFinite(pourcentDeScene) ? pourcentDeScene : INTENSITE_SCENE_DEFAUT;
    /*
      ⛔ **Le plancher est 1, pas 0 — la plage d'une lampe Hue est 1 à 254.**

      Zéro est hors spécification : selon le micrologiciel il est rejeté — *une
      commande perdue dans un budget qui en tient dix par seconde* — ou ramené à
      1. Et **dans les deux cas il n'éteint pas** : seul `on: false` coupe.

      Le 2026-09-17, deux effets posaient `bri: 0` à la main (stroboscope,
      fantôme) et ont été corrigés un par un. ⭐ *La vraie question était « qui
      d'autre a la même rustine à poser ? »* — et la réponse était **ici** :
      une brillance faible multipliée par un curseur global bas arrondit à zéro
      toute seule. `setLightState` pouvait donc l'envoyer sans que personne
      l'ait écrit. *Deux appelants avaient déjà posé leur `Math.max(1, …)`
      localement, ce qui aurait dû nous mettre la puce à l'oreille.*

      ⚠️ **Mais zéro reste atteignable, et c'est voulu.** Un multiplicateur
      posé *exactement* à zéro est une décision — « rien » — et le test
      `intensiteDesScenes` la garde depuis qu'elle a été prise. On distingue
      donc les deux cas que le même nombre confondait :

      | Cas | Ce qu'il veut dire | Résultat |
      | --- | --- | --- |
      | Un curseur **à zéro** | « rien », délibérément | `0` |
      | Un produit qui **arrondit** à zéro | « aussi faible que possible » | `1` |

      *Deux intentions qui tombaient sur la même valeur : c'est toujours là que
      se cachent les défauts muets.*

      ⛔ **Ce que ça ne règle pas** : `bri: 0` **n'éteint toujours pas** une
      lampe. Le curseur global à zéro ne fait donc pas ce que son test dit
      qu'il fait — il faudrait un `on: false`. Constat à part, non traité ici.
    */
    if (global === 0 || scene === 0 || bri === 0) return 0;
    return Math.max(1, Math.min(254, Math.round(bri * (global / 100) * (scene / 100))));
};

/**
 * **Ce qu'on fait de la lampe quand son effet s'arrête.** Trois réponses — et
 * surtout pas une quatrième déguisée en booléen.
 *
 * | | Ce que la commande porte | Qui l'emploie |
 * | --- | --- | --- |
 * | `'sansRien'` | `effect: 'none'` seul | les huit appels suivis d'une pose d'état |
 * | `'rendreLEtat'` | + l'état d'avant l'effet | le geste « Fixe » du pied de page, et la fin d'un coup unique |
 * | `'eteindre'` | + `on: false` | **l'explosion**, dont le noir final EST l'effet |
 *
 * ⛔ **`bri: 0` n'éteint pas une lampe Hue** — la plage est 1 à 254, et seul
 * `on: false` coupe. C'est la raison d'être de ce troisième mode : sans lui, la
 * fin d'une explosion n'était pas un noir, c'était une lampe faible. Le
 * commentaire du `stroboscope` l'avait noté en septembre et conclu que *« le
 * vrai noir attend que l'arrêt sache restaurer »* — l'arrêt sait, depuis hier.
 *
 * ⚠️ *Ces trois gestes ne visent pas la même chose, et on ne les aligne pas :
 * on les nomme.* Un booléen à deux valeurs pour trois intentions, c'est la
 * faute que ce module a déjà payée quatre fois.
 */
export type FinDEffet = 'sansRien' | 'rendreLEtat' | 'eteindre';

export class HueEngine {
    private softwareEffectIntervals: Record<string, ReturnType<typeof setInterval>> = {};
    /** Scène d'où vient l'effet en cours d'une lampe — c'est elle qui porte la vitesse. */
    private sceneDeLEffet: Record<string, string | null> = {};
    /** Cadence réellement planifiée pour une lampe, pour ne replanifier que si elle change. */
    private cadencePlanifiee: Record<string, number> = {};
    /** Replanifie l'effet d'une lampe à la vitesse du moment (posée par `startSoftwareEffect`). */
    private replanifierEffet: Record<string, () => void> = {};
    /**
     * **Le numéro de l'effet en cours sur une lampe.**
     *
     * Une boucle d'effet attend la réponse du pont avant de se replanifier. Si
     * la scène change pendant cette attente, la boucle qui reprend appartient à
     * l'effet d'avant : sans ce numéro, elle réinstallerait son propre minuteur
     * par-dessus le nouveau, et la lampe resterait sur la scène précédente.
     */
    private generationEffet: Record<string, number> = {};
    private flashTimeout: ReturnType<typeof setTimeout> | null = null;
    /** Le rejeu d'intensité en attente, s'il y en a un (voir {@link DELAI_INTENSITE_MS}). */
    private minuterieIntensite: ReturnType<typeof setTimeout> | null = null;
    /** Un rejeu d'intensité est-il en train de parler au pont ? */
    private rejeuIntensiteEnCours = false;

    // ------------------------------------------------------------------------
    // Discovery & Pairing
    // ------------------------------------------------------------------------

    async discoverBridge(): Promise<string | null> {
        try {
            const bridge = window.appBridge?.light;
            let data: unknown;
            if (bridge) {
                data = await bridge.request('https://discovery.meethue.com/', 'GET');
            } else {
                const res = await fetch('https://discovery.meethue.com/');
                data = await res.json();
            }

            // @ts-expect-error Data is weakly typed from API response
            if (data && data.length > 0 && data[0].internalipaddress) {
                // @ts-expect-error Data is weakly typed from API
                return data[0].internalipaddress;
            }
            return null;
        } catch (e) {
            console.error('[HueEngine] Discovery error:', e);
            return null;
        }
    }

    async pair(ip: string): Promise<string | null> {
        try {
            const url = `https://${ip}/api`;
            const payload = { devicetype: "gm_os_v5#windows" };
            const bridge = window.appBridge?.light;
            let data: unknown;

            if (bridge) {
                data = await bridge.request(url, 'POST', payload);
            } else {
                const res = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                data = await res.json();
            }

            // @ts-expect-error Weak API type
            if (data && data[0] && data[0].success) {
                // @ts-expect-error Weak API type
                return data[0].success.username;
                // @ts-expect-error Weak API type
            } else if (data && data[0] && data[0].error && data[0].error.type === 101) {
                // Return null or throw silently since it's an expected polling state
                throw new Error("LINK_BUTTON_NOT_PRESSED");
            }
            return null;
        } catch (e: unknown) {
            if (e instanceof Error && e.message !== "LINK_BUTTON_NOT_PRESSED") {
                console.error('[HueEngine] Pairing error:', e);
            }
            throw e;
        }
    }

    // ------------------------------------------------------------------------
    // API Basics
    // ------------------------------------------------------------------------

    private async request(method: string, endpoint: string, body?: Record<string, unknown>) {
        const { bridgeIp, username, status } = useLightStore.getState();
        if (status === 'mock') {
            if (method !== 'GET') console.log(`[MOCK HUE] ${method} ${endpoint}`, body);
            return null;
        }
        if (!bridgeIp || !username) throw new Error("Not connected");

        const url = `https://${bridgeIp}/api/${username}${endpoint}`;
        try {
            const bridge = window.appBridge?.light;
            let data: any;

            if (bridge) {
                data = await bridge.request(url, method, body);
            } else {
                const res = await fetch(url, {
                    method,
                    body: body ? JSON.stringify(body) : undefined
                });
                data = await res.json();
            }

            // Check for common Hue error responses (Array of objects)
            if (Array.isArray(data) && data[0]?.error) {
                const error = data[0].error;
                if (error.type === 1) { // Unauthorized user
                    console.error('[HueEngine] Token invalid or expired:', error.description);
                    throw new Error("UNAUTHORIZED");
                }
            }

            return data;
        } catch (e) {
            console.error(`[HueEngine] Req failed: ${method} ${endpoint}`, e);
            throw e;
        }
    }

    async fetchLights() {
        const data = await this.request('GET', '/lights');
        if (!data) return; // Mock or error

        const formattedLights: Record<string, HueLight> = {};
        for (const [id, light] of Object.entries(data as Record<string, HueApiLight>)) {
            formattedLights[id] = {
                id,
                name: light.name,
                type: light.type,
                state: {
                    on: light.state.on,
                    bri: light.state.bri,
                    xy: light.state.xy,
                    ct: light.state.ct,
                    effect: 'none' // We track software effects locally
                }
            };
        }
        useLightStore.getState().setLights(formattedLights);
    }

    /**
     * Envoie un état à une lampe.
     *
     * `intensiteDeScene` est le curseur de la tuile d'où vient cet état, en
     * pourcentage. Il ne s'applique **qu'au message envoyé au pont** : l'état
     * gardé en mémoire reste la brillance nominale, celle qu'une capture doit
     * réenregistrer. *Sinon deux allers-retours entre une tuile à 50 % et une
     * capture éteindraient la scène par étapes.*
     *
     * Il vaut 100 par défaut, et c'est ce que reçoit un geste direct sur une
     * lampe (le pied de page) : ce geste n'appartient à aucune tuile.
     */
    async setLightState(
        id: string,
        state: Partial<HueLightState>,
        transitionTimeMs: number = 400,
        intensiteDeScene: number = INTENSITE_SCENE_DEFAUT
    ) {
        // Transition time in Hue API is in multiples of 100ms
        const transitiontime = Math.round(transitionTimeMs / 100);

        const payload: Record<string, unknown> = { transitiontime };
        if (state.on !== undefined) payload.on = state.on;

        // Do not send color or brightness if we are turning the light off
        // The Hue API returns an error if we try to modify a bulb that is off.
        if (payload.on !== false) {
            if (state.bri !== undefined) payload.bri = Math.round(state.bri);
            if (state.xy !== undefined) payload.xy = state.xy;
            if (state.ct !== undefined) payload.ct = Math.round(state.ct);

            // Apply global brightness and the tile's own intensity as modifiers
            if (typeof payload.bri === 'number') {
                payload.bri = brillanceEffective(
                    payload.bri,
                    useLightStore.getState().globalBrightness,
                    intensiteDeScene
                );
            }
        }

        await this.request('PUT', `/lights/${id}/state`, payload);

        // Update local store immediately for UI responsiveness
        useLightStore.getState().updateLightState(id, state);
    }

    async applyScene(sceneId: string | null, isAutomatic: boolean = false) {
        if (!sceneId) {
            console.log('[HUE ENGINE] No scene specified, extinguishing all.');
            /* `isAutomatic` voyage avec le geste : éteindre parce qu'un son se
               termine n'est pas éteindre parce qu'on l'a demandé. */
            await this.extinguishAll(isAutomatic);
            return;
        }

        console.log(`[HUE ENGINE] Applying Scene: ${sceneId} (isAutomatic: ${isAutomatic})`);
        const scene = useLightStore.getState().scenes[sceneId];
        if (!scene) {
            console.warn(`[HUE ENGINE] Scene not found: ${sceneId}`);
            return;
        }

        /*
          **Les lumières étaient muettes**, troisième des modules relevés à la
          revue des 36 émetteurs du 2026-08-20.

          **Et `isAutomatic` décide de tout.** Huit chemins appellent cette
          méthode, et six sont des ENCHAÎNEMENTS : une scène liée à une piste de
          musique, à un instantané, à un moment de storyboard. Les consigner
          tous écrirait deux lignes pour un seul geste — la musique dit déjà
          qu'elle démarre, et sa lumière liée le redirait aussitôt. *Un journal
          qui double ses lignes se relit comme un journal qui ment sur le nombre
          de gestes.*

          Le paramètre existait déjà, et il portait exactement la distinction
          qu'il fallait : **on consigne ce que le meneur a voulu, pas ce que
          l'application a enchaîné.**
        */
        if (!isAutomatic) {
            const { useJournalStore } = await import('../journal/useJournalStore');
            useJournalStore.getState().addEvent({
                type: 'SYSTEM',
                title: `Lumières : ${scene.name}`,
                content: `Scène lumineuse « ${scene.name} » appliquée à la table.`,
                metadata: { sceneId },
            });
        }

        const transTime = useLightStore.getState().transitionTimeMs;
        /* Lue une fois pour toute la scène : le curseur ne doit pas changer de
           valeur entre la première lampe et la dernière. */
        const intensite = scene.sceneBrightness ?? INTENSITE_SCENE_DEFAUT;
        useLightStore.getState().setActiveScene(sceneId, isAutomatic);

        // Turn everything off first if not in snapshot?
        // Or just apply the snapshot.
        for (const [id, state] of Object.entries(scene.lightStates)) {
            this.stopSoftwareEffect(id); // Clean any previous logic
            if (state.effect && state.effect !== 'none') {
                // IMPORTANT: Even if there is an effect, we must turn the light ON first and set its base state
                await this.setLightState(id, { ...state, effect: 'none' }, transTime, intensite);
                this.startSoftwareEffect(id, state.effect, state, sceneId);
            } else {
                // Ensure we handle them sequentially to not rate-limit the bridge
                await this.setLightState(id, state, transTime, intensite);
                // Tiny delay to let the bridge breathe (increased from 50ms)
                await new Promise(r => setTimeout(r, 100));
            }
        }
    }

    /**
     * Écrit une ligne au journal de séance.
     *
     * L'import est **dynamique**, comme celui d'`applyScene` : le journal
     * connaît les lumières, les lumières ne doivent pas connaître le journal au
     * chargement.
     */
    private async consignerAuJournal(titre: string, contenu: string, metadata?: Record<string, unknown>) {
        try {
            const { useJournalStore } = await import('../journal/useJournalStore');
            useJournalStore.getState().addEvent({
                type: 'SYSTEM',
                title: titre,
                content: contenu,
                metadata,
            });
        } catch (e) {
            /* Le journal est un témoin, pas une condition : son absence ne doit
               jamais empêcher la pièce de s'éteindre. */
            console.warn('[HUE ENGINE] Journal indisponible :', e);
        }
    }

    /**
     * **Un module rend la main** — fin d'un son, d'une piste d'ambiance, d'une
     * musique, d'un flash tactique.
     *
     * On revient à ce que le meneur avait choisi, et à défaut à l'éclairage
     * normal de la pièce. ⛔ *Avant le 2026-09-07, une soirée où aucune scène
     * n'avait été cliquée finissait dans le noir à la fin du premier pad
     * sonore* : `lastManualSceneId` était vide, et `applyScene(null)` éteint.
     */
    async revertToManualScene() {
        const { lastManualSceneId, defaultSceneId, scenes } = useLightStore.getState();
        const cible = sceneDeRepli(scenes, [lastManualSceneId, defaultSceneId]);
        console.log(`[HUE ENGINE] Reverting to scene: ${cible} (manuelle: ${lastManualSceneId}, défaut: ${defaultSceneId})`);
        await this.applyScene(cible, true);
    }

    /**
     * **Le Stop All de la barre du haut : on coupe tout, et la pièce revient à
     * son éclairage normal.**
     *
     * Il vise le défaut **directement**, sans passer par la dernière scène
     * choisie : *on ne veut pas retomber sur la scène d'alerte qui jouait il y
     * a trois secondes.* Sans éclairage normal désigné, il éteint — le
     * comportement d'avant ce réglage, et celui de qui ne s'en sert pas.
     *
     * ⚠️ À ne pas confondre avec `extinguishAll`, qui reste l'extinction
     * franche du bouton rouge de Light-OS : *un bouton nommé « extinction »
     * doit éteindre, sinon il ne reste aucune porte vers le noir.*
     */
    async revenirALEclairageNormal(isAutomatic: boolean = false) {
        const { defaultSceneId, scenes } = useLightStore.getState();
        const cible = sceneDeRepli(scenes, [defaultSceneId]);

        /*
          **Le journal disait quand une ambiance commençait, jamais quand elle
          s'arrêtait.** `applyScene` consigne le geste du meneur depuis la revue
          des 36 émetteurs ; les deux arrêts, eux, n'écrivaient rien. À la
          relecture d'après-séance, toutes les lumières de la soirée avaient
          l'air d'être restées allumées.

          Une seule ligne pour l'arrêt, quelle que soit sa fin : c'est
          `extinguishAll` qui se tait quand c'est nous qui l'appelons.
        */
        if (!isAutomatic) {
            await this.consignerAuJournal(
                'Lumières : arrêt de la scène',
                cible
                    ? `Retour à l'éclairage normal « ${scenes[cible].name} ».`
                    : `Extinction : aucun éclairage normal n'est désigné.`,
                { sceneId: cible }
            );
        }

        if (!cible) {
            await this.extinguishAll(true);
            return;
        }

        /*
          **Tout se tait d'abord.** `applyScene` n'arrête que les effets des
          lampes qu'elle contient : une lampe absente de la scène normale
          garderait son orage en cours, et le Stop All aurait laissé la pièce
          clignoter. *Un geste qui s'appelle « tout arrêter » ne peut pas
          n'arrêter que ce que sa cible mentionne.*

          Leur brillance, elle, n'est pas touchée : une lampe hors de la scène
          normale reste où elle était. On la fait taire, on ne décide pas à sa
          place.
        */
        if (this.flashTimeout) {
            clearTimeout(this.flashTimeout);
            this.flashTimeout = null;
        }
        Object.keys(useLightStore.getState().lights).forEach(id => this.stopSoftwareEffect(id));

        console.log(`[HUE ENGINE] Stop All → éclairage normal : ${cible}`);
        await this.applyScene(cible, true);
    }

    // ------------------------------------------------------------------------
    // Color Math (CIE & Gamut)
    // ------------------------------------------------------------------------
    
    // Gamut Definitions (A, B, C)
    private readonly GAMUT_C = {
        red: [0.692, 0.308] as [number, number],
        green: [0.170, 0.700] as [number, number],
        blue: [0.153, 0.048] as [number, number]
    };

    private isPointInTriangle(p: [number, number], a: [number, number], b: [number, number], c: [number, number]): boolean {
        const v0 = [c[0] - a[0], c[1] - a[1]] as [number, number];
        const v1 = [b[0] - a[0], b[1] - a[1]] as [number, number];
        const v2 = [p[0] - a[0], p[1] - a[1]] as [number, number];

        const dot00 = v0[0] * v0[0] + v0[1] * v0[1];
        const dot01 = v0[0] * v1[0] + v0[1] * v1[1];
        const dot02 = v0[0] * v2[0] + v0[1] * v2[1];
        const dot11 = v1[0] * v1[0] + v1[1] * v1[1];
        const dot12 = v1[0] * v2[0] + v1[1] * v2[1];

        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v < 1);
    }

    private getClosestPointOnLine(p: [number, number], a: [number, number], b: [number, number]): [number, number] {
        const ap = [p[0] - a[0], p[1] - a[1]];
        const ab = [b[0] - a[0], b[1] - a[1]];
        const ab2 = ab[0] * ab[0] + ab[1] * ab[1];
        const ap_ab = ap[0] * ab[0] + ap[1] * ab[1];
        let t = ap_ab / ab2;
        if (t < 0.0) t = 0.0;
        else if (t > 1.0) t = 1.0;
        return [a[0] + ab[0] * t, a[1] + ab[1] * t];
    }

    hexToXy(hex: string): [number, number] {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');

        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        // Gamma correction
        const red = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : (r / 12.92);
        const green = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : (g / 12.92);
        const blue = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : (b / 12.92);

        // XYZ
        const X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
        const Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
        const Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

        let cx = X / (X + Y + Z);
        let cy = Y / (X + Y + Z);

        if (isNaN(cx)) cx = 0.0;
        if (isNaN(cy)) cy = 0.0;

        // Gamut Clamping (Defaults to Gamut C as it is the most common for new bulbs,
        // if point is outside, we pull it to the edge).
        const inGamut = this.isPointInTriangle([cx, cy], this.GAMUT_C.red as [number, number], this.GAMUT_C.green as [number, number], this.GAMUT_C.blue as [number, number]);

        if (!inGamut) {
            console.log(`[HUE ENGINE] Clamping color ${hex} to Gamut C edge`);
            const p = [cx, cy] as [number, number];
            const p_rg = this.getClosestPointOnLine(p, this.GAMUT_C.red as [number, number], this.GAMUT_C.green as [number, number]);
            const p_gb = this.getClosestPointOnLine(p, this.GAMUT_C.green as [number, number], this.GAMUT_C.blue as [number, number]);
            const p_br = this.getClosestPointOnLine(p, this.GAMUT_C.blue as [number, number], this.GAMUT_C.red as [number, number]);

            const dist_rg = Math.sqrt(Math.pow(p[0] - p_rg[0], 2) + Math.pow(p[1] - p_rg[1], 2));
            const dist_gb = Math.sqrt(Math.pow(p[0] - p_gb[0], 2) + Math.pow(p[1] - p_gb[1], 2));
            const dist_br = Math.sqrt(Math.pow(p[0] - p_br[0], 2) + Math.pow(p[1] - p_br[1], 2));

            let min = dist_rg;
            let finalP = p_rg;
            if (dist_gb < min) { min = dist_gb; finalP = p_gb; }
            if (dist_br < min) { finalP = p_br; }
            
            cx = finalP[0];
            cy = finalP[1];
        }

        return [cx, cy];
    }

    /**
     * Extracts Hue-compatible brightness (0-254) from a HEX string using luminance
     */
    hexToBri(hex: string): number {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Relative luminance formula
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Map to Hue scale (maximize for tactical, but respect darkness)
        // We use a floor of 40 to ensure it's never completely off
        return Math.round(40 + (lum * 214));
    }

    // ------------------------------------------------------------------------
    // Software Effects Engine
    // ------------------------------------------------------------------------

    private getRandomFloat(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    private applyXyVariance(baseXy: [number, number], range: number): [number, number] {
        return [
            baseXy[0] + this.getRandomFloat(-range, range),
            baseXy[1] + this.getRandomFloat(-range, range)
        ];
    }

    /**
     * **Combien de lampes jouent cet effet en ce moment.**
     *
     * Relu à **chaque battement** par les effets adaptatifs : une lampe qui
     * rejoint ou quitte change le partage du budget, et les autres doivent s'en
     * apercevoir. *Une part calculée une fois ment dès que le nombre de convives
     * change.*
     */
    private lampesEnEffet(effectName: string): number {
        const n = Object.values(useLightStore.getState().lights)
            .filter(l => l.state?.effect === effectName).length;
        return n || 1;
    }

    /**
     * La vitesse qui règle l'effet d'une lampe : celle de la scène qui l'a
     * allumé, ou la cadence d'origine si l'effet a été choisi à la main.
     */
    private vitesseDeLEffet(id: string): number {
        const sceneId = this.sceneDeLEffet[id];
        if (!sceneId) return VITESSE_EFFET_DEFAUT;
        return useLightStore.getState().scenes[sceneId]?.effectSpeed ?? VITESSE_EFFET_DEFAUT;
    }

    /**
     * L'intensité qui règle l'effet d'une lampe : celle de la scène qui l'a
     * allumé, ou la pleine brillance si l'effet a été choisi à la main.
     *
     * Elle est relue **à chaque battement** — c'est ce qui fait qu'un curseur
     * poussé pendant qu'une bougie brûle se voit sans rien replanifier.
     */
    private intensiteDeLEffet(id: string): number {
        const sceneId = this.sceneDeLEffet[id];
        if (!sceneId) return INTENSITE_SCENE_DEFAUT;
        return useLightStore.getState().scenes[sceneId]?.sceneBrightness ?? INTENSITE_SCENE_DEFAUT;
    }

    /**
     * **Répercute tout de suite le curseur d'une tuile.**
     *
     * Sans ça, un effet lent (le crépuscule bat toutes les 10 s) n'apprendrait
     * sa nouvelle vitesse qu'au tour suivant — jusqu'à dix secondes après que le
     * meneur a lâché le curseur, ce qui se lit comme un réglage qui ne marche pas.
     */
    appliquerVitesseDeScene(sceneId: string) {
        Object.keys(this.replanifierEffet).forEach(id => {
            if (this.sceneDeLEffet[id] === sceneId && this.softwareEffectIntervals[id]) {
                this.replanifierEffet[id]();
            }
        });
    }

    /**
     * **Répercute le curseur d'intensité d'une tuile sur la pièce.**
     *
     * Deux moitiés, et elles ne se ressemblent pas :
     * - les lampes **sous un effet** n'ont rien à recevoir — leur boucle relit
     *   l'intensité à chaque battement (voir {@link intensiteDeLEffet}) ;
     * - les lampes **posées** ne rebattent jamais : sans ce rejeu, le curseur
     *   ne ferait rien avant la prochaine activation de la tuile.
     *
     * Rien n'est envoyé si la tuile n'est pas celle qui joue : *un réglage
     * gardé pour tout à l'heure ne doit pas allumer la pièce maintenant.*
     */
    appliquerIntensiteDeScene(sceneId: string) {
        if (useLightStore.getState().activeSceneId !== sceneId) return;

        if (this.minuterieIntensite) clearTimeout(this.minuterieIntensite);
        this.minuterieIntensite = setTimeout(() => {
            this.minuterieIntensite = null;
            void this.rejouerIntensite(sceneId);
        }, DELAI_INTENSITE_MS);
    }

    /** Renvoie les lampes posées d'une scène à la brillance voulue, une par une. */
    private async rejouerIntensite(sceneId: string) {
        /*
          Un rejeu parle au pont pendant plusieurs centaines de millisecondes.
          Si le curseur bouge encore pendant ce temps, on ne double pas les
          commandes : on redemande un rejeu, qui repartira dans un quart de
          seconde avec la valeur du moment.
        */
        if (this.rejeuIntensiteEnCours) {
            this.appliquerIntensiteDeScene(sceneId);
            return;
        }

        const scene = useLightStore.getState().scenes[sceneId];
        if (!scene) return;
        const intensite = scene.sceneBrightness ?? INTENSITE_SCENE_DEFAUT;

        this.rejeuIntensiteEnCours = true;
        try {
            for (const [id, state] of Object.entries(scene.lightStates)) {
                if (state.effect && state.effect !== 'none') continue;
                if (useLightStore.getState().activeSceneId !== sceneId) break;
                await this.setLightState(id, state, TRANSITION_INTENSITE_MS, intensite);
                await new Promise(r => setTimeout(r, 100));
            }
        } catch {
            // Pont injoignable : le réglage reste gardé, il jouera à la prochaine activation.
        } finally {
            this.rejeuIntensiteEnCours = false;
        }
    }

    /**
     * **Arrête l'effet logiciel d'une lampe.**
     *
     * ─────────────────────────────────────────────────────────────────────────
     * ⭐ `restaurerLEtat` — ET POURQUOI IL EST FAUX PAR DÉFAUT
     * ─────────────────────────────────────────────────────────────────────────
     *
     * Une boucle d'effet écrit `bri`, `xy` et `on` **directement sur le pont**,
     * en contournant `setLightState` pour ne pas faire rendre React dix fois
     * par seconde. Le magasin garde donc l'état *d'avant l'effet* — c'est
     * précisément ce qui rend la restauration possible : il suffit de le
     * renvoyer.
     *
     * ⛔ **Mais presque personne ne la veut.** Sur les neuf appels de cette
     * méthode, **un seul** : le geste « Fixe » du pied de page, qui n'est
     * suivi de rien. Les huit autres posent un état juste après — une scène,
     * un flash tactique, une extinction — et une restauration y serait une
     * commande pour rien, dans un budget qui en tient dix par seconde.
     *
     * ⚠️ **Deux appels la poseraient même à l'envers.** `handleColorChange` et
     * `toggleLight` appellent `setLightState` **avant**, *sans l'attendre* :
     * le magasin n'est pas encore à jour quand on arrive ici. Restaurer y
     * renverrait l'état **précédent** — la couleur que l'utilisateur vient de
     * choisir serait effacée par son propre geste.
     *
     * *C'est la quatrième fois dans ce module que trois gestes de retour ne
     * visent pas la même chose. On ne les aligne pas : on les nomme.*
     *
     * @param fin ce qu'on laisse à la lampe. Voir {@link FinDEffet} — le
     *   défaut ne pose rien, parce que **presque personne ne veut autre chose**.
     */
    stopSoftwareEffect(id: string, fin: FinDEffet = 'sansRien') {
        if (this.softwareEffectIntervals[id]) {
            clearInterval(this.softwareEffectIntervals[id]);
            delete this.softwareEffectIntervals[id];
        }
        delete this.sceneDeLEffet[id];
        delete this.cadencePlanifiee[id];
        delete this.replanifierEffet[id];
        // Périme toute boucle encore suspendue sur une réponse du pont.
        this.generationEffet[id] = (this.generationEffet[id] ?? 0) + 1;
        useLightStore.getState().updateLightState(id, { effect: 'none' });

        if (useLightStore.getState().status !== 'connected') return;

        /*
          **Une seule commande, jamais deux.** L'arrêt de l'effet natif et la
          restauration voyagent ensemble : les séparer doublerait le trafic sur
          un pont qui est déjà la ressource rare de ce module.
        */
        const charge: Record<string, unknown> = { effect: 'none' };
        if (fin === 'rendreLEtat') {
            const global = useLightStore.getState().globalBrightness;
            Object.assign(charge, etatARendre(
                useLightStore.getState().lights[id]?.state,
                (bri) => brillanceEffective(bri, global),
            ));
        } else if (fin === 'eteindre') {
            /*
              ⚠️ **Le magasin doit l'apprendre, lui aussi.** La boucle d'effet
              écrit sur le pont sans passer par `setLightState` ; si on éteint
              sans le dire au magasin, l'interrupteur de la tuile resterait
              allumé sur une lampe éteinte — *et le geste suivant du meneur
              serait de l'éteindre une seconde fois, sans effet visible.*
            */
            charge.on = false;
            charge.transitiontime = EXTINCTION_DS;
            useLightStore.getState().updateLightState(id, { on: false });
        }

        this.request('PUT', `/lights/${id}/state`, charge).catch(() => { });
    }



    /**
     * Démarre un effet logiciel sur une lampe.
     *
     * `sceneId` dit **d'où vient l'effet**, et donc quelle vitesse le règle : un
     * effet lancé depuis une tuile suit le curseur de cette tuile, un effet
     * choisi à la main dans le pied de page garde sa cadence d'origine.
     */
    startSoftwareEffect(id: string, effectName: string, baseState?: HueLightState, sceneId?: string) {
        this.stopSoftwareEffect(id);

        const generation = (this.generationEffet[id] ?? 0) + 1;
        this.generationEffet[id] = generation;
        /** Cette boucle est-elle toujours celle de l'effet en cours ? */
        const toujoursALaBarre = () => this.generationEffet[id] === generation;

        this.sceneDeLEffet[id] = sceneId ?? null;
        useLightStore.getState().updateLightState(id, { effect: effectName });

        // If mock, just register
        if (useLightStore.getState().status === 'mock') {
            console.log(`[MOCK] Start effect ${effectName} on ${id}`);
            return;
        }

        const state = baseState || useLightStore.getState().lights[id]?.state;
        if (!state) return;

        if (effectName === 'colorloop') {
            console.log(`[Light OS] Starting native colorloop on ${id}`);
            this.request('PUT', `/lights/${id}/state`, { effect: 'colorloop' }).catch(() => { });
            return;
        }

        /*
          ⭐ **UNE AMBIANCE DU MENEUR JOUE LE CORPS D'UN AUTRE EFFET.**

          Une variante n'a pas de `case` : elle emprunte celui de sa source, et
          ne change que ce qui se pose **après** — la teinte et le rythme. C'est
          la seule forme possible, parce que **36 des 47 effets écrivent leur
          palette en dur** : pour eux, poser une couleur avant de lancer l'effet
          ne fait rien du tout. *Le curseur de couleur existait, il n'avait
          simplement aucun effet sur ces trente-six.*

          ⚠️ Une variante dont la source a disparu ne joue **rien** — le
          `switch` n'a pas de `default`. On s'arrête donc ici en le disant, plutôt
          que de laisser une lampe muette et un meneur qui cherche pourquoi.
        */
        const variante = estUneVariante(effectName)
            ? useLightStore.getState().variantes.find(
                v => v.id === idDepuisLIdentifiant(effectName))
            : undefined;

        if (estUneVariante(effectName) && !variante) {
            console.warn(
                `[Light OS] L'ambiance ${effectName} n'existe plus : rien à jouer sur ${id}.`,
            );
            return;
        }

        /** Le corps d'effet réellement joué : la source d'une variante, ou l'effet lui-même. */
        const effectName_ = variante ? variante.source : effectName;

        /** La teinte vers laquelle la palette est tirée, si l'ambiance en pose une. */
        const cibleDeTeinte = variante?.teinte ? this.hexToXy(variante.teinte) : null;

        let interval = 250; // Minimum 250ms for performance stability
        let tick = 0;
        /**
         * Les battements de rafale restants — l'état propre à `fusillade`.
         *
         * Il vit ici, dans la fermeture de la boucle de **cette** lampe : deux
         * lampes en fusillade ont chacune le sien, et c'est exactement ce qui
         * les décale. *Le désordre est la fonctionnalité.*
         */
        let rafale = RAFALE_AU_REPOS;
        /**
         * ⭐ **La catégorie qui manquait : le COUP UNIQUE.**
         *
         * Les effets d'origine sont tous des **boucles** — des ambiances. Or une
         * déflagration, un impact, un sort qui part sont des **ponctuations** :
         * ça arrive une fois et ça retombe. Le moteur n'en avait aucune notion.
         *
         * Un coup unique pose ici **ce qu'il laisse derrière lui** quand il a
         * fini de retomber, et la boucle s'arrête de cette façon-là.
         *
         * ⚠️ *Ce n'était pas possible avant le 2026-09-17* : tant que l'arrêt ne
         * restaurait rien, une explosion aurait laissé la pièce dans sa dernière
         * braise. Le prérequis n'était pas une politesse, c'était la condition.
         *
         * ⭐ **Et ce n'est pas un booléen**, parce qu'il y a trois fins et non
         * deux : *l'impact rend la lumière d'avant, l'explosion laisse le noir.*
         * Le premier jet écrivait `fini = true` — la fin était donc la même pour
         * tout le monde, et le noir de l'explosion n'avait nulle part où
         * s'écrire.
         */
        let fini: FinDEffet | null = null;

        /*
          **Deux familles d'effets.** Les « dynamiques » recalculent leur attente
          à chaque tour (un néon grésille court puis tient long) : ils se
          replanifient un tour à la fois. Les autres battent à cadence fixe.
        */
        const dynamique = [
            'glitch', 'tv', 'lightning', 'neon', 'heartbeat', 'flashlight',
            'lumiere-ville', 'cyber-night', 'terminal', 'stroboscope', 'neant',
            'trou-noir', 'hyperspace', 'reacteur', 'fusillade',
            'deflagration', 'impact', 'panne', 'sonar', 'incendie'
        ].includes(effectName_);

        /**
         * L'attente du prochain tour, vitesse de la scène **et** de l'ambiance
         * comprises.
         *
         * ⚠️ Les deux se **multiplient**, elles ne se substituent pas. Une scène
         * ralentie qui joue une ambiance rapide doit donner quelque chose entre
         * les deux — *si l'une écrasait l'autre, un des deux curseurs mentirait,
         * et le meneur ne saurait pas lequel.*
         */
        const cadenceVoulue = () => cadenceEffective(
            interval,
            this.vitesseDeLEffet(id) * (variante?.vitesse ?? 1),
        );

        const loop = async () => {
            if (!toujoursALaBarre()) return;

            /*
              ⭐ **Cette lampe a-t-elle encore le droit de jouer ?**

              Douze effets à cadence soutenue dépassent le budget du pont dès
              quatre lampes — les trois plus rapides d'un facteur quatre. Plutôt
              que de tout ralentir (*un stroboscope ralenti cesse d'être un
              stroboscope*), on en fait jouer **moins, à la bonne vitesse**.

              Le contrôle est **ici, à chaque battement, et pas au démarrage** :
              les lampes d'une scène partent l'une après l'autre, et la première
              ne sait pas encore combien la rejoindront. Celle qui découvre
              qu'elle est en trop s'arrête — *en se restaurant*, donc en
              retrouvant la couleur que la scène lui avait posée.
            */
            const admis = solistesAdmis(effectName_);
            if (admis !== null) {
                /*
                  ⛔ **Le comptage se fait sur la SOURCE, pas sur le nom
                  affiché.** Une lampe qui joue une ambiance porte l'identifiant
                  de l'ambiance, pas celui de l'effet dont elle descend. Deux
                  ambiances tirées de `fusillade` sur deux lampes coûtent au pont
                  exactement ce que coûtent deux fusillades — les compter
                  séparément les déclarerait solistes toutes les deux, et le
                  budget serait dépassé sans que rien ne le dise.

                  *C'est la même famille de défaut que la tablette qui offrait les
                  paquets d'un autre jeu : deux lecteurs d'une même liste, dont
                  un seul connaît la règle.*
                */
                const variantes = useLightStore.getState().variantes;
                const sourceDe = (effet: string | undefined): string | undefined => {
                    if (!estUneVariante(effet)) return effet ?? undefined;
                    return variantes.find(v => v.id === idDepuisLIdentifiant(effet!))?.source;
                };
                const memeEffet = Object.entries(useLightStore.getState().lights)
                    .filter(([, l]) => sourceDe(l.state?.effect) === effectName_)
                    .map(([idLampe]) => idLampe);
                if (!estSoliste(id, memeEffet, admis)) {
                    this.stopSoftwareEffect(id, 'rendreLEtat');
                    return;
                }
            }

            const freshState = useLightStore.getState().lights[id]?.state || state;
            const payload: Record<string, unknown> = {};
            /*
              ⭐ **Il n'y a plus de `baseBri`, et c'est le résultat de la journée.**

              Neuf effets partaient de la **brillance courante de la lampe**. Le
              pied de page, lui, n'amorce que la *couleur* — jamais la brillance.
              Un effet n'avait donc pas une forme, il en avait autant qu'il y a
              de lampes : une respiration collée au plafond la moitié du cycle
              sur une lampe à 254, une bougie qui éclairait la pièce.

              ⭐ ***L'effet possède sa forme, le curseur possède son niveau.***
              Chaque effet déclare désormais sa bande absolue, et
              `brillanceEffective` applique par-dessus l'intensité de la tuile et
              la brillance globale — c'est là, et seulement là, que se règle
              « à quel point c'est fort ».

              `baseXy` reste, et c'est voulu : le pied de page pose la couleur
              par défaut de l'effet avant de le lancer, et une scène pose la
              sienne. *Celui-là n'est pas emprunté à la lampe, il est choisi.*
            */
            const baseXy = freshState.xy || [0.4, 0.4];

            switch (effectName_) {
                /*
                  ─────────────────────────────────────────────────────────────
                  ⭐ TROIS FEUX, ET CE NE SONT PAS TROIS RÉGLAGES
                  ─────────────────────────────────────────────────────────────

                  ⛔ **`candle` et `fire` étaient le MÊME effet** jusqu'au
                  2026-09-17 : corps partagé, même amplitude, même variance. La
                  seule différence était la couleur posée par le pied de page —
                  *« Feu » n'était qu'une bougie orange.*

                  David, en le découvrant : *« feu de camp, bougie et incendie ce
                  n'est pas la même chose »*. Les séparer par la seule amplitude
                  en aurait fait trois réglages du même effet. **Chacun reçoit
                  donc un geste qui n'appartient qu'à lui** :

                  | | Le geste | Ce qu'on reconnaît |
                  | --- | --- | --- |
                  | Bougie | elle **manque de s'éteindre** puis repart | la flamme minuscule sur une mèche trop longue |
                  | Feu de camp | il **crépite** — une brindille qui claque | le foyer qui respire |
                  | Incendie | il **s'embrase**, et il **prend** | la poutre qui cède |
                */
                case 'candle': {
                    /*
                      ⛔ **Elle partait de la brillance courante de la lampe.**
                      Sur une lampe à 254, la bougie éclairait la pièce — *et une
                      bougie qui éclaire la pièce n'est pas une bougie.* Les deux
                      autres feux ont reçu leur bande le 2026-09-17, pas elle.
                    */
                    const milieu = (BANDE_DE_LA_BOUGIE.bas + BANDE_DE_LA_BOUGIE.haut) / 2;
                    const amplitude = (BANDE_DE_LA_BOUGIE.haut - BANDE_DE_LA_BOUGIE.bas) / 2;
                    payload.xy = this.applyXyVariance(baseXy, 0.015);
                    if (Math.random() > 0.96) {
                        /* Le courant d'air : elle tombe presque à rien, et
                           revient. *C'est ça qu'on reconnaît d'une bougie — pas
                           son tremblement, sa fragilité.* */
                        payload.bri = BOURRASQUE;
                        payload.transitiontime = 1;
                    } else {
                        payload.bri = Math.round(milieu + this.getRandomFloat(-amplitude, amplitude));
                        payload.transitiontime = 2;
                    }
                    break;
                }

                /*
                  **Feu de camp — il tient sa bande, et c'est ce qui le définit.**

                  ⛔ **Première version ratée, vue à l'écran par David le
                  2026-09-17 :** *« j'ai l'impression que feu de camp et incendie
                  sont pareil »*. Ils l'étaient. Deux couleurs de départ à peine
                  distinctes (`#ff4500` / `#ff5a00`), quatre braises sur six
                  proches de l'une d'elles, deux embrasements aux probabilités
                  identiques (6 % / 7 %), et ±70 contre ±90 d'amplitude — *28 %
                  d'écart, que l'œil ne voit pas sur une lampe.*

                  ⭐ **La faute n'était pas dans les réglages, elle était dans le
                  mécanisme** : les deux faisaient varier la brillance et la
                  couleur **indépendamment, au hasard**. Deux bruits aléatoires
                  autour d'un orange donnent le même résultat quelles que soient
                  leurs amplitudes. *J'ai réglé des curseurs là où il fallait
                  changer de mécanisme.*

                  Ce qui les sépare désormais : **ils n'occupent plus la même
                  plage de lumière.** Un foyer vit entre 80 et 175 — il ne monte
                  jamais au blanc et ne s'effondre jamais. C'est une flaque de
                  lumière chaude, pas un éclairage de pièce.
                */
                case 'fire':
                    if (Math.random() > 0.95) {
                        /* La brindille qui claque : bref, plus clair, jamais blanc. */
                        payload.bri = 200;
                        payload.transitiontime = 0;
                        payload.xy = this.hexToXy('#ffb45a');
                    } else {
                        /* Une respiration lente, et un grain par-dessus. */
                        payload.bri = Math.round(125 + Math.sin(tick * 0.35) * 32 + this.getRandomFloat(-18, 18));
                        payload.transitiontime = 2;
                        payload.xy = this.applyXyVariance(this.hexToXy('#ff8a1e'), 0.012);
                    }
                    break;

                /*
                  **Incendie — une seule variable pilote tout.**

                  ⭐ **C'est le correctif de fond.** Dans une flamme réelle, le
                  plus chaud est le plus brillant **et** le plus blanc ; la fumée
                  qui retombe est sombre **et** rouge profond. Faire tirer `bri`
                  et `xy` séparément produit du bruit orange ; les faire tirer
                  **ensemble** produit du feu.

                  `chaleur` va de 0 (braise mourante, rouge sang, sombre) à 1
                  (cœur blanc-jaune, plein éclat), et règle les deux à la fois.
                  L'exposant la biaise vers le haut : *un incendie rage, il
                  n'hésite pas.*

                  ⛔ **Et il part déjà haut.** La première version montait d'un
                  socle de 110 sur une minute : pendant les vingt premières
                  secondes, l'incendie était donc **plus sombre qu'un feu de
                  camp**. L'idée du « feu qui prend » était jolie et coûtait
                  précisément le moment où on le déclenche. Supprimée.
                */
                case 'incendie': {
                    /* La corrélation vit dans `logic/echelleDuFeu` — c'est elle
                       qui était fausse, c'est donc elle qui est testée. */
                    const feu = etatDuFeu(tirerLaChaleur());
                    payload.transitiontime = 1;
                    payload.bri = feu.bri;
                    payload.xy = this.hexToXy(feu.hex);
                    interval = cadencePartagee(180, this.lampesEnEffet('incendie'));
                    break;
                }

                case 'lightning':
                    payload.transitiontime = 0;
                    if (Math.random() > 0.94) { // 6 % de chance d'éclair
                        payload.bri = 254;
                        payload.xy = this.hexToXy('#ffffff');
                    } else {
                        /*
                          ⛔ **Le gris n'existe pas pour une lampe.** `#808080`
                          a exactement la chromaticité du blanc — seule la
                          luminance les sépare, et c'est `bri` qui la porte. Ce
                          `xy` était donc une commande pour rien, dans un budget
                          de pont qui en tient dix par seconde.
                          *On baisse la brillance, on ne « teinte » pas en gris.*
                        */
                        payload.bri = 20;
                    }
                    interval = 250;
                    break;

                /*
                  ⭐ **Déflagration** — un coup unique, puis le noir.

                  ⛔ **Deux reproches de David le 2026-09-17**, l'un et l'autre
                  écrits dans l'ancien code : *« explosion ne dure pas assez
                  longtemps et à la fin cela doit devenir noir »*. Elle durait
                  **1,54 s** — quatre images — et sa fin **rendait à la lampe
                  l'état d'avant**, donc la lumière revenait.

                  Les images vivent maintenant dans `logic/deflagration`, où la
                  durée est une **somme lisible** et non le total muet de quatre
                  `interval` posés dans quatre branches. *Une valeur qui n'existe
                  que comme somme de morceaux ne peut être ni relue, ni vérifiée.*
                */
                case 'deflagration': {
                    const image = imageDeDeflagration(tick);
                    if (image) {
                        payload.transitiontime = image.transitiontime;
                        payload.bri = image.bri;
                        payload.xy = this.hexToXy(image.hex);
                        interval = image.interval;
                    } else {
                        /* ⭐ Le noir n'est pas une image : c'est la commande
                           d'arrêt, qui porte `on: false`. *Une seule commande,
                           jamais deux.* */
                        fini = 'eteindre';
                    }
                    break;
                }

                /*
                  ⭐ **Impact** — le coup unique le plus court du catalogue :
                  deux commandes. *Une balle qui touche, un sort qui frappe.*
                */
                case 'impact':
                    if (tick === 0) {
                        payload.transitiontime = 0;
                        payload.bri = 254;
                        payload.xy = this.hexToXy('#ff2000');
                        interval = 100;
                    } else if (tick === 1) {
                        payload.transitiontime = 2;
                        payload.bri = 25;
                        interval = 260;
                    } else {
                        /* *Un impact n'éteint pas la pièce* — contrairement à
                           l'explosion, il rend la lumière qu'il a empruntée. */
                        fini = 'rendreLEtat';
                    }
                    break;

                /*
                  **Panne de courant.** Grésillement, chute, deux relances qui
                  échouent, puis le noir — et ça recommence. *Une panne qui ne se
                  répète pas serait un coup unique ; celle-ci est une ambiance :
                  le courant n'arrête pas de lâcher.*
                */
                case 'panne': {
                    const phaseDePanne = tick % 14;
                    payload.xy = this.hexToXy('#fff3d0');
                    if (phaseDePanne < 4) {
                        payload.transitiontime = 0;
                        payload.bri = Math.random() > 0.4 ? 200 : 30;
                        interval = 110;
                    } else if (phaseDePanne === 4) {
                        payload.transitiontime = 2;
                        payload.bri = 1;
                        interval = 2200;
                    } else if (phaseDePanne === 6 || phaseDePanne === 9) {
                        payload.transitiontime = 0;
                        payload.bri = 160;
                        interval = 130;
                    } else {
                        payload.transitiontime = 3;
                        payload.bri = 1;
                        interval = 1400 + Math.random() * 1600;
                    }
                    break;
                }

                /*
                  **Torche qui faiblit.** Le feu, mais dont la braise baisse sur
                  une dizaine de minutes jusqu'à un rougeoiement. ⭐ *Redoutable
                  en donjon : personne ne voit que ça descend, et au bout d'une
                  heure tout le monde parle moins fort.*
                */
                case 'torche': {
                    /* De 200 à 35 en une dizaine de minutes, à 400 ms le battement. */
                    const braise = Math.max(35, 200 - tick * 0.11);
                    payload.transitiontime = 3;
                    payload.bri = Math.max(10, braise + this.getRandomFloat(-25, 25));
                    payload.xy = this.applyXyVariance(this.hexToXy('#ff8c21'), 0.012);
                    interval = 400;
                    break;
                }

                /*
                  **Sonar.** Presque noir, et une pulsation toutes les quatre
                  secondes. *Deux commandes par cycle : l'effet le moins cher du
                  catalogue, et l'un des plus efficaces.*
                */
                case 'sonar':
                    if (tick % 2 === 0) {
                        payload.transitiontime = 0;
                        payload.bri = 200;
                        payload.xy = this.hexToXy('#22d3ee');
                        interval = 200;
                    } else {
                        payload.transitiontime = 8;
                        payload.bri = 6;
                        interval = 3800;
                    }
                    break;

                /*
                  **Sirène lointaine.** Le rouge monte et redescend sans jamais
                  claquer — *l'inverse exact du gyrophare, qui est dans la pièce ;
                  celle-ci est au bout de la rue.*
                */
                case 'sirene':
                    payload.transitiontime = 15;
                    payload.bri = Math.max(10, 90 + Math.sin(tick * 0.9) * 80);
                    payload.xy = this.hexToXy('#dc2626');
                    interval = 1500;
                    break;

                /*
                  **Chute de tension.** Une dérive très lente du blanc vers
                  l'ambre sale, et retour. *Invisible sur l'instant, oppressant
                  sur une heure* — c'est là que le Hue est le meilleur.
                */
                case 'chute-de-tension': {
                    const paliers = ['#fff7ed', '#ffe6bf', '#f5c98a', '#d9a55f', '#f5c98a', '#ffe6bf'];
                    payload.transitiontime = 100;
                    payload.xy = this.hexToXy(paliers[tick % paliers.length]);
                    payload.bri = 130 - Math.abs(3 - (tick % 6)) * 12;
                    interval = 10000;
                    break;
                }

                /*
                  **La fusillade.** Le rythme entier vit dans
                  `logic/cadenceDeFusillade` — rafales courtes, pauses longues,
                  et ⭐ **une pause dont le plancher dépend du nombre de lampes
                  qui tirent** : c'est ce qui tient le budget du pont sans
                  renoncer au crépitement.

                  Le compte des lampes se relit **à chaque battement**, jamais
                  au démarrage : une lampe qui rejoint ou quitte la fusillade
                  change le partage du budget, et les autres doivent s'en
                  apercevoir. *Une part calculée une fois ment dès que le
                  nombre de convives change.*
                */
                case 'fusillade': {
                    const battement = prochainBattement(rafale, this.lampesEnEffet('fusillade'));
                    rafale = battement.etat;

                    payload.transitiontime = 0;
                    if (battement.eclair) {
                        payload.bri = 254;
                        /* Un éclair de bouche est un blanc chaud, pas un blanc
                           de projecteur. */
                        payload.xy = this.hexToXy('#fff4e0');
                    } else {
                        /* ⛔ Le noir se joue à 1, jamais à 0 : la plage d'une
                           lampe Hue est 1–254, et zéro n'éteint pas. Une pièce
                           en fusillade n'est de toute façon pas noire. */
                        payload.bri = 1;
                    }
                    interval = battement.attenteMs;
                    break;
                }

                case 'police':
                    /*
                      ⛔ **Un gyrophare claque, il ne fond pas.** À 200 ms de
                      fondu pour 300 ms de battement, les deux tiers du cycle
                      étaient un dégradé rouge-violet-bleu : on ne voyait
                      jamais ni le rouge ni le bleu purs.
                    */
                    payload.transitiontime = 0;
                    payload.bri = 254;
                    payload.xy = (tick % 2 === 0) ? this.hexToXy('#ff0000') : this.hexToXy('#0000ff');
                    interval = 300;
                    break;

                /*
                  **Arcane** — la même faute que `breathing`, en plus lent :
                  18,8 s de période sur un socle emprunté à la lampe. Il garde son
                  geste propre — *une chose qui respire lentement et fort*, avec
                  une **apnée** au sommet qui inquiète — et sa dérive de couleur.
                */
                case 'arcane': {
                    const image = imageDuSouffle(SOUFFLES.arcane, tick);
                    payload.transitiontime = image.transitiontime;
                    payload.bri = image.bri;
                    payload.xy = this.applyXyVariance(baseXy, 0.04);
                    interval = image.interval;
                    break;
                }

                case 'glitch':
                case 'tv':
                    payload.transitiontime = 0;
                    payload.bri = Math.random() > 0.5 ? 254 : 10;
                    interval = 200 + Math.random() * 200;
                    break;

                case 'warp':
                    payload.transitiontime = 1;
                    if (tick % 3 === 0) payload.xy = this.hexToXy('#ff0000');
                    else if (tick % 3 === 1) payload.xy = this.hexToXy('#00ff00');
                    else payload.xy = this.hexToXy('#0000ff');
                    interval = 200;
                    break;

                /*
                  **Sous l'eau** — la pire des cinq : **62,8 secondes** de période.
                  À l'œil, une lampe qui ne bouge pas.

                  C'est une **houle**, donc le seul souffle du catalogue *sans
                  apnée ni repos* : elle ne s'arrête jamais. La dérive de couleur
                  porte les caustiques.
                */
                case 'underwater': {
                    const image = imageDuSouffle(SOUFFLES.underwater, tick);
                    payload.transitiontime = image.transitiontime;
                    payload.bri = image.bri;
                    payload.xy = this.applyXyVariance(baseXy, 0.05);
                    interval = image.interval;
                    break;
                }

                case 'dragon':
                    payload.transitiontime = 5;
                    payload.bri = 254; // bright
                    payload.xy = this.applyXyVariance(baseXy, 0.08);
                    interval = 500;
                    break;

                case 'holy':
                    payload.transitiontime = 15;
                    payload.bri = Math.max(80, Math.min(254, 170 + Math.sin(tick * 0.4) * 80));
                    payload.xy = this.applyXyVariance(baseXy, 0.02);
                    interval = 1500;
                    break;

                case 'neon':
                    payload.transitiontime = 0;
                    if (Math.random() > 0.8) {
                        payload.bri = 10;
                        interval = 100;
                    } else {
                        payload.bri = 254;
                        interval = 1500;
                    }
                    break;

                case 'heartbeat':
                    payload.transitiontime = 2;
                    if (tick % 3 === 0 || tick % 3 === 1) {
                        payload.bri = 254;
                        payload.xy = baseXy;
                        interval = 200;
                    } else {
                        payload.bri = 20;
                        interval = 1000;
                    }
                    break;

                case 'flashlight':
                    payload.transitiontime = 0;
                    if (Math.random() > 0.9) {
                        payload.bri = 50;
                        interval = 200;
                    } else {
                        payload.bri = 254;
                        interval = 800;
                    }
                    payload.xy = this.hexToXy('#ffffff');
                    break;

                /*
                  ⭐ **Radiation** — ce n'était pas un souffle, c'était un compteur.

                  Quatrième victime de la même sinusoïde (18,8 s de période), mais
                  *une contamination ne respire pas* : elle a des **bouffées
                  irrégulières** sur un fond sourd, comme l'aiguille qui s'affole
                  puis retombe. Lui donner un souffle en aurait fait un cinquième
                  réglage du même effet — **la faute des trois feux, en plus
                  discret.**
                */
                case 'radiation':
                    payload.xy = this.applyXyVariance(baseXy, 0.01);
                    if (Math.random() > 0.8) {
                        /* L'aiguille part. */
                        payload.transitiontime = 0;
                        payload.bri = 235;
                        interval = 300;
                    } else {
                        /* Le fond, qui ne rassure pas. */
                        payload.transitiontime = 4;
                        payload.bri = 70 + Math.round(this.getRandomFloat(-12, 12));
                        interval = 1000;
                    }
                    break;

                /*
                  ⭐ **Respiration** — un souffle, pas une marée.

                  ⛔ David le 2026-09-17, après avoir essayé tout le catalogue :
                  *« je ne suis pas convaincu par tous, par exemple respiration »*.
                  L'ancienne formule — `baseBri + sin(tick * 0.3) * 100`, un point
                  toutes les 2 s — avait une période mesurée de **41,9 secondes**.
                  Un souffle humain en dure 4 à 5.

                  Deux fautes d'un coup, et aucune n'était un réglage :
                  *la période était illisible* (`0,3` ne ressemble pas à quarante
                  secondes), et *le socle était la brillance courante de la lampe*
                  — que le pied de page n'amorce jamais. Sur une lampe à 254, la
                  moitié du cycle était collée au plafond.
                */
                case 'breathing': {
                    const image = imageDuSouffle(SOUFFLES.respiration, tick);
                    payload.transitiontime = image.transitiontime;
                    payload.bri = image.bri;
                    payload.xy = baseXy;
                    interval = image.interval;
                    break;
                }

                case 'lumiere-ville':
                    payload.transitiontime = 5;
                    // Sodium amber base [0.55, 0.40]
                    if (Math.random() > 0.95) { // Passing car
                        payload.bri = 254;
                        payload.xy = this.hexToXy('#ffffff');
                        payload.transitiontime = 1;
                        interval = 200;
                    } else {
                        /* ⚠️ Même faute que la bougie : le halo d'un lampadaire
                           au sodium a sa propre brillance, il n'emprunte pas
                           celle de la lampe. */
                        payload.bri = Math.round(130 + this.getRandomFloat(-20, 20));
                        payload.xy = [0.55, 0.40];
                        interval = 1000;
                    }
                    break;

                /*
                  ⚠️ **Forêt profonde — deux immobilités qui s'additionnaient.**

                  La brillance parcourait ±50 en **251 secondes** (1,25 point par
                  seconde : invisible), et la couleur alternait entre `#064e3b` et
                  `#14532d` — *deux verts sombres que rien ne distingue sur une
                  lampe.* Deux mouvements dont aucun ne bougeait.

                  Son geste : **la canopée**. Une ombre verte qui dérive, et de
                  loin en loin un rai de soleil qui traverse les feuilles. *Ce
                  qu'on reconnaît d'un sous-bois, c'est le contraste entre les
                  deux, pas la teinte moyenne.*
                */
                case 'foret-profonde':
                    if (Math.random() > 0.93) {
                        payload.transitiontime = 8;
                        payload.bri = 175;
                        payload.xy = this.hexToXy('#b7d96b');
                        interval = 2500;
                    } else {
                        payload.transitiontime = 25;
                        payload.bri = Math.round(this.getRandomFloat(45, 95));
                        payload.xy = this.applyXyVariance(this.hexToXy('#0f3d22'), 0.02);
                        interval = 3000;
                    }
                    break;

                case 'cyber-night':
                    payload.transitiontime = 0;
                    const cyberColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0000'];
                    payload.xy = this.hexToXy(cyberColors[Math.floor(Math.random() * cyberColors.length)]);
                    payload.bri = Math.random() > 0.2 ? 254 : 50;
                    interval = 150 + Math.random() * 300;
                    break;

                case 'disco':
                    /*
                      ⛔ **Un `xy` tiré au hasard n'est pas une couleur.**
                      `[Math.random(), Math.random()]` tombait hors du triangle
                      de la lampe une fois sur deux, et pouvait être carrément
                      invalide (`x + y > 1`). C'était le **seul** effet du
                      catalogue à contourner le calage de gamut d'`hexToXy` —
                      d'où des couleurs que le pont ramenait où il pouvait.
                      *On tire une teinte, pas un point du plan.*

                      Le fondu passe à zéro pour la même raison que le
                      gyrophare : à 200 ms pour 300 ms de battement, la piste
                      ne changeait jamais vraiment de couleur.
                    */
                    payload.transitiontime = 0;
                    const discoColors = [
                        '#ff0000', '#ff7f00', '#ffff00', '#7fff00',
                        '#00ff00', '#00ff7f', '#00ffff', '#007fff',
                        '#0000ff', '#7f00ff', '#ff00ff', '#ff007f',
                    ];
                    payload.xy = this.hexToXy(discoColors[Math.floor(Math.random() * discoColors.length)]);
                    payload.bri = 254;
                    interval = 300;
                    break;

                case 'aurore':
                    payload.transitiontime = 50;
                    const auroreColors = ['#22c55e', '#3b82f6', '#a855f7'];
                    payload.xy = this.hexToXy(auroreColors[tick % auroreColors.length]);
                    payload.bri = 120 + Math.sin(tick * 0.2) * 60;
                    interval = 5000;
                    break;

                case 'lave':
                    payload.transitiontime = 15;
                    payload.bri = 180 + Math.sin(tick * 0.4) * 70;
                    payload.xy = (tick % 2 === 0) ? this.hexToXy('#ff4500') : this.hexToXy('#8b0000');
                    interval = 1500;
                    break;

                case 'fantome':
                    payload.transitiontime = 10;
                    /*
                      Deux corrections d'un coup, même famille que le
                      stroboscope :

                      ⛔ `bri: 0` ne coupe pas (plage 1–254) — la disparition
                      du fantôme se jouait donc à une brillance minimale, pas à
                      l'extinction. Elle y reste, mais dans la plage valide.

                      ⚠️ Le fondu durait **1 s** pour un battement de 800 ms :
                      la commande suivante arrivait avant la fin du fondu, donc
                      *le fondu n'était jamais vu* — la lampe se contentait de
                      suivre. Le battement passe à 1,2 s pour lui laisser sa
                      place.
                    */
                    payload.bri = Math.random() > 0.9 ? 1 : 40 + Math.sin(tick * 0.5) * 20;
                    payload.xy = this.hexToXy('#e0f2fe');
                    interval = 1200;
                    break;

                case 'terminal':
                    payload.transitiontime = 0;
                    payload.bri = 100 + this.getRandomFloat(-30, 30);
                    payload.xy = this.hexToXy('#22c55e'); // Green terminal
                    interval = 100 + Math.random() * 100;
                    break;

                case 'stroboscope':
                    payload.transitiontime = 0;
                    /*
                      ⛔ **`bri: 0` n'éteint pas une lampe Hue.** La plage est
                      **1 à 254** ; zéro est hors spécification, et seul
                      `on: false` coupe vraiment. Le temps « noir » du
                      stroboscope était donc un temps *faible*, ce qui aplatit
                      tout le battement — David le voyait sans pouvoir le
                      nommer.

                      ⚠️ **Pourquoi pas `on: false`, qui serait le vrai
                      remède.** `stopSoftwareEffect` ne restaure ni `on` ni
                      `bri` : un stroboscope arrêté sur un temps noir
                      **laisserait la lampe éteinte**, et il faudrait la
                      rallumer à la main. *On ne répare pas un battement mou en
                      créant une lampe qui ne revient pas.* Le vrai noir attend
                      que l'arrêt sache restaurer.
                    */
                    payload.bri = (tick % 2 === 0) ? 254 : 1;
                    payload.xy = this.hexToXy('#ffffff');
                    interval = 100;
                    break;

                case 'crepuscule':
                    payload.transitiontime = 100;
                    const sunsetColors = ['#f59e0b', '#dc2626', '#7e22ce'];
                    payload.xy = this.hexToXy(sunsetColors[tick % sunsetColors.length]);
                    payload.bri = 100 - (tick % 10) * 5;
                    interval = 10000;
                    break;

                case 'toxique':
                    payload.transitiontime = 20;
                    payload.bri = 150 + Math.sin(tick * 0.5) * 80;
                    payload.xy = (tick % 2 === 0) ? this.hexToXy('#84cc16') : this.hexToXy('#facc15');
                    interval = 2000;
                    break;

                /*
                  **Zen** — il ne faisait rien : 377 s de période pour ±30 de
                  brillance, une pente de 0,5 point par seconde. *L'œil s'adapte
                  plus vite que ça.* C'est un souffle long, avec des temps morts
                  aux deux bouts — ce qui le sépare de la houle de `underwater`.
                */
                case 'zen': {
                    const image = imageDuSouffle(SOUFFLES.zen, tick);
                    payload.transitiontime = image.transitiontime;
                    payload.bri = image.bri;
                    payload.xy = this.hexToXy('#fafaf9');
                    interval = image.interval;
                    break;
                }

                case 'neant':
                    payload.transitiontime = 30;
                    if (Math.random() > 0.98) { // Sparkle
                        payload.bri = 254;
                        payload.xy = this.hexToXy('#ffffff');
                        payload.transitiontime = 0;
                        interval = 150;
                    } else {
                        payload.bri = 10 + Math.sin(tick * 0.2) * 5;
                        payload.xy = this.hexToXy('#2e1065');
                        interval = 3000;
                    }
                    break;

                case 'alerte':
                    payload.transitiontime = 2;
                    payload.bri = (tick % 2 === 0) ? 254 : 20;
                    payload.xy = this.hexToXy('#ff0000');
                    interval = 500;
                    break;

                case 'abysses':
                    payload.transitiontime = 40;
                    payload.bri = 40 + Math.sin(tick * 0.2) * 30;
                    payload.xy = this.applyXyVariance(this.hexToXy('#1e3a8a'), 0.05);
                    interval = 4000;
                    break;

                /*
                  ⚠️ **Le fondu de l'aspiration durait 2 s pour un battement de
                  1 s** : la commande suivante arrivait avant sa fin, donc *le
                  fondu n'était jamais vu* — la lampe se contentait de suivre.
                  Même défaut que `fantome` en septembre ; c'est l'audit
                  mécanique du 2026-09-17 qui l'a trouvé, pas une relecture.
                */
                case 'trou-noir':
                    payload.transitiontime = 20;
                    if (Math.random() > 0.9) { // Gravity pull
                        payload.transitiontime = 9;
                        payload.bri = 5;
                        interval = 1000;
                    } else {
                        payload.bri = 40;
                        payload.xy = this.hexToXy('#4c1d95');
                        interval = 2000;
                    }
                    break;

                case 'hyperspace':
                    payload.transitiontime = 0;
                    payload.bri = Math.random() > 0.5 ? 254 : 150;
                    payload.xy = Math.random() > 0.8 ? this.hexToXy('#ffffff') : this.hexToXy('#06b6d4');
                    interval = 100;
                    break;

                case 'reacteur':
                    payload.transitiontime = 1;
                    payload.bri = 200 + this.getRandomFloat(-54, 54);
                    payload.xy = this.applyXyVariance(this.hexToXy('#e0f2fe'), 0.02);
                    interval = 150;
                    break;

                case 'passerelle':
                    payload.transitiontime = 20;
                    payload.bri = 150 + Math.sin(tick * 0.1) * 20;
                    if (tick % 10 === 0) { // Beep blink
                        payload.bri = 254;
                        payload.transitiontime = 0;
                    }
                    payload.xy = this.hexToXy('#bae6fd');
                    interval = 2000;
                    break;

                case 'alien':
                    payload.transitiontime = 30;
                    payload.bri = 100 + Math.sin(tick * 0.3) * 60;
                    payload.xy = (tick % 2 === 0) ? this.hexToXy('#701a75') : this.hexToXy('#f97316');
                    interval = 3000;
                    break;

                /*
                  ─────────────────────────────────────────────────────────────
                  ⭐ AUBE DORÉE — une lumière TENUE, et non un lever de soleil
                  ─────────────────────────────────────────────────────────────

                  Demandé par David le 2026-09-18. ⚠️ `lever-soleil`, juste en
                  dessous, existait déjà — et il fait tout autre chose : il
                  **traverse** la nuit vers le jour, rouge profond → orange →
                  or → blanc chaud, sur cinq minutes, en montant de 40 à 254.

                  Celui-ci ne va nulle part. C'est le soleil du matin déjà
                  installé dans la pièce : un or chaud qui **respire**, comme la
                  lumière qui bouge derrière un rideau. *On ne le regarde pas
                  arriver, on s'assoit dedans.*

                  ⛔ **La distinction est écrite ici parce que ce dépôt a payé
                  son absence.** `candle` et `fire` étaient le MÊME corps, et
                  « Feu » n'était qu'une bougie orange — trouvé par David à
                  l'écran, pas par une relecture. *Deux effets dont on ne sait
                  pas dire en une phrase ce qui les sépare sont un seul effet.*

                  ⭐ **La brillance et la teinte descendent ENSEMBLE**, pilotées
                  par le même sinus. C'est la leçon des feux de camp et des
                  incendies indiscernables : *deux bruits aléatoires autour d'une
                  même teinte donnent le même résultat visuel, quelles que soient
                  leurs amplitudes.* Ici, quand la lumière faiblit elle se
                  réchauffe, exactement comme un rayon qui s'incline.

                  Cadence à 2,5 s : l'effet est lent par nature, et il ne pèse
                  quasiment rien sur un pont qui tient dix commandes par seconde.
                  *Une aube qui clignote n'est pas une aube.*
                */
                /*
                  ⭐ **STORES — l'illusion vit ENTRE les lampes, pas dans une lampe.**

                  Demandé par David le 2026-09-18 : *« de la lumière passant à
                  travers des stores (sur 2 ou 3 lumières) ? Si ce n'est pas
                  possible ce n'est pas grave »*.

                  ⛔ **Sur une seule lampe, ce ne serait qu'une pulsation de
                  plus** : une ampoule éclaire uniformément, il n'y a ni lame ni
                  ombre portée. C'est la précision « sur 2 ou 3 » qui rend l'effet
                  possible — chaque lampe se place à un endroit différent du
                  motif, l'une dans une bande claire, l'autre dans l'ombre. *La
                  pièce devient inégale, et c'est exactement ce que font des
                  stores.*

                  ⚠️ **À poser sur plusieurs lampes, donc.** Seule, elle fonctionne
                  — elle ne montre simplement pas ce pour quoi elle existe.

                  Le décalage vient de l'identifiant de la lampe, par un calcul
                  stable : des lames sont régulières, et une lampe doit retrouver
                  **sa** bande d'une scène à l'autre. La forme de la courbe et son
                  étalement vivent dans `logic/lumiereDesStores.ts`.
                */
                case 'stores': {
                    const lame = imageDesStores(tick, phaseDeLaLampe(id));
                    payload.bri = lame.bri;

                    /* La lumière qui rase une lame se réchauffe ; celle qui passe
                       tout droit reste franche. Teinte et brillance descendent
                       donc ENSEMBLE — la leçon des feux indiscernables. */
                    payload.xy = lame.part > 0.5
                        ? this.hexToXy('#fff1d0')   // plein jour, à peine chaud
                        : this.hexToXy('#e8b978');  // l'ombre, dorée

                    payload.transitiontime = 18;
                    interval = 2000;
                    break;
                }

                case 'aube-doree': {
                    /* Un cycle complet toutes les ~50 s : assez lent pour qu'on
                       ne le surprenne pas, assez vivant pour que la pièce ne
                       paraisse pas éteinte. */
                    const souffle = Math.sin(tick * 0.125);

                    /* 150 ↔ 210 : jamais assez bas pour assombrir la table,
                       jamais assez haut pour écraser les couleurs. */
                    payload.bri = Math.round(180 + souffle * 30);

                    /*
                      La teinte suit la même respiration : or clair au sommet,
                      ambre au creux. Les deux bornes restent dans les ors — on
                      respire, on ne change pas de couleur.

                      ⛔ **Première rédaction : `#ffd79a` et `#ffb347`.** David,
                      après l'avoir vue dans la pièce : *« pas assez dorée, c'est
                      trop blanc »*. Il avait raison, et le **canal bleu** le dit
                      d'un chiffre :

                      | Effet | Bleu |
                      | --- | --- |
                      | `torche` (`#ff8c21`) | 33 |
                      | l'or de `lever-soleil` (`#fbbf24`) | 36 |
                      | ⛔ mon sommet d'aube (`#ffd79a`) | **154** |

                      ⭐ *Sur une lampe Hue, c'est le bleu qui décide si une
                      couleur chaude se lit comme de l'or ou comme du blanc
                      chaud.* Quatre fois le bleu d'une torche ne pouvait pas
                      donner de l'or — et ça ne se voit pas dans un hexadécimal,
                      qui commence par `ff` dans les deux cas.

                      Les deux bornes reviennent donc dans le voisinage de la
                      torche, en gardant l'écart qui fait la respiration.
                    */
                    payload.xy = souffle > 0
                        ? this.hexToXy('#ffc247')   // bleu 71 — or clair
                        : this.hexToXy('#ff9a12');  // bleu 18 — ambre profond

                    /*
                      ⚠️ **Le fondu reste SOUS le battement**, et la première
                      rédaction s'est trompée exprès du bon côté : j'avais posé
                      3 000 ms de fondu pour 2 500 ms d'attente, en écrivant
                      dans ce commentaire que les états se fondraient « l'un dans
                      l'autre ». Le contrôle du catalogue l'a refusé, et il a
                      raison — *quand le fondu dépasse l'attente, la commande
                      suivante arrive avant la fin et la lampe n'atteint jamais
                      les extrêmes.* Le souffle aurait été plat.

                      2 400 pour 2 500 : la marche est invisible, et la forme
                      voulue arrive quand même au bout.
                    */
                    payload.transitiontime = 24;
                    interval = 2500;
                    break;
                }

                case 'lever-soleil':
                    payload.transitiontime = 100; // 10s transitions
                    const sunriseStep = tick % 30; // 5-minute cycle
                    if (sunriseStep < 5) payload.xy = this.hexToXy('#450a0a'); // Deep Red
                    else if (sunriseStep < 12) payload.xy = this.hexToXy('#f97316'); // Orange
                    else if (sunriseStep < 20) payload.xy = this.hexToXy('#fbbf24'); // Gold
                    else payload.xy = this.hexToXy('#fff7ed'); // Warm White
                    
                    payload.bri = Math.min(254, 40 + (sunriseStep * 8));
                    interval = 10000;
                    break;
            }

            /*
              ⛔ **Le `switch` n'a pas de `default` — et un effet inconnu n'y
              produit RIEN.**

              Jusqu'ici c'était sans conséquence : les noms venaient tous d'une
              liste écrite à la main, et `catalogueDesEffets.test.ts` vérifie que
              chacun a son `case`. Les **ambiances du meneur** changent ça : leur
              `source` est une donnée persistée, qui survivra à un effet renommé
              ou retiré du catalogue.

              Sans ce garde-fou, la lampe recevrait un état **vide** — donc rien
              — toutes les 250 ms, sans message : *une porte qui ouvre sur rien*,
              exactement ce que le contrôle du catalogue existe pour interdire,
              mais du côté que ce contrôle ne peut pas voir.
            */
            if (Object.keys(payload).length === 0) {
                console.warn(
                    `[Light OS] L'effet « ${effectName_} » n'existe pas dans le moteur`
                    + (variante ? ` (ambiance « ${variante.nom} »)` : '')
                    + ` : rien à jouer sur ${id}.`,
                );
                this.stopSoftwareEffect(id, 'rendreLEtat');
                return;
            }

            // Apply global brightness and the scene's intensity to the effect
            if (typeof payload.bri === 'number') {
                payload.bri = brillanceEffective(
                    payload.bri,
                    useLightStore.getState().globalBrightness,
                    this.intensiteDeLEffet(id)
                );
            }

            /*
              ⛔ **LE FONDU SE RABOTE ICI, ET PAS DANS LES `case`.**

              `catalogueDesEffets.test.ts` interdit déjà qu'un `transitiontime`
              dépasse son `interval` — *la commande suivante arrive avant la fin
              du fondu, la lampe se contente de suivre, et la forme voulue
              n'apparaît jamais.* Mais il lit la **source**, où la vitesse vaut
              toujours 1.

              Or le curseur de vitesse d'une scène **divise l'attente sans
              toucher au fondu**. Mesuré le 2026-09-18 : à vitesse 2, `holy`
              fondait sur 1 500 ms pour un battement de 750, et `aube-doree` sur
              2 400 pour 1 250. L'effet ne cassait pas — il **s'aplatissait**, et
              une platitude ressemble à un effet mal réglé, pas à un défaut.

              ⭐ *Une règle vérifiée là où on la lit, et pas là où la valeur
              devient vraie, ne garde que la moitié du chemin.*

              Le calcul se fait donc **après** la cadence réelle, au seul endroit
              que les quarante-sept effets traversent. Un `case` qui pose un
              fondu déjà tenable n'est pas touché ; ceux que la vitesse aurait
              écrasés retrouvent leur forme.
            */
            /*
              ⭐ **LA TEINTE D'UNE AMBIANCE SE POSE ICI, ET NULLE PART AILLEURS.**

              Après le `switch`, donc après que l'effet a choisi sa couleur —
              c'est la seule façon d'atteindre les **36 effets sur 47 qui écrivent
              leur palette en dur**. Une couleur posée avant ne toucherait que les
              onze qui lisent `baseXy`.

              ⛔ **On mélange, on ne remplace pas.** À force pleine, un gyrophare
              deviendrait monochrome — et un gyrophare monochrome n'est plus un
              gyrophare. *Ce qui fait un effet n'est pas sa teinte, c'est le
              rapport entre ses teintes et son rythme.* La force par défaut est
              donc 0,7, et le raisonnement vit dans `varianteDEffet.ts`.

              ⭐ **Et il n'y a rien à recaler — le gamut est un TRIANGLE, donc
              convexe.** Un point pris entre deux points d'un ensemble convexe
              reste dans cet ensemble : mélanger deux couleurs jouables donne
              toujours une couleur jouable. La cible sort de `hexToXy`, qui cale
              déjà ; et si la couleur de départ débordait légèrement — ce que
              `applyXyVariance` peut faire en ajoutant son bruit — la tirer vers
              un point intérieur la **rapproche** du triangle au lieu de l'en
              éloigner.

              *Un recalage ici serait du code qui ne s'exécute jamais, et un
              second endroit où la même couleur se décide.*
            */
            if (cibleDeTeinte && Array.isArray(payload.xy)) {
                payload.xy = teinterVers(
                    payload.xy as [number, number], cibleDeTeinte, variante!.force,
                );
            }

            if (typeof payload.transitiontime === 'number') {
                payload.transitiontime = fonduTenable(payload.transitiontime, cadenceVoulue());
            }

            tick++;

            /*
              Le coup unique a fini de retomber. On ne pose pas de dernier état
              ici : `stopSoftwareEffect` porte la fin voulue — l'état d'avant ou
              l'extinction — dans **la même commande** que l'arrêt de l'effet.
              *Une de moins sur un pont qui en tient dix par seconde.*
            */
            if (fini) {
                this.stopSoftwareEffect(id, fini);
                return;
            }

            try {
                // Bypass setLightState to avoid polluting local store heavily and forcing React renders 10x a second
                await this.request('PUT', `/lights/${id}/state`, payload);

                /*
                  **La cadence se relit à chaque tour, pas au démarrage.** Un
                  effet dynamique (glitch, néon...) change d'attente à chaque
                  passage ; les autres gardent la leur, mais le curseur de la
                  tuile peut l'avoir changée entre-temps. On ne replanifie que
                  si l'attente voulue diffère de celle qui court — sans quoi on
                  reconstruirait un `setInterval` dix fois par seconde.
                */
                if (this.softwareEffectIntervals[id] && toujoursALaBarre()) {
                    if (dynamique) {
                        planifier();
                    } else if (cadenceVoulue() !== this.cadencePlanifiee[id]) {
                        planifier();
                    }
                }
            } catch {
                // If it fails, probably bridge disconnected or too many reqs
            }
        };

        /*
          Une seule porte pour poser le minuteur, quel que soit le type d'effet :
          les dynamiques se replanifient à chaque tour (`setTimeout`), les autres
          battent à cadence fixe (`setInterval`) jusqu'à ce que la vitesse change.
        */
        const planifier = () => {
            const attente = cadenceVoulue();
            if (this.softwareEffectIntervals[id]) {
                clearTimeout(this.softwareEffectIntervals[id]);
                clearInterval(this.softwareEffectIntervals[id]);
            }
            this.cadencePlanifiee[id] = attente;
            this.softwareEffectIntervals[id] = dynamique
                ? setTimeout(loop, attente)
                : setInterval(loop, attente);
        };
        this.replanifierEffet[id] = planifier;

        // First run
        loop();
        planifier();
    }

    // ------------------------------------------------------------------------
    // Flash / Overrides
    // ------------------------------------------------------------------------

    async triggerFlash(hexColor: string, durationMs: number = 1000, intensity: number = 1.0) {
        if (this.flashTimeout) clearTimeout(this.flashTimeout);

        const store = useLightStore.getState();
        const xy = this.hexToXy(hexColor);
        const baseBri = this.hexToBri(hexColor);
        /*
          ⛔ **Ce chemin ignorait le curseur global.** Il parle au pont
          directement — c'est voulu, il ne doit toucher ni l'état gardé en
          mémoire ni la scène active — mais il court-circuitait du même coup la
          seule multiplication que **toutes** les autres lampes subissent : à
          20 % d'intensité globale, « Rouge Critique » partait quand même à
          pleine puissance. *Un curseur qui dit « toute la pièce » et qu'un
          chemin ignore n'est pas un curseur, c'est une approximation.*

          ⚠️ **Ils sont DEUX à faire ça**, `triggerFlash` et
          `applyTacticalState`, avec les mêmes quatre lignes recopiées. Corriger
          celui qu'on cherchait aurait laissé l'autre — *la question qui trouve
          ces défauts est toujours « qui d'autre a la même rustine à poser ? »*

          L'intensité d'une **tuile** ne s'y applique pas : ni un flash ni un
          état tactique n'appartiennent à une scène. Et le plancher à 1 reste,
          parce que la commande dit `on: true` — *envoyer « allume-toi à zéro »
          n'a pas de sens ; qui veut le noir a le bouton rouge.*
        */
        const bri = Math.max(1, brillanceEffective(baseBri * intensity, store.globalBrightness));

        console.log(`[HUE ENGINE] ⚡ FLASH triggered: ${hexColor} (Scaled Brightness: ${bri}, Intensity: ${intensity})`);

        // Apply flash globally without updating store's activeSceneId
        const promises = Object.keys(store.lights).map(id => {
            this.stopSoftwareEffect(id); // Stop any running effects
            return this.request('PUT', `/lights/${id}/state`, { on: true, bri, xy, transitiontime: 0 });
        });
        await Promise.allSettled(promises);

        // Schedule restore using the robust reversion system
        this.flashTimeout = setTimeout(() => {
            this.restoreAfterTactical();
        }, durationMs);
    }

    /**
     * Applies a persistent tactical state (e.g. status effect) that stays until cleared.
     */
    async applyTacticalState(hexColor: string, name: string, intensity: number = 1.0) {
        if (this.flashTimeout) {
            console.log(`[HUE ENGINE] Flash active, tactical state ${name} will be visible after restore.`);
            // We don't return, we want the "underlying" state to be correct when flash ends
        }

        const store = useLightStore.getState();
        const xy = this.hexToXy(hexColor);
        const baseBri = this.hexToBri(hexColor);
        /* Même défaut, même correctif — voir le commentaire de `triggerFlash`. */
        const bri = Math.max(1, brillanceEffective(baseBri * intensity, store.globalBrightness));
        
        console.log(`[HUE ENGINE] 🛡️ Applying Persistent Tactical State: ${name} (${hexColor}) (Scaled Brightness: ${bri}, Intensity: ${intensity})`);

        const promises = Object.keys(store.lights).map(id => {
            this.stopSoftwareEffect(id);
            return this.request('PUT', `/lights/${id}/state`, { on: true, bri, xy, transitiontime: 10 });
        });
        await Promise.allSettled(promises);
    }

    /**
     * Clears any tactical overrides and returns to the normal scene
     */
    async clearTacticalState() {
        console.log('[HUE ENGINE] 🧹 Clearing Tactical State, reverting to manual scene.');
        await this.restoreAfterTactical();
    }

    private async restoreAfterTactical() {
        console.log('[HUE ENGINE] Restoring after tactical override via reversion.');
        await this.revertToManualScene();
        this.flashTimeout = null;
    }

    /**
     * **Pose une brillance commune à toutes les lampes, en UNE requête.**
     *
     * Employée par Voice-to-Light, qui pousse jusqu'à huit fois par seconde.
     * `setLightState` ne convient pas ici : six lampes feraient six requêtes par
     * envoi, soit quarante-huit par seconde, et *le pont Hue en tient une
     * dizaine.* `/groups/0/action` est le groupe « toutes les lampes » de l'API,
     * et il ne coûte qu'un appel quel que soit leur nombre.
     *
     * **On n'envoie que `bri`** : les couleurs de la scène restent en place. Le
     * contraste de brillance entre lampes, lui, est aplani tant que le mode
     * dure — c'est le prix de la requête unique, et il se rend en réappliquant
     * la scène à l'arrêt.
     *
     * `transitiontime: 1` (100 ms) : la lumière doit suivre la voix, pas la
     * commenter une seconde plus tard.
     */
    async modulerLaBrillance(bri: number) {
        await this.request('PUT', '/groups/0/action', {
            bri: Math.round(bri),
            transitiontime: 1,
        });
    }

    /**
     * **L'extinction franche : tout s'éteint, rien ne revient.**
     *
     * `isAutomatic` dit d'où vient le geste, et il ne décide que du journal :
     * le bouton rouge est une décision du meneur, la fin d'un son qui laisse la
     * pièce sans scène n'en est pas une. *Un journal qui consigne les
     * enchaînements de l'application se relit comme un journal qui ment sur le
     * nombre de gestes.*
     */
    async extinguishAll(isAutomatic: boolean = false) {
        if (!isAutomatic) {
            await this.consignerAuJournal(
                'Lumières : extinction',
                'Toutes les lampes sont éteintes.'
            );
        }

        if (this.flashTimeout) {
            clearTimeout(this.flashTimeout);
            this.flashTimeout = null;
        }

        useLightStore.getState().setActiveScene(null);

        const store = useLightStore.getState();
        const promises = Object.keys(store.lights).map(async id => {
            this.stopSoftwareEffect(id);
            // Quick fade out
            await this.request('PUT', `/lights/${id}/state`, { on: false, transitiontime: 5 });
            useLightStore.getState().updateLightState(id, { on: false });
        });

        await Promise.allSettled(promises);
    }
}

export const hueEngine = new HueEngine();

// Export for cross-module access to avoid circular dependencies
if (typeof window !== 'undefined') {
    (window as Window & { hueEngine?: HueEngine }).hueEngine = hueEngine;
}
