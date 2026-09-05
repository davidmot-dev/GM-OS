import React from 'react';

const RecoverySplash: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen w-screen m-0 p-0 overflow-hidden bg-[#0a0a0a]">
            {/* CRT Overlay Effects */}
            <div className="fixed inset-0 z-50 crt-overlay pointer-events-none"></div>
            <div className="fixed inset-0 z-50 hidden sm:block pointer-events-none opacity-20 animate-scanline bg-gradient-to-b from-transparent via-amber/5 to-transparent h-24"></div>

            {/* Background Texture */}
            <div 
                className="fixed inset-0 opacity-[0.05] select-none pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 176, 0, 0.2) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                }}
            ></div>

            <main className="relative z-10 flex flex-col items-center justify-center space-y-12 w-full max-w-2xl px-8 border-x border-amber-dim/20 bg-black/40 py-12 animate-flicker">
                <div className="relative mb-4">
                    <div className="absolute inset-0 border-2 border-amber animate-spark blur-sm opacity-30 rounded-full scale-125"></div>
                    <svg className="w-40 h-40 text-amber/80 filter drop-shadow-[0_0_8px_rgba(255,176,0,0.6)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" strokeDasharray="2 1"></path>
                        <path d="M3 7l9 5 9-5"></path>
                        <path d="M12 22V12"></path>
                        <path d="M12 12L3 7"></path>
                        <path d="M12 12l9-5"></path>
                        <path d="M3 17l9-5 9 5" strokeDasharray="1 1"></path>
                        <path className="opacity-40" d="M12 2L12 12" strokeWidth="0.5"></path>
                    </svg>
                    <div className="absolute -top-4 -right-2 w-1 h-1 bg-amber animate-ping"></div>
                    <div className="absolute bottom-10 -left-6 w-1 h-1 bg-amber animate-ping [animation-delay:0.5s]"></div>
                </div>

                <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black tracking-[0.2em] font-elite uppercase border-2 border-amber p-4 bg-amber/5 animate-glitch-skew">
                        GM-OS v{__APP_VERSION__}
                    </h1>
                    <div className="flex items-center justify-center space-x-2">
                        <span className="inline-block w-2 h-2 bg-red-600 animate-pulse"></span>
                        <p className="text-xs uppercase tracking-[0.4em] font-bold text-amber-dim">Emergency Recovery Protocol Active</p>
                    </div>
                </div>

                <div className="w-full max-w-md space-y-3 font-mono">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-ui-10 font-bold tracking-tighter uppercase">Power Draw: Critical</span>
                        <span className="text-xs">PWR_LVL: 74%</span>
                    </div>
                    <div className="flex gap-1">
                        {[...Array(18)].map((_, i) => (
                            <div key={i} className="h-4 w-3 bg-amber shadow-[0_0_10px_#ffb000] border border-black/50"></div>
                        ))}
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-4 w-3 bg-amber-dim opacity-20 border border-black/50"></div>
                        ))}
                    </div>
                    <div className="flex justify-between text-ui-9 text-amber-dim uppercase">
                        <span>BUS_ID: 0x88F2A</span>
                        <span>RESERVE_CELLS: OFFLINE</span>
                    </div>
                </div>
            </main>

            <aside className="fixed bottom-8 left-8 w-80 space-y-1 font-mono text-ui-11 animate-flicker pointer-events-none">
                <p className="text-amber-dim opacity-50"># KERNEL BOOT SEQUENCE 1.0.4-RUGGED</p>
                <p className="text-red-500 font-bold">!!! CRITICAL: ANALOG_LINK_ERROR (HUE_BRIDGE_FAILED)</p>
                <p className="">&gt; BYPASSING SAFETY INTERLOCKS...</p>
                <p className="text-amber-dim">&gt; SCRAPING LOCAL CACHE: Campaign_Data.db</p>
                <p className="">&gt; VOLTAGE STABILIZING AT 12.4V</p>
                <p className="text-red-500 font-bold">!!! WARNING: CORRUPT SECTORS IN BESTIARY_V2</p>
                <p className="">&gt; RE-ROUTING POWER TO GRAPHICS ENGINE...</p>
                <p className="">&gt; INITIALIZING SURVIVAL MODE UI</p>
                <p className="animate-pulse">&gt; AWAITING INPUT_</p>
            </aside>

            <div className="fixed top-8 right-8 text-ui-10 text-amber-dim font-mono border border-amber-dim/40 p-3 bg-black/80">
                SITE_TEMP: 104°F<br/>
                RADIATION: 0.12 mSv/h<br/>
                <span className="text-amber font-bold">STATUS: HAZARDOUS</span>
            </div>

            <div className="fixed top-8 left-8 text-ui-10 text-amber/40 font-mono tracking-widest uppercase [writing-mode:vertical-lr] rotate-180">
                Waste-Land Comm-Unit v{__APP_VERSION__}
            </div>

            <style>{`
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
            `}</style>
        </div>
    );
};

export default RecoverySplash;
