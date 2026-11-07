import fs from 'node:fs';
import { it } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';
import { preparerLeJet } from '../../src/modules/dice/DescripteurDeJet';

const S = 'C:/Users/david/AppData/Local/Temp/claude/c--Projet-David-GM-OS-v5/58bc8418-4e1a-400f-a615-5d5c6b3ab892/scratchpad/sr';
const ecrire = (titre: string, valeur: unknown) => fs.appendFileSync('tmp/sr-audit/sortie.txt', `\n${titre} ${JSON.stringify(valeur, null, 1)}`);

it('audit', () => {
    fs.rmSync('tmp/sr-audit/sortie.txt', { force: true });
    const x = JSON.parse(fs.readFileSync(`${S}/state2.json`, 'utf8'));
    ecrire('CONSTATS', controlerLePilote(x.gameDriver, x.sheetTemplate));
    // Cas témoin p. 64 : Sorcellerie 5 + Volonté 4 = 9 dés, seuil 3.
    const p = preparerLeJet(x.gameDriver.jet, { volonte: 4, competence_1: 5, competence_1_rr: 1 }, { champs: { competence: 'competence_1', attribut: 'volonte' }, difficulte: 3 }, x.sheetTemplate.sections);
    ecrire('JET', p);
});
