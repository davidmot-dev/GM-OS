import { render,screen,fireEvent,cleanup } from '@testing-library/react';
import { afterEach,describe,expect,it,vi } from 'vitest';
import { DiceEngine } from '../../../dice/DiceEngine';
import { CLE_CTHULHU_HACK,lireCH,signalerImpactCH,type RegleCthulhuHack } from '../../../dice/systemes/cthulhuHack';
import SuiviCthulhuHack from './SuiviCthulhuHack';
const r:RegleCthulhuHack={pv:'hp',fortune:'fortune',physique:['force','dexterite','constitution'],personnalite:['sagesse','intelligence','charisme'],armures:[]};
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe('confirmation du MJ sur la fiche',()=>{
    it('prévisualise les pertes, les conserve au remontage, empêche une seconde confirmation',()=>{
        vi.spyOn(DiceEngine,'roll').mockReturnValue(2);
        let fiche=signalerImpactCH(r,{hp:8,force:11,sagesse:11,dexterite:11,constitution:11,intelligence:11,charisme:11},8,0,8,'chute');
        const ecrire=(maj:Record<string,unknown>)=>{fiche={...fiche,...maj};};
        const vue=render(<SuiviCthulhuHack regle={r} valeurs={fiche} ecrire={ecrire} maxPV={8}/>);
        expect((screen.getByText('Tirer le D10 de Hors Jeu') as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByLabelText('Le danger est écarté (confirmation du MJ)'));fireEvent.click(screen.getByText('Tirer le D10 de Hors Jeu'));
        fireEvent.change(screen.getByLabelText('Perte force'),{target:{value:'5'}});fireEvent.change(screen.getByLabelText('Perte sagesse'),{target:{value:'1'}});
        expect(fiche.force).toBe(11);fireEvent.click(screen.getByText('Confirmer les pertes permanentes'));expect(fiche.force).toBe(6);
        vue.unmount();render(<SuiviCthulhuHack regle={r} valeurs={JSON.parse(JSON.stringify(fiche))} ecrire={ecrire} maxPV={8}/>);
        expect(screen.queryByText('Confirmer les pertes permanentes')).toBeNull();expect(lireCH(fiche).consequences[0].applique).toBe(true);
    });
    it('la vue joueur conserve les informations et n’expose aucune commande de MJ',()=>{
        render(<SuiviCthulhuHack regle={r} valeurs={{[CLE_CTHULHU_HACK]:{...lireCH({}),dernier:'Os brisés'}}} ecrire={vi.fn()} joueur/>);
        expect(screen.getByText('Os brisés')).toBeTruthy();expect(screen.queryAllByRole('button')).toHaveLength(0);expect(screen.queryByText('Variante Pulp (livre p. 50)')).toBeNull();
    });
    it('une Sauvegarde vide reste indisponible et ne produit aucun aperçu NaN',()=>{
        const suivi={...lireCH({}),cycle:1,tombe:true,consequences:[{id:'c',cycle:1,pulp:false,malus:0,de:2,resultat:2}]};
        const {container}=render(<SuiviCthulhuHack regle={r} valeurs={{hp:0,force:'',[CLE_CTHULHU_HACK]:suivi}} ecrire={vi.fn()}/>);
        expect((screen.getByLabelText('Perte force') as HTMLInputElement).disabled).toBe(true);expect(container.textContent).not.toContain('NaN');
    });
});
