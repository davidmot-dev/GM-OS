import React from 'react';
import { Dices, Plus, Trash2 } from 'lucide-react';
import type { GameDriver } from '../../../../types/drivers';
import type { ComposanteDeJet } from '../../../dice/DescripteurDeJet';
import { MECANIQUES_DE_CIBLE, type NomDeMecanique } from '../../../dice/systemes';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * De quoi un jet se compose — **à la main, sans repasser par la Forge**.
 *
 * **Pourquoi cet écran existe.** David, le 2026-08-15 : *« comment puis-je
 * corriger cela à la main ? »* — après qu'on lui eut conseillé d'amender son
 * pilote Alien, dont la réserve était un nombre fixe. La réponse honnête était
 * qu'il ne pouvait pas : l'éditeur du moteur de règles montrait le moteur de
 * dés, le combat, le butin et les personas, **et pas une ligne du descripteur de
 * jet**. Seule une redérivation complète pouvait le changer, pour deux lignes.
 *
 * *C'est le même défaut que les personas du 2026-08-14 : quelque chose existe,
 * fonctionne, et n'a aucun écran — donc n'existe pas pour qui s'en sert.*
 *
 * **La section se choisit dans une liste, jamais à la main.** C'est le point
 * important : le défaut du matin même venait d'un `sectionId` écrit contre un
 * autre gabarit — « competences » quand la fiche disait « stats ». Un menu qui
 * ne propose que les sections **de la fiche du pilote** rend ce défaut
 * inexprimable, au lieu de le rattraper après coup.
 */
interface EditeurDuJetProps {
    driver: GameDriver;
    gabarit?: SheetTemplate;
    onUpdate: (patch: Partial<GameDriver>) => void;
}

