import React from 'react';
import { User } from 'lucide-react';
import type { Entity } from '../../modules/session/store/types';
import { HubLecture, InformationDeLecture } from './HubLecture';

interface HubNpcViewerProps { npc: Entity | null; onClose: () => void }

export const HubNpcViewer: React.FC<HubNpcViewerProps> = ({ npc, onClose }) => {
    if (!npc) return null;
    return <HubLecture titre={npc.name} description={npc.description || "Aucune donnée biographique supplémentaire n'est accessible pour ce sujet."}
        image={npc.avatar} onClose={onClose} fermeture="Fermer" remplacement={<User size={48} />} informations={<>
            <InformationDeLecture>{npc.role || 'NPC'}</InformationDeLecture>
            {npc.faction && <InformationDeLecture>{npc.faction}</InformationDeLecture>}
            <InformationDeLecture>{npc.type === 'npc' ? 'Profil Civil / Neutre' : "Sujet d'intérêt"}</InformationDeLecture>
        </>} />;
};
