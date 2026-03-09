import React from 'react';
import { useSessionOSStore, type Entity } from '../useSessionOSStore';
import { Plus, X, Search, User, Shield, Skull } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';

interface SessionPrepEntityManagerProps {
    sessionId: string;
}

const SessionPrepEntityManager: React.FC<SessionPrepEntityManagerProps> = ({ sessionId }) => {
    const { 
        entities, 
        activeCampaignId, 
        sessions, 
        addEntityToSession, 
        removeEntityFromSession 
    } = useSessionOSStore();

    const [searchTerm, setSearchTerm] = React.useState('');

    const currentSession = sessions.find(s => s.id === sessionId);
    if (!currentSession) return null;

    const campaignEntities = entities.filter(e => e.campaignId === activeCampaignId);
    const sessionEntityIds = currentSession.sessionEntityIds || [];
    
    const activeEntities = campaignEntities.filter(e => sessionEntityIds.includes(e.id));
    const availableEntities = campaignEntities.filter(e => 
        !sessionEntityIds.includes(e.id) && 
        (e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getRoleIcon = (role: Entity['role']) => {
        switch (role) {
            case 'ally': return <Shield size={12} className="text-emerald-500" />;
            case 'hostile': return <Skull size={12} className="text-red-500" />;
            case 'boss': return <Skull size={14} className="text-gm-gold" />;
            case 'neutral': return <User size={12} className="text-slate-400" />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Active List */}
            <div className="flex flex-col gap-2">
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest ml-1 mb-1">In Session</span>
                {activeEntities.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center">
                        <p className="text-[10px] text-slate-700 italic">No entities linked yet.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {activeEntities.map(entity => (
                            <div 
                                key={entity.id} 
                                className="flex items-center gap-3 p-2 bg-slate-800/40 rounded-xl border border-slate-700/50 group"
                            >
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-900 flex-shrink-0">
                                    <ResolvedImage src={entity.avatar} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-xs font-bold text-slate-200 truncate">{entity.name}</h5>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {getRoleIcon(entity.role)}
                                        <span className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">{entity.description}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeEntityFromSession(sessionId, entity.id)}
                                    className="p-1.5 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selection Area */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                    <Search size={14} className="text-slate-600" />
                    <input 
                        type="text" 
                        placeholder="Chercher un PNJ ou Monstre..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-[11px] text-slate-400 p-0 focus:ring-0 w-full"
                    />
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
                    {availableEntities.map(entity => (
                        <button 
                            key={entity.id}
                            onClick={() => addEntityToSession(sessionId, entity.id)}
                            className="flex items-center gap-3 p-2 hover:bg-slate-800/60 rounded-xl transition-all border border-transparent hover:border-slate-700 group w-full text-left"
                        >
                            <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden border border-slate-900 flex-shrink-0">
                                <ResolvedImage src={entity.avatar} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-100 transition-colors truncate">{entity.name}</p>
                                <p className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">{entity.type}</p>
                            </div>
                            <Plus size={14} className="text-slate-700 group-hover:text-gm-gold transition-colors ml-auto mr-1" />
                        </button>
                    ))}
                    {availableEntities.length === 0 && (
                        <p className="text-[9px] text-slate-700 italic text-center py-2">All available entities linked.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionPrepEntityManager;
