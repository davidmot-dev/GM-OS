import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useSessionOSStore, type EntityRelation } from '../useSessionOSStore';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';



// Logic & Utils
import { prepareSocialGraphData, getUniqueFactions, type GraphNode, type GraphLink } from '../logic/socialNexusUtils';
/*
  **La palette et la physique viennent d'ici, et de nulle part ailleurs.**
  Ce fichier en portait une copie, `NodeDetailPanel` une seconde, et le
  formulaire une troisième liste de types : elles avaient divergé au point
  qu'« Ami » enregistrait `romantic`.
*/
import { couleurDeRelation, distanceDeRelation } from '../logic/relationsSociales';

// Hooks
import { useAvatarResolver } from '../hooks/useAvatarResolver';

// Sub-components
import SocialGraphFilters from './SocialGraph/SocialGraphFilters';
import NodeDetailPanel from './SocialGraph/NodeDetailPanel';
import RelationForm from './SocialGraph/RelationForm';

const SocialGraph: React.FC = () => {
    const { t } = useTranslation();
    const { 
        entities, 
        players, 
        activeCampaignId, 
        setSelectedEntity, 
        setSelectedCharacter, 
        addRelation, 
        removeRelation, 
        updateEntity, 
        updateCharacter,
        isHeaderHidden,
        setHeaderHidden,
        campaigns,
        freezeGraphLayout,
        unfreezeGraphLayout,
        resetGraphLayout,
        navigateToNpcDetail,
        navigateToPlayerDetail
    } = useSessionOSStore();

    const activeCampaign = useMemo(() => 
        campaigns.find(c => c.id === activeCampaignId),
    [campaigns, activeCampaignId]);

    const isGraphLocked = activeCampaign?.isGraphLocked ?? false;

    // UI Local State
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [factionFilter, setFactionFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingFaction, setIsEditingFaction] = useState(false);
    const [tempFaction, setTempFaction] = useState('');
    
    // Ajout des réglages de physique (Charge, Distance, Collision)
    const [graphCharge, setGraphCharge] = useState<number>(-100);
    const [graphDistance, setGraphDistance] = useState<number>(150);
    const [graphCollision, setGraphCollision] = useState<number>(40);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graphRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // --- Dimensionnement Réactif ---
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Initialisation forcée
    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDimensions({ width: rect.width, height: rect.height });
        }
    }, [isHeaderHidden]); // Recalculer quand le header change d'état
    
    // Relation form state
    const [newRelTarget, setNewRelTarget] = useState<string>('');
    const [newRelType, setNewRelType] = useState<string>('ally');
    const [newRelDesc, setNewRelDesc] = useState<string>('');
    /** Le nom propre de la relation en cours de saisie — facultatif. */
    const [newRelLibelle, setNewRelLibelle] = useState<string>('');

    const imgCache = useRef<Record<string, HTMLImageElement>>({});

    // Avatar Resolution with Cache Hook
    const { resolvedAvatars, resolveBatch } = useAvatarResolver();

    // Prepare data for the graph
    const data = useMemo(() => 
        prepareSocialGraphData(entities, players, activeCampaignId, { 
            type: typeFilter, 
            faction: factionFilter, 
            search: searchQuery 
        }, activeCampaign?.nodePositions, isGraphLocked && !isSettingsOpen), 
    [entities, players, activeCampaignId, typeFilter, factionFilter, searchQuery, activeCampaign?.nodePositions, isGraphLocked, isSettingsOpen]);

    const uniqueFactions = useMemo(() => 
        getUniqueFactions(entities, players, activeCampaignId),
    [entities, players, activeCampaignId]);

    // Batch resolve avatars when data changes
    useEffect(() => {
        resolveBatch(data.nodes);
    }, [data.nodes, resolveBatch]);

    // Fallback avatar constant (match useAvatarResolver)
    const FALLBACK_AVATAR = 'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=NPC&backgroundColor=b6e3f4';

    // Graph Engine Initialization & Reactive Force Updates
    useEffect(() => {
        if (graphRef.current && data.nodes.length > 0) {
            const fg = graphRef.current;
            
            // Mise à jour des forces via l'API du composant
            try {
                if (fg.d3Force('charge')) fg.d3Force('charge').strength(graphCharge).distanceMax(1000);
                /*
                  **La distance suit la nature du lien** — l'« influence sur la
                  physique du graphe » du jalon d'avril 2026, qui n'avait jamais
                  existé : la même distance valait pour tout le monde, et la
                  disposition ne disait donc rien que les couleurs ne disaient
                  déjà. Le curseur du meneur reste la référence, la nature ne
                  fait que la moduler.
                */
                if (fg.d3Force('link')) {
                    fg.d3Force('link').distance((lien: GraphLink) =>
                        distanceDeRelation(lien.type, graphDistance));
                }
                fg.d3Force('collide', d3.forceCollide(graphCollision));
                
                const sim = fg.d3Simulation();
                if (sim) {
                    // Si les réglages sont ouverts, on garde la simulation active (alphaTarget > 0)
                    // pour que les changements soient fluides et visibles immédiatement
                    if (isSettingsOpen) {
                        sim.alphaTarget(0.3).restart();
                    } else {
                        sim.alphaTarget(0).alpha(0.5).restart();
                    }
                }
            } catch (e) {
                console.warn('[SocialGraph] Physics update error:', e);
            }
        }
    }, [data.nodes, data.links, graphCharge, graphDistance, graphCollision, isSettingsOpen]);

    const handleToggleLock = useCallback(() => {
        if (!activeCampaignId) return;
        
        if (isGraphLocked) {
            unfreezeGraphLayout(activeCampaignId);
        } else {
            // Capture current positions
            const currentPositions: Record<string, { x: number; y: number }> = {};
            data.nodes.forEach(node => {
                if (node.x !== undefined && node.y !== undefined) {
                    currentPositions[node.id] = { x: node.x, y: node.y };
                }
            });
            freezeGraphLayout(activeCampaignId, currentPositions);
        }
    }, [activeCampaignId, isGraphLocked, data.nodes, freezeGraphLayout, unfreezeGraphLayout]);

    const handleResetLayout = useCallback(() => {
        if (!activeCampaignId) return;
        resetGraphLayout(activeCampaignId);
        
        // Petit délai pour laisser le store se mettre à jour avant de tenter le rafraîchissement
        setTimeout(() => {
            const fg = graphRef.current;
            if (!fg) return;
            
            const sim = typeof fg.d3Simulation === 'function' ? fg.d3Simulation() : null;
            if (sim) {
                sim.nodes().forEach((node: any) => {
                    node.fx = null;
                    node.fy = null;
                });
                sim.alpha(0.5).restart();
            }
        }, 150);
    }, [activeCampaignId, resetGraphLayout]);

    const handleSaveFaction = useCallback(() => {
        const node = data.nodes.find(n => n.id === selectedNodeId);
        if (!node) return;
        if (node.type === 'pc') {
            const player = players.find(p => p.characters.some(c => c.id === node.id));
            if (player) updateCharacter(player.id, node.id, { faction: tempFaction });
        } else {
            updateEntity(node.id, { faction: tempFaction });
        }
        setIsEditingFaction(false);
    }, [selectedNodeId, data.nodes, players, tempFaction, updateCharacter, updateEntity]);

    const [, setForceUpdate] = useState(0);

    const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const size = node.type === 'pc' ? 24 : 20;
        const fontSize = 12 / globalScale;
        const nx = node.x || 0;
        const ny = node.y || 0;
        
        // Glow / Background
        ctx.beginPath();
        ctx.arc(nx, ny, size, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.id === selectedNodeId ? 'rgba(0, 255, 194, 0.2)' : 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        
        // Border
        ctx.strokeStyle = node.type === 'pc' ? '#00e1ab' : '#94a3b8';
        ctx.lineWidth = 2 / globalScale;
        if (node.type === 'npc') ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        const label = node.name;
        ctx.font = `${fontSize}px "Space Grotesk", sans-serif`;
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.8, globalScale / 2)})`;
        ctx.fillRect(nx - textWidth / 2 - 4, ny + size + 4, textWidth + 8, fontSize + 4);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = node.id === selectedNodeId ? '#00e1ab' : '#ffffff';
        ctx.fillText(label, nx, ny + size + 6);

        // Avatar Rendering
        const resolvedAvatar = resolvedAvatars[node.id];
        if (resolvedAvatar) {
            if (!imgCache.current[resolvedAvatar]) {
                const img = new Image();
                img.src = resolvedAvatar;
                img.onload = () => { 
                    imgCache.current[resolvedAvatar] = img;
                    setForceUpdate(v => v + 1);
                };
                img.onerror = () => {
                    // Fallback if image fails to load
                    imgCache.current[resolvedAvatar] = new Image();
                    imgCache.current[resolvedAvatar].src = FALLBACK_AVATAR;
                    imgCache.current[resolvedAvatar].onload = () => setForceUpdate(v => v + 1);
                };
            } else {
                const img = imgCache.current[resolvedAvatar];
                if (img.complete && img.naturalWidth !== 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(nx, ny, size - 1, 0, 2 * Math.PI, false);
                    ctx.clip();
                    ctx.drawImage(img, nx - size, ny - size, size * 2, size * 2);
                    ctx.restore();
                }
            }
        }
    }, [selectedNodeId, resolvedAvatars, FALLBACK_AVATAR]);

    const handleNodeClick = useCallback((node: GraphNode) => {
        setSelectedNodeId(node.id);
        if (node.type === 'npc') setSelectedEntity(node.id);
        else setSelectedCharacter(node.id);
        
        if (node.x !== undefined && node.y !== undefined && graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 400);
            graphRef.current.zoom(2.5, 400);
        }
    }, [setSelectedEntity, setSelectedCharacter]);

    const handleAddRelation = useCallback(() => {
        const node = data.nodes.find(n => n.id === selectedNodeId);
        if (!node || !newRelTarget) return;
        addRelation(node.id, node.type, {
            targetId: newRelTarget,
            targetType: 'npc',
            type: newRelType as EntityRelation['type'],
            // Vide veut dire « pas de nom propre », et non « nom vide » : on ne
            // pose pas la clé plutôt que d'en écrire une chaîne blanche, qui
            // masquerait ensuite le libellé de la nature.
            ...(newRelLibelle.trim() ? { libelle: newRelLibelle.trim() } : {}),
            description: newRelDesc || t('modules:session.social_graph.relation_form.desc_placeholder')
        });

        setNewRelTarget('');
        setNewRelDesc('');
        setNewRelLibelle('');
    }, [selectedNodeId, data.nodes, newRelTarget, newRelType, newRelDesc, newRelLibelle, addRelation, t]);


    const handleRemoveRelation = useCallback((targetId: string) => {
        const node = data.nodes.find(n => n.id === selectedNodeId);
        if (!node) return;
        removeRelation(node.id, node.type, targetId);
    }, [selectedNodeId, data.nodes, removeRelation]);

    const potentialTargets = useMemo(() => {
        const allPotential = [
            ...players.flatMap(p => p.characters.filter(c => c.campaignId === activeCampaignId)),
            ...entities.filter(e => e.campaignId === activeCampaignId)
        ];
        return allPotential.filter(n => n.id !== selectedNodeId);
    }, [entities, players, activeCampaignId, selectedNodeId]);

    const selectedNode = data.nodes.find(n => n.id === selectedNodeId);

    return (
        <div className="relative w-full h-full overflow-hidden flex flex-col font-display transition-all duration-700">
            <SocialGraphFilters 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                factionFilter={factionFilter}
                setFactionFilter={setFactionFilter}
                uniqueFactions={uniqueFactions}
                onZoomIn={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.2, 400)}
                onZoomOut={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.2, 400)}
                onZoomReset={() => graphRef.current?.zoomToFit(400, 100)}
                isHeaderHidden={isHeaderHidden}
                onToggleHeader={() => setHeaderHidden(!isHeaderHidden)}
                isLocked={isGraphLocked}
                onToggleLock={handleToggleLock}
                onResetLayout={handleResetLayout}
                
                // Nouveaux réglages de physique
                physicsSettings={{
                    charge: graphCharge,
                    distance: graphDistance,
                    collision: graphCollision
                }}
                setPhysicsSettings={{
                    setCharge: setGraphCharge,
                    setDistance: setGraphDistance,
                    setCollision: setGraphCollision
                }}
                isSettingsOpen={isSettingsOpen}
                setIsSettingsOpen={setIsSettingsOpen}
            />

            <div ref={containerRef} className="flex-1 relative">
                {dimensions.width > 0 && (
                    <ForceGraph2D
                        ref={graphRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={data}
                        backgroundColor="transparent"
                        nodeCanvasObject={paintNode}
                        nodePointerAreaPaint={(node: GraphNode, color, canvasContext) => {
                            canvasContext.fillStyle = color;
                            const size = 20 * 1.5;
                            canvasContext.beginPath();
                            canvasContext.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI, false);
                            canvasContext.fill();
                        }}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleSpeed={() => 0.005}
                        linkDirectionalParticleWidth={2}
                        linkDirectionalParticleColor={(link: GraphLink) => couleurDeRelation(link.type)}
                        linkDirectionalArrowLength={3.5}
                        linkDirectionalArrowRelPos={1}
                        linkCurvature={0.25}
                        linkColor={(link: GraphLink) => `${couleurDeRelation(link.type)}66`}
                        linkWidth={2}
                        onNodeClick={handleNodeClick}
                        onBackgroundClick={() => setSelectedNodeId(null)}
                        cooldownTicks={(isGraphLocked && !isSettingsOpen) ? 0 : 200}
                        d3VelocityDecay={(isGraphLocked && !isSettingsOpen) ? 1 : 0.1}
                        d3AlphaDecay={isSettingsOpen ? 0.01 : 0.02}
                        enableNodeDrag={!isGraphLocked}
                    />
                )}
            </div>

            {selectedNode && (
                <NodeDetailPanel 
                    selectedNode={selectedNode}
                    onClose={() => setSelectedNodeId(null)}
                    resolvedAvatar={resolvedAvatars[selectedNode.id]}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isEditingFaction={isEditingFaction}
                    setIsEditingFaction={setIsEditingFaction}
                    tempFaction={tempFaction}
                    setTempFaction={setTempFaction}
                    onSaveFaction={handleSaveFaction}
                    onViewFullProfile={() => {
                        if (selectedNode.type === 'npc') {
                            navigateToNpcDetail(selectedNode.id);
                        } else {
                            const player = players.find(p => p.characters.some(c => c.id === selectedNode.id));
                            if (player) {
                                navigateToPlayerDetail(player.id, selectedNode.id);
                            }
                        }
                    }}
                    activeRelations={data.links.filter(l => 
                        (typeof l.source === 'string' ? l.source : (l.source as GraphNode).id) === selectedNodeId || 
                        (typeof l.target === 'string' ? l.target : (l.target as GraphNode).id) === selectedNodeId
                    )}
                    onNodeClick={handleNodeClick}
                    onRemoveRelation={handleRemoveRelation}
                    allNodes={data.nodes}
                    renderRelationForm={() => (
                        <RelationForm 
                            newRelTarget={newRelTarget}
                            setNewRelTarget={setNewRelTarget}
                            newRelType={newRelType}
                            setNewRelType={setNewRelType}
                            newRelDesc={newRelDesc}
                            setNewRelDesc={setNewRelDesc}
                            newRelLibelle={newRelLibelle}
                            setNewRelLibelle={setNewRelLibelle}
                            potentialTargets={potentialTargets}
                            onAddRelation={handleAddRelation}
                        />
                    )}
                />
            )}

            {!selectedNodeId && (
                <div className="absolute bottom-10 left-10 p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl z-10">
                    <div className="flex items-center gap-3 text-slate-400 mb-4">
                        <Users size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('modules:session.social_graph.legend_title')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {[
                            { label: t('modules:session.social_graph.legend.family'), color: '#eab308' },
                            { label: t('modules:session.social_graph.legend.ally'), color: '#22c55e' },
                            { label: t('modules:session.social_graph.legend.hostile'), color: '#ef4444' },
                            { label: t('modules:session.social_graph.legend.friend'), color: '#d946ef' },
                            { label: t('modules:session.social_graph.legend.neutral'), color: '#3b82f6' },
                            { label: t('modules:session.social_graph.legend.rival'), color: '#f97316' }
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shadow-glow" style={{ backgroundColor: item.color }} />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{item.label}</span>
                            </div>
                        ))}

                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialGraph;
