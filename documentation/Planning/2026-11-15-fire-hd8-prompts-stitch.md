# La Fire HD 8 — prompts Stitch, 15/11/2026

Tâche **T3** de la [spécification](2026-11-15-fire-hd8-interface.md) (registre § 256). Cinq écrans,
écrits depuis le code et les captures ADB de la Fire du 15/11 (télécommande et Hub sous Firefox). Les
prompts ne contiennent que des libellés, des couleurs et des gestes : aucune donnée de David, aucun
secret, aucun livre. Envoi à Stitch accepté par David le 15/11 (« continue » sur « je génère les
maquettes dans Stitch… Je lance T3 ? »).

**L'appareil** : Fire HD 8, 1280 × 800 physiques à 213 dpi, soit **600 × 960 px CSS en portrait** et
**960 × 600 en paysage**. **Le style** : celui des tablettes de GM-OS, qui suivent le thème du PC
(décision du 04/10) ; capture de référence, la télécommande actuelle : fond `#020617`, surfaces
`#0f172a`, bordures fines `#1e293b`, texte `#f8fafc`, accent cyan, alerte rose, police Plus Jakarta
Sans, libellés de section en petites capitales espacées.

## 1 · L'accueil des rôles — portrait 600 × 960

```text
GM-OS tablet companion, French interface. Create ONE TABLET PORTRAIT screen, 600x960 CSS px, for an old 8-inch tablet used at a tabletop role-playing table. Existing GM-OS visual language: near-black navy background #020617, panels #0f172a, thin borders #1e293b, text #f8fafc, muted text #94a3b8, cyan accent #22d3ee, pink alert #ff2d78, font Plus Jakarta Sans, small uppercase letter-spaced section labels. Flat, calm, no illustrations, no photos, no gradients behind text.
Content, top to bottom: small label "GM-OS · TABLETTE DE LA TABLE"; title "Que fait cette tablette ?"; status line with a small green dot "Connectée au poste du meneur".
Three LARGE stacked choice cards (full width, at least 140px high, icon at left, title, one-line description):
1. "Aide au MJ" — "Combat, dés, tables et campagne active." — a small lock icon with "Code du meneur demandé".
2. "Appareil de table" — "Les modules que le meneur ouvre à toute la table."
3. "Écran de table" — "Jauges, compte à rebours et ordre du tour, en grand."
The second card is the current choice: cyan border and a small pill "Rôle actuel".
Footer, small muted text: "La tablette rouvre ce rôle à son démarrage."
That is ALL. Do not add navigation bars, settings, login, accounts, network addresses, QR codes, or extra roles. Touch targets at least 48px.
```

## 2 · Le code du meneur — portrait 600 × 960

```text
GM-OS tablet companion, French interface, same visual language: background #020617, panels #0f172a, borders #1e293b, text #f8fafc, muted #94a3b8, cyan accent #22d3ee, pink alert #ff2d78, Plus Jakarta Sans. Create ONE TABLET PORTRAIT screen 600x960 CSS px: the unlock step shown when switching this shared tablet back to the game master role.
Content: small label "AIDE AU MJ"; title "Code du meneur"; one muted sentence "Le code se règle dans les Paramètres du poste."; four large empty code boxes, the first two filled with dots; a large numeric keypad 1-9, then "Effacer", 0, "Valider" (keys at least 72px). Below, an error line in pink, shown: "Code incorrect. Encore 2 essais." Bottom: secondary text button "Retour aux rôles".
That is ALL. No keyboard other than digits, no biometrics, no account, no "forgot code", no network details.
```

## 3 · L'onglet Tables de la télécommande — portrait 600 × 960

