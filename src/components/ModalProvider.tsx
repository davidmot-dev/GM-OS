import React, { useState } from 'react';
import { useModalStore } from '../stores/useModalStore';
import { AlertCircle, HelpCircle, Edit3 } from 'lucide-react';

const ModalProvider: React.FC = () => {
    const { type, message, onConfirm, onCancel, onPromptConfirm, defaultValue, confirmLabel, cancelLabel, closeModal } = useModalStore();

    const [promptValue, setPromptValue] = useState(defaultValue || '');

    if (!type) return null;

    const handleConfirm = () => {
        closeModal();
        if (type === 'prompt' && onPromptConfirm) {
            onPromptConfirm(promptValue);
        } else if (onConfirm) {
            onConfirm();
        }
    };

    const handleCancel = () => {
        closeModal();
        if (onCancel) onCancel();
    };

    const getIcon = () => {
        switch (type) {
            case 'alert': return <AlertCircle className="text-gm-crimson" size={24} />;
            case 'prompt': return <Edit3 className="text-gm-violet" size={24} />;
            default: return <HelpCircle className="text-gm-cyan" size={24} />;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'alert': return 'Alerte';
            case 'prompt': return 'Saisie';
            default: return 'Confirmation';
        }
    };

    const getBtnColor = () => {
        switch (type) {
            case 'alert': return 'bg-gm-crimson hover:bg-red-400 shadow-glow-crimson';
            case 'prompt': return 'bg-gm-violet hover:bg-violet-400 shadow-glow-violet';
            default: return 'bg-gm-cyan hover:bg-cyan-400 shadow-glow-cyan';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-obsidian border border-gray-700 rounded-lg shadow-2xl max-w-sm w-full outline-none focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-obsidian-light/50 border-b border-gray-800">
                    {getIcon()}
                    <h3 className="text-lg font-bold font-display text-slate-200 uppercase tracking-tighter">
                        {getTitle()}
                    </h3>
                </div>

                {/* Body */}
                <div className="p-6 text-slate-300">
                    <p className="text-sm mb-4">{message}</p>
                    {type === 'prompt' && (
                        <input
                            type="text"
                            value={promptValue}
                            onChange={(e) => setPromptValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            autoFocus
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gm-violet/50 focus:border-gm-violet"
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-4 py-3 bg-obsidian-dark border-t border-gray-800">
                    {(type === 'confirm' || type === 'prompt') && (
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 rounded text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-gray-800 transition-colors"
                        >
                            {cancelLabel || 'Annuler'}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded text-sm font-bold text-obsidian shadow-lg transition-colors ${getBtnColor()}`}
                        autoFocus={type !== 'prompt'}
                    >
                        {confirmLabel || (type === 'prompt' ? 'Valider' : 'OK')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ModalProvider;
