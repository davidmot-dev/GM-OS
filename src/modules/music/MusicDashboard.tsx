import React from 'react';
import Deck from './components/Deck';
import Mixer from './components/Mixer';
import PlaylistManager from './components/PlaylistManager';
import { useMusicKeyboardControls } from './useMusicKeyboardControls';

const MusicDashboard: React.FC = () => {
    // Initialize Global Input Listeners
    useMusicKeyboardControls();

    return (
        <div className="flex h-full overflow-hidden bg-app-bg -my-6 -mr-6 ml-6 rounded-l-3xl border-y border-l border-app-border/50 shadow-2xl relative">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar relative">
                {/* Header Integration */}

                {/* Background glow behind main area */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-accent/5 blur-[120px] pointer-events-none" />

                {/* Top Section: Decks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <Deck side="A" />
                    <Deck side="B" />
                </div>

                {/* Middle Section: Playlists & Pads (NOW CENTRAL) */}
                <div className="flex-1 min-h-0 flex flex-col relative z-10">
                    <PlaylistManager />
                </div>

                {/* Bottom Section: Mixer Control */}
                <div className="flex flex-col items-center gap-4 py-8 relative z-10">
                    <Mixer />
                </div>
            </main>
        </div>

    );
};

export default MusicDashboard;

