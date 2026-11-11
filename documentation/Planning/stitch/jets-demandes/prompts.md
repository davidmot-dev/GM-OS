# Jets demandés et cachés — prompts Stitch (T6), 11/11/2026

Plan : [`../../2026-11-11-jets-demandes-et-caches.md`](../../2026-11-11-jets-demandes-et-caches.md),
tâche T6. Projet Stitch : « GM-OS — Jets demandés et cachés (11/11) »
(`projects/4411473442520563995`).

**Une conversation par écran**, et rien d'autre que ce qui est écrit (méthode de
`../README.md`). Captures de départ, déjà prises par les e2e :

| Prompt | Capture de départ |
| --- | --- |
| 1 · Tablette — bannière | `documentation/User Guides/captures/tablette-des-joueurs-fiche.jpg` |
| 2 · Meneur — « Lancer un test » | `documentation/User Guides/captures/jeu-alien-jet.jpg` |
| 3 · Pupitre de dés — « Jet caché » | `documentation/User Guides/captures/dice-un-jet.jpg` |

> 11/11 : le premier envoi du prompt 1 s'est arrêté sans écran (système de dessin et portrait
> seulement). Renvoyé avec `modelId: GEMINI_3_8_FLASH` à la demande de David, puis les
> prompts 2 et 3 : **les trois ont abouti**. HTML rendus ici avec le Chromium de Playwright
> (`chromium-1217`), aux largeurs demandées ; exports bruts dans `/Stitch/jets-demandes/`
> (ignoré).

## Les rendus, et ce que Stitch a inventé

| Rendu | Conforme au prompt | Inventé par Stitch — **à ne pas reprendre** sans décision |
| --- | --- | --- |
| [`1-tablette-banniere.png`](1-tablette-banniere.png) | bannière pleine largeur entre l'en-tête et les onglets, bordure d'accent à gauche, « LE MENEUR TE DEMANDE UN JET », jet en grand, « DIFFICULTÉ +1 », bouton « LANCER » 48 px ; second état « Jet envoyé au meneur » | tout le contenu de la vue synthèse (attributs, compétences, équipement, portrait) ; la coche doublée (icône + ✓) |
| [`2-meneur-lancer-un-test.png`](2-meneur-lancer-un-test.png) | interrupteur « Jet caché » et son aide, « DEMANDER À WILSON » contouré à côté de « LANCER », liste « Demandes en cours » (en attente + Annuler, lancé ✓ 3 succès) | l'en-tête « SYSTÈME ALIEN // FICHE WILSON // JET DE DÉS · TERMINAL MJ V.3.2 », les mentions « TABLETTE JOUEUR » et « ARCHIVÉ » |
| [`3-pupitre-jet-cache.png`](3-pupitre-jet-cache.png) | interrupteur « Jet caché » dans la rangée de « LANCER », bouton « LANCER EN CACHÉ » en pointillés, panneau « JETS CACHÉS » en pointillés entre « Dernier jet » et « Historique », sans « Projeter » ; le dernier jet visible (21) reste | le badge « CONFIDENTIEL MJ », la mention « // PUBLIC & PROJETÉ » sur le dernier jet, le dé « D% » |

---

## 1 · Tablette — bannière de demande

```text
Tablet screen (1180×820, landscape) of a tabletop RPG companion app, player side. Dark theme: background #050a14, panels #0b1220 with 1px border #1e293b, accent cyan #22d3ee, text #e2e8f0, muted text #64748b. Section labels are small uppercase letters with wide letter-spacing. Language: French.

Existing layout, keep it exactly:
- Top-left: an outlined "RETOUR" button. Top-right: the character name "Nel Varga" in bold 24px, and below it a small cyan outlined tag "SYSTÈME : ALIEN" and muted text "TECHNICIENNE DE BORD".
- Under the header: a row of four tabs: "Synthèse" (active, cyan underline), "Fiche", "Groupe", "Lancer un test" (with a dice icon).
- Below: the synthesis view (portrait card on the left with a health bar "POINTS DE VIE 9/12" and buttons −5 −1 +1 +5; on the right a grid of stat cards).

The ONE new element to design: a request banner placed between the header and the tabs, full width. It means "the game master asks you to roll". Content:
- a dice icon,
- text "Le meneur te demande un jet" in small uppercase muted label,
- the roll in large text: "Agilité + Mobilité" and a secondary line "difficulté +1",
- on the right a big primary button "LANCER" (at least 48 px tall, cyan background, dark text).
The banner uses the accent color as a left border and a faint accent tint as background. It is not a modal and does not cover the sheet.
Show also, small and below the first one, a second state of the same banner after the roll: text "Jet envoyé au meneur ✓" with no button, muted.

That's ALL. Do not add anything else: no chat, no notifications, no extra buttons, no navigation bar.
```

