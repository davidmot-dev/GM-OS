import type { GameSession } from '../store/types';

/**
 * Ensures that all arrays within a session object contain unique values.
 * Specifically targets sessionEntityIds and checklist item IDs.
 */
export const sanitizeSession = (session: GameSession): GameSession => {
    let hasChanges = false;

    // 1. Sanitize Entity IDs
    let uniqueEntityIds = session.sessionEntityIds || [];
    if (uniqueEntityIds.length > 0) {
        const asSet = new Set(uniqueEntityIds);
        if (asSet.size !== uniqueEntityIds.length) {
            uniqueEntityIds = Array.from(asSet);
            hasChanges = true;
        }
    }

    // 2. Sanitize Checklist (ensure unique IDs for items, though less likely to conflict)
    let sanitizedChecklist = session.checklist || [];
    if (sanitizedChecklist.length > 0) {
        const checklistIds = new Set<string>();
        const filtered = sanitizedChecklist.filter(item => {
            if (checklistIds.has(item.id)) return false;
            checklistIds.add(item.id);
            return true;
        });
        if (filtered.length !== sanitizedChecklist.length) {
            sanitizedChecklist = filtered;
            hasChanges = true;
        }
    }

    if (!hasChanges) {
        return session;
    }

    return {
        ...session,
        sessionEntityIds: uniqueEntityIds,
        checklist: sanitizedChecklist
    };
};

/**
 * Sanitize a list of sessions.
 */
export const sanitizeSessions = (sessions: GameSession[]): GameSession[] => {
    return sessions.map(sanitizeSession);
};
