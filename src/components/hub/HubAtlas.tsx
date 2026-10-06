import React from 'react';
import { Globe } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import { Bouton, Panneau } from '../socle';
import { type AtlasMap } from '../../modules/session/store/types';
import { HubConsultation, type CommandesDeConsultation } from './HubConsultation';

interface HubAtlasProps extends CommandesDeConsultation {
    atlasMaps: AtlasMap[];
    onSelectMap: (map: AtlasMap) => void;
}

export const HubAtlas: React.FC<HubAtlasProps> = React.memo(({ atlasMaps, onSelectMap, commandes, informations }) => (
    <HubConsultation ecran="lieux" titre="Atlas des Lieux Visités" description="Cartographie des territoires explorés par le groupe."
        compteur={`${atlasMaps.length} Lieux Découverts`} icone={Globe} {...{ commandes, informations }}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {atlasMaps.map(map => (
                <Bouton habillage="libre" cibleTactile key={map.id} onClick={() => onSelectMap(map)}
                    className="flex w-full min-w-0 flex-col gap-2 border border-app-border bg-app-surface p-3 text-left hover:border-accent">
                    <h3 className="break-words text-[16px] font-bold text-app-text">{map.name}</h3>
                    <p className="text-[14px] font-normal text-accent">{map.type}</p>
                    <p className="line-clamp-3 break-words text-[14px] font-normal leading-relaxed text-app-muted">{map.narrativeDescription || 'Documentation en attente...'}</p>
                    <div className="flex h-44 w-full items-center justify-center overflow-hidden bg-app-bg lg:h-56">
                        {map.fileUrl ? <ResolvedImage src={map.fileUrl} alt="" className="size-full object-contain" /> : <Globe size={40} className="text-app-muted" />}
                    </div>
                </Bouton>
            ))}
            {atlasMaps.length === 0 && <Panneau as="div" vide className="col-span-full space-y-2 p-6 text-center text-[14px] text-app-muted">
                <p>Territoires inconnus</p><p>Aucun lieu n'a encore été marqué comme visité par le Maître de Jeu.</p>
            </Panneau>}
        </div>
    </HubConsultation>
));
