import { decrireLaSante, estHorsDeCombat, type PorteurDeSante } from './SanteDuCombattant';

/**
 * Ce qu'un combattant a encaissé pendant **un** combat.
 *
 * **Pourquoi compter plutôt que relire.** Les coups partent déjà au journal, un
 * par un, en `trace`. Décision de David du 2026-08-18 : *le détail des coups ne
 * doit pas entrer dans le résumé, mais le résumé de combat doit en tenir compte
 * pour raconter quelque chose d'intéressant.* On agrège donc en cours de route —
 * ce qui coûte quatre nombres par combattant — au lieu d'envoyer trente lignes
 * au modèle ou d'essayer de relire son propre journal.
 *
 * Conforme au § 5.2 du plan du 2026-08-08 : *le résumé de combat reste
 * mécanique, jamais généré par l'IA — une chaîne construite est instantanée,
 * gratuite, déterministe et fonctionne hors ligne.*
 */
export interface FaitsDArmes {
    /** Nombre de coups reçus — les soins ne comptent pas comme des coups. */
    coups: number;
    /** Total encaissé. */
    degats: number;
    /** Total récupéré. */
    soins: number;
    /** Le coup le plus dur reçu, seul. */
    plusFort: number;
}

/** Un combattant tel que le récit a besoin de le lire. */
export interface CombattantRaconte extends PorteurDeSante {
    id: string;
    name: string;
    statuses: readonly { name: string; icon?: string }[];
}

export const faitsVierges = (): FaitsDArmes => ({ coups: 0, degats: 0, soins: 0, plusFort: 0 });

/** Un coup de plus au compteur. Rend de nouveaux faits, sans muter les anciens. */
export function ajouterUnCoup(
    faits: FaitsDArmes | undefined,
    impact: { value: number; isRecovery?: boolean },
): FaitsDArmes {
    const base = faits ?? faitsVierges();
    // Un nombre négatif dit la même chose que `isRecovery` : les deux appelants
    // n'ont pas la même convention, et le compteur ne doit pas dépendre de l'un.
    const soin = impact.isRecovery === true || impact.value < 0;
    const valeur = Math.abs(impact.value);
    if (valeur === 0) return base;

    return soin
        ? { ...base, soins: base.soins + valeur }
        : {
            coups: base.coups + 1,
            degats: base.degats + valeur,
            soins: base.soins,
            plusFort: Math.max(base.plusFort, valeur),
        };
}

/**
 * Ce combattant est-il tombé ?
 *
 * **Le statut ne suffit pas, et c'est ce qui a rendu le récit du 19/08 faux.**
 * Cette fonction ne regardait que l'étiquette « Mort » — celle que le meneur
 * pose à la main. Le récit annonçait donc « **Pertes :** Aucune » sur un combat
 * où deux combattants étaient à zéro, et rangeait un personnage à `0/4` parmi
 * les **Survivants**.
 *
 * `estHorsDeCombat` porte déjà la bonne réponse depuis le 2026-08-14, avec le
 * bon ordre d'autorité — l'état calculé par `HealthInterpreter` d'abord, la
 * jauge de points ensuite, et **jamais de mort déclarée faute d'information**.
 * `CombatCard` et `MapTokenNode` l'utilisent ; celle-ci était la dernière à
 * avoir sa propre idée de ce qu'un zéro veut dire. *Le module de santé avait
 * acquis un dixième lecteur dissident* — le même reproche que celui déjà fait à
 * l'écriture des impacts la veille.
 *
 * **Les deux conditions se cumulent, elles ne se remplacent pas.** Un jeu sans
 * jauge n'a que l'étiquette pour dire la mort, et `estHorsDeCombat` y répond
 * non, à raison ; à l'inverse un combattant à zéro est tombé sans qu'on ait eu
 * à l'étiqueter.
 */
export const estTombe = (c: CombattantRaconte): boolean =>
    porteLEtiquetteDeMort(c) || estHorsDeCombat(c);

/**
 * L'étiquette « Mort », celle que le meneur pose à la main.
 *
 * **Distincte de `estTombe`, et la distinction porte une décision.** Tomber, un
 * combattant le fait dès qu'il est à zéro ; *être déclaré mort* est un geste du
 * meneur. Le journal raconte la chute — c'est ce qui s'est passé à la table.
 * La Galerie, elle, n'inscrit `status: 'dead'` que sur l'étiquette : un PNJ à
 * zéro peut n'être qu'assommé, et une fiche marquée morte l'est pour de bon.
 *
 * Extraite pour n'être écrite qu'une fois : elle vivait recopiée dans
 * `propagateStatusToSession`, qui pouvait donc dériver de celle-ci sans que
 * rien ne le signale.
 */
