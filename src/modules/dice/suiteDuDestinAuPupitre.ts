import { DiceEngine } from './DiceEngine';
import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { consignerLeJet } from '../journal/consignerLeJet';
export const desDuDixDisponibles = (jet: RollRecord) => jet.rolls.some(d => d.sides !== undefined && d.sides !== 10) ? 0 : Math.max(0,
    jet.rolls.filter(d => !d.isDropped && d.val === 10).length - jet.rolls.filter(d => !d.isDropped && d.isExploded).length);
/** Au pupitre aussi, les 1 sont du Fiel : ils ne retirent jamais une réussite (NOC p. 231). */
export function resultatDestinAuPupitre(jet: RollRecord): RollRecord {
    if (!jet.rolls.length || jet.rolls.some(d => d.sides !== undefined && d.sides !== 10)) return jet;
    const reussites = jet.rolls.filter(d => !d.isDropped && Number(d.val) >= 8).length;
    const uns = jet.rolls.filter(d => !d.isDropped && d.val === 1).length;
    return { ...jet, total: reussites + jet.modifier, successes: reussites, fails: 0,
        tagSuccess: reussites + jet.modifier > 0,
        degre: reussites + jet.modifier > 0 ? 'reussite-normale' : 'echec-normal',
        totalDisplay: `${reussites} réussite${reussites > 1 ? 's' : ''}${jet.modifier ? ` + ${jet.modifier}` : ''} · ${uns} goutte${uns > 1 ? 's' : ''} de Fiel à attribuer` };
}
export function ajouterUnDeDuDestin(id: string) {
    const store = useDiceStore.getState(), jet = store.history[0];
    if (!jet || jet.id !== id || jet.destinClos || jet.fielAttribue || !desDuDixDisponibles(jet)) return;
    const val = DiceEngine.roll(10);
    const suivant = resultatDestinAuPupitre({ ...jet, rolls: [...jet.rolls, { val, sides: 10, isExploded: true, isCritMax: val >= 8 }] });
    useDiceStore.setState(s => ({ history: s.history.map(r => r.id === id ? suivant : r), lastRoll: s.lastRoll?.id === id ? suivant : s.lastRoll }));
    consignerLeJet({ titre: `${jet.title} · dé supplémentaire choisi`, totalDisplay: suivant.totalDisplay, tagSuccess: suivant.tagSuccess, degre: suivant.degre });
}
