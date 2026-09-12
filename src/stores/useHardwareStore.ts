import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DisplayInfo } from '../modules/image/types';
import {
    signatureDeLaSortie, signatureDeLEcran, migrerLesAlias, retrouverLaSortie,
    type VerdictDeSortie,
} from '../utils/signatureDuMateriel';

/**
 * **Les noms que le meneur donne à ses enceintes et à ses écrans.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUI SE PERDAIT — ET CE N'ÉTAIT PAS LA SAUVEGARDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * David, le 2026-09-12 : *« est-il possible de garder les noms que j'attribue
 * aux sorties audio, aux écrans ou autre quand je rallume GM-OS »*.
 *
 * **Ils étaient déjà persistés**, et depuis toujours. Ce qui bougeait, c'est la
 * **clé** : le `deviceId` change au rebranchement d'une enceinte, et le
 * `display.id` est réattribué par le système au redémarrage. *Le nom restait
 * rangé sous l'ancienne clé, et GM-OS cherchait la nouvelle.*
 *
 * ⭐ Les alias sont désormais rangés sous une **signature stable** — le libellé
 * Windows nettoyé de sa numérotation, la géométrie pour un écran. Voir
 * `utils/signatureDuMateriel.ts`, qui porte le détail et ses limites.
 *
 * ⚠️ **La relecture essaie les deux clés**, et la migration n'efface jamais
 * l'ancienne : *une migration qui perd ce qu'elle ne comprend pas est une perte
 * déguisée en nettoyage.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ ET LE REPLI NE JOUAIT PAS NON PLUS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `audioDevices` et `displays` n'étaient remplies que **par l'écran des
 * Paramètres**. Partout ailleurs — Ambient-OS, Image-OS, le storyboard — un
 * identifiant sans alias s'affichait donc **« Périphérique Inconnu »** au lieu
 * du nom Windows, qui était pourtant à portée d'un appel. `recenserLeMateriel`
 * est là pour ça, et le démarrage l'appelle.
 */

export interface AudioDeviceInfo {
    deviceId: string;
    label: string;
    kind: 'audiooutput';
}

interface HardwareState {
    audioDevices: AudioDeviceInfo[];
    displays: DisplayInfo[];
    /** signature stable → nom donné par le meneur (les anciennes clés survivent). */
    audioAliases: Record<string, string>;
    displayAliases: Record<string, string>;
    /**
     * **`deviceId` → la signature qu'il portait la dernière fois qu'on l'a vu.**
     *
     * ⛔ **C'est ce carnet qui rend le routage réparable, et il n'existait pas.**
     * Un moment de storyboard mémorise `ambientOutputId: '22ad7d4a…'` et rien
     * d'autre : le jour où cet identifiant change, plus rien ne relie le choix
     * du meneur à une enceinte réelle. *On ne peut pas retrouver un appareil
     * dont on n'a gardé qu'un numéro qui a changé.*
     *
     * ⭐ Le noter à chaque recensement évite de modifier le format de **tous**
     * les endroits qui enregistrent une sortie — pads, scènes d'ambiance,
     * moments — ce qui aurait été une migration de données dans six magasins.
     *
     * ⚠️ Il ne vaut que pour les appareils vus **au moins une fois** depuis que
     * ce carnet existe : un choix fait avant, sur une enceinte jamais rebranchée
     * depuis, reste irrécupérable. *Un filet posé aujourd'hui ne rattrape pas
     * ce qui est tombé hier.*
     */
    signaturesConnues: Record<string, string>;

    // Actions
    fetchAudioDevices: () => Promise<void>;
    fetchDisplays: () => Promise<void>;
    /** Les deux d'un coup, puis la migration des alias. À appeler au démarrage. */
    recenserLeMateriel: () => Promise<void>;
    setAudioAlias: (deviceId: string, alias: string) => void;
    setDisplayAlias: (displayId: string, alias: string) => void;

    // Selectors
    getAudioLabel: (deviceId: string) => string;
    getDisplayLabel: (displayId: string) => string;
    /**
     * **Le nom donné par le meneur, et rien d'autre** — vide s'il n'en a pas donné.
     *
     * ⛔ **À ne pas confondre avec `getAudioLabel`**, qui retombe sur le libellé
     * Windows. Un champ de saisie qui afficherait ce repli ferait croire au
     * meneur qu'il a déjà nommé l'appareil, et effacerait le nom système dès
     * qu'il toucherait une touche.
     */
    aliasDeLaSortie: (deviceId: string) => string;
    aliasDeLEcran: (displayId: string) => string;
    /** Quelle sortie employer pour un identifiant enregistré — voir `retrouverLaSortie`. */
    sortieAEmployer: (deviceId: string | null | undefined) => VerdictDeSortie;
}

