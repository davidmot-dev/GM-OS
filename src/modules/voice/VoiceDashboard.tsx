import React, { useEffect } from 'react';
import { 
    AudioLines,
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
import { useHardwareStore } from '../../stores/useHardwareStore';
import { useTranslation } from 'react-i18next';
import { useNPCStore } from '../npc/useNPCStore';
import { gmToast } from '../../stores/useToastStore';

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
            <span className="text-accent">{value}{unit}</span>
        </div>
        <input 
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-app-surface rounded-lg appearance-none cursor-pointer accent-accent"
        />
    </div>
);

const VoiceDashboard: React.FC = () => {
    const { 
        isActive, 
        isLive, 
        isMonitor, 
        isSyncNPC,
        isDucking,
        currentEffects,
        activePresetId,
        inputLevel,
        probabiliteDeVoix,
        presets,
        toggleActive,
        toggleLive,
        toggleMonitor,
        toggleSyncNPC,
        toggleDucking,
        updateEffect,
        applyPreset,
        toggleAntiLarsen,
        setDebruitage,
        toggleNoiseGate,
        outputDeviceId,
        availableOutputs,
        setOutputDeviceId,
        inputDeviceId,
        availableInputs,
        setInputDeviceId,
        lastSyncedEntityName,
        appliquerProfil,
        isWorkletReady
    } = useVoiceStore();
    const { getAudioLabel } = useHardwareStore();

    /*
      Les PNJ du mémo qui portent une voix. Voice-OS lit le module des PNJ, et
      non l'inverse : c'est lui qui a besoin de la liste, et le store des PNJ n'a
      pas à connaître le rack.
    */
    const voixEnregistrees = useNPCStore(state => state.savedEntities).filter(e => e.voiceProfile);
    const { t } = useTranslation();

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
        <div className="h-full flex flex-col bg-app-bg font-sans text-slate-200 overflow-hidden">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-app-border/50 bg-app-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {t('modules:voice.dashboard.mic_status')}: {isActive ? t('modules:voice.dashboard.active') : t('modules:voice.dashboard.standby')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {t('modules:voice.dashboard.latency')}: 12ms
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap size={14} className={isWorkletReady ? "text-amber-500" : "text-slate-600"} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {t('modules:voice.dashboard.dsp_load')}: {isWorkletReady ? '4%' : 'N/A'}
                        </span>
                        {!isWorkletReady && isActive && (
                            <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                                FALLBACK ACTIVE
                            </span>
                        )}
                    </div>
                    {isDucking && (
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-amber-500 animate-pulse">
                            <Volume2 size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {t('modules:voice.dashboard.ducking_active')}
                            </span>
                        </div>
                    )}
                    {lastSyncedEntityName && (
                        <div className="flex items-center gap-3 px-3 py-1 bg-accent/10 rounded-full border border-accent/20 ml-4 animate-in fade-in slide-in-from-left-4 duration-500">
                            <Mic2 size={12} className="text-accent" />
                            <span className="text-[9px] font-bold text-accent uppercase tracking-wider">
                                {t('modules:voice.dashboard.linked')}: {lastSyncedEntityName}
                            </span>
                            <span className="text-[8px] bg-accent/20 px-1.5 py-0.5 rounded text-accent/80 font-black flex items-center gap-1 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                <span className="w-1 h-1 bg-accent rounded-full animate-pulse" />
                                {t('modules:voice.dashboard.ai_optimized')}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => toggleMonitor()}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isMonitor ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-app-surface text-slate-500 border border-transparent hover:text-slate-300'}`}
                    >
                        🎧 {t('modules:voice.dashboard.monitor')}
                    </button>
                    <button 
                        onClick={() => toggleSyncNPC()}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isSyncNPC ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-app-surface text-slate-500 border border-transparent hover:text-slate-300'}`}
                    >
                        🔄 {t('modules:voice.dashboard.sync_npc')}
                    </button>
                    <button 
                        onClick={async () => {
                            // User interaction: crucial for AudioContext resume
                            await voiceEngine.initialize();
                            toggleActive();
                        }}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-app-surface text-slate-300'}`}
                    >
                        {isActive ? t('modules:voice.dashboard.mic_on') : t('modules:voice.dashboard.mic_off')}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Presets */}
                <aside className="w-64 border-r border-app-border/50 flex flex-col p-4 gap-2 bg-app-surface/20 overflow-y-auto custom-scrollbar">
                    <h3 className="px-2 mb-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{t('modules:voice.dashboard.vocal_templates')}</h3>
                    {presets.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => applyPreset(preset.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all group overflow-hidden relative ${activePresetId === preset.id 
                                ? 'bg-accent/10 text-accent border border-accent/30' 
                                : 'text-slate-500 hover:bg-app-surface/5 hover:text-slate-300 border border-transparent'}`}
                        >
                            <div className={`${activePresetId === preset.id ? 'text-accent' : 'text-slate-600 group-hover:text-accent'} transition-colors`}>
                                {getIcon(preset.icon)}
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                                <span className="font-bold text-sm">{t(preset.name)}</span>
                                <span className="text-[10px] opacity-60 truncate w-full">{t(preset.description)}</span>
                            </div>
                            {activePresetId === preset.id && (
                                <div className="absolute right-[-10px] top-[-10px] w-10 h-10 bg-accent/10 rounded-full blur-xl animate-pulse" />
                            )}
                        </button>
                    ))}

                    {/*
                        **Les voix rangées sur les fiches de PNJ.**

                        Demandé par David le 2026-08-15 : un profil généré dans
                        NPC-OS doit se rappeler ici, en séance, sans rouvrir le
                        générateur. La liste ne montre que les PNJ qui EN ONT
                        un — un rappel qui reposerait un profil inexistant
                        remettrait le rack à des valeurs que personne n'a
                        choisies.

                        Ne sont listés que les PNJ **enregistrés au mémo** :
                        `partialize` ne persiste que ceux-là, donc un profil posé
                        sur une fiche non sauvée ne survivrait pas au
                        redémarrage. Le dire ici évite de le découvrir demain.
                    */}
                    {voixEnregistrees.length > 0 && (
                        <div className="mt-8">
                            <h3 className="px-2 mb-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                Voix des PNJ
                            </h3>
                            {voixEnregistrees.map(pnj => (
                                <button
                                    key={pnj.id}
                                    onClick={() => {
                                        appliquerProfil(pnj.voiceProfile!);
                                        gmToast(`Voix de ${pnj.name} rappelée.`, 'info');
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-app-surface/5 hover:text-slate-300 border border-transparent hover:border-cyan-500/20 transition-all group"
                                >
                                    <AudioLines size={16} className="text-slate-600 group-hover:text-cyan-300 transition-colors shrink-0" />
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="font-bold text-sm truncate w-full">{pnj.name}</span>
                                        <span className="text-[10px] opacity-60">
                                            {pnj.voiceProfile!.presetId ?? 'réglage sur mesure'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 px-2 flex flex-col gap-4">
                        {/*
                          **Le sélecteur de micro — demandé par David le 2026-09-03.**

                          Il vient AVANT la sortie, parce que c'est l'ordre du
                          signal et l'ordre des ennuis : un micro qui n'est pas
                          le bon rend tout le reste sans objet. Sans lui,
                          Voice-OS prenait le périphérique par défaut de
                          Windows — *lequel se décide au branchement d'une
                          webcam, pas au moment de jouer.*
                        */}
                        <div className="flex items-center gap-2 text-slate-500">
                            <Mic2 size={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:voice.dashboard.audio_input')}</h3>
                        </div>
                        <select
                            value={inputDeviceId || ''}
                            onChange={(e) => setInputDeviceId(e.target.value || null)}
                            className="w-full bg-app-surface border border-app-border rounded-lg p-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-accent/50 transition-all custom-scrollbar"
                        >
                            <option value="">{t('modules:voice.dashboard.default_input')}</option>
                            {availableInputs.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || getAudioLabel(device.deviceId)}
                                </option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2 text-slate-500">
                            <Volume2 size={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:voice.dashboard.audio_output')}</h3>
                        </div>
                        <select
                            value={outputDeviceId || ''}
                            onChange={(e) => setOutputDeviceId(e.target.value || null)}
                            className="w-full bg-app-surface border border-app-border rounded-lg p-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-accent/50 transition-all custom-scrollbar"
                        >
                            <option value="">{t('modules:voice.dashboard.default_output')}</option>
                            {availableOutputs.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {getAudioLabel(device.deviceId)}
                                </option>
                            ))}
                        </select>
                        <button 
                            onClick={() => voiceEngine.refreshAvailableDevices()}
                            className="text-[9px] text-slate-600 hover:text-accent transition-colors uppercase font-bold text-left px-1"
                        >
                            ↻ {t('modules:voice.dashboard.refresh_devices')}
                        </button>
                    </div>

                    <button className="mt-4 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-800 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:border-slate-600 hover:text-slate-400 transition-all">
                        + {t('modules:voice.dashboard.custom_profile')}
                    </button>
                </aside>

                {/* Main View */}
                <div className="flex-1 flex flex-col relative overflow-hidden p-8 gap-12">
                    {/* Visualizer Area */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="relative w-80 h-80 flex items-center justify-center">
                            {/* Animated Rings */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/5 scale-[1.1]" />
                            <div className="absolute inset-0 rounded-full border border-accent/10 scale-[1.3] animate-pulse" />
                            
                            {/* Waveform Circle Emulation */}
                            <div 
                                className="absolute inset-0 rounded-full border-4 border-accent/20 transition-transform duration-75" 
                                style={{ transform: `scale(${1 + inputLevel * 0.4})` }} 
                            />
                            
                            {/* Main Mic Icon */}
                            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-accent/10 border-2 border-accent/20' : 'bg-slate-900 border-2 border-slate-800'}`}>
                                <Mic2 size={64} className={`transition-all duration-300 ${isActive ? 'text-accent drop-shadow-glow-accent' : 'text-slate-700'}`} />
                                
                                {/* Pulse Effect when speaking */}
                                {isActive && (
                                    <div 
                                        className="absolute inset-0 rounded-full bg-accent/20 blur-2xl transition-opacity duration-150" 
                                        style={{ opacity: inputLevel }} 
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Go Live Button Area */}
                    <div className="mt-auto flex flex-col items-center gap-6">
                        <button 
                            onClick={() => toggleLive()}
                            className={`group relative overflow-hidden px-12 py-4 rounded-full font-black text-lg transition-all duration-500 border shadow-2xl ${isLive 
                                ? 'bg-red-600 text-white border-red-500 animate-pulse ring-4 ring-red-600/20' 
                                : 'bg-app-bg text-slate-400 border-app-border hover:border-accent/50 hover:text-accent'}`}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                <Radio size={20} className={isLive ? 'animate-bounce' : ''} />
                                {isLive ? t('modules:voice.dashboard.live_broadcast') : t('modules:voice.dashboard.go_live')}
                            </span>
                            {isLive && (
                                <div className="absolute inset-0 bg-red-500/20 blur-xl opacity-50" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Sidebar: Vocal Shapers */}
                <aside className="w-80 border-l border-app-border/50 p-6 flex flex-col gap-6 bg-app-surface/10 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings2 size={16} className="text-slate-500" />
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('modules:voice.shapers.title')}</h3>
                    </div>

                    <div className="flex flex-col gap-6">
                        <VocalShaperSlider 
                            label={t('modules:voice.shapers.pitch')} 
                            value={currentEffects.pitch} 
                            min={-12} max={12} 
                            onChange={(val) => updateEffect('pitch', val)} 
                            unit="st"
                        />
                        <VocalShaperSlider 
                            label={t('modules:voice.shapers.formant')} 
                            value={currentEffects.formant} 
                            min={-100} max={100} 
                            onChange={(val) => updateEffect('formant', val)} 
                        />
                        <VocalShaperSlider 
                            label={t('modules:voice.shapers.reverb')} 
                            value={currentEffects.reverb} 
                            min={0} max={1} step={0.01}
                            onChange={(val) => updateEffect('reverb', val)} 
                        />
                        <VocalShaperSlider 
                            label={t('modules:voice.shapers.distortion')} 
                            value={currentEffects.distortion} 
                            min={0} max={1} step={0.01}
                            onChange={(val) => updateEffect('distortion', val)} 
                        />
                        <VocalShaperSlider
                            label={t('modules:voice.shapers.compression')}
                            value={currentEffects.compression}
                            min={0} max={100} step={5}
                            unit="%"
                            onChange={(val) => updateEffect('compression', val)}
                        />
                        <VocalShaperSlider 
                            label={t('modules:voice.shapers.bitcrush')} 
                            value={currentEffects.bitcrush} 
                            min={0} max={1} step={0.01}
                            onChange={(val) => updateEffect('bitcrush', val)} 
                        />
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/30 flex flex-col gap-3">
                        <button 
                            onClick={() => toggleAntiLarsen()}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${currentEffects.antiLarsen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-app-surface/50 border-transparent text-slate-500 hover:text-slate-400'}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">🛡️ {t('modules:voice.shapers.anti_larsen')}</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${currentEffects.antiLarsen ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${currentEffects.antiLarsen ? 'right-1' : 'left-1'}`} />
                            </div>
                        </button>
                        
                        {/*
                          **Le débruitage : UN réglage, trois positions.**

                          Deux interrupteurs auraient laissé empiler le
                          débruiteur du navigateur et RNNoise — *deux
                          débruiteurs qui se suivent, ce n'est pas mieux, c'est
                          pire* : le premier rabote ce que le second aurait su
                          garder. Le choix est donc exclusif par construction.
                        */}
                        <div className="flex flex-col gap-2 p-3 rounded-xl border border-transparent bg-app-surface/50">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    🧹 {t('modules:voice.shapers.noise_suppression')}
                                </span>
                                {/*
                                  La pastille de voix ne s'affiche que quand le modèle
                                  tourne : *une pastille éteinte se lit comme « il ne
                                  parle pas », pas comme « personne n'écoute ».*
                                */}
                                {currentEffects.debruitage === 'neuronal' && (
                                    <span
                                        title={t('modules:voice.shapers.voice_detected')}
                                        className={`w-2 h-2 rounded-full transition-colors ${probabiliteDeVoix > 0.6 ? 'bg-emerald-400' : 'bg-slate-700'}`}
                                    />
                                )}
                            </div>
                            <div className="flex gap-1">
                                {(['aucun', 'navigateur', 'neuronal'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setDebruitage(mode)}
                                        title={t(`modules:voice.shapers.debruitage_${mode}_hint`)}
                                        className={`flex-1 px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border ${currentEffects.debruitage === mode
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : 'bg-app-bg border-transparent text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {t(`modules:voice.shapers.debruitage_${mode}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => toggleNoiseGate()}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${currentEffects.noiseGate ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-app-surface/50 border-transparent text-slate-500 hover:text-slate-400'}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">🔇 {t('modules:voice.shapers.noise_gate')}</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${currentEffects.noiseGate ? 'bg-accent' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${currentEffects.noiseGate ? 'right-1' : 'left-1'}`} />
                            </div>
                        </button>
 
                        <button 
                            onClick={() => toggleDucking()}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${currentEffects.duckingEnabled ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-app-surface/50 border-transparent text-slate-500 hover:text-slate-400'}`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">🔊 {t('modules:voice.shapers.auto_ducking')}</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${currentEffects.duckingEnabled ? 'bg-amber-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${currentEffects.duckingEnabled ? 'right-1' : 'left-1'}`} />
                            </div>
                        </button>

                        <div className="mt-4 pt-4 border-t border-slate-800/30 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 italic">{t('modules:voice.dashboard.ducking_params')}</span>
                                <VocalShaperSlider 
                                    label={t('modules:voice.params.ducking_threshold')} 
                                    value={currentEffects.duckingThreshold} 
                                    min={-80} max={-10} step={1}
                                    onChange={(val) => updateEffect('duckingThreshold', val)} 
                                    unit="dB"
                                />
                                <VocalShaperSlider 
                                    label={t('modules:voice.params.music_reduct')} 
                                    value={Math.round((1 - currentEffects.duckingRange) * 100)} 
                                    min={0} max={100} step={5}
                                    onChange={(val) => updateEffect('duckingRange', 1 - (val / 100))} 
                                    unit="%"
                                />
                                <VocalShaperSlider 
                                    label={t('modules:voice.params.release_delay')} 
                                    value={currentEffects.duckingRelease} 
                                    min={0} max={3000} step={100}
                                    onChange={(val) => updateEffect('duckingRelease', val)} 
                                    unit="ms"
                                />
                                <VocalShaperSlider 
                                    label={t('modules:voice.params.fade_speed')} 
                                    value={currentEffects.duckingAttack} 
                                    min={50} max={1000} step={50}
                                    onChange={(val) => updateEffect('duckingAttack', val)} 
                                    unit="ms"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-app-border/50 flex flex-col gap-6">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Volume2 size={16} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:voice.dashboard.master_output')}</h3>
                        </div>
                        
                        <VocalShaperSlider 
                            label={t('modules:voice.params.output_gain')} 
                            value={currentEffects.outputGain} 
                            min={0} max={2} step={0.05}
                            onChange={(val) => updateEffect('outputGain', val)} 
                            unit="x"
                        />
                        
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t('modules:voice.params.gate_threshold')}</span>
                            <div className="flex gap-2">
                                <input 
                                    type="range"
                                    min="-100"
                                    max="0"
                                    step="1"
                                    value={currentEffects.gateThreshold}
                                    onChange={(e) => updateEffect('gateThreshold', parseInt(e.target.value))}
                                    className="flex-1 h-1.5 bg-app-surface rounded-full appearance-none cursor-pointer accent-accent self-center"
                                />
                                <span className="text-[10px] font-bold text-slate-500 w-12 text-right">{currentEffects.gateThreshold}dB</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Bottom VU Meter Bar */}
            <div className="h-2 bg-app-bg border-t border-app-border/50 flex">
                <div 
                    className="h-full bg-gradient-to-r from-accent via-accent/70 to-emerald-400 transition-all duration-75 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    style={{ width: `${inputLevel * 100}%` }}
                />
            </div>
        </div>
    );
};

export default VoiceDashboard;
