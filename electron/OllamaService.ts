// Utilisation du net.fetch d'Electron pour éviter les bugs réseau de Node.js sur Windows
import { net, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Le journal du processus principal, **sur le disque**.
 *
 * `console.log` d'ici ne sort que dans le terminal du serveur de développement.
 * Ni les DevTools ni personne d'autre ne le voient — et le 2026-08-12, c'est ce
 * qui a rendu indécidable pendant deux heures la question « la contrainte JSON
 * part-elle vraiment ? ». Un fichier se relit après coup, par n'importe qui.
 *
 * Même emplacement et même forme que `~/mcp_bridge_debug.log`, dont la valeur
 * est établie depuis le 2026-08-10 : c'est lui qui a permis de restaurer deux
 * fiches perdues et de trouver dix défauts sur douze.
 */
const JOURNAL = path.join(process.env.USERPROFILE || process.env.HOME || '', 'ollama_debug.log');

function journaliser(message: string): void {
    try {
        fs.appendFileSync(JOURNAL, `[${new Date().toISOString()}] ${message}\n`);
    } catch {
        // Un journal qui échoue ne doit jamais emporter la requête qu'il décrit.
    }
}

export interface OllamaChatResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
        /**
         * La réflexion d'un modèle à raisonnement, qu'Ollama range **à part**.
         *
         * Ce champ n'était pas déclaré, donc jamais regardé — et c'est ce qui a
         * rendu le défaut du 2026-08-12 illisible : `content` arrivait vide, et
         * l'application accusait le parsing JSON.
         */
        thinking?: string;
    };
    done: boolean;
    /** `stop` quand le modèle a fini, `length` quand `num_predict` l'a coupé. */
    done_reason?: string;
}

/** Ce que l'appelant attend de la génération. */
export interface OptionsDeChat {
    /** Décodage : `0` rend l'extraction déterministe. */
    temperature?: number;
    top_k?: number;
    /**
     * Demande une sortie JSON.
     *
     * Pose `format: 'json'` : llama.cpp contraint alors le décodage par une
     * grammaire, et la sortie **ne peut plus** être autre chose que du JSON
     * syntaxiquement valide.
     *
     * **Mais « syntaxiquement valide » est une garantie faible**, et le
     * 2026-08-12 l'a montré trois fois : `{"id\":\"agilite\"` est une chaîne
     * parfaitement légale, un commentaire en anglais logé dans une chaîne
     * aussi. Le décodeur ne voyait rien à redire. Pour une forme connue, c'est
     * `schema` qu'il faut.
     */
    json?: boolean;
    /**
     * Un schéma JSON, qui remplace `format: 'json'` par la **forme exacte**
     * attendue.
     *
     * Ollama le transmet à llama.cpp, qui en dérive une grammaire : le modèle
     * ne peut alors produire ni clé de trop, ni valeur d'un autre type, ni
     * prose — non parce qu'on le lui a demandé, mais parce que **le décodeur
     * ne lui laisse pas d'autre chemin**. Toute la classe d'échecs de la
     * soirée disparaît par construction.
     */
    schema?: Record<string, unknown>;
    num_ctx?: number;
    num_predict?: number;
}

/**
 * Le corps de la requête `/api/chat`, isolé pour être vérifiable.
 *
 * **`think: false` est le cœur de la correction du 2026-08-12.** `gemma4:12b`
 * raisonne avant de répondre ; Ollama range cette réflexion dans
 * `message.thinking` et ne remplit `message.content` qu'ensuite. Mesuré sur la
 * charge réelle d'un groupe de la Forge :
 *
 * | | durée | tokens sortis | `done_reason` | `content` |
 * |---|---|---|---|---|
 * | sans `think` | **349 s** | 2048 | **`length`** | **vide** |
 * | `think: false` | 64 s | 116 | `stop` | JSON valide |
 *
 * Le raisonnement consommait donc **tout** le budget de génération avant
 * d'écrire un seul caractère de réponse. Huit groupes, quarante-six minutes,
 * et huit erreurs qui accusaient le parsing JSON.
 */
