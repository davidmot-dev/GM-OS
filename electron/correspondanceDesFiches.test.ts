import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    lireLaCorrespondance, verifierLaCorrespondance, cheminDeLaCorrespondance,
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

/** Les jeux qui déclarent une correspondance, découverts et non recopiés. */
const AVEC_TABLE = fs
    .readdirSync(SYSTEMES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(jeu => fs.existsSync(path.join(SYSTEMES, jeu, 'fiche', 'correspondance.json')));

const MOTEURS = gabaritsDuMoteur();

function tableDe(jeu: string): CorrespondanceDeFiche {
    const chemin = path.join(SYSTEMES, jeu, 'fiche', 'correspondance.json');
    const table = lireLaCorrespondance(fs.readFileSync(chemin, 'utf8'), `docs/${cheminDeLaCorrespondance(`systems/${jeu}`)}`);
    expect(table, `la table de ${jeu}`).not.toBeNull();
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
