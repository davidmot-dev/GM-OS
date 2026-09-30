import React from 'react';
// Let's use Lucide icons since it's the standard in this project.
import {
    Ban, Folder as FolderIcon, Star as StarIcon, Search as SearchIcon,
    Plus, RotateCcw, ChevronLeft, ChevronRight, Film, Images, Moon, Monitor, SlidersHorizontal, Power
} from 'lucide-react';

import { useImageStore } from './useImageStore';
import ImagePad from './components/ImagePad';
import PanneauDesDiaporamas from './components/PanneauDesDiaporamas';
import { MediaBrowser } from '../../components/MediaBrowser';
import { useMediaStore } from '../../stores/useMediaStore';
import { gmConfirm, gmPrompt } from '../../stores/useModalStore';
import { gmToast } from '../../stores/useToastStore';
import { mediasRestituables, restaurerLesMedias } from '../session/logic/MiroirDesMedias';
import { useHardwareStore } from '../../stores/useHardwareStore';
import { estUneVideo } from '../../stores/typesDeMedia';
import { useTranslation } from 'react-i18next';
import { Bouton, Etiquette, EnTeteDeModule, GabaritDeModule, Panneau } from '../../components/socle';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';
import EnDirect from './components/EnDirect';

const ImageDashboard: React.FC = () => {
    const {
        mediaList, projectionTarget, setProjectionTarget, projections,
        avancerLeDiaporama, arreterLeDiaporama, blackout, blackoutAll, noirTotal, addMedia, displays, fetchDisplays,
        folders, activeFolderId, setActiveFolderId, addFolder, removeFolder,
        currentView, setCurrentView, reset
    } = useImageStore();
    const { t } = useTranslation(['modules', 'common']);
    const { getDisplayLabel } = useHardwareStore();

    React.useEffect(() => {
        fetchDisplays();
    }, [fetchDisplays]);

    const { mediaList: storeMediaList } = useMediaStore();
    const [isBrowserOpen, setIsBrowserOpen] = React.useState(false);

    /**
     * **Ce que le miroir peut rendre — chantier n° 4.**
     *
     * On recompte à chaque changement de la bibliothèque : après une
     * restauration le compte tombe à zéro et le bandeau disparaît de lui-même,
     * plutôt que de rester à proposer un geste déjà fait.
     */
    const [aRestituer, setARestituer] = React.useState(0);
    const [restauration, setRestauration] = React.useState(false);

    React.useEffect(() => {
        let annule = false;
        void mediasRestituables()
            .then(ids => { if (!annule) setARestituer(ids.length); })
            .catch(() => { /* pas de miroir joignable : rien à proposer */ });
        return () => { annule = true; };
    }, [storeMediaList.length]);

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

    const handleUploadClick = () => {
        setIsBrowserOpen(true);
    };

    const handleMediaSelect = (mediaId: string) => {
        const media = storeMediaList.find(m => m.id === mediaId);
        if (!media) return;

        addMedia({
            name: media.name,
            path: mediaId,
            sizeInfo: `${(media.size / (1024 * 1024)).toFixed(1)}MB`,
            /*
              **Ce que le Hub sait déjà, le pad n'a pas à le redeviner.** Le Media
              Hub a classé le fichier à l'import, avec sa table d'extensions ; on
              recopie son verdict plutôt que d'en rendre un second. *Deux
              classements pour un même fichier finissent par se contredire* — le
              motif payé sur ce projet plus souvent qu'aucun autre.
            */
            type: media.type === 'video' ? 'video' : 'image',
        });
    };

    const handleCreateFolder = () => {
        gmPrompt(t('image.folders.newPrompt'), '', (name) => {
            if (name) {
                addFolder(name);
            }
        });
    };

    const diaporamaEnCours = useImageStore(state => state.diaporamaEnCours);
    const nomDuDiaporamaEnCours = useImageStore(
        state => state.diaporamas.find(d => d.id === state.diaporamaEnCours?.id)?.nom ?? '',
    );

    const volumeVideo = useImageStore(state => state.volumeVideo);
    const setVolumeVideo = useImageStore(state => state.setVolumeVideo);

    /* Le champ d'abord, le nom en repli : les pads d'avant le 2026-09-05 n'ont
       pas de `type`. Même règle que dans le pad. */
    const contientUneVideo = mediaList.some(
        (m) => (m.type ? m.type === 'video' : estUneVideo(m.name)),
    );

    /*
      **La recherche filtre, enfin.** Le champ existait depuis longtemps et
      n'était relié à rien — *un champ qui ne répond pas apprend à ne plus
      chercher.* Le nom seul, sans casse ni accents.
    */
    const [recherche, setRecherche] = React.useState('');
    const plier = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    let displayedMedia = mediaList;
    if (currentView === 'favorites') {
        displayedMedia = mediaList.filter(m => m.isFavorite);
    } else if (activeFolderId) {
        displayedMedia = mediaList.filter(m => m.folderId === activeFolderId);
    }
    if (recherche.trim()) {
        const cherche = plier(recherche.trim());
        displayedMedia = displayedMedia.filter(m => plier(m.name).includes(cherche));
    }

    const currentFolderName = currentView === 'favorites'
        ? t('image.sidebar.favorites')
        : (activeFolderId
            ? folders.find(f => f.id === activeFolderId)?.name || t('common:unknown')
            : t('image.sidebar.mediaLibrary'));


    /*
      **L'étape 2 du lot 1 — Image-OS réagencé dans la grammaire commune**
      (2026-09-30). La barre porte l'action (ajouter, chercher, feuilleter le
      diaporama qui tourne) ; le centre montre **ce qui est en direct** puis la
      bibliothèque, où un clic projette ; à droite, ce qui se règle : l'écran
      cible, les arrêts d'urgence, les dossiers, le son des vidéos, le stockage.

      Retirés : le bouton « Filtre » et la pastille « GM », qui ne faisaient
      rien, et « Derniers uploads », grisé depuis toujours. *Un bouton qui ne
      fait rien est pire qu'un bouton absent.*
    */
    const regime = useRegimeDInterface();
    const [reglagesOuverts, setReglagesOuverts] = React.useState(true);
    const projectionActive = Object.values(projections).some(Boolean);
    const titreDeSection = 'text-ui-11 font-semibold text-app-muted uppercase tracking-widest';

    const onglet = (actif: boolean) => `flex items-center gap-2 px-4 py-2 border-b-2 text-ui-11 font-bold uppercase tracking-widest transition-colors ${actif
        ? 'border-accent text-accent'
        : 'border-transparent text-app-muted hover:text-app-text'}`;

    const reglages = (
        <>
            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-3">
                <h2 className={titreDeSection}>{t('image.agencement.ecranCible')}</h2>
                <div className="grid grid-cols-2 gap-1.5">
                    {['hub', ...displays.map(d => d.id)].map(id => (
                        <button
                            key={id}
                            onClick={() => setProjectionTarget(id)}
                            aria-pressed={projectionTarget === id}
                            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-ui-10 font-black uppercase tracking-widest transition-all ${projectionTarget === id
                                ? 'bg-accent text-app-on-accent border-accent'
                                : 'bg-app-bg border-app-border text-app-muted hover:text-app-text hover:border-accent/50'}`}
                        >
                            {getDisplayLabel(id)}
                        </button>
                    ))}
                </div>
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-2">
                <h2 className={titreDeSection}>{t('image.agencement.urgence')}</h2>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={blackout}
                        className="bg-etat-danger/10 border border-etat-danger/30 text-etat-danger hover:bg-etat-danger/20 font-black py-3 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-ui-10 tracking-[0.2em]"
                        title={t('image.dashboard.blackout.targetTooltip')}
                    >
                        <Ban size={16} />
                        {t('image.dashboard.blackout.target')}
                    </button>
                    <button
                        onClick={blackoutAll}
                        className="bg-etat-danger hover:bg-etat-danger/90 text-app-bg font-black py-3 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-ui-10 tracking-[0.2em]"
                        title={t('image.dashboard.blackout.allTooltip')}
                    >
                        <Power size={16} />
                        {t('image.dashboard.blackout.all')}
                    </button>
                </div>

                {/*
                  ⭐ **Le vrai noir a SON bouton, et il ne prend celui de
                  personne.**

                  ⛔ Le 2026-09-17 au soir, j'avais rebranché les deux boutons
                  ci-dessus sur l'extinction, au motif que leur infobulle disait
                  « Éteindre l'écran ». Or ce sont ceux que David utilise pour
                  **arrêter une projection** : le lendemain matin, *« quand
                  j'arrête de projeter je tombe sur un écran noir »*.

                  ⭐ ***Un libellé décrit une intention ; un geste quotidien EST
                  une intention.*** Quand les deux se contredisent, c'est le geste
                  qui a raison — on corrige le libellé, on ne détourne pas le
                  bouton.
                */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={noirTotal}
                        className="bg-app-bg border border-app-border text-app-muted hover:text-app-text hover:border-app-text/30 font-black py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-ui-10 tracking-[0.2em]"
                        title={t('image.dashboard.blackout.darkTooltip')}
                    >
                        <Moon size={14} />
                        {t('image.dashboard.blackout.dark')}
                    </button>
                    <button
                        onClick={() => gmConfirm(t('image.dashboard.resetConfirm'), () => reset())}
                        className="bg-app-bg border border-etat-danger/20 text-etat-danger/70 hover:bg-etat-danger/10 hover:text-etat-danger font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-ui-10 tracking-widest uppercase"
                        title={t('image.dashboard.resetTooltip')}
                    >
                        <RotateCcw size={13} />
                        {t('image.dashboard.restoreDefault')}
                    </button>
                </div>
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h2 className={titreDeSection}>{t('image.sidebar.folderTree')}</h2>
                    <button onClick={handleCreateFolder} className="text-app-muted hover:text-accent transition-colors" title={t('image.folders.new')}>
                        <Plus size={14} />
                    </button>
                </div>
                <div className="space-y-0.5">
                    <button
                        onClick={() => { setCurrentView('library'); setActiveFolderId(null); }}
                        className={`w-full flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg transition-colors ${currentView === 'library' && activeFolderId === null ? 'bg-accent/15 text-accent' : 'text-app-muted hover:bg-app-surface-2 hover:text-app-text'}`}
                    >
                        <FolderIcon size={14} />
                        <span className="flex-1 truncate text-left">{t('image.sidebar.mediaLibrary')}</span>
                        <span className="text-ui-10 tabular-nums text-app-subtle">{mediaList.length}</span>
                    </button>
                    {folders.map(folder => (
                        <div
                            key={folder.id}
                            onClick={() => { setCurrentView('library'); setActiveFolderId(folder.id); }}
                            className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg cursor-pointer transition-colors group ${currentView === 'library' && activeFolderId === folder.id ? 'bg-accent/15 text-accent' : 'text-app-muted hover:bg-app-surface-2 hover:text-app-text'}`}
                        >
                            <FolderIcon size={14} />
                            <span className="flex-1 truncate">{folder.name}</span>
                            <span className="text-ui-10 tabular-nums text-app-subtle group-hover:hidden">{mediaList.filter(m => m.folderId === folder.id).length}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeFolder(folder.id); }}
                                className="hidden group-hover:block text-app-subtle hover:text-etat-danger transition-all p-0.5"
                                title={t('image.folders.delete')}
                            >
                                <Ban size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-3">
                {/*
                    **Le niveau des vidéos — 2026-09-05.**

                    Il ne remplace pas le volume général : il s'y multiplie,
                    comme la tranche d'un module sur une console. *On calme une
                    vidéo trop forte sans toucher à la musique, et on coupe toute
                    la table d'un seul geste ailleurs.*

                    Il n'apparaît que si la bibliothèque contient une vidéo : un
                    réglage qui ne s'applique à rien n'apprend rien.
                */}
                {contientUneVideo && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-ui-10 text-app-muted uppercase tracking-widest font-bold">
                            <span className="flex items-center gap-1.5"><Film size={12} /> Son des vidéos</span>
                            <span className="tabular-nums text-app-text">{Math.round(volumeVideo * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={volumeVideo}
                            onChange={(e) => setVolumeVideo(Number(e.target.value))}
                            aria-label="Niveau sonore des vidéos projetées"
                            className="w-full accent-accent cursor-pointer"
                        />
                        <p className="text-ui-10 text-app-subtle leading-snug normal-case">
                            Le volume général, le Focus et la voix s'y appliquent aussi.
                        </p>
                    </div>
                )}

                <div className="flex justify-between items-center text-ui-10 text-app-muted uppercase tracking-widest font-bold">
                    <span>{t('image.sidebar.localStorage')}</span>
                    <span>{t('image.storage.itemsCount', { count: mediaList.length })}</span>
                </div>

                {/*
                    **Le retour du miroir — chantier n° 4.**

                    Il n'apparaît que quand le miroir porte des médias que cette
                    bibliothèque n'a plus : le profil neuf, l'ordinateur changé,
                    la base effacée. *Un bouton qui ne dit pas ce qu'il va faire
                    n'est pas cliqué le jour où il faudrait, et il est cliqué le
                    jour où il ne faudrait pas* — d'où le compte, annoncé avant.
                */}
                {aRestituer > 0 && (
                    <div className="p-3 bg-etat-succes/5 border border-etat-succes/20 rounded-lg space-y-2">
                        <p className="text-ui-11 text-etat-succes/80 leading-relaxed normal-case">
                            {aRestituer} média{aRestituer > 1 ? 's' : ''} présent
                            {aRestituer > 1 ? 's' : ''} dans la sauvegarde et absent
                            {aRestituer > 1 ? 's' : ''} d'ici.
                        </p>
                        <button
                            type="button"
                            disabled={restauration}
                            onClick={lancerLaRestauration}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-etat-succes/10 border border-etat-succes/30 rounded-lg text-ui-10 font-black uppercase tracking-widest text-etat-succes hover:bg-etat-succes/20 transition-colors disabled:opacity-30"
                        >
                            <RotateCcw size={13} />
                            {restauration ? 'Restauration…' : 'Restaurer depuis la sauvegarde'}
                        </button>
                    </div>
                )}
            </Panneau>
        </>
    );

    const barreDOutils = (
        <>
            <Bouton variante="accent" aLaTable={regime.aLaTable} icone={<Plus size={18} />} onClick={handleUploadClick}>
                {t('image.dashboard.addNew')}
            </Bouton>

            <div className="relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle" />
                <input
                    value={recherche}
                    onChange={e => setRecherche(e.target.value)}
                    className="bg-app-surface border border-app-border rounded-lg pl-9 pr-3 py-2 text-sm w-64 focus:outline-none focus:border-accent text-app-text"
                    placeholder={t('image.agencement.recherche')}
                    aria-label={t('image.agencement.recherche')}
                    type="search"
                />
            </div>

            {/*
              **Les flèches feuillettent le diaporama en cours.**

              Elles pilotaient une « séquence » invisible : une case à cocher par
              image, une seule liste globale, sans nom, sans cadence et sans
              fondu. *Deux notions d'ordre dans un même module finissent toujours
              par diverger* — absorbée le 2026-09-13, sur décision de David.

              Elles ne se montrent que quand un diaporama tourne : un bouton qui
              ne fait rien est pire qu'un bouton absent, on finit par ne plus le
              voir.
            */}
            {diaporamaEnCours && (
                <div className="flex bg-app-surface rounded-lg border border-app-border overflow-hidden">
                    <button
                        onClick={() => avancerLeDiaporama(-1)}
                        className="px-2 hover:bg-app-surface-2 text-app-muted hover:text-app-text transition-colors"
                        title={t('common:previous')}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={arreterLeDiaporama}
                        className="bg-etat-succes/15 text-etat-succes px-5 py-2 font-bold text-sm tracking-wide hover:bg-etat-succes/25 transition-all flex items-center gap-2"
                        title={t('image.diaporama.arreter')}
                    >
                        <span className="w-2 h-2 rounded-full bg-etat-succes animate-pulse" />
                        {nomDuDiaporamaEnCours}
                    </button>
                    <button
                        onClick={() => avancerLeDiaporama(1)}
                        className="px-2 hover:bg-app-surface-2 text-app-muted hover:text-app-text transition-colors border-l border-app-border"
                        title={t('common:next')}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </>
    );

    return (
        <>
            <MediaBrowser
                isOpen={isBrowserOpen}
                onClose={() => setIsBrowserOpen(false)}
                onSelect={handleMediaSelect}
                /*
                  **Les vidéos entrent le 2026-09-05.** Le projecteur savait les
                  jouer depuis longtemps ; c'est ce filtre, et lui seul, qui
                  interdisait d'en poser une sur le tableau. *Une capacité qu'on
                  ne peut pas atteindre n'existe pas.*
                */
                allowedTypes={['image', 'video']}
                title={t('image.sidebar.mediaLibrary')}
            />

            <GabaritDeModule
                aLaTable={regime.aLaTable}
                reglagesOuverts={reglagesOuverts}
                className="text-app-text"
                entete={
                    <EnTeteDeModule
                        titre={t('names.image')}
                        etat={<>
                            {projectionActive && <Etiquette ton="accent">{t('image.agencement.projectionActive')}</Etiquette>}
                            <Etiquette><Monitor size={11} /> {t('image.agencement.ecran', { ecran: getDisplayLabel(projectionTarget as string) })}</Etiquette>
                            <Etiquette>{t('image.agencement.medias', { count: mediaList.length })}</Etiquette>
                        </>}
                        actions={regime.aLaTable ? (
                            <Bouton aLaTable icone={<SlidersHorizontal size={16} />} aria-pressed={reglagesOuverts} onClick={() => setReglagesOuverts(!reglagesOuverts)}>
                                {t('image.agencement.reglages')}
                            </Bouton>
                        ) : undefined}
                    />
                }
                barreDOutils={barreDOutils}
                reglages={reglages}
            >
                <div className="flex flex-col gap-4 pb-4">
                    <nav className="flex gap-1 border-b border-app-border" aria-label="Vues d'Image-OS">
                        <button
                            onClick={() => { setCurrentView('library'); setActiveFolderId(null); }}
                            aria-pressed={currentView === 'library'}
                            className={onglet(currentView === 'library')}
                        >
                            <FolderIcon size={14} /> {t('image.sidebar.mediaLibrary')}
                        </button>
                        <button
                            onClick={() => setCurrentView('diaporamas')}
                            aria-pressed={currentView === 'diaporamas'}
                            className={onglet(currentView === 'diaporamas')}
                        >
                            <Images size={14} /> <span>{t('image.diaporama.titre')}</span>
                        </button>
                        <button
                            onClick={() => setCurrentView('favorites')}
                            aria-pressed={currentView === 'favorites'}
                            className={onglet(currentView === 'favorites')}
                        >
                            <StarIcon size={14} /> {t('image.sidebar.favorites')}
                        </button>
                    </nav>

                    {currentView === 'diaporamas' ? <PanneauDesDiaporamas /> : <>
                        <EnDirect aLaTable={regime.aLaTable} />

                        <h2 className="font-display text-lg font-bold text-app-text">{currentFolderName}</h2>

                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                            {displayedMedia.map(media => (
                                <ImagePad key={media.id} media={media} />
                            ))}

                            {/* Empty State / Add New */}
                            {!recherche.trim() && (
                                <div
                                    onClick={handleUploadClick}
                                    className="group aspect-video rounded-2xl bg-app-surface/20 border-2 border-dashed border-app-border flex flex-col items-center justify-center gap-3 hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-full bg-app-surface flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors">
                                        <Plus size={24} />
                                    </div>
                                    <p className="text-app-subtle font-bold text-sm group-hover:text-accent transition-colors">{t('image.dashboard.addNew')}</p>
                                </div>
                            )}
                        </div>
                        {recherche.trim() && displayedMedia.length === 0 && (
                            <p className="text-sm text-app-muted italic">{t('image.agencement.aucunResultat', { recherche: recherche.trim() })}</p>
                        )}
                    </>}
                </div>
            </GabaritDeModule>
        </>
    );
};

export default ImageDashboard;
