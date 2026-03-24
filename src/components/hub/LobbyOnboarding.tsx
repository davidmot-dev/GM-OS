import React, { useState } from 'react';
import { useClientStore } from '../../stores/useClientStore';
import { User, Shield, Zap, Book } from 'lucide-react';

const LobbyOnboarding: React.FC = () => {
    const { pseudo, setPseudo, role, setRole, completeOnboarding } = useClientStore();
    const [inputValue, setInputValue] = useState(pseudo);

    const roles = [
        { id: 'player', label: 'Joueur', icon: User, desc: 'Vue standard du personnage' },
        { id: 'combat', label: 'Combat', icon: Shield, desc: 'Focus sur l\'initiative et la survie' },
        { id: 'narrative', label: 'Récit', icon: Book, desc: 'Focus sur le lore et l\'ambiance' },
        { id: 'remote', label: 'Distante', icon: Zap, desc: 'Contrôle déporté (avancé)' },
    ];

    const handleJoin = () => {
        if (inputValue.trim()) {
            setPseudo(inputValue.trim());
            completeOnboarding();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Rejoindre la Table</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Identité du Héros</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Pseudonyme</label>
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ex: Arwen, MJ-Assist..."
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-gm-cyan/50 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Rôle suggéré</label>
                        <div className="grid grid-cols-2 gap-3">
                            {roles.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setRole(r.id as any)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                                        role === r.id 
                                            ? 'bg-gm-cyan/10 border-gm-cyan text-gm-cyan' 
                                            : 'bg-slate-950/50 border-white/5 text-slate-400 hover:border-white/20'
                                    }`}
                                >
                                    <r.icon size={20} />
                                    <span className="text-[10px] font-black uppercase">{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleJoin}
                        disabled={!inputValue.trim()}
                        className="w-full bg-gm-cyan hover:bg-gm-cyan/90 disabled:opacity-30 text-slate-950 font-black py-5 rounded-2xl transition-all shadow-lg active:scale-95 uppercase tracking-tighter"
                    >
                        Entrer dans le Hub
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LobbyOnboarding;
