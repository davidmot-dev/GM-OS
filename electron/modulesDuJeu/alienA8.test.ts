import { describe, it, expect, vi, afterEach } from 'vitest';
import * as radar from '../../outils/alien/modules/detecteur/moteur.mjs';
import * as maman from '../../outils/alien/modules/muthur/moteur.mjs';
import { ServiceDesModules } from './service';
import { extraireConfiguration, etatDepuisConfiguration } from '../../outils/alien/modules/muthur/configuration.mjs';
import type { CommandeDeModule } from '../../src/modules/modulesDuJeu/protocole';
const mj={role:'mj' as const},alice={role:'joueur' as const,personnageId:'alice'},bob={role:'joueur' as const,personnageId:'bob'};
const agir=(e:radar.EtatDetecteur,id:string,charge:unknown)=>radar.appliquerCommande(e,{id,charge} as radar.CommandeDetecteur,mj);
const terminal=(e:maman.EtatMuthur,id:string,charge:unknown)=>maman.appliquerCommande(e,{id,charge} as maman.CommandeMuthur,mj);
function preparerRadar() {
    let e=radar.creerEtat();
    for(let n=0;n<7;n++)e=agir(e,'zone-discrete',{id:`z${n}`,nom:`Zone ${n}`,x:n*25,y:0,liens:n?[`z${n-1}`]:[]});
    for(const [id,zoneId,mobile,detectable] of [['porteur','z0',false,true],['secret-actif','z2',true,true],['secret-immobile','z1',false,true],['secret-petit','z1',true,false],['secret-loin','z5',true,true]] as const)
        e=agir(e,'pion-discret',{id,zoneId,nom:id,humain:true,limite:2,mobile,detectable});
    e=agir(e,'regler-discret',{terrain:'interieur',energie:8,porteurId:'porteur'});
    return agir(e,'mode-discret',{actif:true});
}
afterEach(()=>vi.restoreAllMocks());
describe('A8 : mode discret et plan privé',()=>{
    it('ne publie que les mouvements de bonne taille à portée, sans identité ni plan caché',()=>{
        vi.spyOn(Math,'random').mockReturnValue(.5);
        const depart=preparerRadar(),e=agir(depart,'scanner-discret',{tour:1}),vue=radar.vuePour(e,alice);
        expect(vue.lectureDiscrete?.echos.map(e=>e.zone)).toEqual(['Zone 2']);
        expect(vue.tracker.positions).toEqual([{x:.5,y:0}]);
        expect(JSON.stringify(vue)).not.toMatch(/secret-|pions|liens|porteurId|prereglages/);
        expect(depart.discret.dernierScan).toBeNull();
    });
    it('teste six dés au maximum après le scan, sans Panique ni deuxième paiement à la reprise',()=>{
        vi.spyOn(Math,'random').mockReturnValue(0);
        const e=agir(preparerRadar(),'scanner-discret',{tour:1});
        expect(e.discret.energie).toBe(2);expect(e.discret.dernierScan?.des).toEqual([1,1,1,1,1,1]);
        const reprise=radar.migrerEtat(JSON.parse(JSON.stringify(e)),3);
        expect(reprise.tracker.power).toBe(false);
        expect(()=>agir(reprise,'scanner-discret',{tour:1})).toThrow(/seul scan/);
        expect(()=>agir(reprise,'scanner',{actif:true})).toThrow(/scan discret/);
        expect(()=>agir(reprise,'faux-echo',{})).toThrow();
        const bascule=agir(agir(reprise,'mode-discret',{actif:false}),'mode-discret',{actif:true});
        expect(()=>agir(bascule,'scanner-discret',{tour:1})).toThrow();
        expect(bascule.discret.energie).toBe(2);
    });
    it('garde le scan qui épuise la dernière batterie, puis refuse une utilisation à zéro',()=>{
        vi.spyOn(Math,'random').mockReturnValue(0);
        let e=agir(preparerRadar(),'regler-discret',{terrain:'interieur',energie:1,porteurId:'porteur'});
        e=agir(e,'scanner-discret',{tour:1});expect(e.discret.energie).toBe(0);expect(radar.vuePour(e,alice).lectureDiscrete?.echos).toHaveLength(1);
        e=agir(e,'tour-discret',{tour:1});expect(()=>agir(e,'scanner-discret',{tour:2})).toThrow(/batterie/);
    });
    it('limite les humains à deux passages par Tour, impose un Tour entier pour examiner et rejette les doubles avances',()=>{
        let e=agir(preparerRadar(),'deplacer-discret',{pionId:'porteur',zoneId:'z1',tour:1});
        expect(()=>agir(e,'examiner-discret',{pionId:'porteur',tour:1})).toThrow(/entier/);
        e=agir(e,'deplacer-discret',{pionId:'porteur',zoneId:'z2',tour:1});
        expect(()=>agir(e,'deplacer-discret',{pionId:'porteur',zoneId:'z3',tour:1})).toThrow(/budget/);
        e=agir(e,'tour-discret',{tour:1});expect(()=>agir(e,'tour-discret',{tour:1})).toThrow();
        expect(e.discret.pions.every(p=>p.depense===0&&!p.mobile)).toBe(true);
        e=agir(e,'examiner-discret',{pionId:'porteur',tour:2});
        expect(()=>agir(e,'deplacer-discret',{pionId:'porteur',zoneId:'z1',tour:2})).toThrow();
    });
    it('utilise la portée extrême seulement en terrain découvert et garde le mode scénarisé',()=>{
        vi.spyOn(Math,'random').mockReturnValue(.5);
        const base=preparerRadar(),exterieur=agir(base,'regler-discret',{terrain:'exterieur',energie:5,porteurId:'porteur'});
        expect(agir(exterieur,'scanner-discret',{tour:1}).discret.dernierScan?.echos.map(e=>e.zone)).toEqual(['Zone 2','Zone 5']);
        const ancien=agir(base,'mode-discret',{actif:false});
        expect(agir(ancien,'scanner',{actif:true}).tracker.power).toBe(true);
        expect(radar.vuePour(ancien,alice)).not.toHaveProperty('discret');
    });
    it('migre un vrai état v2 sans plan et sans perdre ses réglages',()=>{
        const ancien:Record<string,unknown>={...radar.creerEtat(),version:2};delete ancien.discret;
        const e=radar.migrerEtat(ancien,2);expect(e.version).toBe(3);expect(e.discret.actif).toBe(false);expect(e.tracker.contacts).toBe(3);
    });
});
function preparerTerminal(){let e=maman.creerEtat();for(const id of ['alice','bob'])e=terminal(e,'preparer-operateur',{personnageId:id,nom:id});return e;}
const periode={scenario:'Recette A8',acte:1};
describe('A8 : dossiers et objectifs d’acte MU/TH/UR',()=>{
    it('garde les brouillons privés puis remet une seule fois au seul destinataire sans traiter sa demande',()=>{
        let e=preparerTerminal();e=maman.appliquerCommande(e,{id:'saisir',charge:{texte:'/M Question en attente'}},alice);
        e=terminal(e,'objectif-acte',{...periode,personnageId:'alice',texte:'Sauver les prélèvements.'});
        expect(JSON.stringify(maman.vuePour(e,alice))).not.toContain('prélèvements');
        e=terminal(e,'remettre-objectif-acte',{...periode,personnageId:'alice'});
        expect(JSON.stringify(maman.vuePour(e,alice))).toContain('prélèvements');expect(JSON.stringify(maman.vuePour(e,bob))).not.toContain('prélèvements');
        expect(e.players.alice.requests[0].status).toBe('pending');
        e=maman.migrerEtat(e,4);expect(()=>terminal(e,'remettre-objectif-acte',{...periode,personnageId:'alice'})).toThrow(/déjà/);
        expect(()=>maman.appliquerCommande(e,{id:'objectif-acte',charge:{...periode,personnageId:'bob',texte:'Voler le secret'}},alice)).toThrow(/meneur/);
    });
    it('ne publie un dossier qu’après le geste MJ et conserve ses accès par code',()=>{
        let e=terminal(preparerTerminal(),'dossier-acte',{...periode,dossierId:'acte-secret',titre:'Dossier quarantaines',contenu:'Remède confidentiel',acces:'code',code:'0081'});
        expect(JSON.stringify(maman.vuePour(e,alice))).not.toContain('quarantaines');
        e=terminal(e,'publier-dossier-acte',{...periode,dossierId:'acte-secret'});
        expect(JSON.stringify(maman.vuePour(e,alice))).not.toContain('Remède confidentiel');
        e=maman.appliquerCommande(e,{id:'saisir',charge:{texte:'CODE 0081'}},alice);
        expect(JSON.stringify(maman.vuePour(e,alice))).toContain('Remède confidentiel');
        expect(JSON.stringify(maman.vuePour(e,bob))).not.toContain('Remède confidentiel');
        expect(()=>terminal(e,'publier-dossier-acte',{...periode,dossierId:'acte-secret'})).toThrow(/déjà/);
    });
    it('sauvegarde les actes ; l’export de préparation conserve les brouillons et retire les reçus de séance',()=>{
        let e=terminal(preparerTerminal(),'objectif-acte',{...periode,personnageId:'alice',texte:'Préserver les données.'});
        e=terminal(e,'remettre-objectif-acte',{...periode,personnageId:'alice'});
        expect(maman.migrerEtat(e,4).actes).toEqual(e.actes);
        const configuration=extraireConfiguration(e),importe=etatDepuisConfiguration(configuration);
        expect(importe.actes[0].objectifs[0]).toMatchObject({texte:'Préserver les données.',remis:false});
        expect(importe.players).toEqual({});
    });
    it('migre le terminal v3 en conservant dialogues et codes',()=>{
        const ancien:Record<string,unknown>={...preparerTerminal(),version:3};delete ancien.actes;
        expect(maman.migrerEtat(ancien,3).actes).toEqual([]);expect(ancien).not.toHaveProperty('actes');
    });
});
it('l’autorité native refuse les commandes joueur et ne publie rien si le disque échoue',async()=>{
    let disque:unknown=null;const stockage={lire:async()=>disque,ecrire:vi.fn(async(v:unknown)=>{disque=structuredClone(v);})};
    const service=new ServiceDesModules(stockage,vi.fn());
    await service.changerContexte({campagneId:'camp',seanceId:'s',pilote:{id:'alien',name:'Alien'},personnages:[{id:'alice',nom:'Alice'}]});
    const demande=async()=>({campagneId:'camp',moduleId:'alien-detecteur',contexte:(await service.vueMJ()).contexte});
    await service.autoriser({...await demande(),personnages:['alice']});
    const commander=async(commande:CommandeDeModule,role:'mj'|'joueur'='mj')=>service.commander({...await demande(),requeteId:'r',commande},{role,personnageId:'alice',appareilId:'poste'});
    await expect(commander({id:'mode-discret',charge:{actif:true}},'joueur')).rejects.toThrow();
    const avant=(await service.vueMJ()).sauvegarde;stockage.ecrire.mockRejectedValueOnce(new Error('disque plein'));
    await expect(commander({id:'mode-discret',charge:{actif:true}})).rejects.toThrow();
    expect((await service.vueMJ()).sauvegarde).toEqual(avant);
});
