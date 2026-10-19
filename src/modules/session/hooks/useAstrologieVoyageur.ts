import { useSessionOSStore } from '../useSessionOSStore';
import { useClockStore } from '../../../store/useClockStore';
import { bonusAstralReel } from '../logic/astrologieDuVoyageur';

export function useAstrologieVoyageur(campagneId?:string|null) {
    const astrologie=useSessionOSStore(s=>s.campaigns.find(c=>c.id===campagneId)?.rddAstrologie);
    const instant=useClockStore(s=>s.timestamp),mode=useClockStore(s=>s.mode);
    const bonus=(naissance:unknown)=>{
        if (!astrologie) return 0;
        if (mode !== 'static' && mode !== 'fantasy') throw new Error('Placer Clock-OS en temps de jeu statique ou fantastique pour utiliser l’astrologie.');
        return bonusAstralReel(astrologie,instant,naissance);
    };
    return {astrologie,instant,mode,bonus};
}
