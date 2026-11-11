import { describe, it, expect } from 'vitest';
import {
    composantesARetenir, champsProposes, composerLaDemande, compositionValable, lireLaDemande,
} from './demandeDeJet';
import type { DescripteurDeJet } from './DescripteurDeJet';
import type { SheetSection } from '../../data/defaultSheetTemplates';

/**
 * **C10 — une demande de jet se compose sur chaque pilote réel** (plan
 * `documentation/Planning/2026-11-11-jets-demandes-et-caches.md`, T1).
 *
 * Les pilotes sont lus là où David les exporte (`Export Dirvers/`, ou
 * `GMOS_PILOTES_DES_JEUX`), comme `e2e/capturesDesJeux.spec.ts`. Pour chacun :
 * on retient, pour chaque composante, le premier champ que le menu propose ;
 * la demande doit se composer, traverser le réseau (`JSON` puis `lireLaDemande`)
 * et rester valable contre la même fiche. Un pilote qui ne compose rien depuis
 * la fiche (Within, retiré) n'a rien à demander.
 *
 * ⚠️ **Pourquoi `process.getBuiltinModule` et pas `import fs`.** Dans le projet
 * `renderer`, `node:fs` est réécrit par le greffon Electron de Vite et n'a plus
 * de quoi lire un dossier. Et l'essai ne peut pas vivre côté `electron` : le
 * descripteur de jet référence `types/drivers`, qui entraîne toute l'application
 * dans la vérification de types de ce projet (136 erreurs `appBridge`, 11/11).
 * `getBuiltinModule` rend le vrai module de Node, sans passer par Vite.
 *
 * Sans pilote exporté, l'essai ne prouve rien et le dit (`skip`).
 */

type Fs = typeof import('node:fs');
type Path = typeof import('node:path');
type Zlib = typeof import('node:zlib');
const fs = process.getBuiltinModule('node:fs') as Fs;
const path = process.getBuiltinModule('node:path') as Path;
const zlib = process.getBuiltinModule('node:zlib') as Zlib;

/**
 * Un fichier d'une archive zip, lu par son répertoire central.
 *
 * `adm-zip` se charge dans ce projet mais rend un texte vide : sa décompression
 * y passe par les modules réécrits. Le répertoire central donne, pour chaque
 * entrée, la méthode, la taille compressée et la position de l'en-tête local —
 * sûres même quand l'en-tête local les laisse à zéro (descripteur de données).
 */
function lireDansLeZip(archive: Buffer, nom: string): string | null {
    const fin = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (fin < 0) return null;
    const entrees = archive.readUInt16LE(fin + 10);
    let p = archive.readUInt32LE(fin + 16);
    for (let i = 0; i < entrees; i++) {
        const methode = archive.readUInt16LE(p + 10);
        const taille = archive.readUInt32LE(p + 20);
        const longueurNom = archive.readUInt16LE(p + 28);
        const longueurExtra = archive.readUInt16LE(p + 30);
        const longueurCommentaire = archive.readUInt16LE(p + 32);
        const local = archive.readUInt32LE(p + 42);
        if (archive.toString('utf8', p + 46, p + 46 + longueurNom) === nom) {
            const debut = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28);
            const donnees = archive.subarray(debut, debut + taille);
            return (methode === 0 ? donnees : zlib.inflateRawSync(donnees)).toString('utf8');
        }
        p += 46 + longueurNom + longueurExtra + longueurCommentaire;
    }
    return null;
}

const DOSSIER = path.resolve(process.env.GMOS_PILOTES_DES_JEUX ?? path.join(process.cwd(), 'Export Dirvers'));

function lesPilotes(): { fichier: string; jet: DescripteurDeJet | undefined; sections: SheetSection[] }[] {
    if (!fs.existsSync(DOSSIER)) return [];
    const fichiers: string[] = [];
    const parcourir = (dossier: string) => {
        for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
            const p = path.join(dossier, e.name);
            if (e.isDirectory()) parcourir(p);
            else if (e.name.endsWith('.gmos-driver')) fichiers.push(p);
        }
    };
    parcourir(DOSSIER);
    return fichiers.flatMap(fichier => {
        try {
            const etat = JSON.parse(lireDansLeZip(fs.readFileSync(fichier), 'state.json') ?? '');
            return [{ fichier: path.relative(DOSSIER, fichier), jet: etat.gameDriver?.jet, sections: etat.sheetTemplate?.sections ?? [] }];
        } catch {
            return [];
        }
    });
}

const PILOTES = lesPilotes();

describe.skipIf(PILOTES.length === 0)('C10 — demandes de jet sur les pilotes exportés', () => {
    it.each(PILOTES.map(p => [p.fichier, p] as const))('%s', (_nom, pilote) => {
        const composantes = composantesARetenir(pilote.jet);
        if (composantes.length === 0) {
            expect(composerLaDemande({
                id: 'd', characterId: 'c', emiseLe: 1, descripteur: pilote.jet, sections: pilote.sections, valeurs: {},
                composition: { champs: {} },
            })).toBeNull();
            return;
        }

        const champs: Record<string, string> = {};
        for (const composante of composantes) {
            const premier = champsProposes(composante, pilote.sections, {})[0];
            // Une composante obligatoire sans aucun champ : le pilote ne se lancerait pas non plus.
            if (!composante.facultative) expect(premier, `« ${composante.label} » ne propose aucun champ`).toBeDefined();
            if (premier) champs[composante.id] = premier.id;
        }

        const demande = composerLaDemande({
            id: 'd', characterId: 'c', emiseLe: 1, descripteur: pilote.jet, sections: pilote.sections, valeurs: {},
            composition: { champs, difficulte: 1 },
        });
        expect(demande).not.toBeNull();
        expect(demande!.titre).not.toBe('');

        const relue = lireLaDemande(JSON.parse(JSON.stringify(demande)));
        expect(relue).toEqual(demande);
        if (relue?.genre !== 'test') throw new Error('genre perdu');
        expect(compositionValable(relue.composition, pilote.jet, pilote.sections, {})).toEqual(demande!.composition);
    });
});
