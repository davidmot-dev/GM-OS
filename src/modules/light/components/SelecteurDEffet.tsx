import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, Palette, Trash2, Wand2, SlidersHorizontal } from 'lucide-react';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { useLightStore } from '../useLightStore';
import {
    CATALOGUE_DES_EFFETS, CATEGORIES, type CategorieDEffet,
} from '../logic/catalogueDesEffets';
import { chercherUnEffet, type EffetCherchable } from '../logic/rechercheDEffet';
import { identifiantDeVariante } from '../logic/varianteDEffet';
import { identifiantDAtelier } from '../logic/effetDAtelier';
import AtelierDEffet from './AtelierDEffet';

/**
 * **Choisir un effet parmi cinquante — sans descendre un couloir.**
 *
 * David, le 2026-09-18, après avoir créé ses premières ambiances : *« je pense
 * que la liste déroulante n'est plus adaptée avec 40 items, je pense qu'il faut
 * passer par un écran volant. »*
 *
 * ⛔ **Et le vrai défaut était ailleurs, sous ce symptôme.** Ses copies
 * existaient, elles jouaient, elles se capturaient dans une tuile — mais elles
 * n'étaient **atteignables** que tout en haut d'un menu de cinquante entrées, et
 * **modifiables** que sur une lampe en train de les jouer. *La chaîne était
 * complète et il n'y avait pas de porte pour y revenir* — le motif que ce dépôt
 * a payé sept fois.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CET ÉCRAN FAIT, ET QU'UNE LISTE DÉROULANTE NE PEUT PAS FAIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - **Chercher.** Par le nom, par l'identifiant du guide, et — pour une
 *   ambiance — **par l'effet dont elle descend** : taper « torche » ramène la
 *   torche *et* la bleue qu'on en a tirée. Sans ça, une copie se perd derrière
 *   le nom qu'on lui a donné.
 * - **Montrer les ambiances comme des objets**, avec leur origine, et les
 *   laisser se supprimer sans avoir à les jouer d'abord.
 * - **Dupliquer depuis n'importe quel effet**, sans quitter l'écran ni changer
 *   ce que la lampe joue.
 *
 * ⚠️ Échap le ferme, par le registre des surcouches — *Échap fait ce que fait le
 * bouton de fermeture, jamais plus.*
 */

interface Props {
    /** L'effet que joue la lampe, ou `''` quand il n'y a pas de lampe. */
    effetActuel: string;
    /** Le nom de la lampe, pour que le meneur sache ce qu'il règle. */
    nomDeLaLampe: string;
    /**
     * **Poser l'effet choisi sur une lampe — facultatif depuis le 2026-09-21.**
     *
     * ⛔ **Son absence est une porte, pas une dégradation.** L'atelier d'effets
     * vit dans cet écran, et cet écran ne s'ouvrait que depuis le pied de page
     * d'une **lampe** : sans pont branché ni mode simulé, il n'y a aucune lampe,
     * donc aucune porte — alors que l'atelier sait très bien travailler sans
     * elles. *Une fonctionnalité qu'on ne peut pas atteindre n'existe pas.*
     *
     * Ouvert depuis la barre du haut de Light-OS, l'écran sert donc à **gérer** :
     * créer un effet, le régler, en tirer une ambiance. Seul le geste de *poser*
     * est indisponible, et il se dit.
     */
    onChoisir?: (valeur: string) => void;
    onFermer: () => void;
}

