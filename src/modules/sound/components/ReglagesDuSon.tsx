import React, { useEffect, useState } from 'react';
import { Check, RefreshCcw, RotateCcw } from 'lucide-react';
import { useSoundStore } from '../useSoundStore';
import { soundEngine } from '../SoundEngine';
import { useMidiControls } from '../useMidiControls';
import { useHardwareStore } from '../../../stores/useHardwareStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { useCurseurLisse } from '../../../hooks/useCurseurLisse';
import { Panneau } from '../../../components/socle';

const titreDeSection = 'text-ui-11 font-semibold text-app-muted uppercase tracking-widest';

/**
 * **Le panneau de réglages des Effets sonores** — refonte, phase 4, L2,
 * étape 2 (2026-10-02), la maquette retenue le 2026-09-27 (`documentation/
 * Planning/stitch/son/`). Le périphérique MIDI, **la liste des touches
 * assignées**, le volume général, la sortie audio, et la réinitialisation en
 * bas.
 *
 * ⭐ **Le volume général des bruitages n'avait pas de curseur.** Le magasin le
 * tenait, le moteur l'appliquait (le fil manquant a été posé le 2026-09-20) ;
 * seules la tablette et les moments de storyboard pouvaient le régler. Le
 * meneur, devant son propre écran, ne le pouvait pas.
 */
const ReglagesDuSon: React.FC<{ atmosphereId: string }> = ({ atmosphereId }) => {
    const { refreshMidi } = useMidiControls();
    const { outputDeviceId, setOutputDevice, isMidiConnected, masterVolume, setMasterVolume, reset } = useSoundStore();
    const atmosphere = useSoundStore(s => s.atmospheres.find(a => a.id === atmosphereId));
    const { getAudioLabel, fetchAudioDevices: fetchAliases } = useHardwareStore();
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                setAudioDevices(devices.filter(d => d.kind === 'audiooutput' && d.deviceId !== 'default'));
            } catch (err) {
                console.error("Error enumerating audio devices:", err);
            }
        };
        fetchDevices();
        navigator.mediaDevices.addEventListener('devicechange', fetchDevices);
        return () => navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    }, []);

    // Les noms donnés aux périphériques dans les Paramètres.
    useEffect(() => { fetchAliases(); }, [fetchAliases]);

    /*
      **Le son suit le doigt, le magasin attend qu'on lâche** — le même
      remède que les trois curseurs de la Musique : écrire le magasin à chaque
      cran, c'est la persistance et la synchronisation réseau cent fois par
      traversée.
    */
    const curseur = useCurseurLisse(masterVolume, (v) => setMasterVolume(v), (v) => soundEngine.setMasterVolume(v));

    /*
      **Les touches assignées, d'un coup d'œil.** Elles ne se lisaient que sur
      chaque pastille, une à une ; avant une séance, on veut savoir ce que
      fait le clavier sans survoler seize carrés.
    */
    const assignees = atmosphere
        ? Object.values(atmosphere.pads)
            .filter(p => p.filePath && (p.keyMapping || p.midiMapping !== null))
            .sort((a, b) => a.id.localeCompare(b.id))
        : [];

    const sorties = [
        { id: 'default', libelle: 'Sortie par défaut' },
        ...audioDevices.map(d => ({ id: d.deviceId, libelle: getAudioLabel(d.deviceId) })),
    ];

    return (
        <>
            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <h2 className={titreDeSection}>Périphérique MIDI</h2>
                    <button
                        onClick={refreshMidi}
                        className="p-1 rounded-md text-app-subtle hover:text-app-text hover:bg-app-text/10 transition-all"
                        title="Actualiser les périphériques MIDI"
                        aria-label="Actualiser les périphériques MIDI"
                    >
                        <RefreshCcw size={12} />
                    </button>
                </div>
                <p className={`flex items-center gap-2 text-xs font-bold ${isMidiConnected ? 'text-etat-succes' : 'text-app-muted'}`}>
                    <span className={`size-2 rounded-full ${isMidiConnected ? 'bg-etat-succes animate-pulse' : 'bg-app-border'}`} />
                    {isMidiConnected ? 'Périphérique MIDI branché' : 'Aucun périphérique MIDI'}
                </p>
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-2">
                <h2 className={titreDeSection}>Touches assignées</h2>
                {assignees.length === 0 ? (
                    <p className="text-xs text-app-subtle">Aucune touche dans cette atmosphère : Key learn ou MIDI learn, puis cliquez une pastille.</p>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {assignees.map(p => (
                            <li key={p.id} className="flex items-center gap-2 rounded-lg border border-app-border/50 bg-app-bg/40 px-2 py-1.5">
                                {p.keyMapping && (
                                    <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 font-mono text-ui-10 font-black text-accent">
                                        {p.keyMapping.replace('Key', '').replace('Numpad', 'NUM ')}
                                    </span>
                                )}
                                {p.midiMapping !== null && (
                                    <span className="shrink-0 rounded bg-etat-alerte/15 px-1.5 py-0.5 font-mono text-ui-10 font-black text-etat-alerte">
                                        #{p.midiMapping}
                                    </span>
                                )}
                                <span className="min-w-0 flex-1 truncate text-xs font-bold text-app-text">{p.title || p.id}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h2 className={titreDeSection}>Volume des bruitages</h2>
                    <span className="font-mono text-lg font-black text-accent">{Math.round(curseur.position * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={curseur.position}
                    onChange={(e) => curseur.tirer(parseFloat(e.target.value))}
                    {...curseur.gestesDeRelachement}
                    aria-label="Volume général des bruitages"
                    className="w-full cursor-pointer accent-accent"
                />
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-2">
                <h2 className={titreDeSection}>Sortie audio</h2>
                <div className="flex flex-col gap-1">
                    {sorties.map(({ id, libelle }) => {
                        const choisie = outputDeviceId === id;
                        return (
                            <button
                                key={id}
                                onClick={() => { setOutputDevice(id); soundEngine.setOutputDevice(id); }}
                                aria-pressed={choisie}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition-all ${choisie
                                    ? 'border-accent/60 bg-accent/10 text-app-text'
                                    : 'border-app-border/50 bg-app-bg/40 text-app-muted hover:text-app-text hover:border-accent/40'}`}
                            >
                                <span className={`size-2 shrink-0 rounded-full ${choisie ? 'bg-etat-succes' : 'bg-app-border'}`} />
                                <span className="min-w-0 flex-1 truncate">{libelle}</span>
                                {choisie && <Check size={12} className="shrink-0 text-accent" />}
                            </button>
                        );
                    })}
                </div>
            </Panneau>

            <button
                onClick={() => gmConfirm("Voulez-vous vraiment réinitialiser le module Sound OS ? Toutes vos atmosphères et configurations seront perdues.", () => reset())}
                title="Réinitialiser le module"
                className="mt-auto shrink-0 flex items-center justify-center gap-2 rounded-xl border border-etat-danger/20 bg-etat-danger/5 py-2.5 text-ui-9 font-black uppercase tracking-widest text-etat-danger/70 hover:bg-etat-danger/15 hover:text-etat-danger transition-all"
            >
                <RotateCcw size={12} /> Réinitialiser le module
            </button>
        </>
    );
};

export default ReglagesDuSon;
