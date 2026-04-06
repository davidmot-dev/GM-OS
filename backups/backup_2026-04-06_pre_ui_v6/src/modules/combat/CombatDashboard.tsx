import InitiativeList from './components/InitiativeList';
import CombatControls from './components/CombatControls';
import { useVoiceAutomation } from '../voice/hooks/useVoiceAutomation';

const CombatDashboard: React.FC = () => {
    useVoiceAutomation();
    
    return (

        <div className="h-full flex text-app-text overflow-hidden animate-in fade-in duration-300">
            <InitiativeList />
            <CombatControls />
        </div>
    );
};

export default CombatDashboard;
