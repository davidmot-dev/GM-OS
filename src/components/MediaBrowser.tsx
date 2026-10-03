import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMediaStore } from '../stores/useMediaStore';
import { correspondALaRecherche } from './media/rechercheDeMedia';
import { analyserLaRecherche, passeLeFiltreDeTags } from './media/filtreDeTags';
import { tagsParUsage, appliquerEnLot, renommerDansLaBibliotheque, formeCanonique } from './media/vocabulaireDesTags';
import type { MediaType, MediaItem } from '../stores/useMediaStore';
import { Search, Image as ImageIcon, Music, Film, UploadCloud, Trash2, X, Check, FileText, Plus, Edit2, Users, Clock, ShieldAlert, ArrowDownAZ, ChevronDown, ListFilter, Folder, Lock, RotateCcw, Unplug } from 'lucide-react';
import { usagesDesMedias } from '../services/proprietairesDesMedias';
import { filtreDeSelection } from '../stores/typesDeMedia';
import { importerPlusieursMedias } from './media/importerPlusieursMedias';
import { gmPrompt, gmConfirm } from '../stores/useModalStore';
import { gmToast } from '../stores/useToastStore';
import { mediasRestituables, restaurerLesMedias } from '../modules/session/logic/MiroirDesMedias';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useTranslation } from 'react-i18next';

import { MediaItemThumbnail } from '../modules/image/components/MediaItemThumbnail';
import { FullScreenPreview } from '../modules/image/components/FullScreenPreview';
import { TacticalDetailPanel } from '../modules/image/components/TacticalDetailPanel';
import { useFermetureParEchap } from '../hooks/useFermetureParEchap';
import { Etiquette } from './socle';

const TYPE_ICONS: Record<string, React.ReactNode> = {
    'image': <ImageIcon size={14} className="text-gm-cyan" />,
    'audio': <Music size={14} className="text-gm-gold" />,
    'video': <Film size={14} className="text-gm-violet" />,
    'document': <FileText size={14} className="text-gm-emerald" />,
};

