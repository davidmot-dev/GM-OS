import { useState } from 'react';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { attribuerStress, lireProgression, competencesProgressives, declarerArchetype, allouerStress, augmenterVoyageur,
    reporterExperience, acheterVoyage, experienceDuJet, CARACTERISTIQUES_PROGRESSIVES } from '../logic/progressionDuVoyageur';
import { useOperationDeVoyageur } from '../hooks/useOperationDeVoyageur';
import type { DonneesDeVoyage } from '../logic/operationsDeVoyageur';
import { CLASSE_OPERATION as classe, ValidationOperationVoyageur } from './ValidationOperationVoyageur';

export function PanneauProgressionVoyageur({donnees,fiche,appliquer,avantOperation,lectureSeule=false}:{
    donnees:DonneesDeVoyage;fiche:SheetTemplate;appliquer:(d:DonneesDeVoyage)=>void;avantOperation?:()=>boolean;lectureSeule?:boolean;
}) {
    const [points,setPoints]=useState('1'),[motif,setMotif]=useState(''),[cle,setCle]=useState(''),[potentiel,setPotentiel]=useState('');
    const [dommages,setDommages]=useState(false),[memoire,setMemoire]=useState(false),[composante,setComposante]=useState('');
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
