# Rapport du validateur GM-OS — thème « nephilim »

Contrat GM-OS v1.7. **Verdict : ACCEPTÉ** — 0 erreur(s), 0 avertissement(s).

Les contrastes ci-dessous sont mesurés par GM-OS : lis-les, ne les recalcule pas.

## Contrastes (§ 6)

| Paire | Ratio | Minimum | Recommandé | Verdict |
| --- | --- | --- | --- | --- |
| `text` sur `bg` | 11.14 | 4.5 | 7 | bon |
| `text` sur `surface` | 12.92 | 4.5 | 7 | bon |
| `muted` sur `bg` | 5.18 | 3 | 4.5 | bon |
| `muted` sur `surface` | 6.01 | 3 | 4.5 | bon |
| `accent` sur `bg` | 5.23 | 3 | 4.5 | bon |
| `accent-contrast` sur `accent` | 6.45 | 4.5 | 7 | sous le recommandé |
| `success` sur `bg` | 5.08 | 3 | 4.5 | bon |
| `danger` sur `bg` | 4.79 | 3 | 4.5 | bon |
| `warning` sur `bg` | 4.47 | 3 | 4.5 | sous le recommandé |
| `info` sur `bg` | 5.2 | 3 | 4.5 | bon |
| `frame-text` sur `frame-bg` | 12.05 | 4.5 | 7 | bon |
| `frame-accent` sur `frame-bg` | 7.8 | 3 | 4.5 | bon |
| `text` sur `bg sous texture-bg` | 9.92 | 4.5 | 7 | bon |
| `muted` sur `bg sous texture-bg` | 4.61 | 3 | 4.5 | bon |
| `accent` sur `bg sous texture-bg` | 4.65 | 3 | 4.5 | bon |
| `success` sur `bg sous texture-bg` | 4.52 | 3 | 4.5 | bon |
| `danger` sur `bg sous texture-bg` | 4.26 | 3 | 4.5 | sous le recommandé |
| `warning` sur `bg sous texture-bg` | 3.97 | 3 | 4.5 | sous le recommandé |
| `info` sur `bg sous texture-bg` | 4.63 | 3 | 4.5 | bon |
| `text` sur `surface sous texture-panel` | 11.46 | 4.5 | 7 | bon |
| `muted` sur `surface sous texture-panel` | 5.33 | 3 | 4.5 | bon |

## Polarité (§ 3.5)

Déclarée : `light` · attendue d'après `--rpg-bg` : `light`.

## Ce que GM-OS fait des jetons déclarés

- **Appliqués aujourd'hui (LU)** : `bg`, `surface`, `text`, `muted`, `accent`, `border`, `font-display`, `font-mono`
- **Appliqués avec les personnalités (LU, v1.4)** — visibles quand le meneur les allume : `surface-2`, `accent-contrast`, `border-soft`, `success`, `danger`, `warning`, `info`, `font-body`, `title-tracking`, `kicker-tracking`, `title-transform`, `radius-sm`, `radius-md`, `radius-lg`, `border-width`, `border-style`, `elevation-1`, `elevation-2`, `elevation-3`, `glow`, `glow-strength`, `glass-bg`, `glass-border`, `glass-blur`, `frame-bg`, `frame-text`, `frame-accent`, `texture-bg`, `texture-panel`, `texture-opacity`
- **Annoncés (V2)** — sans effet visible aujourd'hui, et c'est normal : —
- **Sans effet dans GM-OS (SDK)** : —

