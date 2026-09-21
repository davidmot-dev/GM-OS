import React, { useState } from 'react';
import { X, Trash2, Folder, Tag, Users, Check, Image as ImageIcon, Music, Film, FileText, Lock, Unlock, ShieldCheck, Unplug, Link2, Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MediaItem, MediaCollection } from '../../../stores/useMediaStore';
import type { Campaign } from '../../session/useSessionOSStore';
import { MediaItemThumbnail } from './MediaItemThumbnail';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { usagesDesMedias } from '../../../services/proprietairesDesMedias';
import { useMediaStore } from '../../../stores/useMediaStore';
import {
    formeCanonique, memeTag, suggestionsDeTag, tagsProches, tagsParUsage,
} from '../../../components/media/vocabulaireDesTags';
import { tagsProposes } from '../../../components/media/tagsProposes';
import { laVideoBoucle } from '../../../components/media/boucleDeLaVideo';

interface TacticalDetailPanelProps {
    media: MediaItem;
    onClose: () => void;
    collections: MediaCollection[];
    toggleMediaInCollection: (cid: string, mid: string) => void;
    updateMediaTags: (mid: string, tags: string[]) => void;
    updateMediaCampaigns: (mid: string, campaignIds: string[]) => void;
    toggleMediaPersistence: (id: string) => void;
    deleteMedia: (mid: string) => void;
    campaigns: Campaign[];
    onSelect: (mid: string) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    'image': <ImageIcon size={14} className="text-blue-400" />,
    'audio': <Music size={14} className="text-amber-400" />,
    'video': <Film size={14} className="text-purple-400" />,
    'document': <FileText size={14} className="text-emerald-400" />,
};

