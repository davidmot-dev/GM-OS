import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Deck from './components/Deck';
import Mixer from './components/Mixer';
import PlaylistManager from './components/PlaylistManager';
import BarreDesAtmospheres from './components/BarreDesAtmospheres';
import ReglagesDeLaMusique from './components/ReglagesDeLaMusique';
import { useMusicKeyboardControls } from './useMusicKeyboardControls';
import { useMusicStore } from './useMusicStore';
import { usePlaylistsVisibles } from './usePlaylistsVisibles';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';
import { Bouton, Etiquette, EnTeteDeModule, GabaritDeModule } from '../../components/socle';

/**
 * **La Musique réagencée — refonte, phase 4, L2, étape 2 (2026-10-02).**
 *
 * La maquette retenue avec Stitch le 2026-09-26 (`documentation/Planning/
 * stitch/musique/`), dans la grammaire d'écran commune : l'en-tête, la barre
 * des atmosphères, **trois colonnes** — platine A, mixeur, platine B — puis
 * les pastilles, et à droite le panneau de réglages.
 *
 * L'ordre suit le geste : on choisit l'atmosphère, on regarde ce qui joue, on
 * mélange, on lance la pastille suivante. Le mixeur était en bas, sous les
 * pastilles, loin des platines qu'il mélange.
 */
const MusicDashboard: React.FC = () => {
    // Initialize Global Input Listeners
    useMusicKeyboardControls();

    const regime = useRegimeDInterface();
    const [reglagesOuverts, setReglagesOuverts] = React.useState(true);
    const { active } = usePlaylistsVisibles();
    const enLecture = useMusicStore(s => [s.deckA.isPlaying && 'A', s.deckB.isPlaying && 'B'].filter(Boolean).join(' et '));

    return (
        <GabaritDeModule
            aLaTable={regime.aLaTable}
            reglagesOuverts={reglagesOuverts}
            className="text-app-text"
            entete={
                <EnTeteDeModule
                    titre="Musique"
                    etat={<>
                        {active && <Etiquette>Atmosphère « {active.name} »</Etiquette>}
                        {enLecture
                            ? <Etiquette ton="accent">Platine {enLecture} en lecture</Etiquette>
                            : <Etiquette>Silence</Etiquette>}
                    </>}
                    actions={regime.aLaTable ? (
                        <Bouton aLaTable icone={<SlidersHorizontal size={16} />} aria-pressed={reglagesOuverts} onClick={() => setReglagesOuverts(!reglagesOuverts)}>
                            Réglages
                        </Bouton>
                    ) : undefined}
                />
            }
            barreDOutils={<BarreDesAtmospheres aLaTable={regime.aLaTable} />}
            reglages={<ReglagesDeLaMusique />}
        >
            <div className="flex flex-col gap-5 pb-4">
                <div className="grid grid-cols-[minmax(0,1fr)_12.5rem_minmax(0,1fr)] gap-3">
                    <Deck side="A" />
                    <Mixer />
                    <Deck side="B" />
                </div>
                <PlaylistManager />
            </div>
        </GabaritDeModule>
    );
};

export default MusicDashboard;
