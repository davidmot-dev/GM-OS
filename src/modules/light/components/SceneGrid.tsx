import React from 'react';
import {
    useLightStore,
    VITESSE_EFFET_MIN,
    VITESSE_EFFET_MAX,
    VITESSE_EFFET_DEFAUT,
} from '../useLightStore';
import type { LightScene } from '../useLightStore';
import { hueEngine } from '../HueEngine';
import { gmPrompt } from '../../../stores/useModalStore';
import { useTranslation } from 'react-i18next';

/** Le pas du curseur : des quarts, pour que ×1 se retrouve sans viser. */
const PAS_DE_VITESSE = 0.25;

export const SceneGrid: React.FC = () => {
    const { scenes, activeSceneId, saveSceneSnapshot, clearScene, setSceneEffectSpeed } = useLightStore();
    const { t } = useTranslation('modules');

    // Sort scenes by ID to maintain grid order SCENE_01 to SCENE_18
    const sortedScenes = Object.values(scenes).sort((a, b) => a.id.localeCompare(b.id));

    const handleApply = (id: string) => {
        hueEngine.applyScene(id);
    };

    const handleCapture = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const currentLights = useLightStore.getState().lights;
        saveSceneSnapshot(id, currentLights);
        // Maybe visual feedback here
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

    const handleRename = (e: React.MouseEvent, scene: LightScene) => {
        e.stopPropagation();
        gmPrompt(
            t('light.grid.rename_prompt'),
            scene.name,
            (newName: string) => {
                if (newName && newName.trim() !== '') {
                    useLightStore.getState().updateSceneMetadata(scene.id, newName.trim(), scene.icon, scene.color);
                }
            },
            t('light.grid.save_button'),
            t('light.grid.cancel_button')
        );
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {sortedScenes.map((scene: LightScene) => {
                    const isActive = activeSceneId === scene.id;
                    const hasData = Object.keys(scene.lightStates).length > 0;
                    const aDesEffets = Object.values(scene.lightStates).some(s => s.effect && s.effect !== 'none');
                    const vitesse = scene.effectSpeed ?? VITESSE_EFFET_DEFAUT;

                    if (!hasData) {
                        return (
                            <div
                                key={scene.id}
                                onClick={(e) => handleCapture(e, scene.id)}
                                className="aspect-square rounded-xl bg-app-surface/30 border border-app-border/50 hover:border-accent/40 flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all duration-300 relative"
                                title={t('light.grid.capture_tooltip')}
                            >
                                <span className="material-symbols-outlined text-app-text/40 text-3xl group-hover:text-accent transition-colors">add</span>
                                <span className="text-ui-10 font-bold text-app-text/40 uppercase tracking-tight group-hover:text-accent">{t('light.grid.capture')}</span>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={scene.id}
                            onClick={() => handleApply(scene.id)}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all duration-300 relative overflow-hidden ${isActive
                                ? `bg-app-surface/50 border-accent border-2 shadow-glow-accent`
                                : `bg-app-surface/50 border border-app-border hover:border-accent/30`
                                }`}
                            style={{
                                borderColor: isActive ? scene.color : undefined,
                                boxShadow: isActive ? `0 0 20px ${scene.color}30` : undefined
                            }}
                        >
                            {isActive && (
                                <div
                                    className="absolute inset-0 opacity-10"
                                    style={{ background: `linear-gradient(to bottom right, ${scene.color}, transparent)` }}
                                />
                            )}
                            <span
                                className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform"
                                style={{ color: isActive ? scene.color : '#94a3b8' }} // slate-400
                            >
                                {scene.icon}
                            </span>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-tight relative z-10 text-center px-2">
                                {scene.name}
                            </span>

                            {/* Has Software Effect indicator */}
                            {aDesEffets && (
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span className="material-symbols-outlined text-sm animate-pulse" style={{ color: scene.color }}>auto_awesome</span>
                                </div>
                            )}

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
                                        <span className="material-symbols-outlined text-slate-500 text-sm leading-none">speed</span>
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
                                <span className="material-symbols-outlined text-slate-500 text-sm hover:text-white">photo_camera</span>
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
                })}
            </div>
        </div>
    );
};
