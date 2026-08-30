import { z } from 'zod';

// --- Basic Types ---
export const CampaignSchema = z.object({
    id: z.string(),
    name: z.string(),
    system: z.string(),
    description: z.string().optional().default(''),
    synopsis: z.string().optional().default(''),
    activeSessionId: z.string().optional(),
    activeLocationIds: z.array(z.string()).default([]),
    wallpaperUrl: z.string().optional(),
}).passthrough();

export const PlayerCharacterSchema = z.object({
    id: z.string(),
    name: z.string(),
    classRace: z.string().optional().default(''),
    portraitUrl: z.string().optional().default(''),
    hp: z.number().default(0),
    maxHp: z.number().default(0),
    campaignId: z.string().nullable().default(null),
    templateId: z.string().default('generic'),
    sheetData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
}).passthrough();

export const PlayerSchema = z.object({
    id: z.string(),
    realName: z.string(),
    avatarUrl: z.string().optional().default(''),
    isOnline: z.boolean().default(false),
    characters: z.array(PlayerCharacterSchema).default([]),
}).passthrough();

export const WebLinkSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    color: z.string().default('blue'),
}).passthrough();

// --- Module Snapshots ---
export const SessionOSModuleSchema = z.object({
    campaigns: z.array(CampaignSchema).default([]),
    players: z.array(PlayerSchema).default([]),
    activeCampaignId: z.string().nullable().default(null),
    /*
      **AUCUN `.default([])` ICI, ET C'EST LA SEULE CHOSE À RETENIR DE CE BLOC.**

      `distributeData` termine par `useSessionOSStore.setState(sessionOS)`. Un
      `setState` partiel ne touche QUE les clés présentes — mais un défaut à vide
      rend la clé présente, avec du vide dedans. Relire une sauvegarde qui ne
      porte pas `timelineEvents` remplaçait donc une chronologie bien vivante par
      `[]`, sans erreur, sans message, et sans que rien ne distingue « la
      sauvegarde n'en parle pas » de « la sauvegarde dit qu'il n'y en a aucun ».

      *Un champ absent laisse le store tranquille ; un défaut à vide l'écrase.*
      C'est pour cette raison que `sessions`, `entities` et `clues` ont été
      déclarés sans défaut le 2026-08-20 ; les trois du dessus l'avaient gardé,
      et la moitié du défaut est restée en place cinq jours. Ils sont désormais
      tous les six sur la même règle.

      Le schéma est `.passthrough()` : les champs qu'il ne nomme pas — `actes`,
      `scenes`, les pilotes, les decks — traversent intacts. Ne rien déclarer est
      donc toujours plus sûr que de déclarer un défaut.
    */
    timelineEvents: z.array(z.any()).optional(),
    wikiEntries: z.array(z.any()).optional(),
    atlasMaps: z.array(z.any()).optional(),
    sessions: z.array(z.any()).optional(),
    entities: z.array(z.any()).optional(),
    clues: z.array(z.any()).optional(),
}).passthrough();

// --- Global Structure ---
export const ThemeIDSchema = z.enum(['cyberpunk', 'medieval', 'modern', 'claire']);
export const ModuleIDSchema = z.enum(['dashboard', 'music', 'sound', 'ambient', 'combat', 'npc', 'clock', 'light', 'image', 'map', 'table', 'web', 'voice', 'favorite', 'debug', 'dice', 'whiteboard', 'obsidian', 'journal', 'forge']);

export const GlobalSettingsSchema = z.object({
    theme: ThemeIDSchema.default('cyberpunk'),
    themeColor: z.string().default('#06b6d4'),
    activeModule: ModuleIDSchema.default('dashboard'),
}).passthrough().default({
    theme: 'cyberpunk',
    themeColor: '#06b6d4',
    activeModule: 'dashboard'
});

