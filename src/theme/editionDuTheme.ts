/**
 * **Modifier le thème d'un jeu depuis l'application — demandé par David le
 * 2026-09-03 :** *« si je veux modifier les configurations CSS d'un jeu, est-ce
 * que tu peux me faire un module me permettant de changer les paramètres,
 * couleurs, polices, tailles des polices… ? »*
 *
 * Analyse pure, sans aucune entrée/sortie : ce module ne connaît ni le pont
 * Electron ni `window`, comme `jetonsDeTheme.ts` dont il est le pendant en
 * écriture. La lecture relève, celle-ci **repose**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ON RÉÉCRIT LES DÉCLARATIONS, JAMAIS LE FICHIER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un `theme.css` de jeu, ce sont vingt-deux jetons **et trois cents lignes de
 * règles `.rpg-*`** que les fiches de personnage consomment — dégradés, cadres,
 * papier, filigranes, écrits à la main et commentés. Régénérer le fichier
 * depuis les jetons les effacerait tous.
 *
 * On remplace donc **la valeur de chaque déclaration, à sa place**, dans le
 * dernier bloc racine — celui que la lecture retient déjà, *le dernier gagne*.
 * Tout le reste du fichier ressort octet pour octet : les commentaires, l'ordre,
 * les lignes vides, les règles de composants.
 *
 * Le contrôle qui garde cette promesse est une **idempotence** : réécrire un
 * thème avec ses propres valeurs doit rendre exactement le même fichier. Il
 * tourne sur les cinq thèmes réels du dépôt.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI DANS LE FICHIER DU JEU, ET PAS À CÔTÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *Décision de David.* Les fiches de personnage chargent **ce fichier-là**,
 * elles, entièrement. Garder les réglages ailleurs — dans la campagne, dans un
 * magasin — donnerait une interface repeinte et des fiches restées comme avant :
 * **deux vérités pour une même chose**, le motif que ce dépôt paie depuis des
 * semaines. Un seul fichier, deux lecteurs.
 */

import { cheminDuTheme } from './jetonsDeTheme';

/**
 * **Le thème tel qu'il était avant la première retouche.**
 *
 * *Demandé par David le 2026-09-03 : « est-ce que tu peux prévoir un bouton de
 * reset pour revenir à l'original ? »*
 *
 * Une copie posée à côté, prise **au premier enregistrement et jamais
 * réécrite** : c'est ce qui la rend utile dix séances plus tard, quand
 * « Annuler » ne sait plus revenir qu'à la sauvegarde d'il y a trente secondes.
 *
 * Elle est dérivée du chemin du thème et non écrite à la main : *deux endroits
 * qui nomment le même dossier finissent par ne plus le nommer pareil.*
 */
export function cheminDeLOriginal(racine: string): string {
    return cheminDuTheme(racine).replace(/theme\.css$/, 'theme.original.css');
}

/** Ce qu'un jeton demande comme éditeur, et donc comme validation. */
export type FamilleDeJeton = 'couleur' | 'police' | 'longueur' | 'ombre' | 'echelle';

export interface JetonEditable {
    /** Le nom du jeton, sans le préfixe `--rpg-`. */
    cle: string;
    label: string;
    groupe: 'couleurs' | 'polices' | 'tailles' | 'formes';
    famille: FamilleDeJeton;
    /** Ce que le jeton fait vraiment, dit en une phrase. */
    aide: string;
    /** Ce jeton atteint-il l'interface de GM-OS, ou seulement les fiches ? */
    surLInterface?: boolean;
}

/**
 * **Le catalogue : les 22 jetons du SDK, plus un.**
 *
 * Les vingt-deux sont identiques dans les cinq thèmes du dépôt — vérifié, pas
 * supposé. `font-scale` est une **extension de GM-OS**, signalée comme telle :
 * le SDK ne porte aucune taille de texte, et David en voulait une.
 *
 * `surLInterface` dit la vérité qui évite une heure de recherche : huit jetons
 * seulement franchissent le pont vers le cockpit (`PONT`, dans
 * `jetonsDeTheme.ts`). Les autres ne sont pas perdus — **les fiches les lisent
 * tous** —, mais changer `paper` ne repeindra pas l'écran du meneur, et il faut
 * le dire avant qu'on le cherche.
 */
