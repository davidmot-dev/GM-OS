# 📖 Guide de la Tactical Taxonomy

Ce guide récapitule les correspondances entre les mots-clés détectés par l'IA et les effets déclenchés (LEDs, audio, intensité).

## Éléments & Dégâts
| Mots-clés | Tags | Lumière | Son | Intensité |
| :--- | :--- | :--- | :--- | :--- |
| feu, flamme, brûle | `fire`, `damage` | 🔥 Rouge (#FF3300) | Crackling Fire | 0.8 |
| froid, glace, gel | `ice`, `slow` | 🧊 Bleu Nuit (#000080) | Ice Shatter | 0.5 |
| foudre, éclair | `lightning`, `shock` | ⚡ Blanc (#FFFFFF) | Thunder Crack | 1.0 |
| poison, venin | `acid`, `debuff` | 🧪 Vert (#00FF00) | Proximity Alarm | 0.7 |

## Soins & Bénédictions
| Mots-clés | Tags | Lumière | Son | Intensité |
| :--- | :--- | :--- | :--- | :--- |
| soin, guérit | `heal`, `holy` | ✨ Cyan (#00FFFF) | Divine Chime | 0.6 |
| béni, bénédiction | `status`, `holy` | ☀️ Or (#FFD700) | Divine Chime | 0.7 |

## États de Combat
| Mots-clés | Tags | Lumière | Son | Intensité |
| :--- | :--- | :--- | :--- | :--- |
| étourdi, stun | `status`, `disorient` | 💫 Magenta (#FF00FF) | Target Lock | 0.9 |
| à terre, chute | `status`, `prone` | 🟫 Brun (#8B4513) | - | 0.6 |
| concentration, focus | `status`, `buff` | 🟣 Violet (#800080) | - | 0.5 |
| invisible, caché | `status`, `stealth` | 🟡 Jaune Pale (#E1EE7C) | - | 0.3 |
| maudit, malédiction | `status`, `curse` | 🔴 Rouge Sombre (#FF0000) | - | 0.8 |

## Portées Tactiques (Automatique)
| Mots-clés | Tags | Lumière | Son | Intensité |
| :--- | :--- | :--- | :--- | :--- |
| contact, engagé | `range`, `danger` | ⚠️ Rouge (#FF0000) | Proximity Alarm | 0.8 |
| courte, proche | `range`, `engagement`| 🟢 Vert (#00FF00) | Target Lock | 0.6 |
| moyenne | `range`, `medium` | 🔵 Bleu (#0000FF) | - | 0.4 |

> [!NOTE]
> L'intensité influe sur le "pulse" de l'interface et la luminosité des LEDs. La priorité de la lumière (1 = haute, 2 = normale) détermine quel effet prend le dessus si plusieurs sont actifs.
