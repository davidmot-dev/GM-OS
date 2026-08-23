import React, { Fragment, useMemo, useState } from 'react';
import { Dices, AlertTriangle, Info, Plus, Minus, Coins } from 'lucide-react';
import { EtiquetteDuDegre } from '../../../dice/EtiquetteDuDegre';
import { consignerLeJet } from '../../../journal/consignerLeJet';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import {
    preparerLeJet, sectionsDeLaComposante, verdict,
    type ComposanteDeJet, type DescripteurDeJet,
} from '../../../dice/DescripteurDeJet';
import { ventilerLaDepense, type RessourceDeTable } from '../../../table/RessourcesDeTable';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * Lancer depuis la fiche de personnage.
 *
 * **Ce qu'il change.** Jusqu'ici la fiche était un formulaire : on y notait des
 * valeurs qu'il fallait reporter à la main dans Dice OS pour lancer. Le seuil,
 * chez Dune, se calcule à partir de deux champs de la fiche — une compétence et
 * un principe — et personne ne pouvait faire ce calcul à la place du joueur.
 *
 * **Le résultat reste sur la fiche**, à côté des valeurs qui l'ont produit. On
 * voit d'où vient le seuil, ce qui est la moitié de l'intérêt : un jet dont on
 * ne sait pas de quoi il est fait ne se vérifie pas.
 *
 * Le panneau ne s'affiche que si le pilote décrit ses jets. Un système sans
 * descripteur garde sa fiche telle quelle, sans bouton mort.
 */
/** Ce que le sélecteur affiche, et ce que le journal de séance retient. */
const LIBELLES = { avantage: 'Avantage', desavantage: 'Désavantage' } as const;

interface PanneauDeJetProps {
    descripteur: DescripteurDeJet;
    dice: DiceConfig;
    template: SheetTemplate;
    /** Valeurs courantes de la fiche, telles que l'éditeur les tient. */
    valeurs: Record<string, unknown>;
    /**
     * De quoi faire payer les dés et créditer l'excédent.
     *
     * Les deux facultatifs et solidaires : un système sans monnaie de table
     * garde le panneau tel quel, les dés y sont simplement gratuits.
     */
    campaignId?: string;
    ressourcesDeTable?: RessourceDeTable[];
    /**
     * Le panneau tourne sur la tablette d'un joueur.
     *
     * Le jet est **exactement le même** — mêmes dés, même seuil, même règle :
     * *un jet qui change selon l'écran d'où on le lance n'est pas le même jet.*
     * Seule la dépense change de chemin : elle doit remonter au meneur au lieu
     * de rester dans la fenêtre où elle a été faite.
     */
    pourLesJoueurs?: boolean;
}

