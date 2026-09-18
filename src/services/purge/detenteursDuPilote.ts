import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { useBestiaireStore } from '../../modules/combat/useBestiaireStore';
import { useGemStore } from '../../stores/useGemStore';
import { useUlanziStore } from '../../modules/ulanzi/useUlanziStore';
import { useJournalDesLacunes } from '../../modules/ai/lacunes/useJournalDesLacunes';
import { tousLesPilotes } from '../../modules/session/store/tousLesPilotes';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';
import type { Detenteur } from './typesDeLaPurge';

/**
 * **Qui détient quelque chose au nom d'un pilote — une liste, et une seule.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `deleteGameDriver` tient en une ligne : il filtre `customGameDrivers`. Tout le
 * reste survivait — le modèle de fiche, le bestiaire du jeu, les consignes de
 * cortex taillées pour lui, les widgets de l'afficheur, les paquets de cartes,
 * et surtout **le dossier `docs/systems/<jeu>/` en entier**.
 *
 * C'est ce dossier qui rendait la reforge impossible : la Forge Système
 * **enrichit** un corpus existant au lieu de le doubler, et le slug d'un même
 * nom de jeu retombe sur le même dossier. Supprimer le pilote puis reforger ne
 * repartait donc jamais de zéro — la tentative d'avant était toujours là,
 * mélangée à la nouvelle, sans que rien ne le dise.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX GARDES QUI NE SE DEVINENT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **1. Les campagnes qui jouent ce pilote.** Elles n'apparaissent pas ici comme
 * un détenteur : on ne les purge pas, on **refuse** — une campagne vivante dont
 * le jeu disparaît devient injouable, et c'est au meneur de trancher. Voir
 * `campagnesDuPilote` plus bas, lu par l'écran avant même d'afficher l'aperçu.
 *
 * **2. Le modèle de fiche partagé.** Un modèle peut servir à deux pilotes — et
 * les modèles intégrés au code ne s'effacent pas. Les deux cas sont vérifiés
 * avant de compter quoi que ce soit : *supprimer le modèle d'un autre jeu en
 * croyant nettoyer le sien serait la pire façon de réussir une purge.*
 */

/** Le pilote visé, et ce qui s'en déduit, figé au moment de l'aperçu. */
export interface CiblePilote {
    id: string;
    nom: string;
    /** Le modèle de fiche à emporter, **seulement s'il n'appartient qu'à lui**. */
    templateIdAEmporter?: string;
    /** Sa racine sous `docs/`, résolue comme la lira l'Oracle — `systems/alien`. */
    corpusRelatif?: string;
}

/** Les campagnes qui jouent ce pilote. Un barrage, pas un lot à purger. */
export function campagnesDuPilote(driverId: string): { id: string; nom: string }[] {
    return useSessionOSStore.getState().campaigns
        .filter(c => c.system === driverId)
        .map(c => ({ id: c.id, nom: c.name }));
}

/**
 * Le modèle de fiche que ce pilote peut emporter, ou `undefined`.
 *
 * Trois raisons de ne rien emporter, et chacune a coûté ailleurs :
 * il n'en déclare pas ; le modèle est **intégré** au code (`isBuiltin`) et
 * n'existe pas dans la liste personnalisée ; un **autre pilote** s'en sert.
 */
export function modeleAEmporter(driverId: string): string | undefined {
    const etat = useSessionOSStore.getState();
    const pilote = etat.customGameDrivers.find(d => d.id === driverId);
    const templateId = pilote?.templateId;
    if (!templateId) return undefined;

    if (DEFAULT_SHEET_TEMPLATES.some(t => t.id === templateId)) return undefined;
    if (!etat.customSheetTemplates.some(t => t.id === templateId)) return undefined;

    const partage = tousLesPilotes(etat.customGameDrivers)
        .some(d => d.id !== driverId && d.templateId === templateId);
    return partage ? undefined : templateId;
}

/**
 * Construit la cible.
 *
 * ⚠️ `corpusRelatif` **n'est pas deviné ici** : il est résolu par
 * `resoudreCorpus`, qui a besoin de la liste des dossiers du disque, donc d'un
 * aller-retour. `PurgeService` le passe. *Résoudre un corpus autrement que ne le
 * fait la lecture est le défaut d'août, et il était indétectable.*
 */
export function cibleDuPilote(driverId: string, corpusRelatif?: string): CiblePilote | null {
    const etat = useSessionOSStore.getState();
    const pilote = tousLesPilotes(etat.customGameDrivers).find(d => d.id === driverId);
    if (!pilote) return null;

    return {
        id: pilote.id,
        nom: pilote.name,
        templateIdAEmporter: modeleAEmporter(driverId),
        corpusRelatif,
    };
}

