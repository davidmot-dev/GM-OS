import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { DiceEngine } from '../../../dice/DiceEngine';
import { subirLeStress } from '../../../dice/systemes/yearZero';
import { useDiceStore } from '../../../../stores/useDiceStore';
import { gmToast } from '../../../../stores/useToastStore';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';

/**
 * **Le stress subi** — Blade Runner, 2026-10-16 (carnet « Blade Runner », « STRESS
 * ET SANG-FROID »). Le meneur choisit le facteur (1 : une menace, voir un allié
 * gravement blessé ; 2 : la mort d'un allié, un interrogatoire ; 3 : un massacre,
 * la torture) ; le bouton lance l'Empathie et la Psychologie, retire une réussite
 * par point, et écrit le reste sur le Sang-froid. À zéro, la carte de combat dit
 * Brisé par le stress et lance son effet critique.
 *
 * Sur la carte de combat et sous le panneau de jet de la fiche, au meneur.
 */
const StressSubi: React.FC<{
    regle: NonNullable<DescripteurDeJet['stressSubi']>;
    valeurs: Record<string, unknown>;
    nom: string;
    ecrire: (maj: Record<string, number>) => void;
}> = ({ regle, valeurs, nom, ecrire }) => {
    const [facteur, setFacteur] = useState(1);
    const max = Math.max(1, regle.facteurMax ?? 3);
    const label = regle.label ?? 'Stress';

    const subir = () => {
        const r = subirLeStress(facteur, regle, valeurs, faces => DiceEngine.roll(faces));
        if (r.apres !== r.avant) ecrire({ [regle.champ]: r.apres });
        const des = r.des.map(d => `D${d.faces} ${d.val}`).join(', ') || 'aucun dé sur la fiche';
        const dit = `facteur ${facteur} − ${r.reussites} réussite${r.reussites > 1 ? 's' : ''} (${des}) = −${r.perte} → ${r.apres}`
            + (r.apres === 0 && r.avant > 0 ? ' — Brisé par le stress' : '');
        useDiceStore.getState().setLastRoll({
            id: `stress-${Date.now()}`, timestamp: new Date(), title: `${nom} — ${label} subi`,
            total: r.perte, modifier: 0, successes: r.reussites, tagSuccess: r.perte === 0,
            rolls: r.des.map(d => ({ val: d.val, sides: d.faces, source: 'base' as const })),
            totalDisplay: dit,
        });
        gmToast(`${nom} — ${label} : ${dit}.`, r.apres === 0 && r.avant > 0 ? 'warning' : 'info');
    };

    return (
        <div data-stress-subi className="flex flex-wrap items-center gap-2 text-ui-10">
            <Brain size={12} className="text-app-text/50" />
            <span className="font-bold text-app-text/70">{label} subi</span>
            <select aria-label={`Facteur de ${label.toLowerCase()}`} value={facteur} onChange={e => setFacteur(Number(e.target.value))}
                className="min-w-[3.5rem] rounded-md border border-app-border/40 bg-app-bg py-0.5 pl-2 pr-7">
                {Array.from({ length: max }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button type="button" onClick={subir}
                title="Lance les dés de la fiche : chaque réussite retire un point du facteur, le reste se retire du Sang-froid"
                className="rounded-lg border border-app-border/50 px-2 py-0.5 font-bold text-app-text/80 hover:border-accent/50 hover:text-accent transition-colors">
                Encaisser
            </button>
        </div>
    );
};

export default StressSubi;
