import React, { useEffect } from 'react';
import { useNPCStore } from './useNPCStore';
import NPCControls from './components/NPCControls';
import NPCCard from './components/NPCCard';
import NPCHistory from './components/NPCHistory';

const NPCDashboard: React.FC = () => {
    const { fetchUniverses } = useNPCStore();

    useEffect(() => {
        fetchUniverses();
    }, [fetchUniverses]);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-app-bg text-slate-200">
            {/* Sidebar Left: Config & History */}
            <aside className="w-80 border-r border-app-border flex flex-col bg-app-surface/30">
                <NPCControls />
                <div className="flex-1 overflow-hidden">
                    <NPCHistory />
                </div>
            </aside>

            {/* Main Content: The Generator Card */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-accent/5 overflow-y-auto custom-scrollbar">
                <NPCCard />
            </main>
        </div>
    );
};

export default NPCDashboard;
