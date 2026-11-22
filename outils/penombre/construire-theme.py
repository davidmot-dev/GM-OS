from pathlib import Path
import json

R = Path(__file__).resolve().parents[2]
T = R / 'docs/systems/penombre/theme'
for d in ['ornements', 'matieres', 'icones']:
    (T / d).mkdir(parents=True, exist_ok=True)

(T / 'theme.css').write_text('''/* Pénombre — papier ancien, encre et bois d'ombre. Contrat GM-OS v1.7. */
@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&display=swap');
:root[data-theme="penombre"] {
  color-scheme: light;
  --rpg-bg: #efe5ce;
  --rpg-surface: #f8efdc;
  --rpg-surface-2: #e6dac0;
  --rpg-text: #2c302a;
  --rpg-muted: #5c6054;
  --rpg-accent: #80502e;
  --rpg-accent-contrast: #fff8e7;
  --rpg-border: #8a7e61;
  --rpg-border-soft: rgba(94, 86, 65, 0.25);
  --rpg-success: #42664a;
  --rpg-danger: #9b2559;
  --rpg-warning: #787800;
  --rpg-info: #355d96;
  --rpg-font-display: "IM Fell English SC", Georgia, serif;
  --rpg-font-body: Georgia, "Times New Roman", serif;
  --rpg-font-mono: Consolas, "Courier New", monospace;
  --rpg-title-tracking: 0.015em;
  --rpg-kicker-tracking: 0.08em;
  --rpg-title-transform: none;
  --rpg-radius-sm: 2px;
  --rpg-radius-md: 3px;
  --rpg-radius-lg: 4px;
  --rpg-border-width: 1px;
  --rpg-border-style: solid;
  --rpg-elevation-1: 0 2px 4px rgba(46, 37, 23, 0.13);
  --rpg-elevation-2: 0 10px 24px rgba(35, 30, 22, 0.24);
  --rpg-elevation-3: 0 20px 52px rgba(24, 30, 28, 0.34);
  --rpg-glow: none;
  --rpg-glow-strength: 0;
  --rpg-glass-bg: rgba(248, 239, 220, 0.95);
  --rpg-glass-border: rgba(128, 80, 46, 0.35);
  --rpg-glass-blur: 0px;
  --rpg-frame-bg: #253736;
  --rpg-frame-text: #eee4cd;
  --rpg-frame-accent: #dab56f;
  --rpg-texture-bg: url('matieres/velin.svg');
  --rpg-texture-panel: url('matieres/velin.svg');
  --rpg-texture-opacity: 0.06;
}
''', encoding='utf-8')
(T / 'intention.md').write_text('''# Intention visuelle

Un cahier Renaissance sur vélin chaud, encres brun-rouge et vert grisé, enchâssé dans un cadre de bois d’ombre. Des rameaux, des entrelacs et une ponctuation musicale portent le merveilleux sans couvrir les textes. Les reliefs sont mats, les angles presque droits, sans halo lumineux.

## Limites signalées

- **PARTIELLEMENT RÉALISABLE** — les lettres gothiques dessinées du livre sont approchées par IM Fell English SC ; cette police n’est pas celle du livre. Import Google Fonts autorisé par le contrat ; hors connexion, repli Georgia.
- **PARTIELLEMENT RÉALISABLE** — la richesse picturale et les gravures sont évoquées par le grain vectoriel et trois ornements originaux simplifiés, lisibles à petite taille. L’illustration peinte est portée par la bannière séparée.
- **NON EXPRIMABLE** — les colonnes, cartouches spécifiques et lettrines du livre ne déplacent aucun composant de GM-OS ; les emplacements restent ceux du contrat.

Les trois ornements (coin, séparateur, fond), la matière et les quinze icônes sont fournis. Les fiches de personnage conservent leur propre fond et ne lisent pas ce thème.
''', encoding='utf-8')

