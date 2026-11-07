# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reprisesEtVariantesDesPilotes.spec.ts >> runequest : GM-06 refuse autrui et conserve le refus après rechargement
- Location: e2e\reprisesEtVariantesDesPilotes.spec.ts:85:25

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#nexus-bilan-fermer')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('#nexus-bilan-fermer') with timeout 10000ms
  - waiting for locator('#nexus-bilan-fermer')

```

```yaml
- complementary:
  - img
  - text: GM-OS v6 NEXUS-PROTOCOL
  - navigation:
    - button "Tableau de Bord"
    - button "Journal de Jeu"
    - button "Forge"
    - text: Audio
    - button "Musique"
    - button "Effets Sonores"
    - button "Ambiances"
    - button "Voice-OS"
    - text: Global
    - button "Favoris"
    - button "Nexus Wiki"
    - button "Cortex IA"
    - text: Aventure
    - button "Combat-OS"
    - button "Dice-OS"
    - button "Générateur PNJ"
    - button "Cartographie"
    - text: Outils
    - button "Médiathèque"
    - button "Image-OS"
    - button "Horloge & Temps"
    - button "Light-OS"
    - button "Tables Aléatoires"
    - button "Navigateur Web"
    - button "Tableau Blanc"
  - button "Cortex Tactique"
  - 'button "Thème : cyberpunk"'
  - button "Aide — Ctrl+H"
  - button "Debug & Logs"
  - button "Paramètres de l'OS"
  - button "--:--"
  - button "Charger une session"
  - button "Lancer le Player Hub"
  - button "Lancer le Hub Tablette"
  - button "Quitter GM-OS"
