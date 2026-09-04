import React from 'react';
import { Play } from 'lucide-react';
import { type RemoteMoment } from '../types/remote.types';

/**
 * **Les moments du storyboard, densifiés le 2026-09-05.**
 *
 * Chaque moment occupait une bande de pleine largeur en `p-6` — près de cent
 * pixels de haut pour une ligne de texte. Sur une tablette en paysage, six
 * moments remplissaient l'écran. Ils tiennent maintenant en deux ou trois
 * colonnes, et le numéro reste : *c'est une séquence, l'ordre est une
 * information et pas une décoration.*
 */

interface RemoteStoryboardProps {
    moments: RemoteMoment[];
    onTrigger: (index: number) => void;
}

const RemoteStoryboard: React.FC<RemoteStoryboardProps> = ({ moments, onTrigger }) => {
    if (!moments || moments.length === 0) {
        return (
            <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
                <p className="text-sm italic text-slate-500">
                    Aucun moment dans le storyboard de cette campagne.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3 gap-2">
            {moments.map((m, i) => (
                <button
                    key={m.id}
                    onClick={() => onTrigger(i)}
                    className="group flex items-center gap-3 px-3 h-14 rounded-xl border border-white/5 bg-white/[0.03] hover:border-accent/40 active:bg-accent active:text-app-bg transition-colors text-left"
                >
                    <span className="text-sm font-black italic text-slate-600 tabular-nums shrink-0 group-active:text-app-bg/60">
                        {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="flex-1 min-w-0 text-xs font-bold uppercase tracking-tight truncate text-slate-200 group-active:text-app-bg">
                        {m.name}
                    </span>
                    <Play size={16} fill="currentColor" className="text-accent shrink-0 group-active:text-app-bg" />
                </button>
            ))}
        </div>
    );
};

export default RemoteStoryboard;
