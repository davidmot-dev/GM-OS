import {describe,expect,it} from 'vitest';
import {appliquerOperationDeVoyageur,conserverOperationsDeVoyageur,operationDeVoyageur} from './operationsDeVoyageur';
import {DonneesDeFicheSchema} from '../../../types/donneesDeFiche';
describe('écritures et reprise R3/R4',()=>{
    it('conserve le reçu au rechargement et lors d’un envoi d’une ancienne fiche',()=>{
        const d={vie:8,__rddRepos231:{version:1,jour:0}};
        const p=operationDeVoyageur(d,'nuit-1',{vie:9},'Repos',['Un point de vie.']);
        const apres=appliquerOperationDeVoyageur(d,p)!;
        const recharge=DonneesDeFicheSchema.parse(JSON.parse(JSON.stringify(apres)));
        expect(appliquerOperationDeVoyageur(recharge,p)).toBeNull();
        expect(conserverOperationsDeVoyageur(apres,{vie:9})).toMatchObject({__rddRepos231:d.__rddRepos231,__rddOperationsR34231:['nuit-1']});
        expect(d.vie).toBe(8);
    });
    it('refuse une correction postérieure à l’aperçu et refuse de tronquer les reçus',()=>{
        const d={vie:8};const p=operationDeVoyageur(d,'nuit-1',{vie:9},'Repos',[]);
        expect(()=>appliquerOperationDeVoyageur({...d,vie:7},p)).toThrow(/changé/);
        const plein={...d,__rddOperationsR34231:Array.from({length:10000},(_,i)=>String(i))};
        const q=operationDeVoyageur(plein,'limite',{vie:9},'Repos',[]);
        expect(()=>appliquerOperationDeVoyageur(plein,q)).toThrow(/10 000/);
    });
});
