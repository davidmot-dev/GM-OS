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
    timelineEvents: z.array(z.any()).optional().default([]),
    wikiEntries: z.array(z.any()).optional().default([]),
    atlasMaps: z.array(z.any()).optional().default([]),
}).passthrough();

// --- Global Structure ---
export const ThemeIDSchema = z.enum(['cyberpunk', 'medieval', 'modern', 'claire']);
export const ModuleIDSchema = z.enum(['dashboard', 'music', 'sound', 'ambient', 'combat', 'npc', 'clock', 'light', 'image', 'map', 'table', 'web', 'voice', 'favorite', 'debug', 'dice', 'whiteboard', 'obsidian', 'journal']);

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
    }).default({}),
}).passthrough();

export type FullSession = z.infer<typeof FullSessionSchema>;

/**
 * Validates session data and returns a cleaned version with defaults for missing/invalid fields.
 * This is the CORE of the "Auto-Healing" mechanism.
 */
export function validateSession(data: unknown): FullSession {
    const result = FullSessionSchema.safeParse(data);
    if (result.success) {
        return result.data;
    } else {
        console.warn('[Validation] Session data is partially invalid, applying defaults:', result.error.format());
        // Fallback to absolute defaults
        return FullSessionSchema.parse({}); 
    }
}
