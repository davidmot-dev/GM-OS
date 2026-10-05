import { readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

for (const format of process.argv.slice(2).length ? process.argv.slice(2) : ['telephone', 'paysage']) {
  let html = await readFile(new URL(`inventaire-${format}-original.html`, import.meta.url), 'utf8');
  if (format === 'paysage') {
    const dom = new JSDOM(html);
    const d = dom.window.document;
    const phone = new JSDOM(await readFile(new URL('inventaire-telephone.html', import.meta.url), 'utf8')).window.document;
    const removeContaining = (text, selector, levels = 0) => {
      let node = [...d.querySelectorAll(selector)].find(n => n.textContent.trim() === text);
      for (let i = 0; node && i < levels; i++) node = node.parentElement;
      node?.remove();
    };
    removeContaining('OPÉRATION EN COURS :', 'span', 1);
    removeContaining('PORT EMPLACEMENT : 01/12', 'span', 1);
    removeContaining('TABLE', 'span', 1);
    removeContaining('SYS#09', 'span');
    removeContaining('UTILITAIRE DE CLASSE C', 'span', 2);
    removeContaining('INTÉGRITÉ MATÉRIELLE : 100%', 'span', 2);
    d.querySelector('main > .grid')?.remove();
    d.querySelector('header > div:first-child > .h-4')?.remove();
    for (const node of d.querySelectorAll('#transferModal,#quitModal,#systemToast')) node.remove();
    for (const script of d.querySelectorAll('body script')) script.remove();
    const clone = id => d.importNode(phone.getElementById(id), true);
    const main = d.querySelector('main');
    main.classList.replace('overflow-hidden', 'overflow-y-auto');
    main.classList.add('min-h-0');
    const item = main.children[2];
    item.id = 'item-card';
    item.append(clone('pending-badge'));
    main.insertBefore(clone('status-banner'), item);
    main.append(clone('empty-state'));
    const count = [...main.querySelectorAll('span')].find(n => n.textContent.trim() === '1 OBJETS');
    count.innerHTML = '<span id="item-count">1</span> OBJETS';
    for (const [old, id, fn, label] of [['openTransferModal()', 'btn-give', 'openGiveModal()', 'Donner'], ['confirmDiscardItem()', 'btn-drop', 'confirmDropItem()', 'Jeter']]) {
      const btn = d.querySelector(`button[onclick="${old}"]`);
      btn.id = id; btn.setAttribute('onclick', fn); btn.setAttribute('aria-label', label);
      btn.querySelector('span:last-child').textContent = label;
    }
    const mode = d.querySelector('#perfToggle span:nth-child(2)');
    mode.id = 'mode-text'; mode.textContent = 'MODE PERFORMANCE';
    d.getElementById('perfIndicator').remove();
    d.querySelector('button[onclick="openQuitPrompt()"]').setAttribute('onclick', 'simulateQuit()');
    const nav = d.querySelector('nav');
    const footer = d.createElement('footer'); footer.className = nav.className;
    footer.innerHTML = nav.innerHTML; nav.replaceWith(footer);
    d.body.append(clone('give-modal'));
    for (const script of phone.querySelectorAll('body script')) d.body.append(d.importNode(script, true));
    const alias = d.createElement('script');
    alias.textContent = `Object.assign(tailwind.config.theme.extend.colors, ${JSON.stringify({'rpg-bg':'#020617','rpg-surface':'#0f172a','rpg-surface-2':'#1e293b','rpg-accent':'#06b6d4','rpg-text':'#f8fafc','rpg-muted':'#898c95','rpg-border':'#1e293b','rpg-danger':'#ef4444','rpg-warning':'#f59e0b'})}); Object.assign(tailwind.config.theme.extend.fontFamily,{inter:['Inter','sans-serif'],mono:['Space Mono','monospace']});`;
    d.head.append(alias);
    const css = d.createElement('style');
    css.textContent = '#give-modal > div{max-height:calc(100dvh - 24px);overflow-y:auto}#give-modal button{min-width:44px;min-height:44px}#give-modal h3{max-width:55%}#give-modal [class*="text-[12px]"]{font-size:14px}#status-banner{margin-bottom:16px}#pending-badge{position:static;align-self:flex-start;margin-top:16px}footer{flex-shrink:0}.text-body-sm{font-size:14px}';
    d.head.append(css);
    html = dom.serialize().replaceAll('w-[1180px]', 'w-full').replaceAll('GM-OS // JOUEUR','GM-OS').replaceAll('maximum-scale=1.0, user-scalable=no','viewport-fit=cover');
    await writeFile(new URL(`inventaire-${format}.html`, import.meta.url), html);
    continue;
  }
  html = html.replaceAll('maximum-scale=1.0, user-scalable=no', 'viewport-fit=cover')
    .replaceAll('GM-OS // JOUEUR', 'GM-OS').replaceAll('MSGS', 'MESSAGES')
    .replace(/<span[^>]*>CONTENANT #01<\/span>/, '')
    .replace(/<span[^>]*>TABLE<\/span>/, '')
    .replace(/>SYNC<\/span>/, '>CONNECTÉ</span>')
    .replaceAll('truncate', 'break-words')
    .replaceAll('text-xs', 'text-sm')
    .replace(/<span[^>]*>\s*SÉLECTIONNER\s*<\/span>/g, '<span aria-hidden="true">→</span>')
    .replace('SAC À DOS VIDE', 'Votre sac à dos est vide')
    .replace('Aucun objet en réserve pour le moment.', 'Vous ne possédez aucun objet pour le moment.')
    .replace('window.alert("Simulation : Retour vers l\'écran d\'accueil \'QUI ES-TU ?\'.");', 'window.confirm("Quitter la session ?");')
    .replace('window.confirm("Confirmer la suppression de cet objet de votre inventaire ?")', 'window.confirm(\'Êtes-vous sûr de vouloir jeter "Outil multifonction" ? Cette action est définitive.\')');
  // Les surcouches sont lisibles et défilent elles-mêmes si la hauteur utile diminue.
  html = html.replace('id="give-modal" class="', 'id="give-modal" role="dialog" aria-modal="true" aria-label="Donner un objet" class="');
  html = html.replace('</head>', '<style>#give-modal > div { max-height: calc(100dvh - 24px); overflow-y: auto; } #give-modal h3 { max-width: 55%; } article h2 { overflow-wrap: anywhere; } header > div:first-child { flex-wrap: wrap; gap: 8px; } #give-modal button { min-width:44px; min-height:44px; } #give-modal [class*="text-[12px]"] {font-size:14px;} #pending-badge {position:static;width:fit-content;margin-top:12px;}</style></head>');
  html = html.replace('</body>', '<script>document.addEventListener("keydown",e=>{if(e.key==="Escape")closeGiveModal()});</script></body>');
  await writeFile(new URL(`inventaire-${format}.html`, import.meta.url), html);
}
