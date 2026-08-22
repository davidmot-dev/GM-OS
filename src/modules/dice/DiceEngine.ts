import {
    degreDepuisLeBooleen, degreDuDe, estUneReussite,
    type DegreDeReussite, type EchelleDuJet,
} from './degresDeReussite';

export interface DieResult {
    val: number | string;
    sides?: number; // Needed for 3D box
    isCritMax?: boolean;
    isCritMin?: boolean;
    isExploded?: boolean;
    displayStr?: string;
    isDropped?: boolean; // For advantage/disadvantage
    source?: 'base' | 'gear' | 'digit'; // For YZE or Digits
    cssClass?: string;
}

export interface RollResult {
    total: number;
    rolls: DieResult[];
    modifier: number;
    successes?: number;
    fails?: number;
    tagSuccess?: boolean;
    /**
     * **Le degré, quand le jeu en a un — et l'équivalent du booléen sinon.**
     *
     * `tagSuccess` reste, et il reste juste : six écrans le lisent. Mais il ne
     * sait dire que réussi ou raté, et *il n'y avait nulle part où poser
     * « réussite particulière »*. Les jeux en pourcentage — Rêves de Dragons,
     * L'Appel de Cthulhu, RuneQuest — gradent en six bandes ; Dune porte déjà
     * `critique` et `complication`, deux degrés qui ne disent pas leur nom.
     *
     * **Un jeu qui ne gradue pas n'y gagne pas de degrés** : il reçoit
     * `reussite-normale` ou `echec-normal`, et rien d'autre. Fabriquer les
     * quatre extrêmes ferait dire au journal qu'un jet fut spectaculaire alors
     * que le jeu ne le sait pas.
     */
    degre?: DegreDeReussite;
    totalDisplay: string;
    fateRank?: number; // For Fate/Fudge results
}

export class DiceEngine {
    /**
     * Effectue un lancer de dé simple de 1 à 'sides'.
     * @param sides Nombre de faces du dé.
     * @returns Résultat du lancer (entier entre 1 et sides).
     */
    static roll(sides: number): number {
        if (sides < 1) return 0;
        return Math.floor(Math.random() * sides) + 1;
    }

    // --- 1. DÉS MULTI-CHIFFRES (D66, D888...) ---
    /**
     * Lance des dés multi-chiffres (ex: D66, D888).
     * Chaque dé est lancé individuellement et combiné (D66 = dizaine + unité).
     * @param faces Type de dé multi-chiffre (ex: 66, 888).
     * @param count Nombre de fois que l'on lance cette combinaison.
     * @param modifier Modificateur à ajouter à chaque résultat final.
     * @returns Objet RollResult contenant les détails des lancers.
     */
    static rollDigits(faces: number, count: number, modifier: number): RollResult {
        const rolls: RollResult['rolls'] = [];
        const totals: number[] = [];
        const baseFace = faces % 10;
        const isTriple = faces > 100;

        for (let i = 0; i < count; i++) {
            const r1 = this.roll(baseFace);
            const r2 = this.roll(baseFace);

            rolls.push({ val: r1, sides: 6, source: 'digit' });
            rolls.push({ val: r2, sides: 6, source: 'digit' });

            let val = (r1 * 10) + r2;

            if (isTriple) {
                const r3 = this.roll(baseFace);
                rolls.push({ val: r3, sides: 6, source: 'digit' });
                val = (r1 * 100) + (r2 * 10) + r3;
            }

            if (count > 1 && i < count - 1) {
                rolls.push({ val: '•' });
            }

            totals.push(val + modifier);
        }

        const totalDisplay = count === 1 ? totals[0].toString() : totals.join(' / ');

        return {
            total: totals[0] || 0,
            rolls,
            modifier,
            totalDisplay
        };
    }

