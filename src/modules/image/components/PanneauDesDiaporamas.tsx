import React, { useState } from 'react';
import { Plus, Play, Square, Trash2, ChevronUp, ChevronDown, Film, Images, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useImageStore } from '../useImageStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { useHardwareStore } from '../../../stores/useHardwareStore';
import { gmPrompt, gmConfirm } from '../../../stores/useModalStore';
import { estUneVideo } from '../../../stores/typesDeMedia';
import type { ImageMedia } from '../types';
import {
    imagesDuDiaporama, cadenceDuDiaporama, peutTourner, CADENCE_MINIMALE_MS,
} from '../logic/deroulementDuDiaporama';

/**
 * **L'écran des diaporamas — demandé par David le 2026-09-13.**
 *
 * *« Je voudrais pouvoir créer des diaporamas avec plusieurs images et un fondu
 * entre chacune d'entre elles, ensuite je veux pouvoir appeler ce diaporama
 * après dans un Storyboard. »*
 *
 * Il vit à part du tableau de bord, qui fait déjà quatre cents lignes.
 *
 * ⚠️ **Les vidéos n'entrent pas dans un diaporama.** Une vidéo porte sa propre
 * durée ; la faire passer au bout de six secondes la couperait au milieu, et la
 * laisser finir ferait mentir la cadence. *Une vidéo est un plan, pas une
 * image* — elle se projette seule, et Image-OS sait déjà le faire.
 */

/** Une vignette, lue comme ailleurs : le champ d'abord, le nom en repli. */
const Vignette: React.FC<{ media: ImageMedia }> = ({ media }) => {
    const url = useMediaUrl(media.path);
    return url
        ? <img src={url} alt="" className="w-full h-full object-cover" />
        : <div className="w-full h-full bg-app-surface" />;
};

