import { gmToast } from '../../stores/useToastStore';

/** Les refus restent lisibles même si aucun écran du bas n'est disponible. */
export const RAISONS_DU_REFUS: Record<'pas-d-ecran-du-bas' | 'pas-de-fenetre-mj', string> = {
    'pas-d-ecran-du-bas': 'Aucun écran sous celui de GM-OS — le clavier est-il posé sur la dalle du bas ?',
    'pas-de-fenetre-mj': 'La fenêtre de GM-OS est introuvable.',
};

/** Sorti du composant le 07/10/2026 : le démarrage appelle cette commande aussi. */
export async function ouvrirLePupitre(): Promise<boolean> {
    const pont = window.appBridge?.pupitre;
    if (!pont) return false;
    const resultat = await pont.ouvrir();
    if (!resultat.ok) gmToast(RAISONS_DU_REFUS[resultat.raison], 'warning');
    return resultat.ok;
}