    // --- 2. JETS STANDARDS ET SOMMES EXPLOSIVES ---
    /**
     * Lance des dés standards avec support optionnel de l'explosion.
     * Redirige vers rollDigits si les faces correspondent à un dé multi-chiffre.
     * @param faces Nombre de faces (ex: 6, 20).
     * @param count Nombre de dés à lancer.
     * @param modifier Modificateur global.
     * @param exploding Si true, relance le dé s'il atteint sa valeur maximale.
     * @returns Objet RollResult.
     */
    static rollStandard(faces: number, count: number, modifier: number = 0, exploding: boolean = false): RollResult {
        if ([44, 66, 88, 444, 666, 888].includes(faces)) {
            return this.rollDigits(faces, count, modifier);
        }

        // --- SPECIAL D100 HANDLING (2 x D10) ---
        if (faces === 100) {
            const rolls: RollResult['rolls'] = [];
            let total = 0;
            for (let i = 0; i < count; i++) {
                const tens = (Math.floor(Math.random() * 10)) * 10;
                const units = Math.floor(Math.random() * 10);
                let val = tens + units;
                if (val === 0) val = 100;

                rolls.push({ val: tens === 0 ? '00' : tens, sides: 10, source: 'digit' });
                rolls.push({ val: units, sides: 10, source: 'digit' });
                total += val;
            }
            return { total: total + modifier, rolls, modifier, totalDisplay: (total + modifier).toString() };
        }

        const rolls: RollResult['rolls'] = [];
        let total = 0;

        for (let i = 0; i < count; i++) {
            let val;
            let isFirst = true;
            do {
                val = this.roll(faces);
                const isCritMax = val === faces;
                const isCritMin = val === 1;
                const isExploded = !isFirst;
                
                rolls.push({
                    val,
                    sides: faces,
                    isCritMax,
                    isCritMin,
                    isExploded
                });
                total += val;
                isFirst = false;
            } while (exploding && val === faces);
        }

        return { total: total + modifier, rolls, modifier, totalDisplay: (total + modifier).toString() };
    }

    // --- 3. JETS DE SEUIL (THRESHOLD) ---
    /**
     * Lance des dés standards et compare le total à un seuil.
     * @param faces Nombre de faces.
     * @param count Nombre de dés.
     * @param modifier Modificateur global.
     * @param target Seuil à atteindre.
     * @param rule Règle de comparaison ('over' ou 'under').
     * @param echelle Les bornes des six degrés, quand le jeu en gradue.
     * @returns Objet RollResult avec tagSuccess.
     */
    static rollThreshold(
        faces: number, count: number, modifier: number, target: number,
        rule: 'over' | 'under' = 'over',
        /**
         * **Le degré se pose ICI, et pas chez l'appelant.**
         *
         * Trois écrans lancent un jet — le pupitre du meneur, la tablette des
         * joueurs et le panneau de fiche. Qualifier le dé chez chacun d'eux
         * donnerait trois qualifications qui finiraient par diverger, et deux
         * d'entre elles ne seraient jamais relues. *C'est le remède qui a
         * corrigé les seize dés d'Alien pour les trois appelants d'un coup :
         * on corrige dans le moteur.*
         */
        echelle?: EchelleDuJet,
    ): RollResult {
        const res = this.rollStandard(faces, count, modifier);
        const success = rule === 'over' ? res.total >= target : res.total <= target;
        res.tagSuccess = success;
        /*
          **L'échelle l'emporte, et elle peut contredire le booléen.** À 96-100 %
          de chances, un « 00 » est inférieur ou égal à la cible — donc `success`
          vaut vrai — et le livre en fait pourtant un échec total. On aligne les
          deux : *un écran qui annonce « réussite » pendant qu'un autre annonce
          « échec total » pour le même dé est pire que les deux séparément.*
        */
        if (echelle) {
            res.degre = degreDuDe(res.total, echelle, faces);
            res.tagSuccess = estUneReussite(res.degre);
        } else {
            res.degre = degreDepuisLeBooleen(success);
        }
        res.totalDisplay = `${res.total} vs ${target}`;
        return res;
    }

