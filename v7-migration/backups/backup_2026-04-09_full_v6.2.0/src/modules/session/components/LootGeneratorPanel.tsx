import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { LootGenerator } from '../logic/LootGenerator';
import { Sparkles, Dices, Layers, Wand2, Search, Loader2, Zap, BookOpen } from 'lucide-react';
import { gmToast } from '../../../stores/useToastStore';
import { aiService } from '../../ai/AIService';
import type { InventoryItem } from '../store/types';

const LootGeneratorPanel: React.FC = () => {
    const { getActiveDriver, addLootToPool } = useSessionOSStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [useFullContext, setUseFullContext] = useState(false);
    
    const driver = getActiveDriver();
    const lootTables = driver?.lootTables || [];
    const systemName = driver?.name || 'Générique';

    const filteredTables = lootTables.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRollOnTable = (tableId: string) => {
        const table = lootTables.find(t => t.id === tableId);
        if (!table) return;

        try {
            const items = LootGenerator.generateFromTable(table, lootTables);
            if (items.length > 0) {
                addLootToPool(items);
            } else {
                gmToast("La table n'a généré aucun objet.", "info");
            }
        } catch (err) {
            console.error("Loot generation failed:", err);
            gmToast("Erreur lors de la génération du butin.", "error");
        }
    };

    const handleAIGenerate = async () => {
        if (!aiInput.trim() || isGenerating) return;

        setIsGenerating(true);
        const statusMsg = useFullContext ? "Analyse approfondie du lore..." : "Consultation rapide des archives...";
        const toastId = gmToast(statusMsg, "loading");

        try {
            const systemPrompt = `Tu es un expert en conception de butin pour le système de JdR "${systemName}".
            ${useFullContext ? "Utilise le contexte complet de la session pour créer des objets uniques et liés à l'histoire." : "Sois rapide et générique mais cohérent avec le système."}
            TACHE : Transforme la description de l'utilisateur en une liste d'objets structurés.
            
            RÈGLES :
            1. Réponds UNIQUEMENT avec un tableau JSON d'objets.
            2. Chaque objet doit suivre cette interface :
               {
                 "name": string,
                 "quantity": number,
                 "type": "item" | "currency",
                 "rarity": "common" | "uncommon" | "rare" | "epic" | "legendary",
                 "description": string (courte et immersive),
                 "weight": number (poids en kg, optionnel),
                 "value": number (valeur estimée en pièces d'or)
               }
            3. Si c'est de la monnaie, utilise type: "currency". Une unité de monnaie vaut 1.
            4. Ne dépasse pas 10 objets au total.
            
            EXEMPLE DE SORTIE :
            [{"name": "Dague en Os", "quantity": 1, "type": "item", "rarity": "common", "description": "Une dague fragile mais tranchante."}]`;

            const items = await aiService.generateJSON<any[]>(aiInput, systemPrompt, undefined, { lite: !useFullContext });
            
            if (Array.isArray(items) && items.length > 0) {
                const formattedItems: InventoryItem[] = items.map(it => ({
                    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: it.name || "Objet Inconnu",
                    quantity: Number(it.quantity) || 1,
                    type: it.type || 'item',
                    rarity: it.rarity || 'common',
                    description: it.description || '',
                    weight: Number(it.weight) || 0,
                    value: Number(it.value) || 0,
                    properties: it.properties || {}
                }));

                addLootToPool(formattedItems);
                setAiInput('');
                gmToast(`${formattedItems.length} objet(s) généré(s) via IA.`, "success");
            } else {
                gmToast("L'IA n'a retourné aucun objet valide.", "warning");
            }
        } catch (err: any) {
            console.error("AI Loot Generation failed:", err);
            gmToast(`Échec de la génération IA : ${err.message || 'Erreur inconnue'}`, "error");
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
                        <h3 className="text-sm font-bold uppercase tracking-tighter">Générateur Rapide (IA)</h3>
                    </div>
                    
                    {/* Lite/Full Toggle */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                        <button 
                            onClick={() => setUseFullContext(false)}
                            title="Mode Lite (Rapide)"
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${!useFullContext ? 'bg-gm-gold/20 text-gm-gold' : 'text-app-text/40 hover:text-app-text/60'}`}
                        >
                            <Zap size={10} />
                            LITE
                        </button>
                        <button 
                            onClick={() => setUseFullContext(true)}
                            title="Mode Full (Lore Context)"
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${useFullContext ? 'bg-indigo-500/20 text-indigo-400' : 'text-app-text/40 hover:text-app-text/60'}`}
                        >
                            <BookOpen size={10} />
                            FULL
                        </button>
                    </div>
                </div>
                <div className="relative group">
                    <input 
                        className={`w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 pr-12 text-sm text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-gm-gold/50 transition-all outline-none ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="Décrivez le contenu (ex: Un coffre de pirate maudit...)"
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
                <p className="text-[10px] text-app-text/40 px-2 italic">L'IA créera des objets structurés basés sur votre description.</p>
            </div>

            {/* Tables Selection */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                        <Layers size={18} className="text-accent" />
                        <h3 className="text-sm font-bold uppercase tracking-tighter">Tables de Système</h3>
                    </div>
                </div>

                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/20" size={14} />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher une table..."
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
                                    <span className="text-[9px] text-app-text/40 font-medium uppercase tracking-widest">{table.entries.length} Entrées • {table.rollMode}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-accent/5 text-accent group-hover:bg-accent group-hover:text-app-bg transition-all">
                                    <Dices size={16} />
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center border border-white/5 rounded-xl bg-white/2">
                            <p className="text-xs text-app-text/30">Aucune table de butin trouvée.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LootGeneratorPanel;
