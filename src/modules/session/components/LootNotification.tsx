import React, { useEffect, useState } from 'react';
import { Package, Sparkles, ChevronRight } from 'lucide-react';
import type { InventoryItem } from '../useSessionOSStore';

interface LootNotificationProps {
    items: InventoryItem[];
    onClose: () => void;
}

const LootNotification: React.FC<LootNotificationProps> = ({ items, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const showTimer = setTimeout(() => setVisible(true), 50);
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 800); // Wait for fade out animation
        }, 8500);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [onClose]);

    if (items.length === 0) return null;

    return (
        <div className={`fixed bottom-12 right-12 z-[100] transition-all duration-700 ease-out transform ${visible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-[120%] opacity-0 scale-90'}`}>
            <div className="bg-slate-900/90 backdrop-blur-2xl border-2 border-cyan-400/40 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(34,211,238,0.2)] flex flex-col gap-4 w-80 overflow-hidden relative group">
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl group-hover:bg-cyan-400/20 transition-all duration-1000" />
                
                <div className="absolute top-4 right-4 text-cyan-400/20 animate-pulse">
                    <Sparkles size={32} />
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-400 flex items-center justify-center text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                        <Package size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tight text-white uppercase leading-none mb-1">Butin Reçu !</h3>
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] opacity-80">Trésors ajoutés à la fiche</p>
                    </div>
                </div>

                <div className="space-y-2 relative z-10 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {items.map((item, idx) => (
                        <div 
                            key={idx} 
                            className={`flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors animate-in slide-in-from-right duration-300 [--tw-enter-delay:${idx * 100}ms]`}
                        >
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-200">{String(item.name || 'Objet sans nom')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    {item.type} • {item.rarity || 'Commun'}
                                </span>
                            </div>
                            <div className="text-cyan-400 font-mono font-black text-sm bg-cyan-400/10 px-2 py-1 rounded-lg border border-cyan-400/20">
                                x{item.quantity}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-2 flex items-center justify-between relative z-10 mt-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic flex items-center gap-1">
                        <ChevronRight size={10} className="text-cyan-400/40" /> Fiche de personnage mise à jour
                    </span>
                    <button 
                        onClick={() => { setVisible(false); setTimeout(onClose, 800); }} 
                        className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors p-1"
                    >
                        Fermer
                    </button>
                </div>
                
                {/* Progress bar for auto-close */}
                <div 
                    className={`absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-[8000ms] ease-linear ${visible ? 'w-full' : 'w-0'}`} 
                />
            </div>
        </div>
    );
};

export default LootNotification;