export const JETONS_EDITABLES: JetonEditable[] = [
    // ── Couleurs ────────────────────────────────────────────────────────────
    { cle: 'bg', label: 'Fond', groupe: 'couleurs', famille: 'couleur', surLInterface: true,
      aide: 'Le fond de l’application et des fiches.' },
    { cle: 'surface', label: 'Surface', groupe: 'couleurs', famille: 'couleur', surLInterface: true,
      aide: 'Les panneaux et cartes posés sur le fond.' },
    { cle: 'surface-2', label: 'Surface 2', groupe: 'couleurs', famille: 'couleur',
      aide: 'Le second niveau de relief, pour les fiches.' },
    { cle: 'paper', label: 'Papier', groupe: 'couleurs', famille: 'couleur',
      aide: 'La page de la fiche. Sert de repli à la surface si elle manque.' },
    { cle: 'ink', label: 'Encre', groupe: 'couleurs', famille: 'couleur',
      aide: 'Le texte écrit sur le papier de la fiche.' },
    { cle: 'text', label: 'Texte', groupe: 'couleurs', famille: 'couleur', surLInterface: true,
      aide: 'Le texte courant de l’interface.' },
    { cle: 'muted', label: 'Texte estompé', groupe: 'couleurs', famille: 'couleur', surLInterface: true,
      aide: 'Les mentions secondaires, les légendes.' },
    { cle: 'accent', label: 'Accent', groupe: 'couleurs', famille: 'couleur', surLInterface: true,
      aide: 'La couleur du jeu. ⚠ Un accent choisi à la main dans les réglages passe devant.' },
    { cle: 'accent-2', label: 'Accent 2', groupe: 'couleurs', famille: 'couleur',
      aide: 'L’accent secondaire des fiches.' },
    { cle: 'accent-contrast', label: 'Sur l’accent', groupe: 'couleurs', famille: 'couleur',
      aide: 'Le texte posé SUR l’accent : il doit trancher avec lui.' },
    { cle: 'border', label: 'Bordure', groupe: 'couleurs', famille: 'couleur', surLInterface: true,
      aide: 'Les traits qui séparent les panneaux.' },
    { cle: 'border-soft', label: 'Bordure douce', groupe: 'couleurs', famille: 'couleur',
      aide: 'Les séparations discrètes des fiches.' },

    // ── Polices ─────────────────────────────────────────────────────────────
    { cle: 'font-display', label: 'Titres', groupe: 'polices', famille: 'police', surLInterface: true,
      aide: 'La police des titres — et de toute l’interface de GM-OS.' },
    { cle: 'font-body', label: 'Corps', groupe: 'polices', famille: 'police',
      aide: 'Le texte courant des fiches.' },
    { cle: 'font-ui', label: 'Interface (fiches)', groupe: 'polices', famille: 'police',
      aide: 'Les champs et étiquettes des fiches.' },
    { cle: 'font-mono', label: 'Chiffres / mono', groupe: 'polices', famille: 'police', surLInterface: true,
      aide: 'Les compteurs, les jets, tout ce qui s’aligne en colonnes.' },

    // ── Tailles ─────────────────────────────────────────────────────────────
    { cle: 'font-scale', label: 'Tout le texte', groupe: 'tailles', famille: 'echelle', surLInterface: true,
      aide: 'Le réglage d’ensemble. Les quatre suivants s’y multiplient : on règle l’ensemble, puis on corrige une bande.' },

    /*
      **Une échelle par bande — demandé par David le 2026-09-05.**

      Il voulait « la taille des différentes polices ». Les quatre polices du
      thème choisissent des **familles**, pas des tailles : leur donner un
      curseur chacune aurait fait trois contrôles sur quatre qui n'agissent sur
      rien, `font-body` et `font-ui` ne servant qu'aux fiches.

      Ce qui existe vraiment dans l'interface, ce sont **quatre bandes de
      taille** — l'habillage, le texte courant, les titres, les chiffres. Ce
      sont elles qu'on règle. Voir le bloc en tête de `index.css`.

      ⛔ Et il a fallu d'abord **convertir 1 832 tailles écrites en pixels en
      dur**, qui n'obéissaient à aucune échelle : le curseur d'avant ne
      redimensionnait que la moitié de l'écran, sans le dire.
    */
    { cle: 'scale-interface', label: 'Étiquettes et badges', groupe: 'tailles', famille: 'echelle', surLInterface: true,
      aide: 'Les petites capitales, les pastilles, les libellés. C’est la bande la plus dense de l’écran.' },
    { cle: 'scale-corps', label: 'Texte courant', groupe: 'tailles', famille: 'echelle', surLInterface: true,
      aide: 'Ce qu’on lit vraiment : notes, résumés, descriptions.' },
    /* ⚠️ Pas « Titres » : le groupe Polices a déjà un réglage de ce nom, pour la
       famille de caractères. *Deux contrôles du même nom dans un même écran se
       confondent* — et le test qui les cherche aussi. */
    { cle: 'scale-titres', label: 'Titres et grands nombres', groupe: 'tailles', famille: 'echelle', surLInterface: true,
      aide: 'Les titres de panneau et les grands nombres.' },
    { cle: 'scale-mono', label: 'Chiffres et code', groupe: 'tailles', famille: 'echelle', surLInterface: true,
      aide: 'Tout ce qui est à chasse fixe : compteurs, jets, minuteurs.' },
    { cle: 'title-tracking', label: 'Interlettrage des titres', groupe: 'tailles', famille: 'longueur',
      aide: 'L’espace entre les lettres des titres, en em.' },
    { cle: 'kicker-tracking', label: 'Interlettrage des surtitres', groupe: 'tailles', famille: 'longueur',
      aide: 'Le même, pour les petites capitales au-dessus des titres.' },

    // ── Formes ──────────────────────────────────────────────────────────────
    { cle: 'radius-sm', label: 'Rayon petit', groupe: 'formes', famille: 'longueur',
      aide: 'Les angles des puces et des champs. 0 pour un jeu anguleux.' },
    { cle: 'radius-md', label: 'Rayon moyen', groupe: 'formes', famille: 'longueur',
      aide: 'Les angles des cartes.' },
    { cle: 'radius-lg', label: 'Rayon grand', groupe: 'formes', famille: 'longueur',
      aide: 'Les angles des grands panneaux.' },
    { cle: 'shadow', label: 'Ombre portée', groupe: 'formes', famille: 'ombre',
      aide: 'L’ombre des cartes, telle qu’elle s’écrit en CSS.' },
];

