import React from 'react';
import { useToastStore } from '../stores/useToastStore';
import type { ToastType } from '../stores/useToastStore';
import { CheckCircle2, AlertCircle, Info, XCircle, X, Loader2 } from 'lucide-react';

/*
  Un fond teinté de l'état sur la surface du thème, le texte du thème : lisible
  sur un thème clair comme sombre (refonte, L6). L'ancien fond vert très sombre
  sous un texte vert pâle ne tenait que sur fond sombre.
*/
const TYPE_STYLES: Record<ToastType, { bg: string, icon: React.ReactNode }> = {
    success: {
        bg: 'bg-[color-mix(in_srgb,var(--etat-succes)_14%,var(--app-surface))] border-etat-succes/50 text-app-text',
        icon: <CheckCircle2 size={18} className="text-etat-succes" />
    },
    error: {
        bg: 'bg-[color-mix(in_srgb,var(--etat-danger)_14%,var(--app-surface))] border-etat-danger/50 text-app-text',
        icon: <XCircle size={18} className="text-etat-danger" />
    },
    warning: {
        bg: 'bg-[color-mix(in_srgb,var(--etat-alerte)_14%,var(--app-surface))] border-etat-alerte/50 text-app-text',
        icon: <AlertCircle size={18} className="text-etat-alerte" />
    },
    info: {
        bg: 'bg-app-surface border-app-border text-app-text',
        icon: <Info size={18} className="text-app-muted" />
    },
    loading: {
        bg: 'bg-[color-mix(in_srgb,var(--etat-info)_14%,var(--app-surface))] border-etat-info/50 text-app-text',
        icon: <Loader2 size={18} className="text-etat-info animate-spin" />
    }
};

const ToastProvider: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-80">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl
                        pointer-events-auto animate-in slide-in-from-right-full fade-in duration-300
                        ${TYPE_STYLES[toast.type].bg}
                    `}
                >
                    <div className="mt-0.5">{TYPE_STYLES[toast.type].icon}</div>
                    <div className="flex-1 text-sm font-medium leading-relaxed">
                        {toast.message}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="opacity-40 hover:opacity-100 transition-opacity p-0.5"
                    >
                        <X size={14} />
                    </button>
                    
                    {/* Progress bar for auto-dismiss timer visual */}
                    <div className="absolute bottom-0 left-0 h-1 bg-app-text/10 w-full overflow-hidden rounded-b-xl">
                        <div 
                            className="h-full bg-app-text/20 animate-out slide-out-to-left-full duration-[3000ms] linear fill-mode-forwards"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ToastProvider;
