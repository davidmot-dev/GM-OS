import React, { useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';
import { useVoiceStore } from '../../voice/useVoiceStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { Panneau } from '../../../components/socle';

const titreDeSection = 'text-ui-11 font-semibold text-app-muted uppercase tracking-widest';

/** Un interrupteur : la piste et sa pastille, rien d'autre. */
const Interrupteur: React.FC<{ actif: boolean }> = ({ actif }) => (
    <span className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${actif ? 'bg-accent' : 'bg-app-surface-2 border border-app-border'}`}>
        <span className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-fixe-blanc shadow transition-all ${actif ? 'left-[1.15rem]' : 'left-0.5'}`} />
    </span>
);

/**
 * **Le panneau de réglages de la Musique** — refonte, phase 4, L2, étape 2
 * (2026-10-02). Ce qui se règle, séparé de ce qui se joue : la sortie audio,
 * l'atténuation par la voix, l'alignement des niveaux, et la réinitialisation
 * tout en bas, loin de la main.
 */
const ReglagesDeLaMusique: React.FC = () => {
    const { outputDeviceId, setOutputDevice, normalisation, basculerLaNormalisation, sonies, cibleDeSonie, reset } = useMusicStore();
    const { getAudioLabel, fetchAudioDevices: fetchAliases } = useHardwareStore();
    const duckingActif = useVoiceStore(s => s.currentEffects.duckingEnabled);
    const reduction = useVoiceStore(s => s.currentEffects.duckingRange);
    const toggleDucking = useVoiceStore(s => s.toggleDucking);

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
      **La sortie se choisit dans une liste ouverte, plus dans un menu.** Le
      menu déroulant de l'ancien bandeau cachait la sortie courante derrière un
      libellé tronqué à 120 px ; dans le panneau, il y a la place de les montrer
      toutes, et celle qui joue se voit sans rien ouvrir.
    */
    const sorties = [
        { id: 'default', libelle: 'Sortie par défaut' },
        ...audioDevices.map(d => ({ id: d.deviceId, libelle: getAudioLabel(d.deviceId) })),
    ];

    const pistesMesurees = Object.keys(sonies).length;

    return (
        <>
            {/* Les sorties sont celles de la machine : la capture de référence masque ce panneau (`data-depend-du-materiel`). */}
            <Panneau niveau={1} data-depend-du-materiel="" className="shrink-0 p-4 flex flex-col gap-2">
                <h2 className={titreDeSection}>Sortie audio</h2>
                <div className="flex flex-col gap-1">
                    {sorties.map(({ id, libelle }) => {
                        const choisie = outputDeviceId === id;
                        return (
                            <button
                                key={id}
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

            {/*
              **L'atténuation par la voix — le ducking de Voice-OS**, choisi par
              David le 2026-10-02 pour ce bloc. C'est **un réglage de la voix**
              (il vit dans les effets de la voix active, que Voice-OS règle en
              détail) : on le montre ici parce que c'est la musique qui baisse,
              et c'est en regardant la musique qu'on se demande pourquoi.
            */}
            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-3">
                <button
                    onClick={() => toggleDucking()}
                    aria-pressed={duckingActif}
                    className="flex items-center justify-between gap-3 text-left"
                >
                    <h2 className={titreDeSection}>Atténuation par la voix</h2>
                    <Interrupteur actif={duckingActif} />
                </button>
                <p className="text-xs text-app-muted leading-relaxed">
                    La musique baisse d’elle-même quand vous parlez dans le micro de Voice-OS, et remonte quand vous vous taisez.
                </p>
                <div className="flex items-center justify-between rounded-lg border border-app-border/50 bg-app-bg/40 px-3 py-2">
                    <span className="text-ui-10 font-bold uppercase tracking-widest text-app-subtle">Réduction</span>
                    <span className={`font-mono text-sm font-black ${duckingActif ? 'text-accent' : 'text-app-subtle'}`}>
                        −{Math.round((1 - reduction) * 100)} %
                    </span>
                </div>
                <p className="text-ui-10 text-app-subtle">Le seuil, la réduction et le retour se règlent dans Voice-OS.</p>
            </Panneau>

            {/*
              **L'alignement des niveaux — chantier du 2026-09-03.**

              Le compteur dit combien de pistes sont déjà mesurées, et c'est
              volontaire : *un réglage automatique doit dire ce qu'il sait,
              sinon on ne comprend pas pourquoi il agit sur l'une et pas sur
              l'autre.* Une piste se mesure toute seule pendant qu'on
              l'écoute ; elle est calée dès la fois suivante.
            */}
            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-3">
                <button
                    onClick={() => basculerLaNormalisation()}
                    aria-pressed={normalisation}
                    className="flex items-center justify-between gap-3 text-left"
                >
                    <h2 className={titreDeSection}>Niveaux alignés</h2>
                    <Interrupteur actif={normalisation} />
                </button>
                <p className="text-xs text-app-muted leading-relaxed">
                    Aligne les pistes sur {cibleDeSonie} LUFS. Une piste est mesurée pendant sa première écoute, puis calée ensuite.
                </p>
                <p className="text-ui-10 font-bold uppercase tracking-widest text-app-subtle">
                    {pistesMesurees} piste{pistesMesurees > 1 ? 's' : ''} mesurée{pistesMesurees > 1 ? 's' : ''}
                </p>
            </Panneau>

            <button
                onClick={() => gmConfirm("Voulez-vous vraiment réinitialiser le module Music OS ? Toutes vos atmosphères et configurations seront perdues.", () => reset())}
                title="Réinitialiser le module"
                className="mt-auto shrink-0 flex items-center justify-center gap-2 rounded-xl border border-etat-danger/20 bg-etat-danger/5 py-2.5 text-ui-9 font-black uppercase tracking-widest text-etat-danger/70 hover:bg-etat-danger/15 hover:text-etat-danger transition-all"
            >
                <RotateCcw size={12} /> Réinitialiser le module
            </button>
        </>
    );
};

export default ReglagesDeLaMusique;
