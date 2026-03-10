import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { ChevronLeft, Info, Calendar, Users, MapPin, Edit3, Sparkles } from 'lucide-react';
import { gmCustom, useModalStore } from '../../../stores/useModalStore';
import { ResolvedAsset } from '../../../components/ResolvedAsset';

const CampaignDetails: React.FC = () => {
    const { campaigns, activeCampaignId, sessions, setCurrentView, entities, atlasMaps } = useSessionOSStore();
    const campaign = campaigns.find(c => c.id === activeCampaignId);
    const campaignSessions = sessions.filter(s => s.campaignId === activeCampaignId);
    const campaignNPCs = entities.filter(e => e.type === 'npc' && e.campaignId === activeCampaignId);
    const activeLocations = atlasMaps.filter(m => campaign?.activeLocationIds?.includes(m.id));

    if (!campaign) return null;

    return (
        <div className="flex-1 flex flex-col gap-6 p-6 h-full overflow-y-auto custom-scrollbar bg-app-bg/20">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentView('cockpit')}
                    className="p-2 hover:bg-app-surface rounded-full transition-colors text-app-text/40 hover:text-white"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-app-text/90">{campaign.name}</h2>
                    <p className="text-app-text/40 text-sm tracking-widest uppercase font-semibold">Campaign Management</p>
                </div>
                <button 
                    onClick={() => gmCustom('campaign-edit', { campaignId: campaign.id })}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-app-surface hover:bg-app-surface/80 border border-app-border rounded-lg text-sm text-app-text/80 transition-all font-bold"
                >
                    <Edit3 size={16} />
                    Edit Campaign
                </button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left: General Info & Stats */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-app-surface/60 rounded-xl border border-app-border p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-accent">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Info size={18} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wide">Overview</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-app-text/40 uppercase font-bold tracking-widest mb-1">Adventure System</p>
                                <p className="text-app-text/80 font-medium">{campaign.system}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-app-text/40 uppercase font-bold tracking-widest mb-1">Description</p>
                                <p className="text-app-text/60 text-sm leading-relaxed">{campaign.description}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-app-text/40 uppercase font-bold tracking-widest mb-1">Current Synopsis</p>
                                <p className="text-app-text/60 text-sm italic leading-relaxed border-l-2 border-accent/30 pl-3">
                                    "{campaign.synopsis}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* NotebookLM Integration Card */}
                    <div className="bg-app-surface/60 rounded-xl border border-accent/20 p-6 flex flex-col gap-4 shadow-glow-accent/5">
                        <div className="flex items-center gap-3 text-accent">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Sparkles size={18} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wide">AI Oracle Settings</h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[10px] text-app-text/40 leading-relaxed">
                                Link a NotebookLM URL to enable the Oracle panel during your sessions.
                            </p>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    defaultValue={campaign.notebookUrl || ''}
                                    placeholder="https://notebooklm.google.com/..."
                                    onBlur={(e) => useSessionOSStore.getState().updateCampaign(campaign.id, { notebookUrl: e.target.value })}
                                    className="w-full bg-app-bg/50 border border-app-border rounded-lg px-3 py-2 text-xs text-app-text/60 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 outline-none transition-all"
                                />
                                <Sparkles size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text/20 group-focus-within:text-accent transition-colors" />
                            </div>
                            {campaign.notebookUrl && (
                                <p className="text-[9px] text-emerald-500/70 flex items-center gap-1 font-mono">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                    Oracle Sync Ready
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-app-surface/60 rounded-xl border border-app-border p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-emerald-500">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Users size={18} />
                            </div>
                            <h3 className="font-bold text-sm uppercase tracking-wide">NPC Gallery ({campaignNPCs.length})</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {campaignNPCs.map(npc => (
                                <div key={npc.id} className="relative group aspect-square rounded-lg overflow-hidden border border-app-border hover:border-accent transition-colors">
                                    <ResolvedAsset src={npc.avatar} className="w-full h-full object-cover" alt={npc.name} />
                                    <div className="absolute inset-0 bg-app-bg/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-[8px] text-white font-bold uppercase p-1 bg-black/60 rounded">{npc.name}</p>
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => setCurrentView('npc-gallery')}
                                className="aspect-square rounded-lg border-2 border-dashed border-app-border hover:border-app-border/80 flex items-center justify-center text-app-text/20 hover:text-app-text/40 transition-all font-bold text-lg"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Session History & Lore Notes */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-app-surface/60 rounded-xl border border-app-border p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3 text-accent">
                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                    <Calendar size={18} />
                                </div>
                                <h3 className="font-bold text-sm uppercase tracking-wide">Session Logs</h3>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {campaignSessions.sort((a, b) => b.number - a.number).map(s => (
                                <div key={s.id} className={`group/session p-4 rounded-xl border transition-all relative ${s.status === 'active' ? 'bg-accent/10 border-accent/30' : 'bg-app-surface/30 border-app-border hover:border-app-border/80'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-mono font-bold text-app-text/90">#{s.number}</span>
                                            <h4 className="text-sm font-bold text-app-text/80">Session {s.number}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${s.status === 'active' ? 'bg-amber-500 text-slate-950 shadow-glow-accent' : 'bg-app-surface text-app-text/40'}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    useModalStore.getState().showCustom('session-summary', { sessionId: s.id });
                                                }}
                                                className="opacity-0 group-hover/session:opacity-100 transition-opacity flex items-center gap-1.5 px-2 py-1 rounded bg-app-surface/50 border border-app-border text-[10px] font-bold text-blue-400 hover:bg-blue-500 hover:text-white transition-all uppercase tracking-wider"
                                                title="Modifier le résumé"
                                            >
                                                <Edit3 size={12} />
                                                Edit
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const checklistText = s.checklist?.length > 0 
                                                        ? `\n\nCHECKLIST DE LA SESSION :\n${s.checklist.map(item => `${item.isCompleted ? '[X]' : '[ ]'} ${item.text}`).join('\n')}`
                                                        : '';

                                                    const text = `--- ORACLE UPDATE PROTOCOL ---\nCAMPAIGN: ${campaign.name}\nSESSION: #${s.number} - ${new Date(s.date).toLocaleDateString()}\n\nINSTRUCTIONS POUR L'ORACLE : \n1. Intègre ce compte-rendu de session dans ta base de connaissances.\n2. Identifie les nouveaux PNJs rencontrés et mets à jour les relations existantes.\n3. Note les changements majeurs dans l'univers (lieux visités, quêtes terminées).\n4. Prépare-toi à répondre aux questions futures en tenant compte de ces nouveaux événements.\n\nCONTENU DE LA SESSION :\n${s.publicSummary || "No summary recorded."}${checklistText}\n------------------------------`;
                                                    
                                                    navigator.clipboard.writeText(text);
                                                    
                                                    // Visual feedback using the button itself
                                                    const btn = e.currentTarget;
                                                    const originalInner = btn.innerHTML;
                                                    btn.innerHTML = '<span class="text-emerald-500 flex items-center gap-1"><svg size="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg> COPIED</span>';
                                                    btn.classList.add('bg-emerald-500/10', 'border-emerald-500/30');
                                                    
                                                    setTimeout(() => {
                                                        btn.innerHTML = originalInner;
                                                        btn.classList.remove('bg-emerald-500/10', 'border-emerald-500/30');
                                                    }, 2000);
                                                }}
                                                className="opacity-0 group-hover/session:opacity-100 transition-opacity flex items-center gap-1.5 px-2 py-1 rounded bg-app-surface/50 border border-app-border text-[10px] font-bold text-accent hover:bg-accent hover:text-app-bg transition-all uppercase tracking-wider"
                                                title="Copy for NotebookLM Oracle"
                                            >
                                                <Sparkles size={12} />
                                                Oracle Copy
                                            </button>
                                            <span className="text-xs text-app-text/40 font-mono">{new Date(s.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-app-text/60 line-clamp-3 leading-relaxed">
                                        {s.publicSummary || "No summary recorded for this session."}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* World Tracking / POIs Snapshot */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-app-surface/60 rounded-xl border border-app-border p-5">
                            <div className="flex items-center gap-3 text-blue-400 mb-4">
                                <MapPin size={18} />
                                <h4 className="font-bold text-xs uppercase tracking-widest">Active Locations</h4>
                            </div>
                            <div className="flex flex-col gap-2">
                                {activeLocations.length > 0 ? (
                                    activeLocations.map(loc => (
                                        <div key={loc.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer">
                                            <div className="w-8 h-8 rounded bg-app-bg overflow-hidden border border-app-border">
                                                <ResolvedAsset 
                                                    src={loc.fileUrl} 
                                                    isVideo={loc.isVideo}
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100" 
                                                    alt="" 
                                                />
                                            </div>
                                            <span className="text-xs text-app-text/60 font-medium group-hover:text-accent truncate">{loc.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-app-text/20 italic">Aucun lieu épinglé. Éditez la campagne pour en ajouter.</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-app-surface/60 rounded-xl border border-app-border p-5 flex flex-col justify-center items-center gap-3 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-not-allowed">
                            <h4 className="font-bold text-xs uppercase tracking-widest text-app-text/40">Timeline / Wiki</h4>
                            <p className="text-[10px] text-app-text/20 font-medium">Coming Soon in v5.2</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDetails;
