import React from 'react';
import InitiativeList from './components/InitiativeList';
import CombatControls from './components/CombatControls';

const CombatDashboard: React.FC = () => {
    return (
        <div className="h-full flex text-white overflow-hidden animate-in fade-in duration-300">
            <InitiativeList />
            <CombatControls />
        </div>
    );
};

export default CombatDashboard;