```text
GM-OS "GM REMOTE", the existing game master remote for a tablet, French interface. Create ONE TABLET PORTRAIT screen 600x960 CSS px that adds a new "Tables" tab, keeping the existing remote exactly as it is: background #020617, panels #0f172a, thin borders #1e293b, text #f8fafc, muted #94a3b8, cyan accent #22d3ee used for the selected tab and values, pink #ff2d78 only for the top-right button "COUPER LE SON". Font Plus Jakarta Sans, small uppercase letter-spaced labels, compact density.
Keep the existing left sidebar (about 110px) with small label "GM REMOTE" and items with icons: Pads, Dés, Tables (NEW, selected, cyan highlight), Sons, Scénario, Combat, Tableau, Notes, Messages, Modules. Keep the thin top bar with a small green connection dot and the pink outlined button "COUPER LE SON".
Main area: header "Tables" with a small pill "Alien" (the active game). A search field "Filtrer les tables…". A scrollable compact list of table rows (name + dice pill): "Test de Panique · D6", "Blessures Critiques · D66" (selected), "Blessures critiques synthétiques · D66", "Avaries mineures des vaisseaux · D66", "Trouvailles de prospection · D66", "Incidents d'intermède · D66".
Below the list, the selected table panel: title "Blessures Critiques", dice "D66", a stepper "MODIFICATEUR" with − 0 +, and a large cyan button "Tirer".
Result card under it: big number "15", line "Jet 15 · modificateur 0", title "Sang dans les yeux", text "Le sang coule sur votre visage, obstruant votre vue.", effect line "OBSERVATION et COMBAT À DISTANCE −2 avant d'avoir bénéficié d'un test de SOINS MÉDICAUX.", a small muted badge "Vu par toi seul". Two buttons: "Montrer aux joueurs" (outlined cyan) and "Tirer encore" (text).
That is ALL. No table editor, no import, no other games list, no dice 3D, no player names.
```

## 4 · L'appareil de table, un module ouvert — paysage 960 × 600

```text
GM-OS tablet companion, French interface. Create ONE TABLET LANDSCAPE screen 960x600 CSS px: a shared tablet lying in the middle of a role-playing table, showing ONE external game module opened by the game master to the whole table. Frame in GM-OS style (background #020617, borders #1e293b, text #f8fafc, muted #94a3b8, cyan #22d3ee, Plus Jakarta Sans) and the module keeps its OWN existing look inside.
Thin top bar (40px): left small label "APPAREIL DE TABLE · Ouvert par le meneur", center "Détecteur M314", right a small muted text button "Changer de rôle". Nothing else in the bar.
Below, the module fills the whole remaining area. The module is the existing Alien motion tracker: very dark green #080e0c background, pale green #c5ebd0 monospace text, secondary #9abbab, thin #344b3f borders. Left: a large square dark radar with top strip "WEYLAND-YUTANI · SCAN ACTIF", concentric rings, a center marker pointing right, a visible 90° sector facing right with ONE glowing anonymous echo, bottom "ÉCHOS : 1". Right column: "Orientation", "Cap : Est · 90°", two large buttons "↶ 15°" and "15° ↷", slider "Cap du détecteur", small text "Orientation partagée avec le meneur", then "Mode discret · Tour 3" and "Énergie du M314 : 4".
That is ALL. No character names, no enemy identities or counts outside the sector, no map, no navigation, no scan button, no settings.
```

## 5 · L'écran de table — paysage 960 × 600

```text
GM-OS "écran de table": a tablet standing up facing the players, an ambient public display read at a glance from 1.5 metres, French interface. Create ONE TABLET LANDSCAPE screen 960x600 CSS px. Style: background #020617, tiles #0f172a with thin borders #1e293b, text #f8fafc, muted #94a3b8, cyan #22d3ee, amber #f59e0b, pink alert #ff2d78. Very large numbers and bars, very few words: numbers, bars, colours, icons — never sentences. No buttons at all except one tiny muted "Changer de rôle" in a corner.
Layout: a grid of four large tiles chosen by the game master:
1. "ORDRE DU TOUR" — "Tour 3" small; the active name very large "Wilson" with a cyan bar; below, smaller, next ones "Rôdeur" then "Nel Varga".
2. "AIR RESTANT" — a large segmented gauge 6 of 10 segments, amber, big "6/10".
3. "VERROUILLAGE" — a countdown "04:32" in huge digits, pink, with a thin depleting bar.
4. "HEURE DU MONDE" — "Jour 3" and "14:20" large, with a small sun/moon icon.
That is ALL. No menus, no chat, no dice, no character sheets, no hidden information, no explanations.
```
