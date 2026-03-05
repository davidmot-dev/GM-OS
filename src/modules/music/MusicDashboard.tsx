import React from 'react';
import Deck from './components/Deck';
import Mixer from './components/Mixer';
import PlaylistManager, { PlaylistSidebar } from './components/PlaylistManager';

const MusicDashboard: React.FC = () => {
    return (
        <div className="flex h-full overflow-hidden bg-slate-950 -my-6 -mr-6 ml-6 rounded-l-3xl border-y border-l border-white/5 shadow-2xl">


            {/* Sidebar: Navigation & Favorites */}
            <PlaylistSidebar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
                {/* Top Section: Decks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Deck side="A" />
                    <Deck side="B" />
                </div>

                {/* Middle Section: Mixer Control */}
                <div className="flex flex-col items-center gap-4 py-4">
                    <Mixer />
                </div>

                {/* Bottom Section: Playlists & Pads */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <PlaylistManager />
                </div>
            </main>
        </div>

    );
};

export default MusicDashboard;

