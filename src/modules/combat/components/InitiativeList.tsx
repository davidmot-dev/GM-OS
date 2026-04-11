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
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { CSS } from '@dnd-kit/utilities';
import { Sword } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SortableCombatCardProps {
    combatant: Combatant;
    isActive: boolean;
    isGrid?: boolean;
}

const SortableCombatCard: React.FC<SortableCombatCardProps> = ({ combatant, isActive, isGrid }) => {
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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`cursor-grab active:cursor-grabbing ${isGrid ? 'h-full' : ''}`}>
            <CombatCard combatant={combatant} isActive={isActive} />
        </div>
    );
};

const InitiativeList: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { combatants, currentTurnIdx, reorderCombatants } = useCombatStore();
    const { getActiveDriver } = useSessionOSStore();
    const activeDriver = getActiveDriver();
    
    const initiativeStyle = activeDriver?.ui_config?.initiativeStyle || 'list';
    const isGrid = initiativeStyle === 'grid';

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
             <div className="flex-1 flex flex-col items-center justify-center text-app-text/20 p-8 text-center animate-in fade-in duration-500">
                <Zap size={64} className="mb-4 opacity-10 rotate-12 text-accent" />
                <h3 className="text-xl font-display font-black uppercase tracking-widest">{t('modules:combat.initiative.empty_title')}</h3>
                <p className="max-w-[200px] text-sm font-medium mt-2">{t('modules:combat.initiative.empty_desc')}</p>
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
                    strategy={isGrid ? rectSortingStrategy : verticalListSortingStrategy}
                >
                    <div className={isGrid ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4" : "space-y-1"}>
                        {combatants.map((combatant, index) => (
                            <SortableCombatCard
                                key={combatant.id}
                                combatant={combatant}
                                isActive={index === currentTurnIdx}
                                isGrid={isGrid}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default InitiativeList;
