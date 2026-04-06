import React, { useEffect, useState } from 'react';

const ZenSplash: React.FC = () => {
    const [statusIndex, setStatusIndex] = useState(0);
    const statuses = ["Calibrating environment", "System alignment complete"];

    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statuses.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [statuses.length]);

    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen m-0 p-0 overflow-hidden bg-obsidian-dark">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,_#1a2421_0%,_#121417_100%)]">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]"></div>
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center w-full max-w-2xl px-8">
                <div className="relative mb-16 flex items-center justify-center">
                    <div className="absolute w-64 h-64 bg-[radial-gradient(circle,_rgba(255,255,255,0.03)_0%,_transparent_70%)] rounded-full animate-pulse-slow"></div>
                    <svg className="w-16 h-16 opacity-30 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.8L19.2 8 12 11.2 4.8 8 12 4.8zM4.5 9.8l6.5 2.9v6.5l-6.5-3.6V9.8zm15 0v5.8l-6.5 3.6v-6.5l6.5-2.9z"></path>
                    </svg>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-2xl md:text-3xl font-light tracking-[0.5em] text-white/80 uppercase mb-2 font-display">
                        GM — OS
                    </h1>
                    <div className="h-[1px] w-8 bg-white/20 mx-auto"></div>
                </div>

                <div className="w-48 mb-12">
                    <div className="w-full h-[1px] bg-white/5 overflow-hidden">
                        <div className="h-full bg-white opacity-20 animate-[progressFill_5s_infinite_linear]"></div>
                    </div>
                </div>

                <div className="h-6 flex items-center justify-center overflow-hidden">
                    <div className="relative w-full text-center h-6">
                        {statuses.map((status, i) => (
                            <span
                                key={status}
                                className={`absolute inset-0 text-[10px] tracking-[0.2em] font-light uppercase transition-all duration-1000 transform ${
                                    statusIndex === i 
                                    ? 'opacity-100 translate-y-0' 
                                    : 'opacity-0 translate-y-4'
                                }`}
                            >
                                {status}
                            </span>
                        ))}
                    </div>
                </div>
            </main>

            <div className="fixed bottom-12 text-[9px] tracking-[0.3em] font-light text-white/10 uppercase font-mono">
                Presence Established
            </div>

            <style>{`
                @keyframes progressFill {
                    0% { width: 0%; opacity: 0.1; }
                    50% { opacity: 0.4; }
                    100% { width: 100%; opacity: 0.2; }
                }
            `}</style>
        </div>
    );
};

export default ZenSplash;
