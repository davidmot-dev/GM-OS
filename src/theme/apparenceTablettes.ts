import { appliquerLeTheme, type ThemeID } from './themeDeLInterface';
import { pontVersLInterface } from './jetonsDeTheme';
import type { ThemeDuJeuCharge } from './themeDuJeu';

/** Données résolues par le PC : aucune feuille CSS de jeu ne franchit le réseau. */
export interface ApparenceTablettes {
    theme: ThemeID;
    accent: string;
    personnalites: boolean;
    jeu: Pick<ThemeDuJeuCharge, 'jetons' | 'clarte' | 'ornements' | 'icones'> | null;
    /** @font-face seulement, avec les fichiers incorporés par le PC. */
    polices: string;
}

let courante: ApparenceTablettes | null = null;
const abonnes = new Set<(apparence: ApparenceTablettes) => void>();

export function lireApparenceTablettes(): ApparenceTablettes | null {
    return courante;
}

export function publierApparenceTablettes(apparence: ApparenceTablettes): void {
    courante = apparence;
    abonnes.forEach(abonne => abonne(apparence));
}

export function abonnerApparenceTablettes(abonne: (apparence: ApparenceTablettes) => void): () => void {
    abonnes.add(abonne);
    return () => { abonnes.delete(abonne); };
}

/** Le navigateur reçoit les valeurs du PC ; il ne lit ni disque ni Google Fonts. */
export function appliquerApparenceTablettes(apparence: ApparenceTablettes): void {
    if (!apparence || typeof document === 'undefined') return;
    const { jeu, personnalites } = apparence;
    appliquerLeTheme(apparence.theme, apparence.accent, jeu ? {
        variables: pontVersLInterface(jeu.jetons, { personnalites }),
        ...jeu,
    } : undefined, { personnalites });

    const style = document.head.querySelector<HTMLStyleElement>('style[data-polices-tablette]');
    if (!apparence.polices) style?.remove();
    else if (style?.textContent !== apparence.polices) {
        const feuille = style ?? document.createElement('style');
        feuille.setAttribute('data-polices-tablette', '');
        feuille.textContent = apparence.polices;
        if (!style) document.head.appendChild(feuille);
    }
}
