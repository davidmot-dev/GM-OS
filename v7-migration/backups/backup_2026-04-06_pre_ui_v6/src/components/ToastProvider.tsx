import React from 'react';
import { useToastStore } from '../stores/useToastStore';
import type { ToastType } from '../stores/useToastStore';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

const TYPE_STYLES: Record<ToastType, { bg: string, icon: React.ReactNode }> = {
    success: {
        bg: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100',
        icon: <CheckCircle2 size={18} className="text-emerald-400" />
    },
    error: {
        bg: 'bg-red-950/90 border-red-500/50 text-red-100',
        icon: <XCircle size={18} className="text-red-400" />
    },
    warning: {
        bg: 'bg-amber-950/90 border-amber-500/50 text-amber-100',
        icon: <AlertCircle size={18} className="text-amber-400" />
    },
    info: {
        bg: 'bg-slate-900/90 border-slate-500/50 text-slate-100',
        icon: <Info size={18} className="text-slate-400" />
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
                    <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full overflow-hidden rounded-b-xl">
                        <div 
                            className="h-full bg-white/20 animate-out slide-out-to-left-full duration-[3000ms] linear fill-mode-forwards"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ToastProvider;
