import React, { useCallback, useEffect, useState } from 'react';
import { Mouse, RefreshCw, Lock, Unlock, AlertTriangle } from 'lucide-react';

/**
 * **Le verrou de la souris des joueurs.**
 *
 * Windows fusionne toutes les souris en un seul curseur, et David s'en
 * accommode : ce qu'il veut, c'est pouvoir couper celle des joueurs pendant
 * qu'il prépare. Windows ne sait pas ignorer une souris — il sait seulement
 * désactiver le périphérique.
 *
 * **Cet écran est construit autour d'un fait mesuré le 2026-08-30 : ses deux
 * souris s'appellent toutes les deux « Souris HID ».** Rien ne dit laquelle est
 * laquelle, donc le premier clic est forcément un pari. Trois conséquences,
 * toutes visibles ici :
 *
 * 1. On affiche **l'identifiant matériel**, seule chose qui les distingue.
 * 2. On annonce le pari **avant** de le prendre, pas après.
 * 3. Le compte à rebours est écrit en grand : *un filet qu'on ignore ne rassure
 *    personne, et c'est la panique qui fait débrancher l'ordinateur.*
 *
 * La confirmation est volontairement **la seule action qui demande la souris** :
 * si le meneur s'est trompé de périphérique, il ne peut plus cliquer — et c'est
 * exactement pour ça que ne rien faire ramène la souris.
 */

interface Souris {
    id: string;
    nom: string;
    active: boolean;
}

/** Ce que l'identifiant Windows a de lisible : le fabricant et le produit. */
export function signatureLisible(id: string): string {
    const m = /VID_([0-9A-F]{4})&PID_([0-9A-F]{4})/i.exec(id);
    return m ? `${m[1]}:${m[2]}` : id.slice(0, 24);
}

const VerrouDeLaSouris: React.FC = () => {
    const pont = typeof window !== 'undefined' ? window.appBridge?.souris : undefined;

    const [souris, setSouris] = useState<Souris[]>([]);
    const [occupe, setOccupe] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    /** La coupure en attente de confirmation, et les secondes qui lui restent. */
    const [enSursis, setEnSursis] = useState<{ id: string; secondes: number } | null>(null);

    const rafraichir = useCallback(async () => {
        if (!pont) return;
        setSouris(await pont.inventaire());
    }, [pont]);

    useEffect(() => { void rafraichir(); }, [rafraichir]);

    // Le compte à rebours n'est qu'un reflet : le vrai minuteur vit dans le
    // process principal, seul endroit qui survive à un écran figé.
    useEffect(() => {
        if (!enSursis) return;
        if (enSursis.secondes <= 0) {
            setEnSursis(null);
            void rafraichir();
            return;
        }
        const t = setTimeout(() => setEnSursis(s => (s ? { ...s, secondes: s.secondes - 1 } : null)), 1000);
        return () => clearTimeout(t);
    }, [enSursis, rafraichir]);

    if (!pont) {
        return (
            <p className="text-xs text-app-text/40 italic">
                Le verrou de souris n’existe que dans l’application de bureau.
            </p>
        );
    }

    const couper = async (id: string) => {
        setOccupe(true);
        setErreur(null);
        const verdict = await pont.couper(id);
        setOccupe(false);
        if (!verdict.ok) { setErreur(verdict.message ?? 'Coupure impossible.'); return; }
        setEnSursis({ id, secondes: Math.round((verdict.retourDans ?? 20000) / 1000) });
        void rafraichir();
    };

    const rendre = async (id: string) => {
        setOccupe(true);
        setErreur(null);
        const verdict = await pont.rendre(id);
        setOccupe(false);
        if (!verdict.ok) setErreur(verdict.message ?? 'Retour impossible.');
        setEnSursis(null);
        void rafraichir();
    };

    const confirmer = async (id: string) => {
        await pont.confirmer(id);
        setEnSursis(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <p className="text-ui-10 font-bold uppercase tracking-widest opacity-50">Souris branchées</p>
                <button onClick={() => void rafraichir()} className="text-ui-10 text-accent font-bold uppercase transition-opacity hover:opacity-70">
                    <RefreshCw size={12} className="inline mr-1" />Actualiser
                </button>
            </div>

            {/*
              Le pari est annoncé avant d'être pris. Deux périphériques
              homonymes, et le seul moyen de savoir lequel est lequel est
              d'essayer — autant le dire.
            */}
            <p className="text-ui-10 text-app-text/40 leading-relaxed px-1">
                Windows nomme souvent toutes les souris de la même façon. Si tu coupes la mauvaise,
                <strong className="text-amber-400"> ne fais rien</strong> : elle revient seule au bout de
                vingt secondes. Fermer GM-OS rend aussi toutes les souris coupées.
            </p>

            {erreur && (
                <p role="alert" className="text-ui-11 font-semibold text-rose-400 flex items-start gap-2 px-1">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />{erreur}
                </p>
            )}

            <div className="flex flex-col gap-3">
                {souris.length === 0 && (
                    <div className="p-4 rounded-xl border border-app-border/10 bg-app-surface/10 text-center">
                        <p className="text-xs text-app-text/40">Aucune souris détectée.</p>
                    </div>
                )}

                {souris.map(s => {
                    const sursis = enSursis?.id === s.id ? enSursis : null;
                    return (
                        <div key={s.id} className="p-4 rounded-xl border border-app-border/20 bg-app-surface/20 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Mouse size={16} className={s.active ? 'text-emerald-400' : 'text-app-text/20'} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-app-text truncate">{s.nom}</p>
                                    <p className="text-ui-10 font-mono text-app-text/30 truncate" title={s.id}>
                                        {signatureLisible(s.id)}
                                    </p>
                                </div>
                                <button
                                    disabled={occupe}
                                    onClick={() => (s.active ? couper(s.id) : rendre(s.id))}
                                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-ui-10 font-black uppercase tracking-widest border transition-all disabled:opacity-40 ${
                                        s.active
                                            ? 'bg-app-surface border-app-border text-app-text/70 hover:text-rose-400 hover:border-rose-500/40'
                                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                    }`}
                                >
                                    {s.active ? <><Lock size={12} />Couper</> : <><Unlock size={12} />Rendre</>}
                                </button>
                            </div>

                            {sursis && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                    <p className="flex-1 text-ui-11 font-bold text-amber-300 leading-tight">
                                        Ta souris répond encore ? Confirme.
                                        <span className="block font-normal text-amber-400/70">
                                            Sans confirmation, elle revient dans {sursis.secondes} s.
                                        </span>
                                    </p>
                                    <button
                                        onClick={() => void confirmer(s.id)}
                                        className="shrink-0 px-4 py-2 rounded-lg bg-amber-500 text-black text-ui-10 font-black uppercase tracking-widest hover:opacity-90"
                                    >
                                        Oui, garde-la coupée
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VerrouDeLaSouris;
