// Prototype T3 : interactions locales, aucune connexion ou écriture dans GM-OS.
const ecran = document.body.dataset.ecran;
const variante = new URLSearchParams(location.search).get('etat');
function basculerQualite() {
  const texte = document.getElementById('mode-j2');
  texte.textContent = texte.textContent.includes('PERFORMANCE') ? 'MODE QUALITÉ' : 'MODE PERFORMANCE';
}
function quitterSession() { window.confirm('Quitter la session ?'); }
function fermerDetail() { document.getElementById('detail-j2')?.classList.add('hidden'); }
function ouvrirDetail(index = 0) {
  const detail = document.getElementById('detail-j2');
  if (ecran === 'archives') {
    const indices = [['Le café encore chaud', "Le départ date de moins d'une heure."], ['La signature unique', 'Tout le registre est signé « Hale », même les nuits où il dormait.']];
    detail.querySelector('h2').textContent = indices[index][0];
    detail.querySelector('[data-description]').textContent = indices[index][1];
    detail.setAttribute('aria-label', indices[index][0]);
  }
  detail.classList.remove('hidden');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { fermerDetail(); fermerMessagerie(); } });

const destinataires = { GM: 'Maître du Jeu', all: 'Tous les Joueurs', idris: 'Idris Koa', sora: 'Sora Adebayo' };
let destinataire = 'GM';
let messages = ecran === 'notifications'
  ? [{ de: 'GM', vers: 'nel', texte: 'Le sas vient de se fermer.', heure: '23:38' }]
  : [{ de: 'nel', vers: 'GM', texte: 'Le relais est ouvert.', heure: '23:37' }, { de: 'GM', vers: 'nel', texte: 'Vous entendez trois coups.', heure: '23:37' }];
function ouvrirMessagerie() {
  const panneau = document.getElementById('messagerie-j2');
  if (!panneau) return;
  panneau.classList.remove('hidden');
  document.getElementById('nouveau-message')?.classList.add('hidden');
  document.getElementById('badge-non-lu')?.classList.add('hidden');
  document.getElementById('destination-messages')?.setAttribute('aria-pressed', 'true');
  rendreConversation();
}
function fermerMessagerie() {
  document.getElementById('messagerie-j2')?.classList.add('hidden');
  document.getElementById('destinataires-j2')?.classList.add('hidden');
  document.getElementById('destination-messages')?.setAttribute('aria-pressed', 'false');
}
function ouvrirDestinataires() {
  const liste = document.getElementById('destinataires-j2');
  liste.classList.toggle('hidden');
  document.getElementById('choisir-destinataire').setAttribute('aria-expanded', String(!liste.classList.contains('hidden')));
}
function choisirDestinataire(id) {
  destinataire = id;
  document.getElementById('destinataires-j2').classList.add('hidden');
  document.getElementById('choisir-destinataire').setAttribute('aria-expanded', 'false');
  rendreConversation();
}
function actualiserEnvoi() {
  document.getElementById('envoyer-message').disabled = !document.getElementById('message-saisi').value.trim();
}
function envoyerMessage() {
  const saisie = document.getElementById('message-saisi');
  const texte = saisie.value.trim();
  if (!texte) return;
  messages.push({ de: 'nel', vers: destinataire, texte, heure: ecran === 'notifications' ? '23:38' : '23:37' });
  saisie.value = '';
  rendreConversation(); actualiserEnvoi();
}
function rendreConversation() {
  const nom = destinataires[destinataire];
  document.getElementById('nom-destinataire').textContent = nom;
  document.getElementById('canal-j2').textContent = destinataire === 'GM' ? 'Canal Direct MJ' : destinataire === 'all' ? 'Canal Général' : 'Canal Privé';
  document.getElementById('message-saisi').placeholder = `Message à ${nom}...`;
  document.getElementById('confidentialite-j2').textContent = destinataire === 'all' ? 'Tout le monde pourra lire ce message.' : `Seul ${nom} pourra lire ce message.`;
  const conversation = messages.filter(m => destinataire === 'all' ? m.vers === 'all'
    : m.de === 'nel' && m.vers === destinataire || m.de === destinataire && m.vers === 'nel');
  const liste = document.getElementById('conversation-j2');
  liste.replaceChildren();
  if (!conversation.length) {
    const vide = document.createElement('p'); vide.className = 'vide-conversation';
    vide.textContent = `Aucun message avec ${nom}. Commencez la conversation !`; liste.append(vide);
  }
  for (const msg of conversation) {
    const ligne = document.createElement('div'); ligne.className = `message-ligne ${msg.de === 'nel' ? 'message-moi' : ''}`;
    const bulle = document.createElement('p'); bulle.className = 'message-bulle'; bulle.textContent = msg.texte;
    const meta = document.createElement('p'); meta.className = 'message-meta';
    meta.textContent = `${msg.de === 'nel' ? 'VOUS' : destinataires[msg.de]} · ${msg.heure}`;
    ligne.append(bulle, meta); liste.append(ligne);
  }
  liste.scrollTop = liste.scrollHeight;
}
if (ecran === 'messages' || ecran === 'notifications') {
  const saisie = document.getElementById('message-saisi');
  saisie.addEventListener('input', actualiserEnvoi);
  saisie.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerMessage(); }
  });
  actualiserEnvoi();
  if (ecran === 'messages') ouvrirMessagerie();
  if (ecran === 'notifications' && variante === 'alerte') {
    document.getElementById('nouveau-message').classList.add('hidden');
    document.getElementById('badge-non-lu').classList.add('hidden');
    const alerte = document.getElementById('alerte-j2');
    alerte.classList.remove('hidden');
    setTimeout(() => alerte.classList.add('hidden'), 8000);
  }
  if (ecran === 'notifications' && variante !== 'alerte') {
    setTimeout(() => document.getElementById('nouveau-message').classList.add('hidden'), 5000);
  }
}
if (variante === 'vide' && ['archives', 'pnj', 'lieux'].includes(ecran)) {
  document.querySelector('[data-liste-j2]').classList.add('hidden');
  document.getElementById('vide-j2').classList.remove('hidden');
  document.getElementById('compteur-j2').textContent = '0';
}
