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
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Etiquette } from '../../../components/socle';
import { estHorsDeCombat } from '../logic/SanteDuCombattant';

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

    /*
      **Les combattants hors de combat, regroupés en bas** — phase 4, L1, étape
      2 de Combat (2026-09-30), d'après la maquette retenue. Ils restaient à leur
      place d'initiative, grisés au milieu des vivants : l'œil devait les
      enjamber à chaque tour. Ils gardent leur carte entière (un soin peut les
      relever), mais ne se trient plus à la main.

      Le compteur en tête se CALCULE — il n'est écrit nulle part.
    */
    const enLice = combatants.filter(c => !estHorsDeCombat(c));
    const tombes = combatants.filter(c => estHorsDeCombat(c));
    const estActif = (c: Combatant) => combatants.indexOf(c) === currentTurnIdx;

    return (
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="flex flex-wrap items-center gap-2 mb-3" data-compteur-du-combat="">
                <Etiquette>{t('modules:combat.agencement.combattants', { count: combatants.length })}</Etiquette>
                <Etiquette ton="succes">{t('modules:combat.agencement.enLice', { count: enLice.length })}</Etiquette>
                {tombes.length > 0 && <Etiquette ton="danger">{t('modules:combat.agencement.horsDeCombat', { count: tombes.length })}</Etiquette>}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={enLice.map(c => c.id)}
                    strategy={isGrid ? rectSortingStrategy : verticalListSortingStrategy}
                >
                    <div className={isGrid ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4" : "space-y-1"}>
                        {enLice.map(combatant => (
                            <SortableCombatCard
                                key={combatant.id}
                                combatant={combatant}
                                isActive={estActif(combatant)}
                                isGrid={isGrid}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {tombes.length > 0 && (
                <section className="mt-6" aria-label={t('modules:combat.agencement.titreHorsDeCombat', { count: tombes.length })}>
                    <h3 className="mb-2 text-ui-11 font-black uppercase tracking-widest text-app-muted">
                        {t('modules:combat.agencement.titreHorsDeCombat', { count: tombes.length })}
                    </h3>
                    <div className={isGrid ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4" : "space-y-1"}>
                        {tombes.map(combatant => (
                            <CombatCard key={combatant.id} combatant={combatant} isActive={estActif(combatant)} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default InitiativeList;
