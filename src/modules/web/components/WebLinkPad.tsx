import React, { useState } from 'react';
import { Link, Edit2, Palette, X, Youtube, MonitorPlay, Check } from 'lucide-react';
import type { WebLink } from '../types';
import { useWebStore } from '../useWebStore';
import { videoYouTube, marqueurDeProjection } from '../youtube';
import { useImageStore } from '../../image/useImageStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';
import { gmToast } from '../../../stores/useToastStore';
import { ecransDeProjection, ecransOccupes } from '../ecransDeProjection';

interface WebLinkPadProps {
    link: WebLink;
    onEdit: (link: WebLink) => void;
}

const WebLinkPad: React.FC<WebLinkPadProps> = ({ link, onEdit }) => {
    const { openLink, removeLink } = useWebStore();

    /*
      **Une vidéo YouTube reste un marque-page, et devient projetable.**

      Demandé par David le 2026-09-05 : *« les vidéos YouTube sont visibles à
      partir de Web-OS »*. Elle n'entre donc pas dans la bibliothèque d'Image-OS —
      *ce qui n'est pas un fichier n'a pas sa place parmi les fichiers* : rien à
      sauvegarder, rien à emporter dans Nexus, et une vignette qu'on ne pourrait
      pas dessiner.
    */
    const video = videoYouTube(link.url);
    const ecrans = useImageStore((e) => e.displays);
    const projections = useImageStore((e) => e.projections);
    const { getDisplayLabel } = useHardwareStore();

    const marqueur = video ? marqueurDeProjection(video) : null;

    /*
      ⛔ **Le bouton nommait l'écran sans laisser en changer — corrigé le
      2026-09-05.**

      *« Quand je lance une vidéo YouTube, je veux pouvoir choisir la sortie »*
      (David). Web-OS projetait sur la cible réglée **dans Image-OS** : viser le
      second moniteur demandait de quitter ce module, changer un réglage
      ailleurs, et revenir. *Un réglage qui vit dans un module et décide dans un
      autre est une action à distance.*

      Le choix se fait donc là où le geste se fait. Il ne **modifie pas** la cible
      d'Image-OS : *choisir où part une vidéo ne doit pas déplacer les images du
      meneur à son insu.*
    */
    const [choixOuvert, setChoixOuvert] = useState(false);
    const destinations = ecransDeProjection(ecrans, projections, marqueur, getDisplayLabel);
    const occupes = ecransOccupes(destinations);

    const basculer = async (e: React.MouseEvent, ecranId: string, aLAntenne: boolean) => {
        e.stopPropagation();
        if (!marqueur) return;
        setChoixOuvert(false);

        const { ImageService } = await import('../../image/logic/ImageService');

        if (aLAntenne) {
            await ImageService.blackout(ecranId);
            return;
        }

        await ImageService.projectMedia(marqueur, ecranId as any);
        /*
          **Le seul avertissement qui compte, au moment où il compte.**

          ⭐ **Corrigé le 2026-09-05 : le niveau obéit désormais**, par
          `postMessage` au lecteur. Ce qui reste vrai, et qu'il faut donc encore
          dire, c'est qu'**Internet est requis** — une coupure donne un cadre noir
          devant les joueurs — et que l'**enceinte de sortie** ne se choisit pas :
          `setSinkId` n'a aucune prise sur un cadre distant.

          *Un avertissement qui a cessé d'être vrai est pire qu'aucun : il apprend
          à ne pas lire les suivants.*
        */
        gmToast("Vidéo YouTube projetée — Internet requis, et sortie audio non choisissable.");
    };

    // Mapping colors to Tailwind classes
    const colorClasses: Record<string, string> = {
        orange: 'border-orange-500/30 hover:border-orange-500 text-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/10 hover:bg-orange-500/20',
        cyan: 'border-cyan-500/30 hover:border-cyan-500 text-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-cyan-500/10 hover:bg-cyan-500/20',
        purple: 'border-purple-500/30 hover:border-purple-500 text-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-purple-500/10 hover:bg-purple-500/20',
        emerald: 'border-accent/30 hover:border-accent text-accent hover:shadow-glow-accent bg-accent/10 hover:bg-accent/20',
        blue: 'border-blue-500/30 hover:border-blue-500 text-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-blue-500/10 hover:bg-blue-500/20',
        amber: 'border-amber-500/30 hover:border-amber-500 text-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-amber-500/10 hover:bg-amber-500/20',
        rose: 'border-rose-500/30 hover:border-rose-500 text-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] bg-rose-500/10 hover:bg-rose-500/20',
        default: 'border-app-border/30 hover:border-accent/50 text-slate-400 hover:shadow-lg bg-app-surface/10 hover:bg-app-surface/20'
    };

    const currentClasses = colorClasses[link.color] || colorClasses.default;

    return (
        <div
            className={`relative group aspect-square rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden p-4 ${currentClasses}`}
            onClick={() => openLink(link.url)}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${currentClasses.split(' ').find(c => c.startsWith('bg-'))}`}>
                {/* Le pictogramme dit ce que le lien est, avant qu'on survole. */}
                {video
                    ? <Youtube size={24} className={currentClasses.split(' ').find(c => c.startsWith('text-'))} />
                    : <Link size={24} className={currentClasses.split(' ').find(c => c.startsWith('text-'))} />}
            </div>

            {/* Une vidéo à l'antenne se voit sans survoler — et sur QUELS écrans :
                *une vidéo qu'on a lancée et qu'on ne retrouve plus est une vidéo
                qu'on ne peut pas couper.* */}
            {occupes.length > 0 && (
                <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                    {occupes.map((ecran) => (
                        <span
                            key={ecran.id}
                            className="bg-accent text-app-bg text-ui-8 font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-lg font-display whitespace-nowrap"
                        >
                            {ecran.libelle}
                        </span>
                    ))}
                </div>
            )}

            <span className="text-xs font-medium text-slate-300 text-center truncate w-full">
                {link.name}
            </span>

            {/* Overlay Controls */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-app-surface/90 backdrop-blur-sm flex items-center justify-center gap-2 px-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(link); }}
                    className="p-2 bg-app-bg hover:bg-app-surface rounded-lg text-app-text transition-colors"
                    title="Modifier"
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(link); }} // Palette opens edit for now
                    className="p-2 bg-app-bg hover:bg-app-surface rounded-lg text-app-text transition-colors"
                    title="Palette"
                >
                    <Palette size={18} />
                </button>
                {video && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setChoixOuvert(true); }}
                        aria-label="Choisir l'écran de projection"
                        className={`p-2 rounded-lg transition-colors ${occupes.length > 0
                            ? 'bg-accent text-app-bg shadow-glow-accent'
                            : 'bg-app-bg hover:bg-app-surface text-app-text'}`}
                        title="Projeter — choisir l'écran. Internet requis ; le volume suit la table, pas l'enceinte."
                    >
                        <MonitorPlay size={18} />
                    </button>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); removeLink(link.id); }}
                    className="p-2 bg-red-900/50 hover:bg-red-800/70 rounded-lg text-red-100 transition-colors"
                    title="Remove"
                >
                    <X size={18} />
                </button>
            </div>

            {/*
              **Le choix de l'écran occupe le pad lui-même.**

              Une liste flottante dans une grille de vignettes se fait recouvrir
              par la suivante, ou déborde du cadre. Le pad est déjà la surface que
              le doigt vise : *on remplace ce qu'il montre au lieu d'ajouter une
              couche par-dessus.*

              Chaque ligne dit son état et fait l'inverse : ce qui est à l'antenne
              se coupe, le reste s'allume. **Aucune sortie séparée**, parce qu'un
              bouton « couper » distinct laisserait deviner lequel des écrans il
              coupe.
            */}
            {choixOuvert && (
                <div
                    className="absolute inset-0 z-10 bg-app-bg/95 backdrop-blur-sm flex flex-col p-2 gap-1 overflow-y-auto no-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-1 pb-1 shrink-0">
                        <span className="text-ui-9 font-black uppercase tracking-widest text-slate-500">
                            Projeter sur
                        </span>
                        <button
                            onClick={() => setChoixOuvert(false)}
                            aria-label="Fermer le choix de l'écran"
                            className="p-1 rounded text-slate-500 hover:text-app-text"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {destinations.map((ecran) => (
                        <button
                            key={ecran.id}
                            onClick={(e) => basculer(e, ecran.id, ecran.aLAntenne)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-bold transition-colors shrink-0 ${
                                ecran.aLAntenne
                                    ? 'bg-accent text-app-bg shadow-glow-accent'
                                    : 'bg-app-surface/60 text-app-text hover:bg-app-surface'
                            }`}
                            title={ecran.aLAntenne ? `Couper sur ${ecran.libelle}` : `Projeter sur ${ecran.libelle}`}
                        >
                            {ecran.aLAntenne ? <Check size={13} className="shrink-0" /> : <MonitorPlay size={13} className="shrink-0" />}
                            <span className="truncate">{ecran.libelle}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WebLinkPad;
