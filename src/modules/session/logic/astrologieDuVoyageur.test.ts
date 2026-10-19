import { describe,it,expect } from 'vitest';
import { ajustementAstral, bonusAstralReel, fixerNombreAstral, momentDraconique, observerAstres, type AstrologieVoyageur } from './astrologieDuVoyageur';
import { astrologiePourLeJoueur, filtrerAstrologieDistante } from './astrologiePartagee';
import { experienceObservation, lireProgression } from './progressionDuVoyageur';
const base=():AstrologieVoyageur=>({version:1,origine:0,nombres:{0:2,1:3,2:4},observations:[],predictions:{}});
const valeurs={intellect:12,astrologie:0,moral:0,endurance:24,endurance_max:24,vie:12,vie_max:12,fatigue:0,__rddFatigue231:1};

describe('R7 : heures, observation et secrets du livre 2.3.1',()=>{
    it('Nitouche Dragon + nombre 2 : Lyre +4, Faucon/Roseau +2, Vaisseau −4, Couronne/Araignée −2',()=>{
        expect(Array.from({length:12},(_,i)=>ajustementAstral(5,2,i+1))).toEqual([-4,0,2,-2,0,0,4,0,0,-2,2,0]);
    });
    it('chacun des douze signes a une meilleure, deux favorables, deux défavorables et six neutres',()=>{
        for(let signe=1;signe<=12;signe++)for(let n=1;n<=12;n++){
            const h=Array.from({length:12},(_,i)=>ajustementAstral(signe,n,i+1));
            expect(h.filter(x=>x===4)).toHaveLength(1);expect(h.filter(x=>x===2)).toHaveLength(2);expect(h.filter(x=>x===-4)).toHaveLength(1);expect(h.filter(x=>x===-2)).toHaveLength(2);expect(h.filter(x=>x===0)).toHaveLength(6);
        }
    });
    it('repère explicite : Vaisseau début de journée, Araignée 18 h plus tard, retour et jours négatifs',()=>{
        expect(momentDraconique(1000,1000)).toMatchObject({jour:0,heure:1,nom:'Le Vaisseau'});
        expect(momentDraconique(1000,1000+18*3600000)).toMatchObject({jour:0,heure:10,nom:'L’Araignée'});
        expect(momentDraconique(0,86400000)).toMatchObject({jour:1,heure:1});expect(momentDraconique(0,-1)).toMatchObject({jour:-1,heure:12});
    });
    it('le nombre réel est stable, absent signifie refus et non bonus zéro',()=>{
        expect(()=>fixerNombreAstral(base(),0,3)).toThrow(/déjà/);
        expect(()=>bonusAstralReel(base(),3*86400000,'Le Dragon')).toThrow(/définir/);
        expect(bonusAstralReel(base(),12*3600000,'Le Dragon')).toBe(4);
    });
    it('observation secrète : réussite vraie, échec faux, aucune indication de validité transmise',()=>{
        const a=observerAstres(base(),14*3600000,'nitouche',valeurs,1,-2,30,8,'o1');
        expect(a.annonce).toBe(3);expect(a.ajustement).toBe(-2);
        const b=observerAstres(a.astrologie,14*3600000,'brucelin',valeurs,1,0,100,7,'o2');expect(b.annonce).toBe(7);
        const vue=astrologiePourLeJoueur(b.astrologie,'brucelin');expect(vue).toEqual({version:1,origine:0,predictions:{brucelin:[{jour:1,nombre:7}]}});
        expect(JSON.stringify(vue)).not.toMatch(/nombres|observations|nitouche|correct|degre|ajustement/);
    });
    it('restrictions nuit, durée, faux nombre, répétition et éloignement',()=>{
        expect(()=>observerAstres(base(),0,'n',valeurs,1,0,30,8,'jour')).toThrow(/étoiles/);
        expect(()=>observerAstres(base(),14*3600000,'n',valeurs,1,0,100,3,'faux')).toThrow(/différent/);
        const a=observerAstres(base(),14*3600000,'n',valeurs,1,0,30,8,'ok').astrologie;
        expect(()=>observerAstres(a,14*3600000+1200000,'n',valeurs,1,0,30,8,'bis')).toThrow(/déjà/);
        expect(()=>observerAstres(a,14*3600000,'n',valeurs,2,0,30,8,'court')).toThrow(/minutes/);
        expect(observerAstres(a,14*3600000+1200000,'n',valeurs,2,-2,30,8,'loin').ajustement).toBe(-3);
    });
    it('XP secrètes communiquées plus tard, une seule fois et sans nombre réel',()=>{
        const a=observerAstres(base(),14*3600000,'n',valeurs,1,-3,1,8,'part').astrologie;
        const p=experienceObservation(valeurs,a,'n','part','communiquer');expect(lireProgression(p.maj).exercice).toMatchObject({astrologie:2,intellect:1});
        expect(()=>experienceObservation({...valeurs,...p.maj},a,'n','part','rejouer')).toThrow(/déjà/);
        expect(JSON.stringify(p.maj)).not.toContain('nombres');
    });
    it('diffusion complète ou différentielle : chaque destinataire ne reçoit que ses prédictions',()=>{
        const a=base();a.predictions={a:[{jour:0,nombre:7}],b:[{jour:0,nombre:8}]};
        const charge={session:{campaigns:[{id:'c',rddAstrologie:a}],players:[{id:'autre'}]},clock:{timestamp:42}};
        for(const pj of ['a','b',null]){
            const r=filtrerAstrologieDistante(charge,pj);expect(r.session.campaigns[0].rddAstrologie).toEqual(astrologiePourLeJoueur(a,pj));
            expect(r.clock).toEqual(charge.clock);expect(r.session.players).toEqual(charge.session.players);
        }
        expect(charge.session.campaigns[0].rddAstrologie.nombres).toBeDefined();
        expect(filtrerAstrologieDistante({clock:{timestamp:42}},'a')).toEqual({clock:{timestamp:42}});
    });
});
