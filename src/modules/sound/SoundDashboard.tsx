import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, SlidersHorizontal, StopCircle, Zap } from 'lucide-react';
import { useSoundStore } from './useSoundStore';
import SoundPad from './components/SoundPad';
import AtmosphereManager from './components/AtmosphereManager';
import ReglagesDuSon from './components/ReglagesDuSon';
import { useMidiControls } from './useMidiControls';
import { useKeyboardControls } from './useKeyboardControls';
import { soundEngine } from './SoundEngine';
import { soundController } from './SoundController';
import { MediaBrowser } from '../../components/MediaBrowser';
import { useMediaStore } from '../../stores/useMediaStore';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';
import { Bouton, Etiquette, EnTeteDeModule, GabaritDeModule } from '../../components/socle';

/**
 * **Les Effets sonores réagencés — refonte, phase 4, L2, étape 2 (2026-10-02).**
 *
 * La maquette retenue le 2026-09-27 (`documentation/Planning/stitch/son/`),
 * de la même famille que la Musique : l'en-tête, la barre (atmosphères,
 * MIDI learn, Key learn, arrêt progressif), **les seize pastilles à quatre par
 * ligne**, et à droite le panneau — MIDI, touches assignées, volume, sortie.
 *
 * « Arrêt progressif (3 s) » apparaissait deux fois dans la maquette (barre et
 * pied du panneau) : il n'est qu'une fois, dans la barre.
 */
const SoundDashboard: React.FC = () => {
    const store = useSoundStore();
    const activeAtmos = store.atmospheres.find(a => a.id === store.activeAtmosphereId) || store.atmospheres[0];
    const pads = Object.values(activeAtmos.pads).sort((a, b) => a.id.localeCompare(b.id));

    // Initialize Global Input Listeners
    useMidiControls();
    useKeyboardControls();

    useEffect(() => {
        // Sync engine output device on mount
        soundEngine.setOutputDevice(store.outputDeviceId);
    }, [store.outputDeviceId]);

    const [assignmentTarget, setAssignmentTarget] = useState<{ padId: string, atmosphereId: string } | null>(null);
    const { t } = useTranslation('modules');
    const regime = useRegimeDInterface();
    const [reglagesOuverts, setReglagesOuverts] = useState(true);
    const canauxActifs = pads.filter(p => p.isActive).length;


    const handleAssignMedia = (padId: string) => {
        setAssignmentTarget({ padId, atmosphereId: store.activeAtmosphereId || activeAtmos.id });
    };

    const handleMediaSelect = (mediaId: string) => {
        if (!assignmentTarget) return;

        const { mediaList } = useMediaStore.getState();
        const media = mediaList.find(m => m.id === mediaId);
        
        if (media) {
            store.setPadFile(
                assignmentTarget.padId, 
                mediaId, 
                media.name, 
                assignmentTarget.atmosphereId
            );
        }
        
        setAssignmentTarget(null);
    };

    const hauteur = regime.aLaTable ? 'min-h-11' : 'min-h-9';
    const learn = `flex items-center gap-2 px-3 rounded-xl border text-ui-8 font-black uppercase tracking-widest transition-all ${hauteur}`;

    return (
        <>
            <MediaBrowser
                isOpen={!!assignmentTarget}
                onClose={() => {
                    setAssignmentTarget(null);
                }}
                onSelect={handleMediaSelect}
                allowedTypes={['audio']}
                title="Choisir un Son"
            />

            <GabaritDeModule
                aLaTable={regime.aLaTable}
                reglagesOuverts={reglagesOuverts}
                className="text-app-text"
                entete={
                    <EnTeteDeModule
                        titre={t('names.sound')}
                        etat={<>
                            <Etiquette>Atmosphère « {activeAtmos.name} »</Etiquette>
                            {canauxActifs > 0
                                ? <Etiquette ton="accent">{canauxActifs} canal{canauxActifs > 1 ? 'aux' : ''} actif{canauxActifs > 1 ? 's' : ''}</Etiquette>
                                : <Etiquette>Silence</Etiquette>}
                            <Etiquette ton={store.isMidiConnected ? 'succes' : 'neutre'}>{store.isMidiConnected ? 'MIDI branché' : 'Sans MIDI'}</Etiquette>
                        </>}
                        actions={regime.aLaTable ? (
                            <Bouton aLaTable icone={<SlidersHorizontal size={16} />} aria-pressed={reglagesOuverts} onClick={() => setReglagesOuverts(!reglagesOuverts)}>
                                Réglages
                            </Bouton>
                        ) : undefined}
                    />
                }
                barreDOutils={<>
                    <div className="min-w-0 flex-1">
                        <AtmosphereManager />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={store.toggleMidiLearn}
                            aria-pressed={store.isMidiLearnActive}
                            className={`${learn} ${store.isMidiLearnActive ? 'bg-accent border-accent text-app-on-accent shadow-glow-accent' : 'bg-app-surface/40 border-app-border/50 text-app-muted hover:text-app-text'}`}
                        >
                            <Zap size={12} /> MIDI learn
                        </button>
                        <button
                            onClick={store.toggleKeyLearn}
                            aria-pressed={store.isKeyLearnActive}
                            className={`${learn} ${store.isKeyLearnActive ? 'bg-accent border-accent text-app-on-accent shadow-glow-accent' : 'bg-app-surface/40 border-app-border/50 text-app-muted hover:text-app-text'}`}
                        >
                            <Keyboard size={12} /> Key learn
                        </button>
                        <button
                            onClick={() => soundController.stopAll()}
                            title="Arrêt progressif de tous les bruitages, en trois secondes"
                            className={`${learn} bg-etat-danger/10 border-etat-danger/30 text-etat-danger hover:bg-etat-danger hover:text-app-bg active:scale-95`}
                        >
                            <StopCircle size={14} /> Arrêt progressif (3 s)
                        </button>
                    </div>
                </>}
                reglages={<ReglagesDuSon atmosphereId={activeAtmos.id} />}
            >
                <div className="grid grid-cols-4 gap-4 pb-4">
                    {pads.map(pad => (
                        <SoundPad
                            key={pad.id}
                            pad={pad}
                            onAssignMedia={handleAssignMedia}
                        />
                    ))}
                </div>
            </GabaritDeModule>
        </>
    );
};

export default SoundDashboard;
