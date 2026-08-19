import i18next from 'i18next';
import type { GameDriver } from '../../../types/drivers';

/**
 * Les types de dégâts d'un jeu — **une seule liste, une seule convention**.
 *
 * Elle vivait en `const` privée dans `DamageCalculator.tsx`, donc le pupitre du
 * tracker était le seul écran à savoir qu'un coup peut avoir une nature. Quand
 * le panneau de santé de Session-OS en a eu besoin à son tour (2026-08-19), la
 * recopier aurait posé deux listes qui divergent au premier ajout — *deux
 * chemins vers la même question finissent toujours par ne plus dire la même
 * chose.*
 *
 * **La convention, qui n'est pas anodine :** on stocke le jeton anglais
 * (`physical`), jamais le libellé. C'est lui qui part dans `DamageImpact.type`,
 * et c'est sur lui que `HealthInterpreter.processResistances` compare les
 * étiquettes `res_`, `vul_` et `imm_` de la fiche de santé. Traduire à
 * l'écriture casserait les résistances de toutes les fiches existantes ; on
 * traduit donc à l'affichage, et là seulement.
 */
export const TYPES_DE_DEGATS_PAR_DEFAUT = [
    'magical', 'physical', 'fire', 'cold', 'lightning', 'acid', 'psychic', 'necrotic', 'radiant',
] as const;

/**
 * Ce que ce jeu propose, ou le repli quand il ne dit rien.
 *
 * **Le repli se déclenche aussi sur une liste vide**, et pas seulement sur
 * l'absence : `[]` est vrai en JavaScript, si bien qu'un pilote déclarant
 * `damageTypes: []` laissait le pupitre avec zéro bouton et un type initial
 * `undefined`. Un `||` ne suffit pas ici.
 */
export function typesDeDegats(pilote: GameDriver | null | undefined): readonly string[] {
    const declares = pilote?.combat?.damageTypes;
    return declares && declares.length > 0 ? declares : TYPES_DE_DEGATS_PAR_DEFAUT;
}

/**
 * Le nom lisible d'un type de dégâts.
 *
 * Le jeton se replie sur lui-même quand aucune traduction n'existe : un pilote
 * forgé peut déclarer « ballistique » sans que personne n'ait écrit la clé, et
 * mieux vaut un mot brut qu'un vide.
 */
export const nommerLeType = (jeton: string): string =>
    i18next.t(`modules:combat.damage.types.${jeton}`, { defaultValue: jeton });

/**
 * Le nom lisible d'une localisation anatomique.
 *
 * Les identifiants de la silhouette — `leftArm`, `torso` — atteignaient le
 * journal tels quels. *Le même reproche que `scratched` en son temps* : un
 * jeton interne n'est pas un mot.
 */
export const nommerLaLocalisation = (jeton: string): string =>
    i18next.t(`modules:combat.damage.locations.${jeton}`, { defaultValue: jeton });
