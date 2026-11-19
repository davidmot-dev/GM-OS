// Ajoute le bestiaire du livre au pilote Cthulhu Hack — pilote 1.2.0, 19/11/2026, Claude Code.
// Chantier § 263 du registre, tâche T15 (documentation/Planning/2026-11-19-combat-jets-des-adversaires-et-degats.md).
// David : « les lancer de dés des PNJ/Créatures, les calculs des dégâts, ce n'est pas toujours
// intuitif » ; décision D3 du 19/11 : « Oui, les deux » (créer le bestiaire de Cthulhu Hack).
//
// Source des chiffres : la fiche de corpus `docs/systems/cthulhu hack/rules/bestiaire-et-adversaires.md`,
// relue le 19/11 contre le livre v1v3 (PDF = imprimée + 1), profils lus en image (T13), p. 54-62.
//
// Ce que fait ce script, sans toucher aucun identifiant (pilote, fiche) :
// - un bestiaire de 22 créatures : Dés de Vie (texte : « 1 à 3 », « 2 + »), Points de Vie (→ champ
//   `hp` de la fiche : une créature posée entre avec sa santé), Points d'Armure et Malus au toucher
//   (nombres, lus par Combat-OS : riposte et dégâts des investigateurs, T16-T17) ;
// - les attaques à dégâts fixes (T14 : `de` vide, `degats`, `fois`) : le meneur ne lance jamais de
//   dé ; une attaque au choix (« OU ») le dit dans son effet ;
// - les attaques conditionnelles (Déchirer du Byakhee, Acharnement du prédateur, Engloutir du Dhole…)
//   et les capacités spéciales vont aux particularités : ce ne sont pas des attaques du round ;
// - les profils à échelle (Mort-vivant 1 à 3 DV, Profond « 2 + ») prennent la base de la fourchette,
//   la règle entière dans les particularités ; le Mi-Go garde son Malus au toucher vide (le livre ne
//   le donne pas, p. 60) ;
// - version 1.2.0.
//
// Usage : node outils/cthulhu-hack/ajouter_le_bestiaire.mjs <pilote 1.1.0> <sortie .gmos-driver>
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

const source = process.argv[2] ?? 'output/campagnes-tests/cthulhu-hack/Cthulhu-Hack-1.1.0.gmos-driver';
const sortie = process.argv[3] ?? 'Export Dirvers/corriges/Cthulhu-Hack-1.2.0.gmos-driver';
const zip = new AdmZip(source), entree = zip.getEntry('state.json');
if (!entree) throw new Error('Archive sans pilote JSON.');
const exporte = JSON.parse(entree.getData().toString('utf8')), d = exporte.gameDriver, t = exporte.sheetTemplate;
if (!d || !t || d.id !== 'custom-1774643419710' || t.id !== 'tpl-1774643419711') throw new Error('Le pilote source ne correspond pas à Cthulhu Hack.');
if (d.version !== '1.1.0') throw new Error(`Ce script part du pilote 1.1.0, pas de la version ${d.version}.`);
if (d.bestiaire?.creatures?.length) throw new Error('Le pilote a déjà un bestiaire : rien à ajouter.');
if (!t.sections.some(s => s.fields.some(f => f.id === 'hp'))) throw new Error('Champ « hp » absent de la fiche.');

const LIVRE = 'Cthulhu Hack — réédition';
const FICHE = 'systems/cthulhu hack/rules/bestiaire-et-adversaires.md';
/** Une attaque à dégâts fixes. */
const a = (nom, degats, fois = 1, effet = '') => ({ de: '', nom, effet, degats, ...(fois > 1 ? { fois } : {}) });
const AU_CHOIX = 'au choix (OU)';
const c = (id, nom, categorie, page, dv, pv, pa, malus, attaques, particularites = []) => ({
    id, nom, categorie,
    valeurs: { 'des-de-vie': dv, 'points-de-vie': pv, 'points-d-armure': pa, ...(malus === null ? {} : { 'malus-au-toucher': malus }) },
    attaques: { lignes: attaques },
    ...(particularites.length ? { particularites } : {}),
    source: { livre: LIVRE, page, fiche: FICHE },
});
const COMMUNS = 'Ennemis communs', MYTHE = 'Ennemis du Mythe';

