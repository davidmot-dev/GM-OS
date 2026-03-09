import React, { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { gmToast } from '../../../stores/useToastStore';
import { gmConfirm, gmPrompt } from '../../../stores/useModalStore';
import { UserPlus, RefreshCw, Dices, Save, FolderOpen, Play, Skull, ArrowDown01, ArrowUp10 } from 'lucide-react';

const CombatControls: React.FC = () => {
    const {
        round,
        rollAutoInitiative,
        sortInitiative,
        nextTurn,
        addCombatant,
        clearCombatants,
        syncCombatantHPToSession
    } = useCombatStore();

    const [diceMax, setDiceMax] = useState<number>(20);

    const handleAddCombatant = () => {
        gmPrompt('Nom du nouveau combattant :', 'Nouveau Combattant', (name) => {
            if (name.trim()) {
                addCombatant({
                    name: name.trim(),
                    init: 0,
                    hp: 10,
                    hpMax: 10,
                    isPlayer: false,
                    statuses: []
                });
            }
        });
    };

    const handleLoadCombat = () => {
        // Implementation for loading a combat JSON via AppBridge would go here
        console.log("Loading combat...");
    };

    const handleSaveCombat = () => {
        // Implementation for saving combat via AppBridge would go here
        console.log("Saving combat...");
    };

    return (
        <aside className="w-80 bg-obsidian-light/40 border-l border-gm-crimson/20 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">

            {/* Header */}
            <h2 className="text-xl font-display font-bold text-white mb-6 uppercase tracking-widest border-b border-gm-crimson/30 pb-2">
                Contrôles
            </h2>

            {/* Main Action: Next Turn */}
            <div className="bg-gm-crimson/10 border border-gm-crimson/30 p-4 rounded-xl mb-6 shadow-glow-crimson flex flex-col items-center">
                <div className="text-slate-300 text-sm uppercase tracking-wider mb-2">
                    Round <span className="text-white font-bold text-xl ml-1">{round.toString().padStart(2, '0')}</span>
                </div>
                <button
                    onClick={nextTurn}
                    className="w-full bg-gm-crimson hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-glow-crimson group"
                >
                    <span className="text-lg">TOUR SUIVANT</span>
                    <Play fill="currentColor" size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Auto Initiative */}
            <div className="mb-6 space-y-3">
                <h3 className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Auto-Initiative (PNJ)</h3>
                <div className="flex gap-2">
                    <select
                        className="bg-obsidian border border-gray-700 rounded-lg text-white px-3 py-2 outline-none focus:border-gm-crimson flex-1"
                        value={diceMax}
                        onChange={(e) => setDiceMax(Number(e.target.value))}
                    >
                        <option value={4}>d4</option>
                        <option value={6}>d6</option>
                        <option value={8}>d8</option>
                        <option value={10}>d10</option>
                        <option value={12}>d12</option>
                        <option value={20}>d20</option>
                        <option value={100}>d100</option>
                    </select>
                    <button
                        onClick={() => rollAutoInitiative(diceMax)}
                        className="bg-obsidian hover:bg-gm-crimson/20 border border-gm-crimson/50 text-gm-crimson hover:text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors flex-1"
                        title="Jette l'initiative pour tous ceux à 0"
                    >
                        <Dices size={18} />
                        <span>Rouler</span>
                    </button>
                </div>
            </div>

            {/* List Management */}
            <div className="space-y-2 mb-6">
                <button
                    onClick={handleAddCombatant}
                    className="w-full bg-obsidian-dark hover:bg-obsidian border border-gray-700 hover:border-gray-500 text-slate-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <UserPlus size={18} />
                    <span>Ajouter Combattant</span>
                </button>

                <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                        onClick={() => sortInitiative(false)}
                        className="bg-obsidian-dark hover:bg-obsidian border border-gray-700 text-slate-300 p-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
                        title="Trier (Décroissant)"
                    >
                        <ArrowDown01 size={16} /> Trie
                    </button>
                    <button
                        onClick={() => sortInitiative(true)}
                        className="bg-obsidian-dark hover:bg-obsidian border border-gray-700 text-slate-300 p-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-sm"
                        title="Trier (Croissant)"
                    >
                        <ArrowUp10 size={16} /> Trie
                    </button>
                </div>
            </div>

            {/* Sync & Advanced */}
            <div className="mt-auto space-y-4 pt-6 border-t border-gray-800">
                <button
                    onClick={() => {
                        syncCombatantHPToSession();
                        gmToast("Points de Vie synchronisés !");
                    }}
                    className="w-full bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-glow-emerald"
                >
                    <RefreshCw size={18} />
                    <span>Sync PV vers Session</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleSaveCombat} className="bg-obsidian flex items-center justify-center gap-1 p-2 rounded text-slate-400 hover:text-white hover:bg-gray-800 transition-colors" title="Sauvegarder Combat">
                        <Save size={16} /> Export
                    </button>
                    <button onClick={handleLoadCombat} className="bg-obsidian flex items-center justify-center gap-1 p-2 rounded text-slate-400 hover:text-white hover:bg-gray-800 transition-colors" title="Charger Combat">
                        <FolderOpen size={16} /> Import
                    </button>
                </div>

                <button
                    onClick={() => {
                        gmConfirm('Voulez-vous vraiment vider la liste des combattants ?', () => {
                            clearCombatants();
                        });
                    }}
                    className="w-full mt-4 bg-red-900/20 hover:bg-red-900/50 text-red-500 hover:text-red-400 py-2 border border-red-900/50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Skull size={16} />
                    <span>Reset Combat</span>
                </button>
            </div>
        </aside>
    );
};

export default CombatControls;
