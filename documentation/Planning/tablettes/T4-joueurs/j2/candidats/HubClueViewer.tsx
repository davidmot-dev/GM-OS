import React from 'react';
import { FileSearch } from 'lucide-react';
import type { Clue } from '../../modules/session/store/types';
import { HubLecture, InformationDeLecture } from './HubLecture';

interface HubClueViewerProps { clue: Clue | null; onClose: () => void }

export const HubClueViewer: React.FC<HubClueViewerProps> = ({ clue, onClose }) => {
    if (!clue) return null;
    return <HubLecture titre={clue.title} description={clue.content} image={clue.mediaUrl} onClose={onClose}
        fermeture="Fermer l'indice" remplacement={<FileSearch size={48} />} informations={<>
            {clue.revealedAt && <InformationDeLecture>{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(clue.revealedAt))}</InformationDeLecture>}
            {clue.campaignMoment && <InformationDeLecture>{clue.campaignMoment}</InformationDeLecture>}
        </>} />;
};
