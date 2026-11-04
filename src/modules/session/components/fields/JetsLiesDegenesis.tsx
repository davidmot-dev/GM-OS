import React, { useState } from 'react';
import { lancerDegenesis, reserveDeDegenesis, type JetDeDegenesis, type RegleDeDegenesis } from '../../../dice/systemes/degenesis';
import {
    actionAtteinte, cumulDeLAction, issueDeLaConfrontation, texteDeLaCombinaison, texteDuVersement, versementDuJet,
    DIFFICULTE_DE_L_AIDE,
} from '../../../dice/systemes/jetsLiesDeDegenesis';
import { useJetsLiesDeDegenesisStore, type AideEnAttente, type ReportEnAttente } from '../../../combat/useJetsLiesDeDegenesisStore';

/**
 * **Les jets liés de Degenesis** — DEG-A4, 04/11/2026, à la demande de David (« on commence
 * DEG-A3 et DEG-A4 ») ; choix du même jour : aide et action complexe, GM-OS lance la réserve
 * de l'adversaire. Au meneur seulement : ce qui passe d'un jet à l'autre vit chez lui
 * (`useJetsLiesDeDegenesisStore`).
 *
 * - **Préparer** : l'aide reçue (+nD) et les déclencheurs reportés d'un premier test, cochés
 *   d'office et pris une fois ; « Ce jet aide… » ajoute 1 à la difficulté (p. 20-21).
 * - **Résultat** : la combinaison dite ; la confrontation, adversaire lancé depuis sa fiche ou
 *   saisi ; l'action complexe, où l'équipe verse succès et déclencheurs ; « Enchaîner un
 *   second test » (p. 19-21).
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (v: unknown) => Math.max(0, Math.trunc(Number(v) || 0));

/** Un personnage que l'on peut aider ou affronter : sa fiche se lit à la demande. */
export interface PersonnageLie { cle: string; nom: string; valeurs: () => Record<string, unknown> }

export const PreparationDesJetsLies: React.FC<{
    aides: AideEnAttente[];
    prendreLesAides: boolean;
    setPrendreLesAides: (oui: boolean) => void;
    report?: ReportEnAttente;
    prendreLeReport: boolean;
    setPrendreLeReport: (oui: boolean) => void;
    /** L'identifiant du personnage aidé ; vide : ce jet n'aide personne. */
    aideVers: string;
    setAideVers: (cle: string) => void;
    candidats: PersonnageLie[];
}> = ({ aides, prendreLesAides, setPrendreLesAides, report, prendreLeReport, setPrendreLeReport, aideVers, setAideVers, candidats }) => {
    const desDAide = aides.reduce((t, a) => t + a.des, 0);
    if (!aides.length && !report && !candidats.length) return null;
    return (
        <div data-jets-lies-degenesis className="flex flex-col gap-1 rounded-md border border-app-border/40 px-2 py-1 text-xs">
            <span className={etiquette}>Jets liés</span>
            {aides.length > 0 && (
                <label className="flex items-center gap-1" data-aide-recue title="Les déclencheurs d’un assistant qui a réussi deviennent des dés de bonus (p. 21).">
                    <input type="checkbox" checked={prendreLesAides} onChange={e => setPrendreLesAides(e.target.checked)} />
                    Aide de {aides.map(a => `${a.de} (+${a.des}D)`).join(', ')} : +{desDAide}D
                </label>
            )}
            {report && (
                <label className="flex items-center gap-1" data-report-recu title="Combinaison de tests : comptés seulement si ce second test réussit (p. 20).">
                    <input type="checkbox" checked={prendreLeReport} onChange={e => setPrendreLeReport(e.target.checked)} />
                    Déclencheurs reportés ({report.source}) : {report.declencheurs}, comptés si ce jet réussit
                </label>
            )}
            {candidats.length > 0 && (
                <div className="flex flex-wrap items-center gap-1" title="L’assistant fait le même test, difficulté +1 ; ses déclencheurs vont à l’aidé (p. 21).">
                    <label className="flex items-center gap-1">
                        <input type="checkbox" checked={!!aideVers} onChange={e => setAideVers(e.target.checked ? candidats[0].cle : '')} />
                        Ce jet aide un autre personnage (difficulté +{DIFFICULTE_DE_L_AIDE})
                    </label>
                    {aideVers && (
                        <select aria-label="Personnage aidé" className={champ} value={aideVers} onChange={e => setAideVers(e.target.value)}>
                            {candidats.map(c => <option key={c.cle} value={c.cle}>{c.nom}</option>)}
                        </select>
                    )}
                </div>
            )}
        </div>
    );
};

