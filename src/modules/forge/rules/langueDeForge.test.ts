import { describe, it, expect } from 'vitest';
import { nomDeLaLangue, resoudreLaLangue, consigneDeLangue, LANGUES } from './langueDeForge';
import { lireNature } from './familleDuCorpus';
import { promptDuGroupe, GROUPES } from './GroupesDeChamps';

/**
 * Ce que ces tests protègent : **une forge écrit dans la langue qu'on lui
 * demande, sans jamais traduire ce qui doit rester intact**.
 *
 * Manque relevé par David le 2026-08-17 : il forge parfois depuis des livres
 * anglais et veut un résultat en français. AUCUNE invite de forge ne disait la
 * langue — ni la Forge Système, ni la Forge de campagne — donc le modèle suivait
 * celle du corpus. La capacité existait à côté : `AIService` conditionne déjà
 * trois invites sur `i18n.language`.
 *
 * **La moitié qui compte est l'interdit.** Une forge sommée d'écrire en français
 * traduirait volontiers un `sectionId` — et le vocabulaire acquis voyage entre
 * les groupes par ces chaînes. Un `stats` devenu `statistiques`, et plus aucun
 * renvoi ne résout.
 */
describe('la langue demandée', () => {
    it('se nomme dans la langue elle-même', () => {
        // « réponds en français », jamais « réponds en French ».
        expect(nomDeLaLangue('fr')).toBe('français');
        expect(nomDeLaLangue('en')).toBe('English');
    });

    it('tolère une variante régionale et la casse', () => {
        expect(nomDeLaLangue('FR-CA')).toBe('français');
        expect(nomDeLaLangue(' en ')).toBe('English');
    });

    it('laisse passer un code inconnu plutôt que de le refuser', () => {
        // Mieux vaut une consigne approximative qu'aucune consigne.
        expect(nomDeLaLangue('nl')).toBe('nl');
    });

    it('rend null sur du vide, et n\'invente rien', () => {
        expect(nomDeLaLangue(undefined)).toBeNull();
        expect(nomDeLaLangue('   ')).toBeNull();
    });
});

describe('ce qui l\'emporte', () => {
    it('le déclaré gagne sur l\'interface — c\'est tout l\'intérêt du réglage', () => {
        expect(resoudreLaLangue('en', 'fr')).toBe('English');
    });

    it('l\'interface n\'est qu\'un repli', () => {
        expect(resoudreLaLangue(undefined, 'fr')).toBe('français');
        expect(resoudreLaLangue('', 'en')).toBe('English');
    });

    it('sans rien, aucune consigne — le comportement d\'avant', () => {
        expect(resoudreLaLangue(null, null)).toBeNull();
        expect(consigneDeLangue(null)).toBe('');
    });
});

describe('la consigne dit surtout ce qu\'il ne faut PAS traduire', () => {
    const consigne = consigneDeLangue('fr');

    it('demande la prose dans la langue voulue', () => {
        expect(consigne).toContain('français');
        expect(consigne).toContain('PROSE');
    });

    it('protège les identifiants — un sectionId traduit casse tous les renvois', () => {
        expect(consigne).toContain('sectionId');
        expect(consigne).toContain('fieldId');
        expect(consigne).toContain('NE TRADUIS JAMAIS');
    });

    it('protège les noms propres — la conservation d\'une reforge se fait par NOM', () => {
        expect(consigne).toContain('NOMS PROPRES');
    });

    it('protège les énumérations imposées', () => {
        expect(consigne).toContain('énumération');
    });
});

describe('la consigne atteint vraiment l\'invite', () => {
    const groupe = GROUPES[0];

    it('elle y figure, et juste après la tâche', () => {
        /*
          Une consigne noyée est une consigne perdue : celle du seuil, glissée au
          milieu d'une cible le 2026-08-16, a fait ressortir `jet.seuil` vide dès
          le lendemain. Celle-ci se place en tête, comme le vocabulaire.
        */
        const lignes = promptDuGroupe(groupe, [], { langue: 'fr' }).split(String.fromCharCode(10));
        const ligneTache = lignes.findIndex(l => l.startsWith('TÂCHE :'));
        const ligneLangue = lignes.findIndex(l => l.startsWith('LANGUE :'));

        expect(ligneTache, 'la tâche est là').toBeGreaterThan(-1);
        expect(ligneLangue, 'la langue aussi').toBeGreaterThan(-1);
        /*
          On mesure en LIGNES et non en caractères : la ligne de tâche porte la
          cible entière, parfois huit cents caractères, et compter les caractères
          aurait fait échouer un placement pourtant correct.
        */
        expect(ligneLangue - ligneTache, "aucune autre consigne ne s'intercale").toBeLessThanOrEqual(2);
    });

    it('sans langue déclarée, l\'invite est inchangée', () => {
        // On ne fait pas payer une nouveauté à l'existant.
        expect(promptDuGroupe(groupe, [], {})).not.toContain('LANGUE :');
    });
});

describe('un corpus peut ne déclarer QUE sa langue', () => {
    it('sans « nature », le réglage n\'est plus perdu', () => {
        /*
          `lireNature` rendait `null` dès que `nature` manquait : un corpus.json
          réduit à `{"langue":"fr"}` aurait été lu comme vide, et le réglage
          perdu sans un mot. On retombe sur le défaut documenté — un corpus sans
          déclaration est un jeu.
        */
        expect(lireNature('{"langue":"fr"}')).toEqual({ nature: 'jeu', langue: 'fr' });
    });

    it('une déclaration complète garde tout', () => {
        expect(lireNature('{"nature":"famille","moteur":"yze","langue":"en"}'))
            .toEqual({ nature: 'famille', moteur: 'yze', langue: 'en' });
    });

    it('un fichier vide reste vide', () => {
        expect(lireNature('{}')).toBeNull();
        expect(lireNature(null)).toBeNull();
    });

    it('les langues proposées à l\'écran sont celles que la consigne sait nommer', () => {
        // Un sélecteur qui offrirait un code inconnu produirait « réponds en nl ».
        for (const [code, nom] of Object.entries(LANGUES)) {
            expect(nomDeLaLangue(code)).toBe(nom);
        }
    });
});
