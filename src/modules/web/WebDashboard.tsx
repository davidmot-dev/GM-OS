import React, { useState } from 'react';
import {
    Globe,
    Plus,
    Trash2,
    FileUp,
    FileDown,
    Info
} from 'lucide-react';
import { useWebStore } from './useWebStore';
import type { WebLink } from './types';
import WebLinkPad from './components/WebLinkPad';
import AddEditWebLinkModal from './components/AddEditWebLinkModal';

const WebDashboard: React.FC = () => {
    const {
        links,
        addLink,
        updateLink,
        importLinks,
        exportLinks,
        clearAll
    } = useWebStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<WebLink | null>(null);

    const handleAddClick = () => {
        setEditingLink(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (link: WebLink) => {
        setEditingLink(link);
        setIsModalOpen(true);
    };

    const handleSave = (linkData: Omit<WebLink, 'id'>) => {
        if (editingLink) {
            updateLink(editingLink.id, linkData);
        } else {
            addLink(linkData);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 scrollbar-hide overflow-hidden">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20 ring-1 ring-orange-400/30">
                        <Globe className="text-slate-950 font-bold" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-orange-400 uppercase italic leading-none">
                            Web <span className="text-white">OS</span>
                            <span className="text-[10px] font-mono font-normal text-slate-500 align-top ml-2 not-italic">v5.0</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase mt-1">Global Bookmark Interface</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800 focus-within:border-slate-700 transition-all">
                        <button
                            onClick={importLinks}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-all text-[10px] font-bold text-slate-400 hover:text-blue-400 uppercase tracking-widest group"
                            title="Importer une liste JSON"
                        >
                            <FileUp size={14} className="group-hover:scale-110 transition-transform" />
                            Load
                        </button>
                        <button
                            onClick={exportLinks}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-all text-[10px] font-bold text-slate-400 hover:text-emerald-400 uppercase tracking-widest group"
                            title="Exporter la liste en JSON"
                        >
                            <FileDown size={14} className="group-hover:scale-110 transition-transform" />
                            Save
                        </button>
                    </div>

                    <div className="w-px h-8 bg-slate-800/50 mx-1"></div>

                    <button
                        onClick={clearAll}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-900/30 transition-all text-[10px] font-bold text-red-400 uppercase tracking-widest group"
                        title="Vider la bibliothèque"
                    >
                        <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                        Clear
                    </button>

                    <button
                        onClick={handleAddClick}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 transition-all text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/20 active:scale-95 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        New Link
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Empty State or Grid */}
                    {links.length === 0 ? (
                        <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-2">
                                <Info size={32} className="text-slate-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-300">Aucun raccourci web</h2>
                            <p className="text-slate-500 max-w-sm text-sm">
                                Votre bibliothèque est vide. Ajoutez des liens SRD, des générateurs ou des playlists pour y accéder rapidement.
                            </p>
                            <button
                                onClick={handleAddClick}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase transition-all shadow-xl"
                            >
                                Commencer
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6">
                            {links.map((link) => (
                                <WebLinkPad
                                    key={link.id}
                                    link={link}
                                    onEdit={handleEditClick}
                                />
                            ))}

                            {/* Ghost Add Pad */}
                            <button
                                onClick={handleAddClick}
                                className="aspect-square bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center group hover:bg-slate-900/50 hover:border-slate-700 transition-all duration-300 overflow-hidden"
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-900 border border-slate-800 group-hover:bg-slate-800 group-hover:border-slate-700 transition-colors">
                                    <Plus size={24} className="text-slate-600 group-hover:text-slate-300" />
                                </div>
                                <span className="mt-4 text-[10px] font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-[0.2em] transition-colors">Add Link</span>
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer status bar */}
            <footer className="h-10 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-emerald-500/80 font-bold">Bridge Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-orange-500/50">[sys]</span>
                        <span>{links.length} shortcuts active</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-slate-800 px-2 py-1 rounded text-slate-400 ring-1 ring-slate-700">SRV: 127.0.0.1:4444</span>
                </div>
            </footer>

            <AddEditWebLinkModal
                key={editingLink?.id || (isModalOpen ? 'new' : 'closed')}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingLink}
            />
        </div>
    );
};

export default WebDashboard;
