import React from 'react';
import { Gift, Sparkles, Coins } from 'lucide-react';
import type { InventoryItem } from '../modules/session/useSessionOSStore';

interface LootNotificationProps {
    items: InventoryItem[];
    tableName: string;
    isVisible: boolean;
}

const rarityColors = {
    common: 'from-slate-500/20 to-slate-600/20 border-slate-500/50 text-slate-300',
    uncommon: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/50 text-emerald-300',
    rare: 'from-blue-500/20 to-blue-600/20 border-blue-500/50 text-blue-300',
    epic: 'from-purple-500/20 to-purple-600/20 border-purple-500/50 text-purple-300',
    legendary: 'from-orange-500/20 to-orange-600/20 border-orange-500/50 text-orange-300',
    artifact: 'from-red-500/20 to-red-600/20 border-red-500/50 text-red-300',
};

const rarityGlow = {
    common: 'shadow-slate-500/10',
    uncommon: 'shadow-emerald-500/20',
    rare: 'shadow-blue-500/20',
    epic: 'shadow-purple-500/20',
    legendary: 'shadow-orange-500/30',
    artifact: 'shadow-red-500/40',
};

export const LootNotification: React.FC<LootNotificationProps> = ({ items, tableName, isVisible }) => {
    if (!isVisible || items.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-12 pointer-events-none animate-in fade-in duration-500">
            <div className={`bg-slate-950/90 backdrop-blur-3xl border-2 border-white/10 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center gap-8 max-w-3xl w-full transform transition-all duration-1000 ${
                isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8 opacity-0'
            }`}>
                {/* Header */}
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Gift className="w-5 h-5 animate-bounce" />
                        <span className="text-xs font-black uppercase tracking-[0.5em]">Butin Découvert</span>
                        <Gift className="w-5 h-5 animate-bounce" />
                    </div>
                    <h2 className="text-white text-3xl font-black tracking-tighter uppercase drop-shadow-xl">
                        {tableName || 'Nouveau Trésor'}
                    </h2>
                </div>

                {/* Items List */}
                <div className="flex flex-wrap gap-4 justify-center w-full max-h-[40vh] overflow-y-auto custom-scrollbar p-2">
                    {items.map((item, idx) => (
                        <div 
                            key={item.id}
                            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border bg-gradient-to-br transition-all duration-500 animate-in zoom-in slide-in-from-bottom-4 shadow-xl ${rarityColors[item.rarity]} ${rarityGlow[item.rarity]}`}
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            <div className="relative">
                                {item.type === 'currency' ? (
                                    <Coins className="w-12 h-12" />
                                ) : (
                                    <Gift className="w-12 h-12" />
                                )}
                                <div className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg">
                                    x{item.quantity}
                                </div>
                            </div>
                            <div className="text-center">
                                <h4 className="font-black text-lg leading-tight">{item.name}</h4>
                                <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">{item.rarity}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Visual Flair */}
                <div className="flex items-center gap-2 opacity-40">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 italic">Synchronisation de l'inventaire en cours...</span>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                </div>
            </div>
        </div>
    );
};
