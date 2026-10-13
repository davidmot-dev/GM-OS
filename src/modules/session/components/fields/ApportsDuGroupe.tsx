import React from 'react';
import { Minus, Plus, Users2 } from 'lucide-react';
import type { ApportDisponible } from '../../../table/reservesDuGroupe';

/**
 * **Puiser dans le groupe, avant de lancer** — la Cabale de NOC, 2026-10-13.
 *
 * Une ligne par apport : ce qu'il donne, ce qui reste, combien on engage. Rien
 * ne se dépense ici : la dépense part avec le lancer, comme les dés achetés —
 * régler avant de lancer ferait payer les hésitations.
 *
 * Un apport dont le stock dépend d'un choix (un Atout) propose ses stocks
 * encore garnis ; un apport qui suit la composante du jet (le Domaine) attend
 * que le Héros l'ait retenue, et le dit.
 */
interface ApportsDuGroupeProps {
    libelle: string;
    disponibles: ApportDisponible[];
    choixDuJoueur: Record<string, string>;
    onChoisir: (apportId: string, champ: string) => void;
    onEngager: (apportId: string, points: number) => void;
    /** Les stocks à choisir, avec ce qui reste dans chacun. */
    resteDe: (apportId: string, champ: string) => number;
}

const ApportsDuGroupe: React.FC<ApportsDuGroupeProps> = ({
    libelle, disponibles, choixDuJoueur, onChoisir, onEngager, resteDe,
}) => (
    <div className="space-y-2 rounded-xl border border-accent/15 bg-app-bg/30 p-3">
        <p className="flex items-center gap-2 text-ui-9 font-black uppercase tracking-widest text-accent/70">
            <Users2 size={12} /> Puiser dans la {libelle}
        </p>
        {disponibles.map(({ apport, stock, dispo, points }) => {
            const aChoisir = apport.stocks.length > 1 && !apport.composante;
            const gain = apport.effet === 'des'
                ? `${apport.parPoint} dé${apport.parPoint > 1 ? 's' : ''} par point`
                : `+${apport.parPoint} par point`;
            return (
                <div key={apport.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="min-w-[10rem] font-bold text-app-text/70" title={gain}>{apport.label}</span>

                    {aChoisir && (
                        <select
                            value={choixDuJoueur[apport.id] ?? ''}
                            onChange={e => onChoisir(apport.id, e.target.value)}
                            aria-label={`Choisir : ${apport.label}`}
                            className="bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50"
                        >
                            <option value="">—</option>
                            {apport.stocks
                                .map(s => ({ s, reste: resteDe(apport.id, s.champ) }))
                                .filter(({ s, reste }) => reste > 0 || s.champ === choixDuJoueur[apport.id])
                                .map(({ s, reste }) => (
                                    <option key={s.champ} value={s.champ}>{s.label} ({reste})</option>
                                ))}
                        </select>
                    )}
                    {!aChoisir && stock && apport.stocks.length > 1 && (
                        <span className="text-app-text/40">{stock.label}</span>
                    )}

                    {stock ? (
                        <>
                            <button
                                type="button"
                                onClick={() => onEngager(apport.id, Math.max(0, points - 1))}
                                aria-label={`Un point de moins : ${apport.label}`}
                                className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                            ><Minus size={11} /></button>
                            <span className="font-mono font-black w-6 text-center">{points}</span>
                            <button
                                type="button"
                                disabled={points >= dispo}
                                onClick={() => onEngager(apport.id, Math.min(dispo, points + 1))}
                                aria-label={`Un point de plus : ${apport.label}`}
                                className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors disabled:opacity-30"
                            ><Plus size={11} /></button>
                            <span className="text-app-text/40">
                                sur {dispo}
                                {points > 0 && (
                                    <span className="ml-2 font-bold text-accent">
                                        {apport.effet === 'des' ? `+${points * apport.parPoint} dés` : `+${points * apport.parPoint}`}
                                    </span>
                                )}
                            </span>
                        </>
                    ) : (
                        <span className="italic text-app-text/30">
                            {apport.composante ? 'retenez d’abord la composante du jet' : aChoisir ? '' : 'rien à puiser'}
                        </span>
                    )}
                </div>
            );
        })}
    </div>
);

export default ApportsDuGroupe;
