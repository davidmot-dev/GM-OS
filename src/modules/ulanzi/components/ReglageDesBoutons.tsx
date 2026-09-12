import React from 'react';
import { useUlanziStore } from '../useUlanziStore';
import { GESTES, leGeste } from '../logic/gestesDesBoutons';
import { BOUTONS, type BoutonUlanzi } from '../../../../electron/boutonsDeLUlanzi';
import { adresseDuPontDesBoutons } from '../../../utils/portsDuRenderer';
import { gmToast } from '../../../stores/useToastStore';

/**
 * **Ce que font les trois boutons physiques de l'afficheur.**
 *
 * Rouvert le 2026-09-12, après avoir été garé au § 4 du registre depuis le
 * 30/08 : les boutons ne remontent pas en HTTP, et la seule voie — MQTT —
 * demandait *« un service de plus à faire vivre »*. Le Home Assistant de David
 * porte ce courtier, tourne sans GM-OS et n'a rien à rendre en partant.
 *
 * ⚠️ **L'écran ne dit pas « ça marche ».** Tant que HA n'est pas branché, ces
 * réglages sont des intentions — et un panneau qui affirmerait le contraire
 * serait *un mensonge d'écran*, le mode d'échec que ce module a déjà payé. D'où
 * la ligne d'aide sous le titre, qui dit ce qu'il reste à faire ailleurs.
 */

const LIBELLES_DES_BOUTONS: Record<BoutonUlanzi, string> = {
    gauche: 'Bouton gauche',
    milieu: 'Bouton du milieu',
    droite: 'Bouton droit',
};

