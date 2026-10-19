import { useState } from 'react';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../types/drivers';
import { type DescripteurDeJet, type ComposanteDeJet, sectionsDeLaComposante } from '../../dice/DescripteurDeJet';
import { DiceEngine, type RollResult } from '../../dice/DiceEngine';
import { EtiquetteDuDegre } from '../../dice/EtiquetteDuDegre';
import { consignerLeJet } from '../../journal/consignerLeJet';
import { preparerJetDuVoyageur } from '../logic/jetDuVoyageur';
import type { NatureDeJetVoyageur } from '../logic/fatigueDuVoyageur';
import { etatsDeSanteVoyageur, effetDuSonne } from '../logic/santeDuVoyageur';
import { estUneReussite } from '../../dice/degresDeReussite';
import { actionAdmetRecours, enregistrerAction, preparerAppelMoral, type ActionVoyageur } from '../logic/recoursDuVoyageur';
import { useOperationDeVoyageur } from '../hooks/useOperationDeVoyageur';
import { ValidationOperationVoyageur } from './ValidationOperationVoyageur';
import { useAstrologieVoyageur } from '../hooks/useAstrologieVoyageur';

/** Panneau spécialisé R1 ; le panneau commun est en cours de travail Nephilim.
 * Les calculs, dés, degrés et transport des résultats restent ceux du socle.
 */
