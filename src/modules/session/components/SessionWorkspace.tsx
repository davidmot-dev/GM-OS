import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { useMapStore } from '../../map/useMapStore';
import { Eye, Edit3, Lock, History, Search, Layers, MapPin, Pin, Plus } from 'lucide-react';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import { useMediaUrl } from '../../../hooks/useMediaUrl';

import SessionClueDeck from './SessionClueDeck';

const SessionWorkspace: React.FC = () => {
    const { t } = useTranslation();
    const { 
        sessions, activeCampaignId, entities, updateSessionPublicSummary, updateSessionGmSecrets, 
        campaigns, atlasMaps, players, updateCharacterHP, navigateToAtlasMap, navigateToNpcDetail,
        navigateToPlayerDetail
    } = useSessionOSStore();
    const { mapUrl, mapName, isVideo, setMap } = useMapStore();
    const resolvedMapUrl = useMediaUrl(mapUrl || undefined);
    
    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const activeLocations = atlasMaps.filter(m => campaign?.activeLocationIds?.includes(m.id));

    // Get the active session for the active campaign
    const session = sessions.find(s => s.campaignId === activeCampaignId && s.status === 'active');

    const updateEntityHP = (id: string, delta: number) => {
        // Check if it's an NPC or a PC
        const npc = entities.find(e => e.id === id);
        if (npc) {
            useSessionOSStore.getState().updateEntityHP(id, npc.hp + delta);
            return;
        }

        // Try to find as PC
        for (const p of players) {
            const pc = p.characters.find(c => c.id === id);
            if (pc) {
                updateCharacterHP(p.id, id, pc.hp + delta);
                break;
            }
        }
    };

    if (!session) {
        return (
            <section className="col-span-6 flex flex-col items-center justify-center p-6 bg-app-surface/40 rounded-xl border border-app-border/20 shadow-inner">
                <p className="text-app-text/40 font-bold tracking-widest uppercase">{t('modules:session.workspace.no_active_session')}</p>
                <p className="text-app-text/20 text-sm mt-2">{t('modules:session.workspace.no_active_session_desc')}</p>
            </section>
        );
    }

    return (
        <section className="h-full col-span-6 flex flex-col gap-6 p-6 overflow-y-auto custom-scrollbar">
            {/* Team Tracker Bar (v6 Premium Redesign) */}
            <div className="glass-bento flex items-center px-8 h-24 gap-10 relative flex-shrink-0">
                <div className="flex items-center gap-10">
                    {/* PC List */}
                    <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold tracking-[0.3em] text-accent uppercase opacity-60 mb-1 block ml-1">{t('modules:session.workspace.group')}</span>
                        <div className="flex -space-x-3">
                            {Array.from(new Set(session.sessionEntityIds || [])).map(id => {
                                // Find character among all players
                                let pc = null;
                                let ownerId = '';
                                for (const p of players) {
                                    const char = p.characters.find(c => c.id === id);
                                    if (char && char.campaignId === activeCampaignId) {
                                        pc = char;
                                        ownerId = p.id;
                                        break;
                                    }
                                }
                                
                                if (!pc) return null;

                                return (
                                    <div key={pc.id} className="w-12 h-12 rounded-full border-2 border-app-bg bg-app-surface relative group cursor-pointer hover:z-20 transition-all hover:scale-110">
                                        <div className="w-full h-full rounded-full overflow-hidden" onClick={() => navigateToPlayerDetail(ownerId, pc.id)}>
                                            <ResolvedAsset src={pc.portraitUrl} alt={pc.name} className="w-full h-full object-cover" title={`${pc.name}: ${pc.hp}/${pc.maxHp}`} />
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-app-bg ${pc.hp > pc.maxHp * 0.5 ? 'bg-green-500' : pc.hp > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>

                                        {/* Quick HP Controls */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-app-surface border border-app-border rounded px-2 py-1 text-[10px] hidden group-hover:flex items-center gap-2 z-50 shadow-xl">
                                            <button onClick={(e) => { e.stopPropagation(); updateEntityHP(pc.id, -1); }} className="hover:text-red-400 font-bold w-4 text-center">-</button>
                                            <span className="font-mono font-bold text-app-text min-w-[20px] text-center">{pc.hp}</span>
                                            <button onClick={(e) => { e.stopPropagation(); updateEntityHP(pc.id, 1); }} className="hover:text-green-400 font-bold w-4 text-center">+</button>
                                        </div>
                                    </div>
                                );
                            })}
                            <button 
                                onClick={() => useSessionOSStore.getState().setCurrentView('players')}
                                className="w-12 h-12 rounded-full border-2 border-dashed border-app-border/40 flex items-center justify-center text-app-text/20 hover:text-accent hover:border-accent/50 transition-all group bg-app-surface/20"
                                title={t('modules:session.workspace.manage_group')}
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Session NPC List */}
                    <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold tracking-[0.3em] text-accent uppercase opacity-60 mb-1 block ml-1">{t('modules:session.workspace.active_npcs')}</span>
                        <div className="flex gap-3">
                            {Array.from(new Set(session.sessionEntityIds || [])).map(id => {
                                const npc = entities.find(e => e.id === id);
                                if (!npc) return null;
                                return (
                                    <div 
                                        key={npc.id} 
                                        className="w-12 h-12 rounded-xl border-2 border-app-bg bg-app-surface relative group cursor-pointer hover:border-accent/50 transition-all hover:scale-110 shadow-lg"
                                    >
                                        <div className="w-full h-full rounded-lg overflow-hidden relative group" onClick={() => navigateToNpcDetail(npc.id)}>
                                            <ResolvedAsset src={npc.avatar} alt={npc.name} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                                            <div className="absolute inset-0 bg-accent/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye size={18} className="text-white drop-shadow-lg" />
                                            </div>
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-app-bg ${npc.status === 'alive' ? 'bg-emerald-500' : npc.status === 'injured' ? 'bg-amber-500' : 'bg-red-600'}`}></div>
                                        
                                        {/* Remove Button */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); useSessionOSStore.getState().removeEntityFromSession(session.id, npc.id); }}
                                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-500 border border-white/20"
                                            title={t('modules:session.workspace.remove_from_session')}
                                        >
                                            <span className="text-[10px] font-bold">×</span>
                                        </button>

                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-app-surface border border-app-border rounded px-2 py-0.5 text-[8px] font-bold text-app-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 uppercase tracking-tighter shadow-xl">
                                            {npc.name}
                                        </div>
                                    </div>
                                );
                            })}
                            <button 
                                onClick={() => useSessionOSStore.getState().setCurrentView('npc-gallery')}
                                className="w-12 h-12 rounded-xl border-2 border-dashed border-app-border/40 flex items-center justify-center text-app-text/20 hover:text-accent hover:border-accent/50 transition-all group"
                                title={t('modules:session.workspace.add_npc')}
                            >
                                <Pin size={22} className="group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Session Clues Deck (v5.2) */}
            <SessionClueDeck />

            {/* Double Journal Split Pane */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-[400px]">
                {/* Public Summary */}
                <div className="glass-bento p-6 focus-within:ring-1 focus-within:ring-accent/50 flex flex-col transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Eye size={18} className="text-app-text/40" />
                            <h4 className="text-app-text/80 font-bold text-sm tracking-wide">{t('modules:session.workspace.public_summary')}</h4>
                        </div>
                        <button className="text-app-text/20 hover:text-accent transition-colors" title={t('modules:session.workspace.edit_summary')}><Edit3 size={18} /></button>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent border-none text-app-text/60 text-sm leading-relaxed resize-none focus:ring-0 p-0 custom-scrollbar"
                        value={session.publicSummary}
                        onChange={(e) => updateSessionPublicSummary(session.id, e.target.value)}
                        placeholder={t('modules:session.workspace.public_notes_placeholder')}
                    />
                </div>

                {/* GM Secrets */}
                <div className="glass-bento bg-accent/5 focus-within:ring-1 focus-within:ring-accent/50 flex flex-col transition-all border-dashed border-accent/20 relative overflow-hidden group p-6">
                    <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                        <Lock size={120} className="text-accent/20" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <Lock size={18} className="text-accent" />
                            <h4 className="text-accent font-bold text-sm tracking-wide">{t('modules:session.workspace.gm_secrets')}</h4>
                        </div>
                        <button className="text-app-text/20 hover:text-accent transition-colors" title={t('modules:session.workspace.history_secrets')}><History size={18} /></button>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent border-none text-app-text/60 text-sm leading-relaxed resize-none focus:ring-0 p-0 relative z-10 border-l-2 border-accent/40 pl-3 custom-scrollbar"
                        value={session.gmSecrets}
                        onChange={(e) => updateSessionGmSecrets(session.id, e.target.value)}
                        placeholder={t('modules:session.workspace.secret_notes_placeholder')}
                    />
                </div>
            </div>

            {/* Active Locations Quick Access */}
            {activeLocations.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                        <MapPin size={14} className="text-accent" />
                        <span className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest">{t('modules:session.workspace.pinned_locations')}</span>
                    </div>
                    <div className="flex gap-3 flex-wrap pb-2">
                        {activeLocations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => {
                                    setMap(loc.fileUrl, loc.isVideo, loc.name);
                                    navigateToAtlasMap(loc.id);
                                }}
                                className={`flex-shrink-0 flex items-center gap-3 p-2 pr-4 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                                    mapName === loc.name 
                                    ? 'bg-accent/10 border-accent/40 text-accent shadow-glow-accent/5' 
                                    : 'bg-app-surface/40 border-app-border text-app-text/40 hover:border-app-border/60 hover:text-app-text/80'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-app-border/20 bg-app-surface">
                                    <ResolvedAsset 
                                        src={loc.fileUrl} 
                                        isVideo={loc.isVideo}
                                        className={`w-full h-full object-cover ${mapName === loc.name ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} 
                                        alt="" 
                                    />
                                </div>
                                <span className="text-xs font-bold whitespace-nowrap">{loc.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Map Preview */}
            <div className="h-64 glass-bento overflow-hidden relative group p-0">
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent z-10"></div>
                <div className="absolute bottom-4 left-4 z-20">
                    <h5 className="text-app-text/90 font-bold">{mapName || t('modules:session.workspace.no_active_map')}</h5>
                    <div className="flex items-center gap-2 text-xs text-app-text/40 mt-1">
                        <MapPin size={14} className="text-accent" />
                        <span>{mapName ? t('modules:session.workspace.map_os_sync') : t('modules:session.workspace.map_fallback_status')}</span>
                    </div>
                </div>
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button className="bg-app-bg/80 backdrop-blur-md p-2 rounded-lg text-app-text/40 hover:text-accent transition-colors" title={t('modules:session.workspace.search_map_tooltip')}><Search size={18} /></button>
                    <button className="bg-app-bg/80 backdrop-blur-md p-2 rounded-lg text-app-text/40 hover:text-accent transition-colors" title={t('modules:session.workspace.manage_layers_tooltip')}><Layers size={18} /></button>
                </div>
                {isVideo && resolvedMapUrl ? (
                    <video
                        src={resolvedMapUrl}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        muted
                    />
                ) : (
                    <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                            backgroundImage: `url('${resolvedMapUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200'}')`
                        }}
                    >
                    </div>
                )}
            </div>
        </section>
    );
};

export default SessionWorkspace;
