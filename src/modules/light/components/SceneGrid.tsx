import React, { useState } from 'react';
import {
    useLightStore,
    VITESSE_EFFET_MIN,
    VITESSE_EFFET_MAX,
    VITESSE_EFFET_DEFAUT,
    INTENSITE_SCENE_MIN,
    INTENSITE_SCENE_MAX,
    INTENSITE_SCENE_DEFAUT,
} from '../useLightStore';
import type { LightScene } from '../useLightStore';
import { hueEngine } from '../HueEngine';
import { useTranslation } from 'react-i18next';
import { EditeurDeScene } from './EditeurDeScene';
import { couleurDeLaTuile } from '../logic/couleurDeLaTuile';
import { toucheLisible } from '../useLightKeyboardControls';
import { gmToast } from '../../../stores/useToastStore';
import { useTuilesVisibles } from '../hooks/useTuilesVisibles';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';

/** Le pas du curseur : des quarts, pour que ×1 se retrouve sans viser. */
const PAS_DE_VITESSE = 0.25;

/** Le pas du curseur d'intensité, en points de pourcentage : des cinquièmes de dizaine. */
const PAS_D_INTENSITE = 5;

export const SceneGrid: React.FC = () => {
    const {
        scenes, activeSceneId, defaultSceneId, sceneEnApprentissage, status,
        saveSceneSnapshot, clearScene, setSceneEffectSpeed, setSceneBrightness,
        setDefaultScene, apprendreUneTouche, updateSceneMetadata, assignerLaTuile,
    } = useLightStore();
    const { t } = useTranslation('modules');
    const [sceneEnEdition, setSceneEnEdition] = useState<string | null>(null);
    /** La tuile dont la capture est en vol. `null` = aucune. */
    const [captureEnCours, setCaptureEnCours] = useState<string | null>(null);
    /** La tuile dont la bulle de réglage est ouverte. `null` = aucune. */
    const [tuileReglee, setTuileReglee] = useState<string | null>(null);
    /*
      Échap referme la bulle **avant** d'arrêter la scène : le registre des
      surcouches passe devant le raccourci de Light-OS. *Une touche qui ferme
      une fenêtre ne doit pas éteindre la pièce derrière elle.*
    */
    useFermetureParEchap(tuileReglee !== null, () => setTuileReglee(null), 'Réglage de la tuile');

    /*
      **Le râtelier de la campagne ouverte.** Les tuiles rattachées ailleurs
      sortent de la grille ; les cases **vides** y restent toujours, quelle que
      soit leur étiquette — ce sont les seuls endroits où l'on capture.
    */
    const { visibles, classees, campagneId } = useTuilesVisibles();

    /*
      **L'ordre de la grille, une fois pour les trois sections.** Les
      identifiants d'un même râtelier finissent tous par `_01`…`_18`, donc
      l'ordre alphabétique est l'ordre des cases. *Il ne vaut qu'à l'intérieur
      d'un râtelier — c'est une raison de plus de les séparer à l'écran.*
    */
    const triees = (tuiles: LightScene[]) => [...tuiles].sort((a, b) => a.id.localeCompare(b.id));

    const handleApply = (id: string) => {
        hueEngine.applyScene(id);
    };

    /**
     * **Capturer, c'est d'abord relire.**
     *
     * Le miroir du magasin ne tenait que le compte de ce que GM-OS avait
     * envoyé au pont. Or le meneur règle aussi ses lampes depuis son
     * téléphone : la tuile enregistrait alors une ambiance que plus personne
     * ne voyait dans la pièce, **et rien ne le disait** — le bouton s'appelle
     * pourtant « Capturer l'état actuel des lampes ».
     *
     * ⚠️ Une lecture ratée ne doit pas annuler le geste : le pont peut être
     * occupé, le réseau lent. On capture alors ce qu'on sait, et on le dit —
     * *une capture approximative vaut mieux qu'un clic sans effet, à condition
     * qu'elle s'annonce.*
     */
    const handleCapture = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (captureEnCours) return;
        setCaptureEnCours(id);
        try {
            if (status === 'connected') await hueEngine.relireLesLampes();
        } catch {
            gmToast(t('light.grid.capture_stale'), 'warning');
        } finally {
            /* On relit le magasin **après** la relecture, jamais la valeur
               capturée par le rendu : c'est tout l'objet du détour. */
            saveSceneSnapshot(id, useLightStore.getState().lights);
            setCaptureEnCours(null);
        }
    };

    /*
      **Le curseur agit sur la scène, et tout de suite sur la pièce.** Le magasin
      garde le réglage pour la prochaine fois ; le moteur, lui, ne le verrait
      qu'au prochain battement — jusqu'à dix secondes pour un crépuscule. On le
      lui dit donc à la main, et seulement pour les effets nés de cette scène.
    */
    const handleSpeed = (sceneId: string, vitesse: number) => {
        setSceneEffectSpeed(sceneId, vitesse);
        hueEngine.appliquerVitesseDeScene(sceneId);
    };

    /*
      **L'intensité aussi agit tout de suite, mais pas de la même façon.** Les
      lampes sous effet relisent le réglage à leur prochain battement ; les
      lampes posées ne rebattent jamais, et c'est le moteur qui les renvoie —
      une fois le curseur reposé, pour ne pas noyer le pont en chemin.
    */
    const handleIntensite = (sceneId: string, pourcent: number) => {
        setSceneBrightness(sceneId, pourcent);
        hueEngine.appliquerIntensiteDeScene(sceneId);
    };

    const handleRename = (e: React.MouseEvent, scene: LightScene) => {
        e.stopPropagation();
        setSceneEnEdition(scene.id);
    };

    /**
     * **Le rendu d’une tuile**, sorti de la boucle le 2026-09-19.
     *
     * La grille n’est plus une liste : c’est **le râtelier de la campagne, puis
     * le pot commun**. Deux sections qui dessinent la même chose — et *deux
     * copies de trois cents lignes de tuile auraient divergé à la première
     * retouche.*
     */
    const renduDeLaTuile = (scene: LightScene) => {
                    const isActive = activeSceneId === scene.id;
                    const hasData = Object.keys(scene.lightStates).length > 0;
                    const aDesEffets = Object.values(scene.lightStates).some(s => s.effect && s.effect !== 'none');
                    const estLEclairageNormal = defaultSceneId === scene.id;
                    /*
                      `null` quand personne n'a choisi de couleur : les classes
                      CSS jouent alors seules, et la tuile a exactement
                      l'apparence qu'elle avait avant l'éditeur.
                    */
                    const teinte = couleurDeLaTuile(scene);
                    const vitesse = scene.effectSpeed ?? VITESSE_EFFET_DEFAUT;
                    const intensite = scene.sceneBrightness ?? INTENSITE_SCENE_DEFAUT;

                    if (!hasData) {
                        return (
                            <div
                                key={scene.id}
                                onClick={(e) => handleCapture(e, scene.id)}
                                className="min-h-[8.5rem] rounded-xl bg-app-surface/20 border border-dashed border-app-border hover:border-accent/50 flex flex-col items-center justify-center gap-2 cursor-pointer group transition-all duration-300 relative"
                                title={t('light.grid.capture_tooltip')}
                            >
                                {/*
                                  **Le vol se voit.** La capture part maintenant
                                  demander la pièce au pont : un aller-retour
                                  sur le réseau local, court mais non nul. *Un
                                  geste dont rien ne bouge pendant une demi-
                                  seconde ressemble à un geste qui n'a pas pris.*
                                */}
                                <span className={`material-symbols-outlined text-app-text/40 text-3xl group-hover:text-accent transition-colors ${captureEnCours === scene.id ? 'animate-spin text-accent' : ''}`}>
                                    {captureEnCours === scene.id ? 'progress_activity' : 'add'}
                                </span>
                                <span className="text-ui-10 font-bold text-app-text/40 uppercase tracking-tight group-hover:text-accent">{t('light.grid.capture')}</span>
                            </div>
                        );
                    }

                    /*
                      **La tuile allégée — refonte, L2, étape 2 (2026-10-02).**
                      Répond à *« les pads sont trop fournis : difficile de
                      modifier un pad ou même de l'activer »* : deux curseurs et
                      six commandes de survol se disputaient un carré dont le
                      clic, lui, lance la scène. La tuile ne garde que ce qui se
                      LIT — icône, nom, intensité, vitesse, sa touche, sa maison
                      — et **le bouton de réglage, en haut à droite, est séparé**
                      du reste, qui active la scène. Tout ce qui se RÈGLE vit
                      dans la bulle qu'il ouvre (`reglagesDeLaTuile`).
                    */
                    const reglee = tuileReglee === scene.id;
                    return (
                        <div
                            key={scene.id}
                            onClick={() => handleApply(scene.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleApply(scene.id); } }}
                            aria-pressed={isActive}
                            className={`relative flex min-h-[8.5rem] flex-col gap-2 rounded-xl p-3 cursor-pointer group transition-all duration-300 ${isActive
                                ? `bg-app-surface/60 border-accent border-2 shadow-glow-accent`
                                : `bg-app-surface/50 border border-app-border hover:border-accent/30`
                                }`}
                            /*
                              **La teinte marque la tuile au repos, pas seulement
                              quand elle joue.** `80` en alpha au repos, pleine à
                              l'activation — dix-huit bordures saturées se
                              disputeraient l'œil.
                            */
                            style={{
                                borderColor: teinte ? (isActive ? teinte : `${teinte}80`) : undefined,
                                boxShadow: isActive && teinte ? `0 0 20px ${teinte}55` : undefined,
                                /* La bulle de réglage passe DEVANT les tuiles voisines. */
                                zIndex: reglee ? 40 : undefined,
                            }}
                        >
                            {isActive && teinte && (
                                <div
                                    className="absolute inset-0 rounded-xl opacity-10 pointer-events-none"
                                    style={{ background: `linear-gradient(to bottom right, ${teinte}, transparent)` }}
                                />
                            )}

                            {/* L'en-tête : l'état, la touche, la maison — et le réglage, à part */}
                            <div className="relative flex items-center gap-1.5 min-h-5">
                                {isActive && (
                                    <span className="flex items-center gap-1 text-ui-8 font-black uppercase tracking-widest text-accent">
                                        <span className="size-1.5 rounded-full bg-accent animate-pulse" /> Actif
                                    </span>
                                )}
                                {/*
                                  **La touche qui lance la scène.** Affichée en
                                  permanence quand elle existe — *un raccourci
                                  qu'il faut survoler pour lire n'en est pas un.*
                                */}
                                {scene.keyCode && (
                                    <span className="rounded bg-app-bg/80 px-1 py-0.5 font-mono text-ui-10 font-bold leading-none text-accent">
                                        {toucheLisible(scene.keyCode)}
                                    </span>
                                )}
                                {/*
                                  **L'éclairage normal de la pièce** : la maison se
                                  voit sur la tuile désignée, sans chercher.
                                */}
                                {estLEclairageNormal && (
                                    <span className="material-symbols-outlined text-sm text-accent" title={t('light.agencement.tuile_eclairage_normal')}>home</span>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setTuileReglee(reglee ? null : scene.id); }}
                                    aria-label={`${t('light.agencement.tuile_reglages')} — ${scene.name}`}
                                    aria-expanded={reglee}
                                    title={t('light.agencement.tuile_reglages')}
                                    className={`ml-auto -mr-1 -mt-1 flex size-8 items-center justify-center rounded-lg transition-colors ${reglee ? 'bg-accent/15 text-accent' : 'text-app-subtle hover:bg-app-bg/60 hover:text-app-text'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">tune</span>
                                </button>
                            </div>

                            <span
                                className="relative material-symbols-outlined text-3xl transition-transform group-hover:scale-110 self-center"
                                /* Le gris ardoise reste le défaut : c'est ce que voit
                                   une tuile dont personne n'a choisi la couleur. */
                                style={{ color: teinte ?? '#94a3b8' }} // slate-400
                            >
                                {scene.icon}
                            </span>
                            <span className="relative text-xs font-bold text-app-text uppercase tracking-tight line-clamp-2 break-words">
                                {scene.name}
                            </span>

                            {/*
                              **Ce qui se lit des réglages : l'intensité, et la
                              vitesse là où elle a prise.** Une scène sans effet
                              n'a rien à accélérer : lui montrer « ×1 » ferait
                              douter des autres.
                            */}
                            <div className="relative mt-auto flex flex-wrap items-center justify-between gap-x-2 font-mono text-ui-10 font-bold text-app-muted">
                                <span className="flex items-center gap-0.5">
                                    <span className="material-symbols-outlined leading-none" style={{ color: teinte ?? undefined, fontSize: 14 }}>light_mode</span>
                                    {intensite}%
                                </span>
                                {aDesEffets && (
                                    <span className="flex items-center gap-0.5" title={t('light.grid.speed_tooltip')}>
                                        <span
                                            className={`material-symbols-outlined leading-none animate-pulse ${teinte ? '' : 'text-accent'}`}
                                            style={{ color: teinte ?? undefined, fontSize: 14 }}
                                        >
                                            auto_awesome
                                        </span>
                                        ×{vitesse.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>

                            {/*
                              **L'attente d'une touche se voit sur la tuile
                              concernée**, et couvre tout le reste : c'est un
                              mode, et la prochaine frappe ne fera pas ce
                              qu'elle fait d'habitude. *Un mode qui ne se voit
                              pas est un piège.*
                            */}
                            {sceneEnApprentissage === scene.id && (
                                <div
                                    className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-app-bg/90 rounded-xl border-2 border-accent animate-pulse cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); apprendreUneTouche(null); }}
                                >
                                    <span className="material-symbols-outlined text-accent text-2xl">keyboard</span>
                                    <span className="text-ui-10 font-bold text-accent uppercase tracking-tight text-center px-2">
                                        {t('light.grid.key_press')}
                                    </span>
                                    <span className="text-ui-10 text-app-subtle">{t('light.grid.key_escape')}</span>
                                </div>
                            )}

                            {reglee && reglagesDeLaTuile(scene, { intensite, vitesse, aDesEffets, estLEclairageNormal })}
                        </div>
                    );
    };

    /**
     * **La bulle de réglage d'une tuile.** Tout ce qui se règle sur une scène,
     * à un seul endroit, hors du carré qui la lance.
     *
     * ⛔ **Une fonction de rendu, pas un composant** — pour la même raison que
     * `ratelier` plus bas : un composant déclaré ici serait un type neuf à
     * chaque rendu, et ses curseurs s'arracheraient de sous la souris au
     * premier mouvement.
     *
     * Elle prend sa largeur propre et passe par-dessus les voisines, comme le
     * menu d'une pastille de la Musique : *un menu dont la taille dépend de la
     * vignette qu'il recouvre n'a pas de taille à lui.*
     */
    const reglagesDeLaTuile = (
        scene: LightScene,
        { intensite, vitesse, aDesEffets, estLEclairageNormal }: { intensite: number; vitesse: number; aDesEffets: boolean; estLEclairageNormal: boolean },
    ) => {
        const ligne = 'flex items-center justify-between gap-2';
        const etiquette = 'text-ui-9 font-black uppercase tracking-widest text-app-subtle';
        const bouton = 'flex items-center justify-center gap-1.5 rounded-lg border border-app-border bg-app-bg/60 px-2 py-2 text-ui-10 font-bold text-app-muted hover:text-app-text hover:border-accent/50 transition-colors';
        return (
            <>
                {/* Un clic à côté referme la bulle, sans lancer la tuile d'en dessous. */}
                <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setTuileReglee(null); }} />
                <div
                    role="dialog"
                    aria-label={`${t('light.agencement.tuile_reglages')} — ${scene.name}`}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className="absolute left-1/2 top-2 z-50 flex w-[16rem] -translate-x-1/2 flex-col gap-3 rounded-2xl border border-app-border bg-app-bg p-4 shadow-2xl cursor-default animate-in fade-in zoom-in-95 duration-150"
                >
                    <div className={ligne}>
                        <span className="truncate text-xs font-black uppercase tracking-widest text-app-text">{scene.name}</span>
                        <button
                            onClick={() => setTuileReglee(null)}
                            aria-label={t('light.agencement.fermer')}
                            className="shrink-0 rounded-md p-1 text-app-subtle hover:text-app-text"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </div>

                    {/*
                      **Le curseur d'intensité — sur toutes les tuiles remplies.**
                      Il **multiplie** ce qui a été capturé au lieu de le
                      réécrire : on baisse une ambiance pour la soirée, et
                      revenir à 100 % rend la scène d'origine sans avoir à la
                      recapturer.
                    */}
                    <div className="flex flex-col gap-1">
                        <div className={ligne}>
                            <span className={etiquette}>{t('light.agencement.tuile_intensite')}</span>
                            <button
                                onClick={() => handleIntensite(scene.id, INTENSITE_SCENE_DEFAUT)}
                                title={t('light.grid.brightness_reset_tooltip')}
                                className="font-mono text-xs font-bold text-app-muted hover:text-accent"
                            >
                                {intensite}%
                            </button>
                        </div>
                        <input
                            type="range"
                            min={INTENSITE_SCENE_MIN}
                            max={INTENSITE_SCENE_MAX}
                            step={PAS_D_INTENSITE}
                            value={intensite}
                            onChange={(e) => handleIntensite(scene.id, parseInt(e.target.value, 10))}
                            title={t('light.grid.brightness_tooltip')}
                            aria-label={t('light.agencement.tuile_intensite')}
                            className="w-full cursor-pointer accent-accent"
                        />
                    </div>

                    {/*
                      **Le curseur de vitesse — seulement là où il a prise.**
                      Une scène sans effet n'a rien à accélérer : lui donner
                      un curseur inerte ferait douter des autres.
                    */}
                    {aDesEffets && (
                        <div className="flex flex-col gap-1">
                            <div className={ligne}>
                                <span className={etiquette}>{t('light.agencement.tuile_vitesse')}</span>
                                <button
                                    onClick={() => handleSpeed(scene.id, VITESSE_EFFET_DEFAUT)}
                                    title={t('light.grid.speed_reset_tooltip')}
                                    className="font-mono text-xs font-bold text-app-muted hover:text-accent"
                                >
                                    ×{vitesse.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </button>
                            </div>
                            <input
                                type="range"
                                min={VITESSE_EFFET_MIN}
                                max={VITESSE_EFFET_MAX}
                                step={PAS_DE_VITESSE}
                                value={vitesse}
                                onChange={(e) => handleSpeed(scene.id, parseFloat(e.target.value))}
                                title={t('light.grid.speed_tooltip')}
                                aria-label={t('light.agencement.tuile_vitesse')}
                                className="w-full cursor-pointer accent-accent"
                            />
                        </div>
                    )}

                    <div className={ligne}>
                        <span className={etiquette}>{t('light.agencement.tuile_touche')}</span>
                        <button
                            onClick={() => { apprendreUneTouche(scene.id); setTuileReglee(null); }}
                            title={scene.keyCode ? t('light.grid.key_change_tooltip') : t('light.grid.key_learn_tooltip')}
                            className="rounded-md border border-app-border bg-app-surface px-2 py-1 font-mono text-xs font-bold text-accent hover:border-accent/50"
                        >
                            {scene.keyCode ? toucheLisible(scene.keyCode) : t('light.agencement.tuile_sans_touche')}
                        </button>
                    </div>

                    <button
                        onClick={() => setDefaultScene(scene.id)}
                        aria-pressed={estLEclairageNormal}
                        title={estLEclairageNormal ? t('light.grid.default_unset_tooltip') : t('light.grid.default_set_tooltip')}
                        className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs font-bold transition-colors ${estLEclairageNormal
                            ? 'border-accent/60 bg-accent/10 text-accent'
                            : 'border-app-border bg-app-bg/60 text-app-muted hover:text-app-text hover:border-accent/50'}`}
                    >
                        <span className="material-symbols-outlined text-base">home</span>
                        {t('light.agencement.tuile_eclairage_normal')}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={(e) => handleCapture(e, scene.id)}
                            title={t('light.grid.overwrite_tooltip')}
                            className={bouton}
                        >
                            <span className={`material-symbols-outlined text-sm ${captureEnCours === scene.id ? 'animate-spin text-accent' : ''}`}>
                                {captureEnCours === scene.id ? 'progress_activity' : 'photo_camera'}
                            </span>
                            {t('light.agencement.tuile_recapturer')}
                        </button>
                        <button
                            onClick={(e) => { handleRename(e, scene); setTuileReglee(null); }}
                            title={t('light.grid.rename_tooltip')}
                            className={bouton}
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            {t('light.agencement.tuile_renommer')}
                        </button>
                    </div>

                    <button
                        onClick={() => { clearScene(scene.id); setTuileReglee(null); }}
                        title={t('light.grid.clear_tooltip')}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-etat-danger/20 bg-etat-danger/5 py-2 text-ui-10 font-bold text-etat-danger/80 hover:bg-etat-danger/15 hover:text-etat-danger transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                        {t('light.agencement.tuile_vider')}
                    </button>
                </div>
            </>
        );
    };

    /**
     * Une section de la grille : un titre discret, puis ses cases.
     *
     * ⛔ **C'est une fonction de rendu, pas un composant — et la distinction
     * n'est pas cosmétique.** Un composant déclaré dans le corps d'un autre est
     * un **type neuf à chaque rendu** : React démonte et remonte toute la
     * section au lieu de la mettre à jour. Les tuiles portent deux curseurs, et
     * traîner un curseur déclenche un rendu à chaque pixel — *le curseur se
     * serait donc arraché de sous la souris au premier mouvement.*
     */
    const ratelier = (cle: string, titre: string, aide: string, tuiles: LightScene[]) => (
        <div key={cle} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
                <h3 className="text-ui-11 font-black uppercase tracking-widest text-app-muted">{titre}</h3>
                <span className="text-ui-10 text-app-subtle">{aide}</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
                {tuiles.map(renduDeLaTuile)}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            {/*
              **Deux râteliers, et on ne les mélange pas.** Celui de la campagne
              ouverte d'abord — c'est celui qu'on joue — puis le pot commun, dont
              les ambiances servent partout. Sans campagne ouverte il n'y a qu'un
              râtelier, et le titre disparaît avec la distinction.
            */}
            {campagneId === null ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
                    {triees(visibles).map(renduDeLaTuile)}
                </div>
            ) : (
                <>
                    {ratelier(
                        'campagne',
                        t('light.grid.rack_campaign'),
                        t('light.grid.rack_campaign_hint'),
                        triees(classees.deLaCampagne),
                    )}
                    {ratelier(
                        'communes',
                        t('light.grid.rack_common'),
                        t('light.grid.rack_common_hint'),
                        triees(classees.communes),
                    )}
                    {classees.orphelines.length > 0 && ratelier(
                        'orphelines',
                        t('light.grid.rack_orphans'),
                        t('light.grid.rack_orphans_hint'),
                        triees(classees.orphelines),
                    )}
                </>
            )}

            {sceneEnEdition && scenes[sceneEnEdition] && (
                <EditeurDeScene
                    scene={scenes[sceneEnEdition]}
                    campagneOuverte={campagneId}
                    onAnnuler={() => setSceneEnEdition(null)}
                    onValider={(nom, icone, couleur, pour) => {
                        updateSceneMetadata(sceneEnEdition, nom, icone, couleur);
                        assignerLaTuile(sceneEnEdition, pour);
                        setSceneEnEdition(null);
                    }}
                />
            )}
        </div>
    );
};
