import React from 'react';
import AtlasLibrary from './AtlasLibrary';
import AtlasMapDetail from './AtlasMapDetail';
import AtlasLinkedEntities from './AtlasLinkedEntities';
import { useSessionOSStore } from '../useSessionOSStore';
import { ArrowLeft } from 'lucide-react';

const WorldAtlas: React.FC = () => {
    const { setCurrentView } = useSessionOSStore();

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Top Navigation Bar for Full Screen Atlas */}
            <div className="h-12 flex-shrink-0 bg-slate-900 border-b border-slate-800 flex items-center px-4">
                <button 
                    onClick={() => setCurrentView('cockpit')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-gm-gold hover:border-gm-gold/50 transition-all font-bold text-[10px] uppercase tracking-widest group"
                >
                    <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                    Retour au Cockpit
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <AtlasLibrary />
                <AtlasMapDetail />
                <AtlasLinkedEntities />
            </div>
        </div>
    );
};

export default WorldAtlas;
