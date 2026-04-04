/**
 * Logique avancée pour les lancers de dés (GM-OS v5)
 * Supporte TOUS les systèmes de l'ancienne version V3.
 */

export interface DieResult {
    val: number | string;
    isCritMax?: boolean;
    isCritMin?: boolean;
    isExploded?: boolean;
    displayStr?: string;
    cssClass?: string;
}

export interface RollResult {
    total: number;
    rolls: DieResult[];
    modifier: number;
    successes?: number;
    fails?: number;
    tagSuccess?: boolean;
    totalDisplay: string;
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

            rolls.push({ val: r1, cssClass: 'die-digit-1 text-rose-400' });
            rolls.push({ val: r2, cssClass: 'die-digit-2 text-blue-400' });

            let val = (r1 * 10) + r2;

            if (isTriple) {
                const r3 = this.roll(baseFace);
                rolls.push({ val: r3, cssClass: 'die-digit-3 text-emerald-400' });
                val = (r1 * 100) + (r2 * 10) + r3;
            }

            if (count > 1 && i < count - 1) {
                rolls.push({ val: '•', cssClass: 'opacity-50' });
            }

            totals.push(val + modifier);
        }

        const totalDisplay = count === 1 ? totals[0].toString() : totals.join(' / ');

        return {
            total: totals[0] || 0, // Fallback if count is 0
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

        const rolls: RollResult['rolls'] = [];
        let total = 0;

        for (let i = 0; i < count; i++) {
            let val;
            do {
                val = this.roll(faces);
                rolls.push({
                    val,
                    isCritMax: val === faces,
                    isCritMin: val === 1,
                    isExploded: rolls.length >= count // Identify extra dice as exploded
                });
                total += val;
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
     * @returns Objet RollResult avec tagSuccess.
     */
    static rollThreshold(faces: number, count: number, modifier: number, target: number, rule: 'over' | 'under' = 'over'): RollResult {
        const res = this.rollStandard(faces, count, modifier);
        const success = rule === 'over' ? res.total >= target : res.total <= target;
        res.tagSuccess = success;
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
    static rollPool(faces: number, count: number, modifier: number, target: number, exploding: boolean = false): RollResult {
        const rolls: RollResult['rolls'] = [];
        let successes = 0;
        let ones = 0;

        for (let i = 0; i < count; i++) {
            const val = this.roll(faces);
            const isCritFail = val === 1;
            if (isCritFail) ones++;
            if (val >= target) successes++;

            rolls.push({ val, isCritMax: val >= target, isCritMin: isCritFail, isExploded: false });

            if (exploding && val === faces) {
                let keepExploding = true;
                while (keepExploding) {
                    const extraVal = this.roll(faces);
                    const isExtraFail = extraVal === 1;
                    if (isExtraFail) ones++;
                    if (extraVal >= target) successes++;

                    rolls.push({ val: extraVal, isCritMax: extraVal >= target, isCritMin: isExtraFail, isExploded: true });
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
    static rollAdvantage(faces: number, modifier: number, isAdvantage: boolean, target: number, rule: 'over' | 'under' = 'over'): RollResult {
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
                { val: kept, isCritMax: kept === faces, isCritMin: kept === 1 },
                { val: dropped, cssClass: 'opacity-40 line-through', displayStr: `(${dropped})` }
            ],
            modifier,
            tagSuccess: success,
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
        const adj = total >= 8 ? "Légendaire" : total >= 4 ? "Superbe" : total >= 2 ? "Bon" : total <= -2 ? "Mauvais" : "Neutre";

        return {
            total,
            rolls,
            modifier,
            totalDisplay: `${total > 0 ? '+' + total : total} (${adj})`
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

        rolls.push({ val: first, isCritMax: first >= 96, isCritMin: first <= 5 });
        total = first;

        if (first >= 96) {
            let next;
            do {
                next = this.roll(100);
                rolls.push({ val: next, isCritMax: next >= 96, isCritMin: false, isExploded: true });
                total += next;
            } while (next >= 96);
        } else if (first <= 5) {
            let next;
            do {
                next = this.roll(100);
                rolls.push({ val: next, isCritMax: false, isCritMin: next >= 96, isExploded: true, displayStr: `-${next}` });
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

            const isBane = false; // "il y a des fléaux que sur les 1 des dés de Gear"
            const isCrit = v === 6;

            let cssClass = 'border-amber-500/50 text-amber-500'; // Normal
            if (isCrit) cssClass = '!bg-amber-500 border-amber-500 !text-amber-950 font-black drop-shadow-[0_0_10px_rgba(251,191,36,1)] z-10 scale-110'; // Rempli, fort en évidence sans glow sur le 1
            else if (isBane) cssClass = 'border-amber-500/50 text-amber-500';

            rolls.push({
                val: v,
                isCritMax: isCrit,
                isCritMin: isBane,
                cssClass
            });
        }

        for (let i = 0; i < gearDice; i++) {
            const v = this.roll(6);
            if (v === 6) successes++;
            if (v === 1) banes++;

            const isBane = v === 1;
            const isCrit = v === 6;

            let cssClass = 'border-rose-500/50 text-rose-500'; // Normal
            if (isCrit) cssClass = '!bg-rose-500 border-rose-500 !text-white font-black drop-shadow-[0_0_10px_rgba(244,63,94,1)] z-10 scale-110'; // Rempli
            else if (isBane) cssClass = 'border-rose-500/80 !text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,1)] border-2 font-black'; // Glow rouge

            rolls.push({
                val: v,
                isCritMax: isCrit,
                isCritMin: isBane,
                cssClass
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
        // Tokenisation de la formule: ex "2d6-1d4+5" => ["2d6", "-1d4", "+5"]
        // C'est basique mais ça reproduit "window.utils.parseDiceFormula" de la v3.
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
                        rolls.push({ val: v, isCritMin: isNeg, isCritMax: (!isNeg && v === faces) });
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
    static rollFromConfig(config: { defaultDice: string; logic: string; successThreshold?: number; engine?: string }, options?: { modifier?: number; baseCount?: number; gearCount?: number; targetOverwrite?: number }): RollResult {
        // If an engine is specified, prioritize it
        if (config.engine === 'year-zero' || config.engine === 'yze') {
            const count = options?.baseCount ?? (parseInt(config.defaultDice) || 6);
            const gear = options?.targetOverwrite ?? options?.gearCount ?? 0;
            const mod = options?.modifier ?? 0;
            // In YZE, modifiers add/remove base dice
            return this.rollYZE(Math.max(1, count + mod), gear);
        }

        if (config.engine === 'd100' || config.engine === 'rolemaster') {
            return this.rollRolemaster(options?.modifier ?? 0);
        }

        if (config.engine === '2d20') {
            // Basic 2d20 logic: 2d20 vs threshold
            return this.rollPool(20, 2, options?.modifier ?? 0, (options?.targetOverwrite ?? config.successThreshold) || 12, false);
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
                return this.rollPool(faces, count, modifier, threshold, false);
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
                return this.rollThreshold(100, 1, modifier, threshold, 'under');
            default:
                return this.rollFormula(config.defaultDice);
        }
    }
}

