import { useEffect,useState } from 'react';
import { afterEach,describe,expect,it,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import ProgressionAlien from './ProgressionAlien';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useCombatStore } from '../../../combat/useCombatStore';
import { CLE_PROGRESSION_ALIEN,lireProgressionAlien } from '../../../dice/systemes/progressionAlien';
import type { RegleDeCombatAlien } from '../../../dice/systemes/combatAlien';
const r:RegleDeCombatAlien={sante:'sante',force:'force',endurance:'endurance',protection:'protection',talents:'talents',proprietesArmes:'proprietes',stress:'stress',androide:'androide',progression:{experience:'px',recit:'recit',fetiche:'objet',camarade:'camarade',rival:'rival',esprit:'esprit',competences:['comtech']}};
let fiche:Record<string,unknown>;
function Hote({joueur=false,mode='campagne',donnees={}}:{joueur?:boolean;mode?:'campagne'|'cinema';donnees?:Record<string,unknown>}){
    const [f,setF]=useState<Record<string,unknown>>({px:10,comtech:1,recit:2,stress:3,objet:'Photo',[CLE_PROGRESSION_ALIEN]:{...lireProgressionAlien({}),mode,seance:'s1',scenario:'film',acte:1},...donnees});
    useEffect(()=>{fiche=f;},[f]);
    return <ProgressionAlien regle={r} valeurs={f} ecrire={m=>setF(f=>({...f,...m}))} joueur={joueur} campaignId="c"/>;
}
const clic=(name:string)=>fireEvent.click(screen.getByRole('button',{name}));
afterEach(()=>{cleanup();vi.restoreAllMocks();useSessionOSStore.setState({sessions:[]});});
describe('A7 — commandes du meneur et lecture seule du Hub',()=>{
    it('n’expose ni objectif ni commande au joueur',()=>{render(<Hote joueur/>);expect(screen.queryAllByRole('button')).toHaveLength(0);expect(screen.queryByLabelText(/Objectif secret/)).toBeNull();});
    it('attribue le bilan une seule fois et préserve le reçu dans la fiche',()=>{render(<Hote/>);fireEvent.click(screen.getByLabelText('Présence à la séance'));clic('Attribuer les PX de la séance');expect(fiche.px).toBe(11);expect((screen.getByRole('button',{name:'Attribuer les PX de la séance'})as HTMLButtonElement).disabled).toBe(true);});
    it('un achat préparé se paie une fois puis demande une nouvelle préparation',()=>{
        useSessionOSStore.setState({sessions:[]});render(<Hote/>);fireEvent.click(screen.getByLabelText('Entre deux séances, hors séance active'));clic('Préparer un nouvel apprentissage');clic('Valider cet apprentissage');expect(fiche).toMatchObject({px:5,comtech:2});expect((screen.getByRole('button',{name:'Valider cet apprentissage'})as HTMLButtonElement).disabled).toBe(true);
    });
    it('le fétiche est consommé une seule fois dans cette période',()=>{
        useCombatStore.setState({combatants:[]});render(<Hote mode="cinema"/>);clic('Utiliser le fétiche — Stress −1');expect(fiche.stress).toBe(2);expect(lireProgressionAlien(fiche).fetiches).toEqual(['acte:film:1']);expect((screen.getByRole('button',{name:'Utiliser le fétiche — Stress −1'})as HTMLButtonElement).disabled).toBe(true);
    });
    it('relit les réponses validées, les verrouille, puis ouvre un bilan vierge à la séance suivante',()=>{
        const v=render(<Hote/>);fireEvent.click(screen.getByLabelText('Présence à la séance'));clic('Attribuer les PX de la séance');const copie=JSON.parse(JSON.stringify(fiche));v.unmount();render(<Hote donnees={copie}/>);
        expect((screen.getByLabelText('Présence à la séance')as HTMLInputElement).checked).toBe(true);expect((screen.getByLabelText('Présence à la séance')as HTMLInputElement).disabled).toBe(true);
        fireEvent.change(screen.getByLabelText('Séance (date ou nom unique)'),{target:{value:'s2'}});expect((screen.getByLabelText('Présence à la séance')as HTMLInputElement).checked).toBe(false);expect((screen.getByLabelText('Présence à la séance')as HTMLInputElement).disabled).toBe(false);
    });
});
