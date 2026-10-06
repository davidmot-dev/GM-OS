import React, { memo } from 'react';
import { Archive, FileSearch } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import { Bouton, Panneau } from '../socle';
import { type Clue } from '../../modules/session/store/types';
import { HubConsultation, type CommandesDeConsultation } from './HubConsultation';

interface HubArchivesProps extends CommandesDeConsultation {
    clues: Clue[];
    activeCampaignId: string | null;
    onSelectClue: (clue: Clue) => void;
}

export const HubArchives: React.FC<HubArchivesProps> = memo(({ clues, activeCampaignId, onSelectClue, commandes, informations }) => {
    const revealedClues = clues.filter(c => c.isRevealed && String(c.campaignId) === String(activeCampaignId));
    return (
        <HubConsultation ecran="archives" titre="Archives du Groupe" description="Preuves et indices collectés lors de la campagne."
            compteur={`${revealedClues.length} Fragments Découverts`} icone={Archive} {...{ commandes, informations }}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {revealedClues.map(clue => (
                    <Bouton habillage="libre" cibleTactile key={clue.id} onClick={() => onSelectClue(clue)}
                        className="flex w-full min-w-0 items-start gap-3 border border-app-border bg-app-surface p-3 text-left hover:border-accent">
                        <div className="flex size-[48px] shrink-0 items-center justify-center overflow-hidden bg-app-bg text-accent">
                            {clue.mediaUrl ? <ResolvedImage src={clue.mediaUrl} alt="" className="size-full object-cover" /> : <FileSearch size={24} />}
                        </div>
                        <div className="min-w-0 space-y-2">
                            <h3 className="break-words text-[16px] font-bold text-app-text">{clue.title}</h3>
                            {clue.revealedAt && <p className="text-[14px] text-app-muted">Découvert le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(clue.revealedAt))}</p>}
                            <p className="line-clamp-4 break-words text-[14px] font-normal leading-relaxed text-app-text">{clue.content}</p>
                        </div>
                    </Bouton>
                ))}
                {revealedClues.length === 0 && <Panneau as="div" vide className="col-span-full p-6 text-center text-[14px] text-app-muted">Aucune archive disponible</Panneau>}
            </div>
        </HubConsultation>
    );
});
