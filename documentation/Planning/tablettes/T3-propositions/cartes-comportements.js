// Simulation locale des seuls gestes déjà présents dans HubMainDeCartes.
// Les changements de main simulent la réponse du meneur, sans connexion à GM-OS.
const etat = new URLSearchParams(location.search).get('etat');
let remainingCards = etat === 'vide' ? 0 : 4;
let handCards = etat === 'vide' ? [] : ['Carte 2'];
let propositionEnAttente = etat === 'attente';
let perfMode = true;
const avecVoisin = etat === 'voisin';
const visuelCarte = document.getElementById('deck-image').src;

function togglePerfMode() {
  perfMode = !perfMode;
  document.getElementById('perfText').textContent = perfMode ? 'MODE PERFORMANCE' : 'MODE QUALITÉ';
}
function confirmExit() { window.confirm('Quitter la session ?'); }
function openCardModal(nom) {
  const modal = document.getElementById('cardInspectModal');
  modal.setAttribute('aria-label', nom);
  document.getElementById('modalCardTitle').textContent = nom;
  modal.classList.remove('hidden');
}
function closeCardModal() { document.getElementById('cardInspectModal').classList.add('hidden'); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCardModal(); });
function drawCard() {
  if (!remainingCards) return;
  handCards.push(`Carte ${7 - remainingCards}`);
  remainingCards--;
  rendreMain();
}
function playCard(nom) {
  if (propositionEnAttente && nom === 'Carte 2') return;
  handCards = handCards.filter(carte => carte !== nom);
  rendreMain();
}
function proposerCarte(select) {
  if (select.value !== 'Idris Koa') return;
  propositionEnAttente = true;
  rendreMain();
}
function repondreProposition(accepter) {
  document.getElementById('incoming-offer').remove();
  if (accepter) { handCards.push('Carte 3'); rendreMain(); }
}
function rendreMain() {
  document.getElementById('remainingCardsVal').textContent = remainingCards;
  const pioche = document.getElementById('deckDrawTarget');
  pioche.disabled = !remainingCards;
  pioche.querySelector('.draw-label').textContent = remainingCards ? 'Piocher' : 'Paquet vide';
  pioche.classList.toggle('opacity-40', !remainingCards);
  const compteur = document.getElementById('handCounter');
  if (compteur) compteur.textContent = `${handCards.length} ${handCards.length > 1 ? 'CARTES' : 'CARTE'}`;
  document.getElementById('handCardsContainer').innerHTML = handCards.map(nom => `
    <article class="brutal-card bg-surface border border-surface-raised p-3">
      <div class="flex items-start gap-4">
        <button type="button" aria-label="Agrandir ${nom}" onclick="openCardModal('${nom}')" class="shrink-0 border border-primary/60 touch-target">
          <img src="${visuelCarte}" alt="${nom}" width="96" height="134" class="block w-24 h-auto" />
        </button>
        <div class="flex-1 min-w-0">
          <h3 class="font-orbitron text-sm font-bold uppercase break-words">${nom}</h3>
          <p class="text-sm text-text-muted mt-2">Cartes de complication</p>
          <div class="mt-3 space-y-2">
            ${propositionEnAttente && nom === 'Carte 2' ? '<p class="text-sm text-primary">Proposition en attente</p>' : `
              <button aria-label="Jouer ${nom}" onclick="playCard('${nom}')" class="brutal-btn touch-target w-full border border-primary/60 bg-surface-raised text-primary text-sm">Jouer</button>
              ${avecVoisin ? '<select aria-label="Donner à" onchange="proposerCarte(this)" class="touch-target text-sm w-full bg-surface-raised border border-surface-raised"><option value="">Donner à</option><option>Idris Koa</option></select>' : ''}
            `}
          </div>
        </div>
      </div>
    </article>`).join('');
  document.getElementById('emptyHandMsg').classList.toggle('hidden', handCards.length > 0 || etat === 'scellee');
  if (etat === 'scellee' && !document.getElementById('sealed-card')) {
    const scellee = document.createElement('div');
    scellee.id = 'sealed-card';
    scellee.className = 'brutal-card bg-surface p-3 mt-3';
    scellee.innerHTML = '<div aria-label="Carte sous scellé" class="w-24 h-32 border border-surface-raised bg-surface-raised flex items-center justify-center text-text-muted text-xl">?</div><p class="text-sm text-text-muted mt-2">sous scellé — personne ne la connaît</p>';
    document.getElementById('handCardsContainer').append(scellee);
  }
}
if (etat === 'proposition') {
  const offre = document.createElement('div');
  offre.id = 'incoming-offer';
  offre.className = 'brutal-card bg-primary/10 border border-primary/40 p-4 mb-4';
  offre.innerHTML = '<p class="text-sm mb-3">Idris Koa vous propose une carte</p><div class="grid grid-cols-2 gap-2"><button onclick="repondreProposition(true)" class="brutal-btn touch-target bg-primary text-background text-sm">Accepter</button><button onclick="repondreProposition(false)" class="brutal-btn touch-target bg-surface-raised border border-surface-raised text-sm">Refuser</button></div>';
  document.querySelector('main').prepend(offre);
}
rendreMain();
