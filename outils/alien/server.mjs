/** Serveur autonome : HTTP + flux d'événements, sans paquet à installer. */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import './core.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const assets = new Map([['/', ['index.html', 'text/html']], ['/index.html', ['index.html', 'text/html']], ['/style.css', ['style.css', 'text/css']], ['/app.js', ['app.js', 'text/javascript']], ['/core.js', ['core.js', 'text/javascript']], ['/manifest.json', ['manifest.json', 'application/json']]]);
const secret = () => randomBytes(32).toString('hex');
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; media-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
};
async function readJSON(filename) {
  try { return JSON.parse(await fs.readFile(filename, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function createTable({ storageDirectory = path.join(directory, '.local'), port = 8787 } = {}) {
  await fs.mkdir(storageDirectory, { recursive: true });
  const sessionFile = path.join(storageDirectory, 'session.json'), authFile = path.join(storageDirectory, 'connexion.json');
  let saved = await readJSON(sessionFile);
  if (saved) { saved.tracker.power = false; saved.countdown = null; Object.values(saved.players || {}).forEach(p => p.cue = null); }
  const engine = globalThis.AlienCore.créer(saved);
  const credentials = await readJSON(authFile) || { gm: secret(), code: randomBytes(3).toString('hex').toUpperCase(), players: {} };
  const streams = new Set(), attempts = new Map(); let queue = Promise.resolve();
  const persist = async () => {
    for (const [filename, content] of [[sessionFile, engine.sauvegarde()], [authFile, credentials]]) {
      await fs.writeFile(filename + '.tmp', JSON.stringify(content, null, 2), { mode: 0o600 }); await fs.rename(filename + '.tmp', filename);
    }
  };
  await persist();
  const session = token => token === credentials.gm ? { role: 'gm' } : credentials.players[token] ? { role: 'player', playerId: credentials.players[token] } : null;
  const broadcast = () => { for (const stream of streams) { const who = session(stream.token); if (who) stream.response.write('data: ' + JSON.stringify(engine.snapshot(who.role, who.playerId)) + '\n\n'); } };
  const addresses = () => Object.values(os.networkInterfaces()).flat().filter(a => a && a.family === 'IPv4' && !a.internal).map(a => 'http://' + a.address + ':' + port + '/');

  /** Appelable sans ouvrir de port : sert aussi à vérifier le protocole. */
  async function request({ method = 'GET', url = '/', token = '', body = null, origin = '', remoteAddress = 'local' }) {
    const pathname = new URL(url, 'http://localhost').pathname;
    if (!pathname.startsWith('/api/')) {
      if (method !== 'GET' && method !== 'HEAD') return { status: 405, json: { error: 'Méthode refusée.' } };
      const asset = assets.get(pathname); if (!asset) return { status: 404, json: { error: 'Page inconnue.' } };
      return { status: 200, type: asset[1] + '; charset=utf-8', content: await fs.readFile(path.join(directory, asset[0])) };
    }
    if (method === 'POST' && origin) {
      // Le navigateur ne peut pas déclencher une action depuis une autre page.
      const expected = new URL(url, 'http://localhost').origin;
      if (origin !== expected) return { status: 403, json: { error: 'Origine refusée.' } };
    }
    if (pathname === '/api/join' && method === 'POST') {
      const attempt = attempts.get(remoteAddress) || { count: 0, at: Date.now() };
      if (Date.now() - attempt.at > 60000) { attempt.count = 0; attempt.at = Date.now(); }
      attempt.count++; attempts.set(remoteAddress, attempt);
      if (attempt.count > 20) return { status: 429, json: { error: 'Trop de tentatives. Réessayez dans une minute.' } };
      if (String(body?.code || '').trim().toUpperCase() !== credentials.code) return { status: 403, json: { error: 'Code de table incorrect.' } };
      const name = String(body?.name || '').trim(); if (!name) return { status: 400, json: { error: 'Indiquez un nom.' } };
      const playerId = randomBytes(12).toString('hex'), playerToken = secret(); credentials.players[playerToken] = playerId;
      engine.inscrire(playerId, name); await persist(); broadcast(); return { status: 200, json: { token: playerToken } };
    }
    const who = session(token); if (!who) return { status: 401, json: { error: 'Connexion requise.' } };
    if (method === 'GET' && pathname === '/api/session') return { status: 200, json: who };
    if (method === 'GET' && pathname === '/api/state') return { status: 200, json: engine.snapshot(who.role, who.playerId) };
    if (method === 'GET' && pathname === '/api/table' && who.role === 'gm') return { status: 200, json: { code: credentials.code, addresses: addresses() } };
    if (method === 'POST' && pathname === '/api/action') {
      try { engine.agir(who.role, who.playerId, body); await persist(); broadcast(); return { status: 200, json: { ok: true } }; }
      catch (error) { return { status: who.role === 'player' && body?.type !== 'command' ? 403 : 400, json: { error: error.message } }; }
    }
    return { status: 404, json: { error: 'Action inconnue.' } };
  }
  function serializedRequest(input) { const result = queue.then(() => request(input)); queue = result.catch(() => {}); return result; }
  const server = http.createServer(async (req, res) => {
    const token = req.headers.authorization?.replace(/^Bearer /, '') || '';
    try {
      const url = new URL(req.url || '/', 'http://' + (req.headers.host || 'localhost:' + port)).href;
      if (new URL(url).pathname === '/api/events' && req.method === 'GET') {
        const who = session(token); if (!who) { res.writeHead(401, { ...securityHeaders, 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Connexion requise.' })); return; }
        res.writeHead(200, { ...securityHeaders, 'Content-Type': 'text/event-stream', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
        res.write('data: ' + JSON.stringify(engine.snapshot(who.role, who.playerId)) + '\n\n');
        const stream = { token, response: res }; streams.add(stream); const keepalive = setInterval(() => res.write(': liaison\n\n'), 15000);
        res.on('close', () => { streams.delete(stream); clearInterval(keepalive); }); return;
      }
      let body = null;
      if (req.method === 'POST') {
        if (!String(req.headers['content-type'] || '').startsWith('application/json')) { res.writeHead(415, securityHeaders); res.end(); return; }
        let bytes = 0; const chunks = []; for await (const chunk of req) { bytes += chunk.length; if (bytes > 32768) { res.writeHead(413, securityHeaders); res.end(); return; } chunks.push(chunk); }
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      }
      const result = await serializedRequest({ method: req.method, url, token, body, origin: req.headers.origin || '', remoteAddress: req.socket.remoteAddress || '' });
      res.writeHead(result.status, { ...securityHeaders, 'Content-Type': result.type || 'application/json; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : result.content || JSON.stringify(result.json));
    } catch (error) { if (!res.headersSent) res.writeHead(400, { ...securityHeaders, 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Requête illisible ou sauvegarde indisponible.' })); console.error(error.message); }
  });
  return { server, request: serializedRequest, gmToken: credentials.gm, joinCode: credentials.code, snapshot: token => { const who = session(token); return who ? engine.snapshot(who.role, who.playerId) : null; }, close: () => { streams.forEach(s => s.response.end()); server.close(); } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.ALIEN_PORT || 8787);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('ALIEN_PORT doit être un port entre 1024 et 65535.');
  const table = await createTable({ port });
  table.server.on('error', error => { console.error('Serveur Alien non démarré : ' + error.message); process.exitCode = 1; });
  table.server.listen(port, '0.0.0.0', () => {
    console.log('\nALIEN — Accessoires de table\n');
    console.log('Meneur : http://localhost:' + port + '/#mj=' + table.gmToken);
    console.log('Code de table : ' + table.joinCode);
    for (const addresses of Object.values(os.networkInterfaces())) for (const a of addresses || []) if (a.family === 'IPv4' && !a.internal) console.log('Joueurs : http://' + a.address + ':' + port + '/');
    console.log('\nCtrl+C pour arrêter. Données locales dans outils/alien/.local/.');
  });
  process.once('SIGINT', () => { table.close(); process.exitCode = 0; });
}
