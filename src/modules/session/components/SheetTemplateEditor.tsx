import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import type { SheetTemplate, SheetSection, SheetField, SheetFieldType } from '../../../data/defaultSheetTemplates';
import { 
    Plus, Trash2, ChevronDown, ChevronRight, Pencil, Sparkles, Brain, 
    BookOpen, Save, ArrowLeft, PenTool, Music, Beaker, User, Map,
    type LucideIcon 
} from 'lucide-react';
import { useGemStore } from '../../../stores/useGemStore';
import type { GameDriver } from '../../../types/drivers';

const FIELD_TYPE_LABELS: Record<SheetFieldType, string> = {
    gauge: 'Jauge (%)',
    number: 'Nombre',
    text: 'Texte',
    checkbox: 'Case à cocher',
    select: 'Liste déroulante',
    textarea: 'Texte multiligne',
    rating: 'Échelle (Ex: 1 à 5)',
    formula: 'Formule (Calculée)',
};

// Sub-component for options input
const FieldOptionsInput: React.FC<{
    options: string[];
    onUpdate: (newOptions: string[]) => void;
}> = ({ options, onUpdate }) => {
    const [text, setText] = React.useState(options.join(', '));

    React.useEffect(() => {
        const currentText = options.join(', ');
        const currentSplit = text.split(',').map(s => s.trim()).filter(s => s);
        if (options.length !== currentSplit.length || options.some((opt, i) => opt !== currentSplit[i])) {
            if (!text.endsWith(', ') && !text.endsWith(',')) {
                setText(currentText);
            }
        }
    }, [options, text]);

    const handleChange = (newVal: string) => {
        setText(newVal);
        const split = newVal.split(',').map(s => s.trim()).filter(s => s);
        onUpdate(split);
    };

    return (
        <input 
            type="text"
            value={text}
            onChange={e => handleChange(e.target.value)}
            placeholder="Ex: Épée, Hache, Arc..."
            className="flex-1 bg-app-bg/20 text-xs text-app-text/80 px-2 py-1 rounded border border-app-border/10 focus:outline-none focus:border-accent/30"
        />
    );
};

