import { describe,it,expect } from 'vitest';
import { fiche } from './ficheDeVoyageur.fixtures';
import { type SheetTemplate } from '../../../data/defaultSheetTemplates';
import { appliquerOperationDeVoyageur as appliquer, type DonneesDeVoyage, type OperationDeVoyageur } from './operationsDeVoyageur';
import { acheterVoyage, allouerStress, augmenterVoyageur, attribuerStress, convertirStress, coutCaracteristique, coutCompetence, declarerArchetype, experienceDuJet, lireProgression, reporterExperience } from './progressionDuVoyageur';
import { lireMoral, majMoral, resultatMoral, varierMoral } from './moralDuVoyageur';
import { actionAdmetRecours, appelChance, cloreAction, destineeAction, enregistrerAction, lireAction, preparerAppelMoral, recupererChanceParDestinee, relancerAction, type ActionVoyageur } from './recoursDuVoyageur';
import { initialiserSanteVoyageur, proposerJetVie, lireSanteVoyageur } from './santeDuVoyageur';
import { initialiserRepos, proposerChateauDormant } from './reposDuVoyageur';
import { jetDuTest } from './jetDuVoyageur.fixtures';
import { preparerJetDuVoyageur } from './jetDuVoyageur';

const f:SheetTemplate={...fiche,sections:[...fiche.sections,{id:'competences_generales',label:'Compétences',fields:[{id:'navigation',label:'Navigation',type:'number',defaultValue:-11}]}]};
const base=():DonneesDeVoyage=>({moral:0,stress:13,reve:12,reve_pts:15,reve_seuil:14,chance:10,points_de_chance:9,points_de_destinee:2.4,navigation:0,intellect:12,force:12,agilite:12,vue:12,dexterite:12,
    vie:12,vie_max:12,endurance:24,endurance_max:24,fatigue:0,sc:4,__rddFatigue231:1,__rddRepos231:{version:1,jour:0,heuresDormies:1,dernierBilan:'',bilans:[],maladieOuPoison:false,vieApresJour:0,effets:[]}});
const valider=(d:DonneesDeVoyage,p:OperationDeVoyageur)=>appliquer(d,p)!;
const jet=(params:Partial<Omit<ActionVoyageur,'moralAvant'|'moralApres'|'recours'>>={})=>({id:'jet',titre:'Action fictive',caracteristique:'agilite',competence:'navigation',nature:'action' as const,valeur:12,ajustement:-2,de:90,degre:'echec-particulier' as const,perceptionActive:false,sonne:false,offensif:false,moralEngage:false,...params});
const action=(d=base(),params:Partial<ReturnType<typeof jet>>={})=>valider(d,enregistrerAction(d,jet(params),false,undefined,'conserver'));

