import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MapCanvas from './components/MapCanvas';
import { BarreEnJeu, ActionsDeLaCarte, PanneauDeLaCarte } from './components/MapControls';
import { useMapStore } from './useMapStore';
import { useCombatStore } from '../combat/useCombatStore';
import { useHardwareStore } from '../../stores/useHardwareStore';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';
import { Bouton, Etiquette, EnTeteDeModule, GabaritDeModule } from '../../components/socle';

/**
 * **La Cartographie réagencée — refonte, phase 4, L3, étape 2 (2026-10-02).**
 *
 * La maquette retenue le 2026-09-26, dans la grammaire d'écran commune :
 * l'en-tête et ses actions (Cortex tactique, recadrer, projeter), **la barre
 * « En jeu direct »** au-dessus, **la carte au plus large**, et à droite le
 * panneau — ce qui se joue en haut, ce qui se prépare en bas. Voir
 * `components/MapControls.tsx`.
 */
const MapDashboard: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const regime = useRegimeDInterface();
    const [reglagesOuverts, setReglagesOuverts] = React.useState(true);
    const mapName = useMapStore(s => s.mapName);
    const mapUrl = useMapStore(s => s.mapUrl);
    const projectionTarget = useMapStore(s => s.projectionTarget);
    const enCombat = useCombatStore(s => s.combatants.length > 0);
    const round = useCombatStore(s => s.round);
    const { getDisplayLabel } = useHardwareStore();

    return (
        <GabaritDeModule
            aLaTable={regime.aLaTable}
            reglagesOuverts={reglagesOuverts}
            className="text-app-text"
            entete={
                <EnTeteDeModule
                    titre={t('names.map')}
                    etat={<>
                        {mapUrl
                            ? <Etiquette>{t('map.agencement.carte', { nom: mapName || '—' })}</Etiquette>
                            : <Etiquette>{t('map.agencement.aucune_carte')}</Etiquette>}
                        {enCombat && <Etiquette ton="danger">{t('map.agencement.round', { n: round })}</Etiquette>}
                        {projectionTarget && <Etiquette ton="accent">{t('map.agencement.projetee', { cible: getDisplayLabel(projectionTarget) })}</Etiquette>}
                    </>}
                    actions={<>
                        <ActionsDeLaCarte />
                        {regime.aLaTable && (
                            <Bouton aLaTable icone={<SlidersHorizontal size={16} />} aria-pressed={reglagesOuverts} onClick={() => setReglagesOuverts(!reglagesOuverts)}>
                                {t('map.agencement.reglages')}
                            </Bouton>
                        )}
                    </>}
                />
            }
            barreDOutils={<BarreEnJeu />}
            reglages={<PanneauDeLaCarte />}
        >
            <div className="flex h-full min-h-[24rem] flex-col">
                <MapCanvas />
            </div>
        </GabaritDeModule>
    );
};

export default MapDashboard;
