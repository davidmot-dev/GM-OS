import { useRef, useState } from 'react';
import { appliquerOperationDeVoyageur, type DonneesDeVoyage, type OperationDeVoyageur } from '../logic/operationsDeVoyageur';

export function useOperationDeVoyageur(donnees: DonneesDeVoyage, appliquer: (d: DonneesDeVoyage) => void, avantOperation?: () => boolean) {
    const [apercu,setApercu] = useState<OperationDeVoyageur | null>(null), [erreur,setErreur] = useState('');
    const verrou = useRef(false);
    function proposer(f: (id:string) => OperationDeVoyageur) {
        if (avantOperation && !avantOperation()) return;
        try {setApercu(f(crypto.randomUUID()));setErreur('');} catch(e) {setErreur((e as Error).message);setApercu(null);}
    }
    function confirmer() {
        if (!apercu || verrou.current || avantOperation && !avantOperation()) return;
        verrou.current = true;
        try {const maj = appliquerOperationDeVoyageur(donnees,apercu);if (maj) appliquer(maj);setApercu(null);setErreur('');}
        catch(e) {setErreur((e as Error).message);setApercu(null);}
        finally {verrou.current = false;}
    }
    return {apercu,erreur,proposer,confirmer,annuler:() => setApercu(null)};
}
