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

/**
 * Le mécanisme de santé qu'un jeu donne à ses adversaires.
 *
 * **Une seule règle, pour la reprise ET pour la création.** David, le
 * 2026-08-15 : *« peux-tu utiliser le même modèle quand je crée un PNJ de
 * zéro ? »* — et c'est le bon geste, plus large que sa question. **Trois
 * chemins** créent des adversaires : le formulaire, l'export depuis NPC-OS, et
 * la Forge de chronique. Un seul connaissait le pilote.
 *
 * C'est exactement ce que `addCombatant` a réglé pour le combat : *huit écrans
 * ajoutent des combattants et un seul connaît le pilote — on complète à cet
 * endroit unique plutôt que d'en instruire sept, et surtout plutôt que d'en
 * oublier un.*
 *
 * `points` sert au modèle `hp` : on **déclare ce que l'entité porte déjà**
 * plutôt que les dix de `createDefault`. Les valeurs non numériques sont
 * ignorées — la Forge de chronique a écrit « Inférieure à 1 (gravement battu) »,
 * et fabriquer un nombre à partir d'une phrase perdrait ce qu'elle dit.
 *
 * Rend `undefined` quand le jeu ne déclare rien : *l'absence n'est pas un zéro*,
 * et un modèle inventé se jouerait comme un vrai.
 */
export function santeSelonLeJeu(
    pilote: GameDriver | null | undefined,
    points?: { hp?: unknown; maxHp?: unknown },
): Entity['healthSystem'] | undefined {
    const tache = pilote?.combat?.tacheDeDefaite;
    if (tache) {
        /*
          Le seuil vaut « la compétence défensive » de la cible, qu'un PNJ n'a
          nulle part où porter. On pose le plancher que le pilote déclare — c'est
          au meneur de le relever, et l'écran de création le lui demande.
        */
        return { type: 'clocks', data: { filled: 0, segments: tache.seuil.min }, state: 'healthy', badges: [] };
    }

    const modele = pilote?.combat?.defaultHealthType;
    if (!modele) return undefined;

    const sante = HealthInterpreter.createDefault(modele);
    const lisibles = typeof points?.hp === 'number' && typeof points?.maxHp === 'number' && points.maxHp > 0;
    return modele === 'hp' && lisibles
        ? { ...sante, data: { ...sante.data, current: points!.hp, max: points!.maxHp } }
        : sante;
}

/**
 * Comment ce jeu met un adversaire hors de combat — et s'il faut lui demander
 * des points de vie.
 *
 * **Le jumeau d'invite de `santeSelonLeJeu`, et il vit ici depuis le
 * 2026-08-16.** Il était né dans `ChronicleService`, avec la Forge de chronique
 * qu'il servait ; mais il ne parle pas de chroniques — il dit comment un jeu
 * compte les dégâts, et c'est la Forge de campagne qui le lit aujourd'hui.
 * Retirer l'ancien chemin aurait emporté une fonction dont le nouveau dépend.
 *
 * **Le défaut qu'il remplace, relevé le 2026-08-15.** L'invite disait
 * « Remplis "hp", "ac", "speed", "initiative" en fonction du Driver » et montrait
 * `"hp": 10, "ac": 10` — les valeurs de D&D, sur n'importe quel jeu. Sur Dune,
 * dont la défaite est une tâche étendue, le modèle n'avait aucun point de vie à
 * donner : il a répondu en prose, et `hp: "Inférieure à 1 (gravement battu)"`
 * s'est retrouvé dans un champ typé `number`. *Ce n'est pas le modèle qui
 * dérape, c'est la question qui n'a pas de réponse.*
 *
 * Le pilote savait pourtant répondre — `tacheDeDefaite`, `defaultHealthType`,
 * `santeDeDepart` — et rien de tout cela ne partait. On ne demande donc plus que
 * ce que le jeu déclare compter, et `santeSelonLeJeu` construit le reste à
 * l'import, par la même règle que la création manuelle.
 */
export function santeAAnnoncer(driver: GameDriver): { demandeDesPoints: boolean; consigne: string } {
    if (driver.combat?.tacheDeDefaite) {
        return {
            demandeDesPoints: false,
            consigne:
                "SANTÉ — CE JEU N'A PAS DE POINTS DE VIE. Mettre un adversaire hors de combat y est une "
                + 'tâche étendue, dont le seuil se lit sur la fiche de la cible. N\'écris donc NI "hp" NI '
                + '"maxHp" : le meneur réglera lui-même la résistance de chaque adversaire.',
        };
    }

    const modele = driver.combat?.defaultHealthType;
    if (modele === 'hp') {
        const formule = driver.combat?.santeDeDepart;
        return {
            demandeDesPoints: true,
            consigne:
                'SANTÉ — ce jeu compte des points. Donne "hp" et "maxHp" **à l\'échelle de CE jeu**, jamais '
                + "à celle d'un autre : un adversaire ordinaire n'a pas dix points de vie parce qu'un autre "
                + 'jeu en donne dix.'
                + (formule
                    ? ` Sur ce jeu, la santé de départ se calcule ainsi : « ${formule} » — les valeurs `
                      + 'restent donc du même ordre que les caractéristiques de la fiche.'
                    : ''),
        };
    }

    if (modele) {
        const nom: Record<string, string> = {
            clocks: 'une horloge à segments',
            anatomy: 'des zones du corps',
            wounds: 'des blessures nommées',
            boxes: 'des cases à cocher',
        };
        return {
            demandeDesPoints: false,
            consigne:
                `SANTÉ — ce jeu compte les dégâts par ${nom[modele] ?? modele}, PAS par points. `
                + 'N\'écris NI "hp" NI "maxHp".',
        };
    }

    return {
        demandeDesPoints: false,
        consigne:
            "SANTÉ — le pilote de ce jeu ne déclare aucun modèle de santé. N'écris NI \"hp\" NI \"maxHp\" : "
            + "l'absence n'est pas un zéro, et un nombre inventé se jouerait comme une mesure.",
    };
}

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

        // La MÊME règle que celle appliquée à la création : une reprise qui
        // rattraperait autrement que ce que le formulaire écrit produirait deux
        // populations de PNJ que rien ne distinguerait à l'œil.
        const sante = santeSelonLeJeu(pilote, entite);
        if (!sante) return entite;

        rattachees.push({
            entite: entite.name,
            modele: sante.type,
            aAjuster: !!pilote.combat?.tacheDeDefaite,
        });
        return { ...entite, healthSystem: sante };
    });

    return rattachees.length > 0
        ? { entities: corrigees, rattachees }
        : { entities: entities as Entity[], rattachees };
}
