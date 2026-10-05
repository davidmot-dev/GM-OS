import { afterEach, describe, expect, it, vi } from 'vitest';
import { appliquerApparenceTablettes, type ApparenceTablettes } from './apparenceTablettes';
import { policesPourTablettes } from './policesPourTablettes';

const base: ApparenceTablettes = {
    theme: 'cyberpunk', accent: '#06b6d4', personnalites: true,
    jeu: null, polices: '',
};

afterEach(() => {
    vi.unstubAllGlobals();
    document.head.querySelectorAll('style[data-polices-tablette]').forEach(style => style.remove());
});

describe('apparence reçue du PC', () => {
    it('applique les jetons et icônes, puis efface ceux du jeu quitté', () => {
        appliquerApparenceTablettes({
            ...base,
            jeu: {
                jetons: { bg: '#060909', accent: '#8fb7b1', text: '#f0f3f1' },
                clarte: 'dark', ornements: {},
                icones: { 'journal': 'url("data:image/svg+xml,icone")' },
            },
        });
        expect(document.documentElement.style.getPropertyValue('--app-bg')).toBe('#060909');
        expect(document.documentElement.style.getPropertyValue('--app-accent')).toBe('#8fb7b1');
        expect(document.documentElement.style.getPropertyValue('--icone-journal')).toContain('data:image/svg+xml');

        appliquerApparenceTablettes({ ...base, theme: 'claire' });
        expect(document.documentElement.getAttribute('data-theme')).toBe('claire');
        expect(document.documentElement.style.getPropertyValue('--icone-journal')).toBe('');
    });

    it('incorpore les fichiers de police sur le PC sans transmettre leur URL Google', async () => {
        const police = new Uint8Array([0, 1, 2, 3]);
        const fetchSimule = vi.fn(async (url: string) => url.includes('googleapis')
            ? new Response('@font-face { font-family: "Essai"; src: url(https://fonts.gstatic.com/s/essai.woff2) format("woff2"); }')
            : new Response(police));
        vi.stubGlobal('fetch', fetchSimule);
        const css = await policesPourTablettes(['https://fonts.googleapis.com/css2?family=Essai']);
        expect(css).toContain('data:font/woff2;base64,AAECAw==');
        expect(css).not.toContain('fonts.gstatic.com');
        expect(await policesPourTablettes(['https://fonts.googleapis.com/css2?family=Essai'])).toBe(css);
        expect(fetchSimule).toHaveBeenCalledTimes(2);
        appliquerApparenceTablettes({ ...base, polices: css });
        const style = document.head.querySelector('style[data-polices-tablette]');
        expect(style?.textContent).toBe(css);
        appliquerApparenceTablettes({ ...base, accent: '#ffffff', polices: css });
        expect(document.head.querySelector('style[data-polices-tablette]')).toBe(style);
    });
});
