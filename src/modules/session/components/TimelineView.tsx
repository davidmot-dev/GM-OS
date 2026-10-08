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
import { gmCustom, gmConfirm } from '../../../stores/useModalStore';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import TexteMarkdown from '../../../components/TexteMarkdown';
import { reparerLeMojibake } from '../../../utils/reparerLeMojibake';

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
            isWikiSource: true as const,
            originalCategory: entry.category
        }));

    // 08/10/2026, David : regrouper les any. La provenance distingue les
    // événements durables des entrées Wiki, sans reconstruire leurs données.
    type EvenementAffiche = (typeof campaignEvents[number] & {
        isWikiSource?: false; originalCategory?: never;
    }) | (typeof wikiEvents[number] & { locationId?: never });
    const mergedEvents: EvenementAffiche[] = [...campaignEvents, ...wikiEvents]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    const handleEventClick = (event: typeof mergedEvents[number]) => {
        if ('isWikiSource' in event && event.isWikiSource) {
            setSelectedWikiEntryId(event.id);
            setWikiTab('wiki');
        } else {
            gmCustom('timeline-event-edit', event);
        }
    };
    /*
      **Les cinq sortes, chacune sa couleur** — refonte, L5, étape 2. Le filtre
      n'en proposait que quatre : un « événement majeur » ne se filtrait pas.
      Couleurs de catégorie (gm-*), pas d'état : un combat n'est pas une erreur.
    */
    const SORTES: Record<string, { libelle: string; couleur: string }> = {
        session: { libelle: 'Séance', couleur: 'border-gm-cyan/50 bg-gm-cyan/15 text-gm-cyan' },
        combat: { libelle: 'Combat', couleur: 'border-gm-crimson/50 bg-gm-crimson/15 text-gm-crimson' },
        quest: { libelle: 'Quête', couleur: 'border-gm-gold/50 bg-gm-gold/15 text-gm-gold' },
        lore: { libelle: 'Lore', couleur: 'border-gm-emerald/50 bg-gm-emerald/15 text-gm-emerald' },
        'major-event': { libelle: 'Événement majeur', couleur: 'border-gm-violet/50 bg-gm-violet/15 text-gm-violet' },
    };
    const compte = (sorte: string) => [
        ...timelineEvents.filter(e => e.campaignId === activeCampaignId && (sorte === 'all' || e.type === sorte)),
    ].length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'combat': return <Swords size={18} className="text-gm-crimson" />;
            case 'quest': return <Scroll size={18} className="text-gm-gold" />;
            case 'lore': return <Book size={18} className="text-gm-emerald" />;
            case 'session': return <Calendar size={18} className="text-gm-cyan" />;
            case 'major-event': return <Star size={18} className="text-gm-violet" />;
            default: return <MessageSquare size={18} className="text-etat-info" />;
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border bg-app-surface/40 px-5 py-3">
                <div className="flex flex-wrap gap-1.5">
                    {['all', 'session', 'combat', 'quest', 'lore', 'major-event'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`rounded-lg border px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                filter === t
                                    ? 'border-accent bg-accent text-app-on-accent'
                                    : 'border-app-border text-app-muted hover:text-app-text'
                            }`}
                        >
                            {t === 'all' ? 'Tous' : SORTES[t].libelle} ({compte(t)})
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => gmCustom('timeline-event-add')}
                    className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-ui-10 font-black uppercase tracking-widest text-app-on-accent transition-all hover:brightness-110"
                >
                    <Plus size={14} strokeWidth={3} />
                    Nouvel Événement
                </button>
            </div>

            {/* Timeline List */}
            <div className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-5xl mx-auto space-y-4 relative"
                >
                    {/* Vertical Line (Glowing) */}
                    <div className="absolute left-[22.5px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-accent/0 via-accent/20 to-accent/0 shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]" />

                    {mergedEvents.length > 0 ? (
                        mergedEvents.map(event => (
                            <motion.div
                                key={event.id}
                                variants={itemVariants}
                                className={`relative pl-20 group ${event.isWikiSource ? 'cursor-pointer' : ''}`}
                                onClick={() => event.isWikiSource && handleEventClick(event)}
                            >
                                {/* Dot (Bento Style) */}
                                <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-app-bg/60 border border-app-text/5 flex items-center justify-center z-10 group-hover:border-accent shadow-xl transition-all group-hover:shadow-glow-accent/20 group-hover:-translate-y-0.5">
                                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                    {getIcon(event.type)}
                                </div>

                                {/* Content (Glass Bento) */}
                                <div className="rounded-xl border border-app-border bg-app-surface p-5 transition-all hover:border-accent/40">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                            {SORTES[event.type] && (
                                                <span className={`rounded border px-2 py-0.5 text-ui-9 font-black uppercase tracking-widest ${SORTES[event.type].couleur}`}>
                                                    {SORTES[event.type].libelle}
                                                </span>
                                            )}
                                            <span className="font-mono text-xs font-bold text-app-muted">{event.date}</span>
                                            {event.isWikiSource && (
                                                <span className="text-ui-8 font-black text-gm-violet bg-gm-violet/10 px-2 py-0.5 rounded border border-gm-violet/20 uppercase tracking-widest">
                                                    WIKI: {event.originalCategory}
                                                </span>
                                            )}
                                            <h3 className="w-full font-display text-base font-bold uppercase tracking-tight text-app-text">{reparerLeMojibake(event.title)}</h3>
                                        </div>
                                        {/* Éditer et supprimer restent visibles : un geste caché
                                            derrière un survol ne se trouve pas à la tablette. */}
                                        <div className="flex shrink-0 items-center gap-1">
                                            {!event.isWikiSource ? (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); gmCustom('timeline-event-edit', event); }}
                                                        className="flex items-center gap-1.5 rounded-md border border-app-border px-2.5 py-1 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-all hover:border-accent/50 hover:text-accent"
                                                        title="Modifier l'événement"
                                                    >
                                                        <Edit2 size={12} />Éditer
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); gmConfirm(`Supprimer « ${reparerLeMojibake(event.title)} » de la chronologie ?`, () => deleteTimelineEvent(event.id)); }}
                                                        className="rounded-md border border-app-border p-1.5 text-app-subtle transition-all hover:border-etat-danger/50 hover:text-etat-danger"
                                                        title="Supprimer l'événement"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleEventClick(event)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-gm-violet/10 text-gm-violet border border-gm-violet/20 rounded-xl text-ui-9 font-black uppercase tracking-widest hover:bg-gm-violet hover:text-app-bg transition-all"
                                                >
                                                    <Book size={12} />
                                                    Voir Article
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/*
                                      **La description est du Markdown** : le rapport de combat
                                      (`combat.report.*`) l'écrit ainsi, et un extrait du wiki
                                      aussi. Posée dans un `<p>`, elle s'affichait brute
                                      (« ### … **Fin du Round** »), vitrine du 2026-09-28.
                                      `reparerLeMojibake` rend lisibles les événements écrits
                                      avant le 18/08, quand le fichier FR était abîmé.
                                    */}
                                    <div className="prose prose-invert prose-sm max-w-none text-app-text prose-headings:text-app-text prose-headings:mb-2 prose-headings:mt-3 prose-p:text-app-text prose-p:my-1 prose-li:text-app-text prose-li:my-0 prose-ul:my-1 prose-strong:text-app-text prose-a:text-accent">
                                        <TexteMarkdown>{reparerLeMojibake(event.description)}</TexteMarkdown>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-6 border-t border-app-border pt-3 empty:hidden">
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
