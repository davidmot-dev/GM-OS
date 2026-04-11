import json
import os

def update_locale(file_path, new_fav_data):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if 'favorite' not in data:
        data['favorite'] = {}
    data['favorite'].update(new_fav_data)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

en_data = {
    'dashboard': {
        'title': 'Favorite Entities',
        'description': 'A curated collection of your most critical campaign elements.',
        'sort_by': 'Sort by',
        'recent': 'Recent'
    },
    'sidebar': {
        'filters': 'Library Filters',
        'new_entry': 'New Entry',
        'sync_status': 'Cloud Sync Status',
        'synced': 'Vault Synced',
        'categories': {
            'all': 'All Entities',
            'npc': 'NPCs',
            'place': 'Places',
            'item': 'Items',
            'lore': 'Lore'
        }
    },
    'topbar': {
        'search_placeholder': 'Search the Pantheon...',
        'export': 'Export'
    },
    'card': {
        'never_viewed': 'Never viewed',
        'just_now': 'Just now',
        'hours_ago': '{{count}}h ago',
        'days_ago': '{{count}}d ago',
        'last_viewed': 'Last viewed',
        'view_details': 'View Details',
        'remove': 'Remove from Favorites',
        'remove_confirm': 'Remove "{{name}}" from favorites?'
    },
    'detail': {
        'title_editing': 'Editing Dossier',
        'title_details': 'Details',
        'traits': 'Quick Traits',
        'gauges': 'Gauges & Stats',
        'lore': 'Background Lore',
        'no_lore': 'No lore recorded yet.',
        'send_combat': 'SEND TO COMBAT',
        'send_map': 'SEND TO MAP',
        'hub_sync': 'PLAYER HUB SYNC',
        'full_dossier': 'OPEN FULL DOSSIER'
    }
}

fr_data = {
    'dashboard': {
        'title': 'Entités Favorites',
        'description': 'Une collection de vos éléments de campagne les plus critiques.',
        'sort_by': 'Trier par',
        'recent': 'Récents'
    },
    'sidebar': {
        'filters': 'Filtres Bibliothèque',
        'new_entry': 'Nouvelle Entrée',
        'sync_status': 'État Synchro Cloud',
        'synced': 'Coffre Synchronisé',
        'categories': {
            'all': 'Toutes les Entités',
            'npc': 'PNJs',
            'place': 'Lieux',
            'item': 'Objets',
            'lore': 'Lore'
        }
    },
    'topbar': {
        'search_placeholder': 'Chercher dans le Panthéon...',
        'export': 'Exporter'
    },
    'card': {
        'never_viewed': 'Jamais consulté',
        'just_now': "À l'instant",
        'hours_ago': 'Il y a {{count}}h',
        'days_ago': 'Il y a {{count}}j',
        'last_viewed': 'Dernière vue',
        'view_details': 'Voir Détails',
        'remove': 'Retirer des Favoris',
        'remove_confirm': 'Supprimer "{{name}}" des favoris ?'
    },
    'detail': {
        'title_editing': 'Édition de Dossier',
        'title_details': 'Détails',
        'traits': 'Traits Rapides',
        'gauges': 'Jauges & Stats',
        'lore': 'Lore Perso / Background',
        'no_lore': 'Aucun lore enregistré pour le moment.',
        'send_combat': 'ENVOYER AU COMBAT',
        'send_map': 'ENVOYER SUR LA MAP',
        'hub_sync': 'SYNCHRO PLAYER HUB',
        'full_dossier': 'OUVRIR LE DOSSIER COMPLET'
    }
}

update_locale('src/locales/en/modules.json', en_data)
update_locale('src/locales/fr/modules.json', fr_data)
