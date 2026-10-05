import { readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

// Visuel fictif identique à l'interception d'image du témoin T0, pas d'illustration de jeu inventée.
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="250" height="350"><rect width="250" height="350" rx="16" fill="#142637"/><rect x="12" y="12" width="226" height="326" rx="12" fill="none" stroke="#54c6b4" stroke-width="3"/><text x="125" y="165" text-anchor="middle" font-family="sans-serif" font-size="22" fill="white">STATION VARN</text><text x="125" y="200" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#54c6b4">Complication</text></svg>';
const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const comportement = await readFile(new URL('cartes-comportements.js', import.meta.url), 'utf8');
for (const format of process.argv.slice(2).length ? process.argv.slice(2) : ['telephone', 'paysage']) {
  const dom = new JSDOM(await readFile(new URL(`cartes-${format}-original.html`, import.meta.url), 'utf8'));
  const d = dom.window.document;
  for (const script of d.querySelectorAll('body script')) script.remove();
  for (const node of d.querySelectorAll('#toastNotification')) node.remove();
  for (const span of d.querySelectorAll('span')) {
    if (span.textContent.trim() === 'TABLE') span.remove();
    if (span.textContent.trim() === 'SYNC') span.textContent = 'CONNECTÉ';
  }
  if (format === 'telephone') {
    const main = d.querySelector('main');
    main.querySelector('p').remove();
    d.getElementById('deckCountBadge').parentElement.remove();
    const deck = d.getElementById('deckDrawTarget');
    const pack = deck.parentElement;
    const subtitle = [...pack.querySelectorAll('div')].find(n => n.textContent.trim() === 'Paquet de scénario actif');
    subtitle?.remove();
    pack.firstElementChild.classList.add('flex-wrap', 'gap-2');
    const button = d.createElement('button');
    button.id = 'deckDrawTarget'; button.type = 'button';
    button.setAttribute('onclick', 'drawCard()'); button.setAttribute('aria-label', 'Piocher');
    button.className = 'cursor-pointer w-full bg-surface-raised border border-primary/50 hover:border-primary p-3 flex items-center gap-3 touch-target text-left';
    button.innerHTML = `<img id="deck-image" src="${image}" alt="Dos de carte" width="60" height="84" class="w-[60px] h-auto shrink-0"/><span class="draw-label font-orbitron font-bold text-sm text-primary">Piocher</span>`;
    deck.replaceWith(button);
    d.getElementById('handCardsContainer').innerHTML = '';
    d.getElementById('emptyHandMsg').innerHTML = '<p class="text-sm text-text-muted">Vous ne tenez aucune carte.</p>';
    const nav = d.querySelector('nav');
    const footer = d.createElement('footer'); footer.className = nav.className;
    footer.innerHTML = nav.innerHTML; nav.replaceWith(footer);
    for (const a of footer.querySelectorAll('a')) {
      const btn = d.createElement('button'); btn.className = a.className;
      btn.innerHTML = a.innerHTML; a.replaceWith(btn);
    }
    footer.style.cssText = 'position:fixed;bottom:0;left:50%;transform:translateX(-50%);max-width:480px';
    d.querySelector('header').classList.add('flex-wrap', 'gap-2');
    d.querySelector('.device-shell').style.cssText = 'max-width:480px;height:100dvh;min-height:0;padding-bottom:134px';
    main.classList.add('min-h-0');
    main.classList.replace('pb-32', 'pb-4');
  } else {
    for (const span of d.querySelectorAll('header span')) {
      if (span.textContent.includes('OPÉRATION EN COURS') || span.textContent.trim() === 'V4.2') span.remove();
    }
    const mode = d.getElementById('btn-perf');
    mode.setAttribute('onclick', 'togglePerfMode()');
    d.getElementById('perf-text').id = 'perfText';
    d.querySelector('button[onclick="openQuitModal()"]').setAttribute('onclick', 'confirmExit()');
    d.getElementById('quit-modal').remove();
    const main = d.querySelector('main');
    main.classList.replace('overflow-hidden', 'overflow-y-auto');
    main.classList.add('min-h-0');
    main.firstElementChild.innerHTML = '<h1 class="font-orbitron text-2xl font-black tracking-wider">CARTES</h1>';
    const grid = main.querySelector('.grid');
    grid.classList.remove('flex-1', 'max-h-[460px]');
    const [left, right] = grid.querySelectorAll('section');
    left.innerHTML = `<div class="flex justify-between items-start gap-3 border-b border-outline pb-3 mb-4"><div><h2 class="font-orbitron text-sm font-bold uppercase">Paquets ouverts</h2><p class="text-sm text-text-muted mt-2">Cartes de complication</p></div><span class="text-sm font-mono text-primary">Restant : <span id="remainingCardsVal">4</span></span></div><button id="deckDrawTarget" onclick="drawCard()" aria-label="Piocher" class="touch-target w-full bg-surface-raised border border-primary/40 flex flex-col items-center gap-4 p-4"><img id="deck-image" src="${image}" alt="Dos de carte" width="180" height="252" class="w-[180px] h-auto"/><span class="draw-label text-sm font-orbitron text-primary">Piocher</span></button>`;
    right.innerHTML = '<div class="flex justify-between items-center border-b border-outline pb-3 mb-4"><h2 class="font-orbitron text-sm font-bold uppercase">Cartes en main</h2><span id="handCounter" class="text-sm text-primary font-mono">1 CARTE</span></div><div id="handCardsContainer" class="space-y-3"></div><p id="emptyHandMsg" class="hidden text-sm text-text-muted p-6 text-center">Vous ne tenez aucune carte.</p>';
    left.classList.replace('justify-between', 'justify-start');
    right.classList.replace('justify-between', 'justify-start');
    const modal = d.getElementById('card-modal');
    modal.id = 'cardInspectModal'; modal.setAttribute('onclick', 'closeCardModal()'); modal.classList.add('flex');
    const alias = d.createElement('script');
    alias.textContent = `Object.assign(tailwind.config.theme.extend.colors,${JSON.stringify({background:'#020617',surface:'#0f172a','surface-raised':'#1e293b',primary:'#06b6d4','text-main':'#f8fafc','text-muted':'#898c95',danger:'#ef4444',warning:'#f59e0b',success:'#10b981'})});Object.assign(tailwind.config.theme.extend.fontFamily,{inter:['Inter','sans-serif'],mono:['JetBrains Mono','monospace']});`;
    d.head.append(alias);
    d.body.style.cssText = 'width:100%;max-width:1180px;height:100dvh';
    const css = d.createElement('style');
    css.textContent = 'body{color:#f8fafc;font-family:Inter,sans-serif}.brutal-btn{display:flex;align-items:center;justify-content:center;padding:8px;font-weight:700}#handCardsContainer article img{width:160px}#handCardsContainer article{background:#0f172a}.text-body-sm{font-size:14px}';
    d.head.append(css);
  }
  const modal = d.getElementById('cardInspectModal');
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Carte 2');
  modal.innerHTML = `<div class="cursor-pointer brutal-card bg-surface border border-primary max-w-xs w-full p-4 flex flex-col items-center gap-4"><h2 id="modalCardTitle" class="font-orbitron font-bold text-sm uppercase">Carte 2</h2><img src="${image}" alt="Carte agrandie" width="250" height="350" style="max-height:calc(100dvh - 180px);width:auto;max-width:100%;object-fit:contain"/><p class="text-sm text-primary">Touchez pour fermer</p></div>`;
  const css = d.createElement('style');
  css.textContent = '*{border-radius:0!important}.text-xs{font-size:14px}.text-\\[10px\\]{font-size:11px}main{overscroll-behavior:contain}header{flex-shrink:0}button,select{min-width:44px;min-height:44px}#cardInspectModal>div{max-height:calc(100dvh - 24px);overflow-y:auto}';
  d.head.append(css);
  const script = d.createElement('script'); script.textContent = comportement; d.body.append(script);
  let html = dom.serialize().replaceAll('maximum-scale=1.0, user-scalable=no','viewport-fit=cover').replaceAll('GM-OS // JOUEUR','GM-OS').replaceAll('truncate','break-words');
  await writeFile(new URL(`cartes-${format}.html`, import.meta.url), html);
}
