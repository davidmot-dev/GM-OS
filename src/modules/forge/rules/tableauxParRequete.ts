import { TITRE_DES_TABLEAUX_ANNONCES } from './gabarits';
import { lignesAVerifier, normaliser } from './verificationAuLivre';
import { estUneLigneDeSeparation } from './tableauMarkdown';

/**
 * **F3 — un tableau par requête** (plan `documentation/Planning/2026-11-06-forge-tableaux-equipement-bestiaire.md`,
 * 06/11/2026, David : *« termine F3 »*).
 *
 * NotebookLM coupe vers 6 minutes, et un chapitre d'armes de quarante lignes dépasse ce qu'une
 * requête rend sûrement. La forge demande d'abord la **liste** des tableaux (ou des créatures), avec
 * leur nombre de lignes ; puis un lot par requête ; la fiche s'assemble, et le nombre annoncé
 * devient un contrôle : « Armes de contact : 10 attendues, 8 recopiées ».
 *
 * **Le brouillon porte l'avancement.** Tant que la liste y est, la première moitié n'est pas finie :
 * une forge relancée relit le brouillon et reprend au premier lot manquant, sans repayer les autres.
 *
 * Module pur : `ForgeService.forgeCard` l'emploie, les requêtes restent chez lui.
 */

export type NatureDesTableaux = 'equipement' | 'creatures';

/** Un tableau (équipement) ou une créature (bestiaire) annoncé par l'en-tête. */
export interface PieceAnnoncee {
    titre: string;
    /** Le nombre de lignes annoncé ; `null` si le carnet ne l'a pas donné (toujours pour une créature). */
    attendu: number | null;
}

/** Au plus tant de lignes attendues par requête : un petit sujet tient en une, un gros se découpe. */
export const LIGNES_PAR_REQUETE = 15;
/** Au plus tant de créatures par requête : un profil compte une dizaine de colonnes, et ses attaques. */
export const CREATURES_PAR_REQUETE = 6;

const RE_TITRE_DE_LA_LISTE = new RegExp(`^##\\s+${TITRE_DES_TABLEAUX_ANNONCES}\\s*$`, 'mi');

