import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { WebLink } from '../types';

interface AddEditWebLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (link: Omit<WebLink, 'id'>) => void;
    initialData?: WebLink | null;
}

const COLORS = [
    { id: 'orange', class: 'bg-orange-500' },
    { id: 'cyan', class: 'bg-cyan-500' },
    { id: 'purple', class: 'bg-purple-500' },
    { id: 'emerald', class: 'bg-emerald-500' },
    { id: 'amber', class: 'bg-amber-500' },
    { id: 'rose', class: 'bg-rose-500' },
];

const AddEditWebLinkModal: React.FC<AddEditWebLinkModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const [name, setName] = useState(initialData?.name || '');
    const [url, setUrl] = useState(initialData?.url || '');
    const [color, setColor] = useState(initialData?.color || 'orange');

    if (!isOpen) return null;


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, url, color });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                        {initialData ? 'Edit' : 'Add'} Web Link
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Label</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Dungeon Master Guide"
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all text-slate-200 text-sm"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all text-slate-200 text-sm"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 text-center block">Theme Color</label>
                        <div className="flex justify-center gap-3 py-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setColor(c.id)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.id
                                        ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                        : 'border-transparent hover:scale-105'
                                        } ${c.class}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs uppercase hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            {initialData ? 'Update' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditWebLinkModal;
