import { useState } from 'react';
import { useCombatStore } from '../../../combat/useCombatStore';
import { DiceEngine } from '../../../dice/DiceEngine';
import { lireLeCombatAlien, malusDesBlessures, type CombatAlien, type RegleDeCombatAlien } from '../../../dice/systemes/combatAlien';
import { resoudreAcideAlien } from '../../../dice/systemes/xenomorphesAlien';
import { estUnAndroide } from '../../../dice/systemes/paniqueAlien';
const bouton='rounded border border-app-border px-2 py-1 disabled:opacity-40';
export default function AcideAlien({regle,suivi,actuel,noter,impact,joueur,dire}:{regle:RegleDeCombatAlien;suivi:CombatAlien;actuel:()=>Record<string,unknown>;noter:(s:CombatAlien,m?:Record<string,unknown>)=>void;impact:(n:number,soin?:boolean,procedure?:'acide')=>void;joueur:boolean;dire:(t:string)=>void}){
    const round=useCombatStore(s=>s.round),[sauve,setSauve]=useState(false),a=suivi.acide;
    if(!a)return null;
    const aspersions=a.aspersions??[{id:'ancienne',des:a.des,round:a.round,traiteRound:a.traiteRound}];
    return <div data-acide-alien className="space-y-1 rounded border border-app-border p-2"><p>Acide : {aspersions.filter(a=>a.des>0).map(a=>`${a.des}D6`).join(' + ')||'épuisé'} ; {a.trepas?'Trépas chaque Round jusqu’aux soins réussis.':'prochaine attaque au début du Round suivant si blessé.'}</p>
        {!joueur&&!suivi.mort&&<>
            {aspersions.map((aspersion,i)=><button key={aspersion.id} type="button" className={bouton} disabled={aspersion.des<=0||aspersion.traiteRound===round} onClick={()=>{
                if(aspersion.traiteRound===round)return;
                const f=actuel(),n=aspersion.round===round?aspersion.des:Math.floor(aspersion.des/2),armure=Math.max(0,Number(f[regle.protection])||0);
                const attaque=DiceEngine.rollYZE(n,0),defense=DiceEngine.rollYZE(armure,0);
                const r=resoudreAcideAlien(n,attaque.successes??0,armure,defense.successes??0,Number(f[regle.sante])||0,round);
                impact(r.degats,false,'acide');
                noter({...lireLeCombatAlien(actuel()),acide:{...a,aspersions:aspersions.map(p=>p.id===aspersion.id?{...p,des:r.acide?.des??0,round,traiteRound:round}:p),trepas:a.trepas||!!r.acide?.trepas&&!estUnAndroide(regle,f)}},
                    {[regle.protection]:r.protection});
                dire(`Acide ${n}D6 : ${attaque.successes??0} six ; armure ${armure}D6 : ${defense.successes??0} six. ${r.degats} dégâts ; Protection réduite à ${r.protection}.${r.degats?'':' L’attaque sans dégâts arrête l’acide.'}`);
            }}>Résoudre l’attaque d’acide {i+1} de ce Round</button>)}
            {a.trepas&&<><button type="button" className={bouton} disabled={a.trepasRound===round} onClick={()=>{
                const f=actuel(),res=DiceEngine.rollYZE(Math.max(0,(Number(f[regle.force])||0)+(Number(f[regle.endurance])||0)+malusDesBlessures(lireLeCombatAlien(f),'endurance')),0);
                noter({...suivi,mort:(res.successes??0)===0,acide:{...a,trepasRound:round}});dire(`Trépas acide : ${res.successes??0} réussite(s), sans Stress ni forçage.`);
            }}>Trépas acide — Endurance sans Stress</button>
                <label className="block"><input type="checkbox" checked={sauve} onChange={e=>setSauve(e.target.checked)}/> Soins médicaux réussis confirmés par Maman</label>
                <button type="button" className={bouton} disabled={!sauve} onClick={()=>noter({...suivi,acide:{...a,trepas:false}})}>Sauver : arrêter le Trépas dû à l’acide</button></>}
        </>}
    </div>;
}
