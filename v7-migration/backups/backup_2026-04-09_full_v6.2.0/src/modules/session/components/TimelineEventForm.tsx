import React, { useState } from 'react';
import { useSessionOSStore, type TimelineEvent } from '../useSessionOSStore';
import { useClockStore } from '../../../store/useClockStore';
import { Save, X } from 'lucide-react';

interface TimelineEventFormProps {
    event?: TimelineEvent;
    onClose: () => void;
}

export const TimelineEventForm: React.FC<TimelineEventFormProps> = ({ event, onClose }) => {
    const { activeCampaignId, addTimelineEvent, updateTimelineEvent, atlasMaps, entities } = useSessionOSStore();
    const clock = useClockStore();
    
    const [title, setTitle] = useState(event?.title || '');
    const [date, setDate] = useState(event?.date || '');
    const [description, setDescription] = useState(event?.description || '');
    const [type, setType] = useState<TimelineEvent['type']>(event?.type || 'lore');
    const [locationId, setLocationId] = useState(event?.locationId || '');
    const [involvedEntityIds, setInvolvedEntityIds] = useState<string[]>(event?.involvedEntityIds || []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCampaignId) return;

        let finalDate = date.trim();
        if (!finalDate) {
            const fantasyDate = clock.getFantasyDate();
            if (clock.activeCalendarId && clock.calendars[clock.activeCalendarId] && fantasyDate) {
                const cal = clock.calendars[clock.activeCalendarId];
                const monthName = cal.months[fantasyDate.monthIndex]?.displayName || cal.months[fantasyDate.monthIndex]?.name;
                finalDate = `${fantasyDate.day} ${monthName}, ${fantasyDate.year} ${cal.name.includes('FR') || cal.id.includes('FR') ? 'DR' : ''}`.trim().replace(/,$/, '');
            } else {
                finalDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            }
        }

        const eventData = {
            campaignId: activeCampaignId,
            title,
            date: finalDate,
            description,
            type,
            locationId: locationId || undefined,
            involvedEntityIds,
        };

        if (event) {
            updateTimelineEvent(event.id, eventData);
        } else {
            addTimelineEvent({
                ...eventData,
                id: crypto.randomUUID(),
            } as TimelineEvent);
        }
        onClose();
    };

    const toggleEntity = (entityId: string) => {
        setInvolvedEntityIds(prev => 
            prev.includes(entityId) 
                ? prev.filter(id => id !== entityId) 
                : [...prev, entityId]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Titre de l'événement</label>
                    <input
                        required
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Ex: La Bataille de Phandalin"
                        className="w-full bg-app-bg/40 border border-app-border rounded-xl px-4 py-2 text-sm text-app-text focus:outline-none focus:border-accent/50 transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Date (Calendrier de jeu)</label>
                    <input
                        type="text"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        placeholder="Ex: 14 Hammer, 1492 DR"
                        className="w-full bg-app-bg/40 border border-app-border rounded-xl px-4 py-2 text-sm text-app-text focus:outline-none focus:border-accent/50 transition-all"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Type d'événement</label>
                <div className="flex flex-wrap gap-2">
                    {(['session', 'combat', 'quest', 'lore'] as const).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                type === t 
                                    ? 'bg-accent/10 border-accent/40 text-accent shadow-glow-accent/10' 
                                    : 'bg-app-bg/20 border-app-border text-app-text/40 hover:text-app-text'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Description</label>
                <textarea
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Décrivez ce qu'il s'est passé..."
                    className="w-full bg-app-bg/40 border border-app-border rounded-xl px-4 py-2 text-sm text-app-text focus:outline-none focus:border-accent/50 transition-all resize-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Lieu (Atlas)</label>
                    <select
                        title="Sélectionner un lieu"
                        value={locationId}
                        onChange={e => setLocationId(e.target.value)}
                        className="w-full bg-app-bg/40 border border-app-border rounded-xl px-4 py-2 text-sm text-app-text focus:outline-none focus:border-accent/50 transition-all"
                    >
                        <option value="">Aucun lieu lié</option>
                        {atlasMaps.filter(m => m.campaignId === activeCampaignId).map(map => (
                            <option key={map.id} value={map.id}>{map.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Participants</label>
                    <div className="max-h-32 overflow-y-auto border border-app-border rounded-xl p-2 space-y-1 custom-scrollbar bg-app-bg/20">
                        {entities.filter(e => e.campaignId === activeCampaignId).map(entity => (
                            <button
                                key={entity.id}
                                type="button"
                                onClick={() => toggleEntity(entity.id)}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                    involvedEntityIds.includes(entity.id)
                                        ? 'bg-accent/10 text-accent'
                                        : 'text-app-text/40 hover:bg-app-surface/40 hover:text-app-text'
                                }`}
                            >
                                {entity.name}
                                {involvedEntityIds.includes(entity.id) && <X size={10} />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-app-border/40">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-app-text/40 hover:text-app-text transition-all"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-2 bg-accent text-app-bg rounded-xl text-xs font-black uppercase tracking-widest shadow-glow-accent/20 hover:opacity-90 transition-all"
                >
                    <Save size={14} />
                    {event ? 'Enregistrer' : 'Créer l\'événement'}
                </button>
            </div>
        </form>
    );
};