export const GROUPES: { id: JetonEditable['groupe']; titre: string }[] = [
    { id: 'couleurs', titre: 'Couleurs' },
    { id: 'polices', titre: 'Polices' },
    { id: 'tailles', titre: 'Tailles' },
    { id: 'formes', titre: 'Formes' },
];

/* ────────────────────────────────────────────────────────────────────────────
   L'ÉCHELLE DE TEXTE — une extension, donc bornée et documentée
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * La base de GM-OS, en pourcentage : `index.css` pose `:root { font-size: 85% }`.
 *
 * ⚠️ **Un `rem` vaut donc 13,6 px et non 16.** L'échelle du jeu *multiplie* cette
 * base au lieu de la remplacer : poser `100%` ici grossirait toute l'interface
 * de 18 % sans que personne n'ait demandé quoi que ce soit.
 */
export const BASE_DE_TEXTE_POURCENT = 85;

export const ECHELLE_MIN = 0.8;

/**
 * **Le plafond monte à 200 % le 2026-09-06**, à la demande de David : il lisait
 * des étiquettes de 8 px sur la fiche d'un lieu, et 130 % les portait à 10,4 —
 * *un plafond prudent qui n'atteint pas le besoin ne protège de rien.*
 *
 * ⚠️ **C'est un vrai doublement.** La racine passe de 85 % à 170 %, donc un
 * `rem` de 13,6 px à 27,2 : des panneaux dimensionnés à l'œil déborderont. Le
 * retour est toujours possible — « Non réglé » remet le défaut du jeu, et le
 * réglage vit dans un fichier qu'on peut rouvrir.
 */