const PanneauDeJet: React.FC<PanneauDeJetProps> = ({
    descripteur, dice, template, valeurs, campaignId, ressourcesDeTable, pourLesJoueurs = false,
}) => {
    /** Champ retenu pour chaque composante — `{ competence: 'combat' }`. */
    const [choix, setChoix] = useState<Record<string, string>>({});
    const [desAchetes, setDesAchetes] = useState(0);
    // Un jeu sans difficulté déclarée n'en affiche pas, et part de zéro : chez
    // Alien, un seul six suffit — il n'y a pas de seuil à atteindre.
    const [difficulte, setDifficulte] = useState(descripteur.difficulte?.defaut ?? 0);
    /**
     * L'ajustement de difficulté — **et ce n'est pas la même chose que
     * `difficulte`**, qui compte des réussites à atteindre. Celui-ci déplace la
     * colonne de la table et change le pourcentage. Zéro est la difficulté
     * moyenne, et c'est pourquoi il est le défaut.
     */
    const [ajustementDeDifficulte, setAjustementDeDifficulte] = useState(0);
    const [resultat, setResultat] = useState<RollResult | null>(null);
    const [seuilDuLancer, setSeuilDuLancer] = useState(0);
    /**
     * Avantage, désavantage, ou rien — **la règle de Dice OS**, et c'est
     * délibérément la même : *un jet qui change selon l'écran d'où on le lance
     * n'est pas le même jet.* On lance deux dés et on garde le meilleur, ou le
     * moins bon ; « meilleur » se lit selon le sens du comptage, donc le PLUS
     * BAS sur un jeu qui jette sous un seuil.
     */
    const [modificateur, setModificateur] = useState<'aucun' | 'avantage' | 'desavantage'>('aucun');
    /** Ce que le dernier lancer a fait aux réserves de la table. */
    const [mouvements, setMouvements] = useState<string[]>([]);

    const { etatDe, depenser, gagner, ajusterDepuisLaTablette } = useRessourcesDeTableStore();
    const monnaie = campaignId && ressourcesDeTable?.length ? { campaignId, ressourcesDeTable } : null;

    /**
     * Débiter ou créditer la réserve, du bon côté du réseau.
     *
     * Sur la tablette, `depenser` n'écrirait que dans la fenêtre du joueur : sa
     * réserve baisserait chez lui et nulle part ailleurs, ce qui est pire que
     * de ne pas la lui donner — deux tables joueraient avec deux Impulsions.
     *
     * `motif` accompagne le mouvement jusqu'au journal de séance : *une
     * Impulsion qui passe de quatre à un ne veut rien dire sans le jet qui l'a
     * dépensée.*
     */
    const mouvoir = (id: string, delta: number, motif: string) => {
        if (!monnaie) return { avertissements: [] as string[] };
        if (pourLesJoueurs) {
            return ajusterDepuisLaTablette(monnaie.campaignId, monnaie.ressourcesDeTable, id, delta, motif);
        }
        return delta < 0
            ? depenser(monnaie.campaignId, monnaie.ressourcesDeTable, id, -delta, motif)
            : gagner(monnaie.campaignId, monnaie.ressourcesDeTable, id, delta, motif);
    };

    /**
     * Les champs proposés pour une composante, **groupés par sous-groupe**.
     *
     * **La résolution est partagée avec `preparerLeJet`**, et c'est essentiel :
     * un menu rempli depuis une section que le calcul ignorerait — ou l'inverse
     * — rendrait un jet dont l'écran et le moteur ne parlent plus du même
     * endroit de la fiche.
     *
     * **On rend les sections, pas une liste à plat de champs.** Chez Rêves de
     * Dragons une composante peut couvrir plusieurs sous-groupes de compétences,
     * et fondre trente entrées en une seule liste rendrait le menu illisible là
     * où il sert : à table, de loin, en parlant. Les sections deviennent des
     * `optgroup`, ce qui garde le geste que le meneur connaît — le sous-groupe,
     * puis la compétence — **en un seul menu au lieu de deux.**
     */
    const sousGroupesDe = (composante: ComposanteDeJet) =>
        sectionsDeLaComposante(template.sections, composante).sections;

    const jet = useMemo(
        () => preparerLeJet(
            descripteur, valeurs,
            { champs: choix, desSupplementaires: desAchetes, difficulte, ajustementDeDifficulte },
            template.sections,
        ),
        [descripteur, valeurs, choix, desAchetes, difficulte, ajustementDeDifficulte, template.sections],
    );

    /*
      **Le seuil composé ne remplace un seuil fixe que s'il existe.**

      Le panneau écrasait `dice.successThreshold` par `jet.seuil` dans tous les
      cas. Or un jeu à réserve n'en compose aucun : `jet.seuil` vaut alors
      **zéro**, et `rollFromConfig` traite ce zéro comme une absence —
      `(… ?? config.successThreshold) || 10`. Un pilote déclarant « chaque six
      est une réussite » aurait donc lancé contre **dix**.

      Alien y échappait par chance : son moteur `yze` court-circuite ce chemin et
      compte les six en dur. Le défaut n'attendait que le premier jeu à réserve
      déclarant un autre moteur.
    */
    const seuilDuMoteur = jet.composantes.length > 0 ? jet.seuil : dice.successThreshold;

    /**
     * L'Avantage ne s'offre que là où il veut dire quelque chose.
     *
     * *Lancer un dé de plus et garder celui qu'on préfère* suppose qu'un seul
     * dé tranche, et qu'il y ait une valeur à comparer. Sur une réserve il n'y a
     * pas de « meilleur dé », il y a un compte de réussites — proposer le
     * sélecteur là inviterait à inventer une règle que le jeu n'a pas, ce que
     * l'outil ne fait jamais.
     *
     * La liste des moteurs qui résolvent eux-mêmes vit dans `DiceEngine`, et
     * nulle part ailleurs : recopiée ici, elle dériverait.
     */
    const avantagePossible = DiceEngine.unSeulDeDecide(dice.engine, jet.nombreDeDes)
        && !!seuilDuMoteur;

    /**
     * **Tout ce que le joueur doit retenir sur sa fiche, en une seule liste.**
     *
     * Elle vivait en deux exemplaires — l'une pour savoir si le jet est prêt,
     * l'autre pour dessiner les menus — et elles ne portaient pas le même ordre.
     * *Deux listes de la même chose finissent par diverger* : ajouter la cible
     * à l'une seulement aurait donné un menu qu'on ne peut pas remplir, ou un
     * bouton qui part sans caractéristique.
     */
    const composantesARetenir = useMemo(() => [
        ...(descripteur.cible ? [descripteur.cible.caracteristique] : []),
        ...(descripteur.cible?.ajustement ?? []),
        ...(descripteur.reserve?.composantes ?? []),
        ...(descripteur.reserve?.secondaire?.composantes ?? []),
        ...(descripteur.seuil ?? []),
    ], [descripteur]);

    /** Rien ne part tant que chaque composante n'a pas son champ. */
    // Un jeu qui ne compose rien depuis la fiche est prêt d'emblée. Les
    // composantes de la réserve comptent autant que celles du seuil : lancer
    // sans attribut ni compétence donnerait une poignée de dés arbitraire.
    const pret = composantesARetenir.every(c => choix[c.id]) && jet.avertissements.length === 0;

    /**
     * D'où sortiront les points, **avant** de lancer.
     *
     * Chez Dune, les dés qu'on ne peut pas payer en Impulsion se paient en
     * Menace : la dépense alimente la réserve du meneur. Ce n'est jamais une
     * surprise acceptable — donc on l'annonce, et le joueur décide ensuite.
     */
    const ventilation = useMemo(() => {
        if (!monnaie || !jet.cout.ressource || jet.cout.total === 0) return null;
        const etat = etatDe(monnaie.campaignId, monnaie.ressourcesDeTable);
        return ventilerLaDepense(monnaie.ressourcesDeTable, etat, jet.cout.ressource, jet.cout.total);
    }, [monnaie, jet.cout.ressource, jet.cout.total, etatDe]);

    const nomDe = (id?: string) =>
        ressourcesDeTable?.find(r => r.id === id)?.label ?? id ?? '';

    const lancer = () => {
        const dits: string[] = [];

        // Le coût se prélève au moment où l'on s'engage, pas pendant qu'on
        // tourne les boutons : régler avant de lancer ferait payer les
        // hésitations.
        /**
         * Ce que le jet a coûté, dit au journal avec ce qui l'a composé.
         *
         * « Jet : Combat + Devoir (seuil 11), 2 dés achetés » — relire une
         * séance et y trouver une Impulsion tombée de quatre à un sans savoir
         * pourquoi ne renseigne sur rien.
         */
        const dit = modificateur === 'aucun' ? '' : ` avec ${LIBELLES[modificateur]}`;
        const enTete = (jet.composantes.length > 0
            ? `Jet : ${jet.composantes.map(c => c.label).join(' + ')} (seuil ${jet.seuil})`
            : `Jet : ${jet.nombreDeDes}d${jet.faces}`) + dit;

        if (monnaie && jet.cout.ressource && jet.cout.total > 0) {
            dits.push(...mouvoir(
                jet.cout.ressource, -jet.cout.total,
                `${enTete}, ${jet.desAchetes} dé${jet.desAchetes > 1 ? 's' : ''} acheté${jet.desAchetes > 1 ? 's' : ''}`,
            ).avertissements);
        }

        /*
          **La seconde poule part avec la première, et compte à part.**

          `rollYZE` distingue les deux depuis toujours — les 1 de la seconde
          deviennent des « fléaux » — mais **personne ne lui passait le
          nombre** : `gearCount` restait à zéro. Un personnage d'Alien lançait
          donc sa réserve sans ses dés de stress, et la Panique ne pouvait pas
          se déclencher. Le moteur savait faire ; le chemin s'arrêtait avant lui.
        */
        /*
          **Avantage et désavantage court-circuitent le pilote, et c'est voulu.**

          Le jet ne se compte plus, il se tranche : deux dés, on en garde un.
          `rollAdvantage` sait déjà lire le sens — en « sous-ou-egal », le
          meilleur dé est le PLUS BAS —, et il conserve le dé écarté dans son
          résultat, marqué `isDropped`. *On montre les deux dés :* garder pour
          le joueur la trace de ce qu'il a évité est la moitié de l'intérêt, et
          c'est aussi ce qui permet au meneur de trancher autrement quand la
          fiche dit « généralement le plus bas ».

          Le verdict se relit ensuite dans la monnaie commune du panneau — une
          réussite ou zéro —, sans quoi l'écran afficherait « Échec » sur un dé
          qui passe : `verdict` compte des réussites, et `rollAdvantage` n'en
          rend pas.
        */
        const res = modificateur !== 'aucun' && avantagePossible
            ? (() => {
                const brut = DiceEngine.rollAdvantage(
                    jet.faces,
                    0,
                    modificateur === 'avantage',
                    seuilDuMoteur!,
                    jet.sens === 'sous-ou-egal' ? 'under' : 'over',
                    jet.echelle,
                );
                return { ...brut, successes: brut.tagSuccess ? 1 : 0, fails: 0 };
            })()
            : DiceEngine.rollFromConfig(
                // `jet.sens` accompagne le seuil : sans lui, une réserve « sous
                // le seuil » comptait les dés au-dessus, et rendait des
                // réussites plausibles et exactement inverses.
                { ...dice, successThreshold: seuilDuMoteur, sens: jet.sens },
                {
                    baseCount: jet.nombreDeDes,
                    gearCount: jet.desSecondaires,
                    doubleSous: jet.doubleSous,
                    // Sans elle, le moteur retomberait sur le booléen : réussi ou
                    // raté, et jamais « particulière ». C'est le même oubli que
                    // `jet.sens`, qui n'arrivait pas non plus jusqu'ici.
                    echelle: jet.echelle,
                },
            );
        setSeuilDuLancer(jet.seuil);
        setResultat(res);

        /*
          **Le panneau de fiche ne traverse pas le registre des dés**, donc il
          consigne lui-même. Ses jets n'apparaissaient ni dans l'historique du
          pupitre, ni au journal : le seul moment où ils laissaient une trace
          était quand ils dépensaient une ressource, et c'est le MOUVEMENT de
          réserve qui était consigné, pas le jet.

          Le brancher sur `setLastRoll` l'aurait aussi projeté sur le Hub des
          joueurs — un changement de comportement que ce chantier n'a pas à
          faire. On appelle donc le même décideur, par l'autre porte.
        */
        consignerLeJet({
            titre: jet.composantes.length > 0
                ? jet.composantes.map(c => c.label).join(' + ')
                : `${jet.nombreDeDes}d${jet.faces}`,
            totalDisplay: res.totalDisplay,
            degre: res.degre,
            tagSuccess: res.tagSuccess,
            seuil: descripteur.cible || jet.composantes.length > 0 ? jet.seuil : undefined,
        });

        /**
         * « Après la résolution d'un test réussi, chaque réussite excédentaire
         * génère un point d'Impulsion ajouté à la réserve du groupe. »
         *
         * Le crédit est automatique parce que la règle l'est — `verdict` rend
         * un excédent nul sur un échec, ce qui couvre « aucune Impulsion ne
         * peut être générée si le test échoue ». Le plafond, lui, se dit :
         * gagner trois points et n'en voir arriver qu'un doit s'expliquer.
         */
        if (monnaie && jet.cout.ressource) {
            const excedent = verdict(res.successes ?? 0, jet.reussitesRequises).excedent;
            if (excedent > 0) {
                dits.push(...mouvoir(
                    jet.cout.ressource, excedent,
                    `${enTete}, ${excedent} réussite${excedent > 1 ? 's' : ''} excédentaire${excedent > 1 ? 's' : ''}`,
                ).avertissements);
            }
        }

        setMouvements(dits);
    };

    const reussites = resultat?.successes ?? 0;
    const v = verdict(reussites, jet.reussitesRequises);
    // Un dé écarté n'a rien déclenché : le compter ici annoncerait une
    // complication que le tirage vient précisément d'éviter.
    const complications = descripteur.complication
        ? (resultat?.rolls ?? []).filter(
            d => !d.isDropped && typeof d.val === 'number' && d.val >= descripteur.complication!,
        ).length
        : 0;

    return (
        <div className="space-y-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
            <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                <Dices size={14} /> Lancer un test
            </h3>

            {/*
                Les composantes que le joueur retient sur sa fiche : celles du
                seuil, et **celles de la réserve**.

                Chez Alien le nombre de dés vaut un attribut plus une compétence
                — le pilote ne savait offrir qu'un nombre fixe, et tous les
                personnages lançaient la même poignée. Les deux familles se
                choisissent au même endroit parce que c'est le même geste : le
                joueur désigne ce qu'il invoque, avant de lancer.
            */}
            <div className="grid grid-cols-2 gap-3">
                {composantesARetenir.map(composante => {
                  const sousGroupes = sousGroupesDe(composante);
                  return (
                    <label key={composante.id} className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">
                            {composante.label}
                        </span>
                        <select
                            value={choix[composante.id] ?? ''}
                            onChange={e => setChoix(c => ({ ...c, [composante.id]: e.target.value }))}
                            className="bg-app-bg/60 border border-app-border/40 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-accent/50"
                        >
                            <option value="">— choisir —</option>
                            {/*
                                **Un seul sous-groupe ne s'annonce pas.** Coiffer
                                une liste unique du nom de sa section ajouterait
                                une ligne qui ne distingue rien — l'`optgroup` ne
                                sert que là où il y a un choix de sous-groupe à
                                faire, et c'est le cas de Rêves de Dragons, pas
                                celui de Dune.
                            */}
                            {sousGroupes.map(section => {
                                const options = section.fields.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.label} ({String(valeurs[f.id] ?? f.defaultValue)})
                                    </option>
                                ));
                                return sousGroupes.length > 1
                                    ? <optgroup key={section.id} label={section.label || section.id}>{options}</optgroup>
                                    : <Fragment key={section.id}>{options}</Fragment>;
                            })}
                        </select>
                    </label>
                  );
                })}
            </div>

            {/* Le seuil, décomposé — on doit voir d'où il sort. Un jeu à
                réserve pure n'en compose aucun : on ne montre pas un « Seuil 0 »
                qui se lirait comme une mesure. */}
            {((descripteur.seuil ?? []).length > 0 || descripteur.cible) && (
                <div className="flex items-baseline gap-2 text-xs">
                    <span className="text-app-text/40 font-bold uppercase tracking-widest text-[9px]">
                        {descripteur.cible ? 'Chances' : 'Seuil'}
                    </span>
                    <span className="font-mono text-lg font-black text-accent">
                        {jet.seuil}{descripteur.cible ? ' %' : ''}
                    </span>
                    {/*
                        **L'explication vient du calcul, jamais d'ici.** Joindre
                        les valeurs par « + » dit vrai sur un jeu qui additionne
                        et faux sur un jeu qui multiplie : il aurait montré
                        « 12 + 3 » sous une cible de 78.
                    */}
                    {jet.explicationDuSeuil ? (
                        <span className="text-app-text/30 font-mono">
                            = {jet.explicationDuSeuil}
                            {jet.composantes.length > 0 && (
                                <span className="ml-1 opacity-60">
                                    ({jet.composantes.map(c => c.champ).join(', ')})
                                </span>
                            )}
                        </span>
                    ) : jet.composantes.length > 0 && (
                        <span className="text-app-text/30 font-mono">
                            = {jet.composantes.map(c => `${c.valeur}`).join(' + ')}
                            <span className="ml-1 opacity-60">({jet.composantes.map(c => c.champ).join(' + ')})</span>
                        </span>
                    )}
                </div>
            )}

            {/*
                L'ajustement de difficulté, quand la cible se calcule. Il ne
                s'affiche que là : sur un jeu qui compte des réussites, il n'a
                aucun sens, et deux réglages nommés « difficulté » côte à côte
                seraient exactement le piège que ce chantier a défait.
            */}
            {descripteur.cible && (
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-app-text/40 font-bold uppercase tracking-widest text-[9px]">
                        Difficulté
                    </span>
                    <input
                        type="range"
                        min={-10}
                        max={7}
                        value={ajustementDeDifficulte}
                        onChange={e => setAjustementDeDifficulte(Number(e.target.value))}
                        className="flex-1 accent-accent"
                    />
                    <span className="font-mono font-black text-accent w-8 text-right">
                        {ajustementDeDifficulte > 0 ? `+${ajustementDeDifficulte}` : ajustementDeDifficulte}
                    </span>
                </div>
            )}

            {/*
                Ce que le calcul a dû supposer — hors de la table du livre, borné
                à son dernier palier — s'affiche **avec les remarques du pilote**,
                plus bas, et pas ici : le panneau en a déjà un endroit, et deux
                listes de la même chose finissent par diverger.
            */}

            {/* La seconde poule, nommée par le jeu. Elle se montre à part parce
                qu'elle se compte à part : chez Alien, un 1 sur un dé de stress
                déclenche la Panique, ce qu'un dé de base ne fait jamais. */}
            {jet.desSecondaires > 0 && (
                <div className="flex items-baseline gap-2 text-xs">
                    <span className="text-amber-300/60 font-bold uppercase tracking-widest text-[9px]">
                        {descripteur.reserve?.secondaire?.label ?? 'Seconde réserve'}
                    </span>
                    <span className="font-mono text-lg font-black text-amber-300">{jet.desSecondaires}</span>
                    {jet.composantesDeLaSecondeReserve.length > 0 && (
                        <span className="text-app-text/30 font-mono">
                            ({jet.composantesDeLaSecondeReserve.map(c => c.champ).join(' + ')})
                        </span>
                    )}
                </div>
            )}

            {/* La réserve, décomposée pour la même raison : un joueur d'Alien
                doit voir que ses cinq dés sont « Force 4 + Pilotage 1 », et non
                un nombre tombé du ciel. */}
            {jet.composantesDeLaReserve.length > 0 && (
                <div className="flex items-baseline gap-2 text-xs">
                    <span className="text-app-text/40 font-bold uppercase tracking-widest text-[9px]">Réserve</span>
                    <span className="font-mono text-lg font-black text-accent">{jet.nombreDeDes}</span>
                    <span className="text-app-text/30 font-mono">
                        = {[
                            ...(descripteur.reserve?.base ? [`${descripteur.reserve.base}`] : []),
                            ...jet.composantesDeLaReserve.map(c => `${c.valeur}`),
                            ...(jet.desAchetes > 0 ? [`${jet.desAchetes}`] : []),
                        ].join(' + ')}
                        <span className="ml-1 opacity-60">
                            ({[
                                ...(descripteur.reserve?.base ? ['base'] : []),
                                ...jet.composantesDeLaReserve.map(c => c.champ),
                                ...(jet.desAchetes > 0 ? ['achetés'] : []),
                            ].join(' + ')})
                        </span>
                    </span>
                </div>
            )}

            <div className="flex items-center gap-6">
                {/* Réserve : les dés supplémentaires s'achètent, jusqu'au plafond du système. */}
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">Dés</span>
                    <button
                        onClick={() => setDesAchetes(d => Math.max(0, d - 1))}
                        className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                    ><Minus size={12} /></button>
                    <span className="font-mono text-sm font-black w-6 text-center">{jet.nombreDeDes}</span>
                    <button
                        /* Le plafond se compte à partir de la réserve RÉELLE du
                           personnage, composantes comprises — sinon un joueur
                           d'Alien à cinq dés pourrait en acheter dix de plus. */
                        onClick={() => setDesAchetes(d => Math.min(
                            (descripteur.reserve?.max ?? 0)
                                - (descripteur.reserve?.base ?? 0)
                                - jet.composantesDeLaReserve.reduce((s, c) => s + c.valeur, 0),
                            d + 1,
                        ))}
                        className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                    ><Plus size={12} /></button>
                </div>

                {/*
                    Le prix des dés achetés, ventilé. « 3 — 2 d'Impulsion,
                    1 de Menace » : ce qui part chez le meneur se voit avant
                    le lancer, pas après.
                */}
                {ventilation && (
                    <span
                        className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300/80"
                        title="Coût des dés supplémentaires"
                    >
                        <Coins size={11} />
                        {ventilation.surLaReserve > 0 && (
                            <span>{ventilation.surLaReserve} {nomDe(jet.cout.ressource)}</span>
                        )}
                        {ventilation.reporte > 0 && (
                            <span className="text-red-300/80">
                                {ventilation.surLaReserve > 0 && '+ '}
                                {ventilation.reporte} {nomDe(ventilation.ressourceDeReport)}
                            </span>
                        )}
                    </span>
                )}

                {/*
                    **Avantage / Désavantage — la règle de Dice OS, à l'identique.**

                    Deux dés, on garde le meilleur ou le moins bon. Le sélecteur
                    ne paraît que là où un seul dé tranche : sur une réserve, il
                    n'y a pas de meilleur dé, et l'offrir inviterait à inventer
                    une règle que le jeu n'a pas.

                    Il reste affiché après le lancer, et c'est délibéré — un
                    modificateur qui se remettrait seul à zéro se rejouerait sans
                    qu'on le voie, et un qui persiste se lit à l'écran.
                */}
                {avantagePossible && (
                    <label className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">Tirage</span>
                        <select
                            value={modificateur}
                            onChange={e => setModificateur(e.target.value as typeof modificateur)}
                            title={jet.sens === 'sous-ou-egal'
                                ? 'Deux dés : l’Avantage garde le plus BAS, le Désavantage le plus haut'
                                : 'Deux dés : l’Avantage garde le plus HAUT, le Désavantage le plus bas'}
                            className={`bg-app-bg/60 border rounded-lg px-2 py-1 text-[11px] font-bold focus:outline-none focus:border-accent/50 ${
                                modificateur === 'avantage'
                                    ? 'border-emerald-400/50 text-emerald-300'
                                    : modificateur === 'desavantage'
                                        ? 'border-red-400/50 text-red-300'
                                        : 'border-app-border/40 text-app-text/60'
                            }`}
                        >
                            <option value="aucun">Normal</option>
                            <option value="avantage">Avantage</option>
                            <option value="desavantage">Désavantage</option>
                        </select>
                    </label>
                )}

                {/*
                    Pas de champ pour ce que le jeu ne fixe pas : un sélecteur de
                    difficulté sur un jeu qui n'en a pas invite à en inventer une.

                    **Et pas non plus quand une cible est calculée.** Le
                    commentaire de l'ajustement, plus haut, affirmait que « deux
                    réglages nommés difficulté côte à côte » étaient le piège
                    « que ce chantier a défait ». Il ne l'était pas : les deux
                    gardes sont indépendants, et rien n'empêchait un pilote de
                    déclarer `cible` **et** `difficulte`. Le pilote de Rêves de
                    Dragons le faisait, et les deux s'affichaient — vu sur une
                    capture de David le 2026-08-23.

                    *L'exclusivité doit être écrite, pas supposée.* Ici la cible
                    l'emporte, comme partout ailleurs.
                */}
                {descripteur.difficulte && !descripteur.cible && (
                    <label className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">Difficulté</span>
                        <input
                            type="number"
                            min={descripteur.difficulte.min}
                            max={descripteur.difficulte.max}
                            value={difficulte}
                            onChange={e => setDifficulte(Number(e.target.value))}
                            className="w-14 bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent/50"
                        />
                    </label>
                )}

                <button
                    onClick={lancer}
                    disabled={!pret}
                    className={`ml-auto px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        pret
                            ? 'bg-accent text-white hover:scale-105 active:scale-95'
                            : 'bg-app-text/5 text-app-text/20 cursor-not-allowed'
                    }`}
                >
                    Lancer
                </button>
            </div>

            {/*
                Ce qui manque se dit. Un champ absent de la fiche est une erreur
                de configuration du pilote, et le joueur doit savoir pourquoi le
                bouton refuse plutôt que de le voir grisé sans explication.
            */}
            {jet.avertissements.length > 0 && (
                <ul className="space-y-1">
                    {jet.avertissements.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-amber-300/70">
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}
                        </li>
                    ))}
                </ul>
            )}

            {/*
                Ce qui s'est raccordé malgré une dérive du pilote. Plus discret
                que les avertissements — le jet est juste et part —, mais dit :
                un défaut silencieux finit toujours par coûter plus cher qu'une
                ligne de texte.
            */}
            {jet.remarques.length > 0 && (
                <ul className="space-y-1">
                    {jet.remarques.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] text-app-text/35">
                            <Info size={11} className="mt-0.5 shrink-0" /> {r}
                        </li>
                    ))}
                </ul>
            )}

            {resultat && (
                <div className="rounded-xl border border-app-border/30 bg-app-bg/40 p-3 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                        {resultat.rolls.map((d, i) => {
                            const val = typeof d.val === 'number' ? d.val : 0;
                            /*
                              **Le dé écarté se montre, et ne compte pour rien.**
                              C'est le dé qu'on a évité — un joueur doit voir de
                              quoi l'Avantage l'a sauvé. Mais lui appliquer les
                              couleurs du critique ou de la complication
                              annoncerait un événement qui n'a pas eu lieu.
                            */
                            const ecarte = d.isDropped === true;
                            const critique = !ecarte && descripteur.critique !== undefined && val <= jet.doubleSous;
                            const complique = !ecarte && descripteur.complication !== undefined && val >= descripteur.complication;
                            /*
                              **Quel dé a déclenché, et pas seulement combien.**
                              Un compte de Paniques sans savoir lequel des huit
                              dés l'a causée n'aide personne à raconter la scène.
                              La seconde poule se distingue à l'œil, et son 1
                              porte le nom que le jeu lui donne.
                            */
                            const seconde = d.source === 'gear';
                            const declenche = seconde && d.isCritMin;
                            const nomDuUn = descripteur.reserve?.secondaire?.libelleDuUn ?? 'Fléau';
                            return (
                                <span
                                    key={i}
                                    title={ecarte ? 'Dé écarté — celui que le tirage n’a pas retenu'
                                        : declenche ? nomDuUn
                                        : seconde ? descripteur.reserve?.secondaire?.label
                                        : critique ? 'Deux réussites'
                                        : complique ? 'Complication' : undefined}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-black border ${
                                        ecarte
                                            ? 'bg-transparent border-dashed border-app-border/30 text-app-text/25 line-through'
                                        : declenche
                                            ? 'bg-amber-500/25 border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.35)]'
                                            : critique
                                                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                                                : d.isCritMax
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300/80'
                                                    : complique
                                                        ? 'bg-red-500/20 border-red-400/50 text-red-200'
                                                        : seconde
                                                            ? 'bg-app-text/5 border-dashed border-amber-400/40 text-app-text/50'
                                                            : 'bg-app-text/5 border-app-border/30 text-app-text/40'
                                    }`}
                                >
                                    {val}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                        {/*
                            **Le septième lecteur, et il écrivait lui aussi son
                            propre mot.** Le degré l'emporte quand le jeu en
                            gradue ; sinon c'est le verdict du compte de
                            réussites, qui reste l'autorité sur une réserve.
                        */}
                        <EtiquetteDuDegre
                            resultat={{ degre: resultat.degre, tagSuccess: v.reussi }}
                            classes={reussi => 'font-black uppercase tracking-widest '
                                + (reussi ? 'text-emerald-400' : 'text-red-400')}
                        />
                        {/* « difficulté 0 » ne voulait rien dire sur un jeu qui
                            n'en gradue aucune : il en faut une, et c'est ça
                            qu'on annonce. */}
                        <span className="text-app-text/50 font-mono">
                            {reussites} réussite{reussites > 1 ? 's' : ''}
                            {descripteur.difficulte
                                ? ` / difficulté ${difficulte}`
                                : ` / ${jet.reussitesRequises} requise${jet.reussitesRequises > 1 ? 's' : ''}`}
                        </span>
                        {/*
                            **Les 1 de la seconde poule, nommés par le jeu.**

                            `rollYZE` les compte comme des « fléaux » — un terme
                            générique de la famille Year Zero. Chez Alien, ce
                            sont des **Paniques**, et le mot compte : c'est lui
                            qui dit au meneur d'ouvrir la table de Panique. On
                            affiche donc ce que le pilote déclare, et « fléau »
                            seulement à défaut.

                            **On annonce, on ne déclenche pas.** Jouer la
                            Panique est une décision de table — l'outil tient le
                            compte, il n'arbitre pas.
                        */}
                        {(resultat?.fails ?? 0) > 0 && (
                            <span className="text-amber-300 font-black uppercase tracking-widest">
                                {resultat!.fails} {descripteur.reserve?.secondaire?.libelleDuUn ?? 'fléau'}
                                {resultat!.fails! > 1 ? 's' : ''}
                            </span>
                        )}
                        {/* L'excédent alimente la monnaie de table — et depuis
                            le mur n° 4, il y est réellement versé. */}
                        {v.excedent > 0 && (
                            <span className="text-amber-300/80 font-mono">
                                +{v.excedent}{monnaie && jet.cout.ressource ? ` ${nomDe(jet.cout.ressource)}` : ' excédent'}
                            </span>
                        )}
                        {complications > 0 && (
                            <span className="text-red-300/80 font-mono">
                                {complications} complication{complications > 1 ? 's' : ''}
                            </span>
                        )}
                        <span className="ml-auto text-app-text/25 font-mono text-[10px]">sous {seuilDuLancer}</span>
                    </div>

                    {/*
                        Ce que le lancer a fait aux réserves de la table : un
                        report en Menace, un gain refusé par le plafond. Une
                        réserve qui bouge sans le dire est exactement le genre
                        de silence qu'on traque.
                    */}
                    {mouvements.length > 0 && (
                        <ul className="space-y-1 pt-1 border-t border-app-border/20">
                            {mouvements.map((m, i) => (
                                <li key={i} className="flex items-start gap-2 text-[11px] text-amber-300/70">
                                    <Coins size={11} className="mt-0.5 shrink-0" /> {m}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default PanneauDeJet;
