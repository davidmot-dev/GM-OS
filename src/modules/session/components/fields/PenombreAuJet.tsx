import React, { useState } from 'react';
import {
    DIFFICULTES_DE_PENOMBRE, LIBELLES_DES_ETATS, LIBELLES_DES_ISSUES, direLIncident, direLIssue,
    type ChoixDePenombre, type Conscience, type EffetMagiqueDePenombre, type IssueDePenombre, type JetDePenombre,
    type ReserveDePenombre, type Timbre,
} from '../../../dice/systemes/penombre';

/**
 * **Le jet de Pénombre** — 22/11/2026, à la demande de David (« oui je joue à Pénombre, fais
 * tout dans l'ordre »). Avant de lancer : la difficulté du livre, les atouts payés, le D20
 * merveilleux, l'action collégiale, l'effet magique et qui paie. Après : les succès dé par dé,
 * la relance, les trois issues d'un jet insuffisant et les quatre conséquences supplémentaires.
 * Rien ne s'écrit sans un clic.
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };
const jetons = (n: number) => `${n} jeton${n > 1 ? 's' : ''}`;

const EFFET_PAR_DEFAUT: EffetMagiqueDePenombre = { niveau: 1, maitrise: 1, cible: 'mortel', distance: 'proche', prerequis: 'action', principal: true };

export const PreparationPenombre: React.FC<{
    choix: ChoixDePenombre;
    setChoix: (maj: (c: ChoixDePenombre) => ChoixDePenombre) => void;
    /** La réserve composée d'après la fiche et les choix (`jet.penombre`). */
    reserve?: ReserveDePenombre;
    /** Les atouts que l'on peut payer en plus : ceux qui ont un niveau, hors l'atout gratuit. */
    atouts: { champ: string; label: string; niveau: number }[];
    conscience: Conscience | null;
    /** Les jetons actifs de la réserve collégiale ; `undefined` : la campagne n'en a pas. */
    collegiale?: number;
    /**
     * Le recompte de la réserve collégiale, chez le meneur : sa taille, celle que demandent les timbres
     * du groupe (10, 5 ou 0, p. 24), et le geste. Absent sur la tablette.
     */
    recompte?: { taille: number; attendue: number; recompter: () => void };
}> = ({ choix, setChoix, reserve, atouts, conscience, collegiale, recompte }) => {
    const magie = choix.magie;
    const regler = (maj: Partial<EffetMagiqueDePenombre>) => setChoix(c => ({ ...c, magie: { ...(c.magie ?? EFFET_PAR_DEFAUT), ...maj } }));
    const valeursDeLEchelle: number[] = DIFFICULTES_DE_PENOMBRE.map(d => d.valeur);
    return (
        <div data-preparation-penombre className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"><span className={etiquette}>Difficulté</span>
                    <select aria-label="Difficulté" value={choix.difficulte} className={champ}
                        onChange={e => setChoix(c => ({ ...c, difficulte: entier(e.target.value) }))}>
                        {/* Une prolongation fixe la difficulté aux succès manquants, hors de l'échelle (p. 33). */}
                        {!valeursDeLEchelle.includes(choix.difficulte) && <option value={choix.difficulte}>{choix.difficulte} (prolongation)</option>}
                        {DIFFICULTES_DE_PENOMBRE.map(d => <option key={d.valeur} value={d.valeur}>{d.valeur} — {d.label}</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-1" title="Chaque élément avantageux diminue la difficulté de 1 (p. 30).">
                    Avantages
                    <input aria-label="Éléments avantageux" type="number" min={0} value={choix.avantages} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, avantages: Math.max(0, entier(e.target.value)) }))} />
                </label>
                <label className="flex items-center gap-1" title="Chaque élément désavantageux augmente la difficulté de 1 (p. 30).">
                    Désavantages
                    <input aria-label="Éléments désavantageux" type="number" min={0} value={choix.desavantages} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, desavantages: Math.max(0, entier(e.target.value)) }))} />
                </label>
                <label className="flex items-center gap-1" title="Une modification d'une action précédente, une riposte (+1), les succès des autres participants d'une action collégiale (p. 34, 44-45).">
                    Succès ajoutés
                    <input aria-label="Succès ajoutés" type="number" value={choix.succesEnPlus} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, succesEnPlus: entier(e.target.value) }))} />
                </label>
            </div>
            <div className="flex flex-wrap items-center gap-3" data-depenses-penombre>
                <span className={etiquette}>1 jeton chacun</span>
                <label className="flex items-center gap-1" title="Le D20 merveilleux remplace le dé harmonique (p. 31).">
                    <input type="checkbox" checked={choix.merveilles} onChange={e => setChoix(c => ({ ...c, merveilles: e.target.checked }))} />
                    Tenter des merveilles
                </label>
                <label className="flex items-center gap-1" title="Chaque participant lance ses dés ; les succès s'additionnent, un seul atout pour tous (p. 29).">
                    <input type="checkbox" checked={choix.collegiale} onChange={e => setChoix(c => ({ ...c, collegiale: e.target.checked }))} />
                    Action collégiale
                </label>
                <label className="flex items-center gap-1" title="1 jeton, plus 1 par niveau de maîtrise manquant ; le prérequis a été mis en scène (p. 29).">
                    <input type="checkbox" checked={!!magie} onChange={e => setChoix(c => ({ ...c, magie: e.target.checked ? EFFET_PAR_DEFAUT : null }))} />
                    Effet magique
                </label>
                {atouts.map(a => (
                    <label key={a.champ} className="flex items-center gap-1" title="Mobiliser un atout supplémentaire : autant de D6 que son niveau (p. 31).">
                        <input type="checkbox" checked={choix.atoutsEnPlus.includes(a.champ)}
                            onChange={e => setChoix(c => ({ ...c, atoutsEnPlus: e.target.checked ? [...c.atoutsEnPlus, a.champ] : c.atoutsEnPlus.filter(x => x !== a.champ) }))} />
                        + {a.label} ({a.niveau}D6)
                    </label>
                ))}
            </div>
            {magie && (
                <div className="flex flex-wrap items-center gap-3" data-magie-penombre>
                    <label className="flex items-center gap-1">Niveau de l’effet
                        <input aria-label="Niveau de l'effet" type="number" min={1} max={5} value={magie.niveau} className={`w-12 ${champ}`}
                            onChange={e => regler({ niveau: Math.min(5, Math.max(1, entier(e.target.value))) })} />
                    </label>
                    <label className="flex items-center gap-1">Maîtrise
                        <input aria-label="Niveau de maîtrise" type="number" min={0} max={5} value={magie.maitrise} className={`w-12 ${champ}`}
                            onChange={e => regler({ maitrise: Math.min(5, Math.max(0, entier(e.target.value))) })} />
                    </label>
                    <select aria-label="Cible" value={magie.cible} className={champ} onChange={e => regler({ cible: e.target.value as EffetMagiqueDePenombre['cible'] })}>
                        <option value="mortel">Objet ou mortel (+0)</option>
                        <option value="groupe">Groupe ou bâtiment modeste (+ niveau)</option>
                        <option value="foule">Foule, monument ou village (+ double)</option>
                    </select>
                    <select aria-label="Distance" value={magie.distance} className={champ} onChange={e => regler({ distance: e.target.value as EffetMagiqueDePenombre['distance'] })}>
                        <option value="proche">Proche (+0)</option>
                        <option value="lointain">Lointain (+2)</option>
                        <option value="hors-champ">Hors champ (+5)</option>
                    </select>
                    <select aria-label="Temps du prérequis" value={magie.prerequis} className={champ} onChange={e => regler({ prerequis: e.target.value as EffetMagiqueDePenombre['prerequis'] })}>
                        <option value="action">Prérequis : 1 action (+0)</option>
                        <option value="tour">1 tour (−1)</option>
                        <option value="deux-tours">2 tours (−2)</option>
                        <option value="rituel">Grand et long rituel (−5)</option>
                    </select>
                    <label className="flex items-center gap-1" title="Quand l'effet est l'objectif principal, sa difficulté remplace celle de l'action (p. 30).">
                        <input type="checkbox" checked={magie.principal} onChange={e => regler({ principal: e.target.checked })} />
                        Objectif principal
                    </label>
                </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
                <span className={etiquette}>Payer avec</span>
                <label className="flex items-center gap-1">
                    <input type="radio" name="payeur-penombre" checked={choix.payeur === 'conscience'} onChange={() => setChoix(c => ({ ...c, payeur: 'conscience' }))} />
                    la conscience{conscience ? ` (${conscience.actifs} actif${conscience.actifs > 1 ? 's' : ''} sur ${conscience.restants})` : ''}
                </label>
                <label className="flex items-center gap-1">
                    <input type="radio" name="payeur-penombre" disabled={collegiale === undefined} checked={choix.payeur === 'collegiale'}
                        onChange={() => setChoix(c => ({ ...c, payeur: 'collegiale' }))} />
                    la réserve collégiale{collegiale !== undefined ? ` (${collegiale})` : ''}
                </label>
            </div>
            {recompte && (
                <div className="flex flex-wrap items-center gap-2" data-recompte-penombre>
                    <span className={recompte.attendue !== recompte.taille ? 'text-etat-danger' : 'text-app-text/60'}>
                        Réserve collégiale de {recompte.taille} jeton{recompte.taille > 1 ? 's' : ''}
                        {recompte.attendue !== recompte.taille
                            ? ` ; les timbres du groupe en demandent ${recompte.attendue} (10, 5 ou 0, p. 24).`
                            : ', conforme aux timbres du groupe.'}
                    </span>
                    <button type="button" className={bouton} disabled={recompte.attendue === recompte.taille}
                        onClick={recompte.recompter}>Recompter la réserve collégiale</button>
                </div>
            )}
            {reserve && (
                <span data-composition-penombre className="text-app-text/60">
                    {reserve.des.length ? decrireLesDes(reserve) : 'Aucun dé'} ; difficulté {reserve.difficulte}
                    {reserve.cout ? ` ; ${jetons(reserve.cout)} au lancer (${reserve.detailDuCout.join(', ')})` : ' ; aucun jeton'}
                    {reserve.etat ? ` ; ${LIBELLES_DES_ETATS[reserve.etat].toLowerCase()}` : ''}.
                    {' '}Un succès par tranche de 4 sur chaque dé (p. 31). À la place d’une dépense, le joueur peut créer une complication (p. 25).
                </span>
            )}
            {reserve && reserve.cout > 0 && choix.payeur === 'collegiale' && (collegiale ?? 0) < reserve.cout && (
                <span data-collegiale-insuffisante className="text-etat-danger">
                    La réserve collégiale n’a que {collegiale ?? 0} jeton{(collegiale ?? 0) > 1 ? 's' : ''} actif{(collegiale ?? 0) > 1 ? 's' : ''} : payer avec la conscience, ou retirer une dépense.
                </span>
            )}
        </div>
    );
};

