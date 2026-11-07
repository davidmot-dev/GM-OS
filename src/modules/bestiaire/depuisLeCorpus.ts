import type { BestiaireDuJeu, CreatureDuBestiaire, LigneDAttaque } from '../../types/drivers';
import { ajouterUneColonne, identifiantDeCreature } from './bestiaire';
import { proposerLeRole, proposerLesRoles, type RoleDuBestiaire } from './rolesDuBestiaire';
import { estUneLigneDeSeparation } from '../forge/rules/tableauMarkdown';

/**
 * Remplir le bestiaire depuis les fiches relues — registre § 210, étape C (05/11/2026), à la
 * demande de David (« ok commit et commence C ») ; choix du même jour : un tableau de profil relu,
 * lu sans modèle, Alien d'abord.
 *
 * **Lecture déterministe des tableaux Markdown, sans carnet**, comme le catalogue
 * (`equipement/depuisLeCorpus.ts`) : on ne fait pas relire le livre par un modèle qui inventerait
 * un chiffre. Deux sortes de tableaux sont lues :
 *
 * - le **tableau de profil**, reconnu à sa première colonne « Créature » : une ligne par créature,
 *   une colonne par caractéristique ; « Catégorie », « Particularités » (séparées par des
 *   points-virgules) et « Page » vont au socle ; « 8 (4 contre le feu) » donne 8, et la précision
 *   devient une particularité (« Protection 4 contre le feu ») ; « Table d'attaques » relie la
 *   créature à une table du jeu nommée entre accents graves, `` `Alien/attaques_neomorphes` `` ;
 * - la **table d'attaques**, reconnue à ses colonnes « D6 | Attaque » et rattachée à la créature
 *   que nomme son titre (« Tableau des attaques du Goreburster ») ; « **Nom** : effet ».
 *
 * **On remplit ce qui est vide, on ne remplace jamais ce qui est rempli** : une correction faite
 * dans l'éditeur survit à un second remplissage ; l'écart est dit.
 */

/** Une fiche relue, telle que l'écran la lit sur le disque (même forme que pour le catalogue). */
export interface FicheDuBestiaire {
    chemin: string;
    contenu: string;
    livre: string;
    pages?: { titre: string; page: number }[];
}

export interface JournalDuBestiaire {
    fiches: { chemin: string; tableaux: number; creatures: number }[];
    /** Avec le rôle proposé d'après le libellé, quand le jeu en connaît (Alien, étape E). */
    colonnesAjoutees: { libelle: string; nature: 'nombre' | 'texte'; role?: string }[];
    /** Colonnes déjà au bestiaire, sans rôle, qui en reçoivent un (vu le 05/11 : créées avant l'étape E). */
    rolesProposes: { libelle: string; role: string }[];
    creaturesAjoutees: { id: string; nom: string; categorie?: string }[];
    /** Créatures déjà au bestiaire dont une case vide a été remplie. */
    creaturesCompletees: { id: string; nom: string; champs: string[] }[];
    /** Ce que la fiche disait autrement, laissé tel quel. */
    conserves: string[];
    /** « Goreburster XX121AB : 5 attaques (p. 178) ». */
    attaquesRattachees: string[];
    /** Une table d'attaques dont la créature n'est pas au bestiaire. */
    attaquesSansCreature: string[];
    lignesNonLues: { chemin: string; ligne: string; raison: string }[];
    tableauxIgnores: { chemin: string; titre: string }[];
}

/** Sans accents, sans casse, sans rien d'autre que des lettres et des chiffres. */
const clef = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const VIDE = new Set(['', '–', '-', '—']);
const estUnNombre = (v: string) => /^[+-]?\d+(?:[.,]\d+)?$/.test(v);

/** Le texte d'une cellule, sans gras, sans le nom de l'autre édition en italique, `\$` rendu. */
function nettoyer(cellule: string): string {
    return cellule
        .replace(/\\\$/g, '$')
        .replace(/\s*\*\(([^)]*)\)\*/g, '')
        .replace(/\*\*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** `**Nom** *(Original)*` → le nom et l'original. */
function lireLeNom(cellule: string): { nom: string; nomOriginal?: string } {
    const original = /\*\(([^)]+)\)\*/.exec(cellule)?.[1]?.trim();
    const nom = nettoyer(cellule);
    return original ? { nom, nomOriginal: original } : { nom };
}