- main:
  - heading "Mode Session OS" [level=2]
  - button "Couper le son"
  - slider "Audio": "1"
  - text: 100%
  - button "Focus Chat"
  - button "ARRÊT GLOBAL (Panique)"
  - text: Atelier (hors séance)
  - button "Table"
  - button "Ouvrir le code de connexion PWA"
  - heading "Session OSMaster Cockpit" [level=1]
  - button "Oracle"
  - button "Règles"
  - button "Snapshot"
  - main:
    - complementary:
      - complementary:
        - heading "RECETTE RUNEQUEST — Les Bornes du gué" [level=3]
        - paragraph: Campagne Active
        - paragraph: 🏺 RuneQuest
        - button "Identité visuelle…"
        - text: Progression de la Session Étape 0/4
        - navigation:
          - paragraph: Gestion
          - button "Cockpit"
          - button "Rencontres"
          - button "Master Storyboard"
          - button "Galerie PNJ"
          - button "Social Nexus"
          - button "Atlas du Monde"
          - button "Chroniques & Wiki"
          - button "Loot-OS"
          - button "Modules du jeu"
          - button "Préparation de Session"
          - button "Deck-OS"
          - button "Lancer Session"
          - button "Bibliothèque"
          - button "Joueurs"
          - button "Modèles de fiches"
    - paragraph: Aucune Session Active
    - paragraph: Sélectionnez ou créez une session dans le module Prep pour démarrer le workspace.
    - complementary:
      - heading "Ordre d'Initiative" [level=4]
      - paragraph: Aucune rencontre active
      - button "Ouvrir Combat-OS"
      - heading "Conditions Actives" [level=4]
      - paragraph: Aucune altération
      - heading "Environnement Sonore" [level=4]
      - text: A
      - paragraph: Silence Digital
      - paragraph: À l'arrêt
      - button "Deck A" [disabled]
      - text: B
      - paragraph: Silence Digital
      - paragraph: À l'arrêt
      - button "Deck B" [disabled]
      - slider "Volume général": "1"
      - text: 100%
      - heading "Destinée & Cartes" [level=4]
      - button "Gérer"
      - button "Deck-OS"
      - text: Centre de Liaison
      - button "Tous (Canal Global)"
      - text: Aucun message intercepté
      - textbox "Écrire au canal global..."
      - button "Envoyer le message" [disabled]
      - text: SESSION SEULEMENT
      - heading "Lancement Rapide" [level=4]
      - button "d4 –"
      - button "d6 –"
      - button "d8 –"
      - button "d10 –"
      - button "d12 –"
      - button "d20 –"
      - button "d% –"
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import WebSocket from 'ws';
  3   | import AdmZip from 'adm-zip';
  4   | import fs from 'node:fs';
  5   | import path from 'node:path';
  6   | import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche, type GmOsLance } from './lancerGmOs';
  7   | import type { useSessionOSStore } from '../src/modules/session/useSessionOSStore';
  8   | import type { useDiceStore } from '../src/stores/useDiceStore';
  9   | import type { NexusDriverState } from '../src/modules/system/archive/nexus.types';
  10  | 
  11  | type Fenetre = Window & { useSessionOSStore: typeof useSessionOSStore; useDiceStore: typeof useDiceStore };
  12  | const sortie = path.resolve('output/verification-np-c2-c3');
  13  | const lots = [
  14  |     { jeu: 'runequest', campagne: 'recette-rq-campagne-bornes', archive: '01-Les-Bornes-du-gue.gmos' },
  15  |     { jeu: 'degenesis', campagne: 'recette-dg-campagne-station', archive: '01-La-Station-des-Cendres.gmos' },
  16  |     { jeu: 'coc', campagne: 'recette-coc-campagne-minutes', archive: '01-Les-Minutes-de-Verre.gmos' },
  17  |     { jeu: 'shadowrun-anarchy', campagne: 'recette-shadowrun-campagne-couleur', archive: '01-La-Derniere-Couleur.gmos' },
  18  | ];
  19  | async function preparer(g: GmOsLance) {
  20  |     await attendreLHydratation(g); await ouvrirLeModule(g, 'Tableau de Bord');
  21  |     await g.fenetre.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.setState({
  22  |         campaigns: [], players: [], entities: [], sessions: [], actes: [], scenes: [], activeCampaignId: null,
  23  |         currentView: 'library', customGameDrivers: [], customSheetTemplates: [],
  24  |     }));
  25  |     fs.mkdirSync(sortie, { recursive: true });
  26  | }
  27  | async function importer(g: GmOsLance, fichier: string, attendu: () => Promise<unknown>, valeur: unknown, conflit = false, campagne = false) {
  28  |     const f = g.fenetre;
  29  |     await g.application.evaluate(({ dialog }, cible) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [cible] }); }, path.resolve(fichier));
  30  |     await f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('library'));
  31  |     await f.getByRole('button', { name: /Importer un bundle Nexus/i }).click();
  32  |     if (conflit || campagne) await f.locator(conflit ? '#nexus-conflict-replace' : '#nexus-import-tel-quel').click();
  33  |     await expect.poll(attendu, { timeout: 45_000 }).toEqual(valeur);
  34  |     const fermer = f.locator('#nexus-bilan-fermer');
