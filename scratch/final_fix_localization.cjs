const fs = require('fs');

function fixFile(filePath, isFr) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Remove anything after the real JSON end
    // First, find the last valid } in the file
    content = content.trimEnd();
    
    // 2. Remove my mess around campaign_form
    // We want the end of the file to be correct.
    // Let's just find the clues_manager part and rebuild from there if needed?
    // No, let's just use regex to fix the junctions.
    
    // Repair junctions
    content = content.replace(/}\s*}\s*},\s*"session\.snapshots"/g, '  },\n  "session.snapshots"');
    content = content.replace(/}\s*}\s*"session\.snapshots"/g, '  },\n  "session.snapshots"');
    
    // Remove the extra root closing if exists before snapshots
    // (If snapshots was appended after the root was closed)
    content = content.replace(/}\s*,\s*"session\.snapshots"/g, '  ,\n  "session.snapshots"');

    // Remove snapshots and messenger if they already exist to re-add them clean
    content = content.replace(/,\s*"session\.snapshots"[\s\S]+$/, '');
    
    // Re-check ending
    content = content.trimEnd();
    if (content.endsWith('}')) {
        content = content.substring(0, content.lastIndexOf('}'));
    }
    content = content.trimEnd();
    if (content.endsWith('}')) {
        content = content.substring(0, content.lastIndexOf('}'));
    }
     content = content.trimEnd();
    if (content.endsWith('}')) {
        content = content.substring(0, content.lastIndexOf('}'));
    }
    
    // Now we should be inside the root object, after campaign_form or intelligence
    // Add a trailing comma if missing
    if (!content.trimEnd().endsWith(',')) {
        content += ',';
    }

    const snapshots = isFr ? {
        "title": "Instantané de Session",
        "combat_order": "Ordre d'Initiative",
        "round_hash": "ROUND #{{number}}",
        "others_count": "+ {{count}} autres",
        "no_active_encounter": "Aucune rencontre active",
        "audio_environment": "Environnement Sonore",
        "audio_silence": "Silence Digital",
        "audio_deck_label": "Deck {{deck}}",
        "audio_waiting": "En attente de flux...",
        "active_conditions": "Conditions Actives",
        "no_condition": "Aucune altération",
        "cards_destiny": "Destinée & Cartes",
        "manage": "Gérer",
        "start_engine": "Initialiser le Moteur",
        "quick_roll": "Lancement Rapide",
        "history": "Historique"
    } : {
        "title": "Session Snapshot",
        "combat_order": "Initiative Order",
        "round_hash": "ROUND #{{number}}",
        "others_count": "+ {{count}} others",
        "no_active_encounter": "No active encounter",
        "audio_environment": "Audio Environment",
        "audio_silence": "Digital Silence",
        "audio_deck_label": "Deck {{deck}}",
        "audio_waiting": "Waiting for stream...",
        "active_conditions": "Active Conditions",
        "no_condition": "No active conditions",
        "cards_destiny": "Destiny & Cards",
        "manage": "Manage",
        "start_engine": "Start Engine",
        "quick_roll": "Quick Roll",
        "history": "History"
    };

    const messenger = isFr ? {
        "title": "Centre de Liaison",
        "gm_label": "MAÎTRE DE JEU",
        "player_label": "Joueur",
        "all_players": "Tous les joueurs",
        "filter_all": "Tous (Canal Global)",
        "no_message": "Aucun message intercepté",
        "tooltip_save_journal": "Sauvegarder dans le Journal de Session",
        "write_to_all": "Écrire au canal global...",
        "write_to_recipient": "Message direct à {{recipient}}...",
        "tooltip_send": "Envoyer le message",
        "session_only": "SESSION SEULEMENT"
    } : {
        "title": "Messenger Hub",
        "gm_label": "GAME MASTER",
        "player_label": "Player",
        "all_players": "All players",
        "filter_all": "All (Global Channel)",
        "no_message": "No message intercepted",
        "tooltip_save_journal": "Save to Session Journal",
        "write_to_all": "Write to global channel...",
        "write_to_recipient": "Direct message to {{recipient}}...",
        "tooltip_send": "Send message",
        "session_only": "SESSION ONLY"
    };

    content += `\n  "session.snapshots": ${JSON.stringify(snapshots, null, 2).replace(/\n/g, '\n  ')},\n`;
    content += `  "session.messenger": ${JSON.stringify(messenger, null, 2).replace(/\n/g, '\n  ')}\n`;
    content += `}\n`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
}

fixFile('c:/Projet_David/GM-OS-v5/src/locales/fr/modules.json', true);
fixFile('c:/Projet_David/GM-OS-v5/src/locales/en/modules.json', false);
