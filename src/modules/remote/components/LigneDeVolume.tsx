import React, { useState } from 'react';
import { Check, ChevronDown, AlertTriangle } from 'lucide-react';
import {
    sortieChoisie, type RemoteReglagesAudio, type NomDeVoie, LIBELLE_DE_LA_VOIE,
} from '../reglagesAudio';

/**
 * **Une voie de son sur la tablette : son niveau, et par où elle sort.**
 *
 * Demandé par David le 2026-09-22 : *« je ne peux pas choisir où va sortir le
 * son »*, et *« il n'y a pas de slider dans les pads »*.
 *
 * **Pourquoi un composant partagé.** Le volume maître des bruitages avait sa
 * ligne écrite à la main dans l'onglet Soundboard ; Musique et Ambiances en
 * auraient fait deux copies. C'est la leçon de `PastilleDePreparation` et de
 * `MarqueDIntrigue`, payée assez souvent : *trois lignes du même geste finissent
 * par ne plus se comporter pareil, et personne ne le voit puisque chaque onglet
 * reste cohérent avec lui-même.*
 *
 * ⛔ **La liste des sorties vient du meneur.** La tablette ne peut pas
 * l'établir : `enumerateDevices()` y rendrait **ses propres** haut-parleurs, et
 * le meneur choisirait une sortie qui ne changerait rien — *avec une liste qui
 * aurait pourtant l'air juste.*
 */
const LigneDeVolume: React.FC<{
    voie: NomDeVoie;
    reglages: RemoteReglagesAudio;
    icone: React.ReactNode;
    onVolume: (volume: number) => void;
    onSortie: (sortieId: string) => void;
}> = ({ voie, reglages, icone, onVolume, onSortie }) => {
    const [menuOuvert, setMenuOuvert] = useState(false);
    const volume = reglages[voie].volume;
    const choisie = sortieChoisie(reglages, voie);

    return (
        <div className="relative flex items-center gap-2 px-3 h-11 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="shrink-0 text-slate-500">{icone}</span>
            <span className="shrink-0 w-20 text-ui-10 font-black uppercase tracking-wider text-slate-500">
                {LIBELLE_DE_LA_VOIE[voie]}
            </span>

            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolume(parseFloat(e.target.value))}
                className="flex-1 min-w-0 h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-accent"
                title={`Volume — ${LIBELLE_DE_LA_VOIE[voie]}`}
                aria-label={`Volume — ${LIBELLE_DE_LA_VOIE[voie]}`}
            />
            <span className="shrink-0 w-10 text-right text-xs font-black text-accent tabular-nums">
                {Math.round(volume * 100)}%
            </span>

            {/*
              Le nom de la sortie, pas son identifiant : `useHardwareStore` garde
              l'alias que le meneur a donné — « Enceintes du salon » plutôt que
              « Realtek(R) Audio (High Definition Audio Device) ».
            */}
            <button
                onClick={() => setMenuOuvert(o => !o)}
                aria-label={`Sortie — ${LIBELLE_DE_LA_VOIE[voie]}`}
                title={choisie.absente
                    ? 'Cette sortie n’est plus branchée'
                    : `Sort sur : ${choisie.nom}`}
                className={`shrink-0 flex items-center gap-1 max-w-[9rem] px-2 py-1.5 rounded-lg border text-ui-10 font-bold transition-colors ${
                    choisie.absente
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                }`}
            >
                {choisie.absente && <AlertTriangle size={11} className="shrink-0" />}
                <span className="truncate">{choisie.nom}</span>
                <ChevronDown size={11} className="shrink-0 opacity-60" />
            </button>

            {menuOuvert && (
                <>
                    {/* Refermer en touchant à côté : sur une tablette, il n'y a pas
                        de « clic ailleurs » qui aille de soi. */}
                    <button
                        aria-label="Fermer le choix de sortie"
                        onClick={() => setMenuOuvert(false)}
                        className="fixed inset-0 z-40 cursor-default"
                    />
                    <div
                        role="menu"
                        aria-label={`Sorties disponibles — ${LIBELLE_DE_LA_VOIE[voie]}`}
                        className="absolute right-0 top-12 z-50 w-64 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1220] shadow-2xl p-1"
                    >
                        {reglages.sorties.map(sortie => (
                            <button
                                key={sortie.id}
                                role="menuitem"
                                onClick={() => { onSortie(sortie.id); setMenuOuvert(false); }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-ui-11 font-bold transition-colors ${
                                    sortie.id === choisie.id
                                        ? 'bg-accent/20 text-white'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                                }`}
                            >
                                <span className="min-w-0 truncate">{sortie.nom}</span>
                                {sortie.id === choisie.id && <Check size={12} className="shrink-0 text-accent" />}
                            </button>
                        ))}
                        {reglages.sorties.length <= 1 && (
                            <p className="px-3 py-2 text-ui-10 italic text-slate-600">
                                Aucune autre sortie recensée sur la machine du meneur.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default LigneDeVolume;
