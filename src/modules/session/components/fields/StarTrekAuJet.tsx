import React, { useState } from 'react';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import {
    INFLUENCES_NEGATIVES, INFLUENCES_POSITIVES, NIVEAUX_DE_REPUTATION, RAPPELS_DU_CONFLIT, REPOS,
    augmenterLaGravite, bloquerUnAttribut, controleDeCreation, coutDeLaReputation, coutDesAssistants, etatDesBlessures, etatDuStress,
    graviteSubie, guerirUneBlessure, infligerUneBlessure, intervention, jetDeReputation, lireStarTrek, marquerLaMort, noterLesReprimandes,
    oppositionDeLaTache, premiersSecours, reduireLeStress, relancerDes, reprendreConnaissance, rouvrirUneBlessure, subirDuStress,
    traiterUneBlessure, type ChoixStarTrek, type DeDuJet, type NatureStarTrek, type Repos, type RegleDeStarTrek,
} from '../../../dice/systemes/starTrekRegles';

/**
 * **Star Trek Adventures, jusqu'au bout** — 23/10/2026, à la demande de David
 * (« on va faire toute les améliorations de Star Trek »). Ce que le panneau de jet
 * propose en plus : la tâche complète (nature, marge de complication, opposition,
 * assistants et vaisseau, Détermination), ses suites (complications annulées,
 * réussite mitigée, relances, blessure infligée) et les cartes de la fiche
 * (Stress et blessures, Réputation, création). Rien ne s'écrit sans un clic.
 */
type Valeurs = Record<string, unknown>;
type Ecrire = (maj: Record<string, unknown>) => void;
type Consigner = (titre: string, ligne: string) => void;

const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const nombre = (texte: string, defaut = 0) => { const x = Number(texte); return texte.trim() !== '' && Number.isFinite(x) ? Math.trunc(x) : defaut; };
const id = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()));


/** Ce que le vaisseau de l'équipage, tenu par le module des opérations, prête au jet (p. 178). */
export interface VaisseauPourLAide { nom: string; systemes: Record<string, number>; fonctions: Record<string, number> }
const SYSTEMES: [string, string][] = [['communications', 'Communications'], ['ordinateurs', 'Ordinateurs'], ['moteurs', 'Moteurs'], ['detecteurs', 'Détecteurs'], ['structure', 'Structure'], ['armement', 'Armement']];
const FONCTIONS: [string, string][] = [['commandement', 'Commandement'], ['navigation', 'Navigation'], ['ingenierie', 'Ingénierie'], ['securite', 'Sécurité'], ['medecine', 'Médecine'], ['science', 'Science']];

// ——— Préparer ———