export const ECHELLE_MAX = 2;

/**
 * L'échelle lue sur un jeton, ou `null` si le thème n'en déclare pas.
 *
 * `null` et « 1 » ne sont pas la même chose pour l'appelant : le premier veut
 * dire *n'y touche pas*, et c'est ce qui permet de retirer le style au lieu
 * d'écrire une valeur qui ressemble à la valeur par défaut.
 */
export function echelleDeTexte(valeur: string | undefined): number | null {
    if (valeur === undefined || valeur === null) return null;
    const brut = String(valeur).trim().replace('%', '');
    if (!brut) return null;
    const n = Number(brut);
    if (!Number.isFinite(n) || n <= 0) return null;
    /*
      Une échelle saisie en pourcentage (« 110 ») vaut 1,1. La frontière est à
      DIX et non au plafond : sinon « 3 », qui est une saisie manifestement trop
      grande, deviendrait 0,03 puis se ferait border à 0,8 — soit un texte plus
      PETIT que la normale pour quelqu'un qui demandait plus grand. *Une borne
      qui inverse l'intention est pire qu'une borne absente.*
    */
    const facteur = n >= 10 ? n / 100 : n;
    return Math.min(ECHELLE_MAX, Math.max(ECHELLE_MIN, facteur));
}

/** La taille de racine à poser, en pourcentage, ou `null` pour ne rien poser. */
export function tailleDeRacine(valeur: string | undefined): string | null {
    const echelle = echelleDeTexte(valeur);
    if (echelle === null) return null;
    return `${(BASE_DE_TEXTE_POURCENT * echelle).toFixed(2)}%`;
}


/* ────────────────────────────────────────────────────────────────────────────
   LES PALIERS NOMMÉS — parce que « 100 % » ne dit pas ce qu'on va obtenir
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * **Les six tailles offertes au meneur, nommées.**
 *
 * Demandé par David le 2026-09-06 : *« ne serait-ce pas plus simple d'avoir
 * une liste avec les différentes tailles ? »*
 *
 * ⚠️ **Une liste PAR POLICE reste refusée**, pour la raison déjà écrite plus
 * haut : les quatre polices d'un thème choisissent des *familles*, pas des
 * tailles, et deux d'entre elles ne servent qu'aux fiches. Ce qui change ici
 * n'est donc pas ce qu'on règle — ce sont toujours les cinq échelles — mais
 * **comment on le désigne** : un palier nommé se retrouve, se dit à voix haute
 * et se repose à l'identique sur un autre jeu ; un curseur au centième ne se
 * repose jamais deux fois au même endroit.
 *
 * Les bornes sont celles d'`echelleDeTexte` : proposer un palier qu'elle
 * borderait afficherait un nom pour une valeur qu'on n'obtient pas. *Un
 * contrôle qui se trompe est pire qu'un contrôle absent.*
 */
export interface PalierDeTaille {
    /** La valeur écrite dans le thème — un facteur, jamais un pourcentage. */
    valeur: string;
    /** Ce que le meneur lit. */
    label: string;
}

export const PALIERS_DE_TAILLE: readonly PalierDeTaille[] = [
    { valeur: '0.8', label: 'Très petit' },
    { valeur: '0.9', label: 'Petit' },
    { valeur: '1', label: 'Normal' },
    { valeur: '1.1', label: 'Grand' },
    { valeur: '1.2', label: 'Très grand' },
    { valeur: '1.3', label: 'Énorme' },
    /*
      **Les écarts s'élargissent en haut de l'échelle.** Dix pour cent de plus
      sur 190 ne se voit pas, là où dix pour cent sur 90 se voit tout de suite :
      c'est le rapport qui compte, pas la différence. Une liste régulière aurait
      donc coûté quatre crans indiscernables pour rien.
    */
    { valeur: '1.5', label: 'Géant' },
    { valeur: '1.75', label: 'Immense' },
    { valeur: '2', label: 'Maximal' },
];

