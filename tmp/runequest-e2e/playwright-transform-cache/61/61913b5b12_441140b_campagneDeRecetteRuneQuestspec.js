// 042ef72523f1061ead7f4e8f33ebc140e02fba0b
import { test, expect, chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lancerGmOs, attendreLHydratation, ouvrirLeModule, ongletDeLaFiche } from './lancerGmOs';
import { PORT_FICHES_PAR_DEFAUT } from '../electron/portsDeGmOs';
const SORTIE = path.resolve('output/campagnes-tests/runequest');
const C = 'recette-rq-campagne-bornes';
const captures = path.join(SORTIE, 'captures');
test('les trois archives RuneQuest et les fiches fonctionnent sur trois Hub', async () => {
  test.setTimeout(240000);
  fs.mkdirSync(captures, {
    recursive: true
  });
  const gmos = await lancerGmOs({
    preparerLeProfil: profil => {
      fs.mkdirSync(path.join(profil, 'corpus', 'fiches'), {
        recursive: true
      });
      fs.copyFileSync('docs/fiches/Character_Sheet_Manager.html', path.join(profil, 'corpus', 'fiches', 'Character_Sheet_Manager.html'));
      fs.cpSync('docs/systems/runequest/fiche', path.join(profil, 'corpus', 'systems', 'runequest', 'fiche'), {
        recursive: true
      });
    }
  });
  const f = gmos.fenetre;
  f.on('console', message => {
    if (message.type() === 'error') console.error('[RuneQuest renderer]', message.text());
  });
  f.on('pageerror', erreur => console.error('[RuneQuest page]', erreur.message));
  f.setDefaultTimeout(15000);
  const fuites = new Set();
  const releverSecrets = (valeur, chemin = '') => {
    if (typeof valeur === 'string' && valeur.includes('SECRET_MJ_RQ_RECETTE')) fuites.add(chemin);else if (valeur && typeof valeur === 'object') for (const [cle, v] of Object.entries(valeur)) releverSecrets(v, chemin ? `${chemin}.${cle}` : cle);
  };
  const image = async (p, nom) => p.screenshot({
    path: path.join(captures, nom + '.jpg'),
    type: 'jpeg',
    quality: 80,
    animations: 'disabled',
    scale: 'css'
  });
  try {
    await attendreLHydratation(gmos);
    await ouvrirLeModule(gmos, 'Tableau de Bord');
    // Profils et anciens PJ fictifs : mêmes identifiants que l'export fourni par David.
    // Le vrai export RDD ne quitte pas le dépôt et n'est jamais injecté dans les essais.
    const preexistants = ['Thomas D.', 'Marie C.', 'Lucas R.'].map((realName, i) => ({
      id: `p-${i + 1}`,
      realName,
      avatarUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text x="8" y="28">${i + 1}</text></svg>`)}`,
      isOnline: false,
      characters: [{
        id: `recette-sentinelle-pj-${i + 1}`,
        name: `Ancien PJ fictif ${i + 1}`,
        classRace: 'Sentinelle',
        campaignId: 'recette-sentinelle',
        templateId: 'generic',
        hp: 7,
        maxHp: 10,
        sheetData: {
          hp: 7,
          note: 'ANCIEN PJ À CONSERVER'
        },
        playerNotes: 'NE PAS ÉCRASER'
      }]
    }));
    await f.evaluate(players => window.useSessionOSStore.setState({
      campaigns: [{
        id: 'recette-sentinelle',
        name: 'SENTINELLE — ne pas modifier',
        system: 'generic',
        activeLocationIds: []
      }],
      players,
      entities: [],
      sessions: [],
      actes: [],
      scenes: [],
      atlasMaps: [],
      clues: [],
      rencontres: [],
      activeCampaignId: null,
      currentView: 'library'
    }), preexistants);
    const verifierLesExistants = async () => {
      const existants = await f.evaluate(() => window.useSessionOSStore.getState().players.map(p => ({
        id: p.id,
        realName: p.realName,
        avatarUrl: p.avatarUrl,
        characters: p.characters.filter(c => c.campaignId === 'recette-sentinelle')
      })));
      expect(existants).toEqual(preexistants.map(p => ({
        id: p.id,
        realName: p.realName,
        avatarUrl: p.avatarUrl,
        characters: p.characters
      })));
    };
    const importer = async (fichier, campagne, remplacer = false) => {
      await gmos.application.evaluate(({
        dialog
      }, cible) => {
        dialog.showOpenDialog = async () => ({
          canceled: false,
          filePaths: [cible]
        });
      }, path.join(SORTIE, fichier));
      await f.evaluate(() => window.useSessionOSStore.getState().setCurrentView('library'));
      await f.getByRole('button', {
        name: /Importer un bundle Nexus/i
      }).click();
      await f.locator(remplacer ? '#nexus-conflict-replace' : '#nexus-import-tel-quel').click();
      await expect.poll(() => f.evaluate(() => window.useSessionOSStore.getState().activeCampaignId), {
        timeout: 45000
      }).toBe(campagne);
      const fermer = f.locator('#nexus-bilan-fermer');
      if (await fermer.isVisible()) await fermer.click();
    };
    await importer('01-Les-Bornes-du-gue.gmos', C);
    await expect(f.getByText('RECETTE RUNEQUEST — Les Bornes du gué').first()).toBeVisible();
    await image(f, '01-campagne-importee');
    await importer('02-Aptitudes-Combat-et-Sante.gmos', 'recette-rq-corps-campagne-bornes');
    await importer('03-Runes-Passions-et-Magie.gmos', 'recette-rq-runes-campagne-bornes');
    const inventaire = await f.evaluate(() => {
      const s = window.useSessionOSStore.getState();
      return {
        campagnes: s.campaigns.map(c => c.id),
        joueurs: s.players.map(p => ({
          id: p.id,
          nom: p.realName,
          personnages: p.characters.filter(c => c.campaignId !== 'recette-sentinelle').length
        })),
        pnj: s.entities.length,
        lieux: s.atlasMaps.length,
        scenes: s.scenes.length,
        indices: s.clues.length
      };
    });
    expect(inventaire.campagnes).toHaveLength(4);
    expect(inventaire.campagnes).toContain('recette-sentinelle');
    expect(inventaire.joueurs.map(p => p.id)).toEqual(['p-1', 'p-2', 'p-3']);
    expect(inventaire.joueurs.map(p => p.nom)).toEqual(['Thomas D.', 'Marie C.', 'Lucas R.']);
    expect(inventaire.joueurs.reduce((n, p) => n + p.personnages, 0)).toBe(21);
    await verifierLesExistants();
    expect(inventaire.pnj).toBe(36);
    expect(inventaire.lieux).toBe(24);
    expect(inventaire.scenes).toBe(48);
    expect(inventaire.indices).toBe(36);
    await f.evaluate(campagne => {
      const s = window.useSessionOSStore.getState();
      const c = s.players[0].characters.find(c => c.campaignId === campagne);
      s.updateCharacter(s.players[0].id, c.id, {
        playerNotes: 'TRACE ENQUÊTE À CONSERVER'
      });
      const p = s.players.find(p => p.characters.some(c => c.name.startsWith('C02')));
      s.updateCharacter(p.id, p.characters.find(c => c.name.startsWith('C02')).id, {
        playerNotes: 'LABO À EFFACER'
      });
    }, C);
    await importer('02-Aptitudes-Combat-et-Sante.gmos', 'recette-rq-corps-campagne-bornes', true);
    expect(await f.evaluate(() => window.useSessionOSStore.getState().players.flatMap(p => p.characters).find(c => c.name.startsWith('C02')).playerNotes)).not.toBe('LABO À EFFACER');
    await f.evaluate(campagne => {
      const st = window.useSessionOSStore,
        s = st.getState();
      s.setActiveCampaign(campagne);
      s.setCurrentView('trame');
      st.setState({
        sessions: s.sessions.map(se => se.campaignId === campagne && se.number === 1 ? {
          ...se,
          status: 'active'
        } : se)
      });
    }, C);
    const pcs = await f.evaluate(campagne => window.useSessionOSStore.getState().players.map(p => p.characters.find(c => c.campaignId === campagne)), C);
    expect((await f.evaluate(() => window.appBridge.modulesDuJeu.lire())).modules).toHaveLength(0);
    let jets = 0,
      pm = 0,
      localisations = 0;
    const navigateur = await chromium.launch({
      channel: 'msedge',
      args: ['--mute-audio']
    });
    try {
      for (const [i, largeur] of [360, 768, 1180].entries()) {
        const pc = pcs[i],
          contexte = await navigateur.newContext({
            viewport: {
              width: largeur,
              height: 1000
            },
            isMobile: true,
            hasTouch: true,
            serviceWorkers: 'block',
            locale: 'fr-FR'
          });
        await contexte.route('**/*', route => {
          const u = new URL(route.request().url());
          if (['blob:', 'data:'].includes(u.protocol)) return route.continue();
          if (u.hostname !== '127.0.0.1') return route.abort();
          if (u.port === String(PORT_FICHES_PAR_DEFAUT)) {
            u.port = String(gmos.ports.fiches);
            return route.continue({
              url: u.href
            });
          }
          return [String(gmos.ports.fiches), String(gmos.ports.sync)].includes(u.port) ? route.continue() : route.abort();
        });
        await contexte.addInitScript(i => localStorage.setItem('gmos-tablet-uuid', 'recette-runequest-' + i), i);
        const tablette = await contexte.newPage();
        tablette.setDefaultTimeout(15000);
        tablette.on('websocket', ws => ws.on('framereceived', trame => {
          try {
            releverSecrets(JSON.parse(String(trame.payload)));
          } catch {/* non JSON */}
        }));
        await tablette.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
        await tablette.getByRole('button', {
          name: new RegExp(pc.name)
        }).click();
        await expect(tablette.getByText('Connecté', {
          exact: true
        })).toBeVisible();
        await tablette.getByTitle('Fiche Personnage', {
          exact: true
        }).click();
        await ongletDeLaFiche(tablette, 'Lancer un test');
        const panneau = tablette.locator('[data-panneau-de-jet]').first();
        await panneau.locator('select').nth(0).selectOption('arme1');
        await expect(panneau.locator('[data-preparation-runequest]')).toBeVisible();
        const avant = await f.evaluate(() => window.useDiceStore.getState().history.length);
        await panneau.getByRole('button', {
          name: 'Lancer',
          exact: true
        }).click();
        await expect.poll(() => f.evaluate(() => window.useDiceStore.getState().history.length)).toBeGreaterThan(avant);
        jets++;
        await panneau.getByRole('button', {
          name: 'Localiser le coup (1D20)',
          exact: true
        }).click();
        await expect(panneau.locator('[data-localisation-runequest]')).toContainText('PV sur la fiche');
        localisations++;
        await ongletDeLaFiche(tablette, 'Ma fiche');
        const html = tablette.frameLocator('iframe:visible');
        await expect(html.locator('[data-key="identity.name"]')).toHaveValue(pc.name, {
          timeout: 30000
        });
        await expect(html.locator('[data-key="attributes.strength"]')).toHaveValue(String(pc.sheetData.for));
        await html.locator('[data-key="magic.current"]').fill(String(8 + i));
        await html.locator('[data-key="magic.current"]').blur();
        await expect.poll(() => f.evaluate(id => window.useSessionOSStore.getState().players.flatMap(p => p.characters).find(c => c.id === id).sheetData.points_de_magie, pc.id)).toBe(8 + i);
        pm++;
        await image(tablette, `03-fiche-joueur-${i + 1}-${largeur}`);
        expect(await tablette.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await tablette.getByTitle('Fermer la fiche', {
          exact: true
        }).click();
        await contexte.close();
      }
    } finally {
      await navigateur.close();
    }
    expect(jets).toBe(3);
    expect(pm).toBe(3);
    await f.reload();
    await attendreLHydratation(gmos);
    await verifierLesExistants();
    await expect.poll(() => f.evaluate(() => window.useSessionOSStore.getState().players.flatMap(p => p.characters).length)).toBe(24);
    expect(await f.evaluate(campagne => window.useSessionOSStore.getState().players[0].characters.find(c => c.campaignId === campagne).playerNotes, C)).toBe('TRACE ENQUÊTE À CONSERVER');
    expect(await f.evaluate(ids => window.useSessionOSStore.getState().players.flatMap(p => p.characters).filter(c => ids.includes(c.id)).map(c => c.sheetData.points_de_magie), pcs.map(c => c.id))).toEqual([8, 9, 10]);
    fs.writeFileSync(path.join(SORTIE, 'verification-electron.json'), JSON.stringify({
      reussi: fuites.size === 0,
      importNatif: true,
      remplacementIsole: true,
      reload: true,
      joueursExistantsConserves: true,
      anciensPJConserves: 3,
      joueurs: inventaire.joueurs,
      ficheHTML: true,
      pmTablettes: pm,
      localisationsTablettes: localisations,
      jetsRecusParMJ: jets,
      tablettes: [360, 768, 1180],
      modulesSpecifiques: 0,
      archives: ['01-Les-Bornes-du-gue.gmos', '02-Aptitudes-Combat-et-Sante.gmos', '03-Runes-Passions-et-Magie.gmos'].map(fichier => ({
        fichier,
        sha256: createHash('sha256').update(fs.readFileSync(path.join(SORTIE, fichier))).digest('hex')
      })),
      secretsNonDiffuses: fuites.size === 0,
      anomalies: [...fuites].map(chemin => ({
        cas: 'GM-05',
        chemin,
        attendu: 'secret absent des trames joueur',
        observe: 'marqueur secret présent'
      }))
    }, null, 2));
    expect.soft(fuites.size, 'GM-05 : secrets de séance reçus ; voir verification-electron.json').toBe(0);
  } finally {
    await gmos.fermer();
  }
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ0ZXN0IiwiZXhwZWN0IiwiY2hyb21pdW0iLCJmcyIsInBhdGgiLCJjcmVhdGVIYXNoIiwibGFuY2VyR21PcyIsImF0dGVuZHJlTEh5ZHJhdGF0aW9uIiwib3V2cmlyTGVNb2R1bGUiLCJvbmdsZXREZUxhRmljaGUiLCJQT1JUX0ZJQ0hFU19QQVJfREVGQVVUIiwiU09SVElFIiwicmVzb2x2ZSIsIkMiLCJjYXB0dXJlcyIsImpvaW4iLCJzZXRUaW1lb3V0IiwibWtkaXJTeW5jIiwicmVjdXJzaXZlIiwiZ21vcyIsInByZXBhcmVyTGVQcm9maWwiLCJwcm9maWwiLCJjb3B5RmlsZVN5bmMiLCJjcFN5bmMiLCJmIiwiZmVuZXRyZSIsIm9uIiwibWVzc2FnZSIsInR5cGUiLCJjb25zb2xlIiwiZXJyb3IiLCJ0ZXh0IiwiZXJyZXVyIiwic2V0RGVmYXVsdFRpbWVvdXQiLCJmdWl0ZXMiLCJTZXQiLCJyZWxldmVyU2VjcmV0cyIsInZhbGV1ciIsImNoZW1pbiIsImluY2x1ZGVzIiwiYWRkIiwiY2xlIiwidiIsIk9iamVjdCIsImVudHJpZXMiLCJpbWFnZSIsInAiLCJub20iLCJzY3JlZW5zaG90IiwicXVhbGl0eSIsImFuaW1hdGlvbnMiLCJzY2FsZSIsInByZWV4aXN0YW50cyIsIm1hcCIsInJlYWxOYW1lIiwiaSIsImlkIiwiYXZhdGFyVXJsIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaXNPbmxpbmUiLCJjaGFyYWN0ZXJzIiwibmFtZSIsImNsYXNzUmFjZSIsImNhbXBhaWduSWQiLCJ0ZW1wbGF0ZUlkIiwiaHAiLCJtYXhIcCIsInNoZWV0RGF0YSIsIm5vdGUiLCJwbGF5ZXJOb3RlcyIsImV2YWx1YXRlIiwicGxheWVycyIsIndpbmRvdyIsInVzZVNlc3Npb25PU1N0b3JlIiwic2V0U3RhdGUiLCJjYW1wYWlnbnMiLCJzeXN0ZW0iLCJhY3RpdmVMb2NhdGlvbklkcyIsImVudGl0aWVzIiwic2Vzc2lvbnMiLCJhY3RlcyIsInNjZW5lcyIsImF0bGFzTWFwcyIsImNsdWVzIiwicmVuY29udHJlcyIsImFjdGl2ZUNhbXBhaWduSWQiLCJjdXJyZW50VmlldyIsInZlcmlmaWVyTGVzRXhpc3RhbnRzIiwiZXhpc3RhbnRzIiwiZ2V0U3RhdGUiLCJmaWx0ZXIiLCJjIiwidG9FcXVhbCIsImltcG9ydGVyIiwiZmljaGllciIsImNhbXBhZ25lIiwicmVtcGxhY2VyIiwiYXBwbGljYXRpb24iLCJkaWFsb2ciLCJjaWJsZSIsInNob3dPcGVuRGlhbG9nIiwiY2FuY2VsZWQiLCJmaWxlUGF0aHMiLCJzZXRDdXJyZW50VmlldyIsImdldEJ5Um9sZSIsImNsaWNrIiwibG9jYXRvciIsInBvbGwiLCJ0aW1lb3V0IiwidG9CZSIsImZlcm1lciIsImlzVmlzaWJsZSIsImdldEJ5VGV4dCIsImZpcnN0IiwidG9CZVZpc2libGUiLCJpbnZlbnRhaXJlIiwicyIsImNhbXBhZ25lcyIsImpvdWV1cnMiLCJwZXJzb25uYWdlcyIsImxlbmd0aCIsInBuaiIsImxpZXV4IiwiaW5kaWNlcyIsInRvSGF2ZUxlbmd0aCIsInRvQ29udGFpbiIsInJlZHVjZSIsIm4iLCJmaW5kIiwidXBkYXRlQ2hhcmFjdGVyIiwic29tZSIsInN0YXJ0c1dpdGgiLCJmbGF0TWFwIiwibm90Iiwic3QiLCJzZXRBY3RpdmVDYW1wYWlnbiIsInNlIiwibnVtYmVyIiwic3RhdHVzIiwicGNzIiwiYXBwQnJpZGdlIiwibW9kdWxlc0R1SmV1IiwibGlyZSIsIm1vZHVsZXMiLCJqZXRzIiwicG0iLCJsb2NhbGlzYXRpb25zIiwibmF2aWdhdGV1ciIsImxhdW5jaCIsImNoYW5uZWwiLCJhcmdzIiwibGFyZ2V1ciIsInBjIiwiY29udGV4dGUiLCJuZXdDb250ZXh0Iiwidmlld3BvcnQiLCJ3aWR0aCIsImhlaWdodCIsImlzTW9iaWxlIiwiaGFzVG91Y2giLCJzZXJ2aWNlV29ya2VycyIsImxvY2FsZSIsInJvdXRlIiwidSIsIlVSTCIsInJlcXVlc3QiLCJ1cmwiLCJwcm90b2NvbCIsImNvbnRpbnVlIiwiaG9zdG5hbWUiLCJhYm9ydCIsInBvcnQiLCJTdHJpbmciLCJwb3J0cyIsImZpY2hlcyIsImhyZWYiLCJzeW5jIiwiYWRkSW5pdFNjcmlwdCIsImxvY2FsU3RvcmFnZSIsInNldEl0ZW0iLCJ0YWJsZXR0ZSIsIm5ld1BhZ2UiLCJ3cyIsInRyYW1lIiwiSlNPTiIsInBhcnNlIiwicGF5bG9hZCIsImdvdG8iLCJSZWdFeHAiLCJleGFjdCIsImdldEJ5VGl0bGUiLCJwYW5uZWF1IiwibnRoIiwic2VsZWN0T3B0aW9uIiwiYXZhbnQiLCJ1c2VEaWNlU3RvcmUiLCJoaXN0b3J5IiwidG9CZUdyZWF0ZXJUaGFuIiwidG9Db250YWluVGV4dCIsImh0bWwiLCJmcmFtZUxvY2F0b3IiLCJ0b0hhdmVWYWx1ZSIsImZvciIsImZpbGwiLCJibHVyIiwicG9pbnRzX2RlX21hZ2llIiwiZG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJzY3JvbGxXaWR0aCIsImlubmVyV2lkdGgiLCJjbG9zZSIsInJlbG9hZCIsImlkcyIsIndyaXRlRmlsZVN5bmMiLCJzdHJpbmdpZnkiLCJyZXVzc2kiLCJzaXplIiwiaW1wb3J0TmF0aWYiLCJyZW1wbGFjZW1lbnRJc29sZSIsImpvdWV1cnNFeGlzdGFudHNDb25zZXJ2ZXMiLCJhbmNpZW5zUEpDb25zZXJ2ZXMiLCJmaWNoZUhUTUwiLCJwbVRhYmxldHRlcyIsImxvY2FsaXNhdGlvbnNUYWJsZXR0ZXMiLCJqZXRzUmVjdXNQYXJNSiIsInRhYmxldHRlcyIsIm1vZHVsZXNTcGVjaWZpcXVlcyIsImFyY2hpdmVzIiwic2hhMjU2IiwidXBkYXRlIiwicmVhZEZpbGVTeW5jIiwiZGlnZXN0Iiwic2VjcmV0c05vbkRpZmZ1c2VzIiwiYW5vbWFsaWVzIiwiY2FzIiwiYXR0ZW5kdSIsIm9ic2VydmUiLCJzb2Z0Il0sInNvdXJjZXMiOlsiY2FtcGFnbmVEZVJlY2V0dGVSdW5lUXVlc3Quc3BlYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0ZXN0LCBleHBlY3QsIGNocm9taXVtLCB0eXBlIFBhZ2UgfSBmcm9tICdAcGxheXdyaWdodC90ZXN0JztcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSAnbm9kZTpjcnlwdG8nO1xuaW1wb3J0IHsgbGFuY2VyR21PcywgYXR0ZW5kcmVMSHlkcmF0YXRpb24sIG91dnJpckxlTW9kdWxlLCBvbmdsZXREZUxhRmljaGUgfSBmcm9tICcuL2xhbmNlckdtT3MnO1xuaW1wb3J0IHsgUE9SVF9GSUNIRVNfUEFSX0RFRkFVVCB9IGZyb20gJy4uL2VsZWN0cm9uL3BvcnRzRGVHbU9zJztcbmltcG9ydCB0eXBlIHsgdXNlU2Vzc2lvbk9TU3RvcmUgfSBmcm9tICcuLi9zcmMvbW9kdWxlcy9zZXNzaW9uL3VzZVNlc3Npb25PU1N0b3JlJztcbmltcG9ydCB0eXBlIHsgdXNlRGljZVN0b3JlIH0gZnJvbSAnLi4vc3JjL3N0b3Jlcy91c2VEaWNlU3RvcmUnO1xudHlwZSBGZW5ldHJlUmVjZXR0ZSA9IFdpbmRvdyAmIHsgdXNlU2Vzc2lvbk9TU3RvcmU6IHR5cGVvZiB1c2VTZXNzaW9uT1NTdG9yZTsgdXNlRGljZVN0b3JlOiB0eXBlb2YgdXNlRGljZVN0b3JlIH07XG5jb25zdCBTT1JUSUUgPSBwYXRoLnJlc29sdmUoJ291dHB1dC9jYW1wYWduZXMtdGVzdHMvcnVuZXF1ZXN0Jyk7XG5jb25zdCBDID0gJ3JlY2V0dGUtcnEtY2FtcGFnbmUtYm9ybmVzJztcbmNvbnN0IGNhcHR1cmVzID0gcGF0aC5qb2luKFNPUlRJRSwgJ2NhcHR1cmVzJyk7XG5cbnRlc3QoJ2xlcyB0cm9pcyBhcmNoaXZlcyBSdW5lUXVlc3QgZXQgbGVzIGZpY2hlcyBmb25jdGlvbm5lbnQgc3VyIHRyb2lzIEh1YicsIGFzeW5jICgpID0+IHtcbiAgICB0ZXN0LnNldFRpbWVvdXQoMjQwXzAwMCk7XG4gICAgZnMubWtkaXJTeW5jKGNhcHR1cmVzLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBnbW9zID0gYXdhaXQgbGFuY2VyR21Pcyh7IHByZXBhcmVyTGVQcm9maWw6IHByb2ZpbCA9PiB7XG4gICAgICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4ocHJvZmlsLCAnY29ycHVzJywgJ2ZpY2hlcycpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgZnMuY29weUZpbGVTeW5jKCdkb2NzL2ZpY2hlcy9DaGFyYWN0ZXJfU2hlZXRfTWFuYWdlci5odG1sJywgcGF0aC5qb2luKHByb2ZpbCwgJ2NvcnB1cycsICdmaWNoZXMnLCAnQ2hhcmFjdGVyX1NoZWV0X01hbmFnZXIuaHRtbCcpKTtcbiAgICAgICAgZnMuY3BTeW5jKCdkb2NzL3N5c3RlbXMvcnVuZXF1ZXN0L2ZpY2hlJywgcGF0aC5qb2luKHByb2ZpbCwgJ2NvcnB1cycsICdzeXN0ZW1zJywgJ3J1bmVxdWVzdCcsICdmaWNoZScpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9IH0pO1xuICAgIGNvbnN0IGYgPSBnbW9zLmZlbmV0cmU7XG4gICAgZi5vbignY29uc29sZScsIG1lc3NhZ2UgPT4geyBpZiAobWVzc2FnZS50eXBlKCkgPT09ICdlcnJvcicpIGNvbnNvbGUuZXJyb3IoJ1tSdW5lUXVlc3QgcmVuZGVyZXJdJywgbWVzc2FnZS50ZXh0KCkpOyB9KTtcbiAgICBmLm9uKCdwYWdlZXJyb3InLCBlcnJldXIgPT4gY29uc29sZS5lcnJvcignW1J1bmVRdWVzdCBwYWdlXScsIGVycmV1ci5tZXNzYWdlKSk7XG4gICAgZi5zZXREZWZhdWx0VGltZW91dCgxNV8wMDApO1xuICAgIGNvbnN0IGZ1aXRlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgIGNvbnN0IHJlbGV2ZXJTZWNyZXRzID0gKHZhbGV1cjogdW5rbm93biwgY2hlbWluID0gJycpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWxldXIgPT09ICdzdHJpbmcnICYmIHZhbGV1ci5pbmNsdWRlcygnU0VDUkVUX01KX1JRX1JFQ0VUVEUnKSkgZnVpdGVzLmFkZChjaGVtaW4pO1xuICAgICAgICBlbHNlIGlmICh2YWxldXIgJiYgdHlwZW9mIHZhbGV1ciA9PT0gJ29iamVjdCcpIGZvciAoY29uc3QgW2NsZSwgdl0gb2YgT2JqZWN0LmVudHJpZXModmFsZXVyKSkgcmVsZXZlclNlY3JldHModiwgY2hlbWluID8gYCR7Y2hlbWlufS4ke2NsZX1gIDogY2xlKTtcbiAgICB9O1xuICAgIGNvbnN0IGltYWdlID0gYXN5bmMgKHA6IFBhZ2UsIG5vbTogc3RyaW5nKSA9PiBwLnNjcmVlbnNob3QoeyBwYXRoOiBwYXRoLmpvaW4oY2FwdHVyZXMsIG5vbSArICcuanBnJyksIHR5cGU6ICdqcGVnJywgcXVhbGl0eTogODAsIGFuaW1hdGlvbnM6ICdkaXNhYmxlZCcsIHNjYWxlOiAnY3NzJyB9KTtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBhdHRlbmRyZUxIeWRyYXRhdGlvbihnbW9zKTtcbiAgICAgICAgYXdhaXQgb3V2cmlyTGVNb2R1bGUoZ21vcywgJ1RhYmxlYXUgZGUgQm9yZCcpO1xuICAgICAgICAvLyBQcm9maWxzIGV0IGFuY2llbnMgUEogZmljdGlmcyA6IG3Dqm1lcyBpZGVudGlmaWFudHMgcXVlIGwnZXhwb3J0IGZvdXJuaSBwYXIgRGF2aWQuXG4gICAgICAgIC8vIExlIHZyYWkgZXhwb3J0IFJERCBuZSBxdWl0dGUgcGFzIGxlIGTDqXDDtHQgZXQgbidlc3QgamFtYWlzIGluamVjdMOpIGRhbnMgbGVzIGVzc2Fpcy5cbiAgICAgICAgY29uc3QgcHJlZXhpc3RhbnRzID0gWydUaG9tYXMgRC4nLCAnTWFyaWUgQy4nLCAnTHVjYXMgUi4nXS5tYXAoKHJlYWxOYW1lLCBpKSA9PiAoe1xuICAgICAgICAgICAgaWQ6IGBwLSR7aSArIDF9YCwgcmVhbE5hbWUsIGF2YXRhclVybDogYGRhdGE6aW1hZ2Uvc3ZnK3htbCwke2VuY29kZVVSSUNvbXBvbmVudChgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCI0MFwiIGhlaWdodD1cIjQwXCI+PHRleHQgeD1cIjhcIiB5PVwiMjhcIj4ke2kgKyAxfTwvdGV4dD48L3N2Zz5gKX1gLCBpc09ubGluZTogZmFsc2UsXG4gICAgICAgICAgICBjaGFyYWN0ZXJzOiBbeyBpZDogYHJlY2V0dGUtc2VudGluZWxsZS1wai0ke2kgKyAxfWAsIG5hbWU6IGBBbmNpZW4gUEogZmljdGlmICR7aSArIDF9YCwgY2xhc3NSYWNlOiAnU2VudGluZWxsZScsIGNhbXBhaWduSWQ6ICdyZWNldHRlLXNlbnRpbmVsbGUnLCB0ZW1wbGF0ZUlkOiAnZ2VuZXJpYycsXG4gICAgICAgICAgICAgICAgaHA6IDcsIG1heEhwOiAxMCwgc2hlZXREYXRhOiB7IGhwOiA3LCBub3RlOiAnQU5DSUVOIFBKIMOAIENPTlNFUlZFUicgfSwgcGxheWVyTm90ZXM6ICdORSBQQVMgw4lDUkFTRVInIH1dLFxuICAgICAgICB9KSk7XG4gICAgICAgIGF3YWl0IGYuZXZhbHVhdGUocGxheWVycyA9PiAod2luZG93IGFzIHVua25vd24gYXMgRmVuZXRyZVJlY2V0dGUpLnVzZVNlc3Npb25PU1N0b3JlLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGNhbXBhaWduczogW3sgaWQ6ICdyZWNldHRlLXNlbnRpbmVsbGUnLCBuYW1lOiAnU0VOVElORUxMRSDigJQgbmUgcGFzIG1vZGlmaWVyJywgc3lzdGVtOiAnZ2VuZXJpYycsIGFjdGl2ZUxvY2F0aW9uSWRzOiBbXSB9XSxcbiAgICAgICAgICAgIHBsYXllcnMsIGVudGl0aWVzOiBbXSwgc2Vzc2lvbnM6IFtdLCBhY3RlczogW10sIHNjZW5lczogW10sIGF0bGFzTWFwczogW10sIGNsdWVzOiBbXSwgcmVuY29udHJlczogW10sIGFjdGl2ZUNhbXBhaWduSWQ6IG51bGwsIGN1cnJlbnRWaWV3OiAnbGlicmFyeScsXG4gICAgICAgIH0pLCBwcmVleGlzdGFudHMpO1xuICAgICAgICBjb25zdCB2ZXJpZmllckxlc0V4aXN0YW50cyA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0YW50cyA9IGF3YWl0IGYuZXZhbHVhdGUoKCkgPT4gKHdpbmRvdyBhcyB1bmtub3duIGFzIEZlbmV0cmVSZWNldHRlKS51c2VTZXNzaW9uT1NTdG9yZS5nZXRTdGF0ZSgpLnBsYXllcnMubWFwKHAgPT4gKHtcbiAgICAgICAgICAgICAgICBpZDogcC5pZCwgcmVhbE5hbWU6IHAucmVhbE5hbWUsIGF2YXRhclVybDogcC5hdmF0YXJVcmwsIGNoYXJhY3RlcnM6IHAuY2hhcmFjdGVycy5maWx0ZXIoYyA9PiBjLmNhbXBhaWduSWQgPT09ICdyZWNldHRlLXNlbnRpbmVsbGUnKSxcbiAgICAgICAgICAgIH0pKSk7XG4gICAgICAgICAgICBleHBlY3QoZXhpc3RhbnRzKS50b0VxdWFsKHByZWV4aXN0YW50cy5tYXAocCA9PiAoeyBpZDogcC5pZCwgcmVhbE5hbWU6IHAucmVhbE5hbWUsIGF2YXRhclVybDogcC5hdmF0YXJVcmwsIGNoYXJhY3RlcnM6IHAuY2hhcmFjdGVycyB9KSkpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBpbXBvcnRlciA9IGFzeW5jIChmaWNoaWVyOiBzdHJpbmcsIGNhbXBhZ25lOiBzdHJpbmcsIHJlbXBsYWNlciA9IGZhbHNlKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCBnbW9zLmFwcGxpY2F0aW9uLmV2YWx1YXRlKCh7IGRpYWxvZyB9LCBjaWJsZSkgPT4ge1xuICAgICAgICAgICAgICAgIGRpYWxvZy5zaG93T3BlbkRpYWxvZyA9IGFzeW5jICgpID0+ICh7IGNhbmNlbGVkOiBmYWxzZSwgZmlsZVBhdGhzOiBbY2libGVdIH0pO1xuICAgICAgICAgICAgfSwgcGF0aC5qb2luKFNPUlRJRSwgZmljaGllcikpO1xuICAgICAgICAgICAgYXdhaXQgZi5ldmFsdWF0ZSgoKSA9PiAod2luZG93IGFzIHVua25vd24gYXMgRmVuZXRyZVJlY2V0dGUpLnVzZVNlc3Npb25PU1N0b3JlLmdldFN0YXRlKCkuc2V0Q3VycmVudFZpZXcoJ2xpYnJhcnknKSk7XG4gICAgICAgICAgICBhd2FpdCBmLmdldEJ5Um9sZSgnYnV0dG9uJywgeyBuYW1lOiAvSW1wb3J0ZXIgdW4gYnVuZGxlIE5leHVzL2kgfSkuY2xpY2soKTtcbiAgICAgICAgICAgIGF3YWl0IGYubG9jYXRvcihyZW1wbGFjZXIgPyAnI25leHVzLWNvbmZsaWN0LXJlcGxhY2UnIDogJyNuZXh1cy1pbXBvcnQtdGVsLXF1ZWwnKS5jbGljaygpO1xuICAgICAgICAgICAgYXdhaXQgZXhwZWN0LnBvbGwoKCkgPT4gZi5ldmFsdWF0ZSgoKSA9PiAod2luZG93IGFzIHVua25vd24gYXMgRmVuZXRyZVJlY2V0dGUpLnVzZVNlc3Npb25PU1N0b3JlLmdldFN0YXRlKCkuYWN0aXZlQ2FtcGFpZ25JZCksIHsgdGltZW91dDogNDVfMDAwIH0pLnRvQmUoY2FtcGFnbmUpO1xuICAgICAgICAgICAgY29uc3QgZmVybWVyID0gZi5sb2NhdG9yKCcjbmV4dXMtYmlsYW4tZmVybWVyJyk7XG4gICAgICAgICAgICBpZiAoYXdhaXQgZmVybWVyLmlzVmlzaWJsZSgpKSBhd2FpdCBmZXJtZXIuY2xpY2soKTtcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgaW1wb3J0ZXIoJzAxLUxlcy1Cb3JuZXMtZHUtZ3VlLmdtb3MnLCBDKTtcbiAgICAgICAgYXdhaXQgZXhwZWN0KGYuZ2V0QnlUZXh0KCdSRUNFVFRFIFJVTkVRVUVTVCDigJQgTGVzIEJvcm5lcyBkdSBndcOpJykuZmlyc3QoKSkudG9CZVZpc2libGUoKTtcbiAgICAgICAgYXdhaXQgaW1hZ2UoZiwgJzAxLWNhbXBhZ25lLWltcG9ydGVlJyk7XG4gICAgICAgIGF3YWl0IGltcG9ydGVyKCcwMi1BcHRpdHVkZXMtQ29tYmF0LWV0LVNhbnRlLmdtb3MnLCAncmVjZXR0ZS1ycS1jb3Jwcy1jYW1wYWduZS1ib3JuZXMnKTtcbiAgICAgICAgYXdhaXQgaW1wb3J0ZXIoJzAzLVJ1bmVzLVBhc3Npb25zLWV0LU1hZ2llLmdtb3MnLCAncmVjZXR0ZS1ycS1ydW5lcy1jYW1wYWduZS1ib3JuZXMnKTtcbiAgICAgICAgY29uc3QgaW52ZW50YWlyZSA9IGF3YWl0IGYuZXZhbHVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcyA9ICh3aW5kb3cgYXMgdW5rbm93biBhcyBGZW5ldHJlUmVjZXR0ZSkudXNlU2Vzc2lvbk9TU3RvcmUuZ2V0U3RhdGUoKTtcbiAgICAgICAgICAgIHJldHVybiB7IGNhbXBhZ25lczogcy5jYW1wYWlnbnMubWFwKGMgPT4gYy5pZCksIGpvdWV1cnM6IHMucGxheWVycy5tYXAocCA9PiAoeyBpZDogcC5pZCwgbm9tOiBwLnJlYWxOYW1lLCBwZXJzb25uYWdlczogcC5jaGFyYWN0ZXJzLmZpbHRlcihjID0+IGMuY2FtcGFpZ25JZCAhPT0gJ3JlY2V0dGUtc2VudGluZWxsZScpLmxlbmd0aCB9KSksXG4gICAgICAgICAgICAgICAgcG5qOiBzLmVudGl0aWVzLmxlbmd0aCwgbGlldXg6IHMuYXRsYXNNYXBzLmxlbmd0aCwgc2NlbmVzOiBzLnNjZW5lcy5sZW5ndGgsIGluZGljZXM6IHMuY2x1ZXMubGVuZ3RoIH07XG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QoaW52ZW50YWlyZS5jYW1wYWduZXMpLnRvSGF2ZUxlbmd0aCg0KTsgZXhwZWN0KGludmVudGFpcmUuY2FtcGFnbmVzKS50b0NvbnRhaW4oJ3JlY2V0dGUtc2VudGluZWxsZScpO1xuICAgICAgICBleHBlY3QoaW52ZW50YWlyZS5qb3VldXJzLm1hcChwID0+IHAuaWQpKS50b0VxdWFsKFsncC0xJywgJ3AtMicsICdwLTMnXSk7XG4gICAgICAgIGV4cGVjdChpbnZlbnRhaXJlLmpvdWV1cnMubWFwKHAgPT4gcC5ub20pKS50b0VxdWFsKFsnVGhvbWFzIEQuJywgJ01hcmllIEMuJywgJ0x1Y2FzIFIuJ10pO1xuICAgICAgICBleHBlY3QoaW52ZW50YWlyZS5qb3VldXJzLnJlZHVjZSgobiwgcCkgPT4gbiArIHAucGVyc29ubmFnZXMsIDApKS50b0JlKDIxKTtcbiAgICAgICAgYXdhaXQgdmVyaWZpZXJMZXNFeGlzdGFudHMoKTtcbiAgICAgICAgZXhwZWN0KGludmVudGFpcmUucG5qKS50b0JlKDM2KTsgZXhwZWN0KGludmVudGFpcmUubGlldXgpLnRvQmUoMjQpOyBleHBlY3QoaW52ZW50YWlyZS5zY2VuZXMpLnRvQmUoNDgpOyBleHBlY3QoaW52ZW50YWlyZS5pbmRpY2VzKS50b0JlKDM2KTtcbiAgICAgICAgYXdhaXQgZi5ldmFsdWF0ZShjYW1wYWduZT0+e2NvbnN0IHM9KHdpbmRvdyBhcyB1bmtub3duIGFzIEZlbmV0cmVSZWNldHRlKS51c2VTZXNzaW9uT1NTdG9yZS5nZXRTdGF0ZSgpO2NvbnN0IGM9cy5wbGF5ZXJzWzBdLmNoYXJhY3RlcnMuZmluZChjPT5jLmNhbXBhaWduSWQ9PT1jYW1wYWduZSkhO3MudXBkYXRlQ2hhcmFjdGVyKHMucGxheWVyc1swXS5pZCxjLmlkLHtwbGF5ZXJOb3RlczonVFJBQ0UgRU5RVcOKVEUgw4AgQ09OU0VSVkVSJ30pO2NvbnN0IHA9cy5wbGF5ZXJzLmZpbmQocD0+cC5jaGFyYWN0ZXJzLnNvbWUoYz0+Yy5uYW1lLnN0YXJ0c1dpdGgoJ0MwMicpKSkhO3MudXBkYXRlQ2hhcmFjdGVyKHAuaWQscC5jaGFyYWN0ZXJzLmZpbmQoYz0+Yy5uYW1lLnN0YXJ0c1dpdGgoJ0MwMicpKSEuaWQse3BsYXllck5vdGVzOidMQUJPIMOAIEVGRkFDRVInfSk7fSxDKTtcbiAgICAgICAgYXdhaXQgaW1wb3J0ZXIoJzAyLUFwdGl0dWRlcy1Db21iYXQtZXQtU2FudGUuZ21vcycsJ3JlY2V0dGUtcnEtY29ycHMtY2FtcGFnbmUtYm9ybmVzJyx0cnVlKTtcbiAgICAgICAgZXhwZWN0KGF3YWl0IGYuZXZhbHVhdGUoKCk9Pih3aW5kb3cgYXMgdW5rbm93biBhcyBGZW5ldHJlUmVjZXR0ZSkudXNlU2Vzc2lvbk9TU3RvcmUuZ2V0U3RhdGUoKS5wbGF5ZXJzLmZsYXRNYXAocD0+cC5jaGFyYWN0ZXJzKS5maW5kKGM9PmMubmFtZS5zdGFydHNXaXRoKCdDMDInKSkhLnBsYXllck5vdGVzKSkubm90LnRvQmUoJ0xBQk8gw4AgRUZGQUNFUicpO1xuICAgICAgICBhd2FpdCBmLmV2YWx1YXRlKGNhbXBhZ25lPT57Y29uc3Qgc3Q9KHdpbmRvdyBhcyB1bmtub3duIGFzIEZlbmV0cmVSZWNldHRlKS51c2VTZXNzaW9uT1NTdG9yZSxzPXN0LmdldFN0YXRlKCk7cy5zZXRBY3RpdmVDYW1wYWlnbihjYW1wYWduZSk7cy5zZXRDdXJyZW50VmlldygndHJhbWUnKTtzdC5zZXRTdGF0ZSh7c2Vzc2lvbnM6cy5zZXNzaW9ucy5tYXAoc2U9PnNlLmNhbXBhaWduSWQ9PT1jYW1wYWduZSYmc2UubnVtYmVyPT09MT97Li4uc2Usc3RhdHVzOidhY3RpdmUnIGFzIGNvbnN0fTpzZSl9KTt9LEMpO1xuICAgICAgICBjb25zdCBwY3M9YXdhaXQgZi5ldmFsdWF0ZShjYW1wYWduZT0+KHdpbmRvdyBhcyB1bmtub3duIGFzIEZlbmV0cmVSZWNldHRlKS51c2VTZXNzaW9uT1NTdG9yZS5nZXRTdGF0ZSgpLnBsYXllcnMubWFwKHA9PnAuY2hhcmFjdGVycy5maW5kKGM9PmMuY2FtcGFpZ25JZD09PWNhbXBhZ25lKSEpLEMpO1xuICAgICAgICBleHBlY3QoKGF3YWl0IGYuZXZhbHVhdGUoKCk9PndpbmRvdy5hcHBCcmlkZ2UhLm1vZHVsZXNEdUpldSEubGlyZSgpKSkubW9kdWxlcykudG9IYXZlTGVuZ3RoKDApO1xuICAgICAgICBsZXQgamV0cz0wLHBtPTAsbG9jYWxpc2F0aW9ucz0wO2NvbnN0IG5hdmlnYXRldXI9YXdhaXQgY2hyb21pdW0ubGF1bmNoKHtjaGFubmVsOidtc2VkZ2UnLGFyZ3M6WyctLW11dGUtYXVkaW8nXX0pO1xuICAgICAgICB0cnl7Zm9yKGNvbnN0IFtpLGxhcmdldXJdb2YgWzM2MCw3NjgsMTE4MF0uZW50cmllcygpKXtcbiAgICAgICAgICAgIGNvbnN0IHBjPXBjc1tpXSxjb250ZXh0ZT1hd2FpdCBuYXZpZ2F0ZXVyLm5ld0NvbnRleHQoe3ZpZXdwb3J0Ont3aWR0aDpsYXJnZXVyLGhlaWdodDoxMDAwfSxpc01vYmlsZTp0cnVlLGhhc1RvdWNoOnRydWUsc2VydmljZVdvcmtlcnM6J2Jsb2NrJyxsb2NhbGU6J2ZyLUZSJ30pO1xuICAgICAgICAgICAgYXdhaXQgY29udGV4dGUucm91dGUoJyoqLyonLHJvdXRlPT57Y29uc3QgdT1uZXcgVVJMKHJvdXRlLnJlcXVlc3QoKS51cmwoKSk7aWYoWydibG9iOicsJ2RhdGE6J10uaW5jbHVkZXModS5wcm90b2NvbCkpcmV0dXJuIHJvdXRlLmNvbnRpbnVlKCk7aWYodS5ob3N0bmFtZSE9PScxMjcuMC4wLjEnKXJldHVybiByb3V0ZS5hYm9ydCgpO2lmKHUucG9ydD09PVN0cmluZyhQT1JUX0ZJQ0hFU19QQVJfREVGQVVUKSl7dS5wb3J0PVN0cmluZyhnbW9zLnBvcnRzLmZpY2hlcyk7cmV0dXJuIHJvdXRlLmNvbnRpbnVlKHt1cmw6dS5ocmVmfSk7fXJldHVybiBbU3RyaW5nKGdtb3MucG9ydHMuZmljaGVzKSxTdHJpbmcoZ21vcy5wb3J0cy5zeW5jKV0uaW5jbHVkZXModS5wb3J0KT9yb3V0ZS5jb250aW51ZSgpOnJvdXRlLmFib3J0KCk7fSk7XG4gICAgICAgICAgICBhd2FpdCBjb250ZXh0ZS5hZGRJbml0U2NyaXB0KGk9PmxvY2FsU3RvcmFnZS5zZXRJdGVtKCdnbW9zLXRhYmxldC11dWlkJywncmVjZXR0ZS1ydW5lcXVlc3QtJytpKSxpKTtcbiAgICAgICAgICAgIGNvbnN0IHRhYmxldHRlPWF3YWl0IGNvbnRleHRlLm5ld1BhZ2UoKTt0YWJsZXR0ZS5zZXREZWZhdWx0VGltZW91dCgxNV8wMDApO1xuICAgICAgICAgICAgdGFibGV0dGUub24oJ3dlYnNvY2tldCcsd3M9PndzLm9uKCdmcmFtZXJlY2VpdmVkJyx0cmFtZT0+e3RyeXtyZWxldmVyU2VjcmV0cyhKU09OLnBhcnNlKFN0cmluZyh0cmFtZS5wYXlsb2FkKSkpO31jYXRjaHsvKiBub24gSlNPTiAqL319KSk7XG4gICAgICAgICAgICBhd2FpdCB0YWJsZXR0ZS5nb3RvKGBodHRwOi8vMTI3LjAuMC4xOiR7Z21vcy5wb3J0cy5zeW5jfS8/d2luZG93PXRhYmxldCZzeW5jPSR7Z21vcy5wb3J0cy5zeW5jfWApO1xuICAgICAgICAgICAgYXdhaXQgdGFibGV0dGUuZ2V0QnlSb2xlKCdidXR0b24nLHtuYW1lOm5ldyBSZWdFeHAocGMubmFtZSl9KS5jbGljaygpO2F3YWl0IGV4cGVjdCh0YWJsZXR0ZS5nZXRCeVRleHQoJ0Nvbm5lY3TDqScse2V4YWN0OnRydWV9KSkudG9CZVZpc2libGUoKTtcbiAgICAgICAgICAgIGF3YWl0IHRhYmxldHRlLmdldEJ5VGl0bGUoJ0ZpY2hlIFBlcnNvbm5hZ2UnLHtleGFjdDp0cnVlfSkuY2xpY2soKTthd2FpdCBvbmdsZXREZUxhRmljaGUodGFibGV0dGUsJ0xhbmNlciB1biB0ZXN0Jyk7XG4gICAgICAgICAgICBjb25zdCBwYW5uZWF1PXRhYmxldHRlLmxvY2F0b3IoJ1tkYXRhLXBhbm5lYXUtZGUtamV0XScpLmZpcnN0KCk7YXdhaXQgcGFubmVhdS5sb2NhdG9yKCdzZWxlY3QnKS5udGgoMCkuc2VsZWN0T3B0aW9uKCdhcm1lMScpO2F3YWl0IGV4cGVjdChwYW5uZWF1LmxvY2F0b3IoJ1tkYXRhLXByZXBhcmF0aW9uLXJ1bmVxdWVzdF0nKSkudG9CZVZpc2libGUoKTtcbiAgICAgICAgICAgIGNvbnN0IGF2YW50PWF3YWl0IGYuZXZhbHVhdGUoKCk9Pih3aW5kb3cgYXMgdW5rbm93biBhcyBGZW5ldHJlUmVjZXR0ZSkudXNlRGljZVN0b3JlLmdldFN0YXRlKCkuaGlzdG9yeS5sZW5ndGgpO2F3YWl0IHBhbm5lYXUuZ2V0QnlSb2xlKCdidXR0b24nLHtuYW1lOidMYW5jZXInLGV4YWN0OnRydWV9KS5jbGljaygpO1xuICAgICAgICAgICAgYXdhaXQgZXhwZWN0LnBvbGwoKCk9PmYuZXZhbHVhdGUoKCk9Pih3aW5kb3cgYXMgdW5rbm93biBhcyBGZW5ldHJlUmVjZXR0ZSkudXNlRGljZVN0b3JlLmdldFN0YXRlKCkuaGlzdG9yeS5sZW5ndGgpKS50b0JlR3JlYXRlclRoYW4oYXZhbnQpO2pldHMrKzthd2FpdCBwYW5uZWF1LmdldEJ5Um9sZSgnYnV0dG9uJyx7bmFtZTonTG9jYWxpc2VyIGxlIGNvdXAgKDFEMjApJyxleGFjdDp0cnVlfSkuY2xpY2soKTthd2FpdCBleHBlY3QocGFubmVhdS5sb2NhdG9yKCdbZGF0YS1sb2NhbGlzYXRpb24tcnVuZXF1ZXN0XScpKS50b0NvbnRhaW5UZXh0KCdQViBzdXIgbGEgZmljaGUnKTtsb2NhbGlzYXRpb25zKys7XG4gICAgICAgICAgICBhd2FpdCBvbmdsZXREZUxhRmljaGUodGFibGV0dGUsJ01hIGZpY2hlJyk7Y29uc3QgaHRtbD10YWJsZXR0ZS5mcmFtZUxvY2F0b3IoJ2lmcmFtZTp2aXNpYmxlJyk7XG4gICAgICAgICAgICBhd2FpdCBleHBlY3QoaHRtbC5sb2NhdG9yKCdbZGF0YS1rZXk9XCJpZGVudGl0eS5uYW1lXCJdJykpLnRvSGF2ZVZhbHVlKHBjLm5hbWUse3RpbWVvdXQ6MzBfMDAwfSk7YXdhaXQgZXhwZWN0KGh0bWwubG9jYXRvcignW2RhdGEta2V5PVwiYXR0cmlidXRlcy5zdHJlbmd0aFwiXScpKS50b0hhdmVWYWx1ZShTdHJpbmcocGMuc2hlZXREYXRhLmZvcikpO1xuICAgICAgICAgICAgYXdhaXQgaHRtbC5sb2NhdG9yKCdbZGF0YS1rZXk9XCJtYWdpYy5jdXJyZW50XCJdJykuZmlsbChTdHJpbmcoOCtpKSk7YXdhaXQgaHRtbC5sb2NhdG9yKCdbZGF0YS1rZXk9XCJtYWdpYy5jdXJyZW50XCJdJykuYmx1cigpO1xuICAgICAgICAgICAgYXdhaXQgZXhwZWN0LnBvbGwoKCk9PmYuZXZhbHVhdGUoaWQ9Pih3aW5kb3cgYXMgdW5rbm93biBhcyBGZW5ldHJlUmVjZXR0ZSkudXNlU2Vzc2lvbk9TU3RvcmUuZ2V0U3RhdGUoKS5wbGF5ZXJzLmZsYXRNYXAocD0+cC5jaGFyYWN0ZXJzKS5maW5kKGM9PmMuaWQ9PT1pZCkhLnNoZWV0RGF0YS5wb2ludHNfZGVfbWFnaWUscGMuaWQpKS50b0JlKDgraSk7cG0rKztcbiAgICAgICAgICAgIGF3YWl0IGltYWdlKHRhYmxldHRlLGAwMy1maWNoZS1qb3VldXItJHtpKzF9LSR7bGFyZ2V1cn1gKTtcbiAgICAgICAgICAgIGV4cGVjdChhd2FpdCB0YWJsZXR0ZS5ldmFsdWF0ZSgoKT0+ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoPD1pbm5lcldpZHRoKSkudG9CZSh0cnVlKTthd2FpdCB0YWJsZXR0ZS5nZXRCeVRpdGxlKCdGZXJtZXIgbGEgZmljaGUnLHtleGFjdDp0cnVlfSkuY2xpY2soKTthd2FpdCBjb250ZXh0ZS5jbG9zZSgpO1xuICAgICAgICB9fWZpbmFsbHl7YXdhaXQgbmF2aWdhdGV1ci5jbG9zZSgpO31cbiAgICAgICAgZXhwZWN0KGpldHMpLnRvQmUoMyk7ZXhwZWN0KHBtKS50b0JlKDMpO1xuICAgICAgICBhd2FpdCBmLnJlbG9hZCgpO2F3YWl0IGF0dGVuZHJlTEh5ZHJhdGF0aW9uKGdtb3MpO2F3YWl0IHZlcmlmaWVyTGVzRXhpc3RhbnRzKCk7XG4gICAgICAgIGF3YWl0IGV4cGVjdC5wb2xsKCgpPT5mLmV2YWx1YXRlKCgpPT4od2luZG93IGFzIHVua25vd24gYXMgRmVuZXRyZVJlY2V0dGUpLnVzZVNlc3Npb25PU1N0b3JlLmdldFN0YXRlKCkucGxheWVycy5mbGF0TWFwKHA9PnAuY2hhcmFjdGVycykubGVuZ3RoKSkudG9CZSgyNCk7XG4gICAgICAgIGV4cGVjdChhd2FpdCBmLmV2YWx1YXRlKGNhbXBhZ25lPT4od2luZG93IGFzIHVua25vd24gYXMgRmVuZXRyZVJlY2V0dGUpLnVzZVNlc3Npb25PU1N0b3JlLmdldFN0YXRlKCkucGxheWVyc1swXS5jaGFyYWN0ZXJzLmZpbmQoYz0+Yy5jYW1wYWlnbklkPT09Y2FtcGFnbmUpIS5wbGF5ZXJOb3RlcyxDKSkudG9CZSgnVFJBQ0UgRU5RVcOKVEUgw4AgQ09OU0VSVkVSJyk7XG4gICAgICAgIGV4cGVjdChhd2FpdCBmLmV2YWx1YXRlKGlkcz0+KHdpbmRvdyBhcyB1bmtub3duIGFzIEZlbmV0cmVSZWNldHRlKS51c2VTZXNzaW9uT1NTdG9yZS5nZXRTdGF0ZSgpLnBsYXllcnMuZmxhdE1hcChwPT5wLmNoYXJhY3RlcnMpLmZpbHRlcihjPT5pZHMuaW5jbHVkZXMoYy5pZCkpLm1hcChjPT5jLnNoZWV0RGF0YS5wb2ludHNfZGVfbWFnaWUpLHBjcy5tYXAoYz0+Yy5pZCkpKS50b0VxdWFsKFs4LDksMTBdKTtcbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4oU09SVElFLCd2ZXJpZmljYXRpb24tZWxlY3Ryb24uanNvbicpLEpTT04uc3RyaW5naWZ5KHtyZXVzc2k6ZnVpdGVzLnNpemU9PT0wLGltcG9ydE5hdGlmOnRydWUscmVtcGxhY2VtZW50SXNvbGU6dHJ1ZSxyZWxvYWQ6dHJ1ZSxqb3VldXJzRXhpc3RhbnRzQ29uc2VydmVzOnRydWUsYW5jaWVuc1BKQ29uc2VydmVzOjMsam91ZXVyczppbnZlbnRhaXJlLmpvdWV1cnMsZmljaGVIVE1MOnRydWUscG1UYWJsZXR0ZXM6cG0sbG9jYWxpc2F0aW9uc1RhYmxldHRlczpsb2NhbGlzYXRpb25zLGpldHNSZWN1c1Bhck1KOmpldHMsdGFibGV0dGVzOlszNjAsNzY4LDExODBdLG1vZHVsZXNTcGVjaWZpcXVlczowLFxuICAgICAgICBhcmNoaXZlczpbJzAxLUxlcy1Cb3JuZXMtZHUtZ3VlLmdtb3MnLCcwMi1BcHRpdHVkZXMtQ29tYmF0LWV0LVNhbnRlLmdtb3MnLCcwMy1SdW5lcy1QYXNzaW9ucy1ldC1NYWdpZS5nbW9zJ10ubWFwKGZpY2hpZXI9Pih7ZmljaGllcixzaGEyNTY6Y3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oU09SVElFLGZpY2hpZXIpKSkuZGlnZXN0KCdoZXgnKX0pKSxzZWNyZXRzTm9uRGlmZnVzZXM6ZnVpdGVzLnNpemU9PT0wLGFub21hbGllczpbLi4uZnVpdGVzXS5tYXAoY2hlbWluPT4oe2NhczonR00tMDUnLGNoZW1pbixhdHRlbmR1OidzZWNyZXQgYWJzZW50IGRlcyB0cmFtZXMgam91ZXVyJyxvYnNlcnZlOidtYXJxdWV1ciBzZWNyZXQgcHLDqXNlbnQnfSkpfSxudWxsLDIpKTtcbiAgICAgICAgZXhwZWN0LnNvZnQoZnVpdGVzLnNpemUsJ0dNLTA1IDogc2VjcmV0cyBkZSBzw6lhbmNlIHJlw6d1cyA7IHZvaXIgdmVyaWZpY2F0aW9uLWVsZWN0cm9uLmpzb24nKS50b0JlKDApO1xuICAgIH1maW5hbGx5e2F3YWl0IGdtb3MuZmVybWVyKCk7fVxufSk7XG4iXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLElBQUksRUFBRUMsTUFBTSxFQUFFQyxRQUFRLFFBQW1CLGtCQUFrQjtBQUNwRSxPQUFPQyxFQUFFLE1BQU0sU0FBUztBQUN4QixPQUFPQyxJQUFJLE1BQU0sV0FBVztBQUM1QixTQUFTQyxVQUFVLFFBQVEsYUFBYTtBQUN4QyxTQUFTQyxVQUFVLEVBQUVDLG9CQUFvQixFQUFFQyxjQUFjLEVBQUVDLGVBQWUsUUFBUSxjQUFjO0FBQ2hHLFNBQVNDLHNCQUFzQixRQUFRLHlCQUF5QjtBQUloRSxNQUFNQyxNQUFNLEdBQUdQLElBQUksQ0FBQ1EsT0FBTyxDQUFDLGtDQUFrQyxDQUFDO0FBQy9ELE1BQU1DLENBQUMsR0FBRyw0QkFBNEI7QUFDdEMsTUFBTUMsUUFBUSxHQUFHVixJQUFJLENBQUNXLElBQUksQ0FBQ0osTUFBTSxFQUFFLFVBQVUsQ0FBQztBQUU5Q1gsSUFBSSxDQUFDLHVFQUF1RSxFQUFFLFlBQVk7RUFDdEZBLElBQUksQ0FBQ2dCLFVBQVUsQ0FBQyxNQUFPLENBQUM7RUFDeEJiLEVBQUUsQ0FBQ2MsU0FBUyxDQUFDSCxRQUFRLEVBQUU7SUFBRUksU0FBUyxFQUFFO0VBQUssQ0FBQyxDQUFDO0VBQzNDLE1BQU1DLElBQUksR0FBRyxNQUFNYixVQUFVLENBQUM7SUFBRWMsZ0JBQWdCLEVBQUVDLE1BQU0sSUFBSTtNQUN4RGxCLEVBQUUsQ0FBQ2MsU0FBUyxDQUFDYixJQUFJLENBQUNXLElBQUksQ0FBQ00sTUFBTSxFQUFFLFFBQVEsRUFB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