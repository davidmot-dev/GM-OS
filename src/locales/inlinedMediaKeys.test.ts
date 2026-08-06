import { describe, it, expect } from 'vitest';
import fr from './fr/settings.json';
import en from './en/settings.json';

/**
 * Les libellés du panneau de reprise des médias avaient été rangés par erreur
 * dans le bloc `maintenance`, alors que le composant les interroge à la racine.
 * L'interface affichait donc les clés brutes — visible, mais seulement une fois
 * l'écran ouvert. Ce test rend la faute détectable sans lancer l'application.
 */
const REQUIRED_KEYS = [
    'title', 'description',
    'scan_button', 'scan_failed', 'none', 'found',
    'backup_hint', 'confirm',
    'migrate_button', 'migrating', 'migrate_failed',
    'done', 'report', 'kept',
];

describe.each([['fr', fr], ['en', en]])('settings.json (%s) — inlined_media', (_lang, bundle: any) => {
    it('expose le bloc à la racine, pas sous maintenance', () => {
        expect(bundle.inlined_media).toBeDefined();
        expect(bundle.maintenance?.inlined_media).toBeUndefined();
    });

    it('fournit toutes les clés utilisées par le panneau', () => {
        for (const key of REQUIRED_KEYS) {
            expect(bundle.inlined_media[key], `clé manquante : ${key}`).toBeTruthy();
        }
    });

    it('n\'expose pas de clé orpheline', () => {
        expect(Object.keys(bundle.inlined_media).sort()).toEqual([...REQUIRED_KEYS].sort());
    });
});

describe('settings.json — parité entre langues', () => {
    it('déclare les mêmes clés en français et en anglais', () => {
        expect(Object.keys((en as any).inlined_media).sort())
            .toEqual(Object.keys((fr as any).inlined_media).sort());
    });

    it('conserve les marqueurs d\'interpolation dans les deux langues', () => {
        for (const [key, placeholders] of [
            ['found', ['{{count}}', '{{size}}']],
            ['migrating', ['{{done}}', '{{total}}']],
            ['done', ['{{count}}', '{{size}}']],
            ['report', ['{{count}}', '{{size}}']],
            ['kept', ['{{count}}']],
        ] as [string, string[]][]) {
            for (const bundle of [fr, en] as any[]) {
                for (const placeholder of placeholders) {
                    expect(bundle.inlined_media[key]).toContain(placeholder);
                }
            }
        }
    });
});
