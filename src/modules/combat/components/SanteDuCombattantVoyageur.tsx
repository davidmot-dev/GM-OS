import type { Combatant } from '../types';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { PanneauRepriseVoyageur } from '../../session/components/PanneauRepriseVoyageur';
import { PanneauFatigueVoyageur } from '../../session/components/PanneauFatigueVoyageur';
import { PanneauSanteVoyageur } from '../../session/components/PanneauSanteVoyageur';
import { CLE_REPRISE, lireFicheDeVoyageur } from '../../session/logic/ficheDeVoyageur';
import { projeterSanteVoyageur } from '../../session/logic/santeDuVoyageur';

/** Une opération écrit tout le bloc de santé chez son porteur : PJ, PNJ ou plateau. */
export function SanteDuCombattantVoyageur({combattant,fiche,donnees}: {
    combattant: Combatant; fiche: SheetTemplate; donnees: Record<string,unknown>;
}) {
    const round = useCombatStore(s => s.round);
    const appliquer = (maj:Record<string,unknown>) => {
        const s = useSessionOSStore.getState();
        const valeurs = lireFicheDeVoyageur(fiche,{...donnees,...maj}).valeurs;
        const healthSystem = projeterSanteVoyageur(valeurs,combattant.healthSystem);
        if (combattant.sourcePlayerId) {
            const joueur = s.players.find(p => p.characters.some(c => c.id === combattant.sourcePlayerId));
            if (joueur) s.updateCharacter(joueur.id,combattant.sourcePlayerId,{sheetData:valeurs});
        } else if (combattant.sourceEntityId) s.updateEntity(combattant.sourceEntityId,{
            sheetData:valeurs,hp:Number(valeurs.vie),maxHp:Number(valeurs.vie_max),healthSystem,
        });
        else {
            useCombatStore.getState().updateCombatant(combattant.id,{
                sheetData:valeurs as Combatant['sheetData'],hp:Number(valeurs.vie),hpMax:Number(valeurs.vie_max),healthSystem,
            });
        }
    };
    if (donnees[CLE_REPRISE] !== 1) return <PanneauRepriseVoyageur fiche={fiche} donnees={donnees} appliquer={appliquer}
        vieCombat={combattant.hp} maxVieCombat={combattant.hpMax} />;
    const valeurs = lireFicheDeVoyageur(fiche,donnees).valeurs;
    return <div className="space-y-3">
        <PanneauFatigueVoyageur donnees={valeurs} appliquer={appliquer} />
        <PanneauSanteVoyageur donnees={valeurs} appliquer={appliquer} roundCombat={round} />
    </div>;
}
