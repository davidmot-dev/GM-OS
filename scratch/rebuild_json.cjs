const fs = require('fs');

function rebuild(path, isFr) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Find the last known good key
    const needle = '"gem_prompt_placeholder": "Prompt override for {{name}}..."';
    const index = content.indexOf(needle);
    
    if (index === -1) {
        console.error(`Could not find needle in ${path}`);
        return;
    }
    
    // Keep everything up to the end of the needle
    let newContent = content.substring(0, index + needle.length);
    
    // Close the objects correctly
    newContent += '\n    }\n  },\n';
    
    // Add the new sections
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

    newContent += `  "session.snapshots": ${JSON.stringify(snapshots, null, 2)},\n`;
    newContent += `  "session.messenger": ${JSON.stringify(messenger, null, 2)}\n`;
    newContent += `}\n`;

    fs.writeFileSync(path, newContent, 'utf8');
    console.log(`Rebuilt ${path}`);
}

rebuild('c:/Projet_David/GM-OS-v5/src/locales/fr/modules.json', true);
rebuild('c:/Projet_David/GM-OS-v5/src/locales/en/modules.json', false);
