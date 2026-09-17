import { describe, it, expect } from 'vitest';
import {
    BUDGET_DU_PONT,
    CADENCE_NOMINALE,
    EFFETS_ADAPTATIFS,
    estSoliste,
    solistesAdmis,
} from './solistesDeLEffet';
import MOTEUR from '../HueEngine.ts?raw';
import { imagesDuSouffle, SOUFFLES } from './souffle';
import { IMAGES_DE_DEFLAGRATION } from './deflagration';

/**
 * ⭐ **Les effets dont la cadence ne vit plus dans le moteur.**
 *
 * Depuis le 2026-09-17, quatre effets écrivent `interval = image.interval` : leur
 * rythme est une **table d'images-clés** dans un module à part, pas une suite de
 * nombres posés dans des branches.
 *
 * ⚠️ **L'analyseur ci-dessous avait une hypothèse de repli** — *« pas de nombre
 * écrit ⇒ l'effet garde les 250 ms par défaut de la boucle »* — et cette
 * hypothèse est devenue fausse le jour où une cinquième façon d'écrire une
 * cadence est apparue. Il a donc dénoncé quatre effets lents comme s'ils
 * saturaient le pont.
 *
 * *Un repli est une supposition écrite une fois pour toutes ; il vieillit comme
 * tout le reste.* On ne l'assouplit pas, on lui apprend la nouvelle famille — et
 * on va chercher les vraies valeurs **à la source**, pas dans une copie.
 */
const CADENCE_AILLEURS: Record<string, () => number[]> = {
    breathing: () => imagesDuSouffle(SOUFFLES.respiration).map(i => i.interval),
    arcane: () => imagesDuSouffle(SOUFFLES.arcane).map(i => i.interval),
    underwater: () => imagesDuSouffle(SOUFFLES.underwater).map(i => i.interval),
    zen: () => imagesDuSouffle(SOUFFLES.zen).map(i => i.interval),
    deflagration: () => IMAGES_DE_DEFLAGRATION.map(i => i.interval),
};

/**
 * **Ce que ces essais protègent : un effet rapide ne joue que sur autant de
 * lampes que le pont peut en servir.**
 *
 * ⛔ Le pont tient dix commandes par seconde, toutes lampes confondues. Douze
 * effets à cadence soutenue dépassaient ce budget dès quatre lampes, et les
 * trois plus rapides d'un facteur quatre — *sans que rien ne le signale, parce
 * qu'un pont en retard ne se voit pas à l'écran.*
 */

/** Ce que le moteur écrit vraiment comme attente, effet par effet. */
const cadencesDuMoteur = (): Record<string, number[]> => {
    const debut = MOTEUR.indexOf('const loop = async () => {');
    const boucle = MOTEUR.slice(debut, MOTEUR.indexOf('// Apply global brightness', debut));
    const cas = [...boucle.matchAll(/case '([a-z-]+)':/g)];
    const releve: Record<string, number[]> = {};

    /*
      ⚠️ **Deux `case` peuvent partager un corps** — `candle`/`fire` et
      `glitch`/`tv`. Une première version s'arrêtait à l'absence de `break;` et
      **laissait donc tomber l'étiquette du dessus** : `candle` et `glitch`
      n'étaient examinés par personne, et échappaient au rationnement en
      silence. *Un analyseur qui ignore ce qu'il ne sait pas lire ressemble à un
      analyseur qui n'a rien trouvé.*

      On accumule donc les étiquettes jusqu'au corps qui les suit, et on le leur
      attribue à toutes.
    */
    let enAttente: string[] = [];
    cas.forEach((m, i) => {
        enAttente.push(m[1]);
        const corps = boucle.slice(m.index!, cas[i + 1]?.index ?? boucle.length);
        if (!corps.includes('break;')) return;
        const vals = [...corps.matchAll(/interval = (\d+)/g)].map(x => Number(x[1]));
        enAttente.forEach(nom => {
            if (CADENCE_AILLEURS[nom]) {
                /* Sa cadence est déclarée dans un module : on la lit là-bas. */
                releve[nom] = CADENCE_AILLEURS[nom]();
            } else {
                /* Sans `interval = …`, l'effet garde le défaut de la boucle. */
                releve[nom] = vals.length ? vals : [250];
            }
        });
        enAttente = [];
    });
    return releve;
};

describe('la table des cadences ne doit pas dériver du moteur', () => {
    const moteur = cadencesDuMoteur();

    /**
     * ⛔ **Le vrai risque de cette conception.** La table recopie des valeurs
     * qui vivent dans `HueEngine` — *une seconde déclaration de la même vérité
     * dérive toujours*, et ce dépôt l'a payé cinq fois le 2026-08-24. Cet essai
     * est la seule chose qui fasse rougir la dérive au lieu de la laisser se
     * taire.
     */
    it('chaque cadence déclarée est celle que le moteur écrit', () => {
        const fautives = Object.entries(CADENCE_NOMINALE).filter(
            ([effet, ms]) => !moteur[effet]?.includes(ms),
        );
        expect(fautives).toEqual([]);
    });

    /**
     * L'autre sens : un effet rapide **oublié** dans la table jouerait sur
     * toutes les lampes et noierait le pont — *le défaut d'origine, revenu par
     * la porte d'un ajout.*
     */
    it('aucun effet soutenu et rapide n’est absent de la table', () => {
        const oublies = Object.entries(moteur)
            .filter(([effet, vals]) => {
                if (CADENCE_NOMINALE[effet] || EFFETS_ADAPTATIFS.has(effet)) return false;
                /* Attente unique = cadence soutenue. Un effet qui alterne a un
                   pic haut mais une demande moyenne basse. */
                const uniques = [...new Set(vals)];
                if (uniques.length !== 1) return false;
                return (4 * 1000) / uniques[0] > BUDGET_DU_PONT;
            })
            .map(([effet]) => effet);
        expect(oublies).toEqual([]);
    });
});

