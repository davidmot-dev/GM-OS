import json
import os

def update_locales():
    locales_dir = r"c:\Projet_David\GM-OS-v5\src\locales"
    
    # Define new keys
    new_keys = {
        "attributes": {
            "FIRSTNAMES": {"en": "First Names", "fr": "Prénoms"},
            "LASTNAMES": {"en": "Last Names", "fr": "Noms"},
            "JOBS": {"en": "Jobs", "fr": "Métiers"},
            "LOOKS": {"en": "Looks", "fr": "Apparences"},
            "TRAITS": {"en": "Traits", "fr": "Traits"},
            "SECRETS": {"en": "Secrets", "fr": "Secrets"},
            "AFFINITIES": {"en": "Affinities", "fr": "Affinités"},
            "AFFINITY": {"en": "Affinity", "fr": "Affinité"},
            "LOCATIONS": {"en": "Locations", "fr": "Lieux"},
            "DANGERS": {"en": "Dangers", "fr": "Dangers"},
            "FACTIONS": {"en": "Factions", "fr": "Factions"},
            "HOOKS": {"en": "Hooks", "fr": "Accroches"},
            "ITEMS": {"en": "Items", "fr": "Objets"},
            "LEGENDARY": {"en": "Legendary", "fr": "Légendaire"},
            "RARITY": {"en": "Rarity", "fr": "Rareté"},
            "PROPS": {"en": "Props", "fr": "Accessoires"},
            "VULNERABILITIES": {"en": "Vulnerabilities", "fr": "Vulnérabilités"},
            "RESISTANCES": {"en": "Resistances", "fr": "Résistances"},
            "NOTES": {"en": "Notes", "fr": "Notes"},
            "EQUIPMENT": {"en": "Equipment", "fr": "Équipement"}
        },
        "media": {
            "portrait_label": {"en": "Portrait (URL or Media)", "fr": "Portrait (URL ou Média)"},
            "token_label": {"en": "Token (URL or Media)", "fr": "Token (URL ou Média)"},
            "browse_hub": {"en": "Browse Media Hub", "fr": "Parcourir le Media Hub"}
        },
        "oracle": {
            "title": {"en": "Oracle", "fr": "Oracle"},
            "card_view": {"en": "Card View", "fr": "Vue Carte"},
            "theater_view": {"en": "Theater View (Expand)", "fr": "Vue Théâtre (Agrandir)"}
        }
    }

    for lang in ["en", "fr"]:
        file_path = os.path.join(locales_dir, lang, "modules.json")
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        favorite = data.get("favorite", {})
        
        # Add attributes
        fav_attrs = favorite.get("attributes", {})
        for key, vals in new_keys["attributes"].items():
            fav_attrs[key] = vals[lang]
        favorite["attributes"] = fav_attrs
        
        # Add media
        fav_media = favorite.get("media", {})
        for key, vals in new_keys["media"].items():
            fav_media[key] = vals[lang]
        favorite["media"] = fav_media
        
        # Add oracle
        fav_oracle = favorite.get("oracle", {})
        for key, vals in new_keys["oracle"].items():
            fav_oracle[key] = vals[lang]
        favorite["oracle"] = fav_oracle
        
        # Sync with "actions" for specifically localized toasts if needed
        # (Though we can just use detail.theater_active)
        
        data["favorite"] = favorite
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {file_path}")

if __name__ == "__main__":
    update_locales()
