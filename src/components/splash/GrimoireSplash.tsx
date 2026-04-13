import React from 'react';

const GrimoireSplash: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen w-screen m-0 p-0 overflow-hidden bg-[#1a0f0a]">
            {/* Background Wrapper */}
            <div className="fixed inset-0 bg-[#1a0f0a] flex items-center justify-center p-8 md:p-16">
                <main className="grimoire-page w-full h-full max-w-6xl rounded-sm flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Decorative Runes */}
                    <div className="absolute top-8 left-8 text-2xl text-arcaneGlow opacity-40 select-none font-serif">ᚦ</div>
                    <div className="absolute top-8 right-8 text-2xl text-arcaneGlow opacity-40 select-none font-serif">座</div>
                    <div className="absolute bottom-8 left-8 text-2xl text-arcaneGlow opacity-40 select-none font-serif">ᚱ</div>
                    <div className="absolute bottom-8 right-8 text-2xl text-arcaneGlow opacity-40 select-none font-serif">ᚲ</div>
                    
                    {/* Rune Background Pattern */}
                    <div 
                        className="absolute inset-0 opacity-[0.07] select-none pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='10' y='30' font-family='serif' font-size='20' fill='%237e22ce'%3Eᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ%3C/text%3E%3Ctext x='10' y='60' font-family='serif' font-size='20' fill='%237e22ce'%3Eᚺ ᚻ ᛁ ᛃ ᛇ ᛈ ᛉ ᛋ%3C/text%3E%3Ctext x='10' y='90' font-family='serif' font-size='20' fill='%237e22ce'%3Eᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ%3C/text%3E%3C/svg%3E")`,
                            maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
                            WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
                        }}
                    ></div>

                    <div className="relative mb-8">
                        <div className="absolute -inset-16 bg-purple-500/10 rounded-full blur-[80px]"></div>
                        <div className="relative animate-[pulse_4s_ease-in-out_infinite]">
                            <svg className="w-56 h-56 text-[#4a3728]" fill="none" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeDasharray="2 4" strokeWidth="0.5"></circle>
                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5"></circle>
                                <path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" stroke="currentColor" strokeWidth="1"></path>
                                <path d="M50 15 V85 M15 35 L85 65 M15 65 L85 35" opacity="0.6" stroke="currentColor" strokeWidth="0.5"></path>
                                <text className="italic" fill="currentColor" fontSize="8" x="46" y="32">Ω</text>
                                <text className="italic" fill="currentColor" fontSize="8" x="46" y="75">ψ</text>
                                <circle className="animate-pulse" cx="50" cy="50" fill="#7e22ce" r="5"></circle>
                            </svg>
                        </div>
                    </div>

                    <div className="text-center space-y-4 relative z-10 font-cinzel">
                        <h1 className="text-6xl md:text-8xl font-fraktur text-[#2d1b15] tracking-normal">
                            GM-OS <span className="text-4xl align-top opacity-70">vVI.III</span>
                        </h1>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px w-12 bg-[#4a3728]/30"></div>
                            <p className="font-script text-3xl text-[#4a3728]/80 italic">The Weaver's Chronicle Awakens</p>
                            <div className="h-px w-12 bg-[#4a3728]/30"></div>
                        </div>
                    </div>

                    <div className="w-full max-w-lg mt-16 space-y-6 flex flex-col items-center">
                        <div className="relative w-full h-8 flex items-center justify-center">
                            <div className="absolute left-0 h-[2px] bg-[#4a3728] shadow-[0_0_8px_rgba(126,34,206,0.4)] animate-[quillWrite_6s_ease-out_forwards]"></div>
                            <div className="absolute inset-0 border-b border-[#4a3728]/20"></div>
                        </div>
                        <div className="h-12 overflow-hidden w-full flex justify-center">
                            <div className="font-script text-2xl text-[#5d4037] text-center italic opacity-90 animate-pulse">
                                "By the silvered moon, the ley lines entwine..."
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Aside Logs */}
            <aside className="fixed bottom-12 right-12 w-72 pointer-events-none hidden lg:block">
                <div className="space-y-4">
                    <div className="flex items-start gap-3 opacity-0 animate-[fadeIn_1s_ease-out_forwards] translate-y-4" style={{ animationDelay: '1s' }}>
                        <span className="material-symbols-outlined text-purple-800 text-sm">auto_fix</span>
                        <p className="text-xs text-[#2d1b15] italic leading-relaxed border-l border-purple-300 pl-2">
                            Channeling essence into the Phantasmal Bridge...
                        </p>
                    </div>
                    <div className="flex items-start gap-3 opacity-0 animate-[fadeIn_1s_ease-out_forwards] translate-y-4" style={{ animationDelay: '2.5s' }}>
                        <span className="material-symbols-outlined text-purple-800 text-sm">menu_book</span>
                        <p className="text-xs text-[#2d1b15] italic leading-relaxed border-l border-purple-300 pl-2">
                            Unsealing the Bestiary of Forgotten Souls...
                        </p>
                    </div>
                    <div className="flex items-start gap-3 opacity-0 animate-[fadeIn_1s_ease-out_forwards] translate-y-4" style={{ animationDelay: '4s' }}>
                        <span className="material-symbols-outlined text-purple-800 text-sm">history_edu</span>
                        <p className="text-xs text-[#2d1b15] italic leading-relaxed border-l border-purple-300 pl-2">
                            The Chronicler is recording your destiny.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Corner Info */}
            <div className="fixed top-12 left-12 hidden sm:flex flex-col gap-1">
                <div className="text-[10px] text-[#4a3728]/60 uppercase tracking-widest font-cinzel">Aetheric Frequency: 432Hz</div>
                <div className="text-[10px] text-[#4a3728]/60 uppercase tracking-widest font-cinzel">Celestial Phase: Waxing</div>
            </div>

            <style>{`
                @keyframes quillWrite {
                    0% { width: 0; opacity: 0; }
                    10% { opacity: 1; }
                    100% { width: 100%; opacity: 1; }
                }
                @keyframes fadeIn {
                    to { opacity: 0.7; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default GrimoireSplash;
