import React, { useState } from 'react';
import { useStoryboardStore } from './useStoryboardStore';
import type { StoryboardMoment } from './useStoryboardStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { 
    Zap, 
    Trash2, 
    Plus, 
    Music, 
    Sun, 
    Map as MapIcon, 
    Image as ImageIcon, 
    Volume2,
    Save,
    X,
    Settings2,
    Play,
    Waves
} from 'lucide-react';
import { useAmbientStore } from '../ambient/useAmbientStore';

const StoryboardDashboard: React.FC = () => {
    const { moments, triggerMoment, addMoment, updateMoment, deleteMoment, activeMomentId } = useStoryboardStore();
    const { activeCampaignId, atlasMaps } = useSessionOSStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editingMoment, setEditingMoment] = useState<StoryboardMoment | null>(null);

    // Form State (for new/edit)
    const [name, setName] = useState('');
    const [musicPadId, setMusicPadId] = useState('');
    const [lightSceneId, setLightSceneId] = useState('');
    const [mapUrl, setMapUrl] = useState('');
    const [imageMediaId, setImageMediaId] = useState('');
    const [soundPadId, setSoundPadId] = useState('');
    const [ambientSceneId, setAmbientSceneId] = useState('');

    const { scenes: ambientScenes } = useAmbientStore();

    const campaignMoments = moments.filter(m => m.campaignId === activeCampaignId);

    const startEdit = (moment: StoryboardMoment) => {
        setEditingMoment(moment);
        setName(moment.name || '');
        setMusicPadId(moment.musicPadId || '');
        setLightSceneId(moment.lightSceneId || '');
        setMapUrl(moment.mapUrl || '');
        setImageMediaId(moment.imageMediaId || '');
        setSoundPadId(moment.soundPadId || '');
        setAmbientSceneId(moment.ambientSceneId || '');
        setIsEditing(true);
    };

    const startNew = () => {
        setEditingMoment(null);
        setName('Nouveau Moment');
        setMusicPadId('');
        setLightSceneId('');
        setMapUrl('');
        setImageMediaId('');
        setSoundPadId('');
        setAmbientSceneId('');
        setIsEditing(true);
    };

    const handleCapture = (type: 'music' | 'light' | 'map' | 'image' | 'sound' | 'ambient') => {
        const gWin = window as any;
        const { gmToast } = gWin.useToastStore?.getState() || {};

        switch (type) {
            case 'music': {
                const musicStore = gWin.useMusicStore?.getState();
                if (musicStore) {
                    const padId = musicStore.deckA.isPlaying ? musicStore.deckA.activePadId : 
                                 (musicStore.deckB.isPlaying ? musicStore.deckB.activePadId : musicStore.deckA.activePadId);
                    if (padId) {
                        setMusicPadId(padId);
                        if (gmToast) gmToast('info', 'ID Musique capturé !');
                    }
                }
                break;
            }
            case 'light': {
                const lightStore = gWin.useLightStore?.getState();
                if (lightStore?.activeSceneId) {
                    setLightSceneId(lightStore.activeSceneId);
                    if (gmToast) gmToast('info', 'Scène Lumière capturée !');
                }
                break;
            }
            case 'map': {
                const mapStore = gWin.useMapStore?.getState();
                if (mapStore?.currentMapUrl) {
                    setMapUrl(mapStore.currentMapUrl);
                    if (gmToast) gmToast('info', 'Carte Atlas capturée !');
                }
                break;
            }
            case 'image': {
                const imageStore = gWin.useImageStore?.getState();
                if (imageStore?.activeMediaId) {
                    setImageMediaId(imageStore.activeMediaId);
                    if (gmToast) gmToast('info', 'ID Image capturé !');
                }
                break;
            }
            case 'sound': {
                // For sound, we capture the last pad used if possible, or just note active
                if (gmToast) gmToast('warning', 'Sound-OS : Tapez l\'ID du Pad (ex: PAD_01)');
                break;
            }
            case 'ambient': {
                if (gmToast) gmToast('warning', 'Ambient-OS : Sélectionnez une scène ci-dessous');
                break;
            }
        }
    };

    const handleSave = () => {
        if (!activeCampaignId) return;

        const data = {
            name,
            musicPadId: musicPadId || undefined,
            lightSceneId: lightSceneId || undefined,
            mapUrl: mapUrl || undefined,
            imageMediaId: imageMediaId || undefined,
            soundPadId: soundPadId || undefined,
            ambientSceneId: ambientSceneId || undefined,
            campaignId: activeCampaignId,
            description: '',
            color: 'var(--accent)',
            icon: 'Zap'
        };

        if (editingMoment) {
            updateMoment(editingMoment.id, data);
        } else {
            addMoment(data);
        }
        setIsEditing(false);
        setEditingMoment(null);
    };

    const getAmbientLabel = (id: string) => {
        return ambientScenes.find(s => s.id === id)?.name || 'Aucun';
    };

    return (
        <div className="flex flex-col h-full bg-app-bg/20">
            {/* Header / Editor Toggle */}
            <div className="px-8 py-4 flex items-center justify-between bg-app-surface/20 border-b border-app-border">
                <div className="flex items-center gap-3">
                    <Zap className="text-accent shadow-glow-accent" size={20} />
                    <h2 className="text-lg font-black uppercase tracking-tighter">Master Storyboard</h2>
                </div>
                
                <button 
                    onClick={startNew}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-app-bg rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-glow-accent/20"
                >
                    <Plus size={14} />
                    Créer un Moment
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Moments Grid */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {campaignMoments.map(moment => (
                            <div 
                                key={moment.id}
                                className={`group relative bg-app-surface/40 border rounded-2xl p-4 transition-all hover:bg-app-surface/60 overflow-hidden ${
                                    activeMomentId === moment.id ? 'border-accent shadow-glow-accent/10 bg-accent/5' : 'border-app-border hover:border-app-border/60'
                                }`}
                            >
                                {/* Trigger Button overlay */}
                                <button 
                                    onClick={() => triggerMoment(moment.id)}
                                    className="absolute inset-0 z-10 w-full h-full"
                                />

                                {/* Interactive Controls Overlay */}
                                <div className="absolute top-4 right-4 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); startEdit(moment); }}
                                        className="p-2 bg-app-bg/80 hover:bg-app-bg rounded-lg text-app-text/40 hover:text-accent border border-app-border/40 transition-all pointer-events-auto shadow-lg"
                                        title="Régler"
                                    >
                                        <Settings2 size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteMoment(moment.id); }}
                                        className="p-2 bg-app-bg/80 hover:bg-app-bg rounded-lg text-app-text/40 hover:text-rose-400 border border-app-border/40 transition-all pointer-events-auto shadow-lg"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="relative z-0 flex flex-col h-full pointer-events-none">
                                    <div className="flex items-start mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-app-bg border border-app-border flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                            <Play size={18} fill="currentColor" />
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-black uppercase tracking-wider mb-4 leading-tight">{moment.name}</h3>

                                    {/* Links indicators */}
                                    <div className="mt-auto flex flex-wrap gap-2">
                                        {moment.musicPadId && <Music size={12} className="text-blue-400" />}
                                        {moment.lightSceneId && <Sun size={12} className="text-orange-400" />}
                                        {moment.mapUrl && <MapIcon size={12} className="text-emerald-400" />}
                                        {moment.imageMediaId && <ImageIcon size={12} className="text-purple-400" />}
                                        {moment.soundPadId && <Volume2 size={12} className="text-rose-400" />}
                                        {moment.ambientSceneId && <Waves size={12} className="text-cyan-400" />}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {campaignMoments.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-app-text/20">
                                <Zap size={48} strokeWidth={1} className="mb-4 opacity-50" />
                                <p className="text-xs font-black uppercase tracking-widest text-center max-w-[200px]">
                                    Aucun moment configuré pour cette campagne
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Editor */}
                {isEditing && (
                    <div className="w-96 bg-app-surface/40 border-l border-app-border p-8 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-accent">Configuration</h3>
                            <button onClick={() => setIsEditing(false)} className="text-app-text/40 hover:text-app-text">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-6 flex-1">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Nom du Moment</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-app-bg/60 border border-app-border rounded-xl px-4 py-3 text-sm font-bold focus:border-accent outline-none transition-all"
                                    placeholder="ex: Combat Final"
                                />
                            </div>

                            {/* Music Picker */}
                            <div className="space-y-2">
                                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-app-text/40">
                                    <span className="flex items-center gap-2"><Music size={12} /> Musique</span>
                                    <button 
                                        onClick={() => handleCapture('music')}
                                        className="text-accent hover:underline lowercase"
                                    >
                                        [Capturer Active]
                                    </button>
                                </label>
                                <select 
                                    value={musicPadId}
                                    onChange={e => setMusicPadId(e.target.value)}
                                    className="w-full bg-app-bg/60 border border-app-border rounded-xl px-4 py-2 text-xs font-bold focus:border-accent outline-none"
                                >
                                    <option value="">Aucune</option>
                                    {((window as any).useMusicStore?.getState() as { playlists: { id: string, name: string, pads: { id: string, label: string }[] }[] } | undefined)?.playlists?.map((pl) => (
                                        <optgroup key={pl.id} label={pl.name}>
                                            {pl.pads.map((pad) => (
                                                <option key={pad.id} value={pad.id}>{pad.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            {/* Lights Picker */}
                            <div className="space-y-2">
                                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-app-text/40">
                                    <span className="flex items-center gap-2"><Sun size={12} /> Lumières</span>
                                    <button 
                                        onClick={() => handleCapture('light')}
                                        className="text-accent hover:underline lowercase"
                                    >
                                        [Capturer Active]
                                    </button>
                                </label>
                                <select 
                                    value={lightSceneId}
                                    onChange={e => setLightSceneId(e.target.value)}
                                    className="w-full bg-app-bg/60 border border-app-border rounded-xl px-4 py-2 text-xs font-bold focus:border-accent outline-none"
                                >
                                    <option value="">Aucune</option>
                                    {Object.values((window as any).useLightStore?.getState()?.scenes || {}).map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Map Picker */}
                            <div className="space-y-2">
                                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-app-text/40">
                                    <span className="flex items-center gap-2"><MapIcon size={12} /> Carte</span>
                                    <button 
                                        onClick={() => handleCapture('map')}
                                        className="text-accent hover:underline lowercase"
                                    >
                                        [Capturer Active]
                                    </button>
                                </label>
                                <select 
                                    value={mapUrl}
                                    onChange={e => setMapUrl(e.target.value)}
                                    className="w-full bg-app-bg/60 border border-app-border rounded-xl px-4 py-2 text-xs font-bold focus:border-accent outline-none"
                                >
                                    <option value="">Aucune</option>
                                    {atlasMaps.filter(m => m.campaignId === activeCampaignId).map(m => (
                                        <option key={m.id} value={m.fileUrl}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Image Picker */}
                            <div className="space-y-2">
                                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-app-text/40">
                                    <span className="flex items-center gap-2"><ImageIcon size={12} /> Image</span>
                                    <button 
                                        onClick={() => handleCapture('image')}
                                        className="text-accent hover:underline lowercase"
                                    >
                                        [Capturer Active]
                                    </button>
                                </label>
                                <select 
                                    value={imageMediaId}
                                    onChange={e => setImageMediaId(e.target.value)}
                                    className="w-full bg-app-bg/60 border border-app-border rounded-xl px-4 py-2 text-xs font-bold focus:border-accent outline-none"
                                >
                                    <option value="">Aucune</option>
                                    {(window as any).useImageStore?.getState()?.mediaList?.map((m: { id: string, name: string }) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sound Picker */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 flex items-center gap-2">
                                    <Volume2 size={12} /> Effet Sonore
                                </label>
                                <select 
                                    value={soundPadId}
                                    onChange={e => setSoundPadId(e.target.value)}
                                    className="w-full bg-app-bg/60 border border-app-border rounded-xl px-4 py-2 text-xs font-bold focus:border-accent outline-none"
                                >
                                    <option value="">Aucun</option>
                                    {(() => {
                                        const soundStore = (window as any).useSoundStore?.getState();
                                        const atmosId = soundStore?.activeAtmosphereId;
                                        const atmosphere = soundStore?.atmospheres.find((a: { id: string }) => a.id === atmosId);
                                        return atmosphere ? Object.values(atmosphere.pads as Record<string, { id: string, title?: string, filePath?: string }>).filter(p => p.filePath).map(p => (
                                            <option key={p.id} value={p.id}>{p.title || p.id}</option>
                                        )) : null;
                                    })()}
                                </select>
                            </div>

                            {/* Ambient Picker */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-text/40">
                                    <Waves size={12} /> Ambiance (Ambient-OS)
                                </label>
                                <div className="text-[10px] text-app-text/60 italic mb-2">Scène : {getAmbientLabel(ambientSceneId)} [{ambientSceneId || '---'}]</div>
                                <select 
                                    value={ambientSceneId}
                                    onChange={e => setAmbientSceneId(e.target.value)}
                                    className="w-full bg-app-bg/60 border border-app-border rounded-xl px-4 py-2 text-xs font-bold focus:border-accent outline-none"
                                >
                                    <option value="">Aucune</option>
                                    {ambientScenes.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-app-border/40 flex flex-col gap-3">
                            <button 
                                onClick={handleSave}
                                className="w-full bg-accent text-app-bg py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={14} />
                                Sauvegarder
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="w-full bg-app-bg border border-app-border text-app-text/40 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-app-text transition-all"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoryboardDashboard;
