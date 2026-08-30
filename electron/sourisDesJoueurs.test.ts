import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';

vi.mock('electron', () => ({ ipcMain: { handle: vi.fn() }, app: { on: vi.fn() } }));
vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn() } }));

const { lireLInventaire, peutEtreCoupee, scriptDeLAide, lancementDeLAide } = await import('./sourisDesJoueurs');

/**
 * **Le verrou de la souris des joueurs — ce qui empêche de se couper la sienne.**
 *
 * Mesuré chez David le 2026-08-30 : ses deux souris portent **le même nom**,
 * « Souris HID ». Rien à l'écran ne dit laquelle est laquelle, donc le geste est
 * un pari — et ces tests gardent les deux filets qui rendent le pari sans
 * conséquence.
 */

/** La sortie réelle de `Get-PnpDevice -Class Mouse`, relevée sur sa machine. */
const REEL = '[{"Status":"OK","FriendlyName":"Souris HID","InstanceId":"HID\\\\VID_0B05&PID_1BF2&MI_05&COL01\\\\7&1E05D78C&0&0000","Present":true},'
    + '{"Status":"OK","FriendlyName":"Souris HID","InstanceId":"HID\\\\VID_04D9&PID_A09F&MI_00\\\\B&1FC89C1&0&0000","Present":true}]';

describe('lire l’inventaire', () => {
    it('lit les deux souris réelles de David', () => {
        const souris = lireLInventaire(REEL);
        expect(souris).toHaveLength(2);
        expect(souris.every(s => s.active)).toBe(true);
        expect(souris[0].id).toContain('VID_0B05');
    });

    /**
     * **PowerShell rend un objet nu quand il n'y a qu'un élément**, un tableau
     * au-delà. Un `.map` direct planterait donc précisément sur la machine à
     * une seule souris — celle où le verrou ne sert à rien, mais où l'écran des
     * réglages s'ouvre quand même.
     */
    it('supporte l’objet nu d’une machine à une seule souris', () => {
        const seule = '{"Status":"OK","FriendlyName":"Souris HID","InstanceId":"HID\\\\X\\\\1","Present":true}';
        expect(lireLInventaire(seule)).toHaveLength(1);
    });

    /** Une souris débranchée dont Windows garde le souvenir n'est pas là. */
    it('écarte les périphériques absents', () => {
        const avecFantome = '[{"Status":"Unknown","FriendlyName":"Vieille","InstanceId":"HID\\\\Y\\\\1","Present":false},'
            + '{"Status":"OK","FriendlyName":"Souris HID","InstanceId":"HID\\\\X\\\\1","Present":true}]';
        expect(lireLInventaire(avecFantome).map(s => s.id)).toEqual(['HID\\X\\1']);
    });

    it('voit qu’une souris désactivée n’est pas active', () => {
        const coupee = '{"Status":"Error","FriendlyName":"Souris HID","InstanceId":"HID\\\\X\\\\1","Present":true}';
        expect(lireLInventaire(coupee)[0].active).toBe(false);
    });

    /** Sortie vide, PowerShell en erreur : un écran de réglages ne doit pas tomber. */
    it.each([['', 'sortie vide'], ['   ', 'blancs'], ['pas du json', 'illisible']])(
        'rend une liste vide plutôt que de lever (%s)', (entree) => {
            expect(lireLInventaire(entree)).toEqual([]);
        });
});

/**
 * **La dernière souris active ne se coupe jamais.**
 *
 * Ce n'est pas une politesse : c'est le seul cas où le retour automatique
 * lui-même serait inatteignable — plus de curseur du tout, et rien à l'écran
 * qui dise que ça va revenir.
 */
describe('ce qu’on refuse de couper', () => {
    const deux = lireLInventaire(REEL);

    it('accepte quand une autre souris reste', () => {
        expect(peutEtreCoupee(deux[0].id, deux).possible).toBe(true);
    });

    it('refuse la seule souris active, et dit pourquoi', () => {
        const uneSeule = [{ id: 'a', nom: 'Souris HID', active: true }];
        const verdict = peutEtreCoupee('a', uneSeule);
        expect(verdict.possible).toBe(false);
        expect(verdict.raison).toMatch(/sans curseur/);
    });

    it('refuse quand l’autre est déjà coupée — il n’en reste qu’une', () => {
        const uneVivante = [
            { id: 'a', nom: 'Souris HID', active: true },
            { id: 'b', nom: 'Souris HID', active: false },
        ];
        expect(peutEtreCoupee('a', uneVivante).possible).toBe(false);
    });

    it('refuse une souris débranchée entre-temps', () => {
        expect(peutEtreCoupee('fantome', deux).raison).toMatch(/plus branchée/);
    });

    it('refuse de couper deux fois la même', () => {
        const dejaCoupee = [
            { id: 'a', nom: 'Souris HID', active: false },
            { id: 'b', nom: 'Souris HID', active: true },
        ];
        expect(peutEtreCoupee('a', dejaCoupee).raison).toMatch(/déjà coupée/);
    });
});

