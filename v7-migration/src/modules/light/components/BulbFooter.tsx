import React from 'react';
import { useLightStore } from '../useLightStore';
import type { HueLight } from '../useLightStore';
import { hueEngine } from '../HueEngine';
import { useTranslation } from 'react-i18next';

export const BulbFooter: React.FC = () => {
    const { lights } = useLightStore();
    const { t } = useTranslation('modules');
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
        'breathing': '#0ea5e9',
        'lumiere-ville': '#f59e0b',
        'foret-profonde': '#064e3b',
        'cyber-night': '#ff00ff',
        'disco': '#ffffff',
        'aurore': '#22c55e',
        'lave': '#ff4500',
        'fantome': '#e0f2fe',
        'terminal': '#22c55e',
        'stroboscope': '#ffffff',
        'crepuscule': '#f59e0b',
        'toxique': '#84cc16',
        'zen': '#fafaf9',
        'neant': '#2e1065',
        'alerte': '#ff0000',
        'abysses': '#1e3a8a',
        'trou-noir': '#4c1d95',
        'hyperspace': '#06b6d4',
        'reacteur': '#e0f2fe',
        'passerelle': '#bae6fd',
        'alien': '#701a75',
        'lever-soleil': '#450a0a'
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
                <span className="text-slate-500 font-bold text-xs">{t('light.footer.no_lights')}</span>
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
                                        title={t('light.footer.change_color')}
                                    />
                                    <div className="flex items-center bg-app-bg/80 border border-app-border rounded px-2 py-1 w-full hover:border-accent/30 transition-colors">
                                        <span className="material-symbols-outlined text-sm text-slate-500 mr-2">tune</span>
                                        <select
                                            value={effect}
                                            onChange={(e) => handleEffectChange(light.id, e.target.value)}
                                            className="bg-transparent border-none p-0 text-xs font-bold text-accent focus:ring-0 cursor-pointer outline-none w-full"
                                        >
                                            <option value="none" className="bg-app-bg text-app-text/50">{t('light.footer.effects.steady')}</option>
                                            <option value="colorloop" className="bg-app-bg text-accent">{t('light.footer.effects.colorloop')}</option>
                                            
                                            <optgroup label={t('light.footer.categories.urban')} className="bg-app-bg text-slate-400">
                                                <option value="lumiere-ville" className="text-amber-500">{t('light.footer.effects.lumiere-ville')}</option>
                                                <option value="terminal" className="text-green-500">{t('light.footer.effects.terminal')}</option>
                                                <option value="cyber-night" className="text-fuchsia-500">{t('light.footer.effects.cyber-night')}</option>
                                                <option value="neon" className="text-pink-500">{t('light.footer.effects.neon')}</option>
                                                <option value="stroboscope" className="text-white">{t('light.footer.effects.stroboscope')}</option>
                                                <option value="police" className="text-blue-500">{t('light.footer.effects.police')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.nature')} className="bg-app-bg text-slate-400">
                                                <option value="foret-profonde" className="text-emerald-600">{t('light.footer.effects.foret-profonde')}</option>
                                                <option value="aurore" className="text-cyan-400">{t('light.footer.effects.aurore')}</option>
                                                <option value="crepuscule" className="text-orange-600">{t('light.footer.effects.crepuscule')}</option>
                                                <option value="underwater" className="text-cyan-500">{t('light.footer.effects.underwater')}</option>
                                                <option value="abysses" className="text-blue-800">{t('light.footer.effects.abysses')}</option>
                                                <option value="lever-soleil" className="text-orange-400">{t('light.footer.effects.lever-soleil')}</option>
                                                <option value="lightning" className="text-app-text/70">{t('light.footer.effects.storm')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.fantasy')} className="bg-app-bg text-slate-400">
                                                <option value="candle" className="text-amber-500">{t('light.footer.effects.candle')}</option>
                                                <option value="fire" className="text-red-500">{t('light.footer.effects.fire')}</option>
                                                <option value="lave" className="text-orange-700">{t('light.footer.effects.lave')}</option>
                                                <option value="arcane" className="text-purple-400">{t('light.footer.effects.arcane')}</option>
                                                <option value="dragon" className="text-orange-500">{t('light.footer.effects.dragon')}</option>
                                                <option value="holy" className="text-yellow-300">{t('light.footer.effects.holy')}</option>
                                                <option value="fantome" className="text-blue-200">{t('light.footer.effects.fantome')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.space')} className="bg-app-bg text-slate-400">
                                                <option value="neant" className="text-violet-900">{t('light.footer.effects.neant')}</option>
                                                <option value="trou-noir" className="text-indigo-950">{t('light.footer.effects.trou-noir')}</option>
                                                <option value="hyperspace" className="text-cyan-300">{t('light.footer.effects.hyperspace')}</option>
                                                <option value="reacteur" className="text-blue-100">{t('light.footer.effects.reacteur')}</option>
                                                <option value="passerelle" className="text-sky-300">{t('light.footer.effects.passerelle')}</option>
                                                <option value="alien" className="text-purple-700">{t('light.footer.effects.alien')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.alerts')} className="bg-app-bg text-slate-400">
                                                <option value="alerte" className="text-red-600">{t('light.footer.effects.alerte')}</option>
                                                <option value="heartbeat" className="text-red-600">{t('light.footer.effects.heartbeat')}</option>
                                                <option value="radiation" className="text-emerald-400">{t('light.footer.effects.radiation')}</option>
                                                <option value="toxique" className="text-lime-400">{t('light.footer.effects.toxique')}</option>
                                                <option value="glitch" className="text-green-400">{t('light.footer.effects.glitch')}</option>
                                                <option value="tv" className="text-cyan-200">{t('light.footer.effects.tv')}</option>
                                            </optgroup>

                                            <optgroup label={t('light.footer.categories.misc')} className="bg-app-bg text-slate-400">
                                                <option value="disco" className="text-fuchsia-400">{t('light.footer.effects.disco')}</option>
                                                <option value="flashlight" className="text-white">{t('light.footer.effects.flashlight')}</option>
                                                <option value="breathing" className="text-app-text/60">{t('light.footer.effects.breathing')}</option>
                                                <option value="zen" className="text-slate-100">{t('light.footer.effects.zen')}</option>
                                            </optgroup>
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