const SectionEditor: React.FC<{
    section: SheetSection;
    onUpdate: (updated: SheetSection) => void;
    onDelete: () => void;
}> = ({ section, onUpdate, onDelete }) => {
    const { showConfirm } = useModalStore();
    const [isOpen, setIsOpen] = React.useState(true);

    const updateField = (index: number, updates: Partial<SheetField>) => {
        const newFields = [...section.fields];
        newFields[index] = { ...newFields[index], ...updates };
        onUpdate({ ...section, fields: newFields });
    };

    const addField = () => {
        const newField: SheetField = {
            id: `field-${Date.now()}`,
            label: 'Nouveau Champ',
            type: 'gauge',
            defaultValue: 50,
        };
        onUpdate({ ...section, fields: [...section.fields, newField] });
    };

    const removeField = (index: number) => {
        showConfirm(
            `Supprimer le champ "${section.fields[index].label}" ?`,
            () => onUpdate({ ...section, fields: section.fields.filter((_, i) => i !== index) })
        );
    };

    return (
        <div className="border border-app-border/40 rounded-2xl overflow-hidden bg-app-surface/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 p-4 bg-app-surface/60 border-b border-app-border/20">
                <button onClick={() => setIsOpen(!isOpen)} title={isOpen ? "Réduire" : "Développer"} className="text-app-text/40 hover:text-accent transition-colors">
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <input
                    type="text"
                    value={section.label}
                    onChange={e => onUpdate({ ...section, label: e.target.value })}
                    className="flex-1 bg-transparent font-bold text-base text-app-text focus:outline-none"
                    placeholder="Nom de la section..."
                    title="Nom de la section"
                />
                <button 
                    onClick={() => showConfirm(`Supprimer la section "${section.label}" et tous ses champs ?`, onDelete)} 
                    title="Supprimer la section"
                    className="p-2 text-app-text/40 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {isOpen && (
                <div className="p-4 space-y-3">
                    {section.fields.map((field, i) => (
                        <div key={field.id} className="flex flex-col gap-3 p-3 bg-app-surface/30 rounded-xl border border-app-border/10 group relative transition-all hover:border-accent/20">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 flex items-center gap-3">
                                    <Pencil size={14} className="text-app-text/20 animate-pulse-gentle" />
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={e => updateField(i, { label: e.target.value })}
                                        className="flex-1 bg-transparent text-sm font-medium text-app-text/80 focus:outline-none"
                                        placeholder="Label du champ"
                                        title="Label du champ"
                                    />
                                </div>
                                <select
                                    value={field.type}
                                    title="Type de champ"
                                    onChange={e => updateField(i, { 
                                        type: e.target.value as SheetFieldType, 
                                        defaultValue: e.target.value === 'gauge' ? 50 : e.target.value === 'number' || e.target.value === 'rating' ? 0 : e.target.value === 'checkbox' ? false : '',
                                        ...(e.target.value === 'rating' ? { max: 5 } : {}),
                                        ...(e.target.value === 'select' ? { options: [] } : {})
                                    })}
                                    className="bg-app-bg text-app-text/80 text-xs rounded-lg px-3 py-1.5 border border-app-border/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
                                >
                                    {(Object.entries(FIELD_TYPE_LABELS) as [SheetFieldType, string][]).map(([type, label]) => (
                                        <option key={type} value={type}>{label}</option>
                                    ))}
                                </select>
                                <button onClick={() => removeField(i)} title="Supprimer le champ" className="p-1.5 text-app-text/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            
                            {field.type === 'formula' && (
                                <div className="flex flex-col gap-2 pl-8">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-accent font-black uppercase tracking-widest">Équation</span>
                                        <input 
                                            type="text"
                                            value={field.formula || ''}
                                            title="Formule de calcul (ex: 1d20 + @StrMod)"
                                            onChange={e => updateField(i, { formula: e.target.value })}
                                            className="flex-1 bg-app-bg/20 text-xs text-accent px-3 py-1.5 rounded border border-accent/20 focus:outline-none focus:border-accent/50 font-mono shadow-inner"
                                            placeholder="Ex: 1d20 + @StrMod + 5"
                                        />
                                    </div>
                                    <p className="text-[9px] text-app-text/40 italic">Utilisez @NomDuChamp pour référencer une autre variable.</p>
                                </div>
                            )}
                            {field.type === 'select' && (
                                <div className="flex items-center gap-3 pl-8">
                                    <span className="text-[10px] text-app-text/40 uppercase font-black tracking-widest">Options</span>
                                    <FieldOptionsInput 
                                        options={field.options || []} 
                                        onUpdate={newOptions => updateField(i, { options: newOptions })} 
                                    />
                                </div>
                            )}
                            {field.type === 'rating' && (
                                <div className="flex items-center gap-3 pl-8">
                                    <span className="text-[10px] text-app-text/40 uppercase font-black tracking-widest">Maximum</span>
                                    <input 
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={field.max || 5}
                                        title="Valeur maximale"
                                        onChange={e => updateField(i, { max: parseInt(e.target.value) || 5 })}
                                        className="w-20 bg-app-bg/20 text-xs text-app-text px-3 py-1 rounded border border-app-border/10 focus:outline-none focus:border-accent/30 text-center font-mono"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addField}
                        title="Ajouter un champ"
                        className="w-full py-3 text-xs text-app-text/30 hover:text-accent border border-dashed border-app-border/40 hover:border-accent/40 rounded-xl transition-all flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] bg-app-surface/40 hover:bg-accent/5"
                    >
                        <Plus size={14} /> Ajouter un composant
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * SheetTemplateEditor: Full-window interface for modifying the "Body" (Visual) and "Resonance" (AI).
 * Note: AI metadata is delegated to the linked GameDriver to maintain Brain vs Body separation.
 * If editing a builtin template, AI changes will trigger the creation of a shadow custom driver.
 */
const SheetTemplateEditor: React.FC = () => {
    const { 
        customSheetTemplates,
        customGameDrivers,
        updateSheetTemplate,
        deleteSheetTemplate,
        editingTemplateId, 
        setEditingTemplateId,
        setCurrentView,
        getOrCreateDriverForTemplate,
        updateGameDriver
    } = useSessionOSStore();
    const { showConfirm } = useModalStore();

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const template = allTemplates.find(t => t.id === editingTemplateId);
    
    // Use a selector to find the driver instead of getOrCreate during render
    const driver = customGameDrivers.find(d => d.templateId === editingTemplateId);
    const { gems, syncGemsWithDefaults } = useGemStore();

    React.useEffect(() => {
        if (template && !driver) {
            // It is safe to trigger state updates (creation) inside useEffect
            getOrCreateDriverForTemplate(template.id);
        }
        syncGemsWithDefaults();
    }, [template?.id, driver, getOrCreateDriverForTemplate, syncGemsWithDefaults, template]);

    if (!template) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-app-text/40">
                <Brain size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-bold">Neural Link Severed</p>
                <p className="text-sm mt-2 mb-8 text-center max-w-md">The requested template could not be retrieved from the persistent data buffers.</p>
                <button 
                    onClick={() => setCurrentView('templates')}
                    className="px-6 py-2 bg-app-surface border border-app-border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-app-surface/80"
                >
                    Return to Library
                </button>
            </div>
        );
    }

    const handleUpdate = (updates: Partial<SheetTemplate>) => {
        if (template.isBuiltin) return;
        updateSheetTemplate(template.id, updates);
    };

    const handleDriverUpdate = (updates: Partial<GameDriver>) => {
        if (driver) updateGameDriver(driver.id, updates);
    };

    const handleBack = () => {
        setEditingTemplateId(null);
        setCurrentView('templates');
    };

    const updateSection = (index: number, updated: SheetSection) => {
        const newSections = [...template.sections];
        newSections[index] = updated;
        handleUpdate({ sections: newSections });
    };

    const deleteSection = (index: number) => {
        handleUpdate({ sections: template.sections.filter((_, i) => i !== index) });
    };

    const addSection = () => {
        const newSection: SheetSection = {
            id: `section-${Date.now()}`,
            label: 'Nouvelle Section',
            fields: [],
        };
        handleUpdate({ sections: [...template.sections, newSection] });
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-app-bg select-none">
            {/* Top Premium Bar */}
            <div className="h-20 border-b border-app-border/20 bg-app-surface/40 backdrop-blur-xl px-8 flex items-center justify-between z-50">
                <div className="flex-1 flex items-center gap-6">
                    <button 
                        onClick={handleBack}
                        title="Retour à la bibliothèque"
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-app-bg border border-app-border/40 text-app-text/60 hover:text-app-text hover:border-accent/40 transition-all shadow-lg hover:scale-105 active:scale-95 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="h-10 w-[1px] bg-app-border/20 mx-2" />
                    <div className="flex-1 flex items-center gap-4">
                        <input
                            type="text"
                            value={template.emoji}
                            title="Emoji du système"
                            onChange={e => handleUpdate({ emoji: e.target.value })}
                            className="w-12 h-12 bg-app-bg text-center text-2xl rounded-2xl p-1 border border-app-border/40 focus:outline-none focus:border-accent/50 shadow-inner"
                            maxLength={2}
                            readOnly={template.isBuiltin}
                        />
                        <div className="flex-1 min-w-0">
                            <input
                                type="text"
                                value={template.name}
                                onChange={e => handleUpdate({ name: e.target.value })}
                                title="Nom du système"
                                className="bg-transparent text-xl font-black text-app-text focus:outline-none border-b border-transparent focus:border-accent/40 transition-all w-full min-w-[600px]"
                                placeholder="Nom du système"
                                readOnly={template.isBuiltin}
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${template.isBuiltin ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                                    {template.isBuiltin ? 'Noyau Système' : 'Module Utilisateur'}
                                </span>
                                <span className="text-[9px] text-app-text/20 font-bold uppercase tracking-tighter">ID: {template.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {template.isBuiltin ? (
                        <p className="text-xs text-amber-500 italic mr-4">Modèle en lecture seule. Dupliquez pour modifier.</p>
                    ) : (
                        <button
                            onClick={() => {
                                // Save is implicit via store updates, but we can provide visual feedback
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-app-bg font-black text-xs uppercase tracking-widest shadow-glow-accent hover:opacity-90 transition-all"
                        >
                            <Save size={16} /> Enregistrer
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-dots-pattern">
                <div className="max-w-6xl mx-auto p-12 space-y-12 pb-32">
                    
                    {/* Header: AI Configuration */}
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-4 space-y-6">
                            <div className="p-6 bg-app-surface/40 rounded-3xl border border-app-border/40 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-accent/5">
                                    <Sparkles size={80} />
                                </div>
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent mb-4">
                                    <Brain size={16} /> Aetheric Resonance
                                </h4>
                                <p className="text-[11px] text-app-text/60 leading-relaxed mb-6">
                                    Personnalisez la voix de l'IA pour ce système. Ces instructions surchargent les paramètres globaux lorsque ce driver est actif.
                                </p>
                                
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-app-text/30 mb-2">NotebookLM Principal</p>
                                    <div className="relative group">
                                        <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent/40" />
                                        <input 
                                            type="text"
                                            value={driver?.defaultNotebookUrl || template.defaultNotebookUrl || ''}
                                            onChange={e => handleDriverUpdate({ defaultNotebookUrl: e.target.value })}
                                            placeholder="URL du NotebookLM..."
                                            className="w-full bg-app-bg/60 text-[11px] text-app-text/80 pl-9 pr-4 py-3 rounded-2xl border border-app-border/40 focus:outline-none focus:border-accent/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-app-text/30 mb-2">Moteur de Règles Lié</p>
                                    <div className="flex items-center gap-3 p-3 bg-app-bg/60 rounded-2xl border border-app-border/40">
                                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                            <Brain size={16} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[10px] font-bold text-app-text truncate">
                                                {customGameDrivers.find(d => d.templateId === template.id)?.name || "Générique Dice-OS"}
                                            </p>
                                            <p className="text-[8px] text-app-text/20 uppercase font-black">Pilote ce système</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!template.isBuiltin && (
                                <div className="p-6 rounded-3xl border-2 border-dashed border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all group">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Destruction Sécurisée</h5>
                                    <p className="text-[10px] text-app-text/40 mb-4">Supprimer définitivement ce module de fiches de la mémoire système.</p>
                                    <button 
                                        onClick={() => showConfirm(`Supprimer définitivement "${template.name}" ?`, () => {
                                            deleteSheetTemplate(template.id);
                                            handleBack();
                                        })}
                                        className="w-full py-2 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                    >
                                        Effacer les données
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Personas & Gems Grid */}
                        <div className="col-span-8">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-app-text/40 mb-6 flex items-center gap-3">
                                <Sparkles size={14} /> Neural Overrides & Gems
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {gems.map(gem => {
                                    const iconMap: Record<string, LucideIcon> = { BookOpen, PenTool, Music, Beaker, Map, User, Sparkles, Brain };
                                    const Icon = iconMap[gem.icon] || Brain;
                                    const currValue = driver?.aiPersonas?.[gem.id] || '';
                                    return (
                                        <div key={gem.id} className={`p-4 rounded-2xl border transition-all ${currValue ? 'bg-accent/5 border-accent/30 shadow-glow-accent/5' : 'bg-app-surface/20 border-app-border/40 hover:border-app-border/60'} group`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${currValue ? 'bg-accent text-app-bg' : 'bg-app-bg text-app-text/40'}`}>
                                                        <Icon size={14} />
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-widest ${currValue ? 'text-accent' : 'text-app-text/60'}`}>{gem.name}</span>
                                                </div>
                                                {currValue && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                                            </div>
                                            <textarea
                                                value={currValue}
                                                onChange={e => {
                                                    const newVal = e.target.value;
                                                    const newPersonas = { ...(driver?.aiPersonas || {}) };
                                                    if (newVal.trim() === '') {
                                                        delete newPersonas[gem.id];
                                                    } else {
                                                        newPersonas[gem.id] = newVal;
                                                    }
                                                    handleDriverUpdate({ aiPersonas: newPersonas });
                                                }}
                                                placeholder={`Instructions IA pour ${gem.name}...`}
                                                className="w-full h-32 bg-app-bg/40 border border-app-border/20 rounded-xl p-3 text-[11px] text-app-text/80 focus:border-accent/40 outline-none transition-all font-mono resize-none leading-relaxed"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-transparent via-app-border/40 to-transparent" />

                    {/* Character Sheet Sections */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-3">
                                <Plus size={14} className="text-accent" /> Structure des Fiches de Jeu
                            </h3>
                            {!template.isBuiltin && (
                                <button
                                    onClick={addSection}
                                    className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent border border-accent/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all shadow-lg"
                                >
                                    + Nouvelle Section
                                </button>
                            )}
                        </div>

                        <div className={`grid grid-cols-1 ${template.isBuiltin ? 'opacity-50 pointer-events-none' : ''} gap-6`}>
                            {template.sections.map((section, i) => (
                                <SectionEditor
                                    key={section.id}
                                    section={section}
                                    onUpdate={updated => updateSection(i, updated)}
                                    onDelete={() => deleteSection(i)}
                                />
                            ))}
                        </div>

                        {!template.isBuiltin && template.sections.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-app-border/20 rounded-3xl bg-app-surface/10 group cursor-pointer hover:border-accent/20 transition-all" onClick={addSection}>
                                <div className="w-16 h-16 rounded-full bg-app-bg border border-app-border/40 flex items-center justify-center mb-6 text-app-text/20 group-hover:text-accent transition-colors">
                                    <Plus size={32} />
                                </div>
                                <h4 className="text-sm font-black text-app-text/40 group-hover:text-app-text/60 transition-colors uppercase tracking-widest">Initialiser la Structure</h4>
                                <p className="text-[11px] text-app-text/20 mt-2">Commencez par ajouter une première section de données (ex: Statistiques, Inventaire...)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SheetTemplateEditor;
