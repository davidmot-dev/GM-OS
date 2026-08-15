import { forgeService } from '../ForgeService';
import { convertirFiche, type FicheConvertie } from '../rules/conversion';
import {
    CANEVAS_DE_CAMPAGNE, SUJETS_PAR_ACTE, CLEF_DES_REGLES_PROPRES,
    slugFicheDeCampagne, type SujetDeCampagne,
} from './canevasDeCampagne';
import {
    gabaritInventaireDeCampagne, gabaritStructureDeCampagne, gabaritFicheDeCampagne,
} from './gabaritsDeCampagne';
import { lireLaStructure, type ActeLu } from './structureDeCampagne';
import {
    resoudreCorpusDeCampagne, cheminDesFichesDeCampagne, cheminDesBrouillonsDeCampagne,
    type CorpusDeCampagne,
} from '../../../../electron/corpusDeCampagne';

/**
 * L'Atelier de campagne : interroger le carnet, sujet par sujet, et en tirer des
 * fiches vérifiables.
 *
 * **Il ne forge aucun objet de jeu.** Sa sortie est un dossier de fiches
 * sourcées sur le disque, exactement comme l'Atelier des règles. La projection
 * de ces fiches vers `Acte`, `Scene`, `Entity` et le reste est le travail de la
 * Forge de campagne, qui viendra ensuite — *dériver du corpus, pas produire en
 * parallèle*, parce que deux productions indépendantes des mêmes faits
 * divergeront et que rien ne les comparera jamais.
 *
 * **Le carnet est interrogé par `ForgeService.interrogerCarnet`**, et pas
 * autrement : elle porte la réauthentification, le repli sur `healthcheck` et le
 * plafond de temps. Un second chemin vers le même serveur les réécrirait à sa
 * façon.
 */

/** Une demande adressée au carnet, et ce qu'elle est devenue. */
export interface EtapeDeCampagne {
    /** Identifiant stable — c'est aussi le nom du fichier. */
    id: string;
    sujet: SujetDeCampagne;
    /** Titre de l'acte, pour les deux sujets qui s'interrogent partie par partie. */
    acte?: string;
    /** Ce qu'on affiche : « Personnages non joueurs — Acte I ». */
    titre: string;
}

export interface FicheDeCampagne extends FicheConvertie {
    etape: EtapeDeCampagne;
    /** La réponse brute du carnet, gardée pour que l'écran puisse la montrer. */
    brut: string;
}

/**
 * Les étapes à parcourir, une fois la structure connue.
 *
 * Les sujets par acte ne sont développés que si l'on a des actes : sans
 * structure, ils sont **omis** plutôt que posés sans borne. Une requête sans
 * borne repartirait sur la campagne entière et rendrait la même réponse à chaque
 * fois — on paierait dix appels pour un.
 */
export function etapesDeLaCampagne(actes: readonly ActeLu[]): EtapeDeCampagne[] {
    const etapes: EtapeDeCampagne[] = [];

    for (const sujet of CANEVAS_DE_CAMPAGNE) {
        // La structure a son gabarit propre et n'est pas une fiche : elle est
        // déjà acquise quand cette liste se construit.
        if (sujet.clef === 'Structure en actes') continue;

        if (!sujet.parActe) {
            etapes.push({ id: slugFicheDeCampagne(sujet.clef), sujet, titre: sujet.clef });
            continue;
        }
        for (const acte of actes) {
            etapes.push({
                id: slugFicheDeCampagne(sujet.clef, acte.titre),
                sujet,
                acte: acte.titre,
                titre: `${sujet.clef} — ${acte.titre}`,
            });
        }
    }

    return etapes;
}

/** Vrai pour la fiche dont le contenu ne doit alimenter aucun pilote. */
export function estUneFicheDeRegles(etape: EtapeDeCampagne): boolean {
    return etape.sujet.clef === CLEF_DES_REGLES_PROPRES;
}

export class ServiceDeCampagne {
    private static instance: ServiceDeCampagne;

    public static getInstance(): ServiceDeCampagne {
        if (!ServiceDeCampagne.instance) ServiceDeCampagne.instance = new ServiceDeCampagne();
        return ServiceDeCampagne.instance;
    }

    /**
     * Étape 1 — l'inventaire.
     *
     * Rendu **brut**, sans analyse. Il borne le travail et rend la couverture
     * mesurable ; c'est un livrable à part entière, que l'écran montre et qu'on
     * enregistre comme fiche. Côté règles, c'est lui qui a révélé que
     * *Poursuites* n'est pas couvert par le livre de base de Dune — ce qu'aucune
     * fiche prise seule n'aurait dit.
     */
    public async inventaire(notebookId: string, sourceIds?: string[]): Promise<string> {
        return forgeService.interrogerCarnet(notebookId, gabaritInventaireDeCampagne(), sourceIds);
    }

    /**
     * Étape 2 — la structure.
     *
     * Rend les actes **et** la réponse brute : si la lecture ne trouve rien, le
     * meneur doit pouvoir lire ce que le carnet a réellement répondu plutôt que
     * de se voir annoncer un échec muet. C'est la réponse la plus lourde de
     * conséquences de tout l'atelier — elle découpe les onze requêtes suivantes.
     */
    public async structure(
        notebookId: string,
        sourceIds?: string[],
    ): Promise<{ actes: ActeLu[]; brut: string }> {
        const brut = await forgeService.interrogerCarnet(notebookId, gabaritStructureDeCampagne(), sourceIds);
        return { actes: lireLaStructure(brut), brut };
    }

