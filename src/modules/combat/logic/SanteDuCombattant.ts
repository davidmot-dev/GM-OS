import type { Combatant } from '../types';

/**
 * Une seule réponse à « comment va ce combattant ».
 *
 * **Pourquoi ce module existe.** `hp` et `hpMax` sont devenus facultatifs,
 * parce que tous les jeux ne comptent pas la santé en points — chez Dune, « il
 * n'existe aucune jauge numérique de santé sur la feuille de personnage ».
 * Huit endroits lisaient `combatant.hp` directement, chacun avec sa propre idée
 * de ce qu'un zéro voulait dire.
 *
 * **La règle qui les réunit : l'absence n'est pas un zéro.** Un combattant sans
 * jauge n'est pas à l'agonie, il relève d'un jeu qui ne compte pas comme ça.
 * Confondre les deux donnait exactement le défaut redouté — un mourant affiché
 * pour tout le monde, en gris, sans que rien ne soit faux au sens du type.
 *
 * L'autorité est `healthSystem` quand il est là : c'est lui que
 * `HealthInterpreter` fait vivre. `hp` ne sert qu'aux systèmes qui en ont.
 */

/**
 * Comment va ce personnage, **en toutes lettres**, pour l'IA et le journal.
 *
 * **Ce que ça corrige, relevé le 2026-08-14.** Trois écrits envoyaient
 * `HP ${c.hp}/${c.maxHp}` à l'IA et au compte rendu de séance sans jamais
 * consulter le modèle de santé du pilote — `useOracleContext`, `AIService` et
 * `useJournalStore`. Sur Alien, qui n'a pas de points de vie, l'Oracle recevait
 * littéralement **« HP undefined/undefined »** pour chaque personnage, et
 * raisonnait dessus. Le Sage, dont la persona du corpus dit qu'il est
 * « l'assistant technique froid et précis de Maman », ne pouvait que les
 * ignorer ou les inventer.
 *
 * **Rendre `null` plutôt qu'un zéro est le coeur du contrat.** L'appelant qui
 * n'a rien à dire n'écrit rien, au lieu d'écrire une valeur fausse : *l'absence
 * n'est pas un zéro*, et un « 0/0 » dans une invite est une affirmation, pas un
 * silence.
 *
 * L'ordre d'autorité est celui du reste du module — `healthSystem` d'abord,
 * c'est lui que `HealthInterpreter` fait vivre ; la jauge de points ensuite.
 *
 * *Ce que cette fonction ne fait pas encore* : lire les jauges déclarées dans
 * `combat.statsToTrack` du pilote — le Stress d'Alien, sa Santé lue sur la
 * fiche. Elle décrit ce que le combattant porte, pas ce que sa fiche contient.
 */
const ETATS: Record<string, string> = {
    healthy: 'indemne',
    scratched: 'égratigné',
    wounded: 'blessé',
    critical: 'état critique',
    dead: 'hors de combat',
};

/** La forme minimale qu'on sait décrire — `Combatant`, `Entity` ou `PlayerCharacter`. */
export interface PorteurDeSante {
    hp?: number;
    /** `Combatant` dit `hpMax`, `Entity` et `PlayerCharacter` disent `maxHp`. */
    hpMax?: number;
    maxHp?: number;
    healthSystem?: { type: string; data: Record<string, unknown>; state: string };
}

export function decrireLaSante(c: PorteurDeSante): string | null {
    const sys = c.healthSystem;
    if (sys) {
        const etat = ETATS[sys.state] ?? sys.state;
        const d = sys.data ?? {};
        switch (sys.type) {
            case 'hp':
                return typeof d.current === 'number' && typeof d.max === 'number'
                    ? `${d.current}/${d.max} (${etat})`
                    : etat;
            case 'clocks':
                return typeof d.filled === 'number' && typeof d.segments === 'number'
                    ? `horloge de défaite ${d.filled}/${d.segments} (${etat})`
                    : etat;
            case 'wounds': {
                const niveaux = Array.isArray(d.levels) ? (d.levels as string[]) : [];
                const i = typeof d.currentIndex === 'number' ? d.currentIndex : -1;
                return i >= 0 && niveaux[i] ? `blessure « ${niveaux[i]} » (${etat})` : etat;
            }
            case 'boxes': {
                const cases = Array.isArray(d.boxes) ? (d.boxes as { filled?: boolean }[]) : [];
                return cases.length > 0
                    ? `${cases.filter(b => b.filled).length}/${cases.length} cases cochées (${etat})`
                    : etat;
            }
            default:
                return etat;
        }
    }

    const max = c.hpMax ?? c.maxHp;
    if (typeof c.hp === 'number' && typeof max === 'number' && max > 0) return `${c.hp}/${max} PV`;

    // Ni système ni jauge : ce jeu ne compte pas la santé comme ça. On se tait.
    return null;
}