/** « 1D8 + 2D6 », « 1D20 + 3D6 ». */
function decrireLesDes(reserve: ReserveDePenombre): string {
    const compte = new Map<number, number>();
    for (const d of reserve.des) compte.set(d.faces, (compte.get(d.faces) ?? 0) + 1);
    return [...compte.entries()].sort((a, b) => b[0] - a[0]).map(([f, n]) => `${n}D${f}`).join(' + ');
}

/** Ce qui a déjà été appliqué pour ce lancer : rien ne se paie ni ne s'écrit deux fois. */
export interface FaitsDePenombre {
    fausseNote?: boolean;
    envolee?: boolean;
    merveille?: boolean;
    issue?: IssueDePenombre;
}

export const SuitesPenombre: React.FC<{
    jet: JetDePenombre;
    faits: FaitsDePenombre;
    conscience: Conscience | null;
    collegiale?: number;
    payeur: ChoixDePenombre['payeur'];
    timbre: Timbre;
    pestiferee: boolean;
    /** `undefined` : le panneau n'écrit pas sur la fiche (personnage sans fiche). */
    relancer?: (rangs: number[]) => void;
    perdreLaFausseNote?: () => void;
    reactiver?: (ou: 'conscience' | 'collegiale') => void;
    appliquerLaMerveille?: () => void;
    choisirLIssue?: (issue: IssueDePenombre) => void;
}> = ({ jet, faits, conscience, collegiale, payeur, timbre, pestiferee, relancer, perdreLaFausseNote, reactiver, appliquerLaMerveille, choisirLIssue }) => {
    const p = jet.penombre;
    const [rangs, setRangs] = useState<number[]>([]);
    const actifs = payeur === 'conscience' ? conscience?.actifs ?? 0 : collegiale ?? 0;
    const peutPayer = (n: number) => actifs >= n && !(payeur === 'conscience' && conscience && conscience.actifs <= 0);
    const ou = payeur === 'conscience' ? 'sur la conscience' : 'sur la réserve collégiale';
    return (
        <div data-suites-penombre className="flex w-full flex-col gap-2 text-xs">
            <p data-des-penombre className="text-app-text/70">
                {p.des.map(d => `${d.label} ${d.val} → ${d.succes}`).join(' · ')}
                {p.succesEnPlus ? ` · ajoutés ${p.succesEnPlus > 0 ? '+' : ''}${p.succesEnPlus}` : ''}
                {' '}= <strong>{p.succes} succès</strong> pour une difficulté de {p.difficulte}{p.relances ? ` (relancé ${p.relances} fois)` : ''}.
            </p>
            {relancer && (
                <div className="flex flex-wrap items-center gap-2" data-relance-penombre>
                    <span className="text-app-text/60">Relancer :</span>
                    {p.des.map((d, i) => (
                        <label key={i} className="flex items-center gap-1">
                            <input type="checkbox" checked={rangs.includes(i)}
                                onChange={e => setRangs(r => (e.target.checked ? [...r, i] : r.filter(x => x !== i)))} />
                            {d.role === 'atout' ? 'D6' : `D${d.faces}`} {d.val}
                        </label>
                    ))}
                    <button type="button" className={bouton} disabled={rangs.length === 0 || !peutPayer(1)}
                        title="Tout ou partie des dés, pour 1 jeton ; les conséquences déjà obtenues restent acquises (p. 31, 34)."
                        onClick={() => { relancer(rangs); setRangs([]); }}>Relancer (1 jeton {ou})</button>
                </div>
            )}
            {!p.reussite && choisirLIssue && (
                <div className="flex flex-col gap-1" data-issues-penombre>
                    <span className="text-app-text/60">Succès insuffisants : le Psycholune choisit, ou laisse le joueur décider (p. 32).</span>
                    {faits.issue ? (
                        <span className="font-bold">{LIBELLES_DES_ISSUES[faits.issue]} : {direLIssue(faits.issue, p.manquants)}</span>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <button type="button" className={bouton} disabled={!peutPayer(p.manquants)} title={direLIssue('mitigee', p.manquants)}
                                onClick={() => choisirLIssue('mitigee')}>Réussite mitigée ({jetons(p.manquants)} {ou})</button>
                            <button type="button" className={bouton} disabled={!conscience} title={direLIssue('prolongation', p.manquants)}
                                onClick={() => choisirLIssue('prolongation')}>Prolongation (−{jetons(p.manquants)} conscience)</button>
                            <button type="button" className={bouton} title={direLIssue('echec', p.manquants)}
                                onClick={() => choisirLIssue('echec')}>Échec</button>
                        </div>
                    )}
                </div>
            )}
            {p.consequences.fausseNote && (
                <div className="flex flex-wrap items-center gap-2" data-fausse-note-penombre>
                    <span>Fausse note : 1 sur le dé harmonique, l’Éminence grise perd 1 jeton ; le Psycholune met en scène son erreur (p. 34).</span>
                    {perdreLaFausseNote && <button type="button" className={bouton} disabled={faits.fausseNote || !conscience}
                        onClick={perdreLaFausseNote}>{faits.fausseNote ? 'Jeton perdu' : 'Perdre 1 jeton'}</button>}
                </div>
            )}
            {p.consequences.envolee && (
                <div className="flex flex-wrap items-center gap-2" data-envolee-penombre>
                    <span>Envolée : score maximal du dé harmonique, un jeton dépensé se réactive, même sans réussite (p. 34).</span>
                    {reactiver && !faits.envolee && <>
                        <button type="button" className={bouton} disabled={!conscience || conscience.actifs >= conscience.restants}
                            onClick={() => reactiver('conscience')}>Réactiver 1 jeton conscience</button>
                        <button type="button" className={bouton} disabled={collegiale === undefined || timbre === 'dissonant'}
                            title={timbre === 'dissonant' ? 'Une dissonante ne réactive pas de jeton collégial (p. 103).' : undefined}
                            onClick={() => reactiver('collegiale')}>Réactiver 1 jeton collégial</button>
                    </>}
                    {faits.envolee && <span className="font-bold">Jeton réactivé.</span>}
                </div>
            )}
            {p.consequences.incident && <p data-incident-penombre>{direLIncident(timbre, pestiferee)}</p>}
            {p.consequences.merveille && (
                <div className="flex flex-wrap items-center gap-2" data-merveille-penombre>
                    <span>Merveille : la scène s’embellit{p.estLaCle ? ' ; l’harmonique est la clé : un pouvoir supplémentaire' : ''} (p. 36-37).</span>
                    {appliquerLaMerveille && <button type="button" className={bouton} disabled={faits.merveille}
                        onClick={appliquerLaMerveille}>{faits.merveille ? 'Partition mise à jour' : 'Cocher la partition'}</button>}
                </div>
            )}
        </div>
    );
};
