
// Verification Script for Music OS Tile Snapshots
async function verifyMusicSnapshot() {
    const musicStore = window.useMusicStore;
    const sessionStore = window.useSessionOSStore;
    
    if (!musicStore || !sessionStore) {
        console.error("Stores not found on window object");
        return;
    }

    console.log("--- Starting Music OS Tile Snapshot Verification ---");

    // 1. Modify Music OS pads
    const playlistId = 'default';
    const originalLabel = musicStore.getState().playlists[0].pads[0].label;
    const testLabel = "Test Snapshot Label " + Date.now();
    const testUrl = "http://example.com/test.mp3";
    
    console.log(`Setting Pad 0 label to: ${testLabel}`);
    musicStore.getState().updatePad(playlistId, 0, { label: testLabel, url: testUrl });

    // 2. Take a snapshot
    const activeSessionId = sessionStore.getState().sessions[0].id;
    console.log(`Taking snapshot for session: ${activeSessionId}`);
    sessionStore.getState().saveSystemSnapshot(activeSessionId);

    // 3. Verify snapshot data
    const session = sessionStore.getState().sessions.find(s => s.id === activeSessionId);
    const snapshotMusic = session?.moduleSnapshot?.music;
    
    if (snapshotMusic?.playlists?.[0].pads[0].label === testLabel) {
        console.log("✅ Snapshot correctly captured the modified pad label.");
    } else {
        console.error("❌ Snapshot FAILED to capture the modified pad label.");
        console.log("Captured:", snapshotMusic?.playlists?.[0].pads[0].label);
        return;
    }

    // 4. Reset Music OS
    console.log("Resetting Music OS...");
    musicStore.getState().reset();
    
    if (musicStore.getState().playlists[0].pads[0].label === originalLabel || musicStore.getState().playlists[0].pads[0].label.startsWith("Pad")) {
        console.log("Music OS reset successfully.");
    }

    // 5. Restore snapshot
    console.log("Restoring snapshot...");
    await sessionStore.getState().applySystemSnapshot(session.moduleSnapshot);

    // 6. Final verification
    const restoredLabel = musicStore.getState().playlists[0].pads[0].label;
    const restoredUrl = musicStore.getState().playlists[0].pads[0].url;

    if (restoredLabel === testLabel && restoredUrl === testUrl) {
        console.log("✅ Snapshot correctly restored the modified pad label and URL.");
        console.log("RESTORE SUCCESSFUL");
    } else {
        console.error("❌ Snapshot FAILED to restore the modified pad label or URL.");
        console.log("Expected label:", testLabel, "Got:", restoredLabel);
        console.log("Expected URL:", testUrl, "Got:", restoredUrl);
    }
}

verifyMusicSnapshot();
