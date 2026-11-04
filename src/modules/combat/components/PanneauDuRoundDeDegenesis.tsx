import React from 'react';
import { Dices, SkipForward } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { useRoundDeDegenesisStore } from '../useRoundDeDegenesisStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { resolveInitiativeFormula } from '../logic/CombatRules';
import { ecrireSurLeCombattant, valeursDuCombattant } from '../coupsDeDegenesis';
import {
    actionsRestantes, bonusDeLaProchaineAction, DECLARATION_DU_ROUND, egoPermis, lancerLInitiative, ordonnerLInitiative,
    type EtatDuRound,
} from '../../dice/systemes/combatDeDegenesis';
import { EGO_PAR_ROUND } from '../../dice/systemes/degenesis';
import type { Combatant } from '../types';

/**
 * **Le round de Degenesis** — DEG-A1, 03/11/2026 (`combat.initiativeEnReserve`), dessiné dans
 * Stitch (`stitch/degenesis-round/`) et validé par David (« oui c'est validé »).
 *
 * Avant l'initiative, le meneur déclare l'Égo de chacun (0 à 3, rien s'il est surpris). « Lancer
 * l'initiative » lance PSY + Réactivité + l'Égo, −1D par Traumatisme, **débite l'Égo une fois**
 * sur la fiche et pose le plateau : le score le plus haut d'abord, les joueurs avant un PNJ à
 * égalité (p. 100-101). Pendant le round, chacun a ses actions — une, plus une par paire de
 * déclencheurs ; la première reçoit les dés d'Égo. Le panneau de jet et la défense active les
 * dépensent ; « Action utilisée » le fait pour ce qui se joue sans jet.
 */
const classe = 'min-w-0 rounded border border-app-border/50 bg-app-bg px-2 py-1 text-ui-11 text-app-text';
const petitBouton = 'flex-1 px-2 py-0.5 rounded border border-app-border/40 text-ui-10 hover:border-accent/50 disabled:opacity-30';
const entier = (v: unknown) => Math.trunc(Number(v) || 0);

interface Lu { va: number; aUneFiche: boolean; traumatismes: number; ego?: number }

function lire(c: Combatant): Lu {
    const pilote = useSessionOSStore.getState().getActiveDriver();
    const v = valeursDuCombattant(c);
    const cle = (nom: string) => Object.keys(v).find(k => k.toLowerCase() === nom.toLowerCase());
    const formule = pilote?.combat?.initiativeFormula ?? '';
    const va = formule ? resolveInitiativeFormula({ formula: formule, combatant: c, resolver: nom => { const k = cle(nom); return k ? entier(v[k]) : 0; } }) : 0;
    const regle = pilote?.jet?.degenesis;
    const champEgo = regle?.ego;
    const ego = champEgo && v[champEgo] !== undefined && String(v[champEgo]).trim() !== '' ? Math.max(0, entier(v[champEgo])) : undefined;
    return { va, aUneFiche: !!formule && formule.split(/[^\p{L}_]+/u).filter(Boolean).some(n => cle(n) !== undefined), traumatismes: regle?.traumatismes ? Math.max(0, entier(v[regle.traumatismes])) : 0, ego };
}

