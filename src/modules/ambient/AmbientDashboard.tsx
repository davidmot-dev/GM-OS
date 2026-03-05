import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Wind, Trash2, Layers, Music, Activity, Save, Plus } from 'lucide-react';
import { useAmbientStore, type AmbientTheme, type AmbientTrackState } from './useAmbientStore';
import AmbientTrack from './components/AmbientTrack';
import { ambientEngine } from './AmbientEngine';
import { gmPrompt, gmConfirm } from '../../stores/useModalStore';

const MasterVisualizer: React.FC = () => {
    const [data, setData] = useState<Uint8Array>(new Uint8Array(32));
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const analyser = ambientEngine.getAnalyser();
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
            analyser.getByteFrequencyData(dataArray);
            setData(new Uint8Array(dataArray.slice(0, 32)));
            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <div className="flex items-end gap-[2px] h-10 w-24 px-2 opacity-90 overflow-hidden bg-slate-950/80 rounded-xl p-1.5 border border-slate-800 shadow-inner">
            {Array.from(data).filter((_, i) => i % 2 === 0).map((v, i) => (
                <div
                    key={i}
                    className="w-1.5 bg-gm-cyan rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(10, (v / 255) * 100)}%`, boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}
                />
            ))}
        </div>
    );
};

const AmbientDashboard: React.FC = () => {
    const { tracks, presets, scenes, customUniverses, loadTheme, saveTheme, deleteTheme, addUniverse, fadeOutAll, applyScene, outputDeviceId, setOutputDevice } = useAmbientStore();

    // Universe & Theme Selection State
    const universes = useMemo(() => {
        const derived = presets.map((p: AmbientTheme) => p.universe);
        return Array.from(new Set([...derived, ...customUniverses])).sort() as string[];
    }, [presets, customUniverses]);

    const [selectedUniverse, setSelectedUniverse] = useState(universes[0] || '');

    const themesInUniverse = useMemo(() =>
        presets
            .filter((p: AmbientTheme) => p.universe === selectedUniverse)
            .sort((a: AmbientTheme, b: AmbientTheme) => a.name.localeCompare(b.name)),
        [presets, selectedUniverse]
    );
    const [selectedTheme, setSelectedTheme] = useState(themesInUniverse[0]?.name || '');

    // Synchronize selectedTheme if themes change or current one is deleted
    useEffect(() => {
        if (!themesInUniverse.find(t => t.name === selectedTheme)) {
            setSelectedTheme(themesInUniverse[0]?.name || '');
        }
    }, [themesInUniverse, selectedTheme]);

    // Audio Output Tracking
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        // Enforce the saved device early
        ambientEngine.setOutputDevice(outputDeviceId);

        const fetchDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
                setAudioDevices(audioOutputs);
            } catch (err) {
                console.error("Error enumerating audio devices:", err);
            }
        };
        fetchDevices();
        navigator.mediaDevices.addEventListener('devicechange', fetchDevices);
        return () => navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    }, [outputDeviceId]);

    const handleThemeChange = (newTheme: string) => {
        setSelectedTheme(newTheme);
        loadTheme(selectedUniverse, newTheme);
    };

    const handleSaveNewTheme = () => {
        gmPrompt("Nom du nouveau thème ?", "", (name) => {
            if (name.trim()) {
                saveTheme(selectedUniverse, name.trim());
                setSelectedTheme(name.trim());
            }
        });
    };

    const handleDeleteTheme = () => {
        const theme = themesInUniverse.find(t => t.name === selectedTheme);
        if (!theme) return;

        gmConfirm(`Supprimer le thème "${theme.name}" ?`, () => {
            deleteTheme(theme.id);
        });
    };

    const handleAddUniverse = () => {
        gmPrompt("Nom du nouvel univers ?", "", (name) => {
            const trimmed = name.trim();
            if (trimmed) {
                addUniverse(trimmed);
                setSelectedUniverse(trimmed);
            }
        });
    };


    return (
        <div className="h-full flex flex-col gap-4 p-2 lg:p-4 font-sans select-none">
            {/* Header / Library Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/60 border border-slate-800/50 p-6 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gm-cyan/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />

                <div className="flex items-center gap-4 z-10">
                    <div className="w-12 h-12 rounded-2xl bg-gm-cyan/10 border border-gm-cyan/20 flex items-center justify-center text-gm-cyan shadow-glow-cyan">
                        <Wind size={24} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white italic tracking-tight uppercase">Ambient <span className="text-gm-cyan">OS</span></h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signal Route: 7.1 Virtual Surround</p>
                    </div>
                </div>

                {/* Hierarchical Selector */}
                <div className="flex items-center gap-3 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 z-10">
                    {/* Universe Select */}
                    <div className="flex flex-col px-3 relative group/uni">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[8px] font-black text-slate-600 uppercase">Univers</label>
                            <button onClick={handleAddUniverse} className="opacity-0 group-hover/uni:opacity-100 transition-opacity p-0.5" title="Nouvel Univers">
                                <Plus size={8} className="text-gm-cyan" />
                            </button>
                        </div>
                        <select
                            value={selectedUniverse}
                            onChange={(e) => {
                                const newUni = e.target.value;
                                setSelectedUniverse(newUni);
                                const firstTheme = presets.find((p: AmbientTheme) => p.universe === newUni)?.name || '';
                                setSelectedTheme(firstTheme);
                            }}
                            className="bg-transparent text-xs font-bold text-slate-400 focus:outline-none focus:text-white cursor-pointer"
                        >
                            {universes.map((u: string) => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
                        </select>
                    </div>

                    <div className="h-8 w-px bg-slate-800 mx-1" />

                    {/* Theme Select */}
                    <div className="flex flex-col px-3 min-w-[140px]">
                        <label className="text-[8px] font-black text-slate-600 uppercase mb-1">Thème d'Ambiance</label>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedTheme}
                                onChange={(e) => handleThemeChange(e.target.value)}
                                className="bg-transparent text-sm font-black text-gm-cyan focus:outline-none cursor-pointer flex-1"
                            >
                                {themesInUniverse.length > 0 ? (
                                    themesInUniverse.map((t: AmbientTheme) => (
                                        <option key={t.id} value={t.name} className="bg-slate-900">{t.name}</option>
                                    ))
                                ) : (
                                    <option value="" className="bg-slate-900">(Vide)</option>
                                )}
                            </select>
                            {themesInUniverse.length > 0 && (
                                <button
                                    onClick={handleDeleteTheme}
                                    className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                                    title="Supprimer ce thème"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 pr-2">
                        <button
                            onClick={() => loadTheme(selectedUniverse, selectedTheme)}
                            className="p-2.5 bg-gm-cyan/10 hover:bg-gm-cyan/20 text-gm-cyan rounded-xl transition-all border border-gm-cyan/10 flex items-center justify-center"
                            title="Recharger"
                        >
                            <Layers size={16} />
                        </button>
                        <button
                            onClick={handleSaveNewTheme}
                            className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl transition-all border border-emerald-500/10 flex items-center justify-center"
                            title="Sauvegarder Nouveau"
                        >
                            <Save size={16} />
                        </button>
                    </div>
                </div>

                {/* Master Output & Volume */}
                <div className="flex items-center gap-6 z-10 bg-slate-950/40 p-2 pl-4 rounded-3xl border border-slate-800">
                    <div className="flex flex-col items-end gap-2">
                        <select
                            value={outputDeviceId}
                            onChange={(e) => {
                                const newId = e.target.value;
                                setOutputDevice(newId);
                                ambientEngine.setOutputDevice(newId);
                            }}
                            className="bg-slate-900 border-none text-slate-400 text-[10px] rounded-lg py-1 px-2 focus:ring-1 focus:ring-gm-cyan appearance-none cursor-pointer w-28 truncate"
                            title="Audio Output Device"
                        >
                            <option value="default">System Default</option>
                            {audioDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Speaker ${device.deviceId.substring(0, 5)}...`}
                                </option>
                            ))}
                        </select>
                        <MasterVisualizer />
                    </div>

                    <button
                        onClick={() => fadeOutAll()}
                        className="flex items-center gap-2 px-6 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-2xl font-black text-xs transition-all uppercase tracking-widest active:scale-95 shadow-lg group"
                    >
                        <Trash2 size={16} className="group-hover:rotate-12 transition-transform" />
                        SILENCE
                    </button>
                </div>
            </div>

            {/* Quick Scenes Row */}
            <div className="flex items-center gap-3 px-2 overflow-x-auto scrollbar-hide py-1">
                <div className="flex items-center gap-2 text-gm-emerald bg-gm-emerald/10 border border-gm-emerald/20 px-3 py-2 rounded-xl">
                    <Activity size={14} />
                    <span className="text-[10px] font-black uppercase tracking-tight">Quick Scenes</span>
                </div>
                {scenes.map(scene => (
                    <button
                        key={scene.id}
                        onClick={() => applyScene(scene.id)}
                        className="px-5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-gm-cyan/50 hover:bg-slate-800 transition-all text-[11px] font-bold uppercase tracking-wide whitespace-nowrap group"
                    >
                        <span className="text-slate-400 group-hover:text-white transition-colors">{scene.name}</span>
                    </button>
                ))}
            </div>

            {/* Mixer Grid */}
            <div className="flex-1 min-h-0 bg-slate-950/20 rounded-3xl border border-slate-900/50 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 h-full">
                    {tracks.map((track: AmbientTrackState, i: number) => (
                        <AmbientTrack key={track.id} track={track} index={i} />
                    ))}
                </div>
            </div>

            {/* Status Footer */}
            <div className="flex justify-between items-center px-6 py-3 bg-slate-900/40 rounded-2xl border border-slate-800/50 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
                        Engine Ready
                    </span>
                    <span className="text-slate-700">|</span>
                    <span>Buffer: 48kHz PCM</span>
                    <span className="text-slate-700">|</span>
                    <span>Latence: ~12ms</span>
                </div>
                <div className="flex items-center gap-2">
                    <Music size={12} />
                    <span>Master Bus: Dynamics Active</span>
                </div>
            </div>
        </div>
    );
};

export default AmbientDashboard;
