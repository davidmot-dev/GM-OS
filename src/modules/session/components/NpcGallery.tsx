import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import type { Entity } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { abregerLaSante, decrireLaSante, fractionDeVie } from '../../combat/logic/SanteDuCombattant';
import { gmToast } from '../../../stores/useToastStore';
import { useImageStore } from '../../image/useImageStore';
import { 
    Activity,
    Search, 
    Swords, 
    FileText, 
    Eye, 
    Pin, 
    Sparkles, 
    Image as ImageIcon, 
    Plus,
    Users,
    Trash2
} from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import AIPromptOverlay from '../../ai/components/AIPromptOverlay';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { gmConfirm } from '../../../stores/useModalStore';
import { motion } from 'framer-motion';
import { useRegimeDInterface } from '../hooks/useRegimeDInterface';
import HorsDePortee from './HorsDePortee';

/**
 * Le gabarit **minimal** de la case vide — et il n'existe que pour elle.
 *
 * Une carte de PNJ ne déclare aucune hauteur, ni en entier ni par moitié : le
 * portrait est fixe, le contenu prend ce qu'il lui faut, et la grille aligne le
 * tout. La case « initialiser une entité » n'a pas de contenu à mesurer et doit
 * pourtant tenir son rang ; seule elle a besoin d'un nombre écrit quelque part.
 *
 * `min-h` et non `h` : seule dans sa rangée, elle garde cette taille ; entourée
 * de cartes plus hautes, la grille l'étire au lieu de la rogner.
 */
const HAUTEUR_DE_CARTE = 'min-h-[26rem]';

const ROLE_COLORS = {
    ally: 'bg-etat-succes/20 text-etat-succes dark:text-etat-succes border-etat-succes/30',
    neutral: 'bg-app-muted/20 text-app-subtle dark:text-app-text border-app-border/30',
    hostile: 'bg-etat-danger/20 text-etat-danger dark:text-etat-danger border-etat-danger/30',
    boss: 'bg-gm-violet/20 text-gm-violet dark:text-gm-violet border-gm-violet/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
};

type Filtre = 'all' | 'npc' | 'monster' | 'ally' | 'hostile';

