import { describe, expect, it } from 'vitest';
import { appliquerOperationDeVoyageur, type DonneesDeVoyage, type OperationDeVoyageur } from './operationsDeVoyageur';
import { initialiserRepos, lireRepos, plafondEnduranceAuRepos, proposerChateauDormant, proposerRepos, type BilanDeNuit } from './reposDuVoyageur';
import { initialiserSanteVoyageur, lireSanteVoyageur, proposerSoins } from './santeDuVoyageur';
const base = {vie:12,vie_max:12,endurance:24,endurance_max:24,constitution:12,volonte:12,sc:4,fatigue:0, reve:15,reve_seuil:15,reve_pts:15,__rddFatigue231:1,__rddReprise231:1};
const appliquer = (d:DonneesDeVoyage,p:OperationDeVoyageur) => appliquerOperationDeVoyageur(d,p)!;
const debut = (plus:DonneesDeVoyage = {}) => {const d = initialiserSanteVoyageur({...base,...plus});return appliquer(d,initialiserRepos(d,{},false,'init'));};
const choix = (nom = 'nuit 1', plus:Partial<BilanDeNuit> = {}): BilanDeNuit => ({nom,controlesManuels:true,maladieOuPoison:false,jetsBlessures:{},herbes:{},bonusDecoction:0,...plus});
describe('R4 repos et Château Dormant, édition 2.3.1', () => {
    it('demande explicitement si les PV sont déjà éligibles la première nuit',()=>{
        const s=initialiserSanteVoyageur({...base,vie:8});
        const d=appliquer(s,initialiserRepos(s,{},false,'activation'));
        const e=appliquer(s,initialiserRepos(s,{},false,'activation',true));
        expect(proposerChateauDormant(d,choix(), 'nuit').maj.vie).toBe(8);
        expect(proposerChateauDormant(e,choix('nuit',{deVie:30}), 'nuit').maj.vie).toBe(9);
    });
    it('reproduit les 20 minutes de récupération de Nitouche, puis l’heure de sommeil', () => {
        let d = debut({endurance:7,endurance_max:23,vie:11,vie_max:11,fatigue:16});
        d = appliquer(d,proposerRepos(d,false,20,false,[],undefined,'veille'));
        expect(d.endurance).toBe(11);expect(d.fatigue).toBe(16);
        d = appliquer(d,proposerRepos(d,true,120,true,[],undefined,'sommeil'));
        expect(d.endurance).toBe(23);expect(Number(d.fatigue)).toBeLessThan(16);
        expect(lireRepos(d)!.heuresDormies).toBe(1);
    });
    it('respecte la limite vie/blessure de Brucelin et ne réduit pas une endurance supérieure au plafond', () => {
        const d = initialiserSanteVoyageur({...base,endurance_max:28,endurance:18,vie_max:14,vie:10},{grave:1});
        expect(plafondEnduranceAuRepos(d,true)).toBe(14);expect(plafondEnduranceAuRepos(d,false)).toBe(7);
        const sans = {...d,__rddSante231:{...lireSanteVoyageur(d)!,blessures:[]}};
        expect(plafondEnduranceAuRepos(sans,true)).toBe(20);
        const repris = appliquer(d,initialiserRepos(d,{},false,'init'));
        // L'hémorragie empêche bien le saut de temps, même si l'endurance paraît suffisante.
        expect(() => proposerRepos(repris,true,120,false,[],undefined,'repos')).toThrow(/Hémorragie/);
    });
    it('une critique limite à un point ; deux graves divisent le maximum par quatre', () => {
        expect(plafondEnduranceAuRepos(initialiserSanteVoyageur(base,{critique:1}),true)).toBe(1);
        const d = initialiserSanteVoyageur(base,{grave:2});
        expect(plafondEnduranceAuRepos(d,true)).toBe(6);expect(plafondEnduranceAuRepos(d,false)).toBe(3);
    });
    it('garde le rêve excédentaire, augmente le seuil après maîtrise et garde les conséquences de Dragon à résoudre', () => {
        let d = debut({reve_pts:10, reve_seuil:14});
        const p = proposerRepos(d,true,120,true,[7,0],'reussite-normale','reve');
        d = appliquer(d,p);expect(d).toMatchObject({reve_pts:17,reve_seuil:15});
        expect(appliquerOperationDeVoyageur(d,p)).toBeNull();
        d = debut({reve_pts:0});
        d = appliquer(d,proposerRepos(d,true,120,true,[7,5],undefined,'cauchemar'));
        expect(d.reve_pts).toBe(0);expect(lireRepos(d)!.effets[0]).toMatchObject({type:'queue',nombre:2});
    });
    it('ne masque ni un DDR incomplet ni une maîtrise manquante ; détecte l’éclatement', () => {
        const d = debut({reve_pts:10});
        expect(() => proposerRepos(d,true,120,true,[7],undefined,'x')).toThrow(/DDR/);
        expect(() => proposerRepos(d,true,120,true,[7,0],undefined,'x')).toThrow(/maîtrise/);
        const e = appliquer(d,proposerRepos(d,true,120,true,[7,7,7,7,7,6],'reussite-particuliere','x'));
        expect(e.reve_pts).toBe(0);expect(lireRepos(e)!.effets.map(e=>e.type)).toEqual(['tete','souffle']);
    });
    it('applique le point de rêve après le stress, une fois pour une nuit nommée, sans inventer une récupération de vie', () => {
        let d = debut({reve_pts:17});
        const p = proposerChateauDormant(d,choix('18 Dragon'),'nuit');
        d = appliquer(d,p);expect(d.reve_pts).toBe(16);expect(lireRepos(d)!.jour).toBe(1);
        expect(appliquerOperationDeVoyageur(d,p)).toBeNull();
        expect(() => proposerChateauDormant(d,choix('18 Dragon'),'nuit-bis')).toThrow(/déjà/);
        expect(() => proposerChateauDormant(d,choix('19 Dragon',{controlesManuels:false}),'nuit2')).toThrow(/confirmer/);
    });
    it('fait rétrograder une blessure après les jours requis, consomme les bonus et attend encore un jour pour les PV', () => {
        let d:DonneesDeVoyage = initialiserSanteVoyageur({...base,vie:8,endurance:16,fatigue:8},{legere:1},{'reprise-legere-0':'complets'}, {}, {'reprise-legere-0':1});
        d = appliquer(d,initialiserRepos(d,{'reprise-legere-0':0},false,'init'));
        // Constitution 12 à -4 +1 +2 = -1 : 54 %, d100 40 réussit.
        const p = proposerChateauDormant(d,choix('soir1',{jetsBlessures:{'reprise-legere-0':40},herbes:{'reprise-legere-0':2}}),'b1');
        expect(p.details.join(' ')).toContain('54 %');d = appliquer(d,p);
        expect(lireSanteVoyageur(d)!.blessures).toHaveLength(0);expect(d.vie).toBe(8);
        d = appliquer(d,proposerChateauDormant(d,choix('soir2',{deVie:30}),'b2'));
        expect(d.vie).toBe(9);expect(d.endurance).toBe(18);expect(d.fatigue).toBe(6);
    });
    it('reprogramme un échec au lendemain et un échec total à la durée entière, sans réutiliser les bonus', () => {
        let d:DonneesDeVoyage = initialiserSanteVoyageur(base,{grave:1},{'reprise-grave-0':'complets'}, {}, {'reprise-grave-0':1});
        d = appliquer(d,initialiserRepos(d,{'reprise-grave-0':0},false,'init'));
        d = appliquer(d,proposerChateauDormant(d,choix('soir1',{jetsBlessures:{'reprise-grave-0':80},herbes:{}}),'b1'));
        expect(lireSanteVoyageur(d)!.blessures[0]).toMatchObject({bonusGuerison:0,guerison:{prochainJour:1}});
        d = appliquer(d,proposerChateauDormant(d,choix('soir2',{jetsBlessures:{'reprise-grave-0':100}}),'b2'));
        expect(d.vie).toBe(11);expect(lireSanteVoyageur(d)!.blessures[0].guerison!.prochainJour).toBe(5);
    });
    it('ne compte pas le jour des nouveaux soins et ne repousse pas l’échéance lors de soins renouvelés', () => {
        let d:DonneesDeVoyage = initialiserSanteVoyageur(base,{legere:1},{'reprise-legere-0':'premiers'});
        d = appliquer(d,initialiserRepos(d,{},false,'init'));
        d = {...d,...proposerSoins(d,'reprise-legere-0',true,'reussite-normale','soins').maj};
        expect(lireSanteVoyageur(d)!.blessures[0].guerison!.prochainJour).toBe(2);
        for (const i of [0,1]) d = appliquer(d,proposerChateauDormant(d,choix('soir'+i),'b'+i));
        expect(() => proposerChateauDormant(d,choix('soir2'),'b2')).toThrow(/d100/);
    });
    it('interdit la récupération de vie sous maladie ou poison et le jour de leur disparition', () => {
        let d = debut({vie:8});
        d = appliquer(d,proposerChateauDormant(d,choix('soir1',{maladieOuPoison:true}),'b1'));expect(d.vie).toBe(8);
        d = appliquer(d,proposerChateauDormant(d,choix('soir2',{maladieOuPoison:false}),'b2'));expect(d.vie).toBe(8);
        d = appliquer(d,proposerChateauDormant(d,choix('soir3',{deVie:5}),'b3'));expect(d.vie).toBe(10);
    });
});

