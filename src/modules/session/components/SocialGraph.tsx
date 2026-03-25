import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useSessionOSStore, type EntityRelation } from '../useSessionOSStore';
import { Users } from 'lucide-react';

// Logic & Utils
import { prepareSocialGraphData, getUniqueFactions, type GraphNode, type GraphLink } from '../logic/socialNexusUtils';

// Hooks
import { useAvatarResolver } from '../hooks/useAvatarResolver';

// Sub-components
import SocialGraphFilters from './SocialGraph/SocialGraphFilters';
import NodeDetailPanel from './SocialGraph/NodeDetailPanel';
import RelationForm from './SocialGraph/RelationForm';

const SocialGraph: React.FC = () => {
    const { 
        entities, 
        players, 
        activeCampaignId, 
        setSelectedEntity, 
        setSelectedCharacter, 
        setCurrentView, 
        addRelation, 
        removeRelation, 
        updateEntity, 
        updateCharacter 
    } = useSessionOSStore();

    // UI Local State
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [factionFilter, setFactionFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingFaction, setIsEditingFaction] = useState(false);
    const [tempFaction, setTempFaction] = useState('');
    
    // Relation form state
    const [newRelTarget, setNewRelTarget] = useState<string>('');
    const [newRelType, setNewRelType] = useState<string>('ally');
    const [newRelDesc, setNewRelDesc] = useState<string>('');

    const graphRef = useRef<any>(null);
    const imgCache = useRef<Record<string, HTMLImageElement>>({});

    // Avatar Resolution with Cache Hook
    const { resolvedAvatars, resolveBatch } = useAvatarResolver();

    // Prepare data for the graph
    const data = useMemo(() => 
        prepareSocialGraphData(entities, players, activeCampaignId, { 
            type: typeFilter, 
            faction: factionFilter, 
            search: searchQuery 
        }), 
    [entities, players, activeCampaignId, typeFilter, factionFilter, searchQuery]);

    const uniqueFactions = useMemo(() => 
        getUniqueFactions(entities, players, activeCampaignId),
    [entities, players, activeCampaignId]);

    // Batch resolve avatars when data changes
    useEffect(() => {
        resolveBatch(data.nodes);
    }, [data.nodes, resolveBatch]);

    // Graph Engine Initialization
    useEffect(() => {
        if (graphRef.current) {
            const fg = graphRef.current;
            fg.d3Force('charge').strength(-200);
            fg.d3Force('link').distance(150);
            if ((window as any).d3) {
                fg.d3Force('collide', (window as any).d3.forceCollide(40));
            }
            fg.d3Force('center').strength(0.05);
        }
    }, []);

    const getRelationColor = useCallback((type: string) => {
        switch (type) {
            case 'ally': return '#22c55e';
            case 'hostile': return '#ef4444';
            case 'family': return '#eab308';
            case 'romantic': return '#d946ef';
            case 'mentor': return '#3b82f6';
            case 'rival': return '#f97316';
            default: return '#94a3b8';
        }
    }, []);

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
                img.onload = () => { imgCache.current[resolvedAvatar] = img; };
            } else {
                const img = imgCache.current[resolvedAvatar];
                ctx.save();
                ctx.beginPath();
                ctx.arc(nx, ny, size - 1, 0, 2 * Math.PI, false);
                ctx.clip();
                ctx.drawImage(img, nx - size, ny - size, size * 2, size * 2);
                ctx.restore();
            }
        }
    }, [selectedNodeId, resolvedAvatars]);

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
            description: newRelDesc || 'Relation manuelle'
        });
        setNewRelTarget('');
        setNewRelDesc('');
    }, [selectedNodeId, data.nodes, newRelTarget, newRelType, newRelDesc, addRelation]);

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
        <div className="relative w-full h-full bg-[#05050a] overflow-hidden flex flex-col font-display">
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
            />

            <div className="flex-1 relative">
                <ForceGraph2D
                    ref={graphRef}
                    graphData={data}
                    backgroundColor="#05050a"
                    nodeCanvasObject={paintNode}
                    nodePointerAreaPaint={(node: GraphNode, color, ctx) => {
                        const size = node.type === 'pc' ? 24 : 20;
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI, false);
                        ctx.fill();
                    }}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleSpeed={() => 0.005}
                    linkDirectionalParticleWidth={2}
                    linkDirectionalParticleColor={(link: GraphLink) => getRelationColor(link.type)}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    linkCurvature={0.2}
                    linkColor={(link: GraphLink) => `${getRelationColor(link.type)}66`}
                    linkWidth={2}
                    onNodeClick={handleNodeClick}
                    cooldownTicks={200}
                />
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
                            setCurrentView('npc-gallery');
                            setSelectedEntity(selectedNode.id);
                        } else {
                            setCurrentView('players');
                            setSelectedCharacter(selectedNode.id);
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
                        <span className="text-[10px] font-black uppercase tracking-widest">Légende des Liens</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {[
                            { label: 'Famille', color: '#eab308' },
                            { label: 'Allié', color: '#22c55e' },
                            { label: 'Ennemi', color: '#ef4444' },
                            { label: 'Romance', color: '#d946ef' },
                            { label: 'Mentor', color: '#3b82f6' },
                            { label: 'Rival', color: '#f97316' }
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
