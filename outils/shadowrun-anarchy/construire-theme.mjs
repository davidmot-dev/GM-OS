// Atelier Studio : seuls les jetons contractuels atteignent GM-OS.
import fs from 'node:fs';
import path from 'node:path';
const root='docs/systems/shadowrun-anarchy/theme';
for(const d of ['matieres','ornements','icones','apercu'])fs.mkdirSync(path.join(root,d),{recursive:true});
const ecrire=(p,t)=>fs.writeFileSync(path.join(root,p),t.trimEnd()+'\n');
ecrire('theme.css',`/* Shadowrun : Anarchy 2.0 — contrat GM-OS v1.7.
   Papier usé, cartouches bruns, cadre jaune sérigraphié ; aucune lueur de néon dans la page. */
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Rethink+Sans:wght@400;600;700&display=swap');
:root[data-theme="shadowrun-anarchy"] {
  color-scheme: light;
  --rpg-bg: #eeeFEB;
  --rpg-surface: #fffef8;
  --rpg-surface-2: #f5edd3;
  --rpg-text: #22201d;
  --rpg-muted: #61584e;
  --rpg-accent: #943e29;
  --rpg-accent-contrast: #fffef8;
  --rpg-border: rgba(93, 54, 36, 0.48);
  --rpg-border-soft: rgba(93, 54, 36, 0.18);
  --rpg-success: #346447;
  --rpg-danger: #c2205b;
  --rpg-warning: #817c00;
  --rpg-info: #3e59b8;
  --rpg-font-display: "Barlow Condensed", Arial, sans-serif;
  --rpg-font-body: "Rethink Sans", Arial, sans-serif;
  --rpg-font-mono: "Courier New", monospace;
  --rpg-title-tracking: 0.025em;
  --rpg-kicker-tracking: 0.10em;
  --rpg-title-transform: uppercase;
  --rpg-radius-sm: 0px;
  --rpg-radius-md: 1px;
  --rpg-radius-lg: 1px;
  --rpg-border-width: 1px;
  --rpg-border-style: solid;
  --rpg-elevation-1: 0 2px 1px rgba(30, 25, 18, 0.09);
  --rpg-elevation-2: 0 8px 20px rgba(30, 25, 18, 0.16);
  --rpg-elevation-3: 0 18px 42px rgba(30, 25, 18, 0.22);
  --rpg-glow: none;
  --rpg-glow-strength: 0;
  --rpg-glass-bg: rgba(255, 254, 248, 0.95);
  --rpg-glass-border: rgba(93, 54, 36, 0.22);
  --rpg-glass-blur: 0px;
  --rpg-frame-bg: #e9ba00;
  --rpg-frame-text: #211d17;
  --rpg-frame-accent: #682b1a;
  --rpg-texture-bg: url('matieres/fissures.svg');
  --rpg-texture-panel: url('matieres/trame.svg');
  --rpg-texture-opacity: 0.055;
}`.replace('#eeeFEB','#eeefeb'));
const svg=(box,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter">${body}</svg>`;
ecrire('matieres/fissures.svg',svg('0 0 240 240','<path stroke-width=".8" d="M0 44l36 9 17 33 38 14 21 45 48 8 25 42 55 12M53 86l-9 39-44 23M112 145l-8 45-37 50M185 195l27-23 28 1M91 100l35-28 54 4 60-33M126 72l-5-42 20-30"/>'));
ecrire('matieres/trame.svg',svg('0 0 64 64','<g stroke-width=".7"><path d="M1 9h6m24 5h3m13 14h8M12 49h7m28 9h4M24 34h5"/><path d="M10 6v1m30 36v1m-34 22v1m50-48v1"/></g>'));
ecrire('ornements.json',JSON.stringify({coin:'ornements/coin.svg',separateur:'ornements/separateur.svg',fond:'ornements/fond.svg'},null,2));
ecrire('ornements/coin.svg',svg('0 0 80 80','<g stroke-width="2"><path d="M3 26V3h24M8 21V8h13M3 15h4M15 3v4"/><path d="M11 12l5-1 4 3 6-2"/></g>'));
ecrire('ornements/separateur.svg',svg('0 0 240 16','<g stroke-width="2"><path d="M1 8h91m56 0h91M101 4l9 1 4 7 10-9 10 8 5-4M1 4v8m238-8v8"/><path d="M40 5h14m125 6h18"/></g>'));
ecrire('ornements/fond.svg',svg('0 0 80 80','<g stroke-width="2.4"><path d="M15 27l8-11 19-4 15 7 10 18-4 21-18 10-21-6-12-18 3-17Z"/><path d="M22 44h10l7-19 6 30 7-16h10M28 18l-2 8m34 31-7-4M16 46l9-2"/></g>'));
const formes={
 'tableau-de-bord':'<path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z"/>',
 journal:'<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5M3 6h3m-3 5h3m-3 5h3"/>',
 nexus:'<path d="M7 5l10 1 4 8-9 7-9-8 4-8Z M7 5l5 16m5-15L3 13m0 0 18 1"/>',
 combat:'<path d="M4 3l10 9-3 3L2 5l2-2Zm13 8 5-5-2-3-8 8m-3 6-5 5m12-7 5 5M4 17l3 3m10-2 3-3"/>',
 des:'<path d="M12 2l10 7-4 12H6L2 9 12 2Zm0 0L7 10l5 8 5-8-5-8ZM2 9l5 1m10 0 5-1M6 21l6-3 6 3"/>',
 pj:'<path d="M8 3h8l2 8-6 4-6-4 2-8Zm-4 18v-3l8-3 8 3v3M10 8h1m3 0h1"/>',
 pnj:'<path d="M5 4h7l2 7-5 3-5-3 1-7ZM2 21v-4l7-3 7 3v4m1-17h4v8l-4 2m1 3 4 2v2"/>',
 sante:'<path d="M4 4h16v16H4zM3 12h5l2-5 4 10 2-5h5"/>',
 initiative:'<path d="M12 3v4m0 14v-4M3 12h4m14 0h-4M6 6l3 3m9-3-3 3M6 18l3-3m9 3-3-3"/><circle cx="12" cy="12" r="3"/>',
 indice:'<path d="M3 3h12l6 6v12H3zM15 3v6h6M7 8h3M7 13h10m-10 4h7"/>',
 carte:'<path d="M2 5l6-3 8 3 6-3v17l-6 3-8-3-6 3V5Zm6-3v17m8-14v17M4 12l2-2m5-1 2 3m5 2 2-2"/>',
 lieu:'<path d="M4 21V8l8-6 8 6v13H4Zm4 0v-7h8v7M8 8h8m-4-3v6"/>',
 scene:'<path d="M3 8h18v13H3zM3 3h18v5H3zM6 3l3 5m3-5 3 5m3-5 3 5m-11 4 6 3-6 3v-6Z"/>',
 horloge:'<path d="M6 3h12l4 9-4 9H6l-4-9 4-9Zm6 3v7l5 2M2 12h3m14 0h3"/>',
 butin:'<path d="M3 7l4-4h10l4 4v14H3V7Zm0 0h18M9 7v5h6V7m-6 9h6"/>',
};
const icones={};for(const[n,p]of Object.entries(formes)){const f=`icones/${n}.svg`;icones[n]=f;ecrire(f,svg('0 0 24 24',`<g stroke-width="1.8">${p}</g>`));}ecrire('icones.json',JSON.stringify(icones,null,2));
ecrire('intention.md',`# Shadowrun : Anarchy 2.0 — intention

Papier blanc usé, cadre jaune sérigraphié et cartouches brun rouille : un dossier de rue à la typographie nette, aux angles vifs et au relief léger. Fissures et trame restent discrètes sous le texte ; les ornements reprennent le geste irrégulier et les repères techniques sans reproduire le logo. Le thème de lecture reste clair, tandis que l’identité des illustrations et la bannière gardent leurs ombres urbaines.

## Limites signalées

- **PARTIELLEMENT RÉALISABLE — polices** : Rethink Sans est identifiée dans le PDF et déclarée via Google Fonts ; Barlow Condensed approche Stolzl Display, les fontes de titrage BMXRadical/Examplesoferosion ne sont pas embarquées. Les replis Arial/Courier New restent disponibles hors ligne ; leur rendu est celui des planches de contrôle.
- **PARTIELLEMENT RÉALISABLE — accents** : le contrat impose un accent principal, ici brun lisible sur le papier. Le jaune est porté par le cadre ; les filets jaunes, les cartouches violets de tableaux et les titres bruns ne peuvent pas être affectés indépendamment à chaque type de contenu.
- **PARTIELLEMENT RÉALISABLE — usure** : les textures et les trois ornements sont des dessins originaux de petite taille ; ils approchent la trame et les bords frottés, sans reproduire la page du livre.
- **NON EXPRIMABLE — composition** : les grands aplats diagonaux, les contours déchirés des panneaux et les titres traversant les colonnes ne peuvent pas changer la géométrie de GM-OS. Aucun sélecteur CSS sans effet n’est ajouté pour les simuler.

Matières, ornements et quinze icônes nécessitent les personnalités activées. La fiche HTML conserve son PDF et ne lit pas ce thème. Sources : quatre pages du PDF example et fiche PJ fournies, sans modification des originaux.`);
console.log(JSON.stringify({theme:root,icones:Object.keys(icones).length,ornements:3,matieres:2}));
