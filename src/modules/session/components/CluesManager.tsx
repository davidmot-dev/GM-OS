import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore, type Clue } from '../useSessionOSStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { useImageStore } from '../../image/useImageStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { 
    Search, Plus, Trash2, Edit3, Eye, EyeOff, 
    MapPin, Users,
    ChevronRight, Save, X, Sparkles, ImageIcon,
    ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { gmToast } from '../../../stores/useToastStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import type { ProjectedEntity } from '../../image/types';

const CluesManager: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { 
        clues, activeCampaignId, addClue, updateClue, deleteClue,
        atlasMaps, entities, editingClueId, setEditingClueId,
        pendingPreFill, clearPendingPreFill
    } = useSessionOSStore();

    const [editingClue, setEditingClue] = useState<Partial<Clue> | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const [justRevealed, setJustRevealed] = useState<string | null>(null);
    
    const { projectEntity, projectedEntity } = useImageStore();
    const resolvedMedia = useMediaUrl(editingClue?.mediaUrl);
    
    const campaignClues = clues.filter(c => c.campaignId === activeCampaignId);

    // Auto-open editor if directed from Atlas/NPC sheet
    React.useEffect(() => {
        if (editingClueId) {
            const clueToEdit = campaignClues.find(c => c.id === editingClueId);
            if (clueToEdit) {
                setEditingClue({ ...clueToEdit });
                setIsAdding(false);
                // Important: clear the global trigger but keep local editing
                setEditingClueId(null);
            }
        }
    }, [editingClueId, campaignClues, setEditingClueId]);
    
    // Wiki Bridge Receiver
    useEffect(() => {
        if (pendingPreFill && (pendingPreFill.type === 'clue' || pendingPreFill.type === 'item' || pendingPreFill.type === 'rumor' || pendingPreFill.type === 'location')) {
            const { title, content, mediaUrl, imageUrl } = pendingPreFill.data;
            
            let prefix = '';
            if (pendingPreFill.type === 'rumor') prefix = '[RUMEUR] ';
            if (pendingPreFill.type === 'location') prefix = '[LIEU] ';
            
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEditingClue({ 
                title: prefix + (title || ''), 
                content: content || '', 
                mediaUrl: mediaUrl || imageUrl || '',
                isRevealed: false 
            });
            setIsAdding(true);
            clearPendingPreFill();
            gmToast(pendingPreFill.type === 'location' ? t('modules:session.clues_manager.toasts.location_import') : t('modules:session.clues_manager.toasts.wiki_import'));
        }
    }, [pendingPreFill, clearPendingPreFill, t]);

    // Safety check for activeCampaignId
    if (!activeCampaignId) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-white/20 gap-4">
                <Search size={48} strokeWidth={1} />
                <p className="text-xs font-black uppercase tracking-widest">{t('modules:session.clues_manager.no_campaign')}</p>
            </div>
        );
    }

    // Selectors data
    const campaignMaps = atlasMaps.filter(m => m.campaignId === activeCampaignId);
    const campaignEntities = entities.filter(e => e.campaignId === activeCampaignId);

    const handleSave = () => {
        if (!editingClue || !editingClue.title) {
            gmToast(t('modules:session.clues_manager.toasts.title_required'), 'error');
            return;
        }

        const currentClue = campaignClues.find(c => c.id === editingClue.id);
        const isRevealing = editingClue.isRevealed && !currentClue?.isRevealed;

        const { addEvent } = useJournalStore.getState();

        const clueToSave = {
            ...editingClue,
            campaignId: activeCampaignId,
            content: editingClue.content || '',
            // If it's being revealed now, set timestamp and default moment
            ...(isRevealing ? { 
                revealedAt: Date.now(),
                campaignMoment: editingClue.campaignMoment || 'Session actuelle'
            } : {})
        };

        if (isAdding) {
            addClue({
                ...clueToSave,
                isRevealed: editingClue.isRevealed ?? false,
            } as Omit<Clue, 'id'>);
            gmToast(t('modules:session.clues_manager.toasts.save_success_add'));
        } else if (editingClue.id) {
            updateClue(editingClue.id, clueToSave);
            gmToast(t('modules:session.clues_manager.toasts.save_success_update'));
            
            if (isRevealing) {
                setJustRevealed(editingClue.id);
                setTimeout(() => setJustRevealed(null), 1000);

                // TRACÉ DANS LE JOURNAL OS
                addEvent({
                    type: 'NOTE',
                    title: t('modules:session.clues_manager.journal.reveal_log', { title: clueToSave.title }),
                    content: t('modules:session.clues_manager.journal.reveal_log_content', { 
                        moment: clueToSave.campaignMoment || 'Non spécifié',
                        content: clueToSave.content || 'Aucune description'
                    }),
                    metadata: { clueId: editingClue.id, type: 'evidence', mediaUrl: clueToSave.mediaUrl }
                });
            }
        }
        
        setEditingClue(null);
        setIsAdding(false);
        setEditingClueId(null);
    };

    const handleProject = (clue: Partial<Clue>) => {
        if (!clue.isRevealed) {
            gmToast(t('modules:session.clues_manager.toasts.reveal_warning'), 'warning');
            return;
        }

        const entityToProject: ProjectedEntity = {
            id: clue.id || 'temp-clue',
            name: clue.title || t('modules:session.clues_manager.clue_title_label'),
            subtitle: t('modules:session.clues_manager.npc_link'),
            avatar: clue.mediaUrl || '',
            description: clue.content || '',
            type: 'clue',
        };

        projectEntity(entityToProject);
        gmToast(projectedEntity?.id === clue.id ? t('modules:session.clues_manager.toasts.project_off') : t('modules:session.clues_manager.toasts.project_on'));
    };

    const handleEdit = (clue: Clue) => {
        setEditingClue({ ...clue });
        setIsAdding(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('modules:session.clues_manager.delete_confirm'))) {
            deleteClue(id);
            gmToast(t('modules:session.clues_manager.toasts.delete_success'));
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-4">
                        <Search className="text-gm-gold" size={28} />
                        {t('modules:session.clues_manager.title')}
                    </h2>
                    <p className="text-sm text-white/40 tracking-wide uppercase font-bold">{t('modules:session.clues_manager.subtitle')}</p>
                </div>
                {!editingClue && !isAdding && (
                    <button
                        onClick={() => {
                            setEditingClue({ title: '', content: '', isRevealed: false });
                            setIsAdding(true);
                        }}
                        className="flex items-center gap-2 bg-gm-gold text-black font-black px-6 py-3 rounded-xl text-ui-10 tracking-widest uppercase transition-all shadow-glow-gold/20 hover:scale-105"
                        title={t('modules:session.clues_manager.add_fragment_tooltip')}
                    >
                        <Plus size={14} />
                        {t('modules:session.clues_manager.new_fragment')}
                    </button>
                )}
            </div>

            {(editingClue || isAdding) && editingClue ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Editor Side */}
                    <div className="space-y-8 p-10 rounded-[3rem] glass-bento border border-white/5 shadow-2xl flex-1 min-h-[600px]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-ui-10 font-black uppercase tracking-[0.3em] text-gm-gold">{t('modules:session.clues_manager.editor_title')}</span>
                            <button 
                                onClick={() => { setEditingClue(null); setIsAdding(false); setEditingClueId(null); }} 
                                className="text-white/20 hover:text-white transition-all"
                                title={t('modules:session.campaign_form.close_tooltip')}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label htmlFor="clue-title" className="text-ui-10 font-black uppercase tracking-widest text-white/30 px-2">{t('modules:session.clues_manager.clue_title_label')}</label>
                                <input 
                                    id="clue-title"
                                    value={editingClue.title || ''}
                                    onChange={e => setEditingClue({ ...editingClue, title: e.target.value })}
                                    placeholder={t('modules:session.clues_manager.clue_title_placeholder')}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-base font-bold text-white focus:border-gm-gold/40 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-ui-10 font-black uppercase tracking-widest text-white/30 px-2">{t('modules:session.clues_manager.visual_label')}</label>
                                <button 
                                    type="button"
                                    onClick={() => setIsMediaBrowserOpen(true)}
                                    className="group relative w-full aspect-video bg-black/40 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-gm-gold/40 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gm-gold/50"
                                    title={t('modules:session.clues_manager.change_image')}
                                    aria-label={t('modules:session.clues_manager.change_image')}
                                >
                                    {editingClue.mediaUrl ? (
                                        <>
                                            <ResolvedAsset src={resolvedMedia || ''} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-ui-10 font-black uppercase tracking-widest text-white">{t('modules:session.clues_manager.change_image')}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-white/20 group-hover:text-gm-gold/40 transition-colors">
                                            <ImageIcon size={32} strokeWidth={1} />
                                            <span className="text-ui-9 font-black uppercase tracking-widest">{t('modules:session.clues_manager.add_visual')}</span>
                                        </div>
                                    )}
                                </button>
                            </div>

                            <div className="space-y-3">
                                <label htmlFor="clue-content" className="text-ui-10 font-black uppercase tracking-widest text-white/30 px-2">{t('modules:session.clues_manager.content_label')}</label>
                                <textarea 
                                    id="clue-content"
                                    value={editingClue.content || ''}
                                    onChange={e => setEditingClue({ ...editingClue, content: e.target.value })}
                                    placeholder={t('modules:session.clues_manager.content_placeholder')}
                                    rows={5}
                                    className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-6 text-sm text-white/60 focus:border-gm-gold/40 outline-none transition-all resize-none custom-scrollbar"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label htmlFor="clue-location" className="text-ui-10 font-black uppercase tracking-widest text-white/30 px-2 flex items-center gap-2">
                                        <MapPin size={12} /> {t('modules:session.clues_manager.location_label')}
                                    </label>
                                    <div className="relative">
                                        <select 
                                            id="clue-location"
                                            value={editingClue.locationId || ''}
                                            onChange={e => setEditingClue({ ...editingClue, locationId: e.target.value || undefined })}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white/60 outline-none appearance-none cursor-pointer pr-10"
                                            title={t('modules:session.clues_manager.location_label')}
                                        >
                                            <option value="">{t('modules:session.clues_manager.no_location')}</option>
                                            {campaignMaps.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-white/20 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label htmlFor="clue-owner" className="text-ui-10 font-black uppercase tracking-widest text-white/30 px-2 flex items-center gap-2">
                                        <Users size={12} /> {t('modules:session.clues_manager.npc_label')}
                                    </label>
                                    <div className="relative">
                                        <select 
                                            id="clue-owner"
                                            value={editingClue.ownerId || ''}
                                            onChange={e => setEditingClue({ ...editingClue, ownerId: e.target.value || undefined })}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white/60 outline-none appearance-none cursor-pointer pr-10"
                                            title={t('modules:session.clues_manager.npc_label')}
                                        >
                                            <option value="">{t('modules:session.clues_manager.no_npc')}</option>
                                            {campaignEntities.filter(ent => ent.type === 'npc').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-white/20 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label htmlFor="clue-moment" className="text-ui-10 font-black uppercase tracking-widest text-white/30 px-2 flex items-center gap-2">
                                    <Sparkles size={12} /> {t('modules:session.clues_manager.moment_label')}
                                </label>
                                <input 
                                    id="clue-moment"
                                    value={editingClue.campaignMoment || ''}
                                    onChange={e => setEditingClue({ ...editingClue, campaignMoment: e.target.value })}
                                    placeholder={t('modules:session.clues_manager.moment_placeholder')}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white/60 focus:border-gm-gold/40 outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${editingClue.isRevealed ? 'bg-gm-gold text-black shadow-glow-gold' : 'bg-white/5 text-white/20'}`}>
                                        {editingClue.isRevealed ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-ui-10 font-black uppercase tracking-widest text-white">{t('modules:session.clues_manager.revelation_label')}</p>
                                        <p className="text-ui-9 text-white/20 font-bold uppercase tracking-widest mt-0.5">{t('modules:session.clues_manager.revelation_desc')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingClue({ ...editingClue, isRevealed: !editingClue.isRevealed })}
                                    className={`relative w-12 h-6 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-gm-gold/50 ${editingClue.isRevealed ? 'bg-gm-gold' : 'bg-white/10'}`}
                                    title={editingClue.isRevealed ? t('modules:session.clues_manager.hidden') : t('modules:session.clues_manager.revealed')}
                                    aria-pressed={editingClue.isRevealed ? "true" : "false"}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-black shadow-lg transition-all ${editingClue.isRevealed ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="pt-8 flex gap-4">
                                <button 
                                    onClick={handleSave}
                                    className="flex-1 flex items-center justify-center gap-3 bg-gm-gold text-black font-black py-4 rounded-2xl text-ui-10 tracking-widest uppercase shadow-glow-gold/10 hover:opacity-90 transition-all active:scale-95"
                                    title={isAdding ? t('modules:session.clues_manager.save_button_add') : t('modules:session.clues_manager.save_button_update')}
                                >
                                    <Save size={16} />
                                    {isAdding ? t('modules:session.clues_manager.save_button_add') : t('modules:session.clues_manager.save_button_update')}
                                </button>
                                
                                {editingClue.id && editingClue.isRevealed && (
                                    <button 
                                        onClick={() => handleProject(editingClue)}
                                        className={`flex-none flex items-center justify-center w-14 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10 active:scale-95 ${projectedEntity?.id === editingClue.id ? 'text-gm-gold border-gm-gold/40 shadow-glow-gold/20' : 'text-white/40'}`}
                                        title={t('modules:session.clues_manager.project_tooltip')}
                                    >
                                        <ExternalLink size={20} />
                                    </button>
                                )}
                            </div>
                    </div>

                    {/* Preview Side (Player View) */}
                    <div className="space-y-8 sticky top-0">
                        <div className="flex items-center gap-3 px-4">
                            <Sparkles className="text-gm-purple" size={16} />
                            <span className="text-ui-10 font-black uppercase tracking-[0.3em] text-gm-purple/60">{t('modules:session.clues_manager.preview_title')}</span>
                        </div>
                        
                        <div className={`min-h-[600px] flex-1 rounded-[3.5rem] glass-bento !bg-[#0c0c0e]/40 border border-white/10 shadow-glow-white/5 overflow-hidden relative group p-12 pb-32 flex flex-col items-center justify-center text-center gap-8 ${justRevealed === editingClue.id ? 'animate-clue-reveal ring-4 ring-gm-gold/50 shadow-glow-gold' : ''}`}>
                            <div className="absolute inset-0 z-0">
                                {editingClue.mediaUrl && (
                                    <>
                                        <ResolvedAsset src={resolvedMedia || ''} className="w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-[2s]" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-[#0c0c0e]/80" />
                                    </>
                                )}
                                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gm-gold/10 blur-[100px] rounded-full pointer-events-none" />
                                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gm-gold/5 blur-[100px] rounded-full pointer-events-none" />
                            </div>
                            
                            <div className="relative z-10 w-24 h-24 rounded-3xl bg-gm-gold/10 flex items-center justify-center border border-gm-gold/20 shadow-glow-gold/5 mb-4 group-hover:scale-110 transition-transform duration-1000">
                                {editingClue.mediaUrl ? (
                                    <ResolvedAsset src={resolvedMedia || ''} className="w-16 h-16 object-cover rounded-xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700" />
                                ) : (
                                    <Search className="text-gm-gold" size={40} strokeWidth={1.5} />
                                )}
                                <div className="absolute inset-0 bg-gm-gold/10 blur-xl opacity-20 animate-pulse" />
                            </div>
                            
                            <div className="relative z-10 space-y-4 max-w-sm">
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase tracking-[0.1em] leading-tight">
                                    {editingClue.title || t('modules:session.clues_manager.empty_selection')}
                                </h3>
                                <div className="h-0.5 w-12 bg-white/10 mx-auto rounded-full group-hover:w-20 group-hover:bg-gm-gold/40 transition-all duration-700" />
                                <p className="text-sm text-white/60 leading-relaxed italic font-serif opacity-80 max-h-40 overflow-hidden text-ellipsis">
                                    {editingClue.content || t('modules:session.clues_manager.preview_empty_content')}
                                </p>
                            </div>
                            
                            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-3">
                                <div className="flex gap-4">
                                    {(editingClue.locationId) && (
                                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                                            <MapPin size={10} className="text-gm-gold" />
                                            <span className="text-ui-8 font-black uppercase tracking-widest text-white/40">{t('modules:session.clues_manager.localized')}</span>
                                        </div>
                                    )}
                                    {(editingClue.ownerId) && (
                                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                                            <Users size={10} className="text-gm-gold" />
                                            <span className="text-ui-8 font-black uppercase tracking-widest text-white/40">{t('modules:session.clues_manager.npc_link')}</span>
                                        </div>
                                    )}
                                </div>
                                {!editingClue.isRevealed && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-ui-8 font-black uppercase tracking-[0.2em] shadow-glow-red/5">
                                        <EyeOff size={10} /> {t('modules:session.clues_manager.hidden_label')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {campaignClues.map(clue => (
                        <motion.div 
                            key={clue.id}
                            variants={itemVariants}
                            className="group relative flex flex-col glass-bento !rounded-[2.5rem] p-8 transition-all duration-500 hover:border-gm-gold/40 hover:shadow-glow-gold/5"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all overflow-hidden ${clue.isRevealed ? 'bg-gm-gold/10 text-gm-gold' : 'bg-white/5 text-white/20'}`}>
                                    {clue.mediaUrl ? (
                                        <ResolvedAsset src={clue.mediaUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                    ) : (
                                        <Search size={20} />
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEdit(clue)}
                                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                        title={t('modules:session.clues_manager.edit_tooltip')}
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(clue.id)}
                                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-white/5"
                                        title={t('modules:session.clues_manager.delete_tooltip')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 flex-1">
                                <h3 className="text-base font-black text-white group-hover:text-gm-gold transition-colors truncate">{clue.title}</h3>
                                <p className="text-xs text-white/40 leading-relaxed line-clamp-3 italic font-serif">{clue.content}</p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-3">
                                {clue.locationId && (
                                    <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2" title={`Lieu: ${campaignMaps.find(m => m.id === clue.locationId)?.name}`}>
                                        <MapPin size={10} className="text-white/20" />
                                        <span className="text-ui-9 font-bold text-white/40 truncate max-w-[80px]">
                                            {campaignMaps.find(m => m.id === clue.locationId)?.name}
                                        </span>
                                    </div>
                                )}
                                {clue.ownerId && (
                                    <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2" title={`PNJ: ${campaignEntities.find(e => e.id === clue.ownerId)?.name}`}>
                                        <Users size={10} className="text-white/20" />
                                        <span className="text-ui-9 font-bold text-white/40 truncate max-w-[80px]">
                                            {campaignEntities.find(e => e.id === clue.ownerId)?.name}
                                        </span>
                                    </div>
                                )}
                                <div className="ml-auto flex flex-col items-end gap-1">
                                    <div className={`px-3 py-1 rounded-lg flex items-center gap-2 text-ui-9 font-black uppercase tracking-widest ${clue.isRevealed ? 'bg-gm-gold/20 text-gm-gold' : 'bg-white/5 text-white/20'}`}>
                                        {clue.isRevealed ? <Eye size={12} /> : <EyeOff size={12} />}
                                        {clue.isRevealed ? t('modules:session.clues_manager.revealed') : t('modules:session.clues_manager.hidden')}
                                    </div>
                                    {clue.isRevealed && clue.revealedAt && (
                                        <p className="text-ui-8 font-bold text-white/20 uppercase tracking-tighter">
                                            {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(clue.revealedAt)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {clue.campaignMoment && (
                                <div className="mt-4 px-3 py-1 bg-gm-gold/10 rounded-lg inline-flex items-center gap-2 border border-gm-gold/5 self-start">
                                    <Sparkles size={8} className="text-gm-gold" />
                                    <span className="text-ui-8 font-black text-white/40 uppercase tracking-widest">{clue.campaignMoment}</span>
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {campaignClues.length === 0 && (
                        <div className="col-span-full py-24 border-2 border-dashed border-white/5 rounded-[3rem] text-center flex flex-col items-center gap-6">
                            <Search size={48} className="text-white/10" strokeWidth={1} />
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-white/20">{t('modules:session.clues_manager.empty_state_title')}</p>
                                <p className="text-ui-10 text-white/10 font-bold uppercase tracking-widest max-w-xs px-6 opacity-40">{t('modules:session.clues_manager.empty_state_desc')}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingClue({ title: '', content: '', isRevealed: false });
                                    setIsAdding(true);
                                }}
                                className="mt-4 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-ui-10 font-black uppercase tracking-widest text-white/40 hover:text-white transition-all shadow-lg shadow-black/40"
                            >
                                {t('modules:session.clues_manager.init_first')}
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            <MediaBrowser 
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    if (editingClue) {
                        setEditingClue({ ...editingClue, mediaUrl: id });
                    }
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title={t('modules:session.clues_manager.add_visual')}
            />
        </div>
    );
};

export default CluesManager;