describe('R5 : livre 2.3.1 et séparation des sources d’XP',()=>{
    it.each([[-10,5],[-8,5],[-7,10],[-4,10],[-3,15],[0,15],[1,20],[4,20],[5,30],[6,30],[7,40],[8,40],[9,60],[10,60],[11,100],[12,100]])('niveau visé %i coûte %i',(n,c)=>expect(coutCompetence(n)).toBe(c));
    it.each([[7,6],[8,6],[9,7],[10,7],[11,8],[12,8],[13,9],[14,9],[15,10],[16,20],[20,60]])('caractéristique visée %i coûte %i',(n,c)=>expect(coutCaracteristique(n)).toBe(c));
    it('Nitouche : 13 stress, rêve actuel 15, d100 67 → 6 XP et 6 stress ; caractéristique ignorée',()=>{
        const d=base(),r=convertirStress(d,'jour-0',67);expect(r.maj.stress).toBe(6);expect(lireProgression(r.maj).reserveStress).toBe(6);
        expect(d.stress).toBe(13);
    });
    it('double particulière, arrondis et déperdition quand rien n’est transformé',()=>{
        const d=base();expect(lireProgression(convertirStress(d,'jour-0',1,30).maj).reserveStress).toBe(19);
        expect(lireProgression(convertirStress(d,'jour-0',1,100).maj).reserveStress).toBe(13);
        expect(convertirStress({...d,stress:4},'jour-0',80).maj.stress).toBe(3);
        expect(()=>convertirStress(d,'jour-0',1)).toThrow();
    });
    it('exaltation ajoute, dissolution annule sans négatif et conserve son reliquat',()=>{
        const d=base();expect(lireProgression(convertirStress({...d,...majMoral({moral:3,exaltation:2,dissolution:0})},'jour-0',67).maj).reserveStress).toBe(8);
        const r=convertirStress({...d,...majMoral({moral:-3,exaltation:0,dissolution:10})},'jour-0',67).maj;
        expect(lireProgression(r).reserveStress).toBe(0);expect(lireMoral(r).dissolution).toBe(4);
    });
    it('pas de conversion sans sommeil, pas deux fois pour la même nuit',()=>{
        const d=base(),r=convertirStress(d,'jour-0',67);
        expect(()=>convertirStress({...d,...r.maj},'jour-0',67)).toThrow(/déjà/);
        expect(()=>convertirStress({...d,__rddRepos231:{jour:0,heuresDormies:0}},'jour-0',67)).toThrow(/sommeil/);
    });
    it('20 stress par situation, compteur cumulé au-delà de vingt',()=>{
        const d=base();expect(attribuerStress(d,20,'Combat','s').maj.stress).toBe(33);
        expect(()=>attribuerStress(d,21,'Combat','s')).toThrow();
    });
    it('allocation et augmentation explicites, coût et plafond d’Archétype',()=>{
        let d=base();d={...d,...convertirStress({...d,stress:40},'jour-0',1,100).maj};
        d=valider(d,declarerArchetype(d,f,'navigation',1,'arch'));
        expect(()=>allouerStress(d,f,'navigation',21,'trop')).toThrow(/potentiel/);
        d=valider(d,allouerStress(d,f,'navigation',20,'allouer'));expect(d.navigation).toBe(0);
        d=valider(d,augmenterVoyageur(d,f,'navigation','niveau'));expect(d.navigation).toBe(1);
        expect(()=>allouerStress(d,f,'navigation',1,'arch-depasse')).toThrow(/inférieur/);
        d=valider(d,reporterExperience(d,f,'navigation',20,'Exercice','exercice'));d=valider(d,augmenterVoyageur(d,f,'navigation','suivant'));expect(d.navigation).toBe(2);
    });
    it('caractéristiques : pas de taille ni dérivée, physiques à vingt, CHANCE au-delà',()=>{
        const d=base();for(const cle of ['taille','melee'])expect(()=>augmenterVoyageur(d,f,cle,'non')).toThrow();
        const p=lireProgression(d);p.exercice.force=100;p.exercice.chance=100;
        expect(()=>augmenterVoyageur({...d,force:20,__rddProgression231:p},f,'force','limite')).toThrow(/20/);
        expect(augmenterVoyageur({...d,chance:20,__rddProgression231:p},f,'chance','mental').maj.chance).toBe(21);
    });
    it('exercice : particulière négative, part impaire à la compétence, une seule attribution',()=>{
        let d=action(base(),{de:1,degre:'reussite-particuliere',ajustement:-3});d=valider(d,cloreAction(d,'clos'));
        d=valider(d,experienceDuJet(d,f,false,false,'','xp'));const p=lireProgression(d);
        expect(p.exercice).toMatchObject({navigation:2,agilite:1});expect(()=>experienceDuJet(d,f,false,false,'','encore')).toThrow(/déjà/);
    });
    it('attaque parée sans dommages : aucune XP ; dérivée répartie',()=>{
        let d=action(base(),{de:1,degre:'reussite-particuliere',caracteristique:'melee',offensif:true,ajustement:-3});d=valider(d,cloreAction(d,'clos'));
        expect(()=>experienceDuJet(d,f,false,false,'force','non')).toThrow(/dommages/);
        expect(lireProgression(experienceDuJet(d,f,true,false,'force','xp').maj).exercice).toMatchObject({navigation:2,force:1});
    });
    it('mémoire à −1 : moitié arrondie zéro ; sans compétence : minimum un ; un rituel reste une action',()=>{
        const f3:SheetTemplate={...f,sections:[...f.sections,{id:'connaissances',label:'Connaissances',fields:[{id:'astrologie',label:'Astrologie',type:'number',defaultValue:0}]}]};
        let d=action(base(),{de:1,degre:'reussite-particuliere',caracteristique:'intellect',competence:'astrologie',ajustement:-1});d=valider(d,cloreAction(d,'clos'));
        expect(lireProgression(experienceDuJet(d,f3,false,true,'','memoire').maj).exercice).toEqual({});
        d=action(base(),{de:1,degre:'reussite-particuliere',caracteristique:'intellect',competence:'',ajustement:-1});d=valider(d,cloreAction(d,'clos'));
        expect(lireProgression(experienceDuJet(d,f3,false,false,'','pure').maj).exercice.intellect).toBe(1);
        d=action(base(),{de:1,degre:'reussite-particuliere',nature:'rituel',caracteristique:'reve',ajustement:-2});d=valider(d,cloreAction(d,'clos'));
        expect(lireProgression(experienceDuJet(d,f3,false,false,'','rituel').maj).exercice.reve).toBe(1);
    });
    it('seuls les XP de stress achètent du voyage, fractions et plafond sept',()=>{
        const d=base(),p=lireProgression(d);p.reserveStress=4;p.exercice.navigation=100;
        const r=acheterVoyage({...d,__rddProgression231:p},2,'voyage');expect(r.maj.points_de_destinee).toBe(2.6);expect(lireProgression(r.maj).reserveStress).toBe(0);
        expect(()=>acheterVoyage(d,1,'non')).toThrow(/stress/);
        expect(acheterVoyage({...d,points_de_destinee:7,__rddProgression231:p},1,'plafond').maj.points_de_destinee).toBe(7);
    });
});