describe('combien de solistes', () => {
    it('donne une lampe au plus rapide, trois au gyrophare', () => {
        expect(solistesAdmis('stroboscope')).toBe(1);
        expect(solistesAdmis('tv')).toBe(2);
        expect(solistesAdmis('police')).toBe(3);
    });

    /** Un effet assez lent pour que tout le monde joue n'a rien à se rationner. */
    it('ne limite pas les effets lents', () => {
        expect(solistesAdmis('zen')).toBeNull();
        expect(solistesAdmis('crepuscule')).toBeNull();
    });

    /**
     * ⭐ **La fusillade est exemptée, et il le faut.** Son principe *est* le tir
     * croisé sur toutes les lampes, et elle allonge déjà ses pauses selon leur
     * nombre. La rationner par-dessus l'étoufferait deux fois — *et il n'y a pas
     * de tir croisé à une lampe.*
     */
    it('laisse tranquilles les effets qui se rationnent eux-mêmes', () => {
        expect(solistesAdmis('fusillade')).toBeNull();
    });

    /** *Un effet qui ne joue sur aucune lampe n'est pas un rationnement, c'est
     *  une panne.* */
    it('en laisse toujours au moins une, même sur un budget absurde', () => {
        expect(solistesAdmis('stroboscope', 1)).toBe(1);
        expect(solistesAdmis('stroboscope', 0)).toBe(1);
    });

    /** Le budget n'est jamais dépassé par les solistes qu'on admet. */
    it.each(Object.keys(CADENCE_NOMINALE))('%s tient dans le budget', (effet) => {
        const admis = solistesAdmis(effet)!;
        expect((admis * 1000) / CADENCE_NOMINALE[effet]).toBeLessThanOrEqual(BUDGET_DU_PONT);
    });
});

describe('quelles lampes sont solistes', () => {
    const LAMPES = ['3', '1', '10', '2'];

    /**
     * ⚠️ **Le tri est ce qui rend le choix stable.** Les lampes d'une scène
     * démarrent l'une après l'autre : sans tri, la lampe soliste changerait à
     * chaque arrivée et elles oscilleraient entre les deux rôles — *ce qui
     * coûterait précisément les commandes qu'on veut économiser.*
     */
    it('retient les premières par identifiant, quel que soit l’ordre d’arrivée', () => {
        expect(estSoliste('1', LAMPES, 2)).toBe(true);
        expect(estSoliste('10', LAMPES, 2)).toBe(true);
        expect(estSoliste('2', LAMPES, 2)).toBe(false);
        expect(estSoliste('3', LAMPES, 2)).toBe(false);
    });

    it('ne retient personne en trop quand les lampes s’ajoutent', () => {
        /* La même lampe garde son rôle au fur et à mesure des arrivées. */
        expect(estSoliste('1', ['1'], 1)).toBe(true);
        expect(estSoliste('1', ['1', '2'], 1)).toBe(true);
        expect(estSoliste('1', ['1', '2', '3'], 1)).toBe(true);
        expect(estSoliste('2', ['1', '2', '3'], 1)).toBe(false);
    });

    it('laisse tout le monde jouer quand rien ne limite', () => {
        expect(estSoliste('9', LAMPES, null)).toBe(true);
    });

    /** *Une garde qui se trompe est pire qu'une garde absente* : dans le doute,
     *  on laisse jouer plutôt que d'éteindre. */
    it('laisse jouer une lampe qu’elle ne connaît pas', () => {
        expect(estSoliste('99', LAMPES, 1)).toBe(true);
    });
});

/**
 * ⭐ **La garde qui empêche le repli de mentir à nouveau.**
 *
 * Un effet qui écrit `interval = <quelque chose qui n'est pas un nombre>` sans
 * être déclaré dans `CADENCE_AILLEURS` retomberait sur le défaut de 250 ms —
 * *et serait jugé sur une cadence qui n'est pas la sienne.* Selon le sens de
 * l'erreur, il passerait pour un noyeur de pont ou, bien pire, pour sage.
 */
describe('aucun effet ne cache sa cadence', () => {
    it('tout `interval` calculé est déclaré quelque part', () => {
        const debut = MOTEUR.indexOf('const loop = async () => {');
        const boucle = MOTEUR.slice(debut, MOTEUR.indexOf('// Apply global brightness', debut));
        const cas = [...boucle.matchAll(/case '([a-z-]+)':/g)];

        let enAttente: string[] = [];
        const muets: string[] = [];
        cas.forEach((m, i) => {
            enAttente.push(m[1]);
            const corps = boucle.slice(m.index!, cas[i + 1]?.index ?? boucle.length);
            if (!corps.includes('break;')) return;
            const calcule = /interval = (?!\d)/.test(corps);
            enAttente.forEach(nom => {
                if (!calcule) return;
                if (CADENCE_AILLEURS[nom] || EFFETS_ADAPTATIFS.has(nom)) return;
                muets.push(nom);
            });
            enAttente = [];
        });
        expect(muets).toEqual([]);
    });
});