function cellules(ligne: string): string[] {
    const interieur = ligne.trim().replace(/^\|/, '').replace(/\|$/, '');
    return interieur.split(/(?<!\\)\|/).map(c => c.trim());
}

interface TableauLu { titre: string; entetes: string[]; lignes: string[] }

/** Les tableaux Markdown d'une fiche, avec le titre qui les précède. */
function tableauxDeLaFiche(contenu: string): TableauLu[] {
    const lignes = contenu.split(/\r?\n/);
    const tableaux: TableauLu[] = [];
    let titre = '';
    for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        const t = /^#{2,4}\s+(.*)$/.exec(l);
        if (t) { titre = t[1].trim(); continue; }
        if (!l.trim().startsWith('|') || !estUneLigneDeSeparation(lignes[i + 1])) continue;
        const tableau: TableauLu = { titre, entetes: cellules(l).map(nettoyer), lignes: [] };
        i += 2;
        while (i < lignes.length && lignes[i].trim().startsWith('|')) tableau.lignes.push(lignes[i++]);
        i--;
        tableaux.push(tableau);
    }
    return tableaux;
}

/*
  La première colonne **commence** par « Créature » : la forge de David du 06/11 titrait « Créature /
  Stade », que l'égalité stricte écartait sans rien dire d'autre qu'un tableau ignoré.
*/
// F5 (06/11/2026) : les noms qu'un livre donne aussi à ses profils — PNJ, monstres, sbires (COC).
/** Exportée pour F4, qui vérifie au livre les tableaux que ce lecteur lit (06/11/2026). */
export const estUnePremiereColonneDeProfil = (premiereColonne: string) =>
    /^(creatures?|adversaires?|especes?|pnj|monstres?|antagonistes?|ennemis?|sbires?|figurants?)/.test(clef(premiereColonne));
const estUnProfil = (t: TableauLu) => estUnePremiereColonneDeProfil(t.entetes[0] ?? '');
const estUneTableDAttaques = (t: TableauLu) => /^d\d+$/.test(clef(t.entetes[0] ?? '')) && /^attaques?$/.test(clef(t.entetes[1] ?? ''));

/** Une fiche porte-t-elle un tableau de profil ? L'aperçu compte les fiches lues par livre. */
export const estUneFicheDeBestiaire = (contenu: string) => tableauxDeLaFiche(contenu).some(estUnProfil);

/** Les colonnes que le socle porte : elles ne deviennent pas des colonnes du jeu. */
function champDuSocle(entete: string): 'categorie' | 'particularites' | 'page' | 'attaques' | null {
    const k = clef(entete);
    if (/^tables?(?:de|des|d)?attaques?$/.test(k)) return 'attaques';
    if (k === 'categorie' || k === 'type') return 'categorie';
    if (/^(particularites?|special|notes?|remarques?)$/.test(k)) return 'particularites';
    if (k === 'page' || k === 'p') return 'page';
    return null;
}

/** « Tableau des attaques du Goreburster (p. 178) » → la créature nommée et la page. */
function cibleDuTitre(titre: string): { nom: string; page?: number } {
    const page = /\(p\.\s*(\d+)\)\s*$/.exec(titre)?.[1];
    const nom = titre.replace(/\s*\(p\.\s*\d+\)\s*$/, '')
        .replace(/^tableau\s+des\s+attaques\s+(?:de\s+la\s+|de\s+l['’]\s*|du\s+|des\s+|de\s+|d['’]\s*)?/i, '')
        .trim();
    return { nom, ...(page ? { page: Number(page) } : {}) };
}

