import { describe, it, expect } from 'vitest';
import {
    SENS_PAR_DEFAUT,
    appliquerLUsure,
    apresChangementDeSens,
    borner,
    departDeLaJauge,
    elleSeVide,
    estCritique,
    graviteDeLaJauge,
    margeAvantLeBout,
    pasDuClicPrincipal,
    sensDe,
    usureDeLaScene,
    type JaugeOrientee,
    type SensDeLaJauge,
} from './sensDeLaJauge';

/**
 * **Une jauge qui se vide, et tout ce qui se trompait sans le savoir.**
 *
 * *David, le 2026-09-15 :* **« j'ai des jauges qui augmentent, mais je n'ai pas
 * de jauge qui diminue pour simuler la diminution de consommable »**.
 *
 * Descendre une jauge était possible depuis toujours. Ce qui manquait, c'est que
 * l'alarme, la naissance, le clic et la relecture savaient tous **une seule
 * histoire** : celle d'une jauge qui monte.
 */

const jauge = (sur: Partial<JaugeOrientee & { id: string; name: string }> = {}) => ({
    id: 'j', name: 'Jauge', totalSegments: 6, filledSegments: 0, ...sur,
});

const rations = (restantes: number, pasParScene?: number) => jauge({
    id: 'rations', name: 'Rations', sens: 'epuisement' as SensDeLaJauge,
    totalSegments: 6, filledSegments: restantes, pasParScene,
});

describe('le sens d’une jauge', () => {
    /**
     * ⚠️ **La migration, et c'est le test qui la tient.** Les jauges d'hier
     * n'ont pas de sens : elles doivent monter et crier au plein, exactement
     * comme avant ce champ.
     */
    it('est le remplissage quand rien n’est déclaré', () => {
        expect(sensDe({})).toBe('remplissage');
        expect(SENS_PAR_DEFAUT).toBe('remplissage');
        expect(elleSeVide({})).toBe(false);
    });

    it('se lit tel qu’il est déclaré', () => {
        expect(sensDe({ sens: 'epuisement' })).toBe('epuisement');
        expect(elleSeVide({ sens: 'epuisement' })).toBe(true);
    });
});

describe('départDeLaJauge — où en est une jauge qu’on vient de poser', () => {
    /** On ne commence pas une expédition sans vivres. */
    it('remplit un consommable à sa naissance', () => {
        expect(departDeLaJauge('epuisement', 6)).toBe(6);
    });

    it('laisse une jauge de tension à zéro, comme avant', () => {
        expect(departDeLaJauge('remplissage', 6)).toBe(0);
    });

    it('ne rend jamais de départ absurde', () => {
        expect(departDeLaJauge('epuisement', Number.NaN)).toBe(0);
        expect(departDeLaJauge('epuisement', -3)).toBe(0);
    });
});

describe('estCritique — le bout de la course qui fait mal', () => {
    /**
     * ⛔ **Le défaut que tout ce module corrige.** L'écran criait au plein :
     * sur des provisions, il criait la bonne nouvelle et se taisait sur la
     * mauvaise.
     */
    it('crie au VIDE pour un consommable, et se tait quand il est plein', () => {
        expect(estCritique(rations(0))).toBe(true);
        expect(estCritique(rations(6))).toBe(false);
        expect(estCritique(rations(1))).toBe(false);
    });

    it('crie au PLEIN pour une jauge de tension, comme avant', () => {
        expect(estCritique(jauge({ filledSegments: 6 }))).toBe(true);
        expect(estCritique(jauge({ filledSegments: 0 }))).toBe(false);
    });

    /** Une jauge neuve part pleine : elle ne doit pas naître en hurlant. */
    it('ne déclenche pas l’alarme sur un consommable qu’on vient de créer', () => {
        expect(estCritique(rations(departDeLaJauge('epuisement', 6)))).toBe(false);
    });

    /** Une jauge sans course n'est critique dans aucun sens. */
    it.each([0, -1, Number.NaN])('reste muette avec %s segment(s)', (total) => {
        expect(estCritique(jauge({ totalSegments: total as number, filledSegments: 0 }))).toBe(false);
        expect(estCritique({ sens: 'epuisement', totalSegments: total as number, filledSegments: 0 }))
            .toBe(false);
    });

    it('ne prend pas un compte illisible pour un bout de course', () => {
        expect(estCritique(jauge({ filledSegments: Number.NaN }))).toBe(false);
    });

    /** Un dépassement compte comme le bout : on ne rate pas l'alarme. */
    it('crie encore si le compte a dépassé sa borne', () => {
        expect(estCritique(jauge({ filledSegments: 9 }))).toBe(true);
        expect(estCritique(rations(-2))).toBe(true);
    });
});

