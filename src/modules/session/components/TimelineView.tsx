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

const TimelineView: React.FC = () => {
    const { 
        timelineEvents, 
        activeCampaignId, 
        deleteTimelineEvent,
        atlasMaps
    } = useSessionOSStore();

    const [filter, setFilter] = useState<string>('all');

    const campaignEvents = timelineEvents
        .filter(e => e.campaignId === activeCampaignId)
        .filter(e => filter === 'all' || e.type === filter)
        .sort((a, b) => b.id.localeCompare(a.id)); 

    const getIcon = (type: string) => {
        switch (type) {
            case 'combat': return <Swords size={16} className="text-rose-400" />;
            case 'quest': return <Scroll size={16} className="text-accent" />;
            case 'lore': return <Book size={16} className="text-purple-400" />;
            case 'session': return <Calendar size={16} className="text-emerald-400" />;
            default: return <MessageSquare size={16} className="text-blue-400" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-app-bg/20">
            {/* Toolbar */}
            <div className="px-8 py-4 flex items-center justify-between bg-app-surface/20 border-b border-app-border">
                <div className="flex gap-2">
                    {['all', 'session', 'combat', 'quest', 'lore'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                                filter === t 
                                    ? 'bg-accent/10 border-accent/40 text-accent' 
                                    : 'bg-app-bg/40 border-app-border text-app-text/40 hover:text-app-text hover:border-app-border/60'
                            }`}
                        >
                            {t === 'all' ? 'Tous' : t}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => gmCustom('timeline-event-add')}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-app-bg rounded-xl text-xs font-black uppercase tracking-widest shadow-glow-accent/20 hover:opacity-90 transition-all"
                >
                    <Plus size={14} />
                    Nouvel Événement
                </button>
            </div>

            {/* Timeline List */}
            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-app-border/40" />

                    {campaignEvents.length > 0 ? (
                        campaignEvents.map((event) => (
                            <div key={event.id} className="relative pl-14 group">
                                {/* Dot */}
                                <div className="absolute left-0 top-1.5 w-11 h-11 rounded-2xl bg-app-bg border border-app-border flex items-center justify-center z-10 group-hover:border-accent transition-all group-hover:shadow-glow-accent/10">
                                    {getIcon(event.type)}
                                </div>

                                {/* Content */}
                                <div className="bg-app-surface/40 border border-app-border rounded-2xl p-6 hover:bg-app-surface/60 transition-all hover:border-accent/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                                {event.date}
                                            </span>
                                            <h3 className="text-sm font-black text-app-text tracking-wide">{event.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => gmCustom('timeline-event-edit', event)}
                                                className="p-1.5 hover:bg-app-bg rounded-lg text-app-text/20 hover:text-accent transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => deleteTimelineEvent(event.id)}
                                                className="p-1.5 hover:bg-app-bg rounded-lg text-app-text/20 hover:text-rose-400 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-app-text/60 leading-relaxed mb-6">
                                        {event.description}
                                    </p>

                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-app-border/40">
                                        {event.locationId && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-app-text/40">
                                                <MapPin size={12} className="text-accent" />
                                                {atlasMaps.find(m => m.id === event.locationId)?.name}
                                            </div>
                                        )}
                                        {((event as any).involvedEntityIds || []).length > 0 && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-app-text/40">
                                                <Users size={12} className="text-accent" />
                                                {((event as any).involvedEntityIds || []).length} Participants
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-app-text/20 gap-4">
                            <LucideHistory size={48} strokeWidth={1} />
                            <p className="font-bold text-sm tracking-widest uppercase">Aucun événement enregistré</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimelineView;