const Pips: React.FC<{ e: EtatDuRound }> = ({ e }) => (
    <span className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: e.actions }, (_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full border border-accent/60 ${i < e.utilisees ? 'bg-accent' : ''}`} />
        ))}
    </span>
);

const PanneauDuRoundDeDegenesis: React.FC = () => {
    const combattants = useCombatStore(s => s.combatants);
    const roundDuPlateau = useCombatStore(s => s.round);
    const setCurrentTurnTo = useCombatStore(s => s.setCurrentTurnTo);
    const { declarations, round, etats, declarer, poserLeRound, depenser, rendre, roundSuivant, clore } = useRoundDeDegenesisStore();

    if (combattants.length === 0) return null;
    const lus = Object.fromEntries(combattants.map(c => [c.id, lire(c)]));
    const decl = (c: Combatant) => ({ ...DECLARATION_DU_ROUND, ...declarations[c.id] });
    const lance = round !== null && round === roundDuPlateau;

    const lancer = () => {
        const resultats: Record<string, EtatDuRound> = {};
        const dits: string[] = [];
        for (const c of combattants) {
            const l = lus[c.id], d = decl(c);
            const va = l.aUneFiche ? l.va : entier(d.va);
            const r = lancerLInitiative(va, l.traumatismes, d, l.ego, () => DiceEngine.roll(6));
            resultats[c.id] = r.etat;
            const champEgo = useSessionOSStore.getState().getActiveDriver()?.jet?.degenesis?.ego;
            // L'Égo se paie ici, une seule fois : la première action le reçoit sans rien débiter (p. 100).
            if (r.egoPaye > 0 && champEgo && l.ego !== undefined) ecrireSurLeCombattant(c, { [champEgo]: l.ego - r.egoPaye });
            dits.push(`${c.name} ${r.etat.score}`
                + (r.etat.actions > 1 ? ` (${r.etat.actions} actions)` : '')
                + (r.egoPaye > 0 ? `, +${r.egoPaye}D d'Égo (Égo ${l.ego} → ${l.ego! - r.egoPaye})` : '')
                + (d.surpris ? ', surpris' : ''));
        }
        const ordre = ordonnerLInitiative(combattants.map(c => ({ id: c.id, score: resultats[c.id].score, joueur: c.isPlayer })));
        useCombatStore.getState().ordonnerLeRound(ordre.map(o => o.id), Object.fromEntries(ordre.map(o => [o.id, o.score])));
        poserLeRound(useCombatStore.getState().round, resultats);
        const s = useCombatStore.getState();
        useJournalStore.getState().addEvent({
            type: 'COMBAT', title: 'Combat : initiative',
            content: `Round ${s.round} — PSY + Réactivité : ${dits.join(' ; ')}.`,
            sceneId: s.sceneId ?? undefined, metadata: { round: s.round },
        });
    };

    const ordre = lance ? ordonnerLInitiative(combattants.filter(c => etats[c.id]).map(c => ({ id: c.id, score: etats[c.id].score, joueur: c.isPlayer, c }))) : [];

    return (
        <section aria-label="Round de Degenesis" className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-text/40">Round {roundDuPlateau} · initiative et actions</p>
                <button onClick={clore} className="text-ui-9 font-bold uppercase tracking-widest text-app-text/30 hover:text-etat-danger transition-colors">Clore</button>
            </div>

            <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                    <button onClick={lancer} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/40 text-accent text-ui-10 font-black uppercase tracking-widest hover:bg-accent/10">
                        <Dices size={12} /> Lancer l’initiative
                    </button>
                    <button onClick={roundSuivant} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app-border/40 text-app-text/70 text-ui-10 font-black uppercase tracking-widest hover:border-accent/50">
                        <SkipForward size={12} /> Round suivant
                    </button>
                </div>
                <p className="text-ui-10 italic text-app-text/60 leading-snug">PSY + Réactivité. Jusqu’à {EGO_PAR_ROUND} Égo : +1D à l’initiative et à la première action. Une action de plus par paire de déclencheurs (p. 100-101).</p>
            </div>

            <details open={!lance}>
                <summary className="cursor-pointer text-ui-10 font-black uppercase tracking-widest text-app-text/50">Avant l’initiative</summary>
                <div className="mt-2 space-y-2">
                    {combattants.map(c => {
                        const l = lus[c.id], d = decl(c);
                        const permis = egoPermis(l.ego, d.surpris);
                        return (
                            <div key={c.id} className="rounded-lg border border-app-border/30 p-2 space-y-1.5" aria-label={`Initiative de ${c.name}`}>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-app-text/80 truncate flex-1">{c.name}</p>
                                    {l.ego !== undefined && !d.surpris && (<>
                                        <select aria-label={`Égo de ${c.name}`} className={classe} value={Math.min(d.ego, permis)}
                                            onChange={e => declarer(c.id, { ego: Number(e.target.value) })}>
                                            {Array.from({ length: permis + 1 }, (_, n) => <option key={n} value={n}>Égo : {n}</option>)}
                                        </select>
                                        <span className="text-ui-10 text-app-text/50">sur {l.ego}</span>
                                    </>)}
                                </div>
                                {!l.aUneFiche && (
                                    <label className="flex items-center gap-1 text-ui-10 text-app-text/60" title="Sans fiche, le meneur dit la réserve (p. 101).">PSY + Réactivité
                                        <input aria-label={`PSY + Réactivité de ${c.name}`} type="number" min={0} className={`w-12 ${classe}`} value={d.va ?? 0}
                                            onChange={e => declarer(c.id, { va: Number(e.target.value) })} />
                                    </label>
                                )}
                                <label className="flex items-center gap-1.5 text-ui-11 text-app-text/70">
                                    <input type="checkbox" checked={d.surpris} onChange={e => declarer(c.id, { surpris: e.target.checked })} />
                                    Pris par surprise
                                </label>
                                {d.surpris && <p className="text-ui-10 italic text-app-text/50">Surpris : aucun Égo (p. 100).</p>}
                            </div>
                        );
                    })}
                </div>
            </details>

            {lance && (
                <div className="space-y-1.5" aria-label="Ordre du round">
                    <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/50">Ordre du round</p>
                    {ordre.map(({ id, c, simultane }) => {
                        const e = etats[id];
                        const restantes = actionsRestantes(e);
                        const bonus = bonusDeLaProchaineAction(e);
                        return (
                            <div key={id} data-round-degenesis={id} className="rounded-lg border border-app-border/30 p-2 space-y-1.5">
                                <button onClick={() => setCurrentTurnTo(id)} className="w-full flex items-center gap-2 text-left">
                                    <span className="text-xs font-bold text-app-text/80 truncate">{c.name}</span>
                                    {simultane && <span className="rounded border border-app-border/40 px-1 text-ui-9 text-app-text/50">simultané</span>}
                                    <span className="ml-auto font-mono text-sm font-black text-accent">{e.score}</span>
                                </button>
                                <div className="flex items-center gap-2 text-ui-10 text-app-text/70">
                                    <Pips e={e} />
                                    <span>{e.actions} action{e.actions > 1 ? 's' : ''} · {restantes} restante{restantes > 1 ? 's' : ''}</span>
                                </div>
                                {bonus > 0 && <span className="inline-block rounded border border-accent/40 px-1.5 text-ui-10 font-bold text-accent">+{bonus}D d’Égo — première action</span>}
                                {e.bonusEgo > 0 && bonus === 0 && <span className="inline-block rounded border border-app-border/40 px-1.5 text-ui-10 text-app-text/40 line-through">Égo épuisé</span>}
                                {restantes === 0
                                    ? <p className="text-ui-10 italic text-app-text/50">Défense passive seulement.</p>
                                    : (
                                        <div className="flex gap-1.5">
                                            <button className={petitBouton} onClick={() => depenser(id)} title="Une action jouée sans jet : recharger, changer de place… (p. 102)">Action utilisée</button>
                                            <button className={petitBouton} onClick={() => depenser(id)} title="Il se défend activement : une action, hors de son tour (p. 102). Le panneau de jet la dépense aussi.">Défense active</button>
                                        </div>
                                    )}
                                {e.utilisees > 0 && (
                                    <button className="text-ui-9 text-app-text/40 underline hover:text-accent" onClick={() => rendre(id)}>Rendre une action</button>
                                )}
                            </div>
                        );
                    })}
                    <p className="text-ui-10 italic text-app-text/50 leading-snug text-center">Égalité entre joueurs : simultané ; entre un PJ et un PNJ, le joueur annonce d’abord (p. 101).</p>
                </div>
            )}
        </section>
    );
};

export default PanneauDuRoundDeDegenesis;
