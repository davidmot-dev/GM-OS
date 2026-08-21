import { describe, it, expect } from 'vitest';
import { DiceEngine } from './DiceEngine';

describe('DiceEngine Alignment', () => {
    it('should correctly apply YZE mechanics with modifiers from config', () => {
        const config = {
            defaultDice: '3',
            logic: 'count-success',
            engine: 'year-zero' as const
        };
        
        // Rolling 3 base + 2 modifier = 5 dice total
        const res = DiceEngine.rollFromConfig(config, { modifier: 2 });
        expect(res.rolls.length).toBe(5);
        expect(res.modifier).toBe(0); // YZE modifier is consumed by pool size
    });

    it('should support both yze and year-zero identifiers', () => {
        const configYze = { defaultDice: '1', logic: 'count-success', engine: 'yze' as any };
        const configYearZero = { defaultDice: '1', logic: 'count-success', engine: 'year-zero' as any };
        
        expect(DiceEngine.rollFromConfig(configYze).rolls.length).toBe(1);
        expect(DiceEngine.rollFromConfig(configYearZero).rolls.length).toBe(1);
    });

    it('should apply modifiers to standard success counting pools', () => {
        const config = {
            defaultDice: '2d10',
            logic: 'count-success',
            successThreshold: 8
        };
        
        // 2d10 + 1 modifier (mod applied to count)
        const res = DiceEngine.rollFromConfig(config, { modifier: 1 });
        expect(res.rolls.filter(r => typeof r.val === 'number').length).toBe(2);
        expect(res.modifier).toBe(1);
    });
});

/**
 * **Le seuil n'est pas une réserve.**
 *
 * Relevé par David le 2026-08-21 sur Alien : six dés de base, un dé
 * d'équipement, et le pupitre en lançait seize à chaque jet. La branche Year
 * Zero lisait `targetOverwrite ?? gearCount` — le seuil de réussite servait de
 * nombre de dés d'équipement, et il l'emportait. Le pupitre naît avec un seuil
 * à dix et n'a aucune raison de le remettre à zéro en entrant dans un moteur
 * qui n'en a pas l'usage : six et dix font seize.
 *
 * On mesure ici le total de dés, pas le nombre de réussites : c'est la seule
 * chose que le défaut changeait, et le comptage des six est ailleurs.
 */
describe('Year Zero — le seuil ne se compte pas comme des dés', () => {
    const alien = { defaultDice: '6', logic: 'count-success', engine: 'yze' as const };

    it('un seuil transmis ne gonfle plus la réserve', () => {
        const res = DiceEngine.rollFromConfig(alien, {
            baseCount: 6,
            gearCount: 1,
            // Ce que le pupitre envoie sans le vouloir : son seuil par défaut.
            targetOverwrite: 10,
        });

        expect(res.rolls.length).toBe(7);
        expect(res.rolls.filter(r => r.source === 'base').length).toBe(6);
        expect(res.rolls.filter(r => r.source === 'gear').length).toBe(1);
    });

    it("les dés d'équipement suivent ce qu'on saisit", () => {
        const sans = DiceEngine.rollFromConfig(alien, { baseCount: 6, gearCount: 0, targetOverwrite: 10 });
        const trois = DiceEngine.rollFromConfig(alien, { baseCount: 6, gearCount: 3, targetOverwrite: 10 });

        expect(sans.rolls.length).toBe(6);
        expect(trois.rolls.length).toBe(9);
    });

    it("le modificateur reste sur la réserve de base, pas sur l'équipement", () => {
        const res = DiceEngine.rollFromConfig(alien, { baseCount: 6, gearCount: 2, modifier: -2 });

        expect(res.rolls.filter(r => r.source === 'base').length).toBe(4);
        expect(res.rolls.filter(r => r.source === 'gear').length).toBe(2);
    });
});

