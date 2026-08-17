import React from 'react';
import NpcGallery from './NpcGallery';
import NpcDetail from './NpcDetail';
import AddEntityForm from './AddEntityForm';
import { useSessionOSStore } from '../useSessionOSStore';

/**
 * La galerie des PNJ, ou le détail de celui qu'on a choisi.
 *
 * **Un identifiant qui ne résout rien n'est pas une sélection.** Relevé par
 * David le 2026-08-17 : la section « Acteurs & Figurants » de l'éditeur de
 * campagne restait vide, avec pour seul contenu « Sélectionnez une entité pour
 * voir les détails » — le message que `NpcDetail` affiche quand il ne trouve
 * PAS l'entité demandée.
 *
 * La cause : l'état initial du store porte `selectedEntityId: 'e-1'`, le PNJ de
 * démonstration. Sur une campagne réelle il n'existe pas — mais l'identifiant
 * n'était pas nul, donc on rendait le détail, qui échouait à le trouver. **Et la
 * galerie devenait inatteignable**, puisque rien sur cet écran ne remet la
 * sélection à zéro.
 *
 * Ça ne se voyait pas depuis le Cockpit : `setCurrentView('npc-gallery')` efface
 * la sélection au passage. L'éditeur de campagne est une autre vue et ne
 * traverse jamais ce chemin — *une réparation posée sur un seul chemin ne
 * protège que ce chemin.*
 *
 * On résout donc l'entité avant de choisir quoi afficher, ici et pour tous les
 * écrans qui montent ce composant. La campagne compte autant que l'existence :
 * le détail d'un PNJ d'une AUTRE campagne, sur un écran qui promet celle-ci,
 * serait faux sans être vide.
 */
const NpcManagement: React.FC = () => {
    const { selectedEntityId, isAddingEntity, entities, activeCampaignId } = useSessionOSStore();

    const entiteChoisie = entities.find(
        e => e.id === selectedEntityId && e.campaignId === activeCampaignId,
    );

    return (
        <div className="flex-1 flex overflow-hidden h-full">
            {isAddingEntity ? (
                <AddEntityForm />
            ) : entiteChoisie ? (
                <NpcDetail />
            ) : (
                <NpcGallery />
            )}
        </div>
    );
};

export default NpcManagement;
