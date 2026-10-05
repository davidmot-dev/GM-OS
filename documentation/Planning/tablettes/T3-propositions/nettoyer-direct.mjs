import { readFile, writeFile } from 'node:fs/promises';

const url = new URL('direct-telephone-original.html', import.meta.url);
let html = await readFile(url, 'utf8');
html = html.replace('maximum-scale=1.0, user-scalable=no', 'viewport-fit=cover')
  .replace('GM-OS // JOUEUR', 'GM-OS')
  .replace('px-3 py-2 flex items-center justify-between z-30', 'px-3 py-2 flex flex-wrap gap-2 items-center justify-between z-30')
  .replace('grid grid-cols-6', 'grid grid-cols-3')
  .replaceAll('ALERTE STATION', 'Alerte de la station')
  .replace('tracking-wider truncate">Alerte', 'tracking-wider leading-tight">Alerte')
  .replace('text-txt-muted font-medium mt-1 truncate', 'text-txt-muted font-medium mt-1 leading-tight')
  .replace('ARCHIV.', 'ARCHIVES').replace('INVENT.', 'INVENTAIRE').replace('MSGS', 'MESSAGES')
  .replace('« Aucun résumé public. »', 'Aucun résumé public.')
  .replace(/<span class="font-mono text-\[11px\] text-txt-muted">SÉANCE 2<\/span>/, '')
  .replace(/<span class="text-\[11px\] font-mono[^>]*>[^<]*<\/span>/g, '');
// Les détails de télémétrie et les niveaux d'alerte ajoutés par Stitch n'existent pas dans GM-OS.
html = html.replace(/<div class="flex flex-col">\s*<span[^>]*>Vigilance<\/span>\s*<span[^>]*>Palier 3 enclenché<\/span>\s*<\/div>/, '')
  .replace(/<!-- En-tête projection -->[\s\S]*?(?=\s*<\/section>)/, '')
  .replace('font-mono text-[11px] font-bold text-txt-muted uppercase tracking-wider leading-tight', 'font-body text-[11px] font-bold text-txt-muted leading-tight')
  .replace(/font-display text-\[11px\]/g, 'font-body text-[11px]')
  .replace(/font-display text-\[12px\]/g, 'font-body text-[11px]');
// Un anneau contient vraiment huit segments, dont trois allumés.
const segments = Array.from({ length: 8 }, (_, index) => {
  const a = (index * 45 - 90) * Math.PI / 180;
  const b = (index * 45 - 54) * Math.PI / 180;
  return `<path d="M ${20 + 16 * Math.cos(a)} ${20 + 16 * Math.sin(a)} A 16 16 0 0 1 ${20 + 16 * Math.cos(b)} ${20 + 16 * Math.sin(b)}" fill="none" stroke="${index < 3 ? '#f59e0b' : '#1e293b'}" stroke-width="4"/>`;
}).join('');
html = html.replace(/<svg class="w-full h-full -rotate-90"[\s\S]*?<\/svg>/, `<svg class="w-full h-full" viewBox="0 0 40 40" aria-label="3 segments sur 8">${segments}</svg>`);
html = html.replace('</body>', `<script>
const mode = Array.from(document.querySelectorAll('header button'))[0];
mode.addEventListener('click', () => { mode.textContent = mode.textContent.includes('PERFORMANCE') ? 'MODE QUALITÉ' : 'MODE PERFORMANCE'; });
const quitter = Array.from(document.querySelectorAll('footer button')).find(button => button.textContent.includes('QUITTER'));
quitter.addEventListener('click', () => window.confirm('Quitter la session ?'));
</script></body>`);
await writeFile(new URL('direct-telephone.html', import.meta.url), html);

let paysage = await readFile(new URL('direct-paysage-original.html', import.meta.url), 'utf8');
paysage = paysage.replace('GM-OS // JOUEUR', 'GM-OS')
  .replace('w-[1180px] h-[820px] max-w-[1180px] max-h-[820px]', 'w-full h-[820px] max-w-[1180px]')
  .replaceAll('DIRECT (● LIVE)', 'DIRECT').replaceAll('ARCHIV. / HIST.', 'ARCHIVES')
  .replaceAll('PNJ / ROSTER', 'PNJ').replaceAll('LIEUX / SECT.', 'LIEUX')
  .replaceAll('INVENT. / BUTIN', 'INVENTAIRE').replaceAll('CARTES / PLANS', 'CARTES')
  .replaceAll('MSGS', 'MESSAGES').replace('ALERTE STATION 3/8', 'Alerte de la station · 3/8')
  .replace('« Aucun résumé public. »', 'Aucun résumé public.')
  .replace('CONFIRMATION // Déconnexion du terminal joueur ?', 'Quitter la session ?')
  .replace('"label-sm": ["10px"', '"label-sm": ["11px"')
  .replace('"body-md": ["13px"', '"body-md": ["14px"');
paysage = paysage.replace(/<!-- Bandeau supérieur du canal -->[\s\S]*?(?=\s*<\/section>)/, '')
  .replace(/<span[^>]*>(SYNC LOCALE|STATION T-0|3 VIGILANCE|Palier 3 enclenché|SÉANCE 2|JOURNAL DE BORD|DIFFUSION TABLE)<\/span>/g, '')
  .replace('text-on-surface-variant uppercase tracking-wider">TENSION PUBLIQUE', 'text-on-surface-variant tracking-wider">TENSION PUBLIQUE');
// Le titre complet de la tension remplace les deux badges abrégés générés.
paysage = paysage.replace(/<span[^>]*>TENSION PUBLIQUE<\/span>/, '')
  .replace(/text-amber-400 font-bold px-1.5 py-0.5 bg-amber-950\/40 border border-amber-500\/40/g, 'text-amber-400 font-bold');
await writeFile(new URL('direct-paysage.html', import.meta.url), paysage);
