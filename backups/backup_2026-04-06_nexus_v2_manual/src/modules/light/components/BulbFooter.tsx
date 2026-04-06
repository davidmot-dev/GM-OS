import React from 'react';
import { useLightStore } from '../useLightStore';
import type { HueLight } from '../useLightStore';
import { hueEngine } from '../HueEngine';

export const BulbFooter: React.FC = () => {
    const { lights } = useLightStore();
    const lightList = Object.values(lights);

    const handleColorChange = (id: string, hexColor: string) => {
        const xy = hueEngine.hexToXy(hexColor);
        hueEngine.setLightState(id, { xy, on: true });

        // Stop any effect ONLY if it's the native colorloop or 'none' (since software effects now support dynamic color changes)
        const currentEffect = useLightStore.getState().lights[id]?.state?.effect;
        if (currentEffect === 'none' || currentEffect === 'colorloop') {
            hueEngine.stopSoftwareEffect(id);
        }
    };

    const defaultColors: Record<string, string> = {
        'candle': '#ffb732',
        'fire': '#ff4500',
        'arcane': '#a855f7',
        'dragon': '#f97316',
        'holy': '#fff9e5',
        'radiation': '#84cc16',
        'underwater': '#06b6d4',
        'heartbeat': '#ef4444',
        'breathing': '#0ea5e9' // arbitrary default
    };

    const handleEffectChange = (id: string, effectName: string) => {
        if (effectName === 'none') {
            hueEngine.stopSoftwareEffect(id);
        } else {
            const defaultColor = defaultColors[effectName];
            if (defaultColor) {
                const xy = hueEngine.hexToXy(defaultColor);
                hueEngine.setLightState(id, { xy, on: true });
            }
            hueEngine.startSoftwareEffect(id, effectName);
        }
    };

    const toggleLight = (id: string, currentState: boolean) => {
        hueEngine.setLightState(id, { on: !currentState });
        hueEngine.stopSoftwareEffect(id);
    };

    if (lightList.length === 0) {
        return (
            <footer className="bg-app-surface/50 border-t border-app-border p-4 h-24 flex items-center justify-center">
                <span className="text-slate-500 font-bold text-xs">No lights discovered.</span>
            </footer>
        );
    }

    return (
        <footer className="bg-app-surface/50 border-t border-app-border p-4 shrink-0">
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                {lightList.map((light: HueLight) => {
                    const isOn = light.state.on;
                    const effect = light.state.effect || 'none';
                    return (
                        <div key={light.id} className="flex-none w-64 bg-app-bg/80 rounded-lg p-3 border border-app-border flex items-center gap-4">
                            <button
                                onClick={() => toggleLight(light.id, isOn)}
                                className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-all ${isOn ? 'bg-amber-500 shadow-glow-accent' : 'bg-app-surface'}
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isOn ? 'text-white' : 'text-slate-500'}`}>lightbulb</span>
                            </button>
                            <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                                <span className="text-xs font-bold text-slate-200 truncate">{light.name}</span>
                                <div className="flex items-center gap-3 mt-1">
                                    <input
                                        type="color"
                                        onChange={(e) => handleColorChange(light.id, e.target.value)}
                                        className="size-6 rounded border border-app-border cursor-pointer p-0 bg-transparent hover:border-accent/50 transition-colors"
                                        title="Change Color"
                                    />
                                    <div className="flex items-center bg-app-bg/80 border border-app-border rounded px-2 py-1 w-full hover:border-accent/30 transition-colors">
                                        <span className="material-symbols-outlined text-sm text-slate-500 mr-2">tune</span>
                                        <select
                                            value={effect}
                                            onChange={(e) => handleEffectChange(light.id, e.target.value)}
                                            className="bg-transparent border-none p-0 text-xs font-bold text-accent focus:ring-0 cursor-pointer outline-none w-full"
                                        >
                                            <option value="none" className="bg-app-bg text-app-text/50">Steady</option>
                                            <option value="colorloop" className="bg-app-bg text-accent">Colorloop</option>
                                            <option value="candle" className="bg-app-bg text-amber-500">Candle</option>
                                            <option value="fire" className="bg-app-bg text-red-500">Fire</option>
                                            <option value="police" className="bg-app-bg text-blue-500">Police</option>
                                            <option value="lightning" className="bg-app-bg text-app-text/70">Storm</option>
                                            <option value="glitch" className="bg-app-bg text-green-400">Glitch</option>
                                            <option value="tv" className="bg-app-bg text-cyan-200">CRT TV</option>
                                            <option value="arcane" className="bg-app-bg text-purple-400">Arcane</option>
                                            <option value="warp" className="bg-app-bg text-fuchsia-400">Warp Speed</option>
                                            <option value="underwater" className="bg-app-bg text-cyan-500">Underwater</option>
                                            <option value="dragon" className="bg-app-bg text-orange-500">Dragon Breath</option>
                                            <option value="holy" className="bg-app-bg text-yellow-300">Holy Aura</option>
                                            <option value="neon" className="bg-app-bg text-pink-500">Broken Neon</option>
                                            <option value="heartbeat" className="bg-app-bg text-red-600">Heartbeat</option>
                                            <option value="flashlight" className="bg-app-bg text-white">Flashlight</option>
                                            <option value="radiation" className="bg-app-bg text-emerald-400">Radiation</option>
                                            <option value="breathing" className="bg-app-bg text-app-text/60">Breathing</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </footer>
    );
};
