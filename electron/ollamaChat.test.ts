import { describe, it, expect } from 'vitest';
import { corpsDeChat, OPTIONS_PAR_DEFAUT } from './OllamaService';

/**
 * Ce que ces tests protègent : **la requête dit ce qu'elle attend**.
 *
 * Le défaut du 2026-08-12, mesuré sur la charge réelle d'un groupe de la Forge
 * dérivée. `gemma4:12b` raisonne avant de répondre ; Ollama range cette
 * réflexion dans `message.thinking` et ne remplit `message.content` qu'ensuite.
 *
 * | | durée | tokens sortis | `done_reason` | `content` |
 * |---|---|---|---|---|
 * | sans `think` | **349 s** | 2048 | **`length`** | **vide** |
 * | `think: false` | 64 s | 116 | `stop` | JSON valide |
 *
 * Le raisonnement consommait tout le budget de génération avant d'écrire un
 * seul caractère. Les huit groupes ont échoué de la même façon, quarante-six
 * minutes durant, sur une erreur qui accusait le parsing JSON.
 */

const messages = [{ role: 'user', content: 'Rends un pilote.' }];

describe('le corps de la requête Ollama', () => {
  it('refuse le raisonnement, qui mangeait tout le budget de génération', () => {
    expect(corpsDeChat('gemma4:12b', messages)).toMatchObject({ think: false });
  });

  it('omet « think » quand le modèle l\'a refusé', () => {
    // Le repli n'est pas cosmétique : tous les modèles n'acceptent pas ce
    // champ, et une liste de ceux qui raisonnent serait fausse à la prochaine
    // installation.
    expect(corpsDeChat('phi3', messages, {}, false)).not.toHaveProperty('think');
  });

  it('contraint la sortie quand du JSON est attendu', () => {
    /**
     * `format: 'json'` n'est pas une consigne au modèle, c'est une grammaire
     * imposée au décodeur : la sortie ne *peut* plus être autre chose que du
     * JSON valide. Une consigne s'ignore, une grammaire non.
     */
    expect(corpsDeChat('gemma4:12b', messages, { json: true })).toMatchObject({ format: 'json' });
  });

  it('ne demande aucun format quand c\'est de la prose qu\'on veut', () => {
    expect(corpsDeChat('gemma4:12b', messages)).not.toHaveProperty('format');
  });

  it('emporte ses limites, plutôt que de subir celles de la machine', () => {
    /**
     * Sans ce bloc, le budget dépendait d'un `OLLAMA_CONTEXT_LENGTH` réglé dans
     * l'application Ollama — invisible depuis le dépôt, et différent sur une
     * autre machine.
     */
    expect(corpsDeChat('gemma4:12b', messages)).toMatchObject({ options: OPTIONS_PAR_DEFAUT });
  });

  it('laisse l\'appelant relever un plafond sans perdre les autres', () => {
    const corps = corpsDeChat('gemma4:12b', messages, { json: true, num_predict: 4096 });
    expect(corps.options).toEqual({ num_ctx: OPTIONS_PAR_DEFAUT.num_ctx, num_predict: 4096 });
    // `json` pilote `format`, il n'a rien à faire dans les options du modèle.
    expect(corps.options).not.toHaveProperty('json');
  });
});
