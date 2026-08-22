import { useLightStore } from "./useLightStore";
import type { HueLight, HueLightState } from "./useLightStore";

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

export class HueEngine {
    private softwareEffectIntervals: Record<string, ReturnType<typeof setInterval>> = {};
    private flashTimeout: ReturnType<typeof setTimeout> | null = null;

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

    async setLightState(id: string, state: Partial<HueLightState>, transitionTimeMs: number = 400) {
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

            // Apply global brightness as a modifier
            if (typeof payload.bri === 'number') {
                const globalBri = useLightStore.getState().globalBrightness / 100;
                payload.bri = Math.round(payload.bri * globalBri);
            }
        }

        await this.request('PUT', `/lights/${id}/state`, payload);

        // Update local store immediately for UI responsiveness
        useLightStore.getState().updateLightState(id, state);
    }

    async applyScene(sceneId: string | null, isAutomatic: boolean = false) {
        if (!sceneId) {
            console.log('[HUE ENGINE] No scene specified, extinguishing all.');
            await this.extinguishAll();
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
        useLightStore.getState().setActiveScene(sceneId, isAutomatic);

        // Turn everything off first if not in snapshot?
        // Or just apply the snapshot.
        for (const [id, state] of Object.entries(scene.lightStates)) {
            this.stopSoftwareEffect(id); // Clean any previous logic
            if (state.effect && state.effect !== 'none') {
                // IMPORTANT: Even if there is an effect, we must turn the light ON first and set its base state
                await this.setLightState(id, { ...state, effect: 'none' }, transTime);
                this.startSoftwareEffect(id, state.effect, state);
            } else {
                // Ensure we handle them sequentially to not rate-limit the bridge
                await this.setLightState(id, state, transTime);
                // Tiny delay to let the bridge breathe (increased from 50ms)
                await new Promise(r => setTimeout(r, 100));
            }
        }
    }

    async revertToManualScene() {
        const { lastManualSceneId } = useLightStore.getState();
        console.log(`[HUE ENGINE] Reverting to manual scene: ${lastManualSceneId}`);
        await this.applyScene(lastManualSceneId, true);
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

    stopSoftwareEffect(id: string) {
        if (this.softwareEffectIntervals[id]) {
            clearInterval(this.softwareEffectIntervals[id]);
            delete this.softwareEffectIntervals[id];
        }
        useLightStore.getState().updateLightState(id, { effect: 'none' });
        // Native effect clear
        if (useLightStore.getState().status === 'connected') {
            this.request('PUT', `/lights/${id}/state`, { effect: 'none' }).catch(() => { });
        }
    }

    startSoftwareEffect(id: string, effectName: string, baseState?: HueLightState) {
        this.stopSoftwareEffect(id);

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

        const loop = async () => {
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

            // Apply global brightness to the effect
            if (typeof payload.bri === 'number') {
                const globalBri = useLightStore.getState().globalBrightness / 100;
                payload.bri = Math.round(payload.bri * globalBri);
            }

            tick++;

            try {
                // Bypass setLightState to avoid polluting local store heavily and forcing React renders 10x a second
                await this.request('PUT', `/lights/${id}/state`, payload);

                // If interval changed dynamically (glitch, neon, etc.), re-schedule
                const dynamicEffects = [
                    'glitch', 'tv', 'lightning', 'neon', 'heartbeat', 'flashlight',
                    'lumiere-ville', 'cyber-night', 'terminal', 'stroboscope', 'neant', 
                    'trou-noir', 'hyperspace', 'reacteur'
                ];

                if (dynamicEffects.includes(effectName)) {
                    if (this.softwareEffectIntervals[id]) {
                        clearTimeout(this.softwareEffectIntervals[id]);
                        this.softwareEffectIntervals[id] = setTimeout(loop, interval);
                    }
                }
            } catch {
                // If it fails, probably bridge disconnected or too many reqs
            }
        };

        const dynamicEffectsList = [
            'glitch', 'tv', 'lightning', 'neon', 'heartbeat', 'flashlight',
            'lumiere-ville', 'cyber-night', 'terminal', 'stroboscope', 'neant', 
            'trou-noir', 'hyperspace', 'reacteur'
        ];

        // First run
        loop();
        if (!dynamicEffectsList.includes(effectName)) {
            this.softwareEffectIntervals[id] = setInterval(loop, interval);
        } else {
            this.softwareEffectIntervals[id] = setTimeout(loop, interval); // managed in loop
        }
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

    async extinguishAll() {
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