    /**
     * Étape 3 — une fiche, sur un sujet et éventuellement un acte.
     *
     * La conversion en frontmatter se fait **localement** : on a demandé du YAML
     * au carnet, il a pris les `---` pour un séparateur et aplati le bloc en
     * titre. *On demande au carnet ce qu'il sait produire, on fabrique
     * localement ce qui doit être exact.*
     */
    public async fiche(
        notebookId: string,
        etape: EtapeDeCampagne,
        campagne: string,
        sourceIds?: string[],
        /**
         * Le jeu de la campagne, inscrit dans le frontmatter.
         *
         * **Il ne sert à rien ici, et c'est voulu** : les gabarits interdisent
         * les règles, et le carnet lit le livre de campagne. Mais la Forge en
         * aura besoin — le modèle de santé des PNJ, le gabarit de fiche, le
         * `system` de la campagne — et une campagne neuve n'a nulle part où le
         * porter. *Une information disponible maintenant et perdue ensuite doit
         * s'écrire maintenant.*
         */
        jeu?: string,
    ): Promise<FicheDeCampagne> {
        const brut = await forgeService.interrogerCarnet(
            notebookId,
            gabaritFicheDeCampagne(etape.sujet, etape.acte),
            sourceIds,
        );

        const fiche = convertirFiche(brut, {
            systeme: campagne,
            // Une fiche de campagne déclare `campagne:`. La ranger sous
            // `systeme:` l'aurait fait passer pour une fiche de règles auprès de
            // tout ce qui lit le frontmatter.
            clefDAppartenance: 'campagne',
            sujetDemande: etape.sujet.clef,
            canevas: CANEVAS_DE_CAMPAGNE,
            champsSupplementaires: {
                ...(jeu ? { jeu } : {}),
                ...(etape.acte ? { partie: etape.acte } : {}),
            },
            // Deux actes du même sujet ne se distinguent que par le slug : sans
            // cela, le second effacerait le premier en silence.
            slug: etape.id,
        });

        return { ...fiche, etape, brut };
    }
}

export const serviceDeCampagne = ServiceDeCampagne.getInstance();

// ─────────────────────────────────────────────
// Écriture sur le disque
// ─────────────────────────────────────────────

/** Le corpus d'une campagne, résolu comme le lira l'Oracle. */
export async function corpusDeLaCampagne(
    nom: string,
    campaignPath?: string,
): Promise<CorpusDeCampagne> {
    const connus = await window.appBridge?.ai?.listDir?.('campaigns').catch(() => undefined);
    return resoudreCorpusDeCampagne({ nom, campaignPath, dossiersConnus: connus });
}

/**
 * Écrit le brouillon d'une fiche, **avant toute revue**.
 *
 * Une fiche coûte une à deux minutes de carnet et serait perdue si l'atelier se
 * fermait pendant la relecture. Un brouillon n'engage rien : il est exclu de
 * l'index de l'Oracle, et la revue devient une *publication*, à froid, plus
 * tard.
 *
 * Rend `false` si le pont manque, sans lever : l'atelier continue sa boucle avec
 * la fiche en mémoire plutôt que de s'arrêter au milieu d'une série de treize
 * appels.
 */
export async function ecrireLeBrouillon(corpus: CorpusDeCampagne, fiche: FicheDeCampagne): Promise<boolean> {
    const chemin = `${cheminDesBrouillonsDeCampagne(corpus)}/${fiche.slug}.md`;
    return (await window.appBridge?.ai?.writeDoc?.(chemin, fiche.markdown).catch(() => false)) ?? false;
}

/** Publie une fiche relue vers `fiches/`, et retire son brouillon. */
export async function publierLaFiche(corpus: CorpusDeCampagne, fiche: FicheDeCampagne): Promise<boolean> {
    const pont = window.appBridge?.ai;
    if (!pont?.writeDoc) return false;

    const ecrit = await pont.writeDoc(
        `${cheminDesFichesDeCampagne(corpus)}/${fiche.slug}.md`,
        fiche.markdown,
    ).catch(() => false);
    if (!ecrit) return false;

    // Conservé, le brouillon redeviendrait une décharge, avec deux versions de
    // chaque fiche dans le même dossier parent — le défaut corrigé sur le corpus
    // de règles le 2026-08-14.
    await pont.deleteDoc?.(`${cheminDesBrouillonsDeCampagne(corpus)}/${fiche.slug}.md`).catch(() => false);
    return true;
}

/** Enregistre l'inventaire comme fiche : c'est un livrable, pas un prétraitement. */
export async function ecrireLInventaire(
    corpus: CorpusDeCampagne,
    campagne: string,
    brut: string,
    jeu?: string,
): Promise<boolean> {
    const entete = [
        '---',
        'sujet: Inventaire de la campagne',
        `campagne: ${campagne}`,
        ...(jeu ? [`jeu: ${jeu}`] : []),
        'genere_par: notebooklm',
        'gabarit: v3',
        'relu: false',
        '---',
        '',
    ].join('\n');
    const chemin = `${cheminDesFichesDeCampagne(corpus)}/inventaire-de-la-campagne.md`;
    return (await window.appBridge?.ai?.writeDoc?.(chemin, `${entete}${brut.trim()}\n`).catch(() => false)) ?? false;
}

export { SUJETS_PAR_ACTE };