const cellules = (ligne: string) => ligne.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim());
const nettoyer = (c: string) => c.replace(/\*\*/g, '').replace(/^[«"“]\s*|\s*[»"”]$/g, '').replace(/^tableau\s+(?:des|du|de la|de l['’]|de)\s+/i, '').trim();

/** La section de la liste, jusqu'au titre suivant. */
function sectionDeLaListe(texte: string): { debut: number; fin: number } | null {
    const m = RE_TITRE_DE_LA_LISTE.exec(texte);
    if (!m) return null;
    const apres = texte.slice(m.index + m[0].length);
    const suivant = /^#{1,2}\s/m.exec(apres);
    return { debut: m.index, fin: m.index + m[0].length + (suivant ? suivant.index : apres.length) };
}

/** Le brouillon porte-t-il encore la liste, donc une première moitié inachevée ? */
export const porteLaListeDesTableaux = (texte: string | undefined) => !!texte && sectionDeLaListe(texte) !== null;

/** Les tableaux ou créatures annoncés : le tableau Markdown de la section « Tableaux du livre ». */
export function lireLesPiecesAnnoncees(texte: string): PieceAnnoncee[] {
    const section = sectionDeLaListe(texte);
    if (!section) return [];
    const pieces: PieceAnnoncee[] = [];
    const vues = new Set<string>();
    for (const ligne of texte.slice(section.debut, section.fin).split(/\r?\n/)) {
        if (!ligne.trim().startsWith('|') || estUneLigneDeSeparation(ligne)) continue;
        const [premiere, seconde] = cellules(ligne);
        const titre = nettoyer(premiere ?? '');
        if (!titre || /^(tableau|creature|créature|lignes|section)$/i.test(titre)) continue;
        const cle = normaliser(titre);
        if (vues.has(cle)) continue;
        vues.add(cle);
        const nombre = /^\s*(\d+)/.exec(seconde ?? '');
        pieces.push({ titre, attendu: nombre ? Number(nombre[1]) : null });
    }
    return pieces;
}

/** Les lots : par tableaux, jusqu'à `LIGNES_PAR_REQUETE` lignes attendues ; par six créatures. */
export function decouperEnLots(pieces: readonly PieceAnnoncee[], nature: NatureDesTableaux): PieceAnnoncee[][] {
    if (nature === 'creatures') {
        const lots: PieceAnnoncee[][] = [];
        for (let i = 0; i < pieces.length; i += CREATURES_PAR_REQUETE) lots.push(pieces.slice(i, i + CREATURES_PAR_REQUETE));
        return lots;
    }
    const lots: PieceAnnoncee[][] = [];
    let courant: PieceAnnoncee[] = [];
    let lignes = 0;
    for (const p of pieces) {
        // Un tableau sans compte, ou plus grand que le lot, part seul.
        const poids = p.attendu ?? LIGNES_PAR_REQUETE;
        if (courant.length && lignes + poids > LIGNES_PAR_REQUETE) { lots.push(courant); courant = []; lignes = 0; }
        courant.push(p);
        lignes += poids;
    }
    if (courant.length) lots.push(courant);
    return lots;
}

/** La réponse d'un lot, réduite à ses tableaux et à leurs titres « ### » : ni « ## », ni « --- ». */
export function tableauxDeLaReponse(reponse: string): string {
    const lignes = reponse.replace(/\r\n/g, '\n').split('\n');
    const debut = lignes.findIndex(l => /^###\s/.test(l) || l.trim().startsWith('|') || /^absent des sources/i.test(l.trim()));
    if (debut < 0) return '';
    return lignes.slice(debut).filter(l => !/^#{1,2}\s/.test(l) && !/^\s*-{3,}\s*$/.test(l)).join('\n').trim();
}

const RE_VALEURS = /^##\s+Valeurs\s*$/m;

/** Le brouillon après un lot : l'en-tête (liste comprise), puis « ## Valeurs » et les tableaux reçus. */
export function ajouterAuBrouillon(brouillon: string, tableaux: string): string {
    const base = brouillon.trimEnd();
    const avecValeurs = RE_VALEURS.test(base) ? base : `${base}\n\n## Valeurs`;
    return tableaux ? `${avecValeurs}\n\n${tableaux}` : avecValeurs;
}

const titreNormalise = (t: string) => normaliser(t.replace(/^tableau\s+(?:des|du|de la|de l['’]|de)\s+/i, ''));

/*
  Le nom d'une créature annoncée, comparé à celui d'une ligne recopiée — 09/11/2026 : la liste
  garde l'original (« Xénocobra *(Hammerpede)* », utile au carnet pour chercher dans un livre
  anglais), la ligne lue le retire (`lignesAVerifier`) ; sans cela, les quinze créatures de Building
  Better Worlds étaient dites « sans profil recopié », et une forge reprise refaisait ses lots.
*/
const nomDeCreature = (titre: string) => normaliser(titre.replace(/\s*\*\(([^)]*)\)\*/g, ''));

/** Les pièces d'un lot sont-elles déjà dans le brouillon ? (reprise après une requête échouée) */
export function lotDejaRecopie(brouillon: string, lot: readonly PieceAnnoncee[], nature: NatureDesTableaux): boolean {
    const valeurs = RE_VALEURS.exec(brouillon);
    if (!valeurs) return false;
    const recu = brouillon.slice(valeurs.index);
    if (nature === 'creatures') {
        const noms = new Set(lignesAVerifier(recu).map(l => normaliser(l.nom)));
        return lot.every(p => noms.has(nomDeCreature(p.titre)) || new RegExp(`absent des sources\\s*:\\s*${echapper(normaliser(p.titre))}`).test(normaliser(recu)));
    }
    const titres = [...recu.matchAll(/^###\s+(.+)$/gm)].map(m => titreNormalise(m[1])).filter(Boolean);
    return lot.every(p => titres.some(t => t.includes(titreNormalise(p.titre)) || titreNormalise(p.titre).includes(t))
        || normaliser(recu).includes(`absent des sources : ${normaliser(p.titre)}`));
}

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** La première moitié finie : le brouillon sans la liste, qui n'appartient pas à la fiche. */
export function premiereMoitieAssemblee(brouillon: string): string {
    const section = sectionDeLaListe(brouillon);
    const sans = section ? `${brouillon.slice(0, section.debut).trimEnd()}\n\n${brouillon.slice(section.fin).trimStart()}` : brouillon;
    return sans.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Le contrôle des lignes : ce qui a été annoncé, et ce qui a été recopié. Une phrase par écart ;
 * rien quand tout concorde.
 */
export function ecartsDesLignes(pieces: readonly PieceAnnoncee[], premiereMoitie: string, nature: NatureDesTableaux): string[] {
    const lues = lignesAVerifier(premiereMoitie);
    if (nature === 'creatures') {
        const noms = new Set(lues.map(l => normaliser(l.nom)));
        const absentes = pieces.filter(p => !noms.has(nomDeCreature(p.titre))).map(p => p.titre);
        return absentes.length
            ? [`Créatures annoncées sans profil recopié (${absentes.length} sur ${pieces.length}) : ${absentes.join(', ')}.`]
            : [];
    }
    const ecarts: string[] = [];
    for (const p of pieces) {
        const cle = titreNormalise(p.titre);
        const recopiees = lues.filter(l => { const t = titreNormalise(l.tableau); return t.includes(cle) || (t.length > 0 && cle.includes(t)); }).length;
        if (p.attendu !== null && recopiees !== p.attendu) ecarts.push(`${p.titre} : ${p.attendu} ligne(s) annoncée(s), ${recopiees} recopiée(s).`);
        else if (p.attendu === null && recopiees === 0) ecarts.push(`${p.titre} : annoncé, aucune ligne recopiée.`);
    }
    return ecarts;
}

/** Ce qu'un lot apporte, une fois nettoyé, et ce qui en a été écarté. */
export interface LotNettoye {
    tableaux: string;
    /** Lignes dont le nom figurait déjà au brouillon : le carnet a répété un tableau. */
    doublons: number;
    /** Lignes coupées en plein milieu (sans « | » final, ou un titre collé dedans). */
    coupees: number;
}

const nomDeLaLigne = (ligne: string) => {
    const premiere = ligne.trim().replace(/^\|/, '').split('|')[0] ?? '';
    return normaliser(premiere.replace(/\*\*/g, ''));
};
const estUneRangee = (l: string) => l.trim().startsWith('|');
const estUneSeparation = (l: string) => /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(l);

/*
  La clé d'une ligne — 09/11/2026, Building Better Worlds (« je l'ai forgé mais je ne vois pas les
  nouvelles créatures ») : les rangées d'une table de dés commencent toutes par « 1 », « 2 », « 1–3 » ;
  reconnues à leur seule valeur, la table d'attaques du Bébé-pieuvre perdait cinq lignes sur six,
  « déjà vues » dans celle du Xénocobra. Une valeur de dé se reconnaît donc avec le titre de sa table ;
  un nom (une créature, une arme) reste reconnu seul, même sous un autre titre (Barbarians, 07/11).
*/
const VALEUR_DE_DE = /^\d+(?:\s*[–—-]\s*\d+)?\+?$/;
const cleDeLaLigne = (titre: string, ligne: string) => {
    const nom = nomDeLaLigne(ligne);
    return nom && VALEUR_DE_DE.test(nom) ? `${normaliser(titre)} ${nom}` : nom;
};

/** Les clés des rangées en gras d'un texte, chacune lue sous le dernier titre « ### » qui la précède. */
function clesDesRangees(texte: string): Set<string> {
    const cles = new Set<string>();
    let titre = '';
    for (const l of texte.split(/\r?\n/)) {
        if (/^###\s/.test(l.trim())) titre = l.trim().replace(/^###\s+/, '');
        else if (estUneRangee(l) && /\*\*/.test(l)) { const cle = cleDeLaLigne(titre, l); if (cle) cles.add(cle); }
    }
    return cles;
}

/**
 * Le lot nettoyé avant d'entrer au brouillon (07/11/2026, Barbarians of Lemuria). La forge du
 * bestiaire avait recopié trois fois le même tableau, dont une coupée en pleine ligne
 * (« …Exemples: chark### Tableau des profils ») : la liste annoncée nommait des catégories de
 * taille, et chaque lot a rendu le même tableau. On écarte les lignes coupées et celles dont le nom
 * est déjà au brouillon, puis les tableaux restés sans ligne ; on compte ce qu'on écarte, pour
 * le dire à la relecture.
 */
export function nettoyerLeLot(brouillon: string, tableaux: string): LotNettoye {
    /*
      La liste annoncée (« ## Tableaux du livre ») n'est pas un tableau reçu — 09/11/2026 : ses
      noms en gras (« **Xénocobra** | XENOCOBRA… ») faisaient de chaque profil du lot un « doublon »,
      et la fiche de Building Better Worlds sortait sans une seule créature (15 annoncées, 0 gardée).
    */
    const section = sectionDeLaListe(brouillon);
    const recu = section ? brouillon.slice(0, section.debut) + brouillon.slice(section.fin) : brouillon;
    const dejaVus = clesDesRangees(recu);
    // Un titre collé au milieu d'une ligne coupe celle-ci : la ligne s'arrête là, le titre repart.
    const lignes = tableaux.replace(/\r\n/g, '\n').split('\n')
        .flatMap(l => { const i = l.indexOf('###'); return i > 0 ? [l.slice(0, i), l.slice(i)] : [l]; });
    let doublons = 0, coupees = 0;
    let titre = '';
    const gardees: string[] = [];
    for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        if (/^###\s/.test(l.trim())) titre = l.trim().replace(/^###\s+/, '');
        const enTete = estUneRangee(l) && estUneSeparation(lignes[i + 1] ?? '');
        if (!estUneRangee(l) || estUneSeparation(l) || enTete) { gardees.push(l); continue; }
        if (!l.trim().endsWith('|')) { coupees++; continue; }
        const cle = cleDeLaLigne(titre, l);
        if (cle && /\*\*/.test(l) && dejaVus.has(cle)) { doublons++; continue; }
        if (cle) dejaVus.add(cle);
        gardees.push(l);
    }
    // Les tableaux sans ligne : leur titre, leur en-tête et leur séparation disparaissent ensemble.
    const sortie: string[] = [];
    for (let i = 0; i < gardees.length; i++) {
        const l = gardees[i];
        if (/^###\s/.test(l.trim())) {
            let j = i + 1;
            while (j < gardees.length && !gardees[j].trim()) j++;
            const avecEnTete = estUneRangee(gardees[j] ?? '') && estUneSeparation(gardees[j + 1] ?? '');
            const premiereRangee = avecEnTete ? gardees[j + 2] : undefined;
            if (avecEnTete && !(premiereRangee && estUneRangee(premiereRangee) && !estUneSeparation(premiereRangee))) { i = j + 1; continue; }
        }
        sortie.push(l);
    }
    return { tableaux: sortie.join('\n').replace(/\n{3,}/g, '\n\n').trim(), doublons, coupees };
}
