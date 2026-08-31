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

/**
 * **Ce qui part, résumé en une ligne — écrit le 2026-08-22.**
 *
 * David, ce soir-là : *« l'étape 10 fonctionne, et je ne vois pas le nom de la
 * scène »*. La question était juste, et le journal ne pouvait pas y répondre :
 * il disait le modèle, les options, ce qui revenait — jamais ce qui partait.
 * Lire le code prouve qu'une section EXISTE ; il ne prouve pas qu'elle porte
 * quelque chose ce soir-là, sur cette campagne.
 *
 * **Les titres et leur poids, pas le prompt.** Le contexte entier ferait des
 * milliers de caractères à chaque appel et noierait le journal. Les titres
 * suffisent à trancher la question qu'on se pose vraiment — « Scène en cours »
 * est-elle là ? — et le nombre qui suit chacun tranche la seconde, qu'un titre
 * seul laisserait ouverte : *une section vide et une section pleine portent le
 * même titre.*
 */
export function sommaireDuSysteme(
    messages: readonly { role: string; content: string }[],
): string {
    const systeme = messages.find(m => m.role === 'system')?.content ?? '';
    if (!systeme) return 'aucun message systeme';

    const titres = [...systeme.matchAll(/^[ 	]*#{2,4} +(.+?)[ 	]*$/gm)];
    const sommaire = titres.map((t, i) => {
        const debut = (t.index ?? 0) + t[0].length;
        const fin = i + 1 < titres.length ? (titres[i + 1].index ?? systeme.length) : systeme.length;
        return `${t[1]}(${systeme.slice(debut, fin).trim().length})`;
    });

    /*
      Le contexte RAG apporte ses propres titres — une fiche de règles en a
      plusieurs. On borne : au-delà, la ligne cesse d'être lisible d'un coup
      d'oeil, ce qui est tout ce qu'on lui demande.
    */
    const MAX = 20;
    const listee = sommaire.length > MAX
        ? [...sommaire.slice(0, MAX), `+${sommaire.length - MAX}`]
        : sommaire;

    return `${systeme.length} car. [${listee.join(' | ') || 'sans titre'}]`;
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
    /**
     * **Le streaming passe par ici depuis le 2026-08-21, et c'est le correctif.**
     *
     * `chatStream` fabriquait son propre corps : `{ model, messages, stream }`,
     * et rien d'autre. Ni `options`, donc ni `num_ctx` ni `num_predict` — et
     * surtout **PAS `think: false`**, dont ce fichier mesure pourtant le prix
     * juste au-dessus : 349 s contre 64 s sur `gemma4:12b`, le raisonnement
     * consommant tout le budget avant d'écrire un caractère de réponse.
     *
     * En streaming, la réflexion part dans `message.thinking` que la boucle de
     * lecture ignore : l'écran affiche « réception de la vision… » et **rien ne
     * s'écrit**, parfois pendant des minutes. C'est exactement le symptôme que
     * David a signalé le 2026-08-21.
     *
     * *Deux chemins vers Ollama, dont un seul recevait les corrections des deux
     * derniers mois.* Il n'y en a plus qu'un.
     */
    enFlux = false,
): Record<string, unknown> {
    const { json, schema, ...limites } = options;
    return {
        model,
        messages,
        stream: enFlux,
        keep_alive: DUREE_DE_CHARGE,
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
 * Le corps d'un **préchauffage** : on charge le modèle et on n'engendre rien.
 *
 * **Ce que ça achète — mesuré le 2026-08-31.** Le chargement du modèle sur
 * l'iGPU, soit **13 à 20 s**, retirés de la première question de la soirée
 * (~62 s à froid, ~50 s à chaud). Rien ne le provoquait à l'avance : *le meneur
 * payait le démarrage d'Ollama au pire moment, sa première question devant la
 * table.*
 *
 * ⚠️ **Et rien de plus.** Le prefill du contexte RAG — 43 s pour 4 000 tokens à
 * ~90 tok/s — se paie à chaque question, parce que ce contexte est neuf à chaque
 * question.
 *
 * **Aucun `prompt` : c'est ce qui distingue un préchauffage d'une requête.**
 * Ollama charge le modèle, répond aussitôt, et ne décode pas un token.
 *
 * ⚠️ **`num_ctx` doit être celui des vraies requêtes, sinon tout est perdu.**
 * La fenêtre décide de la taille du cache clé-valeur, donc de l'occupation
 * mémoire : demander 16 384 après avoir chargé sur 4 096 fait **recharger** le
 * modèle, et le préchauffage n'aura fait qu'ajouter une montée de plus. Il lit
 * donc `OPTIONS_PAR_DEFAUT`, la seule écriture de cette valeur.
 *
 * `keep_alive` est ici pour la même raison que dans `corpsDeChat` : de premier
 * niveau, jamais dans `options`, où Ollama l'ignore en silence.
 */
export function corpsDePrechauffage(model: string): Record<string, unknown> {
    return {
        model,
        keep_alive: DUREE_DE_CHARGE,
        options: { num_ctx: OPTIONS_PAR_DEFAUT.num_ctx },
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

/**
 * **Les requêtes en vol, et de quoi les arrêter vraiment — axe D.1 du plan du
 * 2026-08-07.**
 *
 * **Ce que rien ne faisait.** Aucun `AbortController`, aucun `signal`, nulle
 * part dans la chaîne IA. Le délai de 45 minutes d'`AIService` est un
 * `Promise.race` : il rejette la promesse, **mais la génération continue chez
 * Ollama**. Et sous `OLLAMA_NUM_PARALLEL: 1` elle occupe l'unique créneau.
 *
 * Conséquence, et c'est le défaut le plus structurant du plan : *une Forge
 * lancée par erreur en séance bloque l'Oracle et le Cortex pour toute sa durée
 * réelle, quoi que fasse le meneur.* Fermer la fenêtre n'y changeait rien.
 * **Aucun plafond de temps n'était donc réel** — ils promettaient tous
 * d'abandonner l'attente, aucun n'arrêtait le travail.
 *
 * **Pourquoi un registre et non un `signal` passé au pont.** Un `AbortSignal`
 * ne traverse pas l'IPC : il n'est pas sérialisable. On échange donc un
 * identifiant, et le contrôleur reste du côté où vit le `fetch`. C'est la seule
 * forme possible, et elle a un mérite : le processus principal sait à tout
 * moment ce qui est en vol, ce qu'aucun des deux côtés ne savait avant.
 *
 * L'entrée se retire dans un `finally` : un registre qui fuit ferait grossir la
 * mémoire d'une requête par appel, et rendrait faux tout compte de ce qui
 * tourne.
 */
/** Ce qu'on retient d'une requête en vol — de quoi la nommer et la dater. */
interface RequeteEnVol {
    controleur: AbortController;
    /** Ce que le meneur reconnaîtra : « Forge », « Oracle », « Portrait ». */
    libelle: string;
    debut: number;
}

/** L'identité d'une requête : son nom d'annulation et ce qu'elle est. */
export interface Requete {
    id: string;
    libelle: string;
}

const enVol = new Map<string, RequeteEnVol>();

/** Ouvre un créneau annulable. Rend le signal à passer au `fetch`. */
function inscrire(requete?: Requete): AbortSignal | undefined {
    if (!requete) return undefined;
    // Une reprise sous le même identifiant remplace la précédente : c'est le
    // cas de la seconde tentative quand un modèle refuse « think ».
    enVol.get(requete.id)?.controleur.abort();
    const controleur = new AbortController();
    enVol.set(requete.id, { controleur, libelle: requete.libelle, debut: Date.now() });
    return controleur.signal;
}

/** Referme le créneau, quoi qu'il soit arrivé. */
function retirer(requete?: Requete): void {
    if (requete) enVol.delete(requete.id);
}

/**
 * Arrête la requête portant cet identifiant. Rend `true` si elle existait.
 *
 * Rendre `false` plutôt que de lever : abandonner une requête déjà terminée est
 * le cas normal — l'utilisateur clique pendant que la réponse arrive.
 */
export function abandonnerLaRequete(requeteId: string): boolean {
    const vol = enVol.get(requeteId);
    if (!vol) return false;
    vol.controleur.abort();
    enVol.delete(requeteId);
    journaliser(`[Ollama] ✕ « ${vol.libelle} » abandonnée à la demande.`);
    return true;
}

/**
 * Ce qui tourne, nommé et daté — **la matière du verrou visible, axe D.3.**
 *
 * **Un compte ne suffit pas, et c'est tout l'enjeu.** David, le 2026-08-21 :
 * *« je n'ai pas la main sur le Cortex quand je forge »*. Il peut pourtant
 * envoyer sa question — le `loading` du panneau est local à lui. Elle part, et
 * **fait la queue chez Ollama** sous `NUM_PARALLEL: 1`, sans que rien ne
 * l'explique : l'écran affiche « réception de la vision… » indéfiniment.
 *
 * Le plan tranche la façon d'y répondre : *« savoir qu'une opération tourne vaut
 * mieux que l'empêcher — "Forge en cours, l'Oracle attendra ~12 min" est
 * actionnable ; un bouton grisé ne l'est pas. »* Encore faut-il pouvoir dire
 * LAQUELLE et DEPUIS QUAND, d'où le libellé et la date plutôt qu'un entier.
 */
export function requetesEnVol(): { id: string; libelle: string; depuis: number }[] {
    const maintenant = Date.now();
    return [...enVol.entries()].map(([id, v]) => ({
        id, libelle: v.libelle, depuis: maintenant - v.debut,
    }));
}

export { OPTIONS_PAR_DEFAUT } from './optionsDuModele';
import { OPTIONS_PAR_DEFAUT } from './optionsDuModele';


/**
 * Combien de temps le modèle reste chargé après une réponse.
 *
 * **Absent jusqu'au 2026-08-21**, donc laissé au défaut d'Ollama : cinq
 * minutes. Passé ce délai le modèle se décharge, et le chargement suivant se
 * paie en entier — sur un iGPU qui partage sa mémoire, cela se compte en
 * dizaines de secondes avant le premier token.
 *
 * **Il emportait aussi le cache d'invite avec lui**, ce qui annulait le
 * bénéfice de l'axe C : inverser les blocs pour rendre le préfixe réutilisable
 * ne sert à rien si le modèle qui le tenait n'est plus là. Trente minutes
 * couvrent une séance sans monopoliser la machine hors jeu.
 *
 * **Il est de PREMIER NIVEAU, pas une option.** Ollama le lit à côté de `model`
 * et de `messages` ; rangé dans `options`, il serait accepté sans effet et sans
 * un mot — le genre de réglage qu'on croit avoir posé pendant des semaines.
 */
export const DUREE_DE_CHARGE = '30m';

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
     * **Charge le modèle avant qu'on en ait besoin.**
     *
     * Appelé à l'ouverture de la séance, puis renouvelé tant qu'elle dure —
     * voir `src/modules/ai/prechauffage.ts`, qui décide *quand*. Ce service ne
     * décide que du *comment*.
     *
     * **Un échec ne se remonte pas à l'écran, et c'est voulu.** Un
     * préchauffage raté ne casse rien : la question suivante rechargera le
     * modèle comme avant. *Prévenir le meneur qu'une optimisation n'a pas eu
     * lieu, c'est lui donner un souci qu'il ne peut pas traiter.* Le journal
     * garde la trace pour qui la cherche.
     */
    async prechauffer(model: string, endpoint?: string): Promise<boolean> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        const depart = Date.now();
        try {
            const reponse = await net.fetch(`${url}/api/generate`, {
                method: 'POST',
                body: JSON.stringify(corpsDePrechauffage(model)),
                headers: { 'Content-Type': 'application/json' },
            });
            const secondes = ((Date.now() - depart) / 1000).toFixed(1);
            const ligne = reponse.ok
                ? `[Ollama] préchauffage de ${model} — chargé en ${secondes} s`
                : `[Ollama] préchauffage de ${model} — refusé (${reponse.status} ${reponse.statusText})`;
            console.log(ligne);
            journaliser(ligne);
            return reponse.ok;
        } catch (error) {
            const ligne = `[Ollama] préchauffage de ${model} impossible sur ${url} : ${error instanceof Error ? error.message : String(error)}`;
            console.log(ligne);
            journaliser(ligne);
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
        /** Nom et libellé de la requête — voir le registre `enVol`. */
        requete?: Requete,
    ): Promise<string> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        const signal = inscrire(requete);
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
                `options=${JSON.stringify(corps.options)}, recu=${JSON.stringify(options ?? null)}` +
                `, contexte=${sommaireDuSysteme(messages)}`;
            console.log(ligne);
            journaliser(ligne);

            const envoyer = async (avecThink: boolean) => net.fetch(`${url}/api/chat`, {
                method: 'POST',
                body: JSON.stringify(avecThink ? corps : corpsDeChat(model, messages, options, false)),
                headers: { 'Content-Type': 'application/json' },
                signal,
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
            /*
              **Une requête abandonnée n'est pas une panne d'Ollama.** Sans ce
              cas, un abandon volontaire ressortait en « Ollama est inaccessible,
              assurez-vous qu'il est lancé » — un message qui envoie chercher un
              serveur éteint alors que c'est l'utilisateur qui a cliqué.
            */
            if (err.name === 'AbortError') {
                throw new Error('Requête abandonnée.');
            }
            if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
                throw new Error(`Ollama est inaccessible sur ${url}. Assurez-vous qu'Ollama est lancé et que le port est correct.`);
            }
            throw error;
        } finally {
            retirer(requete);
        }
    }

    /**
     * Envoie une requête de chat au modèle local avec streaming (Réactifs)
     */
    /**
     * **Le même corps de requête que `chat`, et la même reprise sur `think`.**
     *
     * Ce chemin fabriquait le sien — `{ model, messages, stream: true }` — et
     * n'avait donc reçu aucune des corrections des deux derniers mois : ni
     * `num_ctx`, ni `num_predict`, ni `keep_alive`, et surtout pas
     * `think: false`. Or c'est LUI que l'Oracle emprunte.
     *
     * En flux, la réflexion du modèle part dans `message.thinking`, que la
     * boucle de lecture ci-dessous ignore : l'écran affiche « réception de la
     * vision… » et rien ne s'écrit tant que le modèle pense. Signalé par David
     * le 2026-08-21.
     */
    async chatStream(
        model: string,
        messages: { role: string; content: string }[],
        onToken: (token: string) => void,
        endpoint?: string,
        options?: OptionsDeChat,
        /** Nom et libellé de la requête — voir le registre `enVol`. */
        requete?: Requete,
    ): Promise<void> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        const signal = inscrire(requete);
        try {
            const envoyer = async (avecThink: boolean) => net.fetch(`${url}/api/chat`, {
                method: 'POST',
                body: JSON.stringify(corpsDeChat(model, messages, options, avecThink, true)),
                headers: { 'Content-Type': 'application/json' },
                signal,
            });

            const corps = corpsDeChat(model, messages, options, true, true);
            journaliser(
                `[Ollama] ⇢ flux ${model} — think=${corps.think}, keep_alive=${corps.keep_alive}, `
                + `options=${JSON.stringify(corps.options)}, `
                + `contexte=${sommaireDuSysteme(messages)}`,
            );

            let response = await envoyer(true);

            /*
              Même reprise que `chat` : tous les modèles n'acceptent pas
              `think`. On essaie, et on refait sans si le serveur le refuse —
              nommé dans le journal, parce qu'un repli silencieux rendrait le
              prochain diagnostic impossible.
            */
            if (!response.ok) {
                const refus = await response.text().catch(() => '');
                if (/think/i.test(refus)) {
                    console.warn(`[Ollama] « ${model} » refuse « think » en flux ; reprise sans lui.`);
                    response = await envoyer(false);
                } else {
                    throw new Error(`Ollama stream error (${response.status}): ${refus || response.statusText}`);
                }
            }

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
        } finally {
            // Un registre qui fuit ferait grossir la mémoire d'une entrée par
            // appel, et rendrait faux tout compte de ce qui tourne.
            retirer(requete);
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
    async generateImage(model: string, prompt: string, endpoint?: string, requete?: Requete): Promise<string> {
        const url = (endpoint || this.baseUrl).replace(/\/$/, '');
        const signal = inscrire(requete);
        try {
            console.log(`[Ollama] Generating image with: ${model} at ${url}`);
            const response = await net.fetch(`${url}/api/generate`, {
                method: 'POST',
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false,
                }),
                headers: { 'Content-Type': 'application/json' },
                signal,
            });

            if (!response.ok) {
                throw new Error(`Ollama image generator error: ${response.statusText}`);
            }

            const data = await response.json() as { response: string };
            return data.response;
        } catch (error) {
            console.error(`[Ollama] Erreur de génération d'image sur ${url}:`, error);
            throw error;
        } finally {
            retirer(requete);
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
            requete?: Requete,
        ) => {
            return await service.chat(model, messages, endpoint, options, requete);
        });

        /*
          **Arrêter, et pas seulement cesser d'attendre — axe D.1.**

          Les plafonds d'`AIService` sont des `Promise.race` : ils rejettent la
          promesse pendant que la génération continue chez Ollama, occupant
          l'unique créneau de `NUM_PARALLEL: 1`. Ce canal est ce qui rend un
          plafond réel.
        */
        ipcMain.handle('ai:ollama-abort', async (_event, requeteId: string) => abandonnerLaRequete(requeteId));

        /** Ce qui tourne, pour que le verrou puisse se montrer (axe D.3). */
        ipcMain.handle('ai:ollama-en-vol', async () => requetesEnVol());

        ipcMain.handle('ai:ollama-generate-image', async (_event, model: string, prompt: string, endpoint?: string, requete?: Requete) => {
            return await service.generateImage(model, prompt, endpoint, requete);
        });

        ipcMain.handle('ai:ollama-chat-stream', async (event, model: string, messages: { role: string; content: string }[], endpoint?: string, options?: OptionsDeChat, requete?: Requete) => {
            try {
                await service.chatStream(model, messages, (token) => {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send('ai:ollama-stream-token', token);
                    }
                }, endpoint, options, requete);
                return { success: true };
            } catch (error) {
                console.error('[Ollama Bridge] Streaming error:', error);
                throw error;
            }
        });

        /** Charger le modèle d'avance — sans requête, sans réponse à attendre. */
        ipcMain.handle('ai:ollama-prechauffer', async (_event, model: string, endpoint?: string) => {
            return await service.prechauffer(model, endpoint);
        });

        ipcMain.handle('ai:ollama-list-models', async (_event, endpoint?: string) => {
            return await service.listModels(endpoint);
        });

        ipcMain.handle('ai:ollama-pull', async (_event, model: string, endpoint?: string) => {
            return await service.pullModel(model, endpoint);
        });
    }
}
