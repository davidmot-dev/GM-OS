import { useState } from 'react';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { attribuerStress, lireProgression, competencesProgressives, declarerArchetype, allouerStress, augmenterVoyageur,
    reporterExperience, acheterVoyage, experienceDuJet, proposerApprentissage, proposerEntrainement, CARACTERISTIQUES_PROGRESSIVES } from '../logic/progressionDuVoyageur';
import { DiceEngine } from '../../dice/DiceEngine';
import { useOperationDeVoyageur } from '../hooks/useOperationDeVoyageur';
import type { DonneesDeVoyage } from '../logic/operationsDeVoyageur';
import { CLASSE_OPERATION as classe, ValidationOperationVoyageur } from './ValidationOperationVoyageur';

export function PanneauProgressionVoyageur({donnees,fiche,appliquer,avantOperation,lectureSeule=false}:{
    donnees:DonneesDeVoyage;fiche:SheetTemplate;appliquer:(d:DonneesDeVoyage)=>void;avantOperation?:()=>boolean;lectureSeule?:boolean;
}) {
    const [points,setPoints]=useState('1'),[motif,setMotif]=useState(''),[cle,setCle]=useState(''),[potentiel,setPotentiel]=useState('');
    const [dommages,setDommages]=useState(false),[memoire,setMemoire]=useState(false),[composante,setComposante]=useState('');
    const [carac,setCarac]=useState('agilite'),[fatigue,setFatigue]=useState('2'),[d6,setD6]=useState(''),[jets,setJets]=useState(''),[partenaire,setPartenaire]=useState('');
    const [semaines,setSemaines]=useState('1'),[maitre,setMaitre]=useState('');
    const op=useOperationDeVoyageur(donnees,appliquer,avantOperation);
    let p;try {p=lireProgression(donnees);}catch(e){return <p role="alert">{(e as Error).message}</p>;}
    const competences=competencesProgressives(fiche),champs=fiche.sections.flatMap(s=>s.fields).filter(c=>competences.some(f=>f.id===c.id)||CARACTERISTIQUES_PROGRESSIVES.includes(c.id));
    return <section aria-label="Progression et Archétype RdD" className="rounded-xl border border-accent/30 p-4 space-y-3 text-app-text bg-app-surface">
        <h3 className="font-bold text-accent">Stress, expérience et Archétype</h3>
        <p>Stress {String(donnees.stress ?? 0)} · XP de stress à répartir {p.reserveStress}</p>
        <p className="text-sm">La conversion se prépare dans le bilan du Château Dormant, après une heure de sommeil. L’Archétype vient de votre carnet, jamais des niveaux actuels.</p>
        <details><summary className="cursor-pointer">Carnet d’expérience et potentiel</summary>
            <ul className="text-sm space-y-1">{champs.filter(c=>p.archetype[c.id]!==undefined||p.stress[c.id]||p.exercice[c.id]).map(c=><li key={c.id}>
                {c.label} : niveau {String(donnees[c.id])}, potentiel {p.archetype[c.id] ?? 'non déclaré'}, XP stress {p.stress[c.id] ?? 0}, exercice {p.exercice[c.id] ?? 0}.
            </li>)}</ul>
        </details>
        {lectureSeule ? <p className="text-sm">Le MJ valide les attributions et les augmentations avec vous.</p> : <>
            <fieldset disabled={!!op.apercu} className="min-w-0 space-y-3">
                <label className="flex flex-col text-sm">Points de stress, XP ou voyage<input aria-label="Points de progression" type="number" min={1} className={classe} value={points} onChange={e=>setPoints(e.target.value)} /></label>
                <label className="flex flex-col text-sm">Situation ou provenance<input aria-label="Situation de progression" maxLength={160} className={classe} value={motif} onChange={e=>setMotif(e.target.value)} /></label>
                <button className={classe} type="button" onClick={()=>op.proposer(id=>attribuerStress(donnees,Number(points),motif,id))}>Préparer l’attribution de stress</button>
                <details><summary className="cursor-pointer font-bold">Répartir et progresser</summary><div className="my-3 space-y-3">
                    <label className="flex flex-col text-sm">Valeur à faire progresser<select aria-label="Valeur de progression" className={classe} value={cle} onChange={e=>setCle(e.target.value)}>
                        <option value="">Choisir</option>{champs.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
                    <label className="flex flex-col text-sm">Potentiel de l’Archétype reporté<input aria-label="Potentiel de l’Archétype" type="number" min={0} className={classe} value={potentiel} onChange={e=>setPotentiel(e.target.value)} /></label>
                    <p className="text-xs">L’Archétype complet se répartit sur toutes les compétences : un +11, un +10, deux +9, trois +8, quatre +7, puis cinq +6 jusqu’à dix +1, le reste à zéro. Ce carnet reporte aussi les potentiels augmentés dans une ancienne vie.</p>
                    <button className={classe} type="button" disabled={!potentiel.trim()} onClick={()=>op.proposer(id=>declarerArchetype(donnees,fiche,cle,Number(potentiel),id))}>Reporter le potentiel</button>
                    <button className={classe} type="button" onClick={()=>op.proposer(id=>allouerStress(donnees,fiche,cle,Number(points),id))}>Allouer les XP de stress</button>
                    <button className={classe} type="button" onClick={()=>op.proposer(id=>reporterExperience(donnees,fiche,cle,Number(points),motif,id))}>Reporter des XP d’exercice ou d’apprentissage</button>
                    <button className={classe} type="button" onClick={()=>op.proposer(id=>augmenterVoyageur(donnees,fiche,cle,id))}>Préparer l’augmentation d’un niveau</button>
                    <button className={classe} type="button" onClick={()=>op.proposer(id=>acheterVoyage(donnees,Number(points),id))}>Convertir des XP de stress en voyage</button>
                </div></details>
                <details><summary className="cursor-pointer font-bold">Une heure d’entraînement</summary><div className="space-y-3 my-3">
                    <p className="text-xs">Compétence choisie ci-dessus (« Valeur à faire progresser »). Une heure pleine, deux points de fatigue au moins ; 1d6 jets à un ajustement final de −1. Chaque particulière : +1 XP ; chaque échec total : une maladresse. La mêlée s’entraîne à deux.</p>
                    <label className="flex flex-col text-sm">Caractéristique du jet<select aria-label="Caractéristique de l’entraînement" className={classe} value={carac} onChange={e=>setCarac(e.target.value)}>
                        {CARACTERISTIQUES_PROGRESSIVES.concat(['melee','tir','lancer','derobee']).map(c=><option key={c} value={c}>{fiche.sections.flatMap(s=>s.fields).find(x=>x.id===c)?.label ?? c}</option>)}</select></label>
                    <label className="flex flex-col text-sm">Fatigue de l’heure<input aria-label="Fatigue de l’entraînement" type="number" min={2} className={classe} value={fatigue} onChange={e=>setFatigue(e.target.value)} /></label>
                    <label className="flex flex-col text-sm">Niveau du partenaire (mêlée)<input aria-label="Niveau du partenaire" type="number" className={classe} value={partenaire} onChange={e=>setPartenaire(e.target.value)} /></label>
                    <div className="flex flex-wrap gap-2 items-end">
                        <label className="flex flex-col text-sm">d6 : nombre de jets<input aria-label="d6 d’entraînement" type="number" min={1} max={6} className={`${classe} w-20`} value={d6} onChange={e=>setD6(e.target.value)} /></label>
                        <button className={classe} type="button" onClick={()=>{const n=DiceEngine.roll(6);setD6(String(n));setJets(Array.from({length:n},()=>DiceEngine.roll(100)).join(' '));}}>Tirer le d6 et les jets</button>
                    </div>
                    <label className="flex flex-col text-sm">Jets d100 (séparés par des espaces)<input aria-label="Jets d’entraînement" className={classe} value={jets} onChange={e=>setJets(e.target.value)} /></label>
                    <button className={classe} type="button" disabled={!cle||!d6} onClick={()=>op.proposer(id=>proposerEntrainement(donnees,fiche,{competence:cle,caracteristique:carac,fatigue:Number(fatigue),d6:Number(d6),
                        jets:jets.trim()?jets.trim().split(/[\s,;]+/).map(Number):[],partenaire:partenaire.trim()?Number(partenaire):undefined},id))}>Préparer l’entraînement</button>
                </div></details>
                <details><summary className="cursor-pointer font-bold">Apprentissage avec un maître</summary><div className="space-y-3 my-3">
                    <p className="text-xs">Entre deux aventures, cinq heures par jour : 3 XP par semaine jusqu’au niveau 0, 1 par semaine jusqu’à +3, puis 1 toutes les 2 semaines pour +4, 3 pour +5… Jamais au-delà du niveau du maître.</p>
                    <label className="flex flex-col text-sm">Semaines<input aria-label="Semaines d’apprentissage" type="number" min={1} className={classe} value={semaines} onChange={e=>setSemaines(e.target.value)} /></label>
                    <label className="flex flex-col text-sm">Niveau du maître<input aria-label="Niveau du maître" type="number" className={classe} value={maitre} onChange={e=>setMaitre(e.target.value)} /></label>
                    <button className={classe} type="button" disabled={!cle||!maitre.trim()} onClick={()=>op.proposer(id=>proposerApprentissage(donnees,fiche,cle,Number(semaines),Number(maitre),id))}>Préparer l’apprentissage</button>
                </div></details>
                <details><summary className="cursor-pointer font-bold">Expérience du dernier résultat définitif</summary><div className="space-y-3 my-3">
                    <p className="text-xs">Particulière d’action, ajustement final négatif. Le même résultat ne rapporte qu’une fois. Les XP de Draconic vont en voie.</p>
                    <label className="text-sm block"><input type="checkbox" checked={dommages} onChange={e=>setDommages(e.target.checked)} /> Attaque : des dommages ont été infligés</label>
                    <label className="text-sm block"><input type="checkbox" checked={memoire} onChange={e=>setMemoire(e.target.checked)} /> Simple test de mémoire en INTELLECT/Connaissance</label>
                    <label className="flex flex-col text-sm">Composante recevant le reliquat d’une dérivée<select aria-label="Composante du reliquat" className={classe} value={composante} onChange={e=>setComposante(e.target.value)}>
                        <option value="">Choisir si nécessaire</option>{['force','agilite','vue','dexterite'].map(c=><option key={c}>{c}</option>)}</select></label>
                    <button className={classe} type="button" onClick={()=>op.proposer(id=>experienceDuJet(donnees,fiche,dommages,memoire,composante,id))}>Préparer l’XP du résultat conservé</button>
                </div></details>
            </fieldset><ValidationOperationVoyageur operation={op} />
        </>}
    </section>;
}
