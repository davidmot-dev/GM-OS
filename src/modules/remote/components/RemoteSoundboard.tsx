import React, { useMemo, useState } from 'react';
import { Volume2, Search, X } from 'lucide-react';
import { type RemoteSound } from '../types/remote.types';

/**
 * **Les bruitages, densifiés le 2026-09-05.**
 *
 * Chaque déclencheur occupait un carré de `p-6` dans une grille de **deux
 * colonnes quelle que soit la largeur** : sur une tablette de 1024 px, près de
 * cinq cents pixels pour un mot. Le volume maître et l'arrêt général tenaient en
 * plus une carte de 200 px au-dessus.
 *
 * L'arrêt général est parti dans la ligne d'état, où il est atteignable depuis
 * n'importe quel onglet — *c'est un geste d'urgence, il n'avait rien à faire au
 * fond du troisième onglet.* Le volume tient désormais sur une ligne.
 */

interface RemoteSoundboardProps {
    sounds: RemoteSound[];
    masterVolume: number;
    onVolumeChange: (vol: number) => void;
    onTrigger: (id: string) => void;
}

const aplati = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const RemoteSoundboard: React.FC<RemoteSoundboardProps> = ({
    sounds, masterVolume, onVolumeChange, onTrigger,
}) => {
    const [filtre, setFiltre] = useState('');

    const retenus = useMemo(() => {
        const cherche = aplati(filtre.trim());
        if (!cherche) return sounds ?? [];
        return (sounds ?? []).filter(s => aplati(s.title).includes(cherche));
    }, [sounds, filtre]);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-3 h-11 rounded-xl bg-white/[0.03] border border-white/5">
                <Volume2 size={15} className="text-slate-500 shrink-0" />
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={masterVolume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-accent"
                    title="Volume maître"
                    aria-label="Volume maître"
                />
                <span className="text-xs font-black text-accent tabular-nums w-10 text-right shrink-0">
                    {Math.round(masterVolume * 100)}%
                </span>
            </div>

            {sounds && sounds.length > 8 && (
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    <input
                        type="search"
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                        placeholder="Filtrer les bruitages…"
                        aria-label="Filtrer les bruitages"
                        className="w-full h-9 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-sm text-app-text placeholder:text-slate-600 outline-none focus:border-accent/40 transition-colors"
                    />
                    {filtre && (
                        <button
                            onClick={() => setFiltre('')}
                            aria-label="Effacer le filtre"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            {retenus.length > 0 ? (
                <div className="grid grid-cols-3 min-[700px]:grid-cols-4 min-[1000px]:grid-cols-6 gap-2">
                    {retenus.map(s => (
                        <button
                            key={s.id}
                            onClick={() => onTrigger(s.id)}
                            disabled={!s.active}
                            className={`h-16 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
                                s.active
                                    ? 'bg-white/[0.03] border-white/5 hover:border-white/20 text-slate-200'
                                    : 'bg-black/20 border-white/5 text-white/20'
                            }`}
                        >
                            <Volume2 size={16} className={s.active ? 'text-rose-400' : ''} />
                            <span className="text-[10px] font-bold leading-tight text-center line-clamp-2 w-full">
                                {s.title}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-center py-10 text-sm italic text-slate-500">
                    {filtre
                        ? `Aucun bruitage ne correspond à « ${filtre} ».`
                        : "Aucun bruitage dans l'ambiance active."}
                </p>
            )}
        </div>
    );
};

export default RemoteSoundboard;
