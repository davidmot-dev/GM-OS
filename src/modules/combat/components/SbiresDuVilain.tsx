import { useRef, useState } from 'react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useCombatStore } from '../useCombatStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { lancerUneChaine } from '../../dice/systemes/torg';
import { caseDeTorg } from '../../dice/systemes/torgPersonnage';
import { ND_DES_SBIRES, estUnSbire, malusDesCases } from '../logic/sbiresEtHordes';
import { porterUnCoupDeTorg } from '../porterUnCoupDeTorg';
import { consignerLeJet } from '../../journal/consignerLeJet';
import { useJournalStore } from '../../journal/useJournalStore';
import { gmToast } from '../../../stores/useToastStore';
import type { Combatant } from '../types';

/** Livre p. 265 : le MJ confirme la proximité ; seul un porteur déclaré peut transférer le coup. */
export default function SbiresDuVilain({ combatant, valeurs }: { combatant: Combatant; valeurs: Record<string, unknown> }) {
    const pilote = useSessionOSStore(s => s.getActiveDriver());
    const combattants = useCombatStore(s => s.combatants);
    const [cibleId, setCible] = useState('');
    const [proche, setProche] = useState(false);
    const [dommages, setDommages] = useState(10);
    const [recu, setRecu] = useState<{ cibleId: string; dommages: number; reussi: boolean; applique: boolean } | null>(null);
    const applique = useRef(false);
    const test = pilote?.jet?.torg?.annulation;
    if (combatant.isPlayer || combatant.horde || !test || pilote?.combat?.dommages?.mecanique !== 'torg'
        || estUnSbire(combatant.healthSystem) || !caseDeTorg(valeurs, pilote.torg?.capacites?.sbires)) return null;
    const candidats = combattants.filter(c => c.id !== combatant.id && !c.isPlayer && !c.horde && c.faction === combatant.faction && estUnSbire(c.healthSystem));
    const selection = candidats.find(c => c.id === cibleId);
    const lancer = () => {
        if (recu || !proche || !selection || !Number.isFinite(dommages) || dommages < 0) return;
        const niveau = (Number(valeurs[test.attribut]) || 0) + (Number(valeurs[test.competence]) || 0);
        const malus = malusDesCases(combatant.healthSystem);
        const jet = DiceEngine.resultatDeTorg(niveau, ND_DES_SBIRES, { premier: lancerUneChaine(() => DiceEngine.roll(20), Number(valeurs[test.competence]) > 0) }, { malus });
        const reussi = !!jet.degre?.startsWith('reussite');
        const titre = `${combatant.name} — Sbires (Réalité)`;
        const issue = reussi ? `l’attaque passe à ${selection.name}` : 'le vilain encaisse l’attaque';
        useDiceStore.getState().setLastRoll({ ...jet, id: crypto.randomUUID(), timestamp: new Date(), title: titre, totalDisplay: `${issue} — ${jet.totalDisplay}` });
        consignerLeJet({ ...jet, titre, seuil: ND_DES_SBIRES });
        setRecu({ cibleId: reussi ? selection.id : combatant.id, dommages, reussi, applique: false });
        gmToast(`${combatant.name} — Sbires : ${issue}. Confirmer le coup ci-dessous.`, 'info');
    };
    const confirmer = () => {
        if (!recu || applique.current) return;
        // La cible et sa proximité ont été confirmées avant le jet ; si elle a disparu, aucun autre ne reçoit le coup.
        const cible = useCombatStore.getState().combatants.find(c => c.id === recu.cibleId);
        if (!cible || (recu.reussi && (cible.isPlayer || cible.horde || cible.faction !== combatant.faction || !estUnSbire(cible.healthSystem)))) {
            gmToast('La cible n’est plus un sbire admissible sur le plateau : recommencer cette attaque.', 'info'); return;
        }
        applique.current = true;
        if (!porterUnCoupDeTorg(cible.id, recu.dommages)) { applique.current = false; return; }
        setRecu({ ...recu, applique: true });
        useJournalStore.getState().addEvent({ type: 'COMBAT', title: `${combatant.name} — Sbires`, content: `${recu.reussi ? 'Transfert' : 'Échec du transfert'} : ${recu.dommages} dommages appliqués à ${cible.name}, une seule fois ; proximité validée par le meneur.` });
    };
    const champ = 'rounded-md border border-app-border bg-app-surface px-2 py-1 text-ui-11';
    return <section className="mx-3 my-2 space-y-2 rounded-xl border border-app-border p-3 text-ui-11" data-sbires={combatant.id}>
        <strong>Capacité Sbires · attaque reçue avant application des dommages</strong>
        {!recu ? <>
            <label className="block">Total de dommages <input className={champ} type="number" min={0} value={dommages} onChange={e => setDommages(Number(e.target.value))} /></label>
            <select aria-label="Sbire qui reçoit le coup" className={champ} value={cibleId} onChange={e => { setCible(e.target.value); setProche(false); }}>
                <option value="">Choisir le laquais…</option>{candidats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="flex items-center gap-2"><input type="checkbox" checked={proche} onChange={e => setProche(e.target.checked)} />Le meneur confirme ce laquais à quelques mètres</label>
            <button type="button" className={champ} disabled={!selection || !proche} onClick={lancer}>Sbires · Réalité ND {ND_DES_SBIRES}</button>
            {!candidats.length && <p>Aucun sbire du même camp sur le plateau : le vilain encaisse normalement.</p>}
        </> : <>
            <p>{recu.reussi ? 'Transfert réussi' : 'Transfert échoué'} : {recu.dommages} dommages vers {combattants.find(c => c.id === recu.cibleId)?.name ?? 'cible disparue'}.</p>
            <button className={champ} type="button" disabled={recu.applique} onClick={confirmer}>{recu.applique ? 'Coup appliqué' : 'Confirmer le coup'}</button>
            <button className={champ} type="button" onClick={() => { setRecu(null); applique.current = false; }}>Nouvelle attaque</button>
        </>}
    </section>;
}