    // --- 4. POOLS (CLASSIQUES ET EXPLOSIFS) ---
    /**
     * Lance une réserve (pool) de dés et compte les succès individuels.
     * Supporte l'explosion des faces maximales et la soustraction des "1" (fléaux).
     * @param faces Nombre de faces.
     * @param count Nombre de dés dans la réserve.
     * @param modifier Modificateur ajouté au nombre de succès.
     * @param target Seuil de succès pour chaque dé.
     * @param exploding Si true, chaque succès critique (face max) ajoute un dé supplémentaire.
     * @returns Objet RollResult avec décompte des succès et échecs.
     */
    /**
     * Options du comptage d'une réserve.
     *
     * **Pourquoi `sens` existe.** `rollPool` comptait les dés **au-dessus** du
     * seuil, ce qui décrit les réserves à la Vampire ou Year Zero. Toute la
     * famille 2d20 de Modiphius — Dune, Star Trek Adventures, Conan — compte
     * l'inverse : chaque dé **inférieur ou égal** au seuil est une réussite.
     * Mesuré le 2026-08-10 sur 4 000 dés au seuil 12 : le moteur comptait 1 859
     * réussites, exactement celles qu'il fallait rejeter.
     *
     * **Et `doubleSous`.** Dans cette même famille, un dé assez bas vaut deux
     * réussites : le 1 naturel toujours, et tout dé sous la compétence seule
     * quand le personnage a la spécialisation. Le comptage des « fléaux » —
     * soustraire les 1 — n'a alors aucun sens : il retirait des réussites
     * critiques.
     */
    static rollPool(
        faces: number,
        count: number,
        modifier: number,
        target: number,
        exploding: boolean = false,
        options?: { sens?: 'over' | 'under'; doubleSous?: number },
    ): RollResult {
        const rolls: RollResult['rolls'] = [];
        const sens = options?.sens ?? 'over';
        const doubleSous = options?.doubleSous;
        let successes = 0;
        let ones = 0;

        /** Ce que rapporte un dé : 0, 1, ou 2 quand il tombe assez bas. */
        const valeurDuDe = (val: number): number => {
            const reussit = sens === 'under' ? val <= target : val >= target;
            if (!reussit) return 0;
            return doubleSous !== undefined && val <= doubleSous ? 2 : 1;
        };

        const compter = (val: number, exploded: boolean) => {
            const gain = valeurDuDe(val);
            successes += gain;
            // En comptage « sous », un 1 est la meilleure valeur possible : le
            // retenir comme fléau retirerait la réussite critique qu'il vient
            // d'accorder.
            const isCritFail = sens === 'over' && val === 1;
            if (isCritFail) ones++;
            rolls.push({
                val,
                sides: faces,
                isCritMax: gain > 0,
                isCritMin: isCritFail,
                isExploded: exploded,
            });
        };

        for (let i = 0; i < count; i++) {
            const val = this.roll(faces);
            compter(val, false);

            if (exploding && val === faces) {
                let keepExploding = true;
                while (keepExploding) {
                    const extraVal = this.roll(faces);
                    compter(extraVal, true);
                    if (extraVal !== faces) keepExploding = false;
                }
            }
        }

        const grossSuccess = successes + modifier;
        const netScore = grossSuccess - ones;

        return {
            total: netScore,
            rolls,
            modifier,
            successes,
            fails: ones,
            tagSuccess: netScore > 0,
            degre: degreDepuisLeBooleen(netScore > 0),
            totalDisplay: `${grossSuccess} Brut / ${netScore} Net`
        };
    }

