import { useLightStore } from '../useLightStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { RotateCcw } from 'lucide-react';

export const TopControls: React.FC = () => {
    const { transitionTimeMs, setTransitionTime, reset } = useLightStore();

    return (
        <header className="p-6 border-b border-app-border flex items-center justify-between bg-app-surface/50 backdrop-blur-sm z-10 font-sans">
            <div className="flex items-center gap-8">
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transition Time</span>
                    <div className="flex bg-app-bg p-1 rounded-lg border border-app-border">
                        <button
                            onClick={() => setTransitionTime(0)}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${transitionTimeMs === 0 ? 'bg-gm-cyan text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            Inst.
                        </button>
                        <button
                            onClick={() => setTransitionTime(2000)}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${transitionTimeMs === 2000 ? 'bg-gm-cyan text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            2s
                        </button>
                        <button
                            onClick={() => setTransitionTime(5000)}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${transitionTimeMs === 5000 ? 'bg-gm-cyan text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            5s
                        </button>
                        <button
                            onClick={() => setTransitionTime(15000)}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${transitionTimeMs === 15000 ? 'bg-gm-cyan text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                            15s
                        </button>
                    </div>
                </div>

                <div className="h-10 w-px bg-app-border"></div>

                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mock Sync</span>
                    <button
                        onClick={() => {
                            if (useLightStore.getState().status === 'mock') {
                                useLightStore.getState().setConnection('disconnected');
                            } else {
                                useLightStore.getState().setConnection('mock');
                            }
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useLightStore.getState().status === 'mock' ? 'bg-accent' : 'bg-app-surface'}`}>
                        <span className={`${useLightStore.getState().status === 'mock' ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                    </button>
                </div>

                <div className="h-10 w-px bg-app-border"></div>

                <button
                    onClick={() => gmConfirm("Voulez-vous vraiment réinitialiser le module Light OS ? Toutes vos scènes seront réinitialisées.", () => reset())}
                    title="Réinitialiser le module"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 text-red-500/50 hover:text-red-500 transition-all active:scale-95 group"
                >
                    <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Reset Module</span>
                </button>
            </div>

        </header>
    );
};
