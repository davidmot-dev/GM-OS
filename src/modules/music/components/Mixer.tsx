import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { musicEngine } from '../MusicEngine';
import { useCurseurLisse } from '../../../hooks/useCurseurLisse';

const Mixer: React.FC = () => {
    const { crossfader, setCrossfader, masterVolume, setMasterVolume, autoFadeDuration, setAutoFadeDuration, triggerAutoFade, normalisation, basculerLaNormalisation, sonies, cibleDeSonie } = useMusicStore();

    const [isFading, setIsFading] = useState<null | 'A' | 'B'>(null);

    /*
      **La position animée pendant un fondu vit ICI, et non dans le magasin.**

      Elle y écrivait, soixante fois par seconde, par `setCrossfaderVisualOnly`.
      Or `useNexusSynchronizer` est abonné au magasin de musique, et son frein
      **reporte** la diffusion à chaque nouvelle écriture au lieu de l'empiler :
      pendant les cinq secondes d'une transition, la synchronisation vers le
      Player Hub, le projecteur et les tablettes était donc repoussée d'image en
      image, et **n'avait pas lieu du tout**.

      *Une animation d'agrément n'a rien à faire dans un magasin qui nourrit la
      persistance et le réseau.* Le magasin garde la valeur d'arrivée, posée une
      seule fois par `triggerAutoFade` ; l'image intermédiaire ne regarde que cet
      écran, et disparaît avec lui.
    */
    const [positionAnimee, setPositionAnimee] = useState<number | null>(null);

    /*
      **Et la position pendant qu'on TIRE un curseur vit ici aussi — même motif,
      autre cause.**

      Le geste écrivait dans le magasin à chaque cran : persistance synchrone de
      toute la bibliothèque et synchronisation réseau complète, cent fois par
      traversée. Le détail du diagnostic et le remède vivent dans
      `useCurseurLisse` — *l'effet suit le doigt, le magasin attend qu'on
      lâche* —, qui sert ici aux **trois** curseurs du bandeau : ils portaient
      tous les trois le même défaut, seul le crossfader l'avait fait remarquer.

      Pour le crossfader, l'effet immédiat est `musicEngine.setCrossfader`, qui
      annule au passage un fondu en cours.
    */
    const curseurDuFondu = useCurseurLisse(
        positionAnimee ?? crossfader,
        setCrossfader,
        (valeur) => musicEngine.setCrossfader(valeur)
    );
    const positionAffichee = curseurDuFondu.position;

    /*
      Le master agit sur le moteur pendant le geste — *on règle un volume à
      l'oreille, pas au relâchement.*
    */
    const curseurDuMaster = useCurseurLisse(
        masterVolume,
        setMasterVolume,
        (valeur) => musicEngine.setMasterVolume(valeur)
    );

    /*
      La durée du fondu, elle, n'a **aucun** effet immédiat : elle n'est lue
      qu'au déclenchement de la transition suivante. Rien à faire pendant le
      geste, donc — seul l'affichage bouge.
    */
    const curseurDeLaDuree = useCurseurLisse(autoFadeDuration, setAutoFadeDuration);

    /*
      **Ce composant ne fait plus d'audio — il regarde.**

      Il portait auparavant un tiers du mécanisme de transition : une boucle
      `requestAnimationFrame` qui calculait sa propre courbe pour le curseur, et
      surtout, **à la fin, l'arrêt de la platine sortante**. Une décision de
      lecture prise dans un `useEffect` — donc **rien ne se passait quand
      Music-OS n'était pas à l'écran** : la platine sortante jouait
      indéfiniment, sa pastille restait allumée, et le drapeau qui déclenchait
      tout ça, jamais effacé, faussait ensuite le choix de la platine suivante.

      *Un composant démonté n'exécute rien ; ce qui doit se produire même écran
      fermé n'a rien à faire dans un composant.*

      Le moteur mène désormais le fondu sur l'horloge audio ; on se contente de
      lire sa position à chaque image. La dernière écriture a lieu **une image
      après la fin**, pour que le curseur se pose exactement sur la valeur
      d'arrivée au lieu de s'arrêter à 0,98.
    */
    React.useEffect(() => {
        let image = 0;
        let suivait = false;

        const suivre = () => {
            const enFondu = musicEngine.fonduEnCours;
            if (enFondu) {
                setPositionAnimee(musicEngine.positionDuCrossfader());
                setIsFading(musicEngine.cibleDuFondu);
            } else if (suivait) {
                /*
                  Une image après la fin : on rend la main au magasin, qui porte
                  déjà la valeur d'arrivée. Le curseur se pose donc exactement
                  dessus au lieu de s'arrêter à 0,98.
                */
                setPositionAnimee(null);
                setIsFading(null);
            }
            suivait = enFondu;
            image = requestAnimationFrame(suivre);
        };

        image = requestAnimationFrame(suivre);
        return () => cancelAnimationFrame(image);
    }, []);

    return (
        <div className="w-full bg-app-bg/30 backdrop-blur-[32px] rounded-[1.5rem] border border-app-border/50 p-3 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)] relative overflow-hidden group/mixer transition-all duration-700 hover:border-accent/20 hover:bg-app-bg/40">
            {/* Inner Glass Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 size-40 bg-accent/10 blur-[60px] pointer-events-none opacity-40" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
                {/*
                  **L'alignement des niveaux — chantier du 2026-09-03.**

                  Le compteur dit combien de pistes sont deja mesurees, et c'est
                  volontaire : *un reglage automatique doit dire ce qu'il sait,
                  sinon on ne comprend pas pourquoi il agit sur l'une et pas sur
                  l'autre.* Une piste se mesure toute seule pendant qu'on
                  l'ecoute ; elle est calee des la fois suivante.
                */}
                <button
                    onClick={() => basculerLaNormalisation()}
                    title={`Aligne les pistes sur ${cibleDeSonie} LUFS. Une piste est mesuree pendant sa premiere ecoute, puis calee ensuite. ${Object.keys(sonies).length} piste(s) mesuree(s).`}
                    className={`absolute top-3 right-3 z-20 px-2.5 py-1 rounded-lg border text-ui-8 font-black uppercase tracking-widest transition-all ${normalisation
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-app-bg/60 border-app-border/50 text-slate-600 hover:text-slate-400'}`}
                >
                    Niveaux alignes
                    <span className="ml-1.5 opacity-60 font-mono">{Object.keys(sonies).length}</span>
                </button>

                {/* Master Volume */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            <span className="text-ui-9 font-black text-slate-500 uppercase tracking-widest">Master</span>
                            <span className="text-ui-7 font-black text-accent uppercase tracking-widest opacity-60">Engine</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-black font-mono text-white/95 drop-shadow-md">{Math.round(curseurDuMaster.position * 100)}</span>
                            <span className="text-ui-10 font-black text-slate-600">%</span>
                        </div>
                    </div>
                    <div className="relative h-1.5 bg-app-bg rounded-full border border-app-border/50 shadow-inner group/range">
                        {/*
                          Ni la barre ni la pastille n'ont de transition CSS
                          pendant le geste : `transition-all duration-150` leur
                          faisait *rattraper* chaque cran en 150 ms, retard
                          redémarré à chaque mouvement — donc une saccade, pas un
                          adoucissement. *On n'anime pas ce qui est déjà animé.*
                          Hors geste, en revanche, la valeur peut sauter d'un
                          coup (un instantané de scène, une tablette) : la
                          transition garde alors tout son sens.
                        */}
                        <div
                            className={`absolute inset-y-0 left-0 bg-accent shadow-glow-accent rounded-full ${curseurDuMaster.enCoursDeSaisie ? '' : 'transition-all duration-150'}`}
                            style={{ width: `${curseurDuMaster.position * 100}%` }}
                        />
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 size-4 bg-white rounded-lg shadow-lg border-2 border-accent z-10 pointer-events-none ${curseurDuMaster.enCoursDeSaisie ? '' : 'transition-all duration-150'}`}
                            style={{ left: `calc(${curseurDuMaster.position * 100}% - 8px)` }}
                        >
                            <div className="absolute inset-0 rounded-md animate-ping bg-accent/30" />
                        </div>
                        {/*
                          `step` au millième et non au centième : sur une piste
                          de ~500 px, un centième valait 5 px, donc une pastille
                          qui avance par marches visibles. La lecture reste au
                          pour-cent entier — c'est le geste qu'on affine, pas le
                          chiffre. Et les crans ne coûtent plus rien maintenant
                          qu'ils ne touchent plus au magasin.
                        */}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={curseurDuMaster.position}
                            onChange={(e) => curseurDuMaster.tirer(parseFloat(e.target.value))}
                            {...curseurDuMaster.gestesDeRelachement}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                    </div>
                </div>

                {/* Crossfader Center */}
                <div className="space-y-2 flex flex-col items-center">
                    <div className="flex justify-between items-center w-full max-w-[200px] gap-3">
                        <button
                            onClick={async () => await triggerAutoFade('A')}
                            className={`flex-1 py-1.5 rounded-xl text-ui-8 font-black border transition-all uppercase tracking-tighter active:scale-[0.98] ${isFading === 'A' ? 'bg-accent border-accent text-white shadow-glow-accent' : 'bg-app-surface/40 border-app-border/50 text-slate-500 hover:text-white hover:border-accent/30'}`}
                        >
                            A
                        </button>
                        <div className="size-8 rounded-xl bg-app-bg border border-app-border/50 flex items-center justify-center relative overflow-hidden">
                            <Activity size={14} className={`relative z-10 transition-all duration-500 ${isFading ? 'animate-pulse text-accent' : 'text-slate-700'}`} />
                        </div>
                        <button
                            onClick={async () => await triggerAutoFade('B')}
                            className={`flex-1 py-1.5 rounded-xl text-ui-8 font-black border transition-all uppercase tracking-tighter active:scale-[0.98] ${isFading === 'B' ? 'bg-accent border-accent text-white shadow-glow-accent' : 'bg-app-surface/40 border-app-border/50 text-slate-500 hover:text-white hover:border-accent/30'}`}
                        >
                            B
                        </button>
                    </div>

                    <div className="relative w-full h-10 flex items-center group/fader px-4">
                        {/* Fader Track UI */}
                        <div className="absolute inset-x-8 h-3 bg-black/60 rounded-full border border-app-border/50 p-0.5 shadow-inner overflow-hidden">
                            <div className="w-full h-full border border-accent/5 rounded-full bg-gradient-to-r from-accent/10 via-transparent to-accent/10" />
                        </div>

                        {/*
                          **Aucune transition CSS sur ce curseur-ci, et c'est le
                          cœur de la fluidité.**

                          `transition-all duration-150` lui faisait *rattraper*
                          chaque nouvelle position en 150 ms — et comme les deux
                          seuls moteurs de son déplacement (le doigt, et le fondu
                          lu à chaque image) fournissent déjà une valeur par
                          image, l'adoucissement ne lissait rien : il ajoutait un
                          retard, redémarré à chaque cran, qui se voit comme une
                          saccade. *On n'anime pas ce qui est déjà animé.*
                        */}
                        <div
                            className="absolute h-6 w-10 bg-slate-100 rounded-lg shadow-xl border-y border-white z-10 pointer-events-none will-change-[left] flex items-center justify-center after:content-[''] after:w-[1px] after:h-3 after:bg-slate-300 after:rounded-full"
                            style={{ left: `calc(${10 + (positionAffichee * 80)}% - 1.25rem)` }}
                        >
                            <div className="absolute inset-x-0 -top-0.5 h-[1px] bg-accent/20 blur-[1px]" />
                        </div>

                        {/*
                          `step` à 0,001 et non 0,01 : sur une piste de ~340 px,
                          un centième valait 3,4 px, donc un curseur qui avance
                          par marches visibles. Les crans ne coûtent plus rien
                          maintenant qu'ils ne touchent plus au magasin.
                        */}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.001"
                            value={positionAffichee}
                            onChange={(e) => {
                                // Le meneur reprend la main : le fondu en cours
                                // n'a plus à piloter le curseur.
                                setPositionAnimee(null);
                                curseurDuFondu.tirer(parseFloat(e.target.value));
                            }}
                            {...curseurDuFondu.gestesDeRelachement}
                            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-ui-8 font-black text-slate-700 opacity-40 uppercase">A</div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-ui-8 font-black text-slate-700 opacity-40 uppercase">B</div>
                    </div>
                </div>

                {/* Automation Engine */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            <span className="text-ui-9 font-black text-slate-500 uppercase tracking-widest">Logic</span>
                            <span className="text-ui-7 font-black text-slate-600 uppercase tracking-widest opacity-60">Fade</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-black font-mono text-white/95 drop-shadow-md">{(curseurDeLaDuree.position / 1000).toFixed(1)}</span>
                            <span className="text-ui-10 font-black text-slate-600">s</span>
                        </div>
                    </div>
                    <div className="relative h-1.5 bg-app-bg rounded-full border border-app-border/50 shadow-inner group/range-speed">
                        <div
                            className={`absolute inset-y-0 left-0 bg-slate-700 rounded-full opacity-40 ${curseurDeLaDuree.enCoursDeSaisie ? '' : 'transition-all'}`}
                            style={{ width: `${((curseurDeLaDuree.position - 500) / 19500) * 100}%` }}
                        />
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 size-4 bg-app-surface rounded-lg shadow-lg border-2 border-app-border z-10 pointer-events-none flex items-center justify-center p-0.5 ${curseurDeLaDuree.enCoursDeSaisie ? '' : 'transition-all duration-150'}`}
                            style={{ left: `calc(${((curseurDeLaDuree.position - 500) / 19500) * 100}% - 8px)` }}
                        >
                            <div className="w-[1px] h-2 bg-slate-500 rounded-full" />
                        </div>
                        {/*
                          `step` à 100 ms et non 250 : la lecture porte **une
                          décimale**, donc un quart de seconde rendait les deux
                          tiers des valeurs affichables inatteignables (10,8 s se
                          lisait pour 10,75) — et sautait de 6 px à la fois. Au
                          dixième, le chiffre affiché et le cran disent enfin la
                          même chose.
                        */}
                        <input
                            type="range"
                            min="500"
                            max="20000"
                            step="100"
                            value={curseurDeLaDuree.position}
                            onChange={(e) => curseurDeLaDuree.tirer(parseInt(e.target.value))}
                            {...curseurDeLaDuree.gestesDeRelachement}
                            className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Mixer;