describe('R6 : recours persistants, moral et coût unique',()=>{
    it.each(['force','agilite','dexterite','derobee','apparence','melee','tir','lancer'])('action physique admissible : %s',c=>expect(actionAdmetRecours({caracteristique:c,nature:'action',perceptionActive:false})).toBe(true));
    it('perception seulement active ; caractéristiques interdites et rituels exclus',()=>{
        expect(actionAdmetRecours({caracteristique:'empathie',nature:'action',perceptionActive:true})).toBe(true);
        for(const c of ['vue','ouie','empathie','constitution','volonte','intellect','reve','chance'])expect(actionAdmetRecours({caracteristique:c,nature:'action',perceptionActive:false})).toBe(false);
        expect(actionAdmetRecours({caracteristique:'agilite',nature:'rituel',perceptionActive:true})).toBe(false);
    });
    it('chance ratée : aucun coût, second appel et destinée interdits après relecture',()=>{
        let d=action();d=valider(d,appelChance(d,100,0,'chance'));expect(d.points_de_chance).toBe(9);
        expect(()=>appelChance(structuredClone(d),1,4,'encore')).toThrow();expect(()=>destineeAction(d,'non')).toThrow();
    });
    it('chance réussie : points actuels, un coût et une seule relance identique',()=>{
        let d=action();d=valider(d,appelChance(d,40,0,'chance'));expect(d.points_de_chance).toBe(8);expect(d.__rddChanceDepensee231).toBe(true);
        d=valider(d,relancerAction(d,1,'relancer'));expect(lireAction(d)).toMatchObject({recours:'relancee',ajustement:-2,degre:'reussite-particuliere'});
        expect(()=>relancerAction(d,1,'double')).toThrow();expect(()=>destineeAction(d,'non')).toThrow();
    });
    it('destinée : significative, aucune chance, pas à −11 ; exception CONSTITUTION',()=>{
        const d=action(),r=destineeAction(d,'destin');expect(r.maj.points_de_destinee).toBe(1.4);expect(lireAction(r.maj)?.degre).toBe('reussite-significative');expect(r.maj.points_de_chance).toBeUndefined();
        expect(()=>destineeAction(action(base(),{ajustement:-11}),'non')).toThrow(/−11/);
        expect(lireAction(destineeAction(action(base(),{caracteristique:'constitution',degre:'echec-total'}),'cons').maj)?.degre).toBe('echec-normal');
        expect(lireAction(destineeAction(action(base(),{caracteristique:'constitution'}),'cons').maj)?.degre).toBe('reussite-particuliere');
    });
    it('un point entier de destinée rend toute la chance',()=>{
        expect(recupererChanceParDestinee(base(),'r').maj).toMatchObject({points_de_destinee:1.4,points_de_chance:10});
        expect(()=>recupererChanceParDestinee({...base(),points_de_destinee:0.9},'non')).toThrow();
    });
    it('moral engagé : la relance annule le coût de l’échec si elle réussit',()=>{
        let d:DonneesDeVoyage={...base(),moral:2};d=valider(d,enregistrerAction(d,jet({moralEngage:true}),true,undefined,'engage'));
        expect(d.moral).toBe(1);d=valider(d,appelChance(d,1,0,'chance'));d=valider(d,relancerAction(d,1,'relance'));
        expect(d.moral).toBe(2);expect(d.points_de_chance).toBe(8);
    });
    it('désespoir : bonus virtuel et dissolution à −3, sans double paiement',()=>{
        expect(preparerAppelMoral({...base(),moral:-3},true,20)).toMatchObject({bonus:0,base:{moral:-3,dissolution:1}});
        let d:DonneesDeVoyage={...base(),moral:-3};d=valider(d,enregistrerAction(d,jet({moralEngage:true}),true,1,'desespoir'));
        expect(lireMoral(d).dissolution).toBe(1);d=valider(d,appelChance(d,1,0,'chance'));d=valider(d,relancerAction(d,100,'encore'));
        expect(lireMoral(d).dissolution).toBe(1);
    });
    it('moral : les frontières, les neutres et annulation exaltation/dissolution',()=>{
        expect(resultatMoral({moral:3,exaltation:0,dissolution:0},'heureuse',13)).toMatchObject({moral:3,exaltation:1});
        expect(resultatMoral({moral:-3,exaltation:0,dissolution:0},'malheureuse',8)).toMatchObject({moral:-3,dissolution:1});
        expect(resultatMoral({moral:3,exaltation:2,dissolution:0},'neutre',15)).toMatchObject({moral:2,exaltation:2});
        expect(resultatMoral({moral:0,exaltation:0,dissolution:0},'neutre',10).moral).toBe(1);
        expect(varierMoral({moral:3,exaltation:0,dissolution:1},1)).toEqual({moral:3,exaltation:0,dissolution:0});
    });
    it('VOLONTÉ reçoit le moral ; aucun autre jet ordinaire',()=>{
        const v={...base(),volonte:12,__rddFatigue231:1};const f2={...f,sections:[...f.sections,{id:'vol',label:'VOLONTÉ',fields:[{id:'volonte',label:'VOLONTÉ',type:'number' as const,defaultValue:12}]}]};
        const descripteur={...jetDuTest,cible:{...jetDuTest.cible!,caracteristique:{...jetDuTest.cible!.caracteristique,sectionId:'vol'},ajustement:[]}};
        expect(preparerJetDuVoyageur(descripteur,f2,{...v,moral:3},{caracteristique:'volonte'},0).jet.seuil).toBe(78);
    });
    it('destinée appliquée au vrai jet de vie R2 : 20 → 19, 2 → 1',()=>{
        const d=initialiserSanteVoyageur({...base(),vie:1},{critique:1});const s=lireSanteVoyageur(d)!;s.secondes=6;d.__rddSante231=s;
        const p=proposerJetVie(d,'reprise-critique-0',()=>20,'vie20',true);expect((p.maj.__rddSante231 as {mort:boolean}).mort).toBe(false);expect(p.maj.vie).toBe(0);expect(p.maj.points_de_destinee).toBe(1.4);
        expect(proposerJetVie(d,'reprise-critique-0',()=>2,'vie2',true).maj.vie).toBe(1);
    });
});

