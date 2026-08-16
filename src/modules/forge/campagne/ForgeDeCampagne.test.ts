import { describe, it, expect } from 'vitest';
import { forgerLaCampagne, vocabulaireDuProjet, projetVide } from './ForgeDeCampagne';
import { GROUPES_DE_LA_TRAME } from './GroupesDeLaTrame';
import type { FicheDeCampagneLue } from './lectureDesFiches';

/**
 * Ce que ces tests protègent : **l'ordre des dépendances tient à l'exécution**,
 * et rien ne disparaît en silence.
 *
 * La Forge n'a pas de sortie qu'on puisse « regarder pour voir » : une scène
 * privée de ses PNJ ressemble en tout point à une scène qui n'en a pas. Les
 * invariants qui la protègent doivent donc être vérifiés ici, pas à la relecture.
 */

const fiche = (sujet: string, contenu: string, partie?: string): FicheDeCampagneLue =>
    ({ sujet, sujetEcrit: sujet, contenu, ...(partie ? { partie } : {}) });

/** Un corpus complet et minuscule, deux actes, tous les sujets couverts. */
const CORPUS: FicheDeCampagneLue[] = [
    fiche('Pitch et ton', 'Une enquête vénitienne.'),
    fiche('Structure en actes', 'Acte I — Arlequin. Acte II — Italie.'),
    fiche('Lieux majeurs', "L'Hôtel Artemide."),
    fiche('Factions et organisations', 'La Confrérie.'),
    fiche('Personnages non joueurs', 'Arlequin.', 'Arlequin'),
    fiche('Personnages non joueurs', 'Milo.', 'Italie'),
    fiche('Secrets et révélations', 'La chouette.'),
    fiche('Scènes prévues', 'Le bal.', 'Arlequin'),
    fiche('Scènes prévues', 'La villa.', 'Italie'),
    fiche('Amorces et accroches', 'Une lettre arrive.'),
    fiche('Menaces et progression', 'La marée monte.'),
];

/** Un modèle docile : il rend ce qu'on lui a préparé pour chaque groupe. */
function modele(reponses: Record<string, unknown>, journal?: string[]) {
    return async (prompt: string, _schema: Record<string, unknown>) => {
        void _schema;
        journal?.push(prompt);
        const groupe = GROUPES_DE_LA_TRAME.find(g => prompt.includes(`« ${g.label} »`));
        return groupe ? (reponses[groupe.id] ?? {}) : {};
    };
}

const REPONSES = {
    campagne: { campagne: { name: 'Le secret de Milo', description: 'Une enquête.' } },
    actes: { actes: [{ titre: 'Arlequin', resume: 'On entre.' }, { titre: 'Italie', resume: 'On creuse.' }] },
    lieux: { lieux: [{ name: 'Hôtel Artemide', type: 'city' }] },
    factions: { factions: [{ title: 'La Confrérie', content: 'Elle veut le codex.' }] },
    pnj: { pnj: [{ name: 'Milo Torricelli', role: 'neutral' }] },
    relations: { relations: [{ source: 'Milo Torricelli', cible: 'Milo Torricelli', type: 'rival' }] },
    indices: { indices: [{ title: 'La chouette', content: 'Elle désigne la villa.' }] },
    scenes: { scenes: [{ titre: 'Le bal', lieu: 'Hôtel Artemide', pnj: ['Milo Torricelli'] }] },
    savoir: { savoir: [{ title: 'La lettre', content: 'Elle arrive au matin.' }] },
};

