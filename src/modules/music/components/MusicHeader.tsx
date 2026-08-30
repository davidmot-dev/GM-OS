import React, { useState, useEffect } from 'react';
import { Plus, Music, CloudSnow, Sword, Skull, Beer, StopCircle, ChevronDown, Check, RotateCcw, Keyboard, Activity, Globe, Bookmark, Unlink } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { usePlaylistsVisibles } from '../usePlaylistsVisibles';
import { musicEngine } from '../MusicEngine';
import { gmPrompt, gmConfirm } from '../../../stores/useModalStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';

const MusicHeader: React.FC = () => {
    const {
        setActivePlaylistId,
        addPlaylist,
        removePlaylist,
        renamePlaylist,
        assignerLaPlaylist,
        stopAll,
        outputDeviceId,
        setOutputDevice,
        isKeyLearnActive,
        toggleKeyLearn,
        reset
    } = useMusicStore();
    const { getAudioLabel, fetchAudioDevices: fetchAliases } = useHardwareStore();

    /*
      **Les onglets ne montrent plus toute la bibliothèque** — seulement les
      atmosphères de la campagne ouverte, les communes, et les orphelines.
      Le tri et la re-sélection viennent d'un seul endroit : voir
      `usePlaylistsVisibles`.
    */
    const { classees, visibles, active, campagneId } = usePlaylistsVisibles();
    const currentId = active?.id;
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

    /*
      Un seul parcours d'onglets, avec le genre porté à côté : sans campagne
      ouverte il n'y a rien à distinguer, et trois listes rendues séparément
      auraient trois fois la même trentaine de lignes de classes.
    */
    type Genre = 'libre' | 'campagne' | 'commune' | 'orpheline';
    const onglets: { p: typeof visibles[number]; genre: Genre }[] = campagneId === null
        ? visibles.map(p => ({ p, genre: 'libre' as const }))
        : [
            ...classees.deLaCampagne.map(p => ({ p, genre: 'campagne' as const })),
            ...classees.communes.map(p => ({ p, genre: 'commune' as const })),
            ...classees.orphelines.map(p => ({ p, genre: 'orpheline' as const })),
        ];

    const infobulleDuGenre: Record<Genre, string> = {
        libre: 'Aucune campagne ouverte — toute la bibliothèque est visible',
        campagne: 'Atmosphère de cette campagne',
        commune: 'Atmosphère commune — visible dans toutes les campagnes',
        orpheline: 'Rattachée à une campagne qui n’existe plus. Rendez-la commune ou rattachez-la.',
    };

    /*
      **Le rattachement de l'atmosphère sélectionnée.** Un aller-retour : la
      rendre commune, ou la rattacher à la campagne ouverte. Rien d'autre —
      lier une atmosphère à une campagne qu'on ne joue pas la ferait
      disparaître de l'écran dans le même geste.
    */
    const estCommune = active ? (active.campagneId ?? null) === null : false;
    const basculerLeRattachement = () => {
        if (!active || campagneId === null) return;
        assignerLaPlaylist(active.id, estCommune ? campagneId : null);
    };

    return (
        <header className="relative z-50 flex flex-col gap-2">
            <div className="flex items-center justify-between bg-app-bg/40 backdrop-blur-3xl border border-app-border/50 p-2 px-4 rounded-2xl shadow-2xl">
                {/* Left: Atmosphere Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <div className="flex items-center bg-app-surface/40 p-1 rounded-xl border border-app-border/50 shadow-inner">
                        {onglets.length === 0 && (
                            <span className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600">
                                Aucune atmosphère ici
                            </span>
                        )}
                        {onglets.map(({ p, genre }, rang) => (
                            <React.Fragment key={p.id}>
                                {/* Le trait ne sépare que des genres différents. */}
                                {rang > 0 && onglets[rang - 1].genre !== genre && (
                                    <div className="w-px self-stretch my-1 mx-1.5 bg-app-border/60 shrink-0" />
                                )}
                                <button
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
                                    title={`${infobulleDuGenre[genre]}\nDouble-clic pour renommer, Clic-droit pour supprimer`}
                                >
                                    {getIcon(p.name)}
                                    <span>{p.name}</span>
                                    {genre === 'commune' && <Globe size={9} className="opacity-50 shrink-0" />}
                                    {genre === 'orpheline' && <Unlink size={9} className="text-amber-500 shrink-0" />}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                    <button
                        onClick={() => gmPrompt("Nom de l'atmosphère :", "", (n) => n && addPlaylist(n, campagneId))}
                        title={campagneId
                            ? "Nouvelle atmosphère, rattachée à la campagne ouverte"
                            : "Nouvelle atmosphère commune (aucune campagne ouverte)"}
                        className="size-9 shrink-0 flex items-center justify-center rounded-xl bg-app-surface/5 border border-app-border/50 text-slate-500 hover:text-white hover:bg-accent/20 hover:border-accent/30 transition-all"
                    >
                        <Plus size={14} />
                    </button>

                    {/*
                      **Le rattachement de l'atmosphère sélectionnée.**

                      Sans campagne ouverte, il n'y a rien à rattacher *à* quoi
                      que ce soit : le bouton disparaît plutôt que de proposer
                      un geste sans effet. — David, 2026-08-30.
                    */}
                    {campagneId !== null && active && (
                        <button
                            onClick={basculerLeRattachement}
                            title={estCommune
                                ? `Rattacher "${active.name}" à la campagne ouverte — elle n'apparaîtra plus ailleurs`
                                : `Rendre "${active.name}" commune — elle apparaîtra dans toutes les campagnes`}
                            className={`h-9 shrink-0 flex items-center gap-2 px-3 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${estCommune
                                ? 'bg-app-surface/5 border-app-border/50 text-slate-500 hover:text-white hover:border-accent/30'
                                : 'bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-white'}`}
                        >
                            {estCommune ? <Globe size={12} /> : <Bookmark size={12} />}
                            <span>{estCommune ? 'Commune' : 'Campagne'}</span>
                        </button>
                    )}
                </div>

                {/* Right: Essential Controls */}
                <div className="flex items-center gap-3">
                    <div className="flex bg-app-bg/40 p-1 rounded-xl border border-app-border/40 shadow-inner mr-2 gap-1">
                        <button
                            onClick={async () => {
                                await musicEngine.resume();
                                const gWin = window as unknown as { useToastStore?: { getState: () => { gmToast: (t: string, m: string) => void } } };
                                if (gWin.useToastStore) gWin.useToastStore.getState().gmToast('info', 'Moteur Audio relancé !');
                            }}
                            title="Forcer la reprise du moteur audio (en cas de blocage)"
                            className="size-9 bg-accent/10 border border-accent/20 text-accent rounded-xl flex items-center justify-center hover:bg-accent hover:text-white transition-all active:scale-95"
                        >
                            <Activity size={14} />
                        </button>
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
