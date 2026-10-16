import React from 'react';
import { Shield } from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { gmToast } from '../../../stores/useToastStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { facesDuNiveau } from '../../dice/desEchelonnes';
import type { Combatant } from '../types';

/**
 * **La protection, au coup subi** — Blade Runner, 2026-10-16 (carnet « Blade
 * Runner », « ÉQUIPEMENT DE PROTECTION ») : *« chaque fois qu'un personnage subit
 * les dégâts d'une attaque, il lance deux dés de base correspondant au niveau de
 * sa protection ; chaque réussite diminue les dégâts de 1. Si les dégâts tombent
 * à 0, la protection annule aussi la blessure critique. »* Elle n'absorbe jamais
 * les dégâts d'un forçage, et ne s'use pas.
 *
 * Le bouton lance et dit combien retirer ; le meneur saisit ensuite les dégâts
 * restants — la carte ne sait pas quelle attaque vient de tomber.
 */
const ProtectionDuCombattant: React.FC<{ combatant: Combatant; valeurs: Record<string, unknown> }> = ({ combatant, valeurs }) => {
    const regle = useSessionOSStore(s => s.getActiveDriver())?.combat?.protection;
    const niveau = regle ? valeurs[regle.champ] : undefined;
    // Une lettre seule (« C », « C (D8) ») : « Aucune » ou « Sans » ne sont pas un D12.
    const faces = regle && /^\s*[A-D](?![\p{L}])/iu.test(String(niveau ?? '')) ? facesDuNiveau(niveau) : null;
    if (!regle || !faces) return null;
    const nombre = Math.max(1, regle.des ?? 2);
    const nom = (regle.nomSur && String(valeurs[regle.nomSur] ?? '').trim()) || regle.label || 'Protection';

    const lancer = () => {
        const jet = DiceEngine.rollYZEEchelonne(Array.from({ length: nombre }, () => faces));
        const n = jet.successes ?? 0;
        const dit = n === 0 ? 'rien ne passe' : `−${n} dégât${n > 1 ? 's' : ''} ; ramenés à 0, la blessure critique est annulée`;
        useDiceStore.getState().setLastRoll({
            ...jet, id: `protection-${combatant.id}-${Date.now()}`, timestamp: new Date(),
            title: `${combatant.name} — ${nom} ${String(niveau).toUpperCase()}`,
            totalDisplay: `${jet.totalDisplay} : ${dit}`,
        });
        gmToast(`${combatant.name} — ${nom} : ${n} réussite${n > 1 ? 's' : ''}, ${dit}.`, 'info');
    };

    return (
        <div data-protection className="mx-3 my-1 flex items-center gap-2">
            <button type="button" onClick={lancer}
                title="À chaque coup subi : chaque réussite retire un point de dégâts. Pas contre les dégâts d'un forçage."
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-app-border/50 text-ui-10 font-bold text-app-text/80 hover:border-accent/50 hover:text-accent transition-colors">
                <Shield size={12} /> {nom} {String(niveau).toUpperCase()} : {nombre}D{faces}
            </button>
        </div>
    );
};

export default ProtectionDuCombattant;
