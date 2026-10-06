import React from 'react';
import { BookOpen } from 'lucide-react';
import { EnTeteDeModule, GabaritDeModule, Panneau } from '../socle';
import type { useHubSync } from '../../modules/session/hooks/useHubSync';
import { HubProjectionCard } from './HubProjectionCard';
import { HubHorlogesPubliques } from './HubHorlogesPubliques';

type HubDirectProps = Pick<ReturnType<typeof useHubSync>,
    'activeCampaignName' | 'activeCampaignWallpaper' | 'liveImagePath' | 'liveMediaEstUneVideo' |
    'liveEntity' | 'resolvedFavorites' | 'isClockProjected' | 'timestamp' | 'mode' | 'theme' |
    'tensions' | 'sessionSummary'> & { commandes: React.ReactNode };

/** T4 J1 : la projection et les informations publiques occupent des zones distinctes. */
export const HubDirect: React.FC<HubDirectProps> = ({
    activeCampaignName, activeCampaignWallpaper, liveImagePath, liveMediaEstUneVideo,
    liveEntity, resolvedFavorites, isClockProjected, timestamp, mode, theme,
    tensions, sessionSummary, commandes,
}) => {
    // Même dédoublonnage que le Direct historique, quel que soit le format.
    const favoris = resolvedFavorites.filter(fav =>
        !liveEntity || (fav.id !== liveEntity.id && fav.name.toLowerCase() !== liveEntity.name.toLowerCase()));
    const images = new Set<string>();
    if (liveEntity) {
        for (const image of [liveEntity.avatar, liveEntity.imageUrl, liveEntity.portraitUrl]) {
            if (image) images.add(image);
        }
    }
    for (const favori of favoris) if (favori.imageUrl) images.add(favori.imageUrl);
    // Une vidéo est déjà jouée par FondProjete : ne pas la décoder une seconde fois.
    const imageProjetee = !!liveImagePath && liveImagePath !== activeCampaignWallpaper
        && !images.has(liveImagePath) && !liveMediaEstUneVideo;
    const nombre = favoris.length + (liveEntity ? 1 : 0) + (imageProjetee ? 1 : 0);

    return (
        <div data-direct-joueur="" className="relative z-40 min-h-0 flex-1 overflow-hidden">
            <GabaritDeModule
                entete={<EnTeteDeModule titre={<span className="block whitespace-normal break-words">{activeCampaignName || 'Direct'}</span>} surtitre="Opération en cours" />}
                barreDOutils={commandes}
                className="mx-auto max-w-7xl"
            >
                <div className="flex min-h-full flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <Panneau aria-label="Projection du meneur" habillage="libre" className="order-2 min-h-[220px] min-w-0 flex-1 border border-app-border bg-app-surface/30 p-3 lg:order-1">
                        <div className={`grid w-full grid-cols-1 gap-4 ${nombre > 1 ? 'sm:grid-cols-2' : ''}`}>
                            {imageProjetee && <HubProjectionCard src={liveImagePath!} count={nombre} />}
                            {liveEntity && <HubProjectionCard entity={liveEntity} count={nombre} />}
                            {favoris.map(fav => <HubProjectionCard key={fav.id} entity={fav} count={nombre} />)}
                        </div>
                    </Panneau>
                    <div className="contents lg:order-2 lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
                        <HubHorlogesPubliques {...{ isClockProjected, timestamp, mode, theme, tensions }} colonneEnPaysage />
                        <Panneau aria-label="Chroniques de séance" className="order-3 min-w-0 p-3 lg:flex-1">
                            <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-app-text"><BookOpen aria-hidden="true" size={16} />Chroniques de séance</h2>
                            <div className="max-h-[240px] overflow-auto">
                                <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-app-muted">{sessionSummary || 'Aucun résumé public.'}</p>
                            </div>
                        </Panneau>
                    </div>
                </div>
            </GabaritDeModule>
        </div>
    );
};