/**
 * Le palier qui correspond à une valeur du thème, ou `null`.
 *
 * `null` couvre **deux cas qu'il ne faut pas confondre** : le jeton absent —
 * le jeu ne règle rien — et une valeur écrite à la main hors des paliers, par
 * exemple « 107 % » venu d'un curseur d'avant. Le second doit rester
 * sélectionnable, sinon l'ouvrir dans l'atelier le remplacerait en silence.
 */
export function palierDeLEchelle(valeur: string | undefined): PalierDeTaille | null {
    const echelle = echelleDeTexte(valeur);
    if (echelle === null) return null;
    return PALIERS_DE_TAILLE.find(p => Number(p.valeur) === echelle) ?? null;
}

/* ────────────────────────────────────────────────────────────────────────────
   LES POLICES
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Une famille proposée au meneur, avec **la requête exacte** qui la télécharge.
 *
 * Les axes ne se devinent pas : `Source Serif 4` veut `opsz,wght@8..60,400;…`,
 * et une requête inventée renvoie une erreur — donc **aucune police**, en
 * silence. Les requêtes ci-dessous sont copiées de celles qui tournent déjà
 * dans les cinq thèmes du dépôt, ou de la liste d'`index.css`.
 *
 * `deja` marque les polices qu'`index.css` charge pour toute l'application :
 * elles n'ont besoin d'aucun import, elles sont là.
 */
export interface PoliceConnue {
    famille: string;
    /** Le fragment `family=…` de la requête Google, sans le `&`. */
    requete?: string;
    /** Chargée par `index.css` pour toute l'application. */
    deja?: boolean;
    genre: 'titre' | 'serif' | 'sans' | 'mono' | 'atmosphere';
}

export const POLICES_CONNUES: PoliceConnue[] = [
    // Celles des cinq thèmes existants.
    { famille: 'Barlow Condensed', requete: 'family=Barlow+Condensed:wght@400;500;600;700', genre: 'titre' },
    { famille: 'Oswald', requete: 'family=Oswald:wght@400;500;600;700', genre: 'titre' },
    { famille: 'Montserrat', requete: 'family=Montserrat:wght@400;500;600;700', genre: 'sans' },
    { famille: 'Rajdhani', requete: 'family=Rajdhani:wght@500;600;700', genre: 'titre' },
    { famille: 'Exo 2', requete: 'family=Exo+2:ital,wght@0,400;0,500;0,600;0,700;1,500', genre: 'sans' },
    { famille: 'Cormorant Garamond', requete: 'family=Cormorant+Garamond:wght@500;600;700', genre: 'serif' },
    { famille: 'Source Serif 4', requete: 'family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600', genre: 'serif' },
    { famille: 'Crimson Pro', requete: 'family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400;1,500', genre: 'serif' },
    { famille: 'Libre Baskerville', requete: 'family=Libre+Baskerville:wght@400;700', genre: 'serif' },
    { famille: 'IBM Plex Mono', requete: 'family=IBM+Plex+Mono:wght@400;500;600', genre: 'mono' },

    // Celles que `index.css` charge déjà pour toute l'application.
    { famille: 'Plus Jakarta Sans', deja: true, genre: 'sans' },
    { famille: 'Outfit', deja: true, genre: 'sans' },
    { famille: 'Inter', deja: true, genre: 'sans' },
    { famille: 'JetBrains Mono', deja: true, genre: 'mono' },
    { famille: 'Orbitron', deja: true, genre: 'titre' },
    { famille: 'Cinzel', deja: true, genre: 'titre' },
    { famille: 'Playfair Display', deja: true, genre: 'serif' },
    { famille: 'Special Elite', deja: true, genre: 'atmosphere' },
    { famille: 'MedievalSharp', deja: true, genre: 'atmosphere' },
    { famille: 'Pinyon Script', deja: true, genre: 'atmosphere' },
    { famille: 'UnifrakturMaguntia', deja: true, genre: 'atmosphere' },
    { famille: 'Noto Serif', deja: true, genre: 'serif' },
];

