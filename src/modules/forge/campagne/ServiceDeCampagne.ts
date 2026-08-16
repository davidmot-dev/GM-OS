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
import { retirerLesRenvoisDuCarnet } from '../renvoisDuCarnet';
import { sujetDuFrontmatter } from '../rules/fichesSupplantees';
import { fichesSupplanteesDeCampagne, partieDuFrontmatter } from './fichesSupplanteesDeCampagne';
import {
    resoudreCorpusDeCampagne, cheminDesFichesDeCampagne, cheminDesBrouillonsDeCampagne,
    cheminDesFichesSupplanteesDeCampagne,
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
        const brut = await forgeService.interrogerCarnet(notebookId, gabaritInventaireDeCampagne(), sourceIds);
        return retirerLesRenvoisDuCarnet(brut);
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
        const reponse = await forgeService.interrogerCarnet(notebookId, gabaritStructureDeCampagne(), sourceIds);
        // Les renvois partent AVANT la lecture : « Acte I — La Chute [3, 5] »
        // deviendrait un titre que le livre ne porte pas, et c'est ce titre qui
        // borne les onze requêtes suivantes.
        const brut = retirerLesRenvoisDuCarnet(reponse);
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
        const brut = retirerLesRenvoisDuCarnet(await forgeService.interrogerCarnet(
            notebookId,
            gabaritFicheDeCampagne(etape.sujet, etape.acte),
            sourceIds,
        ));

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

/**
 * Ce qu'il faut pour écrire une fiche : où, et quoi.
 *
 * Volontairement plus étroit que `FicheDeCampagne` — une fiche **reprise du
 * disque** n'a ni étape ni réponse brute, et doit pourtant pouvoir être publiée.
 * Exiger le tout aurait interdit précisément le geste que la reprise existe pour
 * permettre.
 */
export type FicheAEcrire = Pick<FicheConvertie, 'slug' | 'markdown'>;

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
export async function ecrireLeBrouillon(corpus: CorpusDeCampagne, fiche: FicheAEcrire): Promise<boolean> {
    const chemin = `${cheminDesBrouillonsDeCampagne(corpus)}/${fiche.slug}.md`;
    return (await window.appBridge?.ai?.writeDoc?.(chemin, fiche.markdown).catch(() => false)) ?? false;
}

/**
 * Met de côté la version précédente d'une fiche, s'il y en a une.
 *
 * **Ce que l'absence de ce geste coûtait, trouvé le 2026-08-16.**
 * `cheminDesFichesSupplanteesDeCampagne` désignait `fiches-v1/` depuis la veille
 * et **personne ne l'appelait** : `publierLaFiche` écrivait par-dessus. Or le
 * slug d'une fiche de campagne est **déterministe** — `slugFicheDeCampagne` le
 * dérive du sujet et de l'acte — donc une reforge ne produit pas un doublon
 * comme côté règles : elle **écrase**. La version précédente n'était pas en
 * concurrence dans l'index, elle n'existait plus du tout.
 *
 * *On répare plutôt qu'on ne refuse* : la publication continue même si
 * l'archivage échoue — perdre une fiche neuve pour n'avoir pas su ranger
 * l'ancienne serait le pire des deux échanges. Mais l'échec est rendu, pour que
 * l'écran puisse le dire.
 *
 * **L'ordre n'est pas négociable** : relire, écrire l'archive, et seulement
 * ensuite laisser l'appelant écraser. C'est la règle d'`archiverUneFiche` côté
 * règles, et elle vient du même raisonnement — un archivage qui poserait un
 * fichier vide détruirait la fiche au lieu de la mettre de côté.
 */
export async function archiverLaVersionPrecedente(
    corpus: CorpusDeCampagne,
    slug: string,
): Promise<{ archivee: boolean; raison?: string }> {
    const pont = window.appBridge?.ai;
    if (!pont?.readDoc || !pont?.writeDoc) return { archivee: false };

    const ancienne = await pont.readDoc(`${cheminDesFichesDeCampagne(corpus)}/${slug}.md`)
        .catch(() => null);
    // Pas de version précédente : c'est le cas normal d'une première
    // publication, et ce n'est pas un échec.
    if (!ancienne?.trim()) return { archivee: false };

    const ecrite = await pont.writeDoc(
        `${cheminDesFichesSupplanteesDeCampagne(corpus)}/${slug}.md`,
        ancienne,
    ).catch(() => false);

    return ecrite
        ? { archivee: true }
        : { archivee: false, raison: "l'ancienne version n'a pas pu être copiée dans fiches-v1/" };
}

/**
 * Écarte les fiches du même sujet et du même acte publiées sous un AUTRE nom.
 *
 * **Le second filet, et il rattrape ce que l'archivage par slug ne voit pas.**
 * Une dérive du titre d'acte — « Voyage en Mésopotamie » devenu « Voyage en
 * Mésopotamie (ou Voyage en Mésopotamie) » le 2026-08-16 — change le slug : la
 * fiche neuve n'écrase alors rien, elle s'installe **à côté**. Deux jeux de
 * fiches pour un acte, l'un ignoré en silence par la Forge, les deux servis à
 * l'Oracle.
 *
 * Déplacement, et non copie : ces fiches sortent du corpus vivant. Elles ne
 * quittent pas le disque pour autant.
 */
async function ecarterLesFichesSupplantees(
    corpus: CorpusDeCampagne,
    fiche: FicheAEcrire,
): Promise<string[]> {
    const pont = window.appBridge?.ai;
    if (!pont?.listDir || !pont?.readDoc || !pont?.writeDoc) return [];

    const dossier = cheminDesFichesDeCampagne(corpus);
    const noms = (await pont.listDir(dossier).catch(() => [] as string[]))
        .filter(n => n.endsWith('.md'));
    if (noms.length === 0) return [];

    const lues = await Promise.all(noms.map(async nom => {
        const contenu = (await pont.readDoc!(`${dossier}/${nom}`).catch(() => null)) ?? '';
        return { nom, sujet: sujetDuFrontmatter(contenu), partie: partieDuFrontmatter(contenu), contenu };
    }));

    // On lit le sujet et l'acte sur la fiche QU'ON PUBLIE, jamais sur ce qui
    // traîne : c'est elle qui définit ce qu'elle remplace.
    const nomPublie = `${fiche.slug}.md`;
    const sujet = sujetDuFrontmatter(fiche.markdown);
    if (!sujet) return [];

    const caduques = fichesSupplanteesDeCampagne(
        sujet,
        partieDuFrontmatter(fiche.markdown),
        nomPublie,
        lues,
    );

    const ecartees: string[] = [];
    for (const nom of caduques) {
        const source = lues.find(f => f.nom === nom);
        if (!source?.contenu.trim()) continue;
        // Écrire l'archive AVANT d'effacer : l'ordre n'est pas négociable, un
        // effacement qui précède une écriture refusée perd la fiche.
        const ecrite = await pont.writeDoc(
            `${cheminDesFichesSupplanteesDeCampagne(corpus)}/${nom}`,
            source.contenu,
        ).catch(() => false);
        if (!ecrite) continue;
        await pont.deleteDoc?.(`${dossier}/${nom}`).catch(() => false);
        ecartees.push(nom);
    }
    return ecartees;
}

/** Ce qu'une publication a fait — écrire, et ce qu'elle a écarté au passage. */
export interface ResultatDePublication {
    publiee: boolean;
    /** Fiches du même sujet et du même acte, déplacées vers `fiches-v1/`. */
    ecartees: string[];
}

/**
 * Publie une fiche relue vers `fiches/`, et retire son brouillon.
 *
 * Deux archivages, parce qu'il y a deux façons de supplanter une fiche : le même
 * slug (on écrase) et un slug différent pour le même sujet et le même acte (on
 * s'installerait à côté). *On répare plutôt qu'on ne refuse, et on dit ce qu'on
 * a réparé* — d'où les noms rendus, que l'écran annonce.
 */
export async function publierLaFiche(
    corpus: CorpusDeCampagne,
    fiche: FicheAEcrire,
): Promise<ResultatDePublication> {
    const pont = window.appBridge?.ai;
    if (!pont?.writeDoc) return { publiee: false, ecartees: [] };

    // Avant d'écraser, on met de côté. Une reforge doit rester comparable à ce
    // qu'elle remplace, et rattrapable si elle est moins bonne.
    await archiverLaVersionPrecedente(corpus, fiche.slug);
    const ecartees = await ecarterLesFichesSupplantees(corpus, fiche);

    const ecrit = await pont.writeDoc(
        `${cheminDesFichesDeCampagne(corpus)}/${fiche.slug}.md`,
        fiche.markdown,
    ).catch(() => false);
    if (!ecrit) return { publiee: false, ecartees };

    // Conservé, le brouillon redeviendrait une décharge, avec deux versions de
    // chaque fiche dans le même dossier parent — le défaut corrigé sur le corpus
    // de règles le 2026-08-14.
    await pont.deleteDoc?.(`${cheminDesBrouillonsDeCampagne(corpus)}/${fiche.slug}.md`).catch(() => false);
    return { publiee: true, ecartees };
}

/**
 * Une réponse brute enregistrée comme fiche, sous un sujet donné.
 *
 * L'inventaire et la structure ne passent pas par `convertirFiche` : ils n'ont
 * ni sections ni couverture à déclarer, et les faire ressembler à des fiches de
 * canevas leur prêterait des métadonnées qu'on n'a pas vérifiées.
 */
async function ecrireUneReponseBrute(
    corpus: CorpusDeCampagne,
    campagne: string,
    sujet: string,
    slug: string,
    brut: string,
    jeu?: string,
): Promise<boolean> {
    const entete = [
        '---',
        `sujet: ${sujet}`,
        `campagne: ${campagne}`,
        ...(jeu ? [`jeu: ${jeu}`] : []),
        'genere_par: notebooklm',
        'gabarit: v3',
        'relu: false',
        '---',
        '',
    ].join('\n');
    // Relancer l'inventaire ou la structure écrase la réponse précédente, comme
    // pour toute fiche : elles passent par le même archivage.
    await archiverLaVersionPrecedente(corpus, slug);
    const chemin = `${cheminDesFichesDeCampagne(corpus)}/${slug}.md`;
    return (await window.appBridge?.ai?.writeDoc?.(chemin, `${entete}${brut.trim()}\n`).catch(() => false)) ?? false;
}

/** Enregistre l'inventaire comme fiche : c'est un livrable, pas un prétraitement. */
export async function ecrireLInventaire(
    corpus: CorpusDeCampagne,
    campagne: string,
    brut: string,
    jeu?: string,
): Promise<boolean> {
    return ecrireUneReponseBrute(
        corpus, campagne, 'Inventaire de la campagne', 'inventaire-de-la-campagne', brut, jeu,
    );
}

/**
 * Enregistre la structure — et **c'est elle qui manquait le plus**.
 *
 * L'Atelier lisait la structure, en tirait les titres d'actes qui bornent les
 * onze requêtes suivantes, puis **la laissait en mémoire**. Fermer la fenêtre la
 * perdait. Les fiches par acte gardaient bien leur `partie:`, donc les *titres*
 * survivaient ; l'**enjeu de chaque acte**, lui, disparaissait — et c'est
 * exactement ce que `Acte.resume` attend. La Forge aurait dû soit s'en passer,
 * soit l'inventer.
 *
 * *Une information disponible maintenant et perdue ensuite doit s'écrire
 * maintenant* — la règle qui avait déjà valu son `jeu:` au frontmatter.
 */
export async function ecrireLaStructure(
    corpus: CorpusDeCampagne,
    campagne: string,
    brut: string,
    jeu?: string,
): Promise<boolean> {
    return ecrireUneReponseBrute(
        corpus, campagne, 'Structure en actes', 'structure-en-actes', brut, jeu,
    );
}

export { SUJETS_PAR_ACTE };
