import { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { NOMS_DES_ATOUTS_TORG, possedeAtoutTorg, type AtoutDeTorg } from '../../dice/systemes/torgPersonnage';
import { ouvrirChoixAtoutTorg, garderChoixAtoutTorg, prendreRelationTorg, poserParAtoutTorg, estUneRelationTorg, poserCarteOccultisteTorg, reprendreChoixAtoutTorg } from '../logic/gestesDesAtoutsTorg';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import type { DeckManifest } from '../../../types/deck.types';

const bouton = 'rounded-lg border border-app-border bg-app-surface px-3 py-2 text-ui-11 font-bold text-app-text disabled:opacity-40';
const champ = 'rounded-lg border border-app-border bg-app-surface px-2 py-2 text-ui-11 text-app-text';

export default function GestesDesAtoutsTorg({ deck, personnages, acteurImpose }: { deck: DeckManifest; personnages: { id: string; name: string }[]; acteurImpose?: string }) {
    const joueurs = useSessionOSStore(s => s.players);
    const regle = useSessionOSStore(s => s.getActiveDriver()?.torg);
    const etat = useSessionOSStore(s => s.deckStates[deck.id]);
    const [acteurChoisi, setActeur] = useState('');
    const [atoutChoisi, setAtout] = useState<AtoutDeTorg>('occultiste');
    const [beneficiaire, setBeneficiaire] = useState('');
    const [confirme, setConfirme] = useState(false);
    const [indices, setIndices] = useState<number[]>([]);
    const [chercher, setChercher] = useState(false);
    const acteur = acteurImpose ?? (personnages.some(p => p.id === acteurChoisi) ? acteurChoisi : personnages[0]?.id ?? '');
    const personnage = joueurs.flatMap(j => j.characters).find(c => c.id === acteur);
    const valeurs = personnage?.sheetData ?? {};
    const possedes = (Object.keys(NOMS_DES_ATOUTS_TORG) as AtoutDeTorg[]).filter(a => possedeAtoutTorg(regle, valeurs, a));
    const atout = possedes.includes(atoutChoisi) ? atoutChoisi : possedes[0];
    const cible = personnages.some(p => p.id === beneficiaire) ? beneficiaire : acteur;
    const choix = etat?.torgChoix?.[acteur];
    if (!regle || !etat || !personnages.length) return null;
    const nom = (i: number) => deck.cardMetadata?.[i]?.name ?? `Carte #${i}`;
    const image = (i: number) => <img src={`/${DeckInterpreter.getCardImageUrl(deck.folderPath, i, deck)}`} alt={nom(i)} className="h-28 rounded-md border border-app-border object-contain" />;
    const cle = `${acteur}:${atout}`;
    const utilise = atout === 'occultiste' ? etat.torgUsagesCombat?.includes(cle)
        : atout === 'populaire' ? etat.torgUsagesActe?.includes(cle) : etat.torgUsagesScene?.includes(cle);
    const mains = (etat.enMain ?? []).filter(c => c.porteur === acteur && !c.enReserve);
    return <section className="basis-full space-y-3 border-t border-accent/20 pt-3" data-atouts-du-destin>
        <div className="flex flex-wrap items-center gap-2">
            <strong className="text-ui-11 text-accent">Atouts · pour</strong>
            <select aria-label="Pour quel personnage" disabled={!!acteurImpose} className={champ} value={acteur} onChange={e => { setActeur(e.target.value); setIndices([]); setConfirme(false); setChercher(false); }}>
                {personnages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {possedes.length > 0 && <select aria-label="Atout de Torg" className={champ} value={atout} onChange={e => { setAtout(e.target.value as AtoutDeTorg); setIndices([]); setConfirme(false); setChercher(false); }}>
                {possedes.map(a => <option key={a} value={a}>{NOMS_DES_ATOUTS_TORG[a]}</option>)}
            </select>}
        </div>
        {!possedes.length && <p className="text-ui-11 text-app-muted">Aucun de ces Atouts n’est coché sur la fiche enregistrée.</p>}
        {choix ? <div className="flex flex-wrap gap-2" data-cartes-regardees>
            <p className="basis-full text-ui-11">{choix.atout === 'domination' ? 'Loi de la Domination' : NOMS_DES_ATOUTS_TORG[choix.atout]} : garder une carte ; les autres seront défaussées.</p>
            {choix.indices.map(i => <button className={bouton} key={i} type="button" aria-label={`Garder « ${nom(i)} »`} onClick={() => garderChoixAtoutTorg(deck.id, acteur, i)}>{image(i)}Garder</button>)}
            {choix.indices.some(i => !etat.remainingIndices.includes(i)) && <button className={bouton} type="button" onClick={() => reprendreChoixAtoutTorg(deck.id, acteur)}>La pioche a changé : reprendre le choix sans repayer</button>}
        </div> : atout && <div className="space-y-2 text-ui-11">
            {(atout === 'ingenieux' || atout === 'chefNaturel') && <label>Bénéficiaire <select className={champ} aria-label="Bénéficiaire des cartes" value={cible} onChange={e => setBeneficiaire(e.target.value)}>
                {personnages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>}
            {atout === 'aspectEffrayant' && <p>Lors d’une Intimidation approuvée réussie, utiliser le bouton de la carte de combattant : deux cartes, une gardée.</p>}
            {atout === 'occultiste' && <label className="flex items-center gap-2"><input type="checkbox" checked={confirme} onChange={e => setConfirme(e.target.checked)} />Début d’un combat contre une créature surnaturelle maléfique confirmé par le meneur</label>}
            {(atout === 'occultiste' || atout === 'ingenieux') && <button type="button" className={bouton} disabled={!!utilise || (atout === 'occultiste' && !confirme)} onClick={() => ouvrirChoixAtoutTorg(deck.id, acteur, atout, cible)}>
                {atout === 'ingenieux' ? 'Ingénieux · 1 Possibilité · Raison ND 10' : 'Occultiste · Sciences humaines ND 10'}{utilise ? ' — utilisé' : ''}
            </button>}
            {atout === 'occultiste' && utilise && !etat.torgUsagesCombat?.includes(`${cle}:reserve`) && <div>
                <p>Occultiste peut aussi poser immédiatement une carte de sa main en Réserve.</p>
                {mains.map(c => <button key={c.index} className={bouton} type="button" onClick={() => poserCarteOccultisteTorg(deck.id, acteur, c.index)}>Poser « {nom(c.index)} » en Réserve</button>)}
            </div>}
            {atout === 'populaire' && <>
                <button className={bouton} type="button" disabled={!!utilise} onClick={() => setChercher(!chercher)}>Chercher une carte Relation…{utilise ? ' — utilisé cet Acte' : ''}</button>
                {chercher && <div className="flex flex-wrap gap-2" data-chercher-une-carte>{[...etat.discardedIndices, ...etat.remainingIndices].filter(i => estUneRelationTorg(deck.cardMetadata?.[i]?.name)).map(i =>
                    <button key={i} className={bouton} type="button" aria-label={`Prendre « ${nom(i)} »`} onClick={() => { prendreRelationTorg(deck.id, acteur, i); setChercher(false); }}>{image(i)}Relation</button>)}
                    <p className="basis-full text-app-muted">Seules les cartes nommées Relation sont proposées ; nommer la carte dans Deck-OS si nécessaire.</p>
                </div>}
            </>}
            {(atout === 'chefNaturel' || atout === 'conscienceEnvironnementale') && <>
                <p>{atout === 'chefNaturel' ? 'Choisir deux cartes de sa main ; une Possibilité les place dans la Réserve d’un autre personnage (p. 85).' : 'Une carte de sa main immédiatement en Réserve, une fois par scène (p. 100).'}</p>
                <div className="flex flex-wrap gap-2">{mains.map(c => <label key={c.index} className={champ}><input type="checkbox" checked={indices.includes(c.index)} onChange={e => setIndices(a => e.target.checked ? [...a, c.index] : a.filter(i => i !== c.index))} /> {nom(c.index)}</label>)}</div>
                <button className={bouton} type="button" disabled={indices.length !== (atout === 'chefNaturel' ? 2 : 1) || (atout === 'chefNaturel' ? cible === acteur : !!utilise)} onClick={() => { poserParAtoutTorg(deck.id, acteur, atout, indices, cible); setIndices([]); }}>Poser en Réserve{utilise ? ' — utilisé' : ''}</button>
            </>}
        </div>}
    </section>;
}