/**
 * La santé de départ, **lue sur la fiche** plutôt que fixée à dix.
 *
 * **Ce que ça corrige, relevé le 2026-08-14.** `CombatControls` écrivait
 * `{ hp: 10, hpMax: 10 }` dès que le modèle valait `hp`, et `CharacterGrid`
 * reprenait `character.hp` — vide chez Alien. Or la Santé d'Alien **vaut la
 * Force du personnage**, de deux à cinq, et le SRD Year Zero Engine énonce le
 * principe général : *« la moyenne des scores de Force et d'Agilité, arrondie à
 * l'entier supérieur, plus un »*.
 *
 * C'est mot pour mot le défaut que `65bbd84` a réglé pour les horloges :
 * `createDefault('clocks')` donnait six segments à tout le monde, « un
 * duelliste médiocre et un maître tombaient au même rythme ». La règle posée
 * alors vaut ici — *une valeur qui dépend du personnage ne peut pas vivre dans
 * le pilote*, elle se lit sur la fiche.
 *
 * **Une formule, et non un champ unique.** Un seul champ suffirait à Alien mais
 * pas à sa famille, qui compose deux attributs. On réutilise donc le chemin de
 * `combat.initiativeFormula`, éprouvé et déjà contrôlé par `champsInvoques` —
 * plutôt que d'inventer un second langage.
 *
 * **Arrondi au supérieur**, parce que c'est ce que dit le SRD et qu'un demi
 * point de vie n'existe nulle part. **Jamais en dessous de un** : une formule
 * qui rendrait zéro ferait naître un personnage déjà hors de combat, ce qui est
 * une valeur fausse plutôt qu'une absence.
 *
 * Rend `null` quand la formule manque ou ne donne rien d'exploitable — auquel
 * cas l'appelant garde son comportement actuel. *On ne fait pas payer une
 * nouveauté à l'existant.*
 */
export function santeDeDepart(
    formule: string | undefined,
    lire: (champ: string) => number | undefined,
): number | null {
    if (!formule?.trim()) return null;

    // Les identifiants sont remplacés du plus long au plus court : sans cela,
    // « force » remplacerait le début de « force_mentale ».
    const champs = (formule.match(/[a-zA-ZÀ-ÿ_][a-zA-ZÀ-ÿ0-9_]*/g) ?? [])
        .filter((m, i, tous) => tous.indexOf(m) === i)
        .sort((a, b) => b.length - a.length);

    let expression = formule;
    for (const champ of champs) {
        const valeur = lire(champ);
        expression = expression.split(champ).join(String(valeur ?? 0));
    }

    // Ce qui reste doit être de l'arithmétique et rien d'autre : un identifiant
    // non résolu, une lettre oubliée, et on renonce plutôt que de deviner.
    if (!/^[\d\s+\-*/().]+$/.test(expression)) return null;

    try {
        const valeur = evaluerArithmetique(expression);
        if (valeur === null || !Number.isFinite(valeur)) return null;
        return Math.max(1, Math.ceil(valeur));
    } catch {
        return null;
    }
}

/**
 * Évalue une expression **strictement arithmétique**, sans `eval`.
 *
 * Rien d'ici ne vient de l'utilisateur au sens strict — la formule vient du
 * pilote — mais un pilote est forgé par un modèle de langage, et un modèle
 * écrit ce qu'il veut. On n'exécute pas ce qu'il produit : on le calcule.
 */
function evaluerArithmetique(expression: string): number | null {
    const jetons = expression.match(/\d+\.?\d*|[+\-*/()]/g);
    if (!jetons) return null;

    let i = 0;
    const suivant = () => jetons[i];
    const avaler = () => jetons[i++];

    const facteur = (): number | null => {
        if (suivant() === '(') {
            avaler();
            const v = somme();
            // Une parenthèse non fermée n'est pas une formule : `((force`
            // rendait la valeur de `force` comme si de rien n'était. On refuse
            // plutôt que de deviner ce que l'auteur voulait écrire.
            if (suivant() !== ')') return null;
            avaler();
            return v;
        }
        if (suivant() === '-') { avaler(); const v = facteur(); return v === null ? null : -v; }
        const j = avaler();
        const n = Number(j);
        return Number.isNaN(n) ? null : n;
    };

    const produit = (): number | null => {
        let v = facteur();
        while (v !== null && (suivant() === '*' || suivant() === '/')) {
            const op = avaler();
            const d = facteur();
            if (d === null) return null;
            v = op === '*' ? v * d : (d === 0 ? null : v / d);
        }
        return v;
    };

    const somme = (): number | null => {
        let v = produit();
        while (v !== null && (suivant() === '+' || suivant() === '-')) {
            const op = avaler();
            const d = produit();
            if (d === null) return null;
            v = op === '+' ? v + d : v - d;
        }
        return v;
    };

    const resultat = somme();
    return i === jetons.length ? resultat : null;
}

/** Ce combattant a-t-il une jauge de points de vie ? */
export function aUneJaugeDeVie(c: Combatant): boolean {
    return typeof c.hp === 'number' && typeof c.hpMax === 'number' && c.hpMax > 0;
}

/**
 * Part de vie restante, de 0 à 1.
 *
 * **`null` quand il n'y a pas de jauge**, et c'est tout l'intérêt : un appelant
 * qui doit dessiner une barre découvre qu'il n'a rien à dessiner, au lieu d'en
 * dessiner une vide.
 */
export function fractionDeVie(c: Combatant): number | null {
    if (!aUneJaugeDeVie(c)) return null;
    return Math.max(0, Math.min(1, c.hp! / c.hpMax!));
}

/**
 * Le combattant est-il hors de combat ?
 *
 * Ordre d'autorité : l'état calculé par `HealthInterpreter` d'abord, puis la
 * jauge de points de vie. **Sans l'un ni l'autre, la réponse est non** — on ne
 * déclare pas mort un combattant faute d'information.
 */
export function estHorsDeCombat(c: Combatant): boolean {
    if (c.healthSystem) return c.healthSystem.state === 'dead';
    if (aUneJaugeDeVie(c)) return c.hp! <= 0;
    return false;
}

/**
 * Les points de vie après un ajustement, bornés entre zéro et le maximum.
 *
 * `null` sans jauge : il n'y a rien à ajuster, et forcer un nombre reviendrait
 * à créer des PV que le système n'a pas.
 */
export function pointsDeVieApres(c: Combatant, delta: number): number | null {
    if (!aUneJaugeDeVie(c)) return null;
    return Math.min(c.hpMax!, Math.max(0, c.hp! + delta));
}
