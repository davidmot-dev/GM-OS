import React from 'react';
import { Bouton, Etiquette, Panneau } from '../socle';
import { ResolvedImage } from '../ResolvedImage';
import { useFermetureParEchap } from '../../hooks/useFermetureParEchap';

interface HubLectureProps {
    titre: string;
    description: string;
    image?: string;
    informations?: React.ReactNode;
    remplacement: React.ReactNode;
    onClose: () => void;
    fermeture: string;
}

/** La lecture garde une sortie visible et fait défiler le document entier. */
export const HubLecture: React.FC<HubLectureProps> = ({ titre, description, image, informations, remplacement, onClose, fermeture }) => {
    useFermetureParEchap(true, onClose, `Lecture tablette : ${titre}`);
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-app-bg/90 p-3 sm:p-6" onClick={onClose}>
            <Panneau as="section" role="dialog" aria-modal="true" aria-label={titre} onClick={e => e.stopPropagation()}
                className="flex max-h-[calc(100dvh-24px)] w-full max-w-5xl flex-col overflow-hidden bg-app-surface sm:max-h-[calc(100dvh-48px)]">
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-app-border p-3">
                    <h2 className="min-w-0 break-words text-[24px] font-bold text-app-text">{titre}</h2>
                    <Bouton cibleTactile onClick={onClose} title={fermeture} className="shrink-0">Fermer</Bouton>
                </div>
                <div className="min-h-0 overflow-auto p-3">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        <div className="flex h-40 shrink-0 items-center justify-center overflow-hidden bg-app-bg text-app-muted sm:h-56 lg:h-96 lg:w-1/2">
                            {image ? <ResolvedImage src={image} alt={titre} className="size-full object-contain" /> : remplacement}
                        </div>
                        <div className="min-w-0 flex-1 space-y-4">
                            <div className="flex flex-wrap gap-2 text-[14px]">{informations}</div>
                            <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-app-text">{description}</p>
                        </div>
                    </div>
                </div>
            </Panneau>
        </div>
    );
};

export const InformationDeLecture: React.FC<React.PropsWithChildren> = ({ children }) => <Etiquette className="text-[14px]">{children}</Etiquette>;
