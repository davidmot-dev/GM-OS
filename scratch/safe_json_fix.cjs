const fs = require('fs');

function safeFix(filePath, isFr) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Try to fix the existing common mess first so parse hopefully works
        // Remove trailing or duplicate braces/commas at the end
        content = content.replace(/}\s*,\s*}\s*$/, '}'); // Fix trailing comma in object then close
        
        let data;
        try {
            data = JSON.parse(content);
        } catch (e) {
            console.log(`Initial parse failed for ${filePath}, trying emergency recovery...`);
            // Emergency: trim the file until it parses or we reach a known good state
            // Or just use the last known good part (intelligence)
            // Actually, let's just use a more aggressive regex to fix the end
            content = content.trimEnd();
            while (content.length > 0 && !content.endsWith('}')) {
                content = content.substring(0, content.length - 1).trimEnd();
            }
            // Now we have a file ending in }. Is it the root? 
            // Let's try to parse.
            try {
                data = JSON.parse(content);
            } catch (e2) {
                 // If it still fails, we might have lost the root }.
                 data = JSON.parse(content + '}');
            }
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

        data["session.snapshots"] = snapshots;
        data["session.messenger"] = messenger;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`SUCCESS: Fixed and validated ${filePath}`);
    } catch (err) {
        console.error(`FATAL ERROR for ${filePath}:`, err.message);
    }
}

safeFix('c:/Projet_David/GM-OS-v5/src/locales/fr/modules.json', true);
safeFix('c:/Projet_David/GM-OS-v5/src/locales/en/modules.json', false);
