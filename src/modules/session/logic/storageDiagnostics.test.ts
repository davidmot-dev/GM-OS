import { describe, it, expect } from 'vitest';
import {
    measureEntryBytes,
    measureLocalStorageUsage,
    formatBytes,
    reportStorageUsage,
    SESSION_STORAGE_KEY,
    STORAGE_WARNING_BYTES,
} from './storageDiagnostics';

/** Storage minimal en mémoire, suffisant pour la mesure. */
class FakeStorage implements Storage {
    private map = new Map<string, string>();

    get length() { return this.map.size; }
    key(index: number): string | null { return [...this.map.keys()][index] ?? null; }
    getItem(key: string): string | null { return this.map.get(key) ?? null; }
    setItem(key: string, value: string): void { this.map.set(key, value); }
    removeItem(key: string): void { this.map.delete(key); }
    clear(): void { this.map.clear(); }
    [name: string]: any;
}

describe('measureEntryBytes', () => {
    it('compte la clé et la valeur, en UTF-16', () => {
        // 3 + 5 unités de code, deux octets chacune.
        expect(measureEntryBytes('abc', 'hello')).toBe(16);
    });

    it('compte une clé sans valeur', () => {
        expect(measureEntryBytes('k', '')).toBe(2);
    });
});

describe('measureLocalStorageUsage', () => {
    it('additionne toutes les entrées', () => {
        const s = new FakeStorage();
        s.setItem('a', 'xx');   // (1 + 2) * 2 = 6
        s.setItem('bb', 'yyy'); // (2 + 3) * 2 = 10

        expect(measureLocalStorageUsage(s).totalBytes).toBe(16);
    });

    it('isole la clé du store de session', () => {
        const s = new FakeStorage();
        s.setItem('autre', 'x');
        s.setItem(SESSION_STORAGE_KEY, 'y'.repeat(100));

        const usage = measureLocalStorageUsage(s);
        expect(usage.sessionBytes).toBe((SESSION_STORAGE_KEY.length + 100) * 2);
        expect(usage.totalBytes).toBeGreaterThan(usage.sessionBytes);
    });

    it('classe les entrées de la plus lourde à la plus légère', () => {
        const s = new FakeStorage();
        s.setItem('petit', 'a');
        s.setItem('gros', 'a'.repeat(500));
        s.setItem('moyen', 'a'.repeat(50));

        expect(measureLocalStorageUsage(s).entries.map(e => e.key)).toEqual(['gros', 'moyen', 'petit']);
    });

    it('gère un stockage vide', () => {
        const usage = measureLocalStorageUsage(new FakeStorage());
        expect(usage.totalBytes).toBe(0);
        expect(usage.sessionBytes).toBe(0);
        expect(usage.entries).toEqual([]);
        expect(usage.isNearQuota).toBe(false);
    });

    it('signale le franchissement du seuil d\'alerte', () => {
        const s = new FakeStorage();
        s.setItem(SESSION_STORAGE_KEY, 'a'.repeat(STORAGE_WARNING_BYTES / 2));

        expect(measureLocalStorageUsage(s).isNearQuota).toBe(true);
    });

    it('ne signale rien juste sous le seuil', () => {
        const s = new FakeStorage();
        s.setItem('k', 'a'.repeat(STORAGE_WARNING_BYTES / 2 - 100));

        expect(measureLocalStorageUsage(s).isNearQuota).toBe(false);
    });
});

describe('formatBytes', () => {
    it('formate les octets, kilooctets et mégaoctets', () => {
        expect(formatBytes(512)).toBe('512 o');
        expect(formatBytes(2048)).toBe('2.0 Ko');
        expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 Mo');
    });
});

describe('reportStorageUsage', () => {
    it('renvoie la mesure', () => {
        const s = new FakeStorage();
        s.setItem('a', 'x');
        expect(reportStorageUsage(s)?.totalBytes).toBe(4);
    });

    it('ne lève pas si le stockage est inaccessible', () => {
        const hostile = {
            get length(): number { throw new Error('accès refusé'); },
        } as unknown as Storage;

        expect(reportStorageUsage(hostile)).toBeNull();
    });
});