describe('forgerLaCampagne', () => {
    it('projette chaque étage et rend une campagne complète', async () => {
        const { projet, echecs } = await forgerLaCampagne(CORPUS, { appeler: modele(REPONSES) });

        expect(echecs).toEqual([]);
        expect(projet.campagne?.name).toBe('Le secret de Milo');
        expect(projet.actes.map(a => a.titre)).toEqual(['Arlequin', 'Italie']);
        expect(projet.lieux).toHaveLength(1);
        expect(projet.factions).toHaveLength(1);
        expect(projet.indices).toHaveLength(1);
        expect(projet.savoir).toHaveLength(1);
    });

    it('forge les groupes par acte une fois par acte', async () => {
        const { projet } = await forgerLaCampagne(CORPUS, { appeler: modele(REPONSES) });

        // Deux passes de scènes, un titre chacune : les scènes ne se
        // dédoublonnent pas entre actes.
        expect(projet.scenes).toHaveLength(2);
        expect(projet.scenes.map(s => s.acte)).toEqual(['Arlequin', 'Italie']);
    });

    it('garde un PNJ une seule fois, sur son acte le plus précoce', async () => {
        const { projet } = await forgerLaCampagne(CORPUS, { appeler: modele(REPONSES) });

        expect(projet.pnj).toHaveLength(1);
        expect(projet.pnj[0].acte).toBe('Arlequin');
    });

    it("n'ouvre à chaque étage que le vocabulaire réellement acquis", async () => {
        const invites: string[] = [];
        await forgerLaCampagne(CORPUS, { appeler: modele(REPONSES, invites) });

        const invitePnj = invites.find(p => p.includes('« Les personnages »'));
        const inviteScenes = invites.find(p => p.includes('« Les scènes »'));

        // Les PNJ voient les lieux et les factions, jamais les indices, qui
        // n'existent pas encore quand ils se forgent.
        expect(invitePnj).toContain('Hôtel Artemide');
        expect(invitePnj).toContain('La Confrérie');
        expect(invitePnj).not.toContain('La chouette');

        // Les scènes, elles, voient tout ce dont elles ont besoin.
        expect(inviteScenes).toContain('La chouette');
        expect(inviteScenes).toContain('Milo Torricelli');
    });

    it("comble les actes depuis le « partie: » des fiches, et le dit", async () => {
        // Un corpus antérieur au 2026-08-16 : la structure n'a jamais été écrite.
        const ancien = CORPUS.filter(f => f.sujet !== 'Structure en actes');
        const { projet, lacunes } = await forgerLaCampagne(ancien, { appeler: modele(REPONSES) });

        expect(projet.actes.map(a => a.titre)).toEqual(['Arlequin', 'Italie']);
        expect(projet.actes.every(a => !a.resume)).toBe(true);
        expect(lacunes).toHaveLength(1);
        expect(lacunes[0].consequence).toContain('enjeu');
        // Et les groupes par acte tournent quand même, sur ces titres.
        expect(projet.scenes).toHaveLength(2);
    });

    it("renonce aux groupes par acte quand aucun acte n'a pu être établi", async () => {
        const sansActes = [fiche('Pitch et ton', 'x'), fiche('Scènes prévues', 'y')];
        const { projet, echecs } = await forgerLaCampagne(sansActes, { appeler: modele(REPONSES) });

        expect(projet.scenes).toEqual([]);
        expect(echecs.some(e => e.groupe === 'scenes' && e.raison.includes('acte'))).toBe(true);
    });

    it('consigne la passe qui échoue et continue avec ce qui existe', async () => {
        const casse = async (prompt: string) => {
            if (prompt.includes('« Les lieux »')) throw new Error('le carnet a coupé');
            return modele(REPONSES)(prompt, {});
        };
        const { projet, echecs } = await forgerLaCampagne(CORPUS, { appeler: casse });

        expect(echecs.some(e => e.groupe === 'lieux' && e.raison === 'le carnet a coupé')).toBe(true);
        // Les étages suivants tournent, et ne peuvent plus désigner de lieu.
        expect(projet.pnj).toHaveLength(1);
        expect(vocabulaireDuProjet(projet).lieux).toEqual([]);
    });

    it("n'appelle pas le modèle sur un sujet qu'aucune fiche ne couvre", async () => {
        const invites: string[] = [];
        const partiel = CORPUS.filter(f => f.sujet !== 'Secrets et révélations');
        const { echecs } = await forgerLaCampagne(partiel, { appeler: modele(REPONSES, invites) });

        expect(invites.some(p => p.includes('« Les indices »'))).toBe(false);
        expect(echecs.some(e => e.groupe === 'indices')).toBe(true);
    });

    it("s'arrête sur demande et dit ce qui n'a pas été traité", async () => {
        let passes = 0;
        const { echecs, interrompue } = await forgerLaCampagne(CORPUS, {
            appeler: modele(REPONSES),
            abandonne: () => passes++ >= 2,
        });

        expect(interrompue).toBe(true);
        expect(echecs.some(e => e.raison.includes('interrompue'))).toBe(true);
    });

    it("annonce le total des passes, actes compris, dès qu'ils sont connus", async () => {
        const vus: { groupe: string; total: number }[] = [];
        await forgerLaCampagne(CORPUS, {
            appeler: modele(REPONSES),
            onProgres: a => vus.push({ groupe: a.groupe.id, total: a.total }),
        });

        // Neuf groupes, deux d'entre eux forgés deux fois : onze passes.
        expect(vus[vus.length - 1].total).toBe(11);
    });
});

describe('vocabulaireDuProjet', () => {
    it("ne propose que des noms, jamais d'identifiants", () => {
        const projet = projetVide();
        projet.lieux.push({ name: "Villa d'Este" });
        projet.pnj.push({ name: 'Milo Torricelli' });

        expect(vocabulaireDuProjet(projet)).toEqual({
            actes: [], lieux: ["Villa d'Este"], factions: [], pnj: ['Milo Torricelli'], indices: [],
        });
    });
});
