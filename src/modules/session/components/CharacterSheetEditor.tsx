import React from 'react';
import { Save, FolderOpen, Layers, FileText, Trash2, Lock, BookOpen, Eye, Heart, Sparkles, Package, Tablet, PenTool, Plus, Check, X } from 'lucide-react';
import { fractionDeVie } from '../../combat/logic/SanteDuCombattant';
import { piloteDuPersonnage } from '../logic/piloteDuPersonnage';
import { useImageStore } from '../../image/useImageStore';
import { gmToast } from '../../../stores/useToastStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import AIPromptOverlay from '../../ai/components/AIPromptOverlay';
import { 
    FieldGauge, FieldNumber, FieldText, 
    FieldCheckbox, FieldSelect, FieldTextarea, FieldRating 
} from './fields/SheetFields';
import { useCharacterEditor } from '../hooks/useCharacterEditor';
import PanneauDeJet from './fields/PanneauDeJet';
import { useSessionOSStore } from '../useSessionOSStore';
import { useSheetCalculator } from '../hooks/useSheetCalculator';
import { Calculator } from 'lucide-react';
import type { SheetField } from '../../../data/defaultSheetTemplates';
import type { PlayerCharacter } from '../store/types';

// --- Sub-components ---
const FieldFormula: React.FC<{
    field: SheetField;
    value: number;
}> = ({ field, value }) => (
    <div className="flex items-center justify-between p-3 bg-accent/5 rounded-xl border border-accent/20 shadow-inner group">
        <label className="text-[10px] font-black uppercase tracking-widest text-accent/60 flex items-center gap-2">
            <Calculator size={12} className="group-hover:rotate-12 transition-transform" />
            {field.label}
        </label>
        <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-white bg-accent/20 px-3 py-1 rounded-lg border border-accent/10 min-w-[3rem] text-center font-mono">
                {value}
            </span>
        </div>
    </div>
);

// --- Main Component ---

