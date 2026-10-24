import { useRef, useState } from 'react';
import { CASES, GENRES, caseDe, libelleCase, voisines } from '../../../../outils/reve-de-dragon/tmr/carte.mjs';
import { DiceEngine } from '../../dice/DiceEngine';
import { rencontreDuD100, type GenreDeTerre } from '../../dice/systemes/hautReve';
import { consequences } from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
import type { DemandeTMR, NoteTMR, VoyageurTMR, VueTMRJoueur, VueTMRMJ } from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
import type { CommandeDeModule, ResultatDeModule } from '../protocole';
// Embarquée dans le module : le précache PWA courant n'inclut pas les JPG séparés.
import carteOfficielle from '../../../../outils/reve-de-dragon/tmr/images/carte-officielle.jpg?inline';
import './tmr.css';

type Props = { vue: VueTMRMJ | VueTMRJoueur; envoyerCommande: (c: CommandeDeModule) => Promise<ResultatDeModule> };
type Envoyer = (id: string, charge: Record<string, unknown>) => Promise<boolean>;
const ACTIONS = { monter: 'Monter', avancer: 'Se déplacer', rester: 'Rester un round', descendre: 'Quitter les TMR' };
const TYPES = { reserve: 'Sort en réserve', queue: 'Queue de Dragon', souffle: 'Souffle de Dragon' };
const SYMBOLES: Record<string, string> = { cite: 'Ci', sanctuaire: 'Sa', plaines: 'Pl', collines: 'Co', foret: 'Fo', monts: 'Mo', desert: 'Dé', gouffre: 'Go', necropole: 'Né', desolation: 'Ds', pont: 'Po', marais: 'Ma', lac: 'La', fleuve: 'Fl' };

function ChoixCase({ valeur, changer, libelle = 'Case sélectionnée' }: { valeur: string; changer: (s: string) => void; libelle?: string }) {
    return <label>{libelle}<select aria-label={libelle} value={valeur} onChange={e => changer(e.target.value)}>{CASES.map(c => <option key={c.id} value={c.id}>{libelleCase(c.id)}</option>)}</select></label>;
}
function Carte({ position, selection, choisir, notes, present }: { position: string | null; selection: string; choisir: (s: string) => void; notes: NoteTMR[]; present: boolean }) {
    const voisins = position ? voisines(position) : [];
    return <section aria-label="Carte des Terres Médianes">
        <div className="tmr-carte-entete"><h3>Les Terres Médianes</h3><span>189 terres · A–M / 1–15</span></div>
        <p className="tmr-aide">Choisis une terre sur la carte ou dans la liste. Sur téléphone, fais glisser la carte horizontalement.</p>
        <div className="tmr-defilement" tabIndex={0} aria-label="Carte défilante">
            <div className="tmr-carte">
                <img src={carteOfficielle} width={900} height={1000} draggable={false} alt="Carte officielle en couleur des Terres Médianes du Rêve" />
                <div className="tmr-zones">{CASES.map(c => <button type="button" key={c.id} className="tmr-terre"
                style={{ gridColumn: c.col + 1, gridRow: `${c.ligne * 2 + 1 + c.col % 2} / span 2` }}
                aria-label={libelleCase(c.id)} aria-pressed={selection === c.id} data-position={position === c.id} data-voisine={voisins.includes(c.id)}
                title={libelleCase(c.id)} onClick={() => choisir(c.id)}>
                {position === c.id && <span className="tmr-pion" aria-hidden="true">{present ? '●' : '◉'}</span>}
                {notes.some(n => n.type === 'reserve' && n.caseId === c.id) && <span className="tmr-reserve" aria-hidden="true">✧</span>}
            </button>)}</div></div>
        </div>
        <p className="tmr-legende">● en voyage · ◉ demi-rêve laissé sur place · ✧ sort en réserve · bord pointillé : case voisine</p>
        <details><summary>Les quatorze genres de terres</summary><p>{Object.entries(GENRES).map(([k, v]) => `${SYMBOLES[k]} : ${v}`).join(' · ')}</p></details>
    </section>;
}
function Cout({ demande }: { demande: DemandeTMR }) {
    const c = consequences(demande);
    return <div className="tmr-cout"><strong>{ACTIONS[demande.action]} · {libelleCase(demande.cible)}</strong>
        <p>À résoudre sur la fiche : {c.reve} point(s) de rêve, {c.fatigue} point(s) de fatigue.</p>
        {c.rencontre && <p>Rencontre : 1d7, puis table sur un 7. {c.humide && 'Case humide : maîtrise à résoudre après la rencontre.'}</p>}
        {demande.action !== 'descendre' && <p>{demande.rythme === 'normal' ? 'Un déplacement par round, montée comprise.' : 'Accéléré : plusieurs cases possibles ; une rencontre arrête le déplacement au moins jusqu’à la fin du round.'}</p>}
        <small>Barème de base 2.3.1 p. 182 ; le MJ tient compte des effets actifs. Le module n’effectue aucun débit ni jet.</small>
    </div>;
}
function Arbitrage({ voyageur: v, envoyer, occupe }: { voyageur: VoyageurTMR; envoyer: Envoyer; occupe: boolean }) {
    const [traitee, traiter] = useState(false), [compteRendu, noter] = useState('');
    return v.demande && <section className="tmr-arbitrage" aria-label="Arbitrage du trajet">
        <h3>Demande de {v.nom}</h3><Cout demande={v.demande} />
        <label>Compte rendu visible du joueur<textarea maxLength={2000} value={compteRendu} onChange={e => noter(e.target.value)} /></label>
        <label className="tmr-case"><input type="checkbox" checked={traitee} onChange={e => traiter(e.target.checked)} />Coûts, jets et conséquences résolus sur la fiche</label>
        <div className="tmr-actions"><button type="button" disabled={occupe || !traitee} onClick={() => void envoyer('arbitrer', { operationId: v.demande!.operationId, accepter: true, ficheTraitee: traitee, compteRendu })}>Valider le trajet</button>
            <button type="button" disabled={occupe} onClick={() => void envoyer('arbitrer', { operationId: v.demande!.operationId, accepter: false, ficheTraitee: false, compteRendu })}>Refuser le trajet</button></div>
    </section>;
}
/**
 * Le d7 de rencontre, la table selon le genre de la case, puis la force
 * (Livre du Haut-Rêve 2.3.1, p. 182–183) — 24/10/2026. Le texte va dans la
 * préparation privée : le meneur relit avant de révéler.
 */