describe('la gravité — le code couleur', () => {
    /**
     * *David, le 2026-09-15 :* **« est-ce qu'on pourrait introduire un code
     * couleur (orange, rouge) quand cela s'épuise ? »**
     *
     * ⚠️ **Les seuils sont en FRACTION de la course, pas en segments comptés.**
     * Une jauge de quatre et une jauge de douze doivent s'alarmer *au même
     * endroit de leur course* ; deux segments avant la fin laisseraient une
     * jauge de douze muette pendant ses neuf premiers.
     *
     * Ces trois tableaux SONT la décision : s'ils changent, c'est le moment
     * où le meneur voit venir le manque qui change.
     */
    const echelle = (total: number, restants: number) =>
        graviteDeLaJauge({ totalSegments: total, filledSegments: restants, sens: 'epuisement' });

    it.each([
        [6, 6, 'calme'], [6, 5, 'calme'], [6, 4, 'calme'],
        [6, 3, 'tension'], [6, 2, 'tension'],
        [6, 1, 'urgence'],
        [6, 0, 'critique'],
    ])('sur %s segments, %s restants → %s', (total, restants, attendu) => {
        expect(echelle(total as number, restants as number)).toBe(attendu);
    });

    it.each([
        [4, 4, 'calme'], [4, 3, 'calme'],
        [4, 2, 'tension'],
        [4, 1, 'urgence'],
        [4, 0, 'critique'],
    ])('sur %s segments, %s restants → %s', (total, restants, attendu) => {
        expect(echelle(total as number, restants as number)).toBe(attendu);
    });

    /** ⚠️ Le cas qui écarte les seuils comptés en segments. */
    it.each([
        [12, 12, 'calme'], [12, 7, 'calme'],
        [12, 6, 'tension'], [12, 4, 'tension'],
        [12, 3, 'urgence'], [12, 1, 'urgence'],
        [12, 0, 'critique'],
    ])('sur %s segments, %s restants → %s', (total, restants, attendu) => {
        expect(echelle(total as number, restants as number)).toBe(attendu);
    });

    /**
     * ⚠️ **La même grammaire dans les deux sens** — tranché par David avec les
     * seuils. *Deux jauges côte à côte doivent se lire pareil, sinon la couleur
     * ne veut plus rien dire.* Conséquence assumée : les jauges existantes
     * changent d'apparence.
     */
    it.each([
        [0, 'calme'], [2, 'calme'],
        [3, 'tension'], [4, 'tension'],
        [5, 'urgence'],
        [6, 'critique'],
    ])('une jauge qui MONTE à %s/6 est « %s »', (remplis, attendu) => {
        expect(graviteDeLaJauge(jauge({ filledSegments: remplis as number }))).toBe(attendu);
    });

    /** `critique` se ramène à `estCritique` : un seul bout, une seule définition. */
    it('ne connaît pas deux bouts différents', () => {
        for (let n = 0; n <= 6; n++) {
            const v = rations(n);
            expect(graviteDeLaJauge(v) === 'critique').toBe(estCritique(v));
        }
    });

    it('reste calme sur une jauge sans course', () => {
        expect(graviteDeLaJauge(jauge({ totalSegments: 0 }))).toBe('calme');
        expect(margeAvantLeBout(jauge({ totalSegments: 0 }))).toBe(1);
    });

    it('ne se laisse pas troubler par un compte illisible', () => {
        expect(margeAvantLeBout(jauge({ filledSegments: Number.NaN }))).toBe(1);
        expect(graviteDeLaJauge(jauge({ filledSegments: Number.NaN }))).toBe('calme');
    });

    it('borne la marge à [0, 1] même si le compte a débordé', () => {
        expect(margeAvantLeBout(rations(99))).toBe(1);
        expect(margeAvantLeBout(rations(-5))).toBe(0);
    });
});

