import { describe, expect, it } from 'vitest';
import { CLE_SANTE_VOYAGEUR, effetDuSonne, etatsDeSanteVoyageur, finaliserMajSante, initialiserSanteVoyageur,
    jetDEnduranceRequis, jetsDeVieRequis, lireEncaissement, lireSanteVoyageur, projeterSanteVoyageur,
    proposerEncaissement, proposerFinRound, proposerJetEndurance, proposerJetVie, proposerSoins, proposerTempsSante,
    suivreSanteVoyageur, type DonneesDeSante, type GraviteVoyageur } from './santeDuVoyageur';
import { chutesEntre } from '../../combat/logic/DecesAuJournal';
import { estHorsDeCombat } from '../../combat/logic/SanteDuCombattant';

const base = {vie:11,vie_max:11,endurance:23,endurance_max:23,sc:4,volonte:12,fatigue:0,__rddFatigue231:1,__rddReprise231:1};
const initial = (plus:DonneesDeSante = {}, blessures:Partial<Record<GraviteVoyageur,number>> = {}) => initialiserSanteVoyageur({...base,...plus},blessures);
const des = (...v:number[]) => () => {if (!v.length) throw new Error('Dé imprévu');return v.shift()!;};
const appliquer = finaliserMajSante;

describe('R2 : encaissement RdD 2.3.1', () => {
    it('la reprise conserve les compteurs et les anciennes données sans infliger les blessures déclarées', () => {
        const d = {...base,endurance:7,vie:6,note:'conservée'};
        const n = initialiserSanteVoyageur(d,{legere:2,grave:1});
        expect(n).toMatchObject({endurance:7,vie:6,__rddAvantSante231:d});
        expect(lireSanteVoyageur(n)!.blessures).toHaveLength(3);
        expect(initialiserSanteVoyageur(n)).toEqual(n);expect(d).not.toHaveProperty(CLE_SANTE_VOYAGEUR);
        const soignee = initialiserSanteVoyageur(d,{grave:1},{'reprise-grave-0':'complets'});
        expect(lireSanteVoyageur(soignee)!.blessures[0]).toMatchObject({premiersSoins:true,soinsComplets:true,prochainJetVie:null});
        const ancienne = initialiserSanteVoyageur(d,{grave:1},{'reprise-grave-0':'premiers'},{'reprise-grave-0':15});
        expect(lireSanteVoyageur(ancienne)!.blessures[0].repitJusqua).toBe(900);
    });
    it.each([[10,false,'contusion',[4],0],[11,false,'legere',[6],0],[15,false,'legere',[6],0],
        [16,false,'grave',[6,6],2],[19,false,'grave',[6,6],2],[20,false,'critique',[],4],[22,false,'critique',[],6],
        [15,true,'contusion',[6],0],[16,true,'legere',[6,6],0],[20,true,'legere',[],1]] as const)(
        'lit %s, coups non mortels %s : %s', (total,nm,gravite,faces,vie) => {
            expect(lireEncaissement(total,nm,[])).toMatchObject({gravite,desEndurance:faces,vie});
        });
    it('l’exemple de Brucelin : 13 + 7 − 2 = 18, grave, −10 endurance et −2 vie', () => {
        const d = initial({endurance:28,endurance_max:28,vie:14,vie_max:14});
        const p = proposerEncaissement(d,7,2,false,des(7,6,5,5),'coup');
        expect(d.endurance).toBe(28);expect(p.maj).toMatchObject({endurance:18,vie:12,fatigue:10});
        expect(p.des.map(d => d.valeur)).toEqual([7,6,5,5]);
        expect(lireSanteVoyageur(appliquer(d,p))!.blessures[0].gravite).toBe('grave');
    });
    it('une sixième légère devient grave, une troisième grave devient critique ; les anciennes restent présentes', () => {
        const legeres = lireSanteVoyageur(initial({}, {legere:5}))!.blessures;
        expect(lireEncaissement(12,false,legeres)).toMatchObject({gravite:'grave',promue:true,vie:2});
        const pleines = lireSanteVoyageur(initial({}, {legere:5,grave:2}))!.blessures;
        expect(lireEncaissement(12,false,pleines)).toMatchObject({gravite:'critique',promue:true,vie:4});
        const p = proposerEncaissement(initial({}, {legere:5}),0,0,false,des(6,6,2,3),'sixieme');
        expect(lireSanteVoyageur({...base,...p.maj})!.blessures).toHaveLength(6);
    });
    it('le zéro d’endurance ajoute un point de vie une seule fois ; les lignes « à zéro » le comptent déjà', () => {
        const d = initial({endurance:2});
        const p = proposerEncaissement(d,0,0,false,des(4,4,3),'zero');
        expect(p.maj).toMatchObject({endurance:0,vie:10,fatigue:2});
        const n = appliquer(d,p);
        expect(suivreSanteVoyageur(n,n).vie).toBe(10);
        expect(proposerEncaissement(initial(),2,0,false,des(10,10),'crit').maj).toMatchObject({endurance:0,vie:5}); // 22 : six, pas sept.
        expect(proposerEncaissement(initial(),0,0,true,des(10,10),'nonmortel').maj).toMatchObject({endurance:0,vie:10});
    });
    it('la seconde critique tue et, après une critique, les pertes d’endurance deviennent des pertes de vie', () => {
        const d = initial({endurance:0,vie:5},{critique:1});
        const p = proposerEncaissement(d,0,0,false,des(5,5,3),'apres');
        expect(p.maj.vie).toBe(2);
        expect(lireSanteVoyageur({...d,...proposerEncaissement(d,0,0,false,des(10,10),'seconde').maj})!.mort).toBe(true);
    });
    it('l’héroïsme n’est proposé que pour une perte exacte dans le SC, et conserve la fatigue du dernier point', () => {
        const d = initial({endurance:3});
        const p = proposerEncaissement(d,0,0,false,des(4,4,3,1),'hero',true);
        expect(p.maj).toMatchObject({endurance:1,vie:11,fatigue:3});
        expect(etatsDeSanteVoyageur(appliquer(d,p))!.inconscient).toBe(false);
        const echec = proposerEncaissement(d,0,0,false,des(4,4,3,100),'hero-rate',true);
        expect(echec.maj).toMatchObject({endurance:0,vie:10});
        const trop = proposerEncaissement(d,0,0,false,des(4,4,4),'trop',true);
        expect(trop.des).toHaveLength(3);expect(trop.maj.endurance).toBe(0);
    });
    it('le jet d’endurance utilise le d20 avec 20 toujours raté, 01 réussi et XP, et les pertes cumulées du round', () => {
        let d = appliquer(initial(),proposerEncaissement(initial(),0,0,false,des(3,3,1),'a'));
        expect(jetDEnduranceRequis(d)).toBe(false);
        d = appliquer(d,proposerEncaissement(d,0,0,false,des(3,3,1),'b'));
        expect(jetDEnduranceRequis(d)).toBe(true);
        d = appliquer(d,proposerJetEndurance(d,des(20),'sonne'));
        expect(etatsDeSanteVoyageur(d)!.sonne).toBe(true);
        d = appliquer(d,proposerFinRound(d,'r1'));expect(etatsDeSanteVoyageur(d)!.sonne).toBe(true);
        d = appliquer(d,proposerFinRound(d,'r2'));expect(etatsDeSanteVoyageur(d)!.sonne).toBe(false);
        let xp = appliquer(initial(),proposerEncaissement(initial(),0,0,false,des(3,3,2),'a'));
        xp = appliquer(xp,proposerJetEndurance(xp,des(1),'xp'));
        expect(lireSanteVoyageur(xp)!.experienceConstitution).toBe(1);
    });
    it('sonné transforme les degrés, sans modifier le pourcentage ; l’offensive aggrave les échecs', () => {
        expect(effetDuSonne('reussite-particuliere',false)).toBe('reussite-significative');
        expect(effetDuSonne('reussite-normale',false)).toBe('echec-normal');
        expect(effetDuSonne('reussite-normale',true)).toBe('echec-total');
        expect(effetDuSonne('echec-particulier',true)).toBe('echec-total');
        expect(effetDuSonne('reussite-significative',true)).toBe('reussite-significative');
    });
    it('le coma et le seuil négatif ne sont pas un décès à zéro ni à −SC', () => {
        for (const vie of [0,-4]) {
            const d = initial({vie}), healthSystem = projeterSanteVoyageur(d)!;
            expect(etatsDeSanteVoyageur(d)).toMatchObject({coma:true,mort:false});
            expect(estHorsDeCombat({healthSystem})).toBe(true);
            const c = {id:'c',name:'Fictif',isPlayer:true,statuses:[],hp:11,healthSystem:projeterSanteVoyageur(initial())};
            expect(chutesEntre([c],[{...c,hp:vie,healthSystem}])).toEqual([]);
        }
        expect(etatsDeSanteVoyageur(initial({vie:-5}))!.mort).toBe(true);
    });
    it('les jets de vie s’arrêtent sur une échéance et 01 donne un répit ×20 sauf dans le coma', () => {
        let d = initial({endurance:0,vie:3},{grave:1});
        d = appliquer(d,proposerTempsSante(d,10,'temps'));
        expect(lireSanteVoyageur(d)!.secondes).toBe(240);expect(jetsDeVieRequis(d)).toHaveLength(1);
        const id = jetsDeVieRequis(d)[0].id;
        expect(() => proposerFinRound(d,'interdit')).toThrow(/jets/);
        d = appliquer(d,proposerJetVie(d,id,des(1),'repit'));
        expect(lireSanteVoyageur(d)!.blessures[0].prochainJetVie).toBe(240+4800);
        let coma = initial({endurance:0,vie:0},{critique:1});
        coma = appliquer(coma,proposerFinRound(coma,'r'));
        coma = appliquer(coma,proposerJetVie(coma,jetsDeVieRequis(coma)[0].id,des(1),'jet'));
        expect(lireSanteVoyageur(coma)!.blessures[0].prochainJetVie).toBe(12);
        const t = appliquer(initial({endurance:0},{critique:1}),proposerFinRound(initial({endurance:0},{critique:1}),'r'));
        expect(lireSanteVoyageur(appliquer(t,proposerJetVie(t,jetsDeVieRequis(t)[0].id,des(20),'mort')))!.mort).toBe(true);
    });
    it('l’hémorragie grave enlève un point par round ; les premiers soins achevés dans ce round l’arrêtent', () => {
        let d = initial({}, {grave:1});
        d = appliquer(d,proposerFinRound(d,'r1'));expect(d.endurance).toBe(22);expect(d.fatigue).toBe(1);
        const id = lireSanteVoyageur(d)!.blessures[0].id;
        d = appliquer(d,proposerSoins(d,id,false,'reussite-particuliere','soin1'));
        expect(() => proposerSoins(d,id,false,'reussite-normale','trop')).toThrow(/round/);
        d = appliquer(d,proposerFinRound(d,'r2'));expect(d.endurance).toBe(21);
        d = appliquer(d,proposerSoins(d,id,false,'reussite-normale','soin2'));
        d = appliquer(d,proposerFinRound(d,'r3'));expect(d.endurance).toBe(21);
    });
    it('échec total aux soins : malus durable ; excédent reporté ; soins complets puis rechute', () => {
        let d = initial({}, {grave:1});const id = lireSanteVoyageur(d)!.blessures[0].id;
        d = appliquer(d,proposerSoins(d,id,false,'echec-total','a'));
        expect(lireSanteVoyageur(d)!.blessures[0]).toMatchObject({pointsSoins:-4,malusSoins:-1});
        d = appliquer(d,proposerFinRound(d,'r1'));
        d = appliquer(d,proposerSoins(d,id,false,'reussite-particuliere','b',true));
        d = appliquer(d,proposerFinRound(d,'r2'));
        d = appliquer(d,proposerSoins(d,id,false,'reussite-particuliere','c'));
        expect(lireSanteVoyageur(d)!.blessures[0]).toMatchObject({premiersSoins:true,excedentSoins:2});
        d = appliquer(d,proposerSoins(d,id,true,'reussite-normale','d'));
        expect(lireSanteVoyageur(d)!.blessures[0]).toMatchObject({soinsComplets:true,bonusGuerison:1,prochainJetVie:null});
        d = appliquer(d,proposerSoins(d,id,true,'echec-total','e'));
        expect(lireSanteVoyageur(d)!.blessures[0]).toMatchObject({premiersSoins:false,soinsComplets:false,pointsSoins:0,malusSoins:-2});
    });
    it('le suivi d’une perte externe applique une fois l’inconscience, même après R1', () => {
        const d = initial({endurance:2});
        const n = suivreSanteVoyageur(d,{...d,endurance:0,fatigue:2});
        expect(n.vie).toBe(10);expect(etatsDeSanteVoyageur(n)!.inconscient).toBe(true);
        expect(suivreSanteVoyageur(n,n).vie).toBe(10);
        expect(etatsDeSanteVoyageur(suivreSanteVoyageur(n,{...n,endurance:1}))!.inconscient).toBe(false);
        expect(() => proposerEncaissement(d,0,0,false,des(11,4),'invalide')).toThrow(/d10/);
        expect(() => lireSanteVoyageur({__rddSante231:{version:99}})).toThrow(/invalide/);
    });
    it('plusieurs plaies n’imposent pas plusieurs jets de vie simultanés au même blessé', () => {
        let d = initial({endurance:0},{grave:2});
        d = appliquer(d,proposerTempsSante(d,10,'temps'));
        expect(jetsDeVieRequis(d)).toHaveLength(1);
        d = appliquer(d,proposerJetVie(d,jetsDeVieRequis(d)[0].id,des(12),'perte'));
        expect(d.vie).toBe(10);expect(jetsDeVieRequis(d)).toHaveLength(0);
    });
});
