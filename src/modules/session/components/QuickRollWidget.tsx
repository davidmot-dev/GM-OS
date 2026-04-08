import React from 'react';
import { History, Dices } from 'lucide-react';

const QuickRollWidget: React.FC = () => {

    const quickDice = [
        { label: 'd4', expression: '1d4' },
        { label: 'd6', expression: '1d6' },
        { label: 'd8', expression: '1d8' },
        { label: 'd10', expression: '1d10' },
        { label: 'd12', expression: '1d12' },
        { label: 'd20', expression: '1d20', highlight: true },
        { label: 'd%', expression: '1d100' },
    ];

    const handleQuickRoll = (expression: string) => {
        console.log(`[QuickRoll] Triggered: ${expression}`);
        // TODO: Mettre en place useDiceStore pour lier ça globalement
    };

    return (
        <div className="mt-auto bg-slate-900 flex flex-col p-4 rounded-xl border border-slate-800 shadow-lg shrink-0">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Dices size={12} /> Quick Roll
                </span>
                <button className="text-gm-gold text-[10px] font-bold hover:underline flex items-center gap-1">
                    <History size={12} /> HISTORY
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {quickDice.map((dice) => (
                    <button
                        key={dice.label}
                        onClick={() => handleQuickRoll(dice.expression)}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${dice.highlight
                            ? 'bg-gm-gold/20 border border-gm-gold/50 shadow-glow-gold text-slate-100 hover:bg-gm-gold/30'
                            : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                            }`}
                        title={`Roll ${dice.expression}`}
                    >
                        <span className={`text-[10px] font-mono mb-0.5 ${dice.highlight ? 'text-gm-gold' : 'text-slate-500'}`}>
                            {dice.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickRollWidget;
