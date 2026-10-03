import React, { useEffect, useMemo } from 'react';
import {
    AudioLines,
    Mic2,
    MicOff,
    Ghost,
    Skull,
    Cpu,
    Flame,
    Radio,
    Volume2,
    Headphones,
    RefreshCw,
    ShieldCheck,
    SlidersHorizontal,
    Activity,
} from 'lucide-react';
import { useVoiceStore } from './useVoiceStore';
import { voiceEngine } from './VoiceEngine';
import { useHardwareStore } from '../../stores/useHardwareStore';
import { useTranslation } from 'react-i18next';
import { useNPCStore } from '../npc/useNPCStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { gmToast } from '../../stores/useToastStore';
import { Panneau, Bouton, Etiquette, EnTeteDeModule } from '../../components/socle';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';

const titreDeColonne = 'flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text';
const sousTitre = 'mb-1 mt-1 text-ui-10 font-black uppercase tracking-widest text-accent';

const VocalShaperSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (val: number) => void;
    unit?: string;
}> = ({ label, value, min, max, step = 1, onChange, unit = '' }) => (
    <label className="flex flex-col gap-1.5 rounded-lg border border-app-border bg-app-bg/40 p-2.5">
        <span className="flex justify-between text-ui-10 font-black uppercase tracking-widest text-app-muted">
            <span>{label}</span>
            <span className="font-mono text-accent">{value}{unit}</span>
        </span>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-app-surface-2 accent-accent"
        />
    </label>
);

