import { describe, it, expect } from 'vitest';
import MOTEUR from './HueEngine.ts?raw';
import PIED_DE_PAGE from './components/BulbFooter.tsx?raw';
import FR from '../../locales/fr/modules.json';
import EN from '../../locales/en/modules.json';

/**
 * **Le catalogue d'effets doit rester cohérent avec ce qu'une ampoule Hue sait
 * faire — et avec lui-même.**
 *
 * Audit demandé par David le 2026-09-17 : *« peux-tu revoir les différents
 * effets et t'assurer de leur cohérence en fonction des possibilités du Philips
 * Hue ? »*. Il a trouvé **six défauts**, dont quatre qu'aucune relecture
 * n'aurait vus parce qu'ils ne cassent rien : ils rendent seulement l'effet
 * moins bon que ce que son code prétend.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES QUATRE RÈGLES, ET CE QU'ELLES ONT CHACUNE ATTRAPÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * | Règle | Le défaut qu'elle a trouvé |
 * | --- | --- |
 * | Tout effet codé est offrable | ⛔ **`warp`** — codé, nommé dans les deux langues, cité en exemple dans `useLightStore`, et **offert nulle part** |
 * | `bri` reste dans 1–254 | ⛔ `stroboscope` et `fantome` posaient **`bri: 0`**, hors plage — *et zéro n'éteint pas une lampe Hue, seul `on: false` le fait* |
 * | Tout `xy` passe par le calage de gamut | ⛔ `disco` tirait **`[Math.random(), Math.random()]`**, hors du triangle une fois sur deux, parfois invalide (`x + y > 1`) |
 * | Tout effet offert est traduit | *(rien pour l'instant — la règle garde la porte)* |
 *
 * ⚠️ **Ce que ce test ne prouve pas.** Il lit le source. Il ne dit rien de ce
 * que la pièce montre, ni du budget du pont — *dix commandes par seconde,
 * toutes lampes confondues*, que quatre lampes à 100 ms dépassent déjà d'un
 * facteur quatre. Cette limite-là ne se lit pas dans un fichier : elle se
 * mesure dans la pièce, et c'est la catégorie P6 du registre.
 */

/**
 * La zone du fichier où vivent les effets : la boucle et son `switch`.
 *
 * ⚠️ La fin se cherche **à partir du début**, pas depuis le haut du fichier :
 * le commentaire « Apply global brightness » apparaît **deux fois**, et sa
 * première occurrence est *avant* la boucle. Chercher naïvement rendait une
 * tranche vide — donc zéro effet, donc **deux règles qui passaient au vert
 * sans rien examiner**. *Un test qui ne trouve rien ressemble à un test qui
 * ne trouve rien à redire.*
 */
const DEBUT_BOUCLE = MOTEUR.indexOf('const loop = async () => {');
const BOUCLE = MOTEUR.slice(
    DEBUT_BOUCLE,
    MOTEUR.indexOf('// Apply global brightness', DEBUT_BOUCLE),
);

/** Les noms d'effets que le moteur sait jouer. */
const codes = [...BOUCLE.matchAll(/case '([a-z-]+)':/g)].map(m => m[1]);

/** Les noms d'effets que l'interface propose. */
const offerts = [...PIED_DE_PAGE.matchAll(/<option value="([a-z-]+)"/g)].map(m => m[1]);

/**
 * Les deux entrées de la liste qui ne sont **pas** des effets logiciels :
 * `none` arrête tout, `colorloop` est natif à l'ampoule et ne coûte aucune
 * commande. Ni l'une ni l'autre n'a de `case` dans la boucle — c'est normal.
 */
const HORS_BOUCLE = ['none', 'colorloop'];

/**
 * Les clés de traduction qui ne portent pas le nom de leur effet.
 *
 * *Un alias n'est pas un défaut, mais il doit être déclaré* : sans cette table,
 * la règle de traduction crierait sur deux cas justes, et **un contrôle qui se
 * trompe est pire qu'un contrôle absent.**
 */
const ALIAS: Record<string, string> = { lightning: 'storm', none: 'steady' };

const cleDeTraduction = (effet: string) => ALIAS[effet] ?? effet;

