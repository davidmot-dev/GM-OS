import React from 'react';
import { RefreshCw, RotateCcw, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLightStore } from '../useLightStore';
import { hueEngine } from '../HueEngine';
import { useVoiceStore } from '../../voice/useVoiceStore';
import { useTuilesVisibles } from '../hooks/useTuilesVisibles';
import { gmConfirm } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { Panneau } from '../../../components/socle';
import SelecteurDEffet from './SelecteurDEffet';
import { ListeDesLampes } from './ListeDesLampes';

const titreDeSection = 'text-ui-11 font-semibold text-app-muted uppercase tracking-widest';

/** Un interrupteur : la piste et sa pastille. La couleur d'état se passe en `ton`. */
const Interrupteur: React.FC<{ actif: boolean; ton?: string }> = ({ actif, ton = 'bg-accent' }) => (
    <span className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${actif ? ton : 'bg-app-surface-2 border border-app-border'}`}>
        <span className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-fixe-blanc shadow transition-all ${actif ? 'left-[1.15rem]' : 'left-0.5'}`} />
    </span>
);

/**
 * **Le panneau de réglages de Light-OS** — refonte, phase 4, L2, étape 2
 * (2026-10-02), la maquette retenue le 2026-09-26 (`documentation/Planning/
 * stitch/lumiere/`). De haut en bas : le pont et ce qui pilote les lampes à
 * leur place (la synchro, la voix), l'intensité globale, **les lampes en liste
 * verticale**, l'éclairage normal dans son propre bloc, puis la préparation, et
 * le blackout d'urgence en pied.
 *
 * Il réunit l'ancien panneau de gauche et la barre du haut. ⚠️ **La synchro des
 * modules y figurait DEUX fois** (« Synchro avec l'audio » à gauche, « Synchro
 * des modules » en haut) : c'était le même réglage, `isSyncEnabled`, sous deux
 * noms. Il n'en reste qu'un, en tête. *Deux interrupteurs pour un même
 * réglage, c'est un piège : on croit en avoir deux.*
 */
