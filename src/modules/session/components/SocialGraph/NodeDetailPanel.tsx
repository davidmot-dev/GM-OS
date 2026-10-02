import React from 'react';
import { couleurDeRelation, libelleDeRelation } from '../../logic/relationsSociales';
import { useTranslation } from 'react-i18next';

import { 
    X, 
    ExternalLink, 
    Shield, 
    Users,
    MoveRight, 
    MoveLeft,
    Trash2,
    PinOff
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
    /** Ce nœud a-t-il été posé à la main ? */
    estEpingle?: boolean;
    /** Le rendre à la simulation. */
    onDetacher?: () => void;
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
    renderRelationForm,
    estEpingle,
    onDetacher
}) => {
    const { t } = useTranslation();
    /*
      **La palette vivait ici en double**, recopiée depuis `SocialGraph`. Elles
      avaient divergé de la liste du formulaire au point qu'« Ami » enregistrait
      `romantic` — voir `logic/relationsSociales.ts`, désormais seule écriture.
    */
    const getRelationColor = couleurDeRelation;

    /*
      **Les relations se rangent par sens** — refonte, L5, étape 2. Ce que le
      nœud déclare (sortantes, modifiables ici) et ce que les autres déclarent
      de lui (la perception entrante, qui se modifie depuis leur nœud). La
      ligne de sens affichait un morceau du libellé « Réinitialiser la
      disposition » coupé à la parenthèse, en guise de « sortante ».
    */
    const autreBout = (rel: GraphLink) => {
        const sId = typeof rel.source === 'string' ? rel.source : (rel.source as GraphNode).id;
        const sortante = sId === selectedNode.id;
        const autreId = sortante ? (typeof rel.target === 'string' ? rel.target : (rel.target as GraphNode).id) : sId;
        return { sortante, autreId, autre: allNodes.find(n => n.id === autreId) };
    };
    const sortantes = activeRelations.filter(rel => autreBout(rel).sortante);
    const entrantes = activeRelations.filter(rel => !autreBout(rel).sortante);
    const portrait = resolvedAvatar || selectedNode.avatar;

    const carteDeRelation = (rel: GraphLink, i: number) => {
        const { autre } = autreBout(rel);
        const couleur = getRelationColor(rel.type);
        return (
            <button
                key={i}
                type="button"
                className="w-full rounded-lg border border-app-border bg-app-bg/40 p-3 text-left transition-all hover:border-accent/40"
                onClick={() => autre && onNodeClick(autre)}
            >
                <div className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: couleur }} />
                        <span className="truncate text-sm font-bold text-app-text">{autre?.name}</span>
                    </span>
                    <span className="shrink-0 rounded border px-2 py-0.5 text-ui-9 font-black uppercase" style={{ color: couleur, borderColor: `${couleur}66`, backgroundColor: `${couleur}1a` }}>
                        {libelleDeRelation(rel, t)}
                    </span>
                </div>
                {rel.description && <p className="mt-1.5 pl-4 text-xs leading-relaxed text-app-muted">{rel.description}</p>}
            </button>
        );
    };

    const titreDeSection = (icone: React.ReactNode, titre: string, nombre: number) => (
        <div className="mb-2 flex items-center gap-2 text-app-muted">
            {icone}
            <h3 className="text-ui-10 font-black uppercase tracking-widest">{titre}</h3>
            <span className="ml-auto text-ui-10 font-black text-app-subtle">{nombre}</span>
        </div>
    );

    return (
        <aside className="flex h-full w-96 shrink-0 flex-col overflow-hidden border-l border-app-border bg-app-surface animate-fade-in">
            {/* L'identité du nœud : son nom, son portrait, sa faction */}
            <div className="relative h-56 shrink-0 overflow-hidden bg-app-surface-2">
                {portrait ? (
                    <img src={portrait} alt={selectedNode.name} className="absolute inset-0 h-full w-full object-cover object-top" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-app-subtle"><Users size={64} strokeWidth={1} /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-app-surface via-app-surface/40 to-transparent" />

                <div className="absolute top-3 right-3 flex gap-1.5">
                    {/*
                      **Détacher se fait là où l'on regarde le nœud.** L'épingle se pose
                      d'un geste — on lâche le nœud — donc elle doit se retirer d'un
                      geste : *un réglage qui ne se défait que dans un menu n'est pas un
                      geste, c'est un piège.*
                    */}
                    {estEpingle && onDetacher && (
                        <button
                            onClick={onDetacher}
                            className="rounded-lg border border-etat-alerte/40 bg-app-bg/70 p-2 text-etat-alerte transition-all hover:bg-etat-alerte/20"
                            title="Détacher ce nœud : la simulation le reprend"
                        >
                            <PinOff size={16} />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-app-border bg-app-bg/70 p-2 text-app-muted transition-all hover:text-app-text"
                        title={t('modules:session.social_graph.physics.close')}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="block text-ui-10 font-black uppercase tracking-[0.2em] text-accent">
                        {selectedNode.type === 'pc' ? t('modules:session.social_graph.node_detail.type_pj') : t('modules:session.social_graph.node_detail.type_npc')}
                    </span>
                    <div className="flex items-center gap-2">
                        <h2 className="truncate font-display text-xl font-bold leading-tight text-app-text">{selectedNode.name}</h2>
                        <button
                            onClick={onViewFullProfile}
                            className="shrink-0 rounded-lg bg-accent/15 p-1.5 text-accent transition-all hover:bg-accent hover:text-app-on-accent"
                            title={t('modules:session.social_graph.tooltips.view_profile')}
                        >
                            <ExternalLink size={14} />
                        </button>
                    </div>
                    <div className="mt-2">
                        {isEditingFaction ? (
                            <input
                                autoFocus
                                type="text"
                                value={tempFaction}
                                onChange={(e) => setTempFaction(e.target.value)}
                                onBlur={onSaveFaction}
                                onKeyDown={(e) => e.key === 'Enter' && onSaveFaction()}
                                className="w-full rounded border border-accent/40 bg-app-bg/80 px-2 py-1 text-ui-10 font-black uppercase tracking-wider text-accent outline-none focus:border-accent"
                                title={t('modules:session.social_graph.node_detail.edit_faction')}
                            />
                        ) : (
                            <button
                                onClick={() => {
                                    setTempFaction(selectedNode.faction || '');
                                    setIsEditingFaction(true);
                                }}
                                className="inline-flex items-center gap-1.5 rounded border border-accent/30 bg-app-bg/70 px-2 py-1 font-display text-ui-10 font-black uppercase tracking-wider text-accent transition-all hover:bg-accent/20"
                                title={t('modules:session.social_graph.node_detail.edit_faction')}
                            >
                                <Shield size={11} />
                                {selectedNode.faction || t('modules:session.social_graph.node_detail.faction_label')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div role="tablist" className="flex shrink-0 border-b border-app-border">
                {[false, true].map(edition => (
                    <button
                        key={String(edition)}
                        role="tab"
                        aria-selected={isEditing === edition}
                        onClick={() => setIsEditing(edition)}
                        className={`flex-1 border-b-2 py-3 text-ui-10 font-black uppercase tracking-widest transition-all ${
                            isEditing === edition ? 'border-accent text-accent' : 'border-transparent text-app-muted hover:text-app-text'
                        }`}
                    >
                        {t(`modules:session.social_graph.node_detail.tabs.${edition ? 'edit' : 'relations'}`)}
                    </button>
                ))}
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4 custom-scrollbar">
                {!isEditing ? (
                    <>
                        <section>
                            {titreDeSection(<MoveRight size={14} />, t('modules:session.social_graph.node_detail.relations_title'), sortantes.length)}
                            <div className="space-y-2">
                                {sortantes.map(carteDeRelation)}
                                {sortantes.length === 0 && <p className="text-xs italic text-app-subtle">{t('modules:session.social_graph.node_detail.no_relations')}</p>}
                            </div>
                        </section>
                        <section>
                            {titreDeSection(<MoveLeft size={14} />, t('modules:session.social_graph.node_detail.perception_entrante'), entrantes.length)}
                            <div className="space-y-2">
                                {entrantes.map(carteDeRelation)}
                                {entrantes.length === 0 && <p className="text-xs italic text-app-subtle">{t('modules:session.social_graph.node_detail.aucune_perception')}</p>}
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        {renderRelationForm()}

                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2 text-app-muted">
                                <Trash2 size={14} />
                                <h3 className="text-ui-10 font-black uppercase tracking-widest">{t('modules:session.social_graph.node_detail.manage_existing')}</h3>
                            </div>
                            <div className="space-y-2">
                                {activeRelations.map((rel, i) => {
                                    const { sortante: isOutbound, autreId: otherId, autre: otherNode } = autreBout(rel);
                                    return (
                                        <div key={i} className="p-3 bg-app-bg/40 border border-app-border rounded-lg flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isOutbound ? 'bg-gm-cyan/10 text-gm-cyan' : 'bg-accent/10 text-accent'}`}>
                                                    {isOutbound ? <MoveRight size={14} /> : <MoveLeft size={14} />}
                                                </div>
                                                <div>
                                                    <div className="text-ui-11 font-bold text-app-text">{otherNode?.name}</div>
                                                    <div className="text-ui-9 uppercase tracking-wider" style={{ color: getRelationColor(rel.type) }}>{libelleDeRelation(rel, t)}</div>
                                                </div>

                                            </div>
                                            <button
                                                onClick={() => isOutbound ? onRemoveRelation(otherId, rel.type) : null}
                                                title={isOutbound ? t('modules:session.social_graph.node_detail.remove_relation_title') : t('modules:session.social_graph.node_detail.incoming_perception')}
                                                disabled={!isOutbound}
                                                className={`p-2 rounded-lg transition-all ${isOutbound ? 'hover:bg-etat-danger/20 text-app-subtle hover:text-etat-danger' : 'opacity-20 cursor-not-allowed'}`}
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
        </aside>
    );
};

export default NodeDetailPanel;
