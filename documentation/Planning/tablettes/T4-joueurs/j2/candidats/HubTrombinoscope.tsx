import React from 'react';
import { Users, User, ChevronRight } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import { Bouton, Panneau } from '../socle';
import { type Entity } from '../../modules/session/store/types';
import { HubConsultation, type CommandesDeConsultation } from './HubConsultation';

interface HubTrombinoscopeProps extends CommandesDeConsultation {
    npcs: Entity[];
    onSelectNpc: (npc: Entity) => void;
}

export const HubTrombinoscope: React.FC<HubTrombinoscopeProps> = React.memo(({ npcs, onSelectNpc, commandes, informations }) => (
    <HubConsultation ecran="pnj" titre="Trombinoscope" description="Registre des individus et entités identifiés."
        compteur={`${npcs.length} Profils Répertoriés`} icone={Users} {...{ commandes, informations }}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {npcs.map(npc => (
                <Bouton habillage="libre" cibleTactile key={npc.id} onClick={() => onSelectNpc(npc)}
                    className="flex w-full min-w-0 items-center gap-3 border border-app-border bg-app-surface p-3 text-left hover:border-accent">
                    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden bg-app-bg text-app-muted">
                        {npc.avatar ? <ResolvedImage src={npc.avatar} alt="" className="size-full object-cover" /> : <User size={28} />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="break-words text-[16px] font-bold text-app-text">{npc.name}</h3>
                        <p className="break-words text-[14px] font-normal text-app-muted">{npc.role || 'Citoyen'}</p>
                    </div>
                    <ChevronRight size={20} className="shrink-0 text-accent" />
                </Bouton>
            ))}
            {npcs.length === 0 && <Panneau as="div" vide className="col-span-full space-y-2 p-6 text-center text-[14px] text-app-muted">
                <p>Aucun sujet identifié</p><p>En attente de transmission par le MJ</p>
            </Panneau>}
        </div>
    </HubConsultation>
));