/** Un interrupteur nommé, avec ce qu'il fait dessous. */
const Interrupteur: React.FC<{
    actif: boolean;
    onClick: () => void;
    libelle: string;
    aide?: string;
    children?: React.ReactNode;
}> = ({ actif, onClick, libelle, aide, children }) => (
    <div className={`rounded-lg border p-2.5 transition-colors ${actif ? 'border-etat-succes/40 bg-etat-succes/5' : 'border-app-border bg-app-bg/40'}`}>
        <button role="switch" aria-checked={actif} onClick={onClick} className="flex w-full items-center justify-between gap-3 text-left">
            <span className="min-w-0">
                <span className={`block text-xs font-black uppercase tracking-widest ${actif ? 'text-etat-succes' : 'text-app-text'}`}>{libelle}</span>
                {aide && <span className="mt-0.5 block text-ui-10 leading-snug text-app-muted">{aide}</span>}
            </span>
            <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${actif ? 'bg-etat-succes' : 'bg-app-surface-2'}`}>
                <span className={`absolute top-1 h-3 w-3 rounded-full bg-app-text transition-all ${actif ? 'left-5' : 'left-1'}`} />
            </span>
        </button>
        {children}
    </div>
);

/** Le niveau en décibels, lisible : « -12 dB », « -∞ » au silence. */
const decibels = (niveau: number) => (niveau > 0.0001 ? `${Math.round(20 * Math.log10(niveau))} dB` : '-∞');

/**
 * **Voice-OS** — refonte, L6, maquette retenue (`stitch/son/son-voice-os.png`) :
 * trois colonnes — les modèles vocaux et les voix des PNJ, **le micro au centre
 * (plus petit)**, puis les effets **rangés en deux groupes**, « Nettoyage et
 * sécurité » et « Modeleurs vocaux ». Répond à David : *« la partie avec les
 * effets prend peut-être un peu trop de place »*.
 *
 * **Retirés parce qu'ils mentaient** : « Latence : 12ms » et « Charge DSP : 4% »
 * étaient écrits en dur et ne mesuraient rien — l'état réel du DSP les
 * remplace ; le bouton « + Profil personnalisé » n'avait aucune action.
 */
const VoiceDashboard: React.FC = () => {
    const {
        isActive,
        isLive,
        isMonitor,
        isSyncNPC,
        isDucking,
        currentEffects,
        activePresetId,
        inputLevel,
        probabiliteDeVoix,
        presets,
        toggleActive,
        toggleLive,
        toggleMonitor,
        toggleSyncNPC,
        toggleDucking,
        updateEffect,
        applyPreset,
        toggleAntiLarsen,
        setDebruitage,
        toggleNoiseGate,
        outputDeviceId,
        availableOutputs,
        setOutputDeviceId,
        inputDeviceId,
        availableInputs,
        setInputDeviceId,
        lastSyncedEntityName,
        appliquerProfil,
        isWorkletReady
    } = useVoiceStore();
    const { getAudioLabel } = useHardwareStore();
    const regime = useRegimeDInterface();

    /*
      Les PNJ qui portent une voix. Voice-OS lit les modules des PNJ, et non
      l'inverse : c'est lui qui a besoin de la liste, et eux n'ont pas à
      connaître le rack.

      **Deux sources depuis le 2026-09-04** (défaut V2 du § 12k). On ne lisait
      que le mémo de NPC-OS — le module qui porte *un* PNJ à la fois — quand la
      galerie de campagne en porte plus de cent, et que ce sont eux qui peuvent
      désormais avoir un profil. Une voix posée sur une fiche de la galerie
      était donc introuvable ici.

      **On n'ajoute que ceux qui ONT déjà un profil** : la liste ne grossit que
      du travail déjà fait, jamais de cent entrées muettes. Et la campagne
      active fait le tri — rappeler la voix d'un PNJ d'une autre partie n'a
      aucun sens.
    */
    const memoDesPnj = useNPCStore(state => state.savedEntities);
    /*
      Les deux sélecteurs rendent des références stables du magasin — filtrer
      *dans* le sélecteur rendrait un tableau neuf à chaque passage, et Zustand
      le lirait comme un changement d'état à chaque rendu.
    */
    const galerie = useSessionOSStore(state => state.entities);
    const campagneActive = useSessionOSStore(state => state.activeCampaignId);
    /* Une même fiche peut vivre des deux côtés : l'identifiant tranche. */
    const voixEnregistrees = useMemo(() => {
        const duMemo = memoDesPnj.filter(e => e.voiceProfile);
        const vues = new Set(duMemo.map(e => e.id));
        return [
            ...duMemo,
            ...galerie.filter(e => e.voiceProfile && e.campaignId === campagneActive && !vues.has(e.id)),
        ];
    }, [memoDesPnj, galerie, campagneActive]);
    const { t } = useTranslation();

    useEffect(() => {
        voiceEngine.refreshAvailableDevices();
        if (isActive) {
            voiceEngine.initialize().catch(err => console.error("Voice initialization failed", err));
        } else {
            voiceEngine.stop();
        }

        // Cleanup on unmount
        return () => {
            if (!isActive) voiceEngine.stop();
        };
    }, [isActive]);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Ghost': return <Ghost size={18} />;
            case 'Skull': return <Skull size={18} />;
            case 'Cpu': return <Cpu size={18} />;
            case 'Flame': return <Flame size={18} />;
            default: return <Mic2 size={18} />;
        }
    };

    const basculerLeMicro = async () => {
        // User interaction: crucial for AudioContext resume
        await voiceEngine.initialize();
        toggleActive();
    };

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-4 text-app-text">
            <EnTeteDeModule
                titre="Voice-OS"
                surtitre={t('modules:voice.ui.surtitre')}
                etat={<>
                    <Etiquette ton={isActive ? 'succes' : 'neutre'}>
                        {t('modules:voice.dashboard.mic_status')} : {isActive ? t('modules:voice.dashboard.active') : t('modules:voice.dashboard.standby')}
                    </Etiquette>
                    {isActive && (
                        <Etiquette ton={isWorkletReady ? 'succes' : 'danger'} title={isWorkletReady ? undefined : t('modules:voice.ui.dsp_fallback_hint')}>
                            {isWorkletReady ? t('modules:voice.ui.dsp_ready') : t('modules:voice.ui.dsp_fallback')}
                        </Etiquette>
                    )}
                    {isDucking && <Etiquette ton="alerte"><Volume2 size={11} /> {t('modules:voice.dashboard.ducking_active')}</Etiquette>}
                    {lastSyncedEntityName && (
                        <Etiquette ton="accent"><AudioLines size={11} /> {t('modules:voice.dashboard.linked')} : {lastSyncedEntityName}</Etiquette>
                    )}
                </>}
            />

            {/* ── Les gestes : le micro, la diffusion, le retour, la synchro ── */}
            <div role="toolbar" className="flex shrink-0 flex-wrap items-center gap-2">
                <Bouton aLaTable={regime.aLaTable} variante={isActive ? 'succes' : 'neutre'} icone={isActive ? <Mic2 size={16} /> : <MicOff size={16} />} onClick={() => void basculerLeMicro()} aria-pressed={isActive}>
                    {isActive ? t('modules:voice.dashboard.mic_on') : t('modules:voice.dashboard.mic_off')}
                </Bouton>
                <Bouton aLaTable={regime.aLaTable} variante={isLive ? 'danger' : 'accent'} icone={<Radio size={16} className={isLive ? 'animate-pulse' : ''} />} onClick={() => toggleLive()} aria-pressed={isLive}>
                    {isLive ? t('modules:voice.dashboard.live_broadcast') : t('modules:voice.dashboard.go_live')}
                </Bouton>
                <Bouton aLaTable={regime.aLaTable} icone={<Headphones size={16} />} onClick={() => toggleMonitor()} aria-pressed={isMonitor}>
                    {t('modules:voice.dashboard.monitor')} : {isMonitor ? 'ON' : 'OFF'}
                </Bouton>
                <Bouton aLaTable={regime.aLaTable} icone={<RefreshCw size={16} />} onClick={() => toggleSyncNPC()} aria-pressed={isSyncNPC}>
                    {t('modules:voice.dashboard.sync_npc')} : {isSyncNPC ? 'AUTO' : 'OFF'}
                </Bouton>
            </div>

            <div className="flex min-h-0 flex-1 gap-4">
                {/* ── À gauche : les modèles vocaux, les voix des PNJ ── */}
                <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
                    <Panneau className="flex flex-col gap-2 p-3">
                        <p className={titreDeColonne}><Mic2 size={15} className="text-accent" />{t('modules:voice.dashboard.vocal_templates')}</p>
                        {presets.map((preset) => {
                            const actif = activePresetId === preset.id;
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => applyPreset(preset.id)}
                                    aria-pressed={actif}
                                    className={`flex items-start gap-3 rounded-lg border p-2.5 text-left transition-colors ${actif ? 'border-accent bg-accent/10' : 'border-app-border hover:border-accent/50'}`}
                                >
                                    <span className={`mt-0.5 shrink-0 ${actif ? 'text-accent' : 'text-app-muted'}`}>{getIcon(preset.icon)}</span>
                                    <span className="min-w-0">
                                        <span className={`flex items-center gap-2 text-sm font-bold ${actif ? 'text-accent' : 'text-app-text'}`}>
                                            {t(preset.name)}
                                            {actif && <Etiquette ton="accent">{t('modules:voice.dashboard.active')}</Etiquette>}
                                        </span>
                                        <span className="block truncate text-xs text-app-muted">{t(preset.description)}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </Panneau>

                    {/*
                        **Les voix rangées sur les fiches de PNJ.** Demandé par David le
                        2026-08-15 : un profil généré dans NPC-OS doit se rappeler ici, en
                        séance, sans rouvrir le générateur. La liste ne montre que les PNJ
                        qui EN ONT un — un rappel qui reposerait un profil inexistant
                        remettrait le rack à des valeurs que personne n'a choisies.
                    */}
                    <Panneau className="flex flex-col gap-2 p-3">
                        <p className={`${titreDeColonne} justify-between`}>
                            <span className="flex items-center gap-2"><AudioLines size={15} className="text-accent" />{t('modules:voice.ui.npc_voices')}</span>
                            <span className="font-mono text-ui-10 text-app-muted">{voixEnregistrees.length}</span>
                        </p>
                        {voixEnregistrees.length === 0 && (
                            <p className="text-xs italic text-app-subtle">{t('modules:voice.ui.npc_none')}</p>
                        )}
                        {voixEnregistrees.map(pnj => (
                            <button
                                key={pnj.id}
                                onClick={() => {
                                    appliquerProfil(pnj.voiceProfile!);
                                    gmToast(t('modules:voice.ui.recalled', { name: pnj.name }), 'info');
                                }}
                                className="flex items-center gap-3 rounded-lg border border-app-border p-2.5 text-left transition-colors hover:border-accent/50"
                            >
                                <AudioLines size={16} className="shrink-0 text-gm-cyan" />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-bold text-app-text">{pnj.name}</span>
                                    <span className="block text-xs text-app-muted">{pnj.voiceProfile!.presetId ?? t('modules:voice.ui.custom')}</span>
                                </span>
                            </button>
                        ))}
                    </Panneau>
                </aside>

                {/* ── Au centre : le micro, plus petit, et le matériel ── */}
                <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto custom-scrollbar">
                    <Panneau niveau={2} className="flex flex-1 flex-col p-4">
                        <div className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-app-muted">
                            <span className="flex items-center gap-2"><Activity size={13} className="text-accent" />{t('modules:voice.ui.input_stream')}</span>
                            <span className="font-mono text-accent">48 kHz</span>
                        </div>
                        <div className="flex flex-1 items-center justify-center py-6">
                            <div className="relative flex h-52 w-52 items-center justify-center">
                                <div className="absolute inset-0 rounded-full border border-app-border" />
                                <div className="absolute inset-4 rounded-full border border-dashed border-accent/30" />
                                <div
                                    className="absolute inset-8 rounded-full border-4 border-accent/30 transition-transform duration-75"
                                    style={{ transform: `scale(${1 + inputLevel * 0.35})` }}
                                />
                                <div className={`relative flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 transition-colors ${isActive ? 'border-accent bg-accent/10' : 'border-app-border bg-app-bg'}`}>
                                    {isActive ? <Mic2 size={40} className="text-accent" /> : <MicOff size={40} className="text-app-subtle" />}
                                    <span className="mt-1 text-ui-9 font-black uppercase tracking-widest text-app-muted">
                                        {isActive ? t('modules:voice.dashboard.active') : t('modules:voice.dashboard.standby')}
                                    </span>
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-full bg-accent/20 blur-2xl transition-opacity duration-150" style={{ opacity: inputLevel }} />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="mb-1 flex items-baseline justify-between text-ui-10 font-black uppercase tracking-widest text-app-muted">
                                <span>{t('modules:voice.ui.level')}</span>
                                <span className="font-mono text-sm text-accent">{decibels(inputLevel)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-app-bg">
                                <div className="h-full bg-accent transition-all duration-75" style={{ width: `${inputLevel * 100}%` }} />
                            </div>
                        </div>
                    </Panneau>

                    {/*
                      **Le micro vient AVANT la sortie** — demandé par David le 2026-09-03 :
                      c'est l'ordre du signal et l'ordre des ennuis. Sans le choix du micro,
                      Voice-OS prenait le périphérique par défaut de Windows — *lequel se
                      décide au branchement d'une webcam, pas au moment de jouer.*
                    */}
                    <Panneau className="flex shrink-0 flex-col gap-3 p-4">
                        <div className="flex items-center justify-between">
                            <p className={titreDeColonne}>{t('modules:voice.ui.hardware')}</p>
                            <button onClick={() => voiceEngine.refreshAvailableDevices()} className="flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-accent hover:brightness-110">
                                <RefreshCw size={12} />{t('modules:voice.dashboard.refresh_devices')}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="flex flex-col gap-1.5">
                                <span className="flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-app-muted"><Mic2 size={12} />{t('modules:voice.dashboard.audio_input')}</span>
                                <select
                                    value={inputDeviceId || ''}
                                    onChange={(e) => setInputDeviceId(e.target.value || null)}
                                    className="min-h-11 w-full rounded-lg border border-app-border bg-app-bg px-3 text-sm text-app-text focus:border-accent/60 focus:outline-none"
                                >
                                    <option value="">{t('modules:voice.dashboard.default_input')}</option>
                                    {availableInputs.map(device => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || getAudioLabel(device.deviceId)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-app-muted"><Volume2 size={12} />{t('modules:voice.dashboard.audio_output')}</span>
                                <select
                                    value={outputDeviceId || ''}
                                    onChange={(e) => setOutputDeviceId(e.target.value || null)}
                                    className="min-h-11 w-full rounded-lg border border-app-border bg-app-bg px-3 text-sm text-app-text focus:border-accent/60 focus:outline-none"
                                >
                                    <option value="">{t('modules:voice.dashboard.default_output')}</option>
                                    {availableOutputs.map(device => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {getAudioLabel(device.deviceId)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </Panneau>
                </div>

                {/* ── À droite : le signal et les effets, en deux groupes ── */}
                <aside className="flex w-80 shrink-0 flex-col overflow-y-auto pr-1 custom-scrollbar">
                    <Panneau className="flex flex-col gap-2 p-3">
                        <p className={titreDeColonne}><SlidersHorizontal size={15} className="text-accent" />{t('modules:voice.ui.signal')}</p>

                        <p className={`${sousTitre} flex items-center gap-1.5`}><ShieldCheck size={12} />01 · {t('modules:voice.ui.group_clean')}</p>
                        <Interrupteur actif={currentEffects.antiLarsen} onClick={() => toggleAntiLarsen()} libelle={t('modules:voice.shapers.anti_larsen')} aide={t('modules:voice.ui.anti_larsen_hint')} />

                        {/*
                          **Le débruitage : UN réglage, trois positions.** Deux interrupteurs
                          auraient laissé empiler le débruiteur du navigateur et RNNoise —
                          *deux débruiteurs qui se suivent, ce n'est pas mieux, c'est pire.*
                        */}
                        <div className="rounded-lg border border-app-border bg-app-bg/40 p-2.5">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-app-text">{t('modules:voice.shapers.noise_suppression')}</span>
                                {/* La pastille de voix ne s'affiche que quand le modèle tourne :
                                    *une pastille éteinte se lit comme « il ne parle pas », pas
                                    comme « personne n'écoute ».* */}
                                {currentEffects.debruitage === 'neuronal' && (
                                    <span
                                        title={t('modules:voice.shapers.voice_detected')}
                                        className={`h-2 w-2 rounded-full transition-colors ${probabiliteDeVoix > 0.6 ? 'bg-etat-succes' : 'bg-app-surface-2'}`}
                                    />
                                )}
                            </div>
                            <div className="flex overflow-hidden rounded-md border border-app-border">
                                {(['aucun', 'navigateur', 'neuronal'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setDebruitage(mode)}
                                        aria-pressed={currentEffects.debruitage === mode}
                                        className={`flex-1 px-1 py-1.5 text-ui-9 font-black uppercase tracking-wide transition-colors ${currentEffects.debruitage === mode ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:text-app-text'}`}
                                    >
                                        {t(`modules:voice.shapers.debruitage_${mode}`)}
                                    </button>
                                ))}
                            </div>
                            {/* Ce que fait le mode choisi, écrit, pas survolé : *une infobulle
                                ne se lit que par quelqu'un qui soupçonne déjà.* */}
                            <p className="mt-2 text-ui-10 leading-snug text-app-muted">
                                {t(`modules:voice.shapers.debruitage_${currentEffects.debruitage}_hint`)}
                            </p>
                        </div>

                        <Interrupteur actif={currentEffects.noiseGate} onClick={() => toggleNoiseGate()} libelle={t('modules:voice.shapers.noise_gate')} aide={t('modules:voice.ui.gate_hint', { db: currentEffects.gateThreshold })}>
                            {/* Toujours offert, atténué quand la porte est coupée : on le règle avant de l'allumer. */}
                            <div className={`mt-2 transition-opacity ${currentEffects.noiseGate ? '' : 'opacity-50'}`}>
                                    <VocalShaperSlider
                                        label={t('modules:voice.params.gate_threshold')}
                                        value={currentEffects.gateThreshold}
                                        min={-100} max={0} step={1}
                                        onChange={(val) => updateEffect('gateThreshold', val)}
                                        unit=" dB"
                                    />
                            </div>
                        </Interrupteur>

                        <Interrupteur actif={currentEffects.duckingEnabled} onClick={() => toggleDucking()} libelle={t('modules:voice.shapers.auto_ducking')} aide={t('modules:voice.ui.ducking_hint', { pct: Math.round((1 - currentEffects.duckingRange) * 100) })}>
                            {/* Les quatre réglages restent offerts, ducking coupé compris : c'est en
                                les retouchant qu'on rattrape une soirée (garde : e2e/voiceOs.spec.ts). */}
                            <div className={`mt-2 flex flex-col gap-1.5 transition-opacity ${currentEffects.duckingEnabled ? '' : 'opacity-50'}`}>
                                    <VocalShaperSlider label={t('modules:voice.params.ducking_threshold')} value={currentEffects.duckingThreshold} min={-80} max={-10} step={1} onChange={(val) => updateEffect('duckingThreshold', val)} unit=" dB" />
                                    <VocalShaperSlider label={t('modules:voice.params.music_reduct')} value={Math.round((1 - currentEffects.duckingRange) * 100)} min={0} max={100} step={5} onChange={(val) => updateEffect('duckingRange', 1 - (val / 100))} unit=" %" />
                                    <VocalShaperSlider label={t('modules:voice.params.release_delay')} value={currentEffects.duckingRelease} min={0} max={3000} step={100} onChange={(val) => updateEffect('duckingRelease', val)} unit=" ms" />
                                    <VocalShaperSlider label={t('modules:voice.params.fade_speed')} value={currentEffects.duckingAttack} min={50} max={1000} step={50} onChange={(val) => updateEffect('duckingAttack', val)} unit=" ms" />
                            </div>
                        </Interrupteur>

                        <p className={`${sousTitre} mt-3 flex items-center gap-1.5`}><SlidersHorizontal size={12} />02 · {t('modules:voice.ui.group_shapers')}</p>
                        <VocalShaperSlider label={t('modules:voice.shapers.pitch')} value={currentEffects.pitch} min={-12} max={12} onChange={(val) => updateEffect('pitch', val)} unit=" st" />
                        <VocalShaperSlider label={t('modules:voice.shapers.formant')} value={currentEffects.formant} min={-100} max={100} onChange={(val) => updateEffect('formant', val)} />
                        <VocalShaperSlider label={t('modules:voice.shapers.reverb')} value={currentEffects.reverb} min={0} max={1} step={0.01} onChange={(val) => updateEffect('reverb', val)} />
                        <VocalShaperSlider label={t('modules:voice.shapers.distortion')} value={currentEffects.distortion} min={0} max={1} step={0.01} onChange={(val) => updateEffect('distortion', val)} />
                        <VocalShaperSlider label={t('modules:voice.shapers.compression')} value={currentEffects.compression} min={0} max={100} step={5} unit=" %" onChange={(val) => updateEffect('compression', val)} />
                        <VocalShaperSlider label={t('modules:voice.shapers.bitcrush')} value={currentEffects.bitcrush} min={0} max={1} step={0.01} onChange={(val) => updateEffect('bitcrush', val)} />

                        <p className={`${sousTitre} mt-3 flex items-center gap-1.5`}><Volume2 size={12} />03 · {t('modules:voice.dashboard.master_output')}</p>
                        <VocalShaperSlider label={t('modules:voice.params.output_gain')} value={currentEffects.outputGain} min={0} max={2} step={0.05} onChange={(val) => updateEffect('outputGain', val)} unit="×" />
                    </Panneau>
                </aside>
            </div>
        </div>
    );
};

export default VoiceDashboard;
