import { describe, it, expect } from 'vitest';
import { questionAuCarnet, LONGUEUR_MAX_D_UNE_QUESTION } from './questionAuCarnet';
import { gabaritInventaire, gabaritFicheRegle, gabaritFichePratique, promptVoix, promptPersonas } from '../../forge/rules/gabarits';
import { gabaritInventaireDeCampagne, gabaritStructureDeCampagne, toutesLesInvites } from '../../forge/campagne/gabaritsDeCampagne';

const ETAT_COURT = '## Scène\nLe quai 9, la nuit.\n## PJ\n- Deckard';
const ETAT_LONG = Array.from({ length: 120 }, (_, i) => `- PNJ ${i} : un témoin nerveux qui cache quelque chose.`).join('\n');

describe('la question envoyée à NotebookLM (2026-10-03)', () => {
    it('un état court passe entier, avec le message et la consigne', () => {
        const q = questionAuCarnet(ETAT_COURT, 'Qui est Lilith ?');
        expect(q).toContain(ETAT_COURT);
        expect(q).toContain('[MESSAGE DU MJ]\nQui est Lilith ?');
        expect(q).toContain('(Réponds toujours en français)');
    });

    it('un état trop long se coupe à une fin de ligne, le dit, et tient dans la limite', () => {
        const q = questionAuCarnet(ETAT_LONG, 'Qui est Lilith ?');
        expect(q.length).toBeLessThanOrEqual(LONGUEUR_MAX_D_UNE_QUESTION);
        expect(q).toContain('état de la séance raccourci');
        expect(q).toContain('Qui est Lilith ?');
        // Coupé à une fin de ligne : la dernière ligne gardée est entière.
        const garde = q.split('\n… (état')[0];
        expect(garde.endsWith('quelque chose.')).toBe(true);
    });

    it('le message du meneur n’est jamais coupé — sans place pour l’état, il part seul', () => {
        const long = 'x'.repeat(LONGUEUR_MAX_D_UNE_QUESTION);
        expect(questionAuCarnet(ETAT_LONG, long)).toBe(`${long}\n\n(Réponds toujours en français)`);
    });

    it('sans état, le message seul', () => {
        expect(questionAuCarnet('  ', 'Bonjour')).toBe('Bonjour\n\n(Réponds toujours en français)');
    });
});

/**
 * **Les invites de la Forge passent aussi par `notebook_query`** — sans état
 * ajouté, mais elles grandissent avec le temps. 3 594 caractères est le plus
 * long envoi accepté par NotebookLM le 2026-10-03 ; 3 962, le premier refusé.
 */
describe('les invites de la Forge tiennent sous la limite de NotebookLM', () => {
    const PLUS_LONG_ACCEPTE = 3594;
    const invites: [string, string][] = [
        ['inventaire', gabaritInventaire()],
        ['fiche de règle', gabaritFicheRegle('Combat rapproché et armes improvisées')],
        ['fiche pratique', gabaritFichePratique('Combat rapproché et armes improvisées')],
        ['voix', promptVoix()],
        ['personas', promptPersonas()],
        ['inventaire de campagne', gabaritInventaireDeCampagne()],
        ['structure de campagne', gabaritStructureDeCampagne()],
        ...toutesLesInvites(['Acte I — Le quai', 'Acte II — La tour']).map(i => [i.titre, i.invite] as [string, string]),
    ];
    it.each(invites)('%s', (_nom, invite) => {
        expect(invite.length).toBeLessThanOrEqual(PLUS_LONG_ACCEPTE);
    });
});
