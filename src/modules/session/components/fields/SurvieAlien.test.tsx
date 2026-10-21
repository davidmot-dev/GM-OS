import { useEffect,useState } from 'react';
import { afterEach,describe,expect,it,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,within } from '@testing-library/react';
import SanteAlien from './SanteAlien';
import { DiceEngine } from '../../../dice/DiceEngine';
import { CLE_COMBAT_ALIEN,combatAlienVierge,type RegleDeCombatAlien } from '../../../dice/systemes/combatAlien';
import { CLE_SURVIE_ALIEN,idDeReserveCollective,lireLaSurvieAlien,RESERVES_COLLECTIVES_ALIEN,totalDesRadsAlien } from '../../../dice/systemes/survieAlien';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
import { lireLeSynthetique,synthetiqueVierge } from '../../../dice/systemes/synthetiquesAlien';
import { lireLeCombatAlien } from '../../../dice/systemes/combatAlien';
const r:RegleDeCombatAlien={sante:'sante',force:'force',endurance:'endurance',protection:'protection',talents:'talents',proprietesArmes:'proprietes',stress:'stress',androide:'androide',survie:{air:'air',eau:'eau',nourriture:'nourriture',energie:'energie',radiations:'rads',permanents:'permanents',affame:'affame',dehydrate:'dehydrate',epuise:'epuise',gele:'gele',inventaire:'inventaire',armes:'armes',encombrement:'charge'}};
let fiche:Record<string,unknown>;
function Hote({donnees={},joueur=false}:{donnees?:Record<string,unknown>;joueur?:boolean}){
    const [f,setF]=useState<Record<string,unknown>>({force:4,endurance:2,sante:4,stress:3,air:8,eau:0,nourriture:0,rads:0,permanents:0,[CLE_COMBAT_ALIEN]:combatAlienVierge(),[CLE_SURVIE_ALIEN]:{...lireLaSurvieAlien({}),actif:true},...donnees});
    useEffect(()=>{fiche=f;},[f]);
    return <SanteAlien regle={r} valeurs={f} ecrire={setF} pourLesJoueurs={joueur} consigner={vi.fn()} campaignId="test-a5"/>;
}
const clic=(name:string)=>fireEvent.click(screen.getByRole('button',{name}));
const monter=(element:Parameters<typeof render>[0])=>{const v=render(element);fireEvent.click(screen.getByText('Survie Alien'));return v;};
const resoudre=()=>fireEvent.click(screen.getByRole('button',{name:/^Résoudre :/}));
afterEach(()=>{cleanup();vi.restoreAllMocks();useRessourcesDeTableStore.setState({reserves:{}});});
describe('A5 — survie à la fiche et au Hub',()=>{
    it('la zone irradiée ne consomme pas une réparation synthétique sans restaurer la Santé',()=>{
        monter(<Hote donnees={{androide:true,sante:0,[CLE_SURVIE_ALIEN]:{...lireLaSurvieAlien({}),zone:'tour'},
            [CLE_COMBAT_ALIEN]:{...combatAlienVierge(),temps:{round:0,tour:0,quart:1,jour:0},synthetique:{...synthetiqueVierge(),avaries:[{id:'a',code:3,titre:'Bras',effet:'Un bras paralysé'}],intervention:{id:'rep',mode:'reparer',echeance:1,energie:false}}}}}/>);
        fireEvent.change(screen.getByLabelText('Réussites de Comtech validées'),{target:{value:'1'}});
        const bouton=screen.getByRole('button',{name:'Appliquer le résultat de Comtech'})as HTMLButtonElement;
        expect(bouton.disabled).toBe(true);fireEvent.click(bouton);
        expect(lireLeSynthetique(lireLeCombatAlien(fiche)).intervention?.id).toBe('rep');expect(fiche.sante).toBe(0);
        fireEvent.change(screen.getByLabelText(/Zone irradiée/),{target:{value:'non'}});fireEvent.click(bouton);
        expect(fiche.sante).toBe(4);expect(lireLeSynthetique(lireLeCombatAlien(fiche)).avaries).toHaveLength(0);
    });
    it('Air 8 lance six dés sans Panique, conserve le reçu et ne rejoue pas la perte après remontage',()=>{
        const valeurs=[1,1,6,2,3,4],de=vi.spyOn(DiceEngine,'roll').mockImplementation(()=>valeurs.shift()!);
        const vue=monter(<Hote/>);clic('Demander le test — Air');resoudre();
        expect(de).toHaveBeenCalledTimes(6);expect(fiche).toMatchObject({air:6,stress:3});expect(lireLaSurvieAlien(fiche).traites).toHaveLength(1);
        const copie=JSON.parse(JSON.stringify(fiche));vue.unmount();monter(<Hote donnees={copie}/>);expect(screen.queryByRole('button',{name:/^Résoudre :/})).toBeNull();expect(de).toHaveBeenCalledTimes(6);
    });
    it('une réserve de groupe est partagée et ne retire rien à la réserve individuelle',()=>{
        useRessourcesDeTableStore.getState().fixer('test-a5',RESERVES_COLLECTIVES_ALIEN,idDeReserveCollective('air'),8);
        vi.spyOn(DiceEngine,'roll').mockReturnValue(1);
        monter(<Hote donnees={{air:2,[CLE_SURVIE_ALIEN]:{...lireLaSurvieAlien({}),actif:true,collectif:true}}}/>);
        clic('Demander le test — Air');resoudre();expect(fiche.air).toBe(2);
        expect(useRessourcesDeTableStore.getState().valeur('test-a5',RESERVES_COLLECTIVES_ALIEN,idDeReserveCollective('air'))).toBe(2);
    });
    it('déshydratation : un dégât, un Stress, aucun critique ; boire attend un Quart',()=>{
        monter(<Hote donnees={{sante:1,dehydrate:true,[CLE_SURVIE_ALIEN]:lireLaSurvieAlien({})}}/>);
        clic('Valider quart — survie');resoudre();expect(fiche).toMatchObject({sante:0,stress:4});
        expect((fiche[CLE_COMBAT_ALIEN] as ReturnType<typeof combatAlienVierge>).critiques).toHaveLength(0);
        expect((screen.getByRole('button',{name:/Un Tour de repos écoulé/})as HTMLButtonElement).disabled).toBe(true);
        clic('Boisson prise : commencer le Quart de récupération');expect(fiche.dehydrate).toBe(true);
        clic('Valider quart — survie');expect(fiche.dehydrate).toBe(false);
    });
    it('irradiation : douze dés, chaque 1 blesse sans critique humain ; le surplus HTML est conservé',()=>{
        const de=vi.spyOn(DiceEngine,'roll').mockReturnValue(2);
        monter(<Hote donnees={{rads:10,[CLE_SURVIE_ALIEN]:{...lireLaSurvieAlien({}),radsEnPlus:1}}}/>);
        clic('Demander un Rad reçu');resoudre();expect(de).toHaveBeenCalledTimes(12);
        expect(totalDesRadsAlien(r.survie!,fiche)).toBe(12);expect(fiche.rads).toBe(10);expect(fiche.stress).toBe(3);
    });
    it('hors zone, un 1 rend le Rad permanent ; un autre dé retire un temporaire sans refaire de Panique',()=>{
        const de=vi.spyOn(DiceEngine,'roll').mockReturnValue(1);
        monter(<Hote donnees={{rads:2,[CLE_SURVIE_ALIEN]:lireLaSurvieAlien({})}}/>);
        clic('Valider quart — survie');resoudre();expect(fiche).toMatchObject({rads:2,permanents:1});
        de.mockReturnValue(6);clic('Valider quart — survie');resoudre();expect(fiche).toMatchObject({rads:1,permanents:1});
    });
    it('suffocation : premier malus zéro puis −1, chute sans blessure critique ni Stress supplémentaire',()=>{
        monter(<Hote donnees={{air:0}}/>);clic('Demander le test — Air');resoudre();resoudre();
        expect(fiche).toMatchObject({sante:0,stress:3});expect(lireLaSurvieAlien(fiche)).toMatchObject({dangerAir:true,manqueAir:1});
        clic('Environnement respirable retrouvé');expect(lireLaSurvieAlien(fiche).dangerAir).toBe(false);
    });
    it('le Hub voit les états et échéances sans commande de résolution',()=>{
        monter(<Hote joueur donnees={{affame:true}}/>);
        const survie=screen.getByText('Survie Alien').closest('section')!;
        expect(within(survie).queryAllByRole('button')).toHaveLength(0);
        expect((within(survie).getByLabelText('Affamé')as HTMLInputElement).checked).toBe(true);
    });
});
