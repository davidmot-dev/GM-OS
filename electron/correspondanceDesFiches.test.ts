import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    lireLaCorrespondance, verifierLaCorrespondance, cheminDeLaCorrespondance,
    FICHIERS_DE_CORRESPONDANCE,
    type CorrespondanceDeFiche,
} from '../src/modules/fiches/correspondanceDeFiche';

/**
 * **Le contrôle qui garde les tables de correspondance vraies.**
 *
 * Une table est **une deuxième déclaration de la même vérité** : le jour où le
 * GPT régénère une fiche et renomme une clé, la table pointe dans le vide, en
 * silence — la fiche s'affiche, un champ n'arrive simplement jamais, et rien ne
 * le dit. Ce fichier lit les **vraies** tables du dépôt et le **vrai** moteur de
 * fiches, jamais une imitation.
 *
 * Ce n'est pas une crainte théorique : le typage des dix-sept `.level`, corrigé
 * le 2026-08-24, avait été appliqué à la fiche autonome de Blade Runner et
 * **jamais** au gabarit intégré du moteur — celui que GM-OS affichera. Quatre
 * jours durant, deux fichiers du même dépôt disaient le contraire l'un de
 * l'autre. Le dernier `it` de ce fichier est là pour que ça ne recommence pas.
 *
 * Il est dans `electron/` et non dans `src/` parce que les tests du renderer
 * tournent avec le shim `fs` de `vite-plugin-electron-renderer`, qui ne sait pas
 * lire un fichier — même raison que `themesDesJeux.test.ts`. La logique pure est
 * éprouvée par `src/modules/fiches/correspondanceDeFiche.test.ts`.
 */

const RACINE = path.resolve(__dirname, '..');
const SYSTEMES = path.join(RACINE, 'docs', 'systems');
const MOTEUR = path.join(RACINE, 'docs', 'fiches', 'Character_Sheet_Manager.html');

/** Un champ du gabarit, tel que le moteur le déclare. */
interface ChampDuGabarit { key: string; type?: string; label?: string }
interface GabaritDuMoteur { id: string; name: string; pages?: { fields?: ChampDuGabarit[] }[] }

/**
 * Les gabarits intégrés du moteur, lus à la source.
 *
 * On n'ouvre pas de DOM : le fichier pèse sept mégaoctets de fonds de page, et
 * la seule chose qui nous intéresse est le manifeste JSON qu'il embarque.
 */
function gabaritsDuMoteur(): GabaritDuMoteur[] {
    const source = fs.readFileSync(MOTEUR, 'utf8');
    const balise = source.indexOf('<script id="builtinTemplates" type="application/json">');
    expect(balise, 'le bloc des gabarits intégrés').toBeGreaterThan(-1);
    const ouvert = source.indexOf('>', balise) + 1;
    return JSON.parse(source.slice(ouvert, source.indexOf('</script>', ouvert)));
}

const champsDu = (gabarit: GabaritDuMoteur): ChampDuGabarit[] =>
    (gabarit.pages ?? []).flatMap(p => p.fields ?? []);

/**
 * Les tables déposées, découvertes et non recopiées — `jeu/fichier`, pour
 * qu'un échec nomme la bonne : un jeu peut porter celle de ses personnages ET
 * celle de sa fiche de groupe (la Cabale de NOC).
 */
