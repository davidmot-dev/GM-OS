import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import type { SheetTemplate, SheetSection, SheetField, SheetFieldType } from '../../../data/defaultSheetTemplates';
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Sparkles } from 'lucide-react';

const FIELD_TYPE_LABELS: Record<SheetFieldType, string> = {
    gauge: 'Jauge (%)',
    number: 'Nombre',
    text: 'Texte',
    checkbox: 'Case à cocher',
};

// --- Section Editor ---
const SectionEditor: React.FC<{
    section: SheetSection;
    onUpdate: (updated: SheetSection) => void;
    onDelete: () => void;
}> = ({ section, onUpdate, onDelete }) => {
    const { showConfirm } = useModalStore();
    const [isOpen, setIsOpen] = useState(true);

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
        <div className="border border-app-border/40 rounded-xl overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center gap-3 p-3 bg-app-surface/60">
                <button onClick={() => setIsOpen(!isOpen)} className="text-slate-500 hover:text-white transition-colors">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <input
                    type="text"
                    value={section.label}
                    onChange={e => onUpdate({ ...section, label: e.target.value })}
                    className="flex-1 bg-transparent font-bold text-sm text-white focus:outline-none"
                />
                <button 
                    onClick={() => showConfirm(`Supprimer la section "${section.label}" et tous ses champs ?`, onDelete)} 
                    className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            {/* ... rest of SectionEditor ... */}

            {/* Section Fields */}
            {isOpen && (
                <div className="p-3 space-y-2 bg-app-bg/40">
                    {section.fields.map((field, i) => (
                        <div key={field.id} className="flex items-center gap-2 p-2 bg-app-surface/30 rounded-lg border border-white/5">
                            <Pencil size={12} className="text-slate-600 flex-shrink-0" />
                            <input
                                type="text"
                                value={field.label}
                                onChange={e => updateField(i, { label: e.target.value })}
                                className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none min-w-0"
                                placeholder="Nom du champ"
                            />
                            <select
                                value={field.type}
                                onChange={e => updateField(i, { type: e.target.value as SheetFieldType, defaultValue: e.target.value === 'gauge' ? 50 : e.target.value === 'number' ? 0 : e.target.value === 'checkbox' ? false : '' })}
                                className="bg-app-bg text-app-text/80 text-[11px] rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:ring-1 focus:ring-accent/40"
                            >
                                {(Object.entries(FIELD_TYPE_LABELS) as [SheetFieldType, string][]).map(([type, label]) => (
                                    <option key={type} value={type}>{label}</option>
                                ))}
                            </select>
                            <button onClick={() => removeField(i)} className="p-1 text-app-text/20 hover:text-red-400 transition-colors">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addField}
                        className="w-full py-1.5 text-xs text-app-text/20 hover:text-accent border border-dashed border-app-border/40 hover:border-accent/40 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                        <Plus size={12} /> Ajouter un champ
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Template Editor ---
const TemplateEditor: React.FC<{
    template: SheetTemplate;
    onUpdate: (updated: SheetTemplate) => void;
    onDelete?: () => void;
}> = ({ template, onUpdate, onDelete }) => {
    const updateSection = (index: number, updated: SheetSection) => {
        const newSections = [...template.sections];
        newSections[index] = updated;
        onUpdate({ ...template, sections: newSections });
    };

    const deleteSection = (index: number) => {
        onUpdate({ ...template, sections: template.sections.filter((_, i) => i !== index) });
    };

    const addSection = () => {
        const newSection: SheetSection = {
            id: `section-${Date.now()}`,
            label: 'Nouvelle Section',
            fields: [],
        };
        onUpdate({ ...template, sections: [...template.sections, newSection] });
    };

    return (
        <div className="space-y-4">
            {/* Template Meta */}
            <div className="flex items-center gap-4 p-4 bg-app-surface/50 rounded-xl border border-app-border/40">
                <input
                    type="text"
                    value={template.emoji}
                    onChange={e => onUpdate({ ...template, emoji: e.target.value })}
                    className="w-12 bg-app-bg text-center text-xl rounded-lg p-1 focus:outline-none"
                    maxLength={2}
                />
                <input
                    type="text"
                    value={template.name}
                    onChange={e => onUpdate({ ...template, name: e.target.value })}
                    className="flex-1 bg-transparent text-lg font-bold text-white focus:outline-none border-b border-white/10 focus:border-gm-gold/50 transition-colors pb-1"
                    placeholder="Nom du template"
                />
            </div>

            {/* NotebookLM Link */}
            <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Sparkles size={16} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/70 mb-1">NotebookLM par défaut</p>
                    <input 
                        type="text"
                        value={template.defaultNotebookUrl || ''}
                        onChange={e => onUpdate({ ...template, defaultNotebookUrl: e.target.value })}
                        placeholder="https://notebooklm.google.com/notebook/..."
                        className="w-full bg-transparent text-xs text-app-text/80 focus:outline-none border-b border-white/5 focus:border-accent/50 transition-colors pb-0.5"
                    />
                </div>
                {onDelete && (
                    <button onClick={onDelete} className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all font-bold uppercase tracking-widest border border-red-500/20">
                        Supprimer
                    </button>
                )}
            </div>

            {/* Sections */}
            <div className="space-y-2">
                {template.sections.map((section, i) => (
                    <SectionEditor
                        key={section.id}
                        section={section}
                        onUpdate={updated => updateSection(i, updated)}
                        onDelete={() => deleteSection(i)}
                    />
                ))}
                <button
                    onClick={addSection}
                    className="w-full py-2 text-xs text-app-text/20 hover:text-accent border border-dashed border-app-border/40 hover:border-accent/40 rounded-xl transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest"
                >
                    <Plus size={14} /> Ajouter une section
                </button>
            </div>
        </div>
    );
};

// --- Main TemplateManager ---
const TemplateManager: React.FC = () => {
    const { customSheetTemplates, addSheetTemplate, updateSheetTemplate, deleteSheetTemplate } = useSessionOSStore();
    const { showConfirm } = useModalStore();
    const [selectedId, setSelectedId] = useState<string | null>(customSheetTemplates[0]?.id ?? null);

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const selectedTemplate = allTemplates.find(t => t.id === selectedId);

    const handleCreateNew = () => {
        const newTemplate = {
            name: 'Nouveau Système',
            emoji: '📋',
            sections: [
                { id: `section-${Date.now()}`, label: 'Statistiques', fields: [] }
            ],
        };
        addSheetTemplate(newTemplate);
        // Select the new one after creation
        setTimeout(() => {
            const store = useSessionOSStore.getState();
            const newest = store.customSheetTemplates.at(-1);
            if (newest) setSelectedId(newest.id);
        }, 50);
    };

    const handleUpdate = (updated: SheetTemplate) => {
        updateSheetTemplate(updated.id, updated);
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-app-border bg-app-surface/50 flex flex-col">
                <div className="p-4 border-b border-app-border">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Modèles de Fiches</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {allTemplates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedId(t.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${selectedId === t.id ? 'bg-accent/10 border border-accent/30 text-accent' : 'text-app-text/40 hover:bg-app-bg/50 hover:text-white border border-transparent'}`}
                        >
                            <span className="text-lg">{t.emoji}</span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{t.name}</p>
                                {t.isBuiltin && <p className="text-[9px] text-slate-600 uppercase tracking-widest">Intégré</p>}
                            </div>
                        </button>
                    ))}
                </div>
                <div className="p-3 border-t border-app-border">
                    <button
                        onClick={handleCreateNew}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gm-gold/10 border border-gm-gold/30 text-gm-gold hover:bg-gm-gold/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        <Plus size={14} /> Nouveau Modèle
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {selectedTemplate ? (
                    selectedTemplate.isBuiltin ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                                <span className="text-2xl">{selectedTemplate.emoji}</span>
                                <div>
                                    <p className="font-bold text-white">{selectedTemplate.name}</p>
                                    <p className="text-xs text-amber-600">Template intégré — non modifiable. Dupliquez-le pour le personnaliser.</p>
                                </div>
                            </div>
                            <div className="opacity-50 pointer-events-none">
                                <TemplateEditor template={selectedTemplate} onUpdate={() => {}} />
                            </div>
                        </div>
                    ) : (
                        <TemplateEditor
                            template={selectedTemplate}
                            onUpdate={handleUpdate}
                            onDelete={() => {
                                showConfirm(
                                    `Supprimer définitivement le modèle "${selectedTemplate.name}" ?`,
                                    () => {
                                        deleteSheetTemplate(selectedTemplate.id);
                                        setSelectedId(null);
                                    }
                                );
                            }}
                        />
                    )
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-600 italic text-sm h-full">
                        Sélectionnez un modèle à gauche
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateManager;
