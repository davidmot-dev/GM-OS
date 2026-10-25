import { useState } from 'react';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import { AttaqueDune } from '../../../combat/components/ConflitDune';
import {
    CLE_DUNE, acheterProgressionDune, compteDune, entierDune, lireDune, noterDune, recupererPrincipe, relancerDune,
    type AchatDune, type AtoutDune, type BilanDune, type ChoixDune, type DeDune, type RegleDeDune, type ValeursDune,
} from '../../../dice/systemes/duneRegles';

const bouton = 'rounded border border-app-border/50 px-2 py-1 hover:border-accent disabled:opacity-30';
const champ = 'rounded border border-app-border/50 bg-app-bg px-2 py-1 text-app-text';
type Ecrire = (maj: ValeursDune) => void;
type Consigner = (titre: string, texte: string) => void;

export function PreparationDune({ choix, changer, maxime, indisponible, determination, peutEcrire, verrouille, meneur, specialisations, retenirSpecialisation, recupere }: {
    choix: ChoixDune; changer: (c: Partial<ChoixDune>) => void; maxime: string; indisponible: boolean; determination: number; peutEcrire: boolean; verrouille: boolean; meneur: boolean;
    specialisations: string[]; retenirSpecialisation: (s: string) => void; recupere: boolean;
}) {
    const [assistant, setAssistant] = useState({ nom: '', seuil: 8, critique: 1 });
    return <fieldset disabled={verrouille} className="flex w-full flex-col gap-2 text-xs" data-preparation-dune>
        <p>{maxime ? `Maxime : ${maxime}` : 'Ce principe n’a pas de maxime : pas de dépense de Détermination.'}</p>
        <label>Spécialisation de la fiche <select className={champ} aria-label="Spécialisation de la fiche Dune" defaultValue="" onChange={e => retenirSpecialisation(e.target.value)}><option value="">Aucune / choix manuel à la table</option>{specialisations.map((s, i) => <option key={i} value={s}>{s}</option>)}</select></label>
        {indisponible && <p role="alert" className="text-etat-danger">Principe bafoué : récupérez-le ou choisissez un autre principe.</p>}
        <div className="flex flex-wrap gap-3">
            {meneur && <label><input type="checkbox" checked={choix.ennemi} onChange={e => changer({ ennemi: e.target.checked })} /> PNJ ennemi : achats et dépenses en Menace</label>}
            <label><input type="checkbox" checked={choix.maximeAlignee} disabled={!maxime} onChange={e => changer({ maximeAlignee: e.target.checked, unAutomatique: false, contradiction: 'aucune' })} /> Maxime pertinente, validée à la table</label>
            <label><input type="checkbox" checked={choix.unAutomatique} disabled={!choix.maximeAlignee || !maxime || determination < 1 || !peutEcrire} onChange={e => changer({ unAutomatique: e.target.checked })} /> Un dé vaut 1 (1 Détermination, dans la réserve)</label>
            <label>Marge de complication <select className={champ} aria-label="Marge de complication Dune" value={choix.marge} onChange={e => changer({ marge: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n === 1 ? '20' : `${21 - n}–20`}</option>)}</select></label>
            <label>Impulsion bonus <input className={`w-14 ${champ}`} aria-label="Impulsion bonus" type="number" min={0} value={choix.bonus} onChange={e => changer({ bonus: entierDune(e.target.value) })} /></label>
        </div>
        {maxime && <label>Si le MJ offre 1 Détermination pour une contradiction : <select aria-label="Choix du principe" className={champ} value={choix.contradiction} disabled={!peutEcrire} onChange={e => changer({ contradiction: e.target.value as ChoixDune['contradiction'], maximeAlignee: false, unAutomatique: false })}>
            <option value="aucune">Aucune offre acceptée</option><option value="respecter">Respecter, subir une complication</option><option value="bafouer" disabled={recupere}>Bafouer après la résolution du test{recupere ? ' (récupéré : interdit)' : ''}</option></select></label>}
        <p className="text-app-text/60">Vous pouvez refuser l’offre et choisir un autre principe. Un principe récupéré dans cette aventure ne peut plus être bafoué.</p>
        <label><input type="checkbox" checked={!!choix.opposition} onChange={e => changer({ opposition: e.target.checked ? { reussites: 1, gene: 0, facteurs: 0, pnj: true } : null })} /> En opposition : le défenseur lance d’abord</label>
        {choix.opposition && <div className="flex flex-wrap gap-2">{([['reussites', 'Réussites du défenseur'], ['gene', 'Facteurs gênant le défenseur'], ['facteurs', 'Ajustement contre l’actif']] as const).map(([k, l]) => <label key={k}>{l} <input className={`w-14 ${champ}`} aria-label={l} type="number" value={choix.opposition![k]} onChange={e => changer({ opposition: { ...choix.opposition!, [k]: k === 'facteurs' ? Math.trunc(Number(e.target.value)) || 0 : entierDune(e.target.value) } })} /></label>)}
            <label><input type="checkbox" checked={choix.opposition.pnj} onChange={e => changer({ opposition: { ...choix.opposition!, pnj: e.target.checked } })} /> Défenseur PNJ ennemi</label></div>}
        <div className="flex flex-wrap gap-2"><span>Assistance : 1d20 par assistant, sans achat</span>
            <input aria-label="Assistant Dune" className={`w-28 ${champ}`} placeholder="Nom" value={assistant.nom} onChange={e => setAssistant(a => ({ ...a, nom: e.target.value }))} />
            <label>Seuil <input aria-label="Seuil de l’assistant Dune" className={`w-14 ${champ}`} type="number" min={8} max={16} value={assistant.seuil} onChange={e => setAssistant(a => ({ ...a, seuil: entierDune(e.target.value, 8, 16) }))} /></label>
            <label>Critique ≤ <input aria-label="Critique de l’assistant Dune" className={`w-14 ${champ}`} type="number" min={1} max={8} value={assistant.critique} onChange={e => setAssistant(a => ({ ...a, critique: entierDune(e.target.value, 1, 8) }))} /></label>
            <button className={bouton} type="button" onClick={() => { changer({ assistants: [...choix.assistants, { ...assistant, nom: assistant.nom.trim() || 'Assistant' }] }); }}>Ajouter l’assistant</button>
        </div>
        {choix.assistants.map((a, i) => <div key={i}>{a.nom} : seuil {a.seuil}, critique ≤ {a.critique} <button type="button" className={bouton} onClick={() => changer({ assistants: choix.assistants.filter((_, k) => k !== i) })}>Retirer l’assistant {i + 1}</button></div>)}
    </fieldset>;
}

