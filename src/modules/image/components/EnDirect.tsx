import React from 'react';
import { Ban, Film } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useImageStore } from '../useImageStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { estUneVideo } from '../../../stores/typesDeMedia';
import { Bouton, Etiquette, Panneau } from '../../../components/socle';
import { occupantDeLEcran } from '../logic/ceQuiEstProjete';

/**
 * **« En direct »** — phase 4, L1, étape 2 d'Image-OS, 2026-09-30.
 *
 * La réponse au prompt retenu avec Stitch : *voir d'un coup d'œil ce qui est
 * projeté et où, et projeter une autre image d'un geste.* L'écran cible, ce
 * qu'il montre en grand, et le geste pour l'arrêter — celui de « Target », qui
 * rend l'écran à son décor (et non le noir, qui a son propre bouton).
 */
export const EnDirect: React.FC<{ aLaTable?: boolean }> = ({ aLaTable = false }) => {
    const { t } = useTranslation(['modules', 'common']);
    const projections = useImageStore(s => s.projections);
    const cible = useImageStore(s => s.projectionTarget) as string;
    const mediaList = useImageStore(s => s.mediaList);
    const ficheProjetee = useImageStore(s => s.projectedEntity);
    const blackout = useImageStore(s => s.blackout);
    const { getDisplayLabel } = useHardwareStore();

    const ecran = getDisplayLabel(cible);
    const occupant = occupantDeLEcran(projections, cible, mediaList, ficheProjetee);

    const source = occupant?.genre === 'media' ? occupant.media.path
        : occupant?.genre === 'fiche' ? (occupant.fiche.portraitUrl || occupant.fiche.imageUrl || occupant.fiche.avatar)
        : occupant?.genre === 'adresse' ? occupant.adresse
        : undefined;
    const url = useMediaUrl(source);

    const nom = occupant?.genre === 'media' ? occupant.media.name
        : occupant?.genre === 'fiche' ? `${t('image.agencement.fiche')} : ${occupant.fiche.name}`
        : occupant?.genre === 'marqueur' ? occupant.libelle
        : occupant?.genre === 'adresse' ? occupant.adresse
        : '';
    const estVideo = occupant?.genre === 'media'
        && (occupant.media.type ? occupant.media.type === 'video' : estUneVideo(occupant.media.name));

    if (!occupant) {
        return (
            <Panneau niveau={2} vide className="shrink-0 flex flex-col items-center justify-center gap-1 py-8 text-center" data-en-direct="">
                <p className="text-sm font-bold text-app-text">{t('image.agencement.rienProjete', { ecran })}</p>
                <p className="text-ui-11 text-app-muted">{t('image.agencement.rienProjeteAide')}</p>
            </Panneau>
        );
    }

    return (
        <Panneau niveau={2} orne className="shrink-0 p-4 flex flex-col gap-3" data-en-direct="">
            <div className="flex flex-wrap items-center gap-3">
                <Etiquette ton="accent">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    {t('image.agencement.enDirect', { ecran })}
                </Etiquette>
                <span className="min-w-0 flex-1 truncate text-ui-11 text-app-muted">
                    {t('image.agencement.source')} : <span className="font-mono text-app-text">{nom}</span>
                </span>
                <Bouton variante="danger" aLaTable={aLaTable} icone={<Ban size={16} />} onClick={blackout} title={t('image.dashboard.blackout.targetTooltip')}>
                    {t('image.agencement.arreter')}
                </Bouton>
            </div>

            <div className="relative w-full aspect-video max-h-[42vh] rounded-lg overflow-hidden bg-fixe-noir flex items-center justify-center">
                {url && estVideo ? (
                    /* La vignette ne joue pas : le son appartient au projecteur. */
                    <video src={url} muted playsInline preload="metadata" aria-hidden className="w-full h-full object-contain" />
                ) : url ? (
                    <img src={url} alt={nom} className="w-full h-full object-contain" />
                ) : (
                    <span className="text-fixe-blanc/70 text-sm font-bold uppercase tracking-widest">{nom}</span>
                )}
                {estVideo && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-fixe-noir/70 px-2 py-0.5 text-ui-10 font-bold uppercase text-fixe-blanc">
                        <Film size={12} /> Vidéo
                    </span>
                )}
            </div>
        </Panneau>
    );
};

export default EnDirect;
