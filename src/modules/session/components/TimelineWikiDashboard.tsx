import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    History, 
    Book, 
    ChevronLeft, 
    Shield
} from 'lucide-react';
import TimelineView from './TimelineView';
import WikiView from './WikiView';

const TimelineWikiDashboard: React.FC = () => {
    const { setCurrentView, activeCampaignId, campaigns } = useSessionOSStore();
    const [activeTab, setActiveTab] = useState<'timeline' | 'wiki'>('timeline');
    
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

    if (!activeCampaign) return null;

    return (
        <div className="flex flex-col h-full bg-app-bg text-app-text animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 bg-app-surface/40 border-b border-app-border backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setCurrentView('campaign-details')}
                        className="p-2 rounded-xl hover:bg-app-bg text-app-text/40 hover:text-accent transition-all group"
                        title="Retour aux détails de la campagne"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <Shield size={14} className="text-accent" />
                            <h2 className="text-lg font-black uppercase tracking-widest">{activeCampaign.name}</h2>
                        </div>
                        <p className="text-[10px] font-bold text-app-text/20 uppercase tracking-[0.2em]">Archives & Chroniques du Monde</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 p-1 bg-app-bg/60 rounded-xl border border-app-border">
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'timeline' 
                                ? 'bg-accent text-app-bg shadow-glow-accent/20' 
                                : 'text-app-text/40 hover:text-app-text hover:bg-app-surface'
                        }`}
                    >
                        <History size={14} />
                        Chronologie
                    </button>
                    <button
                        onClick={() => setActiveTab('wiki')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'wiki' 
                                ? 'bg-accent text-app-bg shadow-glow-accent/20' 
                                : 'text-app-text/40 hover:text-app-text hover:bg-app-surface'
                        }`}
                    >
                        <Book size={14} />
                        Wiki du Monde
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'timeline' ? (
                    <TimelineView />
                ) : (
                    <WikiView />
                )}
            </div>
        </div>
    );
};

export default TimelineWikiDashboard;
