/**
 * Nexus-OS Bridge — IPC Handlers (Main Process)
 *
 * Gère toutes les opérations fichier système pour le module Nexus-OS :
 * - Export d'une campagne en bundle .gmos (ZIP)
 * - Import d'un bundle .gmos
 * - Sélection de fichiers via les dialogues natifs
 *
 * Architecture :
 * - Utilise `archiver` pour la création de l'archive (streaming, memory-efficient)
 * - Utilise `adm-zip` pour la lecture/extraction de l'archive
 * - Hash SHA-256 via le module natif `crypto` (pas de dépendance externe)
 * - Sécurité : sanitisation des chemins entrants, validation du manifeste
 *
 * Pattern : Identique à `obsidian_bridge.ts` — export d'une fonction `register...()`
 *
 * @module electron/nexus_bridge
 */

import { ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';
import crypto from 'node:crypto';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import { createWriteStream } from 'node:fs';

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const NEXUS_EXTENSION = '.gmos';
const SCHEMA_VERSION = 1;

/** Types d'assets reconnus comme "Media Hub IDs" (format m-xxx) */
const MEDIA_HUB_ID_PATTERN = /^m-\d+/;

// ─────────────────────────────────────────────
// INTERFACES LOCALES (sous-ensemble de nexus.types.ts côté renderer)
// Note: on ne peut pas importer les types du renderer ici.
// ─────────────────────────────────────────────

interface AssetEntry {
    originalRef: string;
    relativePath: string;
    checksum: string;
    sizeBytes: number;
    mimeType: string;
}

interface NexusManifestFull {
    schemaVersion: number;
    bundleId: string;
    campaignId: string;
    campaignName: string;
    exportedAt: string;
    gmosVersion: string;
    requiredDriverIds: string[];
    requiredTemplateIds: string[];
    assetMap: AssetEntry[];
    assetRefList?: string[];
    stats: {
        entityCount: number;
        sessionCount: number;
        atlasMapCount: number;
        wikiEntryCount: number;
        clueCount: number;
        assetCount: number;
        totalSizeBytes: number;
    };
}

interface ExportResult {
    success: boolean;
    outputPath?: string;
    manifest?: NexusManifestFull;
    missingAssets: string[];
    error?: string;
}

interface ImportRaw {
    success: boolean;
    manifestJson?: string;
    stateJson?: string;
    assetData?: Record<string, string>;
    /** Atmosphères SoundBoard extraites du state.json (pour restauration côté renderer) */
    atmospheresJson?: string;
    /** Playlists musicales extraites du state.json (pour restauration côté renderer) */
    playlistsJson?: string;
    error?: string;
}

// ─────────────────────────────────────────────
// CACHE MÉMOIRE ASSETS (stratégie streaming)
// Les assets Media Hub sont reçus un par un via nexus:register-asset
// et lus ici lors du nexus:export-bundle, évitant les limites de taille IPC.
// ─────────────────────────────────────────────
const pendingAssetCache = new Map<string, string>(); // mediaHubId -> base64 data URL

// ─────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────

/**
 * Calcule le hash SHA-256 d'un fichier.
 */
async function computeFileChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * Infère le type MIME d'un fichier à partir de son extension.
 */
function inferMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const mimeMap: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        mp4: 'video/mp4',
        webm: 'video/webm',
        mp3: 'audio/mpeg',
        ogg: 'audio/ogg',
        wav: 'audio/wav',
        json: 'application/json',
    };
    return mimeMap[ext] ?? 'application/octet-stream';
}

/**
 * Détermine le dossier de destination dans l'archive pour un asset.
 */