describe('R4–R6 : ordre du Château Dormant',()=>{
    it('stress sur rêve 16 avant sa perte ; moral ensuite, chance sans dépense, replay refusé',()=>{
        let d=initialiserSanteVoyageur({...base(),reve_pts:16,__rddRepos231:undefined});d=valider(d,initialiserRepos(d,{},false,'repos',false));
        (d.__rddRepos231 as {heuresDormies:number}).heuresDormies=1;
        const choix={nom:'5 Dragon',controlesManuels:true,maladieOuPoison:false,jetsBlessures:{},herbes:{},bonusDecoction:0,
            etapesVoyageur:{stressDe:79,moralDe:10,situation:'neutre' as const,chanceDepensee:false}};
        const p=proposerChateauDormant(d,choix,'nuit');expect(lireProgression(p.maj).reserveStress).toBe(6);expect(p.maj).toMatchObject({reve_pts:15,moral:1,points_de_chance:10,stress:6});
        d=valider(d,p);expect(appliquer(d,p)).toBeNull();expect(()=>proposerChateauDormant(d,choix,'deux')).toThrow(/déjà/);
    });
    it('jour avec dépense : pas de récupération, suivi remis à zéro pour demain',()=>{
        const d=initialiserSanteVoyageur({...base(),__rddChanceDepensee231:true});
        const p=proposerChateauDormant(d,{nom:'6 Dragon',controlesManuels:true,maladieOuPoison:false,jetsBlessures:{},herbes:{},bonusDecoction:0,
            etapesVoyageur:{stressDe:67,moralDe:11,situation:'neutre',chanceDepensee:false}},'nuit');
        expect(p.maj).toMatchObject({points_de_chance:9,__rddChanceDepensee231:false});
    });
});

