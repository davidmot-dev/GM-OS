import React from 'react';
import {
    ReactFlow, Background, Controls, ViewportPortal, applyNodeChanges, ConnectionMode,
    type ReactFlowInstance, type NodeChange, type Connection, type OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './grapheDeTrame.css';
import { CarteDeTrame } from './CarteDeTrame';
import { LienDeTrame } from './LienDeTrame';
import type { CarteDeTrame as Carte, TraitDeTrame } from '../../logic/adapterLeGrapheDeTrame';
import type { Position } from '../../logic/rangementDeLaTrame';
import { usePerformanceControl } from '../../../../hooks/usePerformanceControl';
import { coteDeLAccroche } from '../../logic/stylesDesLiensDeTrame';
import type { OrganisationDeTrame } from '../../../../types/campaign.types';

const TYPES_DE_NOEUDS = { trame: CarteDeTrame };
const TYPES_DE_LIENS = { trame: LienDeTrame };
export interface ToileDeTrameExposee {
    positions: () => Record<string, Position>;
    cadrer: () => void;
}
interface Props {
    noeuds: Carte[]; liens: TraitDeTrame[]; liaison: boolean; fige: boolean; cadrage: number;
    groupes?: OrganisationDeTrame['groupes']; apercuOrganisation?: boolean;
    onChoisir: (id: string | null, ajouter?: boolean) => void;
    onSelectionner: (ids: string[]) => void;
    onDeplacer: (id: string, position: Position, depot: boolean) => void;
    onDeplacerPlusieurs: (positions: Record<string, Position>) => void;
    onRelier: (source: string, cible: string) => void;
    onChoisirLien: (lien: TraitDeTrame) => void;
    onJonction: (lien: TraitDeTrame, connexion: Connection) => void;
}

/** Le moteur ne conserve que l'affichage : aucune écriture par mouvement de souris. */
export const ToileDeLaTrame = React.forwardRef<ToileDeTrameExposee, Props>((props, ref) => {
    const [noeuds, setNoeuds] = React.useState(props.noeuds);
    const [zoom, setZoom] = React.useState(1);
    const moteur = React.useRef<ReactFlowInstance<Carte, TraitDeTrame> | null>(null);
    const cadreDeToile = React.useRef<HTMLDivElement>(null);
    const reconnexion = React.useRef<TraitDeTrame | null>(null);
    const { isLowGraphics } = usePerformanceControl();
    const reduit = isLowGraphics || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cadrer = React.useCallback(() => {
        const instance = moteur.current;
        if (!instance) return;
        void instance.fitView({ padding: 0.15, duration: reduit ? 0 : 160, maxZoom: 1 }).then(() => {
            const cadre = cadreDeToile.current, cartes = instance.getNodes();
            if (!cadre || moteur.current !== instance || !cartes.length) return;
            // 07/10/2026 : une grille après redimensionnement débordait du cadrage
            // natif. Repartir des rectangles déclarés et de la toile réellement disponible.
            const gauche = Math.min(...cartes.map(n => n.position.x - (n.width ?? 0) / 2));
            const droite = Math.max(...cartes.map(n => n.position.x + (n.width ?? 0) / 2));
            const haut = Math.min(...cartes.map(n => n.position.y - (n.height ?? 0) / 2));
            const bas = Math.max(...cartes.map(n => n.position.y + (n.height ?? 0) / 2));
            const largeur = cadre.clientWidth, hauteur = cadre.clientHeight;
            const echelle = Math.max(0.05, Math.min(1, (largeur - 40) / Math.max(1, droite - gauche), (hauteur - 40) / Math.max(1, bas - haut)));
            void instance.setViewport({ x: largeur / 2 - (gauche + droite) / 2 * echelle,
                y: hauteur / 2 - (haut + bas) / 2 * echelle, zoom: echelle });
        });
    }, [reduit]);
    React.useImperativeHandle(ref, () => ({
        positions: () => Object.fromEntries((moteur.current?.getNodes() ?? []).map(n => [n.id, { ...n.position }])), cadrer,
    }), [cadrer]);
    React.useEffect(() => { setNoeuds(props.noeuds); }, [props.noeuds]);
    React.useEffect(() => {
        const image = requestAnimationFrame(cadrer);
        return () => cancelAnimationFrame(image);
    }, [props.cadrage, cadrer]);
    const onNodesChange = React.useCallback((changements: NodeChange<Carte>[]) => {
        setNoeuds(avant => applyNodeChanges(changements.filter(c => c.type !== 'remove'), avant));
    }, []);
    const onConnect = (connexion: Connection) => {
        if (props.liaison && connexion.source && connexion.target) props.onRelier(connexion.source, connexion.target);
    };
    const { onSelectionner, liaison, apercuOrganisation } = props;
    const onSelectionChange = React.useCallback(({ nodes }: OnSelectionChangeParams<Carte, TraitDeTrame>) => {
        if (!liaison && !apercuOrganisation) onSelectionner(nodes.map(n => n.id));
    }, [onSelectionner, liaison, apercuOrganisation]);
    const terminerDeplacement = (cartes: Carte[], depot: boolean) => {
        if (cartes.length > 1) props.onDeplacerPlusieurs(Object.fromEntries(cartes.map(n => [n.id, { ...n.position }])));
        else if (cartes.length) props.onDeplacer(cartes[0].id, cartes[0].position, depot);
    };
    const choisirUneJonction = (cible: HTMLElement | SVGElement) => {
        if (props.liaison || props.apercuOrganisation || reconnexion.current) return false;
        const accroche = cible.closest<HTMLElement>('.react-flow__handle');
        const id = accroche?.getAttribute('data-nodeid'), cote = accroche?.getAttribute('data-handleid');
        const lien = props.liens.find(l => l.selected && (l.source === id || l.target === id));
        if (!lien || !coteDeLAccroche(cote)) return false;
        props.onJonction(lien, { source: lien.source, target: lien.target,
            sourceHandle: lien.source === id ? cote! : lien.sourceHandle ?? null,
            targetHandle: lien.target === id ? cote! : lien.targetHandle ?? null });
        return true;
    };
    return <div ref={cadreDeToile} className="toile-de-trame" data-liaison={props.liaison || undefined}
        style={{ '--zoom-de-trame': zoom } as React.CSSProperties}
        data-organisation={props.apercuOrganisation ? 'apercu' : props.groupes?.length ? 'appliquee' : undefined}
        data-graphismes-legers={isLowGraphics || undefined}
        onClickCapture={e => {
            if (choisirUneJonction(e.target as HTMLElement)) { e.preventDefault(); e.stopPropagation(); }
        }}
        onKeyDownCapture={e => {
            if (props.apercuOrganisation) return;
            const cible = e.target as HTMLElement;
            if (cible.closest('.react-flow__handle')) {
                if (((e.key === 'Enter' || e.key === ' ') && choisirUneJonction(cible))
                    || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault(); e.stopPropagation();
                }
                return;
            }
            if (e.key !== 'Enter' || cible.matches('input, textarea, select, button')) return;
            const id = cible.closest('.react-flow__node')?.getAttribute('data-id');
            if (id) { e.preventDefault(); e.stopPropagation(); props.onChoisir(id, e.ctrlKey); }
            const lienId = cible.closest('.react-flow__edge')?.getAttribute('data-id');
            const lien = props.liens.find(l => l.id === lienId);
            if (lien) { e.preventDefault(); e.stopPropagation(); props.onChoisirLien(lien); }
        }}
        onKeyUp={e => {
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || props.fige || props.liaison || props.apercuOrganisation) return;
            const cible = e.target as HTMLElement;
            if (cible.matches('input, textarea, select') || cible.closest('.react-flow__handle')) return;
            const id = cible.closest('.react-flow__node')?.getAttribute('data-id');
            const selection = moteur.current?.getNodes().filter(n => n.selected) ?? [];
            if (selection.some(n => n.id === id)) terminerDeplacement(selection, false);
        }}>
        <ReactFlow<Carte, TraitDeTrame> nodes={noeuds} edges={props.liens}
            nodeTypes={TYPES_DE_NOEUDS} edgeTypes={TYPES_DE_LIENS} nodeOrigin={[0.5, 0.5]}
            onInit={instance => { moteur.current = instance; setZoom(instance.getZoom()); }} onNodesChange={onNodesChange}
            onMove={(_, viewport) => setZoom(viewport.zoom)}
            fitView fitViewOptions={{ padding: 0.15, maxZoom: 1 }} minZoom={0.05} maxZoom={2.5}
            onNodeClick={(e, n) => { if (!props.apercuOrganisation) props.onChoisir(n.id, e.ctrlKey); }} onPaneClick={() => props.onChoisir(null)}
            onSelectionChange={onSelectionChange}
            onNodeDragStop={(_, _n, cartes) => terminerDeplacement(cartes, true)}
            onEdgeClick={(_, lien) => { if (!props.apercuOrganisation) props.onChoisirLien(lien); }}
            nodesDraggable={!props.fige && !props.liaison && !props.apercuOrganisation} panOnDrag={!props.liaison}
            elevateEdgesOnSelect
            nodesConnectable={props.liaison} connectionMode={ConnectionMode.Loose} onConnect={onConnect}
            // Les rayons sont en coordonnées de graphe : garder une cible de 28 px
            // à l'écran, même quand le meneur dézoome pour lire toute la Trame.
            edgesReconnectable={false} reconnectRadius={14 / zoom} connectionRadius={24 / zoom}
            onReconnectStart={(_, lien) => { reconnexion.current = lien; }}
            onReconnectEnd={() => { reconnexion.current = null; }}
            isValidConnection={connexion => {
                const lien = reconnexion.current;
                return lien ? connexion.source === lien.source && connexion.target === lien.target
                    && !!coteDeLAccroche(connexion.sourceHandle) && !!coteDeLAccroche(connexion.targetHandle) : props.liaison;
            }}
            onReconnect={(lien, connexion) => {
                if (connexion.source === lien.source && connexion.target === lien.target
                    && coteDeLAccroche(connexion.sourceHandle) && coteDeLAccroche(connexion.targetHandle))
                    props.onJonction(lien, connexion);
            }}
            deleteKeyCode={null} selectionKeyCode={props.liaison || props.apercuOrganisation ? null : 'Shift'}
            multiSelectionKeyCode={props.liaison || props.apercuOrganisation ? null : 'Control'}
            ariaLabelConfig={{
                'node.a11yDescription.default': 'Entrée pour choisir une carte, Ctrl pour en sélectionner plusieurs. Flèches pour déplacer la sélection, Échap pour la vider.',
                'node.a11yDescription.keyboardDisabled': 'Entrée pour choisir une carte.',
                'controls.zoomIn.ariaLabel': 'Agrandir', 'controls.zoomOut.ariaLabel': 'Réduire',
                'controls.fitView.ariaLabel': 'Cadrer la trame',
            }}>
            <ViewportPortal>
                <div className="groupes-de-trame" aria-hidden="true">
                    {props.groupes?.map(g => <div className="groupe-de-trame" key={g.id} data-acte={g.id}
                        style={{ left: g.x, top: g.y, width: g.largeur, height: g.hauteur }}><span>{g.nom}</span></div>)}
                </div>
            </ViewportPortal>
            <Background color="var(--app-border)" gap={24} size={1} />
            <Controls showInteractive={false} position="top-left" onFitView={cadrer} fitViewOptions={{ padding: 0.15, maxZoom: 1 }} />
        </ReactFlow>
    </div>;
});
