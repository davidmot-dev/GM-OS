import InitiativeList from './components/InitiativeList';
import CombatControls from './components/CombatControls';
import BandeauDeLaScene from './components/BandeauDeLaScene';
import { useVoiceAutomation } from '../voice/hooks/useVoiceAutomation';
import { useSessionOSStore } from '../session/useSessionOSStore';
import PanneauDeCoc from './components/PanneauDeCoc';

const CombatDashboard: React.FC = () => {
    useVoiceAutomation();
    const coc = useSessionOSStore(s => !!s.getActiveDriver()?.jet?.coc?.suivi);

    return (
        /*
          Le bandeau passe AU-DESSUS des deux colonnes, et pas dans l'une
          d'elles : il parle du combat entier — de quelle scène il relève —, pas
          de l'initiative ni des contrôles.
        */
        <div className="h-full flex flex-col text-app-text overflow-hidden animate-in fade-in duration-300">
            <BandeauDeLaScene />
            <div className="flex-1 min-h-0 flex">
                {coc ? <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                    <div className="max-h-[60vh] overflow-y-auto shrink-0 p-3"><PanneauDeCoc /></div>
                    <InitiativeList />
                </div> : <InitiativeList />}
                <CombatControls />
            </div>
        </div>
    );
};

export default CombatDashboard;
