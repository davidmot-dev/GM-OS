import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    JETONS_DU_CONTRAT, PAIRES_DU_CONTRAT, HOTES_DE_POLICES, EMPLACEMENTS_D_ORNEMENT, VERSION_DU_CONTRAT,
} from '../src/theme/contratDuTheme';
import { pontVersLInterface } from '../src/theme/jetonsDeTheme';
import { JETONS_EDITABLES } from '../src/theme/editionDuTheme';

/**
 * **Le contrat en données dit la même chose que le cahier des charges.**
 *
 * Le cahier est lu par le constructeur de thèmes, dans ChatGPT ; le contrat en
 * données par GM-OS et son validateur. S'ils divergent, le constructeur suit
 * une règle que GM-OS ne vérifie pas — ou l'inverse. Cet essai lit **les
 * tableaux du cahier** et les compare au contrat, jeton par jeton.
 *
 * Quand il échoue, la question est toujours la même : *lequel des deux a
 * raison ?* On corrige celui-là, avec David si c'est le cahier.
 */

const CAHIER = fs.readFileSync(
    path.resolve(__dirname, '..', 'documentation', 'Architecture', 'Cahier-des-charges-theme-de-jeu.md'),
    'utf-8',
).replace(/\r\n/g, '\n');

interface LigneDuCahier { cle: string; section: string; statut: string; format: string }

/** Les lignes des tableaux de jetons, avec leur section et leur statut. */
function lignesDesTableaux(): LigneDuCahier[] {
    const lignes: LigneDuCahier[] = [];
    let section = '';
    let statutDeLaSection = '';
    for (const ligne of CAHIER.split('\n')) {
        const titre = /^#{2,3} ([\d.]+) ·(.*)$/.exec(ligne);
        if (titre) {
            section = titre[1];
            statutDeLaSection = /\bV2\b/.test(titre[2]) ? 'V2' : '';
            continue;
        }
        if (!ligne.startsWith('| `--rpg-')) continue;
        const cellules = ligne.split('|').slice(1, -1).map(c => c.trim());
        const statut = cellules.slice(1).map(c => /^(LU|V2|SDK)\b/.exec(c)?.[1]).find(Boolean) ?? statutDeLaSection;
        /* La colonne du format est celle qui suit le statut ; sans statut (§ 7), la dernière. */
        const iStatut = cellules.findIndex((c, i) => i > 0 && /^(LU|V2|SDK)\b/.test(c));
        const format = iStatut > 0 ? cellules[iStatut + 1] ?? '' : cellules[cellules.length - 1];
        for (const m of cellules[0].matchAll(/`--rpg-([\w-]+)`/g)) {
            lignes.push({ cle: m[1], section, statut, format });
        }
    }
    return lignes;
}

const LIGNES = lignesDesTableaux();
const ligne = (cle: string) => LIGNES.find(l => l.cle === cle)!;

