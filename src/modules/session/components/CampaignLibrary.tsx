import React from 'react';
import { Plus, Search, BookOpen, Trash2, ArrowRight, Settings } from 'lucide-react';
import { gmConfirm, gmCustom } from '../../../stores/useModalStore';
import { useSessionOSStore } from '../useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';

const CampaignLibrary: React.FC = () => {
    const { campaigns, setActiveCampaign, setCurrentView, activeCampaignId, customSheetTemplates } = useSessionOSStore();

    const getSystemName = (systemId: string) => {
        const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
        return allTemplates.find(t => t.id === systemId)?.name || systemId;
    };

    const handleSelectCampaign = (id: string) => {
        setActiveCampaign(id);
        setCurrentView('cockpit');
    };

    return (
        <div className="flex-1 flex flex-col gap-6 p-8 h-full overflow-y-auto custom-scrollbar bg-app-bg">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-app-text/90 uppercase tracking-tighter">Campaign Library</h2>
                <p className="text-app-text/40 font-medium">Select a world to manage or create a new epic adventure.</p>
            </div>

            <div className="flex items-center gap-4 py-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/20 group-focus-within:text-accent transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        className="w-full bg-app-surface/60 border border-app-border/40 rounded-xl py-3 pl-11 pr-4 text-app-text/80 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all font-display"
                    />
                </div>
                <button
                    onClick={() => gmCustom('campaign-add')}
                    className="flex items-center gap-2 bg-accent px-6 py-3 rounded-xl text-app-bg font-bold hover:brightness-110 transition-all shadow-glow-accent/20 hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    CREATE NEW CAMPAIGN
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(campaign => (
                    <div
                        key={campaign.id}
                        className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-500 hover:scale-[1.02] cursor-pointer shadow-xl ${campaign.id === activeCampaignId ? 'border-accent bg-app-surface/80 shadow-glow-accent/5' : 'border-app-border/40 bg-app-surface/40 hover:border-app-border/80'}`}
                        onClick={() => handleSelectCampaign(campaign.id)}
                    >
                        {/* Background subtle image if available */}
                        {campaign.wallpaperUrl && (
                            <div className="absolute inset-0 opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-700">
                                <img src={campaign.wallpaperUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                        )}

                        <div className="relative p-6 flex flex-col h-64 justify-between z-10">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-app-bg flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-app-bg transition-all duration-500">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            className="p-2 text-app-text/20 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                gmCustom('campaign-edit', { campaignId: campaign.id }); 
                                            }}
                                            title="Éditer"
                                        >
                                            <Settings size={18} />
                                        </button>
                                        <button
                                            className="p-2 text-app-text/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                gmConfirm(`Supprimer définitivement "${campaign.name}" ?`, () => {
                                                    useSessionOSStore.getState().deleteCampaign(campaign.id);
                                                });
                                            }}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-app-text/90 mb-1 group-hover:text-accent transition-colors">{campaign.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-app-bg text-app-text/40 px-2 py-0.5 rounded font-black uppercase tracking-widest">{getSystemName(campaign.system)}</span>
                                    {campaign.id === activeCampaignId && (
                                        <span className="text-[10px] bg-accent text-app-bg px-2 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">ACTIVE</span>
                                    )}
                                </div>
                                <p className="text-app-text/40 text-xs mt-3 line-clamp-2 leading-relaxed italic">
                                    "{campaign.description}"
                                </p>
                            </div>

                             <div className="flex items-center justify-between mt-4">
                                <div className="flex -space-x-2">
                                    {/* Mock player avatars */}
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-7 h-7 rounded-full border-2 border-app-bg bg-app-surface overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Player${i}${campaign.id}`} alt="" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1 text-accent font-bold text-xs group-hover:translate-x-1 transition-transform">
                                    MANAGE <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CampaignLibrary;
