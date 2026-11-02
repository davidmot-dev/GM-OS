import type { CatalogueDEquipement, EffetDObjet, FamilleDObjet, ObjetDuCatalogue } from '../../types/drivers';
import { slug } from '../../../electron/corpusSysteme';
import { ajouterUneColonne, identifiantDObjet } from './catalogue';

/**
 * Remplir le catalogue depuis les fiches relues — registre § 203, étape C
 * (02/11/2026).
 *
 * **Lecture déterministe des tableaux Markdown, sans carnet** : les fiches sont
 * relues contre le livre (§ 185), on ne fait pas relire le livre par un modèle
 * qui inventerait un chiffre. Un tableau est reconnu à sa première colonne
 * (« Arme », « Armure », « Véhicule », « Tenue ») ; les autres (tables de
 * D66, de terrain, de spécialités) sont nommés dans le journal, jamais lus de
 * travers.
 *
 * **La règle d'`enrichirLePilote` : on remplit ce qui est vide, on ne remplace
 * jamais ce qui est rempli.** Une correction faite à la main dans l'éditeur
 * survit donc à un second remplissage ; l'écart est dit dans `conserves`.
 */

/** Une fiche relue, telle que l'écran la lit sur le disque. */
export interface FicheACataloguer {
    /** Le chemin sous `docs/`, gardé dans `source.fiche`. */
    chemin: string;
    contenu: string;
    /** Le livre que la fiche relit — « Colonial Marines Operations Manual ». */
    livre: string;
    /** Les sections de la fiche résolues en pages par l'index du livre (`ai.resolveSections`). */
    pages?: { titre: string; page: number }[];
}

/** Ce que le remplissage a fait — l'aperçu que le meneur lit avant de verser. */
export interface JournalDuRemplissage {
    /** Par fiche : combien de tableaux d'équipement lus, combien d'objets en sont sortis. */
    fiches: { chemin: string; tableaux: number; objets: number }[];
    colonnesAjoutees: { famille: FamilleDObjet; libelle: string; nature: 'nombre' | 'texte' }[];
    objetsAjoutes: { id: string; nom: string; famille: FamilleDObjet; categorie?: string }[];
    /** Objets déjà au catalogue dont une case vide a été remplie. */
    objetsCompletes: { id: string; nom: string; champs: string[] }[];
    /** Ce que la fiche disait autrement, laissé tel quel — « VP-70MA6 · Bonus : catalogue « +3 », fiche « +2 » ». */
    conserves: string[];
    /** « compris dans … » rattaché à son porteur (`contient`). */
    rattachements: string[];
    /** « compris dans … » dont le porteur n'est pas au catalogue — l'armure M3 du livre de base. */
    renvoisNonResolus: string[];
    /** Lignes d'un tableau reconnu qui n'ont pas pu être lues : montrées, pas jetées. */
    lignesNonLues: { chemin: string; ligne: string; raison: string }[];
    /** Tableaux qui ne décrivent pas d'équipement (D66, terrains, spécialités). */
    tableauxIgnores: { chemin: string; titre: string }[];
}

/** Sans accents, sans casse, sans rien d'autre que des lettres et des chiffres — la clé de `bookIndex.ts`. */
const clef = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const VIDE = new Set(['', '–', '-', '—']);
const estUnNombre = (v: string) => /^[+-]?\d+(?:[.,]\d+)?$/.test(v);

/** Reconnaître la famille à la première colonne du tableau. */
function familleDuTableau(premiereColonne: string): FamilleDObjet | null {
    const k = clef(premiereColonne);
    if (/^armes?$/.test(k)) return 'arme';
    if (/^(armures?|protections?|boucliers?)$/.test(k)) return 'protection';
    if (/^(vehicules?|vaisseaux?|engins?)$/.test(k)) return 'vehicule';
    // Le livre de base d'Alien titre ses tableaux de matériel « Appareil », « Aliment », « Substance », « Système ».
    if (/^(tenues?|objets?|materiels?|equipements?|articles?|appareils?|aliments?|substances?|systemes?)$/.test(k)) return 'materiel';
    return null;
}

