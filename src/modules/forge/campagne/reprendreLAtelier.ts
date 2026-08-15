import type { FicheConvertie } from '../rules/conversion';
import {
    cheminDesFichesDeCampagne, cheminDesBrouillonsDeCampagne, type CorpusDeCampagne,
} from '../../../../electron/corpusDeCampagne';

/**
 * Reprendre une série interrompue — depuis le disque, jamais depuis la mémoire.
 *
 * **Le manque, signalé à David le 2026-08-15 avant qu'il ne forge.** L'écran
 * gardait ses fiches en mémoire : fermer l'application laissait les brouillons
 * bien écrits sur le disque, mais **hors d'atteinte de l'écran**, qui ne savait
 * pas les relire. Il aurait fallu reforger — deux minutes de carnet pour une
 * réponse déjà obtenue.
 *
 * *L'avancement se lit sur le disque, jamais en mémoire de session.* C'est la
 * règle que l'Atelier des règles applique déjà, et elle vaut mot pour mot ici :
 * une série reprise depuis le disque est vraie ; une série restaurée de mémoire
 * prétendrait connaître un état que le disque seul atteste.
 */

export interface FicheReprise extends FicheConvertie {
    /** Vrai quand la fiche vient du disque et non d'un appel au carnet. */
    reprise: true;
}

/** Ce que l'atelier retrouve d'une campagne déjà travaillée. */
export interface AvancementDeLAtelier {
    /** Slugs présents dans `fiches/` — publiés, donc lus par l'Oracle. */
    publiees: Set<string>;
    /** Brouillons repris, par slug : forgés mais jamais publiés. */
    brouillons: Record<string, FicheReprise>;
}

/** La valeur d'une clé du frontmatter, ou une chaîne vide. */
function champ(entete: string, clef: string): string {
    const trouve = new RegExp(`^${clef}\\s*:\\s*(.*)$`, 'm').exec(entete);
    if (!trouve) return '';
    const nu = trouve[1].trim();
    const cite = /^"([\s\S]*)"$/.exec(nu) ?? /^'([\s\S]*)'$/.exec(nu);
    return cite ? cite[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\') : nu;
}

/**
 * Une fiche écrite, relue depuis son fichier.
 *
 * **Les avertissements sont RE-DÉDUITS du frontmatter, pas restaurés.** Ceux de
 * la forge venaient de la réponse brute du carnet, qui n'est pas conservée — et
 * inventer un « tout va bien » sur une fiche qu'on n'a pas examinée serait pire
 * que de ne rien dire. Le frontmatter, lui, porte de quoi retrouver ce qui
 * compte vraiment : la couverture, les sections citées, la présence de pages.
 * *Ce qu'on affiche est ce que le fichier atteste.*
 */
export function lireUneFicheEcrite(slug: string, markdown: string): FicheReprise {
    const texte = markdown.replace(/\r\n/g, '\n');
    const bloc = /^---\n([\s\S]*?)\n---/.exec(texte);
    const entete = bloc?.[1] ?? '';

    const sujet = champ(entete, 'sujet');
    const couverture = champ(entete, 'couverture') || 'partielle';
    const horsCanevas = champ(entete, 'hors_canevas') === 'true';
    const sections = champ(entete, 'sections')
        .split(/\s*;\s*/)
        .map(s => s.replace(/^[«"'\s]+|[»"'\s]+$/g, '').trim())
        .filter(Boolean);

    const avertissements: string[] = [];
    if (!entete) {
        avertissements.push("Ce fichier n'a pas de frontmatter : il n'a probablement pas été écrit par l'Atelier.");
    }
    if (couverture === 'absente') {
        avertissements.push("Couverture absente : le carnet n'a rien trouvé sur ce sujet.");
    }
    if (sections.length === 0) {
        avertissements.push(
            "Aucun titre de section : le résolveur titre → page n'a rien à confronter, et rien n'attrape l'invention sur cette fiche.",
        );
    }
    if (champ(entete, 'pages_fiables') === 'false') {
        avertissements.push('La fiche cite des numéros de page : ils ne renvoient pas au livre.');
    }
    if (horsCanevas) {
        avertissements.push(`« ${sujet} » n'entre dans aucun sujet du canevas : la fiche est marquée hors canevas.`);
    }

    return { slug, sujet, couverture, sections, horsCanevas, markdown, avertissements, reprise: true };
}

/** Les `.md` d'un dossier, sans leur extension. Un dossier absent rend une liste vide. */
async function slugsDuDossier(chemin: string): Promise<string[]> {
    const noms = (await window.appBridge?.ai?.listDir?.(chemin).catch(() => [] as string[])) ?? [];
    return noms.filter(n => n.endsWith('.md')).map(n => n.slice(0, -3));
}

/**
 * L'avancement d'une campagne, lu sur le disque.
 *
 * Ne lève jamais : un pont absent ou un dossier inexistant rendent un avancement
 * vide, ce qui est **le cas normal d'une campagne jamais travaillée**. Une
 * erreur ici ferait croire à une panne là où il n'y a qu'un début.
 */
export async function reprendreLAtelier(corpus: CorpusDeCampagne): Promise<AvancementDeLAtelier> {
    const [publiees, brouillonsSlugs] = await Promise.all([
        slugsDuDossier(cheminDesFichesDeCampagne(corpus)),
        slugsDuDossier(cheminDesBrouillonsDeCampagne(corpus)),
    ]);

    const dossier = cheminDesBrouillonsDeCampagne(corpus);
    const lus = await Promise.all(brouillonsSlugs.map(async slug => ({
        slug,
        contenu: await window.appBridge?.ai?.readDoc?.(`${dossier}/${slug}.md`).catch(() => null),
    })));

    const brouillons: Record<string, FicheReprise> = {};
    for (const { slug, contenu } of lus) {
        if (contenu?.trim()) brouillons[slug] = lireUneFicheEcrite(slug, contenu);
    }

    return { publiees: new Set(publiees), brouillons };
}
