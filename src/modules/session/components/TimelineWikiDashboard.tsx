import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    History, 
    Book, 
    ChevronLeft, 
    Shield
} from 'lucide-react';
import TimelineView from './TimelineView';
import WikiView from './WikiView';
import { motion, AnimatePresence } from 'framer-motion';

const TimelineWikiDashboard: React.FC = () => {
    const { setCurrentView, activeCampaignId, campaigns, wikiTab, setWikiTab } = useSessionOSStore();
    
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

    if (!activeCampaign) return null;

    return (
        <div className="flex flex-col h-full bg-app-bg text-app-text">
            {/* Header Area (Glassmorphism 2.0) */}
            <header className="flex items-center justify-between px-8 py-6 bg-app-surface/20 border-b border-app-border/40 backdrop-blur-3xl shrink-0 z-20">
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

                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-md">
                    <button
                        onClick={() => setWikiTab('timeline')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            wikiTab === 'timeline' 
                                ? 'bg-accent text-app-bg shadow-glow-accent' 
                                : 'text-app-text/40 hover:text-app-text hover:bg-white/5'
                        }`}
                    >
                        <History size={14} />
                        Chronologie
                    </button>
                    <button
                        onClick={() => setWikiTab('wiki')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            wikiTab === 'wiki' 
                                ? 'bg-accent text-app-bg shadow-glow-accent' 
                                : 'text-app-text/40 hover:text-app-text hover:bg-white/5'
                        }`}
                    >
                        <Book size={14} />
                        Wiki du Monde
                    </button>
                </div>
            </header>

            {/* Content Area with Transitions */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={wikiTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                        className="h-full"
                    >
                        {wikiTab === 'timeline' ? (
                            <TimelineView />
                        ) : (
                            <WikiView />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TimelineWikiDashboard;
