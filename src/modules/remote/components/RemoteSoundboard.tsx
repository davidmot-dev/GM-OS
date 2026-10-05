import React, { useMemo, useState } from 'react';
import { Bouton } from '../../../components/socle/Bouton';
import { Volume2, Search, X } from 'lucide-react';
import { type RemoteSound } from '../types/remote.types';
import { type RemoteReglagesAudio } from '../reglagesAudio';
import LigneDeVolume from './LigneDeVolume';

/**
 * **Les bruitages, densifiés le 2026-09-05.**
 *
 * Chaque déclencheur occupait un carré de `p-6` dans une grille de **deux
 * colonnes quelle que soit la largeur** : sur une tablette de 1024 px, près de
 * cinq cents pixels pour un mot. Le volume maître et l'arrêt général tenaient en
 * plus une carte de 200 px au-dessus.
 *
 * L'arrêt général est parti dans la ligne d'état, où il est atteignable depuis
 * n'importe quel onglet — *c'est un geste d'urgence, il n'avait rien à faire au
 * fond du troisième onglet.* Le volume tient désormais sur une ligne.
 */

interface RemoteSoundboardProps {
    sounds: RemoteSound[];
    audio: RemoteReglagesAudio;
    onVolumeChange: (vol: number) => void;
    onSortie: (sortie: string) => void;
    onTrigger: (id: string) => void;
}

const aplati = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const RemoteSoundboard: React.FC<RemoteSoundboardProps> = ({
    sounds, audio, onVolumeChange, onSortie, onTrigger,
}) => {
    const [filtre, setFiltre] = useState('');

    const retenus = useMemo(() => {
        const cherche = aplati(filtre.trim());
        if (!cherche) return sounds ?? [];
        return (sounds ?? []).filter(s => aplati(s.title).includes(cherche));
    }, [sounds, filtre]);

    return (
        <div className="flex flex-col gap-3">
            {/*
              ⭐ **La ligne était écrite à la main ici ; elle est désormais partagée.**
              Musique et Ambiances en auraient fait deux copies — *trois lignes du
              même geste finissent par ne plus se comporter pareil.* Elle gagne au
              passage le choix de la **sortie**, qui manquait aux trois.
            */}
            <LigneDeVolume
                voie="sound"
                reglages={audio}
                icone={<Volume2 size={15} />}
                onVolume={onVolumeChange}
                onSortie={onSortie}
            />

            {sounds && sounds.length > 8 && (
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle pointer-events-none" />
                    <input
                        type="search"
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                        placeholder="Filtrer les bruitages…"
                        aria-label="Filtrer les bruitages"
                        className="w-full h-[44px] pl-9 pr-16 rounded-xl bg-app-text/5 border border-app-text/10 text-sm text-app-text placeholder:text-app-subtle outline-none focus:border-accent/40 transition-colors"
                    />
                    {filtre && (
                        <Bouton habillage="libre" cibleTactile
                            onClick={() => setFiltre('')}
                            aria-label="Effacer le filtre"
                            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] w-6 h-6 rounded-lg flex items-center justify-center text-app-muted hover:text-app-text"
                        >
                            <X size={14} />
                        </Bouton>
                    )}
                </div>
            )}

            {retenus.length > 0 ? (
                <div className="grid grid-cols-3 min-[700px]:grid-cols-4 min-[1000px]:grid-cols-6 gap-2">
                    {retenus.map(s => (
                        <Bouton habillage="libre" cibleTactile
                            key={s.id}
                            onClick={() => onTrigger(s.id)}
                            disabled={!s.active}
                            className={`h-16 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
                                s.active
                                    ? 'bg-app-text/[0.03] border-app-text/5 hover:border-app-text/20 text-app-text'
                                    : 'bg-app-bg/20 border-app-text/5 text-app-text/20'
                            }`}
                        >
                            <Volume2 size={16} className={s.active ? 'text-etat-danger' : ''} />
                            <span className="text-ui-10 font-bold leading-tight text-center line-clamp-2 w-full">
                                {s.title}
                            </span>
                        </Bouton>
                    ))}
                </div>
            ) : (
                <p className="text-center py-10 text-sm italic text-app-muted">
                    {filtre
                        ? `Aucun bruitage ne correspond à « ${filtre} ».`
                        : "Aucun bruitage dans l'ambiance active."}
                </p>
            )}
        </div>
    );
};

export default RemoteSoundboard;