describe('un seuil fixe ne se fait pas écraser par un seuil non composé', () => {
    /**
     * **Le défaut, trouvé le 2026-08-15 sur une question de David** : *« et au
     * niveau du seuil fixe de 6, je fais comment ? »*
     *
     * `PanneauDeJet` remplaçait `dice.successThreshold` par `jet.seuil` **dans
     * tous les cas**. Or un jeu à réserve n'en compose aucun : `jet.seuil` vaut
     * alors zéro, et `rollFromConfig` traite ce zéro comme une absence —
     * `(… ?? config.successThreshold) || 10`. Un pilote déclarant « chaque six
     * est une réussite » aurait donc lancé **contre dix**.
     *
     * Alien y échappait par chance : son moteur `yze` court-circuite ce chemin
     * et compte les six en dur. Le défaut n'attendait que le premier jeu à
     * réserve déclarant un autre moteur.
     */
    it('le moteur retombe sur dix quand on lui passe zéro', () => {
        // La mesure qui fonde le correctif : ce n'est pas une supposition sur
        // le moteur, c'est son comportement.
        const contreZero = DiceEngine.rollFromConfig(
            { defaultDice: '5d6', logic: 'count-success', successThreshold: 0 },
            { baseCount: 5 },
        );
        const contreDix = DiceEngine.rollFromConfig(
            { defaultDice: '5d6', logic: 'count-success', successThreshold: 10 },
            { baseCount: 5 },
        );

        // Sur un d6, un seuil de dix est inatteignable : zéro réussite, toujours.
        expect(contreZero.successes).toBe(0);
        expect(contreDix.successes).toBe(0);
    });

    it('un seuil de six sur des d6 compte les six, lui', () => {
        let reussites = 0;
        for (let i = 0; i < 400; i++) {
            reussites += DiceEngine.rollFromConfig(
                { defaultDice: '5d6', logic: 'count-success', successThreshold: 6 },
                { baseCount: 5 },
            ).successes ?? 0;
        }
        // 2 000 dés, un six sur six en moyenne : on vérifie l'ordre de grandeur,
        // pas une valeur exacte — un test de hasard qui exige un nombre précis
        // échoue tôt ou tard sans rien signaler d'utile.
        expect(reussites).toBeGreaterThan(200);
        expect(reussites).toBeLessThan(470);
    });

    it('le moteur yze ne lit pas ce champ et compte les six lui-même', () => {
        // C'est pourquoi Alien fonctionnait malgré le défaut — et pourquoi
        // renseigner un seuil fixe n'y change rien.
        const jet = DiceEngine.rollFromConfig(
            { defaultDice: '1d6', logic: 'count-success', engine: 'yze', successThreshold: 0 },
            { baseCount: 6 },
        );
        expect(jet.rolls).toHaveLength(6);
        expect(jet.successes).toBe(jet.rolls.filter(d => d.val === 6).length);
    });
});

/**
 * Ce que ces tests protègent : **le sens du comptage arrive jusqu'au moteur**.
 *
 * Relevé par David le 2026-08-16, pupitre en main : « lorsque je choisis Pool de
 * Dés (Succès), il ne tient pas compte du signe < ou >. Les succès sont toujours
 * au-dessus du seuil. » Capture à l'appui — seuil 15, règle « ≤ », un d20 tombé
 * sur 19, annoncé SUCCÈS.
 *
 * Le moteur savait compter dessous depuis le 2026-08-10. Ce sont les APPELANTS
 * qui ne le lui disaient pas : le pupitre pour ses deux modes de réserve, et
 * `rollFromConfig` parce que `jet.sens` vit à côté du bloc `dice` qu'il reçoit.
 * *Le chemin s'arrêtait avant le moteur* — le même geste manquant que les dés de
 * stress d'Alien.
 *
 * **Un jet résolu à l'envers ne se voit jamais en séance.** Il ne plante pas, il
 * n'affiche rien d'anormal : il rend des réussites plausibles et exactement
 * inverses. C'est le pire mode de défaillance qu'un moteur de dés puisse avoir.
 */