describe('pasDuClicPrincipal — le geste de la soirée', () => {
    it('consomme sur une jauge qui se vide', () => {
        expect(pasDuClicPrincipal({ sens: 'epuisement' })).toBe(-1);
    });

    it('monte sur une jauge de tension, comme avant', () => {
        expect(pasDuClicPrincipal({})).toBe(1);
        expect(pasDuClicPrincipal({ sens: 'remplissage' })).toBe(1);
    });
});

describe('borner', () => {
    it('tient la jauge dans sa course', () => {
        expect(borner(9, 6)).toBe(6);
        expect(borner(-2, 6)).toBe(0);
        expect(borner(3, 6)).toBe(3);
    });

    it('rend zéro de ce qui n’est pas un nombre', () => {
        expect(borner(Number.NaN, 6)).toBe(0);
        expect(borner(3, Number.NaN)).toBe(0);
    });
});

describe('apresChangementDeSens — on s’est trompé de jauge', () => {
    /**
     * ⛔ Le cas courant : on pose « Alerte » à zéro, puis on se dit que c'était
     * « Rations ». Sans cette règle, les vivres seraient vides — et hurlants —
     * dès la première seconde.
     */
    it('replace une jauge neuve au départ de son nouveau sens', () => {
        expect(apresChangementDeSens(jauge({ filledSegments: 0 }), 'epuisement')).toBe(6);
    });

    it('replace aussi dans l’autre sens', () => {
        expect(apresChangementDeSens(rations(6), 'remplissage')).toBe(0);
    });

    /** ⚠️ *Deviner est bienvenu tant qu'il n'y a rien à perdre.* */
    it('garde le compte d’une jauge déjà jouée', () => {
        expect(apresChangementDeSens(jauge({ filledSegments: 3 }), 'epuisement')).toBe(3);
        expect(apresChangementDeSens(rations(2), 'remplissage')).toBe(2);
    });

    it('ne touche à rien quand le sens ne change pas', () => {
        expect(apresChangementDeSens(jauge({ filledSegments: 3 }), 'remplissage')).toBe(3);
        expect(apresChangementDeSens(rations(2), 'epuisement')).toBe(2);
    });

    it('borne un compte qui aurait débordé', () => {
        expect(apresChangementDeSens(jauge({ filledSegments: 99 }), 'epuisement')).toBe(6);
    });
});

describe('usureDeLaScene — ce qu’une fin de scène coûte', () => {
    /** Le cas de David : une ration par scène. */
    it('retire son pas à un consommable', () => {
        const usures = usureDeLaScene([rations(4, 1)]);

        expect(usures).toEqual([
            { id: 'rations', nom: 'Rations', avant: 4, apres: 3, devientCritique: false, seVide: true },
        ]);
    });

    /**
     * ⚠️ **Le pas est stocké POSITIF, et c'est le sens qui décide.** Un rituel
     * qui avance d'un segment par scène s'écrit avec le même `1` que des vivres
     * qui en perdent un. *Stocker un signe aurait créé deux façons d'écrire la
     * même intention.*
     */
    it('AJOUTE son pas à une jauge qui monte, avec le même nombre', () => {
        const usures = usureDeLaScene([jauge({ id: 'rituel', name: 'Rituel', filledSegments: 2, pasParScene: 1 })]);

        expect(usures).toEqual([
            { id: 'rituel', nom: 'Rituel', avant: 2, apres: 3, devientCritique: false, seVide: false },
        ]);
    });

    it('signale le passage au bout, et lui seul', () => {
        expect(usureDeLaScene([rations(1, 1)])[0].devientCritique).toBe(true);
        expect(usureDeLaScene([rations(2, 1)])[0].devientCritique).toBe(false);
    });

    /**
     * ⚠️ Sinon chaque fin de scène annoncerait « Rations : 0 → 0 » jusqu'à la
     * fin de la campagne, et l'annonce qui compte se noierait dans les autres.
     */
    it('ne dit rien d’une jauge déjà au bout', () => {
        expect(usureDeLaScene([rations(0, 1)])).toEqual([]);
        expect(usureDeLaScene([jauge({ filledSegments: 6, pasParScene: 1 })])).toEqual([]);
    });

    it('ne touche pas aux jauges qui ne déclarent aucun pas', () => {
        expect(usureDeLaScene([rations(4), jauge({ filledSegments: 2 })])).toEqual([]);
    });

    it('borne le pas à la course de la jauge', () => {
        const usures = usureDeLaScene([rations(2, 5)]);

        expect(usures[0]).toMatchObject({ avant: 2, apres: 0, devientCritique: true });
    });

    it.each([0, -1, Number.NaN])('ignore un pas de %s', (pas) => {
        expect(usureDeLaScene([rations(4, pas as number)])).toEqual([]);
    });

    it('ignore une jauge sans course', () => {
        expect(usureDeLaScene([rations(0, 1)].map(j => ({ ...j, totalSegments: 0 })))).toEqual([]);
    });

    it('n’exige aucune jauge', () => {
        expect(usureDeLaScene(undefined)).toEqual([]);
        expect(usureDeLaScene([])).toEqual([]);
    });

    it('traite plusieurs jauges d’un même coup de scène', () => {
        const usures = usureDeLaScene([
            rations(4, 1),
            jauge({ id: 'alerte', name: 'Alerte', filledSegments: 1, pasParScene: 2 }),
            jauge({ id: 'inerte', name: 'Inerte', filledSegments: 1 }),
        ]);

        expect(usures.map(u => u.id)).toEqual(['rations', 'alerte']);
    });
});

