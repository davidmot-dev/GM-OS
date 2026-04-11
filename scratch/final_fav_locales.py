import json
import os

def update_json(filepath, updates):
    if not os.path.exists(filepath):
        print(f"File {filepath} not found.")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    def deep_update(d, u):
        for k, v in u.items():
            if isinstance(v, dict):
                d[k] = deep_update(d.get(k, {}), v)
            else:
                d[k] = v
        return d

    data = deep_update(data, updates)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Updated {filepath}")

# Updates for FR
fr_updates = {
    "favorite": {
        "categories": {
            "npc": "PNJs",
            "place": "Lieux",
            "item": "Objets",
            "lore": "Lore"
        },
        "grid": {
            "no_results_sub": "Essayez d'ajuster vos filtres ou votre recherche."
        },
        "actions": {
            "sent_to_map": "envoyé sur la Carte !"
        }
    }
}

# Updates for EN
en_updates = {
    "favorite": {
        "categories": {
            "npc": "NPCs",
            "place": "Places",
            "item": "Items",
            "lore": "Lore"
        },
        "grid": {
            "no_results_sub": "Try adjusting your filters or search query."
        },
        "actions": {
            "sent_to_map": "sent to Map!"
        }
    }
}

update_json('src/locales/fr/modules.json', fr_updates)
update_json('src/locales/en/modules.json', en_updates)