describe('le sens du comptage voyage jusqu\'au moteur', () => {
    it("compte SOUS le seuil quand le pilote le déclare", () => {
        const res = DiceEngine.rollFromConfig({
            defaultDice: '20d20',
            logic: 'count-success',
            successThreshold: 15,
            engine: 'standard',
            sens: 'sous-ou-egal',
        });

        const reussis = res.rolls.filter(r => typeof r.val === 'number' && (r.val as number) <= 15).length;
        expect(res.successes).toBe(reussis);
    });

    it('compte au-dessus quand le pilote déclare le sens inverse', () => {
        const res = DiceEngine.rollFromConfig({
            defaultDice: '20d20',
            logic: 'count-success',
            successThreshold: 15,
            engine: 'standard',
            sens: 'superieur-ou-egal',
        });

        const reussis = res.rolls.filter(r => typeof r.val === 'number' && (r.val as number) >= 15).length;
        expect(res.successes).toBe(reussis);
    });

    it("garde le comptage au-dessus quand rien n'est déclaré", () => {
        // C'était le comportement, et c'est celui des réserves à la Vampire ou
        // Year Zero : un pilote muet ne doit pas changer de sens du jour au
        // lendemain.
        const res = DiceEngine.rollFromConfig({
            defaultDice: '20d20', logic: 'count-success', successThreshold: 15, engine: 'standard',
        });

        const reussis = res.rolls.filter(r => typeof r.val === 'number' && (r.val as number) >= 15).length;
        expect(res.successes).toBe(reussis);
    });

    /**
     * Le cas exact de la capture : un seul dé à 19, seuil 15, règle « ≤ ».
     * Aucune réussite ne doit être annoncée.
     */
    it("n'accorde aucune réussite à un 19 sous un seuil de 15", () => {
        const dessus = DiceEngine.rollPool(20, 1, 0, 15, false, { sens: 'under' });
        // On ne peut pas forcer le tirage : on vérifie l'invariant sur la valeur
        // réellement obtenue, ce qui couvre le 19 comme tous les autres.
        const val = dessus.rolls[0].val as number;
        expect(dessus.successes).toBe(val <= 15 ? 1 : 0);
    });
});

/**
 * Ce que ces tests protègent : **« le meilleur dé » s'inverse avec le sens du
 * comptage**, et `rollAdvantage` n'avait aucun test.
 *
 * La règle de Dice OS est la même partout — deux dés, on garde le meilleur pour
 * un Avantage, le moins bon pour un Désavantage. Mais « meilleur » n'est pas une
 * valeur haute : sur un jeu qui jette SOUS une Sauvegarde, c'est le PLUS BAS.
 * Un Avantage qui garderait le 18 plutôt que le 3 rendrait le bonus en malus —
 * *et comme toujours ici, ça ne planterait pas.* Le moteur savait déjà le faire
 * (le paramètre `rule`) ; rien ne le vérifiait.
 *
 * On ne peut pas forcer le tirage, donc on vérifie l'invariant sur les deux dés
 * réellement obtenus, deux cents fois : le dé retenu est toujours l'extremum
 * attendu, quelle que soit la paire.
 */
