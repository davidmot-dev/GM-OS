import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Dices, SkipForward } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { useRoundDuVoyageurStore, type DeclarationEnCours } from '../useRoundDuVoyageurStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { DiceEngine } from '../../dice/DiceEngine';
import { ficheDuCombattant } from '../logic/ficheDuCombattant';
import { armesDuVoyageur } from '../logic/armesDuVoyageur';
import { estUneFicheDeVoyageur } from '../../session/logic/ficheDeVoyageur';
import { etatDuVoyageur } from '../../session/logic/fatigueDuVoyageur';
import {
    CONDITIONS_DE_COMBAT, DIFFICULTES_DE_TIR, LIBELLE_DE_LA_CATEGORIE, OPTIONS_DE_PARTICULIERE, PHASES_DU_ROUND,
    maladresse, ordreDuRound, type CategorieDAction,
} from '../../dice/systemes/roundDeReveDeDragon';
import type { Combatant } from '../types';

/**
 * **Le round de combat de Rêve de Dragon** — 24/10/2026 (`combat.initiative.mode: 'phases'`).
 *
 * Sept phases par round (Livre des Voyageurs 2.3.1, p. 120, résumé p. 139). En
 * phase 1, le meneur note pour chacun son action et son arme ; « Tirer
 * l'initiative » lance un d6 par combattant, et le plateau prend l'ordre des
 * phases : magie, tirs, lancers, mêlée. Le facteur d'un Voyageur se lit sur sa
 * fiche (demi-caractéristique + niveau) ; celui d'un adversaire se saisit.
 */
const classe = 'min-w-0 rounded border border-app-border/50 bg-app-bg px-2 py-1 text-ui-11 text-app-text';
const CATEGORIES = Object.keys(LIBELLE_DE_LA_CATEGORIE) as CategorieDAction[];
/** Une arme que la fiche ne porte pas : un adversaire, une arme ramassée. */
const AUTRE = '__autre';

/** Ce que la fiche dit d'un combattant : ses armes et son état général. */
function lireLeCombattant(c: Combatant) {
    const s = useSessionOSStore.getState();
    const source = c.isPlayer ? s.players.flatMap(p => p.characters).find(x => x.id === c.sourcePlayerId) : s.entities.find(e => e.id === c.sourceEntityId);
    const { valeurs, gabarit } = ficheDuCombattant(c, source, [...DEFAULT_SHEET_TEMPLATES, ...s.customSheetTemplates], s.getActiveDriver()?.templateId);
    if (!gabarit || !estUneFicheDeVoyageur(gabarit)) return { armes: [], etat: 0 };
    let etat = 0;
    try { etat = etatDuVoyageur(valeurs).total; } catch { /* suivi R1 absent : l'état se saisit */ }
    return { armes: armesDuVoyageur(valeurs, gabarit), etat };
}

