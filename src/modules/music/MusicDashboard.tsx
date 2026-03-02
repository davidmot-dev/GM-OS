import React from 'react';
import Deck from './components/Deck';
import Mixer from './components/Mixer';
import PlaylistManager from './components/PlaylistManager';
import HistoryPanel from './components/HistoryPanel';

const MusicDashboard: React.FC = () => {
    return (
        <div className="h-full flex flex-col lg:flex-row gap-6">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Top Section: Decks & Mixer */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_280px_1fr] gap-6 min-h-[240px]">
                    <Deck side="A" />
                    <Mixer />
                    <Deck side="B" />
                </div>

                {/* Bottom Section: Playlists & Pads */}
                <div className="flex-1 min-h-0 bg-slate-900/40 rounded-3xl border border-slate-800/50 backdrop-blur-md overflow-hidden flex flex-col">
                    <PlaylistManager />
                </div>
            </div>

            {/* Side Panel: History & Console */}
            <div className="w-full lg:w-80 bg-slate-900/40 rounded-3xl border border-slate-800/50 backdrop-blur-md overflow-hidden flex flex-col shrink-0">
                <HistoryPanel />
            </div>
        </div>
    );
};

export default MusicDashboard;