/**
 * **Comment l'aide élevée apprend où se connecter.**
 *
 * ⚠ Défaut réel, signalé par David le 2026-08-30 : *« l'aide admin ne s'est pas
 * déclenchée »*. La première version déclarait `param([string]$Tuyau)` et
 * passait `-Tuyau <nom>` **après** `-EncodedCommand`. Or `-EncodedCommand`
 * exécute une *commande*, pas un script paramétrable, et **rien ne peut le
 * suivre** : l'aide démarrait avec un tuyau vide et mourait aussitôt.
 *
 * L'élévation, elle, avait parfaitement fonctionné — d'où un message qui
 * accusait l'UAC pour une faute de ligne de commande.
 */
describe('le lancement de l’aide élevée', () => {
    it('écrit le nom du tuyau DANS le script, pas à côté', () => {
        expect(scriptDeLAide('gmos-souris-abc')).toContain("$Tuyau = 'gmos-souris-abc'");
    });

    it('ne déclare aucun paramètre : une commande encodée n’en reçoit pas', () => {
        expect(scriptDeLAide('x')).not.toMatch(/param\s*\(/);
    });

    /** *Le défaut exact : quelque chose suivait `-EncodedCommand`.* */
    it('ne passe plus rien après -EncodedCommand', () => {
        const ligne = lancementDeLAide('gmos-souris-abc');
        const apres = ligne.slice(ligne.indexOf('-EncodedCommand'));
        expect(apres.split(',')).toHaveLength(2); // « -EncodedCommand » puis le base64, fin.
        expect(apres).not.toContain('-Tuyau');
    });

    it('et le base64 transporté redonne bien le script attendu', () => {
        const ligne = lancementDeLAide('gmos-souris-abc');
        const encode = /-EncodedCommand','([A-Za-z0-9+/=]+)'/.exec(ligne)![1];
        const rendu = Buffer.from(encode, 'base64').toString('utf16le');
        expect(rendu).toContain("$Tuyau = 'gmos-souris-abc'");
        expect(rendu, 'la validation voyage avec').toContain('Get-PnpDevice -Class Mouse');
    });
});

/**
 * **Le filet qui compte : toute coupure se rend d'elle-même.**
 *
 * *Un bouton dont l'erreur ne se rattrape qu'à la souris ne peut pas être
 * confirmé à la souris.* Ces contrôles lisent le source, parce que ce sont des
 * propriétés de construction : ce qui doit être vrai, c'est que le minuteur est
 * armé **dans le même geste** que la coupure, jamais après une confirmation.
 */
describe('le retour automatique, propriété de construction', () => {
    const source = fs.readFileSync(path.resolve(__dirname, 'sourisDesJoueurs.ts'), 'utf-8');
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\*.*$/gm, '');

    it('la coupure arme son propre retour', () => {
        const coupure = code.slice(code.indexOf("ipcMain.handle('souris:couper'"));
        const fin = coupure.indexOf("ipcMain.handle('souris:confirmer'");
        expect(coupure.slice(0, fin)).toMatch(/retours\.set\([\s\S]*?setTimeout/);
    });

    it('ferme GM-OS en rendant les souris coupées', () => {
        expect(code).toMatch(/before-quit[\s\S]{0,200}rendreLaSouris/);
    });

    /** L'aide est élevée ; celui qui lui parle ne l'est pas. */
    it('l’aide élevée revalide l’identifiant contre la classe Mouse', () => {
        expect(source).toMatch(/Get-PnpDevice -Class Mouse \| Where-Object \{ \$_\.InstanceId -eq \$ordre\.id \}/);
        expect(source, 'et refuse tout ce qui n’en est pas').toMatch(/if \(-not \$souris\)/);
    });

    /** Rien ne doit rester sur la machine de David après la séance. */
    it('n’installe ni tâche planifiée ni service ni fichier', () => {
        expect(code).not.toMatch(/schtasks|New-Service|Register-ScheduledTask|writeFile/i);
    });
});