export function corpsDeChat(
    model: string,
    messages: { role: string; content: string }[],
    options: OptionsDeChat = {},
    avecThink = true,
): Record<string, unknown> {
    const { json, schema, ...limites } = options;
    return {
        model,
        messages,
        stream: false,
        // Le schéma l'emporte : il dit la forme, là où `'json'` ne dit que la
        // syntaxe.
        ...(schema ? { format: schema } : json ? { format: 'json' } : {}),
        // Omis quand le modèle refuse le champ — cf. la reprise dans `chat`.
        ...(avecThink ? { think: false } : {}),
        // Les limites voyagent avec la requête : elles cessent ainsi de
        // dépendre du réglage local d'une machine — et le décodage glouton
        // avec elles, quand c'est une extraction qu'on demande.
        options: { ...OPTIONS_PAR_DEFAUT, ...(json || schema ? OPTIONS_JSON : {}), ...limites },
    };
}

/**
 * Ce qu'on impose à Ollama, plutôt que de le subir.
 *
 * **Le défaut que cela corrige.** Aucune requête n'envoyait de bloc `options` :
 * ni `num_ctx`, ni `num_predict`, ni `temperature`. Le budget d'invite dépendait
 * donc d'un `OLLAMA_CONTEXT_LENGTH` réglé dans l'application Ollama —
 * **invisible depuis le dépôt, et différent sur une autre machine.** Mesuré le
 * 2026-08-12 sur celle de David : contexte annoncé 16 384, tokens réellement
 * traités 8 195, pour une invite de 55 800. Ce qui dépasse est jeté en silence.
 *
 * `num_predict` était tout aussi absent, donc la génération n'avait aucune
 * borne. À 7,7 tok/s de décodage, un emballement se paie en dizaines de
 * minutes.
 */
/**
 * Le caractère sur lequel une réponse a dégénéré, s'il y en a un.
 *
 * **Relevé le 2026-08-17 sur la Forge de campagne.** Le groupe `relations` s'est
 * terminé par `{"source":"Ser1111111111111111111111111111111` — trois mille
 * caractères de JSON valide, puis le même caractère répété jusqu'à l'arrêt.
 * L'appelant n'a vu qu'un « Expected ',' or ']' at position 3430 », qui désigne
 * le parseur au lieu de la cause.
 *
 * **Trente répétitions**, parce qu'un JSON légitime en contient de courtes —
 * une ligne de tirets dans une description, des zéros dans un identifiant. Une
 * trentaine du même caractère collée à la fin ne s'écrit pas par hasard.
 *
 * On ne regarde que la FIN : une répétition au milieu d'un texte est une
 * citation, pas une panne.
 */
export function caractereQuiBoucle(contenu: string): string | null {
    return /(.)\1{29,}\s*$/.exec(contenu)?.[1] ?? null;
}

export const OPTIONS_PAR_DEFAUT = {
    /**
     * Fenêtre demandée. Ne la fixe pas au maximum de l'architecture : le cache
     * clé-valeur est alloué en conséquence, et il partage la mémoire de l'iGPU
     * avec le modèle.
     */
    num_ctx: 16384,
    /**
     * Plafond de génération. Un fragment de pilote fait quelques centaines de
     * tokens ; deux mille laissent de la marge sans permettre la fuite.
     */
    num_predict: 2048,
} as const;

/**
 * Ce qu'on impose **en plus** quand on attend du JSON.
 *
 * **La contradiction que cela lève.** Le Modelfile de `gemma4:12b` déclare
 * `temperature 1`, `top_k 64`, `top_p 0.95` — chaque token est tiré au hasard
 * parmi les soixante-quatre plus probables. On demandait donc au modèle de
 * *n'inventer rien* tout en l'échantillonnant comme s'il écrivait de la
 * fiction.
 *
 * Sur les 467 tokens de la fiche Dune, cela passait. Sur celle d'Alien, plus
 * longue, un seul mauvais tirage a suffi : le tableau s'est interrompu au
 * milieu, JSON invalide, et le message d'erreur accusait le parseur.
 *
 * Le décodage glouton n'est pas un réglage de prudence, c'est **le bon
 * réglage pour une extraction** : on veut la valeur la plus probable au vu des
 * fiches, pas une variation. La prose de l'Oracle, elle, garde sa température.
 */
