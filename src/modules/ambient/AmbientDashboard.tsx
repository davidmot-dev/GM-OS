import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Layers, Activity, Plus, Save, SlidersHorizontal, VolumeX } from 'lucide-react';
import { useAmbientStore, type AmbientTheme, type AmbientTrackState } from './useAmbientStore';
import AmbientTrack from './components/AmbientTrack';
import ReglagesDesAmbiances from './components/ReglagesDesAmbiances';
import { gmPrompt, gmConfirm } from '../../stores/useModalStore';
import { MediaBrowser } from '../../components/MediaBrowser';
import { useMediaStore } from '../../stores/useMediaStore';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';
import { Bouton, Etiquette, EnTeteDeModule, GabaritDeModule } from '../../components/socle';

const AmbientDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { tracks, presets, scenes, customUniverses, loadTheme, saveTheme, deleteTheme, saveScene, deleteScene, addUniverse, fadeOutAll, applyScene, updateTrack } = useAmbientStore();
    const regime = useRegimeDInterface();
    const [reglagesOuverts, setReglagesOuverts] = useState(true);

    // Media Browser State
    const [browserTarget, setBrowserTarget] = useState<number | null>(null);

    const handleMediaSelect = (mediaId: string) => {
        if (browserTarget !== null) {
            const { mediaList } = useMediaStore.getState();
            const media = mediaList.find((m: { id: string; name: string }) => m.id === mediaId);
            if (media) {
                const track = tracks[browserTarget];
                const isDefaultLabel = track.label === 'modules:ambient.presets.tracks.default_track' || track.label === '';
                updateTrack(browserTarget, { 
                    url: mediaId, 
                    label: isDefaultLabel ? media.name : track.label 
                });
            }
            setBrowserTarget(null);
        }
    };

    // Universe & Theme Selection State
    const universes = useMemo(() => {
        const derived = presets.map((p: AmbientTheme) => p.universe);
        return Array.from(new Set([...derived, ...customUniverses])).sort() as string[];
    }, [presets, customUniverses]);

    const [selectedUniverse, setSelectedUniverse] = useState(universes[0] || '');

    const themesInUniverse = useMemo(() =>
        presets
            .filter((p: AmbientTheme) => p.universe === selectedUniverse)
            .sort((a: AmbientTheme, b: AmbientTheme) => t(a.name).localeCompare(t(b.name))),
        [presets, selectedUniverse, t]
    );
    const [selectedTheme, setSelectedTheme] = useState(themesInUniverse[0]?.name || '');

    /**
     * **Un thème sans aucun fichier son est un gabarit, et il doit le dire.**
     *
     * Défaut A2 du § 12e : les trois thèmes livrés (« Forêt Enchantée » et les
     * deux autres) portent huit pistes nommées — *Oiseaux*, *Ruisseau*,
     * *Feuillage* — et **aucun `url`**. Les charger ne produit rien, ce qui est
     * défendable : ce sont des modèles à remplir. Mais rien à l'écran ne le
     * disait, et la déception arrivait au premier clic.
     *
     * Une `<option>` native n'accepte pas de pastille : le mot vient donc dans
     * le libellé. Le calcul vaut aussi pour les thèmes du meneur — il vient
     * d'enregistrer un thème vide, c'est la même information.
     */
    const estUnGabarit = (theme: AmbientTheme) => !theme.tracks.some(piste => piste.url);

    // Synchronize selectedTheme if themes change or current one is deleted
    useEffect(() => {
        if (!themesInUniverse.find(tObj => tObj.name === selectedTheme)) {
            // eslint-disable-next-line
            setSelectedTheme(themesInUniverse[0]?.name || '');
        }
    }, [themesInUniverse, selectedTheme]);

    const handleThemeChange = (newTheme: string) => {
        setSelectedTheme(newTheme);
        loadTheme(selectedUniverse, newTheme);
    };

    const handleSaveNewTheme = () => {
        gmPrompt(t('modules:ambient.messages.new_theme_prompt'), "", (name) => {
            if (name.trim()) {
                saveTheme(selectedUniverse, name.trim());
                setSelectedTheme(name.trim());
            }
        });
    };

    const handleDeleteTheme = () => {
        const theme = themesInUniverse.find(tObj => tObj.name === selectedTheme);
        if (!theme) return;

        gmConfirm(t('modules:ambient.messages.delete_theme_confirm', { name: t(theme.name) }), () => {
            deleteTheme(theme.id);
        });
    };

    const handleAddUniverse = () => {
        gmPrompt(t('modules:ambient.messages.new_universe_prompt'), "", (name) => {
            const trimmed = name.trim();
            if (trimmed) {
                addUniverse(trimmed);
                setSelectedUniverse(trimmed);
            }
        });
    };

    const handleSaveScene = () => {
        gmPrompt(t('modules:ambient.messages.new_scene_prompt'), "", (name) => {
            const trimmed = name.trim();
            if (trimmed) {
                saveScene(trimmed);
            }
        });
    };


    const pistesActives = tracks.filter((p: AmbientTrackState) => p.isPlaying).length;
    const etiquetteDeChamp = 'text-ui-8 font-black text-app-muted uppercase tracking-widest';

    return (
        <>
            <MediaBrowser
                isOpen={browserTarget !== null}
                onClose={() => setBrowserTarget(null)}
                onSelect={handleMediaSelect}
                allowedTypes={['audio']}
                title={t('modules:ambient.dashboard.select_ambiance')}
            />

            {/*
              **Les Ambiances réagencées — refonte, phase 4, L2, étape 2
              (2026-10-02).** La maquette retenue le 2026-09-27
              (`documentation/Planning/stitch/son/`) : l'univers, le thème et
              « Silence ambiances » en barre d'outils, les scènes rapides en
              tête de la zone, puis **huit tranches de console**, et à droite
              la sortie et le master. Le pied « Buffer 48 kHz, latence ~12 ms »
              ne disait rien que le meneur règle : il n'est pas repris.
            */}
            <GabaritDeModule
                aLaTable={regime.aLaTable}
                reglagesOuverts={reglagesOuverts}
                className="text-app-text select-none"
                entete={
                    <EnTeteDeModule
                        titre={t('modules:names.ambient')}
                        etat={<>
                            {selectedTheme && <Etiquette>{t('modules:ambient.agencement.theme_courant', { nom: t(selectedTheme) })}</Etiquette>}
                            {pistesActives > 0
                                ? <Etiquette ton="accent">{t('modules:ambient.agencement.pistes_actives', { nombre: pistesActives })}</Etiquette>
                                : <Etiquette>{t('modules:ambient.agencement.silence_total')}</Etiquette>}
                        </>}
                        actions={regime.aLaTable ? (
                            <Bouton aLaTable icone={<SlidersHorizontal size={16} />} aria-pressed={reglagesOuverts} onClick={() => setReglagesOuverts(!reglagesOuverts)}>
                                {t('modules:ambient.agencement.reglages')}
                            </Bouton>
                        ) : undefined}
                    />
                }
                barreDOutils={<>
                    {/* L'univers, puis le thème */}
                    <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-bg/50 px-3 py-1.5">
                        <div className="flex flex-col group/uni">
                            <div className="flex items-center gap-1">
                                <label className={etiquetteDeChamp}>{t('modules:ambient.dashboard.universe')}</label>
                                <button onClick={handleAddUniverse} className="p-0.5 text-app-subtle hover:text-gm-cyan" title={t('modules:ambient.dashboard.new_universe')} aria-label={t('modules:ambient.dashboard.new_universe')}>
                                    <Plus size={10} />
                                </button>
                            </div>
                            <select
                                value={selectedUniverse}
                                onChange={(e) => {
                                    const newUni = e.target.value;
                                    setSelectedUniverse(newUni);
                                    const firstTheme = presets.find((p: AmbientTheme) => p.universe === newUni)?.name || '';
                                    setSelectedTheme(firstTheme);
                                }}
                                className="bg-transparent text-xs font-bold text-app-text focus:outline-none cursor-pointer"
                                title={t('modules:ambient.dashboard.select_universe')}
                            >
                                {universes.map((u: string) => <option key={u} value={u} className="bg-app-surface text-app-text">{t(u)}</option>)}
                            </select>
                        </div>

                        <div className="h-8 w-px bg-app-border" />

                        <div className="flex min-w-[10rem] flex-col">
                            <label className={etiquetteDeChamp}>{t('modules:ambient.dashboard.ambiance_theme')}</label>
                            <div className="flex items-center gap-1">
                                <select
                                    value={selectedTheme}
                                    onChange={(e) => handleThemeChange(e.target.value)}
                                    className="flex-1 bg-transparent text-sm font-black text-gm-cyan focus:outline-none cursor-pointer"
                                    title={t('modules:ambient.dashboard.select_theme')}
                                >
                                    {themesInUniverse.length > 0 ? (
                                        themesInUniverse.map((tObj: AmbientTheme) => (
                                            <option key={tObj.id} value={tObj.name} className="bg-app-surface text-app-text">
                                                {t(tObj.name)}{estUnGabarit(tObj) ? ' — gabarit, sans sons' : ''}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" className="bg-app-surface text-app-text">{t('modules:ambient.dashboard.empty')}</option>
                                    )}
                                </select>
                                {themesInUniverse.length > 0 && (
                                    <button
                                        onClick={handleDeleteTheme}
                                        className="p-1 text-app-subtle hover:text-etat-danger transition-colors"
                                        title={t('modules:ambient.dashboard.delete_theme')}
                                        aria-label={t('modules:ambient.dashboard.delete_theme')}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => loadTheme(selectedUniverse, selectedTheme)}
                            className="p-2 bg-gm-cyan/10 hover:bg-gm-cyan/20 text-gm-cyan rounded-lg transition-all border border-gm-cyan/20"
                            title={t('modules:ambient.dashboard.reload')}
                            aria-label={t('modules:ambient.dashboard.reload')}
                        >
                            <Layers size={14} />
                        </button>
                        <button
                            onClick={handleSaveNewTheme}
                            className="p-2 bg-etat-succes/10 hover:bg-etat-succes/20 text-etat-succes rounded-lg transition-all border border-etat-succes/20"
                            title={t('modules:ambient.dashboard.save_new')}
                            aria-label={t('modules:ambient.dashboard.save_new')}
                        >
                            <Save size={14} />
                        </button>
                    </div>

                    <button
                        onClick={() => fadeOutAll()}
                        className={`ml-auto flex items-center gap-2 px-4 ${regime.aLaTable ? 'min-h-11' : 'min-h-9'} rounded-xl border border-etat-danger/30 bg-etat-danger/10 text-etat-danger font-black text-xs uppercase tracking-widest hover:bg-etat-danger hover:text-app-bg transition-all active:scale-95`}
                    >
                        <VolumeX size={14} />
                        {t('modules:ambient.agencement.silence_ambiances')}
                    </button>
                </>}
                reglages={<ReglagesDesAmbiances />}
            >
                <div className="flex h-full min-h-[30rem] flex-col gap-3 pb-2">
                    {/* Les scènes rapides */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleSaveScene}
                            className="flex items-center gap-2 rounded-xl border border-gm-emerald/30 bg-gm-emerald/10 px-3 py-2 text-ui-10 font-black uppercase tracking-tight text-gm-emerald hover:bg-gm-emerald/20 transition-colors"
                            title={t('modules:ambient.agencement.nouvelle_scene')}
                        >
                            <Activity size={14} />
                            {t('modules:ambient.dashboard.quick_scenes')}
                            <Save size={11} />
                        </button>
                        {scenes.map(scene => (
                            <div key={scene.id} className="group relative flex items-center">
                                <button
                                    onClick={() => applyScene(scene.id)}
                                    className="px-4 py-2 rounded-xl bg-app-surface/60 border border-app-border hover:border-gm-cyan/50 hover:bg-app-surface transition-all text-ui-11 font-bold uppercase tracking-wide whitespace-nowrap text-app-text/80 hover:text-app-text"
                                >
                                    {t(scene.name)}
                                </button>

                                {/* Delete button for custom scenes (ones that aren't the hardcoded defaults) */}
                                {!['scene-quiet', 'scene-tension', 'scene-action'].includes(scene.id) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            gmConfirm(t('modules:ambient.messages.delete_scene_confirm', { name: t(scene.name) }), () => deleteScene(scene.id));
                                        }}
                                        className="absolute -top-1 -right-1 p-1 bg-etat-danger rounded-full text-app-bg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:scale-110"
                                        title={t('modules:ambient.dashboard.delete_scene')}
                                    >
                                        <Plus size={10} className="rotate-45" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* La console : huit tranches */}
                    <div className="grid flex-1 grid-cols-8 gap-2 rounded-2xl border border-app-border/50 bg-app-bg/20 p-2">
                        {tracks.map((track: AmbientTrackState, i: number) => (
                            <AmbientTrack
                                key={track.id}
                                track={track}
                                index={i}
                                onRequestMediaBrowser={() => setBrowserTarget(i)}
                            />
                        ))}
                    </div>
                </div>
            </GabaritDeModule>
        </>
    );
};

export default AmbientDashboard;