export const PreparationStarTrek: React.FC<{
    choix: ChoixStarTrek;
    changer: (c: Partial<ChoixStarTrek>) => void;
    /** Choisir la nature règle aussi l'attribut, la fonction et la difficulté du livre (p. 290). */
    choisirLaNature: (n: NatureStarTrek) => void;
    determination: number;
    difficulte: number;
    vaisseau?: VaisseauPourLAide | null;
    /** Une tâche de difficulté 0 réussit sans lancer (p. 254). */
    reussirSansLancer?: () => void;
}> = ({ choix, changer, choisirLaNature, determination, difficulte, vaisseau, reussirSansLancer }) => {
    const [assistant, setAssistant] = useState({ nom: '', seuil: '', specialisation: '' });
    const [aide, setAide] = useState({ systeme: 'armement', fonction: 'securite', systemeLibre: '9', fonctionLibre: '2' });
    const valeurDe = (sys: string, fonc: string) => vaisseau
        ? { seuil: n(vaisseau.systemes[sys]) + n(vaisseau.fonctions[fonc]), critique: n(vaisseau.fonctions[fonc]) }
        : { seuil: nombre(aide.systemeLibre, 9) + nombre(aide.fonctionLibre, 2), critique: nombre(aide.fonctionLibre, 2) };
    const brancherLeVaisseau = (actif: boolean, sys = aide.systeme, fonc = aide.fonction, energie = choix.vaisseau?.energie ?? false) => {
        if (!actif) return changer({ vaisseau: null });
        const v = valeurDe(sys, fonc);
        changer({ vaisseau: { label: `${vaisseau?.nom ?? 'Vaisseau'} (${SYSTEMES.find(s => s[0] === sys)?.[1]} + ${FONCTIONS.find(f => f[0] === fonc)?.[1]})`, ...v, energie } });
    };
    const opposition = choix.opposition ? oppositionDeLaTache(choix.opposition.reussites, choix.opposition.facteurs, 0) : null;
    const cout = coutDesAssistants(choix.assistants.length);
    return (
        <div data-preparation-star-trek className="flex w-full flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Nature de la tâche">
                <span className={etiquette}>Tâche</span>
                {([['test', 'Tâche'], ['melee', 'Attaque au corps à corps'], ['distance', 'Attaque à distance']] as const).map(([v, l]) => (
                    <label key={v} className="flex items-center gap-1">
                        <input type="radio" name="nature-star-trek" checked={choix.nature === v} onChange={() => choisirLaNature(v)} />{l}
                    </label>
                ))}
                <span className="text-app-text/50">
                    {choix.nature === 'melee' ? 'Audace + Sécurité, difficulté 1 — en opposition si la cible se défend.' : choix.nature === 'distance' ? 'Maîtrise + Sécurité, difficulté 2 — en opposition si elle est à couvert.' : ''}
                </span>
            </div>
            <label className="flex flex-wrap items-center gap-2">
                <span className={etiquette}>Marge de complication</span>
                <select aria-label="Marge de complication" value={choix.marge} onChange={e => changer({ marge: Number(e.target.value) })} className={champ} data-marge-de-complication>
                    {[1, 2, 3, 4, 5].map(m => <option key={m} value={m}>{m === 1 ? '20' : `${21 - m}–20`}</option>)}
                </select>
                <span className="text-app-text/50">Une tâche dangereuse sans être plus difficile (p. 258).</span>
            </label>
            {difficulte <= 0 && reussirSansLancer && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-app-text/70">Difficulté 0 : la tâche réussit sans lancer, sans Impulsion ni complication ; lancer quand même peut rapporter de l’Impulsion (p. 254).</span>
                    <button type="button" className={bouton} onClick={reussirSansLancer}>Réussie sans lancer</button>
                </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">
                    <input type="checkbox" checked={!!choix.opposition} onChange={e => changer({ opposition: e.target.checked ? { reussites: 1, facteurs: 0 } : null })} />
                    <span className={etiquette}>En opposition</span>
                </label>
                {choix.opposition && <>
                    <label className="flex items-center gap-1">Réussites du réactif
                        <input aria-label="Réussites du réactif" type="number" min={0} value={choix.opposition.reussites} onChange={e => changer({ opposition: { ...choix.opposition!, reussites: Math.max(0, nombre(e.target.value)) } })} className={`w-14 ${champ}`} />
                    </label>
                    <label className="flex items-center gap-1">Facteurs qui le gênent
                        <input aria-label="Facteurs contre le réactif" type="number" min={0} value={choix.opposition.facteurs} onChange={e => changer({ opposition: { ...choix.opposition!, facteurs: Math.max(0, nombre(e.target.value)) } })} className={`w-14 ${champ}`} />
                    </label>
                    <span className="font-mono">difficulté {opposition?.difficulte}</span>
                    <span className="text-app-text/50">Le réactif lance d’abord ; ses réussites font la difficulté (p. 256).</span>
                </>}
            </div>
            <div className="flex flex-col gap-1">
                <span className={etiquette}>Assistants — 1d20 chacun, comptés si le personnage réussit (p. 255)</span>
                {choix.assistants.map((a, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                        <span>{a.nom} : seuil {a.seuil}{a.critique > 1 ? `, critique ≤ ${a.critique}` : ''}</span>
                        <button type="button" className={bouton} onClick={() => changer({ assistants: choix.assistants.filter((_, k) => k !== i) })}>Retirer</button>
                    </div>
                ))}
                <div className="flex flex-wrap items-center gap-2">
                    <input aria-label="Nom de l’assistant" placeholder="Assistant" value={assistant.nom} onChange={e => setAssistant(a => ({ ...a, nom: e.target.value }))} className={`w-28 ${champ}`} />
                    <input aria-label="Seuil de l’assistant" placeholder="Attr. + fonction" type="number" value={assistant.seuil} onChange={e => setAssistant(a => ({ ...a, seuil: e.target.value }))} className={`w-24 ${champ}`} />
                    <input aria-label="Fonction de la spécialisation" placeholder="Spé. : fonction" type="number" value={assistant.specialisation} onChange={e => setAssistant(a => ({ ...a, specialisation: e.target.value }))} className={`w-24 ${champ}`} />
                    <button type="button" className={bouton} disabled={!nombre(assistant.seuil)} onClick={() => {
                        changer({ assistants: [...choix.assistants, { nom: assistant.nom.trim() || `Assistant ${choix.assistants.length + 1}`, seuil: nombre(assistant.seuil), critique: Math.max(1, nombre(assistant.specialisation, 1)) }] });
                        setAssistant({ nom: '', seuil: '', specialisation: '' });
                    }}>Ajouter</button>
                    {cout > 0 && <span className="text-etat-alerte">{cout} Impulsion (ou Menace) pour les assistants au-delà du premier.</span>}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">
                    <input type="checkbox" checked={!!choix.vaisseau} onChange={e => brancherLeVaisseau(e.target.checked)} />
                    <span className={etiquette}>Aide du vaisseau</span>
                </label>
                <select aria-label="Système du vaisseau" value={aide.systeme} onChange={e => { setAide(a => ({ ...a, systeme: e.target.value })); if (choix.vaisseau) brancherLeVaisseau(true, e.target.value); }} className={champ}>
                    {SYSTEMES.map(([k, l]) => <option key={k} value={k}>{l}{vaisseau ? ` ${vaisseau.systemes[k]}` : ''}</option>)}
                </select>
                <select aria-label="Fonction du vaisseau" value={aide.fonction} onChange={e => { setAide(a => ({ ...a, fonction: e.target.value })); if (choix.vaisseau) brancherLeVaisseau(true, aide.systeme, e.target.value); }} className={champ}>
                    {FONCTIONS.map(([k, l]) => <option key={k} value={k}>{l}{vaisseau ? ` ${vaisseau.fonctions[k]}` : ''}</option>)}
                </select>
                {!vaisseau && <>
                    <input aria-label="Valeur du système" type="number" value={aide.systemeLibre} onChange={e => { setAide(a => ({ ...a, systemeLibre: e.target.value })); }} className={`w-14 ${champ}`} />
                    <input aria-label="Valeur de la fonction" type="number" value={aide.fonctionLibre} onChange={e => { setAide(a => ({ ...a, fonctionLibre: e.target.value })); }} className={`w-14 ${champ}`} />
                </>}
                {choix.vaisseau && <span className="font-mono">seuil {choix.vaisseau.seuil}, critique ≤ {choix.vaisseau.critique}</span>}
                {choix.vaisseau && (
                    <label className="flex items-center gap-1" title="Rediriger l’énergie (p. 185) : le dé du vaisseau vaut 1 ; les complications des autres dés comptent double">
                        <input type="checkbox" checked={choix.vaisseau.energie} onChange={e => brancherLeVaisseau(true, aide.systeme, aide.fonction, e.target.checked)} />énergie redirigée
                    </label>
                )}
                {!vaisseau && <span className="text-app-text/50">Ouvrez le module « Bataille spatiale » pour lire le vaisseau ; sinon, saisissez ses valeurs.</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1">
                    <input type="checkbox" checked={choix.idealAligne} onChange={e => changer({ idealAligne: e.target.checked, ...(e.target.checked ? {} : { occasionParfaite: false }) })} />
                    Un idéal ou une directive s’aligne (p. 262)
                </label>
                <label className="flex items-center gap-1" title={determination < 1 ? 'Plus de Détermination' : undefined}>
                    <input type="checkbox" checked={choix.occasionParfaite} disabled={!choix.idealAligne || determination < 1} onChange={e => changer({ occasionParfaite: e.target.checked })} />
                    Occasion parfaite : un dé vaut 1 (1 Détermination, {determination} restante{determination > 1 ? 's' : ''})
                </label>
            </div>
        </div>
    );
};

// ——— Les suites du lancer ———

export const SuitesStarTrek: React.FC<{
    resultat: RollResult;
    des: DeDuJet[];
    complication: number;
    difficulte: number;
    choix: ChoixStarTrek;
    determination: number;
    meneur: boolean;
    /** Le nouveau jet remplace l'ancien : le panneau recompte, et ajuste l'Impulsion déjà versée. */
    remplacer: (des: DeDuJet[], motif: string) => void;
    /** La réussite mitigée : réussie, avec une complication de plus, sans dépense d'Impulsion (p. 259). */
    mitiger: () => void;
    mouvoir: (ressource: 'impulsion' | 'menace', delta: number, motif: string) => void;
    ecrireDetermination: (apres: number) => void;
    consigner: Consigner;
}> = ({ resultat, des, complication, difficulte, choix, determination, meneur, remplacer, mitiger, mouvoir, ecrireDetermination, consigner }) => {
    const [annulees, setAnnulees] = useState(0);
    const [choisis, setChoisis] = useState<number[]>([]);
    const [vise, setVise] = useState(false);
    const [inspire, setInspire] = useState(false);
    const [gravite, setGravite] = useState('3');
    const [puissante, setPuissante] = useState(false);
    const [plus, setPlus] = useState(0);
    const [letale, setLetale] = useState(false);
    const [escalade, setEscalade] = useState(false);
    const [payee, setPayee] = useState(false);
    const reussi = resultat.tagSuccess === true;
    const complications = des.filter(d => d.val >= complication).length;
    const propres = des.map((d, i) => ({ d, i })).filter(x => !x.d.aide);
    const opposition = choix.opposition ? oppositionDeLaTache(choix.opposition.reussites, choix.opposition.facteurs, resultat.successes ?? 0) : null;
    const attaque = choix.nature !== 'test';
    const g = augmenterLaGravite(plus, puissante);
    const relancer = (indices: number[], motif: string) => { remplacer(relancerDes(des, indices, () => DiceEngine.roll(20)), motif); setChoisis([]); };
    const choisir = (i: number) => setChoisis(c => c.includes(i) ? c.filter(x => x !== i) : [...c, i]);
    return (
        <div data-suites-star-trek className="flex w-full flex-col gap-2 text-xs">
            {complications - annulees > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span>{complications - annulees} complication{complications - annulees > 1 ? 's' : ''} à jouer après la tâche (p. 258).</span>
                    <button type="button" className={bouton} onClick={() => { mouvoir('menace', 2, 'Complication repoussée'); setAnnulees(a => a + 1); consigner('Complication repoussée', '+2 Menace : le souci devient un problème pour plus tard (p. 258).'); }}>
                        Repousser une complication (+2 Menace)
                    </button>
                </div>
            )}
            {!reussi && meneur && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-app-text/60">Réussite mitigée, si le meneur la propose : réussie avec une complication de plus, sans dépense d’Impulsion (p. 259).</span>
                    <button type="button" className={bouton} onClick={mitiger}>Accorder la réussite mitigée</button>
                </div>
            )}
            {opposition && !opposition.reussi && (
                <div className="flex flex-wrap items-center gap-2" data-opposition-star-trek>
                    <span>Le réactif gagne {opposition.impulsionDuReactif} Impulsion, à dépenser aussitôt ; un PNJ la change en Menace (p. 256, 265).</span>
                    {meneur && opposition.impulsionDuReactif > 0 && (
                        <button type="button" className={bouton} onClick={() => mouvoir('menace', opposition.impulsionDuReactif, 'Impulsion du réactif (PNJ)')}>PNJ : +{opposition.impulsionDuReactif} Menace</button>
                    )}
                </div>
            )}
            {(choix.idealAligne && determination >= 1 && !inspire) || (attaque && !vise) ? (
                <div className="flex flex-wrap items-center gap-2">
                    <span className={etiquette}>Relancer</span>
                    {propres.map(({ d, i }) => (
                        <label key={i} className="flex items-center gap-1 font-mono">
                            <input type="checkbox" checked={choisis.includes(i)} onChange={() => choisir(i)} />{d.val}
                        </label>
                    ))}
                    {choix.idealAligne && determination >= 1 && !inspire && (
                        <button type="button" className={bouton} disabled={!choisis.length} onClick={() => {
                            ecrireDetermination(determination - 1); setInspire(true);
                            relancer(choisis, `Éclair d’inspiration (1 Détermination, ${determination} → ${determination - 1})`);
                        }}>Éclair d’inspiration (1 Détermination)</button>
                    )}
                    {attaque && !vise && (
                        <button type="button" className={bouton} disabled={choisis.length !== 1} onClick={() => { setVise(true); relancer(choisis, 'Viser : un d20 relancé'); }}>
                            Viser : relancer un d20
                        </button>
                    )}
                    <span className="text-app-text/50">Le nouveau résultat remplace l’ancien, même moins bon (p. 253).</span>
                </div>
            ) : null}
            {attaque && reussi && (
                <div data-blessure-infligee className="flex flex-col gap-1 rounded-md border border-app-border/30 p-2">
                    <span className={etiquette}>La blessure (p. 290)</span>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1">Gravité de l’arme
                            <input aria-label="Gravité de l’arme" type="number" min={1} value={gravite} onChange={e => setGravite(e.target.value)} className={`w-14 ${champ}`} />
                        </label>
                        <label className="flex items-center gap-1"><input type="checkbox" checked={puissante} onChange={e => setPuissante(e.target.checked)} />Puissante</label>
                        <label className="flex items-center gap-1">+ gravité
                            <select aria-label="Augmenter la gravité" value={plus} onChange={e => setPlus(Number(e.target.value))} className={champ}>
                                {[0, 1, 2].map(k => <option key={k} value={k}>+{k}</option>)}
                            </select>
                        </label>
                        {g.cout > 0 && <button type="button" className={bouton} disabled={payee} onClick={() => { mouvoir('impulsion', -g.cout, `Gravité +${g.plus}`); setPayee(true); }}>{payee ? 'Payé' : `Payer ${g.cout} Impulsion`}</button>}
                        <label className="flex items-center gap-1"><input type="checkbox" checked={letale} onChange={e => setLetale(e.target.checked)} />Létale</label>
                        {letale && <button type="button" className={bouton} disabled={escalade} onClick={() => { mouvoir('menace', 1, 'Escalade : attaque létale'); setEscalade(true); }}>{escalade ? 'Escalade notée' : '+1 Menace (escalade)'}</button>}
                    </div>
                    <p className="font-mono">
                        Gravité {nombre(gravite, 1) + g.plus}, {letale ? 'létale' : 'étourdissante'} : la cible évite en prenant autant de Stress, sinon elle est blessée et vaincue ; sa Protection retire un point par point, jamais sous 1 (p. 292).
                    </p>
                </div>
            )}
            {attaque && choix.opposition && opposition?.reussi === false && (
                <p className="text-app-text/60">La cible a gagné : au corps à corps, elle se dégage, ou contre-attaque pour 2 Impulsion (p. 290).</p>
            )}
            {difficulte > 0 && reussi && <span className="sr-only">Réussie</span>}
        </div>
    );
};

