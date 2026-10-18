import type { EcritureTMR } from '../../../../outils/reve-de-dragon/tmr/moteur.mjs';
import { appliquerCoutTMR, recuPourEcritureTMR } from '../../session/logic/ressourcesDesTMR';
import type { RecuTMR } from '../../session/logic/recusDesTMR';

export interface PortFicheTMR {
    lire(): { templateId?: string; sheetData?: Record<string, unknown> };
    ecrire(donnees: Record<string, unknown>): void;
    confirmer(recu: RecuTMR | undefined): Promise<void>;
    terminer(recu: RecuTMR | undefined): Promise<void>;
}
/** Protocole récupérable : intention persistée → fiche + reçu → relecture durable → position.
 * Une erreur n'efface aucune preuve et n'annule jamais un débit déjà fait. */
export async function executerEcritureTMR(ecriture: EcritureTMR, campagneId: string, personnageId: string, port: PortFicheTMR, annuler = false) {
    const fiche = port.lire();
    let recu = recuPourEcritureTMR(fiche.sheetData ?? {}, ecriture, campagneId, personnageId);
    if (!recu && (ecriture.interrompue || annuler)) {
        // Attester aussi l'absence : on ne conclut pas sur un état en mémoire non sauvegardé.
        port.ecrire(fiche.sheetData ?? {}); await port.confirmer(undefined); await port.terminer(undefined); return;
    }
    if (!recu) {
        const applique = appliquerCoutTMR(fiche, ecriture, campagneId, personnageId);
        port.ecrire(applique.donnees); recu = applique.recu;
    } else {
        // Après une panne IndexedDB, le reçu peut n'exister qu'en mémoire : refaire la
        // persistance absolue, jamais le débit. La relecture ci-dessous reste obligatoire.
        port.ecrire(fiche.sheetData ?? {});
    }
    await port.confirmer(recu);
    await port.terminer(recu);
}