const PanneauDesDiaporamas: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { getDisplayLabel } = useHardwareStore();

    const diaporamas = useImageStore(s => s.diaporamas);
    const diaporamaEnCours = useImageStore(s => s.diaporamaEnCours);
    const mediaList = useImageStore(s => s.mediaList);
    const projectionTarget = useImageStore(s => s.projectionTarget);

    const creerDiaporama = useImageStore(s => s.creerDiaporama);
    const renommerDiaporama = useImageStore(s => s.renommerDiaporama);
    const supprimerDiaporama = useImageStore(s => s.supprimerDiaporama);
    const ajouterAuDiaporama = useImageStore(s => s.ajouterAuDiaporama);
    const retirerDuDiaporama = useImageStore(s => s.retirerDuDiaporama);
    const deplacerDansLeDiaporama = useImageStore(s => s.deplacerDansLeDiaporama);
    const reglerLaCadence = useImageStore(s => s.reglerLaCadence);
    const lancerLeDiaporama = useImageStore(s => s.lancerLeDiaporama);
    const arreterLeDiaporama = useImageStore(s => s.arreterLeDiaporama);

    const [choisiId, setChoisiId] = useState<string | null>(null);
    /*
      **On retombe sur le premier plutôt que de ne rien montrer.** Un écran qui
      liste trois diaporamas et n'en ouvre aucun demande un clic pour dire ce
      qu'il sait déjà.
    */
    const choisi = diaporamas.find(d => d.id === choisiId) ?? diaporamas[0] ?? null;

    const images = choisi ? imagesDuDiaporama(choisi, mediaList) : [];
    const manquantes = choisi ? choisi.imageIds.length - images.length : 0;

    const nouveau = () => {
        gmPrompt(t('image.diaporama.nomDemande'), '', (nom) => {
            if (!nom?.trim()) return;
            setChoisiId(creerDiaporama(nom.trim()));
        });
    };

    return (
        <div className="flex-1 flex gap-6 min-h-0">
            {/* ── La liste des diaporamas ───────────────────────────────── */}
            <div className="w-72 flex-shrink-0 flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t('image.diaporama.titre')}
                    </h3>
                    <button
                        onClick={nouveau}
                        className="text-slate-400 hover:text-accent transition-colors"
                        title={t('image.diaporama.nouveau')}
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                    {diaporamas.length === 0 && (
                        <p className="text-ui-11 text-app-text/30 leading-relaxed px-2 py-4">
                            {t('image.diaporama.aucun')}
                        </p>
                    )}
                    {diaporamas.map(d => {
                        const tourne = diaporamaEnCours?.id === d.id;
                        return (
                            <div
                                key={d.id}
                                onClick={() => setChoisiId(d.id)}
                                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                    choisi?.id === d.id
                                        ? 'bg-accent/20 text-accent'
                                        : 'text-slate-400 hover:bg-app-surface/50'
                                }`}
                            >
                                <Images size={15} className={tourne ? 'text-emerald-400' : ''} />
                                <span className="flex-1 truncate text-sm font-medium">{d.nom}</span>
                                {/* Un point vert vaut mieux qu'un mot : il se lit d'un coup d'œil. */}
                                {tourne && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                                <span className="text-ui-9 text-app-text/30">{d.imageIds.length}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Le diaporama ouvert ───────────────────────────────────── */}
            {choisi ? (
                <div className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="flex items-center gap-3 bg-app-surface/50 p-4 rounded-2xl border border-app-border">
                        <h2 className="text-lg font-bold text-white truncate flex-1">{choisi.nom}</h2>

                        <button
                            onClick={() => gmPrompt(t('image.diaporama.nomDemande'), choisi.nom, (nom) => {
                                if (nom?.trim()) renommerDiaporama(choisi.id, nom.trim());
                            })}
                            className="p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-app-surface transition-colors"
                            title={t('image.diaporama.renommer')}
                        >
                            <Pencil size={15} />
                        </button>

                        {/*
                          **La cadence, en secondes.** Le meneur pense en secondes ;
                          le magasin compte en millisecondes. La borne basse est
                          celle de `CADENCE_MINIMALE_MS` — plus court que le fondu,
                          l'image repartirait avant d'être entrée.
                        */}
                        <label className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-widest text-app-text/40">
                            {t('image.diaporama.cadence')}
                            <input
                                type="number"
                                min={CADENCE_MINIMALE_MS / 1000}
                                step={0.5}
                                value={cadenceDuDiaporama(choisi) / 1000}
                                onChange={(e) => reglerLaCadence(choisi.id, Number(e.target.value) * 1000)}
                                className="w-20 bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-sm text-white text-right"
                            />
                            <span className="normal-case tracking-normal">{t('image.diaporama.secondes')}</span>
                        </label>

                        {diaporamaEnCours?.id === choisi.id ? (
                            <button
                                onClick={arreterLeDiaporama}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-ui-10 font-black uppercase tracking-widest hover:bg-rose-500/30 transition-all"
                            >
                                <Square size={14} /> {t('image.diaporama.arreter')}
                            </button>
                        ) : (
                            <button
                                onClick={() => lancerLeDiaporama(choisi.id)}
                                disabled={!peutTourner(images)}
                                title={peutTourner(images) ? undefined : t('image.diaporama.deuxMinimum')}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-slate-950 text-ui-10 font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Play size={14} /> {t('image.diaporama.lancer', { ecran: getDisplayLabel(projectionTarget as string) })}
                            </button>
                        )}

                        <button
                            onClick={() => gmConfirm(
                                t('image.diaporama.supprimerConfirme', { nom: choisi.nom }),
                                () => supprimerDiaporama(choisi.id),
                            )}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                            title={t('image.diaporama.supprimer')}
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>

                    {/*
                      ⚠️ **Le trou se dit ici, et nulle part ailleurs.** Une image
                      supprimée de la bibliothèque est sautée à la projection —
                      *une séance ne doit pas s'arrêter sur un ménage fait la
                      semaine d'avant*. Mais le meneur doit pouvoir le réparer, et
                      c'est cet écran qui le lui apprend.
                    */}
                    {manquantes > 0 && (
                        <p className="text-ui-11 text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                            {t('image.diaporama.manquantes', { compte: manquantes })}
                        </p>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {images.length === 0 ? (
                            <p className="text-ui-11 text-app-text/30 py-8 text-center">
                                {t('image.diaporama.videPourLInstant')}
                            </p>
                        ) : (
                            <ol className="space-y-2">
                                {images.map((media, rang) => (
                                    <li
                                        key={`${media.id}-${rang}`}
                                        className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                                            diaporamaEnCours?.id === choisi.id && diaporamaEnCours.index === rang
                                                ? 'border-emerald-400/50 bg-emerald-400/5'
                                                : 'border-app-border bg-app-surface/40'
                                        }`}
                                    >
                                        <span className="w-6 text-center text-ui-10 font-black text-app-text/30">{rang + 1}</span>
                                        <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                            <Vignette media={media} />
                                        </div>
                                        <span className="flex-1 truncate text-sm text-app-text/80">{media.name}</span>

                                        <button
                                            onClick={() => deplacerDansLeDiaporama(choisi.id, rang, -1)}
                                            disabled={rang === 0}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-app-surface disabled:opacity-20 transition-colors"
                                            title={t('image.diaporama.monter')}
                                        >
                                            <ChevronUp size={15} />
                                        </button>
                                        <button
                                            onClick={() => deplacerDansLeDiaporama(choisi.id, rang, 1)}
                                            disabled={rang === images.length - 1}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-app-surface disabled:opacity-20 transition-colors"
                                            title={t('image.diaporama.descendre')}
                                        >
                                            <ChevronDown size={15} />
                                        </button>
                                        <button
                                            onClick={() => retirerDuDiaporama(choisi.id, rang)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                                            title={t('image.diaporama.retirer')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    {/* ── La réserve : ce qu'on peut y ajouter ──────────────── */}
                    <div className="border-t border-app-border pt-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            {t('image.diaporama.ajouterDepuis')}
                        </h3>
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                            {mediaList.map(media => {
                                const estVideo = media.type ? media.type === 'video' : estUneVideo(media.name);
                                return (
                                    <button
                                        key={media.id}
                                        onClick={() => !estVideo && ajouterAuDiaporama(choisi.id, media.id)}
                                        disabled={estVideo}
                                        title={estVideo ? t('image.diaporama.pasDeVideo') : media.name}
                                        className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-app-border hover:border-accent transition-colors disabled:opacity-25 disabled:cursor-not-allowed group"
                                    >
                                        <Vignette media={media} />
                                        {estVideo ? (
                                            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white/60">
                                                <Film size={16} />
                                            </span>
                                        ) : (
                                            <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-accent">
                                                <Plus size={20} />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-app-text/30 text-sm">
                    {t('image.diaporama.aucun')}
                </div>
            )}
        </div>
    );
};

export default PanneauDesDiaporamas;