export const ReglagesDeLumiere: React.FC = () => {
    const {
        status, bridgeIp, globalBrightness, setGlobalBrightness, suivreLaVoix, setSuivreLaVoix,
        defaultSceneId, setDefaultScene, isSyncEnabled, setSyncEnabled, reset,
    } = useLightStore();
    /*
      **On dit pourquoi le mode ne fait rien, plutôt que de le rendre
      inaccessible.** Armé micro coupé, il attend sans rien montrer : un
      interrupteur qui reste sans effet sans expliquer se fait prendre pour une
      panne. C'est la règle des trois points du repli de séance, vue de l'autre
      côté.
    */
    const voixActive = useVoiceStore(e => e.isActive);
    const { t } = useTranslation('modules');

    /*
      **Les seules scènes qui peuvent servir de repli** : celles qui portent un
      état, et que la campagne ouverte laisse voir.

      ⚠️ **La désignation en cours reste offerte même si elle appartient à une
      autre campagne.** `defaultSceneId` est global et **il agit** — le Stop All
      et les retours automatiques y mènent. La masquer donnerait un réglage qui
      commande les lampes sans apparaître nulle part, et que le meneur ne
      pourrait donc pas changer. *Un réglage qui agit doit rester visible ;
      c'est ce qui le distingue d'une panne.*
    */
    const { pourLeRepli } = useTuilesVisibles();
    const scenesCapturees = [...pourLeRepli].sort((a, b) => a.id.localeCompare(b.id));

    /*
      ⛔ **La porte de l'atelier — posée le 2026-09-21, un jour après l'atelier
      lui-même.** L'écran des effets ne s'ouvrait que depuis une **lampe** :
      sans pont branché ni mode simulé, il n'y a aucune lampe à l'écran, donc
      **pas d'atelier** — alors qu'il sait très bien composer un effet sans
      elles. *Une fonctionnalité qu'on ne peut pas atteindre n'existe pas.*

      ⚠️ **C'est le même écran, pas une copie.** Ouvert d'ici, il ne peut
      simplement pas *poser* d'effet — il n'y a personne à qui le poser — et il
      le dit.
    */
    const [atelierOuvert, setAtelierOuvert] = React.useState(false);

    /** La relecture est-elle en vol ? Le pont peut mettre une seconde à répondre. */
    const [relectureEnCours, setRelectureEnCours] = React.useState(false);

    /**
     * **Aller redemander au pont ce qu'éclairent vraiment les lampes.**
     *
     * GM-OS ne tenait que le compte de ce qu'il avait lui-même envoyé. Le
     * meneur, lui, règle aussi sa pièce depuis son téléphone — et tout ce qui
     * lit le miroir (les curseurs des lampes, et surtout la **capture** d'une
     * tuile) travaillait alors sur une pièce d'hier.
     *
     * ⚠️ On ne le fait **pas** tout seul, en boucle : le pont tient de l'ordre
     * de dix commandes par seconde et les effets logiciels en consomment déjà.
     * *C'est un geste du meneur, au moment où il le veut.*
     */
    const relire = async () => {
        if (relectureEnCours) return;
        /*
          On dit pourquoi le bouton ne fait rien plutôt que de l'éteindre : un
          bouton inerte et muet se fait prendre pour une panne.
        */
        if (status !== 'connected') {
            gmToast(t('light.top.reread_offline'), 'warning');
            return;
        }
        setRelectureEnCours(true);
        try {
            await hueEngine.relireLesLampes();
            const nombre = Object.keys(useLightStore.getState().lights).length;
            gmToast(t('light.top.reread_done', { nombre }), 'success');
        } catch {
            gmToast(t('light.top.reread_failed'), 'error');
        } finally {
            setRelectureEnCours(false);
        }
    };

    const handlePair = async () => {
        if (!bridgeIp) {
            console.log("No IP to pair");
            return;
        }
        await useLightStore.getState().setConnection('pairing');

        // Poll for 30 seconds (every 2 seconds)
        let attempts = 0;
        const maxAttempts = 15;

        const tryPair = async () => {
            try {
                const token = await hueEngine.pair(bridgeIp);
                if (token) {
                    await useLightStore.getState().setConnection('connected', bridgeIp, token);
                    await hueEngine.fetchLights();
                    return true;
                }
            } catch (e: unknown) {
                if (e instanceof Error && e.message === "LINK_BUTTON_NOT_PRESSED") {
                    // Expected during polling
                } else {
                    console.error("Pairing error", e);
                }
            }
            return false;
        };

        const poll = setInterval(async () => {
            attempts++;
            const success = await tryPair();
            if (success) {
                clearInterval(poll);
            } else if (attempts >= maxAttempts) {
                clearInterval(poll);
                await useLightStore.getState().setConnection('disconnected');
                alert(t('light.sidebar.prompt_timeout'));
            }
        }, 2000);

        // Immediate first try
        const success = await tryPair();
        if (success) clearInterval(poll);
    };

    const handleDiscover = async () => {
        await useLightStore.getState().setConnection('discovering');
        const ip = await hueEngine.discoverBridge();
        if (ip) {
            await useLightStore.getState().setConnection('disconnected', ip);
            // Auto try pair? No, user should click pair which tells them to press button.
        } else {
            await useLightStore.getState().setConnection('disconnected');
            alert(t('light.sidebar.prompt_no_bridge'));
        }
    };

    const boutonSecondaire = 'flex items-center justify-center gap-1.5 rounded-lg border border-app-border bg-app-bg/50 px-2 py-2 text-ui-10 font-bold uppercase tracking-widest text-app-muted hover:text-app-text hover:border-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <>
            {/* Le pont, et ce qui pilote les lampes à la place du meneur */}
            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="material-symbols-outlined text-accent">hub</span>
                        <div className="flex min-w-0 flex-col">
                            <h2 className={titreDeSection}>{t('light.sidebar.hue_bridge')}</h2>
                            {bridgeIp && <span className="truncate text-xs text-app-subtle">{bridgeIp}</span>}
                        </div>
                    </div>
                    <span className={`shrink-0 text-ui-9 font-black uppercase tracking-widest ${status === 'connected' ? 'text-etat-succes' : status === 'mock' ? 'text-etat-alerte' : 'text-app-subtle'}`}>
                        {t(`light.agencement.pont_${status}`)}
                    </span>
                </div>

                {/*
                  **La synchro des autres modules — l'interrupteur que le guide
                  promettait depuis toujours.**

                  ⛔ `isSyncEnabled` était lu **dix fois**, dans Sound-OS,
                  Music-OS et Ambient-OS, persisté, et **aucun écran ne
                  l'écrivait** : il valait `true` à jamais. *La chaîne entière
                  était là, il manquait le bouton au bout.*
                */}
                <button
                    onClick={() => setSyncEnabled(!isSyncEnabled)}
                    aria-pressed={isSyncEnabled}
                    title={isSyncEnabled ? t('light.top.sync_on_tooltip') : t('light.top.sync_off_tooltip')}
                    className="flex items-center justify-between gap-3 text-left"
                >
                    <span className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-lg ${isSyncEnabled ? 'text-gm-violet animate-pulse' : 'text-app-subtle'}`}>sync</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-app-text">{t('light.top.sync')}</span>
                    </span>
                    <Interrupteur actif={isSyncEnabled} />
                </button>

                {/* Voice-to-Light — jalon d'avril 2026 */}
                <button
                    onClick={() => setSuivreLaVoix(!suivreLaVoix)}
                    aria-pressed={suivreLaVoix}
                    className="flex items-center justify-between gap-3 text-left"
                >
                    <span className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-lg ${suivreLaVoix ? 'text-accent' : 'text-app-subtle'}`}>graphic_eq</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-app-text">{t('light.sidebar.suivre_la_voix')}</span>
                    </span>
                    <Interrupteur actif={suivreLaVoix} />
                </button>
                {suivreLaVoix && !voixActive && (
                    <p className="text-ui-11 text-etat-alerte/90">{t('light.sidebar.suivre_la_voix_sans_micro')}</p>
                )}
                {suivreLaVoix && (
                    <p className="text-ui-11 text-app-subtle">{t('light.sidebar.suivre_la_voix_note')}</p>
                )}
            </Panneau>

            {/* L'intensité globale */}
            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h2 className={titreDeSection}>{t('light.sidebar.global_intensity')}</h2>
                    <span className="font-mono text-lg font-black text-accent">{globalBrightness}%</span>
                </div>
                <input
                    type="range"
                    min="0" max="100"
                    value={globalBrightness}
                    onChange={(e) => setGlobalBrightness(parseInt(e.target.value))}
                    aria-label={t('light.sidebar.global_intensity')}
                    className="w-full h-1.5 bg-app-bg rounded-full appearance-none cursor-pointer accent-accent"
                />
            </Panneau>

            {/* Les lampes, en liste verticale */}
            <ListeDesLampes />

            {/*
              **L'éclairage normal de la pièce, dans son propre bloc.** Il
              répond à la question *que devient la lumière quand on arrête
              tout ?* — et ⛔ ce n'est PAS « Arrêter la scène », qui vit dans
              la barre des gestes : l'un choisit où la pièce revient, l'autre
              coupe la scène en cours. Le premier tour de Stitch les avait
              fusionnés en un seul bouton.

              Seules les scènes **capturées** sont offertes : une tuile vide
              ne porte l'état d'aucune lampe, la choisir pour repli donnerait
              un réglage qui ne fait rien.
            */}
            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-2">
                <h2 className={titreDeSection}>{t('light.sidebar.default_scene')}</h2>
                <select
                    value={defaultSceneId ?? ''}
                    onChange={(e) => setDefaultScene(e.target.value || null)}
                    aria-label={t('light.sidebar.default_scene')}
                    className="bg-app-bg border border-app-border rounded-lg px-3 py-2 text-sm font-bold text-app-text focus:ring-0 focus:border-accent/50 outline-none cursor-pointer transition-colors"
                >
                    <option value="">{t('light.sidebar.default_scene_none')}</option>
                    {scenesCapturees.map(scene => (
                        <option key={scene.id} value={scene.id}>{scene.name}</option>
                    ))}
                </select>
                <p className="text-ui-10 text-app-subtle leading-snug">
                    {defaultSceneId
                        ? t('light.sidebar.default_scene_hint')
                        : t('light.sidebar.default_scene_hint_none')}
                </p>
            </Panneau>

            {/* La préparation : ce qui ne se touche pas en pleine scène */}
            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-3">
                <h2 className={titreDeSection}>{t('light.agencement.preparation')}</h2>

                {/* Découvrir et appairer n'ont de sens que pont déconnecté. */}
                {status !== 'connected' && (
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleDiscover} className={boutonSecondaire}>
                            {t('light.sidebar.discover')}
                        </button>
                        <button onClick={handlePair} disabled={!bridgeIp} className={boutonSecondaire}>
                            {t('light.sidebar.pair_key')}
                        </button>
                    </div>
                )}
                {(status === 'connected' || bridgeIp) && (
                    <div className="grid grid-cols-2 gap-2">
                        {status === 'connected' && (
                            <button
                                onClick={async () => await useLightStore.getState().setConnection('disconnected', null, null)}
                                className={`${boutonSecondaire} hover:text-etat-danger hover:border-etat-danger/40`}
                            >
                                {t('light.sidebar.disconnect')}
                            </button>
                        )}
                        {bridgeIp && (
                            <button
                                onClick={async () => {
                                    if (window.confirm(t('light.sidebar.forget_confirm'))) {
                                        await useLightStore.getState().forgetBridge();
                                    }
                                }}
                                className={boutonSecondaire}
                            >
                                {t('light.sidebar.forget_bridge')}
                            </button>
                        )}
                    </div>
                )}

                {/*
                  **Le mode simulé, renommé.** Il s'appelait « Synchro Simulée » :
                  le meneur qui suivait le guide — *« désactivez le bouton Sync »* —
                  **débranchait son pont Hue** au lieu de couper la synchro.
                  *Deux réglages dont l'un porte le nom de l'autre, c'est un
                  piège, pas une étiquette maladroite.*
                */}
                <button
                    onClick={() => {
                        if (useLightStore.getState().status === 'mock') {
                            useLightStore.getState().setConnection('disconnected');
                        } else {
                            useLightStore.getState().setConnection('mock');
                        }
                    }}
                    aria-pressed={status === 'mock'}
                    title={t('light.top.mock_mode_tooltip')}
                    className="flex items-center justify-between gap-3 text-left"
                >
                    <span className={`text-xs font-bold uppercase tracking-widest ${status === 'mock' ? 'text-etat-alerte' : 'text-app-text'}`}>
                        {t('light.top.mock_mode')}
                    </span>
                    <Interrupteur actif={status === 'mock'} ton="bg-etat-alerte" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setAtelierOuvert(true)}
                        title={t('light.top.atelier_tooltip')}
                        className={boutonSecondaire}
                    >
                        <Wand2 size={12} /> {t('light.top.atelier')}
                    </button>
                    <button
                        onClick={relire}
                        disabled={relectureEnCours}
                        title={t('light.top.reread_tooltip')}
                        className={boutonSecondaire}
                    >
                        <RefreshCw size={12} className={relectureEnCours ? 'animate-spin' : ''} /> {t('light.top.reread')}
                    </button>
                </div>

                <button
                    onClick={() => gmConfirm(t('light.top.reset_confirm'), () => reset())}
                    title={t('light.top.reset_tooltip')}
                    className="flex items-center justify-center gap-2 rounded-lg border border-etat-danger/20 bg-etat-danger/5 py-2 text-ui-10 font-bold uppercase tracking-widest text-etat-danger/70 hover:bg-etat-danger/15 hover:text-etat-danger transition-colors"
                >
                    <RotateCcw size={12} /> {t('light.top.reset_module')}
                </button>
            </Panneau>

            {atelierOuvert && (
                <SelecteurDEffet
                    effetActuel=""
                    nomDeLaLampe=""
                    onFermer={() => setAtelierOuvert(false)}
                />
            )}

            {/* Le blackout d'urgence, en pied, toujours atteignable */}
            <button
                onClick={() => hueEngine.extinguishAll()}
                className="sticky bottom-0 mt-auto w-full shrink-0 py-4 bg-etat-danger hover:bg-etat-danger/90 text-app-bg rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl"
            >
                <span className="material-symbols-outlined">power_settings_new</span>
                {t('light.sidebar.emergency_blackout')}
            </button>
        </>
    );
};