> 35  |     await expect(fermer).toBeVisible(); await fermer.click();
      |                          ^ Error: expect(locator).toBeVisible() failed
  36  | }
  37  | const personne = (f: Page, id: string) => f.evaluate(id => (window as unknown as Fenetre).useSessionOSStore.getState().players.flatMap(p => p.characters).find(c => c.id === id)!, id);
  38  | 
  39  | async function essayerLaReprise(g: GmOsLance, joueurId: string, personnageId: string, jeu: string) {
  40  |     const f = g.fenetre;
  41  |     const cible = await f.evaluate(({ joueurId, personnageId }) => {
  42  |         const magasin = (window as unknown as Fenetre).useSessionOSStore;
  43  |         const s = magasin.getState(), p = s.players.find(p => p.id === joueurId)!.characters.find(c => c.id === personnageId)!;
  44  |         const pilote = s.customGameDrivers.find(d => d.id === p.systemId)!;
  45  |         const fiche = s.customSheetTemplates.find(t => t.id === pilote.templateId)!;
  46  |         const cible = fiche.sections.flatMap(s => s.fields).find(c => c.type === 'number')!;
  47  |         s.updateCharacter(joueurId, personnageId, { sheetData: { ...p.sheetData, npc2_ancienne: '9' } });
  48  |         s.setSelectedPlayer(joueurId); s.setSelectedCharacter(personnageId); s.setCurrentView('players');
  49  |         return cible.id;
  50  |     }, { joueurId, personnageId });
  51  |     const panneau = f.locator('[data-reprise-de-fiche]');
  52  |     await panneau.locator('summary').click();
  53  |     const telecharger = panneau.getByRole('button', { name: 'Télécharger la sauvegarde avant reprise', exact: true });
  54  |     // Certains gabarits calculent des champs à l'ouverture ; les enregistrer par le geste normal.
  55  |     if (await telecharger.isDisabled()) await f.getByRole('button', { name: /Sauvegarder/i }).first().click();
  56  |     await expect(telecharger).toBeEnabled();
  57  |     const avant = await personne(f, personnageId);
  58  |     await panneau.getByLabel('Reprendre npc2_ancienne vers', { exact: true }).selectOption(cible);
  59  |     const sauvegarde = path.join(g.profil, `reprise-${jeu}.json`);
  60  |     // Aucun téléchargement vers le vrai dossier de David.
  61  |     await g.application.evaluate(({ BrowserWindow }, fichier) => {
  62  |         BrowserWindow.getAllWindows()[0].webContents.session.once('will-download', (_e, item) => item.setSavePath(fichier));
  63  |     }, sauvegarde);
  64  |     await telecharger.click();
  65  |     await expect.poll(() => {
  66  |         try { return JSON.parse(fs.readFileSync(sauvegarde, 'utf8')).format; } catch { return ''; }
  67  |     }).toBe('gmos-reprise-fiche');
  68  |     await panneau.getByRole('button', { name: 'Appliquer cette reprise', exact: true }).click();
  69  |     await expect.poll(async () => (await personne(f, personnageId)).sheetData[cible]).toBe(9);
  70  |     const apres = await personne(f, personnageId);
  71  |     expect(apres.sheetData.npc2_ancienne).toBe('9');
  72  |     expect(apres.gmNotes).toBe(avant.gmNotes); expect(apres.playerNotes).toBe(avant.playerNotes);
  73  |     expect(apres.inventory).toBe(avant.inventory); expect(apres.hp).toBe(avant.hp); expect(apres.maxHp).toBe(avant.maxHp);
  74  |     await panneau.screenshot({ path: path.join(sortie, `${jeu}-reprise.jpg`), type: 'jpeg', quality: 85, scale: 'css' });
  75  |     await panneau.getByLabel('Sauvegarde de reprise à restaurer', { exact: true }).setInputFiles(sauvegarde);
  76  |     await panneau.getByRole('button', { name: 'Restaurer les anciennes valeurs', exact: true }).click();
  77  |     await expect.poll(async () => (await personne(f, personnageId)).sheetData).toEqual(avant.sheetData);
  78  |     await f.reload(); await attendreLHydratation(g);
  79  |     expect((await personne(f, personnageId)).sheetData).toEqual(avant.sheetData);
  80  |     fs.writeFileSync(path.join(sortie, `${jeu}-reprise.json`), JSON.stringify({ jeu, sauvegardeTelechargee: true,
  81  |         liaisonExplicite: true, anciennesClesConservees: true, notesEtSanteConservees: true,
  82  |         restaurationDepuisExport: true, persistanceApresRechargement: true }, null, 2) + '\n');
  83  | }
  84  | 
  85  | for (const lot of lots) test(`${lot.jeu} : GM-06 refuse autrui et conserve le refus après rechargement`, async () => {
  86  |     test.setTimeout(180_000);
  87  |     const g = await lancerGmOs(), f = g.fenetre;
  88  |     let socket: WebSocket | undefined;
  89  |     try {
  90  |         await preparer(g);
  91  |         await importer(g, `output/campagnes-tests/${lot.jeu}/${lot.archive}`,
  92  |             () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().activeCampaignId), lot.campagne, false, true);
  93  |         const joueurs = await f.evaluate(campagne => (window as unknown as Fenetre).useSessionOSStore.getState().players
  94  |             .map(p => ({ id: p.id, personnage: p.characters.find(c => c.campaignId === campagne)! })).filter(p => p.personnage), lot.campagne);
  95  |         const [a, b] = joueurs; expect(joueurs).toHaveLength(3);
  96  |         const avant = await personne(f, b.personnage.id);
  97  |         socket = new WebSocket(`ws://127.0.0.1:${g.ports.sync}`);
  98  |         const ws = socket;
  99  |         await new Promise<void>((resolve, reject) => {
  100 |             ws.once('error', reject);
  101 |             ws.on('message', brut => { if (JSON.parse(String(brut)).type === 'remote:registered') resolve(); });
  102 |             ws.once('open', () => ws.send(JSON.stringify({ type: 'remote:register', payload: {
  103 |                 deviceId: `npc3-${lot.jeu}`, pseudo: 'Client fictif NP-C3', role: 'hub', characterId: a.personnage.id,
  104 |             } })));
  105 |         });
  106 |         const envoyer = (type: string, characterId: string, playerId: string, updates: object) => ws.send(JSON.stringify({ type, payload: { playerId, characterId, updates } }));
  107 |         envoyer('session:update-character-sheet-data', b.personnage.id, b.id, { sheetData: { npc3_intrusion: 999 } });
  108 |         envoyer('session:update-character-narrative', b.personnage.id, b.id, { description: 'INTRUSION', playerNotes: 'INTRUSION', inventory: 'INTRUSION' });
  109 |         envoyer('session:update-character-vitals', b.personnage.id, b.id, { hp: 0 });
  110 |         // Alias privilégié : un joueur ne doit pas contourner la politique en changeant le type.
  111 |         envoyer('remote:session:update-character-sheet-data', b.personnage.id, b.id, { sheetData: { npc3_alias: 999 } });
  112 |         envoyer('session:update-character-narrative', a.personnage.id, a.id, { gmNotes: 'INTRUSION', playerNotes: 'NOTE AUTORISÉE' });
  113 |         envoyer('session:update-character-sheet-data', a.personnage.id, a.id, { sheetData: { npc3_barriere: 'AUTORISÉ' } });
  114 |         // La propre écriture clôt la série : même socket, ordre de livraison, aucun délai aveugle.
  115 |         await expect.poll(async () => (await personne(f, a.personnage.id)).sheetData.npc3_barriere).toBe('AUTORISÉ');
  116 |         await expect.poll(async () => (await personne(f, a.personnage.id)).playerNotes).toBe('NOTE AUTORISÉE');
  117 |         expect(await personne(f, b.personnage.id)).toEqual(avant);
  118 |         expect((await personne(f, a.personnage.id)).gmNotes).toBe(a.personnage.gmNotes);
  119 |         await f.reload(); await attendreLHydratation(g);
  120 |         expect(await personne(f, b.personnage.id)).toEqual(avant);
  121 |         expect((await personne(f, a.personnage.id)).sheetData.npc3_barriere).toBe('AUTORISÉ');
  122 |         fs.writeFileSync(path.join(sortie, `${lot.jeu}-droits.json`), JSON.stringify({ jeu: lot.jeu,
  123 |             refus: ['sheetData', 'narratif', 'PV', 'alias'], ecriturePropre: true, notesMJProtegees: true,
  124 |             persistanceApresRechargement: true, donneesPersonnelles: false }, null, 2) + '\n');
  125 |         await essayerLaReprise(g, a.id, a.personnage.id, lot.jeu);
  126 |     } finally { socket?.close(); await g.fermer(); }
  127 | });
  128 | 
  129 | for (const jeu of ['coc', 'shadowrun-anarchy']) test(`${jeu} : importe la variante puis revient au standard`, async () => {
  130 |     test.setTimeout(180_000);
  131 |     const g = await lancerGmOs(), f = g.fenetre;
  132 |     try {
  133 |         await preparer(g);
  134 |         const standard = jeu === 'coc' ? 'output/campagnes-tests/coc/COC-2.0.0-d20.gmos-driver'
  135 |             : 'output/campagnes-tests/shadowrun-anarchy/Shadowrun-Anarchy-2.0.0.gmos-driver';
```