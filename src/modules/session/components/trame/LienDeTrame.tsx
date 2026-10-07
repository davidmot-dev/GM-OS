import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { TraitDeTrame } from '../../logic/adapterLeGrapheDeTrame';
import { libelleLisible } from '../../logic/enchainementsDeLaTrame';
import { cheminDuTrajet, milieuDuTrajet, pointDeTrameValide } from '../../logic/trajetsDeTrame';

export const LienDeTrame = React.memo((props: EdgeProps<TraitDeTrame>) => {
    const trajet = props.data?.trajet;
    const courbe = getBezierPath(props);
    const etiquette = trajet ? (trajet.libelle === props.data?.lien.libelle && pointDeTrameValide(trajet.etiquette)
        ? trajet.etiquette : milieuDuTrajet(trajet.points)) : { x: courbe[1], y: courbe[2] };
    const chemin = trajet ? cheminDuTrajet(trajet.points, { x: props.sourceX, y: props.sourceY }, { x: props.targetX, y: props.targetY }) : courbe[0];
    const lien = props.data?.lien;
    return <BaseEdge id={props.id} path={chemin} markerEnd={props.markerEnd} style={props.style}
        interactionWidth={24} label={libelleLisible(lien?.libelle)} labelX={etiquette.x} labelY={etiquette.y}
        labelStyle={{ fill: 'var(--app-text)', fontSize: 11, fontWeight: 600 }}
        labelBgStyle={{ fill: 'var(--app-surface)' }} labelBgPadding={[8, 5]} labelBgBorderRadius={5} />;
});