export const OPTIONS_JSON = {
    temperature: 0,
    top_k: 1,
    /**
     * La pénalité de répétition, désarmée — **par principe, et non par preuve.**
     *
     * Ollama applique `repeat_penalty: 1.1` par défaut : les tokens récemment
     * employés voient leur probabilité rabaissée. C'est utile en prose, où l'on
     * ne veut pas d'une phrase qui se mord la queue ; c'est douteux pour une
     * structure, qui répète `"id"` et `"label"` à chaque élément.
     *
     * **L'hypothèse qui a motivé ce réglage a été réfutée le 2026-08-12.**
     * J'avais lu dans une sortie cassée la signature d'une pénalité qui
     * s'accumule — « les quatre premiers éléments sont parfaits, puis ça
     * dégénère ». Mesuré ensuite sur les vraies fiches d'Alien, même invite :
     * pénalité par défaut → 447 tokens, JSON valide ; pénalité désarmée → 488
     * tokens, JSON valide. **Aucune différence.**
     *
     * On le garde parce que pénaliser la répétition d'une structure répétitive
     * reste faux dans son principe. Que personne ne croie pour autant que cela
     * a résolu quoi que ce soit.
     */
    repeat_penalty: 1,
    repeat_last_n: 0,
} as const;

export class OllamaService {
    private baseUrl = 'http://127.0.0.1:11434';

