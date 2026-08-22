import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Ce que ces tests protègent : **le moteur d'une Forge court-circuite le
 * réglage global sans jamais le modifier — axe J.**
 *
 * Ils lisent la SOURCE, et c'est délibéré : *deux fois le 22/08, la
 * vérification dans les deux sens a montré qu'un correctif n'était tenu par
 * aucun test*, parce que le test réimplémentait la règle au lieu de l'observer.
 * Ici, l'invariant est « personne n'écrit dans le magasin », et il ne
 * s'observe pas autrement.
 *
 * Ils vivent côté node parce que `node:fs` n'existe pas dans l'environnement du
 * renderer — le même piège que `ficheQuiRepond` a rencontré.
 */

const RACINE = path.join(__dirname, '..');
const lire = (rel: string) => fs.readFileSync(path.join(RACINE, rel), 'utf-8');

/**
 * **Le cœur de l'axe J : « sans le modifier globalement ».**
 *
 * *Deux fois aujourd'hui, la vérification dans les deux sens a montré qu'un
 * correctif n'était tenu par aucun test* — celui qui réimplémente la règle au
 * lieu de l'observer ne prouve rien. Ces deux-là lisent la source.
 */
describe('le réglage global reste intact', () => {
    /**
     * **Basculer le magasin le temps d'une Forge emporterait l'Oracle et le
     * Cortex avec elle**, et laisserait le réglage changé si la Forge échoue en
     * chemin. *Un réglage qu'une opération modifie de son côté est un réglage
     * que personne ne contrôle plus.*
     *
     * `setProvider` n'appartient qu'aux deux écrans où le meneur le choisit
     * lui-même : les réglages IA et le sélecteur de l'Oracle.
     */
    it('aucune Forge n’appelle setProvider', () => {
        for (const rel of [
            'src/modules/forge/ForgeService.ts',
            'src/modules/forge/campagne/ForgeDeCampagne.ts',
            'src/modules/forge/components/ForgeDashboard.tsx',
            'src/modules/forge/campagne/AtelierDeCampagne.tsx',
            'src/modules/ai/SelecteurDeMoteur.tsx',
            'src/modules/ai/moteurParForge.ts',
        ]) {
            expect(lire(rel), rel).not.toMatch(/setProvider\s*\(/);
        }
    });

    /** Et les deux Forges passent bien le moteur retenu à chaque appel. */
    it('les deux Forges déclarent leur moteur', () => {
        expect(lire('src/modules/forge/ForgeService.ts'))
            .toContain("provider: moteurRetenu('systeme')");
        expect(lire('src/modules/forge/campagne/ForgeDeCampagne.ts'))
            .toContain("provider: moteurRetenu('campagne')");
    });

    /**
     * **Le service doit préférer le moteur reçu au moteur global.** Écrit dans
     * l'autre sens, l'option serait acceptée et ignorée — *le genre de champ
     * qu'on croit avoir posé pendant des semaines.*
     */
    it('le service court-circuite le global, et pas l’inverse', () => {
        const service = lire('src/modules/ai/AIService.ts');
        expect(service).toContain('provider ?? useAIStore.getState().activeProvider');
        expect(service).toContain('options.provider ?? useAIStore.getState().activeProvider');
    });
});
