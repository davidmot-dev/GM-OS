import React, { useState, useEffect } from 'react';
import { Plus, Music, CloudSnow, Sword, Skull, Beer, StopCircle, ChevronDown, Check, RotateCcw, Keyboard } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { gmPrompt, gmConfirm } from '../../../stores/useModalStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';

const MusicHeader: React.FC = () => {
    const { 
        playlists, 
        activePlaylistId, 
        setActivePlaylistId, 
        addPlaylist, 
        removePlaylist, 
        renamePlaylist,
        stopAll, 
        outputDeviceId, 
        setOutputDevice, 
        isKeyLearnActive, 
        toggleKeyLearn,
        reset
    } = useMusicStore();
    const { getAudioLabel, fetchAudioDevices: fetchAliases } = useHardwareStore();

    const currentId = activePlaylistId || playlists[0]?.id;
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

    // Sync engine and aliases on mount
    useEffect(() => {
        fetchAliases();
    }, [fetchAliases]);

    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('wood') || n.includes('forest') || n.includes('snow')) return <CloudSnow size={12} />;
        if (n.includes('orc') || n.includes('battle') || n.includes('combat')) return <Sword size={12} />;
        if (n.includes('abyss') || n.includes('skull') || n.includes('death')) return <Skull size={12} />;
        if (n.includes('tavern') || n.includes('inn') || n.includes('city')) return <Beer size={12} />;
        return <Music size={12} />;
    };

    const currentDeviceLabel = getAudioLabel(outputDeviceId);

    return (
        <header className="relative z-50 flex flex-col gap-2">
            <div className="flex items-center justify-between bg-app-bg/40 backdrop-blur-3xl border border-app-border/50 p-2 px-4 rounded-2xl shadow-2xl">
                {/* Left: Atmosphere Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <div className="flex bg-app-surface/40 p-1 rounded-xl border border-app-border/50 shadow-inner">
                        {playlists.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActivePlaylistId(p.id)}
                                onDoubleClick={() => gmPrompt(`Renommer "${p.name}" :`, p.name, (newName) => {
                                    if (newName && newName.trim()) renamePlaylist(p.id, newName.trim());
                                })}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    gmConfirm(`Supprimer "${p.name}" ?`, () => removePlaylist(p.id), () => {}, "Supprimer", "Annuler");
                                }}
                                className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative ${currentId === p.id 
                                    ? 'bg-accent text-white shadow-glow-accent' 
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-app-surface/5'}`}
                                title="Double-clic pour renommer, Clic-droit pour supprimer"
                            >
                                {getIcon(p.name)}
                                <span>{p.name}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => gmPrompt("Nom de l'atmosphère :", "", (n) => n && addPlaylist(n))}
                        className="size-9 shrink-0 flex items-center justify-center rounded-xl bg-app-surface/5 border border-app-border/50 text-slate-500 hover:text-white hover:bg-accent/20 hover:border-accent/30 transition-all"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {/* Right: Essential Controls */}
                <div className="flex items-center gap-3">
                    <div className="flex bg-app-bg/40 p-1 rounded-xl border border-app-border/40 shadow-inner mr-2">
                        <button
                            onClick={toggleKeyLearn}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isKeyLearnActive 
                                ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400 shadow-glow-cyan' 
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
                            className={`flex items-center gap-3 bg-app-surface/40 border rounded-xl px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all ${isDeviceMenuOpen ? 'border-accent text-white shadow-glow-accent/30' : 'border-app-border/50 text-slate-500 hover:border-app-border/10 hover:text-slate-300'}`}
                        >
                            <span className="truncate max-w-[120px]">{currentDeviceLabel}</span>
                            <ChevronDown size={12} className={`transition-transform duration-300 ${isDeviceMenuOpen ? 'rotate-180 text-accent' : ''}`} />
                        </button>

                        {isDeviceMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-app-bg/95 backdrop-blur-2xl border border-app-border/50 rounded-2xl shadow-3xl p-1.5 animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => { setOutputDevice('default'); setIsDeviceMenuOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${outputDeviceId === 'default' ? 'bg-accent/20 text-white' : 'text-slate-400 hover:bg-app-surface/5 hover:text-white'}`}
                                    >
                                        <span>Default Speaker</span>
                                        {outputDeviceId === 'default' && <Check size={12} className="text-gm-violet" />}
                                    </button>
                                    
                                    <div className="h-px bg-white/5 my-1 mx-2" />
                                    
                                    {audioDevices.map((device: MediaDeviceInfo) => (
                                        <button
                                            key={device.deviceId}
                                            onClick={() => { setOutputDevice(device.deviceId); setIsDeviceMenuOpen(false); }}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-left ${outputDeviceId === device.deviceId ? 'bg-gm-violet/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <span className="truncate pr-4">{getAudioLabel(device.deviceId)}</span>
                                            {outputDeviceId === device.deviceId && <Check size={12} className="text-gm-violet" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => stopAll()}
                        className="size-9 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                        title="Arrêt brutal de toutes les pistes"
                    >
                        <StopCircle size={16} />
                    </button>

                    <button
                        onClick={() => gmConfirm("Voulez-vous vraiment réinitialiser le module Music OS ? Toutes vos atmosphères et configurations seront perdues.", () => reset())}
                        title="Réinitialiser le module"
                        className="size-9 bg-red-500/5 border border-red-500/10 text-red-500/50 rounded-xl flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all active:scale-95"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default MusicHeader;
