import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * **L'atelier de thème, du clic au fichier.**
 *
 * *Demandé par David le 2026-09-03.* Les essais de `editionDuTheme` gardent
 * l'écriture ; ceux-ci gardent **le chemin** : que le fichier lu soit celui du
 * jeu de la campagne ouverte, et que ce qui part sur le disque soit ce que le
 * meneur a réglé — *le motif que ce dépôt paie depuis un mois est toujours le
 * même, le chemin s'arrête avant le moteur.*
 */

vi.mock('../modules/session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

/* Le ducking referme un cycle d'imports dès qu'un test entre par le magasin de
   session ; il n'a rien à voir avec une couleur. */
vi.mock('../modules/voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { AtelierDuTheme } = await import('./AtelierDuTheme');
const { useSessionOSStore } = await import('../modules/session/useSessionOSStore');

/** Un thème réduit, mais avec ce qui doit survivre : commentaire et règle de fiche. */
const THEME = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap');

:root[data-theme="exemple"] {
  color-scheme: dark;
  --rpg-bg: #020711;
  --rpg-text: #edf1ef;
  --rpg-accent: #ff5f56;
  --rpg-font-display: "Oswald", Arial Narrow, sans-serif;
}

:root[data-theme="exemple"] .rpg-page {
  background: #020711;
}
`;

/** Ce que porterait la copie d'origine : reconnaissable d'un coup d'œil. */
const ORIGINAL = THEME.replace('#ff5f56', '#aabbcc');

const CHEMIN = 'systems/exemple/theme/theme.css';
const CHEMIN_ORIGINAL = 'systems/exemple/theme/theme.original.css';

const readDoc = vi.fn<(chemin: string) => Promise<string | null>>(async () => null);
const writeDoc = vi.fn<(chemin: string, contenu: string) => Promise<boolean>>(async () => true);

/**
 * Le disque, tel que l'atelier le voit : le thème, et **pas encore** de copie
 * d'origine. C'est l'état d'un jeu auquel personne n'a touché.
 */
const surLeDisque = (original: string | null = null) =>
    readDoc.mockImplementation(async (chemin: string) =>
        chemin === CHEMIN_ORIGINAL ? original : THEME);

beforeEach(() => {
    vi.clearAllMocks();
    surLeDisque();
    (window as unknown as { appBridge: unknown }).appBridge = {
        ai: { readDoc, writeDoc, listSystems: async () => ['systems/exemple'] },
    };
    useSessionOSStore.setState({
        activeCampaignId: 'c-1',
        campaigns: [{ id: 'c-1', name: 'La Nuit', system: 'exemple', systemPath: 'systems/exemple' }],
        customGameDrivers: [{ id: 'exemple', name: 'Exemple', corpusId: 'exemple' }],
    } as never);
});

/**
 * **Chaque curseur écrit SON jeton.**
 *
 * Défaut trouvé par David le 2026-09-05, le jour même où les quatre bandes de
 * taille sont arrivées : *« quand je bouge un slider, c'est le slider tout le
 * texte qui bouge »*. `ChampDEchelle` écrivait `'font-scale'` **en dur**.
 *
 * ⭐ **Le défaut n'existait pas avant ce jour-là : il attendait.** Tant qu'il n'y
 * avait qu'un seul réglage d'échelle, la clé en dur et la clé du jeton se
 * confondaient. *Un code juste par coïncidence devient faux le jour où la
 * coïncidence cesse* — et rien ne l'annonce.
 */
describe('chaque réglage écrit le sien', () => {
    /** Les cinq échelles, celles qui partageaient une même clé. */
    const ECHELLES = [
        ['Tout le texte', 'font-scale'],
        ['Étiquettes et badges', 'scale-interface'],
        ['Texte courant', 'scale-corps'],
        ['Titres et grands nombres', 'scale-titres'],
        ['Chiffres et code', 'scale-mono'],
    ] as const;

    it.each(ECHELLES)('« %s » écrit « %s » et pas un autre', async (libelle, cle) => {
        render(<AtelierDuTheme />);
        await screen.findByLabelText('Accent');

        const curseur = screen.getByLabelText(libelle);
        fireEvent.change(curseur, { target: { value: '1.3' } });
        fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

        await waitFor(() => expect(writeDoc).toHaveBeenCalled());
        const ecrit = writeDoc.mock.calls.at(-1)![1];
        expect(ecrit).toContain(`--rpg-${cle}: 1.3`);
    });

    it('bouger UN curseur ne touche pas les quatre autres', async () => {
        render(<AtelierDuTheme />);
        await screen.findByLabelText('Accent');

        /* Un palier de la liste, et pas une valeur inventée : un `<select>`
           refuse ce qu'il n'offre pas, et le test ne mesurerait plus rien. */
        fireEvent.change(screen.getByLabelText('Chiffres et code'), { target: { value: '1.2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

        await waitFor(() => expect(writeDoc).toHaveBeenCalled());
        const ecrit = writeDoc.mock.calls.at(-1)![1];

        expect(ecrit).toContain('--rpg-scale-mono: 1.2');
        /* C'est LA régression : le curseur écrivait « tout le texte ». */
        expect(ecrit).not.toContain('--rpg-font-scale');
        expect(ecrit).not.toContain('--rpg-scale-titres');
    });

    /**
     * **« Non réglé » efface, il n'écrit pas « 100 % ».**
     *
     * C'est la règle que suit déjà `themeDeLInterface` en retirant la propriété
     * plutôt qu'en posant « 1 » : *ne rien dire et dire « échelle 1 » doivent
     * laisser la même page.* Le curseur d'avant la tenait par un bouton
     * « Défaut » à côté ; la liste la tient par sa première option, et rien ne
     * garderait cet accord si personne ne le vérifiait ici.
     */
    it('« Non réglé » retire le jeton du fichier', async () => {
        /* Il faut partir d'un thème qui LE PORTE : effacer ce qui n'est pas là
           ne change rien, donc n'enregistre rien — et le test ne mesurerait que
           le bouton grisé. */
        readDoc.mockImplementation(async (chemin: string) =>
            chemin === CHEMIN_ORIGINAL
                ? null
                : THEME.replace('--rpg-accent: #ff5f56;', '--rpg-accent: #ff5f56; --rpg-scale-corps: 1.2;'));

        render(<AtelierDuTheme />);
        await screen.findByLabelText('Accent');

        fireEvent.change(screen.getByLabelText('Texte courant'), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

        await waitFor(() => expect(writeDoc).toHaveBeenCalled());
        expect(writeDoc.mock.calls.at(-1)![1]).not.toContain('--rpg-scale-corps');
    });

    /** Les six paliers sont offerts, et nommés — c'est tout l'objet du change. */
    it('offre des tailles nommées plutôt qu’un pourcentage nu', async () => {
        render(<AtelierDuTheme />);
        await screen.findByLabelText('Accent');

        const liste = screen.getByLabelText('Texte courant') as HTMLSelectElement;
        const libelles = [...liste.options].map(o => o.textContent);

        expect(libelles).toContain('Normal · 100 %');
        expect(libelles).toContain('Énorme · 130 %');
        /* Le plafond demandé par David le 2026-09-06. */
        expect(libelles).toContain('Maximal · 200 %');
        expect(liste.options[0].value).toBe('');
    });

    it('les cinq réglages portent cinq libellés distincts — sinon on ne les distinguerait pas', () => {
        const libelles = new Set(ECHELLES.map(([l]) => l));
        expect(libelles.size).toBe(5);
    });
});

describe('l’atelier de thème', () => {
    it('lit le thème du jeu de la campagne ouverte', async () => {
        render(<AtelierDuTheme />);

        await waitFor(() => expect(readDoc).toHaveBeenCalledWith(CHEMIN));
        // Deux champs portent la couleur : le sélecteur et la saisie. On vise
        // la saisie par son étiquette, la seule adresse stable des deux.
        expect(await screen.findByLabelText('Accent')).toHaveProperty('value', '#ff5f56');
    });

    /**
     * Le contrôle central de ce chemin : **ce qui part sur le disque est ce que
     * le meneur a réglé, et rien d'autre n'a bougé.** Les règles `.rpg-*` que
     * l'application n'affiche jamais habillent les fiches — les perdre ne se
     * verrait qu'un autre jour, en ouvrant une fiche.
     */
    it('écrit la couleur réglée sans toucher aux règles des fiches', async () => {
        render(<AtelierDuTheme />);
        const champ = await screen.findByLabelText('Accent');

        fireEvent.change(champ, { target: { value: '#00ff88' } });
        fireEvent.click(screen.getByText('Enregistrer'));

        await waitFor(() => expect(writeDoc).toHaveBeenCalled());
        const ecriture = writeDoc.mock.calls.find(([c]) => c === CHEMIN);
        expect(ecriture).toBeTruthy();
        expect(ecriture![1]).toContain('--rpg-accent: #00ff88;');
        expect(ecriture![1]).toContain('.rpg-page {');
        expect(ecriture![1]).toContain('--rpg-bg: #020711;');
    });

    /** Rien ne part sur le disque tant que le meneur n'a pas dit « Enregistrer ». */
    it('n’écrit rien tant qu’on n’a pas enregistré', async () => {
        render(<AtelierDuTheme />);
        const champ = await screen.findByLabelText('Accent');

        fireEvent.change(champ, { target: { value: '#00ff88' } });

        expect(writeDoc).not.toHaveBeenCalled();
    });

    /**
     * Un jeu sans thème n'est pas une erreur : c'est le cas de la plupart. On
     * propose d'en créer un, on n'en invente pas un dans son dos.
     */
    it('propose de créer un thème quand le jeu n’en a pas', async () => {
        readDoc.mockResolvedValue(null);

        render(<AtelierDuTheme />);

        expect(await screen.findByText('Créer un thème')).toBeTruthy();
        expect(writeDoc).not.toHaveBeenCalled();
    });

    /**
     * **Le filet, demandé par David le 2026-09-03.** La copie part au PREMIER
     * enregistrement, avec le fichier **tel qu'il était avant la retouche** —
     * pas avec ce qu'on vient de régler, sans quoi elle ne sauverait rien.
     */
    it('copie le thème d’origine avant de le réécrire, la première fois', async () => {
        render(<AtelierDuTheme />);
        const champ = await screen.findByLabelText('Accent');

        fireEvent.change(champ, { target: { value: '#00ff88' } });
        fireEvent.click(screen.getByText('Enregistrer'));

        await waitFor(() => expect(writeDoc).toHaveBeenCalledTimes(2));
        const [cheminCopie, copie] = writeDoc.mock.calls[0];
        expect(cheminCopie).toBe(CHEMIN_ORIGINAL);
        expect(copie).toBe(THEME);
        // La copie part AVANT la réécriture : l'ordre est la moitié du filet.
        expect(writeDoc.mock.calls[1][0]).toBe(CHEMIN);
    });

    /**
     * *La reprendre au deuxième enregistrement sauvegarderait nos propres
     * retouches* — donc n'avoir aucun filet tout en croyant en avoir un.
     */
    it('ne reprend pas la copie quand elle existe déjà', async () => {
        surLeDisque(ORIGINAL);
        render(<AtelierDuTheme />);
        const champ = await screen.findByLabelText('Accent');

        fireEvent.change(champ, { target: { value: '#00ff88' } });
        fireEvent.click(screen.getByText('Enregistrer'));

        await waitFor(() => expect(writeDoc).toHaveBeenCalled());
        expect(writeDoc.mock.calls.some(([c]) => c === CHEMIN_ORIGINAL)).toBe(false);
    });

    /** Pas de copie, pas de bouton : on ne promet pas un retour qui n'existe pas. */
    it('n’offre la restauration que s’il y a une copie', async () => {
        render(<AtelierDuTheme />);
        await screen.findByLabelText('Accent');

        expect(screen.queryByText('Restaurer l’original')).toBeNull();
    });

    /**
     * **Deux clics, et le second seulement écrit.** Confondre ce bouton avec
     * « Annuler » ferait perdre une séance de réglages à qui voulait défaire son
     * dernier geste.
     */
    it('remet le fichier d’origine après confirmation', async () => {
        surLeDisque(ORIGINAL);
        render(<AtelierDuTheme />);
        await screen.findByLabelText('Accent');

        fireEvent.click(await screen.findByText('Restaurer l’original'));
        expect(writeDoc).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText('Confirmer ?'));

        await waitFor(() => expect(writeDoc).toHaveBeenCalledWith(CHEMIN, ORIGINAL));
        // Et l'écran repart de ce fichier-là.
        await waitFor(() => expect(screen.getByLabelText('Accent')).toHaveProperty('value', '#aabbcc'));
    });

    it('n’affiche aucun réglage sans campagne ouverte', async () => {
        useSessionOSStore.setState({ activeCampaignId: null } as never);

        render(<AtelierDuTheme />);

        expect(await screen.findByText('Aucune campagne ouverte')).toBeTruthy();
        expect(readDoc).not.toHaveBeenCalled();
    });
});
