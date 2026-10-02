import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { musicEngine } from '../MusicEngine';
import { useCurseurLisse } from '../../../hooks/useCurseurLisse';

const Mixer: React.FC = () => {
    const { crossfader, setCrossfader, masterVolume, setMasterVolume, autoFadeDuration, setAutoFadeDuration, triggerAutoFade } = useMusicStore();

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

    /*
      **Le mixeur en colonne centrale — refonte, L2, étape 2 (2026-10-02).**
      La maquette retenue pose le mixeur ENTRE les deux platines : les fondus
      vers A et vers B sont sous la main de la platine qu'ils amènent à
      l'antenne. Il était en bandeau sous les pastilles, loin des platines
      qu'il mélange.

      L'alignement des niveaux, un réglage et non un geste, est passé au
      panneau de droite. La « courbe de fondu » de la maquette n'existe pas
      dans GM-OS (le fondu est à puissance constante, sans choix) : elle n'est
      pas reprise.
    */
    const partA = Math.round((1 - positionAffichee) * 100);
    const etiquette = 'text-ui-9 font-black text-app-subtle uppercase tracking-widest';

    return (
        <div className="relative flex h-full flex-col gap-4 rounded-[1.5rem] border border-app-border/50 bg-app-bg/30 p-3 shadow-xl">
            <h3 className="text-center text-ui-10 font-black uppercase tracking-[0.2em] text-app-muted">Mixeur</h3>

            {/* Les fondus automatiques */}
            <div className="grid grid-cols-2 gap-2">
                {(['A', 'B'] as const).map(cote => (
                    <button
                        key={cote}
                        onClick={async () => await triggerAutoFade(cote)}
                        title={`Fondu vers la platine ${cote}, en ${(curseurDeLaDuree.position / 1000).toFixed(1)} s`}
                        className={`flex min-h-12 flex-col items-center justify-center rounded-xl border text-ui-8 font-black uppercase tracking-widest transition-all active:scale-[0.98] ${isFading === cote ? 'bg-accent border-accent text-app-on-accent shadow-glow-accent' : 'bg-app-surface/40 border-app-border/50 text-app-muted hover:text-app-text hover:border-accent/30'}`}
                    >
                        <span>Fondu</span>
                        <span className="text-sm">{cote}</span>
                    </button>
                ))}
            </div>

            {/* Le fondu croisé */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-0.5">
                    <span className={etiquette}>Fondu croisé</span>
                    <Activity size={12} className={`transition-all duration-500 ${isFading ? 'animate-pulse text-accent' : 'text-app-subtle'}`} />
                </div>
                <div className="flex items-center justify-between px-0.5 font-mono text-ui-10 font-black">
                    <span className={partA >= 50 ? 'text-accent' : 'text-app-subtle'}>A {partA} %</span>
                    <span className={partA <= 50 ? 'text-accent' : 'text-app-subtle'}>B {100 - partA} %</span>
                </div>
                <div className="relative flex h-10 w-full items-center">
                    {/* Fader Track UI */}
                    <div className="absolute inset-x-2 h-3 bg-app-bg/60 rounded-full border border-app-border/50 p-0.5 shadow-inner overflow-hidden">
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
                        className="absolute h-6 w-8 bg-fixe-blanc/95 rounded-lg shadow-xl border-y border-fixe-blanc z-10 pointer-events-none will-change-[left] flex items-center justify-center after:content-[''] after:w-[1px] after:h-3 after:bg-fixe-noir/30 after:rounded-full"
                        style={{ left: `calc(${positionAffichee * 100}% - ${positionAffichee * 2}rem)` }}
                    />

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
                        aria-label="Fondu croisé entre les platines A et B"
                        onChange={(e) => {
                            // Le meneur reprend la main : le fondu en cours
                            // n'a plus à piloter le curseur.
                            setPositionAnimee(null);
                            curseurDuFondu.tirer(parseFloat(e.target.value));
                        }}
                        {...curseurDuFondu.gestesDeRelachement}
                        className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                </div>
            </div>

            {/* La durée des fondus automatiques */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-app-border/40 bg-app-bg/30 p-2">
                <div className="flex items-baseline justify-between px-0.5">
                    <span className={etiquette} title="Durée des fondus automatiques vers A et vers B">Durée</span>
                    <span className="font-mono text-sm font-black text-app-text">{(curseurDeLaDuree.position / 1000).toFixed(1)}<span className="text-ui-10 text-app-subtle"> s</span></span>
                </div>
                <div className="relative h-1.5 bg-app-bg rounded-full border border-app-border/50 shadow-inner">
                    <div
                        className={`absolute inset-y-0 left-0 bg-app-muted rounded-full opacity-40 ${curseurDeLaDuree.enCoursDeSaisie ? '' : 'transition-all'}`}
                        style={{ width: `${((curseurDeLaDuree.position - 500) / 19500) * 100}%` }}
                    />
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 size-4 bg-app-surface rounded-lg shadow-lg border-2 border-app-border z-10 pointer-events-none flex items-center justify-center p-0.5 ${curseurDeLaDuree.enCoursDeSaisie ? '' : 'transition-all duration-150'}`}
                        style={{ left: `calc(${((curseurDeLaDuree.position - 500) / 19500) * 100}% - 8px)` }}
                    >
                        <div className="w-[1px] h-2 bg-app-muted rounded-full" />
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
                        aria-label="Durée des fondus automatiques"
                        onChange={(e) => curseurDeLaDuree.tirer(parseInt(e.target.value))}
                        {...curseurDeLaDuree.gestesDeRelachement}
                        className="absolute inset-x-0 -inset-y-2 w-full opacity-0 cursor-pointer z-20"
                    />
                </div>
            </div>

            {/* Le niveau master */}
            <div className="mt-auto flex flex-col gap-1.5 rounded-xl border border-app-border/40 bg-app-bg/30 p-2">
                <div className="flex items-baseline justify-between px-0.5">
                    <span className={etiquette}>Master</span>
                    <span className="font-mono text-sm font-black text-app-text">{Math.round(curseurDuMaster.position * 100)}<span className="text-ui-10 text-app-subtle"> %</span></span>
                </div>
                <div className="relative h-1.5 bg-app-bg rounded-full border border-app-border/50 shadow-inner">
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
                        className={`absolute top-1/2 -translate-y-1/2 size-4 bg-fixe-blanc rounded-lg shadow-lg border-2 border-accent z-10 pointer-events-none ${curseurDuMaster.enCoursDeSaisie ? '' : 'transition-all duration-150'}`}
                        style={{ left: `calc(${curseurDuMaster.position * 100}% - 8px)` }}
                    />
                    {/*
                      `step` au millième et non au centième : sur une piste
                      de ~500 px, un centième valait 5 px, donc une pastille
                      qui avance par marches visibles. La lecture reste au
                      pour-cent entier — c'est le geste qu'on affine, pas le
                      chiffre.
                    */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.001"
                        value={curseurDuMaster.position}
                        aria-label="Volume master de la musique"
                        onChange={(e) => curseurDuMaster.tirer(parseFloat(e.target.value))}
                        {...curseurDuMaster.gestesDeRelachement}
                        className="absolute inset-x-0 -inset-y-2 w-full opacity-0 cursor-pointer z-20"
                    />
                </div>
            </div>
        </div>
    );
};

export default Mixer;
