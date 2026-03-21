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
    Waves,
    Clapperboard,
    ArrowRight,
    GripVertical,
    Copy
} from 'lucide-react';
import { useAmbientStore } from '../ambient/useAmbientStore';

// DND Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableMomentProps {
    moment: StoryboardMoment;
    index: number;
    activeMomentId: string | null;
    isLast: boolean;
    onTrigger: (id: string) => void;
    onEdit: (moment: StoryboardMoment) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    isOverlay?: boolean;
}

const MomentFrame: React.FC<SortableMomentProps & { dragProps?: Record<string, unknown>, dragListeners?: Record<string, unknown> }> = ({ 
    moment, 
    index, 
    activeMomentId, 
    onTrigger, 
    onEdit, 
    onDelete,
    onDuplicate,
    isOverlay,
    dragProps,
    dragListeners
}) => (
    <div 
        className={`w-72 h-[420px] rounded-3xl relative transition-all duration-500 group ${
            activeMomentId === moment.id 
                ? 'scale-105 z-20' 
                : 'scale-95 opacity-80 hover:opacity-100 hover:scale-100 z-10'
        } ${isOverlay ? 'opacity-100 scale-100 shadow-2xl rotate-3 cursor-grabbing' : ''}`}
    >
        {/* Active Glow */}
        {activeMomentId === moment.id && !isOverlay && (
            <div className="absolute -inset-4 bg-accent/10 blur-3xl rounded-full animate-pulse pointer-events-none" />
        )}

        {/* Frame Content */}
        <div className={`h-full bg-app-surface/60 border-2 rounded-3xl p-6 flex flex-col backdrop-blur-md shadow-2xl transition-all ${
            activeMomentId === moment.id ? 'border-accent shadow-glow-accent/20' : 'border-white/5 group-hover:border-white/20'
        } ${isOverlay ? 'border-accent/50 bg-app-surface/90' : ''}`}>
            
            {/* Frame Header: Number & Actions */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div 
                        {...dragProps} 
                        {...dragListeners} 
                        className="p-2 hover:bg-white/10 rounded-lg cursor-grab active:cursor-grabbing text-slate-600 hover:text-accent transition-colors"
                        title="Maintenir pour déplacer"
                    >
                        <GripVertical size={20} />
                    </div>
                    <span className={`text-3xl font-black italic opacity-20 ${activeMomentId === moment.id ? 'text-accent opacity-40' : ''}`}>
                        {(index + 1).toString().padStart(2, '0')}
                    </span>
                </div>
                {!isOverlay && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => onDuplicate(moment.id)}
                            className="p-2 bg-white/5 hover:bg-blue-500 hover:text-white rounded-xl transition-all"
                            title="Dupliquer"
                        >
                            <Copy size={14} />
                        </button>
                        <button 
                            onClick={() => onEdit(moment)}
                            className="p-2 bg-white/5 hover:bg-accent hover:text-app-bg rounded-xl transition-all"
                            title="Régler"
                        >
                            <Settings2 size={14} />
                        </button>
                        <button 
                            onClick={() => onDelete(moment.id)}
                            className="p-2 bg-white/5 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                            title="Supprimer"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Main Trigger Button */}
            <button 
                onClick={() => onTrigger(moment.id)}
                disabled={isOverlay}
                className="flex-1 flex flex-col items-center justify-center gap-4 group/play"
            >
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                    activeMomentId === moment.id 
                        ? 'bg-accent text-app-bg border-accent shadow-glow-accent' 
                        : 'bg-white/5 border-white/10 group-hover/play:bg-white/10 group-hover/play:border-accent group-hover/play:text-accent'
                }`}>
                    <Play size={32} fill="currentColor" className={activeMomentId === moment.id ? '' : 'group-hover/play:scale-110 transition-transform'} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-center leading-tight group-hover/play:text-accent transition-colors">
                    {moment.name}
                </h3>
            </button>

            {/* Linked Modules Strip */}
            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-2">
                {moment.musicPadId && <div title="Musique" className="flex flex-col items-center gap-1"><Music size={12} className="text-blue-400" /><div className="w-full h-0.5 bg-blue-400/30 rounded-full" /></div>}
                {moment.ambientSceneId && <div title="Ambiance" className="flex flex-col items-center gap-1"><Waves size={12} className="text-cyan-400" /><div className="w-full h-0.5 bg-cyan-400/30 rounded-full" /></div>}
                {moment.lightSceneId && <div title="Lumières" className="flex flex-col items-center gap-1"><Sun size={12} className="text-orange-400" /><div className="w-full h-0.5 bg-orange-400/30 rounded-full" /></div>}
                {moment.mapUrl && <div title="Carte" className="flex flex-col items-center gap-1"><MapIcon size={12} className="text-emerald-400" /><div className="w-full h-0.5 bg-emerald-400/30 rounded-full" /></div>}
                {moment.imageMediaId && <div title="Image" className="flex flex-col items-center gap-1"><ImageIcon size={12} className="text-purple-400" /><div className="w-full h-0.5 bg-purple-400/30 rounded-full" /></div>}
                {moment.soundPadId && <div title="FX" className="flex flex-col items-center gap-1"><Volume2 size={12} className="text-rose-400" /><div className="w-full h-0.5 bg-rose-400/30 rounded-full" /></div>}
            </div>
        </div>
    </div>
);

const SortableMoment: React.FC<SortableMomentProps> = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.moment.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className="flex items-center shrink-0"
        >
            <MomentFrame 
                {...props} 
                dragProps={attributes as unknown as Record<string, unknown>} 
                dragListeners={listeners as unknown as Record<string, unknown>} 
                isOverlay={false}
            />
            {/* Connection Arrow */}
            {!props.isLast && (
                <div className="shrink-0 px-4 flex items-center justify-center">
                    <ArrowRight size={24} className="text-white/10" />
                </div>
            )}
        </div>
    );
};

const StoryboardDashboard: React.FC = () => {
    const { moments, triggerMoment, addMoment, updateMoment, deleteMoment, activeMomentId, setMoments, duplicateMoment } = useStoryboardStore();
    const { activeCampaignId, atlasMaps } = useSessionOSStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editingMoment, setEditingMoment] = useState<StoryboardMoment | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

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

    // DND Sensors with activation constraint
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            const oldIndex = moments.findIndex(m => m.id === active.id);
            const newIndex = moments.findIndex(m => m.id === over.id);
            
            const newMoments = arrayMove(moments, oldIndex, newIndex);
            setMoments(newMoments);
        }
    };

    const activeMoment = moments.find(m => m.id === activeId);
    const activeIndex = moments.findIndex(m => m.id === activeId);

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
        const gmToast = (window as any).useToastStore?.getState()?.gmToast;

        switch (type) {
            case 'music': {
                const musicStore = (window as any).useMusicStore?.getState();
                if (musicStore) {
                    const padId = musicStore.deckA.isPlaying ? musicStore.deckA.activePadId : 
                                 (musicStore.deckB.isPlaying ? musicStore.deckB.activePadId : musicStore.deckA.activePadId);
                    if (padId) {
                        setMusicPadId(padId as string);
                        if (gmToast) gmToast('info', 'ID Musique capturé !');
                    }
                }
                break;
            }
            case 'light': {
                const lightStore = (window as any).useLightStore?.getState();
                if (lightStore?.activeSceneId) {
                    setLightSceneId(lightStore.activeSceneId as string);
                    if (gmToast) gmToast('info', 'Scène Lumière capturée !');
                }
                break;
            }
            case 'map': {
                const mapStore = (window as any).useMapStore?.getState();
                if (mapStore?.currentMapUrl) {
                    setMapUrl(mapStore.currentMapUrl as string);
                    if (gmToast) gmToast('info', 'Carte Atlas capturée !');
                }
                break;
            }
            case 'image': {
                const imageStore = (window as any).useImageStore?.getState();
                if (imageStore?.activeMediaId) {
                    setImageMediaId(imageStore.activeMediaId as string);
                    if (gmToast) gmToast('info', 'ID Image capturé !');
                }
                break;
            }
            case 'sound': {
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


    return (
        <div className="flex flex-col h-full bg-app-bg text-slate-200">
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between bg-app-surface/40 border-b border-white/5 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-glow-accent/20 animate-pulse-slow">
                        <Clapperboard size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Master Storyboard</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Table de Montage de Session</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={startNew}
                        className="flex items-center gap-2 px-6 py-3 bg-accent text-app-bg rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow-accent/20"
                    >
                        <Plus size={16} />
                        Ajouter une Séquence
                    </button>
                </div>
            </div>

            {/* Main Content: Horizontal Timeline */}
            <div className="flex-1 overflow-hidden flex relative">
                {/* Horizontal Scrolling Area */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar-h flex items-center px-12 py-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-accent/5">
                    
                    {/* Vertical Perforations Background */}
                    <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-around opacity-5 pointer-events-none">
                        {Array.from({ length: 40 }).map((_, i) => <div key={i} className="w-4 h-4 rounded bg-white" />)}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-around opacity-5 pointer-events-none">
                        {Array.from({ length: 40 }).map((_, i) => <div key={i} className="w-4 h-4 rounded bg-white" />)}
                    </div>

                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={campaignMoments.map(m => m.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {campaignMoments.map((moment, index) => (
                                <SortableMoment 
                                    key={moment.id}
                                    moment={moment}
                                    index={index}
                                    activeMomentId={activeMomentId}
                                    isLast={index === campaignMoments.length - 1}
                                    onTrigger={triggerMoment}
                                    onEdit={startEdit}
                                    onDelete={deleteMoment}
                                    onDuplicate={duplicateMoment}
                                />
                            ))}
                        </SortableContext>

                        <DragOverlay adjustScale={true}>
                            {activeId && activeMoment ? (
                                <MomentFrame 
                                    moment={activeMoment}
                                    index={activeIndex}
                                    activeMomentId={activeMomentId}
                                    isLast={true}
                                    onTrigger={() => {}}
                                    onEdit={() => {}}
                                    onDelete={() => {}}
                                    onDuplicate={() => {}}
                                    isOverlay={true}
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>

                    {campaignMoments.length === 0 && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-app-text/20 py-20">
                            <Zap size={64} strokeWidth={1} className="mb-4 opacity-50" />
                            <p className="text-sm font-black uppercase tracking-widest text-center max-w-sm">
                                Votre pellicule est vide.<br/>Ajoutez une première séquence pour commencer le montage.
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar Editor Panel */}
                {isEditing && (
                    <div className="w-[450px] bg-app-surface/80 border-l border-white/5 backdrop-blur-2xl p-8 overflow-y-auto custom-scrollbar flex flex-col shadow-2xl animate-in slide-in-from-right duration-500 z-50">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Réglage Scène</h3>
                                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Configuration des Liaisons</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" title="Fermer le réglage">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8 flex-1">
                            {/* Name Input */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nom de la Séquence</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-accent outline-none transition-all shadow-inner"
                                    placeholder="ex: Combat Final"
                                />
                            </div>

                            {/* Music & Ambient Group */}
                            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-6">
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-400">
                                        <span className="flex items-center gap-2"><Music size={14} /> Musique</span>
                                        <button onClick={() => handleCapture('music')} className="text-[9px] hover:underline lowercase bg-blue-400/10 px-2 py-1 rounded">Capturer active</button>
                                    </label>
                                    <select 
                                        value={musicPadId}
                                        onChange={e => setMusicPadId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-blue-400 outline-none"
                                        title="Sélectionner une musique"
                                    >
                                        <option value="">Aucune</option>
                                        {((window as any).useMusicStore?.getState() as { playlists: Array<{ id: string, name: string, pads: Array<{ id: string, label: string }> }> })?.playlists?.map((pl: any) => (
                                            <optgroup key={pl.id} label={pl.name}>
                                                {pl.pads.map((pad: any) => (
                                                    <option key={pad.id} value={pad.id}>{pad.label}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                        <span className="flex items-center gap-2"><Waves size={14} /> Ambiance (Ambient-OS)</span>
                                    </label>
                                    <select 
                                        value={ambientSceneId}
                                        onChange={e => setAmbientSceneId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-cyan-400 outline-none"
                                        title="Sélectionner une ambiance"
                                    >
                                        <option value="">Aucune</option>
                                        {ambientScenes.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-rose-400">
                                        <span className="flex items-center gap-2"><Volume2 size={14} /> Effet Sonore (Sound-OS)</span>
                                    </label>
                                    <select 
                                        value={soundPadId}
                                        onChange={e => setSoundPadId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-rose-400 outline-none"
                                        title="Sélectionner un effet sonore"
                                    >
                                        <option value="">Aucun</option>
                                        {(() => {
                                            const state = (window as any).useSoundStore?.getState() as { activeAtmosphereId: string, atmospheres: Array<{ id: string, pads: Record<string, { id: string, title?: string, filePath?: string }> }> } | undefined;
                                            const atmosId = state?.activeAtmosphereId;
                                            const atmosphere = state?.atmospheres.find(a => a.id === atmosId);
                                            return atmosphere ? Object.values(atmosphere.pads).filter(p => p.filePath).map(p => (
                                                <option key={p.id} value={p.id}>{p.title || p.id}</option>
                                            )) : null;
                                        })()}
                                    </select>
                                </div>
                            </div>

                            {/* Visuals & Lights Group */}
                            <div className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10 space-y-6">
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-orange-400">
                                        <span className="flex items-center gap-2"><Sun size={14} /> Lumières</span>
                                        <button onClick={() => handleCapture('light')} className="text-[9px] hover:underline lowercase bg-orange-400/10 px-2 py-1 rounded">Capturer active</button>
                                    </label>
                                    <select 
                                        value={lightSceneId}
                                        onChange={e => setLightSceneId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-orange-400 outline-none"
                                        title="Sélectionner une scène de lumière"
                                    >
                                        <option value="">Aucune</option>
                                        {Object.values(((window as any).useLightStore?.getState() as { scenes: Record<string, { id: string, name: string }> })?.scenes || {}).map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                        <span className="flex items-center gap-2"><MapIcon size={14} /> Carte Atlas</span>
                                        <button onClick={() => handleCapture('map')} className="text-[9px] hover:underline lowercase bg-emerald-400/10 px-2 py-1 rounded">Capturer active</button>
                                    </label>
                                    <select 
                                        value={mapUrl}
                                        onChange={e => setMapUrl(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-emerald-400 outline-none"
                                        title="Sélectionner une carte"
                                    >
                                        <option value="">Aucune</option>
                                        {atlasMaps.filter(m => m.campaignId === activeCampaignId).map(m => (
                                            <option key={m.id} value={m.fileUrl}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-purple-400">
                                        <span className="flex items-center gap-2"><ImageIcon size={14} /> Image (Image-OS)</span>
                                        <button onClick={() => handleCapture('image')} className="text-[9px] hover:underline lowercase bg-purple-400/10 px-2 py-1 rounded">Capturer active</button>
                                    </label>
                                    <select 
                                        value={imageMediaId}
                                        onChange={e => setImageMediaId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-purple-400 outline-none"
                                        title="Sélectionner une image"
                                    >
                                        <option value="">Aucune</option>
                                        {((window as unknown as Record<string, unknown>).useImageStore as { getState: () => { mediaList: Array<{ id: string, name: string }> } })?.getState()?.mediaList?.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 mt-10 border-t border-white/5 flex flex-col gap-4">
                            <button 
                                onClick={handleSave}
                                className="w-full bg-accent text-app-bg py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-glow-accent transition-all flex items-center justify-center gap-2 shadow-2xl"
                            >
                                <Save size={16} />
                                Sauvegarder la Séquence
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="w-full bg-white/5 border border-white/5 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
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
