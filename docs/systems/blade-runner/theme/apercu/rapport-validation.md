# Rapport du validateur GM-OS — thème « blade-runner »

Contrat GM-OS v1.7. **Verdict : ACCEPTÉ** — 0 erreur(s), 0 avertissement(s).

Les contrastes ci-dessous sont mesurés par GM-OS : lis-les, ne les recalcule pas.

## Contrastes (§ 6)

| Paire | Ratio | Minimum | Recommandé | Verdict |
| --- | --- | --- | --- | --- |
| `text` sur `bg` | 17.7 | 4.5 | 7 | bon |
| `text` sur `surface` | 16.66 | 4.5 | 7 | bon |
| `muted` sur `bg` | 6.24 | 3 | 4.5 | bon |
| `muted` sur `surface` | 5.88 | 3 | 4.5 | bon |
| `accent` sur `bg` | 6.75 | 3 | 4.5 | bon |
| `accent-contrast` sur `accent` | 6.59 | 4.5 | 7 | sous le recommandé |
| `success` sur `bg` | 10.94 | 3 | 4.5 | bon |
| `danger` sur `bg` | 5.62 | 3 | 4.5 | bon |
| `warning` sur `bg` | 10.35 | 3 | 4.5 | bon |
| `info` sur `bg` | 9.1 | 3 | 4.5 | bon |
| `text` sur `surface sous texture-panel` | 16.66 | 4.5 | 7 | bon |
| `muted` sur `surface sous texture-panel` | 5.88 | 3 | 4.5 | bon |

## Polarité (§ 3.5)

Déclarée : `dark` · attendue d'après `--rpg-bg` : `dark`.

## Ce que GM-OS fait des jetons déclarés

- **Appliqués aujourd'hui (LU)** : `bg`, `surface`, `text`, `muted`, `accent`, `border`, `font-display`, `font-mono`
- **Appliqués avec les personnalités (LU, v1.4)** — visibles quand le meneur les allume : `surface-2`, `accent-contrast`, `border-soft`, `font-body`, `radius-sm`, `radius-md`, `radius-lg`, `success`, `danger`, `warning`, `info`, `border-width`, `border-style`, `elevation-1`, `elevation-2`, `elevation-3`, `shadow`, `glow`, `glow-strength`, `glass-bg`, `glass-border`, `glass-blur`, `texture-bg`, `texture-panel`, `texture-opacity`, `title-tracking`, `kicker-tracking`
- **Annoncés (V2)** — sans effet visible aujourd'hui, et c'est normal : —
- **Sans effet dans GM-OS (SDK)** : `paper`, `ink`, `accent-2`, `font-ui`
