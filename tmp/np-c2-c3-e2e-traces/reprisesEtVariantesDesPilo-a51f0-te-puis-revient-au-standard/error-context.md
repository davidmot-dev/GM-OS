# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reprisesEtVariantesDesPilotes.spec.ts >> coc : importe la variante puis revient au standard
- Location: e2e\reprisesEtVariantesDesPilotes.spec.ts:129:49

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

# Test source

```ts
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
  136 |         const zip = new AdmZip(standard), source = JSON.parse(zip.readAsText('state.json')) as NexusDriverState;
  137 |         let variante = 'output/campagnes-tests/coc/COC-2.0.0-option-3d6.gmos-driver';
  138 |         if (jeu === 'shadowrun-anarchy') {
  139 |             const copie = structuredClone(source);
  140 |             copie.gameDriver.jet!.shadowrun!.risqueAlternatif = true;
  141 |             zip.updateFile('state.json', Buffer.from(JSON.stringify(copie)));
  142 |             variante = path.join(g.profil, 'fixture-shadowrun-alternatif.gmos-driver'); zip.writeZip(variante);
  143 |         }
  144 |         const config = () => f.evaluate(id => {
  145 |             const p = (window as unknown as Fenetre).useSessionOSStore.getState().customGameDrivers.find(p => p.id === id);
  146 |             return p && { des: p.dice.defaultDice, alternatif: !!p.jet?.shadowrun?.risqueAlternatif };
  147 |         }, source.gameDriver.id);
  148 |         const base = { des: source.gameDriver.dice.defaultDice, alternatif: false };
  149 |         const option = { des: jeu === 'coc' ? '3d6' : base.des, alternatif: jeu !== 'coc' };
  150 |         await importer(g, standard, config, base);
  151 |         // Les valeurs de personnage survivent aux remplacements du pilote, y compris zéro/faux et notes.
  152 |         const fiche = source.sheetTemplate!;
  153 |         await f.evaluate(({ pilote, fiche }) => {
  154 |             const s = (window as unknown as Fenetre).useSessionOSStore;
  155 |             const valeurs = Object.fromEntries(fiche.sections.flatMap(s => s.fields).map(c => [c.id, c.defaultValue]));
  156 |             s.setState({ campaigns: [{ id: 'camp-npc3', name: 'Campagne fictive NP-C3', system: pilote.id, activeLocationIds: [] }],
  157 |                 players: [{ id: 'j-npc3', realName: 'Joueur fictif', avatarUrl: '', isOnline: false, characters: [{
  158 |                     id: 'pj-npc3', name: 'PJ fictif NP-C3', campaignId: 'camp-npc3', systemId: pilote.id, templateId: fiche.id,
  159 |                     portraitUrl: '', hp: 4, maxHp: 10, playerNotes: 'NOTE CONSERVÉE', sheetData: {
  160 |                         ...valeurs, agilite: 2, competence_1: 4, logique: 3, competence_1_rr: 2, npc3_zero: 0, npc3_faux: false,
  161 |                     },
  162 |                 }] }], activeCampaignId: 'camp-npc3' });
  163 |         }, { pilote: source.gameDriver, fiche });
  164 |         const avant = await personne(f, 'pj-npc3');
  165 |         for (const [phase, fichier, attendu] of [['variante', variante, option], ['standard', standard, base]] as const) {
  166 |             await importer(g, fichier, config, attendu, true);
  167 |             expect(await personne(f, 'pj-npc3')).toEqual(avant);
  168 |             await f.evaluate(() => {
  169 |                 const s = (window as unknown as Fenetre).useSessionOSStore.getState();
  170 |                 s.setSelectedPlayer('j-npc3'); s.setSelectedCharacter('pj-npc3'); s.setCurrentView('players');
  171 |             });
  172 |             await ongletDeLaFiche(f, 'Lancer un test');
  173 |             const panneau = f.locator('[data-panneau-de-jet]').first();
  174 |             await panneau.locator('select').nth(0).selectOption(jeu === 'coc' ? 'agilite' : 'competence_1');
  175 |             if (jeu !== 'coc') await panneau.locator('select').nth(1).selectOption('logique');
  176 |             if (jeu === 'coc') await expect(panneau).toContainText(phase === 'variante' ? '3d6' : '1d20');
  177 |             else {
  178 |                 const preparation = panneau.locator('[data-preparation-shadowrun]');
  179 |                 await expect(preparation).toBeVisible();
  180 |                 if (phase === 'variante') await expect(preparation).toContainText('règle de risque alternative');
  181 |                 else await expect(preparation.getByLabel('Dés de risque', { exact: true })).toBeVisible();
  182 |             }
  183 |             await panneau.screenshot({ path: path.join(sortie, `${jeu}-${phase}.jpg`), type: 'jpeg', quality: 85, scale: 'css' });
  184 |             const n = await f.evaluate(() => (window as unknown as Fenetre).useDiceStore.getState().history.length);
  185 |             await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
> 186 |             await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useDiceStore.getState().history.length)).toBeGreaterThan(n);
      |                                                                                                                              ^ Error: expect(received).toBeGreaterThan(expected)
  187 |         }
  188 |         await f.reload(); await attendreLHydratation(g); expect(await config()).toEqual(base);
  189 |         fs.writeFileSync(path.join(sortie, `${jeu}-variantes.json`), JSON.stringify({ jeu, importVariante: true, retourStandard: true,
  190 |             personnagesConserves: true, jetsEffectues: 2, persistance: true, fixtureAlternativeTemporaire: jeu !== 'coc' }, null, 2) + '\n');
  191 |     } finally { await g.fermer(); }
  192 | });
  193 | 
```