/**
 * Le gamut C, celui des ampoules Hue récentes — la même table que `HueEngine`.
 *
 * Recopiée ici **exprès** : un test qui importerait la constante du moteur
 * validerait le moteur contre lui-même. *Une valeur attendue n'a de valeur que
 * si elle peut contredire le code.*
 */
const GAMUT_C = { rouge: [0.692, 0.308], vert: [0.170, 0.700], bleu: [0.153, 0.048] };

/** Le point est-il dans le triangle ? Test des signes, comme dans le moteur. */
const dansLeGamutC = (x: number, y: number): boolean => {
    const [ax, ay] = GAMUT_C.rouge;
    const [bx, by] = GAMUT_C.vert;
    const [cx, cy] = GAMUT_C.bleu;
    const d = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) =>
        (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
    const d1 = d(x, y, ax, ay, bx, by);
    const d2 = d(x, y, bx, by, cx, cy);
    const d3 = d(x, y, cx, cy, ax, ay);
    const negatif = d1 < 0 || d2 < 0 || d3 < 0;
    const positif = d1 > 0 || d2 > 0 || d3 > 0;
    return !(negatif && positif);
};

describe('le catalogue des effets — cohérence interne', () => {
    /**
     * **La garde du test lui-même.** Les règles ci-dessous lisent une tranche de
     * source ; si la tranche est vide — un repère déplacé, un fichier
     * réorganisé — elles passeraient toutes au vert **sans rien examiner.**
     * *C'est exactement ce qui est arrivé en écrivant ce fichier.*
     */
    it('la tranche examinée contient bien le catalogue', () => {
        expect(DEBUT_BOUCLE).toBeGreaterThan(0);
        expect(codes.length).toBeGreaterThan(30);
    });

    /**
     * ⛔ **Le défaut qui a motivé ce fichier.** `warp` était fini : un `case`
     * dans le moteur, « Saut Spatial » en français, « Warp Speed » en anglais,
     * et jusqu'à une mention en exemple dans le commentaire de
     * `useLightStore`. Il manquait **une ligne** dans une liste déroulante.
     *
     * *C'est le septième « la chaîne est complète et le bouton manque au
     * bout » de ce dépôt — et le premier dans ce sens-là : d'habitude c'est le
     * moteur qui manque, ici c'est la porte.*
     */
    it('tout effet codé dans le moteur est proposé quelque part', () => {
        const injoignables = codes.filter(e => !offerts.includes(e));
        expect(injoignables).toEqual([]);
    });

    /**
     * L'inverse : une liste qui propose un effet que le moteur ne sait pas
     * jouer. Le `switch` n'a pas de `default`, donc le choix ne ferait
     * **rien** — sans message, sans erreur. *Une porte qui ouvre sur rien.*
     */
    it('tout effet proposé est jouable par le moteur', () => {
        const creux = offerts.filter(e => !codes.includes(e) && !HORS_BOUCLE.includes(e));
        expect(creux).toEqual([]);
    });

    it('tout effet proposé porte un nom dans les deux langues', () => {
        const fr = (FR as any).light.footer.effects;
        const en = (EN as any).light.footer.effects;
        const muets = offerts.filter(e => !fr[cleDeTraduction(e)] || !en[cleDeTraduction(e)]);
        expect(muets).toEqual([]);
    });
});

