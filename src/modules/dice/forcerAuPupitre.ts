import { DiceEngine } from './DiceEngine';
import { forcerLeJet, pourquoiNePasForcer, prixDuForcage, type RegleDuForcage } from './systemes/yearZero';
import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import type { DescripteurDeJet } from './DescripteurDeJet';

/**
 * **Forcer le dernier jet du pupitre** — Year Zero, 2026-10-14.
 *
 * Le pupitre ne connaît pas la fiche : on y saisit des lettres ou un nombre de
 * dés, pas des champs. Il relance donc selon la règle du pilote — les dés gardés,
 * le dé de Stress en plus, l'interdiction après une Panique — mais il **annonce**
 * le prix au lieu de l'écrire : le meneur le reporte sur la fiche. Pour l'écrire,
 * il y a le panneau de la fiche.
 *
 * Sans personnage, on ne sait pas s'il force une ou deux fois (le réplicant) :
 * le pupitre permet le plus grand nombre que la règle connaisse, et le dit.
 */

/** Un jet du pupitre est-il un jet Year Zero qu'on peut forcer ? */
export function estUnJetYearZero(jet: Pick<RollRecord, 'rolls'>): boolean {
    return jet.rolls.length > 0 && jet.rolls.every(d => d.source === 'base' || d.source === 'gear');
}

/** Ce que le pupitre ne sait pas : le personnage. Il garde le plus grand nombre de forçages. */
function regleDuPupitre(regle: RegleDuForcage): RegleDuForcage {
    const fois = Math.max(regle.fois ?? 1, ...(regle.foisSi ?? []).map(f => f.fois));
    return { ...regle, fois, foisSi: undefined, interdit: undefined };
}

/** Pourquoi le dernier jet ne se force pas — ou `null`. */
export function pourquoiNePasForcerAuPupitre(jet: RollRecord, descripteur: DescripteurDeJet | undefined): string | null {
    if (!descripteur?.forcer) return 'Ce jeu ne fait pas forcer ses jets.';
    if (!estUnJetYearZero(jet)) return 'Seul un jet Year Zero se force.';
    return pourquoiNePasForcer(regleDuPupitre(descripteur.forcer), {
        resultat: jet, valeurs: {}, choix: {}, dejaForce: jet.forcages ?? 0,
        libelleDuUn: descripteur.reserve?.secondaire?.libelleDuUn,
    });
}

/** Le prix, dit pour être reporté : le Stress qui monte, ou les points que coûtent les 1. */
function direLePrix(regle: RegleDuForcage, descripteur: DescripteurDeJet, force: RollRecord, dejaAnnonces: number): { texte: string; uns: number } {
    const morceaux: string[] = [];
    if (regle.monteeDeLaSeconde) {
        morceaux.push(`${descripteur.reserve?.secondaire?.label ?? 'Seconde réserve'} +${regle.monteeDeLaSeconde}`);
    }
    const prix = prixDuForcage(regle, { resultat: force, valeurs: {}, choix: {}, dejaPayes: dejaAnnonces });
    if (prix && prix.points > 0) {
        const champs = [...new Set([prix.label, ...(regle.prixDesUns?.si ?? []).map(s => s.label ?? s.champ)])];
        morceaux.push(`−${prix.points} ${champs.join(' ou ')}`);
    }
    return { texte: morceaux.length ? `${morceaux.join(', ')} à reporter sur la fiche` : 'rien à payer', uns: prix?.uns ?? dejaAnnonces };
}

/**
 * Force le dernier jet du pupitre et le consigne comme un jet neuf. Rend la raison
 * d'un refus, ou `null` quand le jet est forcé.
 */
export function forcerLeDernierJet(): string | null {
    const des = useDiceStore.getState();
    const dernier = des.history[0];
    const descripteur = useSessionOSStore.getState().getActiveDriver?.()?.jet;
    if (!dernier) return 'Aucun jet à forcer.';
    const refus = pourquoiNePasForcerAuPupitre(dernier, descripteur);
    if (refus || !descripteur?.forcer) return refus;

    const regle = regleDuPupitre(descripteur.forcer);
    const resultat = forcerLeJet(dernier, regle, {
        famille: descripteur.desEchelonnes ? 'echelonnee' : 'reserve',
        desEnPlus: regle.monteeDeLaSeconde ?? 0,
        libelleDuUn: descripteur.reserve?.secondaire?.libelleDuUn,
        de: faces => DiceEngine.roll(faces),
    });
    const brouillon = { ...dernier, ...resultat } as RollRecord;
    const prix = direLePrix(regle, descripteur, brouillon, dernier.unsAnnonces ?? 0);
    const titreDOrigine = dernier.title.replace(/ · forcé.*$/, '');
    des.setLastRoll({
        ...brouillon,
        id: `${dernier.id}-f${(dernier.forcages ?? 0) + 1}`,
        timestamp: new Date(),
        title: `${titreDOrigine} · forcé — ${prix.texte}`,
        forcages: (dernier.forcages ?? 0) + 1,
        unsAnnonces: prix.uns,
    });
    if (des.isDiceProjected) des.triggerDiceProjection();
    return null;
}
