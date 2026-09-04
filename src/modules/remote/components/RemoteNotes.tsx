import React, { useState } from 'react';
import { EyeOff, FileText } from 'lucide-react';

/**
 * **Les notes, densifiées le 2026-09-05.**
 *
 * La bascule occupait 56 px de haut et le cadre des coins de 40 px de rayon,
 * pour une hauteur de lecture fixée à 300 px qui ne suivait pas l'écran. Ici, ce
 * qui compte est **la surface de lecture** : c'est elle qui prend la place
 * rendue, et elle occupe désormais toute la hauteur disponible.
 */

interface RemoteNotesProps {
    notes: { public: string, private: string };
    isAventureMode: boolean;
}

const RemoteNotes: React.FC<RemoteNotesProps> = ({ notes, isAventureMode }) => {
    const [notesView, setNotesView] = useState<'public' | 'private'>('private');

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10 self-start">
                <button
                    onClick={() => setNotesView('private')}
                    className={`px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-colors ${notesView === 'private' ? 'bg-accent text-app-bg' : 'text-slate-500'}`}
                >
                    <EyeOff size={13} /> Secrets MJ
                </button>
                <button
                    onClick={() => setNotesView('public')}
                    className={`px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-colors ${notesView === 'public' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                >
                    <FileText size={13} /> Synopsis
                </button>
            </div>

            <div className={`flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-all ${isAventureMode && notesView === 'private' ? 'blur-md grayscale pointer-events-none' : ''}`}>
                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300 max-w-[75ch]">
                    {notesView === 'private'
                        ? (isAventureMode
                            ? "Contenu protégé par le Mode Aventure."
                            : (notes?.private || "Aucun secret enregistré pour cette campagne."))
                        : (notes?.public || "Aucun synopsis public disponible.")}
                </div>
            </div>
        </div>
    );
};

export default RemoteNotes;