/** Les colonnes que le socle porte déjà : elles ne deviennent pas des colonnes du jeu. */
function champDuSocle(entete: string): 'poids' | 'cout' | 'special' | null {
    const k = clef(entete);
    if (k === 'poids') return 'poids';
    if (k === 'cout' || k === 'prix') return 'cout';
    if (/^(special|effets?|notes?|description|usage|stockage)$/.test(k)) return 'special';
    return null;
}

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

/** « Tableau des Pistolets » → « Pistolets » ; « Tableau comparatif des Vaisseaux spatiaux » → « Vaisseaux spatiaux ». */
function categorieDuTitre(titre: string): string {
    const reste = titre.replace(/\s*\(p\.\s*\d+\)\s*$/, '').replace(/^tableau\s+(?:comparatif\s+)?(?:des|du|de la|de l['’]|de)\s*/i, '').trim();
    return reste ? reste.charAt(0).toUpperCase() + reste.slice(1) : titre.trim();
}

/** « Tableau des Armes lourdes (p. 124) » : la page du tableau, quand la fiche la donne — elle prime sur celle de la section. */
const pageDuTitre = (titre: string) => {
    const m = /\(p\.\s*(\d+)\)\s*$/.exec(titre);
    return m ? Number(m[1]) : undefined;
};

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
        if (!l.trim().startsWith('|') || !/^\s*\|\s*:?-{2,}/.test(lignes[i + 1] ?? '')) continue;
        const tableau: TableauLu = { titre, entetes: cellules(l).map(nettoyer), lignes: [] };
        i += 2;
        while (i < lignes.length && lignes[i].trim().startsWith('|')) tableau.lignes.push(lignes[i++]);
        i--;
        tableaux.push(tableau);
    }
    return tableaux;
}

/** Une fiche porte-t-elle au moins un tableau d'équipement ? L'aperçu compte les fiches lues par livre. */
export const estUneFicheDEquipement = (contenu: string) => tableauxDeLaFiche(contenu).some(t => familleDuTableau(t.entetes[0] ?? '') !== null);

/** Les morceaux courts d'un « Spécial » d'arme : « Perce-armure », « Mode automatique ». Le texte entier va dans la description. */
function proprietesCourtes(special: string): string[] {
    return special.split(/\.\s+|,\s+/).map(s => s.replace(/\.$/, '').trim()).filter(s => s && s.split(/\s+/).length <= 3);
}

/** Sans accents ni casse, mais avec ses espaces : on y cherche des libellés en mots entiers. */
const plier = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[’']/g, ' ');
const echapper = (texte: string) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Les noms sous lesquels un champ se cherche dans le texte du livre. Le gabarit
 * d'Alien de David préfixe ses compétences de leur attribut, « Es_Observation »,
 * « Ag_Combat à distance » : le livre, lui, écrit « Observation ». Vu par David
 * le 02/11 (*« je ne vois pas les jumelles pour le bonus »*) : les Jumelles
 * étaient entrées au catalogue sans effet. On cherche donc le libellé, le
 * libellé sans ce préfixe, et l'identifiant (`soins_medicaux` → « soins medicaux »).
 */
function nomsDuChamp(c: { id: string; label: string }): string[] {
    const libelle = plier(c.label).trim();
    return [...new Set([libelle, libelle.replace(/^[a-z]{1,4}_/, ''), plier(c.id).replace(/[_-]+/g, ' ').trim()])].filter(n => n.length >= 3);
}

/**
 * Les effets d'un « Spécial » : un nombre signé et ce qu'il vise.
 *
 * **Avec les champs de la fiche**, on cherche leurs libellés en mots entiers
 * autour de chaque nombre signé — c'est la seule façon de rejoindre les
 * identifiants du gabarit (`machines_lourdes`, `soins_medicaux`). Le livre de
 * base d'Alien écrit « Machines lourdes +2 », « Modificateur de +2 en
 * Observation », « Réserve d'Eau et de Nourriture +1 » ; le supplément « Bonus
 * de +2 aux tests de Mobilité sous l'eau ». Un nombre sans signe (« Réserve
 * d'Air 4 », « Soins médicaux 6 ») n'est pas un effet : c'est une valeur de
 * l'objet, qui demeure dans la description.
 *
 * **Sans les champs**, seule la forme « Bonus de … aux tests de X » est lue, et
 * la cible est tirée du mot.
 */
function effetsDuTexte(special: string, champs: readonly { id: string; label: string }[]): EffetDObjet[] {
    const effets: EffetDObjet[] = [];
    for (const morceau of special.split(/,\s+|\.\s+/).map(s => s.replace(/\.$/, '').trim()).filter(Boolean)) {
        // Un signe en début de mot : le « -104 » de « AK-104 » n'en est pas un.
        const signes = [...morceau.matchAll(/(?<=^|[\s(])([+\-−])\s?(\d+)/g)];
        if (!signes.length) continue;
        if (!champs.length) {
            const m = /(Bonus|Malus) de [+\-−]?\s?(\d+) aux tests? d(?:e |’|')\s?([A-Za-zÀ-ÿ]+)\s*(.*)$/.exec(morceau);
            if (m) effets.push({ cible: slug(m[3]), valeur: (m[1] === 'Malus' ? -1 : 1) * Number(m[2]), ...(m[4] ? { condition: m[4] } : {}), texte: morceau });
            continue;
        }
        const plie = plier(morceau);
        // Les noms présents, à leur position ; le plus long d'abord, pour que « Combat rapproché » passe avant « Combat ».
        const trouves: { id: string; debut: number; fin: number }[] = [];
        const noms = champs.flatMap(c => nomsDuChamp(c).map(nom => ({ id: c.id, nom })));
        for (const { id, nom } of noms.sort((a, b) => b.nom.length - a.nom.length)) {
            const motif = new RegExp(`(^|[^a-z0-9])(${echapper(nom)})(?=[^a-z0-9]|$)`, 'g');
            for (const m of plie.matchAll(motif)) {
                const debut = m.index! + m[1].length;
                const fin = debut + m[2].length;
                if (!trouves.some(t => debut < t.fin && fin > t.debut)) trouves.push({ id, debut, fin });
            }
        }
        signes.forEach((s, n) => {
            const ici = s.index!;
            const avant = n ? signes[n - 1].index! + signes[n - 1][0].length : 0;
            const apres = signes[n + 1]?.index ?? morceau.length;
            const valeur = (s[1] === '+' ? 1 : -1) * Number(s[2]);
            /*
              Ce qui touche le nombre d'abord (« Machines lourdes +2 »), sinon le
              premier nom qui le suit (« +2 en Observation »). On ne prend la
              suite que par « et » ou une virgule (« Commandement et
              Observation », « d'Eau et de Nourriture ») : dans « Mobilité sous
              l'eau », « eau » est la condition, pas la Réserve d'Eau — vu à
              l'audit des effets du 02/11.
            */
            const lie = (de: number, a: number) => /^[\s,]*(?:et\s+)?(?:(?:de|d|du|la|le|l|les)\s+)?$/.test(plie.slice(de, a));
            const devant = trouves.filter(t => t.debut >= avant && t.fin <= ici).sort((a, b) => a.debut - b.debut);
            const derriere = trouves.filter(t => t.debut >= ici && t.fin <= apres).sort((a, b) => a.debut - b.debut);
            let vises: typeof trouves = [];
            if (devant.length && /^[\s(]*$/.test(plie.slice(devant.at(-1)!.fin, ici))) {
                vises = [devant.at(-1)!];
                for (let i = devant.length - 2; i >= 0 && lie(devant[i].fin, vises[0].debut); i--) vises.unshift(devant[i]);
            } else if (derriere.length) {
                vises = [derriere[0]];
                for (let i = 1; i < derriere.length && lie(vises.at(-1)!.fin, derriere[i].debut); i++) vises.push(derriere[i]);
            }
            const reste = vises.length && vises[0].debut < ici
                ? morceau.slice(ici + s[0].length, apres).trim()
                : morceau.slice(vises.length ? vises.at(-1)!.fin : ici + s[0].length, apres).trim();
            const condition = /^[a-zà-ÿ]/.test(reste) && !/^et\b/.test(reste) ? reste : '';
            for (const t of vises) {
                if (effets.some(e => e.cible === t.id && e.valeur === valeur && e.texte === morceau)) continue;
                effets.push({ cible: t.id, valeur, ...(condition ? { condition } : {}), texte: morceau });
            }
        });
    }
    return effets;
}

/** « compris dans la combinaison de compression offensive CCC5 » → `CCC5`, le code qui désigne le porteur. */
function porteurCite(special: string): { phrase: string; code: string } | null {
    const m = /compris dans (?:la |le |l['’]|les )?([^,.;]+)/i.exec(special);
    if (!m) return null;
    const code = m[1].trim().split(/\s+/).reverse().find(mot => /\d/.test(mot) && /[A-Z]/.test(mot));
    return code ? { phrase: m[0].trim(), code } : null;
}

/** La page de la section dont le titre rejoint la catégorie du tableau. */
function pageDeLaCategorie(categorie: string, pages: FicheACataloguer['pages']): number | undefined {
    const k = clef(categorie);
    return pages?.find(p => clef(p.titre) === k)?.page
        ?? pages?.find(p => k.includes(clef(p.titre)) || clef(p.titre).includes(k))?.page;
}

/**
 * Lit les fiches et verse leurs objets dans une copie du catalogue. Rend le
 * catalogue proposé et le journal : l'écran montre le journal, le meneur verse
 * ou renonce.
 */
export function remplirDepuisLesFiches(
    catalogue: CatalogueDEquipement | undefined,
    fiches: readonly FicheACataloguer[],
    champsDeLaFiche: readonly { id: string; label: string }[] = [],
): { catalogue: CatalogueDEquipement; journal: JournalDuRemplissage } {
    let cat: CatalogueDEquipement = catalogue
        ? { colonnes: { ...catalogue.colonnes }, objets: catalogue.objets.map(o => ({ ...o })) }
        : { colonnes: {}, objets: [] };
    const journal: JournalDuRemplissage = {
        fiches: [], colonnesAjoutees: [], objetsAjoutes: [], objetsCompletes: [], conserves: [],
        rattachements: [], renvoisNonResolus: [], lignesNonLues: [], tableauxIgnores: [],
    };
    const renvois: { id: string; nom: string; porteur: { phrase: string; code: string } }[] = [];

    for (const fiche of fiches) {
        const bilan = { chemin: fiche.chemin, tableaux: 0, objets: 0 };
        for (const tableau of tableauxDeLaFiche(fiche.contenu)) {
            const famille = familleDuTableau(tableau.entetes[0] ?? '');
            if (!famille) {
                journal.tableauxIgnores.push({ chemin: fiche.chemin, titre: tableau.titre || tableau.entetes.join(' | ') });
                continue;
            }
            bilan.tableaux++;
            const categorie = categorieDuTitre(tableau.titre || tableau.entetes[0]);
            const page = pageDuTitre(tableau.titre) ?? pageDeLaCategorie(categorie, fiche.pages);
            const lues = tableau.lignes.map(cellules);

            // Les colonnes du jeu : rapprochées par leur libellé, ajoutées sinon,
            // nombre quand la moitié au moins des valeurs du tableau en sont.
            const idDeLaColonne = new Map<number, string>();
            tableau.entetes.forEach((entete, n) => {
                if (n === 0 || champDuSocle(entete)) return;
                const existante = (cat.colonnes[famille] ?? []).find(c => clef(c.libelle) === clef(entete));
                if (existante) { idDeLaColonne.set(n, existante.id); return; }
                const valeurs = lues.map(c => nettoyer(c[n] ?? '')).filter(v => !VIDE.has(v));
                const nature = valeurs.length && valeurs.filter(estUnNombre).length * 2 >= valeurs.length ? 'nombre' : 'texte';
                cat = ajouterUneColonne(cat, famille, entete, nature);
                idDeLaColonne.set(n, cat.colonnes[famille]!.at(-1)!.id);
                journal.colonnesAjoutees.push({ famille, libelle: entete, nature });
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
                const propose: Omit<ObjetDuCatalogue, 'id'> = { famille, nom, valeurs: {}, categorie, source: { livre: fiche.livre, ...(page ? { page } : {}), fiche: fiche.chemin } };
                if (nomOriginal) propose.nomOriginal = nomOriginal;
                let special = '';
                tableau.entetes.forEach((entete, n) => {
                    if (n === 0) return;
                    const v = nettoyer(c[n]);
                    if (VIDE.has(v)) return;
                    const socle = champDuSocle(entete);
                    if (socle === 'poids') propose.poids = v;
                    else if (socle === 'cout') propose.cout = v;
                    else if (socle === 'special') special = v;
                    else propose.valeurs[idDeLaColonne.get(n)!] = /^\d+$/.test(v) ? Number(v) : v;
                });
                if (special) {
                    propose.description = special;
                    const proprietes = famille === 'arme' ? proprietesCourtes(special) : [];
                    if (proprietes.length) propose.proprietes = proprietes;
                    const effets = effetsDuTexte(special, champsDeLaFiche);
                    if (effets.length) propose.effets = effets;
                }
                const id = verser(propose);
                bilan.objets++;
                const porteur = special ? porteurCite(special) : null;
                if (porteur) renvois.push({ id, nom, porteur });
            });
        }
        journal.fiches.push(bilan);
    }

    // « compris dans la CCC5 » : rattaché une fois tous les objets connus,
    // puisque le porteur peut venir d'une fiche lue après.
    for (const { id, nom, porteur } of renvois) {
        // Un mot entier du nom : « M3 » ne désigne pas les bottes M3B.
        const k = clef(porteur.code);
        const hote = cat.objets.find(o => o.id !== id && o.nom.split(/\s+/).some(mot => clef(mot) === k));
        if (!hote) { journal.renvoisNonResolus.push(`${nom} : « ${porteur.phrase} »`); continue; }
        if (hote.contient?.includes(id)) continue;
        hote.contient = [...(hote.contient ?? []), id];
        journal.rattachements.push(`${hote.nom} emporte ${nom}`);
    }
    return { catalogue: cat, journal };

    /** Ajoute l'objet, ou remplit les cases vides de celui qui porte déjà ce nom. Rend son identifiant. */
    function verser(propose: Omit<ObjetDuCatalogue, 'id'>): string {
        const kNom = clef(propose.nom);
        const existant = cat.objets.find(o => o.famille === propose.famille && (clef(o.nom) === kNom || (o.nomOriginal && propose.nomOriginal && clef(o.nomOriginal) === clef(propose.nomOriginal))));
        if (!existant) {
            const id = identifiantDObjet(propose.nom, cat.objets.map(o => o.id));
            cat.objets.push({ id, ...propose });
            journal.objetsAjoutes.push({ id, nom: propose.nom, famille: propose.famille, categorie: propose.categorie });
            return id;
        }
        const remplis: string[] = [];
        const enTexte = (v: unknown) => (Array.isArray(v) ? v.map(a => (typeof a === 'string' ? a : (a as EffetDObjet).texte)).join(', ') : String(v));
        const ecart = (champ: string, avant: unknown, apres: unknown) => {
            if (JSON.stringify(avant) !== JSON.stringify(apres)) journal.conserves.push(`${existant.nom} · ${champ} : catalogue « ${enTexte(avant)} », fiche « ${enTexte(apres)} »`);
        };
        for (const [cle, valeur] of Object.entries(propose.valeurs)) {
            const avant = existant.valeurs?.[cle];
            if (avant === undefined || String(avant).trim() === '') {
                existant.valeurs = { ...existant.valeurs, [cle]: valeur };
                remplis.push(cle);
            } else ecart(cle, avant, valeur);
        }
        for (const champ of ['nomOriginal', 'categorie', 'poids', 'cout', 'description', 'proprietes', 'effets', 'source'] as const) {
            const apres = propose[champ];
            if (apres === undefined) continue;
            const avant = existant[champ];
            const vide = avant === undefined || (Array.isArray(avant) ? avant.length === 0 : typeof avant === 'string' && !avant.trim());
            if (vide) {
                Object.assign(existant, { [champ]: apres });
                remplis.push(champ);
            } else if (champ !== 'source') ecart(champ, avant, apres);
        }
        if (remplis.length) {
            const deja = journal.objetsCompletes.find(o => o.id === existant.id);
            if (deja) deja.champs.push(...remplis);
            else journal.objetsCompletes.push({ id: existant.id, nom: existant.nom, champs: remplis });
        }
        return existant.id;
    }
}