function tirerUneRencontre(position: string | null): string {
    const terre = caseDe(position);
    if (!terre) return 'Placer le demi-rêve avant de tirer une rencontre.';
    const d8: number[] = [];
    do d8.push(DiceEngine.roll(8)); while (d8.at(-1) === 8 && d8.length < 50);
    if (d8.at(-1) !== 7) return `d7 : ${d8.at(-1)} — pas de rencontre en ${libelleCase(terre.id)}.`;
    const d100 = DiceEngine.roll(100), r = rencontreDuD100(terre.genre as GenreDeTerre, d100);
    const m = /^(\d)d(\d)$/.exec(r.force);
    let force: number, detail: string;
    if (m) { const des = Array.from({ length: Number(m[1]) }, () => DiceEngine.roll(Number(m[2]))); force = des.reduce((a, b) => a + b, 0); detail = `${r.force} : ${des.join(' + ')}`; }
    else { const ddr: number[] = []; let t; do { t = DiceEngine.roll(8) % 8; ddr.push(t); } while (t === 7 && ddr.length < 50); force = 7 + ddr.reduce((a, b) => a + b, 0); detail = `7 + ddr ${ddr.join(' + ')}`; }
    return `d7 : 7 — ${r.nom} de force ${force} (${detail}), d100 ${d100} en ${GENRES[terre.genre]}. ${r.maitrisee ? `Maîtrisé : ${r.maitrisee} ` : ''}Non maîtrisé : ${r.nonMaitrisee}`;
}
function Rencontre({ voyageur: v, envoyer, occupe }: { voyageur: VoyageurTMR; envoyer: Envoyer; occupe: boolean }) {
    const [preparation, preparer] = useState(v.preparation), [publication, publier] = useState('');
    return <details><summary>Rencontre et préparation privée</summary>
        <button type="button" disabled={occupe} onClick={() => preparer(tirerUneRencontre(v.position).slice(0, 2000))}>Tirer le d7, la rencontre et sa force</button>
        <label>Préparation secrète du MJ<textarea maxLength={2000} value={preparation} onChange={e => preparer(e.target.value)} /></label>
        <button type="button" disabled={occupe} onClick={() => void envoyer('preparer-rencontre', { texte: preparation })}>Garder la préparation privée</button>
        <label>Rencontre à révéler à ce joueur<textarea maxLength={2000} value={publication} onChange={e => publier(e.target.value)} placeholder="Genre, force et informations révélées" /></label>
        <button type="button" disabled={occupe || !publication.trim() || !v.present || !!v.demande} onClick={() => void envoyer('publier-rencontre', { texte: publication })}>Révéler la rencontre</button>
        <p className="tmr-aide">Maîtrise, dérobade ou refoulement se résolvent dans la carte « Haut-Rêve » de la fiche, qui écrit le rêve, le refoulement et les queues. Une rencontre publiée bloque le déplacement.</p>
        {v.rencontre && <button type="button" disabled={occupe || !!v.demande} onClick={() => void envoyer('terminer-rencontre', { etape: v.etape })}>Marquer la rencontre résolue</button>}
    </details>;
}
function AjouterNote({ envoyer, occupe, selection }: { envoyer: Envoyer; occupe: boolean; selection: string }) {
    const [type, typer] = useState<NoteTMR['type']>('reserve'), [nom, nommer] = useState(''), [texte, ecrire] = useState('');
    return <details><summary>Inscrire un sort, une queue ou un souffle</summary><form onSubmit={async e => {
        e.preventDefault(); if (await envoyer('noter', { note: { id: crypto.randomUUID(), type, nom, texte, caseId: type === 'reserve' ? selection : null } })) { nommer(''); ecrire(''); }
    }}>
        <label>Nature<select aria-label="Nature" value={type} onChange={e => typer(e.target.value as NoteTMR['type'])}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Nom<input required maxLength={120} value={nom} onChange={e => nommer(e.target.value)} /></label>
        {type === 'reserve' && <p>Case : {libelleCase(selection)}. Le lancer et son coût doivent déjà être résolus.</p>}
        <label>Détails et échéance<textarea maxLength={2000} value={texte} onChange={e => ecrire(e.target.value)} /></label>
        <button disabled={occupe || !nom.trim()}>Inscrire pour ce joueur</button>
    </form></details>;
}
function Credits() {
    return <details className="tmr-credits"><summary>Crédits et licences</summary>
        <p>Carte adaptée des données de <a href="https://scriptarium.org/RdD/tmr/" target="_blank" rel="noreferrer">Les Terres Médianes du Rêve : Outils</a>, par <strong>Cyol</strong>, corrections <strong>Kroc</strong> (version 21, 04/01/2017).</p>
        <p><a href="https://creativecommons.org/licenses/by/3.0/fr/" target="_blank" rel="noreferrer">Creative Commons Attribution 3.0 France</a>, licence annoncée par l’aide de Cyol. Adaptation GM-OS du 18/10/2026 : conversion des tableaux des cases, surcouche interactive et moteur d’arbitrage. Aucune bibliothèque tierce reprise.</p>
        <p>Carte officielle en couleur : image <em>fondTMR.jpg</em> de l’archive Scriptarium, reprise sans modification, correspondant au livre p. 180. Les droits des auteurs et de l’éditeur sont conservés ; la licence de l’aide informatique ne constitue pas une nouvelle licence de cette illustration.</p>
        <p>Crédits de l’édition : illustrations intérieures, Rolland Barthélémy et Florence Magnin ; couleurs, Sylvie Bonino, Algésiras, Jidus et Rolland Barthélémy ; plans, Jidus ; production, Scriptarium. Le livre ne désigne pas séparément l’auteur de cette carte.</p>
        <p>Rêve de Dragon : Denis Gerfaud ; éditeur notamment Scriptarium. Référence : édition 2.3.1, p. 178–183. Module non officiel.</p>
    </details>;
}
export function VuesTMR({ vue, envoyerCommande }: Props) {
    const mj = vue.role === 'mj';
    const [choisi, choisirVoyageur] = useState(''), [selection, choisirCase] = useState('G4'), [rythme, choisirRythme] = useState<'normal' | 'accelere'>('normal');
    const [occupe, occuper] = useState(false), [erreur, signaler] = useState('');
    const verrou = useRef(false);
    const personnageId = mj ? (vue.personnages.some(p => p.id === choisi) ? choisi : vue.personnages[0]?.id ?? '') : vue.voyageur.id;
    const voyageurMJ = vue.role === 'mj' ? vue.voyageurs.find(v => v.id === personnageId) : undefined;
    const voyageur = vue.role === 'mj' ? voyageurMJ : vue.voyageur;
    const v: Omit<VoyageurTMR, 'preparation' | 'ecriture'> | undefined = voyageur;
    const ecritureEnCours = voyageurMJ ? !!voyageurMJ.ecriture : vue.role === 'joueur' && vue.voyageur.ecritureEnCours;
    async function envoyer(id: string, charge: Record<string, unknown>) {
        if (verrou.current) return false;
        verrou.current = true; occuper(true); signaler('');
        try { const r = await envoyerCommande({ id, charge: mj ? { personnageId, ...charge } : charge }); if (!r.ok) signaler(r.erreur); return r.ok; }
        catch { signaler('Le module n’a pas pu joindre le MJ. Relis son état avant de réessayer.'); return false; }
        finally { verrou.current = false; occuper(false); }
    }
    function proposer(action: DemandeTMR['action']) {
        if (!v?.position) return;
        return envoyer('proposer', { operationId: crypto.randomUUID(), etape: v.etape, action, cible: action === 'avancer' ? selection : v.position, rythme: action === 'monter' ? rythme : v.rythme });
    }
    return <div className="tmr-module" role="region" aria-label="Terres Médianes du Rêve">
        <header><span className="tmr-surtitre">Rêve de Dragon · carnet de demi-rêve</span><h2>Terres Médianes du Rêve</h2>
            <p>Le MJ valide les trajets et leurs conséquences. Le carnet ne possède aucune réserve indépendante.</p></header>
        {ecritureEnCours && <p role="status">Écriture sur la fiche en cours : le trajet attend sa confirmation.</p>}
        {erreur && <p role="alert">{erreur}</p>}
        {mj && <label>Haut-rêvant<select aria-label="Haut-rêvant" value={personnageId} onChange={e => choisirVoyageur(e.target.value)}>{vue.personnages.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}</select></label>}
        <div className="tmr-disposition"><div className="tmr-plan"><Carte position={v?.position ?? null} selection={selection} choisir={choisirCase} notes={v?.notes ?? []} present={v?.present ?? false} />
            <ChoixCase valeur={selection} changer={choisirCase} /></div>
            <fieldset className="tmr-carnet" disabled={ecritureEnCours}>
                <section><h3>{v?.nom ?? 'Préparer un demi-rêve'}</h3><p className="tmr-position">{libelleCase(v?.position ?? null)}</p><p>{v?.present ? `En voyage · ${v.rythme === 'normal' ? 'normal' : 'accéléré'}` : 'Hors des TMR'}</p>
                    {mj && <button type="button" disabled={occupe || !personnageId || !!v?.present || !!v?.demande} onClick={() => void envoyer('positionner', { cible: selection, etape: v?.etape ?? 0 })}>{v?.position ? 'Corriger la position hors voyage' : 'Placer le demi-rêve'}</button>}
                    {!v?.position && <p>Le MJ choisit la position initiale ou reprend celle de la feuille de route existante.</p>}
                    {v?.position && !v.demande && <>
                        {!v.present && <label>Mode de montée<select aria-label="Mode de montée" value={rythme} onChange={e => choisirRythme(e.target.value as typeof rythme)}><option value="normal">Normal · 1 rêve</option><option value="accelere">Accéléré · 2 rêves</option></select></label>}
                        <div className="tmr-actions">{!v.present ? <button type="button" disabled={occupe} onClick={() => void proposer('monter')}>Demander la montée</button> : <>
                            <button type="button" disabled={occupe || !!v.rencontre || !voisines(v.position).includes(selection)} onClick={() => void proposer('avancer')}>Demander le déplacement</button>
                            <button type="button" disabled={occupe || !!v.rencontre} onClick={() => void proposer('rester')}>Rester un round</button>
                            <button type="button" disabled={occupe} onClick={() => void proposer('descendre')}>Quitter les TMR</button></>}</div>
                    </>}
                    {v?.demande && <><p role="status">En attente de l’arbitrage du MJ</p><Cout demande={v.demande} /><button type="button" disabled={occupe} onClick={() => void envoyer('annuler', { operationId: v.demande!.operationId })}>Annuler la demande</button></>}
                </section>
                {voyageurMJ && <><Arbitrage key={voyageurMJ.demande?.operationId ?? `vide-${voyageurMJ.id}`} voyageur={voyageurMJ} envoyer={envoyer} occupe={occupe} />
                    <Rencontre key={voyageurMJ.id} voyageur={voyageurMJ} envoyer={envoyer} occupe={occupe} /></>}
                {v?.rencontre && <section aria-label="Rencontre révélée"><h3>Rencontre en cours</h3><p className="tmr-texte">{v.rencontre}</p></section>}
                <section><h3>Réserves et effets</h3>{!v?.notes.length && <p>Aucun sort ni effet consigné.</p>}{v?.notes.map(n => <article key={n.id}><strong>{TYPES[n.type]} · {n.nom}</strong>{n.caseId && <p>{libelleCase(n.caseId)}</p>}<p className="tmr-texte">{n.texte}</p>
                    {mj && <button type="button" disabled={occupe} onClick={() => void envoyer('retirer-note', { noteId: n.id })}>Retirer : {n.nom}</button>}</article>)}
                    {mj && personnageId && <AjouterNote key={personnageId} envoyer={envoyer} occupe={occupe} selection={selection} />}</section>
                <details><summary>Journal du voyage</summary>{v?.journal.length ? [...v.journal].reverse().map(j => <p key={`${j.etape}:${j.operationId}`} className="tmr-texte">{j.texte}</p>) : <p>Aucun trajet arbitré.</p>}</details>
            </fieldset></div>
        {mj && <details><summary>Vue d’ensemble du MJ</summary>{vue.voyageurs.map(p => <p key={p.id}>{p.nom} : {libelleCase(p.position)} · {p.present ? 'en voyage' : 'hors TMR'}{p.demande ? ' · demande en attente' : ''}</p>)}</details>}
        <Credits />
    </div>;
}
