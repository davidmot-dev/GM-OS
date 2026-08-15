import { tousLesPilotes } from '../store/tousLesPilotes';
import type { GameDriver } from '../../../types/drivers';
import type { Player } from '../store/types';

/**
 * Le jeu qu'un personnage déclare, inscrit là où il manquait.
 *
 * **Pourquoi ça compte.** `piloteDuPersonnage` résout en trois temps :
 * `systemId`, sinon le pilote dont c'est le gabarit, sinon la campagne. Les deux
 * derniers sont des rattrapages — ils marchent, mais ils dépendent de choses qui
 * bougent. Renommer un gabarit, repointer une campagne, et un personnage change
 * de jeu sans que personne ne l'ait décidé. *Un défaut hérité d'ailleurs reste un
 * choix que personne n'a fait* — c'est la règle qui a déjà coûté le corpus
 * hérité de la campagne et le pilote hérité de la campagne active.
 *
 * Les personnages créés depuis le 2026-08-15 écrivent leur `systemId`. Ceci
 * reprend les précédents, avec la même prudence que les deux autres réparations
 * d'hydratation.
 *
 * **La condition, et elle est unique : un seul pilote réclame ce gabarit.**
 *
 * On n'utilise **pas** la campagne. C'est la troisième source de résolution, et
 * elle est légitime *à l'exécution* justement parce qu'elle suit le présent :
 * la figer dans le personnage transformerait un rattrapage vivant en valeur
 * gelée, et rendrait faux ce qui était seulement approximatif. Un gabarit, lui,
 * appartient au personnage.
 *
 * Vérifié sur l'état réel du 2026-08-15 : sur dix personnages, **quatre** sont
 * rattrapables sans ambiguïté (gabarit de Blade Runner, un seul revendiquant),
 * trois portent `generic` — que **aucun** pilote ne réclame, et dont le jeu est
 * réellement indéterminé — et trois déclarent déjà le leur. On n'invente rien
 * pour les trois du milieu : leur jeu est une question ouverte, pas un trou à
 * combler.
 */

export interface SystemeInscrit {
    personnage: string;
    systemId: string;
    piloteNom: string;
}

export function inscrireLesSystemes(
    players: readonly Player[],
    pilotesPersonnalises: readonly GameDriver[],
): { players: Player[]; inscrits: SystemeInscrit[] } {
    const pilotes = tousLesPilotes(pilotesPersonnalises);

    /** Combien de pilotes revendiquent chaque gabarit — au-delà d'un, on se tait. */
    const revendications = new Map<string, GameDriver[]>();
    for (const pilote of pilotes) {
        if (!pilote.templateId) continue;
        const deja = revendications.get(pilote.templateId) ?? [];
        deja.push(pilote);
        revendications.set(pilote.templateId, deja);
    }

    const inscrits: SystemeInscrit[] = [];

    const corriges = players.map(joueur => {
        let touche = false;

        const personnages = (joueur.characters ?? []).map(perso => {
            if (perso.systemId || !perso.templateId) return perso;

            const candidats = revendications.get(perso.templateId) ?? [];
            // Zéro : le gabarit n'appartient à aucun jeu — c'est le cas de
            // `generic`. Deux ou plus : on ne tranche pas à pile ou face.
            if (candidats.length !== 1) return perso;

            inscrits.push({
                personnage: perso.name,
                systemId: candidats[0].id,
                piloteNom: candidats[0].name,
            });
            touche = true;
            return { ...perso, systemId: candidats[0].id };
        });

        return touche ? { ...joueur, characters: personnages } : joueur;
    });

    return inscrits.length > 0
        ? { players: corriges, inscrits }
        : { players: players as Player[], inscrits };
}
