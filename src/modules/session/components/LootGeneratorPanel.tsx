import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModeDeContexte } from '../../ai/modeDeContexte';
import { IndicateurDeMode } from '../../ai/IndicateurDeMode';
import { useSessionOSStore } from '../useSessionOSStore';
import { LootGenerator } from '../logic/LootGenerator';
import { chargerLesOracles } from '../../tables/pontDesTables';
import { proposerDesObjets } from '../logic/propositionDeButinIA';
import { Sparkles, Dices, Layers, Wand2, Search, Loader2, Zap, BookOpen } from 'lucide-react';
import { gmToast } from '../../../stores/useToastStore';

const LootGeneratorPanel: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { getActiveDriver, addLootToPool } = useSessionOSStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    /*
      **Le défaut suit désormais le moment de jeu — axes F.1 et F.5.**

      Ce panneau était *« le seul endroit où le choix de contexte est conscient
      et offert au MJ »*, et le plan demande de le généraliser. Il lui manquait
      pourtant une chose : **il ne disait pas POURQUOI**. Un allègement par
      défaut se lit comme une réponse maigre, pas comme un choix.

      `undefined` est un troisième état, et il compte : *une surcharge qui ne se
      distingue pas du défaut ne peut plus revenir au défaut.*
    */
    const [surcharge, setSurcharge] = useState<boolean | undefined>(undefined);
    const mode = useModeDeContexte(surcharge);
    const useFullContext = !mode.allege;
    
    const driver = getActiveDriver();
    const lootTables = driver?.lootTables || [];

    const filteredTables = lootTables.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /*
      **Un tirage charge ses oracles avant de lancer les dés.**

      Une entrée de type `oracle` désigne une table de Table-OS, qui vit dans un
      fichier et se lit par le pont Electron — donc de façon asynchrone. Le
      générateur, lui, est appelé au clic et doit rendre son résultat d'un bloc.
      D'où les deux temps : on charge, puis on tire.
    */
    const handleRollOnTable = async (tableId: string) => {
        const table = lootTables.find(t => t.id === tableId);
        if (!table) return;

        try {
            const oracles = await chargerLesOracles(
                LootGenerator.referencesDOracle(table, lootTables),
            );
            const { objets, avertissements } = LootGenerator.generateFromTable(
                table,
                lootTables,
                { oracles },
            );

            if (objets.length > 0) {
                addLootToPool(objets);
            } else {
                gmToast(t('modules:loot.generator.toasts.no_items'), "info");
            }

            /*
              **Ce qui n'a pas marché se dit à l'écran.**

              Une table imbriquée dont l'identifiant est mal recopié rendait zéro
              objet et ne le disait qu'à la console : le meneur lisait « aucun
              objet » et n'avait aucun moyen de savoir que c'était une faute de
              frappe. *Un défaut muet en séance ne se répare jamais.*
            */
            for (const avertissement of avertissements) {
                gmToast(avertissement, "warning");
            }
        } catch (err) {
            console.error("Loot generation failed:", err);
            gmToast(t('modules:loot.generator.toasts.generate_error'), "error");
        }
    };

    const handleAIGenerate = async () => {
        if (!aiInput.trim() || isGenerating) return;

        setIsGenerating(true);
        const statusMsg = useFullContext 
            ? t('modules:loot.generator.toasts.ai_analyzing') 
            : t('modules:loot.generator.toasts.ai_consulting');
        gmToast(statusMsg, "loading");

        try {
            /*
              L'invite vit dans `propositionDeButinIA` : le même geste existe
              dans Table-OS, pour convertir un résultat d'oracle qui ne déclare
              pas son butin. Deux copies auraient divergé le jour où l'une
              apprend le vocabulaire du jeu et pas l'autre.
            */
            const objets = await proposerDesObjets(aiInput, driver, { lite: !useFullContext });

            if (objets.length > 0) {
                addLootToPool(objets);
                setAiInput('');
                gmToast(t('modules:loot.generator.toasts.ai_success', { count: objets.length }), "success");
            } else {
                gmToast(t('modules:loot.generator.toasts.ai_no_valid'), "warning");
            }
        } catch (err: any) {
            console.error("AI Loot Generation failed:", err);
            gmToast(t('modules:loot.generator.toasts.ai_failed', { message: err.message || 'Error' }), "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header / AI Quick Generator */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-gm-gold" />
                        <h3 className="text-sm font-bold uppercase tracking-tighter">{t('modules:loot.generator.ai_header')}</h3>
                    </div>
                    
                    {/* Lite/Full Toggle */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                        <button 
                            onClick={() => setSurcharge(true)}
                            title={t('modules:loot.generator.lite_mode')}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${!useFullContext ? 'bg-gm-gold/20 text-gm-gold' : 'text-app-text/40 hover:text-app-text/60'}`}
                        >
                            <Zap size={10} />
                            LITE
                        </button>
                        <button 
                            onClick={() => setSurcharge(false)}
                            title={t('modules:loot.generator.full_mode')}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${useFullContext ? 'bg-indigo-500/20 text-indigo-400' : 'text-app-text/40 hover:text-app-text/60'}`}
                        >
                            <BookOpen size={10} />
                            FULL
                        </button>
                    </div>
                </div>

                {/*
                    **Dire pourquoi, et pas seulement quoi — axe F.5.**

                    *« Si la Forge se comporte différemment parce qu'une session
                    est ouverte, c'est la Forge qui doit le dire, avec le moyen
                    de passer outre. »* Les deux boutons offraient déjà le moyen ;
                    il manquait la raison, sans laquelle un allègement se lit
                    comme une panne.
                */}
                {(mode.imposeParLaSeance || surcharge !== undefined) && (
                    <div className="px-1">
                        <IndicateurDeMode surcharge={surcharge} onSurcharge={setSurcharge} />
                    </div>
                )}
                <div className="relative group">
                    <input 
                        className={`w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 pr-12 text-sm text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-gm-gold/50 transition-all outline-none ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder={t('modules:loot.generator.input_placeholder')}
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                        disabled={isGenerating}
                    />
                    <button 
                        onClick={handleAIGenerate}
                        disabled={isGenerating || !aiInput.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gm-gold/10 text-gm-gold hover:bg-gm-gold/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                    </button>
                    <div className="absolute inset-0 rounded-xl bg-gm-gold/5 blur opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <p className="text-[10px] text-app-text/40 px-2 italic">{t('modules:loot.generator.ai_hint')}</p>
            </div>

            {/* Tables Selection */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                        <Layers size={18} className="text-accent" />
                        <h3 className="text-sm font-bold uppercase tracking-tighter">{t('modules:loot.generator.tables_header')}</h3>
                    </div>
                </div>

                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/20" size={14} />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('modules:loot.generator.search_placeholder')}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-app-text focus:border-accent/50 outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredTables.length > 0 ? (
                        filteredTables.map(table => (
                            <button
                                key={table.id}
                                onClick={() => handleRollOnTable(table.id)}
                                className="glass-bento p-3 flex items-center justify-between group hover:border-accent/40 transition-all"
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-xs font-bold text-app-text/80 group-hover:text-accent transition-colors">{table.name}</span>
                                    <span className="text-[9px] text-app-text/40 font-medium uppercase tracking-widest">
                                        {t('modules:loot.generator.table_stats', {
                                            count: table.entries.length,
                                            mode: t(`modules:loot.generator.roll_modes.${table.rollMode || 'weighted'}`),
                                        })}
                                    </span>
                                </div>
                                <div className="p-2 rounded-lg bg-accent/5 text-accent group-hover:bg-accent group-hover:text-app-bg transition-all">
                                    <Dices size={16} />
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center border border-white/5 rounded-xl bg-white/2">
                            <p className="text-xs text-app-text/30">{t('modules:loot.generator.empty_tables')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LootGeneratorPanel;
