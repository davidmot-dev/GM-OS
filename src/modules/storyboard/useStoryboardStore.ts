import { create } from 'zustand';
import { laSceneQueLAmbianceOuvre } from '../session/logic/trame';
import { envoyerLeTitre, normaliserLeTitre } from './titreProjete';
import {
    cequUnArretEteint, cequUnePriseDeMainEteint, eteindreLesSons,
    ilYAQuelqueChoseAEteindre, lesSonsAnnoncesPar, AUCUN_SON, type SonsDuMoment,
} from './sonsDuMoment';
import type { Scene } from '../../types/trame.types';
import { persist } from 'zustand/middleware';
import {
    resumeDuMoment, traceDuMoment, type EffetDuMoment,
} from './logic/rapportDuMoment';
import { Logger } from '../../utils/logger';
/*
  ⛔ **Importé, et non lu sur `window` — c'est le défaut du 2026-09-12.**

  Ce fichier lisait `gWindow.useToastStore?.getState()`, qui n'est **assigné
  nulle part**. Les deux `if (gmToast)` qui suivaient ne passaient donc jamais :
  ni « Musique introuvable », ni « Moment activé » ne sont jamais sortis. *Une
  garde qui n'est jamais franchie ressemble à un code qui marche.*
*/
import { gmToast } from '../../stores/useToastStore';

export interface StoryboardMoment {
    id: string;
    name: string;
    description: string;
    color: string; // UI accent color
    icon: string;
    
    // Actions to trigger
    musicPadId?: string;       // Music-OS Pad
    lightSceneId?: string;     // Light-OS Scene
    mapUrl?: string;           // Atlas-OS Map URL
    isMapVideo?: boolean;
    imageMediaId?: string;     // Image-OS Media ID
    soundPadId?: string;       // Sound-OS Pad ID
    ambientSceneId?: string;   // Ambient-OS Scene ID

    /*
      **Où ça sort — demandé par David le 2026-08-31.**

      *« Dans une séquence de storyboard, est-ce qu'on peut choisir sur quelle
      sortie une musique, un son, une ambiance doit être jouée ? Même chose pour
      la projection d'image, sur quel écran je la projette. »*

      Quatre champs facultatifs, et **l'absence veut dire « comme avant »** : le
      module joue sur sa sortie, l'image part sur l'écran choisi dans Image-OS.
      Un moment écrit avant ce jour se comporte donc exactement comme la veille.

      Ce ne sont pas des réglages de module déguisés : ils appartiennent au
      **moment**, parce que c'est le moment qui sait que ce grondement-là doit
      sortir sous la table pendant que la musique reste devant.
    */
    /** Sortie audio de la musique du moment. Absent : celle de Music-OS. */
    musicOutputId?: string;
    /** Sortie audio du bruitage. Absent : celle de Sound-OS. */
    soundOutputId?: string;
    /** Sortie audio de l'ambiance. Absent : celle d'Ambient-OS. */
    ambientOutputId?: string;
    /** Écran de projection de l'image. Absent : la cible courante d'Image-OS. */
    imageTarget?: string;

    /*
      **Le titre du moment — demandé par David le 2026-08-31.**

      *« Un texte qui s'affichera en titre sur l'écran choisi pour l'image, avec
      un fade-in / fade-out configurable (en seconde ou permanent). »*

      Il part sur **le même écran que l'image** : c'est un titre *sur* ce qu'on
      montre, pas une notification. Voir `titreProjete.ts`.
    */
    /** Le texte affiché en titre. Absent ou vide : aucun titre. */
    titre?: string;
    /** Durée du fondu, d'entrée comme de sortie, en secondes. */
    titreFondu?: number;
    /** Combien de temps il reste. **Absent ou nul : permanent.** */
    titreDuree?: number;

    campaignId: string;
}

/** Ce que la table montrait avant qu'un moment ne prenne la main. */
export interface ImageAvantLeMoment {
    mapUrl: string | null;
    mapName: string | null;
    isVideo: boolean;
}