/** Ce que le lancer a fait des jets liés, pour le dire au résultat. */
export interface LiensDuLancer {
    /** L'aide mise de côté pour un autre (son identifiant d'attente), ou ratée. */
    aide?: { id?: string; pourNom: string; des: number };
}

export const ResultatDesJetsLies: React.FC<{
    regle: RegleDeDegenesis;
    jet: JetDeDegenesis;
    nom: string;
    personnageId?: string;
    /** Ce que ce jet lance : « Agilité + Navigation ». */
    source: string;
    liens: LiensDuLancer;
    adversaires: PersonnageLie[];
    libelleDuChamp: (champ: string) => string;
    de: () => number;
    consigner: (ligne: string) => void;
}> = ({ regle, jet, nom, personnageId, source, liens, adversaires, libelleDuChamp, de, consigner }) => {
    const d = jet.degenesis;
    const store = useJetsLiesDeDegenesisStore();
    const reportEnCours = personnageId ? store.reports[personnageId] : undefined;
    const [aideRetiree, setAideRetiree] = useState(false);
    const [verse, setVerse] = useState(false);
    const [nouvelle, setNouvelle] = useState({ nom: '', objectif: '10' });

    // Confrontation (p. 19-20)
    const [adversaireCle, setAdversaireCle] = useState(adversaires[0]?.cle ?? '');
    const reserves = (regle.reserves ?? []).flatMap(r => r.competences.map(c => ({ cle: `${r.attribut}|${c}`, attribut: r.attribut, competence: c })));
    const [reserveCle, setReserveCle] = useState(reserves[0]?.cle ?? '');
    const [adverse, setAdverse] = useState({ succes: '', six: '' });
    const [initiative, setInitiative] = useState<'' | 'a' | 'b'>('');
    const adversaire = adversaires.find(a => a.cle === adversaireCle);
    const ficheAdverse = adversaire?.valeurs() ?? {};
    const reserveChoisie = reserves.find(r => r.cle === reserveCle);
    const traumaAdverses = regle.traumatismes ? entier(ficheAdverse[regle.traumatismes]) : 0;
    const vaAdverse = reserveChoisie ? reserveDeDegenesis(entier(ficheAdverse[reserveChoisie.attribut]) + entier(ficheAdverse[reserveChoisie.competence]), {}, traumaAdverses) : undefined;
    const nomAdverse = adversaire?.nom ?? 'L’adversaire';
    const issue = adverse.succes.trim() === '' ? null : issueDeLaConfrontation(
        { nom, succes: d.succes, six: d.six },
        { nom: nomAdverse, succes: entier(adverse.succes), six: entier(adverse.six) },
        initiative || undefined,
    );
    const lancerLAdversaire = () => {
        if (!vaAdverse || !reserveChoisie) return;
        const r = lancerDegenesis(vaAdverse, 0, de);
        setAdverse({ succes: String(r.degenesis.succes), six: String(r.degenesis.six) });
        consigner(`Confrontation — ${nomAdverse}, ${libelleDuChamp(reserveChoisie.attribut)} + ${libelleDuChamp(reserveChoisie.competence)} (${vaAdverse.des} dés`
            + `${traumaAdverses ? `, −${traumaAdverses}D de Traumatismes` : ''}) : ${r.degenesis.des.join(' ')} → ${r.degenesis.succes} succès, ${r.degenesis.six} six.`);
    };

    // Action complexe (p. 21)
    const action = store.actions.find(a => a.id === store.actionCourante) ?? store.actions[0];
    const versement = versementDuJet(nom, jet);
    const verserLeJet = () => {
        if (!action || verse) return;
        const apres = store.verser(action.id, versement);
        if (apres) consigner(texteDuVersement(apres, versement));
        setVerse(true);
    };

    const combinaison = texteDeLaCombinaison(jet);
    const peutEnchainer = d.bilan === 'reussite' && d.declencheurs > 0 && !!personnageId;

    return (
        <div data-resultat-jets-lies className="flex w-full flex-col gap-2 border-t border-app-border/30 pt-2 text-xs">
            {combinaison && (
                <div data-combinaison-degenesis><span className={etiquette}>Combinaison</span> <span className={d.reportesPerdus ? 'text-etat-danger' : ''}>{combinaison}</span></div>
            )}
            {liens.aide && (
                <div data-aide-donnee className="flex flex-wrap items-center gap-2">
                    <span className={etiquette}>Aide</span>
                    {liens.aide.des > 0 && !aideRetiree
                        ? <>
                            <span>+{liens.aide.des}D mis de côté pour le prochain jet de {liens.aide.pourNom} (p. 21).</span>
                            <button type="button" className={bouton} onClick={() => {
                                if (liens.aide?.id) store.retirerUneAide(liens.aide.id);
                                setAideRetiree(true);
                                consigner(`Aide de ${nom} à ${liens.aide!.pourNom} retirée.`);
                            }}>Retirer</button>
                        </>
                        : <span className="text-app-text/60">{aideRetiree ? 'Aide retirée.' : `Aucun dé pour ${liens.aide.pourNom} : il faut réussir et obtenir des déclencheurs (p. 21).`}</span>}
                </div>
            )}

            <details data-confrontation-degenesis className="flex flex-col gap-1">
                <summary className={`${etiquette} cursor-pointer`}>Confrontation</summary>
                <p className="text-app-text/60">La difficulté de chacun vaut les succès de l’autre ; à égalité, les six départagent (p. 19-20).</p>
                <div className="flex flex-wrap items-center gap-1">
                    {adversaires.length > 0 && (
                        <select aria-label="Adversaire" className={champ} value={adversaireCle} onChange={e => { setAdversaireCle(e.target.value); setAdverse({ succes: '', six: '' }); }}>
                            {adversaires.map(a => <option key={a.cle} value={a.cle}>{a.nom}</option>)}
                        </select>
                    )}
                    {adversaire && reserves.length > 0 && (
                        <>
                            <select aria-label="Réserve de l’adversaire" className={champ} value={reserveCle} onChange={e => setReserveCle(e.target.value)}>
                                {(regle.reserves ?? []).map(r => (
                                    <optgroup key={r.attribut} label={libelleDuChamp(r.attribut)}>
                                        {r.competences.map(c => {
                                            const n = entier(ficheAdverse[r.attribut]) + entier(ficheAdverse[c]);
                                            return <option key={c} value={`${r.attribut}|${c}`}>{libelleDuChamp(r.attribut)} + {libelleDuChamp(c)} ({n}D)</option>;
                                        })}
                                    </optgroup>
                                ))}
                            </select>
                            <button type="button" className={bouton} onClick={lancerLAdversaire}>Lancer sa réserve</button>
                        </>
                    )}
                    <label className="flex items-center gap-1">succès
                        <input aria-label="Succès de l’adversaire" type="number" min={0} className={`w-12 ${champ}`} value={adverse.succes} onChange={e => setAdverse(a => ({ ...a, succes: e.target.value }))} />
                    </label>
                    <label className="flex items-center gap-1">six
                        <input aria-label="Six de l’adversaire" type="number" min={0} className={`w-12 ${champ}`} value={adverse.six} onChange={e => setAdverse(a => ({ ...a, six: e.target.value }))} />
                    </label>
                    <select aria-label="Qui a pris l’initiative" className={champ} value={initiative} onChange={e => setInitiative(e.target.value as '' | 'a' | 'b')}
                        title="Quand il faut un vainqueur, celui qui a pris l’initiative de l’action perd l’égalité (p. 20).">
                        <option value="">égalité : statu quo</option>
                        <option value="a">{nom} a pris l’initiative</option>
                        <option value="b">{nomAdverse} a pris l’initiative</option>
                    </select>
                </div>
                {issue && (
                    <div data-issue-confrontation className={`rounded-md border px-2 py-1 font-bold ${issue.gagnant === 'a' ? 'border-etat-succes/50 text-etat-succes' : issue.gagnant === 'b' ? 'border-etat-danger/50 text-etat-danger' : 'border-app-border/40'}`}>
                        {issue.texte}
                    </div>
                )}
            </details>

            <details data-action-complexe-degenesis open={!!action}>
                <summary className={`${etiquette} cursor-pointer`}>Action complexe</summary>
                {action ? (
                    <div className="flex flex-col gap-1">
                        {store.actions.length > 1 && (
                            <select aria-label="Action complexe" className={champ} value={action.id} onChange={e => store.choisirLAction(e.target.value)}>
                                {store.actions.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                            </select>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{action.nom}</span>
                            <div className="h-1.5 flex-1 rounded bg-app-border/30">
                                <div className={`h-1.5 rounded ${actionAtteinte(action) ? 'bg-etat-succes' : 'bg-accent'}`} style={{ width: `${Math.min(100, (cumulDeLAction(action) / action.objectif) * 100)}%` }} />
                            </div>
                            <span className="font-mono font-black" data-cumul-action>{cumulDeLAction(action)} / {action.objectif}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                            <button type="button" className={bouton} disabled={verse || versement.total === 0} onClick={verserLeJet}
                                title="Les succès, plus un par déclencheur (p. 21) ; en coopération, chacun verse les siens.">
                                {verse ? 'Versé' : `Verser ${versement.succes} succès${versement.six ? ` + ${versement.six} déclencheur${versement.six > 1 ? 's' : ''}` : ''} (${versement.total})`}
                            </button>
                            {actionAtteinte(action) && <span className="font-bold text-etat-succes">Objectif atteint.</span>}
                            <button type="button" className={bouton} onClick={() => { store.clore(action.id); consigner(`Action complexe « ${action.nom} » close : ${cumulDeLAction(action)} / ${action.objectif}.`); }}>Clore</button>
                        </div>
                    </div>
                ) : <p className="text-app-text/60">Aucune action complexe ouverte.</p>}
                <div className="mt-1 flex flex-wrap items-center gap-1">
                    <input aria-label="Nom de l’action complexe" placeholder="Nouvelle action complexe…" className={champ} value={nouvelle.nom} onChange={e => setNouvelle(n => ({ ...n, nom: e.target.value }))} />
                    <label className="flex items-center gap-1">objectif
                        <input aria-label="Objectif de succès" type="number" min={1} className={`w-14 ${champ}`} value={nouvelle.objectif} onChange={e => setNouvelle(n => ({ ...n, objectif: e.target.value }))} />
                    </label>
                    <button type="button" className={bouton} disabled={!nouvelle.nom.trim() || entier(nouvelle.objectif) < 1} onClick={() => {
                        store.ouvrirUneAction(nouvelle.nom.trim(), entier(nouvelle.objectif));
                        consigner(`Action complexe « ${nouvelle.nom.trim()} » : ${entier(nouvelle.objectif)} succès à réunir (p. 21).`);
                        setNouvelle({ nom: '', objectif: '10' });
                        setVerse(false);
                    }}>Ouvrir</button>
                </div>
            </details>

            {peutEnchainer && (
                <div data-enchainer-degenesis className="flex flex-wrap items-center gap-2">
                    {reportEnCours
                        ? <>
                            <span>{reportEnCours.declencheurs} déclencheur{reportEnCours.declencheurs > 1 ? 's' : ''} reporté{reportEnCours.declencheurs > 1 ? 's' : ''} au prochain test de {nom} (p. 20).</span>
                            <button type="button" className={bouton} onClick={() => { store.oublierLeReport(personnageId!); consigner(`Combinaison annulée pour ${nom}.`); }}>Annuler</button>
                        </>
                        : <button type="button" className={bouton} title="Combinaison de tests : le second ne se tente qu’après cette réussite ; ces déclencheurs s’y ajoutent s’il réussit (p. 20)."
                            onClick={() => {
                                store.reporter(personnageId!, { declencheurs: d.declencheurs, source });
                                consigner(`${nom} enchaîne un second test : ${d.declencheurs} déclencheur${d.declencheurs > 1 ? 's' : ''} de ${source} reporté${d.declencheurs > 1 ? 's' : ''} (p. 20).`);
                            }}>
                            Enchaîner un second test (reporte {d.declencheurs} déclencheur{d.declencheurs > 1 ? 's' : ''})
                        </button>}
                </div>
            )}
        </div>
    );
};