const CharacterSheetEditor: React.FC = () => {
    const editor = useCharacterEditor();

    /**
     * Le pilote de la campagne du personnage, pour savoir comment on lance.
     *
     * Le panneau de jet n'apparaît que si ce pilote **décrit ses jets**. Un
     * système sans descripteur garde sa fiche telle quelle : mieux vaut pas de
     * bouton qu'un bouton qui lancerait n'importe quoi.
     */
    const { campaigns, activeCampaignId, customGameDrivers } = useSessionOSStore();

    /**
     * **Le pilote du PERSONNAGE, pas celui de la campagne ouverte.**
     *
     * La règle et son histoire vivent dans `piloteDuPersonnage` : la fiche de
     * la tablette en a besoin mot pour mot, et deux copies auraient fini par
     * diverger sans que rien ne les compare.
     */
    const piloteDeLaFiche = React.useMemo(
        () => piloteDuPersonnage(editor.character, campaigns, customGameDrivers, activeCampaignId),
        [campaigns, activeCampaignId, customGameDrivers, editor.character],
    );

    const { evaluateFormula } = useSheetCalculator(editor.character as PlayerCharacter | null, editor.template, editor.localData);
    const [isAddingItem, setIsAddingItem] = React.useState(false);
    const [newItemName, setNewItemName] = React.useState('');
    const hpBarRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        // `null` sans jauge : la barre n'est pas redimensionnée plutôt que de
        // recevoir une largeur calculée sur `NaN`.
        const part = editor.character ? fractionDeVie(editor.character) : null;
        if (hpBarRef.current && part !== null) {
            hpBarRef.current.style.width = `${Math.max(0, Math.min(100, part * 100))}%`;
        }
    }, [editor.character, editor.character?.hp, editor.character?.maxHp]);

    if (!editor.character || !editor.template) return null;
    const { 
        character, template,
        description, gmNotes, playerNotes, inventory,
        setDescription, setGmNotes, setPlayerNotes, setInventory,
        portraitUrl, tokenUrl,
        getValue, updateLocal, handleSave, saved,
        mediaBrowserTarget, setMediaBrowserTarget, handleMediaSelect, handleRemoveDocument, openDocument, mediaList,
        showAIPrompt, setShowAIPrompt, isGeneratingAIImage, handleGeneratePortrait,
        updateCharacterHP, updateCharacterMaxHP, updateCharacterHubOptions,
        addInventoryItem, removeInventoryItem
    } = editor;

    // Separate gauge fields from other fields for layout
    const gaugeFields = (section: typeof template.sections[0]) => section.fields.filter(f => f.type === 'gauge');
    const otherFields = (section: typeof template.sections[0]) => section.fields.filter(f => f.type !== 'gauge');


    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Media Browser */}
            <MediaBrowser
                isOpen={mediaBrowserTarget !== null}
                onClose={() => setMediaBrowserTarget(null)}
                onSelect={handleMediaSelect}
                allowedTypes={mediaBrowserTarget === 'document' ? ['document'] : ['image']}
                title={
                    mediaBrowserTarget === 'portrait' ? 'Choisir un portrait' : 
                    mediaBrowserTarget === 'token' ? 'Choisir un token' : 
                    'Lier un document'
                }
            />

            {/* Save Bar */}
            <div className="flex items-center justify-between px-8 py-3 border-b border-app-border bg-app-bg/60 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.emoji}</span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-app-text/40">{template.name}</p>
                        <p className="text-[10px] text-app-text/20">Fiche de {character.name}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs tracking-widest transition-all ${
                        saved
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-accent hover:opacity-90 text-app-bg shadow-lg shadow-accent/20 hover:scale-105 active:scale-95'
                    }`}
                >
                    <Save size={14} />
                    {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto p-8 grid grid-cols-12 gap-8">

                    {/* Left Col: Visuals */}
                    <div className="col-span-3 space-y-5">

                        {/* Portrait */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-app-text/40 mb-2">Portrait</p>
                            <div
                                className="aspect-[3/4] rounded-2xl overflow-hidden bg-app-bg border border-app-border shadow-2xl relative group cursor-pointer"
                            >
                                {portraitUrl ? (
                                    <img src={portraitUrl} alt={character.name} className="w-full h-full object-cover object-top" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-app-text/20" onClick={() => setMediaBrowserTarget('portrait')}>
                                        <FolderOpen size={32} />
                                    </div>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-app-bg/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMediaBrowserTarget('portrait'); }}
                                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
                                        title="Changer via Galerie"
                                    >
                                        <FolderOpen size={18} className="text-white" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowAIPrompt(true); }}
                                        className="w-12 h-12 rounded-full bg-accent text-app-bg flex items-center justify-center transition-all shadow-glow-accent hover:scale-110"
                                        title="Générer par IA"
                                    >
                                        <Sparkles size={20} />
                                    </button>
                                    {character.portraitUrl && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const projectedPJ = {
                                                    id: character.id,
                                                    name: character.name,
                                                    subtitle: character.classRace,
                                                    portraitUrl: character.portraitUrl,
                                                    avatar: character.tokenUrl || character.portraitUrl,
                                                    stats: {
                                                        // Pas de statistique de santé projetée
                                                        // pour un jeu qui n'en compte pas.
                                                        ...(fractionDeVie(character) !== null
                                                            ? { 'Santé': fractionDeVie(character)! * 100 }
                                                            : {}),
                                                    }
                                                };
                                                useImageStore.getState().projectEntity(projectedPJ);
                                                gmToast(`${character.name} projeté sur le Hub !`);
                                            }}
                                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
                                            title="Projeter sur le Hub"
                                        >
                                            <Eye size={18} className="text-white" />
                                        </button>
                                    )}
                                </div>

                                {isGeneratingAIImage && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                                        <Sparkles size={32} className="text-accent animate-spin mb-2" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-accent animate-pulse">Vision en cours...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Token */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-app-text/40 mb-2 flex items-center gap-1.5">
                                <Layers size={10} /> Token (Map / Combat)
                            </p>
                            <div
                                className="w-full aspect-square rounded-2xl overflow-hidden bg-app-bg border-2 border-dashed border-app-border hover:border-accent/50 relative group cursor-pointer transition-all flex items-center justify-center"
                                onClick={() => setMediaBrowserTarget('token')}
                            >
                                {tokenUrl ? (
                                    <img src={tokenUrl} alt="Token" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-app-text/20 group-hover:text-accent/60 transition-colors">
                                        <Layers size={28} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Pas de token</span>
                                    </div>
                                )}
                                {tokenUrl && (
                                    <div className="absolute inset-0 bg-app-bg/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                        <FolderOpen size={20} className="text-accent" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-accent">Changer</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[9px] text-app-text/20 mt-1.5 text-center">Utilisé dans Map-OS et Combat-OS</p>
                        </div>

                        {/* Identity */}
                        <div className="space-y-1 text-center">
                            <h2 className="text-lg font-black text-app-text">{character.name}</h2>
                            {character.classRace && (
                                <p className="text-xs text-app-text/40 italic">{character.classRace}</p>
                            )}
                        </div>

                        {/*
                          **Ce bloc ne concerne qu'un modèle de santé sur cinq.**

                          Il s'appelait « Vigueur (PV) » et s'affichait pour tous
                          les jeux, y compris ceux qui ne comptent pas la santé
                          en points — David, sur une fiche d'Alien : « il y a
                          toujours ce reliquat de Vigueur PV qui n'a rien à faire
                          là ». Chez Dune, dont la défaite est une tâche étendue,
                          il proposait d'éditer des points de vie qui n'existent
                          pas.

                          Le libellé venait de D&D ; le jeu, lui, nomme sa santé
                          dans sa propre fiche. On affiche donc un intitulé
                          neutre, et seulement quand le modèle du pilote compte
                          réellement des points.
                        */}
                        {(piloteDeLaFiche?.combat?.defaultHealthType ?? 'hp') === 'hp' && (
                        <div className="p-4 bg-app-bg/60 border border-accent/20 rounded-xl space-y-3 shadow-lg shadow-red-500/5">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-accent">Points de vie</span>
                                <Heart size={12} className="text-red-500 animate-pulse" />
                            </div>
                                                <div className="flex items-center justify-center gap-2 mt-1">
                                <div className="bg-black/40 border border-white/5 w-14 h-10 rounded-lg flex items-center justify-center shadow-inner group-hover:border-accent/20 transition-all">
                                    <input 
                                        type="number" 
                                        value={character.hp}
                                        onChange={(e) => updateCharacterHP(parseInt(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center text-white font-black text-sm focus:outline-none"
                                        title="Points de Vie actuels"
                                    />
                                </div>
                                <span className="text-app-text/20 font-bold text-xs">/</span>
                                <div className="bg-black/20 border border-white/5 w-14 h-10 rounded-lg flex items-center justify-center shadow-inner group-hover:border-accent/10 transition-all">
                                    <input 
                                        type="number" 
                                        value={character.maxHp}
                                        onChange={(e) => updateCharacterMaxHP(parseInt(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center text-app-text/40 font-black text-sm focus:outline-none"
                                        title="Points de Vie Max"
                                    />
                                </div>
                            </div>
                            
                            <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden border border-app-border/40 ring-1 ring-white/5 p-[1px]">
                                <div
                                    ref={hpBarRef}
                                    className={`h-full rounded-full transition-all duration-500 ${(() => {
                                        const f = fractionDeVie(character);
                                        if (f === null) return 'bg-app-border';
                                        return f > 0.6 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                                            : f > 0.3 ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                                            : 'bg-gradient-to-r from-rose-700 to-rose-500';
                                    })()}`}
                                />
                            </div>
                        </div>
                        )}
                    </div>

                    {/* Right Col: Sheet Sections */}
                    <div className="col-span-9 space-y-6">
                        {/*
                            Lancer depuis la fiche, à côté des valeurs qui font
                            le seuil. Chez Dune il vaut une compétence plus un
                            principe : personne ne pouvait faire ce calcul à la
                            place du joueur, et il fallait tout reporter à la
                            main dans Dice OS.
                        */}
                        {piloteDeLaFiche?.jet && (
                            <PanneauDeJet
                                descripteur={piloteDeLaFiche.jet}
                                dice={piloteDeLaFiche.dice}
                                template={template}
                                valeurs={editor.localData}
                                campaignId={activeCampaignId ?? undefined}
                                ressourcesDeTable={piloteDeLaFiche.ressourcesDeTable}
                            />
                        )}

                        {template.sections.map(section => {
                            const gauges = gaugeFields(section);
                            const others = otherFields(section);
                            return (
                                <div key={section.id} className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent border-b border-accent/20 pb-2">{section.label}</h3>

                                    {/* Gauges: 2-column grid */}
                                    {gauges.length > 0 && (
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                            {gauges.map(field => (
                                                <FieldGauge
                                                    key={field.id}
                                                    field={field}
                                                    value={Number(getValue(field.id, field.defaultValue))}
                                                    onChange={val => updateLocal(field.id, val)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Other fields */}
                                    {others.length > 0 && (
                                        <div className="space-y-2">
                                            {others.map(field => {
                                                const val = getValue(field.id, field.defaultValue);
                                                if (field.type === 'number') return (
                                                    <FieldNumber key={field.id} field={field} value={Number(val)} onChange={v => updateLocal(field.id, v)} />
                                                );
                                                if (field.type === 'text') return (
                                                    <FieldText key={field.id} field={field} value={String(val)} onChange={v => updateLocal(field.id, v)} />
                                                );
                                                if (field.type === 'checkbox') return (
                                                    <FieldCheckbox key={field.id} field={field} value={Boolean(val)} onChange={v => updateLocal(field.id, v)} />
                                                );
                                                if (field.type === 'select') return (
                                                    <FieldSelect key={field.id} field={field} value={String(val)} onChange={v => updateLocal(field.id, v)} />
                                                );
                                                if (field.type === 'textarea') return (
                                                    <FieldTextarea key={field.id} field={field} value={String(val)} onChange={v => updateLocal(field.id, v)} />
                                                );
                                                if (field.type === 'rating') return (
                                                    <FieldRating key={field.id} field={field} value={Number(val)} onChange={v => updateLocal(field.id, v)} />
                                                );
                                                if (field.type === 'formula') return (
                                                    <FieldFormula key={field.id} field={field} value={evaluateFormula(field.formula || '')} />
                                                );
                                                return null;
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* === UNIVERSAL SECTIONS (always visible) === */}

                    {/* Description */}
                    <div className="col-span-9 border-t border-app-border pt-6 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent border-b border-accent/20 pb-2 flex items-center gap-2">
                            <BookOpen size={12} /> Description
                        </h3>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Description du personnage — visible par les joueurs…"
                            className="w-full bg-app-bg/40 border border-app-border rounded-xl p-4 text-sm text-app-text placeholder-app-text/20 resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/20 transition-all leading-relaxed"
                        />
                    </div>

                    {/* Inventory */}
                    <div className="col-span-9 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent border-b border-accent/20 pb-2 flex items-center gap-2">
                            <Package size={12} /> Sac à Dos (Interactif)
                        </h3>
                        
                        <div className="bg-app-bg/40 border border-app-border rounded-xl overflow-hidden">
                            <div className="p-4 space-y-4">
                                {(character.inventoryItems ?? []).length === 0 ? (
                                    <div className="py-8 text-center border-2 border-dashed border-app-border/40 rounded-xl">
                                        <Package className="mx-auto text-app-text/10 mb-2" size={32} />
                                        <p className="text-[10px] font-bold text-app-text/20 uppercase tracking-widest">Le sac à dos est vide</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {(character.inventoryItems ?? []).map((item) => (
                                            <div key={item.id} className="group flex items-center gap-3 p-3 bg-app-surface/60 border border-app-border/40 rounded-xl hover:border-accent/30 transition-all">
                                                <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-accent/40">
                                                    <Package size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[11px] font-black text-app-text uppercase truncate">{item.name}</h4>
                                                    <p className="text-[9px] text-app-text/40 font-bold uppercase tracking-tighter">
                                                        {item.type} • <span className={
                                                            item.rarity === 'légendaire' ? 'text-orange-500' :
                                                            item.rarity === 'rare' ? 'text-blue-500' :
                                                            item.rarity === 'atypique' ? 'text-emerald-500' :
                                                            'text-app-text/40'
                                                        }>{item.rarity}</span> • Qté: {item.quantity}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        removeInventoryItem(item.id);
                                                        gmToast(`Objet "${item.name}" supprimé`);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isAddingItem ? (
                                    <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-300">
                                        <input 
                                            autoFocus
                                            type="text"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newItemName.trim()) {
                                                    addInventoryItem({
                                                        name: newItemName.trim(),
                                                        type: 'objet',
                                                        rarity: 'commun',
                                                        quantity: 1,
                                                        description: ''
                                                    });
                                                    gmToast(`Objet "${newItemName.trim()}" ajouté !`);
                                                    setNewItemName('');
                                                    setIsAddingItem(false);
                                                }
                                                if (e.key === 'Escape') {
                                                    setIsAddingItem(false);
                                                    setNewItemName('');
                                                }
                                            }}
                                            placeholder="Nom de l'objet..."
                                            className="flex-1 bg-black/40 border border-accent/40 rounded-xl px-4 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-accent/50"
                                        />
                                        <button 
                                            onClick={() => {
                                                if (newItemName.trim()) {
                                                    addInventoryItem({
                                                        name: newItemName.trim(),
                                                        type: 'objet',
                                                        rarity: 'commun',
                                                        quantity: 1,
                                                        description: ''
                                                    });
                                                    gmToast(`Objet "${newItemName.trim()}" ajouté !`);
                                                    setNewItemName('');
                                                    setIsAddingItem(false);
                                                }
                                            }}
                                            className="p-3 bg-accent text-app-bg rounded-xl hover:opacity-90 transition-all font-black"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsAddingItem(false);
                                                setNewItemName('');
                                            }}
                                            className="p-3 bg-app-surface border border-app-border text-app-text/40 rounded-xl hover:text-red-500 transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsAddingItem(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-accent/20 hover:border-accent/50 hover:bg-accent/5 text-accent rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                                    >
                                        <Plus size={14} />
                                        Ajouter un objet
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-[9px] text-app-text/20 italic">Ces objets sont interactifs sur le Hub du joueur et peuvent être échangés entre joueurs.</p>
                    </div>

                    {/* Inventory Legacy */}
                    <div className="col-span-9 space-y-3 opacity-60">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 border-b border-app-border/40 pb-2 flex items-center gap-2">
                            <FileText size={12} /> Notes d'Inventaire (Ancien système)
                        </h3>
                        <textarea
                            value={inventory}
                            onChange={e => setInventory(e.target.value)}
                            rows={4}
                            placeholder="Anciennes notes d'inventaire..."
                            className="w-full bg-app-bg/20 border border-app-border rounded-xl p-4 text-sm text-app-text/60 placeholder-app-text/10 resize-none focus:outline-none leading-relaxed font-mono"
                        />
                    </div>

                    {/* Player Notes */}
                    <div className="col-span-9 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 border-b border-cyan-500/20 pb-2 flex items-center gap-2">
                            <PenTool size={12} /> Notes du Joueur
                            <span className="ml-auto text-[9px] bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 px-2 py-0.5 rounded-full normal-case tracking-normal font-bold">Public Joueur</span>
                        </h3>
                        <textarea
                            value={playerNotes}
                            onChange={e => setPlayerNotes(e.target.value)}
                            rows={4}
                            placeholder="Notes partagées avec le joueur — visible sur son HUB…"
                            className="w-full bg-cyan-950/10 border border-cyan-500/10 rounded-xl p-4 text-sm text-app-text placeholder-app-text/20 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/20 transition-all leading-relaxed"
                        />
                    </div>

                    {/* GM Notes */}
                    <div className="col-span-9 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 border-b border-amber-500/20 pb-2 flex items-center gap-2">
                            <Lock size={12} /> Notes du MJ
                            <span className="ml-auto text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full normal-case tracking-normal font-bold">Privé</span>
                        </h3>
                        <textarea
                            value={gmNotes}
                            onChange={e => setGmNotes(e.target.value)}
                            rows={4}
                            placeholder="Notes secrètes du MJ — jamais visible par les joueurs…"
                            className="w-full bg-amber-950/10 border border-amber-500/10 rounded-xl p-4 text-sm text-app-text placeholder-app-text/20 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/20 transition-all leading-relaxed"
                        />
                    </div>

                    {/* Tablet HUB Configuration */}
                    <div className="col-span-9 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 border-b border-cyan-500/20 pb-2 flex items-center gap-2">
                            <Tablet size={12} /> Configuration Tablet HUB
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <FieldCheckbox 
                                field={{ id: 'showHP', label: 'Afficher PV', type: 'checkbox', defaultValue: true }} 
                                value={character.hubOptions?.showHP ?? true} 
                                onChange={(val) => updateCharacterHubOptions({ showHP: val })} 
                            />
                            <FieldCheckbox 
                                field={{ id: 'showMP', label: 'Afficher PM', type: 'checkbox', defaultValue: true }} 
                                value={character.hubOptions?.showMP ?? true} 
                                onChange={(val) => updateCharacterHubOptions({ showMP: val })} 
                            />
                            <FieldCheckbox 
                                field={{ id: 'showAP', label: 'Afficher PA', type: 'checkbox', defaultValue: true }} 
                                value={character.hubOptions?.showAP ?? true} 
                                onChange={(val) => updateCharacterHubOptions({ showAP: val })} 
                            />
                            <FieldCheckbox 
                                field={{ id: 'showInventory', label: 'Afficher Inventaire', type: 'checkbox', defaultValue: true }} 
                                value={character.hubOptions?.showInventory ?? true} 
                                onChange={(val) => updateCharacterHubOptions({ showInventory: val })} 
                            />
                            <FieldCheckbox 
                                field={{ id: 'showRelations', label: 'Afficher Relations', type: 'checkbox', defaultValue: true }} 
                                value={character.hubOptions?.showRelations ?? true} 
                                onChange={(val) => updateCharacterHubOptions({ showRelations: val })} 
                            />
                        </div>
                        <p className="text-[9px] text-app-text/20 italic">Déterminez quels éléments sont visibles par le joueur sur sa tablette.</p>
                    </div>

                    {/* Linked Documents */}
                    <div className="col-span-9 space-y-3">
                        <div className="flex items-center justify-between border-b border-accent/20 pb-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                                <FileText size={12} /> Documents Liés
                            </h3>
                            <button
                                onClick={() => setMediaBrowserTarget('document')}
                                className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-accent/10 text-accent border border-accent/30 rounded-lg hover:bg-accent/20 transition-all"
                            >
                                + Lier un document
                            </button>
                        </div>
                        {(character.linkedDocumentIds ?? []).length === 0 ? (
                            <div
                                onClick={() => setMediaBrowserTarget('document')}
                                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-app-border hover:border-accent/30 cursor-pointer transition-all group"
                            >
                                <FileText size={24} className="text-app-text/20 group-hover:text-accent/50 transition-colors" />
                                <p className="text-xs text-app-text/20 group-hover:text-app-text/40 transition-colors">Cliquez pour lier un PDF, Word, etc. depuis le Media Hub</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {(character.linkedDocumentIds ?? []).map(docId => {
                                    const media = mediaList.find(m => m.id === docId);
                                    const ext = media?.name.split('.').pop()?.toUpperCase() ?? '?';
                                    return (
                                        <div key={docId} className="flex items-center gap-3 px-4 py-2.5 bg-app-bg/40 border border-app-border/40 rounded-xl hover:border-app-border/60 transition-all group">
                                            <FileText size={14} className="text-emerald-400 flex-shrink-0" />
                                            <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{ext}</span>
                                            <button
                                                onClick={() => openDocument(docId)}
                                                className="flex-1 text-left text-sm text-app-text/80 hover:text-app-text transition-colors truncate"
                                            >
                                                {media?.name ?? docId}
                                            </button>
                                            <button
                                                onClick={() => handleRemoveDocument(docId)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-app-text/20 hover:text-red-400 transition-all"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <AIPromptOverlay
                isOpen={showAIPrompt}
                onClose={() => setShowAIPrompt(false)}
                isGenerating={isGeneratingAIImage}
                title={`Portrait IA : ${character.name}`}
                placeholder="Ex: cape rouge déchirée, tatouages mystiques, regard d'acier..."
                onGenerate={handleGeneratePortrait}
            />
        </div>
    );
};

export default CharacterSheetEditor;
