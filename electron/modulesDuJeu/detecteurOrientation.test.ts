import { afterEach, describe, expect, it, vi } from 'vitest';
import * as radar from '../../outils/alien/modules/detecteur/moteur.mjs';
import { anglesDuChamp, dansLeChamp } from '../../outils/alien/modules/detecteur/orientation.mjs';
import v4 from './fixtures/detecteur-v4.json';
import { ServiceDesModules } from './service';
import type { CommandeDeModule } from '../../src/modules/modulesDuJeu/protocole';

const mj={role:'mj' as const}, alice={role:'joueur' as const,personnageId:'alice'}, bob={role:'joueur' as const,personnageId:'bob'};
const table={personnages:[{id:'alice',nom:'Alice'},{id:'bob',nom:'Bob'}]};
const agir=(e:radar.EtatDetecteur,id:string,charge:unknown,lecteur:radar.ContexteDetecteur=mj)=>
    radar.appliquerCommande(e,{id,charge} as radar.CommandeDetecteur,lecteur,table);
function preparer() {
    let e=radar.migrerEtat(v4,4);
    e=agir(e,'zone-discrete',{id:'nord',nom:'Nord secret',x:0,y:-25,liens:['sas']});
    e=agir(e,'pion-discret',{id:'nord-cache',nom:'Nom interdit nord',zoneId:'nord',humain:false,limite:3,mobile:true,detectable:true});
    e=agir(e,'tour-discret',{tour:2});
    for(const pionId of ['secret','nord-cache'])e=agir(e,'mouvement-discret',{pionId,mobile:true,tour:3});
    return agir(e,'attribuer-porteur',{personnageId:'alice'});
}
afterEach(()=>vi.restoreAllMocks());

describe('géométrie du champ, nord en haut du plan',()=>{
    it.each([0,45,90,180,270,359])('inclut les bords et exclut juste au-delà, cap %s°',cap=>{
        const point=(degres:number)=>({x:Math.sin(degres*Math.PI/180),y:-Math.cos(degres*Math.PI/180)});
        for(const ecart of [-45,0,45])expect(dansLeChamp(point(cap+ecart),{cap,ouverture:90})).toBe(true);
        for(const ecart of [-45.01,45.01,180])expect(dansLeChamp(point(cap+ecart),{cap,ouverture:90})).toBe(false);
        expect(dansLeChamp({x:0,y:0},{cap,ouverture:45})).toBe(true);
    });
    it('garde le cercle complet et donne au dessin les mêmes bornes angulaires',()=>{
        expect(dansLeChamp({x:-1,y:0},{cap:0,ouverture:360})).toBe(true);
        expect(anglesDuChamp({cap:90,ouverture:90})).toEqual({debut:-Math.PI/4,fin:Math.PI/4});
    });
});

describe('migration et conservation de la préparation',()=>{
    it.each([1,2,3,4])('reprend une sauvegarde historique v%s sans accès ni paiement supplémentaire',version=>{
        const ancien:Record<string,unknown>={...structuredClone(v4),version};
        if(version<3)delete ancien.discret;
        if(version<2)delete ancien.prereglages;
        const e=radar.migrerEtat(ancien,version);
        expect(e.version).toBe(5);expect(e.tracker.power).toBe(false);
        expect(e.discret).toMatchObject({cap:0,ouverture:360,joueurPorteurId:''});
        if(version>=3){expect(e.discret.dernierScan).toEqual(v4.discret.dernierScan);expect(e.discret.energie).toBe(4);
            expect(()=>agir(e,'scanner-discret',{tour:2})).toThrow(/seul scan/);}
        expect(ancien.version).toBe(version);
    });
    it('migre aussi les préréglages v4 et conserve la compatibilité de ceux sans plan',()=>{
        const ancien={...structuredClone(v4),prereglages:[{id:'ancien',nom:'Ancien',reglages:{intensity:25,volume:25,contacts:3,proximity:45,noise:10},
            config:v4.config,discret:v4.discret}]};
        const e=radar.migrerEtat(ancien,4);
        expect(e.prereglages[0].discret).toMatchObject({ouverture:360,cap:0,joueurPorteurId:''});
        expect(e.prereglages[0].discret?.pions).toEqual(v4.discret.pions);
        expect(()=>radar.migrerEtat({...ancien,discret:{...ancien.discret,cap:9}},4)).toThrow();
    });
    it('conserve cap, ouverture et attribution à la reprise ; le rappel reprend sa préparation sans scan',()=>{
        let e=agir(preparer(),'orienter-discret',{cap:90,tour:3},alice);
        e=agir(e,'champ-discret',{ouverture:90});
        e=agir(e,'enregistrer-prereglage',{prereglageId:'cap',nom:'Cap'});
        const repris=radar.migrerEtat(JSON.parse(JSON.stringify(e)),5);
        expect(repris.discret).toEqual(e.discret);
        e=agir(agir(repris,'reinitialiser',{}),'rappeler-prereglage',{prereglageId:'cap'});
        expect(e.discret).toMatchObject({cap:90,ouverture:90,joueurPorteurId:'alice',tour:1,dernierScan:null});
        expect(e.discret.pions.every(p=>p.depense===0)).toBe(true);
    });
});