interface StoryboardState {
    moments: StoryboardMoment[];
    activeMomentId: string | null;
    /**
     * L'image de la scène, mise de côté le temps du moment.
     *
     * **Un moment est une parenthèse, pas un remplacement.** Demande de David du
     * 2026-08-17 : quand le moment commence, son image prend la place de celle
     * de la scène ; quand il s'arrête, **on revient à l'image de la scène**.
     * Sans cette mémoire, arrêter une ambiance laisserait la table sur son décor
     * — et le meneur devrait retrouver à la main le lieu qu'il avait projeté.
     *
     * `null` quand aucun moment ne tourne, ou quand le moment ne portait pas
     * d'image : il n'y a alors rien eu à remplacer, donc rien à rendre.
     */
    imageAvantLeMoment: ImageAvantLeMoment | null;

    /**
     * **L'écran sur lequel le moment en cours a posé son image.**
     *
     * *Demandé par David le 2026-08-31 : « quand je lance une autre séquence, tu
     * dois aussi éteindre l'image en fade out de la séquence précédente ».*
     *
     * Sans cette trace, on saurait qu'une image traîne mais pas **où** : un
     * moment peut viser le Player Hub, le suivant un moniteur, et éteindre le
     * mauvais écran laisserait la table sur l'image d'avant. *Retenir la cible
     * coûte un champ ; la deviner coûte un écran faux en pleine scène.*
     *
     * Volatile à dessein : elle ne décrit pas le moment, elle décrit ce qui est
     * affiché maintenant.
     */
    cibleDeLImageDuMoment: string | null;

    /**
     * **Ce que le moment en cours a posé sur les trois moteurs de son.**
     *
     * *Défaut trouvé par David le 2026-09-02 : « quand je passe d'une séquence à
     * l'autre, l'ancienne ambiance ne s'arrête pas ».*
     *
     * Le pendant sonore de `cibleDeLImageDuMoment` : sans cette trace on saurait
     * qu'une ambiance tourne, mais pas **laquelle la séquence avait allumée** —
     * et tout couper emporterait ce que le meneur avait lancé à la main.
     *
     * Volatile à dessein, comme la cible de l'image : elle ne décrit pas le
     * moment, elle décrit ce qui sonne maintenant. Voir `sonsDuMoment.ts`.
     */
    sonsDuMoment: SonsDuMoment | null;

    // Actions
    addMoment: (moment: Omit<StoryboardMoment, 'id'>) => void;
    updateMoment: (id: string, updates: Partial<StoryboardMoment>) => void;
    deleteMoment: (id: string) => void;
    duplicateMoment: (id: string) => void;
    setMoments: (moments: StoryboardMoment[]) => void;
    triggerMoment: (id: string) => Promise<void>;
    /**
     * Referme la parenthèse : l'image de la scène revient.
     *
     * **On ne coupe que ce que le moment a posé.** La musique et les lumières
     * restent : le meneur les arrête quand il le décide, et les couper d'office
     * ferait tomber le silence sur la table pour un geste qui ne parlait que de
     * l'image.
     */
    arreterLeMoment: () => void;
    reset: () => void;
}

