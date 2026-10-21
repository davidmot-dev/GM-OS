import { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { budgetDuCombattantAlien, cartesDuCombattantAlien, fileDesInitiativesAlien, payerActionAlien, type ActionAlien } from '../../dice/systemes/actionsAlien';

const bouton='rounded border border-app-border px-2 py-1 disabled:opacity-40';
/** Le MJ déclare les actions avant les dés, y compris les réactions hors tour. */
export default function ActionsAlien({id,personnageId,joueur=false}:{id?:string;personnageId?:string;joueur?:boolean}){
    const s=useCombatStore(),c=s.combatants.find(c=>id?c.id===id:c.sourcePlayerId===personnageId);
    const [selection,setSelection]=useState<number>(),[direction,setDirection]=useState(''),[pret,setPret]=useState(false),[cible,setCible]=useState(''),[parole,setParole]=useState(false),[message,setMessage]=useState('');
    if(!c)return null;
    const cartes=cartesDuCombattantAlien(c),active=c.alien?.carteActive??c.init,carte=selection!==undefined&&cartes.includes(selection)?selection:cartes.includes(active)?active:cartes[0];
    const b=budgetDuCombattantAlien(c,s.round,carte);
    const peutPayer=(a:ActionAlien)=>payerActionAlien(b,a,'apercu',direction)!==b;
    const payer=(a:ActionAlien)=>setMessage(s.agirAlien(c.id,a,crypto.randomUUID(),carte,direction)?'Action payée. Résoudre maintenant ses dés et ses effets.':'Action indisponible sur ce créneau.');
    const file=fileDesInitiativesAlien(s.combatants),debut=file[0]?.id===s.combatants[s.currentTurnIdx]?.id&&file[0]?.carte===(s.combatants[s.currentTurnIdx]?.alien?.carteActive??s.combatants[s.currentTurnIdx]?.init)
        &&s.combatants.every(c=>Object.entries(c.alien?.budgets??{}).filter(([k])=>k.startsWith(`${s.round}:`)).every(([,b])=>!b.recus.length));
    return <details data-actions-alien className="space-y-2 rounded border border-app-border p-2 text-xs text-app-text"><summary className="cursor-pointer font-bold">Actions Alien — Round {s.round}</summary>
        <p>Cartes : {cartes.join(', ')} ; une seule Santé. Créneau {carte} : {b.lentes} lente, {b.rapides} rapide(s) dépensée(s).</p>
        {b.surveillance&&<p>Surveillance : {b.surveillance}. Le tir utilise la lente réservée.</p>}
        <p>Déclarer et payer ici avant les jets, aides et effets : une lente + une rapide, ou deux rapides. Le panneau de dés ne paie pas une seconde fois. Bloquer se déclare avant le jet adverse.</p>
        {!joueur&&<>
            <label>Carte pour l’action ou la réaction<select className="block bg-app-bg" value={carte} onChange={e=>setSelection(Number(e.target.value))}>{cartes.map(n=><option key={n} value={n}>{n}</option>)}</select></label>
            <div className="flex flex-wrap gap-2">{([['lente','Payer une lente'],['rapide','Payer une rapide'],['blocage','Bloquer — rapide hors tour']] as const).map(([a,t])=><button key={a} type="button" className={bouton} disabled={!peutPayer(a)} onClick={()=>payer(a)}>{t}</button>)}</div>
            <label className="block"><input type="checkbox" checked={pret} onChange={e=>setPret(e.target.checked)}/> Arme à distance prête et aucun ennemi au Contact</label>
            <label>Direction surveillée<input className="block w-full bg-app-bg" value={direction} onChange={e=>setDirection(e.target.value)}/></label>
            <button type="button" className={bouton} disabled={!pret||!peutPayer('surveillance')} onClick={()=>payer('surveillance')}>Surveiller — rapide, lente réservée</button>{' '}
            <button type="button" className={bouton} disabled={!peutPayer('tir-surveillance')} onClick={()=>payer('tir-surveillance')}>Tir de surveillance — lente hors tour</button>{' '}
            <button type="button" className={bouton} disabled={!b.surveillance} onClick={()=>{s.updateCombatant(c.id,{alien:{...c.alien!,budgets:{...c.alien?.budgets,[`${s.round}:${carte}`]:{...b,surveillance:undefined}}}});}}>Interrompre : attaque au contact ou dégâts</button>
            {c.isPlayer&&<div className="space-y-1"><label>Échanger avec un PJ<select className="block bg-app-bg" value={cible} onChange={e=>setCible(e.target.value)}><option value="">Choisir</option>{s.combatants.filter(x=>x.isPlayer&&x.id!==c.id).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
                <label><input type="checkbox" checked={parole} onChange={e=>setParole(e.target.checked)}/> Les deux PJ peuvent se parler</label>
                <button type="button" className={bouton} disabled={!debut||!parole||!cible} onClick={()=>{
                    const autre=s.combatants.find(x=>x.id===cible);if(!autre||!debut||!parole)return;
                    s.updateCombatant(c.id,{init:autre.init,alien:{cartes:[autre.init],carteActive:autre.init,budgets:{}}});
                    s.updateCombatant(autre.id,{init:c.init,alien:{cartes:[c.init],carteActive:c.init,budgets:{}}});s.sortInitiative(true);
                }}>Échanger au début du Round</button></div>}
        </>}
        {message&&<p role="status">{message}</p>}
    </details>;
}
