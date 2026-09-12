import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { verdictDuProfil, isolationDemandee, PROFIL_ATTENDU } from './gardeDuProfil';

/*
  ⚠️ Ces chemins sont écrits à la mode du système qui fait tourner le test.
  Les écrire en dur à la Windows ferait passer le test pour un autre : sur un
  disque sensible à la casse, `path.resolve` ne les replierait pas de la même
  façon — et c'est précisément ce repliement qu'on éprouve.
*/
const APP_DATA = path.join(path.sep, 'Users', 'david', 'AppData', 'Roaming');
const VRAI = path.join(APP_DATA, PROFIL_ATTENDU);
const JETABLE = path.join(path.sep, 'Temp', 'gmos-repetition-1234');

describe('isolationDemandee', () => {
    it('reconnaît les deux écritures de Chromium', () => {
        expect(isolationDemandee([`--user-data-dir=${JETABLE}`])).toBe(true);
        expect(isolationDemandee(['--user-data-dir', JETABLE])).toBe(true);
    });

    it('ne voit pas d’isolation dans un démarrage ordinaire', () => {
        expect(isolationDemandee(['electron.exe', 'dist-electron/main.js'])).toBe(false);
    });

    /* Un commutateur qui commence pareil n'est pas celui-là. */
    it('ne confond pas avec un autre commutateur', () => {
        expect(isolationDemandee(['--user-data-dir-suffix=x'])).toBe(false);
    });
});

describe('verdictDuProfil — sans isolation, le démarrage du meneur', () => {
    it('accepte le vrai profil, et le nomme au journal', () => {
        const v = verdictDuProfil({ profilVerrouille: VRAI, profilReel: VRAI, argv: [] });

        expect(v.accepte).toBe(true);
        expect(v.isole).toBe(false);
        /* Le journal doit dire OÙ, même quand tout va bien : c'est ce qui
           manquait le 11/09 pour trancher en trente secondes. */
        expect(v.motif).toContain(VRAI);
    });

    /*
      ⛔ LE DÉFAUT DU 2026-09-11, exactement : `app.name` n'ayant pas encore été
      posé, le verrou est tombé sur le nom de `package.json`.
    */
    it('refuse un profil qui n’est pas celui du meneur', () => {
        const v = verdictDuProfil({
            profilVerrouille: path.join(APP_DATA, 'gm-os-v6'),
            profilReel: VRAI,
            argv: [],
        });

        expect(v.accepte).toBe(false);
        expect(v.motif).toContain('gm-os-v6');
        expect(v.motif).toContain(VRAI);
    });

    it('tient la casse de Windows pour la même — sinon il refuserait un démarrage sain', () => {
        if (path.sep !== path.win32.sep) return;
        const v = verdictDuProfil({
            profilVerrouille: VRAI.toUpperCase(),
            profilReel: VRAI,
            argv: [],
        });
        expect(v.accepte).toBe(true);
    });
});

describe('verdictDuProfil — avec isolation, la répétition et les tests', () => {
    /*
      ⛔ Le cas que la garde doit LAISSER PASSER. Sans lui, on aurait une garde
      qui refuse tout — et une garde qui refuse tout ressemble beaucoup à une
      garde qui marche, jusqu'au jour où plus rien ne démarre.
    */
    it('accepte un profil jetable', () => {
        const v = verdictDuProfil({
            profilVerrouille: JETABLE,
            profilReel: VRAI,
            argv: [`--user-data-dir=${JETABLE}`],
        });

        expect(v.accepte).toBe(true);
        expect(v.isole).toBe(true);
    });

    /* L'autre sens : un essai sur le point d'écrire dans les vraies données. */
    it('refuse une isolation qui retombe sur le vrai profil', () => {
        const v = verdictDuProfil({
            profilVerrouille: VRAI,
            profilReel: VRAI,
            argv: [`--user-data-dir=${VRAI}`],
        });

        expect(v.accepte).toBe(false);
        expect(v.motif).toContain('ISOLATION');
    });
});