export const useStoryboardStore = create<StoryboardState>()(
    persist(
        (set, get) => ({
            moments: [],
            activeMomentId: null,
            imageAvantLeMoment: null,
            cibleDeLImageDuMoment: null,
            sonsDuMoment: null,

            arreterLeMoment: () => {
                const { imageAvantLeMoment, activeMomentId, moments } = get();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const gWindow = window as any;

                /*
                  **Un titre permanent s'en va avec son moment.** C'est ce qui le
                  rend utilisable : sans cette ligne, « permanent » voudrait dire
                  « jusqu'à ce que le meneur trouve comment l'enlever ».
                */
                /*
                  **L'image du moment s'en va avec lui.** Même règle que le titre
                  et que l'image de scène : *un moment est une parenthèse.*
                */
                const cibleDeLImage = get().cibleDeLImageDuMoment;
                if (cibleDeLImage) {
                    void import('../image/logic/ImageService')
                        .then(({ ImageService }) => ImageService.blackout(cibleDeLImage))
                        .catch(e => console.warn('[Storyboard] extinction de l’image impossible :', e));
                }

                const finissant = moments.find(m => m.id === activeMomentId);
                if (finissant?.titre) {
                    const cible = finissant.imageTarget
                        || (gWindow.useImageStore?.getState()?.projectionTarget as string)
                        || 'hub';
                    envoyerLeTitre(normaliserLeTitre({ cible, texte: '' }));
                }

                /*
                  **Le son du moment s'en va avec lui**, comme son image et son
                  titre — la musique exceptée, que le meneur arrête quand il le
                  décide (décision de David, reprise de celle du 2026-08-17 sur
                  les lumières). Voir `cequUnArretEteint`.
                */
                const sonsAEteindre = cequUnArretEteint(get().sonsDuMoment);
                if (ilYAQuelqueChoseAEteindre(sonsAEteindre)) {
                    void eteindreLesSons(sonsAEteindre);
                }

                if (imageAvantLeMoment && gWindow.useMapStore) {
                    gWindow.useMapStore.getState().setMap(
                        imageAvantLeMoment.mapUrl,
                        imageAvantLeMoment.isVideo,
                        imageAvantLeMoment.mapName ?? 'Sans titre',
                    );
                }
                set({
                    activeMomentId: null, imageAvantLeMoment: null,
                    cibleDeLImageDuMoment: null, sonsDuMoment: null,
                });
            },

            addMoment: (momentData) => set((state) => ({
                moments: [...state.moments, { ...momentData, id: crypto.randomUUID() }]
            })),

            updateMoment: (id, updates) => set((state) => ({
                moments: state.moments.map(m => m.id === id ? { ...m, ...updates } : m)
            })),

            deleteMoment: (id) => set((state) => ({
                moments: state.moments.filter(m => m.id !== id),
                activeMomentId: state.activeMomentId === id ? null : state.activeMomentId
            })),

            duplicateMoment: (id) => {
                const moment = get().moments.find(m => m.id === id);
                if (moment) {
                    const newMoment = { ...moment, id: crypto.randomUUID(), name: `${moment.name} (Copie)` };
                    set((state) => ({
                        moments: [...state.moments, newMoment]
                    }));
                }
            },

            setMoments: (moments) => set({ moments }),

            triggerMoment: async (id) => {
                const moment = get().moments.find(m => m.id === id);
                if (!moment) return;

                console.log(`[Storyboard] Triggering Moment: ${moment.name} (${id})`);
                set({ activeMomentId: id });

                /*
                  **Le journal nommait les effets, jamais le geste.** Un moment
                  écrivait « Musique : X », « Ambiance : X », « Lumières : X » —
                  trois lignes pour une intention, et pas une ne disait quel
                  moment avait été joué. Les trois modules se taisent désormais
                  quand c'est un moment qui les appelle ; celui-ci parle à leur
                  place, une fois. (2026-09-09)

                  ⚠️ On consigne **avant** d'orchestrer, comme `applyScene` : ce
                  qu'on note est l'intention du meneur, et elle ne devient pas
                  fausse si une piste manque à l'appel.

                  L'import est dynamique — le journal connaît les modules, les
                  modules ne doivent pas le connaître au chargement.
                */
                try {
                    const { useJournalStore } = await import('../journal/useJournalStore');
                    useJournalStore.getState().addEvent({
                        type: 'SYSTEM',
                        title: `Moment : ${moment.name}`,
                        content: `Moment de storyboard « ${moment.name} » joué à la table.`,
                        metadata: { momentId: id },
                    });
                } catch (e) {
                    /* Un témoin n'est pas une condition : sans lui, le moment se joue quand même. */
                    console.warn('[Storyboard] Journal indisponible :', e);
                }

                /*
                  **Ce que la séquence précédente faisait sonner s'arrête ici.**

                  *Défaut trouvé par David le 2026-09-02 : « quand je passe d'une
                  séquence à l'autre, l'ancienne ambiance ne s'arrête pas ».*

                  Le pendant sonore de l'extinction de l'image, plus bas : une
                  séquence est une parenthèse pour l'oreille comme pour l'œil.
                  `cequUnePriseDeMainEteint` dit quoi couper — et surtout ce
                  qu'il ne faut PAS couper parce qu'un moteur se relaie
                  lui-même. Voir `sonsDuMoment.ts`.

                  **On attend** : le bruitage qu'on arrête peut être celui que la
                  séquence qui arrive va relancer, et une extinction en retard le
                  tuerait dans l'œuf.
                */
                const sonsAEteindre = cequUnePriseDeMainEteint(
                    get().sonsDuMoment, lesSonsAnnoncesPar(moment));
                if (ilYAQuelqueChoseAEteindre(sonsAEteindre)) {
                    await eteindreLesSons(sonsAEteindre);
                }

                /*
                  **Ce que CE moment aura réellement posé**, et pas ce qu'il
                  annonce : chaque moteur y inscrit sa part quand il a joué. Une
                  musique introuvable ne doit rien laisser dans la trace, sinon
                  la séquence suivante irait couper une platine qui joue
                  autre chose. *Même règle que la cible de l'image.*
                */
                const sonsPoses: SonsDuMoment = { ...AUCUN_SON };

                /*
                  **Ce que chaque moteur aura fait de ce qu'on lui demandait.**

                  ⛔ Ajouté après l'incident du 2026-09-12 : une séquence à moitié
                  jouée, et **pas une ligne** dans le journal de l'application.
                  Chaque effet ci-dessous est un `if` : quand la condition tombe,
                  l'effet est sauté sans un mot. *Un `&&` qui protège est un `&&`
                  qui cache.* Voir `logic/rapportDuMoment.ts`.
                */
                const effets: EffetDuMoment[] = [];

                /*
                  **Lancer une ambiance ouvre la scène qui la déclare.**

                  Second marquage gratuit du § 3.1 du plan du 2026-08-08, resté
                  à l'état de projet jusqu'au 2026-08-20 :
                  `momentDeStoryboardId` n'était jamais que LU, pour afficher
                  l'ambiance à côté du titre.

                  *Si déclarer « on est maintenant dans la scène X » coûte plus
                  d'un clic, ce ne sera pas fait, et la trame pourrira en une
                  séance.* Lancer une ambiance est un geste que le meneur fait
                  déjà : il ne lui en coûte rien de plus.

                  `laSceneQueLAmbianceOuvre` porte les gardes — une seule
                  candidate ou rien, jamais une scène close, jamais celle qui
                  tourne déjà. Et l'échec est muet à dessein : une ambiance qui
                  n'ouvre aucune scène reste une ambiance qui marche.
                */
                try {
                    const os = (window as unknown as {
                        useSessionOSStore?: { getState: () => {
                            scenes?: Scene[]; activeCampaignId?: string | null;
                            ouvrirLaScene?: (id: string, seanceId?: string) => void;
                            sessions?: { id: string; campaignId: string; status: string }[];
                        } };
                    }).useSessionOSStore?.getState();
                    if (os?.ouvrirLaScene) {
                        const aOuvrir = laSceneQueLAmbianceOuvre(
                            os.scenes ?? [], os.activeCampaignId, id,
                        );
                        if (aOuvrir) {
                            const seance = (os.sessions ?? []).find(
                                x => x.campaignId === os.activeCampaignId && x.status === 'active');
                            os.ouvrirLaScene(aOuvrir, seance?.id);
                        }
                    }
                } catch {
                    // Une trame en mauvais état n'empêche pas de lancer une ambiance.
                }

                // Cross-store orchestration
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const gWindow = window as any;

                // 1. Music-OS
                if (moment.musicPadId) {
                    if (!gWindow.useMusicStore) {
                        effets.push({ nom: 'Musique', sort: 'module-absent' });
                    } else {
                        const musicStore = gWindow.useMusicStore.getState();
                        const pad = musicStore.playlists.flatMap((p: { pads: { id: string, label: string }[] }) => p.pads).find((p: { id: string }) => p.id === moment.musicPadId);

                        if (pad) {
                            console.log(`[Storyboard] Music: Found pad ${pad.label} (${pad.id}). Playing...`);
                            await musicStore.playPad(pad, moment.musicOutputId, true);
                            sonsPoses.musicPadId = pad.id;
                            effets.push({ nom: 'Musique', sort: 'joue' });
                        } else {
                            console.warn(`[Storyboard] Music: Pad ID ${moment.musicPadId} NOT FOUND in any playlist.`);
                            effets.push({ nom: 'Musique', sort: 'introuvable', cherche: moment.musicPadId });
                        }
                    }
                }

                /*
                  2. Light-OS — **un moment est un enchaînement, pas un geste.**

                  ⛔ Cet appel omettait `isAutomatic`, et il était le SEUL des
                  six : les zones de la carte, Sound-OS deux fois, Music-OS et la
                  restauration d'instantané le passent tous. *La documentation
                  d'`applyScene` cite pourtant « un moment de storyboard » parmi
                  les enchaînements — le code contredisait son propre commentaire.*

                  Deux effets, et le second est le vrai défaut : le journal
                  écrivait « Lumières : <scène> » alors que le geste était le
                  MOMENT, et surtout **`lastManualSceneId` était écrasé**. À la
                  fin du son suivant, le retour automatique ramenait la scène du
                  storyboard comme si le meneur l'avait choisie à la main.

                  ⚠️ Le `setActiveScene` qui suivait est retiré, pas corrigé :
                  `applyScene` le fait déjà, avec le même drapeau. *Deux
                  écrivains pour une même donnée est le motif que ce dépôt paie
                  le plus souvent* — et celui-ci écrivait l'inverse de l'autre.
                */
                if (moment.lightSceneId) {
                    if (!gWindow.hueEngine) {
                        /*
                          ⛔ *« les lumières ne se sont pas allumées »*, 12/09 — et
                          ce `&&` était la seule chose entre le meneur et
                          l'explication. `hueEngine` n'est posé sur `window` que
                          par l'import de `HueEngine.ts` : si ce module n'a pas
                          été chargé, la scène est sautée en silence.
                        */
                        effets.push({ nom: 'Lumières', sort: 'module-absent' });
                    } else {
                        console.log(`[Storyboard] Light: Applying scene ${moment.lightSceneId}`);
                        gWindow.hueEngine.applyScene(moment.lightSceneId, true);
                        effets.push({ nom: 'Lumières', sort: 'joue' });
                    }
                }

                /*
                  3. Atlas-OS (Map) — **et on retient ce qu'on remplace.**

                  L'image du moment prend la place de celle de la scène, et
                  `arreterLeMoment` la rendra. On ne relève rien quand le moment
                  ne porte pas d'image : il n'a alors rien remplacé, et écrire
                  une mémoire vide ferait croire à une parenthèse ouverte qui
                  rendrait un décor arbitraire à sa fermeture.
                */
                if (moment.mapUrl && !gWindow.useMapStore) {
                    effets.push({ nom: 'Carte', sort: 'module-absent' });
                }
                if (moment.mapUrl && gWindow.useMapStore) {
                    console.log(`[Storyboard] Map: Setting URL ${moment.mapUrl}`);
                    effets.push({ nom: 'Carte', sort: 'joue' });
                    const mapStore = gWindow.useMapStore.getState();
                    set({
                        imageAvantLeMoment: {
                            mapUrl: mapStore.mapUrl ?? null,
                            mapName: mapStore.mapName ?? null,
                            isVideo: !!mapStore.isVideo,
                        },
                    });
                    mapStore.setMap(moment.mapUrl, moment.isMapVideo || false);
                }

                /*
                  **4. Image-OS — et l'image du moment précédent s'éteint.**

                  *Demandé par David le 2026-08-31 : « quand je lance une autre
                  séquence, tu dois aussi éteindre l'image en fade out de la
                  séquence précédente ».*

                  Une séquence est une **parenthèse**, comme l'image de scène que
                  `imageAvantLeMoment` rend déjà : ce que le moment a posé s'en va
                  quand un autre prend la main. Sans ça, un moment sans image
                  laissait à l'écran celle du précédent, et le meneur devait
                  l'éteindre à la main au milieu de sa scène.

                  **On n'éteint que si le nouveau ne reprend pas le même écran** :
                  quand il le reprend, sa propre image remplace l'autre, et
                  éteindre d'abord ferait clignoter la table.

                  Le fondu, lui, vit dans les écrans — voir `ProjectorView`.
                */
                const cibleDeLImage = moment.imageMediaId
                    ? (moment.imageTarget || (gWindow.useImageStore?.getState()?.projectionTarget as string) || 'hub')
                    : null;
                const cibleAEteindre = get().cibleDeLImageDuMoment;
                if (cibleAEteindre && cibleAEteindre !== cibleDeLImage) {
                    /*
                      **Un écran qui refuse de s'éteindre n'emporte pas le reste
                      du moment.** Relevé par l'essai : sans ce filet, l'échec
                      remontait dans `triggerMoment` et sautait tout ce qui vient
                      après — le titre, le bruitage, l'ambiance. *Le même principe
                      que la scène qu'une ambiance ouvre : ce qui accompagne ne
                      doit jamais faire tomber ce qui est demandé.*
                    */
                    const { ImageService } = await import('../image/logic/ImageService');
                    void ImageService.blackout(cibleAEteindre).catch(e =>
                        console.warn('[Storyboard] extinction de l’image impossible :', e));
                }
                set({ cibleDeLImageDuMoment: cibleDeLImage });

                if (moment.imageMediaId) {
                    if (!gWindow.useImageStore) {
                        effets.push({ nom: 'Image', sort: 'module-absent' });
                        set({ cibleDeLImageDuMoment: null });
                    } else {
                        const imageStore = gWindow.useImageStore.getState();
                        const media = imageStore.mediaList.find((m: { id: string, name: string }) => m.id === moment.imageMediaId);
                        if (media) {
                            console.log(`[Storyboard] Image: Projecting solo ${media.name}`);
                            imageStore.projectSolo(media, moment.imageTarget);
                            effets.push({ nom: 'Image', sort: 'joue' });
                        } else {
                            /*
                              ⚠️ *« pas d'image projetée »*, 12/09. `mediaList` est
                              vide tant que la médiathèque n'a pas ouvert sa base :
                              **une médiathèque en panne rend donc « introuvable »
                              pour TOUT**, et c'est indiscernable d'un média
                              effacé — sauf par le message du démarrage.
                            */
                            console.warn(`[Storyboard] Image: Media ID ${moment.imageMediaId} NOT FOUND.`);
                            effets.push({ nom: 'Image', sort: 'introuvable', cherche: moment.imageMediaId });
                            // Rien n'a été posé : la trace mentirait au prochain moment.
                            set({ cibleDeLImageDuMoment: null });
                        }
                    }
                }

                /*
                  **4 bis. Le titre, sur le même écran que l'image.**

                  Envoyé même sans image : un titre sur un décor déjà en place est
                  un usage légitime — *« Trois jours plus tard »* n'a pas besoin
                  d'une nouvelle photo.

                  La cible se lit comme celle de l'image : celle du moment, ou
                  celle qu'Image-OS pointe. Un titre vide **retire** celui qui est
                  affiché, ce qui rend le cas « ce moment n'a pas de titre »
                  identique au cas « ce moment efface le titre précédent ».
                */
                {
                    const cible = moment.imageTarget
                        || (gWindow.useImageStore?.getState()?.projectionTarget as string)
                        || 'hub';
                    envoyerLeTitre(normaliserLeTitre({
                        cible,
                        texte: moment.titre ?? '',
                        fondu: moment.titreFondu,
                        duree: moment.titreDuree,
                    }));
                }

                // 5. Sound-OS (SFX)
                if (moment.soundPadId) {
                    if (!gWindow.useSoundStore || !gWindow.soundEngine) {
                        effets.push({ nom: 'Bruitage', sort: 'module-absent' });
                    } else {
                        const soundStore = gWindow.useSoundStore.getState();
                        const atmosId = soundStore.activeAtmosphereId;
                        const atmosphere = soundStore.atmospheres.find((a: { id: string }) => a.id === atmosId);

                        const pad = atmosphere?.pads[moment.soundPadId];
                        if (pad && pad.filePath) {
                            console.log(`[Storyboard] Sound: Playing SFX ${pad.title} (${pad.id})`);
                            await gWindow.soundEngine.loadAudio(pad.id, pad.filePath);
                            gWindow.soundEngine.play(pad.id, pad.volume, undefined, moment.soundOutputId);
                            soundStore.setPadActive(pad.id, true);
                            sonsPoses.soundPadId = pad.id;
                            effets.push({ nom: 'Bruitage', sort: 'joue' });
                        } else {
                            /* ⚠️ Le pad est cherché dans l'ambiance ACTIVE : en
                               changer suffit à le rendre introuvable. */
                            console.warn(`[Storyboard] Sound: Pad ID ${moment.soundPadId} NOT FOUND or no file.`);
                            effets.push({ nom: 'Bruitage', sort: 'introuvable', cherche: moment.soundPadId });
                        }
                    }
                }

                // 6. Ambient-OS
                if (moment.ambientSceneId) {
                    if (!gWindow.useAmbientStore) {
                        effets.push({ nom: 'Ambiance', sort: 'module-absent' });
                    } else {
                        console.log(`[Storyboard] Ambient: Applying scene ${moment.ambientSceneId}`);
                        const ambientStore = gWindow.useAmbientStore.getState();
                        await ambientStore.applyScene(moment.ambientSceneId, moment.ambientOutputId, true);
                        sonsPoses.ambientSceneId = moment.ambientSceneId;
                        effets.push({ nom: 'Ambiance', sort: 'joue' });
                    }
                }

                set({ sonsDuMoment: sonsPoses });

                /*
                  ⛔ **LE MOMENT REND DES COMPTES — ajouté le 2026-09-12.**

                  Une séquence à moitié jouée ne laissait **rien** : ni `warn`, ni
                  `error`, et la seule bulle prévue passait par un magasin absent
                  de `window`. *L'application avait des choses à dire et aucun
                  moyen de les dire.*

                  La trace part toujours — même quand tout va bien : *une trace
                  qui n'existe que les mauvais jours ne permet pas de comparer.*
                  Le meneur, lui, n'est dérangé que s'il manque quelque chose.
                */
                const rapport = { moment: moment.name, effets };
                Logger.info('[Storyboard] ' + traceDuMoment(rapport));

                const manque = resumeDuMoment(rapport);
                if (manque) {
                    Logger.warn('[Storyboard] ' + manque);
                    gmToast(`⚠️ ${manque}`, 'warning');
                } else {
                    gmToast(`Moment activé : ${moment.name}`, 'info');
                }
            },

            reset: () => set({ moments: [], activeMomentId: null })
        }),
        {
            name: 'gm-os-storyboard-storage',
            partialize: (state) => ({ moments: state.moments })
        }
    )
);

/*
  **Exposé sur le global, comme le combat et la carte.**

  La trame en a besoin pour capturer l'ambiance en cours quand une scène naît en
  un clic (§ 3 du plan du 2026-08-08) : un import direct fermerait un cycle, le
  storyboard orchestrant déjà les autres modules par ce même chemin.
*/
if (typeof window !== 'undefined') {
    (window as unknown as { useStoryboardStore: typeof useStoryboardStore }).useStoryboardStore =
        useStoryboardStore;
}
