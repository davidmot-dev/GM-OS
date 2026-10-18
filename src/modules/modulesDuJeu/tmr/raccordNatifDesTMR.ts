import type { VueTMRMJ } from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { confirmerEcritureDeSession, lEcritureEstOuverte } from '../../session/logic/PersistenceService';
import { estUneFicheDeVoyageur } from '../../session/logic/ficheDeVoyageur';
import { recuPourEcritureTMR } from '../../session/logic/ressourcesDesTMR';
import type { RecuTMR } from '../../session/logic/recusDesTMR';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { executerEcritureTMR } from './raccordDesTMR';

const verrous = new Set<string>();
export async function terminerRaccordNatifTMR(campagneId: string, personnageId: string, transactionId: string, annuler = false) {
    const cle = `${campagneId}:${personnageId}:${transactionId}`;
    if (verrous.has(cle)) return;
    verrous.add(cle);
    try {
        const pont = window.appBridge?.modulesDuJeu;
        if (!pont || !lEcritureEstOuverte()) throw new Error('Raccord indisponible : la session doit être relue et persistable sur le poste MJ.');
        const courant = await pont.lire();
        if (courant.campagneId !== campagneId) throw new Error('Reviens à la campagne du trajet pour reprendre sa confirmation.');
        const vue = courant.modules.find(m => m.id === 'rdd-tmr')?.vue as VueTMRMJ | undefined;
        const ecriture = vue?.voyageurs.find(v => v.id === personnageId)?.ecriture;
        if (!ecriture || ecriture.id !== transactionId) return; // un autre acquittement a déjà abouti
        const lire = () => {
            const s = useSessionOSStore.getState();
            if (s.activeCampaignId !== campagneId) throw new Error('La campagne a changé. Aucun nouveau débit.');
            const joueur = s.players.find(j => j.characters.some(p => p.id === personnageId && p.campaignId === campagneId));
            const fiche = joueur?.characters.find(p => p.id === personnageId && p.campaignId === campagneId);
            if (!joueur || !fiche) throw new Error('La fiche du personnage est absente. Restaure-la avant de reprendre ce trajet.');
            const modele = [...s.customSheetTemplates, ...DEFAULT_SHEET_TEMPLATES].find(f => f.id === fiche.templateId);
            const dejaPaye = recuPourEcritureTMR(fiche.sheetData ?? {}, ecriture, campagneId, personnageId);
            if (!dejaPaye && !annuler && !ecriture.interrompue && !estUneFicheDeVoyageur(modele)) throw new Error('Ce personnage n’utilise pas une fiche RdD 2.3.1 compatible.');
            return { joueur, fiche };
        };
        await executerEcritureTMR(ecriture, campagneId, personnageId, {
            lire: () => lire().fiche,
            ecrire: donnees => { const { joueur, fiche } = lire(); useSessionOSStore.getState().updateCharacter(joueur.id, fiche.id, { sheetData: donnees }); },
            confirmer: recu => confirmerEcritureDeSession(etat => {
                const personnages = (etat as { players?: { characters?: { id: string; campaignId: string; sheetData?: Record<string, unknown> }[] }[] })?.players?.flatMap(p => p.characters ?? []);
                const fiche = personnages?.find(p => p.id === personnageId && p.campaignId === campagneId);
                if (!fiche) return false;
                const persiste = recuPourEcritureTMR(fiche.sheetData ?? {}, ecriture, campagneId, personnageId);
                return recu ? JSON.stringify(persiste) === JSON.stringify(recu) : !persiste;
            }),
            terminer: async (recu: RecuTMR | undefined) => {
                const derniereVue = await pont.lire();
                const r = await pont.acquitterFiche({ campagneId, moduleId: 'rdd-tmr', contexte: derniereVue.contexte, personnageId, transactionId,
                    appliquee: !!recu, sortieForcee: recu?.sortieForcee ?? false, detail: recu?.detail ?? 'Aucun débit enregistré dans la fiche.' });
                if (!r.ok) throw new Error(r.erreur);
            },
        }, annuler);
    } finally { verrous.delete(cle); }
}
