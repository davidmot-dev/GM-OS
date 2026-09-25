import React from 'react';
import { PanelBottom } from 'lucide-react';
import { useHardwareStore } from '../../stores/useHardwareStore';
import { gmToast } from '../../stores/useToastStore';

/**
 * **La télécommande sur l'écran du bas** — le pupitre du Zenbook Duo.
 *
 * Demandé par David le 2026-09-25 ; la proposition était garée au § 4 du
 * registre depuis le 2026-09-22. La fenêtre est un client comme la tablette,
 * appairé par GM-OS lui-même : rien à scanner. Voir `electron/pupitreDuBas.ts`.
 *
 * ⚠️ **Un refus se dit.** Sans écran sous celui de GM-OS — clavier posé sur la
 * dalle, écran éteint —, un bouton qui ne ferait rien passerait pour une panne.
 */

/** Ce qu'on dit au meneur quand le pupitre ne s'ouvre pas. */
export const RAISONS_DU_REFUS: Record<'pas-d-ecran-du-bas' | 'pas-de-fenetre-mj', string> = {
    'pas-d-ecran-du-bas': 'Aucun écran sous celui de GM-OS — le clavier est-il posé sur la dalle du bas ?',
    'pas-de-fenetre-mj': 'La fenêtre de GM-OS est introuvable.',
};

/** Ouvre le pupitre, et dit pourquoi quand il refuse. */
export async function ouvrirLePupitre(): Promise<boolean> {
    const pont = window.appBridge?.pupitre;
    if (!pont) return false;
    const resultat = await pont.ouvrir();
    if (!resultat.ok) gmToast(RAISONS_DU_REFUS[resultat.raison], 'warning');
    return resultat.ok;
}

const PupitreDuBas: React.FC = () => {
    const pupitreAuLancement = useHardwareStore(s => s.pupitreAuLancement);
    const setPupitreAuLancement = useHardwareStore(s => s.setPupitreAuLancement);
    const [ouvert, setOuvert] = React.useState(false);
    const pont = window.appBridge?.pupitre;

    React.useEffect(() => {
        if (!pont) return;
        void pont.estOuvert().then(setOuvert);
        /* Fermé depuis la fenêtre elle-même (Alt+F4) : le bouton doit le savoir. */
        return pont.surFermeture(() => setOuvert(false));
    }, [pont]);

    /* Hors d'Electron — une tablette qui ouvre les Réglages — il n'y a pas
       d'écran du bas à piloter. */
    if (!pont) return null;

    const basculer = async () => {
        if (ouvert) {
            await pont.fermer();
            setOuvert(false);
            return;
        }
        setOuvert(await ouvrirLePupitre());
    };

    return (
        <div className="w-full mt-2 p-4 rounded-xl bg-accent/5 border border-accent/15 space-y-3">
            <button
                onClick={() => void basculer()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-ui-10 font-black uppercase tracking-widest transition-all ${
                    ouvert
                        ? 'bg-app-bg/40 border border-app-border/30 text-app-text/70 hover:text-app-text'
                        : 'bg-accent text-white hover:brightness-110'
                }`}
                title="La télécommande, en plein écran sur la dalle tactile sous celle de GM-OS — déjà appairée."
            >
                <PanelBottom size={14} />
                {ouvert ? 'Fermer la télécommande du bas' : 'Ouvrir sur l’écran du bas'}
            </button>
            <label className="flex items-center gap-2 text-ui-10 font-bold text-app-text/60 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={pupitreAuLancement}
                    onChange={e => setPupitreAuLancement(e.target.checked)}
                    className="accent-[var(--accent)]"
                />
                L’ouvrir au lancement de GM-OS
            </label>
        </div>
    );
};

export default PupitreDuBas;
