import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useMapStore } from '../../map/useMapStore';
import { Lock, Eye, Send, Film, Image as ImageIcon, Globe, Swords, Map, Building2, MapPin, type LucideIcon, Pin } from 'lucide-react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaStore } from '../../../stores/useMediaStore';
import { Sparkles } from 'lucide-react';
import AIPromptOverlay from '../../ai/components/AIPromptOverlay';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import type { AtlasMap } from '../useSessionOSStore';
import { Search } from 'lucide-react';

const TYPE_META: Record<AtlasMap['type'], { label: string; icon: LucideIcon; color: string }> = {
    'battlemap': { label: 'Battlemap', icon: Swords, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
    'world-map': { label: 'Monde', icon: Globe, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
    'region': { label: 'Région', icon: Map, color: 'text-green-400 border-green-500/30 bg-green-500/10' },
    'city': { label: 'Ville', icon: Building2, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    'dungeon': { label: 'Lieu', icon: MapPin, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
};

const AtlasMapDetail: React.FC = () => {
    const { 
        atlasMaps, selectedAtlasMapId, updateAtlasMap, setCurrentView,
        clues, setActiveCampaignFormSection, setEditingClueId,
        generateAtlasMapImage, isGeneratingAIImage,
        campaigns, toggleActiveLocation, activeCampaignId
    } = useSessionOSStore();
    const { setMap } = useMapStore();

    const selectedMap = atlasMaps.find(m => m.id === selectedAtlasMapId);
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    const isPinned = activeCampaign?.activeLocationIds?.includes(selectedAtlasMapId || '');
    
    const [isChoosingMedia, setIsChoosingMedia] = useState(false);
    const [showAIPrompt, setShowAIPrompt] = useState(false);

    // Always call hooks at the top level
    const url = useMediaUrl(selectedMap?.fileUrl);

    if (!selectedMap) {
        return (
            <div className="flex-1 flex items-center justify-center bg-app-bg/50 text-app-text/20">
                <div className="text-center">
                    <p className="text-3xl mb-2">🗺️</p>
                    <p className="text-sm">Sélectionne une carte dans la bibliothèque</p>
                </div>
            </div>
        );
    }

    const handleSendToMapOS = () => {
        setMap(selectedMap.fileUrl, selectedMap.isVideo, selectedMap.name, selectedMap.narrativeDescription);
        setCurrentView('cockpit');
    };

    const handleMediaSelect = (mediaId: string) => {
        const media = useMediaStore.getState().mediaList.find(m => m.id === mediaId);
        if (selectedMap && media) {
            updateAtlasMap(selectedMap.id, { 
                fileUrl: media.id, 
                isVideo: media.type === 'video' 
            });
        }
        setIsChoosingMedia(false);
    };

    return (
        <div className="flex-1 flex flex-col bg-app-bg overflow-hidden relative">
            {/* Map Preview */}
            <div className="relative flex-shrink-0 h-64 bg-app-surface overflow-hidden">
                {url ? (
                    selectedMap.isVideo ? (
                        <video
                            key={url}
                            src={url}
                            className="w-full h-full object-cover"
                            muted
                            autoPlay
                            loop
                        />
                    ) : (
                        <img
                            src={url}
                            alt={selectedMap.name}
                            className="w-full h-full object-cover"
                        />
                    )
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-app-surface border-2 border-dashed border-app-border p-6 text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
                        <p className="text-app-text/40 font-bold text-sm">Chargement du fichier...</p>
                    </div>
                )}
                
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    <button 
                        onClick={() => setIsChoosingMedia(true)}
                        className="flex items-center gap-2 bg-app-surface/60 hover:bg-white/10 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all border border-white/10 backdrop-blur-md"
                    >
                        <ImageIcon size={12} />
                        Médiathèque
                    </button>
                    <button 
                        onClick={() => setShowAIPrompt(true)}
                        disabled={isGeneratingAIImage}
                        className="flex items-center gap-2 bg-accent text-slate-950 font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all border border-accent/20 shadow-glow-accent"
                    >
                        <Sparkles size={12} />
                        Générer par IA
                    </button>
                </div>

                {isGeneratingAIImage && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-30">
                        <Sparkles size={48} className="text-accent animate-spin mb-4" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-accent animate-pulse">Expansion du monde...</span>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent pointer-events-none" />
                
                {/* Name overlay */}
                <div className="absolute bottom-4 left-6 right-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">{selectedMap.name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                {(Object.entries(TYPE_META) as [AtlasMap['type'], typeof TYPE_META['battlemap']][]).map(([type, meta]) => {
                                    const Icon = meta.icon;
                                    const isActive = selectedMap.type === type;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => updateAtlasMap(selectedMap.id, { type })}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border backdrop-blur-md ${
                                                isActive 
                                                ? `${meta.color} border-white/20 shadow-lg scale-105` 
                                                : 'text-white/40 border-white/5 hover:text-white/60 hover:bg-white/5'
                                            }`}
                                            title={meta.label}
                                        >
                                            <Icon size={10} />
                                            {meta.label}
                                        </button>
                                    );
                                })}
                                {selectedMap.isVideo && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg bg-purple-500/80 text-white ml-2">
                                        <Film size={9} /> Animé
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => toggleActiveLocation(selectedMap.id)}
                                className={`flex items-center gap-2 font-black py-2.5 px-4 rounded-xl text-sm transition-all border ${
                                    isPinned 
                                    ? 'bg-accent/20 border-accent text-accent shadow-glow-accent' 
                                    : 'bg-app-surface/40 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                                title={isPinned ? "Retirer du Cockpit" : "Épingler au Cockpit"}
                            >
                                <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
                                {isPinned ? 'Épinglé' : 'Épingler'}
                            </button>
                            <button
                                onClick={handleSendToMapOS}
                                className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white font-black py-2.5 px-5 rounded-xl text-sm transition-all shadow-glow-accent"
                            >
                                <Send size={16} />
                                Send to Map-OS
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Linked Clues Section */}
            <div className="px-6 py-4 bg-black/20 border-b border-app-border flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Search size={14} className="text-gm-gold" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gm-gold/60">Indices du Lieu</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                    {clues.filter(c => c.locationId === selectedMap.id).length > 0 ? (
                        clues.filter(c => c.locationId === selectedMap.id).map(clue => (
                            <button
                                key={clue.id}
                                onClick={() => {
                                    setActiveCampaignFormSection('clues');
                                    setEditingClueId(clue.id);
                                    setCurrentView('campaign-editor');
                                }}
                                className="group relative flex items-center gap-3 p-2 bg-[#121215] border border-white/5 rounded-2xl hover:border-gm-gold/40 transition-all text-left max-w-xs overflow-hidden"
                                title={`Ouvrir "${clue.title}" dans le Nexus`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-app-surface overflow-hidden flex-shrink-0 border border-white/5">
                                    {clue.mediaUrl ? (
                                        <ResolvedAsset src={clue.mediaUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/10">
                                            <Search size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-[10px] font-black text-white/80 group-hover:text-gm-gold transition-colors truncate">{clue.title}</p>
                                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mt-0.5">Cliquez pour voir</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-[10px] text-app-text/10 italic">Aucun indice découvert dans ce lieu.</p>
                    )}
                </div>
            </div>

            {/* Text Areas */}
            <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
                {/* Narrative Description */}
                <div className="border-r border-app-border p-5 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                        <Eye size={14} className="text-app-text/40" />
                        <h4 className="text-xs font-bold text-app-text/40 uppercase tracking-widest">Description Narrative</h4>
                        <span className="text-[9px] text-app-text/20 bg-app-surface/60 px-1.5 py-0.5 rounded-full">Public</span>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent border-none text-app-text/80 text-sm leading-relaxed resize-none focus:ring-0 focus:outline-none custom-scrollbar placeholder:text-app-text/10"
                        value={selectedMap.narrativeDescription}
                        onChange={e => updateAtlasMap(selectedMap.id, { narrativeDescription: e.target.value })}
                        placeholder="Ce que les joueurs voient et ressentent en arrivant ici..."
                    />
                </div>

                {/* GM Notes */}
                <div className="p-5 flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                        <Lock size={80} className="text-accent" />
                    </div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                        <Lock size={14} className="text-accent" />
                        <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Notes MJ</h4>
                        <span className="text-[9px] text-app-text/20 bg-app-surface/60 px-1.5 py-0.5 rounded-full">Privé</span>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent border-none text-app-text/80 text-sm leading-relaxed resize-none focus:ring-0 focus:outline-none custom-scrollbar placeholder:text-app-text/10 border-l-2 border-accent/30 pl-3 relative z-10"
                        value={selectedMap.gmNotes}
                        onChange={e => updateAtlasMap(selectedMap.id, { gmNotes: e.target.value })}
                        placeholder="Secrets, trappes, événements déclencheurs, DCs..."
                    />
                </div>
            </div>

            {/* Media Browser Modal */}
            {isChoosingMedia && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-20 backdrop-blur-sm">
                    <div className="bg-app-bg border border-app-border rounded-2xl w-full max-w-5xl h-full flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-app-border flex items-center justify-between">
                            <h3 className="font-bold text-lg">Changer le média de la carte</h3>
                            <button 
                                onClick={() => setIsChoosingMedia(false)}
                                className="text-app-text/40 hover:text-white transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <MediaBrowser 
                                isOpen={isChoosingMedia} 
                                onClose={() => setIsChoosingMedia(false)} 
                                onSelect={handleMediaSelect} 
                            />
                        </div>
                    </div>
                </div>
            )}

            <AIPromptOverlay
                isOpen={showAIPrompt}
                onClose={() => setShowAIPrompt(false)}
                isGenerating={isGeneratingAIImage}
                title={`Décor IA : ${selectedMap.name}`}
                placeholder="Ex: citadelle flottante au-dessus des nuages, architecture luminescente, ambiance onirique..."
                onGenerate={(instructions) => {
                    generateAtlasMapImage(selectedMap.id, instructions).then(() => setShowAIPrompt(false));
                }}
            />
        </div>
    );
};

export default AtlasMapDetail;