const PanneauDesPhases: React.FC = () => {
    const combattants = useCombatStore(s => s.combatants);
    const round = useCombatStore(s => s.round);
    const setCurrentTurnTo = useCombatStore(s => s.setCurrentTurnTo);
    const { phase, engagement, declarations, declarer, allerALaPhase, basculerEngagement, poserLesDes, roundSuivant, clore } = useRoundDuVoyageurStore();
    const [maladresseTiree, noterMaladresse] = useState('');
    const [tir, regler] = useState({ portee: 'courte', taille: 'humaine', activite: 'immobile' });

    if (combattants.length === 0) return null;

    const lus = Object.fromEntries(combattants.map(c => [c.id, lireLeCombattant(c)]));
    const defautDe = (c: Combatant): DeclarationEnCours => {
        const arme = lus[c.id].armes[0];
        return { categorie: arme?.categorie ?? 'melee', arme: arme?.nom ?? '', facteur: arme?.facteur ?? 0, etatGeneral: lus[c.id].etat, demiSurprise: false, charge: false, groupe: 0 };
    };
    const declaration = (c: Combatant) => ({ ...defautDe(c), ...declarations[c.id] });
    const ordre = ordreDuRound(combattants.map(c => ({ id: c.id, nom: c.name, ...declaration(c) })), engagement);
    const phaseCourante = PHASES_DU_ROUND[phase - 1];

    const tirer = () => {
        const des = Object.fromEntries(combattants.map(c => [c.id, DiceEngine.roll(6)]));
        combattants.forEach(c => declarer(c.id, {}, defautDe(c)));
        poserLesDes(des);
        const apres = useRoundDuVoyageurStore.getState().declarations;
        const phases = ordreDuRound(combattants.map(c => ({ id: c.id, nom: c.name, ...defautDe(c), ...apres[c.id] })), engagement);
        const initiatives = Object.fromEntries(phases.flatMap(p => p.rangs).filter(r => r.initiative !== null).map(r => [r.id, r.initiative!]));
        useCombatStore.getState().ordonnerLeRound(phases.flatMap(p => p.rangs.map(r => r.id)), initiatives);
    };
    const totalTir = DIFFICULTES_DE_TIR.portee[tir.portee as keyof typeof DIFFICULTES_DE_TIR.portee]
        + DIFFICULTES_DE_TIR.taille[tir.taille as keyof typeof DIFFICULTES_DE_TIR.taille]
        + DIFFICULTES_DE_TIR.activite[tir.activite as keyof typeof DIFFICULTES_DE_TIR.activite];

    return (
        <section aria-label="Round de Rêve de Dragon" className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-text/40">Round {round}{engagement ? ' · engagement' : ''}</p>
                <button onClick={clore} className="text-ui-9 font-bold uppercase tracking-widest text-app-text/30 hover:text-etat-danger transition-colors">Clore</button>
            </div>

            <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                    <button aria-label="Phase précédente" disabled={phase === 1} onClick={() => allerALaPhase(phase - 1)} className="text-app-text/50 disabled:opacity-20"><ChevronLeft size={14} /></button>
                    <p className="flex-1 text-xs font-bold text-accent">Phase {phase} — {phaseCourante.nom}</p>
                    <button aria-label="Phase suivante" disabled={phase === 7} onClick={() => allerALaPhase(phase + 1)} className="text-app-text/50 disabled:opacity-20"><ChevronRight size={14} /></button>
                </div>
                <p className="text-ui-10 text-app-text/60 leading-snug">{phaseCourante.aide}</p>
                <div className="flex flex-wrap gap-2">
                    <button onClick={tirer} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/40 text-accent text-ui-10 font-black uppercase tracking-widest hover:bg-accent/10">
                        <Dices size={12} /> Tirer l’initiative
                    </button>
                    <button onClick={roundSuivant} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app-border/40 text-app-text/70 text-ui-10 font-black uppercase tracking-widest hover:border-accent/50">
                        <SkipForward size={12} /> Round suivant
                    </button>
                </div>
                <label className="flex items-center gap-2 text-ui-10 text-app-text/60">
                    <input type="checkbox" checked={engagement} onChange={basculerEngagement} />
                    Round d’engagement : l’arme la plus longue frappe d’abord
                </label>
            </div>

            <details open={phase === 1}>
                <summary className="cursor-pointer text-ui-10 font-black uppercase tracking-widest text-app-text/50">Déclarations (phase 1)</summary>
                <div className="mt-2 space-y-2">
                    {combattants.map(c => {
                        const d = declaration(c), armes = lus[c.id].armes, maj = (m: Partial<DeclarationEnCours>) => declarer(c.id, m, defautDe(c));
                        return (
                            <div key={c.id} className="rounded-lg border border-app-border/30 p-2 space-y-1.5" aria-label={`Déclaration de ${c.name}`}>
                                <p className="text-xs font-bold text-app-text/80 truncate">{c.name}{d.d6 !== undefined && <span className="ml-2 font-mono text-ui-10 text-accent">d6 {d.d6}</span>}</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <select aria-label={`Action de ${c.name}`} className={classe} value={d.categorie} onChange={e => maj({ categorie: e.target.value as CategorieDAction })}>
                                        {CATEGORIES.map(k => <option key={k} value={k}>{LIBELLE_DE_LA_CATEGORIE[k]}</option>)}
                                    </select>
                                    {armes.length > 0 && (
                                        <select aria-label={`Arme de la fiche de ${c.name}`} className={classe} value={armes.some(a => a.nom === d.arme) ? d.arme : AUTRE} onChange={e => {
                                            const a = armes.find(x => x.nom === e.target.value);
                                            maj(a ? { arme: a.nom, facteur: a.facteur, categorie: a.categorie } : { arme: '' });
                                        }}>
                                            {armes.map(a => <option key={a.cle} value={a.nom}>{a.nom} ({a.facteur})</option>)}
                                            <option value={AUTRE}>Autre arme…</option>
                                        </select>
                                    )}
                                    {!armes.some(a => a.nom === d.arme) && <input aria-label={`Arme de ${c.name}`} placeholder="Arme" className={classe} value={d.arme} onChange={e => maj({ arme: e.target.value })} />}
                                    <label className="flex items-center gap-1 text-ui-10 text-app-text/50">Facteur
                                        <input aria-label={`Facteur de ${c.name}`} type="number" className={`${classe} w-14`} value={d.facteur} onChange={e => maj({ facteur: Number(e.target.value) })} /></label>
                                    <label className="flex items-center gap-1 text-ui-10 text-app-text/50">État
                                        <input aria-label={`État général de ${c.name}`} type="number" max={0} className={`${classe} w-14`} value={d.etatGeneral} onChange={e => maj({ etatGeneral: Number(e.target.value) })} /></label>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-ui-10 text-app-text/50">
                                    <label className="flex items-center gap-1"><input type="checkbox" checked={d.demiSurprise} onChange={e => maj({ demiSurprise: e.target.checked })} />Demi-surprise</label>
                                    <label className="flex items-center gap-1"><input type="checkbox" checked={d.charge} onChange={e => maj({ charge: e.target.checked })} />Charge</label>
                                    <label className="flex items-center gap-1">Groupe
                                        <input aria-label={`Groupe de ${c.name}`} type="number" min={0} max={8} className={`${classe} w-12`} value={d.groupe} onChange={e => maj({ groupe: Number(e.target.value) })} /></label>
                                </div>
                            </div>
                        );
                    })}
                    <p className="text-ui-10 text-app-text/30 leading-snug">Facteur : demi-caractéristique (Mêlée, Tir ou Lancer) + niveau de l’arme. Groupe : à plusieurs contre un, chacun ajoute leur nombre.</p>
                </div>
            </details>

            <div className="space-y-2" aria-label="Ordre du round">
                {ordre.filter(p => p.rangs.length).map(p => (
                    <div key={p.phase.numero} className={`rounded-lg border p-2 ${p.phase.numero === phase ? 'border-accent/50 bg-accent/5' : 'border-app-border/20'}`}>
                        <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/50">Phase {p.phase.numero} · {p.phase.nom}</p>
                        {p.rangs.map(r => (
                            <button key={r.id} onClick={() => setCurrentTurnTo(r.id)} title={r.motif}
                                className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/5 text-left">
                                <span className="text-xs font-bold text-app-text/80 truncate">{r.nom}</span>
                                <span className="ml-auto font-mono text-ui-10 text-app-text/40">{r.initiative ?? '—'}</span>
                            </button>
                        ))}
                        {p.remarques.map((m, i) => <p key={i} className="text-ui-10 text-etat-alerte/70 leading-snug">{m}</p>)}
                    </div>
                ))}
            </div>

            <details>
                <summary className="cursor-pointer text-ui-10 font-black uppercase tracking-widest text-app-text/50">Aide-mémoire de la mêlée et du tir</summary>
                <div className="mt-2 space-y-2 text-ui-10 text-app-text/60 leading-snug">
                    <p><strong>Mêlée</strong> : l’attaquant choisit sa difficulté, de 0 à −10 ; le défenseur pare ou esquive à la même. Une arme, une attaque ou une parade par round ; une esquive.</p>
                    {OPTIONS_DE_PARTICULIERE.map(o => <p key={o.id}><strong>Particulière en {o.nom.toLowerCase()}</strong> : {o.effet}</p>)}
                    <ul className="space-y-1">{CONDITIONS_DE_COMBAT.map(c => <li key={c.id}><strong>{c.nom}</strong> — initiative {c.initiative}, attaque +{c.attaque}, défense : {c.defense}, +dom +{c.dommages}. {c.note}</li>)}</ul>
                    <div className="flex flex-wrap items-center gap-2">
                        <button className={classe} onClick={() => { const t = DiceEngine.roll(10) + DiceEngine.roll(10), m = maladresse(t, true); noterMaladresse(`2d10 = ${t} : ${m.nom} — ${m.effet}`); }}>Maladresse armée (2d10)</button>
                        <button className={classe} onClick={() => { const t = DiceEngine.roll(10) + DiceEngine.roll(10), m = maladresse(t, false); noterMaladresse(`2d10 = ${t} : ${m.nom} — ${m.effet}`); }}>Maladresse à mains nues</button>
                    </div>
                    {maladresseTiree && <p role="status" className="text-etat-alerte/80">{maladresseTiree}</p>}
                    <p><strong>Difficulté d’un tir ou d’un lancer</strong> (elles se cumulent) :</p>
                    <div className="grid grid-cols-3 gap-1">
                        {(Object.keys(DIFFICULTES_DE_TIR) as (keyof typeof DIFFICULTES_DE_TIR)[]).map(k => (
                            <select key={k} aria-label={`Tir : ${k}`} className={classe} value={tir[k]} onChange={e => regler({ ...tir, [k]: e.target.value })}>
                                {Object.entries(DIFFICULTES_DE_TIR[k]).map(([v, n]) => <option key={v} value={v}>{v} ({n > 0 ? `+${n}` : n})</option>)}
                            </select>
                        ))}
                    </div>
                    <p className="font-bold text-accent">Difficulté du tir : {totalTir > 0 ? `+${totalTir}` : totalTir}</p>
                    <p>Flèches, carreaux et pierres ne s’esquivent pas ; ils se parent au bouclier, si l’on voit le tireur.</p>
                </div>
            </details>
        </section>
    );
};

export default PanneauDesPhases;
