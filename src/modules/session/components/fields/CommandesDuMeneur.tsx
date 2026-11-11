import { useMemo } from 'react';
import { EyeOff, Send, Check, X } from 'lucide-react';
import { useSessionOSStore } from '../../useSessionOSStore';
import { suiviDesDemandes } from '../../../dice/filDesDemandes';
import type { DemandeDeJet } from '../../../dice/demandeDeJet';
import { gmToast } from '../../../../stores/useToastStore';

/**
 * **Les commandes du meneur dans « Lancer un test »** — plan
 * `2026-11-11-jets-demandes-et-caches.md`, T7 ; maquette Stitch adoptée par
 * David le 11/11 (`documentation/Planning/stitch/jets-demandes/2-meneur-lancer-un-test.png`).
 *
 * Trois pièces, que les deux panneaux de jet de fiche (le commun et celui du
 * Voyageur) posent chacun à sa place : l'interrupteur « Jet caché », le bouton
 * « Demander à (personnage) », et la liste des demandes de ce personnage. Elles
 * n'existent que chez le meneur — la tablette ne les reçoit jamais.
 */

/** L'interrupteur « Jet caché » : le résultat reste chez le meneur (C7, C8). */
export function InterrupteurJetCache({ actif, changer }: { actif: boolean; changer: (actif: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={actif}
            data-jet-cache
            onClick={() => changer(!actif)}
            className="flex items-center gap-2 text-left"
        >
            <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors ${
                actif ? 'bg-accent/30 border-accent' : 'bg-app-bg/60 border-app-border/60'
            }`}>
                <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
                    actif ? 'left-[18px] bg-accent' : 'left-0.5 bg-app-text/40'
                }`} />
            </span>
            <span className="flex flex-col">
                <span className="flex items-center gap-1 text-ui-11 font-bold text-app-text">
                    {actif && <EyeOff size={12} aria-hidden />}Jet caché
                </span>
                <span className="text-ui-10 text-app-text/50">seul le meneur verra le résultat</span>
            </span>
        </button>
    );
}

/**
 * « Demander à (personnage) » : la composition du panneau part à la tablette du
 * personnage, qui lance elle-même (décision du 11/11). `composer` rend la
 * demande, ou `null` quand le panneau n'a pas de quoi en faire une.
 */
export function BoutonDemanderA({ nom, desactive, composer }: {
    nom: string;
    desactive?: boolean;
    composer: () => DemandeDeJet | null;
}) {
    return (
        <button
            type="button"
            data-demander-a
            disabled={desactive}
            onClick={() => {
                const demande = composer();
                if (!demande) {
                    gmToast('Composez le jet avant de le demander : il manque une caractéristique ou une compétence.', 'warning');
                    return;
                }
                useSessionOSStore.getState().demanderUnJet(demande, nom);
                gmToast(`Jet demandé à ${nom} : ${demande.titre}`, 'success');
            }}
            className="w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-xl border border-accent/60 text-accent text-xs font-black uppercase tracking-[0.2em] transition-colors hover:bg-accent/10 disabled:border-app-border/40 disabled:text-app-text/30 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            <Send size={13} aria-hidden />Demander à {nom}
        </button>
    );
}

/** Combien de demandes closes restent en vue sous les demandes en attente. */
const CLOSES_EN_VUE = 3;

/**
 * **Les demandes de ce personnage** : celles qui attendent, avec « Annuler »,
 * puis les dernières closes, en retrait. Lues dans le fil des messages — rien
 * d'autre à garder (T3). Absente tant qu'aucune demande n'a été faite.
 */
export function DemandesEnCours({ personnageId, nom }: { personnageId: string; nom: string }) {
    const messages = useSessionOSStore(s => s.messages);
    const suivi = useMemo(() => suiviDesDemandes(messages, personnageId), [messages, personnageId]);
    const enAttente = suivi.filter(s => s.etat === 'en-attente');
    const closes = suivi.filter(s => s.etat !== 'en-attente').slice(-CLOSES_EN_VUE).reverse();
    if (enAttente.length === 0 && closes.length === 0) return null;
    return (
        <section aria-label="Demandes en cours" className="rounded-lg border border-app-border/40">
            <h4 className="px-3 py-2 border-b border-app-border/40 text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                Demandes en cours
            </h4>
            <ul className="divide-y divide-app-border/30">
                {enAttente.map(({ demande }) => (
                    <li key={demande.id} data-demande-en-attente className="flex items-center gap-3 px-3 py-2 text-ui-11">
                        <span className="h-1.5 w-1.5 shrink-0 bg-accent" aria-hidden />
                        <span className="flex-1 min-w-0 font-bold text-app-text">{demande.titre} — en attente</span>
                        <button
                            type="button"
                            onClick={() => useSessionOSStore.getState().cloreLaDemande(demande, 'annulee', nom)}
                            className="flex items-center gap-1 text-ui-10 font-bold uppercase tracking-widest text-app-text/50 underline hover:text-etat-danger"
                        >
                            <X size={11} aria-hidden />Annuler
                        </button>
                    </li>
                ))}
                {closes.map(({ demande, etat }) => (
                    <li key={demande.id} className="flex items-center gap-3 px-3 py-2 text-ui-11 text-app-text/40">
                        <span className="h-1.5 w-1.5 shrink-0 bg-app-text/30" aria-hidden />
                        <span className="flex-1 min-w-0">
                            {demande.titre} — {etat === 'lancee' ? <>lancé <Check size={11} className="inline" aria-label="reçu" /></> : 'annulée'}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
