import { useLightStore, INTENSITE_SCENE_DEFAUT, VITESSE_EFFET_DEFAUT } from "./useLightStore";
import type { HueLight, HueLightState } from "./useLightStore";
import { sceneDeRepli } from "./logic/sceneDeRepli";

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
    return Math.max(0, Math.min(254, Math.round(bri * (global / 100) * (scene / 100))));
};

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

    stopSoftwareEffect(id: string) {
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
        // Native effect clear
        if (useLightStore.getState().status === 'connected') {
            this.request('PUT', `/lights/${id}/state`, { effect: 'none' }).catch(() => { });
        }
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

        let interval = 250; // Minimum 250ms for performance stability
        let tick = 0;

        /*
          **Deux familles d'effets.** Les « dynamiques » recalculent leur attente
          à chaque tour (un néon grésille court puis tient long) : ils se
          replanifient un tour à la fois. Les autres battent à cadence fixe.
        */
        const dynamique = [
            'glitch', 'tv', 'lightning', 'neon', 'heartbeat', 'flashlight',
            'lumiere-ville', 'cyber-night', 'terminal', 'stroboscope', 'neant',
            'trou-noir', 'hyperspace', 'reacteur'
        ].includes(effectName);

        /** L'attente du prochain tour, vitesse de la scène comprise. */
        const cadenceVoulue = () => cadenceEffective(interval, this.vitesseDeLEffet(id));

        const loop = async () => {
            if (!toujoursALaBarre()) return;
            const freshState = useLightStore.getState().lights[id]?.state || state;
            const payload: Record<string, unknown> = {};
            const baseBri = freshState.bri || 150;
            const baseXy = freshState.xy || [0.4, 0.4];

            switch (effectName) {
                case 'candle':
                case 'fire':
                    payload.bri = Math.max(10, Math.min(254, baseBri + this.getRandomFloat(-40, 40)));
                    payload.transitiontime = 2; // Very fast
                    payload.xy = this.applyXyVariance(baseXy, 0.015);
                    break;

                case 'lightning':
                    payload.transitiontime = 0;
                    if (Math.random() > 0.94) { // 6% chance to flash
                        payload.bri = 254;
                        payload.xy = this.hexToXy('#ffffff');
                    } else {
                        payload.bri = 20; // dark ambient grey
                        payload.xy = this.hexToXy('#808080'); // Actually Hue grey is tricky, usually desaturated blueish
                    }
                    interval = 250;
                    break;

                case 'police':
                    payload.transitiontime = 2;
                    payload.bri = 254;
                    payload.xy = (tick % 2 === 0) ? this.hexToXy('#ff0000') : this.hexToXy('#0000ff');
                    interval = 300;
                    break;

                case 'arcane': // Slow intense breathing
                    payload.transitiontime = 15;
                    payload.bri = baseBri + Math.sin(tick * 0.5) * 50;
                    payload.xy = this.applyXyVariance(baseXy, 0.04);
                    interval = 1500;
                    break;

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

                case 'underwater':
                    payload.transitiontime = 20;
                    payload.bri = Math.max(10, Math.min(254, baseBri + Math.sin(tick * 0.2) * 40));
                    payload.xy = this.applyXyVariance(baseXy, 0.05);
                    interval = 2000;
                    break;

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

                case 'radiation':
                    payload.transitiontime = 15;
                    payload.bri = Math.max(10, Math.min(254, baseBri + Math.sin(tick * 0.5) * 100));
                    payload.xy = baseXy;
                    interval = 1500;
                    break;

                case 'breathing':
                    payload.transitiontime = 20;
                    payload.bri = Math.max(10, Math.min(254, baseBri + Math.sin(tick * 0.3) * 100));
                    payload.xy = baseXy;
                    interval = 2000;
                    break;

                case 'lumiere-ville':
                    payload.transitiontime = 5;
                    // Sodium amber base [0.55, 0.40]
                    if (Math.random() > 0.95) { // Passing car
                        payload.bri = 254;
                        payload.xy = this.hexToXy('#ffffff');
                        payload.transitiontime = 1;
                        interval = 200;
                    } else {
                        payload.bri = Math.max(80, baseBri + this.getRandomFloat(-20, 20));
                        payload.xy = [0.55, 0.40];
                        interval = 1000;
                    }
                    break;

                case 'foret-profonde':
                    payload.transitiontime = 40;
                    payload.bri = Math.max(30, Math.min(180, 100 + Math.sin(tick * 0.1) * 50));
                    payload.xy = (tick % 2 === 0) ? this.hexToXy('#064e3b') : this.hexToXy('#14532d');
                    interval = 4000;
                    break;

                case 'cyber-night':
                    payload.transitiontime = 0;
                    const cyberColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0000'];
                    payload.xy = this.hexToXy(cyberColors[Math.floor(Math.random() * cyberColors.length)]);
                    payload.bri = Math.random() > 0.2 ? 254 : 50;
                    interval = 150 + Math.random() * 300;
                    break;

                case 'disco':
                    payload.transitiontime = 2;
                    payload.xy = [Math.random(), Math.random()];
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
                    payload.bri = Math.random() > 0.9 ? 0 : 40 + Math.sin(tick * 0.5) * 20;
                    payload.xy = this.hexToXy('#e0f2fe');
                    interval = 800;
                    break;

                case 'terminal':
                    payload.transitiontime = 0;
                    payload.bri = 100 + this.getRandomFloat(-30, 30);
                    payload.xy = this.hexToXy('#22c55e'); // Green terminal
                    interval = 100 + Math.random() * 100;
                    break;

                case 'stroboscope':
                    payload.transitiontime = 0;
                    payload.bri = (tick % 2 === 0) ? 254 : 0;
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

                case 'zen':
                    payload.transitiontime = 60;
                    payload.bri = 100 + Math.sin(tick * 0.1) * 30;
                    payload.xy = this.hexToXy('#fafaf9');
                    interval = 6000;
                    break;

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

                case 'trou-noir':
                    payload.transitiontime = 20;
                    if (Math.random() > 0.9) { // Gravity pull
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

            // Apply global brightness and the scene's intensity to the effect
            if (typeof payload.bri === 'number') {
                payload.bri = brillanceEffective(
                    payload.bri,
                    useLightStore.getState().globalBrightness,
                    this.intensiteDeLEffet(id)
                );
            }

            tick++;

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
        const bri = Math.max(1, Math.round(baseBri * intensity));

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
        const bri = Math.max(1, Math.round(baseBri * intensity));
        
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
