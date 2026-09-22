import { describe, it, expect } from 'vitest';
import {
    importanceDeLaScene, styleDuTitre, couleurDuLisere, lisereEstPointille,
    infobulle, infobulleDeLImportance, IMPORTANCES, LIBELLE_DE_L_IMPORTANCE,
} from './importanceDeLaScene';
import { clonerLaScene, secondeMoitieDeLaScene, fusionnerLesScenes, remplissageDeLaScene } from './trame';
import { segmentDeLecture } from '../../remote/segmentDeLecture';
import type { Scene } from '../../../types/trame.types';

/* Les quatre écrans qui affichent une ligne de scène. Lus en source plus bas. */
import TRAME from '../components/TrameDashboard.tsx?raw';
import PREPARATION from '../components/PanneauDeTrameDeSeance.tsx?raw';
import EN_SEANCE from '../components/PanneauDeTrameEnCours.tsx?raw';
import TABLETTE from '../../remote/components/RemoteNotes.tsx?raw';

/**
 * **Le rang d'une scène dans l'intrigue** — demandé par David le 2026-09-22 :
 * *« indiquer qu'une scène fait partie de l'intrigue principale, ou est
 * secondaire, voire optionnelle, et que cela se reflète visuellement ».*
 *
 * ⭐ **Ce que ces essais gardent avant tout : les scènes d'hier.** Aucune des
 * vingt-neuf scènes du « Secret de Milo » ne porte ce champ, et chacune doit
 * s'afficher exactement comme la veille. *Un champ neuf ne doit jamais rendre
 * faux ce qui marchait avant lui.*
 */

const sceneNue = (extra: Partial<Scene> = {}): Scene => ({
    id: 's1', campaignId: 'c1', acteId: 'a1', ordre: 1,
    titre: 'L’entrepôt du port', resume: '', origine: 'preparee',
    entiteIds: [], indiceIds: [], creeeLe: 1_000, ...extra,
});

describe('l’absence n’est pas un rang', () => {
    /**
     * ⚠️ **Le cœur de la décision.** Une scène sans réponse n'est pas
     * « secondaire » : elle n'a pas été jugée. Choisir un défaut aurait classé
     * d'autorité toutes les scènes écrites avant ce champ.
     */
    it('une scène sans champ n’est pas classée', () => {
        expect(importanceDeLaScene(sceneNue())).toBeNull();
        expect(importanceDeLaScene(undefined)).toBeNull();
        expect(importanceDeLaScene(null)).toBeNull();
    });

    it('et elle ne reçoit AUCUNE classe — donc l’apparence d’hier', () => {
        expect(styleDuTitre(null)).toBe('');
        expect(couleurDuLisere(null)).toBe('transparent');
        expect(infobulleDeLImportance(null)).toBeUndefined();
    });

    /**
     * ⭐ **Secondaire ne rend rien non plus, et c'est voulu.** C'est le rang
     * médian : lui donner un style aurait fait bouger l'écran pour une scène
     * dont le meneur dit précisément qu'elle est ordinaire.
     */
    it('« secondaire » rend l’apparence d’hier, comme l’absence', () => {
        expect(styleDuTitre('secondaire')).toBe(styleDuTitre(null));
        expect(couleurDuLisere('secondaire')).toBe(couleurDuLisere(null));
    });

    /**
     * ⛔ **Une valeur inconnue rend `null`, jamais elle-même.** Elle irait
     * sinon chercher une classe absente des tables, donc `undefined`, donc
     * `class="undefined"` dans le DOM — un titre sans style inexplicable. *La
     * leçon du titre projeté, la veille : une valeur fausse se rattrape à
     * l'entrée ou pas du tout.*
     */
    it('refuse une valeur inconnue au lieu de la laisser filer', () => {
        expect(importanceDeLaScene({ importance: 'majeure' })).toBeNull();
        expect(importanceDeLaScene({ importance: '' })).toBeNull();
        expect(importanceDeLaScene({ importance: 42 })).toBeNull();
        expect(importanceDeLaScene({ importance: true })).toBeNull();
    });
});

