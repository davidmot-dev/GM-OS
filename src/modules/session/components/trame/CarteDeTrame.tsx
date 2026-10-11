import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { MapPin, Users, Search, Layers, CalendarCheck, Pause, Check, Ban } from 'lucide-react';
import { LIBELLE_DU_TYPE } from '../../logic/grapheDeLaTrame';
import { TEINTE_DE_TRAME, type CarteDeTrame as Carte } from '../../logic/adapterLeGrapheDeTrame';
import { JONCTIONS_DES_LIENS, POINTS_DES_JONCTIONS, accrocheDuLien } from '../../logic/stylesDesLiensDeTrame';
import { MOT_DE_L_IMPORTANCE } from '../../logic/importanceDeLaScene';
import { LIBELLE_DE_L_ETAT, MARQUE_DU_RANG } from './reperesDesScenes';

/** Le titre reste entier dans l'infobulle et l'inspecteur ; deux lignes sur la carte. */
export const CarteDeTrame = React.memo(({ data, selected }: NodeProps<Carte>) => {
    const n = data.noeud;
    return <article className="carte-de-trame" data-type={n.type} data-selection={selected || undefined}
        data-estompe={data.estompe || undefined} data-annulee={data.annulee || undefined} data-jonction={data.jonction || undefined} data-points-multiples={data.jonctionsMultiples || undefined} data-etat={n.etat} data-importance={n.type === 'scene' ? n.importance ?? 'non-classee' : undefined}
        title={n.nom} style={{ '--teinte-trame': TEINTE_DE_TRAME[n.type] } as React.CSSProperties}>
        {/* En mode Loose les quatre accroches source acceptent départ et arrivée. */}
        {Object.entries(JONCTIONS_DES_LIENS).flatMap(([cote, jonction]) => POINTS_DES_JONCTIONS.map(point => {
            const lateral = cote === 'gauche' || cote === 'droite';
            const nom = jonction.nom + (point === 2 ? '' : ` — point ${point}`);
            return <Handle key={cote + point} type="source" id={accrocheDuLien(cote as keyof typeof JONCTIONS_DES_LIENS, point)}
                className={`${lateral ? '' : 'accroche-structurelle'} ${point === 2 ? '' : 'accroche-supplementaire'}`}
                style={lateral ? { top: `${point * 25}%` } : { left: `${point * 25}%` }}
                position={cote === 'haut' ? Position.Top : cote === 'bas' ? Position.Bottom : cote === 'gauche' ? Position.Left : Position.Right}
                isConnectable={(point === 2 || data.jonctionsMultiples) && (data.jonction || (lateral && data.liaison))}
                isConnectableStart={point === 2 && lateral && data.liaison}
                role={data.jonction ? 'button' : undefined} tabIndex={data.jonction ? 0 : -1}
                title={data.jonction ? `Placer ${data.extremite === 'depart' ? 'le départ' : 'l’arrivée'} : ${nom}` : undefined}
                aria-label={data.jonction
                    ? `Placer ${data.extremite === 'depart' ? 'le départ' : 'l’arrivée'} : ${nom} — ${n.nom}`
                    : `Accroche ${nom.toLowerCase()} : ${n.nom}`} />;
        }))}
        <div className="carte-de-trame-entete">
            <span className="carte-de-trame-type"><Layers size={12} />{data.acte ?? LIBELLE_DU_TYPE[n.type]}</span>
            {data.prevueEnSeance && <span className="carte-de-trame-seance" title="Prévue dans la séance" aria-label="Prévue dans la séance"><CalendarCheck size={12} /></span>}
            {n.etat && <span className="carte-de-trame-etat">
                {n.etat === 'en-cours' && <span className="carte-de-trame-pouls" aria-hidden />}
                {n.etat === 'en-pause' && <Pause size={10} />}
                {n.etat === 'terminee' && (data.annulee ? <Ban size={10} /> : <Check size={10} />)}
                {data.annulee ? 'Annulée' : LIBELLE_DE_L_ETAT[n.etat]}
            </span>}
            {n.accompli && <span className="carte-de-trame-etat">{n.type === 'indice' ? 'Révélé' : 'Achevé'}</span>}
        </div>
        <h3>{n.nom}</h3>
        {n.type === 'scene' && <div className="carte-de-trame-details">
            <span className="carte-de-trame-rang">{React.createElement(MARQUE_DU_RANG[n.importance ?? 'non-classee'], { size: 11 })}{n.importance ? MOT_DE_L_IMPORTANCE[n.importance] : 'Non classée'}</span>
            {data.lieu && <span className="carte-de-trame-lieu" title={data.lieu}><MapPin size={12} />{data.lieu}</span>}
            <div><span><Users size={12} />{data.nombrePnj ?? 0} PNJ</span><span><Search size={12} />{data.nombreIndices ?? 0} indices</span></div>
        </div>}
    </article>;
}, (avant, apres) => avant.data === apres.data && avant.selected === apres.selected);
