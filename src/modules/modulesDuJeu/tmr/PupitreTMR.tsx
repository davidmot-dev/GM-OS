import { useEffect, useRef, useState } from 'react';
import type { VoyageurTMR, VueTMRMJ } from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
import type { CommandeDeModule, ResultatDeModule } from '../protocole';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { estUneFicheDeVoyageur } from '../../session/logic/ficheDeVoyageur';
import { proposerCoutTMR, type CoutTMR } from '../../session/logic/ressourcesDesTMR';
import { terminerRaccordNatifTMR } from './raccordNatifDesTMR';
import { VuesTMR } from './VuesTMR';
import { useModulesDuJeuMJ } from '../magasins';

type Envoyer = (c: CommandeDeModule) => Promise<ResultatDeModule>;
const message = (e: unknown) => e instanceof Error ? e.message : 'Le raccord à la fiche n’a pas abouti.';
function RaccordVoyageur({ voyageur: v, campagneId, envoyer }: { voyageur: VoyageurTMR; campagneId: string; envoyer: Envoyer }) {
    const [apercu, montrer] = useState<CoutTMR | null>(null), [confirme, confirmer] = useState(false), [erreur, signaler] = useState(''), [occupe, occuper] = useState(false);
    const dejaEssayee = useRef<string | null>(null);
    const [compteRendu, ecrire] = useState('');
    const operation = v.ecriture;
    const operationId = operation?.id;
    // Reprendre une intention déjà enregistrée ne nécessite pas un second accord de débit.
    useEffect(() => {
        if (!operationId || dejaEssayee.current === operationId) return;
        dejaEssayee.current = operationId; let vivant = true;
        void terminerRaccordNatifTMR(campagneId, v.id, operationId).catch(e => { if (vivant) signaler(message(e)); });
        return () => { vivant = false; };
    }, [campagneId, v.id, operationId]);
    function preparer() {
        try {
            const s = useSessionOSStore.getState();
            const p = s.players.flatMap(j => j.characters).find(p => p.id === v.id && p.campaignId === campagneId);
            const f = [...s.customSheetTemplates, ...DEFAULT_SHEET_TEMPLATES].find(f => f.id === p?.templateId);
            if (!p || !estUneFicheDeVoyageur(f)) throw new Error('Fiche RdD 2.3.1 absente ou incompatible.');
            montrer(proposerCoutTMR(p, v.demande!)); confirmer(false); signaler('');
        } catch (e) { montrer(null); signaler(message(e)); }
    }
    async function engager() {
        if (!apercu || !v.demande) return;
        occuper(true); signaler('');
        try {
            const r = await envoyer({ id: 'engager-trajet', charge: { personnageId: v.id, operationId: v.demande.operationId,
                transactionId: crypto.randomUUID(), empreinte: apercu.empreinte, compteRendu } });
            if (!r.ok) signaler(r.erreur);
        } catch (e) { signaler(message(e)); } finally { occuper(false); }
    }
    async function reprendre(annuler = false) {
        if (!operation) return; occuper(true); signaler('');
        try { await terminerRaccordNatifTMR(campagneId, v.id, operation.id, annuler); }
        catch (e) { signaler(message(e)); } finally { occuper(false); }
    }
    return <section className="tmr-module mb-3" aria-label={`Raccord de fiche de ${v.nom}`}><h3>{v.nom} — coût du trajet sur la fiche</h3>
        {erreur && <p role="alert">{erreur}</p>}
        {operation ? <><p role="status">Confirmation du trajet en cours. La position attend la relecture du reçu dans la fiche persistée.</p>
            <div className="tmr-actions"><button type="button" disabled={occupe} onClick={() => void reprendre()}>Reprendre la confirmation</button>
                <button type="button" disabled={occupe} onClick={() => void reprendre(true)}>Annuler si aucun débit n’a eu lieu</button></div>
            <p className="tmr-aide">Si le reçu existe déjà, ces commandes terminent le trajet sans nouvelle dépense. Elles ne remboursent pas une opération payée.</p></> : <>
            <p>Barème de base : débit du rêve et inscription de la fatigue R1 en une écriture sur la fiche.</p>
            <button type="button" disabled={occupe} onClick={preparer}>Prévisualiser le coût sur la fiche</button>
            {apercu && <><p role="status">{apercu.detail}</p>
                <label>Compte rendu du trajet<textarea maxLength={2000} value={compteRendu} onChange={e => ecrire(e.target.value)} /></label>
                <label className="tmr-case"><input type="checkbox" checked={confirme} onChange={e => confirmer(e.target.checked)} />Conditions de concentration, round et barème de base vérifiés</label>
                <button type="button" disabled={occupe || !confirme} onClick={() => void engager()}>Débiter la fiche et valider le trajet</button>
                <p className="tmr-aide">Le raccord relit la fiche avant le débit. Les jets de rencontre et de maîtrise restent à résoudre ensuite. Pour un effet modifiant les coûts, utilise l’arbitrage manuel.</p>
            </>}
        </>}
    </section>;
}
export function PupitreTMR({ vue, envoyerCommande }: { vue: VueTMRMJ; envoyerCommande: Envoyer }) {
    const campagneId = useModulesDuJeuMJ(s => s.vue?.campagneId);
    return <>{campagneId && vue.voyageurs.filter(v => v.demande || v.ecriture).map(v => <RaccordVoyageur key={`${v.id}:${v.demande?.operationId ?? v.ecriture?.id}`} voyageur={v} campagneId={campagneId} envoyer={envoyerCommande} />)}
        <VuesTMR vue={vue} envoyerCommande={envoyerCommande} /></>;
}