export const porteLEtiquetteDeMort = (c: CombattantRaconte): boolean =>
    c.statuses.some(s => s.name.toLowerCase() === 'mort' || s.icon === '💀');

/**
 * Ce qu'un combattant a traversé, en une ligne.
 *
 * **L'ordre dit l'histoire** : où il en est d'abord, ce qu'il a pris ensuite.
 * Chaque morceau se tait s'il n'a rien à dire — un jeu sans jauge de santé ne
 * doit pas produire un tiret suivi du vide, et un combattant jamais touché le
 * dit en toutes lettres plutôt qu'en affichant « 0 point en 0 coup ».
 */
function raconterUnCombattant(c: CombattantRaconte, faits: FaitsDArmes | undefined): string {
    const morceaux: string[] = [];

    const sante = decrireLaSante(c);
    if (sante) morceaux.push(sante);

    if (!faits || faits.coups === 0) {
        // Le soin sans coup existe : on l'annonce plutôt que « pas touché ».
        morceaux.push(faits && faits.soins > 0 ? `${faits.soins} soignés` : 'pas touché');
    } else {
        const coups = `${faits.degats} encaissés en ${faits.coups} coup${faits.coups > 1 ? 's' : ''}`;
        morceaux.push(faits.soins > 0 ? `${coups}, ${faits.soins} soignés` : coups);
    }

    return `- **${c.name}** : ${morceaux.join(' — ')}`;
}

/**
 * Le récit d'un combat, tel qu'il part au résumé de séance.
 *
 * **C'est le seul événement de combat de nature `chronique`**, donc le seul que
 * `generateAISummary` laisse passer : tout ce que le modèle saura du combat est
 * ici. Il disait jusqu'au 2026-08-18 le nombre de rounds, le nombre de
 * participants et deux listes de noms — de quoi écrire « un combat eut lieu »,
 * rien de plus.
 *
 * Il dit maintenant **ce que chacun a traversé** : dans quel état il en sort, ce
 * qu'il a encaissé, en combien de coups. C'est la matière d'un récit, et elle ne
 * coûte aucun appel de modèle.
 */
export function raconterLeCombat(params: {
    titreDeScene?: string;
    round: number;
    combattants: readonly CombattantRaconte[];
    faits: Readonly<Record<string, FaitsDArmes>>;
}): string {
    const { titreDeScene, round, combattants, faits } = params;

    const tombes = combattants.filter(estTombe);
    const debout = combattants.filter(c => !estTombe(c));

    const total = combattants.reduce((n, c) => n + (faits[c.id]?.degats ?? 0), 0);

    /*
      Le coup le plus dur est le seul détail individuel qui survit à l'agrégation,
      et c'est délibéré : c'est celui dont on se souvient à la table. Il ne
      s'écrit que s'il a eu lieu.
    */
    const plusDur = combattants
        .map(c => ({ nom: c.name, valeur: faits[c.id]?.plusFort ?? 0 }))
        .reduce((meilleur, courant) => (courant.valeur > meilleur.valeur ? courant : meilleur), { nom: '', valeur: 0 });

    const lignes: string[] = [
        /*
          **La scène entre dans le résumé, et c'est tout le point.** Demande de
          David du 2026-08-17 : sans elle, le journal savait dire qu'un combat
          avait eu lieu, jamais où ni dans quel fil de l'histoire. Un combat non
          rattaché le dit franchement plutôt que de se taire — c'est un défaut de
          rattachement, pas une absence de combat.
        */
        titreDeScene ? `**Scène :** ${titreDeScene}` : '_Combat rattaché à aucune scène._',
        `Combat terminé après **${round} rounds**.`,
        `**Participants :** ${combattants.length}`,
    ];

    if (tombes.length > 0) {
        lignes.push('', '**Pertes :**', ...tombes.map(c => raconterUnCombattant(c, faits[c.id])));
    } else {
        lignes.push('', '**Pertes :** Aucune');
    }

    if (debout.length > 0) {
        lignes.push('', '**Survivants :**', ...debout.map(c => raconterUnCombattant(c, faits[c.id])));
    }

    if (total > 0) {
        lignes.push('', `**Dégâts échangés :** ${total} au total`
            + (plusDur.valeur > 0 ? `, le coup le plus dur étant **${plusDur.valeur}** sur ${plusDur.nom}.` : '.'));
    }

    return lignes.join('\n');
}
