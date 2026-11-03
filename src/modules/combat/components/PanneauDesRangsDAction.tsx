import React from 'react';
import { ListOrdered, SkipForward } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { useRangsDActionStore } from '../useRangsDActionStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { ficheDuCombattant } from '../logic/ficheDuCombattant';
import {
    DECLARATION_PAR_DEFAUT, LIBELLES_DES_INTENTIONS, SURPRISES, ordonnerLesRangs, rangDAction, report,
    type DeclarationDeRA, type FicheDuRang, type Intention, type RangDAction, type Surprise,
} from '../../dice/systemes/rangsDActionDeRuneQuest';
import type { Combatant } from '../types';

/**
 * **Les rangs d'action de RuneQuest** — RQ-A4, 03/11/2026 (`combat.initiative.mode:
 * 'rangs-d-action'`), dessiné dans Stitch (`stitch/runequest-rangs/`) et validé par David.
 *
 * Le meneur déclare l'action de chacun (p. 192, phase 1) : mêlée ou tir avec une arme de
 * la feuille, sort et ses points de magie, délais. Le RA se compose selon l'action
 * (`rangsDActionDeRuneQuest.ts`) ; « Ordonner le round » pose le plateau, du RA 1 au
 * RA 12, la DEX la plus haute d'abord à égalité. Au-delà de 12, rien ne s'exécute dans
 * le round : le meneur reporte ou renonce, et sa décision est gardée.
 */
const classe = 'min-w-0 rounded border border-app-border/50 bg-app-bg px-2 py-1 text-ui-11 text-app-text';
const petit = 'w-12 rounded border border-app-border/50 bg-app-bg px-1 py-0.5 text-ui-11 text-app-text';
const AUTRE = '__autre';
const INTENTIONS = Object.keys(LIBELLES_DES_INTENTIONS) as Intention[];
const SORTS: Intention[] = ['magie-spirituelle', 'magie-runique', 'sorcellerie'];

interface ArmeLue { cle: string; nom: string; ra?: number; genre: 'melee' | 'distance' | 'bouclier' }

