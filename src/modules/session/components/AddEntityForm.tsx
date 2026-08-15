import React, { useState, useEffect } from 'react';
import { Activity, Shield, Heart, Image as ImageIcon, Wind, Zap, Lock, BookOpen, Skull, Users, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import type { Entity } from '../useSessionOSStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmToast } from '../../../stores/useToastStore';
import { HealthInterpreter } from '../logic/HealthInterpreter';
const AddEntityForm: React.FC = () => {
    const { t, i18n } = useTranslation(['modules', 'common']);
    const { 
        addEntity, setIsAddingEntity, activeCampaignId, getActiveDriver,
        pendingPreFill, clearPendingPreFill 
    } = useSessionOSStore();

    /**
     * **Ce que le jeu compte réellement, et non ce que comptait D&D.**
     *
     * Ce formulaire demandait « PV Max » et « CA » à tout le monde, et
     * n'écrivait **aucun** `healthSystem` : un adversaire de Dune naissait avec
     * dix points de vie et une classe d'armure, alors que sa fiche de corpus dit
     * qu'« il n'existe aucune jauge numérique de santé sur la feuille de
     * personnage » et qu'aucun pilote ne déclare de classe d'armure.
     *
     * C'est le même défaut que celui corrigé le 2026-08-15 sur la création d'un
     * personnage joueur, laissé intact du côté des PNJ — *chercher par motif ne
     * trouve que ce qui ressemble au motif qu'on a en tête.*
     */
    const pilote = getActiveDriver();
    const modeleDeSante = pilote?.combat?.defaultHealthType ?? 'hp';
    const tacheDeDefaite = pilote?.combat?.tacheDeDefaite;

    const [name, setName] = useState('');
    const [type, setType] = useState<Entity['type']>('npc');
    const [role, setRole] = useState<Entity['role']>('neutral');
    const [description, setDescription] = useState('');
    const [maxHp, setMaxHp] = useState(10);
    /**
     * Le seuil de défaite d'un adversaire, quand le jeu en a un.
     *
     * Chez Dune il **vaut sa compétence défensive**, de quatre à huit. Un PNJ n'a
     * pas de fiche remplie : c'est donc au meneur de le poser, plutôt qu'à
     * `createDefault('clocks')` d'inventer six pour tout le monde.
     */
    const [seuilDeDefaite, setSeuilDeDefaite] = useState(tacheDeDefaite?.seuil.min ?? 4);
    const [ac, setAc] = useState(10);
    const [speed, setSpeed] = useState(30);
    const [initiative, setInitiative] = useState(0);
    const [avatarMediaId, setAvatarMediaId] = useState('');
    const [roleplayingNotes, setRoleplayingNotes] = useState('');
    const [gmSecretInfo, setGmSecretInfo] = useState('');
    
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const avatarUrl = useMediaUrl(avatarMediaId);

    // Wiki Bridge Receiver
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (pendingPreFill && pendingPreFill.type === 'npc') {
            setName(pendingPreFill.data.title);
            // On met le contenu dans les notes d'interprétation par défaut
            setRoleplayingNotes(pendingPreFill.data.content);
            if (pendingPreFill.data.imageUrl) {
                setAvatarMediaId(pendingPreFill.data.imageUrl);
            }
            // Nettoyage immédiat pour éviter les ré-injections accidentelles
            clearPendingPreFill();
            gmToast(t('modules:session.toasts.wiki_data_received'), 'success');
        }
    }, [pendingPreFill, clearPendingPreFill]);
    /* eslint-enable react-hooks/set-state-in-effect */

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !activeCampaignId) return;

        /*
          **Tout adversaire naît avec un mécanisme de santé**, comme les
          personnages joueurs depuis le 2026-08-15. C'est `healthSystem` qui est
          toujours là ; les points de vie n'en sont qu'une forme sur cinq.

          Le seuil de la tâche de défaite vient du meneur et non de
          `createDefault('clocks')`, dont les six segments ne sont le chiffre
          d'aucun jeu.
        */
        const sante = tacheDeDefaite
            ? { type: 'clocks' as const, data: { filled: 0, segments: seuilDeDefaite }, state: 'healthy' as const, badges: [] }
            : HealthInterpreter.createDefault(modeleDeSante);

        addEntity({
            name,
            type,
            role,
            status: 'alive',
            avatar: avatarMediaId || 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + name,
            healthSystem: sante,
            /*
              `Entity` exige `hp` et `maxHp` — contrairement à `PlayerCharacter`,
              où ils sont devenus facultatifs. Les rendre optionnels ici touche
              l'arithmétique du store, le générateur de rencontres et l'export
              Obsidian : c'est un chantier à part, non ouvert aujourd'hui.

              Ils restent donc écrits, mais **inertes** : `aUneJaugeDeVie`
              consulte `healthSystem` en premier depuis le 2026-08-15, et aucun
              écran ne les montrera pour un jeu qui ne compte pas de points.
            */
            hp: maxHp,
            maxHp,
            ac,
            speed,
            initiative,
            description,
            roleplayingNotes,
            gmSecretInfo,
            linkedMapIds: [],
            campaignId: activeCampaignId,
            templateId: pilote?.templateId || 'generic',
        });

        gmToast(t('modules:session.toasts.entity_created', { name }));
        setIsAddingEntity(false);
    };

    return (
        <div className="flex-1 h-full bg-app-bg/40 p-10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header / Back Button */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => setIsAddingEntity(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border text-app-text/40 hover:text-accent hover:border-accent/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    {t('common:actions.cancel')}
                </button>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">{t('modules:session.forms.add_entity_title')}</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-12 flex-1 overflow-hidden">
                {/* Left Col: Media Selection */}
                <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col gap-6">
                    <button 
                        type="button"
                        className="aspect-[4/5] w-full rounded-3xl overflow-hidden border-2 border-accent/10 shadow-2xl relative group bg-app-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
                        onClick={() => setIsMediaBrowserOpen(true)}
                        title={t('modules:session.forms.labels.avatar_select')}
                        aria-label={t('modules:session.forms.labels.avatar_select')}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Portrait" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-app-text/10 group-hover:text-accent transition-colors">
                                <ImageIcon size={64} className="mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">{t('modules:session.forms.labels.avatar_select')}</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon size={32} className="text-white" />
                        </div>
                    </button>

                    {/* Type & Role Selector */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-app-text/40 pl-1 flex items-center gap-2">
                                <Users size={12} /> {t('modules:session.forms.labels.type')}
                            </p>
                            <div className="flex gap-2">
                                {(['pc', 'npc', 'monster'] as const).map(typeVal => (
                                    <button
                                        key={typeVal}
                                        type="button"
                                        onClick={() => setType(typeVal)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                            type === typeVal ? 'bg-accent text-white border-accent' : 'bg-app-surface border-app-border text-app-text/40 hover:border-app-border/60'
                                        }`}
                                    >
                                        {t(`modules:session.forms.types.${typeVal}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-app-text/40 pl-1 flex items-center gap-2">
                                <Skull size={12} /> {t('modules:session.forms.labels.alignment')}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {(['ally', 'neutral', 'hostile', 'boss'] as const).map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                            role === r ? 'bg-white text-app-bg border-white' : 'bg-app-surface border-app-border text-app-text/40 hover:border-app-border/60'
                                        }`}
                                    >
                                        {t(`modules:session.npc_detail.affinity.${r}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Fields */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="entity-name" className="text-[10px] font-black uppercase tracking-widest text-accent pl-1">{t('modules:session.forms.labels.name')}</label>
                        <input
                            id="entity-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('modules:session.forms.placeholders.name')}
                            className="w-full bg-app-surface/50 border border-app-border rounded-2xl px-6 py-4 text-xl font-bold text-white focus:ring-1 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all placeholder:text-app-text/10"
                            required
                            title={t('modules:session.forms.labels.name')}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="entity-description" className="text-[10px] font-black uppercase tracking-widest text-app-text/40 pl-1 italic">{t('modules:session.forms.labels.description')}</label>
                        <input
                            id="entity-description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('modules:session.forms.placeholders.description')}
                            className="w-full bg-app-surface/30 border border-app-border rounded-xl px-4 py-2 text-sm text-app-text/60 focus:ring-1 focus:ring-accent/50 focus:outline-none placeholder:text-app-text/10"
                            title={t('modules:session.forms.labels.description')}
                        />
                    </div>

                    {/*
                        **La grille demande ce que le jeu compte.**

                        Elle proposait « PV Max » et « CA » à tous les systèmes,
                        c'est-à-dire le vocabulaire d'un seul. Un adversaire de
                        Dune n'a ni l'un ni l'autre : il a un **seuil de
                        défaite**, qui vaut sa compétence défensive.

                        La classe d'armure ne se propose que là où le jeu compte
                        des points de vie — une classe d'armure est un seuil
                        *contre des attaques qui retirent des points*. **Aucun
                        pilote ne la déclare** ; le jour où l'un d'eux dira quel
                        champ de fiche porte la protection, cette heuristique
                        laissera la place à sa déclaration.
                    */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            ...(tacheDeDefaite
                                ? [{
                                    id: 'entity-seuil',
                                    label: tacheDeDefaite.label || 'Seuil de défaite',
                                    val: seuilDeDefaite,
                                    set: setSeuilDeDefaite,
                                    icon: <Activity size={14} className="text-rose-400" />,
                                }]
                                : modeleDeSante === 'hp'
                                    ? [{ id: 'entity-hp', label: 'PV Max', val: maxHp, set: setMaxHp, icon: <Heart size={14} className="text-red-400" /> }]
                                    : []),
                            ...(modeleDeSante === 'hp' && !tacheDeDefaite
                                ? [{ id: 'entity-ac', label: 'CA', val: ac, set: setAc, icon: <Shield size={14} className="text-blue-400" /> }]
                                : []),
                            { id: 'entity-speed', label: 'Vitesse', val: speed, set: setSpeed, icon: <Wind size={14} className="text-emerald-400" /> },
                            { id: 'entity-initiative', label: 'Init.', val: initiative, set: setInitiative, icon: <Zap size={14} className="text-amber-400" /> },
                        ].map((stat, i) => {
                            /*
                              L'intitulé passe par les traductions **quand la clé
                              existe**. « Seuil de défaite » vient du pilote, qui
                              le nomme lui-même — l'envoyer au dictionnaire
                              aurait affiché la clé brute à l'écran.
                            */
                            const cle = `modules:session.forms.labels.${stat.id.split('-')[1]}`;
                            const intitule = i18n.exists(cle) ? t(cle) : stat.label;
                            return (
                            <div key={i} className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-accent/20 transition-all">
                                {stat.icon}
                                <input
                                    id={stat.id}
                                    type="number"
                                    value={stat.val}
                                    onChange={(e) => stat.set(parseInt(e.target.value) || 0)}
                                    className="w-full bg-transparent border-none text-center text-white font-black text-sm focus:ring-0"
                                    title={intitule}
                                />
                                <label htmlFor={stat.id} className="text-[9px] uppercase font-bold text-app-text/20 tracking-wider">{intitule}</label>
                            </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Roleplaying Notes */}
                        <div className="p-4 rounded-2xl bg-app-surface/30 border border-white/5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen size={14} className="text-app-text/40 pointer-events-none" />
                                <label htmlFor="entity-roleplaying-notes" className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{t('modules:session.forms.labels.notes')}</label>
                            </div>
                            <textarea
                                id="entity-roleplaying-notes"
                                className="w-full bg-transparent border-none text-app-text/60 text-xs leading-relaxed resize-none focus:ring-0 placeholder:text-app-text/10 min-h-[80px]"
                                value={roleplayingNotes}
                                onChange={(e) => setRoleplayingNotes(e.target.value)}
                                placeholder={t('modules:session.forms.placeholders.notes')}
                            />
                        </div>

                        {/* Secret GM Notes */}
                        <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex flex-col gap-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                                <Lock size={48} className="text-accent" />
                            </div>
                            <div className="flex items-center gap-2 mb-1 relative z-10">
                                <Lock size={14} className="text-accent pointer-events-none" />
                                <label htmlFor="entity-secret-info" className="text-[10px] font-black uppercase tracking-widest text-accent">{t('modules:session.forms.labels.secrets')}</label>
                            </div>
                            <textarea
                                id="entity-secret-info"
                                className="w-full bg-transparent border-none text-app-text/60 text-xs leading-relaxed resize-none focus:ring-0 placeholder:text-app-text/10 min-h-[80px] relative z-10"
                                value={gmSecretInfo}
                                onChange={(e) => setGmSecretInfo(e.target.value)}
                                placeholder={t('modules:session.forms.placeholders.secrets')}
                            />
                        </div>
                    </div>
                </div>
            </form>

            {/* Sticky Actions */}
            <div className="mt-8 pt-6 border-t border-app-border flex justify-end gap-4">
                 <button
                    onClick={() => setIsAddingEntity(false)}
                    className="px-8 py-3 rounded-xl bg-app-surface hover:bg-app-surface/80 text-app-text/60 font-bold text-xs transition-all border border-white/5"
                >
                    {t('common:actions.cancel')}
                </button>
                <button
                    onClick={handleSubmit}
                    className="px-12 py-3 rounded-xl bg-accent hover:bg-accent/80 text-white font-black text-xs transition-all shadow-glow-accent"
                >
                    {t('modules:session.forms.create')}
                </button>
            </div>

            <MediaBrowser
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    setAvatarMediaId(id);
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title={t('modules:session.forms.labels.template')}
            />
        </div>
    );
};

export default AddEntityForm;