    // --- 5. AVANTAGE / DÉSAVANTAGE ---
    /**
     * Lance deux dés et garde le meilleur (Avantage) ou le moins bon (Désavantage).
     * @param faces Nombre de faces.
     * @param modifier Modificateur global.
     * @param isAdvantage True pour l'avantage, False pour le désavantage.
     * @param target Seuil à atteindre.
     * @param rule Règle de comparaison ('over' ou 'under').
     * @returns Objet RollResult.
     */
    static rollAdvantage(
        faces: number, modifier: number, isAdvantage: boolean, target: number,
        rule: 'over' | 'under' = 'over',
        /**
         * **Sans elle, l'avantage effacerait les degrés.** Un jet à l'avantage
         * reste le même jet — *« un jet qui change selon l'écran d'où on le
         * lance n'est pas le même jet »* —, et il n'y a aucune raison qu'une
         * réussite particulière cesse d'en être une parce qu'on a lancé deux
         * dés. C'est le même oubli que le sens du comptage : le chemin s'arrête
         * avant le moteur.
         */
        echelle?: EchelleDuJet,
    ): RollResult {
        const r1 = this.roll(faces);
        const r2 = this.roll(faces);
        let kept, dropped;

        if (rule === 'over') {
            kept = isAdvantage ? Math.max(r1, r2) : Math.min(r1, r2);
            dropped = isAdvantage ? Math.min(r1, r2) : Math.max(r1, r2);
        } else {
            kept = isAdvantage ? Math.min(r1, r2) : Math.max(r1, r2);
            dropped = isAdvantage ? Math.max(r1, r2) : Math.min(r1, r2);
        }

        const total = kept + modifier;
        const success = rule === 'over' ? total >= target : total <= target;

        return {
            total,
            rolls: [
                { val: kept, sides: faces, isCritMax: kept === faces, isCritMin: kept === 1 },
                { val: dropped, sides: faces, isDropped: true, displayStr: `(${dropped})` }
            ],
            modifier,
            tagSuccess: echelle ? estUneReussite(degreDuDe(total, echelle, faces)) : success,
            degre: echelle ? degreDuDe(total, echelle, faces) : degreDepuisLeBooleen(success),
            totalDisplay: `${total} vs ${target}`
        };
    }

    // --- 6. FATE / FUDGE ---
    /**
     * Effectue un lancer de type Fate/Fudge (-1, 0, +1).
     * @param count Nombre de dés (généralement 4).
     * @param modifier Modificateur à ajouter à la somme.
     * @returns Objet RollResult avec une description textuelle de l'échelle Fate.
     */
    static rollFate(count: number = 4, modifier: number = 0): RollResult {
        const rolls: RollResult['rolls'] = [];
        let sum = 0;

        for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            const sym = r === -1 ? '-' : (r === 1 ? '+' : 'O');
            rolls.push({ val: sym, isCritMax: r === 1, isCritMin: r === -1, displayStr: sym });
            sum += r;
        }

        const total = sum + modifier;
        // Logic de rang Fate simplifiée à transmettre au component I18next
        // -2 = Mauvais, 0 = Neutre, 2 = Bon, 4 = Superbe, 8 = Légendaire (selon v3)
        // On renvoie juste le total, l'UI s'occupera de la string localisée.