const NpcGallery: React.FC = () => {
    const regime = useRegimeDInterface();
    const { t } = useTranslation();
    const { 
        entities, 
        activeCampaignId, 
        selectedEntityId, 
        setSelectedEntity, 
        sessions, 
        addEntityToSession, 
        removeEntityFromSession,
        generateEntityPortrait,
        updateEntity,
        isGeneratingAIImage,
        setIsAddingEntity,
        deleteEntity
    } = useSessionOSStore();

    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const [showMediaBrowser, setShowMediaBrowser] = useState(false);
    const [editingNpcId, setEditingNpcId] = useState<string | null>(null);

    const editingNpc = entities.find(e => e.id === editingNpcId);

    // Get active session
    const session = sessions.find(s => s.campaignId === activeCampaignId && s.status === 'active');
    const pinnedIds = session?.sessionEntityIds || [];
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filtre>('all');

    /*
      **Les filtres en onglets, chacun avec son nombre** — refonte, L5, étape 2.
      Le compte suit la recherche : l'onglet dit ce qu'on trouvera en le
      touchant, pas ce que la campagne contient en tout.
    */
    const FILTRES: { id: Filtre; cle: string; garde: (e: Entity) => boolean }[] = [
        { id: 'all', cle: 'filter_all', garde: () => true },
        { id: 'npc', cle: 'filter_npc', garde: e => e.type === 'npc' },
        { id: 'monster', cle: 'filter_monsters', garde: e => e.type === 'monster' },
        { id: 'ally', cle: 'filter_allies', garde: e => e.role === 'ally' },
        { id: 'hostile', cle: 'filter_hostiles', garde: e => e.role === 'hostile' || e.role === 'boss' },
    ];

    const recherche = search.toLowerCase();
    const trouvees = entities.filter(e =>
        e.campaignId === activeCampaignId
        && (e.name.toLowerCase().includes(recherche) || e.description.toLowerCase().includes(recherche)),
    );
    const filtreActif = FILTRES.find(f => f.id === filter) ?? FILTRES[0];
    const filteredEntities = trouvees.filter(filtreActif.garde);

    return (
        <div className="flex w-full h-full flex-col bg-app-bg overflow-hidden transition-colors duration-500">
            {/* La barre : créer, chercher, filtrer */}
            <div className="shrink-0 flex flex-col gap-3 border-b border-app-border px-6 pt-5 pb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddingEntity(true)}
                        className="flex shrink-0 items-center gap-2 rounded-xl bg-accent px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-app-on-accent shadow-glow-accent transition-all active:scale-95 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        {t('modules:session.npc_gallery.new_npc')}
                    </button>
                    <div className="relative flex-1 group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle transition-colors group-focus-within:text-accent" />
                        <input
                            type="text"
                            placeholder={t('modules:session.npc_gallery.search_placeholder')}
                            className="w-full rounded-xl border border-app-border bg-app-surface py-3 pl-10 pr-4 text-sm text-app-text focus:outline-none focus:border-accent transition-all placeholder:text-app-subtle"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div role="tablist" className="flex flex-wrap gap-1">
                    {FILTRES.map(f => {
                        const actif = f.id === filter;
                        return (
                            <button
                                key={f.id}
                                role="tab"
                                aria-selected={actif}
                                onClick={() => setFilter(f.id)}
                                className={`rounded-lg px-4 py-2 text-ui-11 font-black uppercase tracking-widest transition-all ${
                                    actif
                                        ? 'bg-accent text-app-on-accent'
                                        : 'text-app-muted hover:bg-app-surface hover:text-app-text'
                                }`}
                            >
                                {t(`modules:session.npc_gallery.${f.cle}`)} ({trouvees.filter(f.garde).length})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content - Grid */}
            <main className="flex-1 overflow-y-auto p-6 relative custom-scrollbar transition-colors">
                {/* Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, staggerChildren: 0.05 }}
                    /* La grille plafonnait à trois colonnes quelle que soit la
                       largeur : sur un écran large, vingt-huit fiches
                       défilaient sur trois rangs étroits pendant qu'un tiers de
                       la place restait vide. L'écart entre cartes se resserre
                       aussi — huit unités séparaient plus qu'elles n'aéraient.

                       **Plafond ramené à quatre le 2026-08-30, demandé par
                       David.** La cinquième colonne au-delà de 1900 px ramenait
                       chaque carte sous 250 px, et un nom un peu long y passait
                       systématiquement sur deux lignes — ce qui était la moitié
                       du défaut des boutons rognés. Remplir l'écran reste le
                       but ; le remplir de cartes illisibles ne l'était pas.

                       La colonne des filtres partie (refonte, L5), la grille
                       gagne ses 20 rem : trois colonnes dès `lg`. */
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5"
                >
                    {filteredEntities.map((npc) => (
                        <NpcGalleryItem
                            key={npc.id}
                            npc={npc}
                            isSelected={selectedEntityId === npc.id}
                            isPinned={pinnedIds.includes(npc.id)}
                            onSelect={() => setSelectedEntity(npc.id)}
                            onTogglePin={() => {
                                if (!session) return;
                                const isCurrentlyPinned = pinnedIds.includes(npc.id);
                                if (isCurrentlyPinned) {
                                    removeEntityFromSession(session.id, npc.id);
                                } else {
                                    addEntityToSession(session.id, npc.id);
                                }
                                const msg = isCurrentlyPinned
                                    ? t('modules:session.toasts.entity_removed', { name: npc.name })
                                    : t('modules:session.toasts.entity_pinned', { name: npc.name });
                                gmToast(msg);
                            }}
                            onGenerateImage={() => {
                                setEditingNpcId(npc.id);
                                setShowAIPrompt(true);
                            }}
                            onPickImage={() => {
                                setEditingNpcId(npc.id);
                                setShowMediaBrowser(true);
                            }}
                            onDelete={() => {
                                gmConfirm(
                                    t('modules:session.npc_gallery.delete_confirm', { name: npc.name }),
                                    () => {
                                        deleteEntity(npc.id);
                                        gmToast(t('modules:session.toasts.entity_deleted', { name: npc.name }));
                                    }
                                );
                            }}
                            regime={regime}
                            t={t}
                        />
                    ))}

                    {/* Empty State / Add Card */}
                    <button
                        onClick={() => setIsAddingEntity(true)}
                        className={`${HAUTEUR_DE_CARTE} rounded-xl border-2 border-dashed border-app-border flex flex-col items-center justify-center gap-6 hover:border-accent/50 hover:bg-accent/5 transition-all group`}
                    >
                        <div className="w-16 h-16 rounded-full border border-app-border flex items-center justify-center group-hover:border-accent group-hover:bg-accent/10 transition-all">
                            <Plus size={32} className="text-app-subtle group-hover:text-accent group-hover:rotate-90 transition-all duration-300" />
                        </div>
                        <div className="text-center">
                            <span className="font-display font-black text-app-subtle uppercase tracking-widest text-xs group-hover:text-accent transition-colors">{t('modules:session.npc_gallery.empty_state_init')}</span>
                            <p className="text-ui-9 text-app-subtle mt-1 font-mono group-hover:text-app-muted">{t('modules:session.npc_gallery.empty_state_slot')}</p>
                        </div>
                    </button>
                </motion.div>

                {filteredEntities.length === 0 && search && (
                    <div className="flex flex-col items-center justify-center py-32 text-app-subtle">
                        <Search size={64} className="mb-6 opacity-10" />
                        <p className="text-sm italic font-mono uppercase tracking-[0.3em]">{t('modules:session.npc_gallery.no_results', { query: search })}</p>
                    </div>
                )}
            </main>

            {/* Overlays */}
            <AIPromptOverlay
                isOpen={showAIPrompt}
                onClose={() => { setShowAIPrompt(false); setEditingNpcId(null); }}
                isGenerating={isGeneratingAIImage}
                title={t('modules:session.npc_gallery.ai_title', { name: editingNpc?.name })}
                placeholder={t('modules:session.npc_gallery.ai_placeholder')}
                onGenerate={(instructions) => {
                    if (editingNpcId) {
                        generateEntityPortrait(editingNpcId, instructions).then(() => {
                            setShowAIPrompt(false);
                            setEditingNpcId(null);
                        });
                    }
                }}
            />

            <MediaBrowser
                isOpen={showMediaBrowser}
                onClose={() => { setShowMediaBrowser(false); setEditingNpcId(null); }}
                onSelect={(mediaId) => {
                    if (editingNpcId) {
                        updateEntity(editingNpcId, { avatar: mediaId });
                        setShowMediaBrowser(false);
                        setEditingNpcId(null);
                    }
                }}
            />
        </div>
    );
};

const NpcGalleryItem: React.FC<{
    npc: Entity,
    isSelected: boolean,
    isPinned: boolean,
    onSelect: () => void,
    onTogglePin: () => void,
    onGenerateImage: () => void,
    onPickImage: () => void,
    onDelete: () => void,
    regime: import('../logic/regimeDInterface').RegimeDInterface,
    t: TFunction
}> = ({ npc, isSelected, isPinned, onSelect, onTogglePin, onGenerateImage, onPickImage, onDelete, regime, t }) => {

    return (
        <motion.div
            onClick={onSelect}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            /*
              **La carte ne déclare plus sa hauteur : elle est la somme de ses
              deux moitiés.**

              Signalé par David le 2026-08-21 — « je ne sais pas lire les boutons
              en dessous des PNJ ». C'était de l'arithmétique : la carte valait
              `h-96` (384 px) pendant que le portrait faisait `h-56` (224) et le
              contenu `h-48` (192), soit 416. Trente-deux pixels de trop, et
              `overflow-hidden` les coupait — précisément la moitié basse de la
              rangée de boutons. *Un bouton qu'on ne voit pas est un bouton qui
              n'existe pas.*

              Le resserrage de 28rem à 24 documenté ici n'avait touché que le
              total ; les deux moitiés étaient restées à leur taille. **Trois
              hauteurs pour une seule vérité, et elles ont divergé** — le motif
              de la semaine, appliqué cette fois à du CSS.

              ⚠ **« La même erreur ne peut plus se reproduire » était faux**, et
              elle s'est reproduite le 2026-08-30. Retirer la hauteur de la
              CARTE ne disait rien de celles de ses moitiés : `h-48` est resté
              sur le contenu, trop court pour lui-même, et les boutons ont été
              rognés une seconde fois. *Enlever une des trois hauteurs laissait
              deux vérités concurrentes, ce qui suffit à diverger.*

              Il n'en reste plus qu'une, le portrait — et
              `electron/tuilesDePNJ.test.ts` tient désormais la garde, parce qu'un
              commentaire qui affirme une propriété ne la vérifie pas.

              `HAUTEUR_DE_CARTE` n'existe que pour que la case « ajouter » garde
              le même gabarit dans la grille.
            */
            className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all border border-app-border bg-app-surface hover:border-accent/40 ${
                isSelected ? 'ring-2 ring-accent shadow-glow-accent/20' : ''
            }`}
        >
            {/* Le portrait, grand, avec le camp posé dessus */}
            <div className="relative h-64 shrink-0 overflow-hidden bg-app-surface-2">
                {npc.avatar ? (
                    <ResolvedImage
                        src={npc.avatar}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover object-top grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-app-subtle">
                        <Users size={56} strokeWidth={1} />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-app-surface via-transparent to-transparent" />

                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded text-ui-9 font-black uppercase tracking-widest border ${ROLE_COLORS[npc.role as keyof typeof ROLE_COLORS] || 'bg-app-muted/20 text-app-muted border-app-text/10'}`}>
                    {t(`modules:session.npc_gallery.roles.${npc.role}`, { defaultValue: npc.role })}
                </div>

                {/* Les gestes du portrait, au survol — l'épingle reste visible
                    tant que le PNJ est épinglé à la séance. */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                        className={`p-2 rounded-lg transition-all shadow-xl backdrop-blur-md ${
                            isPinned ? 'bg-accent text-app-on-accent shadow-accent/20' : 'bg-app-bg/60 text-app-text hover:text-accent border border-app-text/10 opacity-0 group-hover:opacity-100'
                        }`}
                        title={isPinned ? t('modules:session.npc_gallery.unpin_tooltip') : t('modules:session.npc_gallery.pin_tooltip')}
                    >
                        <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} />
                    </button>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {/*
                            **Axe N — celui-ci supprime le PNJ pour de bon.**

                            `deleteEntity`, et il est voisin de « Fiche » et de
                            l'œil qu'on touche pour consulter. *J'avais protégé
                            la corbeille du générateur — qui ne retire qu'un
                            mémo, « le PNJ lui-même n'est pas supprimé » — et
                            laissé celle-ci à portée.* Signalé par David le
                            2026-08-24, capture à l'appui.
                        */}
                        <HorsDePortee
                            regime={regime}
                            libelle={t('modules:session.npc_gallery.delete_tooltip')}
                            compact
                            icone={<Trash2 size={16} />}
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="p-2 bg-etat-danger/20 backdrop-blur-md rounded-lg text-etat-danger hover:bg-etat-danger hover:text-app-bg border border-etat-danger/30 transition-all"
                                title={t('modules:session.npc_gallery.delete_tooltip')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </HorsDePortee>
                        <button
                            onClick={(e) => { e.stopPropagation(); onPickImage(); }}
                            className="p-2 bg-app-bg/60 backdrop-blur-md rounded-lg text-app-text hover:text-accent border border-app-text/10 transition-all"
                            title={t('modules:session.npc_gallery.browse_tooltip')}
                        >
                            <ImageIcon size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onGenerateImage(); }}
                            className="p-2 bg-accent text-app-on-accent rounded-lg hover:scale-110 transition-all shadow-glow-accent"
                            title={t('modules:session.npc_gallery.ai_tooltip')}
                        >
                            <Sparkles size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/*
              **Le contenu n'a plus de hauteur imposée, et c'est la suite du
              correctif du 2026-08-21.**

              Ce jour-là, la CARTE valait `h-96` pendant que ses deux moitiés en
              réclamaient 416 : on lui a retiré sa hauteur. Mais `h-48` est resté
              ici, et **la moitié basse était trop courte pour son propre
              contenu** — signalé de nouveau par David le 2026-08-30, même
              symptôme, un cran plus bas.

              `flex-1` sans hauteur : le contenu prend ce qu'il lui faut, la
              grille étire toutes les cartes d'une rangée à la même hauteur, et
              `mb-auto` plus bas colle les boutons au bas de chacune — donc
              alignés d'une carte à l'autre. *Une hauteur qu'on n'écrit pas ne
              peut pas devenir fausse.*
            */}
            <div className="p-4 flex-1 flex flex-col text-app-text">
                <div className="mb-auto">
                    <h3 className="font-display font-black text-lg text-app-text leading-tight mb-1.5 group-hover:text-accent transition-colors uppercase tracking-tight">
                        {npc.name}
                    </h3>
                    {/*
                        `truncate` coupait toute description à une ligne — « Un
                        technicie… », « Réplicant 'b… » — alors que le bloc en a
                        la place. Deux lignes suffisent à distinguer deux PNJ, ce
                        qu'un mot et demi ne permettait pas.
                    */}
                    <p className="text-xs text-app-muted line-clamp-2 leading-snug">
                        {npc.description || t('modules:session.npc_gallery.default_description')}
                    </p>
                </div>

                {/* Bottom Controls */}
                <div className="mt-4 flex flex-col gap-3">
                    {/*
                        **La barre n'existe que si le jeu compte des points.**

                        Elle divisait `npc.hp` par `npc.maxHp` sans rien
                        demander : sur Dune, dont la défaite est une tâche
                        étendue, un adversaire affichait une barre de vie pleine
                        tirée de champs que rien n'utilise. Même correctif que
                        pour la grille des personnages joueurs — sans jauge, on
                        montre ce que le système décrit.
                    */}
                    {fractionDeVie(npc) === null ? (
                        <div className="flex items-center gap-1.5 text-ui-10 font-black text-app-subtle tracking-widest uppercase">
                            <Activity size={11} className="text-etat-danger/60" />
                            <span>{abregerLaSante(npc) ?? decrireLaSante(npc) ?? 'santé non chiffrée'}</span>
                        </div>
                    ) : (<div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-baseline text-ui-10 font-black text-app-subtle tracking-widest uppercase">
                        <span>{t('modules:session.npc_gallery.hp_label')}</span>
                        <span className={`font-display text-sm ${fractionDeVie(npc)! < 0.3 ? 'text-etat-danger' : 'text-accent'}`}>{npc.hp} / {npc.maxHp} HP</span>
                    </div>
                    <div className="w-full h-1.5 bg-app-bg rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${
                                fractionDeVie(npc)! < 0.3 ? 'bg-etat-danger' : 'bg-accent'
                            }`}
                            style={{ width: `${fractionDeVie(npc)! * 100}%` }}
                        />
                    </div>
                    </div>)}

                    {/* Les trois gestes réels : Fiche, Combat, Projeter */}
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-app-surface-2 border border-app-border text-app-text hover:border-accent/50 hover:text-accent h-9 rounded-lg font-bold text-ui-10 uppercase tracking-widest transition-all"
                        >
                            <FileText size={12} />
                            {t('modules:session.npc_gallery.details_btn')}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                useCombatStore.getState().addCombatant({
                                    name: npc.name,
                                    /* `NpcDetail` envoyait `npc.initiative`, cet
                                       écran envoyait zéro : le même PNJ entrait
                                       en combat avec deux initiatives selon le
                                       bouton cliqué, et rien ne le disait. */
                                    init: npc.initiative ?? 0,
                                    hp: npc.hp,
                                    hpMax: npc.maxHp,
                                    avatar: npc.avatar,
                                    isPlayer: false,
                                    faction: npc.role === 'ally' ? 'ally' :
                                             (npc.role === 'hostile' || npc.role === 'boss') ? 'enemy' : 'neutral',
                                    sourceEntityId: npc.id,
                                    statuses: [],
                                    roleplayingNotes: npc.roleplayingNotes,
                                    gmSecretInfo: npc.gmSecretInfo
                                });
                                gmToast(t('modules:session.toasts.entity_added_to_combat', { name: npc.name }));
                            }}
                            className="w-9 h-9 flex items-center justify-center bg-etat-danger/10 border border-etat-danger/20 text-etat-danger hover:bg-etat-danger hover:text-app-bg rounded-lg transition-all"
                            title={t('modules:session.npc_gallery.add_combat_tooltip')}
                        >
                            <Swords size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                useImageStore.getState().projectEntity(npc);
                                gmToast(t('modules:session.toasts.entity_projected', { name: npc.name }));
                            }}
                            className="w-9 h-9 flex items-center justify-center bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-app-on-accent rounded-lg transition-all"
                            title={t('modules:session.npc_gallery.project_tooltip')}
                        >
                            <Eye size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default NpcGallery;
