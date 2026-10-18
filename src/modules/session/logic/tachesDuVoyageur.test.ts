import { describe, expect, it } from 'vitest';
import { appliquerOperationDeVoyageur } from './operationsDeVoyageur';
import { creerTache, lireTaches, periodeDeTache, suspendreTache } from './tachesDuVoyageur';
import type { DegreDeReussite } from '../../dice/degresDeReussite';
const commencer = (participants = ['Brucelin'], objectif = 6, periode = 1200, limite: number | null = null) => appliquerOperationDeVoyageur({},creerTache({},
    {id:'pont',nom:'Passerelle',participants,objectif,periodiciteSecondes:periode,difficulte:-3,limiteSecondes:limite,seuilNegatif:null},'creation'))!;
describe('points de tâche 2.3.1, p. 84–85', () => {
    it('reproduit les quatre périodes de la passerelle du livre : six points en 80 minutes', () => {
        let d = commencer();
        const degres: DegreDeReussite[] = ['reussite-normale','echec-normal','reussite-particuliere','reussite-significative'];
        for (const [i,degre] of degres.entries()) d = appliquerOperationDeVoyageur(d,periodeDeTache(d,'pont',[{participant:'Brucelin',degre}],String(i)))!;
        expect(lireTaches(d).taches[0]).toMatchObject({points:6,periodes:4,etat:'reussie',malus:0});
        expect(lireTaches(d).taches[0].periodes*lireTaches(d).taches[0].periodiciteSecondes).toBe(4800);
    });
    it('additionne tous les participants une fois par période, comme l’abri du livre', () => {
        let d = commencer(['Brucelin','Nitouche'],4,600);
        const a: DegreDeReussite[] = ['reussite-normale','reussite-particuliere','reussite-significative'];
        const b: DegreDeReussite[] = ['echec-normal','echec-particulier','echec-normal'];
        for (let i=0;i<3;i++) d = appliquerOperationDeVoyageur(d,periodeDeTache(d,'pont',[{participant:'Brucelin',degre:a[i]},{participant:'Nitouche',degre:b[i]}],String(i)))!;
        expect(lireTaches(d).taches[0]).toMatchObject({points:4,periodes:3,etat:'reussie'});
    });
    it('conserve le fonds négatif et le malus après pause ; refuse les résultats incomplets et les jets réutilisés', () => {
        let d = commencer();
        const p = periodeDeTache(d,'pont',[{participant:'Brucelin',degre:'echec-total',jetId:'jet-1'}],'p1');
        d = appliquerOperationDeVoyageur(d,p)!;
        expect(appliquerOperationDeVoyageur(d,p)).toBeNull();
        expect(lireTaches(d).taches[0]).toMatchObject({points:-4,malus:-1});
        expect(() => periodeDeTache(d,'pont',[],'p2')).toThrow(/chaque participant/);
        expect(() => periodeDeTache(d,'pont',[{participant:'Brucelin',degre:'reussite-particuliere',jetId:'jet-1'}],'p2')).toThrow(/déjà/);
        d = appliquerOperationDeVoyageur(d,suspendreTache(d,'pont','pause'))!;
        expect(() => periodeDeTache(d,'pont',[{participant:'Brucelin',degre:'reussite-normale'}],'p2')).toThrow(/active/);
        d = appliquerOperationDeVoyageur(d,suspendreTache(d,'pont','reprise'))!;
        expect(lireTaches(d).taches[0]).toMatchObject({points:-4,malus:-1,periodes:1});
    });
    it('fait expirer l’échéance même pendant une pause, et refuse un aperçu périmé', () => {
        let d = commencer(['Brucelin'],6,60,120);
        const ancien = suspendreTache(d,'pont','ancien');
        d = appliquerOperationDeVoyageur(d,suspendreTache(d,'pont','pause'))!;
        expect(() => appliquerOperationDeVoyageur(d,ancien)).toThrow(/changé/);
        for (const id of ['attente1','attente2']) d = appliquerOperationDeVoyageur(d,periodeDeTache(d,'pont',[],id,true))!;
        expect(lireTaches(d).taches[0]).toMatchObject({etat:'echouee',periodes:2,points:0});
    });
    it('ne fait pas lancer de dé pour un participant absent et ne lui attribue pas un échec',()=>{
        const d=commencer(['Brucelin','Nitouche']);
        const p=periodeDeTache(d,'pont',[{participant:'Brucelin',degre:'reussite-particuliere'},{participant:'Nitouche',degre:'absent'}],'periode');
        expect(lireTaches(appliquerOperationDeVoyageur(d,p)!).taches[0]).toMatchObject({points:3,malus:0,periodes:1});
        expect(p.details.join(' ')).toContain('Nitouche : ne participe pas');
    });
    it('accepte une échéance de plusieurs mois sans lui appliquer une borne de score',()=>{
        const d=commencer(['Brucelin'],100,86400,90*86400);
        expect(lireTaches(d).taches[0].limiteSecondes).toBe(90*86400);
    });
});