export const TacticalDetailPanel: React.FC<TacticalDetailPanelProps> = ({ 
    media, 
    onClose, 
    collections, 
    toggleMediaInCollection, 
    updateMediaTags, 
    updateMediaCampaigns, 
    toggleMediaPersistence,
    deleteMedia, 
    campaigns, 
    onSelect 
}) => {
    const { t, i18n } = useTranslation(['modules', 'common']);
    const [newTag, setNewTag] = useState('');

    /*
      ⭐ **Le vocabulaire de toute la bibliothèque, classé par usage.** Il est
      lu ici et non reçu en prop : ce panneau s'ouvre depuis deux écrans, et
      *une donnée qui doit traverser deux chemins finit par n'en traverser
      qu'un.*
    */
    const mediaList = useMediaStore(s => s.mediaList);
    const basculerLaBoucle = useMediaStore(s => s.basculerLaBoucle);
    const tagsConnus = tagsParUsage(mediaList).map(e => e.tag);

    const saisie = formeCanonique(newTag);
    const suggestions = saisie ? suggestionsDeTag(saisie, tagsConnus, 6) : [];
    /* ⛔ *Le seul moment où corriger un quasi-doublon ne coûte rien, c'est
       avant de valider.* Après, il faut un second geste, et personne ne le fait. */
    const proches = saisie ? tagsProches(saisie, tagsConnus) : [];

    /* Ce que le nom du fichier et le rangement laissent deviner. */
    const propositions = tagsProposes({
        nom: media.name,
        collection: collections.find(c => c.mediaIds.includes(media.id))?.name ?? null,
        connus: tagsConnus,
        deja: media.tags,
    }, 5);

    const poserUnTag = async (brut: string) => {
        const tag = formeCanonique(brut);
        if (!tag || media.tags.some(t => memeTag(t, tag))) { setNewTag(''); return; }
        await updateMediaTags(media.id, [...media.tags, tag]);
        setNewTag('');
    };

    /*
      **Il se rendait par-dessus la médiathèque sans jamais écouter Échap.**
      La garde de la médiathèque le nommait pour se taire quand il était
      ouvert — elle se taisait donc, et **personne ne fermait rien**. Il ferme
      maintenant pour son compte, et la médiathèque derrière lui reste ouverte.
    */
    useFermetureParEchap(true, onClose, 'Fiche du média');

    /*
      **Qui se sert de ce fichier.**

      L'application savait répondre « personne » — c'est ce que le nettoyage
      calcule pour décider d'effacer — et ne le disait nulle part. La même
      donnée, lue dans l'autre sens, et le meneur peut enfin voir venir une
      suppression au lieu de la constater.

      Calculé une fois par ouverture : le panneau se ferme pour en ouvrir un
      autre — un voile cliquable le referme —, donc il n'existe pas de moment
      où la réponse vieillirait sous les yeux du meneur.
    */
    const recensement = React.useMemo(() => usagesDesMedias(), []);
    const usages = recensement.usages.get(media.id) ?? [];

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div 
            className="fixed inset-y-0 right-0 w-[500px] bg-app-surface/95 backdrop-blur-3xl border-l border-app-border/20 z-[120] flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-500"
            onClick={e => e.stopPropagation()}
        >
            {/* Header HUD */}
            <div className="p-8 border-b border-app-border/10 flex items-center justify-between bg-accent/5">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]">
                        {TYPE_ICONS[media.type] || <FileText size={20} />}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-lg font-black uppercase tracking-widest text-app-text truncate max-w-[280px] font-display" title={media.name}>{media.name}</h3>
                        <div className="flex items-center gap-2">
                             <span className="text-ui-10 font-bold text-accent/60 uppercase tracking-[0.3em] font-display">{t('image.detail.neuralInterface')}</span>
                             {media.isPersistent && (
                                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 rounded-full border border-accent/20">
                                     <ShieldCheck size={8} className="text-accent" />
                                     <span className="text-ui-8 font-black text-accent uppercase tracking-widest">{t('image.detail.persistent')}</span>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center bg-app-text/5 hover:bg-app-text/10 text-app-text/20 hover:text-app-text rounded-2xl transition-all border border-app-border/10 hover:border-app-border/20"
                    title={t('image.detail.actions.closePanel')}
                    aria-label={t('image.detail.actions.closePanel')}
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                {/* Large Preview */}
                <div className="relative group aspect-video rounded-3xl overflow-hidden bg-black/40 border border-app-border/10 shadow-2xl">
                    <MediaItemThumbnail media={media} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6 flex items-center gap-4">
                        <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-ui-10 font-black text-accent uppercase tracking-widest">
                            {media.type}
                        </span>
                        <span className="text-ui-10 font-bold text-app-text/40 uppercase tracking-widest">
                            {formatSize(media.size)}
                        </span>
                    </div>

                    {/* Persistence Toggle Overlay */}
                    <button 
                        onClick={() => toggleMediaPersistence(media.id)}
                        className={`absolute top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 backdrop-blur-md border ${media.isPersistent ? 'bg-accent/20 border-accent/40 text-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]' : 'bg-black/40 border-app-border/10 text-app-text/20 hover:text-app-text/60 hover:bg-black/60'}`}
                        title={media.isPersistent ? t('image.detail.actions.disablePersistence') : t('image.detail.actions.enablePersistence')}
                    >
                        {media.isPersistent ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onSelect(media.id)}
                        className="flex items-center justify-center gap-3 py-4 bg-accent text-app-bg rounded-2xl font-black text-ui-11 uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]"
                    >
                        <Check size={16} strokeWidth={3} />
                        {t('image.detail.actions.select')}
                    </button>
                    <button 
                        onClick={() => {
                            if (confirm(t('image.detail.deleteConfirm', { name: media.name }))) {
                                deleteMedia(media.id);
                                onClose();
                            }
                        }}
                        className="flex items-center justify-center gap-3 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-ui-11 uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                        <Trash2 size={16} />
                        {t('image.detail.actions.delete')}
                    </button>
                </div>

                {/* Classification Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Folder size={14} className="text-accent/40" />
                        <h4 className="text-ui-10 font-black uppercase tracking-[0.4em] text-app-text/30 font-display">{t('image.detail.classification')}</h4>
                    </div>
                    <div className="space-y-2">
                        {collections.map(coll => (
                            <button
                                key={coll.id}
                                onClick={() => toggleMediaInCollection(coll.id, media.id)}
                                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-ui-11 font-bold uppercase tracking-widest transition-all duration-300 ${coll.mediaIds.includes(media.id) ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]' : 'bg-app-text/5 text-app-text/30 border border-transparent hover:bg-app-text/10'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <Folder size={16} className={coll.mediaIds.includes(media.id) ? 'text-accent' : 'opacity-30'} />
                                    {coll.name}
                                </div>
                                {coll.mediaIds.includes(media.id) && <Check size={16} />}
                            </button>
                        ))}
                        {collections.length === 0 && (
                            <div className="py-6 text-center border-2 border-dashed border-app-border/10 rounded-3xl">
                                <p className="text-ui-10 italic text-app-text/5 uppercase tracking-widest font-bold">{t('image.detail.noFolders')}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/*
                  ⭐ **La boucle d'une vidéo — demandée le 2026-09-21.** Elle reste
                  le défaut : c'est l'usage courant, une ambiance. Sans elle, le
                  film **garde sa dernière image** plutôt que de disparaître —
                  *rien ne quitte l'écran sans que le meneur l'ait demandé.*
                */}
                {media.type === 'video' && (
                    <section>
                        <button
                            onClick={() => void basculerLaBoucle(media.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl border transition-all ${
                                laVideoBoucle(media)
                                    ? 'bg-accent/5 border-accent/30 text-accent'
                                    : 'bg-app-surface/40 border-app-border/10 text-app-text/40'
                            }`}
                        >
                            <Repeat size={16} className="shrink-0" />
                            <span className="flex-1 text-left text-ui-10 font-black uppercase tracking-[0.2em]">
                                {laVideoBoucle(media)
                                    ? t('image.detail.boucle.oui')
                                    : t('image.detail.boucle.non')}
                            </span>
                            {laVideoBoucle(media) && <Check size={16} className="shrink-0" />}
                        </button>
                        <p className="mt-3 px-2 text-ui-9 font-bold uppercase tracking-widest text-app-text/20 leading-relaxed">
                            {t('image.detail.boucle.aide')}
                        </p>
                    </section>
                )}

                {/* Tags Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Tag size={14} className="text-accent/40" />
                        <h4 className="text-ui-10 font-black uppercase tracking-[0.4em] text-app-text/30 font-display">{t('image.detail.matrixTags')}</h4>
                    </div>
                    <div className="bg-app-surface/40 border border-app-border/10 rounded-[2rem] p-6 space-y-6">
                         <div className="flex flex-wrap gap-2">
                            {media.tags.map(tagItem => (
                                <span key={tagItem} className="inline-flex items-center gap-2 bg-accent/5 text-accent border border-accent/20 px-3 py-1.5 rounded-xl text-ui-10 font-black tracking-widest uppercase">
                                    #{tagItem}
                                    <button 
                                        onClick={() => updateMediaTags(media.id, media.tags.filter(tag => tag !== tagItem))}
                                        className="hover:text-red-400 opacity-40 hover:opacity-100 transition-all"
                                        title={t('image.detail.actions.removeTag', { tag: tagItem })}
                                        aria-label={t('image.detail.actions.removeTag', { tag: tagItem })}
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            {media.tags.length === 0 && <span className="text-ui-9 font-bold text-app-text/10 uppercase italic tracking-widest">{t('image.detail.noTags')}</span>}
                        </div>
                        <input
                            type="text"
                            placeholder={t('image.detail.placeholders.newTag')}
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            className="w-full bg-app-bg/60 border border-app-border/10 rounded-2xl px-6 py-4 text-xs font-bold text-accent outline-none placeholder:text-app-text/10 uppercase tracking-[0.2em] focus:border-accent/30 transition-all font-display"
                            onKeyDown={async e => {
                                if (e.key === 'Escape') { e.stopPropagation(); setNewTag(''); return; }
                                if (e.key === 'Enter') await poserUnTag(newTag);
                            }}
                        />

                        {/*
                          ⛔ **L'avertissement arrive AVANT la validation.** C'est le
                          seul moment où corriger un quasi-doublon ne coûte rien :
                          après, il faut un second geste, et personne ne le fait.
                        */}
                        {proches.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-ui-9 font-bold uppercase tracking-widest text-amber-400/80">
                                    {t('image.detail.tags.proche')}
                                </span>
                                {proches.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => void poserUnTag(tag)}
                                        className="px-3 py-1.5 rounded-xl border border-amber-400/40 text-amber-400 text-ui-10 font-black uppercase tracking-widest hover:bg-amber-400/10"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Ce que le vocabulaire existant offre pendant la frappe. */}
                        {suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => void poserUnTag(tag)}
                                        className="px-3 py-1.5 rounded-xl border border-app-border/20 text-app-text/50 text-ui-10 font-black uppercase tracking-widest hover:border-accent/40 hover:text-accent"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/*
                          ⭐ **Ce que le nom du fichier disait déjà.** `taverne-nuit.jpg`
                          porte deux étiquettes que personne ne retapait : *le travail
                          était fait, il n'était simplement pas lu.*
                          ⛔ On propose, on ne pose jamais.
                        */}
                        {saisie === '' && propositions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-ui-9 font-bold uppercase tracking-widest text-app-text/30">
                                    {t('image.detail.tags.proposees')}
                                </span>
                                {propositions.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => void poserUnTag(tag)}
                                        className="px-3 py-1.5 rounded-xl border border-dashed border-accent/30 text-accent/70 text-ui-10 font-black uppercase tracking-widest hover:bg-accent/10 hover:text-accent"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Usage Section */}
                <section className="bg-app-surface/20 rounded-3xl p-6 space-y-3">
                    <h4 className="text-ui-10 font-black uppercase tracking-[0.4em] text-app-text/30 font-display">
                        {t('image.detail.usage.title')}
                    </h4>

                    {usages.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                            {usages.map((usage, i) => (
                                <li key={`${usage.module}-${i}`} className="flex items-start gap-3">
                                    <Link2 size={12} className="text-accent/50 mt-0.5 flex-shrink-0" />
                                    <span className="text-ui-11 leading-tight">
                                        <span className="font-black uppercase tracking-widest text-app-text/40 text-ui-9">
                                            {usage.module}
                                        </span>
                                        <span className="block text-app-text/60">{usage.sujet}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        /*
                          **Neutre, et non alarmant** — tranché avec David le
                          2026-09-04. Sur une bibliothèque où la réserve est
                          légitimement inutilisée, un rouge sur la moitié des
                          fichiers ne voudrait plus rien dire. On constate ; la
                          conséquence n'arrive qu'au moment du nettoyage, où
                          elle est annoncée.
                        */
                        <p className="flex items-start gap-3 text-ui-11 text-app-text/35 leading-tight">
                            <Unplug size={12} className="mt-0.5 flex-shrink-0 opacity-60" />
                            {media.isPersistent
                                ? t('image.detail.usage.noneProtected')
                                : t('image.detail.usage.none')}
                        </p>
                    )}

                    {!recensement.complet && (
                        <p className="text-ui-10 text-amber-400/70 italic leading-tight">
                            {t('image.detail.usage.unknown', {
                                modules: recensement.modulesEnEchec.join(', '),
                            })}
                        </p>
                    )}
                </section>

                {/* Metadata Section */}
                <section className="bg-app-surface/20 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between text-ui-10 font-bold uppercase tracking-widest">
                        <span className="text-app-text/20">{t('image.detail.identifier')}</span>
                        <span className="text-app-text/60 font-mono text-ui-9">{media.id.split('-')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between text-ui-10 font-bold uppercase tracking-widest">
                        <span className="text-app-text/20">{t('image.detail.importDate')}</span>
                        <span className="text-app-text/60">{new Date(media.createdAt).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                    </div>
                    <div className="pt-4 border-t border-app-border/10">
                        <span className="text-ui-9 font-black text-app-text/20 uppercase tracking-[0.3em] block mb-3 font-display">{t('image.detail.operationalAttribution')}</span>
                        <div className="flex flex-wrap gap-2">
                             {campaigns.map(campaign => {
                                 const isLinked = media.campaignIds.includes(campaign.id);
                                 return (
                                     <button 
                                         key={campaign.id} 
                                         onClick={() => {
                                             const newCampaignIds = isLinked 
                                                 ? media.campaignIds.filter(id => id !== campaign.id)
                                                 : [...media.campaignIds, campaign.id];
                                             updateMediaCampaigns(media.id, newCampaignIds);
                                         }}
                                         className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-ui-9 font-black uppercase tracking-widest transition-all duration-300 border ${isLinked ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-app-surface/5 text-app-text/20 border-transparent hover:border-app-border/10 hover:text-app-text/40'}`}
                                         title={isLinked ? t('image.detail.actions.unlinkCampaign', { name: campaign.name }) : t('image.detail.actions.linkCampaign', { name: campaign.name })}
                                         aria-label={isLinked ? t('image.detail.actions.unlinkCampaign', { name: campaign.name }) : t('image.detail.actions.linkCampaign', { name: campaign.name })}
                                     >
                                         <Users size={10} className={isLinked ? 'opacity-100' : 'opacity-30'} />
                                         {campaign.name}
                                     </button>
                                 );
                             })}
                             {campaigns.length === 0 && (
                                 <span className="text-ui-8 font-bold text-app-text/5 uppercase italic tracking-widest">{t('image.detail.noCampaigns')}</span>
                             )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