def svg(body, box='0 0 24 24', stroke='1.8'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" fill="none" stroke="currentColor" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round">{body}</svg>\n'

(T / 'matieres/velin.svg').write_text(svg('<path opacity=".5" d="M4 10h7m22 13h5m18 25h11m-43 21h6m52-62h4M11 91h8m46-7h5M94 38h3M52 8v2M9 50v3M86 76v2"/><path opacity=".2" d="M0 32h96M0 64h96"/>', '0 0 96 96', '.8').replace('<svg ', '<svg width="96" height="96" ', 1), encoding='utf-8')
ornements = {
    'coin': svg('<path d="M3 76V12Q3 3 12 3h64M8 70V16Q8 8 16 8h54M3 28c7-1 13-7 14-14M14 17c8 1 12-4 12-9M8 29c8 0 16-5 18-12"/><path d="M17 14c-9 0-8-8-2-7m-2 15c-9 3-11 11-5 12"/>', '0 0 80 80', '2'),
    'separateur': svg('<path d="M4 8h78c14 0 19-5 28-5m20 0c9 0 14 5 28 5h78M88 12c13 0 14-4 22-4m20 0c8 0 9 4 22 4"/><path d="M120 2l6 6-6 6-6-6zM103 6l-3-3m37 3 3-3"/>', '0 0 240 16', '1.8'),
    'fond': svg('<path d="M43 88c10-13 10-25 7-40m-1 11c-15-2-25-13-25-27m26 24c14-3 25-15 26-29M47 48C35 43 32 33 35 20m14 28c9-9 13-18 10-30M49 40V10M41 88l-10 5m15-6-1 8m7-8 10 6m-9-10 20 3"/><path d="M24 32c-8 1-11-3-10-9m22-3c-8 0-11-4-10-9m33 7c8 0 11-4 11-9m6 18c7 1 11-3 10-9M19 40c-7 9-6 23 0 31m62-31c7 9 6 23 0 31"/>', '0 0 100 100', '2.3'),
}
(T / 'ornements.json').write_text(json.dumps({k:f'ornements/{k}.svg' for k in ornements},indent=2)+'\n',encoding='utf-8')
for k,v in ornements.items():
    (T / f'ornements/{k}.svg').write_text(v,encoding='utf-8')
icones = {
    'pj':'<path d="M8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM4 21c0-5 3-8 8-8s8 3 8 8M9 18l3 3 3-3"/>',
    'pnj':'<path d="M8 7a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM3 21c0-6 3-10 8-10 4 0 7 3 7 7m-2-12c4 0 5 5 2 7m1 2c2 1 3 3 3 6"/>',
    'combat':'<path d="m5 3 9 9-3 3-8-9V3h2Zm14 0-7 7m5 3 4-7V3h-2M3 17l4 4m10-4 4 4M6 18l4-4m4 0 4 4"/>',
    'sante':'<path d="M12 20S2 14 3 8c1-5 7-5 9-1 2-4 8-4 9 1 1 6-9 12-9 12ZM8 11h8m-4-4v8"/>',
    'des':'<path d="m12 2 9 6v9l-9 5-9-5V8Zm0 0v20M3 8l9 5 9-5M3 17l9-4 9 4"/>',
    'carte':'<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2ZM9 3v15m6-12v15M5 11l2-2m10 4 2 2"/>',
    'scene':'<path d="M3 21V4l5-2 4 2 4-2 5 2v17M3 5c5 1 5 10 0 12m18-12c-5 1-5 10 0 12M8 21v-4h8v4"/>',
    'journal':'<path d="M5 3h14v18H5c-4 0-4-5 0-5h14M5 3v13m4-9h6m-6 4h6M2 18v-12c0-2 1-3 3-3"/>',
    'nexus':'<path d="M3 4c4-2 7-1 9 1 2-2 5-3 9-1v16c-4-2-7-1-9 1-2-2-5-3-9-1ZM12 5v16M6 7l3 1m6 0 3-1"/>',
    'oracle':'<path d="M3 12c5-8 13-8 18 0-5 8-13 8-18 0ZM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0M12 2v2m0 16v2"/>',
    'horloge':'<path d="M6 2h12M6 22h12M7 2c0 5 1 7 5 10-4 3-5 5-5 10m10-20c0 5-1 7-5 10 4 3 5 5 5 10M9 18h6"/>',
    'musique':'<path d="M9 17V5l11-2v12M9 8l11-2M3 18c0-4 6-5 6-1s-6 5-6 1Zm11-2c0-4 6-5 6-1s-6 5-6 1Z"/>',
    'indice':'<path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6M7 7c1-1 2-1 3-1"/>',
    'forge':'<path d="M3 12h18l-5 4v3l2 2H6l2-2v-3ZM8 12V8l4-5 4 5v4m-4-9v9"/>',
    'butin':'<path d="M3 11V7c0-6 18-6 18 0v4M3 11h18v10H3ZM12 11v4m-3 0h6m-8-4V5m10 6V5"/>',
}
(T / 'icones.json').write_text(json.dumps({k:f'icones/{k}.svg' for k in icones},indent=2)+'\n',encoding='utf-8')
for k,v in icones.items():
    (T / f'icones/{k}.svg').write_text(svg(v),encoding='utf-8')
print(json.dumps({'theme':str(T),'ornements':len(ornements),'icones':len(icones)}))
