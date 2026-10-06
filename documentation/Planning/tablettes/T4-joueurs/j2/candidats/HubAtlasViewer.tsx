import React from 'react';
import { Globe } from 'lucide-react';
import type { AtlasMap } from '../../modules/session/store/types';
import { HubLecture, InformationDeLecture } from './HubLecture';

interface HubAtlasViewerProps { map: AtlasMap | null; onClose: () => void }

export const HubAtlasViewer: React.FC<HubAtlasViewerProps> = ({ map, onClose }) => {
    if (!map) return null;
    return <HubLecture titre={map.name} description={map.narrativeDescription || "Aucune description narrative n'a été saisie pour ce lieu."}
        image={map.fileUrl} onClose={onClose} fermeture="Fermer" remplacement={<Globe size={48} />} informations={<>
            <InformationDeLecture>Lieu Visité</InformationDeLecture><InformationDeLecture>{map.type.replace('-', ' ')}</InformationDeLecture>
        </>} />;
};