const compte = (sujet: string, n: number) => ({ sujet, compte: n });

export const LES_DETENTEURS_DE_PILOTE: Detenteur<CiblePilote>[] = [
    {
        module: 'Forge — pilote et modèle',
        recenser: (cible) => [
            compte('le pilote lui-même', 1),
            compte('modèle de fiche qui n’appartient qu’à lui', cible.templateIdAEmporter ? 1 : 0),
        ],
        purger: (cible) => {
            const os = useSessionOSStore.getState();
            /* Le modèle d'abord : une fois le pilote parti, `modeleAEmporter`
               ne saurait plus dire à qui il appartenait. */
            if (cible.templateIdAEmporter) os.deleteSheetTemplate(cible.templateIdAEmporter);
            os.deleteGameDriver(cible.id);
        },
    },
    {
        module: 'Deck-OS',
        /*
          ⚠️ Les paquets déclarent leur jeu dans `systemId`, là où la campagne
          dit `system` — deux noms pour la même chose, et c'est le genre d'écart
          qui fait écrire une comparaison toujours fausse. `paquetsDuJeu.ts`
          porte la règle ; ici on ne fait que la citer.
        */
        recenser: (cible) => {
            const decks = useSessionOSStore.getState().decks ?? [];
            return [compte('paquets de ce jeu', decks.filter(d => d.systemId === cible.id).length)];
        },
        purger: (cible) => useSessionOSStore.setState(etat => ({
            decks: (etat.decks ?? []).filter(d => d.systemId !== cible.id),
            deckStates: Object.fromEntries(
                Object.entries(etat.deckStates ?? {})
                    .filter(([deckId]) => (etat.decks ?? [])
                        .some(d => d.id === deckId && d.systemId !== cible.id)),
            ),
        })),
    },
    {
        module: 'Bestiaire',
        recenser: (cible) => {
            const b = useBestiaireStore.getState();
            return [
                compte('gabarits d’adversaires', b.gabarits.filter(g => g.jeuId === cible.id).length),
                /* Clé `jeuId:archetypeId` — le préfixe, pas une inclusion libre :
                   `dnd` ne doit pas emporter les répartitions de `dnd-5e`. */
                compte('répartitions de champs validées',
                    Object.keys(b.repartitions).filter(c => c.startsWith(`${cible.id}:`)).length),
            ];
        },
        purger: (cible) => useBestiaireStore.setState(etat => ({
            gabarits: etat.gabarits.filter(g => g.jeuId !== cible.id),
            repartitions: Object.fromEntries(
                Object.entries(etat.repartitions).filter(([cle]) => !cle.startsWith(`${cible.id}:`)),
            ),
        })),
    },
    {
        module: 'Cortex — consignes du jeu',
        /*
          Les consignes par système vivent **dans** chaque cortex, en surcharge.
          On retire la surcharge, jamais le cortex : il sert à tous les jeux.
        */
        recenser: (cible) => [compte(
            'cortex portant une consigne pour ce jeu',
            useGemStore.getState().gems.filter(g => g.systemOverrides?.[cible.id] !== undefined).length,
        )],
        purger: (cible) => useGemStore.setState(etat => ({
            gems: etat.gems.map(g => {
                if (g.systemOverrides?.[cible.id] === undefined) return g;
                const surcharges = { ...g.systemOverrides };
                delete surcharges[cible.id];
                return { ...g, systemOverrides: surcharges };
            }),
        })),
    },
    {
        module: 'Afficheur Ulanzi',
        recenser: (cible) => [compte(
            'sélection de widgets pour ce jeu',
            useUlanziStore.getState().selection?.[cible.id] ? 1 : 0,
        )],
        purger: (cible) => useUlanziStore.setState(etat => {
            const selection = { ...(etat.selection ?? {}) };
            delete selection[cible.id];
            return { selection };
        }),
    },
    {
        module: 'Journal des lacunes',
        /*
          Les questions restées sans réponse pour ce jeu. Elles ne sont utiles
          que rapprochées d'un corpus : gardées après lui, elles proposeraient de
          forger des fiches pour un jeu qui n'existe plus.
        */
        recenser: (cible) => [compte(
            'questions sans réponse',
            useJournalDesLacunes.getState().questions.filter(q => q.systeme === cible.id).length,
        )],
        purger: (cible) => useJournalDesLacunes.setState(etat => ({
            questions: etat.questions.filter(q => q.systeme !== cible.id),
        })),
    },
];

/** Les modules recensés, dans l'ordre. Sert au test de complétude et à l'écran. */
export const LES_MODULES_DE_PILOTE = LES_DETENTEURS_DE_PILOTE.map(d => d.module);