export function PanneauJetVoyageur({descripteur, dice, template, valeurs, personnageId, pourLesJoueurs = false,ecrireSurLaFiche,campaignId}: {
    descripteur: DescripteurDeJet; dice: DiceConfig; template: SheetTemplate; valeurs: Record<string, unknown>;
    personnageId: string; pourLesJoueurs?: boolean;
    ecrireSurLaFiche?: (maj:Record<string,unknown>) => void;
    campaignId?:string;
}) {
    const [champs, setChamps] = useState<Record<string, string>>({});
    const [nature, setNature] = useState<NatureDeJetVoyageur>('action');
    const [difficulte, setDifficulte] = useState(0);
    const [offensif,setOffensif] = useState(false);
    const [appelMoral,setAppelMoral]=useState(false),[perceptionActive,setPerceptionActive]=useState(false),[deDesespoir,setDeDesespoir]=useState('');
    const [dernier, setDernier] = useState<{id:string; resultat: RollResult; seuil: number; titre: string;action?:Omit<ActionVoyageur,'moralAvant'|'moralApres'|'recours'>;empreinte:string;appel:boolean;desespoir?:number} | null>(null);
    const op=useOperationDeVoyageur(valeurs,d=>{ecrireSurLaFiche?.(d);setDernier(null);});
    const astro=useAstrologieVoyageur(campaignId);
    const caracChoisie=nature==='chance'?'chance':champs[descripteur.cible!.caracteristique.id];
    const concerneAstres=caracChoisie==='chance'||nature==='rituel';
    let astrologie=0,erreurAstrale='',bonusMoral=0,erreurMoral='';
    if(concerneAstres&&astro.astrologie){
        if(pourLesJoueurs)erreurAstrale='Ce jet doit être résolu par le MJ avec le nombre astral réel.';
        else try{astrologie=astro.bonus(valeurs.heure_naissance);}catch(e){erreurAstrale=(e as Error).message;}
    }
    try{bonusMoral=preparerAppelMoral(valeurs,appelMoral,deDesespoir.trim()?Number(deDesespoir):undefined).bonus;}catch(e){erreurMoral=(e as Error).message;}
    if(appelMoral&&!actionAdmetRecours({caracteristique:caracChoisie,nature,perceptionActive}))erreurMoral='Cette action n’admet pas l’appel au moral.';
    let preparation;
    try {preparation = preparerJetDuVoyageur(descripteur, template, valeurs, champs, difficulte, nature,{astrologie,moralEngage:bonusMoral});}
    catch (e) {return <p role="alert" className="text-etat-alerte text-sm">{(e as Error).message}</p>;}
    const {jet, malus, assomme} = preparation;
    const sante = etatsDeSanteVoyageur(valeurs);
    const carac = descripteur.cible!.caracteristique;
    const estChance = nature === 'chance' || champs[carac.id] === 'chance';
    const composantes = [carac, ...(descripteur.cible?.ajustement ?? [])];
    const classe = 'w-full min-w-0 max-w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm';
    const selecteur = (c: ComposanteDeJet) => <label key={c.id} className="min-w-0 flex flex-col gap-1 text-xs font-bold">
        {c.label}
        <select className={classe} value={c.id === carac.id && nature === 'chance' ? 'chance' : champs[c.id] ?? ''}
            disabled={estChance && c.id !== carac.id || nature === 'chance' && c.id === carac.id}
            onChange={e => {setChamps(p => ({...p, [c.id]: e.target.value}));}}>
            <option value="">{c.facultative ? '— aucune —' : '— choisir —'}</option>
            {sectionsDeLaComposante(template.sections, c).sections.map(s => <optgroup key={s.id} label={s.label}>
                {s.fields.filter(f => !c.motif || new RegExp(c.motif).test(f.id)).map(f => <option key={f.id} value={f.id}>{f.label} ({String(valeurs[f.id] ?? f.defaultValue)})</option>)}
            </optgroup>)}
        </select>
    </label>;
    return <section data-panneau-de-jet aria-label="Jet du Voyageur" className="space-y-3 rounded-xl border border-accent/30 bg-accent/5 p-4 text-app-text">
        <h3 className="font-bold text-accent">Lancer un test</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{composantes.map(selecteur)}</div>
        <label className="min-w-0 flex flex-col gap-1 text-sm">Nature du jet
            <select aria-label="Nature du jet" className={classe} value={nature} onChange={e => setNature(e.target.value as NatureDeJetVoyageur)}>
                <option value="action">Action physique, mentale ou onirique</option>
                <option value="rituel">Rituel — astrologie applicable</option>
                <option value="chance">CHANCE — sans état général ni compétence</option>
                <option value="guerison">Guérison — sans état général</option>
                <option value="stress">Stress — sans état général</option>
                <option value="resistance">Résistance à la magie — sans état général</option>
                <option value="ethylisme">Éthylisme — fatigue et vie manquante</option>
            </select>
        </label>
        <p className="text-xs">Moral sur VOLONTÉ : {preparation.moralVolonte} · astrologie applicable : {astrologie}. Aucun bonus astrologique sur un sort ordinaire.</p>
        <label className="text-sm block"><input type="checkbox" checked={perceptionActive} onChange={e=>setPerceptionActive(e.target.checked)} /> Perception active et volontaire (pour les recours)</label>
        {!pourLesJoueurs&&<>
            <label className="text-sm block"><input type="checkbox" checked={appelMoral} onChange={e=>setAppelMoral(e.target.checked)} /> Engager le moral avant cette action admissible (+1)</label>
            {appelMoral&&Number(valeurs.moral ?? 0)<=0&&<div className="space-y-2"><label className="flex flex-col text-sm">d20 d’énergie du désespoir<input aria-label="Dé d’énergie du désespoir" type="number" min={1} max={20} className={classe} value={deDesespoir} onChange={e=>setDeDesespoir(e.target.value)} /></label>
                <button type="button" className={classe} disabled={!!op.apercu} onClick={()=>setDeDesespoir(String(DiceEngine.roll(20)))}>Tirer l’énergie du désespoir</button></div>}
        </>}
        {erreurAstrale&&<p role="alert">{erreurAstrale}</p>}{erreurMoral&&<p role="alert">{erreurMoral}</p>}
        <p className="text-sm">État appliqué au jet : <strong>{malus}</strong>. {estChance ? 'CHANCE ignore l’état général et la compétence.'
            : nature === 'action' ? 'Fatigue, vie manquante, éthylisme et surencombrement sont inclus une seule fois.'
                : 'Ce choix retire le malus concerné ; choisissez les autres paramètres selon la procédure du jet.'}</p>
        <p className="text-sm">Chances <strong className="text-accent">{jet.seuil} %</strong> · {jet.explicationDuSeuil}</p>
        {sante?.sonne && <>
            <p role="status" className="text-sm text-etat-alerte">Sonné : significative exigée pour agir ; particulière ramenée à significative.</p>
            <label className="text-sm"><input type="checkbox" checked={offensif} onChange={e => setOffensif(e.target.checked)} /> Action offensive (un échec normal ou particulier devient total)</label>
        </>}
        {sante?.horsCombat && <p role="alert" className="text-sm text-etat-alerte">{sante.libelle} : aucune action possible.</p>}
        {!sante?.horsCombat && assomme && <p role="alert" className="text-sm text-etat-alerte">Assommé de fatigue : récupérer un segment avant d’agir.</p>}
        <label className="flex items-center gap-3 text-sm">Difficulté
            <input type="range" min={-17} max={10} value={difficulte} onChange={e => setDifficulte(Number(e.target.value))} />
            <output>{difficulte}</output>
        </label>
        {jet.avertissements.map(a => <p role="status" key={a} className="text-xs text-etat-alerte">{a}</p>)}
        {valeurs.reve_pts !== undefined && valeurs.reve_pts !== '' && Number(valeurs.reve_pts) === 0 && <p role="alert">Zéro point de rêve : endormi jusqu’à récupération de rêve.</p>}
        <button type="button" disabled={!!op.apercu || !!erreurAstrale || !!erreurMoral || jet.avertissements.length > 0 || sante?.horsCombat || assomme || valeurs.reve_pts !== undefined && valeurs.reve_pts !== '' && Number(valeurs.reve_pts) === 0} className="rounded px-4 py-2 font-bold bg-accent text-app-bg disabled:opacity-40"
            onClick={() => {
                const brut = DiceEngine.rollFromConfig({...dice, successThreshold: jet.seuil, sens: jet.sens},
                    {baseCount: jet.nombreDeDes, gearCount: jet.desSecondaires, echelle: jet.echelle});
                const degre = sante?.sonne && brut.degre && (nature === 'action' || nature === 'ethylisme') ? effetDuSonne(brut.degre,offensif) : brut.degre;
                const reussi = degre ? estUneReussite(degre) : brut.tagSuccess;
                const resultat = {...brut,degre,tagSuccess:reussi,successes:reussi ? 1 : 0,fails:reussi ? 0 : 1};
                const noms = jet.composantes.filter(c => c.champ !== '__rddEtatDuJet')
                    .map(c => template.sections.flatMap(s => s.fields).find(f => f.id === c.champ)?.label ?? c.champ);
                const titre = `${noms.join(' + ')} · état ${malus}, difficulté ${difficulte} (${nature})${sante?.sonne ? ` · sonné${offensif ? ', offensif' : ''}, brut ${brut.degre}` : ''}`;
                const id=crypto.randomUUID();
                const composanteCarac=jet.composantes[0];
                const competence=jet.composantes.find(c=>c.champ!=='__rddEtatDuJet'&&c!==composanteCarac)?.champ ?? '';
                const ajustement=jet.composantes.slice(1).reduce((n,c)=>n+c.valeur,0)+difficulte+preparation.moralVolonte+astrologie+bonusMoral;
                const action=degre ? {id,titre,caracteristique:caracChoisie,competence,nature,valeur:Number(valeurs[caracChoisie]),ajustement,de:brut.total,degre,
                    perceptionActive,sonne:!!sante?.sonne&&(nature==='action'||nature==='ethylisme'),offensif,moralEngage:bonusMoral===1} : undefined;
                setDernier({id, resultat, seuil: jet.seuil, titre,action,empreinte:JSON.stringify(valeurs),appel:appelMoral,desespoir:deDesespoir.trim()?Number(deDesespoir):undefined});
                if(appelMoral&&action&&ecrireSurLaFiche)op.proposer(operation=>enregistrerAction(valeurs,action,true,deDesespoir.trim()?Number(deDesespoir):undefined,operation));
                if (pourLesJoueurs) window.dispatchEvent(new CustomEvent('fiche:resultat', {detail: {
                    characterId: personnageId, titre, total: resultat.total, modifier: resultat.modifier,
                    totalDisplay: `${resultat.totalDisplay} (seuil ${jet.seuil})`, rolls: resultat.rolls,
                    successes: resultat.successes, tagSuccess: resultat.tagSuccess, degre: resultat.degre,
                }}));
                else consignerLeJet({...resultat, titre, seuil: jet.seuil});
            }}>Lancer</button>
        {dernier && <div aria-label="Dernier jet du Voyageur" className="rounded border border-app-border p-3 space-y-1">
            <p className="text-xs">{dernier.titre} · seuil {dernier.seuil} %</p>
            <p className="text-xl font-bold">{dernier.resultat.totalDisplay}</p>
            <EtiquetteDuDegre resultat={dernier.resultat} classes={reussi => reussi ? 'text-etat-succes font-bold' : 'text-etat-danger font-bold'} />
            {ecrireSurLaFiche && dernier.action && <>
                <button type="button" className={classe} disabled={!!op.apercu} onClick={()=>op.proposer(id=>{
                    if(JSON.stringify(valeurs)!==dernier.empreinte)throw new Error('La fiche a changé depuis le jet.');
                    return enregistrerAction(valeurs,dernier.action!,dernier.appel,dernier.desespoir,id);
                })}>Conserver ce résultat pour les recours</button>
                {!dernier.appel&&<button type="button" className={classe} disabled={!!op.apercu} onClick={()=>{
                    op.proposer(id=>{
                        if(JSON.stringify(valeurs)!==dernier.empreinte)throw new Error('La fiche a changé depuis le jet.');
                        const p=enregistrerAction(valeurs,dernier.action!,false,undefined,id);
                        const a=p.maj.__rddAction231 as ActionVoyageur;a.recours='clos';
                        p.details.push('Résultat définitif : aucun recours ultérieur sur cette action.');
                        p.maj.__rddJetPourTache231={id:dernier.id,degre:dernier.resultat.degre,titre:dernier.titre};
                        return p;
                    });
                }}>Conserver ce résultat pour une tâche</button>}
            </>}
        </div>}
        <ValidationOperationVoyageur operation={op} />
    </section>;
}