// ——— Les cartes de la fiche ———

/** **Stress et blessures** (p. 277–278, 290–293). */
export const StressEtBlessuresStarTrek: React.FC<{
    regle: RegleDeStarTrek; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner; meneur: boolean;
    payerImpulsion?: (cout: number, motif: string) => void;
    attributs: { id: string; label: string }[];
}> = ({ regle, valeurs, ecrire, consigner, meneur, payerImpulsion, attributs }) => {
    const [quantite, setQuantite] = useState('2');
    const [blessure, setBlessure] = useState({ nom: 'Brûlure', gravite: '3', letale: false, perforant: false });
    const [dernier, setDernier] = useState<string | null>(null);
    if (!regle.stress) return null;
    const st = etatDuStress(regle, valeurs);
    const bl = etatDesBlessures(valeurs);
    const protection = regle.protection ? n(valeurs[regle.protection]) : 0;
    const dire = (titre: string, ligne: string) => { setDernier(ligne); consigner(titre, ligne); };
    const ecrireLeStress = (apres: number) => ecrire({ [regle.stress!.courant]: apres });
    const subir = (g: number, motif: string) => {
        const r = subirDuStress(st.courant, st.max, g);
        ecrireLeStress(r.apres);
        dire(motif, `Stress ${st.courant} → ${r.apres} / ${st.max}${r.deborde ? ' — ce qui ne tient plus devient une complication' : ''}${r.epuise ? ' — épuisé : difficulté +1 à toutes les tâches, un attribut bloqué (p. 278)' : ''}.`);
    };
    const reduire = (mode: Repos | 'impulsion') => {
        const r = reduireLeStress(st.courant, mode === 'impulsion' ? { impulsion: nombre(quantite) * 2 } : mode);
        if (mode === 'impulsion' && r.cout) payerImpulsion?.(r.cout, 'Stress réduit');
        ecrireLeStress(r.apres);
        dire('Stress réduit', `${mode === 'impulsion' ? `${r.cout} Impulsion` : REPOS[mode].label} : Stress ${st.courant} → ${r.apres}.`);
    };
    return (
        <div data-stress-star-trek className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-black">{st.courant} / {st.max}</span>
                <span className="text-app-text/60">Stress (maximum : la Forme)</span>
                {st.epuise && <span className="font-black text-etat-alerte">Épuisé : difficulté +1, {bl.attributBloque ? `${attributs.find(a => a.id === bl.attributBloque)?.label ?? bl.attributBloque} bloqué` : 'choisir un attribut bloqué'}</span>}
                {bl.vaincu && <span className="font-black text-etat-danger">{bl.mort ? 'Mort' : bl.mourant ? 'Vaincu et mourant : il meurt à la fin de la scène si personne ne le soigne' : 'Vaincu : à terre, plus d’action jusqu’à la fin de la scène'}</span>}
            </div>
            {st.epuise && (
                <label className="flex items-center gap-2">Attribut bloqué
                    <select aria-label="Attribut bloqué" value={bl.attributBloque ?? ''} onChange={e => ecrire(bloquerUnAttribut(valeurs, e.target.value || undefined))} className={champ}>
                        <option value="">—</option>{attributs.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                </label>
            )}
            <div className="flex flex-wrap items-center gap-2">
                <input aria-label="Stress ou gravité" type="number" min={0} value={quantite} onChange={e => setQuantite(e.target.value)} className={`w-14 ${champ}`} />
                <button type="button" className={bouton} disabled={st.epuise} onClick={() => subir(nombre(quantite), 'Stress subi')}>Subir du Stress (une conséquence)</button>
                <button type="button" className={bouton} disabled={st.epuise || st.courant + nombre(quantite) > st.max} onClick={() => subir(nombre(quantite), 'Blessure évitée')}>Éviter une blessure de cette gravité</button>
                <button type="button" className={bouton} disabled={st.epuise || !payerImpulsion} onClick={() => reduire('impulsion')}>−{Math.min(3, nombre(quantite))} pour {Math.min(3, nombre(quantite)) * 2} Impulsion</button>
                {(Object.keys(REPOS) as Repos[]).map(r => <button key={r} type="button" className={bouton} onClick={() => reduire(r)}>{REPOS[r].label} ({REPOS[r].efface === 'tout' ? 'tout' : `−${REPOS[r].efface}`})</button>)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <span className={etiquette}>Blessure</span>
                <input aria-label="Nom de la blessure" value={blessure.nom} onChange={e => setBlessure(b => ({ ...b, nom: e.target.value }))} className={`w-28 ${champ}`} />
                <input aria-label="Gravité de la blessure" type="number" min={1} value={blessure.gravite} onChange={e => setBlessure(b => ({ ...b, gravite: e.target.value }))} className={`w-14 ${champ}`} />
                <label className="flex items-center gap-1"><input type="checkbox" checked={blessure.letale} onChange={e => setBlessure(b => ({ ...b, letale: e.target.checked }))} />Létale</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={blessure.perforant} onChange={e => setBlessure(b => ({ ...b, perforant: e.target.checked }))} />Perforant</label>
                <button type="button" className={bouton} disabled={bl.mort} onClick={() => {
                    const gr = graviteSubie(nombre(blessure.gravite, 1), protection, blessure.perforant);
                    ecrire(infligerUneBlessure(valeurs, { id: id(), nom: blessure.nom.trim() || 'Blessure', gravite: gr, letale: blessure.letale }, id()));
                    dire('Blessure', `${blessure.nom} ${gr}${protection && !blessure.perforant ? ` (Protection ${protection})` : ''}, ${blessure.letale ? 'létale' : 'étourdissante'} : blessé et vaincu.`);
                }}>Encaisser la blessure</button>
            </div>
            {bl.blessures.length > 0 && (
                <ul className="flex flex-col gap-1" data-blessures-star-trek>
                    {bl.blessures.map(b => {
                        const iv = intervention(b);
                        return (
                            <li key={b.id} className="flex flex-wrap items-center gap-2">
                                <span className={b.traitee ? 'text-app-text/60' : 'text-etat-danger'}>{b.nom} {b.gravite}, {b.letale ? 'létale' : 'étourdissante'}{b.traitee ? ', traitée' : ''}</span>
                                {!b.traitee
                                    ? <button type="button" className={bouton} onClick={() => { ecrire(traiterUneBlessure(valeurs, b.id)); dire('Blessure traitée', `${b.nom} : Audace + Médecine, difficulté ${b.gravite} — pénalités annulées (p. 292).`); }}>Traitée (Audace + Médecine, diff. {b.gravite})</button>
                                    : <button type="button" className={bouton} onClick={() => ecrire(rouvrirUneBlessure(valeurs, b.id))}>Rouverte</button>}
                                <button type="button" className={bouton} onClick={() => { ecrire(guerirUneBlessure(valeurs, b.id)); dire('Blessure guérie', `${b.nom} : intervention Maîtrise + Médecine, difficulté ${iv.difficulte}, ${iv.heures} h.`); }}>
                                    Guérie (intervention, diff. {iv.difficulte}, {iv.heures} h)
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
            {bl.vaincu && !bl.mort && (
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={bouton} onClick={() => { ecrire(premiersSecours(valeurs)); dire('Premiers secours', 'Audace + Médecine, difficulté 2 : il n’est plus vaincu (p. 292).'); }}>Premiers secours réussis</button>
                    <button type="button" className={bouton} onClick={() => { ecrire(reprendreConnaissance(valeurs)); dire('Réveil', 'L’étourdissement s’estompe.'); }}>Fin de l’étourdissement</button>
                    {meneur && bl.mourant && <button type="button" className={bouton} onClick={() => { ecrire(marquerLaMort(valeurs, true)); dire('Mort', 'Personne ne l’a soigné avant la fin de la scène.'); }}>Fin de scène : il meurt</button>}
                </div>
            )}
            {bl.mort && meneur && <button type="button" className={bouton} onClick={() => ecrire(marquerLaMort(valeurs, false))}>Annuler la mort</button>}
            {dernier && <p data-dernier-star-trek className="font-mono">{dernier}</p>}
        </div>
    );
};

/** **La Réputation de fin de mission** (p. 169–172) : au meneur. */
export const ReputationStarTrek: React.FC<{ regle: RegleDeStarTrek; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner }> = ({ regle, valeurs, ecrire, consigner }) => {
    const [positives, setPositives] = useState<boolean[]>(INFLUENCES_POSITIVES.map(() => false));
    const [negatives, setNegatives] = useState<boolean[]>(INFLUENCES_NEGATIVES.map(() => false));
    const [issue, setIssue] = useState<ReturnType<typeof jetDeReputation> | null>(null);
    if (!regle.reputation) return null;
    const reputation = n(valeurs[regle.reputation]);
    const s = lireStarTrek(valeurs);
    const p = positives.filter(Boolean).length, q = negatives.filter(Boolean).length;
    return (
        <div data-reputation-star-trek className="flex flex-col gap-2 text-xs">
            <p><strong>Réputation {reputation}</strong> — {NIVEAUX_DE_REPUTATION[Math.min(5, Math.max(0, reputation))]}.</p>
            <label className="flex flex-wrap items-center gap-2">Réprimandes gardées
                <input aria-label="Réprimandes gardées" type="number" min={0} value={s.reprimandes} onChange={e => ecrire(noterLesReprimandes(valeurs, Math.max(0, nombre(e.target.value))))} className={`w-14 ${champ}`} />
                <span className="text-app-text/50">Elles se dépensent (cour martiale 5, dégradation 3, emprisonnement 2, Réputation entachée : autant que la Réputation, pour −1) ; celles qu’on garde élargissent la chance d’en recevoir (p. 172, 175).</span>
            </label>
            <div className="grid gap-2 md:grid-cols-2">
                <fieldset><legend className={etiquette}>Influences positives ({p})</legend>
                    {INFLUENCES_POSITIVES.map((t, i) => <label key={t} className="flex items-start gap-1"><input type="checkbox" checked={positives[i]} onChange={e => setPositives(x => x.map((v, k) => k === i ? e.target.checked : v))} />{t}</label>)}
                </fieldset>
                <fieldset><legend className={etiquette}>Influences négatives ({q})</legend>
                    {INFLUENCES_NEGATIVES.map((t, i) => <label key={t} className="flex items-start gap-1"><input type="checkbox" checked={negatives[i]} onChange={e => setNegatives(x => x.map((v, k) => k === i ? e.target.checked : v))} />{t}</label>)}
                </fieldset>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={bouton} onClick={() => {
                    const r = jetDeReputation(reputation, p, q, s.reprimandes, () => DiceEngine.roll(20));
                    setIssue(r);
                    if (r.reprimandes) ecrire(noterLesReprimandes(valeurs, s.reprimandes + r.reprimandes));
                    consigner('Jet de Réputation', `${p}d20 sous ${r.seuil} (double ≤ ${reputation}) : [${r.des.join(', ')}] — ${r.reussites} réussite(s) contre ${q} : ${r.reussi ? `${r.gloire} point(s) de Gloire` : `${r.reprimandes} Réprimande(s)`}.`);
                }}>Jet de Réputation : {p}d20 sous {7 + reputation}, difficulté {q}</button>
            </div>
            {issue && (
                <p className="font-mono" data-issue-reputation>
                    [{issue.des.join(', ')}] — {issue.reussites} réussite{issue.reussites > 1 ? 's' : ''} / {issue.difficulte} : {issue.reussi ? `${issue.gloire} point${issue.gloire > 1 ? 's' : ''} de Gloire à dépenser aussitôt (médailles, félicitations, promotion, faveur, statut)` : `${issue.reprimandes} Réprimande${issue.reprimandes > 1 ? 's' : ''}`}.
                </p>
            )}
            {issue?.reussi && reputation < 5 && (
                <button type="button" className={bouton} disabled={issue.gloire < coutDeLaReputation(reputation + 1)} onClick={() => {
                    ecrire({ [regle.reputation!]: reputation + 1 });
                    consigner('Réputation', `${reputation} → ${reputation + 1} pour ${reputation + 1} points de Gloire (p. 172).`);
                    setIssue(i => i && { ...i, gloire: i.gloire - coutDeLaReputation(reputation + 1) });
                }}>Améliorer la Réputation à {reputation + 1} ({coutDeLaReputation(reputation + 1)} Gloire, une fois par aventure)</button>
            )}
        </div>
    );
};

/** **Création et progression** (p. 132, 167–169) : au meneur. On contrôle, on n'écrit rien. */
export const CreationStarTrek: React.FC<{ regle: RegleDeStarTrek; valeurs: Valeurs }> = ({ regle, valeurs }) => {
    const c = controleDeCreation(regle, valeurs);
    return (
        <div data-creation-star-trek className="flex flex-col gap-1 text-xs">
            <p className={c.conforme ? 'text-app-text/60' : 'text-etat-alerte'}>
                Création : un attribut au plus à 12, de 7 à 12 ; une fonction au plus à 5 (p. 132). {c.conforme ? 'Conforme.' : c.constats.join(' ')}
            </p>
            <p className="text-app-text/60">
                Jalon (fin de mission, un idéal rappelé) : un attribut +1 jusqu’à 11, une fonction +1 jusqu’à 4, une spécialisation ou un talent. Arc narratif : jusqu’à 12 et 5, ou un idéal de plus (p. 167–169). La Détermination repart à 1 à chaque mission, 3 au plus.
            </p>
        </div>
    );
};

export const TourStarTrek: React.FC = () => (
    <ul data-tour-star-trek className="flex list-disc flex-col gap-1 pl-4 text-xs text-app-text/70">
        {RAPPELS_DU_CONFLIT.map(r => <li key={r}>{r}</li>)}
    </ul>
);