export const FullSessionSchema = z.object({
    version: z.string().optional().default('5.1.0'),
    timestamp: z.string().optional(),
    global: GlobalSettingsSchema,
    modules: z.object({
        sessionOS: SessionOSModuleSchema.optional(),
        npc: z.object({ savedEntities: z.array(z.any()) }).optional(),
        web: z.object({ links: z.array(WebLinkSchema) }).optional(),
        clock: z.object({ timestamp: z.number() }).optional(),
        ambient: z.object({ tracks: z.array(z.any()) }).optional(),
        whiteboard: z.object({ paths: z.array(z.any()) }).optional(),
        /*
          **Sans cette ligne, la clé serait écrite puis jetée à la relecture.**

          `modules` est un `z.object` simple — pas `.passthrough()` comme les
          schémas au-dessus — et Zod retire les clés qu'il ne nomme pas. La
          sauvegarde aurait donc emporté les atmosphères, et le chargement les
          aurait supprimées sans un mot : le défaut idéal, invisible partout
          sauf le jour où l'on a besoin de la sauvegarde.
        */
        music: z.object({ playlists: z.array(z.any()) }).optional(),
    }).default({}),
}).passthrough();

export type FullSession = z.infer<typeof FullSessionSchema>;

/** Les chemins fautifs, condensés pour tenir dans un message lisible. */
function cheminsFautifs(erreur: z.ZodError, maximum = 3): string {
    const chemins = erreur.issues
        .map(souci => souci.path.join('.') || '(racine)')
        .filter((chemin, rang, tous) => tous.indexOf(chemin) === rang);
    const montres = chemins.slice(0, maximum).join(', ');
    const reste = chemins.length - maximum;
    return reste > 0 ? `${montres} et ${reste} autre${reste > 1 ? 's' : ''}` : montres;
}

/**
 * Rend la sauvegarde relue, **ou refuse de la rendre**.
 *
 * **Le défaut corrigé le 2026-08-21.** Sur échec, cette fonction rendait
 * `FullSessionSchema.parse({})` — une session vide, parfaitement valide. Le
 * chargement distribuait donc du néant, remettait le thème à `cyberpunk` et le
 * module actif à `dashboard`, puis `SessionService` annonçait « Session chargée
 * et vérifiée 📂 ». *Le geste qui rassure n'est pas le geste qui vérifie* :
 * troisième occurrence du même motif en deux jours, après le résumé annoncé sur
 * un résumé inexistant et l'Oracle qui recevait le début sous l'intitulé de la
 * fin.
 *
 * **Ce qui arrive vraiment dans ce `else`.** Le schéma est `.passthrough()` et
 * presque tout y est facultatif : ce qui échoue n'est pas une sauvegarde un peu
 * datée, c'est une sauvegarde dont un champ REQUIS est cassé — une campagne sans
 * `system`, un joueur sans `realName`. Autrement dit, **une campagne malformée
 * faisait jeter le fichier entier**, en silence.
 *
 * **On lève plutôt qu'on ne répare, parce qu'il n'y a rien à réparer.** Zod a
 * déjà comblé, par ses défauts et son `passthrough`, tout ce qui était
 * comblable ; ce qui reste est un fichier qu'on ne sait pas lire. L'appelant a
 * un `catch` qui dit l'erreur et n'écrit rien — c'est exactement le
 * comportement voulu, et il vaut mieux qu'un chargement qui prétend avoir eu
 * lieu. **Rien n'est distribué : l'état en mémoire reste celui d'avant.**
 *
 * Reste ouverte la question du soin par champ — écarter la seule campagne
 * fautive et garder le reste. C'est un autre geste, et il demande de savoir dire
 * ce qu'on a écarté ; le taire serait retomber dans le défaut d'ici.
 */
export function validateSession(data: unknown): FullSession {
    const result = FullSessionSchema.safeParse(data);
    if (result.success) return result.data;

    console.warn('[Validation] Sauvegarde illisible :', result.error.format());
    throw new Error(
        `Sauvegarde illisible — ${cheminsFautifs(result.error)}. Rien n'a été chargé, `
        + "l'état en cours est intact.",
    );
}