const ReglageDesBoutons: React.FC = () => {
    const boutons = useUlanziStore(s => s.boutons);
    const setBouton = useUlanziStore(s => s.setBouton);

    /** L'adresse que Home Assistant devra appeler. Rien de secret ici. */
    const [adresse, setAdresse] = React.useState('');

    React.useEffect(() => {
        window.appBridge?.remote?.getConnectionInfo?.()
            /*
              ⛔ **L'adresse se compose dans `adresseDuPontDesBoutons`, et nulle
              part ailleurs.** Ce code prenait `info.port` — celui de **Vite** en
              développement — et le panneau annonçait donc `…:5173/bouton`. Home
              Assistant y postait, Vite répondait son `index.html`, et rien ne se
              passait. Trouvé par David le 2026-09-13.
            */
            .then(info => setAdresse(adresseDuPontDesBoutons(info) ?? ''))
            .catch(() => { /* pas de réseau : l'adresse reste vide, et on le dit */ });
    }, []);

    /**
     * **Copier le jeton, sans jamais l'afficher.**
     *
     * ⛔ `GlobalSettingsModal` pose la règle noir sur blanc : le secret
     * d'appairage *« n'est encodé que dans le QR de la télécommande MJ, jamais
     * affiché en clair »*. Home Assistant en a pourtant besoin — et **copier
     * n'est pas afficher** : la valeur ne traverse aucun rendu, ne se retrouve
     * ni dans une capture d'écran ni au-dessus de l'épaule du meneur.
     *
     * ⚠️ Et il vieillit : « Révoquer les appairages » le régénère, ce qui coupe
     * les tablettes **et** ce pont. C'est dit sous le bouton.
     */
    const copierLeJeton = async () => {
        try {
            const jeton = await window.appBridge?.pairing?.getSecret();
            if (!jeton) throw new Error('jeton indisponible');
            await navigator.clipboard.writeText(jeton);
            gmToast('Jeton copié — à coller dans le `secrets.yaml` de Home Assistant 📋');
        } catch {
            gmToast('Copie impossible — le jeton est resté ici ❌');
        }
    };

    return (
        <div className="space-y-1.5 rounded-lg border border-app-border/40 bg-app-bg/30 p-2">
            <div className="flex items-baseline justify-between gap-2">
                <h4 className="font-semibold text-ui-11 text-app-text/80">Boutons physiques</h4>
                <span className="text-ui-9 text-app-text/40">via Home Assistant</span>
            </div>

            {BOUTONS.map(bouton => {
                const reglage = boutons?.[bouton] ?? { geste: 'rien' };
                const geste = leGeste(reglage.geste);

                return (
                    <div key={bouton} className="flex flex-wrap items-center gap-1.5">
                        <span className="w-28 shrink-0 text-ui-10 text-app-text/60">
                            {LIBELLES_DES_BOUTONS[bouton]}
                        </span>

                        <select
                            value={reglage.geste}
                            onChange={e => setBouton(bouton, {
                                /* La formule survit au changement de geste : revenir au
                                   jet préréglé ne doit pas faire retaper la formule. */
                                ...reglage,
                                geste: e.target.value,
                            })}
                            aria-label={LIBELLES_DES_BOUTONS[bouton]}
                            className="flex-1 min-w-[9rem] rounded bg-app-bg/60 border border-app-border/40 px-1.5 py-0.5 text-ui-10 text-app-text/80"
                        >
                            {GESTES.map(g => (
                                <option key={g.id} value={g.id}>{g.libelle}</option>
                            ))}
                        </select>

                        {/*
                            ⚠️ Le champ n'apparaît que pour les gestes qui en veulent un.
                            *Un champ offert et sans effet fait douter du geste entier.*
                        */}
                        {geste?.demandeUneFormule && (
                            <input
                                type="text"
                                value={reglage.formule ?? ''}
                                onChange={e => setBouton(bouton, { ...reglage, formule: e.target.value })}
                                placeholder="1d20+3"
                                spellCheck={false}
                                aria-label={`Formule du ${LIBELLES_DES_BOUTONS[bouton].toLowerCase()}`}
                                className="w-24 rounded bg-app-bg/60 border border-app-border/40 px-1.5 py-0.5 font-mono text-ui-10 text-app-text/80"
                            />
                        )}
                    </div>
                );
            })}

            {/*
                ⛔ **Un geste réglé sans sa formule ne fera RIEN**, et rien ne le
                dirait à l'écran : l'appui serait avalé en silence, pendant une
                séance. On le signale ici, au moment où le trou se creuse.
            */}
            {BOUTONS.some(b => {
                const r = boutons?.[b];
                return leGeste(r?.geste ?? '')?.demandeUneFormule && !r?.formule?.trim();
            }) && (
                <p className="text-ui-9 leading-snug text-amber-400/80">
                    Un jet sans formule ne lancera rien.
                </p>
            )}

            {/*
                **De quoi brancher Home Assistant, et rien de plus.** L'adresse
                n'est pas un secret ; le jeton ne s'affiche pas.
            */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-app-border/30 pt-1.5">
                <span className="text-ui-9 text-app-text/40">Pont :</span>
                <code className="select-all font-mono text-ui-9 text-app-text/60">
                    {adresse || 'adresse indisponible — le réseau ne répond pas'}
                </code>
                <button
                    type="button"
                    onClick={copierLeJeton}
                    className="ml-auto rounded border border-app-border/40 px-1.5 py-0.5 text-ui-9 text-app-text/70 hover:bg-app-surface/40"
                    title="Copie le secret d'appairage dans le presse-papiers. Il n'est jamais affiché."
                >
                    Copier le jeton
                </button>
            </div>

            <p className="text-ui-9 leading-snug text-app-text/40">
                Les appuis arrivent par Home Assistant, qui les écoute en MQTT et les
                pousse sur cette adresse, jeton en en-tête{' '}
                <span className="font-mono">x-gmos-jeton</span>. Sans cette
                automatisation, ces réglages ne font rien.{' '}
                <span className="text-amber-400/70">
                    Révoquer les appairages régénère le jeton et coupe aussi ce pont.
                </span>
            </p>
        </div>
    );
};

export default ReglageDesBoutons;
