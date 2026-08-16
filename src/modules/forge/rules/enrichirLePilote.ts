import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * Verser une dérivation dans un pilote qui existe déjà — **sans rien écraser**.
 *
 * **Le défaut que cela corrige, relevé le 2026-08-16.** L'enregistrement de la
 * Forge Système faisait `driverId = custom-${Date.now()}` sans condition : le
 * sélecteur « Destination » ne servait qu'à *nommer*. Reforger Cthulhu Hack
 * aurait donc produit un **second** pilote du même nom, à côté de celui que les
 * campagnes désignent — et un second gabarit, à côté de celui que les fiches de
 * personnage désignent.
 *
 * C'est la troisième forme du même défaut rencontrée dans la journée : les
 * campagnes en double le matin, les fiches d'acte l'après-midi, les pilotes
 * ici. **Créer un double au lieu de mettre à jour**, chaque fois sans un mot.
 *
 * Et c'est ici que ça coûtait le plus cher : `AddEntityForm` donne
 * `driver.templateId` à chaque nouveau personnage, et `sheetData` est indexé
 * par `field.id`. Un gabarit remplacé, ce sont des fiches de personnage qui
 * perdent leurs valeurs sans que rien ne l'annonce.
 *
 * ---
 *
 * **LA RÈGLE : on remplit ce qui est vide, on ne remplace jamais ce qui est
 * rempli.** C'est celle de `handleAppliquerLaCampagneForgee`, et elle vaut mot
 * pour mot ici — *si retravailler un pilote efface les corrections de la semaine
 * précédente, le meneur cessera de retravailler.*
 *
 * Ce qui est laissé en place est **dit**, pas tu : une valeur dérivée qu'on
 * écarte est une information que le meneur voudra peut-être quand même.
 */

/** Ce que l'enrichissement a fait, chemin par chemin. */
export interface JournalDEnrichissement {
    /** Champs qui étaient vides et que la dérivation a remplis — « jet.sens ». */
    remplis: string[];
    /**
     * Champs déjà pourvus, laissés tels quels alors que la dérivation proposait
     * autre chose. C'est ici que le meneur regarde s'il veut arbitrer.
     */
    conserves: string[];
    /** Sections du gabarit ajoutées, parce qu'aucune ne portait cet identifiant. */
    sectionsAjoutees: string[];
    /** Champs ajoutés dans une section qui existait déjà. */
    champsAjoutes: string[];
}

export interface PiloteEnrichi {
    driver: GameDriver;
    template?: SheetTemplate;
    journal: JournalDEnrichissement;
}

/**
 * Les clés qu'aucune dérivation ne doit toucher.
 *
 * `id` et `templateId` sont **désignés de l'extérieur** — par les campagnes
 * (`campaign.system`), par les personnages (`entity.templateId`), par les
 * fiches. Les réécrire romprait des liens que rien ne réparerait.
 */
const INTOUCHABLES = new Set(['id', 'templateId', 'author', 'version', 'isBuiltin']);

/**
 * Une valeur absente, et non une valeur choisie.
 *
 * **`0` et `false` n'en sont pas.** Un modificateur nul, une option désactivée,
 * un seuil à zéro : ce sont des décisions. Les traiter comme des trous les
 * ferait écraser par la première dérivation venue — le défaut exact de
 * `c.description || derive.description`, qui ne s'applique qu'aux chaînes.
 */
export function estVide(valeur: unknown): boolean {
    if (valeur === undefined || valeur === null) return true;
    if (typeof valeur === 'string') return valeur.trim() === '';
    if (Array.isArray(valeur)) return valeur.length === 0;
    if (typeof valeur === 'object') return Object.keys(valeur as object).length === 0;
    return false;
}

function estObjetSimple(valeur: unknown): valeur is Record<string, unknown> {
    return !!valeur && typeof valeur === 'object' && !Array.isArray(valeur);
}

/**
 * Fusion **champ par champ**, en profondeur, avec journal.
 *
 * Jamais un `Object.assign` de haut niveau : `combat`, `ui_config`, `jet`,
 * `dice` et `tactical` sont des objets que plusieurs groupes alimentent, et les
 * remplacer en bloc perdrait tout ce que le pilote y portait déjà. C'est la
 * leçon de `fusionnerFragments`, et celle de la perte de campagnes du
 * 2026-08-07 : *une fusion superficielle remplace des objets entiers.*
 */