const AVEC_TABLE = fs
    .readdirSync(SYSTEMES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(e => FICHIERS_DE_CORRESPONDANCE.map(fichier => `${e.name}/${fichier}`))
    .filter(t => fs.existsSync(path.join(SYSTEMES, path.dirname(t), 'fiche', path.basename(t))));

const MOTEURS = gabaritsDuMoteur();

function tableDe(jeuEtFichier: string): CorrespondanceDeFiche {
    const jeu = path.dirname(jeuEtFichier);
    const fichier = path.basename(jeuEtFichier) as typeof FICHIERS_DE_CORRESPONDANCE[number];
    const chemin = path.join(SYSTEMES, jeu, 'fiche', fichier);
    const table = lireLaCorrespondance(fs.readFileSync(chemin, 'utf8'), `docs/${cheminDeLaCorrespondance(`systems/${jeu}`, fichier)}`);
    expect(table, `la table ${jeuEtFichier}`).not.toBeNull();
    return table!;
}

describe('les correspondances de fiche du dépôt', () => {
    it('il y en a au moins une — sinon ce fichier ne teste rien', () => {
        expect(AVEC_TABLE.length).toBeGreaterThan(0);
    });

    it.each(AVEC_TABLE)('%s vise un gabarit que le moteur porte vraiment', (jeu) => {
        const table = tableDe(jeu);
        const connus = MOTEURS.map(g => g.id);
        expect(connus, `gabarits du moteur : ${connus.join(', ')}`).toContain(table.gabaritDeLaFiche);
    });

    /**
     * Les deux sens, et le second est celui qui compte : une clé **ajoutée** par
     * une régénération ne se voit pas autrement.
     */
    it.each(AVEC_TABLE)('%s ne cite que des clés qui existent, et n’en tait aucune', (jeu) => {
        const table = tableDe(jeu);
        const gabarit = MOTEURS.find(g => g.id === table.gabaritDeLaFiche)!;
        const cles = new Set(champsDu(gabarit).map(f => f.key));

        const erreurs = verifierLaCorrespondance(table, cles).filter(d => d.gravite === 'erreur');
        expect(erreurs.map(d => d.message)).toEqual([]);
    });

    /**
     * **Le niveau est une lettre, pas un nombre.**
     *
     * `A`, `B`, `C`, `D` — un champ `number` ne peut pas les contenir : la
     * composition écrirait « C » dans un champ qui le refuse, et l'écran
     * resterait vide sans qu'aucune erreur ne soit levée. C'est le défaut
     * exact qui a survécu quatre jours dans ce fichier.
     */
    it.each(AVEC_TABLE)('%s : les champs composés acceptent ce qu’on y écrit', (jeu) => {
        const table = tableDe(jeu);
        const gabarit = MOTEURS.find(g => g.id === table.gabaritDeLaFiche)!;
        const parCle = new Map(champsDu(gabarit).map(f => [f.key, f.type ?? 'text']));

        const numeriques = table.champs
            .filter(c => c.transforme === 'niveauEtDe' && Array.isArray(c.fiche))
            .flatMap(c => c.fiche as [string, string])
            .filter(cle => parCle.get(cle) === 'number');

        expect(numeriques, 'des champs de niveau typés « number »').toEqual([]);
    });
});

/**
 * **Un gabarit intégré ajouté sans monter `BUILTIN_VERSION` n'arrive jamais.**
 *
 * *Trouvé par David le 2026-10-02 : « Modèle inconnu : cthulhu-hack ».* Le
 * moteur ne recopie ses gabarits intégrés dans sa base que si ce numéro monte
 * (`seedBuiltins`). Une base neuve les reçoit tous — l'essai de bout en bout
 * était donc vert — mais la bibliothèque du meneur, déjà garnie au numéro 3,
 * n'a jamais vu Cthulhu Hack. *L'essai sur une base vierge ne voit pas ce que
 * voit une base qui a vécu.*
 *
 * Ce garde fige la liste et son numéro : changer l'une sans l'autre échoue ici.
 */
describe('les gabarits intégrés du moteur', () => {
    it('ne changent pas sans que leur numéro de version monte', () => {
        const source = fs.readFileSync(MOTEUR, 'utf8');
        const version = Number(source.match(/const BUILTIN_VERSION=(\d+);/)?.[1]);
        const ids = MOTEURS.map(g => g.id).sort();
        expect({ version, ids }, 'liste changée : montez BUILTIN_VERSION dans le moteur, puis cette attente').toEqual({
            // 19 : la fiche de Barbarians of Lemuria (2026-10-27) ; 20 : celle de RuneQuest ; 21 : celle de Degenesis (2026-10-30).
            version: 21,
            ids: ['alien-v2-normalise', 'barbarian-of-lemuria-fr', 'blade-runner-fr', 'crimes-fr', 'cthulhu-hack', 'degenesis-fr', 'dune-maison-fr', 'dune-pj-fr', 'nephilim-legende-fr', 'noc-cabale', 'noc-reference', 'reve-de-dragon-voyageur-fr', 'runequest-fr', 'star-trek-adventures-2e-dossier-personnel-fr', 'symbaroum-fr'],
        });
    });
});

// 19/10/2026 : la CSS autonome masquait les flèches, celle du moteur les gardait. Crimes, intégré
// le même soir, suit la même règle : le gabarit du moteur est la fiche livrée, rien d'autre.
// Symbaroum aussi (20/10).
it.each([
    'docs/fiches/Rêve de Dragon/reve-de-dragon-livret-voyageur-interactif.html',
    'docs/fiches/Crimes/crimes-fiche-personnage-interactive.html',
    'docs/fiches/Symbaroum/symbaroum-fiche-personnage-interactive.html',
    // Dune, la fiche du personnage et celle de la Maison (25/10).
    'docs/fiches/Dune/Dune_Fiche_PJ_interactive.html',
    'docs/fiches/Dune/Dune_Fiche_Maison_interactive.html',
    'docs/fiches/Barbarian of Lemuria/barbarian-of-lemuria-fiche-interactive.html',
])('%s : le gabarit intégré reprend la fiche livrée, CSS et largeurs comprises', (chemin) => {
    const fiche = fs.readFileSync(path.join(RACINE, chemin), 'utf8');
    const manifeste = JSON.parse(fiche.match(/<script\b[^>]*\bid="character-sheet-template"[^>]*>([\s\S]*?)<\/script>/)![1]);
    const { _builtin, ...integre } = MOTEURS.find(g => g.id === manifeste.template.id)! as GabaritDuMoteur & { _builtin?: boolean };
    expect(_builtin).toBe(true);
    expect(integre).toEqual(manifeste.template);
});

/**
 * **Un dé de ressource n'est pas une jauge** — trouvé par David le 2026-10-03.
 *
 * Le moteur allume toutes les cases ≤ la valeur quand la case porte un NOMBRE
 * (une jauge) ; une valeur TEXTE n'allume que la case égale. Les dés de Cthulhu
 * Hack avaient été générés en nombres : choisir d6 allumait d6 ET d4. Une
 * régénération du gabarit par le constructeur ramènerait le défaut en silence.
 */
describe('les dés de ressource de Cthulhu Hack', () => {
    it('portent des valeurs texte — une seule case allumée', () => {
        const gabarit = MOTEURS.find(g => g.id === 'cthulhu-hack');
        const des = champsDu(gabarit!).filter(c => /^resources\./.test(c.key)) as (ChampDuGabarit & { value?: unknown })[];
        expect(des).toHaveLength(15);
        expect(des.filter(c => typeof c.value !== 'string').map(c => c.label)).toEqual([]);
    });
});
