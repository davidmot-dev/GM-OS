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
                                className="aspect-square rounded-xl bg-app-surface/30 border border-app-border/50 hover:border-accent/40 flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all duration-300 relative"
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

                    return (
                        <div
                            key={scene.id}
                            onClick={() => handleApply(scene.id)}
                            /*
                              **`py-7` n'est pas de l'esthétique, c'est une
                              séparation.** Les badges de coin vivent à `top-2` /
                              `bottom-2` et mesurent une vingtaine de pixels : sans
                              cette marge, la colonne centrée remonte dans leur
                              bande dès qu'elle grossit — et le 2026-09-07 elle a
                              grossi d'une ligne de vitesse et d'un curseur.
                              L'icône de la scène se retrouvait **collée à
                              l'étoile ✨**, les deux se lisant comme un seul
                              glyphe. *Un carré de taille fixe se remplit ; ce
                              qu'on y ajoute pousse ce qui y était.*
                            */
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-2 py-7 px-2 cursor-pointer group transition-all duration-300 relative overflow-hidden ${isActive
                                ? `bg-app-surface/50 border-accent border-2 shadow-glow-accent`
                                : `bg-app-surface/50 border border-app-border hover:border-accent/30`
                                }`}
                            /*
                              **La teinte marque la tuile au repos, pas seulement
                              quand elle joue.** Elle ne servait qu'à la scène
                              active : on choisissait une couleur, on validait, et
                              *rien ne bougeait* tant qu'on n'avait pas cliqué la
                              tuile. `80` en alpha au repos, pleine à l'activation
                              — dix-huit bordures saturées se disputeraient l'œil.
                            */
                            style={{
                                borderColor: teinte ? (isActive ? teinte : `${teinte}80`) : undefined,
                                boxShadow: isActive && teinte ? `0 0 20px ${teinte}55` : undefined
                            }}
                        >
                            {isActive && teinte && (
                                <div
                                    className="absolute inset-0 opacity-10"
                                    style={{ background: `linear-gradient(to bottom right, ${teinte}, transparent)` }}
                                />
                            )}
                            <span
                                className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform"
                                /* Le gris ardoise reste le défaut : c'est ce que voit
                                   une tuile dont personne n'a choisi la couleur. */
                                style={{ color: teinte ?? '#94a3b8' }} // slate-400
                            >
                                {scene.icon}
                            </span>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-tight relative z-10 text-center px-2">
                                {scene.name}
                            </span>

                            <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                                {/*
                                  **L'éclairage normal de la pièce.** La maison reste
                                  visible sur la tuile désignée, et n'apparaît au survol
                                  que sur les autres : *ce qui est désigné doit se voir
                                  sans chercher, ce qui ne l'est pas ne doit pas encombrer.*
                                */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDefaultScene(scene.id); }}
                                    title={estLEclairageNormal ? t('light.grid.default_unset_tooltip') : t('light.grid.default_set_tooltip')}
                                    className={`material-symbols-outlined text-sm transition-all ${estLEclairageNormal
                                        ? 'text-accent opacity-100'
                                        : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-accent'
                                        }`}
                                >
                                    home
                                </button>

                                {/*
                                  **La touche qui lance la scène.** Affichée en
                                  permanence quand elle existe — *un raccourci
                                  qu'il faut survoler pour lire n'en est pas un.*
                                */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); apprendreUneTouche(scene.id); }}
                                    title={scene.keyCode ? t('light.grid.key_change_tooltip') : t('light.grid.key_learn_tooltip')}
                                    className={`text-ui-10 font-mono font-bold leading-none px-1 py-0.5 rounded transition-all ${scene.keyCode
                                        ? 'bg-app-bg/80 text-accent opacity-100'
                                        : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-accent'
                                        }`}
                                >
                                    {scene.keyCode ? toucheLisible(scene.keyCode) : '⌨'}
                                </button>
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
                                    <span className="text-ui-10 text-slate-500">{t('light.grid.key_escape')}</span>
                                </div>
                            )}

                            {/*
                              **Le curseur d'intensité — sur toutes les tuiles remplies.**
                              Contrairement à la vitesse, il a prise partout :
                              toute scène capturée porte une brillance, avec ou
                              sans effet.

                              Il **multiplie** ce qui a été capturé au lieu de le
                              réécrire : on baisse une ambiance pour la soirée,
                              et revenir à 100 % rend la scène d'origine sans
                              avoir à la recapturer.
                            */}
                            <div
                                /*
                                  **Une seule ligne, et c'est délibéré.** La
                                  vitesse peut s'offrir un titre au-dessus de son
                                  curseur : elle ne s'affiche que sur les scènes
                                  à effet. L'intensité, elle, est sur les dix-huit
                                  tuiles — *un carré de taille fixe se remplit, et
                                  ce qu'on y ajoute pousse ce qui y était.*
                                */
                                className="w-full px-4 flex items-center gap-1.5 relative z-20"
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                            >
                                <span
                                    className="material-symbols-outlined text-sm leading-none text-slate-400 shrink-0"
                                    style={{ color: teinte ?? undefined }}
                                >
                                    light_mode
                                </span>
                                <input
                                    type="range"
                                    min={INTENSITE_SCENE_MIN}
                                    max={INTENSITE_SCENE_MAX}
                                    step={PAS_D_INTENSITE}
                                    value={intensite}
                                    onChange={(e) => handleIntensite(scene.id, parseInt(e.target.value, 10))}
                                    title={t('light.grid.brightness_tooltip')}
                                    className="flex-1 min-w-0 h-1 bg-app-bg rounded-full appearance-none cursor-pointer accent-accent"
                                />
                                <button
                                    onClick={() => handleIntensite(scene.id, INTENSITE_SCENE_DEFAUT)}
                                    title={t('light.grid.brightness_reset_tooltip')}
                                    className="text-ui-10 font-mono font-bold text-slate-400 hover:text-accent transition-colors leading-none shrink-0 w-8 text-right"
                                >
                                    {intensite}%
                                </button>
                            </div>

                            {/*
                              **Le curseur de vitesse — seulement là où il a prise.**
                              Une scène sans effet n'a rien à accélérer : lui donner
                              un curseur inerte ferait douter des autres.
                            */}
                            {aDesEffets && (
                                <div
                                    className="w-full px-5 relative z-20"
                                    onClick={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                        {/*
                                          **L'étoile « cette scène porte un effet » vit
                                          ici**, à la place d'un glyphe `speed` qui ne
                                          disait rien que le « ×2 » ne disait déjà.

                                          Elle y dit la même chose qu'au coin, au même
                                          endroit que la vitesse qu'elle qualifie — et
                                          *cette ligne n'existe QUE sur les scènes à
                                          effet*, donc elle ne peut pas mentir.
                                        */}
                                        <span
                                            className={`material-symbols-outlined text-sm leading-none animate-pulse ${teinte ? '' : 'text-accent'}`}
                                            style={{ color: teinte ?? undefined }}
                                        >
                                            auto_awesome
                                        </span>
                                        <button
                                            onClick={() => handleSpeed(scene.id, VITESSE_EFFET_DEFAUT)}
                                            title={t('light.grid.speed_reset_tooltip')}
                                            className="text-ui-10 font-mono font-bold text-slate-400 hover:text-accent transition-colors leading-none"
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
                                        /* La couleur de scène vaut `#334155` tant que personne ne l'a changée : la teindre avec rendrait le curseur invisible. */
                                        className="w-full h-1 bg-app-bg rounded-full appearance-none cursor-pointer accent-accent"
                                    />
                                </div>
                            )}

                            <div
                                onClick={(e) => handleCapture(e, scene.id)}
                                className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title={t('light.grid.overwrite_tooltip')}
                            >
                                <span className={`material-symbols-outlined text-sm ${captureEnCours === scene.id ? 'animate-spin text-accent' : 'text-slate-500 hover:text-white'}`}>
                                    {captureEnCours === scene.id ? 'progress_activity' : 'photo_camera'}
                                </span>
                            </div>

                            <div
                                onClick={(e) => { e.stopPropagation(); clearScene(scene.id); }}
                                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title={t('light.grid.clear_tooltip')}
                            >
                                <span className="material-symbols-outlined text-slate-500 text-sm hover:text-red-500">close</span>
                            </div>

                            <div
                                onClick={(e) => handleRename(e, scene)}
                                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                title={t('light.grid.rename_tooltip')}
                            >
                                <span className="material-symbols-outlined text-slate-500 text-sm hover:text-white">edit</span>
                            </div>
                        </div>
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
                <h3 className="text-ui-10 font-bold uppercase tracking-widest text-slate-500">{titre}</h3>
                <span className="text-ui-10 text-slate-600">{aide}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {tuiles.map(renduDeLaTuile)}
            </div>
        </div>
    );

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
            {/*
              **Deux râteliers, et on ne les mélange pas.** Celui de la campagne
              ouverte d'abord — c'est celui qu'on joue — puis le pot commun, dont
              les ambiances servent partout. Sans campagne ouverte il n'y a qu'un
              râtelier, et le titre disparaît avec la distinction.
            */}
            {campagneId === null ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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
