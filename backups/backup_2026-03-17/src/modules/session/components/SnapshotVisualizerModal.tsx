import React from 'react';
import type { SessionModuleSnapshot } from '../useSessionOSStore';

interface SnapshotVisualizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    snapshot: SessionModuleSnapshot;
    sessionName: string;
}

const SnapshotVisualizerModal: React.FC<SnapshotVisualizerModalProps> = ({ 
    isOpen, 
    onClose, 
    snapshot, 
    sessionName 
}) => {
    const [activeTab, setActiveTab] = React.useState<string>('summary');

    if (!isOpen) return null;

    const renderJson = (data: unknown) => (
        <pre className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-[400px] text-xs text-cyan-400 font-mono border border-slate-800 scrollbar-thin">
            {JSON.stringify(data, null, 2)}
        </pre>
    );

    const tabs = [
        { id: 'summary', label: 'Résumé', icon: 'dashboard' },
        { id: 'music', label: 'Musique', icon: 'music_note', data: snapshot.music },
        { id: 'sound', label: 'Sons', icon: 'volume_up', data: snapshot.sound },
        { id: 'ambient', label: 'Ambiance', icon: 'filter_drama', data: snapshot.ambient },
        { id: 'light', label: 'Lumières', icon: 'lightbulb', data: snapshot.light },
        { id: 'image', label: 'Images', icon: 'image', data: snapshot.image },
        { id: 'web', label: 'Web', icon: 'language', data: snapshot.web },
        { id: 'combat', label: 'Combat', icon: 'swords', data: snapshot.combat },
    ].filter(t => t.id === 'summary' || t.data);

    return (
        <div className="flex flex-col h-full bg-slate-900 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-violet-400">visibility</span>
                        Contenu du Snapshot
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Session : <span className="text-violet-300">{sessionName}</span> • 
                        Capturé le {new Date(snapshot.timestamp).toLocaleString()}
                    </p>
                </div>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Tabs */}
                <div className="w-48 bg-slate-950/30 border-r border-slate-700 flex flex-col p-2 gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-lg shadow-violet-500/5' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main View */}
                <div className="flex-1 p-6 overflow-auto bg-slate-900/50">
                    {activeTab === 'summary' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg">
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">Audio Actif</div>
                                    <ul className="space-y-2 text-sm text-slate-200">
                                        {snapshot.music && <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span> Music OS actif</li>}
                                        {snapshot.sound && <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Sound OS ({snapshot.sound.activePadIds.length} pads)</li>}
                                        {snapshot.ambient && <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Ambient OS ({snapshot.ambient.activeTracks.filter(t => t.isPlaying).length} pistes)</li>}
                                    </ul>
                                </div>
                                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg">
                                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">Visuels & Web</div>
                                    <ul className="space-y-2 text-sm text-slate-200">
                                        {snapshot.light && <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Light OS (Scène active)</li>}
                                        {snapshot.image && <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Image OS ({Object.keys(snapshot.image.projections).length} projections)</li>}
                                        {snapshot.web && <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span> Web OS ({snapshot.web.links.length} liens)</li>}
                                        {snapshot.combat && <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Combat OS ({snapshot.combat.combatants.length} combattants, Round {snapshot.combat.round})</li>}
                                    </ul>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
                                    <span className="material-symbols-outlined text-3xl text-violet-400">auto_awesome</span>
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">Prêt pour la Restauration</h3>
                                <p className="text-slate-400 max-w-sm text-sm">
                                    Ce snapshot contient l'intégralité de la configuration capturée. 
                                    Sélectionnez un module à gauche pour voir les détails techniques JSON.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'music' && renderJson(snapshot.music)}
                    {activeTab === 'sound' && renderJson(snapshot.sound)}
                    {activeTab === 'ambient' && renderJson(snapshot.ambient)}
                    {activeTab === 'light' && renderJson(snapshot.light)}
                    {activeTab === 'image' && renderJson(snapshot.image)}
                    {activeTab === 'web' && renderJson(snapshot.web)}
                    {activeTab === 'combat' && renderJson(snapshot.combat)}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-800/30 border-t border-slate-700 flex justify-end">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm font-medium"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
};

export default SnapshotVisualizerModal;