describe('Entraînement et apprentissage (p. 145–147)', () => {
    it('le rythme de l’apprentissage retrouve les durées du livre', async () => {
        const { experienceDApprentissage, semainesParPoint } = await import('./progressionDuVoyageur');
        expect(semainesParPoint(0)).toBeCloseTo(1/3);
        expect(semainesParPoint(4)).toBe(2);
        expect(experienceDApprentissage(3,0,40,5)).toEqual({xp:20,niveauAtteint:4}); // +3 → +4 : 40 semaines
        expect(experienceDApprentissage(4,0,90,5)).toEqual({xp:30,niveauAtteint:5}); // +4 → +5 : 90 semaines
        expect(experienceDApprentissage(0,0,20,1)).toEqual({xp:20,niveauAtteint:1}); // 0 → +1 : 20 semaines
        expect(experienceDApprentissage(3,0,400,4).xp).toBe(20); // jamais au-delà du maître
    });
});

describe('Une heure d’entraînement (p. 146–147)', () => {
    it('joue 1d6 jets à −1 ; chaque particulière rapporte un point, chaque échec total est une maladresse', async () => {
        const { proposerEntrainement } = await import('./progressionDuVoyageur');
        const d: DonneesDeVoyage = {navigation:2,agilite:12,fatigue:0};
        const p = proposerEntrainement(d,f,{competence:'navigation',caracteristique:'agilite',fatigue:2,d6:3,jets:[1,50,100]},'e');
        expect(p.details[0]).toMatch(/difficulté -3, ajustement final -1/);
        const apres = appliquer(d,p)!;
        expect(lireProgression(apres).exercice.navigation).toBe(1);
        expect(apres.fatigue).toBe(2);
        expect(p.details.join(' ')).toMatch(/1 échec\(s\) total/);
        expect(() => proposerEntrainement(d,f,{competence:'navigation',caracteristique:'agilite',fatigue:2,d6:3,jets:[1]},'x')).toThrow(/3 jet/);
    });
    it('à deux, le plus fort ne gagne rien ; un désir lancinant bloque l’expérience', async () => {
        const { proposerEntrainement } = await import('./progressionDuVoyageur');
        const d: DonneesDeVoyage = {navigation:2,agilite:12,fatigue:0};
        expect(proposerEntrainement(d,f,{competence:'navigation',caracteristique:'agilite',fatigue:2,d6:1,jets:[1],partenaire:0},'p').details[1]).toMatch(/\+0 XP.*plus fort/);
        const desir = {...d,__rddHautReve231:{actifs:[{nom:'Désir lancinant'}]}};
        expect(proposerEntrainement(desir,f,{competence:'navigation',caracteristique:'agilite',fatigue:2,d6:1,jets:[1]},'q').details[1]).toMatch(/aucune tant que dure/);
    });
});
