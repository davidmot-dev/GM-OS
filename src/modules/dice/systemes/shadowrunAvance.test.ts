import { describe, it, expect } from 'vitest';
import { preparerLeJet } from '../DescripteurDeJet';
import { reserveDeShadowrun, type RegleDuMoniteurShadowrun } from './shadowrun';
import { appliquerDrainShadowrun, lireSuiviShadowrun, suivreLesCompteurs, derivesShadowrun, CLE_SUIVI_SHADOWRUN } from './suiviDeShadowrun';
import { lireMatriceShadowrun, preparerMatriceShadowrun, consequenceMatriceShadowrun, redemarrerMatriceShadowrun,
    effetsModeShadowrun, ecrireMatriceShadowrun } from './matriceDeShadowrun';
import { moniteurSelonLeJeu } from '../../combat/logic/moniteurDeShadowrun';

export const MONITEUR_SR: RegleDuMoniteurShadowrun = { mecanique: 'shadowrun', suivi: true,
    legeres: 'l', graves: 'g', incapacitantes: 'i', sante: 'sante', capacites: { legeres: 'lmax', graves: 'gmax' }, force: 'force' };
export const MATRICE_SR = { minimum: 'minimum', hausse: 'hausse' };
const fiche = { l: 0, g: 0, i: 0, sante: 0, force: 3, essence: 6 };
const magie = (f: Record<string, unknown>) => ({ ...f, ...appliquerDrainShadowrun(MONITEUR_SR, f, 'critique', 'jet-1') });

describe('SR-A1 : origine, soins et terme du drain', () => {
    it('le drain critique est une légère, et ne s’efface pas par premiers soins ou magie', () => {
        const f = magie(fiche);
        expect(f.l).toBe(1);
        expect(lireSuiviShadowrun(f).blessures[0].origine).toBe('drain');
        for (const soin of ['premiers-soins', 'magie'] as const) {
            const r = moniteurSelonLeJeu(MONITEUR_SR, f, { value: 1, isRecovery: true, shadowrun: { soin } })!;
            expect(r.fiche).toEqual({}); expect(r.texte).toContain('seuls le repos');
        }
        expect(moniteurSelonLeJeu(MONITEUR_SR, f, { value: 1, isRecovery: true, shadowrun: { soin: 'repos', heures: 7 } })!.fiche).toEqual({});
        expect(moniteurSelonLeJeu(MONITEUR_SR, f, { value: 1, isRecovery: true, shadowrun: { soin: 'repos', heures: 8 } })!.fiche.l).toBe(0);
    });
    it('le drain qui déborde les légères devient grave et conserve son origine', () => {
        const f = magie({ ...fiche, l: 2, sante: 2 });
        expect(f.g).toBe(1);
        expect(lireSuiviShadowrun(f).blessures.find(b => b.gravite === 'grave')?.origine).toBe('drain');
        expect(appliquerDrainShadowrun(MONITEUR_SR, f, 'critique', 'jet-1')).toEqual({});
    });
    it('mineure : seulement les activités magiques, persistantes après sérialisation sans expiration au round', () => {
        const f = { ...fiche, ...appliquerDrainShadowrun(MONITEUR_SR, fiche, 'mineure', 'j') };
        const etat = lireSuiviShadowrun(JSON.parse(JSON.stringify(f)));
        expect(reserveDeShadowrun(8, { magie: true }, etat).valeurDuSucces).toBe(6);
        expect(reserveDeShadowrun(8, { magie: false }, etat).valeurDuSucces).toBe(5);
        expect(etat.drainMineur).toBe(true);
    });
    it('un désastre coche directement une incapacitante, sans comparaison à la Volonté', () => {
        expect(appliquerDrainShadowrun(MONITEUR_SR, { ...fiche, force: 100 }, 'desastre', 'j').i).toBe(1);
    });
    it('les anciennes blessures restent d’origine inconnue ; un soin peut viser une autre case que le drain', () => {
        const f = magie({ ...fiche, l: 1 });
        const s = suivreLesCompteurs(MONITEUR_SR, f);
        const ancienne = s.blessures.find(b => b.origine === 'inconnue')!;
        const f2 = { ...f, [CLE_SUIVI_SHADOWRUN]: { ...s, blessures: s.blessures.map(b => b.id === ancienne.id ? { ...b, origine: 'physique' } : b) } };
        const r = moniteurSelonLeJeu(MONITEUR_SR, f2, { value: 1, isRecovery: true, shadowrun: { soin: 'magie', blessureId: ancienne.id } })!;
        expect(r.fiche.l).toBe(1);
        expect(lireSuiviShadowrun(r.fiche).blessures[0].origine).toBe('drain');
    });
});