describe('les trois rangs se distinguent', () => {
    it('garde les trois valeurs', () => {
        for (const rang of IMPORTANCES) {
            expect(importanceDeLaScene(sceneNue({ importance: rang }))).toBe(rang);
        }
    });

    /**
     * **Le poids se lit dans les DEUX mondes de style.** Le titre est en
     * `font-bold` par défaut sur la tablette et en poids normal chez le meneur :
     * d'où `font-black` d'un côté et `font-normal` de l'autre, sans quoi une
     * scène optionnelle paraîtrait plus appuyée qu'une secondaire sur la
     * tablette.
     */
    it('l’intrigue principale est plus lourde, l’optionnelle plus légère', () => {
        expect(styleDuTitre('principale')).toContain('font-black');
        expect(styleDuTitre('optionnelle')).toContain('italic');
        expect(styleDuTitre('optionnelle')).toContain('font-normal');
    });

    it('le liseré est plein pour la principale, pointillé pour l’optionnelle', () => {
        expect(couleurDuLisere('principale')).not.toBe('transparent');
        expect(couleurDuLisere('optionnelle')).not.toBe('transparent');
        expect(lisereEstPointille('optionnelle')).toBe(true);
        expect(lisereEstPointille('principale')).toBe(false);
        expect(lisereEstPointille(null)).toBe(false);
    });

    /** ⚠️ Trois rangs qui rendraient la même chose ressemblent à trois rangs qui marchent. */
    it('les trois apparences sont bel et bien différentes', () => {
        const rendus = [...IMPORTANCES, null].map(r =>
            `${styleDuTitre(r)}|${couleurDuLisere(r)}|${lisereEstPointille(r)}`);
        /* « secondaire » et « non classée » sont volontairement identiques : on
           attend donc trois apparences distinctes pour quatre états. */
        expect(new Set(rendus).size).toBe(3);
    });

    it('chaque rang a son libellé', () => {
        for (const rang of IMPORTANCES) {
            expect(LIBELLE_DE_L_IMPORTANCE[rang]).toBeTruthy();
            expect(infobulleDeLImportance(rang)).toBe(LIBELLE_DE_L_IMPORTANCE[rang]);
        }
    });
});

/**
 * **L'infobulle se compose, elle ne se remplace pas.**
 *
 * Trois des quatre écrans posaient déjà un `title` — « Close avec son acte, sans
 * avoir été jouée », ou le titre entier quand il est tronqué. *Y écrire le rang
 * aurait échangé une information rare contre une information qu'on voit déjà.*
 */
describe('l’infobulle', () => {
    it('joint ce qu’elle reçoit et laisse tomber le vide', () => {
        expect(infobulle('Close sans avoir été jouée', 'Optionnelle'))
            .toBe('Close sans avoir été jouée — Optionnelle');
        expect(infobulle(undefined, 'Optionnelle')).toBe('Optionnelle');
        expect(infobulle(false, undefined)).toBeUndefined();
        expect(infobulle('  ', null)).toBeUndefined();
    });
});

/**
 * ⚠️ **Le rang n'entre PAS dans le taux de préparation.**
 *
 * Même raison que `personnagesIds`, écrite dans le type : classer une scène
 * n'est pas la préparer. *Le compter aurait fait chuter la pastille de toutes
 * les scènes déjà écrites, et pour une raison fausse.*
 */
describe('la pastille de préparation ne bouge pas', () => {
    it('classer une scène ne change pas son taux', () => {
        const nue = sceneNue({ resume: 'Un cadavre dans un conteneur.' });
        const classee = { ...nue, importance: 'principale' as const };

        expect(remplissageDeLaScene(classee)).toBe(remplissageDeLaScene(nue));
    });
});

/**
 * **Les trois gestes de curation gardent le rang.**
 *
 * Ils reconstruisent une scène, et deux d'entre eux l'ont déjà fait champ par
 * champ dans l'histoire de ce dépôt. *Un jugement du meneur qui disparaîtrait à
 * un clonage serait à refaire sans qu'aucun écran ne le dise.*
 */
describe('cloner, scinder, fusionner', () => {
    it('le clone garde le rang de l’originale', () => {
        const scene = sceneNue({ importance: 'principale' });
        expect(clonerLaScene(scene, 's2', 'L’entrepôt (2)', 2, 2_000).importance).toBe('principale');
    });

    it('la seconde moitié garde le rang : c’est le même moment qu’on coupe', () => {
        const scene = sceneNue({ importance: 'optionnelle' });
        expect(secondeMoitieDeLaScene(scene, 's2', 'suite', 2, 2_000).importance).toBe('optionnelle');
    });

    /** Le rang de la gardée l'emporte — comme son lieu et son ambiance. */
    it('la fusion garde le rang de celle qu’on garde', () => {
        const gardee = sceneNue({ importance: 'principale' });
        const absorbee = sceneNue({ id: 's2', importance: 'optionnelle' });

        expect(fusionnerLesScenes(gardee, absorbee).importance).toBe('principale');
    });
});

