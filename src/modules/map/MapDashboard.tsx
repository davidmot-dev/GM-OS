import React from 'react';
import MapCanvas from './components/MapCanvas';
import MapControls from './components/MapControls';

const MapDashboard: React.FC = () => {
    return (
        <div className="flex h-full w-full bg-app-bg text-slate-200 overflow-hidden">
            {/* Main Content Area - Board */}
            <main className="flex-1 flex flex-col p-4">
                <MapCanvas />
            </main>

            {/* Right Sidebar - Tools */}
            <MapControls />
        </div>
    );
};

export default MapDashboard;
