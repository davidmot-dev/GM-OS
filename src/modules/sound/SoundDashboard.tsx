import React, { useEffect, useState } from 'react';
import { useSoundStore } from './useSoundStore';
import SoundPad from './components/SoundPad';
import { useMidiControls } from './useMidiControls';
import { useKeyboardControls } from './useKeyboardControls';
import { soundEngine } from './SoundEngine';

const SoundDashboard: React.FC = () => {
    const store = useSoundStore();
    const pads = Object.values(store.pads).sort((a, b) => a.id.localeCompare(b.id));

    // Initialize Global Input Listeners
    useMidiControls();
    useKeyboardControls();

    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        // Sync engine output device on mount
        soundEngine.setOutputDevice(store.outputDeviceId);

        const fetchDevices = async () => {
            try {
                // Request permissions first on some browsers, but Electron usually has it
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
    }, [store.outputDeviceId]); // Added store.outputDeviceId to dependencies to sync if it changes externally

    // Custom Scrollbar and slider styles
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
            .vertical-slider { -webkit-appearance: none; background: #334155; outline: none; }
            .vertical-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; background: white; cursor: pointer; border-radius: 50%; }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const handleStopAll = () => {
        store.stopAllPads();
        // Trigger SoundEngine as well
        // soundEngine.stopAll();
    };

    const handleLoadAudios = async () => {
        try {
            // @ts-expect-error global
            if (!window.appBridge?.sound?.loadAudios) {
                console.warn('Electron IPC not available');
                return;
            }

            // @ts-expect-error global
            const selectedFiles: string[] = await window.appBridge.sound.loadAudios();

            if (selectedFiles && selectedFiles.length > 0) {
                // Find empty pads
                const emptyPads = pads.filter(p => !p.filePath);

                selectedFiles.forEach((file, index) => {
                    if (index < emptyPads.length) {
                        const fileName = file.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, "") || "New Sound";
                        store.setPadFile(emptyPads[index].id, file, fileName);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading audio files:', error);
        }
    };

    return (
        <div className="h-full flex overflow-hidden font-sans bg-[#0f172a] text-slate-50">
            {/* Sidebar Controls */}
            <aside className="w-72 bg-[#020617] border-r border-slate-800 flex flex-col p-6 space-y-8">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-violet-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                        <span className="material-symbols-outlined text-white text-xl">graphic_eq</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">SOUND OS <span className="text-violet-500">v5</span></h1>
                </div>

                <nav className="flex-1 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Library Management</label>
                        <button
                            onClick={handleLoadAudios}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all border border-slate-700 group"
                        >
                            <span className="material-symbols-outlined text-xl group-hover:scale-110">upload_file</span>
                            <span className="text-sm font-semibold tracking-wide">+ LOAD AUDIOS</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">External Mapping</label>
                        <button
                            onClick={store.toggleMidiLearn}
                            className={`w-full py-3 px-4 rounded-lg flex items-center justify-between transition-all border ${store.isMidiLearnActive ? 'bg-amber-900/20 border-amber-500/50 text-amber-500' : 'bg-slate-900 border-slate-700 hover:border-amber-500/50 text-slate-400 hover:text-amber-500/80'}`}
                        >
                            <span className="text-sm font-medium">MIDI LEARN</span>
                            {store.isMidiLearnActive && <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse"></span>}
                        </button>

                        <button
                            onClick={store.toggleKeyLearn}
                            className={`w-full py-3 px-4 rounded-lg flex items-center justify-between transition-all border ${store.isKeyLearnActive ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400'}`}
                        >
                            <span className="text-sm font-medium">KEY LEARN</span>
                            <span className={`w-2 h-2 rounded-full ${store.isKeyLearnActive ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-pulse' : 'bg-slate-700'}`}></span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audio Output</label>
                        <div className="relative">
                            <select
                                value={store.outputDeviceId}
                                onChange={e => {
                                    const deviceId = e.target.value;
                                    store.setOutputDevice(deviceId);
                                    soundEngine.setOutputDevice(deviceId);
                                }}
                                className="w-full bg-slate-800 border-none text-slate-200 text-sm rounded-lg py-3 px-4 focus:ring-1 focus:ring-violet-500 appearance-none cursor-pointer"
                            >
                                <option value="default">Default System Output</option>
                                {audioDevices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Speaker ${device.deviceId.substring(0, 5)}...`}
                                    </option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                        </div>
                    </div>
                </nav>

                <div className="pt-6 border-t border-slate-800">
                    <button
                        onClick={handleStopAll}
                        className="w-full border-2 border-red-500/50 hover:bg-red-500/10 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center space-x-3 transition-all"
                    >
                        <span className="material-symbols-outlined">stop_circle</span>
                        <span>STOP ALL</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-500 mt-3 italic">3s Master Fade-Out active</p>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col bg-[#0f172a] overflow-hidden">
                <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-tighter">Engine Ready</span>
                        </div>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-tighter">Preset:</span>
                            <span className="text-xs font-bold text-white uppercase">Dungeon_Atmosphere_v1</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">settings</span>
                        </button>
                        <button className="text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">save</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-4 gap-4 max-w-6xl mx-auto h-full content-start">
                        {pads.map(pad => (
                            <SoundPad key={pad.id} pad={pad} />
                        ))}
                    </div>
                </div>

                {/* Console */}
                <section className="h-48 border-t border-slate-800 bg-[#020617] p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span className="material-symbols-outlined text-sm">terminal</span>
                            <span>Sound Console / MIDI Debug</span>
                        </div>
                        <button className="text-[10px] text-slate-600 hover:text-slate-400 uppercase font-bold tracking-widest">Clear Logs</button>
                    </div>
                    <div className="flex-1 bg-black/40 rounded border border-slate-800/50 p-3 font-mono text-xs overflow-y-auto custom-scrollbar">
                        <div className="flex space-x-4 py-0.5">
                            <span className="text-slate-600">14:22:01</span>
                            <span className="text-amber-500">[MIDI]</span>
                            <span className="text-slate-300 italic">Listening for events...</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default SoundDashboard;
