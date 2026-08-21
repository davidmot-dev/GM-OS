import { describe, it, expect } from 'vitest';
import { gabaritFicheRegle } from './gabarits';

/**
 * **Les titres de section se RECOPIENT, ils ne se reformulent pas.**
 *
 * Relevé par David le 2026-08-21, sur la fiche « La Magie du Haut » de Rêves de
 * Dragons, une fois l'index du livre enfin chargé. Sur sept titres cités, quatre
 * étaient introuvables — et l'index avait raison :
 *
 * | Ce que la fiche citait | Ce que le livre imprime |
 * |---|---|
 * | « Périls Magiques » | « Queues, souffles et têtes de Dragon » (p. 195) |
 * | « Lancement et Réserve » | « Lancer un sort » (181) ET « Mise en réserve » (191) |
 * | « Le Voyage Onirique » | « Les terres du rêve » (175), « Les Terres Médianes du Rêve » (177) |
 *
 * Aucune invention pure : des **reformulations thématiques** et une **fusion de
 * deux sections en une**. Le gabarit demandait bien « titres exacts », en une
 * ligne, au milieu d'une liste de métadonnées — *une consigne noyée est une
 * consigne perdue*, et celle-ci ne disait ni ce qu'« exact » interdit, ni
 * pourquoi elle compte.
 *
 * Elle dit maintenant les deux, dont le fait que ces titres sont **confrontés à
 * l'index** : un titre approché s'y lit comme un titre inventé, et c'est
 * précisément ce qui rend la vérification inutilisable quand elle se déclenche
 * pour rien.
 */
describe('le gabarit exige des titres recopiés, et dit ce qu\'il refuse', () => {
    const gabarit = gabaritFicheRegle('La Magie du Haut');

    it('il demande une recopie mot pour mot, pas une exactitude vague', () => {
        expect(gabarit).toMatch(/RECOPIÉS\s+MOT POUR MOT/);
    });

    it('il dit POURQUOI : les titres sont confrontés à l\'index', () => {
        // La raison fait plus que la règle : un modèle qui sait que sa réponse
        // est vérifiée cesse d'approximer.
        expect(gabarit).toMatch(/CONFRONTÉS À L'INDEX/);
    });

    it('il nomme les trois façons de se tromper, exemples du livre à l\'appui', () => {
        // Le gabarit est un texte replié à la main : on tolère les retours à
        // la ligne, qui sont de la mise en page et non du sens.
        expect(gabarit).toMatch(/Périls\s+Magiques/);       // reformulation thématique
        expect(gabarit).toMatch(/Lancement\s+et\s+Réserve/);  // deux sections fondues en une
        expect(gabarit).toMatch(/titre que tu formes toi-même/);
    });

    it('et il dit quoi faire dans le doute : omettre plutôt qu\'approcher', () => {
        // Le seul repli qui ne coûte rien : une section de moins n'invente pas
        // de page, un titre approché en invente une.
        expect(gabarit).toMatch(/OMETS-LE/);
    });

    it('la seconde moitié de la fiche ne redemande pas de sections', async () => {
        // Elle rédige « À la table », « Cas limites » et « Non couvert » : lui
        // faire citer des sections doublerait la liste sans rien vérifier de plus.
        const { gabaritFichePratique } = await import('./gabarits');
        expect(gabaritFichePratique('La Magie du Haut')).not.toMatch(/^- sections :/m);
    });
});
