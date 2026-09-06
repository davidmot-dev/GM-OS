import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoupeDeLecture from './LoupeDeLecture';
import { borner, CLE, LOUPE_MAX, LOUPE_MIN } from './reglageDeLoupe';

/**
 * **La loupe de lecture** — demandée par David le 2026-09-06 pour lire une
 * fiche technique en pleine partie.
 *
 * Ce qui se garde ici est **le geste**, pas l'apparence : que Ctrl + molette
 * grossisse et que la molette nue ne fasse rien (sinon le document sauterait
 * de taille à chaque défilement), que le réglage survive au changement
 * d'article, et qu'un stockage refusé n'emporte pas la lecture avec lui.
 */

const enveloppe = () => screen.getByRole('group', { name: 'Loupe de lecture' }).parentElement!;

/**
 * Le grossissement réellement appliqué au document.
 *
 * ⛔ On le lit sur le sous-arbre zoomé, **pas sur l'enveloppe** : la commande
 * est soeur du contenu et doit rester à sa taille. C'est ce que la version
 * précédente ratait autrement — elle posait une variable dont les classes
 * utilitaires du document ne faisaient rien.
 */
const zoome = () => enveloppe().querySelector<HTMLElement>('[data-loupe]')!;
const loupe = () => zoome().style.zoom || '1';

const documentLu = (
    <LoupeDeLecture>
        <div className="prose">Fiches techniques comparatives</div>
    </LoupeDeLecture>
);

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('les deux gestes', () => {
    it('les boutons montent et descendent d’un dixième', () => {
        render(documentLu);
        expect(loupe()).toBe('1');

        fireEvent.click(screen.getByLabelText('Agrandir le texte'));
        expect(loupe()).toBe('1.1');

        fireEvent.click(screen.getByLabelText('Réduire le texte'));
        expect(loupe()).toBe('1');
    });

    it('Ctrl + molette grossit, la molette nue laisse défiler', () => {
        render(documentLu);

        fireEvent.wheel(enveloppe(), { deltaY: -100, ctrlKey: true });
        expect(loupe()).toBe('1.1');

        /* ⛔ La régression à éviter : un document qui change de taille dès qu'on
           le fait défiler. */
        fireEvent.wheel(enveloppe(), { deltaY: -100 });
        expect(loupe()).toBe('1.1');
    });

    it('le pourcentage se clique pour revenir à 100 %', () => {
        render(documentLu);
        fireEvent.wheel(enveloppe(), { deltaY: -100, ctrlKey: true });
        fireEvent.wheel(enveloppe(), { deltaY: -100, ctrlKey: true });
        expect(screen.getByLabelText('Taille normale').textContent).toContain('120 %');

        fireEvent.click(screen.getByLabelText('Taille normale'));
        expect(loupe()).toBe('1');
    });
});

describe('ce que le zoom NE touche PAS', () => {
    /**
     * ⛔ **Le défaut du 2026-09-06 :** à 230 %, les titres crevaient l'écran et
     * les paragraphes n'avaient pas bougé — ils portent `prose-p:text-lg`, une
     * taille en `rem` que l'héritage n'atteint pas. Le `zoom` agit sur le
     * sous-arbre entier, classes comprises ; ce test garde le fait que le
     * contenu est bien DANS ce sous-arbre.
     */
    it('grossit tout le document, classes utilitaires comprises', () => {
        render(
            <LoupeDeLecture>
                <div className="prose prose-p:text-lg">
                    <p className="text-lg">Une taille écrite en rem</p>
                </div>
            </LoupeDeLecture>,
        );
        fireEvent.click(screen.getByLabelText('Agrandir le texte'));

        expect(zoome().contains(screen.getByText('Une taille écrite en rem'))).toBe(true);
        expect(loupe()).toBe('1.1');
    });

    it('laisse sa propre commande à taille normale', () => {
        render(documentLu);
        fireEvent.click(screen.getByLabelText('Agrandir le texte'));

        const commande = screen.getByRole('group', { name: 'Loupe de lecture' });
        expect(zoome().contains(commande)).toBe(false);
    });
});

describe('les bornes', () => {
    it('ne descendent ni ne montent hors de la plage', () => {
        expect(borner(0.1)).toBe(LOUPE_MIN);
        expect(borner(99)).toBe(LOUPE_MAX);
        /* Le dixième est arrondi : sans quoi 0,1 + 0,2 donnerait 0,30000000000000004
           et le pourcentage afficherait un nombre à virgule. */
        expect(borner(1.24)).toBe(1.2);
    });

    it('le bouton se désactive au bout de la course', () => {
        window.localStorage.setItem(CLE, String(LOUPE_MAX));
        render(documentLu);
        expect(screen.getByLabelText('Agrandir le texte')).toHaveProperty('disabled', true);
        expect(screen.getByLabelText('Réduire le texte')).toHaveProperty('disabled', false);
    });
});

describe('la mémoire de l’appareil', () => {
    it('retrouve le réglage d’un document à l’autre', () => {
        const { unmount } = render(documentLu);
        fireEvent.click(screen.getByLabelText('Agrandir le texte'));
        unmount();

        render(documentLu);
        expect(loupe()).toBe('1.1');
    });

    it('une valeur illisible ne vaut jamais mieux que la taille normale', () => {
        window.localStorage.setItem(CLE, 'grand');
        render(documentLu);
        expect(loupe()).toBe('1');
    });

    /**
     * ⚠️ Le hub et le projecteur partagent le `localStorage` du meneur, et un
     * stockage peut refuser d'écrire. *Un confort qui échoue ne doit jamais
     * emporter son écran* — le document s'affiche, la loupe ne se souvient
     * simplement pas.
     */
    it('un stockage en panne n’empêche ni la lecture ni le grossissement', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('quota');
        });

        render(documentLu);
        fireEvent.click(screen.getByLabelText('Agrandir le texte'));

        expect(loupe()).toBe('1.1');
        expect(screen.getByText('Fiches techniques comparatives')).toBeTruthy();
    });
});