## 2 · Meneur — onglet « Lancer un test » de la fiche

```text
Desktop panel (760 px wide) of a game master's RPG tool: the "roll a test" tab of a character sheet. Dark theme: background #050a14, panels #0b1220 with 1px border #1e293b, accent cyan #22d3ee (buttons use a muted teal #8fbcbb fill with dark text), text #e2e8f0, muted #64748b. Section titles are uppercase with a small numbered square ("1", "2", "3"). Square corners. Language: French.

Existing content, keep it exactly:
- Section "1 COMPOSER": three dropdowns side by side labelled ATTRIBUT "Force (4)", COMPÉTENCE "Combat rapproché (2)", STRESS "Niveau de Stress (2)"; under them a muted line "RÉSERVE 6 dés de base + 2 dés de Stress".
- Section "2 PRÉPARER LE TEST": a dropdown "Arme de la fiche: Aucune", a number field "Modificateur de situation: 0".
- Section "3 LANCER LES DÉS": today only one big button "LANCER" on the right.

The new elements to design, all inside section 3:
- Next to "LANCER", a second button of equal height, outlined (not filled): "DEMANDER À WILSON" — it sends this composed roll to the player's tablet instead of rolling here.
- On the left of section 3, a toggle switch labelled "Jet caché" with a muted hint "seul le meneur verra le résultat". When ON, the LANCER button shows an eye-slash icon and "DEMANDER À WILSON" is disabled.
- Under the buttons, a thin list "Demandes en cours" with one row: "Agilité + Mobilité · difficulté +1 — en attente" with a small text button "Annuler", and a second row, muted: "Force + Combat rapproché — lancé ✓ 3 succès".

That's ALL. Do not add anything else: no new sections, no chat, no player list, no dice animation.
```

## 3 · Pupitre de dés (Dice-OS) — interrupteur « Jet caché »

```text
Desktop screen (1440×900) of a game master's dice roller called DICE-OS. Dark theme: background #050a14, panels #0b1220 with 1px border #1e293b, accent cyan #22d3ee, text #e2e8f0, muted #64748b. Uppercase labels with wide letter-spacing. Square corners, thin corner brackets on the main panel. Language: French.

Existing layout, keep it exactly:
- Title "DICE-OS", tag "STANDARD D20/D6", top-right buttons "RÉGLAGES" and "RÉINITIALISER".
- A row: a big cyan button "LANCER 1d20", then quick-roll chips "Attaque Épée Longue 1d20+7", "Dégâts 1d8+4", "Lancer D66 1d66", and "+ Ajouter".
- Main panel "DERNIER JET" with a "PROJETER" button: "Formule : 1d20+7", big result "21", one die "14" labelled D20.
- Below: panel "HISTORIQUE" with rows "00:21:34 Formule : 1d20+7 · 14 … 21" and "00:21:33 1d20 · 16 … 16", and a "Vider" link.
- Right column "PARAMÈTRES DU JET": MODE dropdown, QUANTITÉ and MODIFICATEUR steppers, RÉPÉTITIONS stepper, a grid of die buttons d4 d6 d8 d10 d12 d20 d100; then "AFFICHAGE DES DÉS" with a toggle "Rendu 3D Physiques" and "Matière des dés: RÉSINE / VERRE / MÉTAL".

The new elements to design:
- In the row of the LANCER button, a toggle switch "Jet caché" (eye-slash icon). When ON, the LANCER button turns from cyan fill to a dark fill with a dashed cyan outline and reads "LANCER EN CACHÉ".
- A new panel "JETS CACHÉS" between "DERNIER JET" and "HISTORIQUE", visibly distinct (dashed border, eye-slash icon in the title, muted hint "vus par le meneur seulement — ni projetés, ni envoyés aux tablettes"). It lists the latest hidden rolls, newest first: "00:22:10 La patrouille passe-t-elle ? 1d100 … 37" and "00:21:58 1d20 … 4". No "PROJETER" button on this panel.
- The "DERNIER JET" panel keeps showing the last VISIBLE roll (21): a hidden roll never replaces it.

That's ALL. Do not add anything else: no chat, no players, no new settings.
```