export function SuitesDune({ resultat, des, choix, bilan, difficulte, determination, maximeAlignee, remplacer, depenser, clore, racheter, mitiger, ecrireDetermination, consigner, ecrire, valeurs, regle, reserver, meneur }: {
    resultat: RollResult; des: DeDune[]; choix: ChoixDune; bilan: BilanDune; difficulte: number; determination: number; maximeAlignee: boolean;
    remplacer: (des: DeDune[]) => void; depenser: (montant: number, motif: string) => boolean; clore: (depenseDuDefenseur: number) => void;
    racheter: () => boolean; mitiger: (complications: number) => void; ecrireDetermination: (n: number) => void;
    consigner: Consigner; ecrire?: Ecrire; valeurs: ValeursDune; regle: RegleDeDune; reserver: boolean; meneur: boolean;
}) {
    const [indices, setIndices] = useState<number[]>([]), [achats, setAchats] = useState<string[]>([]);
    const [annulees, setAnnulees] = useState(0), [mitige, setMitige] = useState(0), [complications, setComplications] = useState(1), [effet, setEffet] = useState('');
    const [erreur, setErreur] = useState('');
    const [actionTrait, setActionTrait] = useState('créer');
    const [attaqueAppliquee, setAttaqueAppliquee] = useState(false);
    const [depenseDuDefenseur, setDepenseDuDefenseur] = useState(0);
    const compte = compteDune(des, choix.marge), reussi = resultat.tagSuccess === true;
    const payer = (cle: string, cout: number, texte: string, repeter = false) => {
        if (!texte.trim()) return setErreur('Précisez l’effet à valider avec le meneur.');
        if (!depenser(cout, texte)) return;
        setAchats(a => [...a, cle]); setErreur(''); consigner('Dune · Impulsion', `${cout} point(s) : ${texte}`);
        if (!repeter) setEffet('');
    };
    return <div data-suites-dune className="flex w-full flex-col gap-2 text-xs">
        <p>Impulsion du test : <strong>{bilan.normal}</strong> normale, <strong>{bilan.bonus}</strong> bonus (non conservable). Dépenses : {bilan.depense}.</p>
        {!bilan.clos && <>
            <div className="flex flex-wrap gap-2">{des.map((d, i) => !d.aide && <label key={i}><input type="checkbox" checked={indices.includes(i)} disabled={bilan.depense > 0 || annulees > 0 || mitige > 0} onChange={e => setIndices(x => e.target.checked ? [...x, i] : x.filter(k => k !== i))} /> Dé {i + 1} : {d.val}</label>)}
                <button type="button" className={bouton} disabled={!indices.length || determination < 1 || !maximeAlignee || !ecrire || bilan.depense > 0 || annulees > 0 || mitige > 0 || attaqueAppliquee} onClick={() => { ecrireDetermination(determination - 1); remplacer(relancerDune(des, indices, () => DiceEngine.roll(20))); setIndices([]); }}>Relancer les dés choisis (1 Détermination)</button>
            </div>
            <p className="text-app-text/60">Finalisez vos relances avant les dépenses et le rachat des complications. Les assistants gardent leurs dés.</p>
            <p>{compte.complications + mitige + (choix.contradiction === 'respecter' ? 1 : 0) - annulees} complication(s) à résoudre {annulees > 0 && `(${annulees} rachetée(s))`}</p>
            <button type="button" className={bouton} disabled={!reserver || annulees >= compte.complications + mitige + (choix.contradiction === 'respecter' ? 1 : 0)} onClick={() => { if (racheter()) setAnnulees(x => x + 1); }}>Racheter une complication ({choix.ennemi ? '−2' : '+2'} Menace)</button>
            {!reussi && !mitige && <div className="flex flex-wrap gap-2"><label>Complications supplémentaires du MJ <input className={`w-14 ${champ}`} aria-label="Complications de la réussite mitigée" type="number" min={1} value={complications} onChange={e => setComplications(entierDune(e.target.value, 1, 20))} /></label><button type="button" className={bouton} onClick={() => { setMitige(complications); mitiger(complications); }}>Le MJ autorise une réussite mitigée</button></div>}
            {choix.opposition && !reussi && <div><p>Le défenseur obtient {Math.max(0, difficulte - (resultat.successes ?? 0))} Impulsion, à dépenser immédiatement.</p>
                {meneur && choix.opposition.pnj && <label>Impulsion dépensée par le défenseur avant conversion <input aria-label="Impulsion dépensée par le défenseur Dune" type="number" min={0} max={Math.max(0, difficulte - (resultat.successes ?? 0))} className={`w-14 ${champ}`} value={depenseDuDefenseur} onChange={e => setDepenseDuDefenseur(entierDune(e.target.value, 0, Math.max(0, difficulte - (resultat.successes ?? 0))))} /></label>}
                {choix.opposition.pnj && <p>Le reliquat du défenseur ennemi devient de la Menace à la fin de ce test.</p>}
            </div>}
            {reussi && !mitige && <>
                {meneur && <AttaqueDune regle={regle} valeurs={valeurs} payer={depenser} consigner={consigner} appliquee={() => setAttaqueAppliquee(true)} />}
                <input className={champ} aria-label="Effet de l’Impulsion" placeholder="Question, trait, atout… validé à la table" value={effet} onChange={e => setEffet(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={bouton} onClick={() => payer('information', 1, effet, true)}>Obtenir une information (1)</button>
                    <select className={champ} aria-label="Action sur le trait Dune" value={actionTrait} onChange={e => setActionTrait(e.target.value)}>{['créer', 'modifier', 'retirer'].map(a => <option key={a}>{a}</option>)}</select>
                    <button type="button" className={bouton} disabled={achats.includes('trait') || !ecrire} onClick={() => {
                        const traits = String(valeurs[regle.traits] ?? '').split('\n').filter(Boolean);
                        // Pour modifier, « ancien => nouveau » permet de conserver les autres traits.
                        const [avant, apres] = effet.split('=>').map(x => x.trim());
                        if (actionTrait !== 'créer' && (!traits.includes(avant) || (actionTrait === 'modifier' && !apres))) return setErreur('Choisissez un trait existant ; pour modifier : ancien => nouveau.');
                        if (!effet.trim() || !depenser(2, `${actionTrait} le trait ${effet}`)) return;
                        ecrire?.({ [regle.traits]: (actionTrait === 'créer' ? [...traits, effet.trim()] : actionTrait === 'retirer' ? traits.filter(t => t !== effet.trim()) : traits.map(t => t === avant ? apres || avant : t)).join('\n') });
                        setAchats(a => [...a, 'trait']); consigner('Dune · trait', `${actionTrait} : ${effet}`);
                    }}>Créer / modifier / retirer un trait (2)</button>
                    <button type="button" className={bouton} disabled={achats.includes('atout') || !ecrire} onClick={() => {
                        if (!effet.trim() || !depenser(2, `Créer l’atout ${effet}`)) return;
                        const s = lireDune(valeurs), a: AtoutDune = { id: crypto.randomUUID(), nom: effet.trim(), qualite: 0, tangible: false, permanent: false, usage: 'autre', zone: '', neutralise: false };
                        ecrire?.({ [CLE_DUNE]: noterDune({ ...s, atouts: [...s.atouts, a] }, `Atout créé : ${a.nom}`) }); setAchats(x => [...x, 'atout']); setEffet('');
                    }}>Créer un atout temporaire (2)</button>
                    <button type="button" className={bouton} disabled={achats.includes('permanent') || !ecrire || !lireDune(valeurs).atouts.some(a => !a.permanent)} onClick={() => {
                        const s = lireDune(valeurs), a = s.atouts.find(x => !x.permanent && x.nom === effet.trim());
                        if (!a) return setErreur('Indiquez le nom exact de l’atout temporaire à pérenniser.');
                        if (!depenser(2, `Pérenniser ${a.nom}`)) return;
                        ecrire?.({ [CLE_DUNE]: { ...s, atouts: s.atouts.map(x => x.id === a.id ? { ...x, permanent: true } : x) } }); setAchats(x => [...x, 'permanent']);
                    }}>Pérenniser un atout (2)</button>
                </div>
                <p className="text-app-text/60">Si le MJ ne peut répondre à une question, rendez le point par le bandeau des réserves. Le geste de trait consigne le choix ; son texte se modifie sur la fiche ou le plateau.</p>
            </>}
            {erreur && <p role="alert">{erreur}</p>}
            <button type="button" className={bouton} disabled={!reserver && (bilan.normal + bilan.bonus > 0)} onClick={() => clore(depenseDuDefenseur)}>Terminer le test et conserver le reliquat</button>
        </>}
        {bilan.clos && <p>Test terminé. L’Impulsion conservable a été versée une seule fois.</p>}
    </div>;
}

export function CarnetDune({ regle, valeurs, ecrire, consigner, meneur }: { regle: RegleDeDune; valeurs: ValeursDune; ecrire: Ecrire; consigner: Consigner; meneur: boolean }) {
    const s = lireDune(valeurs), [erreur, setErreur] = useState(''), [nom, setNom] = useState(''), [aventure, setAventure] = useState(''), [scene, setScene] = useState('');
    const [recuperation, setRecuperation] = useState({ principe: regle.principes[0], maxime: '', voisin: '', introspection: false, entre: false });
    const [achat, setAchat] = useState<AchatDune>({ genre: 'competence', objet: regle.competences[0] });
    const agir = (f: () => ValeursDune, titre: string) => { try { ecrire(f()); setErreur(''); consigner('Dune', titre); } catch (e) { setErreur((e as Error).message); } };
    const [gain, setGain] = useState('Douleur : vaincu dans un conflit');
    const determination = entierDune(valeurs[regle.determination], 0, 3);
    const [declaration, setDeclaration] = useState('');
    const [principeDeclaration, setPrincipeDeclaration] = useState('');
    let apercu: { apres: number; cout: number } | null = null, refusAchat = '';
    try { const proposition = acheterProgressionDune(regle, valeurs, achat); const apres = entierDune(proposition[regle.progression]); apercu = { apres, cout: entierDune(valeurs[regle.progression]) - apres }; } catch (e) { refusAchat = (e as Error).message; }
    return <div data-carnet-dune className="space-y-3 text-xs">
        <details><summary className="cursor-pointer font-bold">Principes, maximes et Détermination</summary><div className="space-y-2 pt-2">
            {regle.principes.map(p => <label key={p} className="flex flex-wrap gap-2">{p} {s.bafoues.includes(p) ? '— bafoué' : s.recuperes.includes(p) ? '— récupéré' : ''}<input className={`min-w-48 flex-1 ${champ}`} aria-label={`Maxime ${p}`} value={s.maximes[p] ?? ''} onChange={e => ecrire({ [CLE_DUNE]: { ...s, maximes: { ...s.maximes, [p]: e.target.value } } })} /></label>)}
            <label>Principe à récupérer <select className={champ} value={recuperation.principe} onChange={e => setRecuperation(x => ({ ...x, principe: e.target.value }))}>{regle.principes.map(p => <option key={p}>{p}</option>)}</select></label>
            <input className={champ} aria-label="Nouvelle maxime" placeholder="Nouvelle maxime" value={recuperation.maxime} onChange={e => setRecuperation(x => ({ ...x, maxime: e.target.value }))} />
            <label>Ou rééquilibrer avec <select className={champ} value={recuperation.voisin} onChange={e => setRecuperation(x => ({ ...x, voisin: e.target.value }))}><option value="">Nouvelle maxime seulement</option>{regle.principes.filter(p => p !== recuperation.principe).map(p => <option key={p}>{p}</option>)}</select></label>
            <label className="block"><input type="checkbox" checked={recuperation.introspection} onChange={e => setRecuperation(x => ({ ...x, introspection: e.target.checked }))} /> Scène d’introspection achevée, accord du MJ</label>
            <label className="block"><input type="checkbox" checked={recuperation.entre} onChange={e => setRecuperation(x => ({ ...x, entre: e.target.checked }))} /> Entre deux aventures</label>
            <button type="button" className={bouton} disabled={!recuperation.introspection && !recuperation.entre} onClick={() => agir(() => recupererPrincipe(s, valeurs, recuperation.principe, recuperation.maxime, recuperation.voisin || undefined, recuperation.entre), 'Principe récupéré')}>Récupérer ce principe</button>
            <input className={champ} aria-label="Déclaration de Détermination" placeholder="Trait créé, modifié ou retiré ; maxime concernée" value={declaration} onChange={e => setDeclaration(e.target.value)} />
            <select className={champ} aria-label="Maxime de la déclaration Dune" value={principeDeclaration} onChange={e => setPrincipeDeclaration(e.target.value)}><option value="">Maxime pertinente validée</option>{regle.principes.filter(p => s.maximes[p] && !s.bafoues.includes(p)).map(p => <option key={p} value={p}>{p} : {s.maximes[p]}</option>)}</select>
            <button type="button" className={bouton} disabled={!declaration.trim() || determination < 1 || !principeDeclaration || s.bafoues.includes(principeDeclaration)} onClick={() => agir(() => ({ [regle.determination]: determination - 1, [CLE_DUNE]: noterDune({ ...s, determinationDansLaScene: true }, `Déclaration validée à la table (${principeDeclaration}) : ${declaration}`) }), `Déclaration : ${declaration}`)}>Valider la déclaration avec le MJ (1 Détermination)</button>
        </div></details>
        <details><summary className="cursor-pointer font-bold">Atouts du personnage</summary><div className="space-y-2 pt-2">
            <p>Le texte d’origine reste sur la fiche : {String(valeurs[regle.atouts] ?? '')}</p>
            {s.atouts.map(a => <div key={a.id} className="flex flex-wrap items-center gap-2 rounded border border-app-border/30 p-2"><strong>{a.nom}</strong>
                <label>Qualité <input aria-label={`Qualité ${a.nom}`} className={`w-12 ${champ}`} type="number" min={0} max={4} value={a.qualite} onChange={e => ecrire({ [CLE_DUNE]: { ...s, atouts: s.atouts.map(x => x.id === a.id ? { ...x, qualite: entierDune(e.target.value, 0, 4) } : x) } })} /></label>
                <label><input type="checkbox" checked={a.tangible} onChange={e => ecrire({ [CLE_DUNE]: { ...s, atouts: s.atouts.map(x => x.id === a.id ? { ...x, tangible: e.target.checked } : x) } })} /> Tangible</label>
                <label><input type="checkbox" checked={a.permanent} onChange={e => ecrire({ [CLE_DUNE]: { ...s, atouts: s.atouts.map(x => x.id === a.id ? { ...x, permanent: e.target.checked } : x) } })} /> Permanent</label>
                <select aria-label={`Usage ${a.nom}`} className={champ} value={a.usage} onChange={e => ecrire({ [CLE_DUNE]: { ...s, atouts: s.atouts.map(x => x.id === a.id ? { ...x, usage: e.target.value as AtoutDune['usage'] } : x) } })}>{['offensif', 'defensif', 'autre'].map(u => <option key={u}>{u}</option>)}</select>
                <button type="button" className={bouton} onClick={() => ecrire({ [CLE_DUNE]: { ...s, atouts: a.tangible ? s.atouts.map(x => x.id === a.id ? { ...x, neutralise: !x.neutralise } : x) : s.atouts.filter(x => x.id !== a.id) } })}>{a.tangible ? (a.neutralise ? 'Récupérer' : 'Neutraliser') : 'Détruire l’atout intangible'}</button>
            </div>)}
            <input className={champ} aria-label="Nom de l’atout Dune" placeholder="Atout possédé à transcrire" value={nom} onChange={e => setNom(e.target.value)} />
            <button type="button" className={bouton} disabled={!nom.trim()} onClick={() => { ecrire({ [CLE_DUNE]: { ...s, atouts: [...s.atouts, { id: crypto.randomUUID(), nom: nom.trim(), qualite: 0, tangible: true, permanent: true, usage: 'autre', zone: '', neutralise: false }] } }); setNom(''); }}>Ajouter l’atout possédé</button>
        </div></details>
        {meneur && <details><summary className="cursor-pointer font-bold">Aventure, scène et progression</summary><div className="space-y-2 pt-2">
            <p>Aventure : {s.aventure || 'à nommer'} · Scène : {s.scene || 'à nommer'} · {entierDune(valeurs[regle.progression])} points de progression</p>
            <input className={champ} aria-label="Nom de l’aventure Dune" placeholder="Nouvelle aventure" value={aventure} onChange={e => setAventure(e.target.value)} />
            <button type="button" className={bouton} disabled={!aventure.trim() || aventure.trim() === s.aventure || s.bafoues.length > 0} onClick={() => agir(() => ({ [regle.determination]: 1, [CLE_DUNE]: noterDune({ ...s, aventure: aventure.trim(), recuperes: [], determinationDansLaScene: false }, `Début d’aventure : ${aventure}`) }), `Début d’aventure : ${aventure}, Détermination à 1`)}>Début d’aventure : Détermination à 1</button>
            {s.bafoues.length > 0 && <p>Récupérez les principes bafoués entre les aventures avant d’ouvrir la suivante.</p>}
            <input className={champ} aria-label="Nom de la scène Dune" placeholder="Nouvelle scène" value={scene} onChange={e => setScene(e.target.value)} />
            <button type="button" className={bouton} disabled={!scene.trim() || scene.trim() === s.scene} onClick={() => agir(() => ({ [CLE_DUNE]: { ...s, scene: scene.trim(), determinationDansLaScene: false, atouts: s.atouts.filter(a => a.permanent).map(a => ({ ...a, neutralise: false })) } }), `Nouvelle scène : ${scene}`)}>Nouvelle scène du personnage</button>
            <p>La fin de scène de la table (−1 Impulsion) reste au bandeau. Une scène ne remet pas la Détermination à 1.</p>
            <select aria-label="Motif du gain de progression" className={champ} value={gain} onChange={e => setGain(e.target.value)}>{['Douleur : vaincu dans un conflit', 'Échec : difficulté au moins 3', 'Péril : au moins 4 Menace en une dépense', 'Ambition : contribution mineure', 'Ambition : contribution majeure', 'Impressionner le groupe (une fois par séance pour le groupe)'].map(g => <option key={g}>{g}</option>)}</select>
            <button type="button" className={bouton} onClick={() => agir(() => ({ [regle.progression]: entierDune(valeurs[regle.progression]) + (gain.includes('majeure') ? 3 : 1), [CLE_DUNE]: noterDune(s, `Gain validé par le MJ : ${gain}`) }), `Progression : ${gain}`)}>Valider le gain de progression</button>
            <div className="flex flex-wrap gap-2"><select className={champ} aria-label="Genre de progression Dune" value={achat.genre} onChange={e => setAchat({ genre: e.target.value as AchatDune['genre'], objet: e.target.value === 'competence' ? regle.competences[0] : '' })}>{['competence', 'specialisation', 'talent', 'permanent', 'qualite'].map(g => <option key={g}>{g}</option>)}</select>
                {achat.genre === 'competence' ? <select aria-label="Objet de la progression Dune" className={champ} value={achat.objet} onChange={e => setAchat(a => ({ ...a, objet: e.target.value }))}>{regle.competences.map(c => <option key={c}>{c}</option>)}</select>
                    : ['permanent', 'qualite'].includes(achat.genre) ? <select aria-label="Objet de la progression Dune" className={champ} value={achat.objet} onChange={e => setAchat(a => ({ ...a, objet: e.target.value }))}><option value="">Choisir un atout</option>{s.atouts.map(a => <option key={a.id} value={a.id}>{a.nom} · qualité {a.qualite}</option>)}</select>
                    : <input aria-label="Objet de la progression Dune" className={champ} value={achat.objet} onChange={e => setAchat(a => ({ ...a, objet: e.target.value }))} placeholder={achat.genre === 'specialisation' ? 'compétence : spécialisation' : 'Nouveau talent'} />}
                <input aria-label="Reconversion Dune" className={champ} placeholder="Capacité abandonnée (facultatif)" value={achat.reconversion ?? ''} onChange={e => setAchat(a => ({ ...a, reconversion: e.target.value || undefined }))} />
                <button type="button" className={bouton} disabled={!apercu} onClick={() => agir(() => acheterProgressionDune(regle, valeurs, achat), `Progression acquise : ${achat.objet}`)}>Acquérir entre deux aventures</button></div>
            <p>{apercu ? `Aperçu : ${apercu.cout} points, solde ${entierDune(valeurs[regle.progression])} → ${apercu.apres}.` : refusAchat}</p>
            <p>Une acquisition par aventure. Qualité : 2 × nouvelle qualité (errata 1.1). Compétence : 10 + acquisitions antérieures ; reconversion à moitié, arrondi supérieur.</p>
            {s.progression.map((a, i) => <p key={i}>{a.aventure} — {a.genre} : {a.objet}, {a.cout} points</p>)}
        </div></details>}
        {erreur && <p role="alert" className="text-etat-danger">{erreur}</p>}
    </div>;
}
