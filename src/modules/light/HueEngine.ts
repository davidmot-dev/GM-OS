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
            type LightBridge = { request: (u: string, m: string, b?: unknown) => Promise<unknown> };
            const bridge = (window as unknown as { appBridge?: { light?: LightBridge } }).appBridge?.light;
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
            type LightBridge = { request: (u: string, m: string, b?: unknown) => Promise<unknown> };
            const bridge = (window as unknown as { appBridge?: { light?: LightBridge } }).appBridge?.light;
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
            type LightBridge = { request: (u: string, m: string, b?: unknown) => Promise<unknown> };
            const bridge = (window as unknown as { appBridge?: { light?: LightBridge } }).appBridge?.light;
            if (bridge) {
                return await bridge.request(url, method, body);
            } else {
                const res = await fetch(url, {
                    method,
                    body: body ? JSON.stringify(body) : undefined
                });
                return await res.json();
            }
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
    // Color Math (CIE)
    // ------------------------------------------------------------------------

    hexToXy(hex: string): [number, number] {
        // Remove #
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');

        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        // Gamma correction
        const red = r > 0.04045 ? Math.pow((r + 0.055) / (1.0 + 0.055), 2.4) : (r / 12.92);
        const green = g > 0.04045 ? Math.pow((g + 0.055) / (1.0 + 0.055), 2.4) : (g / 12.92);
        const blue = b > 0.04045 ? Math.pow((b + 0.055) / (1.0 + 0.055), 2.4) : (b / 12.92);

        // Wide gamut conversion
        const X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
        const Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
        const Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;

        let cx = X / (X + Y + Z);
        let cy = Y / (X + Y + Z);

        if (isNaN(cx)) cx = 0.0;
        if (isNaN(cy)) cy = 0.0;

        return [cx, cy];
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
                    payload.transitiontime = 30;
                    payload.bri = Math.max(10, Math.min(254, 150 + Math.sin(tick * 0.1) * 100));
                    payload.xy = this.applyXyVariance(baseXy, 0.005);
                    interval = 3000;
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
                if (['glitch', 'tv', 'lightning', 'neon', 'heartbeat', 'flashlight'].includes(effectName)) {
                    if (this.softwareEffectIntervals[id]) {
                        clearTimeout(this.softwareEffectIntervals[id]);
                        this.softwareEffectIntervals[id] = setTimeout(loop, interval);
                    }
                }
            } catch {
                // If it fails, probably bridge disconnected or too many reqs
            }
        };

        // First run
        loop();
        if (!['glitch', 'tv', 'lightning', 'neon', 'heartbeat', 'flashlight'].includes(effectName)) {
            this.softwareEffectIntervals[id] = setInterval(loop, interval);
        } else {
            this.softwareEffectIntervals[id] = setTimeout(loop, interval); // managed in loop
        }
    }

    // ------------------------------------------------------------------------
    // Flash / Overrides
    // ------------------------------------------------------------------------

    async triggerFlash(hexColor: string, durationMs: number = 1000) {
        if (this.flashTimeout) clearTimeout(this.flashTimeout);

        const store = useLightStore.getState();
        const xy = this.hexToXy(hexColor);

        // Apply flash globally without updating store's activeSceneId
        const promises = Object.keys(store.lights).map(id => {
            this.stopSoftwareEffect(id); // Stop any running effects
            return this.request('PUT', `/lights/${id}/state`, { on: true, bri: 254, xy, transitiontime: 0 });
        });
        await Promise.allSettled(promises);

        // Schedule restore using the robust reversion system
        this.flashTimeout = setTimeout(() => {
            this.restoreFromFlash();
        }, durationMs);
    }

    private async restoreFromFlash() {
        console.log('[HUE ENGINE] Restoring after flash via reversion.');
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
    (window as any).hueEngine = hueEngine;
}
