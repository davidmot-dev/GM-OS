import React from 'react';
import type { StyleDeLienDeTrame } from '../../../../types/campaign.types';
import type { TraitDeTrame } from '../../logic/adapterLeGrapheDeTrame';
import { COULEURS_DES_LIENS, EPAISSEURS_DES_LIENS, JONCTIONS_DES_LIENS, normaliserLeStyleDeLien } from '../../logic/stylesDesLiensDeTrame';

interface Props {
    lien: TraitDeTrame; depart: string; arrivee: string; style?: StyleDeLienDeTrame;
    brouillonInitial?: StyleDeLienDeTrame;
    onApercu: (style?: StyleDeLienDeTrame) => void;
    onAppliquer: (style?: StyleDeLienDeTrame) => void;
    onFermer: () => void; onRetirer: () => void;
}

/** L'aperçu reste local ; Appliquer valide les réglages en une seule écriture. */
export const InspecteurDeLienDeTrame: React.FC<Props> = ({ lien, depart, arrivee, style, brouillonInitial, onApercu, onAppliquer, onFermer, onRetirer }) => {
    const initial = brouillonInitial ?? style;
    const [brouillon, setBrouillon] = React.useState<StyleDeLienDeTrame>(() => normaliserLeStyleDeLien(initial) ?? {});
    const [personnalisee, setPersonnalisee] = React.useState(() => !!normaliserLeStyleDeLien(initial)?.couleur?.startsWith('#'));
    const [hex, setHex] = React.useState<string>(() => {
        const couleur = normaliserLeStyleDeLien(initial)?.couleur;
        return couleur?.startsWith('#') ? couleur : '#8b5cf6';
    });
    const hexValide = /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex);
    const modifier = (suite: StyleDeLienDeTrame) => { setBrouillon(suite); onApercu(normaliserLeStyleDeLien(suite) ?? {}); };
    const annuler = () => {
        const conserve = normaliserLeStyleDeLien(style) ?? {};
        setBrouillon(conserve); setPersonnalisee(!!conserve.couleur?.startsWith('#'));
        setHex(conserve.couleur?.startsWith('#') ? conserve.couleur : '#8b5cf6'); onApercu(undefined);
    };
    const structurel = lien.data?.lien.nature === 'appartenance' || lien.data?.lien.nature === 'suite';
    return <div className="inspecteur-de-trame inspecteur-de-lien custom-scrollbar" aria-label="Inspecteur de lien">
        <button onClick={onFermer} className="fermer-inspecteur-de-lien">Fermer la sélection</button>
        <p className="type-du-lien">Lien de Trame</p>
        <h2>{depart} → {arrivee}</h2>
        {lien.data?.lien.libelle && <p className="condition-du-lien">{lien.data.lien.libelle}</p>}
        {(['depart', 'arrivee'] as const).map(cle => <label key={cle}>
            {cle === 'depart' ? 'Côté de départ' : 'Côté d’arrivée'}
            <select aria-label={cle === 'depart' ? 'Côté de départ' : 'Côté d’arrivée'} value={brouillon[cle] ?? ''}
                onChange={e => modifier({ ...brouillon, [cle]: e.target.value || undefined })}>
                <option value="">Par défaut</option>
                {Object.entries(JONCTIONS_DES_LIENS).map(([cote, jonction]) => <option key={cote} value={cote}>{jonction.nom}</option>)}
            </select>
        </label>)}
        <p className="aide-du-style-de-lien">Clique un point sur le côté souhaité de la carte de départ ou d’arrivée. Tu peux aussi tirer un grand cercle vers ce point. Appliquer conserve le choix.</p>
        <label>Tracé<select aria-label="Tracé du lien" value={brouillon.trace ?? ''}
            onChange={e => modifier({ ...brouillon, trace: e.target.value as StyleDeLienDeTrame['trace'] || undefined })}>
            <option value="">Style du thème</option><option value="continu">Continu</option>
            <option value="tirets">Tirets</option><option value="points">Petits points</option>
        </select></label>
        <label>Épaisseur<select aria-label="Épaisseur du lien" value={brouillon.epaisseur ?? ''}
            onChange={e => modifier({ ...brouillon, epaisseur: e.target.value as StyleDeLienDeTrame['epaisseur'] || undefined })}>
            <option value="">Style du thème</option>
            {Object.entries(EPAISSEURS_DES_LIENS).map(([cle, choix]) => <option key={cle} value={cle}>{choix.nom}</option>)}
        </select></label>
        <label>Couleur<select aria-label="Couleur du lien" value={personnalisee ? 'personnalisee' : brouillon.couleur ?? ''}
            onChange={e => {
                const perso = e.target.value === 'personnalisee'; setPersonnalisee(perso);
                modifier({ ...brouillon, couleur: perso ? normaliserLeStyleDeLien({ couleur: hex })?.couleur
                    : e.target.value as StyleDeLienDeTrame['couleur'] || undefined });
            }}>
            <option value="">Style du thème</option>
            {Object.entries(COULEURS_DES_LIENS).map(([cle, choix]) => <option key={cle} value={cle}>{choix.nom} du thème</option>)}
            <option value="personnalisee">Personnalisée</option>
        </select></label>
        {personnalisee && <div className="couleur-personnalisee-du-lien">
            <input aria-label="Choisir la couleur" type="color" value={hexValide ? normaliserLeStyleDeLien({ couleur: hex })?.couleur : '#8b5cf6'}
                onChange={e => { setHex(e.target.value); modifier({ ...brouillon, couleur: e.target.value as `#${string}` }); }} />
            <label>Valeur hexadécimale<input aria-label="Valeur hexadécimale" value={hex} aria-invalid={!hexValide} maxLength={7}
                onChange={e => {
                    setHex(e.target.value); const couleur = normaliserLeStyleDeLien({ couleur: e.target.value })?.couleur;
                    if (couleur?.startsWith('#')) modifier({ ...brouillon, couleur });
                }} /></label>
            {!hexValide && <p role="alert">Saisis une couleur comme #8b5cf6.</p>}
        </div>}
        <p className="aide-du-style-de-lien">Aperçu immédiat. Appliquer conserve ces réglages pour ce lien.</p>
        <div className="actions-du-style-de-lien">
            <button className="appliquer-style-de-lien" disabled={personnalisee && !hexValide}
                onClick={() => onAppliquer(normaliserLeStyleDeLien(brouillon))}>Appliquer</button>
            <button onClick={annuler}>Annuler les réglages</button>
        </div>
        <button className="retour-style-du-theme" onClick={() => {
            const jonctions = normaliserLeStyleDeLien({ depart: style?.depart, arrivee: style?.arrivee });
            setBrouillon(jonctions ?? {}); setPersonnalisee(false); onAppliquer(jonctions);
        }}>Revenir au style du thème</button>
        <button onClick={() => modifier({ ...brouillon, depart: undefined, arrivee: undefined })}>Revenir aux jonctions par défaut</button>
        {structurel ? <p className="aide-du-style-de-lien">{lien.data?.lien.nature === 'suite'
            ? 'Ce lien indique l’ordre des scènes.' : 'Ce lien indique l’appartenance à un acte.'}</p>
            : <button className="retirer-lien" onClick={onRetirer}>Retirer le lien</button>}
    </div>;
};