describe('appliquerLUsure', () => {
    it('écrit le nouveau compte sur les jauges concernées', () => {
        const liste = [rations(4, 1), jauge({ id: 'autre', name: 'Autre', filledSegments: 2 })];
        const apres = appliquerLUsure(liste, usureDeLaScene(liste));

        expect(apres[0].filledSegments).toBe(3);
        expect(apres[1].filledSegments).toBe(2);
    });

    /**
     * ⚠️ **La même liste, par référence.** Une fin de scène sans jauge usable
     * est le cas courant ; réécrire la liste ferait repeindre quatre écrans et
     * repartir une diffusion réseau pour rien.
     */
    it('rend la liste d’origine quand rien ne bouge', () => {
        const liste = [rations(4), jauge({ filledSegments: 2 })];

        expect(appliquerLUsure(liste, [])).toBe(liste);
    });

    it('ne touche pas les objets qui ne bougent pas', () => {
        const intacte = jauge({ id: 'autre', name: 'Autre', filledSegments: 2 });
        const liste = [rations(4, 1), intacte];

        expect(appliquerLUsure(liste, usureDeLaScene(liste))[1]).toBe(intacte);
    });

    it('n’exige aucune jauge', () => {
        expect(appliquerLUsure(undefined, [])).toEqual([]);
    });
});

/* ──────────────────────────── La garde du dépôt ──────────────────────────── */

const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

function sansCommentaires(source: string): string {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
}

/** Le geste : décider qu'une jauge est au bout de sa course. */
const COMPARAISON_AU_PLEIN = /filledSegments\s*>=\s*[\w.]*[Tt]otalSegments/;

describe('la décision « cette jauge est au bout »', () => {
    /**
     * ⛔ **Elle ne s'écrit qu'ici.** `NarrativeClock` la portait, écrite à la
     * main, et c'est exactement pour ça qu'elle ignorait le sens : la règle
     * vivait dans le rendu, où personne ne va la chercher quand on ajoute un
     * champ au modèle. *Une comparaison recopiée dans un écran est une règle que
     * les trois autres ne connaîtront jamais.*
     */
    it('ne s’écrit qu’à un seul endroit', () => {
        expect(Object.keys(sources).length).toBeGreaterThan(150);

        const juges = Object.entries(sources)
            .filter(([chemin]) => !chemin.endsWith('.test.ts') && !chemin.endsWith('.test.tsx'))
            .filter(([, source]) => COMPARAISON_AU_PLEIN.test(sansCommentaires(source)))
            .map(([chemin]) => chemin);

        expect(juges, [
            'Comparer le compte au total à la main ignore le sens de la jauge :',
            'c’est ainsi que des provisions pleines criaient au danger le 2026-09-15.',
            'Passez par `estCritique(jauge)`.',
        ].join(' ')).toEqual(['/src/modules/clock/logic/sensDeLaJauge.ts']);
    });
});
