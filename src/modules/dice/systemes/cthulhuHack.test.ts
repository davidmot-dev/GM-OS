import { describe,it,expect,vi,afterEach } from 'vitest';
import { DiceEngine } from '../DiceEngine';
import { DonneesDeFicheSchema } from '../../../types/donneesDeFiche';
import { CLE_CTHULHU_HACK, ajouterEffetMentalCH, annulerUsureCH, appliquerPertesCH, avancerCH, defausserFortuneCH, effetActifCH, lireCH,
    memoriserTestCH, modificateursCH, recupererCH, signalerImpactCH, tirerConsequenceCH, usureArmureCH, type RegleCthulhuHack } from './cthulhuHack';
export const regle:RegleCthulhuHack={pv:'hp',fortune:'fortune',physique:['force','dexterite','constitution'],personnalite:['sagesse','intelligence','charisme'],armures:[{de:'armure',nom:'nomArmure',protection:'pa'}]};
const initial=()=>({hp:8,fortune:2,force:11,dexterite:11,constitution:11,sagesse:11,intelligence:11,charisme:11});
const chute=(de:number,pulp=false)=>tirerConsequenceCH(signalerImpactCH(regle,{...initial(),[CLE_CTHULHU_HACK]:{...lireCH({}),pulp}},8,0,8,'c1'),'c1',de,true);
afterEach(()=>vi.restoreAllMocks());
describe('Hors Jeu : livre p. 50, pertes réparties et confirmation unique',()=>{
    it('Dé truit exige exactement deux Sauvegardes, dont les valeurs sont prévisualisables puis persistées',()=>{
        const f=chute(2);expect(()=>appliquerPertesCH(regle,f,'c1',{force:2,dexterite:2,sagesse:2})).toThrow();
        const apres=appliquerPertesCH(regle,f,'c1',{force:5,sagesse:1});expect(apres).toMatchObject({force:6,sagesse:10,hp:0});
        expect(()=>appliquerPertesCH(regle,JSON.parse(JSON.stringify(apres)),'c1',{force:5,sagesse:1})).toThrow();
        expect(f.force).toBe(11);
    });
    it.each([[3,{sagesse:4},'sagesse',7],[4,{force:2},'force',9]] as const)('résultat %i : pertes dans la bonne famille', (de,pertes,champ,valeur)=>{
        expect(appliquerPertesCH(regle,chute(de),'c1',pertes)[champ]).toBe(valeur);
        expect(()=>appliquerPertesCH(regle,chute(de),'c1',de===3?{force:4}:{sagesse:2})).toThrow();
    });
    it('ne tire ni ne récupère avant le danger, et ne rejoue pas la récupération',()=>{
        const attente=signalerImpactCH(regle,initial(),8,0,8,'c1');
        expect(()=>tirerConsequenceCH(attente,'c1',9)).toThrow();
        const f=chute(9);expect(()=>recupererCH(regle,f,'c1',4,8)).toThrow();
        const retabli=recupererCH(regle,f,'c1',4,8,true);expect(retabli.hp).toBe(4);
        expect(()=>recupererCH(regle,retabli,'c1',4,8,true)).toThrow();
        const nouvelle=signalerImpactCH(regle,retabli,4,0,4,'c2');expect(lireCH(nouvelle).cycle).toBe(2);
        expect(()=>recupererCH(regle,nouvelle,'c1',4,8,true)).toThrow();
    });
    it('les coups à zéro ne multiplient les conséquences qu’en Pulp, avec malus cumulatif',()=>{
        let f=chute(10,true);f=signalerImpactCH(regle,f,0,0,1,'c2');f=signalerImpactCH(regle,f,0,0,1,'c2');
        f=signalerImpactCH(regle,f,0,0,1,'c3');f=tirerConsequenceCH(f,'c2',10);f=tirerConsequenceCH(f,'c3',3);
        expect(lireCH(f).consequences.map(c=>c.resultat)).toEqual([10,9,1]);expect(lireCH(f).mort).toBe(true);expect(f.hp).toBe(0);
        expect(()=>recupererCH(regle,f,'c1',4,8,true)).toThrow();
        expect(lireCH(signalerImpactCH(regle,chute(10),0,0,2,'extra')).consequences).toHaveLength(1);
    });
    it('Pulp ne récupère qu’un D4 pour toute la série, après le combat',()=>{
        let f=signalerImpactCH(regle,chute(10,true),0,0,1,'c2');f=tirerConsequenceCH(f,'c2',10);
        f=recupererCH(regle,f,'c1',3,8,true);expect(f.hp).toBe(3);expect(lireCH(f).consequences.every(c=>c.recupere)).toBe(true);
    });
});
describe('durées dans la fiction, p. 31–32 et 50',()=>{
    it('Os brisés : −4 physique, fin à la première échéance journée/séance',()=>{
        const f=chute(5);expect(modificateursCH(regle,f,'force').malus).toBe(4);expect(modificateursCH(regle,f,'sagesse').malus).toBe(0);
        expect(modificateursCH(regle,avancerCH(f,'seance',1,'fin'),'force').malus).toBe(0);
    });
    it('Tremblements : 3 Moments, malus 3 puis 2 puis 1 puis 0, même après sauvegarde',()=>{
        let f=ajouterEffetMentalCH(initial(),'choc',1,()=>3,'choc');
        for(const attendu of [3,2,1,0]){expect(modificateursCH(regle,f,'force').malus).toBe(attendu);f=avancerCH(JSON.parse(JSON.stringify(f)),'moment',1,`m${attendu}`);}
    });
    it('compte les Moments séparément des minutes : aucune conversion générale inventée',()=>{
        const f=ajouterEffetMentalCH(initial(),'choc',2,()=>3,'confus');
        const minute=avancerCH(f,'minute',1,'minute');expect(lireCH(minute).moments).toBe(0);expect(modificateursCH(regle,minute,'sagesse').desavantage).toBe(true);
        const fin=avancerCH(minute,'moment',3,'moments');expect(modificateursCH(regle,fin,'sagesse').desavantage).toBe(false);
    });
    it('évanouissement : D20 explosif en minutes ET fin de scène, la plus longue',()=>{
        const des=[20,4];let f=ajouterEffetMentalCH(initial(),'folie',2,()=>des.shift()!,'folie');
        expect(lireCH(f).effets[0].secondes).toBe(24*60);f=avancerCH(f,'minute',24,'minutes');expect(modificateursCH(regle,f).indisponible).toBe(true);
        f=avancerCH(f,'scene',1,'scene');expect(modificateursCH(regle,f).indisponible).toBe(false);
    });
    it('Amnésie dure des heures, Paralysie des minutes ; Hurlement est immédiat',()=>{
        const a=ajouterEffetMentalCH(initial(),'folie',1,()=>3,'a');expect(lireCH(a).effets[0].secondes).toBe(3*3600);
        const p=ajouterEffetMentalCH(initial(),'folie',5,()=>2,'p');expect(lireCH(p).effets[0].secondes).toBe(120);
        const h=ajouterEffetMentalCH(initial(),'choc',6,()=>1,'h');expect(effetActifCH(lireCH(h),lireCH(h).effets[0])).toBe(false);
        expect(ajouterEffetMentalCH(h,'choc',6,()=>1,'h')).toBe(h);
    });
});
describe('Matériel déclaré comme armure et Fortune',()=>{
    it('le Désavantage général s’applique aussi aux ressources ; garder le plus petit dé',()=>{
        const des=[5,1];vi.spyOn(DiceEngine,'roll').mockImplementation(()=>des.shift()!);
        expect(DiceEngine.rollUsure(8,'desavantage').usure).toEqual({avant:8,apres:6});
    });
    it('perd exactement un PA par déclin, le restaure une fois et refuse un reçu devenu obsolète',()=>{
        const avant={...initial(),armure:'d8',nomArmure:'Gilet',pa:3};const apres=usureArmureCH(regle,avant,{...avant,armure:'d6'},()=> 'usure');
        expect(apres.pa).toBe(2);const sauve=annulerUsureCH(apres,'armure',8,6);expect(sauve.pa).toBe(3);expect(annulerUsureCH(sauve,'armure',8,6)).toBe(sauve);
        expect(()=>annulerUsureCH({...apres,pa:1},'armure',8,6)).toThrow();expect(usureArmureCH(regle,avant,{...avant,armure:'d8'},()=> 'non').pa).toBe(3);
    });
    it('Fortune MJ : 1 jeton sur succès ordinaire, 2 avec Désavantage ; conserve le seuil tiré',()=>{
        vi.spyOn(DiceEngine,'roll').mockReturnValue(19);
        const f=memoriserTestCH(initial(),{id:'t',champ:'force',genre:'sauvegarde',seuil:7,modificateur:'desavantage',reussi:true});
        const res=defausserFortuneCH(regle,f,'relance','depense');expect(res.fiche.fortune).toBe(0);expect(res.resultat?.tagSuccess).toBe(false);expect(res.resultat?.totalDisplay).toContain('/ 7');
        expect(()=>defausserFortuneCH(regle,res.fiche,'relance','autre')).toThrow();
    });
    it('Fortune MJ : Choc sans déclin de Santé mentale, raison persistée sans secret',()=>{
        vi.spyOn(DiceEngine,'roll').mockReturnValue(2);
        const res=defausserFortuneCH(regle,{...initial(),mentalHealth:'d10'},'choc','choc');expect(res.fiche).toMatchObject({fortune:0,mentalHealth:'d10'});expect(lireCH(res.fiche).effets[0].nom).toBe('Confus');
        expect(DonneesDeFicheSchema.safeParse(res.fiche).success).toBe(true);
    });
});