const nombre = (v: unknown): number | undefined => {
    if (v === undefined || v === null || String(v).trim() === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

/** Ce que la fiche dit d'un combattant : RA de DEX et de TAI, DEX, et ses armes nommées. */
function lireLeCombattant(c: Combatant): { fiche: FicheDuRang; armes: ArmeLue[] } {
    const s = useSessionOSStore.getState();
    const pilote = s.getActiveDriver();
    const rangs = pilote?.combat?.rangsDAction;
    const source = c.isPlayer ? s.players.flatMap(p => p.characters).find(x => x.id === c.sourcePlayerId) : s.entities.find(e => e.id === c.sourceEntityId);
    const { valeurs } = ficheDuCombattant(c, source, [...DEFAULT_SHEET_TEMPLATES, ...s.customSheetTemplates], pilote?.templateId);
    const v = (valeurs ?? {}) as Record<string, unknown>;
    const armes = (pilote?.jet?.runequest?.armes ?? []).flatMap(a => {
        const nom = String(v[a.nom ?? ''] ?? '').trim();
        return nom ? [{ cle: a.score, nom, ra: nombre(v[a.ra ?? '']), genre: a.genre }] : [];
    });
    return {
        fiche: { raDex: nombre(v[rangs?.raDex ?? '']), raTai: nombre(v[rangs?.raTai ?? '']), dex: nombre(v[rangs?.dex ?? '']) },
        armes,
    };
}

type Etat =
    | { quoi: 'declare'; rang: RangDAction; declaration: DeclarationDeRA }
    | { quoi: 'reporte'; ra: number; texte: string }
    | { quoi: 'en-cours'; texte: string }
    | { quoi: 'renonce' };

const PanneauDesRangsDAction: React.FC = () => {
    const combattants = useCombatStore(s => s.combatants);
    const round = useCombatStore(s => s.round);
    const setCurrentTurnTo = useCombatStore(s => s.setCurrentTurnTo);
    const { declarations, reports, renonces, declarer, reporter, renoncer, roundSuivant, clore } = useRangsDActionStore();

    if (combattants.length === 0) return null;

    const lus = Object.fromEntries(combattants.map(c => [c.id, lireLeCombattant(c)]));
    const defautDe = (c: Combatant): DeclarationDeRA => {
        const arme = lus[c.id].armes.find(a => a.genre !== 'bouclier') ?? lus[c.id].armes[0];
        return { ...DECLARATION_PAR_DEFAUT, intention: arme?.genre === 'distance' ? 'distance' : 'melee', arme: arme?.nom ?? '', raArme: arme?.ra };
    };
    const declaration = (c: Combatant) => ({ ...defautDe(c), ...declarations[c.id] });
    const etatDe = (c: Combatant): Etat => {
        if (renonces[c.id] === round) return { quoi: 'renonce' };
        const r = reports[c.id];
        if (r && r.round === round) return { quoi: 'reporte', ra: r.ra, texte: r.quoi };
        if (r && r.round > round) return { quoi: 'en-cours', texte: `${r.quoi} : agit au RA ${r.ra} du round ${r.round}` };
        const d = declaration(c);
        return { quoi: 'declare', rang: rangDAction(d, lus[c.id].fiche), declaration: d };
    };
    const etats = Object.fromEntries(combattants.map(c => [c.id, etatDe(c)]));
    const quoiDe = (c: Combatant) => {
        const d = declaration(c);
        return SORTS.includes(d.intention) ? `${d.arme || 'sort'}` : d.arme || LIBELLES_DES_INTENTIONS[d.intention];
    };
    const { ordre, horsDuRound } = ordonnerLesRangs(combattants.flatMap(c => {
        const e = etats[c.id];
        const dex = lus[c.id].fiche.dex;
        if (e.quoi === 'reporte') return [{ id: c.id, nom: `${c.name} — ${e.texte}`, ra: e.ra, dex }];
        if (e.quoi === 'declare') return [{ id: c.id, nom: `${c.name} — ${quoiDe(c)}`, ra: e.rang.ra, dex }];
        return [];
    }));

    const ordonner = () => {
        const initiatives = Object.fromEntries([...ordre, ...horsDuRound].map(r => [r.id, r.ra]));
        useCombatStore.getState().ordonnerLeRound([...ordre, ...horsDuRound].map(r => r.id), initiatives);
        const s = useCombatStore.getState();
        useJournalStore.getState().addEvent({
            type: 'COMBAT', title: 'Combat : rangs d’action',
            content: `Round ${round} — ${ordre.map(r => `RA ${r.ra} ${r.nom}${r.simultane ? ' (simultané)' : ''}`).join(' ; ') || 'personne ne déclare d’action'}.`
                + (horsDuRound.length ? ` Au-delà de 12, rien ce round : ${horsDuRound.map(r => `${r.nom} (RA ${r.ra})`).join(', ')}.` : ''),
            sceneId: s.sceneId ?? undefined, metadata: { round },
        });
    };

    return (
        <section aria-label="Rangs d’action de RuneQuest" className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-ui-10 font-black uppercase tracking-[0.2em] text-app-text/40">Round {round} · rangs d’action</p>
                <button onClick={clore} className="text-ui-9 font-bold uppercase tracking-widest text-app-text/30 hover:text-etat-danger transition-colors">Clore</button>
            </div>

            <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                    <button onClick={ordonner} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/40 text-accent text-ui-10 font-black uppercase tracking-widest hover:bg-accent/10">
                        <ListOrdered size={12} /> Ordonner le round
                    </button>
                    <button onClick={roundSuivant} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-app-border/40 text-app-text/70 text-ui-10 font-black uppercase tracking-widest hover:border-accent/50">
                        <SkipForward size={12} /> Round suivant
                    </button>
                </div>
                <p className="text-ui-10 text-app-text/60 leading-snug">1 le plus rapide, 12 le plus lent ; égalité : la DEX la plus haute ; même DEX : simultané (p. 192-194).</p>
            </div>

            <details open>
                <summary className="cursor-pointer text-ui-10 font-black uppercase tracking-widest text-app-text/50">Déclarations</summary>
                <div className="mt-2 space-y-2">
                    {combattants.map(c => {
                        const e = etats[c.id];
                        const d = declaration(c), armes = lus[c.id].armes, maj = (m: Partial<DeclarationDeRA>) => declarer(c.id, m, defautDe(c));
                        const sort = SORTS.includes(d.intention);
                        const armesDeLIntention = armes.filter(a => (d.intention === 'distance' ? a.genre === 'distance' : a.genre !== 'distance'));
                        return (
                            <div key={c.id} className="rounded-lg border border-app-border/30 p-2 space-y-1.5" aria-label={`Déclaration de ${c.name}`}>
                                <p className="text-xs font-bold text-app-text/80 truncate">{c.name}</p>
                                {e.quoi === 'renonce' && <p className="text-ui-10 text-app-text/50">Renonce à son action ce round.</p>}
                                {e.quoi === 'reporte' && <p className="text-ui-10 text-app-text/70">Reporté : {e.texte}, au RA {e.ra}.</p>}
                                {e.quoi === 'en-cours' && <p className="text-ui-10 text-app-text/70">{e.texte}.</p>}
                                {e.quoi === 'declare' && (<>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <select aria-label={`Action de ${c.name}`} className={classe} value={d.intention} onChange={ev => {
                                            const intention = ev.target.value as Intention;
                                            const arme = intention === 'melee' || intention === 'distance'
                                                ? armes.find(a => (intention === 'distance' ? a.genre === 'distance' : a.genre !== 'distance')) : undefined;
                                            maj({ intention, arme: arme?.nom ?? '', raArme: arme?.ra });
                                        }}>
                                            {INTENTIONS.map(k => <option key={k} value={k}>{LIBELLES_DES_INTENTIONS[k]}</option>)}
                                        </select>
                                        {(d.intention === 'melee' || d.intention === 'distance') && armesDeLIntention.length > 0 && (
                                            <select aria-label={`Arme de ${c.name}`} className={classe} value={armesDeLIntention.some(a => a.nom === d.arme) ? d.arme : AUTRE} onChange={ev => {
                                                const a = armesDeLIntention.find(x => x.nom === ev.target.value);
                                                maj(a ? { arme: a.nom, raArme: a.ra } : { arme: '', raArme: undefined });
                                            }}>
                                                {armesDeLIntention.map(a => <option key={a.cle} value={a.nom}>{a.nom}{a.ra !== undefined ? ` — RA ${a.ra}` : ''}</option>)}
                                                <option value={AUTRE}>Autre arme…</option>
                                            </select>
                                        )}
                                        {sort && <input aria-label={`Sort de ${c.name}`} placeholder="Sort" className={classe} value={d.arme} onChange={ev => maj({ arme: ev.target.value })} />}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-ui-10 text-app-text/60">
                                        {(d.intention === 'melee' || d.intention === 'distance') && !armesDeLIntention.some(a => a.nom === d.arme) && (
                                            <label className="flex items-center gap-1" title="Le RA de l'arme : DEX + TAI + allonge en mêlée, la DEX seule au tir (p. 193-194).">RA
                                                <input aria-label={`RA de l’arme de ${c.name}`} type="number" min={0} className={petit} value={d.raArme ?? ''}
                                                    onChange={ev => maj({ raArme: ev.target.value === '' ? undefined : Number(ev.target.value) })} /></label>
                                        )}
                                        {sort && (
                                            <label className="flex items-center gap-1" title={d.intention === 'sorcellerie' ? 'Points de magie au-delà du coût de base : +2 RA chacun (p. 386).' : 'Points de magie du sort, renforcement compris : +1 RA chacun au-delà du premier (p. 194).'}>
                                                {d.intention === 'sorcellerie' ? 'PM en plus' : 'PM'}
                                                <input aria-label={`PM de ${c.name}`} type="number" min={0} className={petit} value={d.pm} onChange={ev => maj({ pm: Number(ev.target.value) })} /></label>
                                        )}
                                        <label className="flex items-center gap-1" title="Préparer une arme ou un sort, recharger : 5 RA chacun (p. 194).">Prép. ×5
                                            <input aria-label={`Préparations de ${c.name}`} type="number" min={0} className={petit} value={d.preparations} onChange={ev => maj({ preparations: Number(ev.target.value) })} /></label>
                                        <label className="flex items-center gap-1" title="+1 RA par tranche de 3 m parcourue avant d'agir (p. 192).">Dépl. (3 m)
                                            <input aria-label={`Déplacement de ${c.name}`} type="number" min={0} className={petit} value={d.deplacement} onChange={ev => maj({ deplacement: Number(ev.target.value) })} /></label>
                                        <label className="flex items-center gap-1" title="Un ajustement que la meneuse décide.">±
                                            <input aria-label={`Ajustement de ${c.name}`} type="number" className={petit} value={d.ajustement} onChange={ev => maj({ ajustement: Number(ev.target.value) })} /></label>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-ui-10 text-app-text/60">
                                        <select aria-label={`Surprise de ${c.name}`} className={classe} value={d.surprise} onChange={ev => maj({ surprise: ev.target.value as Surprise })}>
                                            {(Object.keys(SURPRISES) as Surprise[]).map(k => <option key={k} value={k}>{SURPRISES[k].label}</option>)}
                                        </select>
                                        {(d.intention === 'magie-spirituelle' || d.intention === 'sorcellerie') && (
                                            <label className="flex items-center gap-1"><input type="checkbox" checked={d.armeVersSort} onChange={ev => maj({ armeVersSort: ev.target.checked })} />Passe d’une arme au sort (+5)</label>
                                        )}
                                    </div>
                                    <p data-rang-runequest className={`text-ui-10 font-bold ${e.rang.auDelaDe12 ? 'text-etat-danger' : 'text-app-text/80'}`}>
                                        {e.rang.auDelaDe12
                                            ? `RA ${e.rang.ra} : au-delà de 12, rien ce round (p. 194)${e.rang.seReporteDOffice ? ' — le sort se poursuit' : ''}`
                                            : `RA ${e.rang.ra} = ${e.rang.detail}`}
                                    </p>
                                    {e.rang.remarques.map((m, i) => <p key={i} className="text-ui-10 text-app-text/50 leading-snug">{m}</p>)}
                                    {e.rang.auDelaDe12 && (() => {
                                        const r = report(e.rang.ra);
                                        return (
                                            <div className="flex flex-wrap gap-1.5">
                                                <button className="px-2 py-0.5 rounded border border-app-border/40 text-ui-10 hover:border-accent/50"
                                                    onClick={() => reporter(c.id, { ra: r.ra, round: round + r.rounds, quoi: quoiDe(c) })}>
                                                    {e.rang.seReporteDOffice ? 'Poursuivre' : 'Reporter'} (RA {r.ra} au round {round + r.rounds})
                                                </button>
                                                <button className="px-2 py-0.5 rounded border border-etat-danger/40 text-etat-danger text-ui-10" onClick={() => renoncer(c.id, round)}>Renoncer</button>
                                            </div>
                                        );
                                    })()}
                                </>)}
                            </div>
                        );
                    })}
                </div>
            </details>

            <div className="space-y-1" aria-label="Ordre du round">
                <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/50">Ordre du round</p>
                {ordre.map(r => (
                    <button key={r.id} onClick={() => setCurrentTurnTo(r.id)}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded border border-app-border/20 hover:bg-accent/5 text-left">
                        <span className="text-xs font-bold text-app-text/80 truncate">{r.nom}</span>
                        {r.simultane && <span className="rounded border border-app-border/40 px-1 text-ui-9 text-app-text/50">simultané</span>}
                        <span className="ml-auto font-mono text-xs text-app-text/70">{r.ra}</span>
                    </button>
                ))}
                {horsDuRound.map(r => (
                    <p key={r.id} className="flex items-center gap-2 px-2 py-1 text-xs italic text-app-text/40">
                        <span className="truncate">{r.nom} — au-delà de 12</span><span className="ml-auto font-mono">{r.ra}</span>
                    </p>
                ))}
                {combattants.filter(c => etats[c.id].quoi === 'renonce' || etats[c.id].quoi === 'en-cours').map(c => (
                    <p key={c.id} className="px-2 py-1 text-xs italic text-app-text/40 truncate">
                        {c.name} — {etats[c.id].quoi === 'renonce' ? 'renonce' : 'sort en cours'}
                    </p>
                ))}
            </div>
        </section>
    );
};

export default PanneauDesRangsDAction;
