import React, { useState, useEffect } from 'react';
import { StopCircle, ChevronDown, Check, Zap, Keyboard, RefreshCcw } from 'lucide-react';
import { useSoundStore } from '../useSoundStore';
import { soundEngine } from '../SoundEngine';
import { soundController } from '../SoundController';
import { useMidiControls } from '../useMidiControls';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SoundHeaderProps {
}

const SoundHeader: React.FC<SoundHeaderProps> = () => {
    const { refreshMidi } = useMidiControls();
    const { 
        outputDeviceId, 
        setOutputDevice, 
        isMidiLearnActive, 
        toggleMidiLearn, 
        isKeyLearnActive, 
        toggleKeyLearn,
        isMidiConnected
    } = useSoundStore();

    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);

    useEffect(() => {
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

        const handleClickOutside = (e: MouseEvent) => {
            if (isDeviceMenuOpen && !(e.target as Element).closest('.device-selector')) {
                setIsDeviceMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDeviceMenuOpen]);

    const currentDeviceLabel = audioDevices.find((d: MediaDeviceInfo) => d.deviceId === outputDeviceId)?.label || 'Speaker';

    const handleStopAll = () => {
        soundController.stopAll();
    };

    return (
        <header className="relative z-50 flex flex-col gap-2">
            <div className="flex items-center justify-between bg-obsidian-dark/40 backdrop-blur-3xl border border-white/5 p-2 px-4 rounded-2xl shadow-2xl">
                {/* Left: Indicators */}
                <div className="flex items-center gap-6">

                    <div className="flex items-center gap-4 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2">
                            <div className={`size-1.5 rounded-full transition-all duration-500 ${isMidiConnected ? 'bg-emerald-500 shadow-glow-emerald animate-pulse' : 'bg-slate-600'}`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest leading-none transition-colors ${isMidiConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {isMidiConnected ? 'MIDI CONNECTED' : 'NO MIDI DEVICE'}
                            </span>
                        </div>
                        <button 
                            onClick={refreshMidi}
                            className="p-1 hover:bg-white/10 rounded-md text-slate-500 hover:text-white transition-all group"
                            title="Actualiser les périphériques MIDI"
                        >
                            <RefreshCcw size={10} className="group-active:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-3">
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner mr-2">
                        <button
                            onClick={toggleMidiLearn}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isMidiLearnActive 
                                ? 'bg-amber-500 text-slate-950 shadow-glow-amber' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <Zap size={10} />
                            <span>MIDI LEARN</span>
                        </button>
                        <button
                            onClick={toggleKeyLearn}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isKeyLearnActive 
                                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <Keyboard size={10} />
                            <span>KEY LEARN</span>
                        </button>
                    </div>

                    {/* Custom Device Selector */}
                    <div className="relative device-selector">
                        <button
                            onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
                            className={`flex items-center gap-3 bg-black/40 border rounded-xl px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all ${isDeviceMenuOpen ? 'border-gm-violet text-white shadow-glow-violet/30' : 'border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'}`}
                        >
                            <span className="truncate max-w-[120px]">{currentDeviceLabel}</span>
                            <ChevronDown size={12} className={`transition-transform duration-300 ${isDeviceMenuOpen ? 'rotate-180 text-gm-violet' : ''}`} />
                        </button>

                        {isDeviceMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-obsidian-dark/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-3xl p-1.5 animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => { setOutputDevice('default'); soundEngine.setOutputDevice('default'); setIsDeviceMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${outputDeviceId === 'default' ? 'bg-gm-violet/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <span>Default Speaker</span>
                                        {outputDeviceId === 'default' && <Check size={12} className="text-gm-violet" />}
                                    </button>
                                    
                                    <div className="h-px bg-white/5 my-1 mx-2" />
                                    
                                    {audioDevices.map((device: MediaDeviceInfo) => (
                                        <button
                                            key={device.deviceId}
                                            onClick={() => { setOutputDevice(device.deviceId); soundEngine.setOutputDevice(device.deviceId); setIsDeviceMenuOpen(false); }}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-left ${outputDeviceId === device.deviceId ? 'bg-gm-violet/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <span className="truncate pr-4">{device.label || `Device ${device.deviceId.substring(0, 4)}`}</span>
                                            {outputDeviceId === device.deviceId && <Check size={12} className="text-gm-violet" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleStopAll}
                        className="size-10 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 group relative"
                        title="Arrêt Progressif (3s)"
                    >
                        <StopCircle size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default SoundHeader;