describe('relevé du Tour, mouvement et confidentialité',()=>{
    it('explore le même scan payé, sans recalcul des pions ni fuite des échos hors champ',()=>{
        const hasard=vi.spyOn(Math,'random').mockReturnValue(.5);
        let e=agir(agir(preparer(),'champ-discret',{ouverture:90}),'scanner-discret',{tour:3});
        const energie=e.discret.energie,recu=structuredClone(e.discret.dernierScan),tirages=hasard.mock.calls.length;
        expect(radar.vuePour(e,alice,table).lectureDiscrete?.echos.map(p=>p.zone)).toEqual(['Nord secret']);
        e=agir(e,'mouvement-discret',{pionId:'secret',mobile:false,tour:3});
        e=agir(e,'deplacer-discret',{pionId:'nord-cache',zoneId:'sas',tour:3});
        e=agir(e,'orienter-discret',{cap:90,tour:3},alice);
        const vue=radar.vuePour(e,alice,table);
        expect(vue.lectureDiscrete?.echos.map(p=>p.zone)).toEqual(['Coursive Est']);
        expect(vue.tracker.positions).toEqual([{x:.25,y:0}]);expect(vue.tracker.contacts).toBe(1);
        expect(JSON.stringify(vue)).not.toMatch(/Nord secret|Nom interdit|Créature cachée|joueurPorteurId|dernierScan|pions|prereglages|liens/);
        expect(e.discret.energie).toBe(energie);expect(e.discret.dernierScan).toEqual(recu);expect(hasard.mock.calls).toHaveLength(tirages);
        expect(()=>agir(e,'scanner-discret',{tour:3})).toThrow(/seul scan/);
    });
    it('la commande rapide garde zone et budget, puis le prochain scan et le déplacement suivent son état',()=>{
        vi.spyOn(Math,'random').mockReturnValue(.5);
        let e=preparer();const ancien=structuredClone(e.discret.pions.find(p=>p.id==='secret')!);
        e=agir(e,'mouvement-discret',{pionId:'secret',mobile:false,tour:3});
        expect(e.discret.pions.find(p=>p.id==='secret')).toEqual({...ancien,mobile:false});
        e=agir(e,'scanner-discret',{tour:3});
        expect(e.discret.dernierScan?.echos.map(p=>p.zone)).not.toContain('Coursive Est');
        e=agir(e,'deplacer-discret',{pionId:'secret',zoneId:'sas',tour:3});
        expect(e.discret.pions.find(p=>p.id==='secret')).toMatchObject({mobile:true,depense:ancien.depense+1});
        e=agir(e,'tour-discret',{tour:3});expect(e.discret.pions.every(p=>!p.mobile&&p.depense===0)).toBe(true);
        expect(()=>agir(e,'mouvement-discret',{pionId:'secret',mobile:true,tour:3})).toThrow(/Tour/);
    });
});

