import { HealthInterpreter } from './HealthInterpreter';
import { tousLesPilotes } from '../store/tousLesPilotes';
import type { GameDriver } from '../../../types/drivers';
import type { CampagneDeJeu } from './piloteDuPersonnage';
import type { Entity } from '../../../types/entity.types';

/**
 * Les adversaires nés sans mécanisme de santé, rattachés à celui de leur jeu.
 *
 * **Le défaut.** `AddEntityForm` n'écrivait **aucun** `healthSystem` avant le
 * 2026-08-15 : chaque PNJ ne portait que `hp`/`maxHp`, les points de vie de
 * D&D. La cause est corrigée ; restent les fiches déjà écrites.
 *
 * **Ce que la charge réelle a dit, et qui a changé ce module.** Sur les 50 PNJ
 * de David, les valeurs ne sont **pas** des défauts oubliés : ses adversaires de
 * Dune portent des `ac` de 4 à 8 et des `speed` de 4 à 6, ses créatures de Rêve
 * de Dragon montent à 100 points de vie. Ce sont des choix — d'un humain ou de
 * la Forge de chronique. *Un correctif qui les aurait remis à zéro aurait
 * détruit du contenu, et c'est le regard sur les données qui l'a évité.*
 *
 * On n'écrit donc **que ce qui manque**, et jamais par-dessus.
 *
 * **Les deux cas, et leur inégale certitude :**
 *
 * 1. **Le jeu compte des points** — Blade Runner, Alien. Le modèle se construit
 *    à partir des `hp`/`maxHp` **que le PNJ porte déjà** : on ne fait que
 *    déclarer ce qui est là. Rien n'est deviné.
 * 2. **Le jeu a une tâche de défaite** — Dune. Le seuil vaut « la compétence
 *    défensive » de la cible, et **un PNJ n'a pas de fiche où la lire** — pas
 *    aujourd'hui, pas demain. C'est ce qui distingue ce cas de la reprise des
 *    horloges des personnages joueurs, où l'on refusait justement de retenir un
 *    minimum faute de valeur lue. Ici il n'y a pas de valeur lisible : on pose
 *    le **plancher que le pilote déclare**, et chaque reprise est journalisée
 *    pour que le meneur l'ajuste. Le taire aurait laissé ces PNJ afficher une
 *    barre de vie à 130 % sur un jeu qui n'a pas de points de vie.
 */

export interface SanteRattachee {
    entite: string;
    modele: string;
    /** Vrai quand le seuil est un plancher à ajuster, pas une mesure. */
    aAjuster: boolean;
}

export function rattacherLaSanteDesAdversaires(
    entities: readonly Entity[],
    campagnes: readonly CampagneDeJeu[],
    pilotesPersonnalises: readonly GameDriver[],
): { entities: Entity[]; rattachees: SanteRattachee[] } {
    const pilotes = tousLesPilotes(pilotesPersonnalises);
    const rattachees: SanteRattachee[] = [];

    const corrigees = entities.map(entite => {
        if (entite.healthSystem) return entite;

        const campagne = campagnes.find(c => c.id === entite.campaignId);
        const pilote = pilotes.find(d => d.id === campagne?.system);
        if (!pilote) return entite;

        const tache = pilote.combat?.tacheDeDefaite;
        if (tache) {
            rattachees.push({ entite: entite.name, modele: 'clocks', aAjuster: true });
            return {
                ...entite,
                healthSystem: {
                    type: 'clocks' as const,
                    data: { filled: 0, segments: tache.seuil.min },
                    state: 'healthy' as const,
                    badges: [],
                },
            };
        }

        const modele = pilote.combat?.defaultHealthType;
        if (!modele) return entite;

        const sante = HealthInterpreter.createDefault(modele);
        /*
          Pour le modèle `hp`, on **déclare ce que le PNJ porte déjà** au lieu
          des dix de `createDefault` : ses points de vie sont une donnée réelle,
          souvent posée à la main. Les valeurs non numériques — la Forge de
          chronique en a écrit, « Inférieure à 1 (gravement battu) » — ne sont
          pas converties : on laisse alors le défaut du modèle plutôt que de
          fabriquer un nombre à partir d'une phrase.
        */
        const lisibles = typeof entite.hp === 'number' && typeof entite.maxHp === 'number' && entite.maxHp > 0;
        rattachees.push({ entite: entite.name, modele, aAjuster: false });

        return {
            ...entite,
            healthSystem: modele === 'hp' && lisibles
                ? { ...sante, data: { ...sante.data, current: entite.hp, max: entite.maxHp } }
                : sante,
        };
    });

    return rattachees.length > 0
        ? { entities: corrigees, rattachees }
        : { entities: entities as Entity[], rattachees };
}
