import { describe, expect, it, vi } from 'vitest';
import AdmZip from 'adm-zip';
import type { NexusDriverState } from '../../system/archive/nexus.types';
import type { PlayerCharacter } from '../../../types/player.types';
import { appliquerRepriseSauvegardee, lireSauvegardeDeReprise, preparerRepriseDeFiche, sauvegarderReprise } from './repriseDeFiche';
import { naissanceDansLeJeu } from './jeuDuPersonnage';

// AdmZip attend les tableaux d'octets du contexte Node, pas ceux de jsdom.
vi.stubGlobal('Uint8Array', Object.getPrototypeOf(Buffer.prototype).constructor);

const lots = [
    'runequest/RuneQuest-2.1.0.gmos-driver', 'degenesis/Degenesis-2.0.0.gmos-driver',
    'coc/COC-2.0.0-d20.gmos-driver', 'shadowrun-anarchy/Shadowrun-Anarchy-2.0.0.gmos-driver',
];
const lire = (lot: string): NexusDriverState => JSON.parse(new AdmZip(`output/campagnes-tests/${lot}`).readAsText('state.json'));

describe.each(lots)('NP-C2 — %s', lot => {
    const { gameDriver: pilote, sheetTemplate: gabarit } = lire(lot);
    const fiche = gabarit!;
    const cible = fiche.sections.flatMap(s => s.fields).find(f => f.type === 'number')!;
    const ancien = (): PlayerCharacter => ({ id: 'ancien-fictif', name: 'Ancien PJ fictif', portraitUrl: '',
        campaignId: 'campagne-fictive', systemId: pilote.id, templateId: 'ancienne-fiche', ficheId: 'ancienne-html',
        hp: 3, maxHp: 12, description: 'Description', gmNotes: 'Note MJ', playerNotes: 'Note joueur',
        inventory: 'Sac conservé', inventoryItems: [],
        sheetData: { ancienne_valeur: '17', zero: 0, faux: false, notes: 'Annotation ancienne',
            suivi: { marqueur: 'À garder' }, [cible.id]: 4 },
    });
    it('diagnostique sans deviner de correspondance ni modifier la fiche', () => {
        const p = ancien(), avant = structuredClone(p);
        const plan = preparerRepriseDeFiche(p, pilote, fiche);
        expect(plan.versionConnue).toBeUndefined();
        expect(plan.apres.sheetData[cible.id]).toBe(4);
        expect(plan.apres.sheetData).toMatchObject(p.sheetData);
        expect(plan.horsGabarit).toContain('ancienne_valeur');
        expect(p).toEqual(avant);
    });
    it('reprend explicitement, exporte, relit et restaure sans toucher aux notes ni aux PV', () => {
        const p = ancien();
        const plan = preparerRepriseDeFiche(p, pilote, fiche, [{ source: 'ancienne_valeur', cible: cible.id }]);
        expect(plan.changements).toContainEqual({ id: cible.id, label: cible.label, avant: 4, apres: 17 });
        const copie = lireSauvegardeDeReprise(JSON.stringify(sauvegarderReprise('j-fictif', p.id, plan)));
        const converti = { ...p, ...appliquerRepriseSauvegardee(copie, 'j-fictif', p) };
        expect(converti.sheetData).toMatchObject({ ancienne_valeur: '17', [cible.id]: 17, zero: 0, faux: false });
        expect(converti.ficheId).toBeUndefined();
        expect(converti.referenceDeFiche?.version).toBe(pilote.version);
        expect(preparerRepriseDeFiche(converti, pilote, fiche).referenceConforme).toBe(true);
        // Une note et une blessure ultérieures ne doivent pas être annulées par la restauration des champs.
        const apresSeance = { ...converti, gmNotes: 'Note ajoutée après', hp: 2 };
        const restaure = { ...apresSeance, ...appliquerRepriseSauvegardee(copie, 'j-fictif', apresSeance, true) };
        expect(restaure.sheetData).toEqual(p.sheetData);
        expect(restaure.templateId).toBe(p.templateId);
        expect(restaure.ficheId).toBe(p.ficheId);
        expect(restaure.gmNotes).toBe('Note ajoutée après'); expect(restaure.hp).toBe(2);
        expect(restaure.playerNotes).toBe(p.playerNotes); expect(restaure.inventory).toBe(p.inventory);
    });
    it('refuse une sauvegarde d’autrui et toute application sur des données modifiées depuis l’aperçu', () => {
        const p = ancien(), plan = preparerRepriseDeFiche(p, pilote, fiche);
        const copie = sauvegarderReprise('j', p.id, plan);
        expect(() => appliquerRepriseSauvegardee(copie, 'autre-joueur', p)).toThrow('autre personnage');
        expect(() => appliquerRepriseSauvegardee(copie, 'j', { ...p, sheetData: { ...p.sheetData, notes: 'Nouvelle saisie' } })).toThrow('changé');
        const converti = { ...p, ...appliquerRepriseSauvegardee(copie, 'j', p) };
        expect(() => appliquerRepriseSauvegardee(copie, 'j', { ...converti, sheetData: { ...converti.sheetData, [cible.id]: 99 } }, true)).toThrow('changé');
    });
    it('refuse les liaisons invalides, ambiguës, non numériques et le changement de jeu', () => {
        const p = ancien();
        expect(() => preparerRepriseDeFiche(p, pilote, fiche, [{ source: 'absente', cible: cible.id }])).toThrow();
        expect(() => preparerRepriseDeFiche(p, pilote, fiche, [{ source: 'notes', cible: cible.id }])).toThrow('incompatible');
        expect(() => preparerRepriseDeFiche(p, pilote, fiche, [
            { source: 'zero', cible: cible.id }, { source: 'ancienne_valeur', cible: cible.id },
        ])).toThrow('plusieurs');
        expect(() => preparerRepriseDeFiche({ ...p, systemId: 'autre' }, pilote, fiche)).toThrow('jeu');
    });
    it('enregistre la référence des nouvelles fiches sans conversion des anciennes à leur ouverture', () => {
        expect(naissanceDansLeJeu(pilote, fiche).referenceDeFiche).toMatchObject({ piloteId: pilote.id, version: pilote.version, gabaritId: fiche.id });
        expect(ancien().referenceDeFiche).toBeUndefined();
    });
});

it.each(['{}', '{"format":"gmos-reprise-fiche","version":99}', 'null', '{invalide'])('refuse un fichier de retour arrière invalide : %s', texte => {
    expect(() => lireSauvegardeDeReprise(texte)).toThrow();
});