function getAssetFolder(ref: string): string {
    const ext = path.extname(ref).toLowerCase().slice(1);
    const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
    const videoExts = ['mp4', 'webm', 'mov'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

    if (ref.includes('avatar') || ref.includes('portrait') || ref.includes('token') || MEDIA_HUB_ID_PATTERN.test(ref)) {
        return 'assets/profiles';
    }
    if (audioExts.includes(ext)) return 'assets/audio';
    if (videoExts.includes(ext)) return 'assets/maps';
    if (imageExts.includes(ext)) return 'assets/maps';
    return 'assets/misc';
}

/**
 * Protection contre les path traversal attacks.
 * - Rejette les chemins contenant `../` ou `..\`
 * - Rejette les chemins absolus (sauf lors de la résolution native)
 */
function isDangerousRelativePath(p: string): boolean {
    if (!p || typeof p !== 'string') return true;
    return /\.\.[\\/]/.test(p) || /^[A-Za-z]:[\\/]/.test(p) || p.startsWith('/');
}

/**
 * Résout un "asset ref" (ID Media Hub ou chemin) en un chemin absolu sur le FS.
 * Les Media Hub IDs (m-xxx) sont stockés dans IndexedDB côté renderer, 
 * on ne peut pas les résoudre directement ici.
 * 
 * IMPORTANT : Les IDs `m-xxx` sont résolus côté renderer avant l'appel IPC.
 * Le bridge ne reçoit que des chemins absolus valides ou des refs rejetables.
 */
function isResolvedFilePath(ref: string): boolean {
    return path.isAbsolute(ref) && !MEDIA_HUB_ID_PATTERN.test(ref);
}

// ─────────────────────────────────────────────
// EXPORT BUNDLE
// ─────────────────────────────────────────────

/**
 * Exporte une campagne dans un fichier .gmos.
 *
 * @param campaignId - ID de la campagne
 * @param outputPath - Chemin de destination du .gmos
 * @param stateJson - Données de campagne sérialisées
 * @param manifestJson - Manifeste partiel (sans assetMap final)
 * @param assetRefs - Références d'assets (chemins absolus uniquement, les m-xxx sont dans inlineAssets)
 * @param inlineAssets - Media Hub IDs pré-résolus en base64 data URLs par le renderer
 */
async function handleExportBundle(
    campaignId: string,
    outputPath: string,
    stateJson: string,
    manifestJson: string,
    assetRefs: string[]
): Promise<ExportResult> {
    console.log(`[Nexus Bridge] Export démarré : ${campaignId} → ${outputPath}`);
    
    // Lire les assets depuis le cache mémoire (rempli par nexus:register-asset)
    const inlineAssetsCount = pendingAssetCache.size;
    console.log(`[Nexus Bridge] ${inlineAssetsCount} asset(s) en cache mémoire prêts à archiver.`);

    const missingAssets: string[] = [];
    const assetMap: AssetEntry[] = [];
    let totalSizeBytes = 0;

    try {
        const partialManifest = JSON.parse(manifestJson) as Partial<NexusManifestFull>;

        // Créer un dossier temporaire pour préparer le bundle
        const tempDir = path.join(path.dirname(outputPath), `.nexus-tmp-${Date.now()}`);
        await fs.ensureDir(tempDir);

        try {
            // ── Phase 1 : Moissonnage des assets ────────────────────────────
            for (const ref of assetRefs) {
                // Les IDs Media Hub (m-xxx) ne sont pas résolvables ici
                // Ils seront ignorés avec un avertissement
                if (!isResolvedFilePath(ref)) {
                    console.warn(`[Nexus Bridge] Ref non-résolvable ignorée (Media Hub ID ou chemin non-absolu) : ${ref}`);
                    missingAssets.push(ref);
                    continue;
                }

                if (!(await fs.pathExists(ref))) {
                    console.warn(`[Nexus Bridge] Fichier introuvable : ${ref}`);
                    missingAssets.push(ref);
                    continue;
                }

                // Déterminer la destination dans l'archive
                const fileName = path.basename(ref);
                const destFolder = getAssetFolder(ref);
                const relativePath = `${destFolder}/${fileName}`;

                // Vérifier les doublons de nom
                const existingPaths = assetMap.map(a => a.relativePath);
                let finalRelativePath = relativePath;
                if (existingPaths.includes(relativePath)) {
                    const ext = path.extname(fileName);
                    const base = path.basename(fileName, ext);
                    finalRelativePath = `${destFolder}/${base}-${Date.now()}${ext}`;
                }

                // Copier dans le dossier temporaire
                const destPath = path.join(tempDir, finalRelativePath);
                await fs.ensureDir(path.dirname(destPath));
                await fs.copyFile(ref, destPath);

                // Calculer le checksum
                const checksum = await computeFileChecksum(ref);
                const stat = await fs.stat(ref);
                totalSizeBytes += stat.size;

                assetMap.push({
                    originalRef: ref,
                    relativePath: finalRelativePath,
                    checksum,
                    sizeBytes: stat.size,
                    mimeType: inferMimeType(ref),
                });
            }

            // ── Phase 1b : Traitement des inline assets (depuis le cache mémoire) ─────────
            const inlineCount = pendingAssetCache.size;
            if (inlineCount > 0) {
                console.log(`[Nexus Bridge] Traitement de ${inlineCount} inline assets (depuis cache)...`);
            }
            for (const [mediaHubId, dataUrl] of pendingAssetCache.entries()) {
                try {
                    // Parser le data URL : "data:<mime>;base64,<data>"
                    const matchResult = (dataUrl as string).match(/^data:([^;]+);base64,(.+)$/);
                    if (!matchResult) {
                        console.warn(`[Nexus Bridge] Data URL invalide pour ${mediaHubId}, ignoré.`);
                        missingAssets.push(mediaHubId);
                        continue;
                    }
                    const [, mime, base64Data] = matchResult;
                    const buffer = Buffer.from(base64Data, 'base64');

                    // Déterminer l'extension depuis le MIME type
                    const mimeToExt: Record<string, string> = {
                        'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
                        'image/gif': 'gif', 'image/svg+xml': 'svg',
                        'video/mp4': 'mp4', 'video/webm': 'webm',
                        'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav',
                    };
                    const ext = mimeToExt[mime] ?? 'bin';
                    const fileName = `${mediaHubId}.${ext}`;
                    const relativePath = `assets/profiles/${fileName}`;

                    // Écrire le fichier dans le dossier temporaire
                    const destPath = path.join(tempDir, relativePath);
                    await fs.ensureDir(path.dirname(destPath));
                    await fs.writeFile(destPath, buffer);

                    // Calculer le checksum depuis le buffer
                    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
                    totalSizeBytes += buffer.length;

                    assetMap.push({
                        originalRef: mediaHubId,
                        relativePath,
                        checksum,
                        sizeBytes: buffer.length,
                        mimeType: mime,
                    });

                    console.log(`[Nexus Bridge] Inline asset écrit : ${relativePath} (${buffer.length} octets)`);
                } catch (err) {
                    console.error(`[Nexus Bridge] Erreur traitement inline asset ${mediaHubId} :`, err);
                    missingAssets.push(mediaHubId);
                }
            }

            // Vider le cache après l'archivage (libérer la mémoire)
            pendingAssetCache.clear();

            // ── Phase 2 : Finalisation du manifeste ─────────────────────────
            const campaignStateObj = JSON.parse(stateJson);
            const finalManifest: NexusManifestFull = {
                schemaVersion: SCHEMA_VERSION,
                bundleId: partialManifest.bundleId ?? `nexus-${Date.now()}`,
                campaignId,
                campaignName: partialManifest.campaignName ?? campaignId,
                exportedAt: partialManifest.exportedAt ?? new Date().toISOString(),
                gmosVersion: partialManifest.gmosVersion ?? '5.3.0',
                requiredDriverIds: partialManifest.requiredDriverIds ?? [],
                requiredTemplateIds: partialManifest.requiredTemplateIds ?? [],
                assetMap,
                stats: {
                    entityCount: campaignStateObj?.entities?.length ?? 0,
                    sessionCount: campaignStateObj?.sessions?.length ?? 0,
                    atlasMapCount: campaignStateObj?.atlasMaps?.length ?? 0,
                    wikiEntryCount: campaignStateObj?.wikiEntries?.length ?? 0,
                    clueCount: campaignStateObj?.clues?.length ?? 0,
                    assetCount: assetMap.length,
                    totalSizeBytes,
                },
            };

            // Écrire les fichiers JSON dans le dossier temporaire
            await fs.writeFile(path.join(tempDir, 'manifest.json'), JSON.stringify(finalManifest, null, 2), 'utf-8');
            await fs.writeFile(path.join(tempDir, 'state.json'), stateJson, 'utf-8');

            // ── Phase 3 : Compression ZIP ────────────────────────────────────
            const finalOutputPath = outputPath.endsWith(NEXUS_EXTENSION)
                ? outputPath
                : `${outputPath}${NEXUS_EXTENSION}`;

            await createZipBundle(tempDir, finalOutputPath);

            console.log(`[Nexus Bridge] Export terminé : ${finalOutputPath} (${assetMap.length} assets, ${missingAssets.length} manquants)`);

            return {
                success: true,
                outputPath: finalOutputPath,
                manifest: finalManifest,
                missingAssets,
            };
        } finally {
            // Nettoyage du dossier temporaire
            await fs.remove(tempDir).catch((e) => console.warn('[Nexus Bridge] Cleanup failed:', e));
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[Nexus Bridge] Export échoué:', err);
        return { success: false, missingAssets, error: message };
    }
}

/**
 * Crée un fichier ZIP à partir d'un dossier source.
 * Utilise archiver en mode streaming pour supporter les bundles volumineux.
 */
async function createZipBundle(sourceDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: 6 }, // Compression équilibrée (vitesse/taille)
        });

        output.on('close', () => {
            console.log(`[Nexus Bridge] Archive créée : ${archive.pointer()} octets`);
            resolve();
        });

        archive.on('error', (err) => {
            console.error('[Nexus Bridge] Erreur archiver:', err);
            reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceDir, false); // false = pas de dossier racine dans le zip
        archive.finalize();
    });
}