describe('SR-A2 : dérivés et Essence', () => {
    it('une variation de Force propose les seuils et la réserve liée sans réécrire les blessures ni deviner l’armure', () => {
        const r = { attributs: ['force'], competences: [{ indice: 'c', attribut: 'a', reference: 'ref', reserve: 'reserve' }],
            seuils: [{ resistance: 'force', protection: 'protection', legere: 'sl', grave: 'sg', incapacitante: 'si' }] };
        const f = { ...magie(fiche), force: 5, c: 3, a: 2, ref: 'force', reserve: 5, armure: 'Blindage 99' };
        const avant = JSON.stringify(f);
        expect(derivesShadowrun(r, f).map(l => [l.champ, l.valeur])).toEqual([['a', 5], ['reserve', 8]]);
        expect(derivesShadowrun(r, { ...f, protection: 2 }).map(l => [l.champ, l.valeur])).toContainEqual(['sg', 10]);
        expect(JSON.stringify(f)).toBe(avant);
    });
    it('le désavantage social demande le choix du meneur ; la magie et les soins gardent leurs paliers', () => {
        expect(reserveDeShadowrun(8, { social: true }, { essence: 1 }).valeurDuSucces).toBe(6);
        expect(reserveDeShadowrun(8, { social: false }, { essence: 1 }).valeurDuSucces).toBe(5);
    });
});

describe('SR-A3 : Matrice', () => {
    const contexte = { cible: 'serveur', vise: 2 as const, backdoor: 0, cybercombat: false };
    const m = () => ({ ...lireMatriceShadowrun(MATRICE_SR, {}), cyberdeck: true, ind: true,
        cibles: [{ id: 'serveur', nom: 'Archives', firewall: 4, acces: 0 as const }] });
    it('Aucun → Administrateur vaut +2 avant la backdoor ; des cibles distinctes gardent leurs accès', () => {
        expect(preparerMatriceShadowrun(m(), contexte).seuil).toBe(6);
        expect(preparerMatriceShadowrun(m(), { ...contexte, backdoor: 2 }).seuil).toBe(4);
        const suite = consequenceMatriceShadowrun(m(), contexte, 'aucune', true, 'j');
        expect(suite.cibles[0].acces).toBe(2);
        expect(consequenceMatriceShadowrun(suite, contexte, 'mineure', true, 'j')).toBe(suite);
    });
    it('la surveillance survit au rechargement ; un redémarrage simple ne suffit pas', () => {
        const un = consequenceMatriceShadowrun(m(), contexte, 'mineure', false, '1');
        const deux = consequenceMatriceShadowrun(un, contexte, 'mineure', false, '2');
        const trois = consequenceMatriceShadowrun(deux, contexte, 'critique', false, '3');
        const relu = lireMatriceShadowrun(MATRICE_SR, JSON.parse(JSON.stringify(ecrireMatriceShadowrun(MATRICE_SR, trois))));
        expect([relu.minimum, relu.hausse]).toEqual([4, 1]);
        expect(redemarrerMatriceShadowrun(relu, false).minimum).toBe(4);
        expect(redemarrerMatriceShadowrun(relu, true).minimum).toBe(0);
    });
    it('trodes et RA n’obtiennent ni action gratuite ni avantage ; le hot-sim reste mental létal', () => {
        expect(effetsModeShadowrun('cold-trodes')).toMatchObject({ actionGratuite: false, avantage: false, ejection: undefined });
        expect(effetsModeShadowrun('ra')).toMatchObject({ actionGratuite: false, avantage: false });
        expect(effetsModeShadowrun('hot-ind')).toMatchObject({ actionGratuite: true, avantage: true, biofeedback: 'mental létal — Volonté', ejection: 'grave' });
        expect(preparerMatriceShadowrun({ ...m(), mode: 'hot-ind' }, contexte).avantage).toBe(false);
        expect(preparerMatriceShadowrun({ ...m(), mode: 'hot-ind' }, { ...contexte, cybercombat: true }).avantage).toBe(true);
    });
    it('un cyberdeck brické reste brické après une heure hors ligne ; une IND absente bloque', () => {
        const d = consequenceMatriceShadowrun(m(), contexte, 'desastre', false, 'j');
        expect(preparerMatriceShadowrun(redemarrerMatriceShadowrun(d, true), contexte).refus).toContain('brické');
        expect(preparerMatriceShadowrun({ ...m(), ind: false }, contexte).refus).toContain('IND');
    });
    it('la préparation partagée impose le seuil et le risque, aussi aux lecteurs hors panneau', () => {
        const descripteur = { sens: 'superieur-ou-egal' as const, reserve: { base: 8, max: 16, faces: 6, composantes: [] },
            difficulte: { min: 0, max: 12, defaut: 3 }, shadowrun: { matrice: MATRICE_SR } };
        const f = ecrireMatriceShadowrun(MATRICE_SR, { ...m(), minimum: 6, hausse: 1 });
        const j = preparerLeJet(descripteur, f, { champs: {}, shadowrun: { matrice: contexte, desDeRisque: 0 } });
        expect(j.reussitesRequises).toBe(7);
        expect(j.shadowrun?.risque).toBe(6);
    });
});
