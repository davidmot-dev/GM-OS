import React from 'react';
import { BaseEdge, getBezierPath, useReactFlow, useViewport, type EdgeProps } from '@xyflow/react';
import type { TraitDeTrame } from '../../logic/adapterLeGrapheDeTrame';
import { libelleLisible } from '../../logic/enchainementsDeLaTrame';
import { ajouterUnPointDePassage, cheminDuTrajet, milieuDuTrajet, pointDeTrameValide } from '../../logic/trajetsDeTrame';
import { POINTS_DE_PASSAGE_MAXIMUM } from '../../logic/stylesDesLiensDeTrame';

export const LienDeTrame = React.memo((props: EdgeProps<TraitDeTrame>) => {
    const trajet = props.data?.trajet;
    const manuel = props.data?.pointsDePassage;
    const modifier = props.selected ? props.data?.onModifierPoints : undefined;
    const { screenToFlowPosition } = useReactFlow();
    const { zoom } = useViewport();
    const glissement = React.useRef<{ id: number; index: number; origine: { x: number; y: number };
        points: NonNullable<typeof manuel> } | null>(null);
    const depart = { x: props.sourceX, y: props.sourceY }, arrivee = { x: props.targetX, y: props.targetY };
    const points = [depart, ...(manuel ?? trajet?.points.slice(1, -1) ?? []), arrivee];
    const courbe = getBezierPath(props);
    const etiquette = manuel ? milieuDuTrajet(points) : trajet ? (trajet.libelle === props.data?.lien.libelle && pointDeTrameValide(trajet.etiquette)
        ? trajet.etiquette : milieuDuTrajet(trajet.points)) : { x: courbe[1], y: courbe[2] };
    const chemin = manuel ? cheminDuTrajet(points, depart, arrivee) : trajet ? cheminDuTrajet(trajet.points, depart, arrivee) : courbe[0];
    const lien = props.data?.lien;
    const texte = [libelleLisible(lien?.libelle), props.data?.commentaire].filter(Boolean).join(' · ');
    const retirer = (index: number) => modifier?.(manuel?.filter((_, i) => i !== index));
    return <g onDoubleClick={e => {
        if (!modifier || points.length - 2 >= POINTS_DE_PASSAGE_MAXIMUM) return;
        e.preventDefault(); e.stopPropagation();
        modifier(ajouterUnPointDePassage(points, screenToFlowPosition({ x: e.clientX, y: e.clientY })));
    }}><title>{texte}</title><BaseEdge id={props.id} path={chemin} markerEnd={props.markerEnd} style={props.style}
        className="ajout-point-de-passage"
        interactionWidth={24} label={texte.length > 90 ? texte.slice(0, 87) + '…' : texte} labelX={etiquette.x} labelY={etiquette.y}
        labelStyle={{ fill: 'var(--app-text)', fontSize: 11, fontWeight: 600 }}
        labelBgStyle={{ fill: 'var(--app-surface)' }} labelBgPadding={[8, 5]} labelBgBorderRadius={5} />
        {modifier && manuel?.map((point, index) => <circle key={index} className="point-de-passage nodrag nopan"
            cx={point.x} cy={point.y} r={14 / zoom} role="button" tabIndex={0} aria-label={`Point de passage ${index + 1}`}
            onClick={e => e.stopPropagation()}
            onDoubleClick={e => { e.preventDefault(); e.stopPropagation(); retirer(index); }}
            onPointerDown={e => {
                if (e.button !== 0) return;
                e.preventDefault(); e.stopPropagation(); e.currentTarget.focus();
                glissement.current = { id: e.pointerId, index, points: manuel,
                    origine: screenToFlowPosition({ x: e.clientX, y: e.clientY }, { snapToGrid: false }) };
                e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={e => {
                const geste = glissement.current;
                if (!geste || geste.id !== e.pointerId || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
                e.preventDefault(); e.stopPropagation();
                const position = screenToFlowPosition({ x: e.clientX, y: e.clientY }, { snapToGrid: false });
                // Partir du point saisi, pas du centre du curseur : une prise au bord
                // ne fait pas sauter le point, et le zoom ne bride pas le déplacement.
                modifier(geste.points.map((p, i) => i === geste.index
                    ? { x: p.x + position.x - geste.origine.x, y: p.y + position.y - geste.origine.y } : p));
            }}
            onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) { e.stopPropagation(); e.currentTarget.releasePointerCapture(e.pointerId); } glissement.current = null; }}
            onLostPointerCapture={() => { glissement.current = null; }}
            onKeyDown={e => {
                if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); retirer(index); }
                const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[e.key];
                if (delta) { e.preventDefault(); e.stopPropagation(); modifier(manuel.map((p, i) => i === index ? { x: p.x + delta[0], y: p.y + delta[1] } : p)); }
            }}><title>Glisser pour déplacer ; double-clic ou Suppr pour retirer</title></circle>)}
    </g>;
});