describe('le contrat en données suit le cahier des charges', () => {
    it('la version est la même', () => {
        expect(CAHIER).toMatch(new RegExp(`\\*\\*Contrat v${VERSION_DU_CONTRAT.replace('.', '\\.')} —`));
    });

    it('les mêmes jetons, ni plus ni moins', () => {
        expect(LIGNES.length).toBeGreaterThan(40);
        expect(LIGNES.map(l => l.cle).sort()).toEqual(JETONS_DU_CONTRAT.map(j => j.cle).sort());
    });

    it.each(JETONS_DU_CONTRAT.map(j => [j.cle, j] as const))('--rpg-%s : même section, même statut', (cle, j) => {
        expect({ section: ligne(cle).section, statut: ligne(cle).statut }).toEqual({ section: j.section, statut: j.statut });
    });

    it('les mêmes jetons obligatoires (§ 13)', () => {
        const phrase = /Les jetons obligatoires sont présents :([^.]*)\./.exec(CAHIER)?.[1] ?? '';
        const duCahier = [...phrase.matchAll(/`([\w-]+)`/g)].map(m => m[1]).sort();
        expect(duCahier).toEqual(JETONS_DU_CONTRAT.filter(j => j.obligatoire).map(j => j.cle).sort());
    });

    it('les mêmes bornes', () => {
        for (const j of JETONS_DU_CONTRAT) {
            const format = ligne(j.cle).format;
            const f = j.format;
            if (f.type === 'longueur' || f.type === 'nombre') {
                const m = /`(-?[\d.]+)[a-z]*` à `(-?[\d.]+)[a-z]*`/.exec(format);
                expect(m, `--rpg-${j.cle} : « ${format} »`).not.toBeNull();
                expect([Number(m![1]), Number(m![2])], `--rpg-${j.cle}`).toEqual([f.min, f.max]);
            }
            if (f.type === 'rgba') {
                const m = /opacité \**([\d.]+) à ([\d.]+)/.exec(format);
                expect([Number(m?.[1]), Number(m?.[2])], `--rpg-${j.cle}`).toEqual([f.alphaMin, f.alphaMax]);
            }
            if (f.type === 'choix') {
                expect([...format.matchAll(/`([\w-]+)`/g)].map(m => m[1]), `--rpg-${j.cle}`).toEqual([...f.valeurs]);
            }
        }
    });

    it('les mêmes paires de contraste (§ 6)', () => {
        const etats = ['success', 'danger', 'warning', 'info'];
        const section = CAHIER.split('## 6 ·')[1].split('\n## ')[0];
        const duCahier: string[] = [];
        for (const l of section.split('\n').filter(x => x.startsWith('| ') && x.includes(' sur '))) {
            const [paire, minimum, recommande] = l.split('|').slice(1, -1).map(c => c.trim());
            const [gauche, ...droite] = paire.split(' sur ');
            const avants = /couleur d'état/.test(gauche) ? etats : [...gauche.matchAll(/`([\w-]+)`/g)].map(m => m[1]);
            const fonds = [...droite.join(' sur ').matchAll(/`([\w-]+)`/g)].map(m => m[1]);
            for (const a of avants) {
                for (const f of fonds) duCahier.push(`${a}/${f} ${minimum.replace(/\*/g, '')} ${recommande}`);
            }
        }
        expect(duCahier.sort()).toEqual(PAIRES_DU_CONTRAT.map(p => `${p.avant}/${p.fond} ${p.minimum} ${p.recommande}`).sort());
    });

    it('les mêmes hôtes de polices (§ 3.6)', () => {
        const phrase = CAHIER.split('\n').find(l => l.includes('uniquement**') && l.includes('fonts.'))!;
        expect([...phrase.matchAll(/`([\w.-]+)`/g)].map(m => m[1])).toEqual([...HOTES_DE_POLICES]);
    });

    it('les mêmes emplacements d\'ornement (§ 8)', () => {
        const bloc = /## 8 ·[\s\S]*?```json\n([\s\S]*?)```/.exec(CAHIER)![1];
        expect(Object.keys(JSON.parse(bloc))).toEqual([...EMPLACEMENTS_D_ORNEMENT]);
    });
});

describe('ce que GM-OS applique est dérivé du contrat', () => {
    it('le pont transporte exactement les jetons qui déclarent une variable de l\'interface', () => {
        const tous = Object.fromEntries(JETONS_DU_CONTRAT.map(j => [j.cle, 'x']));
        const attendues = JETONS_DU_CONTRAT.filter(j => j.versLInterface).map(j => j.versLInterface).sort();
        expect(Object.keys(pontVersLInterface(tous)).sort()).toEqual(attendues);
    });

    it('seuls des jetons LU atteignent l\'interface', () => {
        for (const j of JETONS_DU_CONTRAT.filter(x => x.versLInterface)) expect(j.statut, j.cle).toBe('LU');
    });

    /*
      L'atelier de thème dit au meneur quels réglages atteignent l'écran
      (`surLInterface`). Un drapeau écrit à la main qui contredirait le contrat
      promettrait un effet qui n'arrive pas — ou en cacherait un.
    */
    it('l\'atelier de thème dit « sur l\'interface » exactement pour les jetons LU', () => {
        for (const e of JETONS_EDITABLES) {
            const j = JETONS_DU_CONTRAT.find(x => x.cle === e.cle);
            expect(j, `${e.cle} est éditable mais hors contrat`).toBeDefined();
            expect(Boolean(e.surLInterface), e.cle).toBe(j!.statut === 'LU');
        }
    });
});
