import React, { useEffect, useState } from 'react';
import {
    Dices,
    Database,
    BookOpen,
    History,
    Send,
    AlertTriangle,
    Hash,
    Trash2,
    Package,
    Loader2,
    Wand2
} from 'lucide-react';
import { useTableStore } from './useTableStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { objetsDepuisDeclaration, laDeclarationEstVide } from '../session/logic/butinDeclare';
import { proposerDesObjets } from '../session/logic/propositionDeButinIA';
import { gmToast } from '../../stores/useToastStore';
import { useTranslation } from 'react-i18next';

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
        clearCurrentResult,
        sendToSession
    } = useTableStore();
    const { t } = useTranslation('modules');

    /*
      **Table-OS ne donne plus rien à un personnage — il verse au butin.**

      Les deux modules ne font pas le même geste : celui-ci *consulte* — un dé,
      une plage, un résultat qu'on lit —, Loot-OS *compose* et distribue. Les
      brancher ne veut pas dire les confondre, et le point de rencontre est le
      **pool**, jamais le joueur.

      Avant le 2026-09-04, `addLootToCharacter` écrivait une ligne de texte dans
      le champ `inventory` du personnage — un bloc de prose que l'onglet
      Inventaire de la tablette ne regarde même pas, puisqu'il affiche
      `inventoryItems`. *L'objet donné n'apparaissait nulle part où le joueur
      cherche ses affaires.*
    */
    const {
        activeCampaignId,
        sessions,
        updateSessionGmSecrets,
        addLootToPool,
        getActiveDriver
    } = useSessionOSStore();

    const [conversionEnCours, setConversionEnCours] = useState(false);

    // Find active session to update
    const activeSession = sessions.find(s => 
        s.campaignId === activeCampaignId && s.status === 'active'
    );

    const [manualRoll, setManualRoll] = useState<string>("");

    useEffect(() => {
        fetchUniverses();
    }, [fetchUniverses]);

    const handleSendToSession = () => {
        if (!currentResult || !activeSession) return;

        // Use the store's unified logging (Journal)
        sendToSession();

        const formatted = `\n--- TABLE ROLL: ${currentResult.tableName} ---\n` +
            `Roll: ${currentResult.rawRoll} ${currentResult.modifier >= 0 ? '+' : ''}${currentResult.modifier} = ${currentResult.finalValue}\n` +
            `Result: ${currentResult.entry.title}\n` +
            `${currentResult.entry.description}\n` +
            (currentResult.entry.effect ? `Effect: ${currentResult.entry.effect}\n` : '') +
            `----------------------------\n`;

        updateSessionGmSecrets(activeSession.id, (activeSession.gmSecrets || "") + formatted);
    };

    /** Ce que l'entrée déclare tombe dans le butin de séance, quantités résolues. */
    const handleVerserAuButin = () => {
        if (!currentResult) return;

        const objets = objetsDepuisDeclaration(currentResult.entry.butin, {
            table: currentResult.tableName,
            entree: currentResult.entry.title,
        });
        if (objets.length === 0) return;

        addLootToPool(objets);
        gmToast(t('random_tables.main.poured_toast', { count: objets.length }), 'success');
    };

    /**
     * L'entrée ne déclare rien : on **propose** des objets depuis son texte.
     *
     * On ne lit pas `effect` à la regex — une regex sur de la prose se trompe, et
     * *un contrôle qui se trompe est pire qu'un contrôle absent*. Le modèle
     * propose, le meneur relit dans le pool et jette ce qui ne va pas.
     */
    const handleProposerDesObjets = async () => {
        if (!currentResult || conversionEnCours) return;
        setConversionEnCours(true);

        const texte = [
            currentResult.entry.title,
            currentResult.entry.description,
            currentResult.entry.effect,
        ].filter(Boolean).join('\n');

        try {
            const objets = await proposerDesObjets(texte, getActiveDriver());
            if (objets.length > 0) {
                addLootToPool(objets);
                gmToast(t('random_tables.main.poured_toast', { count: objets.length }), 'success');
            } else {
                gmToast(t('random_tables.main.propose_empty'), 'warning');
            }
        } catch (err) {
            console.error('[Table-OS] conversion en objets impossible :', err);
            gmToast(t('random_tables.main.propose_failed'), 'error');
        } finally {
            setConversionEnCours(false);
        }
    };

    return (
        <div className="flex h-full bg-app-bg text-app-text overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 border-r border-app-border bg-app-surface/50 p-6 flex flex-col space-y-6">
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                        <Database className="w-4 h-4" /> {t('random_tables.sidebar.config_title')}
                    </h2>

                    <div className="space-y-4">
                        {/* Universe Select */}
                        <div>
                            <label className="block text-xs text-app-text/50 mb-1 ml-1">{t('random_tables.sidebar.universe_label')}</label>
                            <select
                                value={selectedUniverse}
                                onChange={(e) => selectUniverse(e.target.value)}
                                className="w-full bg-app-surface border border-app-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent/50"
                            >
                                <option value="">{t('random_tables.sidebar.choose_universe')}</option>
                                {universes.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>

                        {/* Table Select */}
                        <div>
                            <label className="block text-xs text-app-text/50 mb-1 ml-1">{t('random_tables.sidebar.table_label')}</label>
                            <select
                                value={selectedTable}
                                onChange={(e) => selectTable(e.target.value)}
                                disabled={!selectedUniverse}
                                className="w-full bg-app-surface border border-app-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                            >
                                <option value="">{t('random_tables.sidebar.choose_table')}</option>
                                {tables.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Info */}
                {currentTableData && (
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-accent font-medium">
                            <Hash className="w-4 h-4" />
                            <span>{t('random_tables.sidebar.roll_required', { dice: currentTableData.dice })}</span>
                        </div>
                        <p className="text-xs text-app-text/60 italic">
                            {t('random_tables.sidebar.modifier_notice')}
                        </p>
                    </div>
                )}

                {/* Modifiers & Roll */}
                <div className="space-y-4 pt-4 border-t border-app-border">
                    <div>
                        <label className="block text-xs text-app-text/50 mb-1 ml-1">{t('random_tables.sidebar.modifier_label')}</label>
                        <input
                            type="number"
                            value={modifier}
                            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                            className="w-full bg-app-surface border border-app-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs text-app-text/50 mb-1 ml-1">{t('random_tables.sidebar.manual_roll_label')}</label>
                            <input
                                type="text"
                                value={manualRoll}
                                onChange={(e) => setManualRoll(e.target.value)}
                                placeholder="ex: 15"
                                className="w-full bg-app-surface border border-app-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </div>
                        <button
                            onClick={() => {
                                const val = parseInt(manualRoll);
                                if (!isNaN(val)) roll(val);
                                setManualRoll("");
                            }}
                            disabled={!currentTableData}
                            className="mt-5 flex items-center justify-center gap-2 bg-app-surface hover:bg-app-surface/70 border border-app-border rounded-lg px-4 transition-colors disabled:opacity-50"
                        >
                            {t('random_tables.sidebar.show_button')}
                        </button>
                    </div>

                    <button
                        onClick={() => roll()}
                        disabled={!currentTableData || isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-accent hover:bg-accent/80 text-slate-950 font-bold py-4 rounded-xl transition-all shadow-glow-accent active:scale-95 disabled:opacity-50"
                    >
                        <Dices className="w-6 h-6" />
                        <span>{t('random_tables.sidebar.launch_button')}</span>
                    </button>
                </div>

                {/* History Mini-List */}
                <div className="flex-1 overflow-hidden flex flex-col pt-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-app-text/50 mb-2 flex items-center gap-2 px-1">
                        <History className="w-3 h-3" /> {t('random_tables.sidebar.history_title')}
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 text-app-text/60">
                        {history.slice(0, 10).map((res, i) => (
                            <div key={i} className="text-[11px] p-2 rounded bg-app-surface/30 border border-app-border/50 flex justify-between items-center group">
                                <span className="text-app-text/60 font-mono">[{res.finalValue}]</span>
                                <span className="flex-1 px-2 truncate font-medium">{res.entry.title}</span>
                                <span className="text-[9px] text-app-text/30">{new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 p-10 flex flex-col relative overflow-y-auto custom-scrollbar">
                {!currentResult ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 select-none">
                        <div className="w-32 h-32 rounded-full border-2 border-dashed border-app-border flex items-center justify-center">
                            <Dices className="w-16 h-16 text-app-text/30" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-light">{t('random_tables.main.waiting_title')}</h2>
                            <p className="text-app-text/50 max-w-sm">
                                {t('random_tables.main.waiting_desc')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Result Card */}
                        <div className="relative group bg-app-surface/50 border border-app-border rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-accent to-accent/60 p-8 flex justify-between items-end text-slate-950">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center text-2xl font-black">
                                            {currentResult.finalValue}
                                        </div>
                                        <div className="opacity-70 text-xs font-mono">
                                            {t('random_tables.main.raw_roll')}: {currentResult.rawRoll} <br />
                                            {t('random_tables.main.mod')}: {currentResult.modifier >= 0 ? '+' : ''}{currentResult.modifier}
                                        </div>
                                    </div>
                                    <h1 className="text-3xl font-bold mt-4">{currentResult.entry.title}</h1>
                                </div>
                                <div className="text-right">
                                    <div className="opacity-50 text-[10px] uppercase tracking-tighter mb-1 font-bold">{t('random_tables.main.source', { table: currentResult.tableName })}</div>
                                    <BookOpen className="w-8 h-8 opacity-20 ml-auto" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8">
                                <div className="space-y-4 min-h-[120px]">
                                    <p className="text-xl text-app-text/80 leading-relaxed italic">
                                        "{currentResult.entry.description}"
                                    </p>
                                </div>

                                {/* Effect Block (Mechanical) */}
                                {currentResult.entry.effect && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex gap-4">
                                        <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                                        <div className="space-y-1">
                                            <div className="text-xs font-bold uppercase tracking-widest text-red-400">{t('random_tables.main.mechanical_effect')}</div>
                                            <div className="text-red-200 text-lg">{currentResult.entry.effect}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-4 pt-4 border-t border-app-border">
                                    <button
                                        onClick={handleSendToSession}
                                        className="flex-[2] flex items-center justify-center gap-3 bg-app-surface hover:bg-app-surface/80 py-4 rounded-xl border border-app-border transition-all group"
                                    >
                                        <Send className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
                                        <span>{t('random_tables.main.log_session')}</span>
                                    </button>
                                    
                                    {/*
                                        Le bouton ne s'affiche que si l'entrée déclare
                                        quelque chose. Un oracle qui ne donne rien se lit,
                                        il ne verse pas — et ne doit pas prétendre le
                                        contraire.
                                    */}
                                    {!laDeclarationEstVide(currentResult.entry) ? (
                                        <button
                                            onClick={handleVerserAuButin}
                                            className="flex-1 flex items-center justify-center gap-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 py-4 rounded-xl border border-amber-500/30 transition-all group"
                                            title={t('random_tables.main.pour_tooltip')}
                                        >
                                            <Package className="w-5 h-5" />
                                            <span>{t('random_tables.main.pour_button')}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleProposerDesObjets}
                                            disabled={conversionEnCours}
                                            className="flex-1 flex items-center justify-center gap-3 bg-app-surface hover:bg-app-surface/80 text-app-text/60 py-4 rounded-xl border border-app-border transition-all group disabled:opacity-40"
                                            title={t('random_tables.main.propose_tooltip')}
                                        >
                                            {conversionEnCours
                                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                                : <Wand2 className="w-5 h-5" />}
                                            <span>{t('random_tables.main.propose_button')}</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={clearCurrentResult}
                                        className="bg-app-surface hover:bg-red-900/30 p-4 border border-app-border rounded-xl transition-all group"
                                        title={t('random_tables.main.clear_tooltip')}
                                    >
                                        <Trash2 className="w-5 h-5 text-app-text/40 group-hover:text-red-400" />
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