describe('le catalogue des effets — cohérence avec le matériel', () => {
    /**
     * ⛔ **La plage de brillance d'une lampe Hue est 1 à 254.** Zéro est hors
     * spécification : selon le micrologiciel il est rejeté — *une commande
     * perdue dans un budget qui en tient dix par seconde* — ou ramené à 1.
     *
     * **Dans les deux cas, il n'éteint pas.** Seul `on: false` coupe. Le temps
     * « noir » du stroboscope était donc un temps faible, ce qui aplatissait
     * tout le battement sans que rien ne le signale.
     */
    it('aucun effet ne demande une brillance nulle', () => {
        const assignations = [...BOUCLE.matchAll(/payload\.bri\s*=\s*([^;]+);/g)].map(m => m[1].trim());

        /*
          On ne regarde que les positions de **valeur**, jamais l'expression
          entière : un `tick % 2 === 0` contient un zéro qui ne dit rien de la
          brillance, et `Math.max(0, …)` est un plancher, pas une consigne.
          *Une règle qui crie sur un modulo se fait désactiver, puis oublier.*
        */
        const nulles = assignations.filter(
            expr => /^0$/.test(expr) || /\?\s*0\s*:/.test(expr) || /:\s*0\s*$/.test(expr),
        );
        expect(nulles).toEqual([]);
    });

    /**
     * ⛔ **Un point `xy` tiré au hasard n'est pas une couleur.** Le plan CIE
     * est bien plus large que le triangle d'une ampoule, et un couple dont la
     * somme dépasse 1 n'est même pas un point valide.
     *
     * `hexToXy` **cale** sur le gamut C — il ramène tout point extérieur sur
     * l'arête la plus proche. Le contourner, c'est laisser le pont décider à
     * notre place, et il ne décide pas la même chose selon le modèle.
     *
     * ⚠️ `applyXyVariance` est toléré ici, mais il **s'applique après** le
     * calage et en ressort : la variance qu'on croit poser n'est pas tout à
     * fait celle qu'on obtient, surtout sur une couleur déjà saturée. C'est un
     * constat ouvert, pas une régression — il demande de caler après variance,
     * donc de toucher aux huit effets qui s'en servent.
     */
    it('toute couleur est dans le triangle de la lampe', () => {
        const assignations = [...BOUCLE.matchAll(/payload\.xy\s*=\s*([^;]+);/g)].map(m => m[1]);

        const brutes = assignations.filter(expr => {
            /* Passé par le calage, ou dérivé d'une couleur déjà calée. */
            if (/hexToXy|applyXyVariance|baseXy/.test(expr)) return false;

            /* Un couple littéral est accepté s'il tombe dans le gamut.
               `lumiere-ville` en pose un : l'ambre sodium [0.55, 0.40], choisi
               à la main et parfaitement valide. *On refuse l'incalculable, pas
               le littéral.* */
            const litteral = expr.match(/^\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]\s*$/);
            if (litteral) return !dansLeGamutC(Number(litteral[1]), Number(litteral[2]));

            /* Tout le reste — un tirage, un calcul — ne peut pas être vérifié
               ici, donc ne doit pas exister ici. */
            return true;
        });

        expect(brutes).toEqual([]);
    });

    /**
     * ⚠️ **Un fondu plus long que le battement ne se voit jamais.**
     *
     * `transitiontime` est en **dixièmes de seconde** : `2` vaut 200 ms. Quand
     * il atteint ou dépasse l'attente du tour suivant, la commande d'après
     * arrive avant la fin du fondu — la lampe se contente de suivre, et la
     * forme voulue n'apparaît pas. *Un gyrophare qui fond n'est plus un
     * gyrophare : à 200 ms de fondu pour 300 ms de cycle, on ne voyait ni le
     * rouge ni le bleu, seulement le violet entre les deux.*
     *
     * ⭐ **Cette règle ne gardait d'abord que six effets choisis à la main**,
     * au motif écrit qu'*« apparier chaque `transitiontime` à son `interval` »*
     * était impossible, les deux étant posés par branches. **C'était une
     * limite supposée, pas mesurée.** Il suffit de lire les affectations *dans
     * l'ordre où elles sont écrites* : le fondu courant est le dernier posé
     * avant l'attente de la même branche.
     *
     * Une fois la limite levée, la règle a trouvé toute seule le défaut que la
     * version à six noms ne pouvait pas voir : **`trou-noir` fondait sur 2 s
     * pour un battement de 1 s.** *Une garde bornée par une hypothèse ne garde
     * que ce que l'hypothèse laissait passer.*
     */
    /** Le motif qui dit « cet effet emprunte la brillance de la lampe ». */
    const MOTIF_EMPRUNT = /\bbaseBri\b/;

    /**
     * ⭐ **La règle du dessous, mise à l'épreuve.**
     *
     * Elle a passé au vert sur un moteur où le défaut avait été **remis
     * exprès** — parce que son motif était mal écrit. Cet essai lui donne à
     * lire un corps qui emprunte et un corps qui n'emprunte pas : *si elle ne
     * sait pas dire lequel est lequel, ce n'est pas une garde.*
     */
    it('le détecteur d’emprunt sait reconnaître un emprunt', () => {
        expect(MOTIF_EMPRUNT.test('payload.bri = Math.round(baseBri * 0.15);')).toBe(true);
        expect(MOTIF_EMPRUNT.test('payload.bri = image.bri;')).toBe(false);
        /* Et il ne se laisse pas prendre par un nom qui contient l'autre. */
        expect(MOTIF_EMPRUNT.test('const monBaseBriCalcule = 3;')).toBe(false);
    });

    it('aucun effet ne fond plus longtemps qu’il n’attend', () => {
        const jeton = /payload\.transitiontime\s*=\s*(\d+)|interval\s*=\s*(\d+)/g;
        const fautifs: string[] = [];

        for (const [i, effet] of codes.entries()) {
            const debut = BOUCLE.indexOf(`case '${effet}':`);
            const suivant = codes[i + 1] ? BOUCLE.indexOf(`case '${codes[i + 1]}':`) : BOUCLE.length;
            const corps = BOUCLE.slice(debut, suivant);

            let fondu: number | null = null;
            for (const m of corps.matchAll(jeton)) {
                if (m[1] !== undefined) {
                    fondu = Number(m[1]);
                } else if (fondu !== null && fondu * 100 > Number(m[2])) {
                    fautifs.push(`${effet} : fondu ${fondu * 100} ms > battement ${m[2]} ms`);
                }
            }
        }
        expect(fautifs).toEqual([]);
    });

    /**
     * ⭐ **Aucun effet n'emprunte la brillance de la lampe.**
     *
     * ⛔ David le 2026-09-17, après avoir essayé tout le catalogue : *« je ne
     * suis pas convaincu par tous, par exemple respiration »*. Neuf effets
     * partaient de `baseBri`, la brillance **courante** de la lampe — que le
     * pied de page n'amorce jamais, puisqu'il ne pose que la couleur.
     *
     * | Lampe à | Part du cycle de `respiration` collée au plafond |
     * | --- | --- |
     * | 150 | 0 % |
     * | 200 | **31,8 %** |
     * | 254 | **50 %** |
     *
     * ⭐ ***Un effet qui part de la brillance courante n'a pas une forme, il en
     * a autant qu'il y a de lampes.*** La bougie en donnait l'exemple le plus
     * net : sur une lampe à fond, elle éclairait la pièce.
     *
     * *L'effet possède sa forme, le curseur possède son niveau* — l'intensité de
     * la tuile et la brillance globale s'appliquent par-dessus, dans
     * `brillanceEffective`, et nulle part ailleurs.
     *
     * ⚠️ `baseXy` reste permis, et la différence n'est pas une nuance : la
     * couleur est **choisie** pour l'effet avant qu'il démarre — par le pied de
     * page ou par la scène. Elle n'est pas empruntée à ce que la lampe faisait
     * avant.
     */
    it('aucun effet ne part de la brillance courante de la lampe', () => {
        /*
          ⛔ **Ce motif s'est d'abord écrit tout seul en caractères
          retour-arrière** : `\b` posé dans une chaîne au lieu d'une ancre, donc
          une expression qui cherchait *un caractère de contrôle* suivi de
          `baseBri`. Elle ne trouvait rien, et **un contrôle qui ne trouve rien
          ressemble à un contrôle qui n'a rien à redire.**

          ⭐ C'est le même défaut que la tranche vide de la veille, sous un autre
          déguisement — et il n'a été vu que parce qu'on a **réintroduit le
          défaut exprès pour voir la règle rougir.** *Une garde neuve qu'on n'a
          pas vue rougir au moins une fois n'est pas encore une garde.* D'où
          l'essai suivant, qui la met à l'épreuve à chaque passage.
        */
        const emprunts = codes.filter((effet, i) => {
            const debut = BOUCLE.indexOf(`case '${effet}':`);
            const suivant = codes[i + 1] ? BOUCLE.indexOf(`case '${codes[i + 1]}':`) : BOUCLE.length;
            /* On ne regarde que le code : un `baseBri` cité dans un commentaire
               raconte le défaut d'hier, il ne le commet pas. */
            const corps = BOUCLE.slice(debut, suivant).replace(/\/\*[\s\S]*?\*\//g, '');
            return MOTIF_EMPRUNT.test(corps);
        });
        expect(emprunts).toEqual([]);
    });
});
