import { describe, it, expect } from 'vitest';
import { corpsDeChat, corpsDePrechauffage, DUREE_DE_CHARGE, OPTIONS_PAR_DEFAUT, OPTIONS_JSON } from './OllamaService';

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

  it('ne penalise pas la repetition quand la sortie est une structure', () => {
    /**
     * Ollama applique `repeat_penalty: 1.1` par défaut. C'est utile en prose,
     * c'est un poison pour un tableau JSON, qui répète `"id"` et `"label"` à
     * chaque élément.
     *
     * Observé sur la liste des sections d'Alien le 2026-08-12 : quatre éléments
     * impeccables, puis `{"id\":\"jauges_stress\"` et `{":null,`. Avec
     * `temperature: 0` et `top_k: 1`, le mauvais token devient déterministe —
     * les deux réglages se combinaient en piège.
     */
    expect(corpsDeChat('gemma4:12b', messages, { json: true }).options)
      .toMatchObject({ repeat_penalty: 1, repeat_last_n: 0 });
    expect(corpsDeChat('gemma4:12b', messages).options).not.toHaveProperty('repeat_penalty');
  });

  it('décode gloutonnement quand il extrait, et pas quand il rédige', () => {
    /**
     * La contradiction levée le 2026-08-12 : le Modelfile de `gemma4:12b`
     * déclare `temperature 1` et `top_k 64`. On demandait donc au modèle de
     * **n'inventer rien** tout en l'échantillonnant comme s'il écrivait de la
     * fiction. La fiche de personnage d'Alien s'est interrompue au milieu d'un
     * tableau — un seul mauvais tirage sur quatre cents tokens suffit.
     *
     * La prose de l'Oracle, elle, garde sa température : ce n'est pas une
     * extraction.
     */
    expect(corpsDeChat('gemma4:12b', messages, { json: true }).options)
      .toMatchObject({ temperature: 0, top_k: 1 });
    expect(corpsDeChat('gemma4:12b', messages).options).not.toHaveProperty('temperature');
  });

  it('laisse l\'appelant reprendre la main sur le décodage', () => {
    expect((corpsDeChat('gemma4:12b', messages, { json: true, temperature: 0.4 }).options as Record<string, unknown>).temperature)
      .toBe(0.4);
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
    expect(corps.options).toEqual({ num_ctx: OPTIONS_PAR_DEFAUT.num_ctx, num_predict: 4096, ...OPTIONS_JSON });
    // `json` pilote `format`, il n'a rien à faire dans les options du modèle.
    expect(corps.options).not.toHaveProperty('json');
  });
});

/**
 * **Le flux passe par le même corps que le reste — axe E.1, fait le 2026-08-21.**
 *
 * `chatStream` fabriquait le sien : `{ model, messages, stream: true }`, et rien
 * d'autre. Il n'avait donc reçu aucune des corrections des deux derniers
 * mois — ni les bornes de génération, ni `think: false`, dont ce fichier mesure
 * pourtant le prix : 349 s contre 64 s.
 *
 * **Et c'est LUI que l'Oracle emprunte.** En flux, la réflexion du modèle part
 * dans `message.thinking`, que la boucle de lecture ignore : l'écran affiche
 * « réception de la vision… » et rien ne s'écrit tant que le modèle pense.
 * Signalé par David le 2026-08-21 — « les temps de réponse sont très longs ».
 *
 * *Deux chemins vers le même service, dont un seul était entretenu.*
 */
describe('le corps de requête en flux', () => {
    const messages = [{ role: 'user', content: 'Décris la salle.' }];

    it('demande bien un flux, et lui seul', () => {
        expect(corpsDeChat('gemma4:12b', messages, {}, true, true)).toMatchObject({ stream: true });
        expect(corpsDeChat('gemma4:12b', messages)).toMatchObject({ stream: false });
    });

    it('emporte « think: false » comme le chemin bloquant', () => {
        // La correction du 2026-08-12 ne s'appliquait qu'à `chat`. C'est
        // pourtant en flux qu'une réflexion muette se voit le plus : rien ne
        // s'écrit à l'écran pendant qu'elle dure.
        expect(corpsDeChat('gemma4:12b', messages, {}, true, true)).toMatchObject({ think: false });
    });

    it('emporte les bornes de génération', () => {
        const corps = corpsDeChat('gemma4:12b', messages, { num_predict: 1024 }, true, true);

        expect(corps.options).toMatchObject({ num_ctx: OPTIONS_PAR_DEFAUT.num_ctx, num_predict: 1024 });
    });

    it('et la durée de charge, AU PREMIER NIVEAU', () => {
        /**
         * `keep_alive` n'est pas une option : Ollama le lit à côté de `model` et
         * de `messages`. Rangé dans `options`, il serait accepté sans effet et
         * sans un mot — le genre de réglage qu'on croit avoir posé pendant des
         * semaines.
         */
        const corps = corpsDeChat('gemma4:12b', messages, {}, true, true);

        expect(corps.keep_alive).toBe(DUREE_DE_CHARGE);
        expect(corps.options).not.toHaveProperty('keep_alive');
    });

    it('le chemin bloquant garde exactement les mêmes garanties', () => {
        // Un seul corps pour les deux : ce qui vaut pour l'un vaut pour l'autre,
        // et c'est tout l'objet de l'unification.
        const flux = corpsDeChat('gemma4:12b', messages, {}, true, true);
        const bloquant = corpsDeChat('gemma4:12b', messages, {}, true, false);

        expect({ ...flux, stream: undefined }).toEqual({ ...bloquant, stream: undefined });
    });
});

/**
 * **Le préchauffage — mesuré le 2026-08-31.**
 *
 * Le chargement du modèle sur l'iGPU coûte 13 à 20 s, et rien ne le provoquait
 * avant la première question de la soirée. Une requête sans invite le fait
 * d'avance, à l'ouverture de la séance. *Elle ne retire que ça* : le prefill du
 * contexte RAG est neuf à chaque question.
 */
describe('le corps du préchauffage', () => {
  it('ne demande aucune génération — c’est ce qui en fait un préchauffage', () => {
    expect(corpsDePrechauffage('gemma4:12b')).not.toHaveProperty('prompt');
    expect(corpsDePrechauffage('gemma4:12b')).not.toHaveProperty('messages');
  });

  it('garde le modèle chargé aussi longtemps qu’une vraie requête', () => {
    // Et au premier niveau : dans `options`, Ollama l'ignore en silence.
    const corps = corpsDePrechauffage('gemma4:12b');
    expect(corps.keep_alive).toBe(DUREE_DE_CHARGE);
    expect(corps.options).not.toHaveProperty('keep_alive');
  });

  /**
   * **Le piège qui viderait ce travail de son sens.** La fenêtre décide de la
   * taille du cache clé-valeur, donc de l'occupation mémoire : charger sur une
   * fenêtre puis demander l'autre fait **recharger** le modèle, et le
   * préchauffage n'aura fait qu'ajouter une montée de plus.
   */
  it('charge sur la fenêtre des vraies requêtes, sans quoi le modèle recharge', () => {
    expect(corpsDePrechauffage('gemma4:12b').options)
      .toMatchObject({ num_ctx: OPTIONS_PAR_DEFAUT.num_ctx });
  });
});