describe('autorité du porteur',()=>{
    it('réserve le cap au porteur désigné et révoque immédiatement ses anciens droits',()=>{
        let e=preparer();expect(radar.vuePour(e,alice,table).peutOrienter).toBe(true);
        expect(radar.vuePour(e,bob,table).peutOrienter).toBe(false);
        expect(()=>agir(e,'orienter-discret',{cap:90,tour:3},bob)).toThrow(/porteur/);
        for(const [id,charge] of [['champ-discret',{ouverture:45}],['mouvement-discret',{pionId:'secret',mobile:false,tour:3}],['attribuer-porteur',{personnageId:'bob'}]] as const)
            expect(()=>agir(e,id,charge,alice)).toThrow(/meneur/);
        e=agir(e,'attribuer-porteur',{personnageId:'bob'});
        expect(()=>agir(e,'orienter-discret',{cap:90,tour:3},alice)).toThrow(/porteur/);
        e=agir(e,'regler-discret',{terrain:'interieur',energie:4,porteurId:'secret'});
        expect(e.discret.joueurPorteurId).toBe('');
        expect(()=>agir(e,'orienter-discret',{cap:90,tour:3},bob)).toThrow(/porteur/);
    });
    it.each([{cap:-1,tour:3},{cap:360,tour:3},{cap:NaN,tour:3},{cap:1.5,tour:3},{cap:90,tour:2},{cap:90,tour:3,personnageId:'bob'}])('refuse sans mutation une rotation invalide %j',charge=>{
        const e=preparer(),avant=structuredClone(e);expect(()=>agir(e,'orienter-discret',charge,alice)).toThrow();expect(e).toEqual(avant);
    });
});

it('passe par le vrai service : accès, contexte périmé, échec disque et export/import',async()=>{
    let disque:unknown=null;const stockage={lire:async()=>disque,ecrire:vi.fn(async(v:unknown)=>{disque=structuredClone(v);})};
    const service=new ServiceDesModules(stockage,vi.fn());
    const sauvegarde={version:1 as const,campagnes:{camp:{'alien-detecteur':{versionDonnees:5,donnees:preparer()}}}};
    await service.changerContexte({campagneId:'camp',seanceId:'s',pilote:{id:'alien',name:'Alien'},personnages:table.personnages});
    await service.importer(sauvegarde);
    const contexte=(await service.vueMJ()).contexte;
    const commande={id:'orienter-discret',charge:{cap:90,tour:3}};
    const requete=()=>({campagneId:'camp',moduleId:'alien-detecteur',contexte,requeteId:'r',commande});
    await expect(service.commander(requete(),{...alice,appareilId:'a'})).rejects.toThrow();
    await service.autoriser({campagneId:'camp',moduleId:'alien-detecteur',contexte,personnages:['alice','bob']});
    const courant=(await service.vueMJ()).contexte;
    await expect(service.commander({...requete(),contexte:courant}, {...bob,appareilId:'b'})).rejects.toThrow();
    await expect(service.commander({...requete(),contexte:courant-1},{...alice,appareilId:'a'})).rejects.toThrow(/table a changé/);
    const avant=(await service.vueMJ()).sauvegarde;stockage.ecrire.mockRejectedValueOnce(new Error('disque plein'));
    await expect(service.commander({...requete(),contexte:courant},{...alice,appareilId:'a'})).rejects.toThrow(/Écriture/);
    expect((await service.vueMJ()).sauvegarde).toEqual(avant);
    await service.commander({...requete(),contexte:courant},{...alice,appareilId:'a'});
    const exporte=(await service.vueMJ()).sauvegarde!;await service.importer(exporte);
    expect((await service.vueJoueur('alice','a')).modules).toEqual([]);
    const etat=exporte.campagnes.camp['alien-detecteur'].donnees as radar.EtatDetecteur;
    expect(etat.discret.cap).toBe(90);expect(etat.discret.energie).toBe(4);
    const c=(await service.vueMJ()).contexte;
    await service.autoriser({campagneId:'camp',moduleId:'alien-detecteur',contexte:c,personnages:['alice']});
    const c2=(await service.vueMJ()).contexte;
    await expect(service.commander({...requete(),contexte:c2,commande:{id:'scanner-discret',charge:{tour:3}} as CommandeDeModule},{role:'mj',appareilId:'poste'})).resolves.toBeUndefined();
    await expect(service.commander({...requete(),contexte:c2,commande:{id:'scanner-discret',charge:{tour:3}}},{role:'mj',appareilId:'poste'})).rejects.toThrow(/seul scan/);
});
