import React from 'react';

const CyberpunkSplash: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen w-screen m-0 p-0 text-slate-300 overflow-hidden bg-obsidian">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 particles opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-obsidian/50 to-obsidian"></div>
            </div>

            {/* Splash Content */}
            <main className="relative z-10 flex flex-col items-center justify-center space-y-12 w-full max-w-4xl px-4">
                {/* Central Icon Section */}
                <div className="relative group">
                    {/* Glow effect backdrop */}
                    <div className="absolute -inset-8 bg-neonCyan/20 rounded-full blur-3xl opacity-50 animate-pulse-glow"></div>
                    {/* d20 Geometric SVG */}
                    <svg className="w-48 h-48 text-neonCyan drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse-glow" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" viewBox="0 0 24 24">
                        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z"></path>
                        <path d="M3 7l9 5 9-5"></path>
                        <path d="M12 22V12"></path>
                        <path d="M12 12L3 7"></path>
                        <path d="M12 12l9-5"></path>
                        <path d="M3 17l9-5 9 5"></path>
                        <circle className="animate-pulse" cx="12" cy="12" fill="currentColor" r="1.5"></circle>
                    </svg>
                </div>

                {/* Title and Version */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white animate-glitch-long" style={{ textShadow: '2px 0 #a855f7, -2px 0 #22d3ee' }}>
                        GM-OS v{__APP_VERSION__}
                    </h1>
                    <p className="text-neonCyan/60 text-sm uppercase tracking-widest font-mono">Initialization Sequence Engaged</p>
                </div>

                {/* Loading System */}
                <div className="w-full max-w-md space-y-4">
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <div className="h-full bg-gradient-to-r from-neonCyan to-neonViolet shadow-[0_0_10px_#22d3ee] animate-[progressFill_4s_ease-out_forwards]"></div>
                    </div>
                    <div className="flex justify-between text-ui-10 text-slate-500 font-mono">
                        <span>ESTABLISHING SECURE LINK...</span>
                        <span className="animate-pulse">SYNCHRONIZING_</span>
                    </div>
                </div>
            </main>

            {/* Technical Logs Overlay */}
            <aside className="fixed bottom-10 left-10 w-64 h-32 overflow-hidden glass-panel rounded-lg p-3 hidden md:block">
                <div className="text-ui-9 font-mono text-neonCyan/70 h-full">
                    <div className="animate-[scrollLog_10s_linear_infinite] space-y-1">
                        <p>&gt; Linking Philips Hue Bridge...</p>
                        <p>&gt; [SUCCESS] Hue Bridge Connected</p>
                        <p>&gt; Loading Audio Engine: High Fidelity...</p>
                        <p>&gt; Mapping 5.1 Surround Channels...</p>
                        <p>&gt; Syncing Campaign Data (Obsidian.md)...</p>
                        <p>&gt; Fetching Bestiary Database...</p>
                        <p>&gt; [WARN] Low bandwidth on asset mirror</p>
                        <p>&gt; Initializing Fog of War shader...</p>
                        <p>&gt; Calibrating RNG seed generator...</p>
                        <p>&gt; Readying Combat Tracker...</p>
                        {/* Duplicate for infinite scroll */}
                        <p>&gt; Linking Philips Hue Bridge...</p>
                        <p>&gt; [SUCCESS] Hue Bridge Connected</p>
                        <p>&gt; Loading Audio Engine: High Fidelity...</p>
                        <p>&gt; Mapping 5.1 Surround Channels...</p>
                    </div>
                </div>
            </aside>

            {/* Corner Accents */}
            <div className="fixed top-8 right-8 text-ui-10 text-slate-600 font-mono border-r border-t border-slate-700 p-2 hidden sm:block">
                SYSTEM_STATUS: NOMINAL<br/>
                LOCAL_TIME: {new Date().toLocaleTimeString()}
            </div>

            <style>{`
                @keyframes progressFill {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes scrollLog {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
            `}</style>
        </div>
    );
};

export default CyberpunkSplash;
