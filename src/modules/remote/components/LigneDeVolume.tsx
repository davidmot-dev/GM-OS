import React, { useState } from 'react';
import { Bouton } from '../../../components/socle/Bouton';
import { Panneau } from '../../../components/socle/Panneau';
import { Check, ChevronDown, AlertTriangle } from 'lucide-react';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
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
    useFermetureParEchap(menuOuvert, () => setMenuOuvert(false), 'Choix de sortie audio');
    const volume = reglages[voie].volume;
    const choisie = sortieChoisie(reglages, voie);

    return (
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 p-3 rounded-xl bg-app-text/[0.03] border border-app-text/5">
            <span className="flex items-center gap-2 text-[14px] font-bold text-app-muted">
                {icone}
                {LIBELLE_DE_LA_VOIE[voie]}
            </span>

            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolume(parseFloat(e.target.value))}
                className="row-start-2 col-span-2 w-full min-w-0 h-[44px] cursor-pointer accent-accent"
                title={`Volume — ${LIBELLE_DE_LA_VOIE[voie]}`}
                aria-label={`Volume — ${LIBELLE_DE_LA_VOIE[voie]}`}
            />
            <span className="col-start-2 row-start-1 text-right text-[14px] font-bold text-accent tabular-nums">
                {Math.round(volume * 100)}%
            </span>

            {/*
              Le nom de la sortie, pas son identifiant : `useHardwareStore` garde
              l'alias que le meneur a donné — « Enceintes du salon » plutôt que
              « Realtek(R) Audio (High Definition Audio Device) ».
            */}
            <Bouton habillage="libre" cibleTactile
                onClick={() => setMenuOuvert(o => !o)}
                aria-label={`Sortie — ${LIBELLE_DE_LA_VOIE[voie]}`}
                title={choisie.absente
                    ? 'Cette sortie n’est plus branchée'
                    : `Sort sur : ${choisie.nom}`}
                aria-expanded={menuOuvert}
                className={`col-span-2 min-w-0 min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-[14px] font-bold transition-colors ${
                    choisie.absente
                        ? 'border-etat-alerte/40 bg-etat-alerte/10 text-etat-alerte'
                        : 'border-app-text/10 bg-app-text/[0.03] text-app-text hover:border-app-text/25'
                }`}
            >
                {choisie.absente && <AlertTriangle size={11} className="shrink-0" />}
                <span className="min-w-0 break-words text-left">{choisie.nom}</span>
                <ChevronDown size={11} className="shrink-0 opacity-60" />
            </Bouton>

            {menuOuvert && (
                <>
                    {/* Refermer en touchant à côté : sur une tablette, il n'y a pas
                        de « clic ailleurs » qui aille de soi. */}
                    <Bouton habillage="libre" cibleTactile
                        aria-label="Fermer le choix de sortie"
                        onClick={() => setMenuOuvert(false)}
                        className="fixed inset-0 z-40 cursor-default"
                    />
                    <Panneau as="div" habillage="libre"
                        role="menu"
                        aria-label={`Sorties disponibles — ${LIBELLE_DE_LA_VOIE[voie]}`}
                        className="absolute right-0 top-full z-50 w-full max-h-[240px] overflow-y-auto rounded-xl border border-app-text/10 bg-app-bg shadow-2xl p-1"
                    >
                        {reglages.sorties.map(sortie => (
                            <Bouton habillage="libre" cibleTactile
                                key={sortie.id}
                                role="menuitem"
                                onClick={() => { onSortie(sortie.id); setMenuOuvert(false); }}
                                className={`w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-[14px] font-bold transition-colors ${
                                    sortie.id === choisie.id
                                        ? 'bg-accent/20 text-app-text'
                                        : 'text-app-muted hover:bg-app-text/5 hover:text-app-text'
                                }`}
                            >
                                <span className="min-w-0 break-words">{sortie.nom}</span>
                                {sortie.id === choisie.id && <Check size={12} className="shrink-0 text-accent" />}
                            </Bouton>
                        ))}
                        {reglages.sorties.length <= 1 && (
                            <p className="px-3 py-2 text-[14px] italic text-app-muted">
                                Aucune autre sortie recensée sur la machine du meneur.
                            </p>
                        )}
                    </Panneau>
                </>
            )}
        </div>
    );
};

export default LigneDeVolume;
