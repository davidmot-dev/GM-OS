import { useLayoutEffect, useRef, useState } from 'react';
import type { RegleDeCombatAlien } from '../../../dice/systemes/combatAlien';
import { lireLeCombatAlien } from '../../../dice/systemes/combatAlien';
import { acheterAlien, bilanPxAlien, CLE_PROGRESSION_ALIEN, cleActeAlien, cleFeticheAlien, finirActeAlien, lireProgressionAlien, QUESTIONS_PX_ALIEN, totalExperienceAlien, utiliserFeticheAlien } from '../../../dice/systemes/progressionAlien';
import { refusDeRecuperationAlien } from '../../../dice/systemes/survieAlien';
import { estUnAndroide } from '../../../dice/systemes/paniqueAlien';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useCombatStore } from '../../../combat/useCombatStore';
import { DiceEngine } from '../../../dice/DiceEngine';

const bouton='rounded border border-app-border px-2 py-1 disabled:opacity-40';
const champ='block w-full min-w-0 rounded border border-app-border bg-app-bg p-1';
export default function ProgressionAlien({regle,valeurs,ecrire,personnageId,campaignId,joueur}:{regle:RegleDeCombatAlien;valeurs:Record<string,unknown>;ecrire:(m:Record<string,unknown>)=>void;personnageId?:string;campaignId?:string;joueur:boolean}){
    const cfg=regle.progression!,session=useSessionOSStore(),ref=useRef(valeurs);
    useLayoutEffect(()=>{ref.current=valeurs;},[valeurs]);
    const [message,setMessage]=useState(''),[merite,setMerite]=useState(false),[reponses,setReponses]=useState<boolean[]>(Array(9).fill(false));
    const [entre,setEntre]=useState(false),[type,setType]=useState<'competence'|'talent'>('competence'),[competence,setCompetence]=useState(cfg.competences[0]),[nom,setNom]=useState('');
    const [preuve,setPreuve]=useState(false),[enseignant,setEnseignant]=useState(false),[journee,setJournee]=useState(false),[camarade,setCamarade]=useState(''),[rival,setRival]=useState('');
    const actuel=()=>useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===personnageId)?.sheetData??ref.current;
    const noter=(m:Record<string,unknown>)=>{ref.current={...actuel(),...m};ecrire(m);};
    const s=lireProgressionAlien(valeurs),acte=cleActeAlien(s),objectif=s.objectifs[acte]??'';
    const contexte=(m:Partial<typeof s>)=>{
        noter({[CLE_PROGRESSION_ALIEN]:{...lireProgressionAlien(actuel()),...m}});
        if(m.seance!==undefined||m.mode!==undefined)setReponses(Array(9).fill(false));
        if(m.acte!==undefined||m.scenario!==undefined||m.mode!==undefined)setMerite(false);
    };
    const appliquer=(m:Record<string,unknown>,texte:string)=>{if(!Object.keys(m).length){setMessage('Procédure déjà traitée ou conditions incomplètes.');return;}noter(m);setMessage(texte);};
    const payerLente=()=>{const p=useCombatStore.getState(),c=p.combatants.find(c=>c.sourcePlayerId===personnageId);return !c||p.agirAlien(c.id,'lente',crypto.randomUUID());};
    const enSeance=session.sessions.some(x=>x.campaignId===campaignId&&x.status==='active');
    const autres=session.players.flatMap(p=>p.characters).filter(c=>c.campaignId===campaignId&&c.id!==personnageId);
    return <details data-progression-alien className="space-y-2 rounded border border-app-border p-3 text-xs text-app-text"><summary className="cursor-pointer font-bold">Cinéma et Campagne Alien</summary>
        <p>{s.mode==='cinema'?`Cinéma — ${s.scenario||'scénario à préciser'}, acte ${s.acte}`:`Campagne — séance ${s.seance||'à préciser'}`} ; PX {totalExperienceAlien(cfg,valeurs)} ; Récit {Number(valeurs[cfg.recit])||0}/3.</p>
        <p>Camarade : {String(valeurs[cfg.camarade]??'—')} ; Rival : {String(valeurs[cfg.rival]??'—')}.</p>
        {joueur?<p>Les objectifs Cinéma vous sont remis dans la messagerie privée du Hub. Le meneur valide les fins d’acte, le bilan des PX et les achats.</p>:<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><label>Mode de jeu<select aria-label="Mode de jeu" className={champ} value={s.mode} onChange={e=>contexte({mode:e.target.value as typeof s.mode})}><option value="campagne">Campagne</option><option value="cinema">Cinéma</option></select></label>
                <label>Scénario (nom unique)<input className={champ} value={s.scenario} onChange={e=>contexte({scenario:e.target.value})}/></label>
                <label>Acte courant<select aria-label="Acte courant" className={champ} value={s.acte} onChange={e=>contexte({acte:Number(e.target.value)})}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
                <label>Séance (date ou nom unique)<input className={champ} value={s.seance} onChange={e=>contexte({seance:e.target.value})}/></label></div>
            <p>Reprendre les mêmes noms pour retrouver la même période. Les gains et usages précédents restent conservés.</p>
            {s.mode==='cinema'?<div data-objectifs-alien className="space-y-2">
                <label>Objectif secret de cet acte (MJ uniquement)<textarea className={champ} value={objectif} disabled={!acte} onChange={e=>contexte({objectifs:{...s.objectifs,[acte]:e.target.value}})}/></label>
                <button type="button" className={bouton} disabled={!acte||!objectif.trim()||!personnageId||s.remis[acte]===objectif||session.activeCampaignId!==campaignId} onClick={()=>{
                    const personnage=session.players.flatMap(p=>p.characters).find(c=>c.id===personnageId);if(!personnage||!acte||lireProgressionAlien(actuel()).remis[acte]===objectif)return;
                    session.sendDirectMessage(personnage.id,personnage.name,`Objectif personnel — ${s.scenario}, acte ${s.acte}\n${objectif}`);
                    contexte({remis:{...s.remis,[acte]:objectif}});setMessage('Objectif remis par la messagerie privée, conservé pour la reconnexion.');
                }}>Remettre au seul personnage</button>
                <label className="block"><input type="checkbox" checked={s.meritesActes?.[acte]??merite} disabled={s.finsActe.includes(acte)} onChange={e=>setMerite(e.target.checked)}/> Maman confirme risques ou sacrifices pour cet objectif</label>
                <button type="button" className={bouton} disabled={!acte||s.finsActe.includes(acte)} onClick={()=>appliquer(finirActeAlien(cfg,actuel(),merite),'Fin d’acte validée une fois ; attribution privée, plafond 3.')}>Valider la fin d’acte</button>
                <p>Aucun objectif ni motif d’attribution n’est copié au journal ou aux projections. Garder le champ Objectif personnel de la fiche pour la Campagne.</p>
            </div>:<div data-px-alien className="space-y-1">
                <p>Bilan de fin de séance : un PX par oui, au maximum neuf. Maman tranche après discussion.</p>
                {QUESTIONS_PX_ALIEN.map((q,i)=><label className="block" key={q}><input type="checkbox" checked={(s.detailsBilans?.[s.seance.trim()]??reponses)[i]} disabled={s.bilans.includes(s.seance.trim())} onChange={e=>setReponses(v=>v.map((x,j)=>i===j?e.target.checked:x))}/>{q}</label>)}
                <button type="button" className={bouton} disabled={!s.seance.trim()||s.bilans.includes(s.seance.trim())} onClick={()=>appliquer(bilanPxAlien(cfg,actuel(),reponses),'Bilan des PX validé une seule fois pour cette séance.')}>Attribuer les PX de la séance</button>
                <details data-apprentissage-alien><summary className="cursor-pointer font-bold">Achats et apprentissage — 5 PX</summary>
                    <label className="block"><input type="checkbox" checked={entre} onChange={e=>setEntre(e.target.checked)}/> Entre deux séances, hors séance active</label>
                    <label>Achat<select className={champ} value={type} onChange={e=>setType(e.target.value as typeof type)}><option value="competence">Compétence +1 (maximum 5)</option><option value="talent">Nouveau talent</option></select></label>
                    {type==='competence'?<><label>Compétence à améliorer<select className={champ} value={competence} onChange={e=>setCompetence(e.target.value)}>{cfg.competences.map(c=><option key={c} value={c}>{c.replaceAll('_',' ')} ({Number(valeurs[c])||0})</option>)}</select></label>
                        <label className="block"><input type="checkbox" checked={preuve} onChange={e=>setPreuve(e.target.checked)}/> À zéro : test réussi sans niveau, ou enseignant niveau 1+ pendant un Quart</label></>:<>
                        <label>Nom exact du talent<input className={champ} value={nom} onChange={e=>setNom(e.target.value)}/></label>
                        <label className="block"><input type="checkbox" checked={journee} onChange={e=>setJournee(e.target.checked)}/> Journée d’entraînement accomplie</label>
                        <label className="block"><input type="checkbox" checked={enseignant} onChange={e=>setEnseignant(e.target.checked)}/> Enseignant possédant déjà ce talent : réussite automatique</label>
                        <p>Sinon, test d’Esprit seul ici, sans Stress ni forçage. Une tentative par jour de jeu ; avancer le Jour dans Blessures et soins. Jour {lireLeCombatAlien(valeurs).temps.jour}.</p>
                    </>}
                    <button type="button" className={bouton} disabled={!entre||enSeance} onClick={()=>contexte({achatId:crypto.randomUUID()})}>Préparer un nouvel apprentissage</button>{' '}
                    <button type="button" className={bouton} disabled={!s.achatId||s.achats.includes(s.achatId)||!entre||enSeance||totalExperienceAlien(cfg,valeurs)<5||type==='talent'&&(!journee||!nom.trim())} onClick={()=>{
                        const f=actuel(),jour=lireLeCombatAlien(f).temps.jour,p=lireProgressionAlien(f);
                        if(enSeance||type==='talent'&&p.essaisTalents.includes(`${p.scenario}:${jour}`))return;
                        const res=type==='talent'&&!enseignant?DiceEngine.rollYZE(Math.max(0,Number(f[cfg.esprit])||0),0):undefined;
                        appliquer(acheterAlien(cfg,f,{id:p.achatId??'',entreSeances:entre&&!enSeance,type,champ:competence,nom,prerequis:type==='talent'?journee:preuve,jour,reussites:res?.successes??1,talents:regle.talents}),res?`Esprit seul : ${res.successes??0} réussite(s). Tentative enregistrée ; 5 PX payés uniquement si appris.`:'Achat validé et 5 PX payés.');
                    }}>Valider cet apprentissage</button>
                </details>
            </div>}
            <div data-fetiche-alien className="space-y-1"><p>Objet fétiche : {String(valeurs[cfg.fetiche]??'—')} ; une fois par {s.mode==='cinema'?'acte':'séance'}, action lente généralement.</p>
                <button type="button" className={bouton} disabled={estUnAndroide(regle,valeurs)||!!refusDeRecuperationAlien(regle,valeurs,'stress')||s.fetiches.includes(cleFeticheAlien(s))||!Object.keys(utiliserFeticheAlien(cfg,valeurs,regle.stress)).length} onClick={()=>{
                    const f=actuel(),maj=utiliserFeticheAlien(cfg,f,regle.stress);if(!Object.keys(maj).length||refusDeRecuperationAlien(regle,f,'stress')||estUnAndroide(regle,f))return;
                    if(!payerLente()){setMessage('Aucune action lente disponible.');return;}appliquer(maj,'Objet fétiche utilisé : Stress −1, usage de cette période enregistré.');
                }}>Utiliser le fétiche — Stress −1</button></div>
            <details><summary className="cursor-pointer">Changer Camarade/Rival en fin de séance</summary>
                {([['Camarade',camarade,setCamarade],['Rival',rival,setRival]] as const).map(([label,v,ch])=><label className="block" key={label}>{label}<select className={champ} value={v} onChange={e=>ch(e.target.value)}><option value="">Aucun</option>{autres.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></label>)}
                <button type="button" className={bouton} disabled={!s.seance.trim()||!s.bilans.includes(s.seance.trim())||s.mode!=='campagne'} onClick={()=>noter({[cfg.camarade]:camarade,[cfg.rival]:rival})}>Confirmer les relations de fin de séance</button>
            </details>
            <p>Le bilan des traumatismes après Panique 13+ reste dans Stress et Panique ; aucune blessure ni séquelle n’est effacée ici.</p>
        </>}
        {message&&<p role="status">{message}</p>}
    </details>;
}
