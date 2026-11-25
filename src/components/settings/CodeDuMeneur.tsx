import React from 'react';
import { Lock } from 'lucide-react';
import { gmToast } from '../../stores/useToastStore';

/**
 * **Le code du meneur** — la tablette de la table (Fire HD 8), registre § 256, T14 (24/11/2026).
 *
 * Décision Q6 de David (15/11) : quatre chiffres, choisis ici, demandés seulement pour revenir d'un
 * rôle public (Appareil de table, Écran de table) à l'Aide au MJ. Le code reste au poste : c'est le
 * serveur qui le compare (`electron/verrouDuMeneur.ts`). L'écran ne l'affiche jamais une fois réglé.
 */
const CodeDuMeneur: React.FC = () => {
    const pont = window.appBridge?.pairing;
    const [regle, setRegle] = React.useState<boolean | null>(null);
    const [saisie, setSaisie] = React.useState('');

    React.useEffect(() => {
        void pont?.etatDuCode?.().then(e => setRegle(e.regle));
    }, [pont]);

    // Hors d'Electron, il n'y a pas de poste où garder le code.
    if (!pont?.reglerLeCode) return null;

    const enregistrer = async (code: string | null) => {
        const r = await pont.reglerLeCode!(code);
        setRegle(r.regle);
        setSaisie('');
        if (!r.ok) gmToast('Le code du meneur compte quatre chiffres.', 'warning');
        else gmToast(code === null ? 'Code du meneur retiré.' : 'Code du meneur enregistré.', 'success');
    };

    return (
        <div className="w-full mt-2 p-4 rounded-xl bg-accent/5 border border-accent/15 space-y-3" data-code-du-meneur>
            <p className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-widest text-app-text/70">
                <Lock size={14} aria-hidden /> Code du meneur — tablette de la table
            </p>
            <p className="text-ui-10 text-app-text/60">
                {regle === null ? '…' : regle
                    ? 'Réglé. La tablette de la table le demande pour revenir à l’Aide au MJ depuis un rôle public.'
                    : 'Aucun code : la tablette de la table revient à l’Aide au MJ sans rien demander.'}
            </p>
            <div className="flex items-center gap-2">
                <input aria-label="Nouveau code du meneur" inputMode="numeric" autoComplete="off" maxLength={4} value={saisie}
                    onChange={e => setSaisie(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 chiffres" type="password"
                    className="w-28 rounded-lg border border-app-border bg-app-bg px-3 py-2 font-mono tracking-[0.4em] text-app-text" />
                <button type="button" disabled={saisie.length !== 4} onClick={() => void enregistrer(saisie)}
                    className="rounded-lg bg-accent px-3 py-2 text-ui-10 font-black uppercase tracking-widest text-app-on-accent disabled:opacity-40">
                    {regle ? 'Changer' : 'Enregistrer'}
                </button>
                {regle && (
                    <button type="button" onClick={() => void enregistrer(null)}
                        className="text-ui-9 font-bold uppercase tracking-widest text-etat-danger/70 hover:text-etat-danger">Retirer</button>
                )}
            </div>
        </div>
    );
};

export default CodeDuMeneur;
