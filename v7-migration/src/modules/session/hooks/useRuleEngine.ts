import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useSessionOSStore } from '../useSessionOSStore';
import { useGemStore } from '../../../stores/useGemStore';
import type { GameDriver, TacticalConfig } from '../../../types/drivers';
import { gmToast } from '../../../stores/useToastStore';
import { personaGeneratorService } from '../../ai/PersonaGeneratorService';

const DEFAULT_RANGES: TacticalConfig['ranges'] = {
    contact: { label: 'session.rule_engine_editor.tactical.ranges.contact', maxUnits: 1, modifier: 0 },
    courte: { label: 'session.rule_engine_editor.tactical.ranges.courte', maxUnits: 3, modifier: 0 },
    moyenne: { label: 'session.rule_engine_editor.tactical.ranges.moyenne', maxUnits: 6, modifier: -2 },
    longue: { label: 'session.rule_engine_editor.tactical.ranges.longue', maxUnits: 12, modifier: -5 },
    extreme: { label: 'session.rule_engine_editor.tactical.ranges.extreme', maxUnits: 24, modifier: -10 }
};


export type RuleEngineSection = 'core' | 'combat' | 'tactical' | 'ai' | 'notebook' | 'loot';

export function useRuleEngine() {
    const { t } = useTranslation(['modules']);

    const driver = useSessionOSStore(state => {
        const { editingDriverId, customGameDrivers, getGameDriver } = state;
        if (!editingDriverId) return null;
        return (Boolean(customGameDrivers) && getGameDriver(editingDriverId)) || null;
    });

    const { 
        setEditingDriverId, 
        updateGameDriver, 
        setCurrentView,
        customSheetTemplates 
    } = useSessionOSStore();

    const { gems, syncGemsWithDefaults } = useGemStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeSection, setActiveSection] = useState<RuleEngineSection>('core');

    useEffect(() => {
        syncGemsWithDefaults();
    }, [syncGemsWithDefaults]);

    const handleUpdate = (updates: Partial<GameDriver>) => {
        if (!driver) return;
        updateGameDriver(driver.id, updates);
    };

    const handleBack = () => {
        setEditingDriverId(null);
        setCurrentView('templates');
    };

    const handleAutoGenerate = async () => {
        if (!driver) return;
        setIsGenerating(true);
        try {
            const context = {
                name: driver.name,
                universe: driver.description || driver.name,
                style: t('modules:session.rule_engine_editor.ai.style_technical')
            };
            const personas = await personaGeneratorService.generateAllPersonas(context, true);
            handleUpdate({ aiPersonas: personas });
            gmToast(t('modules:session.rule_engine_editor.ai.sync_success'), "success");
        } catch (error) {
            console.error("Génération error:", error);
            gmToast(t('modules:session.rule_engine_editor.ai.sync_error'), "error");
        } finally {
            setIsGenerating(false);
        }

    };

    const dice: NonNullable<GameDriver['dice']> = driver?.dice || { engine: 'standard', defaultDice: '1d20', logic: 'sum' };
    const combat: NonNullable<GameDriver['combat']> = driver?.combat || { initiativeFormula: 'dex', initiativeSort: 'desc', defaultHealthType: 'hp', statsToTrack: [] };
    const tactical: NonNullable<GameDriver['tactical']> = driver?.tactical || { useTacticalAI: true, ranges: DEFAULT_RANGES };

    return {
        driver,
        activeSection,
        setActiveSection,
        isGenerating,
        dice,
        combat,
        tactical,
        handleUpdate,
        handleBack,
        handleAutoGenerate,
        customSheetTemplates,
        gems
    };
}
