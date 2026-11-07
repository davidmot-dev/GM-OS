# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reprisesEtVariantesDesPilotes.spec.ts >> coc : importe la variante puis revient au standard
- Location: e2e\reprisesEtVariantesDesPilotes.spec.ts:130:49

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
  87  |     test.setTimeout(180_000);
  88  |     const g = await lancerGmOs(), f = g.fenetre;
  89  |     let socket: WebSocket | undefined;
  90  |     try {
  91  |         await preparer(g);
  92  |         await importer(g, `output/campagnes-tests/${lot.jeu}/${lot.archive}`,
  93  |             () => f.evaluate(() => (window as unknown as Fenetre).useSessionOSStore.getState().activeCampaignId), lot.campagne, false, true);
  94  |         const joueurs = await f.evaluate(campagne => (window as unknown as Fenetre).useSessionOSStore.getState().players
  95  |             .map(p => ({ id: p.id, personnage: p.characters.find(c => c.campaignId === campagne)! })).filter(p => p.personnage), lot.campagne);
  96  |         const [a, b] = joueurs; expect(joueurs).toHaveLength(3);
  97  |         const avant = await personne(f, b.personnage.id);
  98  |         socket = new WebSocket(`ws://127.0.0.1:${g.ports.sync}`);
  99  |         const ws = socket;
  100 |         await new Promise<void>((resolve, reject) => {
  101 |             ws.once('error', reject);
  102 |             ws.on('message', brut => { if (JSON.parse(String(brut)).type === 'remote:registered') resolve(); });
  103 |             ws.once('open', () => ws.send(JSON.stringify({ type: 'remote:register', payload: {
  104 |                 deviceId: `npc3-${lot.jeu}`, pseudo: 'Client fictif NP-C3', role: 'hub', characterId: a.personnage.id,
  105 |             } })));
  106 |         });
  107 |         const envoyer = (type: string, characterId: string, playerId: string, updates: object) => ws.send(JSON.stringify({ type, payload: { playerId, characterId, updates } }));
  108 |         envoyer('session:update-character-sheet-data', b.personnage.id, b.id, { sheetData: { npc3_intrusion: 999 } });
  109 |         envoyer('session:update-character-narrative', b.personnage.id, b.id, { description: 'INTRUSION', playerNotes: 'INTRUSION', inventory: 'INTRUSION' });
  110 |         envoyer('session:update-character-vitals', b.personnage.id, b.id, { hp: 0 });
  111 |         // Alias privilégié : un joueur ne doit pas contourner la politique en changeant le type.
  112 |         envoyer('remote:session:update-character-sheet-data', b.personnage.id, b.id, { sheetData: { npc3_alias: 999 } });
  113 |         envoyer('session:update-character-narrative', a.personnage.id, a.id, { gmNotes: 'INTRUSION', playerNotes: 'NOTE AUTORISÉE' });
  114 |         envoyer('session:update-character-sheet-data', a.personnage.id, a.id, { sheetData: { npc3_barriere: 'AUTORISÉ' } });
  115 |         // La propre écriture clôt la série : même socket, ordre de livraison, aucun délai aveugle.
  116 |         await expect.poll(async () => (await personne(f, a.personnage.id)).sheetData.npc3_barriere).toBe('AUTORISÉ');
  117 |         await expect.poll(async () => (await personne(f, a.personnage.id)).playerNotes).toBe('NOTE AUTORISÉE');
  118 |         expect(await personne(f, b.personnage.id)).toEqual(avant);
  119 |         expect((await personne(f, a.personnage.id)).gmNotes).toBe(a.personnage.gmNotes);
  120 |         await f.reload(); await attendreLHydratation(g);
  121 |         expect(await personne(f, b.personnage.id)).toEqual(avant);
  122 |         expect((await personne(f, a.personnage.id)).sheetData.npc3_barriere).toBe('AUTORISÉ');
  123 |         fs.writeFileSync(path.join(sortie, `${lot.jeu}-droits.json`), JSON.stringify({ jeu: lot.jeu,
  124 |             refus: ['sheetData', 'narratif', 'PV', 'alias'], ecriturePropre: true, notesMJProtegees: true,
  125 |             persistanceApresRechargement: true, donneesPersonnelles: false }, null, 2) + '\n');
  126 |         await essayerLaReprise(g, a.id, a.personnage.id, lot.jeu);
  127 |     } finally { socket?.close(); await g.fermer(); }
  128 | });
  129 | 
  130 | for (const jeu of ['coc', 'shadowrun-anarchy']) test(`${jeu} : importe la variante puis revient au standard`, async () => {
  131 |     test.setTimeout(180_000);
  132 |     const g = await lancerGmOs(), f = g.fenetre;
  133 |     try {
  134 |         await preparer(g);
  135 |         const standard = jeu === 'coc' ? 'output/campagnes-tests/coc/COC-2.0.0-d20.gmos-driver'
  136 |             : 'output/campagnes-tests/shadowrun-anarchy/Shadowrun-Anarchy-2.0.0.gmos-driver';
  137 |         const zip = new AdmZip(standard), source = JSON.parse(zip.readAsText('state.json')) as NexusDriverState;
  138 |         let variante = 'output/campagnes-tests/coc/COC-2.0.0-option-3d6.gmos-driver';
  139 |         if (jeu === 'shadowrun-anarchy') {
  140 |             const copie = structuredClone(source);
  141 |             copie.gameDriver.jet!.shadowrun!.risqueAlternatif = true;
  142 |             zip.updateFile('state.json', Buffer.from(JSON.stringify(copie)));
  143 |             variante = path.join(g.profil, 'fixture-shadowrun-alternatif.gmos-driver'); zip.writeZip(variante);
  144 |         }
  145 |         const config = () => f.evaluate(id => {
  146 |             const p = (window as unknown as Fenetre).useSessionOSStore.getState().customGameDrivers.find(p => p.id === id);
  147 |             return p && { des: p.dice.defaultDice, alternatif: !!p.jet?.shadowrun?.risqueAlternatif };
  148 |         }, source.gameDriver.id);
  149 |         const base = { des: source.gameDriver.dice.defaultDice, alternatif: false };
  150 |         const option = { des: jeu === 'coc' ? '3d6' : base.des, alternatif: jeu !== 'coc' };
  151 |         await importer(g, standard, config, base);
  152 |         // Les valeurs de personnage survivent aux remplacements du pilote, y compris zéro/faux et notes.
  153 |         const fiche = source.sheetTemplate!;
  154 |         await f.evaluate(({ pilote, fiche }) => {
  155 |             const s = (window as unknown as Fenetre).useSessionOSStore;
  156 |             const valeurs = Object.fromEntries(fiche.sections.flatMap(s => s.fields).map(c => [c.id, c.defaultValue]));
  157 |             s.setState({ campaigns: [{ id: 'camp-npc3', name: 'Campagne fictive NP-C3', system: pilote.id, activeLocationIds: [] }],
  158 |                 players: [{ id: 'j-npc3', realName: 'Joueur fictif', avatarUrl: '', isOnline: false, characters: [{
  159 |                     id: 'pj-npc3', name: 'PJ fictif NP-C3', campaignId: 'camp-npc3', systemId: pilote.id, templateId: fiche.id,
  160 |                     portraitUrl: '', hp: 4, maxHp: 10, playerNotes: 'NOTE CONSERVÉE', sheetData: {
  161 |                         ...valeurs, agilite: 2, competence_1: 4, logique: 3, competence_1_rr: 2, npc3_zero: 0, npc3_faux: false,
  162 |                     },
  163 |                 }] }], activeCampaignId: 'camp-npc3' });
  164 |         }, { pilote: source.gameDriver, fiche });
  165 |         const avant = await personne(f, 'pj-npc3');
  166 |         for (const [phase, fichier, attendu] of [['variante', variante, option], ['standard', standard, base]] as const) {
  167 |             await importer(g, fichier, config, attendu, true);
  168 |             expect(await personne(f, 'pj-npc3')).toEqual(avant);
  169 |             await f.evaluate(() => {
  170 |                 const s = (window as unknown as Fenetre).useSessionOSStore.getState();
  171 |                 s.setSelectedPlayer('j-npc3'); s.setSelectedCharacter('pj-npc3'); s.setCurrentView('players');
  172 |             });
  173 |             await ongletDeLaFiche(f, 'Lancer un test');
  174 |             const panneau = f.locator('[data-panneau-de-jet]').first();
  175 |             await panneau.locator('select').nth(0).selectOption(jeu === 'coc' ? 'agilite' : 'competence_1');
  176 |             if (jeu !== 'coc') await panneau.locator('select').nth(1).selectOption('logique');
  177 |             if (jeu === 'coc') await expect(panneau).toContainText(phase === 'variante' ? '3d6' : '1d20');
  178 |             else {
  179 |                 const preparation = panneau.locator('[data-preparation-shadowrun]');
  180 |                 await expect(preparation).toBeVisible();
  181 |                 if (phase === 'variante') await expect(preparation).toContainText('règle de risque alternative');
  182 |                 else await expect(preparation.getByLabel('Dés de risque', { exact: true })).toBeVisible();
  183 |             }
  184 |             await panneau.screenshot({ path: path.join(sortie, `${jeu}-${phase}.jpg`), type: 'jpeg', quality: 85, scale: 'css' });
  185 |             const n = await f.evaluate(() => (window as unknown as Fenetre).useDiceStore.getState().history.length);
  186 |             await panneau.getByRole('button', { name: 'Lancer', exact: true }).click();
> 187 |             await expect.poll(() => f.evaluate(() => (window as unknown as Fenetre).useDiceStore.getState().history.length)).toBeGreaterThan(n);
      |                                                                                                                              ^ Error: expect(received).toBeGreaterThan(expected)
  188 |         }
  189 |         await f.reload(); await attendreLHydratation(g); expect(await config()).toEqual(base);
  190 |         fs.writeFileSync(path.join(sortie, `${jeu}-variantes.json`), JSON.stringify({ jeu, importVariante: true, retourStandard: true,
  191 |             personnagesConserves: true, jetsEffectues: 2, persistance: true, fixtureAlternativeTemporaire: jeu !== 'coc' }, null, 2) + '\n');
  192 |     } finally { await g.fermer(); }
  193 | });
  194 | 
```