describe('l\'Avantage garde le meilleur dé, et « meilleur » dépend du sens', () => {
    /** Les deux dés d'un tirage : celui qu'on garde, celui qu'on écarte. */
    const tirage = (isAvantage: boolean, rule: 'over' | 'under') => {
        const res = DiceEngine.rollAdvantage(20, 0, isAvantage, 11, rule);
        const garde = res.rolls[0].val as number;
        const ecarte = res.rolls[1].val as number;
        return { res, garde, ecarte };
    };

    const centFois = (f: () => void) => { for (let i = 0; i < 200; i++) f(); };

    it('en comptage « sous », l\'Avantage garde le PLUS BAS', () => {
        centFois(() => {
            const { garde, ecarte } = tirage(true, 'under');
            expect(garde).toBe(Math.min(garde, ecarte));
        });
    });

    it('en comptage « sous », le Désavantage garde le plus haut', () => {
        centFois(() => {
            const { garde, ecarte } = tirage(false, 'under');
            expect(garde).toBe(Math.max(garde, ecarte));
        });
    });

    it('en comptage « au-dessus », l\'Avantage garde le plus haut', () => {
        centFois(() => {
            const { garde, ecarte } = tirage(true, 'over');
            expect(garde).toBe(Math.max(garde, ecarte));
        });
    });

    it('en comptage « au-dessus », le Désavantage garde le plus bas', () => {
        centFois(() => {
            const { garde, ecarte } = tirage(false, 'over');
            expect(garde).toBe(Math.min(garde, ecarte));
        });
    });

    it('le verdict se lit sur le dé retenu, jamais sur celui qu\'on a écarté', () => {
        centFois(() => {
            const { res, garde } = tirage(true, 'under');
            expect(res.tagSuccess).toBe(garde <= 11);
        });
    });

    it('le dé écarté est marqué, et il est le second', () => {
        const { res } = tirage(true, 'under');
        expect(res.rolls).toHaveLength(2);
        expect(res.rolls[0].isDropped).toBeUndefined();
        expect(res.rolls[1].isDropped).toBe(true);
    });
});

/**
 * Ce que ces tests protègent : **le panneau n'offre l'Avantage que là où un seul
 * dé tranche**.
 *
 * *Lancer un dé de plus et garder celui qu'on préfère* n'a aucun sens sur une
 * réserve — il n'y a pas de meilleur dé, il y a un compte de réussites. Offrir
 * le sélecteur chez Dune ou Alien inviterait à inventer une règle que ces jeux
 * n'ont pas, ce que l'outil ne fait jamais.
 *
 * La liste des moteurs qui résolvent eux-mêmes vit dans `DiceEngine` et nulle
 * part ailleurs : recopiée dans le panneau, elle dériverait le jour où un moteur
 * s'ajoute — et l'écran offrirait une option que le moteur n'appliquerait pas.
 */
describe('un seul dé décide, ou personne', () => {
    it('un d20 unique contre un seuil : oui', () => {
        expect(DiceEngine.unSeulDeDecide('standard', 1)).toBe(true);
        expect(DiceEngine.unSeulDeDecide(undefined, 1)).toBe(true);
    });

    it('une réserve de plusieurs dés : non', () => {
        expect(DiceEngine.unSeulDeDecide('standard', 2)).toBe(false);
        expect(DiceEngine.unSeulDeDecide('standard', 6)).toBe(false);
    });

    it('les moteurs qui résolvent eux-mêmes : non, même sur un seul dé', () => {
        for (const moteur of DiceEngine.MOTEURS_A_RESOLUTION_PROPRE) {
            expect(DiceEngine.unSeulDeDecide(moteur, 1), moteur).toBe(false);
        }
    });

    /**
     * **Le garde-fou contre la dérive.** Chacun de ces moteurs doit réellement
     * imposer sa résolution — au point de ne même pas lancer les dés que
     * `defaultDice` déclare. Le jour où l'un d'eux cesserait de le faire, la
     * liste mentirait au panneau sans qu'aucun écran ne le dise.
     *
     * On leur donne « 1d20 » et « lowest », soit exactement le jet où
     * l'Avantage aurait un sens. Aucun ne doit rendre un seul dé à vingt faces :
     * `yze` lance des d6, le percentile un d100, la famille 2d20 en lance deux.
     */
    it('et ces moteurs ne lancent même pas les dés déclarés', () => {
        for (const moteur of DiceEngine.MOTEURS_A_RESOLUTION_PROPRE) {
            const res = DiceEngine.rollFromConfig({
                defaultDice: '1d20',
                logic: 'lowest',
                successThreshold: 11,
                engine: moteur,
            });
            const unSeulD20 = res.rolls.length === 1 && res.rolls[0].sides === 20;
            expect(unSeulD20, moteur).toBe(false);
        }
    });
});