const SelecteurDEffet: React.FC<Props> = ({ effetActuel, nomDeLaLampe, onChoisir, onFermer }) => {
    const { t } = useTranslation('modules');
    const [recherche, setRecherche] = React.useState('');

    const variantes = useLightStore(s => s.variantes);
    const creerUneVariante = useLightStore(s => s.creerUneVariante);
    const supprimerUneVariante = useLightStore(s => s.supprimerUneVariante);

    const effetsDAtelier = useLightStore(s => s.effetsDAtelier);
    const creerUnEffetDAtelier = useLightStore(s => s.creerUnEffetDAtelier);
    const supprimerUnEffetDAtelier = useLightStore(s => s.supprimerUnEffetDAtelier);
    /** L'effet ouvert à l'atelier, par-dessus cet écran — `null` sinon. */
    const [atelier, setAtelier] = React.useState<string | null>(null);

    useFermetureParEchap(true, onFermer, 'Sélecteur d’effet');

    const nomDe = (valeur: string) =>
        t(`light.footer.effects.${valeur === 'lightning' ? 'storm' : valeur}`, { defaultValue: valeur });

    /** Le catalogue et les ambiances, sous la forme que la recherche sait lire. */
    const tout: (EffetCherchable & {
        categorie?: CategorieDEffet; teinte?: string; idVariante?: string; idAtelier?: string;
    })[] = [
        /*
          ⭐ **Les effets de l'atelier passent devant, et devant les ambiances.**
          Ce sont les seuls que le meneur a écrits lui-même : ils n'ont aucune
          chance d'être retrouvés par le nom d'un effet du catalogue, puisqu'ils
          n'en descendent pas. *Ce qu'on ne peut trouver que par soi-même se met
          en haut.*
        */
        ...effetsDAtelier.map(e => ({
            valeur: identifiantDAtelier(e.id),
            nom: e.nom,
            idAtelier: e.id,
        })),
        ...variantes.map(v => ({
            valeur: identifiantDeVariante(v.id),
            nom: v.nom,
            origine: nomDe(v.source),
            idVariante: v.id,
        })),
        ...CATALOGUE_DES_EFFETS.map(e => ({
            valeur: e.valeur,
            nom: nomDe(e.valeur),
            categorie: e.categorie,
            teinte: e.teinte,
        })),
    ];

    const trouves = chercherUnEffet(tout, recherche);
    const ambiances = trouves.filter(e => e.idVariante);
    const mesEffets = trouves.filter(e => e.idAtelier);
    const parCategorie = (c: CategorieDEffet) => trouves.filter(e => e.categorie === c);

    /** Y a-t-il une lampe sur qui poser un effet ? */
    const peutPoser = Boolean(onChoisir);
    const choisir = (valeur: string) => {
        if (!onChoisir) return;
        onChoisir(valeur);
        onFermer();
    };

    /** Duplique sans fermer : on peut en faire plusieurs d'affilée. */
    const dupliquer = (valeur: string) => creerUneVariante(valeur, nomDe(valeur));

    const pastille = (
        valeur: string, nom: string, teinte: string | undefined, enCours: boolean,
    ) => (
        <button
            key={valeur}
            onClick={() => choisir(valeur)}
            disabled={!peutPoser}
            className={`px-3 py-2 rounded-lg text-left text-xs font-bold border transition-all truncate
                ${enCours
                    ? 'bg-accent/20 border-accent text-accent'
                    : `bg-app-bg/60 border-app-border/30 ${teinte ?? 'text-app-text/80'} ${
                        peutPoser ? 'hover:border-accent/50' : 'opacity-50 cursor-default'
                    }`}`}
            title={peutPoser ? nom : t('light.footer.selecteur.sansLampe')}
        >
            {nom}
        </button>
    );

    /*
      ⛔ **UN PORTAIL, ET IL N'EST PAS DÉCORATIF.**

      Cet écran s'ouvre désormais aussi depuis la **barre du haut** de Light-OS,
      dont le `<header>` porte `backdrop-blur-sm`. Or `backdrop-filter` **crée un
      bloc conteneur pour les éléments `fixed` qu'il contient** : monté là,
      l'écran n'était plus positionné par rapport à la fenêtre mais par rapport au
      bandeau — décalé, rogné, et son `z-50` enfermé sous le `z-10` du header.
      David, capture à l'appui : *« le bouton mes effets dans Light-OS ouvre une
      fenêtre illisible »*.

      ⭐ ***Un élément ne peut pas sortir de l'ordre de peinture de son parent*** —
      la règle du Media Hub, puis du menu d'atmosphère (§ 90), et maintenant
      d'ici. Le portail rend l'écran à `document.body`, d'où aucun ascendant ne
      peut plus le retenir.

      ⚠️ **Et c'est ce que l'essai E2E disait déjà.** Playwright refusait de
      cliquer — *« element is outside of the viewport »* — et `elementFromPoint`
      ne rendait rien au centre de la boîte mesurée : les deux symptomes d'un
      élément positionné dans un autre repère. *Un contrôle mécanique qu'on
      explique au lieu de l'écouter ne sert à rien.*
    */
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-app-surface border border-app-border/20 shadow-2xl overflow-hidden">

                <div className="flex items-center gap-3 p-4 border-b border-app-border/10">
                    <Search size={16} className="text-app-text/30 shrink-0" />
                    <input
                        autoFocus
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        /*
                          ⚠️ Échap dans un champ de saisie vide la recherche au lieu
                          de refermer l'écran derrière — mais **seulement s'il y a
                          quelque chose à vider.**

                          ⛔ Le premier jet arrêtait Échap **toujours**. Or ce champ
                          porte `autoFocus` : l'écran s'ouvrait donc dans un état où
                          **Échap ne pouvait plus jamais le fermer**, ce que le
                          registre des surcouches interdit — *Échap ferme celle du
                          dessus.* Trouvé par l'essai E2E, qui n'arrivait plus à
                          rouvrir l'écran après l'avoir fermé.

                          ⭐ *Un garde qui protège un geste doit rendre la main quand
                          il n'a plus rien à protéger.*
                        */
                        onKeyDown={(e) => {
                            if (e.key !== 'Escape' || !recherche) return;
                            e.stopPropagation();
                            setRecherche('');
                        }}
                        placeholder={t('light.footer.selecteur.chercher')}
                        className="flex-1 bg-transparent border-none p-0 text-sm text-app-text outline-none min-w-0"
                    />
                    <span className="text-ui-10 text-app-text/30 shrink-0 hidden sm:inline">
                        {peutPoser ? nomDeLaLampe : t('light.footer.selecteur.gestionSeule')}
                    </span>
                    <button onClick={onFermer} className="p-1 text-app-text/30 hover:text-app-text shrink-0">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">

                    {/* Arrêter, et la boucle native : deux gestes, pas deux effets. */}
                    {recherche.trim() === '' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {pastille('none', t('light.footer.effects.steady'), 'text-app-text/50', effetActuel === 'none')}
                            {pastille('colorloop', t('light.footer.effects.colorloop'), 'text-accent', effetActuel === 'colorloop')}
                        </div>
                    )}

                    {/*
                      ⛔ **La porte de l'atelier est ici, et pas ailleurs.** Un
                      effet neuf se crée au moment où l'on cherche un effet et
                      qu'aucun des quarante-huit ne fait l'affaire — c'est le
                      seul instant où l'idée existe. *Un atelier rangé dans les
                      réglages ne s'ouvre jamais.*
                    */}
                    <section className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">
                                {t('light.footer.categories.atelier')}
                            </p>
                            <button
                                onClick={() => setAtelier(creerUnEffetDAtelier())}
                                className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg border border-accent/30 text-accent/80 hover:text-accent hover:bg-accent/10 text-ui-10 font-bold uppercase tracking-widest transition-colors"
                            >
                                <Wand2 size={12} /> {t('light.footer.atelier.creer')}
                            </button>
                        </div>

                        {mesEffets.length === 0 ? (
                            <p className="text-ui-10 text-app-text/25 italic">
                                {t('light.footer.atelier.vide')}
                            </p>
                        ) : mesEffets.map(e => (
                            <div
                                key={e.valeur}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all
                                    ${effetActuel === e.valeur
                                        ? 'bg-accent/15 border-accent/60'
                                        : 'bg-app-bg/60 border-app-border/30'}`}
                            >
                                <button
                                    onClick={() => choisir(e.valeur)}
                                    disabled={!peutPoser}
                                    title={peutPoser ? undefined : t('light.footer.selecteur.sansLampe')}
                                    className={`flex-1 text-left min-w-0 ${peutPoser ? '' : 'cursor-default'}`}
                                >
                                    <span className="block text-xs font-bold text-sky-200 truncate">{e.nom}</span>
                                    <span className="block text-ui-10 text-app-text/40 truncate">
                                        {t('light.footer.atelier.resume', {
                                            etapes: effetsDAtelier.find(x => x.id === e.idAtelier)?.etapes.length ?? 0,
                                        })}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setAtelier(e.idAtelier!)}
                                    className="shrink-0 p-1 text-app-text/25 hover:text-accent transition-colors"
                                    title={t('light.footer.atelier.regler')}
                                >
                                    <SlidersHorizontal size={14} />
                                </button>
                                <button
                                    onClick={() => supprimerUnEffetDAtelier(e.idAtelier!)}
                                    className="shrink-0 p-1 text-app-text/25 hover:text-red-400 transition-colors"
                                    title={t('light.footer.atelier.supprimer')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </section>

                    {ambiances.length > 0 && (
                        <section className="flex flex-col gap-2">
                            <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">
                                {t('light.footer.categories.ambiances')}
                            </p>
                            {ambiances.map(a => (
                                <div
                                    key={a.valeur}
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all
                                        ${effetActuel === a.valeur
                                            ? 'bg-accent/15 border-accent/60'
                                            : 'bg-app-bg/60 border-app-border/30'}`}
                                >
                                    <button
                                        onClick={() => choisir(a.valeur)}
                                        disabled={!peutPoser}
                                        title={peutPoser ? undefined : t('light.footer.selecteur.sansLampe')}
                                        className={`flex-1 text-left min-w-0 ${peutPoser ? '' : 'cursor-default'}`}
                                    >
                                        <span className="block text-xs font-bold text-amber-200 truncate">{a.nom}</span>
                                        <span className="block text-ui-10 text-app-text/40 truncate">
                                            {t('light.footer.ambiances.from', { source: a.origine })}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => supprimerUneVariante(a.idVariante!)}
                                        className="shrink-0 p-1 text-app-text/25 hover:text-red-400 transition-colors"
                                        title={t('light.footer.ambiances.delete')}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </section>
                    )}

                    {CATEGORIES.map(c => {
                        const effets = parCategorie(c);
                        if (effets.length === 0) return null;
                        return (
                            <section key={c} className="flex flex-col gap-2">
                                <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/40">
                                    {t(`light.footer.categories.${c}`)}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {effets.map(e => (
                                        <div key={e.valeur} className="flex items-stretch gap-1">
                                            <div className="flex-1 min-w-0 flex">
                                                {pastille(e.valeur, e.nom, e.teinte, effetActuel === e.valeur)}
                                            </div>
                                            {/*
                                              Dupliquer sans fermer ni changer ce que joue la lampe :
                                              on peut se faire trois variantes d'affilée, puis choisir.
                                            */}
                                            <button
                                                onClick={() => dupliquer(e.valeur)}
                                                className="shrink-0 px-2 rounded-lg border border-app-border/30 text-app-text/25 hover:text-accent hover:border-accent/50 transition-colors"
                                                title={t('light.footer.ambiances.duplicate')}
                                            >
                                                <Palette size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    {trouves.length === 0 && (
                        <p className="text-ui-11 text-app-text/30 italic py-8 text-center">
                            {t('light.footer.selecteur.rien')}
                        </p>
                    )}
                </div>

                <p className="px-4 py-2 border-t border-app-border/10 text-ui-10 text-app-text/25">
                    {t('light.footer.selecteur.aide')}
                </p>
            </div>

            {atelier && <AtelierDEffet effetId={atelier} onFermer={() => setAtelier(null)} />}
        </div>,
        document.body,
    );
};

export default SelecteurDEffet;