    /**
     * Vérifie si le serveur Ollama est accessible
     */
    async checkStatus(endpoint?: string): Promise<boolean> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            const response = await net.fetch(`${url}/api/tags`);
            return response.ok;
        } catch (error) {
            console.error(`[Ollama] Erreur de vérification du statut sur ${url}:`, error);
            return false;
        }
    }

    /**
     * Envoie une requête de chat au modèle local (Bloquant)
     */
    async chat(
        model: string,
        messages: { role: string; content: string }[],
        endpoint?: string,
        options?: OptionsDeChat,
    ): Promise<string> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            /*
              **Ce qui part est écrit, une ligne par appel.**

              Le 2026-08-12, une sortie a contenu du texte APRÈS son JSON — ce
              qui est impossible sous la grammaire de `format: 'json'`, et
              prouve donc qu'elle n'avait pas été appliquée. Impossible de
              savoir depuis le renderer si l'option avait fait le voyage :
              trois processus la relaient, et aucun ne disait ce qu'il envoyait.
            */
            const corps = corpsDeChat(model, messages, options, true);
            const ligne =
                `[Ollama] ${model} — format=${corps.format ?? 'aucun'}, think=${corps.think}, ` +
                `options=${JSON.stringify(corps.options)}, recu=${JSON.stringify(options ?? null)}`;
            console.log(ligne);
            journaliser(ligne);

            const envoyer = async (avecThink: boolean) => net.fetch(`${url}/api/chat`, {
                method: 'POST',
                body: JSON.stringify(avecThink ? corps : corpsDeChat(model, messages, options, false)),
                headers: { 'Content-Type': 'application/json' }
            });

            let response = await envoyer(true);

            /*
              Tous les modèles n'acceptent pas `think`. Plutôt que de tenir une
              liste de ceux qui raisonnent — qui serait fausse à la prochaine
              installation —, on essaie, et on refait sans si le serveur le
              refuse. Le refus est nommé dans le journal : un repli silencieux
              rendrait le prochain diagnostic impossible.
            */
            if (!response.ok) {
                const refus = await response.text().catch(() => '');
                if (/think/i.test(refus)) {
                    console.warn(`[Ollama] « ${model} » refuse le champ « think » ; reprise sans lui.`);
                    response = await envoyer(false);
                } else {
                    throw new Error(`Ollama error (${response.status}): ${refus || response.statusText}`);
                }
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText);
                throw new Error(`Ollama error (${response.status}): ${errorText}`);
            }

            const data = await response.json() as OllamaChatResponse;
            const contenu = data.message?.content ?? '';

            // Ce qui revient, aussi : sans la réponse en face de la requête, le
            // journal ne dit que la moitié de l'histoire.
            journaliser(
                `[Ollama] ← ${data.done_reason ?? '?'} — ${contenu.length} car., ` +
                `${(data.message?.thinking ?? '').length} car. de réflexion. Fin : ` +
                /*
                  1 200 plutôt que 160. Le 2026-08-14, la fin d'un gabarit de
                  fiche tenait tout entière dans ce qui était coupé : on y
                  voyait `"relations":{…}` posé à côté du tableau `sections`,
                  mais pas assez de contexte pour en être sûr sans compter les
                  accolades à la main — et le diagnostic a failli partir sur une
                  fausse piste. Le journal existe pour trancher ; un extrait
                  trop court le rend équivoque, ce qui est le contraire du but.
                */
                `« ${contenu.slice(-1200).replace(/\s+/g, ' ')} »`,
            );

            /*
              Une réponse vide se dit, et se dit avec sa cause.

              Deux causes distinctes, qu'il ne faut pas confondre : le modèle a
              tout dépensé en réflexion (`thinking` rempli), ou il a été coupé
              par `num_predict` (`done_reason: 'length'`). Rendre la chaîne vide
              telle quelle laissait le renderer conclure « JSON illisible » —
              huit fois de suite, et en accusant le mauvais coupable.
            */
            if (!contenu.trim()) {
                const pensee = data.message?.thinking ?? '';
                if (pensee.trim()) {
                    throw new Error(
                        `Le modèle « ${model} » a raisonné ${pensee.length} caractères sans rien répondre` +
                        `${data.done_reason === 'length' ? ' (coupé par num_predict)' : ''}. ` +
                        `Sa réflexion a consommé le budget de génération.`,
                    );
                }
                throw new Error(
                    `Réponse vide de « ${model} »` +
                    `${data.done_reason ? ` (done_reason: ${data.done_reason})` : ''}.`,
                );
            }

            /*
              Une réponse coupée n'est pas une réponse — et surtout pas en JSON.

              `done_reason: 'length'` dit que `num_predict` est tombé au milieu
              de la génération. Rendre ce fragment laissait l'appelant échouer
              plus loin sur un « Expected ',' or ']' » qui désigne le parseur au
              lieu du plafond. On ne le signale que pour le JSON : une prose
              écourtée reste lisible, un objet tronqué ne vaut rien.
            */
            if ((options?.json || options?.schema) && data.done_reason === 'length') {
                const plafond = options.num_predict ?? OPTIONS_PAR_DEFAUT.num_predict;
                throw new Error(
                    `La réponse de « ${model} » a été coupée à ${plafond} tokens (num_predict) : ` +
                    'le JSON est forcément incomplet. Relever le plafond, ou demander moins à la fois.',
                );
            }

            /*
              **Le modèle a bouclé, et il faut le dire.**

              Relevé le 2026-08-17 sur la Forge de campagne : le groupe
              `relations` s'est terminé par
              `{"source":"Ser1111111111111111111111111111111` — trois mille
              caractères de JSON valide, puis le même caractère répété jusqu'à
              l'arrêt. L'appelant n'a vu qu'un « Expected ',' or ']' at position
              3430 », qui désigne le parseur au lieu de la cause.

              **Ce sont NOS options qui l'ouvrent.** `temperature: 0` et
              `top_k: 1` font un décodage strictement glouton, connu pour tomber
              dans des boucles absorbantes ; `repeat_penalty: 1` et
              `repeat_last_n: 0` désactivent ce qui l'en sortirait. Cette
              désactivation est volontaire — en JSON les tokens se répètent
              légitimement — mais elle a un prix, et le prix se paie ici. *Le
              remède d'un défaut ouvre le suivant.*

              On ne corrige pas l'échantillonnage ici : on NOMME la panne, pour
              qu'elle ne coûte pas une heure la prochaine fois.
            */
            if (options?.json || options?.schema) {
                const boucle = /(.)\1{29,}\s*$/.exec(contenu);
                if (boucle) {
                    throw new Error(
                        `La réponse de « ${model} » dégénère : elle se termine par le caractère ` +
                        `« ${boucle} » répété. Le décodage glouton (temperature 0, top_k 1) sans ` +
                        'pénalité de répétition peut boucler. Relancer suffit souvent ; sinon ' +
                        "desserrer l'échantillonnage ou demander moins à la fois.",
                    );
                }

                /*
                  **Un `done_reason` absent n'est pas un `done_reason` normal.**
                  Le garde-fou de troncature ne se déclenche que sur `'length'` ;
                  la réponse qui a bouclé n'en portait aucun, et le journal a
                  affiché « ← ? ». On ne refuse pas la réponse pour autant — elle
                  peut être parfaitement valide — mais on cesse de tenir ce
                  silence pour un succès et on le laisse dans le journal.
                */
                if (!data.done_reason) {
                    console.warn(
                        `[Ollama] ${model} n'a rendu aucun done_reason — ni « stop » ni « length ». ` +
                        `Réponse de ${contenu.length} caractères, acceptée mais suspecte.`,
                    );
                }
            }

            return contenu;
        } catch (error: unknown) {
            const err = error as Error & { code?: string; cause?: unknown };
            if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
                throw new Error(`Ollama est inaccessible sur ${url}. Assurez-vous qu'Ollama est lancé et que le port est correct.`);
            }
            throw error;
        }
    }

    /**
     * Envoie une requête de chat au modèle local avec streaming (Réactifs)
     */
    async chatStream(model: string, messages: { role: string; content: string }[], onToken: (token: string) => void, endpoint?: string): Promise<void> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            const response = await net.fetch(`${url}/api/chat`, {
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: true,
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Ollama stream error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("Réponse vide d'Ollama (Stream body introuvable).");

            const decoder = new TextDecoder();
            let leftover = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                leftover += decoder.decode(value, { stream: true });
                const lines = leftover.split('\n');
                leftover = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            onToken(json.message.content);
                        }
                    } catch (e) {
                         // On ignore les lignes corrompues
                    }
                }
            }
        } catch (error) {
            console.error('[Ollama] Stream error:', error);
            throw error;
        }
    }

    /**
     * Liste les modèles installés localement
     */
    async listModels(endpoint?: string): Promise<string[]> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            const response = await net.fetch(`${url}/api/tags`);
            if (!response.ok) return [];
            
            const data = await response.json() as { models?: { name: string }[] };
            return data.models?.map((m) => m.name) || [];
        } catch (error) {
            console.error(`[Ollama] Erreur de listing des modèles sur ${url}:`, error);
            return [];
        }
    }

    /**
     * Télécharge un modèle depuis la bibliothèque Ollama
     */
    async pullModel(name: string, endpoint?: string): Promise<boolean> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            console.log(`[Ollama] Pulling model: ${name} from ${url}`);
            const response = await net.fetch(`${url}/api/pull`, {
                method: 'POST',
                body: JSON.stringify({ name, stream: false }),
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            console.error(`[Ollama] Erreur lors du pull de ${name} sur ${url}:`, error);
            return false;
        }
    }

    /**
     * Génère une image via l'API Ollama (modèles expérimentaux type Flux)
     */
    async generateImage(model: string, prompt: string, endpoint?: string): Promise<string> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        try {
            console.log(`[Ollama] Generating image with: ${model} at ${url}`);
            const response = await net.fetch(`${url}/api/generate`, {
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false,
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Ollama image generator error: ${response.statusText}`);
            }

            const data = await response.json() as { response: string };
            return data.response;
        } catch (error) {
            console.error(`[Ollama] Erreur de génération d'image sur ${url}:`, error);
            throw error;
        }
    }

    /**
     * Enregistre les gestionnaires IPC pour Ollama
     */
    static registerHandlers() {
        const service = new OllamaService();

        ipcMain.handle('ai:ollama-status', async (_event, endpoint?: string) => {
            return await service.checkStatus(endpoint);
        });

        ipcMain.handle('ai:ollama-chat', async (
            _event,
            model: string,
            messages: { role: string; content: string }[],
            endpoint?: string,
            options?: OptionsDeChat,
        ) => {
            return await service.chat(model, messages, endpoint, options);
        });

        ipcMain.handle('ai:ollama-generate-image', async (_event, model: string, prompt: string, endpoint?: string) => {
            return await service.generateImage(model, prompt, endpoint);
        });

        ipcMain.handle('ai:ollama-chat-stream', async (event, model: string, messages: { role: string; content: string }[], endpoint?: string) => {
            try {
                await service.chatStream(model, messages, (token) => {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send('ai:ollama-stream-token', token);
                    }
                }, endpoint);
                return { success: true };
            } catch (error) {
                console.error('[Ollama Bridge] Streaming error:', error);
                throw error;
            }
        });

        ipcMain.handle('ai:ollama-list-models', async (_event, endpoint?: string) => {
            return await service.listModels(endpoint);
        });

        ipcMain.handle('ai:ollama-pull', async (_event, model: string, endpoint?: string) => {
            return await service.pullModel(model, endpoint);
        });
    }
}
