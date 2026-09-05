import React, { useState } from 'react';
import { useSessionOSStore, type WikiEntry } from '../useSessionOSStore';
import { Save, X, Plus } from 'lucide-react';
import { MediaImage } from '../../../components/MediaImage';
import { useTranslation } from 'react-i18next';


interface WikiEntryFormProps {
    entry?: WikiEntry;
    onClose: () => void;
}

export const WikiEntryForm: React.FC<WikiEntryFormProps> = ({ entry, onClose }) => {
    const { t } = useTranslation();
    const { activeCampaignId, addWikiEntry, updateWikiEntry, entities } = useSessionOSStore();

    
    const [title, setTitle] = useState(entry?.title || '');
    const [content, setContent] = useState(entry?.content || '');
    const [category, setCategory] = useState<WikiEntry['category']>(entry?.category || 'lore');
    const [tags, setTags] = useState<string[]>(entry?.tags || []);
    const [newTag, setNewTag] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>(entry?.imageUrls || []);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [linkedEntityIds, setLinkedEntityIds] = useState<string[]>(entry?.linkedEntityIds || []);
    const [eventDate, setEventDate] = useState(entry?.eventDate || '');

    const categories = ['npc', 'location', 'organization', 'lore', 'item', 'clue', 'rumor', 'other'] as const;


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCampaignId) return;

        const entryData = {
            campaignId: activeCampaignId,
            title,
            content,
            category,
            tags,
            imageUrls,
            linkedEntityIds,
            eventDate,
        };

        if (entry) {
            updateWikiEntry(entry.id, entryData);
        } else {
            addWikiEntry(entryData);
        }
        onClose();
    };

    const addTag = () => {
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
            setNewTag('');
        }
    };

    const addImage = () => {
        if (newImageUrl && !imageUrls.includes(newImageUrl)) {
            setImageUrls([...imageUrls, newImageUrl]);
            setNewImageUrl('');
        }
    };

    const toggleEntity = (entityId: string) => {
        setLinkedEntityIds(prev => 
            prev.includes(entityId) 
                ? prev.filter(id => id !== entityId) 
                : [...prev, entityId]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">{t('modules:session.wiki_form.title_label')}</label>
                    <input
                        required
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={t('modules:session.wiki_form.title_placeholder')}
                        className="w-full bg-app-bg/40 border border-app-border rounded-xl px-4 py-2 text-sm text-app-text focus:outline-none focus:border-accent/50 transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">{t('modules:session.wiki_form.category_label')}</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value as WikiEntry['category'])}
                        className="w-full bg-app-bg/40 border border-app-border rounded-xl px-4 py-2 text-sm text-app-text focus:outline-none focus:border-accent/50 transition-all"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{t(`modules:session.wiki_form.categories.${cat}`)}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">{t('modules:session.wiki_form.date_label')}</label>
                    <input
                        type="text"
                        value={eventDate}
                        onChange={e => setEventDate(e.target.value)}
                        placeholder={t('modules:session.wiki_form.date_placeholder')}
                        className="w-full bg-app-bg/40 border border-app-border rounded-xl px-4 py-2 text-sm text-app-text focus:outline-none focus:border-accent/50 transition-all"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">{t('modules:session.wiki_form.content_label')}</label>
                <textarea
                    required
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={8}
                    placeholder={t('modules:session.wiki_form.content_placeholder')}
                    className="w-full bg-app-bg/40 border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:outline-none focus:border-accent/50 transition-all resize-none custom-scrollbar"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">{t('modules:session.wiki_form.tags_label')}</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder={t('modules:session.wiki_form.tags_placeholder')}
                                className="flex-1 bg-app-bg/20 border border-app-border rounded-lg px-3 py-1.5 text-ui-10 text-app-text focus:outline-none focus:border-accent/50 transition-all"
                            />
                            <button type="button" onClick={addTag} title={t('modules:session.wiki_form.tags_placeholder')} className="p-1.5 bg-app-surface border border-app-border rounded-lg text-accent hover:bg-accent/10 transition-all">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 px-2 py-0.5 bg-app-bg border border-app-border rounded text-ui-9 text-app-text/60">
                                    {tag}
                                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-rose-400">
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">{t('modules:session.wiki_form.images_label')}</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newImageUrl}
                                onChange={e => setNewImageUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                                placeholder={t('modules:session.wiki_form.images_placeholder')}
                                className="flex-1 bg-app-bg/20 border border-app-border rounded-lg px-3 py-1.5 text-ui-10 text-app-text focus:outline-none focus:border-accent/50 transition-all"
                            />
                            <button type="button" onClick={addImage} title={t('modules:session.wiki_form.images_placeholder')} className="p-1.5 bg-app-surface border border-app-border rounded-lg text-accent hover:bg-accent/10 transition-all">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {imageUrls.map(url => (
                                <div key={url} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-app-border">
                                    <MediaImage source={url} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        type="button" 
                                        onClick={() => setImageUrls(imageUrls.filter(u => u !== url))}
                                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-rose-400"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">{t('modules:session.wiki_form.entities_label')}</label>
                    <div className="max-h-48 overflow-y-auto border border-app-border rounded-xl p-2 space-y-1 custom-scrollbar bg-app-bg/20">
                        {entities.filter(e => e.campaignId === activeCampaignId).map(entity => (
                            <button
                                key={entity.id}
                                type="button"
                                onClick={() => toggleEntity(entity.id)}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-ui-10 font-bold transition-all ${
                                    linkedEntityIds.includes(entity.id)
                                        ? 'bg-accent/10 text-accent'
                                        : 'text-app-text/40 hover:bg-app-surface/40 hover:text-app-text'
                                }`}
                            >
                                {entity.name}
                                {linkedEntityIds.includes(entity.id) && <X size={10} />}
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
                    {t('modules:session.wiki_form.cancel')}
                </button>
                <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-2 bg-accent text-app-bg rounded-xl text-xs font-black uppercase tracking-widest shadow-glow-accent/20 hover:opacity-90 transition-all"
                >
                    <Save size={14} />
                    {entry ? t('modules:session.wiki_form.save_edit') : t('modules:session.wiki_form.save_create')}
                </button>
            </div>

        </form>
    );
};
