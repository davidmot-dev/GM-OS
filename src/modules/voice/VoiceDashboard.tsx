import React, { useEffect } from 'react';
import { 
    Mic2, 
    Settings2, 
    Activity, 
    Ghost, 
    Skull, 
    Cpu, 
    Flame, 
    Radio, 
    Volume2, 
    Zap
} from 'lucide-react';
import { useVoiceStore } from './useVoiceStore';
import { voiceEngine } from './VoiceEngine';

const VocalShaperSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (val: number) => void;
    unit?: string;
}> = ({ label, value, min, max, step = 1, onChange, unit = '' }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span>{label}</span>
            <span className="text-blue-400">{value}{unit}</span>
        </div>
        <input 
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
    </div>
);

const VoiceDashboard: React.FC = () => {
    const { 
        isActive, 
        isLive, 
        isMonitor, 
        isSyncNPC,
        currentEffects,
        activePresetId,
        inputLevel,
        presets,
        toggleActive,
        toggleLive,
        toggleMonitor,
        toggleSyncNPC,
        updateEffect,
        applyPreset,
        toggleAntiLarsen,
        toggleNoiseGate,
        outputDeviceId,
        availableOutputs,
        setOutputDeviceId
    } = useVoiceStore();

    useEffect(() => {
        voiceEngine.refreshAvailableDevices();
        if (isActive) {
            voiceEngine.initialize().catch(err => console.error("Voice initialization failed", err));
        } else {
            voiceEngine.stop();
        }

        // Cleanup on unmount
        return () => {
            if (!isActive) voiceEngine.stop();
        };
    }, [isActive]);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Ghost': return <Ghost size={18} />;
            case 'Skull': return <Skull size={18} />;
            case 'Cpu': return <Cpu size={18} />;
            case 'Flame': return <Flame size={18} />;
            default: return <Mic2 size={18} />;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 font-sans text-slate-200 overflow-hidden">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mic Status: {isActive ? 'Active' : 'Standby'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latency: 12ms</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">DSP Load: 4%</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => toggleMonitor()}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isMonitor ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500 border border-transparent hover:text-slate-300'}`}
                    >
                        🎧 Monitor
                    </button>
                    <button 
                        onClick={() => toggleSyncNPC()}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isSyncNPC ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500 border border-transparent hover:text-slate-300'}`}
                    >
                        🔄 Sync NPC
                    </button>
                    <button 
                        onClick={() => toggleActive()}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-800 text-slate-300'}`}
                    >
                        {isActive ? 'MIC ON' : 'MIC OFF'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Presets */}
                <aside className="w-64 border-r border-white/5 flex flex-col p-4 gap-2 bg-slate-900/20 overflow-y-auto custom-scrollbar">
                    <h3 className="px-2 mb-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Vocal Templates</h3>
                    {presets.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => applyPreset(preset.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all group overflow-hidden relative ${activePresetId === preset.id 
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' 
                                : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent'}`}
                        >
                            <div className={`${activePresetId === preset.id ? 'text-blue-400' : 'text-slate-600 group-hover:text-blue-500'} transition-colors`}>
                                {getIcon(preset.icon)}
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                                <span className="font-bold text-sm">{preset.name}</span>
                                <span className="text-[10px] opacity-60 truncate w-full">{preset.description}</span>
                            </div>
                            {activePresetId === preset.id && (
                                <div className="absolute right-[-10px] top-[-10px] w-10 h-10 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
                            )}
                        </button>
                    ))}
                    <div className="mt-8 px-2 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Volume2 size={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Audio Output</h3>
                        </div>
                        <select
                            value={outputDeviceId || ''}
                            onChange={(e) => setOutputDeviceId(e.target.value || null)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all custom-scrollbar"
                        >
                            <option value="">Default System Output</option>
                            {availableOutputs.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Périphérique ${device.deviceId.slice(0, 5)}...`}
                                </option>
                            ))}
                        </select>
                        <button 
                            onClick={() => voiceEngine.refreshAvailableDevices()}
                            className="text-[9px] text-slate-600 hover:text-blue-500 transition-colors uppercase font-bold text-left px-1"
                        >
                            ↻ Refresh Devices
                        </button>
                    </div>

                    <button className="mt-4 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-800 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:border-slate-600 hover:text-slate-400 transition-all">
                        + Custom Profile
                    </button>
                </aside>

                {/* Main View */}
                <div className="flex-1 flex flex-col relative overflow-hidden p-8 12">
                    {/* Visualizer Area */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="relative w-80 h-80 flex items-center justify-center">
                            {/* Animated Rings */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/5 scale-[1.1]" />
                            <div className="absolute inset-0 rounded-full border border-blue-500/10 scale-[1.3] animate-pulse" />
                            
                            {/* Waveform Circle Emulation */}
                            <div 
                                className="absolute inset-0 rounded-full border-4 border-blue-500/20 transition-transform duration-75" 
                                style={{ transform: `scale(${1 + inputLevel * 0.4})` }} 
                            />
                            
                            {/* Main Mic Icon */}
                            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-blue-600/10 border-2 border-blue-500/30' : 'bg-slate-900 border-2 border-slate-800'}`}>
                                <Mic2 size={64} className={`transition-all duration-300 ${isActive ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-700'}`} />
                                
                                {/* Pulse Effect when speaking */}
                                {isActive && (
                                    <div 
                                        className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl transition-opacity duration-150" 
                                        style={{ opacity: inputLevel }} 
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Go Live Button Area */}
                    <div className="mt-auto flex flex-col items-center gap-6">
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                            Auralis <span className="text-blue-500">OS</span>
                        </h2>
                        
                        <button 
                            onClick={() => toggleLive()}
                            className={`group relative overflow-hidden px-12 py-4 rounded-full font-black text-lg transition-all duration-500 border shadow-2xl ${isLive 
                                ? 'bg-red-600 text-white border-red-500 animate-pulse ring-4 ring-red-600/20' 
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-blue-500/50 hover:text-blue-400'}`}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                <Radio size={20} className={isLive ? 'animate-bounce' : ''} />
                                {isLive ? 'LIVE BROADCAST' : 'GO LIVE'}
                            </span>
                            {isLive && (
                                <div className="absolute inset-0 bg-red-500/20 blur-xl opacity-50" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Sidebar: Vocal Shapers */}
                <aside className="w-80 border-l border-white/5 p-6 flex flex-col gap-6 bg-slate-900/10 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings2 size={16} className="text-slate-500" />
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vocal Shapers</h3>
                    </div>

                    <div className="flex flex-col gap-6">
                        <VocalShaperSlider 
                            label="Pitch Shift" 
                            value={currentEffects.pitch} 
                            min={-12} max={12} 
                            onChange={(val) => updateEffect('pitch', val)} 
                            unit="st"
                        />
                        <VocalShaperSlider 
                            label="Formant (Timbre)" 
                            value={currentEffects.formant} 
                            min={-100} max={100} 
                            onChange={(val) => updateEffect('formant', val)} 
                        />
                        <VocalShaperSlider 
                            label="Room Reverb" 
                            value={currentEffects.reverb} 
                            min={0} max={1} step={0.01}
                            onChange={(val) => updateEffect('reverb', val)} 
                        />
                        <VocalShaperSlider 
                            label="Distortion" 
                            value={currentEffects.distortion} 
                            min={0} max={1} step={0.01}
                            onChange={(val) => updateEffect('distortion', val)} 
                        />
                        <VocalShaperSlider 
                            label="Bitcrush" 
                            value={currentEffects.bitcrush} 
                            min={0} max={1} step={0.01}
                            onChange={(val) => updateEffect('bitcrush', val)} 
                        />
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/30 flex flex-col gap-3">
                        <button 
                            onClick={() => toggleAntiLarsen()}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${currentEffects.antiLarsen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/50 border-transparent text-slate-500 hover:text-slate-400'}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">🛡️ Anti-Larsen</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${currentEffects.antiLarsen ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${currentEffects.antiLarsen ? 'right-1' : 'left-1'}`} />
                            </div>
                        </button>
                        
                        <button 
                            onClick={() => toggleNoiseGate()}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${currentEffects.noiseGate ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800/50 border-transparent text-slate-500 hover:text-slate-400'}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">🔇 Noise Gate</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${currentEffects.noiseGate ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${currentEffects.noiseGate ? 'right-1' : 'left-1'}`} />
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-800/50 flex flex-col gap-6">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Volume2 size={16} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Master Output</h3>
                        </div>
                        
                        <VocalShaperSlider 
                            label="Output Gain" 
                            value={currentEffects.outputGain} 
                            min={0} max={2} step={0.05}
                            onChange={(val) => updateEffect('outputGain', val)} 
                            unit="x"
                        />
                        
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Gate Threshold</span>
                            <div className="flex gap-2">
                                <input 
                                    type="range"
                                    min="-100"
                                    max="0"
                                    step="1"
                                    value={currentEffects.gateThreshold}
                                    onChange={(e) => updateEffect('gateThreshold', parseInt(e.target.value))}
                                    className="flex-1 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500 self-center"
                                />
                                <span className="text-[10px] font-bold text-slate-500 w-12 text-right">{currentEffects.gateThreshold}dB</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Bottom VU Meter Bar */}
            <div className="h-2 bg-slate-900 border-t border-white/5 flex">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400 transition-all duration-75 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    style={{ width: `${inputLevel * 100}%` }}
                />
            </div>
        </div>
    );
};

export default VoiceDashboard;