const creatures = [
    c('nuee-de-vermines', 'Nuée de vermines', COMMUNS, 54, '1', 4, 0, 0, [a('Piqûres', 1)],
        ['Innombrable : il en arrive de plus en plus, les dégâts augmentent de 1 chaque round.']),
    c('gros-bras', 'Gros bras', COMMUNS, 54, '1', 6, 0, 0, [a('Poings', 2, 2)]),
    c('homme-de-main', 'Homme de main', COMMUNS, 55, '2', 8, 1, -1, [a('Couteau de combat', 3, 2, AU_CHOIX), a('Coups de poings', 2, 2, AU_CHOIX)]),
    c('predateur-mineur', 'Prédateur mineur', COMMUNS, 55, '2', 10, 0, -1, [a('Morsure', 3)],
        ['Hémorragie : si la Morsure blesse, un d6 en Compteur ; le blessé perd 1 Point de Vie à chaque action et le Compteur baisse d’un point, jusqu’à 0.']),
    c('gentleman', 'Gentleman', COMMUNS, 55, '3', 12, 0, -2, [a('Canne-épée', 4, 1, AU_CHOIX), a('Poings', 1, 2, AU_CHOIX)],
        ['Intimidation : une fois par Scène, un adversaire hésite et obtient un double Désavantage.']),
    c('garde', 'Garde', COMMUNS, 55, '3', 14, 1, -2, [a('Revolver', 4), a('Matraque', 2, 2)],
        ['Avec un gilet pare-balles, passez les Points d’Armure à 2.']),
    c('caid', 'Caïd', COMMUNS, 55, '4', 20, 2, -3, [a('Fusil d’assaut', 8, 1, AU_CHOIX), a('Pistolet-mitrailleur', 5, 2, AU_CHOIX), a('Couteau de combat', 5, 2, AU_CHOIX)],
        ['Second souffle : une fois par combat, une action pour regagner 8 Points de Vie.', 'Feinte : une fois par combat, fait rater une Sauvegarde réussie d’un adversaire et le blesse.']),
    c('predateur-majeur', 'Prédateur majeur', COMMUNS, 56, '4', 30, 1, -3, [a('Griffes', 3, 2)],
        ['Acharnement : s’il blesse deux fois un adversaire dans le round, nouvelle attaque Morsure (8 dégâts) sur cette cible.']),
    c('commando', 'Commando', COMMUNS, 56, '5', 25, 2, -4, [a('Fusil d’assaut', 6, 2, AU_CHOIX), a('Couteau de combat', 3, 2, AU_CHOIX)],
        ['Coordination : à plusieurs, le Malus au toucher de chacun baisse d’1 point par commando au-delà du premier (4 commandos : −7).']),
    c('sorcier', 'Sorcier', COMMUNS, 56, '5', 35, 3, -4, [a('Couteau sacrificiel enchanté', 4, 3)],
        ['Sortilèges : Appel du vide, Aversion, Contact de la clef d’argent, Enchantement d’Ephraïm, Transformation.', 'Sort rapide : un Sortilège gratuit au début du premier round.', 'Cape de protection (comprise dans ses Points d’Armure).']),
    c('byakhee', 'Byakhee', MYTHE, 58, '4', 16, 2, -3, [a('Griffer', 2, 2), a('Mordre', 2)],
        ['Si les deux Griffer touchent : attaque Déchirer (3 dégâts).', 'Si la défense est un échec critique : attaque Chute (6 dégâts).']),
    c('celui-qui-hante', 'Celui-qui-hante', MYTHE, 58, '9', 33, 8, -8,
        [a('Pointe osseuse', 9), a('Acide', 3, 1, 'par Moment, à moins de passer un compte à rebours de 3 à ne rien faire pour nettoyer l’acide'), a('Griffer', 3, 3)],
        ['Tant qu’on ne sait pas où il est, toutes les attaques ratent.', 'Invisible mais localisable : les Sauvegardes ont un Désavantage.']),
    c('chose-tres-ancienne', 'Chose très ancienne', MYTHE, 58, '6', 24, 3, -5, [a('Tentacule', 3, 4)],
        ['Si deux Tentacule touchent : attaque Déchirer (5 dégâts).', 'Peut jeter 1d6 sortilèges choisis aléatoirement.', 'Vole.']),
    c('dhole', 'Dhole', MYTHE, 59, '8', 36, 8, -7, [a('Mordre', 8)],
        ['Si la défense rate de plus de 4 points : attaque Engloutir (6 dégâts par Moment), Désavantage pour s’échapper.', 'Sauvegarde de Dextérité à chaque début de Moment contre la chute (tremblements).', 'Immunité au feu.']),
    c('goule', 'Goule', MYTHE, 59, '2', 8, 1, -1, [a('Griffer', 2, 2), a('Mordre', 2)],
        ['Son visage : Sauvegarde de Sagesse au début de chaque Moment ou un Choc, sauf à détourner le regard (Désavantage).']),
    c('grande-race-de-yith', 'Grande race de Yith', MYTHE, 59, '9', 36, 4, -8, [a('Rayon laser', 3, 1, 'cible tout ce qui est dans la ligne de vue')],
        ['Forme changeante : Désavantage aux Sauvegardes de Dextérité.', 'Peut jeter 1d3 sortilèges choisis au hasard.', 'Voyage dans le temps.']),
    c('maigres-betes-de-la-nuit', 'Maigres bêtes de la nuit', MYTHE, 60, '5', 20, 4, -4, [a('Piquer', 3), a('Cornes', 3)],
        ['Qui rate son attaque contre elle : Sauvegarde de Force ou emporté dans les airs (Désavantage) ; lâché, 2 dégâts par Moment passé en l’air.', 'Vole.']),
    c('mi-go', 'Mi-Go', MYTHE, 60, '3', 12, 3, null, [a('Projecteur de brume', 6, 1, 'dégâts de froid, peut atteindre des cibles Distantes')],
        ['Le livre ne donne pas son Malus au toucher (la règle de création proposerait −2).', 'Peut jeter 3 sortilèges choisis par le MJ.', 'Vole.']),
    c('mort-vivant', 'Mort-vivant', MYTHE, 60, '1 à 3', 4, 3, 0, [a('Poings', 2)],
        ['Échelle : 1 à 3 Dés de Vie, 4 à 12 Points de Vie, Armure = Dés de Vie + 2, Malus au toucher 0 à −2 (profil posé : le plus faible).', 'Se battre contre lui donne un Avantage (lenteur).', 'Immunisé à la douleur, à la séduction et à l’hypnose.']),
    c('profond', 'Profond', MYTHE, 61, '2 +', 8, 4, -1, [a('Griffer', 3, 2, 'Dés de Vie + 1')],
        ['Échelle : Dés de Vie 2 et plus, Points de Vie 8 et plus, Armure = DV + 2, Malus = DV − 1, Griffer = DV + 1 (profil posé : 2 DV).', 'Amphibie ; se défendre contre lui sous l’eau donne un Désavantage.', 'Liquéfie et moule le métal avec ses mains.']),
    c('shoggoth', 'Shoggoth', MYTHE, 62, '12', 48, 8, -11, [a('Écraser', 18, 1, '4 cibles Proches ; une Sauvegarde de Dextérité évite la moitié des dégâts')],
        ['Ne subit que le minimum des dégâts de toute attaque.', 'Immunisé au feu, à l’eau, à l’électricité, au poison, au froid.', 'Amphibie.']),
    c('vagabond-dimensionnel', 'Vagabond dimensionnel', MYTHE, 62, '5', 20, 4, -4, [a('Griffer', 4, 2)],
        ['Échec à un test de Santé mentale : Sauvegarde de Sagesse ou agrippé (attaque avec Désavantage, compte à rebours de 3, puis perdu dans une autre dimension).', 'Vulnérable seulement à la magie ou à la science qui rompt les dimensions.']),
];
if (creatures.length !== 22) throw new Error(`22 profils attendus, ${creatures.length} écrits.`);

d.bestiaire = {
    colonnes: [
        { id: 'des-de-vie', libelle: 'Dés de Vie', nature: 'texte' },
        { id: 'points-de-vie', libelle: 'Points de Vie', nature: 'nombre', champ: 'hp' },
        // Rôle `protection` (T17, même jour) : Combat-OS la retire des dégâts d'un investigateur (livre, p. 51).
        { id: 'points-d-armure', libelle: 'Points d’Armure', nature: 'nombre', role: 'protection' },
        { id: 'malus-au-toucher', libelle: 'Malus au toucher', nature: 'nombre' },
    ],
    creatures,
};
d.version = '1.2.0';

const resultat = new AdmZip();
for (const e of zip.getEntries()) resultat.addFile(e.entryName, e === entree ? Buffer.from(JSON.stringify(exporte, null, 2) + '\n') : e.getData());
fs.mkdirSync(path.dirname(sortie), { recursive: true });
resultat.writeZip(sortie);
const lignes = creatures.reduce((n, cr) => n + cr.attaques.lignes.length, 0);
console.log(JSON.stringify({ sortie, pilote: d.id, fiche: t.id, version: d.version, creatures: creatures.length, attaques: lignes }));