/** « Profils des xénomorphes aberrants » → « Xénomorphes aberrants » ; vide si le titre ne dit rien. */
function categorieDuTitre(titre: string): string | undefined {
    const reste = titre.replace(/\s*\(p\.\s*\d+\)\s*$/, '').replace(/^(?:tableau\s+des\s+)?profils?\s+(?:des|du|de la|de l['’]|de)\s*/i, '').trim();
    if (!reste || reste === titre.trim()) return undefined;
    return reste.charAt(0).toUpperCase() + reste.slice(1);
}

/** « 8 (4 contre le feu) » → 8 et « 4 contre le feu » ; « 6 » → 6 ; un texte reste un texte. */
function lireLaValeur(brute: string): { valeur: string | number; precision?: string } {
    const v = nettoyer(brute);
    const m = /^([+-]?\d+(?:[.,]\d+)?)\s*\((.+)\)$/.exec(v);
    if (m) return { valeur: Number(m[1].replace(',', '.')), precision: m[2].trim() };
    return { valeur: /^\d+$/.test(v) ? Number(v) : v };
}

/**
 * « Attaques de Néomorphes (p. 296) — `Alien/attaques_neomorphes` » → la table du jeu. Ajouté le
 * 06/11/2026 pour le livre de base d'Alien, dont les onze tables d'attaques sont déjà des tables
 * du jeu (`databases/tables/Alien/`) : la fiche les relie au lieu de les recopier.
 */
function lireLaTable(cellule: string): { univers: string; table: string } | null {
    const m = /`([^`/]+?)\s*\/\s*([A-Za-z0-9_-]+)`/.exec(cellule);
    return m ? { univers: m[1].trim(), table: m[2] } : null;
}

/** « **Impact** : renverse… » → le nom et l'effet. */
function lireLAttaque(de: string, cellule: string): LigneDAttaque {
    const gras = /^\s*\*\*(.+?)\*\*\s*[:.]?\s*(.*)$/.exec(cellule);
    if (gras) return { de: nettoyer(de), nom: nettoyer(gras[1]).replace(/[.:]$/, ''), effet: nettoyer(gras[2]) };
    const [nom, ...reste] = nettoyer(cellule).split(/\s*:\s*/);
    return { de: nettoyer(de), nom, effet: reste.join(' : ') };
}

/** La page de la section dont le titre rejoint la catégorie. */
function pageDeLaCategorie(categorie: string | undefined, pages: FicheDuBestiaire['pages']): number | undefined {
    if (!categorie) return undefined;
    const k = clef(categorie);
    return pages?.find(p => clef(p.titre) === k)?.page
        ?? pages?.find(p => k.includes(clef(p.titre)) || clef(p.titre).includes(k))?.page;
}

/**
 * Lit les fiches et verse leurs créatures dans une copie du bestiaire. Rend le bestiaire proposé et
 * le journal : l'écran montre le journal, le meneur verse ou renonce.
 */
export function remplirLeBestiaire(
    bestiaire: BestiaireDuJeu | undefined,
    fiches: readonly FicheDuBestiaire[],
    roles: readonly RoleDuBestiaire[] = [],
): { bestiaire: BestiaireDuJeu; journal: JournalDuBestiaire } {
    let b: BestiaireDuJeu = bestiaire
        ? { colonnes: [...bestiaire.colonnes], creatures: bestiaire.creatures.map(c => ({ ...c })) }
        : { colonnes: [], creatures: [] };
    const journal: JournalDuBestiaire = {
        fiches: [], colonnesAjoutees: [], rolesProposes: [], creaturesAjoutees: [], creaturesCompletees: [], conserves: [],
        attaquesRattachees: [], attaquesSansCreature: [], lignesNonLues: [], tableauxIgnores: [],
    };
    // Les tables d'attaques se rattachent une fois toutes les créatures connues : elles peuvent précéder leur profil.
    const tables: { chemin: string; titre: string; lignes: LigneDAttaque[] }[] = [];

    for (const fiche of fiches) {
        const bilan = { chemin: fiche.chemin, tableaux: 0, creatures: 0 };
        for (const tableau of tableauxDeLaFiche(fiche.contenu)) {
            const lues = tableau.lignes.map(cellules);
            if (estUneTableDAttaques(tableau)) {
                bilan.tableaux++;
                const lignes = lues.flatMap((c, r) => {
                    if (c.length < 2 || !nettoyer(c[0])) {
                        journal.lignesNonLues.push({ chemin: fiche.chemin, ligne: tableau.lignes[r], raison: 'attaque sans résultat de dé' });
                        return [];
                    }
                    return [lireLAttaque(c[0], c.slice(1).join(' | '))];
                });
                tables.push({ chemin: fiche.chemin, titre: tableau.titre, lignes });
                continue;
            }
            if (!estUnProfil(tableau)) {
                journal.tableauxIgnores.push({ chemin: fiche.chemin, titre: tableau.titre || tableau.entetes.join(' | ') });
                continue;
            }
            bilan.tableaux++;
            const categorieDuTableau = categorieDuTitre(tableau.titre);

            // Les colonnes du jeu : rapprochées par leur libellé, ajoutées sinon, nombre quand la
            // moitié au moins des valeurs en sont (la précision entre parenthèses ôtée).
            const idDeLaColonne = new Map<number, string>();
            tableau.entetes.forEach((entete, n) => {
                if (n === 0 || champDuSocle(entete)) return;
                const existante = b.colonnes.find(c => clef(c.libelle) === clef(entete));
                if (existante) { idDeLaColonne.set(n, existante.id); return; }
                const valeurs = lues.map(c => nettoyer(c[n] ?? '')).filter(v => !VIDE.has(v)).map(v => v.replace(/\s*\(.*\)$/, ''));
                const nature = valeurs.length && valeurs.filter(estUnNombre).length * 2 >= valeurs.length ? 'nombre' : 'texte';
                b = ajouterUneColonne(b, entete, nature);
                const role = proposerLeRole(entete, nature, roles);
                if (role) b.colonnes[b.colonnes.length - 1] = { ...b.colonnes.at(-1)!, role };
                idDeLaColonne.set(n, b.colonnes.at(-1)!.id);
                journal.colonnesAjoutees.push({ libelle: entete, nature, ...(role ? { role } : {}) });
            });

            tableau.lignes.forEach((ligne, r) => {
                const c = lues[r];
                if (c.length !== tableau.entetes.length) {
                    journal.lignesNonLues.push({ chemin: fiche.chemin, ligne, raison: `${c.length} cases pour ${tableau.entetes.length} colonnes` });
                    return;
                }
                const { nom, nomOriginal } = lireLeNom(c[0]);
                if (!nom) {
                    journal.lignesNonLues.push({ chemin: fiche.chemin, ligne, raison: 'pas de nom' });
                    return;
                }
                const propose: Omit<CreatureDuBestiaire, 'id'> = { nom, valeurs: {} };
                if (nomOriginal) propose.nomOriginal = nomOriginal;
                const particularites: string[] = [];
                let categorie = categorieDuTableau;
                let page: number | undefined;
                tableau.entetes.forEach((entete, n) => {
                    if (n === 0) return;
                    const brute = nettoyer(c[n]);
                    if (VIDE.has(brute)) return;
                    const socle = champDuSocle(entete);
                    if (socle === 'categorie') categorie = brute;
                    else if (socle === 'particularites') particularites.push(...brute.split(/\s*;\s*/).filter(Boolean));
                    else if (socle === 'page') page = /^\d+$/.test(brute) ? Number(brute) : undefined;
                    else if (socle === 'attaques') {
                        const table = lireLaTable(c[n]);
                        if (table) propose.attaques = { table };
                        else particularites.push(`${entete} : ${brute}`);
                    }
                    else {
                        const { valeur, precision } = lireLaValeur(c[n]);
                        propose.valeurs[idDeLaColonne.get(n)!] = valeur;
                        if (precision) particularites.unshift(`${entete} ${precision}`);
                    }
                });
                if (categorie) propose.categorie = categorie;
                if (particularites.length) propose.particularites = particularites;
                page ??= pageDeLaCategorie(categorie, fiche.pages);
                propose.source = { livre: fiche.livre, ...(page ? { page } : {}), fiche: fiche.chemin };
                verser(propose);
                bilan.creatures++;
            });
        }
        journal.fiches.push(bilan);
    }

    for (const t of tables) {
        const { nom, page } = cibleDuTitre(t.titre);
        const k = clef(nom);
        const cible = k ? b.creatures.find(c => clef(c.nom) === k) ?? b.creatures.find(c => clef(c.nom).includes(k) || k.includes(clef(c.nom))) : undefined;
        if (!cible) { journal.attaquesSansCreature.push(`${t.titre || 'Table d’attaques'} (${t.chemin.split('/').pop()})`); continue; }
        if (cible.attaques?.lignes?.length) {
            // Les mêmes attaques ne sont pas un écart (vu par David le 06/11 : « 6, la fiche 6 »).
            if (JSON.stringify(cible.attaques.lignes) !== JSON.stringify(t.lignes)) {
                journal.conserves.push(`${cible.nom} · attaques : le bestiaire en a ${cible.attaques.lignes.length}, la fiche ${t.lignes.length} qui diffèrent`);
            }
            continue;
        }
        cible.attaques = { ...cible.attaques, lignes: t.lignes };
        journal.attaquesRattachees.push(`${cible.nom} : ${t.lignes.length} attaque${t.lignes.length > 1 ? 's' : ''}${page ? ` (p. ${page})` : ''}`);
    }
    // Les colonnes déjà là, sans rôle, en reçoivent un ; celles ajoutées ici l'ont déjà.
    const roles2 = proposerLesRoles(b, roles);
    b = roles2.bestiaire;
    journal.rolesProposes = roles2.proposes;
    return { bestiaire: b, journal };

    /** Ajoute la créature, ou remplit les cases vides de celle qui porte déjà ce nom. */
    function verser(propose: Omit<CreatureDuBestiaire, 'id'>): string {
        const kNom = clef(propose.nom);
        const existant = b.creatures.find(c => clef(c.nom) === kNom || (c.nomOriginal && propose.nomOriginal && clef(c.nomOriginal) === clef(propose.nomOriginal)));
        if (!existant) {
            const id = identifiantDeCreature(propose.nom, b.creatures.map(c => c.id));
            b.creatures.push({ id, ...propose });
            journal.creaturesAjoutees.push({ id, nom: propose.nom, categorie: propose.categorie });
            return id;
        }
        const remplis: string[] = [];
        const enTexte = (v: unknown) => (Array.isArray(v) ? v.join(' ; ') : typeof v === 'object' && v ? JSON.stringify(v) : String(v));
        const ecart = (champ: string, avant: unknown, apres: unknown) => {
            if (JSON.stringify(avant) !== JSON.stringify(apres)) journal.conserves.push(`${existant.nom} · ${champ} : bestiaire « ${enTexte(avant)} », fiche « ${enTexte(apres)} »`);
        };
        for (const [cle, valeur] of Object.entries(propose.valeurs)) {
            const avant = existant.valeurs?.[cle];
            if (avant === undefined || String(avant).trim() === '') {
                existant.valeurs = { ...existant.valeurs, [cle]: valeur };
                remplis.push(cle);
            } else ecart(cle, avant, valeur);
        }
        for (const champ of ['nomOriginal', 'categorie', 'particularites', 'source'] as const) {
            const apres = propose[champ];
            if (apres === undefined) continue;
            const avant = existant[champ];
            const vide = avant === undefined || (Array.isArray(avant) ? avant.length === 0 : typeof avant === 'string' && !avant.trim());
            if (vide) {
                Object.assign(existant, { [champ]: apres });
                remplis.push(champ);
            } else if (champ !== 'source') ecart(champ, avant, apres);
        }
        // La table du jeu : posée si la créature n'en a pas, jamais remplacée.
        const table = propose.attaques?.table;
        if (table) {
            const avant = existant.attaques?.table;
            if (!avant?.table?.trim()) {
                existant.attaques = { ...existant.attaques, table };
                remplis.push('table d’attaques');
            } else ecart('table d’attaques', `${avant.univers}/${avant.table}`, `${table.univers}/${table.table}`);
        }
        if (remplis.length) {
            const deja = journal.creaturesCompletees.find(c => c.id === existant.id);
            if (deja) deja.champs.push(...remplis);
            else journal.creaturesCompletees.push({ id: existant.id, nom: existant.nom, champs: remplis });
        }
        return existant.id;
    }
}
