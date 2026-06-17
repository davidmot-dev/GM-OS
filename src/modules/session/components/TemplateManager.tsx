import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import type { SheetTemplate, SheetSection, SheetField, SheetFieldType } from '../../../data/defaultSheetTemplates';
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Sparkles, Brain, BookOpen, PenTool, Music, Beaker, User, Wand2, type LucideIcon } from 'lucide-react';
import { useGemStore } from '../../../stores/useGemStore';
import { aiService } from '../../ai/AIService';

const getFieldTypeLabels = (t: any): Record<SheetFieldType, string> => ({
    gauge: t('modules:session.template_manager.field_types.gauge'),
    number: t('modules:session.template_manager.field_types.number'),
    text: t('modules:session.template_manager.field_types.text'),
    checkbox: t('modules:session.template_manager.field_types.checkbox'),
    select: t('modules:session.template_manager.field_types.select'),
    textarea: t('modules:session.template_manager.field_types.textarea'),
    rating: t('modules:session.template_manager.field_types.rating'),
    formula: t('modules:session.template_manager.field_types.formula', { defaultValue: 'Formule' }),
});

// Sub-component to handle options input without immediate splitting/joining issues
const FieldOptionsInput: React.FC<{
    options: string[];
    onUpdate: (newOptions: string[]) => void;
}> = ({ options, onUpdate }) => {
    const [text, setText] = useState(options.join(', '));

    // Update internal text when external options change (e.g. from AI or undo)
    React.useEffect(() => {
        const currentText = options.join(', ');
        // Only update if the external source is significantly different
        // and doesn't match our current normalized split
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

    const { t } = useTranslation(['modules']);
    return (
        <input 
            type="text"
            value={text}
            onChange={e => handleChange(e.target.value)}
            placeholder={t('modules:session.template_manager.editor.field_options_placeholder')}
            className="flex-1 bg-black/20 text-xs text-app-text/80 px-2 py-1 rounded border border-white/5 focus:outline-none focus:border-accent/30"
        />
    );
};

// --- Section Editor ---
const SectionEditor: React.FC<{
    section: SheetSection;
    onUpdate: (updated: SheetSection) => void;
    onDelete: () => void;
}> = ({ section, onUpdate, onDelete }) => {
    const { t } = useTranslation(['modules']);
    const fieldTypeLabels = getFieldTypeLabels(t);
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
            label: t('modules:session.template_manager.editor.default_field_name'),
            type: 'gauge',
            defaultValue: 50,
        };
        onUpdate({ ...section, fields: [...section.fields, newField] });
    };

    const removeField = (index: number) => {
        showConfirm(
            t('modules:session.template_manager.editor.confirm_delete_field', { name: section.fields[index].label }),
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
                    onClick={() => showConfirm(t('modules:session.template_manager.editor.confirm_delete_section', { name: section.label }), onDelete)} 
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
                        <div key={field.id} className="flex flex-col gap-2 p-2 bg-app-surface/30 rounded-lg border border-white/5">
                            <div className="flex items-center gap-2">
                                <Pencil size={12} className="text-slate-600 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={field.label}
                                    onChange={e => updateField(i, { label: e.target.value })}
                                    className="flex-1 bg-transparent text-sm text-slate-200 focus:outline-none min-w-0"
                                    placeholder={t('modules:session.template_manager.editor.field_name_placeholder')}
                                />
                                <select
                                    value={field.type}
                                    onChange={e => updateField(i, { 
                                        type: e.target.value as SheetFieldType, 
                                        defaultValue: e.target.value === 'gauge' ? 50 : e.target.value === 'number' || e.target.value === 'rating' ? 0 : e.target.value === 'checkbox' ? false : '',
                                        ...(e.target.value === 'rating' ? { max: 5 } : {}),
                                        ...(e.target.value === 'select' ? { options: [] } : {})
                                    })}
                                    className="bg-app-bg text-app-text/80 text-[11px] rounded-lg px-2 py-1 border border-white/10 focus:outline-none focus:ring-1 focus:ring-accent/40"
                                >
                                    {(Object.entries(fieldTypeLabels) as [SheetFieldType, string][]).map(([type, label]) => (
                                        <option key={type} value={type}>{label}</option>
                                    ))}
                                </select>
                                <button onClick={() => removeField(i)} className="p-1 text-app-text/20 hover:text-red-400 transition-colors">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            
                            {/* Configuration supplementaire pour les champs complexes */}
                            {field.type === 'select' && (
                                <div className="flex items-center gap-2 pl-5">
                                    <span className="text-[10px] text-app-text/40 uppercase font-bold">{t('modules:session.template_manager.editor.field_options')}</span>
                                    <FieldOptionsInput 
                                        options={field.options || []} 
                                        onUpdate={newOptions => updateField(i, { options: newOptions })} 
                                    />
                                </div>
                            )}
                            {field.type === 'rating' && (
                                <div className="flex items-center gap-2 pl-5">
                                    <span className="text-[10px] text-app-text/40 uppercase font-bold">{t('modules:session.template_manager.editor.max_value_label')}</span>
                                    <input 
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={field.max || 5}
                                        onChange={e => updateField(i, { max: parseInt(e.target.value) || 5 })}
                                        className="w-16 bg-black/20 text-xs text-app-text/80 px-2 py-1 rounded border border-white/5 focus:outline-none focus:border-accent/30 text-center"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addField}
                        className="w-full py-1.5 text-xs text-app-text/20 hover:text-accent border border-dashed border-app-border/40 hover:border-accent/40 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                        <Plus size={12} /> {t('modules:session.template_manager.editor.add_field')}
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
    const { t } = useTranslation(['settings', 'modules']);
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
            label: t('modules:session.template_manager.editor.default_section_name'),
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
                    placeholder={t('modules:session.template_manager.editor.template_name_placeholder')}
                />
            </div>

            {/* NotebookLM Link */}
            <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Sparkles size={16} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/70 mb-1">{t('modules:session.template_manager.editor.notebook_link_label')}</p>
                    <input 
                        type="text"
                        value={template.defaultNotebookUrl || ''}
                        onChange={e => onUpdate({ ...template, defaultNotebookUrl: e.target.value })}
                        placeholder={t('modules:session.template_manager.editor.notebook_link_placeholder')}
                        className="w-full bg-transparent text-xs text-app-text/80 focus:outline-none border-b border-white/5 focus:border-accent/50 transition-colors pb-0.5"
                    />
                </div>
                {onDelete && (
                    <button onClick={onDelete} className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all font-bold uppercase tracking-widest border border-red-500/20">
                        {t('modules:session.template_manager.manager.delete_btn')}
                    </button>
                )}
            </div>

            {/* AI Personas Override */}
            <div className="space-y-3 mt-6">
                <h4 className="text-xs font-black uppercase tracking-tight text-app-text flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" /> {t('modules:session.template_manager.editor.ai_personas_title')}
                </h4>
                <p className="text-[10px] text-app-text/60">{t('modules:session.template_manager.editor.ai_personas_subtitle')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {useGemStore.getState().gems.map(gem => {
                        const iconMap: Record<string, LucideIcon> = { BookOpen, PenTool, Music, Beaker, User, Sparkles, Brain };
                        const Icon = iconMap[gem.icon] || Brain;
                        const currValue = template.aiPersonas?.[gem.id] || '';
                        return (
                            <div key={gem.id} className="p-3 bg-app-surface/40 border border-white/5 rounded-xl space-y-2 focus-within:border-accent/30 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Icon size={14} className="text-accent" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{t(gem.name)}</span>
                                </div>
                                <textarea
                                    value={currValue}
                                    onChange={e => {
                                        const newVal = e.target.value;
                                        const newPersonas = { ...(template.aiPersonas || {}) };
                                        if (newVal.trim() === '') {
                                            delete newPersonas[gem.id];
                                        } else {
                                            newPersonas[gem.id] = newVal;
                                        }
                                        onUpdate({ ...template, aiPersonas: newPersonas });
                                    }}
                                    placeholder={t('modules:session.template_manager.editor.ai_personas_placeholder', { name: t(gem.name) })}
                                    className="w-full h-20 bg-black/40 border border-app-border/40 rounded-xl p-3 text-xs text-app-text/80 focus:border-accent/50 outline-none transition-all font-mono"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-2 mt-6">
                <h4 className="text-xs font-black uppercase tracking-tight text-app-text mb-3">{t('modules:session.template_manager.editor.sections_champs_title')}</h4>
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
                    <Plus size={14} /> {t('modules:session.template_manager.editor.add_section')}
                </button>
            </div>
        </div>
    );
};

// --- Main TemplateManager ---
const TemplateManager: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { customSheetTemplates, addSheetTemplate, updateSheetTemplate, deleteSheetTemplate } = useSessionOSStore();
    const { showConfirm, showPrompt } = useModalStore();
    const [selectedId, setSelectedId] = useState<string | null>(customSheetTemplates[0]?.id ?? null);
    const [isGenerating, setIsGenerating] = useState(false);

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const selectedTemplate = allTemplates.find(t => t.id === selectedId);

    const handleCreateNew = () => {
        const newTemplate = {
            name: t('modules:session.template_manager.manager.new_system_name'),
            emoji: '📋',
            sections: [
                { id: `section-${Date.now()}`, label: t('modules:session.template_manager.manager.default_section_stats'), fields: [] }
            ],
        };
        addSheetTemplate(newTemplate);
        setTimeout(() => {
            const store = useSessionOSStore.getState();
            const newest = store.customSheetTemplates.at(-1);
            if (newest) setSelectedId(newest.id);
        }, 50);
    };

    const handleGenerateWithAI = () => {
        showPrompt(
            t('modules:session.template_manager.manager.prompt_system_name'),
            "",
            async (systemQuery) => {
                if (!systemQuery.trim()) return;
                setIsGenerating(true);
                try {
                    const templateData = await aiService.generateStructuredTemplate(systemQuery);
                    const newTemplate = {
                        ...templateData,
                        id: `system-${Date.now()}`,
                        sections: templateData.sections || []
                    };
                    addSheetTemplate(newTemplate as SheetTemplate);
                    setTimeout(() => {
                        const store = useSessionOSStore.getState();
                        const newest = store.customSheetTemplates.at(-1);
                        if (newest) setSelectedId(newest.id);
                    }, 50);
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : String(e);
                    alert(`Erreur de génération : ${msg}`);
                } finally {
                    setIsGenerating(false);
                }
            },
            t('modules:session.template_manager.manager.generate_btn'),
            t('modules:session.template_manager.manager.cancel_btn')
        );
    };

    const handleUpdate = (updated: SheetTemplate) => {
        updateSheetTemplate(updated.id, updated);
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 border-r border-app-border bg-app-surface/50 flex flex-col">
                <div className="p-4 border-b border-app-border">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{t('modules:session.template_manager.manager.sidebar_title')}</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {allTemplates.map(templateItem => (
                        <button
                            key={templateItem.id}
                            onClick={() => setSelectedId(templateItem.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${selectedId === templateItem.id ? 'bg-accent/10 border border-accent/30 text-accent' : 'text-app-text/40 hover:bg-app-bg/50 hover:text-white border border-transparent'}`}
                        >
                            <span className="text-lg">{templateItem.emoji}</span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{templateItem.name}</p>
                                {templateItem.isBuiltin && <p className="text-[9px] text-slate-600 uppercase tracking-widest">{t('modules:session.template_manager.manager.builtin_tag')}</p>}
                            </div>
                        </button>
                    ))}
                </div>
                <div className="p-3 border-t border-app-border space-y-2">
                    <button
                        onClick={handleCreateNew}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gm-gold/10 border border-gm-gold/30 text-gm-gold hover:bg-gm-gold/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        <Plus size={14} /> {t('modules:session.template_manager.manager.new_template_btn')}
                    </button>
                    <button
                        onClick={handleGenerateWithAI}
                        disabled={isGenerating}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            isGenerating
                            ? 'bg-accent/20 text-accent/50 cursor-wait'
                            : 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20'
                        }`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                                {t('modules:session.template_manager.manager.generating_state')}
                            </>
                        ) : (
                            <>
                                <Wand2 size={14} /> {t('modules:session.template_manager.manager.generate_ai_btn')}
                            </>
                        )}
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
                                    <p className="text-xs text-amber-600">{t('modules:session.template_manager.manager.builtin_warning')}</p>
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
                                    t('modules:session.template_manager.manager.delete_confirm', { name: selectedTemplate.name }),
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
                        {t('modules:session.template_manager.manager.empty_selection')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateManager;
