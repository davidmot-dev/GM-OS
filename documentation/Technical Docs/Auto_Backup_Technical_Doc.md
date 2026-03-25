# Technical Documentation: Auto-Backup & GitHub Sync

## Overview
The Auto-Backup system provides a native way to synchronize campaign data (NPCs, sessions, settings, and campaigns) to a dedicated GitHub branch named `data-sync`. This ensures that user data is isolated from the codebase and can be easily restored or synchronized across different machines.

## Architecture

### 1. GitBackupService (Main Process)
- **Location**: `electron/GitBackupService.ts`
- **Responsibilities**:
    - Checking git availability and repository status.
    - Creating and switching to the `data-sync` branch.
    - Adding, committing, and pushing files to the remote repository.
    - Handling authentication/environment errors (e.g., SSH vs HTTPS).

### 2. IPC Gateway
- **Handlers**:
    - `git:status`: Returns git/repo availability.
    - `git:setup-branch`: Ensures the backup branch exists and is checked out.
    - `git:sync`: Performs Add -> Commit -> Push cycle.
    - `backup:save-data`: Serializes renderer state to `backups/*.json`.

### 3. useBackupSync Hook (Renderer)
- **Location**: `src/hooks/useBackupSync.ts`
- **Logic**:
    - **Trigger**: Runs every 15 minutes or via manual trigger.
    - **Aggregation**: Gathers state from Zustand stores (`useSessionStore`, `useNpcStore`, `useCampaignStore`, `useAudioMasterStore`).
    - **Orchestration**: Calls `saveData` then `syncData`.

## Data Schema
Files are stored in the `backups/` directory as JSON:
- `campaigns.json`: Full campaign list and active IDs.
- `npcs.json`: All NPCs and their categories.
- `session_settings.json`: OS-level settings (theme, aliases).
- `active_session.json`: Current session notes and metadata.
- `audio_master.json`: Master volume and focus mode states.

## Security Considerations
- The system assumes a configured local git environment (SSH keys or stored credentials).
- Errors are logged via the system logger but do not interrupt the app's main thread.
- Data synchronization is throttled to prevent excessive API calls to GitHub.
