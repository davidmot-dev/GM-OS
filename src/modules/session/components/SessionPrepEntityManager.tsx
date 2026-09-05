import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore, type Entity } from '../useSessionOSStore';
import { Plus, X, Search, User, Shield, Skull } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';

interface SessionPrepEntityManagerProps {
    sessionId: string;
}

const SessionPrepEntityManager: React.FC<SessionPrepEntityManagerProps> = ({ sessionId }) => {
    const { t } = useTranslation();
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
                <span className="text-ui-9 text-app-text/60 font-bold uppercase tracking-widest ml-1 mb-1">{t('modules:session.focus.entity_manager.in_session')}</span>
                {activeEntities.length === 0 ? (
                    <div className="p-4 border border-dashed border-app-border rounded-xl text-center">
                        <p className="text-ui-10 text-app-text/40 italic">{t('modules:session.focus.entity_manager.no_entities')}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {activeEntities.map(entity => (
                            <div 
                                key={entity.id} 
                                className="flex items-center gap-3 p-2 bg-app-surface/40 rounded-xl border border-app-border/40 group"
                            >
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-app-bg flex-shrink-0">
                                    <ResolvedImage src={entity.avatar} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="text-xs font-bold text-app-text truncate">{entity.name}</h5>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {getRoleIcon(entity.role)}
                                        <span className="text-ui-9 text-app-text/60 uppercase font-mono tracking-tighter">{entity.description}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeEntityFromSession(sessionId, entity.id)}
                                    className="p-1.5 text-app-text/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selection Area */}
            <div className="flex flex-col gap-3 pt-4 border-t border-app-border/40">
                <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-lg px-3 py-2">
                    <Search size={14} className="text-app-text/40" />
                    <input 
                        type="text" 
                        placeholder={t('modules:session.focus.entity_manager.search_placeholder')} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-ui-11 text-app-text p-0 focus:ring-0 w-full placeholder:text-app-text/40"
                    />
                </div>

                <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
                    {availableEntities.map(entity => (
                        <button 
                            key={entity.id}
                            onClick={() => addEntityToSession(sessionId, entity.id)}
                            className="flex items-center gap-3 p-2 hover:bg-app-surface/60 rounded-xl transition-all border border-transparent hover:border-app-border group w-full text-left"
                        >
                            <div className="w-8 h-8 rounded bg-app-surface overflow-hidden border border-app-bg flex-shrink-0">
                                <ResolvedImage src={entity.avatar} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-ui-11 font-bold text-app-text/60 group-hover:text-app-text transition-colors truncate">{entity.name}</p>
                                <p className="text-ui-8 text-app-text/50 uppercase font-bold tracking-tighter">{entity.type}</p>
                            </div>
                            <Plus size={14} className="text-app-text/40 group-hover:text-accent transition-colors ml-auto mr-1" />
                        </button>
                    ))}
                    {availableEntities.length === 0 && (
                        <p className="text-ui-9 text-app-text/50 italic text-center py-2">{t('modules:session.focus.entity_manager.all_linked')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionPrepEntityManager;
