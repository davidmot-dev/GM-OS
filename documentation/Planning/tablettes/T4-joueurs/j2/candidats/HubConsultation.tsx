import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { EnTeteDeModule, Etiquette, GabaritDeModule } from '../socle';

export interface CommandesDeConsultation {
    commandes?: React.ReactNode;
    informations?: React.ReactNode;
}

interface HubConsultationProps extends CommandesDeConsultation {
    ecran: string;
    titre: string;
    description: string;
    compteur: string;
    icone: LucideIcon;
    children: React.ReactNode;
}

/** T4/J2 : la même place pour le titre, les commandes et la lecture. */
export const HubConsultation: React.FC<HubConsultationProps> = ({ ecran, titre, description, compteur, icone: Icone, commandes, informations, children }) => (
    <div data-hub-consultation={ecran} className="h-full min-h-0 w-full pointer-events-auto">
        <GabaritDeModule className="mx-auto max-w-7xl" barreDOutils={commandes} entete={
            <EnTeteDeModule habillage="libre" className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <h2 className="flex items-center gap-3 text-[24px] font-bold text-app-text"><Icone size={24} className="shrink-0 text-accent" />{titre}</h2>
                    <p className="text-[14px] text-app-muted">{description}</p>
                </div>
                <Etiquette ton="accent" className="text-[14px]">{compteur}</Etiquette>
            </EnTeteDeModule>
        }>
            <div className="space-y-4 pb-2">{informations}{children}</div>
        </GabaritDeModule>
    </div>
);
