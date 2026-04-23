import React from 'react';
import { useTranslation } from 'react-i18next';

import { 
    X, 
    ExternalLink, 
    Shield, 
    Info, 
    MoveRight, 
    MoveLeft,
    Trash2
} from 'lucide-react';
import { type GraphNode, type GraphLink } from '../../logic/socialNexusUtils';

interface NodeDetailPanelProps {
    selectedNode: GraphNode;
    onClose: () => void;
    resolvedAvatar: string;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    isEditingFaction: boolean;
    setIsEditingFaction: (val: boolean) => void;
    tempFaction: string;
    setTempFaction: (val: string) => void;
    onSaveFaction: () => void;
    onViewFullProfile: () => void;
    activeRelations: GraphLink[];
    onNodeClick: (node: GraphNode) => void;
    onRemoveRelation: (targetId: string, type: string) => void;
    allNodes: GraphNode[];
    renderRelationForm: () => React.ReactNode;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
    selectedNode,
    onClose,
    resolvedAvatar,
    isEditing,
    setIsEditing,
    isEditingFaction,
    setIsEditingFaction,
    tempFaction,
    setTempFaction,
    onSaveFaction,
    onViewFullProfile,
    activeRelations,
    onNodeClick,
    onRemoveRelation,
    allNodes,
    renderRelationForm
}) => {
    const { t } = useTranslation();
    const getRelationColor = (type: string) => {

        switch (type) {
            case 'ally': return '#22c55e';
            case 'hostile': return '#ef4444';
            case 'family': return '#eab308';
            case 'romantic': return '#d946ef';
            case 'mentor': return '#3b82f6';
            case 'rival': return '#f97316';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="absolute top-6 bottom-6 right-6 w-96 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col shadow-2xl animate-fade-in z-50">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
                title={t('modules:session.physics.close')}
            >
                <X size={20} />
            </button>


            <div className="flex items-center gap-4 mb-2">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-neonCyan shadow-glow-cyan/20 bg-app-surface">
                    <img src={resolvedAvatar || selectedNode.avatar} alt={selectedNode.name} className="w-full h-full object-cover" />
                </div>
                <div>
                    <span className="text-neonCyan text-[10px] font-black uppercase tracking-[0.3em] mb-1 block">
                        {selectedNode.type === 'pc' ? t('modules:session.social_graph.node_detail.type_pj') : t('modules:session.social_graph.node_detail.type_npc')}
                    </span>

                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white tracking-tight leading-none">{selectedNode.name}</h2>
                        <button
                            onClick={onViewFullProfile}
                            className="p-1.5 rounded-lg bg-neonCyan/10 text-neonCyan hover:bg-neonCyan hover:text-black transition-all shadow-glow-cyan/10"
                            title={t('modules:session.social_graph.tooltips.view_profile')}
                        >
                            <ExternalLink size={14} />
                        </button>

                    </div>
                    
                    <div className="mt-2">
                        {isEditingFaction ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    autoFocus
                                    type="text"
                                    value={tempFaction}
                                    onChange={(e) => setTempFaction(e.target.value)}
                                    onBlur={onSaveFaction}
                                    onKeyDown={(e) => e.key === 'Enter' && onSaveFaction()}
                                    className="bg-black/40 border border-neonCyan/30 rounded px-2 py-0.5 text-[9px] text-neonCyan uppercase font-black tracking-wider outline-none focus:border-neonCyan"
                                />
                            </div>
                        ) : (
                            <button 
                                onClick={() => {
                                    setTempFaction(selectedNode.faction || '');
                                    setIsEditingFaction(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/20 border border-accent/30 text-accent text-[9px] font-black uppercase tracking-wider hover:bg-accent/30 transition-all font-display"
                            >
                                <Shield size={10} />
                                {selectedNode.faction || t('modules:session.social_graph.node_detail.faction_label')}
                            </button>

                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
                <button 
                    onClick={() => setIsEditing(false)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isEditing ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                    {t('modules:session.social_graph.node_detail.tabs.relations')}
                </button>
                <button 
                    onClick={() => setIsEditing(true)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditing ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                    {t('modules:session.social_graph.node_detail.tabs.edit')}
                </button>

            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {!isEditing ? (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-slate-400">
                            <Info size={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">{t('modules:session.social_graph.node_detail.relations_title')}</h3>
                        </div>

                        <div className="space-y-3">
                            {activeRelations.map((rel, i) => {
                                const sId = typeof rel.source === 'string' ? rel.source : (rel.source as GraphNode).id;
                                const isOutbound = sId === selectedNode.id;
                                const otherId = isOutbound ? (typeof rel.target === 'string' ? rel.target : (rel.target as GraphNode).id) : sId;
                                const otherNode = allNodes.find(n => n.id === otherId);
                                
                                return (
                                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group cursor-pointer" onClick={() => otherNode && onNodeClick(otherNode)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-sm tracking-tight">{otherNode?.name}</span>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {isOutbound ? (
                                                        <>
                                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">{t('modules:session.social_graph.tooltips.reset_layout').split('(')[0]}</span>
                                                            <MoveRight size={10} className="text-neonCyan" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MoveLeft size={10} className="text-accent" />
                                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">{t('modules:session.social_graph.tooltips.reset_layout').split('(')[0]}</span>
                                                        </>
                                                    )}
                                                </div>

                                            </div>
                                            <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border shrink-0" style={{ color: getRelationColor(rel.type), borderColor: `${getRelationColor(rel.type)}44`, backgroundColor: `${getRelationColor(rel.type)}11` }}>
                                                {t(`modules:session.social_graph.legend.${rel.type}`)}
                                            </span>

                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed italic border-l-2 border-white/5 pl-3 py-1">"{rel.description}"</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ) : (
                    <>
                        {renderRelationForm()}
                        
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Trash2 size={14} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">{t('modules:session.social_graph.node_detail.manage_existing')}</h3>
                            </div>
                            <div className="space-y-2">
                                {activeRelations.map((rel, i) => {
                                    const sId = typeof rel.source === 'string' ? rel.source : (rel.source as GraphNode).id;
                                    const isOutbound = sId === selectedNode.id;
                                    const otherId = isOutbound ? (typeof rel.target === 'string' ? rel.target : (rel.target as GraphNode).id) : sId;
                                    const otherNode = allNodes.find(n => n.id === otherId);
                                    return (
                                        <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isOutbound ? 'bg-neonCyan/10 text-neonCyan' : 'bg-accent/10 text-accent'}`}>
                                                    {isOutbound ? <MoveRight size={14} /> : <MoveLeft size={14} />}
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-bold text-white">{otherNode?.name}</div>
                                                    <div className="text-[9px] uppercase tracking-wider opacity-60" style={{ color: getRelationColor(rel.type) }}>{t(`modules:session.social_graph.legend.${rel.type}`)}</div>
                                                </div>

                                            </div>
                                            <button 
                                                onClick={() => isOutbound ? onRemoveRelation(otherId, rel.type) : null}
                                                title={isOutbound ? t('modules:session.social_graph.node_detail.remove_relation_title') : t('modules:session.social_graph.node_detail.incoming_perception')}
                                                disabled={!isOutbound}
                                                className={`p-2 rounded-lg transition-all ${isOutbound ? 'hover:bg-red-500/20 text-slate-500 hover:text-red-400' : 'opacity-20 cursor-not-allowed'}`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NodeDetailPanel;
