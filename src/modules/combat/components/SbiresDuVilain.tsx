import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { gmToast } from '../../../stores/useToastStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { lancerUneChaine } from '../../dice/systemes/torg';
import { niveauDuGroupe } from '../../table/reservesDuGroupe';
import { ND_DES_SBIRES, estUnSbire, issueDesSbires, malusDesCases } from '../logic/sbiresEtHordes';
import type { Combatant } from '../types';

/**
 * **Les sbires, boucliers vivants** — Torg, 2026-10-16. Sur la carte d'un
 * adversaire qui n'est pas lui-même un sbire : le vilain touché tente son test de
 * Réalité contre ND 10, avec le malus de ses Blessures. Le test se lit sur la
 * fiche comme l'Annulation des dommages (`jet.torg.annulation`).
 *
 * GM-OS ne sait pas quel vilain a la capacité ni quel sbire est proche : le
 * bouton lance et dit ; le meneur porte le coup sur la bonne carte.
 */
const SbiresDuVilain: React.FC<{ combatant: Combatant; valeurs: Record<string, unknown> }> = ({ combatant, valeurs }) => {
    const pilote = useSessionOSStore(s => s.getActiveDriver());
    const test = pilote?.jet?.torg?.annulation;
    if (combatant.isPlayer || combatant.horde || !test || pilote?.combat?.dommages?.mecanique !== 'torg') return null;
    if (estUnSbire(combatant.healthSystem)) return null;

    const lancer = () => {
        const niveau = niveauDuGroupe(valeurs, test.attribut) + niveauDuGroupe(valeurs, test.competence);
        const malus = malusDesCases(combatant.healthSystem);
        const res = DiceEngine.resultatDeTorg(niveau, ND_DES_SBIRES, { premier: lancerUneChaine(() => DiceEngine.roll(20)) },
            { malus, raisonDuMalus: malus ? `Blessure${malus > 1 ? 's' : ''}` : undefined });
        const issue = issueDesSbires(!!res.degre?.startsWith('reussite'));
        useDiceStore.getState().setLastRoll({
            ...res, id: `sbires-${combatant.id}-${Date.now()}`, timestamp: new Date(),
            title: `${combatant.name} — Sbires (Réalité)`, totalDisplay: `${issue} — ${res.totalDisplay}`,
        });
        gmToast(`${combatant.name} — Sbires : ${issue}.`, 'info');
    };

    return (
        <div className="mx-3 my-1" data-sbires={combatant.id}>
            <button type="button" onClick={lancer}
                className="flex items-center gap-1.5 rounded-lg border border-app-border/40 px-3 py-1 text-ui-10 font-bold hover:border-accent/40 transition-colors"
                title="Capacité « Sbires » : le vilain touché fait un test de Réalité contre ND 10 ; réussi, l'attaque passe à un laquais proche">
                <ShieldAlert size={12} /> Sbires · Réalité ND {ND_DES_SBIRES}
            </button>
        </div>
    );
};

export default SbiresDuVilain;
