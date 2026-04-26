import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { Plus, Trash2, Edit3, Check } from 'lucide-react';

interface SessionChecklistProps {
    sessionId?: string;
}

const SessionChecklist: React.FC<SessionChecklistProps> = ({ sessionId }) => {
    const { t } = useTranslation();
    const { 
        sessions, 
        activeCampaignId, 
        toggleChecklistItem, 
        addChecklistItem, 
        removeChecklistItem, 
        updateChecklistItem 
    } = useSessionOSStore();
    
    const [newItemText, setNewItemText] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // If an ID is provided, use it. Otherwise, fallback to the active session for the campaign.
    const session = sessionId 
        ? sessions.find(s => s.id === sessionId)
        : sessions.find(s => s.campaignId === activeCampaignId && s.status === 'active');

    if (!session) return null;

    const handleAddItem = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newItemText.trim()) {
            addChecklistItem(session.id, newItemText.trim());
            setNewItemText('');
        }
    };

    const startEditing = (id: string, text: string) => {
        setEditingId(id);
        setEditText(text);
    };

    const saveEdit = (id: string) => {
        if (editText.trim()) {
            updateChecklistItem(session.id, id, editText.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="flex flex-col gap-4 flex-shrink-0">
            <div className="flex items-center justify-between px-3">
                <p className="text-app-text/40 text-[10px] font-bold uppercase tracking-[0.2em]">{t('modules:session.checklist.prep_session')}</p>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-accent">
                        {(session.checklist || []).filter(i => i.isCompleted).length}/{(session.checklist || []).length}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto px-1 custom-scrollbar">
                {(!session.checklist || session.checklist.length === 0) ? (
                    <p className="text-[10px] text-app-text/50 italic text-center py-4">{t('modules:session.checklist.no_task')}</p>
                ) : (
                    session.checklist.map(item => (
                        <div
                            key={item.id}
                            className="flex items-center gap-2 p-1.5 hover:bg-app-surface/40 rounded-lg group transition-all"
                        >
                            <input
                                title={t('modules:session.checklist.tooltip_complete')}
                                type="checkbox"
                                checked={item.isCompleted}
                                onChange={() => toggleChecklistItem(session.id, item.id)}
                                className="rounded border-app-border bg-app-bg text-accent focus:ring-accent focus:ring-offset-app-bg h-3.5 w-3.5 cursor-pointer flex-shrink-0 transition-all checked:bg-accent"
                            />
                            
                            {editingId === item.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        title={t('modules:session.checklist.tooltip_edit_task')}
                                        autoFocus
                                        className="flex-1 bg-app-bg border-none text-xs text-app-text p-0 focus:ring-0"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                                        onBlur={() => saveEdit(item.id)}
                                    />
                                    <button onClick={() => saveEdit(item.id)} title={t('modules:session.checklist.tooltip_validate')} className="text-emerald-500 hover:text-emerald-400">
                                        <Check size={14} />
                                    </button>
                                </div>
                             ) : (
                                <span 
                                    className={`flex-1 text-xs transition-all truncate select-none ${item.isCompleted ? 'text-app-text/40 line-through opacity-60' : 'text-app-text'}`}
                                    onDoubleClick={() => startEditing(item.id, item.text)}
                                >
                                    {item.text}
                                </span>
                            )}

                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => startEditing(item.id, item.text)}
                                    className="p-1 text-app-text/40 hover:text-accent transition-colors"
                                    title={t('modules:session.checklist.tooltip_modify')}
                                >
                                    <Edit3 size={12} />
                                </button>
                                <button 
                                    onClick={() => removeChecklistItem(session.id, item.id)}
                                    className="p-1 text-app-text/40 hover:text-red-400 transition-colors"
                                    title={t('modules:session.checklist.tooltip_delete')}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddItem} className="mt-2 px-2 relative group">
                <input
                    type="text"
                    placeholder={t('modules:session.checklist.add_placeholder')}
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    className="w-full bg-app-surface/60 border border-app-border rounded-lg py-2 pl-3 pr-10 text-[11px] text-app-text placeholder:text-app-text/40 focus:outline-none focus:border-accent/30 transition-all"
                    title={t('modules:session.checklist.tooltip_new_task')}
                />
                <button 
                    type="submit"
                    title={t('modules:session.checklist.tooltip_add')}
                    disabled={!newItemText.trim()}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-text/40 hover:text-accent disabled:opacity-0 transition-all"
                >
                    <Plus size={16} />
                </button>
            </form>
        </div>
    );
};

export default SessionChecklist;
