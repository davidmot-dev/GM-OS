import React from 'react';
import NpcGallery from './NpcGallery';
import NpcDetail from './NpcDetail';
import AddEntityForm from './AddEntityForm';
import { useSessionOSStore } from '../useSessionOSStore';

const NpcManagement: React.FC = () => {
    const { selectedEntityId, isAddingEntity } = useSessionOSStore();

    return (
        <div className="flex-1 flex overflow-hidden h-full">
            {isAddingEntity ? (
                <AddEntityForm />
            ) : selectedEntityId ? (
                <NpcDetail />
            ) : (
                <NpcGallery />
            )}
        </div>
    );
};

export default NpcManagement;
