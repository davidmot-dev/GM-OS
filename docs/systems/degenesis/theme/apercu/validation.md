# Rapport du validateur GM-OS — thème « degenesis »

Contrat GM-OS v1.7. **Verdict : ACCEPTÉ** — 0 erreur(s), 0 avertissement(s).

Les contrastes ci-dessous sont mesurés par GM-OS : lis-les, ne les recalcule pas.

## Contrastes (§ 6)

| Paire | Ratio | Minimum | Recommandé | Verdict |
| --- | --- | --- | --- | --- |
| `text` sur `bg` | 11.74 | 4.5 | 7 | bon |
| `text` sur `surface` | 13.2 | 4.5 | 7 | bon |
| `muted` sur `bg` | 5.2 | 3 | 4.5 | bon |
| `muted` sur `surface` | 5.84 | 3 | 4.5 | bon |
| `accent` sur `bg` | 5.73 | 3 | 4.5 | bon |
| `accent-contrast` sur `accent` | 7.05 | 4.5 | 7 | bon |
| `success` sur `bg` | 5.31 | 3 | 4.5 | bon |
| `danger` sur `bg` | 6.29 | 3 | 4.5 | bon |
| `warning` sur `bg` | 5.36 | 3 | 4.5 | bon |
| `info` sur `bg` | 5.39 | 3 | 4.5 | bon |
| `frame-text` sur `frame-bg` | 14.45 | 4.5 | 7 | bon |
| `frame-accent` sur `frame-bg` | 7.98 | 3 | 4.5 | bon |
| `text` sur `bg sous texture-bg` | 10.45 | 4.5 | 7 | bon |
| `muted` sur `bg sous texture-bg` | 4.62 | 3 | 4.5 | bon |
| `accent` sur `bg sous texture-bg` | 5.1 | 3 | 4.5 | bon |
| `success` sur `bg sous texture-bg` | 4.73 | 3 | 4.5 | bon |
| `danger` sur `bg sous texture-bg` | 5.6 | 3 | 4.5 | bon |
| `warning` sur `bg sous texture-bg` | 4.77 | 3 | 4.5 | bon |
| `info` sur `bg sous texture-bg` | 4.8 | 3 | 4.5 | bon |
| `text` sur `surface sous texture-panel` | 11.72 | 4.5 | 7 | bon |
| `muted` sur `surface sous texture-panel` | 5.18 | 3 | 4.5 | bon |

## Polarité (§ 3.5)

Déclarée : `light` · attendue d'après `--rpg-bg` : `light`.

## Ce que GM-OS fait des jetons déclarés

- **Appliqués aujourd'hui (LU)** : `bg`, `surface`, `text`, `muted`, `accent`, `border`, `font-display`, `font-mono`
- **Appliqués avec les personnalités (LU, v1.4)** — visibles quand le meneur les allume : `surface-2`, `accent-contrast`, `border-soft`, `success`, `danger`, `warning`, `info`, `font-body`, `title-tracking`, `kicker-tracking`, `title-transform`, `radius-sm`, `radius-md`, `radius-lg`, `border-width`, `border-style`, `elevation-1`, `elevation-2`, `elevation-3`, `glow`, `glow-strength`, `glass-bg`, `glass-border`, `glass-blur`, `frame-bg`, `frame-text`, `frame-accent`, `texture-bg`, `texture-panel`, `texture-opacity`
- **Annoncés (V2)** — sans effet visible aujourd'hui, et c'est normal : —
- **Sans effet dans GM-OS (SDK)** : —