/** Une ligne de la colonne de gauche : un libellé, son compte, l'état choisi. */
const LigneDeFiltre: React.FC<{
    actif: boolean; onClick: () => void; icone: React.ReactNode; libelle: string; compte?: number; ton?: 'neutre' | 'danger';
}> = ({ actif, onClick, icone, libelle, compte, ton = 'neutre' }) => (
    <button
        onClick={onClick}
        aria-pressed={actif}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            actif ? 'bg-accent/10 font-semibold text-accent' : ton === 'danger' ? 'text-etat-danger hover:bg-etat-danger/10' : 'text-app-muted hover:bg-app-text/5 hover:text-app-text'
        }`}
    >
        <span className="shrink-0 opacity-80">{icone}</span>
        <span className="min-w-0 flex-1 truncate">{libelle}</span>
        {compte !== undefined && <span className="font-mono text-ui-10 font-bold">{compte}</span>}
    </button>
);

interface MediaBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (mediaId: string) => void;
    allowedTypes?: MediaType[]; 
    title?: string;
}

export const MediaBrowser: React.FC<MediaBrowserProps> = ({
    isOpen,
    onClose,
    onSelect,
    allowedTypes,
    title,
}) => {
    const { t } = useTranslation('common');
    // 1. All Hooks (State & Stores)
    const { 
        mediaList, 
        isLoading, 
        isInitialized, 
        initDB, 
        addMedia, 
        deleteMedia, 
        clearDB, 
        renameMedia,
        updateMediaTags,
        appliquerDesTags,
        updateMediaCampaigns,
        collections, 
        addCollection, 
        deleteCollection, 
        renameCollection, 
        toggleMediaInCollection,
        toggleMediaPersistence, 
    } = useMediaStore();

    const { activeCampaignId, campaigns } = useSessionOSStore();

    /**
     * **Ce que le miroir peut rendre — chantier n° 4.**
     *
     * Recompté à chaque changement de la bibliothèque : après une restauration
     * le compte tombe à zéro et le bandeau disparaît de lui-même, plutôt que de
     * rester à proposer un geste déjà fait.
     */
    const [aRestituer, setARestituer] = useState(0);
    const [restauration, setRestauration] = useState(false);

    useEffect(() => {
        let annule = false;
        void mediasRestituables()
            .then(ids => { if (!annule) setARestituer(ids.length); })
            .catch(() => { /* pas de miroir joignable : rien à proposer */ });
        return () => { annule = true; };
    }, [mediaList.length, isInitialized]);

    const lancerLaRestauration = async () => {
        setRestauration(true);
        try {
            const bilan = await restaurerLesMedias();
            gmToast(
                bilan.rendus > 0
                    ? `${bilan.rendus} média(s) restauré(s)`
                        + (bilan.brouillard ? ', brouillard compris' : '')
                        + (bilan.echecs > 0 ? ` — ${bilan.echecs} échec(s)` : '')
                    : 'Rien à restaurer : la bibliothèque a déjà tout.',
            );
        } finally { setRestauration(false); }
    };

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagLogic, setTagLogic] = useState<'AND' | 'OR'>('OR');

    /*
      ⭐ **Étiqueter en lot.** Quarante fichiers importés d'un bloc se taguaient
      un par un, en rouvrant le panneau de détail à chaque fois. *Le coût n'était
      pas le clic : c'était que personne ne le faisait, donc que la bibliothèque
      restait sans étiquettes.*
    */
    const [selectionMultiple, setSelectionMultiple] = useState<Set<string>>(new Set());
    const [tagDuLot, setTagDuLot] = useState('');
    /** L'étiquette qu'on est en train de renommer dans toute la bibliothèque. */
    const [tagARenommer, setTagARenommer] = useState<string | null>(null);
    const [nouveauNomDeTag, setNouveauNomDeTag] = useState('');
    const [smartFilter, setSmartFilter] = useState<'none' | 'recent' | 'untagged' | 'orphans'>('none');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'name-asc'>('date-desc');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
    const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

    /*
      **Échap ferme la médiathèque** — ajouté le 2026-09-12.

      ⛔ Elle est une surcouche **plein écran** qui couvre la barre latérale :
      tant qu'elle est ouverte, plus aucun module n'est cliquable. Et elle ne se
      fermait qu'au bouton, dont l'intitulé ne disait même pas « fermer ».
      Trouvé en écrivant la traversée E2E des modules, qui bloquait dessus.

      ⭐ Le motif existe déjà à **cinq endroits** dans GM-OS — `SpotlightSearch`,
      `FullScreenPreview`, `AIPromptOverlay`… *La médiathèque était l'exception,
      pas la règle*, et une exception qu'aucune décision n'explique est un oubli.

      ⚠️ **Les modaux imbriqués passent d'abord.** L'aperçu plein écran et
      l'éditeur de média posent leur propre écoute d'Échap : sans cette garde,
      une seule frappe fermerait l'aperçu **et** la médiathèque derrière lui —
      et le meneur perdrait sa navigation pour avoir voulu refermer une image.

      ⭐ **Cette garde était énumérée ; elle ne l'est plus.** Elle nommait ses
      deux enfants (`previewItem`, `editingMediaId`) et tenait tant que personne
      n'en ajoutait un troisième. Depuis le 2026-09-13, la pile de
      `surcouchesOuvertes` répond à sa place : *seule celle du dessus ferme*, et
      elle n'a rien à connaître de ce qu'elle porte.
    */
    useFermetureParEchap(true, onClose, 'Médiathèque');
    const [campaignFilterEnabled, setCampaignFilterEnabled] = useState(true);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    /*
      **Qui se sert de quoi — calculé une fois par ouverture.**

      Le recensement lit une douzaine de magasins ; le refaire à chaque rendu
      coûterait pour rien, puisque rien de ce qu'on filtre ici ne le modifie.
      `mediaList` sert de déclencheur : c'est le seul changement qui puisse
      créer ou résorber un orphelin sans quitter cet écran.
    */
    const orphelins = React.useMemo(() => {
        if (!isOpen) return new Set<string>();
        const { usages } = usagesDesMedias();
        return new Set(mediaList.filter(m => !usages.has(m.id)).map(m => m.id));
    }, [isOpen, mediaList]);
    const estOrphelin = React.useCallback((id: string) => orphelins.has(id), [orphelins]);

    // 2. Lifecycle & Effects
    useEffect(() => {
        if (isOpen && !isInitialized && !isLoading) {
            initDB();
        }
    }, [isOpen, isInitialized, isLoading, initDB]);

    // 3. Logic Handlers
    const handleCreateCollection = () => {
        gmPrompt(t('mediaBrowser.renameFolder'), "", (name) => {
            if (name.trim()) addCollection(name.trim());
        });
    };

    const handleRenameCollection = (id: string, currentName: string) => {
        gmPrompt(t('mediaBrowser.renameFolder'), currentName, (newName) => {
            if (newName.trim()) renameCollection(id, newName.trim());
        });
    };

    const handleDeleteCollection = (id: string) => {
        gmConfirm(t('mediaBrowser.deleteFolderConfirm'), () => {
            deleteCollection(id);
            if (selectedCollectionId === id) setSelectedCollectionId(null);
        });
    };

    const handleRenameMedia = (id: string, currentName: string) => {
        gmPrompt(t('mediaBrowser.renameIdent'), currentName, (newName) => {
            if (newName.trim()) renameMedia(id, newName.trim());
        });
    };

    /**
     * **Le Hub prend plusieurs fichiers d'un coup** (point H8, 2026-09-05).
     *
     * Il n'en lisait qu'un — `files?.[0]` — alors que le sélecteur en aurait
     * accepté autant qu'on veut. Ranger une sonothèque se faisait donc fichier
     * par fichier, avec une fenêtre de sélection à rouvrir entre chaque.
     *
     * La règle elle-même vit dans `importerPlusieursMedias`, où elle est
     * testée : *une logique cachée dans un composant n'est couverte par rien.*
     *
     * ⚠️ **Le contrôle de doublon porte sur le nom ET la taille**, pas sur le
     * contenu : une empreinte demanderait de relire toute la base à chaque
     * import. Deux fichiers de même nom et de même octet près sont le même
     * fichier dans tous les cas qui se produisent vraiment. *Et il avertit, il
     * n'interdit pas* — le meneur peut vouloir la copie, une variante
     * retouchée sous le même nom par exemple.
     */
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fichiers = Array.from(e.target.files ?? []);
        if (fichiers.length === 0) return;

        setIsUploading(true);
        const campaignIds = activeCampaignId ? [activeCampaignId] : [];

        const resultat = await importerPlusieursMedias(fichiers, {
            existants: mediaList,
            ajouter: (fichier) => addMedia(fichier, [], campaignIds),
            demanderPourLeDoublon: (nom) => confirm(t('mediaBrowser.duplicateConfirm', { name: nom })),
        });

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        if (resultat.echecs.length > 0) {
            alert(`${t('error_save')} : ${resultat.echecs.join(', ')}`);
        } else if (resultat.ranges > 1) {
            gmToast(t('mediaBrowser.importDone', { count: resultat.ranges }), 'success');
        }
    };

    const basculerLaSelection = (id: string) => setSelectionMultiple(prev => {
        const suite = new Set(prev);
        if (suite.has(id)) suite.delete(id); else suite.add(id);
        return suite;
    });

    /** Poser ou retirer une étiquette sur toute la sélection. */
    const etiqueterLeLot = async (sens: 'ajouter' | 'retirer') => {
        const tag = formeCanonique(tagDuLot);
        if (!tag || selectionMultiple.size === 0) return;

        const choisis = mediaList.filter(m => selectionMultiple.has(m.id));
        const changements = appliquerEnLot(choisis, { [sens]: [tag] });
        if (changements.length === 0) {
            /* ⚠️ Le dire : *un geste sans effet passe pour une panne.* */
            gmToast(t('mediaBrowser.tags.rienAFaire', { tag }), 'warning');
            return;
        }
        const ecrits = await appliquerDesTags(changements);
        gmToast(t(`mediaBrowser.tags.${sens}Fait`, { count: ecrits, tag }), 'success');
        setTagDuLot('');
    };

    /**
     * **Renommer, fusionner ou supprimer une étiquette partout.**
     *
     * ⭐ Les trois sont le même geste : renommer vers une étiquette qui existe
     * **est** une fusion, et renommer vers rien **est** une suppression.
     */
    const renommerLeTag = async () => {
        if (!tagARenommer) return;
        const changements = renommerDansLaBibliotheque(
            mediaList, tagARenommer, formeCanonique(nouveauNomDeTag),
        );
        const ecrits = await appliquerDesTags(changements);

        /* La sélection de filtre pointait peut-être sur l'ancien nom : la
           laisser là afficherait une liste vide sans raison apparente. */
        setSelectedTags(prev => prev.filter(t => t !== tagARenommer));
        gmToast(t('mediaBrowser.tags.renommeFait', { count: ecrits, tag: tagARenommer }), 'success');
        setTagARenommer(null);
        setNouveauNomDeTag('');
    };

    // 4. Filtering Logic
    /* La barre porte du texte, des étiquettes exigées et des étiquettes refusées. */
    const rechercheLue = analyserLaRecherche(search);
    const filteredMedia = mediaList.filter(m => {
        if (allowedTypes && !allowedTypes.includes(m.type)) return false;
        if (typeFilter !== 'all' && m.type !== typeFilter) return false;
        
        if (smartFilter === 'untagged') {
            if (m.tags.length > 0) return false;
        }

        /*
          **Un orphelin verrouillé reste dans la liste.** Ce dossier sert à
          passer les orphelins en revue avant un nettoyage, pas à prédire ce que
          le nettoyage supprimera — et ce qu'on a déjà pris la peine de
          protéger mérite d'être revu comme le reste.
        */
        if (smartFilter === 'orphans' && !estOrphelin(m.id)) return false;

        /*
          ⭐ **Les étiquettes de la barre rejoignent celles de la liste.** Écrire
          `#taverne` et cliquer « taverne » doivent faire la même chose, sinon
          l'écran a deux vérités. L'exclusion, elle, n'existe que dans la barre :
          la dire dans une liste à cocher demanderait un **troisième état** par
          étiquette, sur cent étiquettes.
        */
        if (smartFilter !== 'untagged') {
            const exiges = [...selectedTags, ...rechercheLue.inclus];
            if (!passeLeFiltreDeTags(m.tags, {
                inclus: exiges,
                exclus: rechercheLue.exclus,
                logique: tagLogic === 'AND' ? 'ET' : 'OU',
            })) return false;
        }

        /*
          ⚠️ **La comparaison vit dans `media/rechercheDeMedia`, et elle y est
          éprouvée.** Écrite ici, elle était littérale : `sirene` ne trouvait pas
          *sirène*, et `taverne combat` ne trouvait pas *« combat à la
          taverne »*. *Une recherche qui échoue sur un accent ne se lit pas
          comme une recherche stricte : elle se lit comme un fichier perdu.*
        */
        if (!correspondALaRecherche(m, rechercheLue.texte)) return false;
        
        if (campaignFilterEnabled && activeCampaignId) {
            if (!m.campaignIds?.includes(activeCampaignId)) return false;
        }

        if (selectedCollectionId) {
            const coll = collections.find(c => c.id === selectedCollectionId);
            if (!coll || !coll.mediaIds.includes(m.id)) return false;
        }
        
        return true;
    });

    const sortedAndFilteredMedia = [...filteredMedia].sort((a, b) => {
        if (sortBy === 'date-desc') return b.createdAt - a.createdAt;
        if (sortBy === 'date-asc') return a.createdAt - b.createdAt;
        if (sortBy === 'size-desc') return b.size - a.size;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return b.createdAt - a.createdAt;
    });

    const displayMedia = smartFilter === 'recent' ? sortedAndFilteredMedia.slice(0, 50) : sortedAndFilteredMedia;
    /*
      ⭐ **Classées par usage, et non par alphabet.** Une liste alphabétique met
      `abysses` avant `taverne` employée quarante fois : *ce qu'on cherche le
      plus souvent doit être ce qu'on atteint le plus vite.* Le compte dit aussi
      lesquelles ne servent à rien — celles qu'il faudra fusionner.
    */
    const tagsClasses = tagsParUsage(mediaList);
    const allTags = tagsClasses.map(e => e.tag);

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (!isOpen) return null;

    /** Le compte de chaque type, sous les filtres de campagne et de types permis. */
    const compteParType = (type: MediaType | 'all') => mediaList.filter(m =>
        (!allowedTypes || allowedTypes.includes(m.type))
        && (!campaignFilterEnabled || !activeCampaignId || m.campaignIds?.includes(activeCampaignId))
        && (type === 'all' || m.type === type)).length;

    const toutVoir = () => {
        setSelectedCollectionId(null);
        setSelectedTags([]);
        setSmartFilter('none');
    };
    const mediaChoisi = editingMediaId ? mediaList.find(m => m.id === editingMediaId) : undefined;

    const titreDeColonne = 'mb-1.5 flex items-center justify-between px-1 text-ui-10 font-black uppercase tracking-widest text-app-muted';

    /*
      **La médiathèque de la maquette retenue** — refonte, L6
      (`stitch/outillage/outillage-mediatheque.png`) : l'en-tête, une barre
      (recherche, types et leur compte, tri, import) ; à gauche les collections,
      le diagnostic et les étiquettes filtrables ; la grille ; **à droite le
      média choisi** — sa lecture, ses étiquettes, ses liaisons —, en colonne
      et plus en tiroir par-dessus la grille. « Télémétrie CPU / RAM », « Grille
      compacte » et l'échantillonnage du son sont des inventions du dessin.
    */
    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col gap-3 bg-app-bg p-4 font-sans text-app-text animate-in fade-in duration-300">
            {previewItem && (
                <FullScreenPreview
                    media={previewItem}
                    onClose={() => setPreviewItem(null)}
                />
            )}

            {/* ── L'en-tête ── */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-app-border pb-3">
                <div className="flex min-w-0 items-center gap-3">
                    <UploadCloud size={22} className="shrink-0 text-accent" />
                    <h1 className="truncate font-display text-xl font-bold uppercase tracking-wide text-app-text">{title || t('mediaBrowser.hubTitle')}</h1>
                    <Etiquette ton="accent">{t('mediaBrowser.countMedia', { count: compteParType('all') })}</Etiquette>
                </div>
                <button
                    onClick={onClose}
                    title={t('mediaBrowser.deactivateInterface')}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-app-muted transition-colors hover:bg-app-text/5 hover:text-app-text"
                >
                    <span className="rounded border border-app-border px-1.5 py-0.5 font-mono text-ui-9 font-bold">Échap</span>
                    <X size={18} />
                </button>
            </div>

            {/* ── La barre : chercher, filtrer par type, trier, importer ── */}
            {/*
              ⛔ **`z-30` n'est pas décoratif : sans lui, le menu de tri passe SOUS
              les vignettes** (David, 2026-09-16). Les vignettes sont `relative` :
              même couche de peinture que cette barre, mais plus loin dans le
              document. Un `z-index` positif ici fait passer la barre — et son
              menu — au-dessus d'elles.
            */}
            <div className="relative z-30 flex shrink-0 flex-wrap items-center gap-3">
                {/*
                  ⛔ **Le champ existait ; il était INVISIBLE** (David, 2026-09-16) :
                  son invite était à 5 % d'opacité. *Une fonctionnalité qu'on ne voit
                  pas est une fonctionnalité absente.*
                */}
                <div className="relative min-w-[16rem] max-w-xl flex-1">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                    <input
                        type="text"
                        placeholder={t('mediaBrowser.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="min-h-11 w-full rounded-lg border border-app-border bg-app-surface pl-9 pr-20 text-sm text-app-text placeholder:text-app-subtle focus:border-accent/60 focus:outline-none"
                    />
                    {/*
                      **Le compte de résultats, et le moyen d'effacer** : une recherche
                      qui ne rend rien doit se distinguer d'une médiathèque vide.
                    */}
                    {search && (
                        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                            <span className={`font-mono text-ui-10 font-bold ${displayMedia.length === 0 ? 'text-etat-alerte' : 'text-accent'}`}>{displayMedia.length}</span>
                            <button onClick={() => setSearch('')} title={t('mediaBrowser.clearSearch')} className="rounded p-1 text-app-muted hover:text-app-text">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>

                <div role="tablist" className="flex overflow-hidden rounded-lg border border-app-border">
                    {([
                        { id: 'all', icon: null },
                        { id: 'image', icon: <ImageIcon size={14} /> },
                        { id: 'audio', icon: <Music size={14} /> },
                        { id: 'video', icon: <Film size={14} /> },
                        { id: 'document', icon: <FileText size={14} /> },
                    ] as const).filter(b => b.id === 'all' || !allowedTypes || allowedTypes.includes(b.id)).map(btn => (
                        <button
                            key={btn.id}
                            role="tab"
                            aria-selected={typeFilter === btn.id}
                            onClick={() => setTypeFilter(btn.id)}
                            className={`flex min-h-11 items-center gap-2 border-r border-app-border px-3 text-ui-10 font-black uppercase tracking-widest transition-colors last:border-r-0 ${
                                typeFilter === btn.id ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:bg-app-text/5 hover:text-app-text'
                            }`}
                        >
                            {btn.icon}
                            {t(`mediaBrowser.tabs.${btn.id}`)}
                            <span className="font-mono opacity-70">{compteParType(btn.id)}</span>
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {activeCampaignId && (
                        <button
                            onClick={() => setCampaignFilterEnabled(!campaignFilterEnabled)}
                            aria-pressed={campaignFilterEnabled}
                            className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-ui-10 font-black uppercase tracking-widest transition-colors ${
                                campaignFilterEnabled ? 'border-gm-gold/50 bg-gm-gold/10 text-gm-gold' : 'border-app-border text-app-muted hover:text-app-text'
                            }`}
                        >
                            <Users size={15} />
                            {campaignFilterEnabled ? t('mediaBrowser.focusOperational') : t('mediaBrowser.globalMatrix')}
                        </button>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                            aria-expanded={isSortMenuOpen}
                            className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-ui-10 font-black uppercase tracking-widest transition-colors ${
                                isSortMenuOpen ? 'border-accent/60 text-accent' : 'border-app-border text-app-muted hover:text-app-text'
                            }`}
                        >
                            <ListFilter size={15} />
                            {t(`mediaBrowser.sort.${sortBy === 'date-desc' ? 'recent' : sortBy === 'date-asc' ? 'oldest' : sortBy === 'size-desc' ? 'size' : 'name'}.label`)}
                            <ChevronDown size={14} className={`transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSortMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)} />
                                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-60 rounded-xl border border-app-border bg-app-surface p-1.5 shadow-2xl">
                                    {([
                                        { id: 'date-desc', key: 'recent', icon: <Clock size={15} /> },
                                        { id: 'date-asc', key: 'oldest', icon: <Clock size={15} /> },
                                        { id: 'size-desc', key: 'size', icon: <UploadCloud size={15} /> },
                                        { id: 'name-asc', key: 'name', icon: <ArrowDownAZ size={15} /> },
                                    ] as const).map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => { setSortBy(option.id); setIsSortMenuOpen(false); }}
                                            className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${sortBy === option.id ? 'bg-accent/10 text-accent' : 'text-app-text hover:bg-app-text/5'}`}
                                        >
                                            <span className="mt-0.5">{option.icon}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold">{t(`mediaBrowser.sort.${option.key}.label`)}</span>
                                                <span className="block text-xs text-app-muted">{t(`mediaBrowser.sort.${option.key}.desc`)}</span>
                                            </span>
                                            {sortBy === option.id && <Check size={14} className="mt-0.5" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 text-ui-11 font-black uppercase tracking-widest text-app-on-accent transition-all hover:brightness-110">
                        <UploadCloud size={16} />
                        {isUploading ? t('mediaBrowser.uploadingAsset') : t('mediaBrowser.importAsset')}
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleUpload}
                            className="hidden"
                            accept={filtreDeSelection(allowedTypes)}
                        />
                    </label>
                </div>
            </div>

            {/*
              ⚠️ **La barre de lot n'apparaît qu'avec une sélection.** Un bandeau
              permanent qui dit « 0 sélectionné » occupe la place sans rien apprendre.
            */}
            {selectionMultiple.size > 0 && (
                <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 px-4 py-2">
                    <span className="shrink-0 text-ui-10 font-black uppercase tracking-widest text-accent">
                        {t('mediaBrowser.tags.selection', { count: selectionMultiple.size })}
                    </span>
                    <input
                        value={tagDuLot}
                        onChange={e => setTagDuLot(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Escape') { e.stopPropagation(); setTagDuLot(''); return; }
                            if (e.key === 'Enter') void etiqueterLeLot('ajouter');
                        }}
                        list="vocabulaire-des-tags"
                        placeholder={t('mediaBrowser.tags.placeholderLot')}
                        className="min-w-[10rem] flex-1 rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-accent/60"
                    />
                    <button onClick={() => void etiqueterLeLot('ajouter')} disabled={!tagDuLot.trim()} className="rounded-lg border border-accent/40 px-3 py-2 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-30">
                        {t('mediaBrowser.tags.ajouter')}
                    </button>
                    <button onClick={() => void etiqueterLeLot('retirer')} disabled={!tagDuLot.trim()} className="rounded-lg border border-app-border px-3 py-2 text-ui-10 font-black uppercase tracking-widest text-app-muted hover:border-etat-danger/40 hover:text-etat-danger disabled:opacity-30">
                        {t('mediaBrowser.tags.retirer')}
                    </button>
                    <button onClick={() => setSelectionMultiple(new Set(displayMedia.map(m => m.id)))} className="px-3 py-2 text-ui-10 font-black uppercase tracking-widest text-app-muted hover:text-app-text">
                        {t('mediaBrowser.tags.toutSelectionner')}
                    </button>
                    <button onClick={() => setSelectionMultiple(new Set())} className="ml-auto px-3 py-2 text-ui-10 font-black uppercase tracking-widest text-app-muted hover:text-app-text">
                        {t('mediaBrowser.tags.deselectionner')}
                    </button>
                </div>
            )}

            {/* Le vocabulaire, offert à tous les champs d'étiquette de cet écran. */}
            <datalist id="vocabulaire-des-tags">
                {allTags.map(tag => <option key={tag} value={tag} />)}
            </datalist>

            <div className="flex min-h-0 flex-1 gap-4">
                {/* ── À gauche : collections, diagnostic, étiquettes ── */}
                <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
                    <section>
                        <p className={titreDeColonne}>
                            {t('mediaBrowser.foldersTitle')}
                            <button onClick={handleCreateCollection} title={t('mediaBrowser.newFolder')} className="rounded p-1 text-app-muted hover:text-accent">
                                <Plus size={14} />
                            </button>
                        </p>
                        <LigneDeFiltre
                            actif={!selectedCollectionId && selectedTags.length === 0 && smartFilter === 'none'}
                            onClick={toutVoir}
                            icone={<Folder size={15} />}
                            libelle={t('mediaBrowser.globalArchive')}
                            compte={compteParType('all')}
                        />
                        {collections.map(coll => (
                            <div key={coll.id} className="group flex items-center">
                                <div className="min-w-0 flex-1">
                                    <LigneDeFiltre
                                        actif={selectedCollectionId === coll.id}
                                        onClick={() => { setSelectedCollectionId(coll.id); setSelectedTags([]); setSmartFilter('none'); }}
                                        icone={<Folder size={15} />}
                                        libelle={coll.name}
                                        compte={coll.mediaIds.length}
                                    />
                                </div>
                                <button onClick={() => handleRenameCollection(coll.id, coll.name)} className="rounded p-1.5 text-app-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100" title={t('mediaBrowser.renameFolder')} aria-label={t('mediaBrowser.renameFolder')}>
                                    <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteCollection(coll.id)} className="rounded p-1.5 text-app-muted opacity-0 transition-opacity hover:text-etat-danger group-hover:opacity-100" title={t('mediaBrowser.deleteFolder')} aria-label={t('mediaBrowser.deleteFolder')}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {collections.length === 0 && <p className="px-3 py-1 text-xs italic text-app-subtle">{t('mediaBrowser.noUnitsDetected')}</p>}
                    </section>

                    <section>
                        <p className={titreDeColonne}>{t('mediaBrowser.smartMatrix')}</p>
                        <LigneDeFiltre actif={smartFilter === 'recent'} onClick={() => { setSmartFilter('recent'); setSelectedCollectionId(null); setSelectedTags([]); }} icone={<Clock size={15} />} libelle={t('mediaBrowser.latestFrequency')} />
                        <LigneDeFiltre actif={smartFilter === 'untagged'} onClick={() => { setSmartFilter('untagged'); setSelectedCollectionId(null); setSelectedTags([]); }} icone={<ShieldAlert size={15} />} libelle={t('mediaBrowser.unaliasContent')} compte={mediaList.filter(m => m.tags.length === 0).length} />
                        <LigneDeFiltre actif={smartFilter === 'orphans'} onClick={() => { setSmartFilter(smartFilter === 'orphans' ? 'none' : 'orphans'); setSelectedCollectionId(null); setSelectedTags([]); }} icone={<Unplug size={15} />} libelle={t('mediaBrowser.orphans')} compte={orphelins.size} ton={orphelins.size > 0 ? 'danger' : 'neutre'} />
                    </section>

                    <section>
                        <p className={titreDeColonne}>
                            {t('mediaBrowser.tacticalTags')}
                            <button
                                onClick={() => setTagLogic(tagLogic === 'AND' ? 'OR' : 'AND')}
                                className={`rounded border px-1.5 py-0.5 font-mono text-ui-9 font-bold ${tagLogic === 'AND' ? 'border-accent/50 text-accent' : 'border-app-border text-app-muted hover:text-app-text'}`}
                                title={`${t('mediaBrowser.matrixLogic')} : ${tagLogic === 'AND' ? t('mediaBrowser.tagLogic.and') : t('mediaBrowser.tagLogic.or')}`}
                            >
                                {tagLogic === 'AND' ? t('mediaBrowser.tagLogic.and') : t('mediaBrowser.tagLogic.or')}
                            </button>
                        </p>
                        {/*
                          ⭐ **Renommer, fusionner, supprimer : un seul champ** (double-clic
                          sur une étiquette). Renommer vers une étiquette qui existe EST
                          une fusion ; renommer vers rien EST une suppression.
                        */}
                        {tagARenommer && (
                            <div className="mb-2 flex flex-col gap-2 rounded-lg border border-accent/40 p-2">
                                <p className="text-xs text-app-muted">{t('mediaBrowser.tags.renommerTitre', { tag: tagARenommer })}</p>
                                <input
                                    autoFocus
                                    value={nouveauNomDeTag}
                                    onChange={e => setNouveauNomDeTag(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Escape') { e.stopPropagation(); setTagARenommer(null); return; }
                                        if (e.key === 'Enter') void renommerLeTag();
                                    }}
                                    list="vocabulaire-des-tags"
                                    placeholder={t('mediaBrowser.tags.renommerVide')}
                                    className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-1.5 text-sm text-app-text outline-none focus:border-accent/60"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => void renommerLeTag()} className="rounded-lg border border-accent/40 px-3 py-1 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/10">
                                        {t('mediaBrowser.tags.appliquer')}
                                    </button>
                                    <button onClick={() => setTagARenommer(null)} className="px-3 py-1 text-ui-10 font-black uppercase tracking-widest text-app-muted hover:text-app-text">
                                        {t('mediaBrowser.tags.annuler')}
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 px-1">
                            {tagsClasses.map(({ tag, compte }) => (
                                <button
                                    key={tag}
                                    onDoubleClick={(e) => { e.stopPropagation(); setTagARenommer(tag); setNouveauNomDeTag(tag); }}
                                    title={t('mediaBrowser.tags.doubleClic')}
                                    onClick={() => {
                                        setSelectedTags(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);
                                        setSelectedCollectionId(null);
                                        setSmartFilter('none');
                                    }}
                                    aria-pressed={selectedTags.includes(tag)}
                                    className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
                                        selectedTags.includes(tag) ? 'border-accent bg-accent/15 text-accent' : 'border-app-border text-app-muted hover:border-accent/50 hover:text-app-text'
                                    }`}
                                >
                                    #{tag} <span className="font-mono opacity-60">{compte}</span>
                                </button>
                            ))}
                            {allTags.length === 0 && <p className="px-2 py-1 text-xs italic text-app-subtle">{t('mediaBrowser.noTagTraces')}</p>}
                        </div>
                    </section>

                    <section className="mt-auto flex flex-col gap-2 border-t border-app-border pt-3">
                        {/*
                          **Le retour du miroir — chantier n° 4.** Il vit ici parce que
                          c'est ici qu'on gère les médias, juste au-dessus du bouton qui
                          vide : le geste après lequel on en aura besoin.
                        */}
                        {aRestituer > 0 && (
                            <div className="flex flex-col gap-2 rounded-lg border border-etat-succes/40 bg-etat-succes/5 p-3">
                                <p className="text-xs text-app-text">
                                    {aRestituer} média{aRestituer > 1 ? 's' : ''} dans la sauvegarde, absent{aRestituer > 1 ? 's' : ''} d'ici.
                                </p>
                                <button type="button" disabled={restauration} onClick={lancerLaRestauration} className="flex items-center justify-center gap-2 rounded-lg border border-etat-succes/40 py-2 text-ui-10 font-black uppercase tracking-widest text-etat-succes hover:bg-etat-succes/10 disabled:opacity-30">
                                    <RotateCcw size={14} />
                                    {restauration ? 'Restauration…' : 'Restaurer depuis la sauvegarde'}
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => gmConfirm(t('mediaBrowser.purgeConfirm'), () => { void clearDB(); })}
                            className="flex items-center justify-center gap-2 rounded-lg py-2 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:bg-etat-danger/10 hover:text-etat-danger"
                        >
                            <Trash2 size={14} />
                            {t('mediaBrowser.purgeHub')}
                        </button>
                    </section>
                </aside>

                {/* ── La grille ── */}
                <div className="min-w-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {displayMedia.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-app-border text-center">
                            <UploadCloud size={40} className="text-app-subtle" />
                            <p className="font-display text-lg text-app-text">{t('mediaBrowser.noDataDetected')}</p>
                            <p className="max-w-sm text-sm text-app-muted">{t('mediaBrowser.noDataSub')}</p>
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setTypeFilter('all');
                                    setSelectedTags([]);
                                    setSelectedCollectionId(null);
                                    setCampaignFilterEnabled(false);
                                    setSmartFilter('none');
                                }}
                                className="rounded-lg border border-app-border px-4 py-2 text-ui-10 font-black uppercase tracking-widest text-app-muted hover:border-accent/50 hover:text-accent"
                            >
                                {t('mediaBrowser.resetFrequency')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4 pb-6">
                            {displayMedia.map(media => {
                                const choisi = editingMediaId === media.id;
                                return (
                                    <div
                                        key={media.id}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={choisi}
                                        onClick={() => setEditingMediaId(choisi ? null : media.id)}
                                        onDoubleClick={() => setPreviewItem(media)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') setEditingMediaId(media.id); }}
                                        className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-app-surface transition-colors ${
                                            choisi ? 'border-accent ring-1 ring-accent' : 'border-app-border hover:border-accent/50'
                                        }`}
                                    >
                                        <div className="relative aspect-[4/3] overflow-hidden bg-app-bg">
                                            <MediaItemThumbnail media={media} />
                                            {/* Le type et la taille, lisibles sans survoler */}
                                            <div className="absolute left-2 top-2 flex items-center gap-1.5">
                                                <span className="flex items-center gap-1 rounded bg-app-bg/85 px-1.5 py-0.5 text-ui-9 font-black uppercase tracking-widest text-app-text">
                                                    {TYPE_ICONS[media.type] || <FileText size={12} />}{t(`mediaBrowser.tabs.${media.type}`)}
                                                </span>
                                                {media.isPersistent && <span className="rounded bg-app-bg/85 p-1 text-accent" title={t('mediaBrowser.persistentBadge')}><Lock size={11} /></span>}
                                            </div>
                                            <span className="absolute bottom-2 right-2 rounded bg-app-bg/85 px-1.5 py-0.5 font-mono text-ui-9 font-bold text-app-text">{formatSize(media.size)}</span>
                                            {/*
                                              ⚠️ **La case reste visible dès qu'elle est cochée** : une
                                              sélection qu'on ne voit qu'en survolant est une sélection
                                              qu'on croit perdue.
                                            */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); basculerLaSelection(media.id); }}
                                                title={t('mediaBrowser.tags.selectionner')}
                                                aria-pressed={selectionMultiple.has(media.id)}
                                                className={`absolute right-2 top-2 flex size-7 items-center justify-center rounded-md border transition-opacity ${
                                                    selectionMultiple.has(media.id)
                                                        ? 'border-accent bg-accent text-app-on-accent opacity-100'
                                                        : 'border-app-border bg-app-bg/85 text-app-muted opacity-0 hover:border-accent/50 group-hover:opacity-100'
                                                }`}
                                            >
                                                <Check size={13} />
                                            </button>
                                        </div>

                                        <div className="flex flex-1 flex-col gap-2 p-3">
                                            <div className="flex items-start gap-2">
                                                <p className="min-w-0 flex-1 truncate text-sm font-bold text-app-text" title={media.name}>{media.name}</p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRenameMedia(media.id, media.name); }}
                                                    className="shrink-0 text-app-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
                                                    title={t('mediaBrowser.renameIdent')}
                                                    aria-label={t('mediaBrowser.renameIdent')}
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            </div>
                                            {/* Les étiquettes en pastilles — un clic filtre la grille */}
                                            <div className="flex min-h-[1.5rem] flex-wrap gap-1">
                                                {media.tags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
                                                            setSelectedCollectionId(null);
                                                            setSmartFilter('none');
                                                        }}
                                                        className={`rounded border px-1.5 py-0.5 text-ui-10 font-semibold transition-colors ${
                                                            selectedTags.includes(tag) ? 'border-accent/60 text-accent' : 'border-app-border text-app-muted hover:text-accent'
                                                        }`}
                                                    >
                                                        #{tag}
                                                    </button>
                                                ))}
                                                {media.tags.length === 0 && <span className="text-ui-10 italic text-app-subtle">{t('mediaBrowser.noTagTraces')}</span>}
                                                {estOrphelin(media.id) && (
                                                    <span className="flex items-center gap-1 rounded border border-dashed border-app-border px-1.5 py-0.5 text-ui-10 text-app-muted" title={t('mediaBrowser.orphanBadgeTitle')}>
                                                        <Unplug size={10} />{t('mediaBrowser.orphanBadge')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-auto flex items-center justify-end gap-1.5 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        gmConfirm(t('mediaBrowser.initiateDeletion', { name: media.name }), () => {
                                                            if (editingMediaId === media.id) setEditingMediaId(null);
                                                            void deleteMedia(media.id);
                                                        });
                                                    }}
                                                    className="rounded-md p-1.5 text-app-muted hover:bg-etat-danger/10 hover:text-etat-danger"
                                                    title={t('mediaBrowser.deleteAsset')}
                                                    aria-label={t('mediaBrowser.deleteAsset')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSelect(media.id); }}
                                                    className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-ui-10 font-black uppercase tracking-widest text-app-on-accent hover:brightness-110"
                                                    title={t('mediaBrowser.selectTransmission')}
                                                >
                                                    <Check size={13} strokeWidth={3} />{t('mediaBrowser.use')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── À droite : le média choisi ── */}
                {mediaChoisi && (
                    <TacticalDetailPanel
                        integre
                        media={mediaChoisi}
                        onClose={() => setEditingMediaId(null)}
                        collections={collections}
                        toggleMediaInCollection={toggleMediaInCollection}
                        updateMediaTags={updateMediaTags}
                        updateMediaCampaigns={updateMediaCampaigns}
                        toggleMediaPersistence={toggleMediaPersistence}
                        deleteMedia={deleteMedia}
                        campaigns={campaigns}
                        onSelect={onSelect}
                    />
                )}
            </div>
        </div>,
        document.body
    );
};