        return {
            total,
            rolls,
            modifier,
            fateRank: total,
            totalDisplay: `${total > 0 ? '+' + total : total}`
        };
    }

    // --- 7. ROLEMASTER (D100) ---
    /**
     * Effectue un lancer Rolemaster (D100 ouvert).
     * Si le résultat est >= 96, le dé explose vers le haut.
     * Si le résultat est <= 5, le dé explose vers le bas.
     * @param modifier Modificateur global.
     * @returns Objet RollResult.
     */
    static rollRolemaster(modifier: number = 0): RollResult {
        const rolls: RollResult['rolls'] = [];
        let total = 0;
        const first = this.roll(100);

        rolls.push({ val: first, sides: 100, isCritMax: first >= 96, isCritMin: first <= 5 });
        total = first;

        if (first >= 96) {
            let next;
            do {
                next = this.roll(100);
                rolls.push({ val: next, sides: 100, isCritMax: next >= 96, isCritMin: false, isExploded: true });
                total += next;
            } while (next >= 96);
        } else if (first <= 5) {
            let next;
            do {
                next = this.roll(100);
                rolls.push({ val: next, sides: 100, isCritMax: false, isCritMin: next >= 96, isExploded: true, displayStr: `-${next}` });
                total -= next;
            } while (next >= 96);
        }

        return { total: total + modifier, rolls, modifier, totalDisplay: (total + modifier).toString() };
    }

    // --- 8. YEAR ZERO ENGINE (YZE) ---
    /**
     * Effectue un lancer Year Zero Engine (YZE).
     * Différencie les dés de base et les dés d'équipement (Banes sur les 1 de Gear).
     * @param baseDice Nombre de dés de base.
     * @param gearDice Nombre de dés d'équipement.
     * @returns Objet RollResult avec décompte des succès et fléaux.
     */
    static rollYZE(baseDice: number, gearDice: number): RollResult {
        const rolls: RollResult['rolls'] = [];
        let successes = 0;
        let banes = 0;

        for (let i = 0; i < baseDice; i++) {
            const v = this.roll(6);
            if (v === 6) successes++;

            rolls.push({
                val: v,
                sides: 6,
                isCritMax: v === 6,
                isCritMin: false,
                source: 'base'
            });
        }

        for (let i = 0; i < gearDice; i++) {
            const v = this.roll(6);
            if (v === 6) successes++;
            if (v === 1) banes++;

            rolls.push({
                val: v,
                sides: 6,
                isCritMax: v === 6,
                isCritMin: v === 1,
                source: 'gear'
            });
        }

        const tagSuccess = successes > 0;

        return {
            total: successes,
            rolls,
            modifier: 0,
            successes,
            fails: banes,
            tagSuccess,
            degre: degreDepuisLeBooleen(tagSuccess),
            totalDisplay: `${successes} Succès${banes > 0 ? ` / ${banes} Fléaux` : ''}`
        };
    }

    // --- 9. PARSEUR DE FORMULE LIBRE (ex: 2d6-1d4+5) ---
    /**
     * Tokenise une formule de dés (ex: "2d6-1d4+5").
     * @param formula Chaîne de caractères représentant la formule.
     * @returns Tableau de tokens ou null si invalide.
     */
    static parseSettings(formula: string): string[] | null {
        const clean = formula.replace(/\s+/g, '');
        const regex = /([+-]?[^+-]+)/g;
        const matches = clean.match(regex);
        return matches;
    }

    /**
     * Analyse et lance une formule complexe de dés.
     * Supporte les dés multi-chiffres, Fate et les bonus/malus.
     * @param formula Formule (ex: "2d6+5", "1d66").
     * @returns Objet RollResult.
     */
    static rollFormula(formula: string): RollResult {
        const matches = this.parseSettings(formula);
        if (!matches) throw new Error("Format Invalide");

        const rolls: RollResult['rolls'] = [];
        let total = 0;

        for (const part of matches) {
            if (part.includes('d') || part.includes('D')) {
                const parts = part.split(/d/i);
                const countStr = parts[0];
                const facesStr = parts[1];

                let count = 1;
                let isNeg = false;

                if (countStr === '-') {
                    isNeg = true;
                } else if (countStr !== '' && countStr !== '+') {
                    count = parseInt(countStr);
                    if (count < 0) {
                        isNeg = true;
                        count = Math.abs(count);
                    }
                }

                const isFate = facesStr.toLowerCase() === 'f';
                const faces = isFate ? 0 : parseInt(facesStr);

                if (isFate) {
                    const fateRes = this.rollFate(count, 0);
                    fateRes.rolls.forEach(r => {
                        if (isNeg && typeof r.val === 'number') r.val = -r.val;
                        rolls.push(r);
                    });
                    total += isNeg ? -fateRes.total : fateRes.total;
                } else if ([44, 66, 88, 444, 666, 888].includes(faces)) {
                    const digitRes = this.rollDigits(faces, count, 0);
                    digitRes.rolls.forEach(r => rolls.push(r));
                    let dt = digitRes.total;
                    if (isNeg) dt = -dt;
                    total += dt;
                } else {
                    for (let i = 0; i < count; i++) {
                        let v = this.roll(faces);
                        if (isNeg) v = -v;
                        rolls.push({ val: v, sides: faces, isCritMin: isNeg, isCritMax: (!isNeg && v === faces) });
                        total += v;
                    }
                }
            } else {
                total += parseInt(part);
            }
        }

        return {
            total,
            modifier: 0,
            rolls,
            totalDisplay: total.toString()
        };
    }

    // --- 10. SYSTEM BRIDGE ---
    /**
     * Point d'entrée principal pour lancer des dés à partir d'une configuration système.
     * Gère les différents moteurs (Year Zero, Rolemaster, 2d20) et logiques (count-success, highest, etc.).
     * @param config Configuration du système (dés, logique, seuil, moteur).
     * @param options Options dynamiques (modificateur, nombre de dés, seuil forcé).
     * @returns Objet RollResult final.
     */
    /**
     * Les moteurs qui imposent leur propre résolution et **ignorent `logic`**.
     *
     * `rollFromConfig` les intercepte avant toute logique — une réserve Year
     * Zero, une famille 2d20, un percentile. Un appelant qui veut savoir si un
     * jet se décide sur **un seul dé comparé à un seuil** doit donc les exclure,
     * et cette liste est le seul endroit où ils sont nommés : recopiée ailleurs,
     * elle dériverait le jour où un moteur s'ajoute, et l'écran offrirait une
     * option que le moteur n'appliquerait pas.
     */
    static readonly MOTEURS_A_RESOLUTION_PROPRE: readonly string[] = [
        'year-zero', 'yze', 'd100', 'rolemaster', '2d20',
    ];

    /**
     * Ce jet se décide-t-il sur la valeur d'**un seul dé** face à un seuil ?
     *
     * C'est la condition de l'Avantage : *lancer un dé de plus et garder celui
     * qu'on préfère* n'a de sens que si un seul dé tranche. Sur une réserve, il
     * n'y a pas de « meilleur dé » — il y a un compte de réussites.
     */
    static unSeulDeDecide(engine: string | undefined, nombreDeDes: number): boolean {
        return nombreDeDes === 1 && !this.MOTEURS_A_RESOLUTION_PROPRE.includes(engine ?? '');
    }

    static rollFromConfig(
        config: {
            defaultDice: string;
            logic: string;
            successThreshold?: number;
            engine?: string;
            /**
             * Le sens du comptage, tel que `jet.sens` le déclare.
             *
             * **Il ne voyageait pas, et c'est le même défaut que le sélecteur
             * ignoré du pupitre** (2026-08-16). `rollFromConfig` ne recevait que
             * le bloc `dice` du pilote ; `jet.sens` vit à côté, et n'atteignait
             * donc jamais `rollPool`. Toute réserve déclarée en `count-success`
             * comptait **au-dessus** du seuil, y compris sur un jeu qui compte
             * dessous. Seule la famille `2d20` s'en tirait, parce que sa branche
             * force `under` en dur.
             *
             * Absent, on garde `superieur-ou-egal` : c'est la réserve à la
             * Vampire ou Year Zero, et c'était déjà le comportement.
             */
            sens?: 'sous-ou-egal' | 'superieur-ou-egal';
        },
        options?: {
            modifier?: number; baseCount?: number; gearCount?: number;
            targetOverwrite?: number; doubleSous?: number;
            /**
             * Les bornes des six degrés, quand le pilote décrit un jeu qui
             * gradue. Elles viennent de `preparerLeJet`, qui les tient de la
             * mécanique du système — le moteur ne connaît aucune table.
             */
            echelle?: EchelleDuJet;
        },
    ): RollResult {
        // If an engine is specified, prioritize it
        if (config.engine === 'year-zero' || config.engine === 'yze') {
            const count = options?.baseCount ?? (parseInt(config.defaultDice) || 6);
            /**
             * **Les dés d'équipement se comptent, ils ne se seuillent pas.**
             *
             * Cette ligne lisait `targetOverwrite ?? gearCount` : le SEUIL de
             * réussite pris pour un NOMBRE de dés, et prioritaire par-dessus le
             * marché. Or le pupitre initialise son seuil à dix et ne le remet
             * jamais à zéro en entrant dans Year Zero — le moteur n'en a aucun
             * usage, un six est une réussite en dur dans `rollYZE`. Alien
             * lançait donc `base + 10` dés à chaque jet, quoi qu'on saisisse
             * dans « dés d'équipement » : six et un donnaient seize dés,
             * relevé par David le 2026-08-21.
             *
             * Le champ E de l'écran était affiché et ignoré — même défaut que
             * le sélecteur ≥ / ≤ du 2026-08-16, et que le sens du comptage qui
             * n'arrivait pas jusqu'au moteur : *le chemin s'arrête avant le
             * moteur, et le résultat reste plausible.* Dix dés d'équipement
             * rendent des Fléaux crédibles ; rien ne se plaint.
             *
             * Les trois appelants passent `gearCount` — le pupitre, la
             * tablette et le panneau de jet —, et deux d'entre eux passaient
             * aussi un `targetOverwrite` qui n'a aucun sens ici. On ne lit donc
             * plus que le seul champ qui parle de dés.
             */
            const gear = options?.gearCount ?? 0;
            const mod = options?.modifier ?? 0;
            return this.rollYZE(Math.max(1, count + mod), gear);
        }

        if (config.engine === 'd100' || config.engine === 'rolemaster') {
            return this.rollRolemaster(options?.modifier ?? 0);
        }

        if (config.engine === '2d20') {
            /**
             * La famille 2d20 compte **sous** le seuil, jamais au-dessus, et le
             * 1 naturel vaut deux réussites. C'est la définition du système, pas
             * un réglage : un 2d20 qui compte au-dessus décrit un autre jeu.
             *
             * `baseCount` porte la réserve réellement achetée — de 2 à 5 dés
             * chez Dune — et `doubleSous` la valeur sous laquelle un dé compte
             * double, qui monte à la compétence seule avec la spécialisation.
             */
            return this.rollPool(
                20,
                options?.baseCount ?? 2,
                options?.modifier ?? 0,
                (options?.targetOverwrite ?? config.successThreshold) || 12,
                false,
                { sens: 'under', doubleSous: options?.doubleSous ?? 1 },
            );
        }

        const dicePart = config.defaultDice.match(/(\d+)d(\d+|f|F)/i);
        if (!dicePart) return this.rollFormula(config.defaultDice);
        
        const count = options?.baseCount ?? parseInt(dicePart[1]);
        const facesStr = dicePart[2];
        const isFate = facesStr.toLowerCase() === 'f';
        const modifier = options?.modifier ?? 0;

        if (isFate) {
            return this.rollFate(count, modifier);
        }

        const faces = parseInt(facesStr);
        const threshold = (options?.targetOverwrite ?? config.successThreshold) || 10;

        switch (config.logic) {
            case 'count-success':
                return this.rollPool(faces, count, modifier, threshold, false, {
                    sens: config.sens === 'sous-ou-egal' ? 'under' : 'over',
                });
            case 'highest': {
                const res = this.rollStandard(faces, count, modifier, false);
                const max = Math.max(...res.rolls.map(r => typeof r.val === 'number' ? r.val : 0));
                return {
                    ...res,
                    total: max,
                    totalDisplay: max.toString()
                };
            }
            case 'lowest': {
                const res = this.rollStandard(faces, count, modifier, false);
                const min = Math.min(...res.rolls.map(r => typeof r.val === 'number' ? r.val : 1000));
                return {
                    ...res,
                    total: min,
                    totalDisplay: min.toString()
                };
            }
            case 'd100-low':
                return this.rollThreshold(100, 1, modifier, threshold, 'under', options?.echelle);
            default:
                return this.rollFormula(config.defaultDice);
        }
    }
}

