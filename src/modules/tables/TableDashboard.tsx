import React, { useEffect, useState } from 'react';
import {
    Dices,
    Database,
    BookOpen,
    History,
    Send,
    AlertTriangle,
    Hash,
    Trash2
} from 'lucide-react';
import { useTableStore } from './useTableStore';
import { useSessionOSStore } from '../session/useSessionOSStore';

const TableDashboard: React.FC = () => {
    const {
        universes,
        tables,
        selectedUniverse,
        selectedTable,
        currentTableData,
        currentResult,
        history,
        isLoading,
        modifier,
        fetchUniverses,
        selectUniverse,
        selectTable,
        setModifier,
        roll,
        clearCurrentResult
    } = useTableStore();

    const { setGmSecrets, gmSecrets } = useSessionOSStore();
    const [manualRoll, setManualRoll] = useState<string>("");

    useEffect(() => {
        fetchUniverses();
    }, [fetchUniverses]);

    const handleSendToSession = () => {
        if (!currentResult) return;

        const formatted = `\n--- TABLE ROLL: ${currentResult.tableName} ---\n` +
            `Roll: ${currentResult.rawRoll} ${currentResult.modifier >= 0 ? '+' : ''}${currentResult.modifier} = ${currentResult.finalValue}\n` +
            `Result: ${currentResult.entry.title}\n` +
            `${currentResult.entry.description}\n` +
            (currentResult.entry.effect ? `Effect: ${currentResult.entry.effect}\n` : '') +
            `----------------------------\n`;

        setGmSecrets(gmSecrets + formatted);
    };

    return (
        <div className="flex h-full bg-[#020617] text-slate-200 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 border-r border-slate-800 bg-[#0f172a]/50 p-6 flex flex-col space-y-6">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                        <Database className="w-4 h-4" /> Config & Selection
                    </h2>

                    <div className="space-y-4">
                        {/* Universe Select */}
                        <div>
                            <label className="block text-xs text-slate-500 mb-1 ml-1">Univers / Jeu</label>
                            <select
                                value={selectedUniverse}
                                onChange={(e) => selectUniverse(e.target.value)}
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="">Choisir un univers...</option>
                                {universes.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>

                        {/* Table Select */}
                        <div>
                            <label className="block text-xs text-slate-500 mb-1 ml-1">Table Aléatoire</label>
                            <select
                                value={selectedTable}
                                onChange={(e) => selectTable(e.target.value)}
                                disabled={!selectedUniverse}
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                            >
                                <option value="">Choisir une table...</option>
                                {tables.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Info */}
                {currentTableData && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-blue-400 font-medium">
                            <Hash className="w-4 h-4" />
                            <span>Jet Requis : {currentTableData.dice}</span>
                        </div>
                        <p className="text-xs text-slate-400 italic">
                            Les modificateurs seront ajoutés au résultat brut.
                        </p>
                    </div>
                )}

                {/* Modifiers & Roll */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1 ml-1">Modificateur de Jet</label>
                        <input
                            type="number"
                            value={modifier}
                            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1 ml-1">Jet Manuel</label>
                            <input
                                type="text"
                                value={manualRoll}
                                onChange={(e) => setManualRoll(e.target.value)}
                                placeholder="ex: 15"
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <button
                            onClick={() => {
                                const val = parseInt(manualRoll);
                                if (!isNaN(val)) roll(val);
                                setManualRoll("");
                            }}
                            disabled={!currentTableData}
                            className="mt-5 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 transition-colors disabled:opacity-50"
                        >
                            Afficher
                        </button>
                    </div>

                    <button
                        onClick={() => roll()}
                        disabled={!currentTableData || isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50"
                    >
                        <Dices className="w-6 h-6" />
                        <span>LANCER</span>
                    </button>
                </div>

                {/* History Mini-List */}
                <div className="flex-1 overflow-hidden flex flex-col pt-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2 px-1">
                        <History className="w-3 h-3" /> Historique Récent
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 text-slate-400">
                        {history.slice(0, 10).map((res, i) => (
                            <div key={i} className="text-[11px] p-2 rounded bg-slate-800/30 border border-slate-700/50 flex justify-between items-center group">
                                <span className="text-slate-400 font-mono">[{res.finalValue}]</span>
                                <span className="flex-1 px-2 truncate font-medium">{res.entry.title}</span>
                                <span className="text-[9px] text-slate-600">{new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 p-10 flex flex-col relative overflow-y-auto custom-scrollbar">
                {!currentResult ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 select-none">
                        <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                            <Dices className="w-16 h-16 text-slate-700" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-light">En attente de tirage</h2>
                            <p className="text-slate-500 max-w-sm">
                                Sélectionnez une table dans la barre latérale pour commencer à générer des résultats aléatoires.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Result Card */}
                        <div className="relative group bg-[#1e293b]/50 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 flex justify-between items-end text-white">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black text-white">
                                            {currentResult.finalValue}
                                        </div>
                                        <div className="text-white/60 text-xs font-mono">
                                            Jet Brut: {currentResult.rawRoll} <br />
                                            Mod: {currentResult.modifier >= 0 ? '+' : ''}{currentResult.modifier}
                                        </div>
                                    </div>
                                    <h1 className="text-3xl font-bold text-white mt-4">{currentResult.entry.title}</h1>
                                </div>
                                <div className="text-right">
                                    <div className="text-blue-200/50 text-[10px] uppercase tracking-tighter mb-1 font-bold">Source: {currentResult.tableName}</div>
                                    <BookOpen className="w-8 h-8 text-white/20 ml-auto" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8">
                                <div className="space-y-4 min-h-[120px]">
                                    <p className="text-xl text-slate-300 leading-relaxed italic">
                                        "{currentResult.entry.description}"
                                    </p>
                                </div>

                                {/* Effect Block (Mechanical) */}
                                {currentResult.entry.effect && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex gap-4">
                                        <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                                        <div className="space-y-1">
                                            <div className="text-xs font-bold uppercase tracking-widest text-red-400">Effet Mécanique</div>
                                            <div className="text-red-200 text-lg">{currentResult.entry.effect}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-4 pt-4 border-t border-slate-800">
                                    <button
                                        onClick={handleSendToSession}
                                        className="flex-1 flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 py-4 rounded-xl transition-all group"
                                    >
                                        <Send className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                                        <span>Envoyer au Log Session</span>
                                    </button>
                                    <button
                                        onClick={clearCurrentResult}
                                        className="bg-slate-800 hover:bg-red-900/30 p-4 rounded-xl transition-all group"
                                        title="Effacer"
                                    >
                                        <Trash2 className="w-5 h-5 text-slate-500 group-hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TableDashboard;
