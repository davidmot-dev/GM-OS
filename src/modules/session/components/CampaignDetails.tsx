import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { ChevronLeft, Info, Calendar, Users, MapPin, Edit3 } from 'lucide-react';
import { gmCustom, useModalStore } from '../../../stores/useModalStore';

const CampaignDetails: React.FC = () => {
    const { campaigns, activeCampaignId, sessions, setCurrentView, entities, atlasMaps } = useSessionOSStore();
    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const campaignSessions = sessions.filter(s => s.campaignId === activeCampaignId);
    const campaignNPCs = entities.filter(e => e.type === 'npc' && e.campaignId === activeCampaignId);
    const activeLocations = atlasMaps.filter(m => campaign?.activeLocationIds?.includes(m.id));

    if (!campaign) return null;

    return (
        <div className="flex-1 flex flex-col gap-6 p-6 h-full overflow-y-auto custom-scrollbar bg-slate-950/20">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentView('cockpit')}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-100"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">{campaign.name}</h2>
                    <p className="text-slate-500 text-sm tracking-widest uppercase font-semibold">Campaign Management</p>
                </div>
                <button 
                    onClick={() => gmCustom('campaign-edit', { campaignId: campaign.id })}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-all font-bold"
                >
                    <Edit3 size={16} />
                    Edit Campaign
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left: General Info & Stats */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-gm-gold">
                            <div className="w-8 h-8 rounded-lg bg-gm-gold/10 flex items-center justify-center">
                                <Info size={18} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wide">Overview</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Adventure System</p>
                                <p className="text-slate-300 font-medium">{campaign.system}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Description</p>
                                <p className="text-slate-400 text-sm leading-relaxed">{campaign.description}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Current Synopsis</p>
                                <p className="text-slate-400 text-sm italic leading-relaxed border-l-2 border-gm-gold/30 pl-3">
                                    "{campaign.synopsis}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-emerald-500">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Users size={18} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wide">NPC Gallery ({campaignNPCs.length})</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {campaignNPCs.map(npc => (
                                <div key={npc.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700 hover:border-gm-gold transition-colors">
                                    <img src={npc.avatar} className="w-full h-full object-cover" alt={npc.name} />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-[8px] text-white font-bold uppercase p-1 bg-black/60 rounded">{npc.name}</p>
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => setCurrentView('npc-gallery')}
                                className="aspect-square rounded-lg border-2 border-dashed border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-600 hover:text-slate-500 transition-all font-bold text-lg"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Session History & Lore Notes */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3 text-gm-gold">
                                <div className="w-8 h-8 rounded-lg bg-gm-gold/10 flex items-center justify-center">
                                    <Calendar size={18} />
                                </div>
                                <h3 className="font-bold text-sm uppercase tracking-wide">Session Logs</h3>
                            </div>
                            <button 
                                onClick={() => {
                                    const nextNum = campaignSessions.length > 0 
                                        ? Math.max(...campaignSessions.map(s => s.number)) + 1 
                                        : 1;
                                    
                                    useModalStore.getState().showPrompt(
                                        `Créer le résumé pour la Session #${nextNum}`,
                                        '',
                                        (summary) => {
                                            useSessionOSStore.getState().addSession({
                                                campaignId: campaign.id,
                                                number: nextNum,
                                                date: new Date().toISOString(),
                                                status: 'completed',
                                                publicSummary: summary,
                                                gmSecrets: '',
                                                checklist: [],
                                                sessionEntityIds: []
                                            });
                                        },
                                        'Archiver'
                                    );
                                }}
                                className="text-xs text-gm-gold font-bold hover:underline"
                            >
                                + NEW SESSION RECORD
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {campaignSessions.sort((a, b) => b.number - a.number).map(s => (
                                <div key={s.id} className={`p-4 rounded-xl border transition-all cursor-pointer ${s.status === 'active' ? 'bg-gm-gold/10 border-gm-gold/30' : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-mono font-bold text-slate-100">#{s.number}</span>
                                            <h4 className="text-sm font-bold text-slate-200">Session {s.number}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${s.status === 'active' ? 'bg-amber-500 text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-700 text-slate-400'}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-500 font-mono">{new Date(s.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                        {s.publicSummary || "No summary recorded for this session."}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* World Tracking / POIs Snapshot */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5">
                            <div className="flex items-center gap-3 text-blue-400 mb-4">
                                <MapPin size={18} />
                                <h4 className="font-bold text-xs uppercase tracking-widest">Active Locations</h4>
                            </div>
                            <div className="flex flex-col gap-2">
                                {activeLocations.length > 0 ? (
                                    activeLocations.map(loc => (
                                        <div key={loc.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer">
                                            <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden border border-slate-700">
                                                <img src={loc.fileUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" alt="" />
                                            </div>
                                            <span className="text-xs text-slate-300 font-medium group-hover:text-gm-gold truncate">{loc.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-slate-600 italic">Aucun lieu épinglé. Éditez la campagne pour en ajouter.</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 flex flex-col justify-center items-center gap-3 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-not-allowed">
                            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Timeline / Wiki</h4>
                            <p className="text-[10px] text-slate-600 font-medium">Coming Soon in v5.2</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDetails;
