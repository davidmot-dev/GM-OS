import { describe, it, expect } from 'vitest';
import { validateSession } from '../../../types/schemas';
import { CAMPAGNES_DE_DEMONSTRATION, rienQueLaDemonstration } from './sessionMocks';
import temoin from '../../../../e2e/donnees/campagne-temoin.json';

/**
 * **Le gardien du témoin gelé.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN JEU D'ESSAI A BESOIN D'ÊTRE GARDÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `e2e/donnees/campagne-temoin.json` est le décor des tests de bout en bout. Il
 * entre par `GMOS_SEMENCE`, donc par `validateSession` puis `distributeData` —
 * **le même chemin que « charger une session »**.
 *
 * ⛔ Le jour où le schéma bougera, ce fichier cessera d'être accepté. Et une
 * semence refusée ne fait pas échouer un test E2E : elle le laisse tourner sur
 * la campagne de démonstration, avec un décor qui n'est pas celui qu'il croit.
 * *Un jeu d'essai qui se dégrade en silence est pire qu'un jeu d'essai absent* —
 * les tests restent verts et ne mesurent plus ce qu'ils annoncent.
 *
 * Ce test-ci est donc le seul endroit qui échoue bruyamment quand le témoin
 * n'est plus lisible. Il tourne dans le projet `renderer`, parce que c'est là
 * que vit `validateSession` : *le témoin doit être éprouvé par le code qui le
 * lira, pas par une copie de ses règles.*
 *
 * ⚠️ **Gelé veut dire gelé.** Si une assertion d'ici casse, la question n'est
 * jamais « comment régénérer le témoin » mais « le code sait-il encore lire ce
 * qu'il a lui-même écrit hier ». Un témoin qu'on rafraîchit cesse d'être un
 * témoin — il devient un miroir du code d'aujourd'hui, et ne peut plus rien
 * contredire.
 */

const sessionOS = (temoin as { modules: { sessionOS: Record<string, unknown> } }).modules.sessionOS;

describe('le témoin gelé — il doit rester lisible', () => {
    it('passe la validation, par le chemin réel de la semence', () => {
        expect(() => validateSession(temoin)).not.toThrow();
    });

    /*
      ⛔ Le piège nommé dans `SessionOSModuleSchema` : un champ non déclaré
      traverse grâce à `.passthrough()`, mais un défaut à vide l'écraserait. Les
      quatre ci-dessous ne sont PAS déclarés au schéma — ce sont précisément ceux
      dont la survie ne va pas de soi.
    */
    it.each(['actes', 'scenes', 'decks', 'deckStates'])(
        'ne perd pas « %s » à la validation',
        (champ: string) => {
            const valide = validateSession(temoin) as {
                modules: { sessionOS?: Record<string, unknown> };
            };
            const apres = valide.modules.sessionOS?.[champ];

            expect(apres, `${champ} a disparu de la session validée`).toBeDefined();
            const compte = Array.isArray(apres) ? apres.length : Object.keys(apres!).length;
            expect(compte, `${champ} est revenu vide`).toBeGreaterThan(0);
        },
    );
});

describe('le témoin gelé — ce qui le distingue du décor par défaut', () => {
    /*
      ⭐ L'invariant dont dépend tout test E2E semé : « la campagne du témoin est
      à l'écran » ne veut dire quelque chose que si elle ne peut pas être là par
      accident. Si le témoin portait un identifiant de démonstration, un test
      semé et un test non semé donneraient le même écran.
    */
    it('n’est pas une campagne de démonstration', () => {
        const campagnes = sessionOS.campaigns as { id: string }[];

        for (const c of campagnes) {
            expect(CAMPAGNES_DE_DEMONSTRATION.has(c.id), `${c.id} est un id de démonstration`).toBe(false);
        }
        /* Et donc la semence refuserait d'écrire par-dessus lui : la troisième
           garde de `useSemence` le tient pour un état du meneur. */
        expect(rienQueLaDemonstration(campagnes)).toBe(false);
    });

    /*
      Un identifiant du témoin qui ressemblerait à un vrai identifiant pourrait
      entrer en collision dans un profil semé par une vraie sauvegarde.
    */
    it('préfixe tous ses identifiants par « temoin- »', () => {
        const ids: string[] = [];
        const recolter = (valeur: unknown): void => {
            if (Array.isArray(valeur)) return valeur.forEach(recolter);
            if (valeur && typeof valeur === 'object') {
                for (const [cle, v] of Object.entries(valeur as Record<string, unknown>)) {
                    if (cle === 'id' && typeof v === 'string') ids.push(v);
                    else recolter(v);
                }
            }
        };
        recolter(sessionOS);

        expect(ids.length).toBeGreaterThan(10);
        for (const id of ids) expect(id, `${id} n’est pas préfixé`).toMatch(/^temoin-/);
    });

    /*
      ⛔ Un témoin dont l'horodatage bouge n'est pas gelé. Le cas concret : un
      `new Date().toISOString()` glissé dans un générateur rendrait le fichier
      différent à chaque fabrication, et deux exécutions ne compareraient plus
      la même chose.
    */
    it('porte un horodatage fixe', () => {
        expect((temoin as { timestamp: string }).timestamp).toBe('2026-09-12T00:00:00.000Z');
    });
});

describe('le témoin gelé — sa cohérence interne', () => {
    const actes = sessionOS.actes as { id: string; campaignId: string }[];
    const scenes = sessionOS.scenes as {
        id: string; titre: string; acteId: string; campaignId: string; personnagesIds?: string[];
    }[];
    const campagnes = sessionOS.campaigns as { id: string }[];

    it('la campagne active existe', () => {
        const actif = sessionOS.activeCampaignId as string;
        expect(campagnes.map(c => c.id)).toContain(actif);
    });

    /*
      ⚠️ `campaignId` est redondant avec l'acte **volontairement** (voir
      `trame.types.ts`) : les deux liens doivent rester d'accord, sans quoi une
      scène est lisible par un chemin et invisible par l'autre.
    */
    it('chaque scène pointe un acte de la même campagne', () => {
        for (const s of scenes) {
            const acte = actes.find(a => a.id === s.acteId);
            expect(acte, `${s.titre ?? s.id} : acte introuvable`).toBeDefined();
            expect(acte!.campaignId).toBe(s.campaignId);
        }
    });

    it('les personnages présents en scène existent', () => {
        const pjs = (sessionOS.players as { characters: { id: string }[] }[])
            .flatMap(p => p.characters.map(c => c.id));

        for (const s of scenes) {
            for (const id of s.personnagesIds ?? []) {
                expect(pjs, `${s.id} cite un PJ inconnu : ${id}`).toContain(id);
            }
        }
    });

    it('l’état de paquet correspond à un paquet déclaré', () => {
        const paquets = (sessionOS.decks as { id: string }[]).map(d => d.id);
        for (const [cle, etat] of Object.entries(
            sessionOS.deckStates as Record<string, { deckId: string }>,
        )) {
            expect(paquets, `état orphelin : ${cle}`).toContain(cle);
            expect(etat.deckId).toBe(cle);
        }
    });
});
