import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useMapStore } from '../../map/useMapStore';
import { Eye, Edit3, Lock, History, Search, Layers, Stethoscope, Zap, MoreVertical, MapPin, Pin } from 'lucide-react';
import { useModalStore } from '../../../stores/useModalStore';

const SessionWorkspace: React.FC = () => {
    const { sessions, activeCampaignId, entities, updateSessionPublicSummary, updateSessionGmSecrets, campaigns, atlasMaps } = useSessionOSStore();
    const { mapUrl, mapName, isVideo, setMap } = useMapStore();
    
    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const activeLocations = atlasMaps.filter(m => campaign?.activeLocationIds?.includes(m.id));

    // Get the active session for the active campaign
    const session = sessions.find(s => s.campaignId === activeCampaignId && s.status === 'active');

    const updateEntityHP = (id: string, delta: number) => {
        useSessionOSStore.setState((state) => ({
            entities: state.entities.map(e =>
                e.id === id ? { ...e, hp: Math.min(e.maxHp, Math.max(0, e.hp + delta)) } : e
            )
        }));
    };

    if (!session) {
        return (
            <section className="col-span-6 flex flex-col items-center justify-center p-6 bg-slate-900/40 rounded-xl border border-white/5 shadow-inner">
                <p className="text-slate-500 font-bold tracking-widest uppercase">No Active Session</p>
                <p className="text-slate-600 text-sm mt-2">Start a session to view the workspace.</p>
            </section>
        );
    }

    return (
        <section className="col-span-6 flex flex-col gap-6 p-6 overflow-y-auto custom-scrollbar">
            {/* Team Tracker Bar */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    {/* PC List */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">Party</span>
                        <div className="flex -space-x-3">
                            {entities.filter(e => e.type === 'pc').map(pc => (
                                <div key={pc.id} className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 relative group cursor-pointer hover:z-20 transition-all hover:scale-110" onClick={() => updateEntityHP(pc.id, -5)}>
                                    <img src={pc.avatar} alt={pc.name} className="rounded-full w-full h-full object-cover" title={`${pc.name}: ${pc.hp}/${pc.maxHp}`} />
                                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${pc.hp > pc.maxHp * 0.5 ? 'bg-green-500' : pc.hp > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>

                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[10px] hidden group-hover:flex items-center gap-2 z-50 shadow-xl">
                                        <button onClick={(e) => { e.stopPropagation(); updateEntityHP(pc.id, -1); }} className="hover:text-red-400 font-bold w-4">-</button>
                                        <span className="font-mono font-bold text-white">{pc.hp}</span>
                                        <button onClick={(e) => { e.stopPropagation(); updateEntityHP(pc.id, 1); }} className="hover:text-green-400 font-bold w-4">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Session NPC List */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-gm-gold font-bold uppercase tracking-wider ml-1">Active NPCs</span>
                        <div className="flex gap-2">
                            {(session.sessionEntityIds || []).map(id => {
                                const npc = entities.find(e => e.id === id);
                                if (!npc) return null;
                                return (
                                    <div 
                                        key={npc.id} 
                                        onClick={() => useModalStore.getState().showCustom('npc-detail', { entityId: npc.id })}
                                        className="w-12 h-12 rounded-xl border-2 border-slate-800 bg-slate-800 relative group cursor-pointer hover:border-gm-gold/50 transition-all hover:scale-110 shadow-lg"
                                    >
                                        <img src={npc.avatar} alt={npc.name} className="rounded-lg w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-slate-900 ${npc.status === 'alive' ? 'bg-emerald-500' : npc.status === 'injured' ? 'bg-amber-500' : 'bg-red-600'}`}></div>
                                        
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[8px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 uppercase tracking-tighter shadow-xl">
                                            {npc.name}
                                        </div>
                                    </div>
                                );
                            })}
                            <button 
                                onClick={() => useSessionOSStore.getState().setCurrentView('npc-gallery')}
                                className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 hover:text-gm-gold hover:border-gm-gold/30 transition-all group"
                                title="Add NPC to session"
                            >
                                <Pin size={20} className="group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 w-48">
                        {(() => {
                            const pcs = entities.filter(e => e.type === 'pc');
                            const totalHP = pcs.reduce((acc, pc) => acc + pc.hp, 0);
                            const totalMaxHP = pcs.reduce((acc, pc) => acc + pc.maxHp, 0);
                            const percent = Math.round((totalHP / totalMaxHP) * 100);
                            return (
                                <>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Party Status</span>
                                        <span className={`text-xs font-mono font-bold ${percent > 50 ? 'text-emerald-400' : 'text-red-400'}`}>{percent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden border border-slate-700/50 p-[1px]">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 shadow-[0_0_10px_-2px_rgba(0,0,0,0.5)] ${percent > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : percent > 25 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-red-700 to-red-500'}`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"><Stethoscope size={20} /></button>
                    <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"><Zap size={20} /></button>
                    <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Double Journal Split Pane */}
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-[400px]">
                {/* Public Summary */}
                <div className="bg-slate-900/40 rounded-xl border border-white/5 p-5 focus-within:ring-1 focus-within:ring-gm-gold/50 flex flex-col transition-all shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Eye size={18} className="text-slate-400" />
                            <h4 className="text-slate-100 font-bold text-sm tracking-wide">Public Summary</h4>
                        </div>
                        <button className="text-slate-500 hover:text-gm-gold transition-colors"><Edit3 size={18} /></button>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent border-none text-slate-400 text-sm leading-relaxed resize-none focus:ring-0 p-0 custom-scrollbar"
                        value={session.publicSummary}
                        onChange={(e) => updateSessionPublicSummary(session.id, e.target.value)}
                        placeholder="Write public session notes here..."
                    />
                </div>

                {/* GM Secrets */}
                <div className="bg-slate-900/40 rounded-xl border border-white/5 p-5 focus-within:ring-1 focus-within:ring-gm-gold/50 flex flex-col transition-all shadow-lg backdrop-blur-sm border-dashed border-slate-700/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                        <Lock size={120} className="text-gm-gold/20" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <Lock size={18} className="text-gm-gold" />
                            <h4 className="text-gm-gold font-bold text-sm tracking-wide">GM Secrets</h4>
                        </div>
                        <button className="text-slate-500 hover:text-gm-gold transition-colors"><History size={18} /></button>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent border-none text-slate-400 text-sm leading-relaxed resize-none focus:ring-0 p-0 relative z-10 border-l-2 border-gm-gold/40 pl-3 custom-scrollbar"
                        value={session.gmSecrets}
                        onChange={(e) => updateSessionGmSecrets(session.id, e.target.value)}
                        placeholder="Write private GM secrets here..."
                    />
                </div>
            </div>

            {/* Active Locations Quick Access */}
            {activeLocations.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                        <MapPin size={14} className="text-gm-gold" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lieux Épinglés</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                        {activeLocations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => {
                                    setMap(loc.fileUrl, loc.isVideo, loc.name);
                                    useSessionOSStore.getState().setSelectedAtlasMap(loc.id);
                                }}
                                className={`flex-shrink-0 flex items-center gap-3 p-2 pr-4 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                                    mapName === loc.name 
                                    ? 'bg-gm-gold/10 border-gm-gold/40 text-gm-gold shadow-glow-gold/5' 
                                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/5">
                                    <img src={loc.fileUrl} className={`w-full h-full object-cover ${mapName === loc.name ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} alt="" />
                                </div>
                                <span className="text-xs font-bold whitespace-nowrap">{loc.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Map Preview */}
            <div className="h-64 bg-slate-800/40 rounded-xl border border-slate-800 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                <div className="absolute bottom-4 left-4 z-20">
                    <h5 className="text-slate-100 font-bold">{mapName || 'No Active Map'}</h5>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <MapPin size={14} className="text-gm-gold" />
                        <span>{mapName ? 'Map-OS Synchronized' : 'Sector 7G • Underdark Region'}</span>
                    </div>
                </div>
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button className="bg-slate-900/80 backdrop-blur-md p-2 rounded-lg text-slate-300 hover:text-gm-gold transition-colors"><Search size={18} /></button>
                    <button className="bg-slate-900/80 backdrop-blur-md p-2 rounded-lg text-slate-300 hover:text-gm-gold transition-colors"><Layers size={18} /></button>
                </div>
                {isVideo && mapUrl ? (
                    <video
                        src={mapUrl}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        muted
                    />
                ) : (
                    <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                            backgroundImage: `url('${mapUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200'}')`
                        }}
                    >
                    </div>
                )}
            </div>
        </section>
    );
};

export default SessionWorkspace;