function fusionner(
    existant: Record<string, unknown>,
    derive: Record<string, unknown>,
    journal: JournalDEnrichissement,
    prefixe = '',
): Record<string, unknown> {
    const resultat: Record<string, unknown> = { ...existant };

    for (const [clef, valeurDerivee] of Object.entries(derive)) {
        if (!prefixe && INTOUCHABLES.has(clef)) continue;
        // Une dérivation muette n'a rien à donner : elle ne peut ni remplir ni
        // contredire.
        if (estVide(valeurDerivee)) continue;

        const chemin = prefixe ? `${prefixe}.${clef}` : clef;
        const valeurExistante = existant[clef];

        if (estVide(valeurExistante)) {
            resultat[clef] = valeurDerivee;
            journal.remplis.push(chemin);
            continue;
        }

        if (estObjetSimple(valeurExistante) && estObjetSimple(valeurDerivee)) {
            resultat[clef] = fusionner(valeurExistante, valeurDerivee, journal, chemin);
            continue;
        }

        // Identiques : rien à dire, la dérivation confirme ce qui est là.
        if (JSON.stringify(valeurExistante) === JSON.stringify(valeurDerivee)) continue;

        journal.conserves.push(chemin);
    }

    return resultat;
}

/**
 * Le gabarit s'enrichit **par ajout seul**.
 *
 * **Aucune section n'est modifiée, aucun champ n'est retiré.** `sheetData` d'un
 * personnage est un dictionnaire indexé par `field.id` : renommer un champ, ou
 * en changer le type, vide silencieusement la case correspondante sur toutes
 * les fiches déjà remplies. On n'ajoute donc que ce qui manque — une section
 * dont l'identifiant est inconnu, un champ absent d'une section connue.
 *
 * Ce qui existe et diverge est laissé, et compté dans `conserves` : c'est au
 * meneur d'arbitrer, à l'éditeur de fiche, où il voit ce qu'il casse.
 */
function enrichirLeGabarit(
    existant: SheetTemplate,
    derive: Partial<SheetTemplate>,
    journal: JournalDEnrichissement,
): SheetTemplate {
    const sections = [...(existant.sections ?? [])];

    for (const sectionDerivee of derive.sections ?? []) {
        if (!sectionDerivee?.id) continue;
        const rang = sections.findIndex(s => s.id === sectionDerivee.id);

        if (rang === -1) {
            sections.push(sectionDerivee);
            journal.sectionsAjoutees.push(sectionDerivee.id);
            continue;
        }

        const connus = new Set((sections[rang].fields ?? []).map(f => f.id));
        const manquants = (sectionDerivee.fields ?? []).filter(f => f?.id && !connus.has(f.id));
        if (manquants.length === 0) continue;

        sections[rang] = { ...sections[rang], fields: [...(sections[rang].fields ?? []), ...manquants] };
        for (const champ of manquants) journal.champsAjoutes.push(`${sectionDerivee.id}.${champ.id}`);
    }

    return {
        ...existant,
        // Le nom et l'emoji ne se remplacent pas non plus : ce sont des libellés
        // que le meneur voit et choisit.
        name: existant.name || derive.name || 'Fiche',
        ...(existant.emoji || derive.emoji ? { emoji: existant.emoji || derive.emoji } : {}),
        sections,
    };
}

/**
 * Verse une dérivation dans un pilote existant.
 *
 * Rend le pilote et le gabarit **résultants** — l'appelant n'a plus qu'à les
 * enregistrer sous leurs identifiants d'origine — et le journal de ce qui a
 * changé. Le gabarit n'est rendu que s'il y en avait un : un pilote sans fiche
 * en reçoit une neuve, ce qui relève de la création et non de l'écrasement.
 */
export function enrichirLePilote(
    existant: { driver: GameDriver; template?: SheetTemplate },
    derive: { driver?: Partial<GameDriver>; template?: Partial<SheetTemplate> },
): PiloteEnrichi {
    const journal: JournalDEnrichissement = {
        remplis: [], conserves: [], sectionsAjoutees: [], champsAjoutes: [],
    };

    const driver = fusionner(
        existant.driver as unknown as Record<string, unknown>,
        (derive.driver ?? {}) as Record<string, unknown>,
        journal,
    ) as unknown as GameDriver;

    const template = existant.template
        ? enrichirLeGabarit(existant.template, derive.template ?? {}, journal)
        : undefined;

    return { driver, ...(template ? { template } : {}), journal };
}
