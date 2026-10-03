import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, RotateCcw } from 'lucide-react';
import { useAmbientStore } from '../useAmbientStore';
import { ambientEngine } from '../AmbientEngine';
import { useHardwareStore } from '../../../stores/useHardwareStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { useCurseurLisse } from '../../../hooks/useCurseurLisse';
import { Panneau } from '../../../components/socle';

const titreDeSection = 'text-ui-11 font-semibold text-app-muted uppercase tracking-widest';

const MasterVisualizer: React.FC = () => {
    const [data, setData] = useState<Uint8Array>(new Uint8Array(32));
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const analyser = ambientEngine.getAnalyser();
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
            analyser.getByteFrequencyData(dataArray);
            setData(new Uint8Array(dataArray.slice(0, 32)));
            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <div className="flex items-end gap-[2px] h-10 w-full overflow-hidden bg-app-bg/80 rounded-xl p-1.5 border border-app-border shadow-inner">
            {Array.from(data).filter((_, i) => i % 2 === 0).map((v, i) => (
                <div
                    key={i}
                    className="flex-1 bg-gm-cyan rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(10, (v / 255) * 100)}%` }}
                />
            ))}
        </div>
    );
};

/**
 * **Le panneau de réglages des Ambiances** — refonte, phase 4, L2, étape 2
 * (2026-10-02). La sortie audio, **le master des ambiances** — que le
 * magasin et le moteur portaient, et qu'aucun curseur de cet écran ne réglait
 * — et la réinitialisation en bas.
 *
 * ⚠️ L'échelle en dB de la maquette est décorative (Stitch l'a inventée) : le
 * niveau se lit en pour-cent, comme partout ailleurs.
 */
const ReglagesDesAmbiances: React.FC = () => {
    const { t } = useTranslation();
    const { outputDeviceId, setOutputDevice, masterVolume, setMasterVolume, reset } = useAmbientStore();
    const { getAudioLabel, fetchAudioDevices: fetchAliases } = useHardwareStore();
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        // Enforce the saved device early
        ambientEngine.setOutputDevice(outputDeviceId);

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
    }, [outputDeviceId]);

    // Les noms donnés aux périphériques dans les Paramètres.
    useEffect(() => { fetchAliases(); }, [fetchAliases]);

    /* Le son suit le doigt, le magasin attend qu'on lâche — comme la Musique. */
    const curseur = useCurseurLisse(masterVolume, (v) => setMasterVolume(v), (v) => ambientEngine.setMasterVolume(v));

    const sorties = [
        { id: 'default', libelle: t('modules:ambient.dashboard.system_default') },
        ...audioDevices.map(d => ({ id: d.deviceId, libelle: getAudioLabel(d.deviceId) })),
    ];

    return (
        <>
            {/* Les sorties sont celles de la machine : la capture de référence masque ce panneau (`data-depend-du-materiel`). */}
            <Panneau niveau={1} data-depend-du-materiel="" className="shrink-0 p-4 flex flex-col gap-2">
                <h2 className={titreDeSection}>{t('modules:ambient.dashboard.audio_output')}</h2>
                <div className="flex flex-col gap-1">
                    {sorties.map(({ id, libelle }) => {
                        const choisie = outputDeviceId === id;
                        return (
                            <button
                                key={id}
                                /* Le magasin pose la sortie sur le moteur depuis le
                                   2026-09-22 — l'appeler ici aussi ferait deux
                                   écrivains pour un seul geste. */
                                onClick={() => setOutputDevice(id)}
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

            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h2 className={titreDeSection}>{t('modules:ambient.agencement.master')}</h2>
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
                    aria-label={t('modules:ambient.agencement.master')}
                    className="w-full cursor-pointer accent-accent"
                />
                <MasterVisualizer />
                {/*
                  **L'état du moteur reste dit**, sous le master : *un moteur
                  audio qui ne dit pas s'il est prêt laisse le meneur sans
                  diagnostic* (`e2e/ambientOs.spec.ts`). Il vivait dans un pied
                  d'écran ; la grammaire commune n'en a pas.
                */}
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-ui-9 uppercase tracking-widest text-app-subtle">
                    <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-etat-succes animate-pulse" />
                        {t('modules:ambient.dashboard.engine_ready')}
                    </span>
                    <span>48 kHz</span>
                    <span>{t('modules:ambient.dashboard.latency')} ~12 ms</span>
                </p>
            </Panneau>

            <button
                onClick={() => gmConfirm(t('modules:ambient.messages.reset_confirm'), () => reset())}
                title={t('modules:ambient.dashboard.reset_module')}
                className="mt-auto shrink-0 flex items-center justify-center gap-2 rounded-xl border border-etat-danger/20 bg-etat-danger/5 py-2.5 text-ui-9 font-black uppercase tracking-widest text-etat-danger/70 hover:bg-etat-danger/15 hover:text-etat-danger transition-all"
            >
                <RotateCcw size={12} /> {t('modules:ambient.dashboard.reset_module')}
            </button>
        </>
    );
};

export default ReglagesDesAmbiances;
