import React from 'react';
import { useLightStore } from '../useLightStore';
import { hueEngine } from '../HueEngine';

export const Sidebar: React.FC = () => {
    const { status, bridgeIp, globalBrightness, setGlobalBrightness } = useLightStore();

    const handlePair = async () => {
        if (!bridgeIp) {
            console.log("No IP to pair");
            return;
        }
        useLightStore.getState().setConnection('pairing');

        // Poll for 30 seconds (every 2 seconds)
        let attempts = 0;
        const maxAttempts = 15;

        const tryPair = async () => {
            try {
                const token = await hueEngine.pair(bridgeIp);
                if (token) {
                    useLightStore.getState().setConnection('connected', bridgeIp, token);
                    hueEngine.fetchLights();
                    return true;
                }
            } catch (e: unknown) {
                if (e instanceof Error && e.message === "LINK_BUTTON_NOT_PRESSED") {
                    // Expected during polling
                } else {
                    console.error("Pairing error", e);
                }
            }
            return false;
        };

        const poll = setInterval(async () => {
            attempts++;
            const success = await tryPair();
            if (success) {
                clearInterval(poll);
            } else if (attempts >= maxAttempts) {
                clearInterval(poll);
                useLightStore.getState().setConnection('disconnected');
                alert("Pairing timeout. Please try again and press the button on the Hue Bridge.");
            }
        }, 2000);

        // Immediate first try
        const success = await tryPair();
        if (success) clearInterval(poll);
    };

    const handleDiscover = async () => {
        useLightStore.getState().setConnection('discovering');
        const ip = await hueEngine.discoverBridge();
        if (ip) {
            useLightStore.getState().setConnection('disconnected', ip);
            // Auto try pair? No, user should click pair which tells them to press button.
        } else {
            useLightStore.getState().setConnection('disconnected');
            alert("No bridge found automatically.");
        }
    };

    const handleFlash = (color: string) => {
        hueEngine.triggerFlash(color, 2000);
    };

    return (
        <aside className="col-span-3 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 p-6 flex flex-col gap-8 text-slate-100 font-sans h-full">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-gm-cyan">Light OS</h1>
                <p className="text-slate-400 text-sm font-medium">GM Ambience Controller</p>
            </div>

            {/* Connection Status & Sync */}
            <div className="flex flex-col gap-3">
                <div className={`flex items-center justify-between p-4 rounded-xl border ${status === 'connected' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gm-cyan">hub</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Hue Bridge</span>
                            {bridgeIp && <span className="text-xs text-slate-500">{bridgeIp}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-800/20 border-slate-800">
                    <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${useLightStore.getState().isSyncEnabled ? 'text-gm-violet animate-pulse' : 'text-slate-600'}`}>sync</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Sync with Audio</span>
                    </div>
                    <button 
                        onClick={() => useLightStore.getState().setSyncEnabled(!useLightStore.getState().isSyncEnabled)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${useLightStore.getState().isSyncEnabled ? 'bg-gm-violet' : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useLightStore.getState().isSyncEnabled ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                {status !== 'connected' && (
                    <div className="flex gap-2">
                        <button onClick={handleDiscover} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">
                            Discover
                        </button>
                        <button onClick={handlePair} disabled={!bridgeIp} className="flex-1 py-2 bg-gm-cyan/20 hover:bg-gm-cyan/30 text-gm-cyan rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Pair Key
                        </button>
                    </div>
                )}
                {status === 'connected' && (
                    <button onClick={() => useLightStore.getState().setConnection('disconnected', null, null)} className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-colors">
                        Disconnect
                    </button>
                )}
            </div>

            {/* Global Brightness */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Global Intensity</label>
                    <span className="text-gm-cyan font-mono font-bold">{globalBrightness}%</span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                    <input
                        type="range"
                        min="0" max="100"
                        value={globalBrightness}
                        onChange={(e) => setGlobalBrightness(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-gm-cyan"
                    />
                </div>
            </div>

            {/* Quick Flash Buttons */}
            <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Quick Action Presets</h3>
                <button onClick={() => handleFlash('#ff0000')} className="group flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 group-hover:scale-110 transition-transform">local_fire_department</span>
                        <span className="font-bold text-red-100">Critical Red</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-red-500/50">bolt</span>
                </button>

                <button onClick={() => handleFlash('#0088ff')} className="group flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-400 group-hover:scale-110 transition-transform">auto_fix_high</span>
                        <span className="font-bold text-blue-100">Arcane Blue</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-blue-400/50">bolt</span>
                </button>

                <button onClick={() => handleFlash('#10b981')} className="group flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-400 group-hover:scale-110 transition-transform">healing</span>
                        <span className="font-bold text-emerald-100">Healing Green</span>
                    </div>
                    <span className="material-symbols-outlined text-xs text-emerald-400/50">bolt</span>
                </button>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-800">
                <button
                    onClick={() => hueEngine.extinguishAll()}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                    <span className="material-symbols-outlined">power_settings_new</span>
                    Emergency Blackout
                </button>
            </div>
        </aside>
    );
};
