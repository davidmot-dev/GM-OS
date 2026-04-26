import React from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import CombatCard from './CombatCard';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCombatCardProps {
    combatant: Combatant;
    isActive: boolean;
}

const SortableCombatCard: React.FC<SortableCombatCardProps> = ({ combatant, isActive }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: combatant.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: isDragging ? 'relative' as const : 'static' as const,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <CombatCard combatant={combatant} isActive={isActive} />
        </div>
    );
};

const InitiativeList: React.FC = () => {
    const { combatants, currentTurnIdx, reorderCombatants } = useCombatStore();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = combatants.findIndex(c => c.id === active.id);
            const newIndex = combatants.findIndex(c => c.id === over.id);
            reorderCombatants(oldIndex, newIndex);
        }
    };

    if (combatants.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-app-surface/50 rounded-xl border border-dashed border-app-border m-4">
                <div className="text-center text-app-text/50">
                    <p className="mb-2">La liste d'initiative est vide.</p>
                    <p className="text-sm">Utilisez les contrôles pour ajouter des combattants.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={combatants.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-1">
                        {combatants.map((combatant, index) => (
                            <SortableCombatCard
                                key={combatant.id}
                                combatant={combatant}
                                isActive={index === currentTurnIdx}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default InitiativeList;
