import React, { useState } from 'react';
import { EyeOff, FileText } from 'lucide-react';

interface RemoteNotesProps {
    notes: { public: string, private: string };
    isAventureMode: boolean;
}

const RemoteNotes: React.FC<RemoteNotesProps> = ({ notes, isAventureMode }) => {
    const [notesView, setNotesView] = useState<'public' | 'private'>('private');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                <button 
                    onClick={() => setNotesView('private')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${notesView === 'private' ? 'bg-accent text-app-bg' : 'text-slate-500'}`}
                >
                    <EyeOff size={14} /> Secrets MJ
                </button>
                <button 
                    onClick={() => setNotesView('public')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${notesView === 'public' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                >
                    <FileText size={14} /> Synopsis
                </button>
            </div>

            <div className={`p-6 rounded-[2.5rem] premium-glass transition-all min-h-[300px] ${isAventureMode && notesView === 'private' ? 'blur-md grayscale pointer-events-none' : ''}`}>
                <div className="prose prose-invert prose-sm max-w-none">
                    {notesView === 'private' ? (
                        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
                            {isAventureMode ? "Contenu protégé par le Mode Aventure." : (notes?.private || "Aucun secret enregistré pour cette campagne.")}
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
                            {notes?.public || "Aucun synopsis public disponible."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RemoteNotes;