export const useHardwareStore = create<HardwareState>()(
    persist(
        (set, get) => ({
            audioDevices: [],
            displays: [],
            audioAliases: {},
            displayAliases: {},
            signaturesConnues: {},

            fetchAudioDevices: async () => {
                if (!navigator.mediaDevices) {
                    console.warn('[HardwareStore] navigator.mediaDevices is undefined. Insecure context or restricted browser.');
                    return;
                }
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const outputs = devices
                        .filter(d => d.kind === 'audiooutput')
                        .map(d => ({
                            deviceId: d.deviceId,
                            label: d.label || (d.deviceId === 'default' ? 'Système par défaut' : `Sortie ${d.deviceId.slice(0, 4)}`),
                            kind: 'audiooutput' as const
                        }));
                    /*
                      **On note au passage la signature de chaque sortie vue.**
                      C'est la seule occasion de la relever : quand l'appareil
                      sera débranché, il n'y aura plus rien à lire.
                    */
                    const connues = { ...get().signaturesConnues };
                    for (const sortie of outputs) {
                        const sig = signatureDeLaSortie(sortie);
                        if (sig) connues[sortie.deviceId] = sig;
                    }

                    set({ audioDevices: outputs, signaturesConnues: connues });
                } catch (error) {
                    console.error('[HardwareStore] Failed to fetch audio devices:', error);
                }
            },

            fetchDisplays: async () => {
                if (window.appBridge?.image?.getDisplays) {
                    try {
                        const displays = await window.appBridge.image.getDisplays();
                        set({ displays });
                    } catch (error) {
                        console.error('[HardwareStore] Failed to fetch displays:', error);
                    }
                }
            },

            /**
             * **Recense le matériel présent, puis reclasse les alias.**
             *
             * ⚠️ *La migration a besoin de savoir ce qui est branché* : elle ne
             * peut calculer la signature que d'un appareil qu'elle voit. D'où
             * l'ordre — recenser d'abord, migrer ensuite — et le fait qu'elle
             * tourne **à chaque démarrage** plutôt qu'une fois : l'enceinte
             * absente hier sera peut-être là demain.
             */
            recenserLeMateriel: async () => {
                await Promise.all([get().fetchAudioDevices(), get().fetchDisplays()]);

                const { audioDevices, displays, audioAliases, displayAliases } = get();

                set({
                    audioAliases: migrerLesAlias(audioAliases, audioDevices, signatureDeLaSortie),
                    displayAliases: migrerLesAlias(displayAliases, displays, signatureDeLEcran),
                });
            },

            /*
              **On range sous la signature quand on sait la calculer**, sous
              l'identifiant sinon — un appareil anonyme vaut mieux qu'un nom
              perdu.
            */
            setAudioAlias: (deviceId, alias) => {
                const appareil = get().audioDevices.find(d => d.deviceId === deviceId);
                const cle = signatureDeLaSortie(appareil ?? { deviceId }) ?? deviceId;

                set((state) => ({ audioAliases: { ...state.audioAliases, [cle]: alias } }));
            },

            setDisplayAlias: (displayId, alias) => {
                const ecran = get().displays.find(d => d.id === displayId);
                const cle = (ecran && signatureDeLEcran(ecran)) ?? displayId;

                set((state) => ({ displayAliases: { ...state.displayAliases, [cle]: alias } }));
            },

            /*
              **Trois sources, dans cet ordre : le nom du meneur, le nom du
              système, puis l'aveu.** La signature d'abord, l'ancienne clé
              ensuite — les deux coexistent tant qu'un appareil n'a pas été
              revu depuis la migration.
            */
            getAudioLabel: (deviceId) => {
                const state = get();
                const appareil = state.audioDevices.find(d => d.deviceId === deviceId);
                const signature = signatureDeLaSortie(appareil ?? { deviceId });

                return (signature ? state.audioAliases[signature] : undefined)
                    ?? state.audioAliases[deviceId]
                    ?? appareil?.label
                    ?? (deviceId === 'default' ? 'Système par défaut' : 'Périphérique Inconnu');
            },

            getDisplayLabel: (displayId) => {
                const state = get();
                if (displayId === 'hub') return 'Player Hub';

                const ecran = state.displays.find(d => d.id === displayId);
                const signature = ecran ? signatureDeLEcran(ecran) : null;

                return (signature ? state.displayAliases[signature] : undefined)
                    ?? state.displayAliases[displayId]
                    ?? ecran?.label
                    ?? `Écran ${displayId}`;
            },

            /*
              ⛔ **Ces deux-là existent parce que j'ai cassé la saisie le
              2026-09-12.** Les champs des Réglages lisaient `aliases[id]` en
              direct pendant que `setAlias` écrivait sous la signature : on
              tapait, rien ne s'affichait, **le champ refusait la frappe**.

              *Un lecteur et un écrivain qui n'emploient pas la même clé sont
              pires que deux écrivains : personne ne voit rien, et rien ne
              plante.* La résolution vit donc ici, une fois, pour les deux sens.
            */
            aliasDeLaSortie: (deviceId) => {
                const state = get();
                const appareil = state.audioDevices.find(d => d.deviceId === deviceId);
                const signature = signatureDeLaSortie(appareil ?? { deviceId });

                return (signature ? state.audioAliases[signature] : undefined)
                    ?? state.audioAliases[deviceId]
                    ?? '';
            },

            aliasDeLEcran: (displayId) => {
                const state = get();
                const ecran = state.displays.find(d => d.id === displayId);
                const signature = ecran ? signatureDeLEcran(ecran) : null;

                return (signature ? state.displayAliases[signature] : undefined)
                    ?? state.displayAliases[displayId]
                    ?? '';
            },

            sortieAEmployer: (deviceId) => {
                const { audioDevices, signaturesConnues } = get();
                return retrouverLaSortie(deviceId, audioDevices, signaturesConnues[deviceId ?? '']);
            },
        }),
        {
            name: 'gmos-hardware-storage',
            partialize: (state) => ({
                audioAliases: state.audioAliases,
                displayAliases: state.displayAliases,
                signaturesConnues: state.signaturesConnues
            })
        }
    )
);