/** Les replis écrits derrière chaque famille, par genre. */
const REPLIS: Record<PoliceConnue['genre'], string> = {
    titre: 'Arial Narrow, sans-serif',
    sans: 'system-ui, sans-serif',
    serif: 'Georgia, serif',
    mono: 'ui-monospace, monospace',
    atmosphere: 'Georgia, serif',
};

/**
 * La pile CSS d'une famille : la police voulue, **puis un repli qui existe
 * partout**. Sans lui, une police qui n'arrive pas laisse le navigateur choisir
 * seul — et il choisit Times.
 */
export function pileDePolice(famille: string): string {
    const connue = POLICES_CONNUES.find(p => p.famille === famille);
    const repli = REPLIS[connue?.genre ?? 'sans'];
    return `"${famille}", ${repli}`;
}

/** Le premier nom d'une pile, celui que le thème veut vraiment. */
export function familleDeLaPile(pile: string | undefined): string {
    if (!pile) return '';
    return (pile.split(',')[0] ?? '').trim().replace(/^['"]|['"]$/g, '');
}

/**
 * **La requête qui télécharge les polices choisies, ou `null`.**
 *
 * *C'est le piège du 2026-08-24, et il est intégral ici :* une variable
 * `--rpg-font-display` posée sans import déclare une police que le navigateur
 * ne téléchargera jamais, et il retombe **en silence** sur le repli. Le thème
 * paraît appliqué, la typographie non.
 *
 * Les polices déjà chargées par `index.css` sont écartées de la requête : les
 * redemander ne casserait rien mais alourdirait chaque ouverture pour rien.
 */
export function requeteDePolices(familles: string[]): string | null {
    const fragments: string[] = [];

    for (const famille of familles) {
        const connue = POLICES_CONNUES.find(p => p.famille === famille);
        if (!connue?.requete) continue; // inconnue ou déjà chargée
        if (!fragments.includes(connue.requete)) fragments.push(connue.requete);
    }

    if (fragments.length === 0) return null;
    return `https://fonts.googleapis.com/css2?${fragments.join('&')}&display=swap`;
}

/**
 * Cette famille arrivera-t-elle vraiment ? Sinon, on le dit avant d'enregistrer.
 *
 * Trois cas : chargée par l'application, téléchargée par notre import, ou
 * **inconnue** — et dans ce dernier cas elle ne marchera que si elle est
 * installée sur la machine. *Ce n'est pas un refus, c'est un avertissement :
 * une police locale est un choix légitime, une police absente est un accident.*
 */
export function policeFournie(famille: string): 'application' | 'import' | 'locale' {
    const connue = POLICES_CONNUES.find(p => p.famille === famille);
    if (!connue) return 'locale';
    return connue.deja ? 'application' : 'import';
}

/* ────────────────────────────────────────────────────────────────────────────
   L'ÉCRITURE
   ──────────────────────────────────────────────────────────────────────────── */

/** Le même motif que la lecture (`jetonsDeTheme.ts`) : les deux doivent voir le même bloc. */
const BLOC_RACINE = /(?::root|html)(?:\[data-theme=["']?[\w-]+["']?\])?\s*\{([^}]*)\}/g;

const IMPORT_GOOGLE = /@import\s+url\(\s*['"]?(https:\/\/fonts\.googleapis\.com[^'")]+)['"]?\s*\)\s*;?/;

/** L'indentation des déclarations d'un bloc, telle qu'elle est écrite. */
function indentationDe(corps: string): string {
    const m = /\n([ \t]+)--rpg-/.exec(corps);
    return m ? m[1] : '  ';
}

/**
 * **Repose des valeurs dans le dernier bloc racine, sans toucher au reste.**
 *
 * Une valeur vide **retire** le jeton : c'est le geste « revenir au défaut »,
 * et il doit exister, sans quoi on ne pourrait qu'ajouter. Un jeton absent du
 * fichier est ajouté à la fin du bloc, à la bonne indentation.
 *
 * Le fichier qui n'a aucun bloc racine ressort inchangé : *on ne fabrique pas
 * une structure dans un fichier qu'on n'a pas compris.*
 */
export function ecrireLesJetons(css: string, valeurs: Record<string, string>): string {
    const blocs = [...css.matchAll(BLOC_RACINE)];
    if (blocs.length === 0) return css;

    const bloc = blocs[blocs.length - 1];
    const debutDuCorps = bloc.index! + bloc[0].indexOf('{') + 1;
    const finDuCorps = debutDuCorps + bloc[1].length;

    let corps = bloc[1];
    const marge = indentationDe(corps);

    for (const [cle, valeurBrute] of Object.entries(valeurs)) {
        const valeur = String(valeurBrute ?? '').trim();
        const declaration = new RegExp(`([ \\t]*--rpg-${cle}\\s*:\\s*)([^;]*)(;)`);
        const presente = declaration.test(corps);

        if (presente && valeur) {
            corps = corps.replace(declaration, (_t, avant, _ancienne, apres) => `${avant}${valeur}${apres}`);
        } else if (presente) {
            // Retrait : la ligne entière s'en va, saut de ligne compris.
            corps = corps.replace(new RegExp(`\\n?[ \\t]*--rpg-${cle}\\s*:[^;]*;`), '');
        } else if (valeur) {
            const fin = /\n[ \t]*$/.exec(corps);
            corps = fin
                ? `${corps.slice(0, fin.index)}\n${marge}--rpg-${cle}: ${valeur};${corps.slice(fin.index)}`
                : `${corps}\n${marge}--rpg-${cle}: ${valeur};\n`;
        }
    }

    return css.slice(0, debutDuCorps) + corps + css.slice(finDuCorps);
}

/**
 * **Pose l'import des polices, ou le remplace.**
 *
 * Un `@import` doit précéder toute règle : c'est la règle du langage, pas une
 * préférence. On remplace donc celui qui existe déjà — les thèmes du dépôt en
 * ont tous un —, et à défaut on l'écrit **en tête du fichier**.
 *
 * `null` retire l'import : le cas d'un thème qui ne retient que des polices déjà
 * chargées par l'application.
 */
export function ecrireLImportDePolices(css: string, url: string | null): string {
    const existant = IMPORT_GOOGLE.exec(css);

    if (existant) {
        if (!url) return css.replace(IMPORT_GOOGLE, '').replace(/^\n{3,}/m, '\n\n');
        return css.replace(IMPORT_GOOGLE, `@import url('${url}');`);
    }

    if (!url) return css;
    return `@import url('${url}');\n\n${css}`;
}

/**
 * Un `theme.css` neuf pour un jeu qui n'en avait pas.
 *
 * **Le strict minimum, et il est volontairement pauvre** : les vingt-deux jetons
 * et rien d'autre. Les règles `.rpg-*` d'un thème complet décrivent une page de
 * livre ; les inventer ici, c'est prétendre connaître la direction artistique
 * d'un jeu qu'on n'a pas ouvert. *Le meneur part d'une base neutre et la
 * teinte ; il ne débogue pas la nôtre.*
 */
export function themeVierge(nomDuJeu: string, valeurs: Record<string, string>): string {
    const lignes = JETONS_EDITABLES
        .filter(j => valeurs[j.cle]?.trim())
        .map(j => `  --rpg-${j.cle}: ${valeurs[j.cle].trim()};`);

    return [
        '/* ==========================================================================',
        `   THÈME — ${nomDuJeu.toUpperCase()}`,
        '   Écrit depuis l’atelier de thème de GM-OS.',
        '   Les jetons ci-dessous habillent l’application ET les fiches de personnage.',
        '   ========================================================================== */',
        '',
        ':root {',
        ...lignes,
        '}',
        '',
    ].join('\n');
}

/* ────────────────────────────────────────────────────────────────────────────
   LE CONTRASTE — parce qu'une couleur se choisit contre une autre
   ──────────────────────────────────────────────────────────────────────────── */

/** Les composantes 0-255 d'un `#rgb` ou `#rrggbb`, ou `null` si ce n'en est pas un. */
function composantes(couleur: string): [number, number, number] | null {
    const brut = couleur.trim().replace(/^#/, '');
    const hex = brut.length === 3 ? brut.split('').map(c => c + c).join('') : brut;
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** La luminance relative de WCAG. */
function luminance([r, v, b]: [number, number, number]): number {
    const canal = (c: number) => {
        const x = c / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(r) + 0.7152 * canal(v) + 0.0722 * canal(b);
}

/**
 * **Le rapport de contraste entre deux couleurs, ou `null`.**
 *
 * `null` n'est pas un échec : la moitié des bordures des thèmes réels sont des
 * `rgba(...)`, dont le contraste dépend de ce qu'il y a dessous. *On préfère ne
 * rien dire que dire un chiffre faux* — un contrôle qui se trompe est pire
 * qu'un contrôle absent, c'est la leçon de la dérivation de Cthulhu Hack.
 *
 * Les seuils de WCAG : 4,5 pour du texte courant, 3 pour du grand texte.
 */
export function contraste(premier: string, second: string): number | null {
    const a = composantes(premier);
    const b = composantes(second);
    if (!a || !b) return null;

    const la = luminance(a);
    const lb = luminance(b);
    const [clair, sombre] = la > lb ? [la, lb] : [lb, la];
    return Math.round(((clair + 0.05) / (sombre + 0.05)) * 100) / 100;
}

/**
 * Les paires qu'il faut regarder, et ce qu'elles doivent atteindre.
 *
 * Trois seulement : celles qu'un thème rate vraiment. *Une liste de vingt
 * avertissements ne se lit pas, donc ne sert à rien.* Blade Runner a payé
 * exactement ça le 2026-08-29 — un accent bordeaux à 4,5:1 sur le fond, affiché
 * en transparence dans les titres, donc bien plus bas.
 */
export const PAIRES_A_CONTROLER: { texte: string; fond: string; seuil: number; quoi: string }[] = [
    { texte: 'text', fond: 'bg', seuil: 4.5, quoi: 'Texte sur le fond' },
    { texte: 'muted', fond: 'bg', seuil: 3, quoi: 'Texte estompé sur le fond' },
    { texte: 'accent', fond: 'bg', seuil: 3, quoi: 'Accent sur le fond' },
];

/** Les valeurs par défaut d'un thème neuf : sobres, lisibles, sans parti pris. */
export const JETONS_PAR_DEFAUT: Record<string, string> = {
    bg: '#0b0f14',
    surface: '#141b22',
    'surface-2': '#1c242d',
    paper: '#e8e6e1',
    ink: '#1a1d21',
    text: '#eef2f5',
    muted: '#8b98a5',
    accent: '#4f9cf9',
    'accent-2': '#c9a227',
    'accent-contrast': '#0b0f14',
    border: 'rgba(255, 255, 255, 0.16)',
    'border-soft': 'rgba(255, 255, 255, 0.08)',
    'font-display': pileDePolice('Outfit'),
    'font-body': pileDePolice('Source Serif 4'),
    'font-ui': pileDePolice('Inter'),
    'font-mono': pileDePolice('JetBrains Mono'),
    'title-tracking': '0.08em',
    'kicker-tracking': '0.18em',
    'radius-sm': '4px',
    'radius-md': '10px',
    'radius-lg': '18px',
    shadow: '0 18px 50px rgba(0, 0, 0, 0.42)',
};
