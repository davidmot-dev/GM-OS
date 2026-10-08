import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { MapPin, Users, Search, Layers, Circle } from 'lucide-react';
import { LIBELLE_DU_TYPE } from '../../logic/grapheDeLaTrame';
import { TEINTE_DE_TRAME, type CarteDeTrame as Carte } from '../../logic/adapterLeGrapheDeTrame';
import { JONCTIONS_DES_LIENS, POINTS_DES_JONCTIONS, accrocheDuLien } from '../../logic/stylesDesLiensDeTrame';

const ETATS = { prevue: 'À jouer', 'en-cours': 'En cours', 'en-pause': 'En pause', terminee: 'Terminée' };

/** Le titre reste entier dans l'infobulle et l'inspecteur ; deux lignes sur la carte. */
export const CarteDeTrame = React.memo(({ data, selected }: NodeProps<Carte>) => {
    const n = data.noeud;
    return <article className="carte-de-trame" data-type={n.type} data-selection={selected || undefined}
        data-estompe={data.estompe || undefined} data-jonction={data.jonction || undefined} data-points-multiples={data.jonctionsMultiples || undefined} data-etat={n.etat} data-importance={n.importance ?? undefined}
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
            {n.etat && <span className="carte-de-trame-etat">{ETATS[n.etat]}</span>}
            {n.accompli && <span className="carte-de-trame-etat">{n.type === 'indice' ? 'Révélé' : 'Achevé'}</span>}
        </div>
        <h3>{n.nom}</h3>
        {n.type === 'scene' && <div className="carte-de-trame-details">
            <span className="carte-de-trame-rang"><Circle size={9} />{n.importance === 'principale' ? 'Principale' : n.importance === 'optionnelle' ? 'Optionnelle' : n.importance === 'secondaire' ? 'Secondaire' : 'Non classée'}</span>
            {data.lieu && <span className="carte-de-trame-lieu" title={data.lieu}><MapPin size={12} />{data.lieu}</span>}
            <div><span><Users size={12} />{data.nombrePnj ?? 0} PNJ</span><span><Search size={12} />{data.nombreIndices ?? 0} indices</span></div>
        </div>}
    </article>;
}, (avant, apres) => avant.data === apres.data && avant.selected === apres.selected);