describe('Famine et enchantements non permanents au Château Dormant (p. 111, 268)', () => {
    it('perd l’endurance selon la part du seuil mangée et bue', async () => {
        const { perteDeFamine } = await import('./reposDuVoyageur');
        expect(perteDeFamine(2, 2, [1, 2, 3])).toBe(0);
        expect(perteDeFamine(1, 2, [1, 2, 3])).toBe(1);
        expect(perteDeFamine(0.5, 2, [1, 2, 3])).toBe(2);
        expect(perteDeFamine(0, 2, [1, 2, 3])).toBe(3);
        expect(perteDeFamine(0, 2, [3, 6, 12])).toBe(12);
    });
    it('Nitouche ne mange qu’un point : −1 endurance, une case de fatigue, retenues jusqu’au repas normal', async () => {
        const { proposerRepasNormal } = await import('./reposDuVoyageur');
        let d = debut({sust:2,endurance_max:23,endurance:23,route_food:1,route_water:10});
        d = appliquer(d,proposerChateauDormant(d,choix('nuit',{famine:{nourriture:1,boisson:10}}),'nuit'));
        expect(d.endurance).toBe(22);expect(d.fatigue).toBe(1);
        expect(d.route_food).toBe(0);
        expect(lireRepos(d)!.famine).toBe(1);
        expect(plafondEnduranceAuRepos(d,true)).toBe(22);
        d = appliquer(d,proposerRepasNormal(d,'repas'));
        expect(lireRepos(d)!.famine).toBe(0);
    });
    it('un demi-point par jour arrête l’endurance à la moitié', () => {
        const d = debut({sust:2,endurance_max:24,endurance:13});
        const p = proposerChateauDormant(d,choix('nuit',{famine:{nourriture:0.5,boisson:10}}),'n');
        expect(p.maj.endurance).toBe(12);
        const e = debut({sust:2,endurance_max:24,endurance:12});
        expect(proposerChateauDormant(e,choix('nuit',{famine:{nourriture:0.5,boisson:10}}),'n').maj.endurance).toBe(12);
    });
    it('une potion perd un point de rêve par nuit et s’évapore au dernier', async () => {
        const { proposerEnchantement } = await import('./reposDuVoyageur');
        let d = debut();
        d = appliquer(d,proposerEnchantement(d,'Potion de soins',2,'potion'));
        d = appliquer(d,proposerChateauDormant(d,choix('nuit 1'),'n1'));
        expect(lireRepos(d)!.enchantements).toEqual([{id:'potion',nom:'Potion de soins',reve:1}]);
        const p = proposerChateauDormant(d,choix('nuit 2'),'n2');
        expect(p.details.join(' ')).toMatch(/s’évapore/);
        expect(lireRepos(appliquer(d,p))!.enchantements).toEqual([]);
    });
});