/** Une composante, éditable : ce qu'elle s'appelle et où on la choisit. */
const LigneDeComposante: React.FC<{
    composante: ComposanteDeJet;
    sections: SheetTemplate['sections'];
    onChange: (suivante: ComposanteDeJet) => void;
    /**
     * Absent, aucune corbeille.
     *
     * La caractéristique d'une cible ne se retire pas seule : sans ordonnée la
     * mécanique n'a rien à croiser, et le jet vaudrait zéro pour cent. On quitte
     * la cible par son menu, jamais en vidant une de ses deux moitiés.
     */
    onRetirer?: () => void;
}> = ({ composante, sections, onChange, onRetirer }) => {
    const autres = (composante.sectionsSupplementaires ?? []).filter(Boolean);
    const disponibles = sections.filter(s => s.id !== composante.sectionId && !autres.includes(s.id));

    /*
      **Retirer le dernier sous-groupe RETIRE la clé**, au lieu de laisser un
      tableau vide. `estVide` traite les deux pareil, mais pas `JSON.stringify`
      ni la revue qui lit les clés : un pilote exporté porterait une liste
      fantôme. Même règle que « revenir à aucune mécanique retire la cible »,
      posée le 2026-08-23.
    */
    const ecrireLesAutres = (liste: string[]) => {
        if (liste.length > 0) return onChange({ ...composante, sectionsSupplementaires: liste });
        const sans = { ...composante };
        delete sans.sectionsSupplementaires;
        onChange(sans);
    };

    return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
            type="text"
            value={composante.label}
            onChange={e => onChange({ ...composante, label: e.target.value })}
            placeholder="Intitulé — « Attribut »"
            title="Ce que le joueur lit au-dessus du menu"
            className="flex-1 bg-app-bg/40 px-4 py-2.5 rounded-xl border border-app-border/20 text-sm focus:border-accent/50 outline-none"
        />
        <input
            type="text"
            value={composante.id}
            onChange={e => onChange({ ...composante, id: e.target.value })}
            placeholder="identifiant"
            title="Identifiant interne — il doit rester unique dans ce jet"
            className="w-36 bg-app-bg/40 px-3 py-2.5 rounded-xl border border-app-border/20 font-mono text-xs text-app-text/60 focus:border-accent/50 outline-none"
        />
        {/*
            **Une liste, pas un champ libre.** Le sectionId écrit à la main est
            exactement ce qui a vidé les menus de la fiche de Dune : le pilote
            visait « competences » quand la fiche nommait « stats ».
        */}
        <select
            value={composante.sectionId}
            /* La nouvelle principale sort des supplémentaires : la garder
               proposerait deux fois le même sous-groupe dans le menu du jet. */
            onChange={e => onChange({
                ...composante,
                sectionId: e.target.value,
                ...(autres.includes(e.target.value)
                    ? { sectionsSupplementaires: autres.filter(x => x !== e.target.value) }
                    : {}),
            })}
            title="Section de la fiche où le joueur choisit sa valeur — la première"
            className="w-56 bg-app-bg/40 px-3 py-2.5 rounded-xl border border-app-border/20 text-xs focus:border-accent/50 outline-none cursor-pointer"
        >
            <option value="">— section de la fiche —</option>
            {sections.map(s => (
                <option key={s.id} value={s.id}>{s.label || s.id}</option>
            ))}
            {/* Une section devenue introuvable reste visible plutôt que d'être
                effacée en silence : c'est au meneur de la remplacer. */}
            {composante.sectionId && !sections.some(s => s.id === composante.sectionId) && (
                <option value={composante.sectionId}>⚠ {composante.sectionId} (introuvable)</option>
            )}
        </select>
        {onRetirer && (
            <button
                onClick={onRetirer}
                className="p-2.5 rounded-xl text-app-text/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Retirer cette composante"
            ><Trash2 size={16} /></button>
        )}
      </div>

      {/*
          **Les autres sous-groupes où la même valeur se lit.**

          *Le mur du 2026-08-23, signalé par David.* Chez Rêves de Dragons les
          compétences sont découpées en sous-groupes, et un sous-groupe est une
          SECTION de la fiche : une composante qui n'en nommait qu'une ne pouvait
          offrir qu'une partie des compétences du personnage — les autres étaient
          sur sa fiche, visibles, et absentes du menu du jet.

          **Ce n'est pas une composante de plus.** Une composante est un TERME
          D'UNE SOMME ; en ajouter une par sous-groupe les additionnerait, et le
          panneau réclamerait une compétence de chacun. C'est le défaut exact des
          douze composantes numérotées du pilote RdD, à ne pas refaire d'un autre
          geste.

          La ligne ne s'affiche que s'il reste quelque chose à ajouter ou à
          retirer : sur un jeu à une section par composante — Dune —, elle
          n'apparaît pas du tout.
      */}
      {(autres.length > 0 || (composante.sectionId !== '' && disponibles.length > 0)) && (
        <div className="flex items-center gap-1.5 flex-wrap pl-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-app-text/25">
            aussi dans
          </span>
          {autres.map(id => {
            const connue = sections.some(s => s.id === id);
            return (
              <button
                key={id}
                onClick={() => ecrireLesAutres(autres.filter(x => x !== id))}
                title="Retirer ce sous-groupe"
                className={`group flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  connue
                    ? 'bg-app-bg/40 border-app-border/20 text-app-text/60 hover:border-red-400/40 hover:text-red-300'
                    : 'bg-red-500/10 border-red-400/30 text-red-300'
                }`}
              >
                {/* Une section devenue introuvable reste visible plutôt que
                    d'être effacée en silence — même règle que le menu principal. */}
                {connue ? (sections.find(s => s.id === id)?.label || id) : `⚠ ${id} (introuvable)`}
                <span className="opacity-30 group-hover:opacity-100">×</span>
              </button>
            );
          })}
          {disponibles.length > 0 && composante.sectionId !== '' && (
            <select
              value=""
              onChange={e => e.target.value && ecrireLesAutres([...autres, e.target.value])}
              title="Ajouter un sous-groupe où cette même valeur se lit"
              className="bg-transparent border border-dashed border-app-border/30 rounded-lg px-2 py-1 text-[10px] font-bold text-app-text/40 hover:border-accent/40 hover:text-accent outline-none cursor-pointer"
            >
              <option value="">+ sous-groupe</option>
              {disponibles.map(s => (
                <option key={s.id} value={s.id}>{s.label || s.id}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
    );
};

const EditeurDuJet: React.FC<EditeurDuJetProps> = ({ driver, gabarit, onUpdate }) => {
    const jet = driver.jet;
    const sections = gabarit?.sections ?? [];

    /** Toute écriture part d'un descripteur minimal viable. */
    const majJet = (patch: Partial<NonNullable<GameDriver['jet']>>) =>
        onUpdate({ jet: { sens: 'superieur-ou-egal', ...jet, ...patch } });

    const majReserve = (patch: Partial<NonNullable<NonNullable<GameDriver['jet']>['reserve']>>) =>
        majJet({ reserve: { base: 0, max: 10, faces: 6, ...jet?.reserve, ...patch } });

    const majSecondaire = (patch: Partial<NonNullable<NonNullable<NonNullable<GameDriver['jet']>['reserve']>['secondaire']>>) =>
        majReserve({ secondaire: { label: '', ...jet?.reserve?.secondaire, ...patch } });

    const cible = jet?.cible;

    /**
     * Toute écriture de cible part d'une cible complète.
     *
     * **La caractéristique naît avec elle**, vide mais présente : le contrôle du
     * pilote refuse une cible qui n'en porte aucune, et la Revue du Pilote est
     * TOMBÉE sur ce cas le 2026-08-22 — `undefined.sectionId`, et tout l'écran
     * qui existe pour signaler ce genre de défaut mis hors service par le défaut
     * qu'il devait nommer. Ici, il ne peut pas se produire.
     */
    const majCible = (patch: Partial<NonNullable<NonNullable<GameDriver['jet']>['cible']>>) =>
        majJet({
            cible: {
                mecanique: 'reves-de-dragons',
                caracteristique: { id: 'carac', label: 'Caractéristique', sectionId: '' },
                ...cible,
                ...patch,
            },
        });

    /**
     * Repasser à l'addition — **la clé disparaît, elle ne vaut pas `undefined`.**
     *
     * `estVide` traite les deux pareil, mais pas `JSON.stringify` ni la revue
     * qui lit les clés : un pilote exporté porterait une cible fantôme. On
     * retire la clé plutôt que de l'annuler.
     */
    const retirerLaCible = () => {
        const suivant = { sens: 'superieur-ou-egal' as const, ...jet };
        delete suivant.cible;
        onUpdate({ jet: suivant });
    };

    const nombre = (valeur: number | undefined, onChange: (n: number) => void, titre: string) => (
        <label className="flex-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/60 mb-2 block px-1">{titre}</span>
            <input
                type="number"
                value={valeur ?? 0}
                onChange={e => onChange(parseInt(e.target.value) || 0)}
                title={titre}
                className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 font-mono text-sm text-accent focus:border-accent/50 outline-none"
            />
        </label>
    );

    const listeDeComposantes = (
        titre: string,
        explication: string,
        liste: ComposanteDeJet[],
        ecrire: (suivante: ComposanteDeJet[]) => void,
    ) => (
        <div className="space-y-3">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 px-1">{titre}</p>
                <p className="text-[11px] text-app-text/40 italic px-1 mt-1 leading-relaxed">{explication}</p>
            </div>
            {liste.map((composante, i) => (
                <LigneDeComposante
                    key={i}
                    composante={composante}
                    sections={sections}
                    onChange={suivante => ecrire(liste.map((c, j) => (j === i ? suivante : c)))}
                    onRetirer={() => ecrire(liste.filter((_, j) => j !== i))}
                />
            ))}
            <button
                onClick={() => ecrire([...liste, { id: '', label: '', sectionId: '' }])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-accent/30 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 transition-all"
            ><Plus size={14} /> Ajouter une composante</button>
        </div>
    );

    return (
        <div className="p-8 bg-app-surface/20 border border-app-border/10 rounded-[2.5rem] backdrop-blur-sm space-y-8">
            <header className="flex items-center gap-3">
                <Dices className="text-accent" size={20} />
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-app-text">Composition du jet</h3>
                    <p className="text-[11px] text-app-text/40 italic mt-0.5">
                        Ce que le joueur retient sur sa fiche avant de lancer, et combien de dés il prend.
                    </p>
                </div>
            </header>

            {!gabarit && (
                <p className="text-[11px] text-amber-300/70 italic">
                    Ce pilote ne désigne aucune fiche : sans elle, aucune section où choisir.
                    Rattache-lui un gabarit ci-dessus.
                </p>
            )}

            {listeDeComposantes(
                'Réserve — combien de dés',
                'Chez Alien : « autant de dés que la somme de ton attribut et de ta compétence ». '
                + 'Laisse vide si le jeu lance un nombre fixe de dés.',
                jet?.reserve?.composantes ?? [],
                composantes => majReserve({ composantes }),
            )}

            <div className="flex gap-4">
                {nombre(jet?.reserve?.base, base => majReserve({ base }), 'Dés d’office')}
                {nombre(jet?.reserve?.max, max => majReserve({ max }), 'Plafond')}
                {nombre(jet?.reserve?.faces, faces => majReserve({ faces }), 'Faces')}
            </div>

            {/*
                **La seconde poule, comptée à part.**

                Chez Alien, les dés de stress se lancent avec la réserve mais un
                1 y déclenche la Panique — ce qu'un dé de base ne fait jamais.
                Les fondre dans la première réserve donnerait le bon NOMBRE de
                dés et perdrait la MÉCANIQUE : le compte des réussites serait
                juste, et la Panique ne se déclencherait jamais.
            */}
            <div className="space-y-3 pt-2 border-t border-app-border/10">
                <div className="flex gap-4 items-end">
                    <label className="flex-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/60 mb-2 block px-1">
                            Seconde poule — son nom
                        </span>
                        <input
                            type="text"
                            value={jet?.reserve?.secondaire?.label ?? ''}
                            onChange={e => majSecondaire({ label: e.target.value })}
                            placeholder="Stress, Équipement… — vide si le jeu n’en a pas"
                            title="Le nom que le jeu donne à cette seconde poule de dés"
                            className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-sm focus:border-amber-400/50 outline-none"
                        />
                    </label>
                    <label className="flex-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300/60 mb-2 block px-1">
                            Ce qu’un 1 déclenche
                        </span>
                        <input
                            type="text"
                            value={jet?.reserve?.secondaire?.libelleDuUn ?? ''}
                            onChange={e => majSecondaire({ libelleDuUn: e.target.value })}
                            placeholder="Panique…"
                            title="Le mot qui dira au meneur d’ouvrir sa table"
                            className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-sm focus:border-amber-400/50 outline-none"
                        />
                    </label>
                </div>
                {jet?.reserve?.secondaire?.label && listeDeComposantes(
                    `${jet.reserve.secondaire.label} — combien de dés`,
                    'Chez Alien : « un nombre de dés de stress égal au Niveau de Stress actuel ». '
                    + 'Cette poule échappe au plafond de la première.',
                    jet.reserve.secondaire.composantes ?? [],
                    composantes => majSecondaire({ composantes }),
                )}
            </div>

            {/*
                **La cible calculée, et pourquoi il lui fallait un écran.**

                Née le 2026-08-22 avec la table de Rêves de Dragons, elle n'était
                déclarable que par une dérivation. Corriger un pilote qui
                additionne là où le jeu multiplie demandait donc de repasser les
                huit groupes devant le modèle — et ça n'aurait pas suffi :
                `enrichirLePilote` remplit ce qui est vide et ne remplace jamais
                ce qui est rempli, donc l'ancien seuil serait resté à côté de la
                cible neuve.

                *C'est le défaut du 2026-08-15 à l'identique, celui qui a fait
                naître cet écran : la chose existe, fonctionne, et n'a pas d'écran
                — donc n'existe pas pour qui s'en sert.*
            */}
            <div className="space-y-3 pt-2 border-t border-app-border/10">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 px-1">
                        Cible calculée — quand le jeu croise sur une table
                    </p>
                    <p className="text-[11px] text-app-text/40 italic px-1 mt-1 leading-relaxed">
                        Chez Rêves de Dragons la compétence ne s’ajoute pas au pourcentage : elle déplace
                        la colonne, donc elle multiplie — Agilité 12 avec +3 vaut 78 % et non 15.
                        Laisse « aucune » si les valeurs de la fiche s’additionnent.
                    </p>
                </div>
                <select
                    value={cible?.mecanique ?? ''}
                    onChange={e => (e.target.value
                        ? majCible({ mecanique: e.target.value as NomDeMecanique })
                        : retirerLaCible())}
                    title="La table qui calcule la cible — elle vit dans le code, avec ses nombres transcrits du livre"
                    className="w-full bg-app-bg/40 px-5 py-3 rounded-2xl border border-app-border/20 text-sm focus:border-accent/50 outline-none cursor-pointer"
                >
                    <option value="">— aucune : le seuil s’additionne —</option>
                    {/*
                        **La liste vient du registre**, jamais d'une saisie. Un
                        pilote qui nomme « runequest » ou « percentile » ne calcule
                        aucune cible et affiche zéro ; ici le nom est inexprimable
                        s'il n'existe pas dans le code.
                    */}
                    {Object.keys(MECANIQUES_DE_CIBLE).map(nom => (
                        <option key={nom} value={nom}>{nom}</option>
                    ))}
                    {/* Une mécanique que cette version ne connaît plus reste visible
                        plutôt que d'être effacée en silence — même règle que les
                        sections introuvables. */}
                    {cible && !(cible.mecanique in MECANIQUES_DE_CIBLE) && (
                        <option value={cible.mecanique}>⚠ {cible.mecanique} (inconnue)</option>
                    )}
                </select>

                {cible && (
                    <div className="space-y-4 pl-1 pt-1">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 px-1">
                                Caractéristique — ce qui se lit en ordonnée
                            </p>
                            <p className="text-[11px] text-app-text/40 italic px-1 mt-1 mb-3 leading-relaxed">
                                Une seule. Sans elle la mécanique n’a rien à croiser : le jet vaudrait
                                zéro pour cent quel que soit le personnage, et un pourcentage faux ne se
                                plaint de rien.
                            </p>
                            <LigneDeComposante
                                composante={cible.caracteristique
                                    ?? { id: 'carac', label: 'Caractéristique', sectionId: '' }}
                                sections={sections}
                                onChange={caracteristique => majCible({ caracteristique })}
                            />
                        </div>
                        {listeDeComposantes(
                            'Ajustement — ce qui déplace la colonne',
                            'UNE ENTRÉE PAR SECTION, jamais une par champ : douze compétences dont le '
                            + 'joueur n’en jette qu’une font UNE seule entrée, et le menu lui proposera les '
                            + 'douze. La difficulté que le meneur fixe ne se met pas ici — elle a son réglage.',
                            cible.ajustement ?? [],
                            ajustement => majCible({ ajustement }),
                        )}
                    </div>
                )}

                {/*
                    **Les deux ne cohabitent pas, et le panneau de jet le paie
                    deux fois.** Il compose ses menus depuis la cible ET le seuil
                    réunis, et `LANCER` reste mort tant qu'il en manque un seul —
                    ou qu'une vieille entrée vise une section disparue. Le nombre,
                    lui, serait juste : la mécanique gagne. *Un écran qui exige
                    douze choix inutiles avant un jet correct est un écran qu'on
                    cesse d'utiliser.*

                    On propose de vider plutôt qu'on ne vide : douze composantes
                    sont peut-être un travail, et c'est au meneur de le jeter.
                */}
                {/*
                    **Le compte de réussites, quand une cible décide déjà.**

                    `difficulte` compte des réussites à atteindre — un héritage
                    de Dune. `cible` déplace la colonne d'une table. Les deux se
                    nomment « difficulté » et n'ont aucun rapport ; le pilote de
                    Rêves de Dragons redérivé portait les deux, et le panneau de
                    jet affichait **deux réglages homonymes côte à côte**.

                    Le moteur l'ignore désormais et le panneau ne l'affiche plus.
                    Mais **`difficulte` n'avait aucun écran d'édition** : on le
                    déclarait à la Forge et on ne pouvait plus jamais le retirer.
                    Demander son retrait sans offrir le geste, c'était refaire le
                    piège du 22/08 — *une chose qui n'a pas d'écran ne se corrige
                    qu'en la refabriquant en entier.* Question de David, le
                    2026-08-23 : « s'il est invisible, comment je le retire ? »

                    On propose de retirer, on ne retire pas : c'est un réglage
                    qu'un autre jeu emploierait légitimement.
                */}
                {cible && jet?.difficulte && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-400/30 bg-amber-500/5">
                        <p className="flex-1 text-[11px] text-amber-200/80 leading-relaxed">
                            Un <b>compte de réussites</b> ({jet.difficulte.min} à {jet.difficulte.max},
                            départ {jet.difficulte.defaut}) subsiste alors qu’une cible est déclarée.
                            Les deux se nomment « difficulté » et n’ont aucun rapport : la cible décide,
                            celui-ci est ignoré. Il ne sert plus à rien.
                        </p>
                        <button
                            onClick={() => onUpdate({ jet: { ...jet, difficulte: undefined } })}
                            className="px-4 py-2 rounded-xl border border-amber-400/40 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-400/10 transition-all shrink-0"
                        >Retirer le compte</button>
                    </div>
                )}

                {cible && (jet?.seuil ?? []).length > 0 && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-400/30 bg-amber-500/5">
                        <p className="flex-1 text-[11px] text-amber-200/80 leading-relaxed">
                            {(jet?.seuil ?? []).length} composantes de seuil subsistent alors qu’une cible
                            est déclarée. Elles ne servent plus à rien, et le panneau de jet les réclamera
                            toutes au joueur avant de le laisser lancer.
                        </p>
                        <button
                            onClick={() => majJet({ seuil: [] })}
                            className="px-4 py-2 rounded-xl border border-amber-400/40 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-400/10 transition-all shrink-0"
                        >Vider le seuil</button>
                    </div>
                )}
            </div>

            {listeDeComposantes(
                'Seuil — la valeur à laquelle un dé se compare',
                cible
                    ? 'Une cible calculée est déclarée au-dessus, et c’est ELLE qui décide. '
                      + 'Tout ce qui reste ici sera réclamé au joueur sans jamais servir : la liste doit être vide.'
                    : 'Chez Dune : une compétence plus un principe, choisis test par test. '
                      + 'Laisse vide si le jeu compare à une valeur FIXE — « chaque six est une réussite ».',
                jet?.seuil ?? [],
                seuil => majJet({ seuil }),
            )}

            {/*
                **Le seuil fixe, quand rien ne le compose.**

                Les deux s'excluent, et c'est pour ça qu'on ne montre l'un que
                si l'autre est vide : afficher les deux ferait croire qu'ils
                s'additionnent, alors que le composé l'emporte.

                Note pour les jeux à Year Zero Engine : le moteur `yze` compte
                les six **en dur** et ne lit pas ce champ. Le renseigner ne
                nuit pas — il documente la règle et sert si l'on change de
                moteur — mais il ne change rien tant que `yze` est choisi.
            */}
            {(jet?.seuil ?? []).length === 0 && (
                <div className="flex gap-4 items-end">
                    {nombre(
                        driver.dice?.successThreshold,
                        successThreshold => onUpdate({ dice: { ...driver.dice, successThreshold } }),
                        'Seuil fixe',
                    )}
                    <p className="flex-[2] text-[11px] text-app-text/40 italic leading-relaxed pb-3">
                        La valeur à atteindre — ou à ne pas dépasser — sur chaque dé.
                        Le moteur « yze » compte les six de lui-même et ignore ce champ.
                    </p>
                </div>
            )}

            <div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/60 mb-2 block px-1">
                    Sens de la comparaison
                </span>
                <select
                    value={jet?.sens ?? 'superieur-ou-egal'}
                    onChange={e => majJet({ sens: e.target.value as NonNullable<GameDriver['jet']>['sens'] })}
                    title="Un dé est-il une réussite au-dessus ou en dessous ?"
                    className="w-full bg-app-bg/40 px-5 py-3 rounded-2xl border border-app-border/20 text-sm focus:border-accent/50 outline-none cursor-pointer"
                >
                    <option value="superieur-ou-egal">Réussite au-dessus — « chaque six est une réussite »</option>
                    <option value="sous-ou-egal">Réussite en dessous — « chaque dé sous le seuil »</option>
                </select>
                <p className="text-[11px] text-app-text/40 italic px-1 mt-2 leading-relaxed">
                    Les deux se ressemblent et s’inversent : un jet résolu à l’envers ne se voit jamais en séance.
                </p>
            </div>
        </div>
    );
};

export default EditeurDuJet;
