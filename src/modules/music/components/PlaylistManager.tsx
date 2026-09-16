import React, { useState, useMemo } from 'react';
import { Music, Link, Edit3, Trash2, GripVertical, MoreHorizontal, Lightbulb, Plus, X } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { usePlaylistsVisibles } from '../usePlaylistsVisibles';
import type { MusicPad as MusicPadType } from '../useMusicStore';
import { gmPrompt, gmConfirm, gmCustom } from '../../../stores/useModalStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaStore } from '../../../stores/useMediaStore';
import { couleurDeLaPastille } from '../logic/couleursDePastille';

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Pad: React.FC<{ pad: MusicPadType; index: number; playlistId: string; onRequestMediaBrowser: () => void }> = ({ pad, index, playlistId, onRequestMediaBrowser }) => {
    const { playPad, loadToDeck, updatePad, retirerUnPad, deckA, deckB, isKeyLearnActive, activePadLearnInfo, setActiveLearnPad } = useMusicStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOver, setIsOver] = useState(false);

    const isPlayingOnA = deckA.activePadId === pad.id && deckA.isPlaying;
    const isPlayingOnB = deckB.activePadId === pad.id && deckB.isPlaying;
    const isPlaying = isPlayingOnA || isPlayingOnB;

    const isLearningThis = activePadLearnInfo?.playlistId === playlistId && activePadLearnInfo?.padIndex === index;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: pad.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        /*
          La tuile dont le menu est ouvert passe DEVANT ses voisines. Sans ça,
          la bulle qui déborde passerait sous les tuiles dessinées après elle —
          *un élément ne peut pas sortir de l'ordre de peinture de son parent.*
        */
        zIndex: isMenuOpen ? 60 : isDragging ? 50 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    const handlePadClick = () => {
        if (isKeyLearnActive) {
            setActiveLearnPad(playlistId, index);
            return;
        }

        if (isMenuOpen) return;
        if (!pad.url) {
            gmConfirm(
                "Source de la musique :",
                // Confirm -> Fichier Local
                () => {
                    onRequestMediaBrowser();
                },
                // Cancel -> Lien Externe
                () => {
                    gmPrompt("Lien externe (YouTube, Spotify, Deezer) :", "", (url) => {
                        if (url) {
                            const label = url.split('/').pop()?.split('?')[0] || "Lien Externe";
                            updatePad(playlistId, index, { url, label, type: 'link' });
                        }
                    });
                },
                "Fichier Local",
                "Lien Externe"
            );

            return;
        }
        playPad(pad);
    };

    /*
      **Un seul endroit pour le nom, la couleur et la touche** — demandé par
      David le 2026-09-16. C'était `gmPrompt("Nouveau Label :")`, et la touche
      vivait ailleurs, derrière le mode global Key Learn. *Un réglage qu'on
      atteint par trois chemins différents n'est pas trois fois plus accessible :
      il est introuvable deux fois sur trois.*
    */
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        gmCustom('music-pad-edit', { playlistId, padIndex: index });
    };


    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            // @ts-expect-error global
            const path = window.appBridge ? window.appBridge.getPathForFile(file) : (file.path || file.name);
            updatePad(playlistId, index, { url: path, label: file.name, type: 'local' });
        }
    };

    const teinte = couleurDeLaPastille(pad.couleur);

    const keyLabel = pad.keybind ? pad.keybind.replace('Key', '').replace('Numpad', 'NUM ') : '';

    /*
      **Retirer une pastille vide ne demande rien ; retirer une pastille garnie
      demande.** Une case vide n'est qu'un emplacement — la reprendre ne coûte
      rien. Une case garnie porte un morceau, un nom, une touche de clavier, une
      scène lumineuse et, depuis aujourd'hui, une plage de lecture : *tout ça
      disparaît d'un clic, et rien ne le rend.*
    */
    const handleRetirer = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        if (!pad.url) {
            retirerUnPad(playlistId, index);
            return;
        }
        gmConfirm(
            `Retirer « ${pad.label} » de cette playlist ? Le fichier reste dans la médiathèque, mais la touche, la scène lumineuse et la plage de lecture de cette pastille sont perdues.`,
            () => retirerUnPad(playlistId, index)
        );
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={handlePadClick}
            onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePadClick(); } }}
            className={`aspect-square rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-300 relative group shadow-2xl
                ${isLearningThis
                    ? 'border-cyan-500 bg-cyan-900/40 shadow-glow-cyan'
                    : isPlaying
                        /* `animate-jitter` étirait la tuile entière de 30 % deux
                           fois par seconde — l'animation des barres du Deck,
                           appliquée à un carré de 300 px. Remplacée par un halo
                           qui respire : voir `souffle-du-morceau` dans
                           `index.css`. Le `scale-[1.05]`, jusqu'ici annulé par
                           le `transform` du jitter, devient la marque fixe. */
                        ? 'bg-accent/40 border-accent animate-souffle-du-morceau scale-[1.05]'
                        /* La couleur marque l'identité AU REPOS seulement : une
                           pastille qui joue garde le halo d'accent, commun à toutes.
                           *Ce qui sonne doit se repérer d'un coup d'œil, et une
                           couleur par pastille rendrait cet état-là illisible.* */
                        : `${teinte.tuile} hover:shadow-glow-accent/20 hover:scale-[1.02]`
                } ${isOver && !isLearningThis ? 'border-accent bg-accent/10' : ''} cursor-pointer`}
        >
            {/* Premium Glossy Overlay */}
            {/* `rounded-3xl` porté ici depuis que la tuile ne rogne plus : c'est
                elle qui arrondissait ces deux voiles. */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/[0.08] via-transparent to-transparent pointer-events-none opacity-50" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Keybind Indicator */}
            {keyLabel && (
                <div className={`absolute top-2 left-2 border text-ui-7 font-black px-1.5 py-0.5 rounded-md shadow-sm transition-all uppercase tracking-widest ${isLearningThis ? 'bg-cyan-900 text-cyan-400 border-cyan-500' : 'bg-app-bg text-slate-500 border-app-border/50 opacity-60 group-hover:opacity-100 group-hover:text-accent group-hover:border-accent/40'}`}>
                    {keyLabel}
                </div>
            )}

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className={`absolute top-2 right-2 p-1.5 text-slate-700 hover:text-white cursor-grab active:cursor-grabbing ${isLearningThis ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}
            >
                <GripVertical size={12} />
            </div>

            {/* Light Link Indicator */}
            {pad.linkedLightSceneId && (
                <div className="absolute bottom-2 left-2 p-1.5 text-gm-cyan drop-shadow-glow-cyan animate-pulse">
                    <Lightbulb size={12} fill="currentColor" />
                </div>
            )}



            <div className={`transition-all duration-500 ${isPlaying || isLearningThis ? (isLearningThis ? 'text-cyan-400 scale-110 drop-shadow-glow-cyan' : 'text-accent scale-110 drop-shadow-glow-accent') : teinte.icone}`}>
                {pad.type === 'link' ? <Link size={36} strokeWidth={1} /> : <Music size={36} strokeWidth={1} />}
            </div>

            <div className="mt-3 px-3 w-full text-center">
                <span className={`text-ui-10 font-black uppercase tracking-widest line-clamp-1 transition-colors ${isPlaying || isLearningThis ? 'text-white drop-shadow-sm' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {pad.label}
                </span>
                {/*
                  ⛔ **L'identifiant interne ne s'affiche plus.** Il tenait une
                  ligne sous le nom, en `text-white/20` : décoratif au mieux —
                  et pour toute pastille née d'une playlist créée au bouton
                  « + », c'était un **UUID de 36 caractères**, qui passait à la
                  ligne et mangeait la tuile. *Un identifiant technique ne dit
                  rien au meneur ; il ne dit quelque chose qu'à celui qui
                  débogue, et celui-là a la console.* Retiré sur demande de
                  David le 2026-09-16, après sa capture d'une tuile illisible.
                */}
                {isPlaying && (
                    <div className="flex justify-center gap-0.5 mt-1.5">
                        <div className="w-0.5 h-2 bg-accent rounded-full animate-bounce shadow-glow-accent" style={{ animationDelay: '0ms' }} />
                        <div className="w-0.5 h-2 bg-accent rounded-full animate-bounce shadow-glow-accent" style={{ animationDelay: '100ms' }} />
                        <div className="w-0.5 h-2 bg-accent rounded-full animate-bounce shadow-glow-accent" style={{ animationDelay: '200ms' }} />
                    </div>
                )}
            </div>

            {/*
              **La croix de retrait au milieu en bas — demandé par David le
              2026-09-16**, après que le menu a débordé de la tuile.

              Les trois autres coins sont pris : la touche en haut à gauche, la
              poignée de déplacement en haut à droite, la scène lumineuse en bas
              à gauche, et le menu « … » en bas à droite. **Le milieu du bas est
              le seul emplacement libre** — c'est d'ailleurs pourquoi ma première
              tentative l'avait posée SOUS le bouton « … », inatteignable.

              Elle sort du menu parce que le menu, lui, ne tient plus : sa
              hauteur est fixe et je viens de rétrécir les tuiles. *Une commande
              de plus dans une boîte de taille fixe pousse la dernière dehors,
              et rien ne le signale.*
            */}
            <button
                onClick={handleRetirer}
                title="Retirer cette pastille"
                className={`absolute bottom-2 left-1/2 -translate-x-1/2 p-1.5 rounded-lg text-slate-700 hover:text-red-500 hover:bg-red-500/10 transition-colors ${isLearningThis ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}
            >
                <X size={12} />
            </button>

            {/* More Menu Trigger */}
            <div
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }}
                className={`absolute bottom-2 right-2 p-1.5 text-slate-700 hover:text-white ${isLearningThis ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}
            >
                <MoreHorizontal size={14} />
            </div>

            {isMenuOpen && !isLearningThis && (
                /*
                  **Le menu déborde de la tuile — tranché par David le 2026-09-16.**

                  Il était en `inset-0` : enfermé dans le carré, donc **sa taille
                  dépendait de celle des pastilles**. Deux allers-retours en une
                  soirée l'ont prouvé — il rognait sa dernière entrée quand la
                  grille se densifiait, puis les tuiles assez grandes pour lui
                  étaient *« trop grandes »*. *Un menu dont la taille dépend de
                  la vignette qu'il recouvre n'a pas de taille à lui.*

                  Il prend donc sa largeur propre et passe **par-dessus les
                  tuiles voisines**, comme n'importe quelle bulle. Les libellés
                  restent en toutes lettres : David a déjà dit qu'un menu « trois
                  points » ne dit rien de ce qu'il cache — des icônes seules
                  auraient aggravé exactement ça.
                */
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[13rem] max-h-[22rem] bg-app-bg/98 border border-app-border/60 shadow-2xl z-50 flex flex-col items-center justify-start p-4 gap-2 rounded-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto custom-scrollbar">
                    <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} className="text-ui-9 font-black text-slate-500 mb-2 hover:text-white uppercase tracking-[0.2em]">Retour</button>
                    <button
                        onClick={handleEdit}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-app-surface border border-app-border/50 hover:bg-accent hover:border-accent text-ui-10 font-black uppercase tracking-widest transition-all"
                    >
                        <Edit3 size={12} /> ÉDITER
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            updatePad(playlistId, index, { 
                                url: '', 
                                label: `Pad ${index + 1}`, 
                                type: 'local', 
                                keybind: undefined,
                                linkedLightSceneId: undefined,
                                loopA: null,
                                loopB: null
                            });
                            setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-app-surface border border-app-border/50 hover:bg-red-600 hover:border-red-600 text-ui-10 font-black uppercase tracking-widest transition-all"
                    >
                        <Trash2 size={12} /> VIDER
                    </button>
                    {/*
                      **Précharger sans lancer — demandé par David le 2026-08-30.**

                      Le clic sur une pastille charge ET enchaîne la transition ;
                      il n'existait aucun moyen de préparer un morceau. La
                      brique, elle, existait depuis toujours : `loadToDeck` ne
                      fait que charger. *Il manquait le geste, pas le moteur.*

                      Avec la barre de position devenue manipulable, les deux se
                      complètent : on charge sur la platine libre, on cale
                      l'endroit, puis on lance quand la scène le demande.

                      ⚠ **Une platine en lecture le dit.** Charger dessus coupe
                      net ce qu'elle joue — irrattrapable en pleine séance. On ne
                      l'interdit pas : le meneur a parfois de bonnes raisons de
                      remplacer. Mais il le sait **avant** de cliquer, et pas
                      après.
                    */}
                    <div className="w-full flex items-center gap-2">
                        <span className="text-ui-9 font-black uppercase tracking-widest text-slate-600 shrink-0">Charger</span>
                        {(['A', 'B'] as const).map((platine) => {
                            const occupee = platine === 'A' ? isPlayingOnA : isPlayingOnB;
                            const enLecture = platine === 'A' ? deckA.isPlaying : deckB.isPlaying;
                            return (
                                <button
                                    key={platine}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void loadToDeck(platine, pad);
                                        setIsMenuOpen(false);
                                    }}
                                    title={enLecture
                                        ? `Charger sur la platine ${platine} — elle joue : la piste en cours sera coupée`
                                        : `Charger sur la platine ${platine} sans lancer la lecture`}
                                    className={`flex-1 py-2.5 rounded-xl border text-ui-10 font-black uppercase tracking-widest transition-all ${
                                        enLecture
                                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black'
                                            : 'bg-app-surface border-app-border/50 hover:bg-accent hover:border-accent'
                                    } ${occupee ? 'ring-1 ring-accent/40' : ''}`}
                                >
                                    {platine}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            gmCustom('light-scene-select', {
                                type: 'music',
                                playlistId,
                                padIndex: index
                            });
                            setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-ui-10 font-black uppercase tracking-widest transition-all ${pad.linkedLightSceneId ? 'bg-gm-cyan/20 border-gm-cyan text-gm-cyan' : 'bg-app-surface border-app-border/50 hover:bg-gm-cyan hover:border-gm-cyan'}`}
                    >
                        <Lightbulb size={12} /> {pad.linkedLightSceneId ? 'LIÉ' : 'LIER LUMIÈRE'}
                    </button>
                </div>
            )}
        </div>
    );
};


const PlaylistManager: React.FC = () => {
    const { reorderPads, updatePad, ajouterUnPad } = useMusicStore();

    /*
      La sélection et le filtrage par campagne vivent dans un seul endroit
      (`usePlaylistsVisibles`) — cet écran en tenait auparavant sa propre
      copie, à l'identique de celle du `MusicHeader`. Deux copies ne
      divergeaient pas tant que la liste ne rétrécissait jamais.
    */
    const { active: activePlaylist, campagneId } = usePlaylistsVisibles();

    // Media Browser State
    const [browserTarget, setBrowserTarget] = useState<{ index: number, playlistId: string } | null>(null);

    const handleMediaSelect = (mediaId: string) => {
        if (browserTarget) {
            const { mediaList } = useMediaStore.getState();
            const media = mediaList.find((m: { id: string; name: string }) => m.id === mediaId);
            if (media) {
                updatePad(browserTarget.playlistId, browserTarget.index, { url: mediaId, label: media.name, type: 'local' });
            }
            setBrowserTarget(null);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (activePlaylist && over && active.id !== over.id) {
            const oldIndex = activePlaylist.pads.findIndex(p => p.id === active.id);
            const newIndex = activePlaylist.pads.findIndex(p => p.id === over.id);
            reorderPads(activePlaylist.id, oldIndex, newIndex);
        }
    };

    const padIds = useMemo(() => activePlaylist?.pads.map(p => p.id) || [], [activePlaylist]);

    /*
      **L'écran vide se nomme.** Une campagne neuve n'a aucune atmosphère à
      elle, et il peut n'exister aucune commune : le composant rendait alors
      `null`, c'est-à-dire un panneau vide sans la moindre explication. Depuis
      que les atmosphères appartiennent à une campagne, ce vide-là est un cas
      normal, et un vide normal qui ressemble à une panne finit par être
      signalé comme une panne.
    */
    if (!activePlaylist) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Music size={32} strokeWidth={1} className="text-slate-700" />
                <p className="text-ui-10 font-black uppercase tracking-widest text-slate-500">
                    Aucune atmosphère pour cette campagne
                </p>
                <p className="text-ui-10 text-slate-600 max-w-sm leading-relaxed">
                    {campagneId === null
                        ? 'Créez-en une avec le + du bandeau.'
                        : 'Créez-en une avec le + du bandeau, ou rendez une atmosphère existante « commune » depuis la campagne qui la détient — elle apparaîtra alors partout.'}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <MediaBrowser
                isOpen={!!browserTarget}
                onClose={() => setBrowserTarget(null)}
                onSelect={handleMediaSelect}
                allowedTypes={['audio']}
                title="Sélectionner une Musique"
            />
            {/*
              ⛔ **`.slice(0, 5)` retiré des DEUX endroits — il cachait des
              données.** La refonte `da7979d2` a fait passer les playlists de
              **seize** pastilles à cinq, et a coupé l'affichage au passage : les
              playlists nées avant gardaient leurs seize pads, **dont onze que
              plus aucune tuile ne montrait**.

              Et la coupe n'était pas partout : `padDuRaccourci` parcourt tous
              les pads, donc **une pastille invisible avec une touche attribuée
              jouait toujours**. Le fichier du clavier promet pourtant que *« le
              clavier voit exactement ce que l'écran montre »* — c'était vrai sur
              l'axe des campagnes, faux sur celui-ci.

              ⭐ **On fixe une TAILLE de tuile, plus un nombre de colonnes.**
              David, capture à l'appui : *« les pads sont trop grand, remets
              comme avant »*. C'est le troisième réglage de cette grille en une
              soirée — cinq colonnes, puis huit, puis six — et à chaque fois le
              nombre de colonnes décidait de la taille des carrés, donc **le
              résultat dépendait de la largeur de la fenêtre** : six colonnes
              donnaient 253 px chez lui, et deux rangées pour huit pastilles.

              `auto-fill` inverse la question : on énonce la taille voulue, la
              grille en met autant que la largeur permet. *Ce qu'on veut tenir
              stable, c'est la tuile ; le nombre de colonnes n'est qu'une
              conséquence.*

              ⚠️ **11rem et non 11 × 16 px** : la racine porte `font-size: 85%`,
              donc un `rem` vaut **13,6 px** — c'est le piège déjà payé le 05/09
              sur la conversion des 1 832 tailles. 11rem ≈ 150 px de plancher,
              soit ~160 px réels et neuf tuiles par rangée sur son écran.

              ⛔ **Le plafond était à HUIT, et ça cassait le menu de la tuile.**
              David, capture à l'appui : *« maintenant le pad est devenu
              illisible »*. Le menu qui s'ouvre par-dessus une pastille a une
              **hauteur fixe** — six lignes de boutons — alors que la tuile,
              elle, rétrécit avec le nombre de colonnes : à 190 px, sa dernière
              entrée sortait du cadre, **sans déborder visiblement ni rien
              signaler**. *Rendre une grille plus dense rétrécit tout ce qui vit
              DANS ses cases, y compris ce qui ne sait pas rétrécir.* Six
              colonnes au plus, et le menu défile désormais plutôt que de rogner.
            */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-6 pb-8 w-full">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={padIds}
                        strategy={rectSortingStrategy}
                    >
                        {activePlaylist.pads.map((pad, i) => {
                            const actualPLId = activePlaylist.id;
                            return (
                                <Pad
                                    key={pad.id}
                                    pad={pad}
                                    index={i}
                                    playlistId={actualPLId}
                                    onRequestMediaBrowser={() => setBrowserTarget({ index: i, playlistId: actualPLId })}
                                />
                            );
                        })}
                    </SortableContext>
                </DndContext>

                {/*
                  **La tuile d'ajout vit dans la grille, à la suite des autres.**
                  Pas dans l'en-tête : *une pastille s'ajoute là où les
                  pastilles sont*, et sa place dit d'elle-même qu'elle en
                  fabrique une de plus. Elle est hors du `SortableContext` — on
                  ne déplace pas un bouton, et l'inclure ferait de l'ajout une
                  cible de dépôt.
                */}
                <button
                    onClick={() => ajouterUnPad(activePlaylist.id)}
                    title="Ajouter une pastille à cette playlist"
                    className="aspect-square rounded-3xl border-2 border-dashed border-app-border/50 flex flex-col items-center justify-center gap-2 text-slate-700 transition-all duration-300 hover:border-accent/40 hover:text-accent hover:bg-app-surface/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={32} strokeWidth={1.5} />
                    <span className="text-ui-9 font-black uppercase tracking-widest">Ajouter</span>
                </button>
            </div>
        </div>
    );
};

export default PlaylistManager;

