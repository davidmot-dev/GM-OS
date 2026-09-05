import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Plus, 
    Calendar, 
    MapPin, 
    Users, 
    MessageSquare, 
    Swords, 
    Scroll,
    Trash2,
    Edit2,
    History as LucideHistory,
    Book
} from 'lucide-react';
import { gmCustom } from '../../../stores/useModalStore';
import { motion } from 'framer-motion';

const TimelineView: React.FC = () => {
    const { 
        timelineEvents, 
        wikiEntries,
        activeCampaignId, 
        deleteTimelineEvent,
        atlasMaps,
        setSelectedWikiEntryId,
        setWikiTab
    } = useSessionOSStore();

    const [filter, setFilter] = useState<string>('all');

    const campaignEvents = timelineEvents
        .filter(e => e.campaignId === activeCampaignId)
        .filter(e => filter === 'all' || e.type === filter);

    // Fusionner avec les entrées Wiki possédant une date
    const wikiEvents = wikiEntries
        .filter(e => e.campaignId === activeCampaignId && e.eventDate)
        .filter(e => filter === 'all' || e.category === filter || (filter === 'lore' && (e.category === 'lore' || e.category === 'organization' || e.category === 'rumor')))
        .map(entry => ({
            id: entry.id,
            campaignId: entry.campaignId,
            date: entry.eventDate!,
            title: entry.title,
            description: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
            type: entry.category === 'npc' ? 'lore' : (entry.category === 'location' ? 'lore' : 'lore'), // Mapping simplifié
            isWikiSource: true,
            originalCategory: entry.category
        }));

    const mergedEvents = [...campaignEvents, ...wikiEvents]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)); 

    const handleEventClick = (event: any) => {
        if (event.isWikiSource) {
            setSelectedWikiEntryId(event.id);
            setWikiTab('wiki');
        } else {
            gmCustom('timeline-event-edit', event);
        }
    };
    const getIcon = (type: string) => {
        switch (type) {
            case 'combat': return <Swords size={18} className="text-rose-400" />;
            case 'quest': return <Scroll size={18} className="text-accent" />;
            case 'lore': return <Book size={18} className="text-purple-400" />;
            case 'session': return <Calendar size={18} className="text-emerald-400" />;
            default: return <MessageSquare size={18} className="text-blue-400" />;
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const } }
    };

    return (
        <div className="flex flex-col h-full bg-app-bg/20">
            {/* Toolbar (Glass) */}
            <div className="px-8 py-6 flex items-center justify-between bg-black/20 border-b border-white/5 backdrop-blur-md">
                <div className="flex gap-2">
                    {['all', 'session', 'combat', 'quest', 'lore'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-4 py-1.5 rounded-full text-ui-10 font-black uppercase tracking-widest border transition-all ${
                                filter === t 
                                    ? 'bg-accent/20 border-accent/40 text-accent shadow-glow-accent/10' 
                                    : 'bg-white/5 border-white/5 text-app-text/40 hover:text-app-text hover:border-white/10'
                            }`}
                        >
                            {t === 'all' ? 'Tous' : t}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => gmCustom('timeline-event-add')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent text-app-bg rounded-xl text-ui-10 font-black uppercase tracking-widest shadow-glow-accent/20 hover:opacity-90 transition-all active:scale-95"
                >
                    <Plus size={14} strokeWidth={3} />
                    Nouvel Événement
                </button>
            </div>

            {/* Timeline List */}
            <div className="flex-1 overflow-y-auto px-8 py-12 custom-scrollbar">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-5xl mx-auto space-y-12 relative"
                >
                    {/* Vertical Line (Glowing) */}
                    <div className="absolute left-[22.5px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-accent/0 via-accent/20 to-accent/0 shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]" />

                    {mergedEvents.length > 0 ? (
                        mergedEvents.map((event: any) => (
                            <motion.div 
                                key={event.id} 
                                variants={itemVariants}
                                className={`relative pl-20 group ${event.isWikiSource ? 'cursor-pointer' : ''}`}
                                onClick={() => event.isWikiSource && handleEventClick(event)}
                            >
                                {/* Dot (Bento Style) */}
                                <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center z-10 group-hover:border-accent shadow-xl transition-all group-hover:shadow-glow-accent/20 group-hover:-translate-y-0.5">
                                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                    {getIcon(event.type)}
                                </div>

                                {/* Content (Glass Bento) */}
                                <div className="glass-bento rounded-[2.5rem] border border-white/5 p-8 hover:bg-white/5 transition-all group-hover:shadow-2xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-ui-10 font-black text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-widest border border-accent/20">
                                                {event.date}
                                            </span>
                                            {event.isWikiSource && (
                                                <span className="text-ui-8 font-black text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20 uppercase tracking-widest">
                                                    WIKI: {event.originalCategory}
                                                </span>
                                            )}
                                            <h3 className="text-base font-black text-app-text tracking-tight uppercase group-hover:text-accent transition-colors">{event.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            {!event.isWikiSource ? (
                                                <>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); gmCustom('timeline-event-edit', event); }}
                                                        className="p-2 hover:bg-white/5 rounded-xl text-app-text/20 hover:text-accent transition-all border border-transparent hover:border-white/10"
                                                        title="Modifier l'événement"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); deleteTimelineEvent(event.id); }}
                                                        className="p-2 hover:bg-white/5 rounded-xl text-app-text/20 hover:text-rose-400 transition-all border border-transparent hover:border-white/10"
                                                        title="Supprimer l'événement"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleEventClick(event)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-ui-9 font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all"
                                                >
                                                    <Book size={12} />
                                                    Voir Article
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-sm text-app-text/60 leading-relaxed mb-8 font-medium">
                                        {event.description}
                                    </p>

                                    <div className="flex flex-wrap gap-6 pt-6 border-t border-white/5">
                                        {event.locationId && (
                                            <div className="flex items-center gap-2.5 text-ui-10 font-black uppercase tracking-widest text-app-text/30">
                                                <MapPin size={14} className="text-accent" />
                                                <span className="group-hover:text-app-text/60 transition-colors">
                                                    {atlasMaps.find(m => m.id === event.locationId)?.name}
                                                </span>
                                            </div>
                                        )}
                                        {((event as { involvedEntityIds?: string[] }).involvedEntityIds || []).length > 0 && (
                                            <div className="flex items-center gap-2.5 text-ui-10 font-black uppercase tracking-widest text-app-text/30">
                                                <Users size={14} className="text-accent" />
                                                <span className="group-hover:text-app-text/60 transition-colors">
                                                    {((event as { involvedEntityIds?: string[] }).involvedEntityIds || []).length} Participants
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-app-text/20 gap-6"
                        >
                            <LucideHistory size={64} strokeWidth={1} className="opacity-20 translate-y-4" />
                            <div className="text-center">
                                <p className="font-black text-xs tracking-[0.4em] uppercase">Silence dans les Archives</p>
                                <p className="text-ui-10 opacity-40 mt-2 uppercase tracking-[0.2em]">Aucun événement enregistré dans cette période</p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default TimelineView;
