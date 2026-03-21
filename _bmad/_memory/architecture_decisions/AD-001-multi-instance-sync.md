---
stepsCompleted: ['discovery', 'analysis']
inputDocuments: ['Development_Roadmap.md', 'improvement.md']
workflowType: 'architecture'
project_name: 'GM-OS v5'
user_name: 'David'
date: '2026-03-21'
---

# Architecture Decision: AD-001 - Multi-Instance Sync & Client Identification

## Context
As part of the GM-OS v5 evolution, we need to allow multiple devices (tablets, smartphones) to connect simultaneously to the local server. Each device should be able to display filtered views (e.g., specific player stats, combat monitor, narrative clock).

## Decision
We will implement a hybrid approach combining **Contextual QR-Codes (URL parameters)** and **Persistent Local Identification (UUID)**.

### 1. URL-Based Role Identification
The URL scanned via QR-code will contain parameters defining the target view:
- `?view=combat`: Directs to the initiative and health tracker.
- `?view=clock`: Directs to the narrative clock and tension gauges.
- `?player=[PLAYER_ID]`: Directs to a specific player's character sheet.

### 2. Client-Side Announcement
Upon connection, the Tablet Hub component will send a `REGISTER_CONTEXT` message to the WebSocket server containing:
- `role`: The view type extracted from the URL.
- `deviceId`: A persistent UUID stored in `localStorage`.
- `clientLabel`: A human-readable label (e.g., "iPad de Salon").

### 3. Server-Side Filtering (Delta Targeted Sync)
The Master PC (`App.tsx` and WebSocket server) will:
- Track the role of each socket connection.
- Filter the `SyncPayload` to only broadcast relevant segments to specific subscribers.
- Optionally allow the MJ to overwrite or assign roles to devices from the "Remote Management" UI.

## Added Decisions (from Party Mode Discussion)

### 4. Player Freedom & Onboarding
Players have total freedom to choose their pseudonyms upon connection. This name is stored in `localStorage` and synchronized with the MJ's Lobby to reduce management overhead for the GM.

### 5. Reconnection & Inter-Device Migration
- **Grace Period (15s)**: The session remains active during brief Wi-Fi drops.
- **Ghost State (Up to 2 min)**: The MJ is notified that a player is "ghosted" (disconnected but recoverable).
- **Session Takeover**: Players can resume their character context on a different device (e.g., tablet failure -> smartphone switch) subject to MJ approval in the Lobby.

### 6. Discreet Themed UI
To maintain focus and immersion at the table, visual effects on the Hub will be:
- **Discreet**: Simple light pulses or borders transitions.
- **Themed**: Restricted to the accent colors of the MJ's chosen theme.
- **Non-Distractive**: No violent flashes or complex 3D scenes for notifications.

## Consequences
- **Positive**: Reduced bandwidth usage, tailored UX for different roles, MJ control, and high resilience to hardware/network failures.
- **Negative**: Adds state management complexity on the server side to track per-client interests and takeover requests.
- **Neutral**: Requires persistent storage on the client side for device naming.

## Proposed Implementation Steps
1. Extend `SyncPayload` to support modular segments.
2. Add a `registration` handshake in the WebSocket listener.
3. Update `GlobalSettingsModal` to generate role-specific QR-codes.