/**
 * ⛔⛔ **LE PONT VERS LA TABLETTE, ET POURQUOI CET ESSAI EXISTE.**
 *
 * `segmentDeLecture` reconstruit chaque scène **champ par champ** — la forme
 * exacte qui a jeté en silence les quatre réglages du titre projeté la veille,
 * le 2026-09-21. `RemoteScene` déclare donc `importance` **obligatoire**, pour
 * que `tsc` refuse un mappage qui l'oublie.
 *
 * ⭐ Et cet essai envoie des valeurs **qui ne sont pas les défauts** : *un essai
 * qui ne fournit que les défauts ne peut pas distinguer « transmis » de
 * « jeté »*.
 */
describe('le rang arrive jusqu’à la tablette', () => {
    const lire = (importance?: unknown) => segmentDeLecture('c1', {
        actes: [{ id: 'a1', campaignId: 'c1', ordre: 1, titre: 'Acte I', resume: '' }],
        scenes: [sceneNue({ importance: importance as never })],
    }).actes[0].scenes[0];

    it('transmet les trois rangs, et pas un défaut', () => {
        for (const rang of IMPORTANCES) expect(lire(rang).importance).toBe(rang);
    });

    it('transmet « non classée » comme null, jamais comme absent', () => {
        const scene = lire();
        expect(scene.importance).toBeNull();
        expect('importance' in scene, 'la clé doit exister, sinon rien ne dit qu’elle a été traitée').toBe(true);
    });

    /** La tablette ne rejuge rien : une valeur douteuse est normalisée ici. */
    it('normalise avant d’envoyer', () => {
        expect(lire('majeure').importance).toBeNull();
    });
});

/**
 * ⭐⭐ **LA GARDE DES QUATRE ÉCRANS.**
 *
 * Une ligne de scène s'affiche à quatre endroits — la trame, la préparation de
 * séance, le panneau en séance, la tablette. C'est la leçon de
 * `PastilleDePreparation`, et ce dépôt l'a payée assez souvent pour la mettre
 * sous essai : *quatre calculs séparés du même signe finissent par ne plus dire
 * la même chose de la même scène, et personne ne le verrait, puisque chaque
 * écran reste cohérent avec lui-même.*
 *
 * Aucun type ne peut exprimer cette règle — d'où la relecture de la source.
 */
describe('les quatre écrans emploient le même langage visuel', () => {
    const ecrans: [string, string][] = [
        ['la trame', TRAME],
        ['la préparation de séance', PREPARATION],
        ['le panneau en séance', EN_SEANCE],
        ['la tablette du meneur', TABLETTE],
    ];

    it.each(ecrans)('%s pose le liseré du rang', (_nom, source) => {
        expect(source).toContain('MarqueDIntrigue');
    });

    it.each(ecrans)('%s tient le poids du titre du module partagé', (_nom, source) => {
        expect(source).toContain('styleDuTitre');
    });

    /**
     * ⚠️ **Et il le pose sur l'élément du titre, pas ailleurs dans le fichier.**
     *
     * La première version de cet essai cherchait un `font-black` écrit à la main
     * n'importe où dans le fichier — elle a épinglé le titre d'un **acte**, en
     * gras depuis toujours et qui n'a rien à voir ici. *Un contrôle qui se
     * trompe est pire qu'un contrôle absent* : celui-ci remonte donc depuis
     * chaque `{scene.titre}` réellement rendu jusqu'à l'ouverture de son
     * élément.
     */
    it.each(ecrans)('%s habille l’élément du titre lui-même', (_nom, source) => {
        /* On ne retient que le titre **rendu à l'écran** : ni `${scene.titre}`
           dans une phrase de confirmation, ni `value={scene.titre}` dans le
           champ de l'éditeur. D'où le chevron fermant qui précède. */
        const rendus = [...source.matchAll(/>\s*\{scene\.titre\}/g)];
        expect(rendus.length, 'aucun titre de scène rendu — l’essai ne garderait rien').toBeGreaterThan(0);

        for (const rendu of rendus) {
            const element = source.slice(source.lastIndexOf('<span', rendu.index), rendu.index);
            expect(element, 'ce titre de scène s’habille sans passer par styleDuTitre')
                .toContain('styleDuTitre');
        }
    });
});