// ─────────────────────────────────────────────
// IMPORT BUNDLE
// ─────────────────────────────────────────────

/**
 * Importe un bundle .gmos.
 * Extrait les fichiers JSON et convertit les assets en base64 data URLs.
 * La réinjection dans les stores est gérée côté renderer (NexusService.ts).
 */
async function handleImportBundle(filePath: string): Promise<ImportRaw> {
    console.log(`[Nexus Bridge] Import démarré : ${filePath}`);

    try {
        if (!(await fs.pathExists(filePath))) {
            return { success: false, error: `Fichier introuvable : ${filePath}` };
        }

        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();

        let manifestJson: string | undefined;
        let stateJson: string | undefined;
        const assetData: Record<string, string> = {};

        for (const entry of entries) {
            const entryName = entry.entryName;

            // Sécurité : ignorer les paths dangereux
            if (isDangerousRelativePath(entryName)) {
                console.warn(`[Nexus Bridge] Entrée ignorée (path dangereux) : ${entryName}`);
                continue;
            }

            if (entryName === 'manifest.json') {
                manifestJson = zip.readAsText(entry);
                continue;
            }

            if (entryName === 'state.json') {
                stateJson = zip.readAsText(entry);
                continue;
            }

            // Assets : convertir en base64 data URL
            if (entryName.startsWith('assets/')) {
                const buffer = zip.readFile(entry);
                if (!buffer) continue;

                const ext = path.extname(entryName).toLowerCase().slice(1);
                const mimeMap: Record<string, string> = {
                    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
                    webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
                    mp4: 'video/mp4', webm: 'video/webm',
                };
                const mime = mimeMap[ext] ?? 'application/octet-stream';
                const base64 = buffer.toString('base64');
                assetData[entryName] = `data:${mime};base64,${base64}`;
            }
        }

        if (!manifestJson || !stateJson) {
            return {
                success: false,
                error: 'Archive invalide : manifest.json ou state.json manquant.',
            };
        }

        // Validation rapide du schéma
        const manifest = JSON.parse(manifestJson) as Partial<NexusManifestFull>;
        if (manifest.schemaVersion !== SCHEMA_VERSION) {
            return {
                success: false,
                error: `Version de schéma incompatible : attendu ${SCHEMA_VERSION}, reçu ${manifest.schemaVersion}.`,
            };
        }

        // Extraire les données audio pour restauration immédiate côté renderer
        let atmospheresJson: string | undefined;
        let playlistsJson: string | undefined;
        try {
            const stateObj = JSON.parse(stateJson) as Record<string, unknown>;
            if (stateObj.atmospheres) atmospheresJson = JSON.stringify(stateObj.atmospheres);
            if (stateObj.playlists) playlistsJson = JSON.stringify(stateObj.playlists);
        } catch {
            console.warn('[Nexus Bridge] Impossible d\'extraire les données audio du state.json.');
        }

        console.log(`[Nexus Bridge] Import parsé : ${manifest.campaignName}, ${Object.keys(assetData).length} assets`);

        return {
            success: true,
            manifestJson,
            stateJson,
            assetData,
            atmospheresJson,
            playlistsJson,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[Nexus Bridge] Import échoué:', err);
        return { success: false, error: message };
    }
}

// ─────────────────────────────────────────────
// REGISTRE DES HANDLERS IPC
// ─────────────────────────────────────────────

export function registerNexusHandlers() {
    console.log('[Nexus Bridge] Registering IPC Handlers');

    // ── Streaming Asset Handlers (évite les limites IPC) ────────────────────────
    ipcMain.handle('nexus:register-asset', (_event, mediaHubId: string, dataUrl: string) => {
        if (!mediaHubId || !dataUrl) return { ok: false, error: 'Paramètres manquants.' };
        pendingAssetCache.set(mediaHubId, dataUrl);
        console.log(`[Nexus Bridge] Asset en cache : ${mediaHubId} (${Math.round(dataUrl.length / 1024)} Ko)`);
        return { ok: true };
    });

    ipcMain.handle('nexus:clear-assets', () => {
        const count = pendingAssetCache.size;
        pendingAssetCache.clear();
        console.log(`[Nexus Bridge] Cache vidé : ${count} asset(s).`);
        return { ok: true };
    });

    // ── Export Handler ────────────────────────────────────────────────────
    ipcMain.handle(
        'nexus:export-bundle',
        async (
            _event,
            campaignId: string,
            outputPath: string,
            stateJson: string,
            manifestJson: string,
            assetRefs: string[]
        ) => {
            return handleExportBundle(campaignId, outputPath, stateJson, manifestJson, assetRefs);
        }
    );

    // ── Import Handler ────────────────────────────────────────────────────
    ipcMain.handle('nexus:import-bundle', async (_event, filePath: string) => {
        return handleImportBundle(filePath);
    });

    // ── Sélecteur de chemin d'export ─────────────────────────────────────
    ipcMain.handle('nexus:select-export-path', async () => {
        const { filePath } = await dialog.showSaveDialog({
            title: 'Exporter la Campagne GM-OS',
            defaultPath: `campagne_gmos_${Date.now()}${NEXUS_EXTENSION}`,
            filters: [
                { name: 'GM-OS Bundle', extensions: ['gmos'] },
            ],
        });

        return filePath ?? null;
    });

    // ── Sélecteur de fichier d'import ─────────────────────────────────────
    ipcMain.handle('nexus:select-import-file', async () => {
        const { filePaths } = await dialog.showOpenDialog({
            title: 'Importer une Campagne GM-OS (.gmos)',
            filters: [
                { name: 'GM-OS Bundle', extensions: ['gmos'] },
            ],
            properties: ['openFile'],
        });

        return filePaths?.[0] ?? null;
    });
}
