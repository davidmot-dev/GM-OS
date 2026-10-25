import { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { ecrireLaFicheDuCombattant, valeursDuCombattant } from '../ficheDesCombattants';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { CLE_DUNE, attaqueDune, entierDune, lireDune, type RegleDeDune, type ValeursDune } from '../../dice/systemes/duneRegles';
import { ecrireDefaiteDune } from '../defaiteDeDune';
import type { Combatant } from '../types';
const bouton = 'rounded border border-app-border/50 px-2 py-1 disabled:opacity-30';
const champ = 'rounded border border-app-border/50 bg-app-bg px-2 py-1';

export function AttaqueDune({ regle, valeurs, payer, consigner, appliquee }: { regle: RegleDeDune; valeurs: ValeursDune; payer: (n: number, motif: string) => boolean; consigner: (t: string, l: string) => void; appliquee: () => void }) {
    const combattants = useCombatStore(s => s.combatants), [cibleId, setCible] = useState(''), [genre, setGenre] = useState<'mineur' | 'notable' | 'militaire'>('notable');
    const [competence, setCompetence] = useState(regle.competences[1] ?? regle.competences[0]), [defense, setDefense] = useState(0), [qualite, setQualite] = useState(0), [ameliorer, setAmeliorer] = useState(false), [faite, setAppliquee] = useState(false);
    const cible = combattants.find(c => c.id === cibleId), v = cible ? valeursDuCombattant(cible) : {}, ancien = lireDune(v).defaite;
    const competenceDefensive = entierDune(v[competence], 4, 8);
    const r = attaqueDune(genre, competenceDefensive, defense, ancien?.progression ?? entierDune(cible?.healthSystem?.data.filled), qualite, true, ameliorer);
    const atouts = lireDune(valeurs).atouts.filter(a => a.usage === 'offensif' && !a.neutralise);
    return <fieldset disabled={faite} className="space-y-2 rounded border border-app-border/40 p-2" data-attaque-dune>
        <legend>Appliquer cette attaque réussie (MJ)</legend>
        <label>Cible <select aria-label="Cible de l’attaque Dune" className={champ} value={cibleId} onChange={e => setCible(e.target.value)}><option value="">Combattant du plateau</option>{combattants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Type <select className={champ} value={genre} onChange={e => setGenre(e.target.value as typeof genre)}><option value="mineur">Personnage mineur</option><option value="notable">Principal / notable / majeur</option><option value="militaire">Atout militaire (guerre)</option></select></label>
        <label>Compétence défensive <select className={champ} value={competence} onChange={e => setCompetence(e.target.value)}>{regle.competences.map(c => <option key={c}>{c}</option>)}</select></label>
        <label>Qualité défensive totale <input aria-label="Qualité défensive Dune" type="number" min={0} className={`w-14 ${champ}`} value={defense} onChange={e => setDefense(entierDune(e.target.value))} /></label>
        <label>Atout offensif <select className={champ} onChange={e => setQualite(entierDune(e.target.value, 0, 4))} defaultValue=""><option value="">Qualité saisie / sans atout</option>{atouts.map(a => <option key={a.id} value={a.qualite}>{a.nom} (Q{a.qualite})</option>)}</select></label>
        <label>Qualité offensive <input aria-label="Qualité offensive Dune" type="number" min={0} max={4} className={`w-14 ${champ}`} value={qualite} onChange={e => setQualite(entierDune(e.target.value, 0, 4))} /></label>
        <label><input type="checkbox" checked={ameliorer} onChange={e => setAmeliorer(e.target.checked)} /> Qualité +1 pour cette attaque (2 Impulsion)</label>
        <p>Conditions : {competenceDefensive} + {defense} = {r.conditions} ; progression {ancien?.progression ?? entierDune(cible?.healthSystem?.data.filled)} → {r.apres}. {genre === 'mineur' ? 'Une attaque réussie suffit.' : `2 + qualité ${r.qualite}.`} {r.vaincu && 'La cible sera vaincue.'}</p>
        <p className="text-app-text/60">Chaque atout défensif dans la zone augmente aussi la difficulté de l’attaque de 1 : à intégrer avant le lancer. En mode Architecte, ciblez l’unité, pas son commandant.</p>
        <button type="button" className={bouton} disabled={!cible || faite} onClick={() => {
            if (!cible || (r.cout && !payer(r.cout, 'Dune : qualité offensive +1'))) return;
            ecrireDefaiteDune(cible, { genre, vaincu: r.vaincu, progression: r.apres, conditions: r.conditions, qualite: r.qualite, durable: ancien?.durable ?? '', recuperation: 0, survieScene: ancien?.survieScene });
            consigner('Dune · attaque', `${cible.name} : ${r.apres}/${r.conditions}${r.vaincu ? ', vaincu' : ''}`); setAppliquee(true); appliquee();
        }}>Appliquer une fois à la cible</button>
    </fieldset>;
}

export function DefaiteDune({ combattant, regle }: { combattant: Combatant; regle: RegleDeDune }) {
    const v = valeursDuCombattant(combattant), s = lireDune(v), d = s.defaite;
    const [complication, setComplication] = useState(''), [enMenace, setEnMenace] = useState(false), [points, setPoints] = useState(2), [testReussi, setTestReussi] = useState(false), [erreur, setErreur] = useState('');
    const [exception, setException] = useState(false);
    const [nouvelleScene, setNouvelleScene] = useState('');
    if (!d) return null;
    const cout = 1 + d.qualite, ennemi = !combattant.isPlayer && combattant.faction === 'enemy';
    return <details className="p-3 text-xs" data-defaite-dune><summary>Défaite et récupération Dune · {d.vaincu ? 'vaincu' : 'actif'} · {d.progression}/{d.conditions}</summary>
        <p>Scène du personnage : {s.scene || 'à nommer dans le carnet'} · survie : {d.survieScene === s.scene && s.scene ? 'déjà utilisée' : 'disponible'}</p>
        <label>Nouvelle scène du combattant <input aria-label="Nouvelle scène du combattant Dune" className={champ} value={nouvelleScene} onChange={e => setNouvelleScene(e.target.value)} /></label>
        <button type="button" className={bouton} disabled={!nouvelleScene.trim() || nouvelleScene.trim() === s.scene} onClick={() => {
            ecrireLaFicheDuCombattant(combattant, { [CLE_DUNE]: { ...s, scene: nouvelleScene.trim(), determinationDansLaScene: false } }); setNouvelleScene('');
        }}>Ouvrir la scène du combattant</button>
        <input className={champ} aria-label="Complication de survie Dune" placeholder="Complication / conséquence durable" value={complication} onChange={e => setComplication(e.target.value)} />
        {!ennemi && <label><input type="checkbox" checked={enMenace} onChange={e => setEnMenace(e.target.checked)} /> Offrir de la Menace</label>}
        {d.genre === 'mineur' && <label><input type="checkbox" checked={exception} onChange={e => setException(e.target.checked)} /> Le MJ valide un talent autorisant exceptionnellement la survie</label>}
        <button type="button" className={bouton} disabled={!d.vaincu || !s.scene || d.survieScene === s.scene || !complication.trim() || (d.genre === 'mineur' && !exception)} onClick={() => {
            const st = useSessionOSStore.getState(), r = st.getActiveDriver()?.ressourcesDeTable, table = useRessourcesDeTableStore.getState(), cid = st.activeCampaignId;
            if (!cid || !r) return setErreur('Campagne active requise.');
            if (ennemi && table.valeur(cid, r, 'menace') < cout) return setErreur('Menace insuffisante.');
            if (ennemi) table.depenser(cid, r, 'menace', cout, 'Dune : survivre à la défaite');
            else table.depenser(cid, r, 'impulsion', cout, 'Dune : survivre à la défaite', enMenace ? cout : 0);
            ecrireDefaiteDune(combattant, { ...d, vaincu: false, survieScene: s.scene }, { [regle.traits]: `${String(v[regle.traits] ?? '')}\n${complication}`.trim() }); setErreur('');
        }}>Survivre à la défaite ({cout} {ennemi ? 'Menace dépensée' : enMenace ? 'Menace concédée' : 'Impulsion'})</button>
        <p>Mineurs : pas de survie, sauf talent explicitement validé par le MJ. La complication est choisie ; aucune blessure durable automatique.</p>
        <button type="button" className={bouton} disabled={!d.vaincu || !complication.trim()} onClick={() => ecrireDefaiteDune(combattant, { ...d, durable: complication })}>Noter une conséquence durable choisie par le MJ</button>
        <label className="block"><input type="checkbox" checked={testReussi} onChange={e => setTestReussi(e.target.checked)} /> Test d’aide réussi (difficulté 2 pour stabiliser / retirer un trait)</label>
        {d.durable ? <button type="button" className={bouton} disabled={!testReussi || !d.vaincu} onClick={() => { ecrireDefaiteDune(combattant, { ...d, durable: '' }); setTestReussi(false); }}>Empêcher la conséquence durable (reste vaincu)</button>
            : <><label>Progression de récupération <input type="number" min={0} className={`w-14 ${champ}`} value={points} onChange={e => setPoints(entierDune(e.target.value))} /></label><button type="button" className={bouton} disabled={!testReussi || !d.vaincu} onClick={() => {
                const apres = d.recuperation + points, fini = apres >= 4 + d.qualite;
                ecrireDefaiteDune(combattant, { ...d, recuperation: apres, vaincu: !fini, progression: fini ? 0 : d.progression }); setTestReussi(false);
            }}>Faire progresser la récupération ({d.recuperation}/{4 + d.qualite})</button></>}
        {erreur && <p role="alert">{erreur}</p>}
    </details>;
}
