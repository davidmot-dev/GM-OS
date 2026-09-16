import { describe, it, expect, beforeEach } from 'vitest';
import {
    SILENCE_APRES_UN_SIGNALEMENT,
    messageDeLaFrappePerdue,
    surveillerLaFrappe,
    type FrappePerdue,
} from './sondeDeLaFrappe';

/**
 * **La sonde qui dira où va la frappe.**
 *
 * *David, le 2026-09-16 : « je n'arrive pas à changer le titre d'un indice. De
 * temps en temps, je n'arrive pas à modifier un champ texte ».* Le champ refuse
 * la saisie pendant 30 s à 1 min, **puis se débloque tout seul**, et ça arrive
 * dans plusieurs modules.
 *
 * ⚠️ **Ma première sonde était la mauvaise.** J'avais supposé un fil
 * d'affichage bloqué. David a répondu que **le reste de l'écran répond
 * normalement** : le fil n'est pas bloqué, et un observateur de tâches longues
 * n'aurait rien trouvé. *Une mesure fondée sur une hypothèse fausse ne corrige
 * pas l'hypothèse, elle la confirme.*
 */

const constats: FrappePerdue[] = [];

/** Le temps et le différé sont injectés : un essai n'attend pas 60 ms. */
let horloge = 0;
const enAttente: (() => void)[] = [];
const differer = (rappel: () => void) => { enAttente.push(rappel); return 0; };
const declencher = () => { enAttente.splice(0).forEach(r => r()); };

let demonter: () => void;

const frapper = (touche = 'a', sur?: Partial<KeyboardEventInit>) => {
    window.dispatchEvent(new KeyboardEvent('keydown', {
        key: touche, bubbles: true, cancelable: true, ...sur,
    }));
};

/** Une frappe que quelqu'un a refusée en chemin. */
const frapperEtRefuser = (touche = 'a') => {
    const evenement = new KeyboardEvent('keydown', {
        key: touche, bubbles: true, cancelable: true,
    });
    evenement.preventDefault();
    window.dispatchEvent(evenement);
};

const poserUnChamp = (sur: Partial<HTMLInputElement> = {}) => {
    const champ = document.createElement('input');
    champ.id = 'clue-title';
    champ.type = 'text';
    Object.assign(champ, sur);
    document.body.appendChild(champ);
    champ.focus();
    return champ;
};

beforeEach(() => {
    document.body.innerHTML = '';
    constats.length = 0;
    enAttente.length = 0;
    horloge = 100_000;
    demonter?.();
    demonter = surveillerLaFrappe(
        (p) => constats.push(p),
        { differer, maintenant: () => horloge },
    );
});

describe('quand tout va bien, la sonde se tait', () => {
    it('une lettre qui s’inscrit ne dit rien', () => {
        const champ = poserUnChamp();
        frapper('a');
        champ.value = 'a';           // ce que fait le navigateur, puis React
        declencher();

        expect(constats).toEqual([]);
    });

    it('les touches qui n’écrivent rien sont ignorées', () => {
        poserUnChamp();
        for (const t of ['Shift', 'ArrowLeft', 'Enter', 'Escape', 'F5']) frapper(t);
        declencher();

        expect(constats).toEqual([]);
    });

    it('les raccourcis ne sont pas de la saisie', () => {
        poserUnChamp();
        frapper('k', { ctrlKey: true });
        frapper('s', { metaKey: true });
        frapper('a', { altKey: true });
        declencher();

        expect(constats).toEqual([]);
    });

    /** *Un journal qui crie tout le temps ne se lit plus.* */
    it('une case à cocher ne compte pas comme un champ de texte', () => {
        poserUnChamp({ type: 'checkbox' });
        frapper('a');
        declencher();

        expect(constats).toEqual([]);
    });
});

describe('⭐ frappe-refusee — le champ avait le focus et rien ne s’est écrit', () => {
    it('le signale, avec le champ visé', () => {
        poserUnChamp();
        frapper('a');
        declencher();

        expect(constats).toHaveLength(1);
        expect(constats[0]).toMatchObject({
            verdict: 'frappe-refusee', touche: 'a', cible: 'INPUT', champ: 'clue-title',
        });
    });

    /** ⭐ **La question qui tranche** : quelqu'un a-t-il appelé `preventDefault` ? */
    it('dit si quelqu’un a refusé la touche en chemin', () => {
        poserUnChamp();
        frapperEtRefuser('a');
        declencher();

        expect(constats[0].refusee).toBe(true);
    });

    it('dit si le champ était inerte', () => {
        poserUnChamp({ readOnly: true });
        frapper('a');
        declencher();

        expect(constats[0].inerte).toBe(true);
    });

    it('dit si le focus a bougé pendant la frappe', () => {
        poserUnChamp();
        frapper('a');
        document.createElement('input');
        (document.activeElement as HTMLElement)?.blur();
        declencher();

        expect(constats[0].focusDeplace).toBe(true);
    });

    /** Rien de tout ça : c'est alors le rendu qui réécrit la valeur. */
    it('le dit aussi quand aucune cause n’est visible', () => {
        poserUnChamp();
        frapper('a');
        declencher();

        expect(constats[0]).toMatchObject({ refusee: false, inerte: false });
        expect(messageDeLaFrappePerdue(constats[0])).toContain('sans cause visible');
    });
});

describe('⭐ hors-champ — la touche est partie, personne n’écoutait', () => {
    it('le signale quand aucun champ n’a le focus', () => {
        frapper('a');
        declencher();

        expect(constats).toHaveLength(1);
        expect(constats[0].verdict).toBe('hors-champ');
    });

    it('nomme ce qui avait le focus', () => {
        const bouton = document.createElement('button');
        document.body.appendChild(bouton);
        bouton.focus();

        frapper('a');
        declencher();

        expect(constats[0].cible).toBe('BUTTON');
    });
});

describe('⚠️ elle ne noie pas le journal', () => {
    /** *Une seconde de blocage écrirait quarante lignes et noierait la seule qui compte.* */
    it('n’écrit qu’une ligne par rafale', () => {
        poserUnChamp();
        for (let n = 0; n < 20; n++) frapper('a');
        declencher();

        expect(constats).toHaveLength(1);
    });

    it('reparle une fois le silence passé', () => {
        poserUnChamp();
        frapper('a');
        declencher();

        horloge += SILENCE_APRES_UN_SIGNALEMENT + 1;
        frapper('b');
        declencher();

        expect(constats).toHaveLength(2);
    });
});

describe('la sonde se démonte', () => {
    it('et cesse alors de signaler', () => {
        poserUnChamp();
        demonter();

        frapper('a');
        declencher();

        expect(constats).toEqual([]);
    });
});

describe('messageDeLaFrappePerdue', () => {
    it('nomme la cause quand il y en a une', () => {
        const message = messageDeLaFrappePerdue({
            verdict: 'frappe-refusee', touche: 'a', cible: 'INPUT', champ: 'clue-title',
            refusee: true, inerte: false, focusDeplace: false,
        });

        expect(message).toContain('clue-title');
        expect(message).toContain('preventDefault');
    });

    it('dit ce qui avait le focus quand la frappe est partie hors champ', () => {
        const message = messageDeLaFrappePerdue({
            verdict: 'hors-champ', touche: 'z', cible: 'BODY',
            refusee: false, inerte: false, focusDeplace: false,
        });

        expect(message).toContain('aucun champ');
        expect(message).toContain('BODY');
    });
});
