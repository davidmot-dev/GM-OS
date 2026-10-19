/* Fiche autonome : aucune dépendance et aucun appel réseau. */
(() => {
  'use strict';
  const template = JSON.parse(document.getElementById('character-sheet-template').textContent).template;
  const $ = id => document.getElementById(id);
  const storageKey = `character-sheet:${template.id}:v1`;
  const fields = template.pages.flatMap(page => page.fields);
  const definitions = new Map(fields.map(field => [field.key, field]));
  const tracks = new Map();
  for (const field of fields.filter(field => field.type === 'hotspot')) {
    if (!tracks.has(field.key)) tracks.set(field.key, []);
    tracks.get(field.key).push(field.value);
  }
  let data = Object.create(null), currentPage = 0, zoom = 100, autoFit = true, saveTimer;
  const controls = new Map(), wraps = [];
  const status = message => { $('status').textContent = message; };
  const blank = value => value === '' || value === undefined || value === null;
  function validate(imported) {
    if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw Error('Le JSON doit contenir un objet de données.');
    const result = Object.create(null);
    for (const [key, value] of Object.entries(imported)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
      const field = definitions.get(key);
      if (field?.derive) continue;
      if (field && !blank(value)) {
        if (field.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw Error(`Nombre invalide : ${field.label}`);
        if (['text', 'textarea'].includes(field.type) && typeof value !== 'string') throw Error(`Texte invalide : ${field.label}`);
        if (field.type === 'hotspot') {
          const values = tracks.get(key);
          if (!values.includes(value) && !(typeof values[0] === 'number' && value === 0)) throw Error(`Choix invalide : ${field.label}`);
        }
      }
      // Conserver aussi les données d'extensions inconnues, sans les exécuter ni les afficher.
      result[key] = value;
    }
    return result;
  }
  function copies() {
    for (const field of fields.filter(field => field.derive)) {
      const source = data[field.derive.source];
      data[field.key] = blank(source) ? '' : source;
    }
  }
  function refresh(key) {
    const entries = key ? controls.get(key) || [] : [...controls.values()].flat();
    for (const { element, field } of entries) {
      const value = data[field.key];
      if (field.type === 'hotspot') {
        const active = typeof field.value === 'number' ? Number(value || 0) >= field.value : value === field.value;
        element.classList.toggle('active', active);
        element.setAttribute('aria-pressed', String(active));
      } else if (element !== document.activeElement || field.readonly) element.value = blank(value) ? '' : String(value);
    }
  }
  function save() {
    clearTimeout(saveTimer);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ templateId: template.id, data }));
      status('Enregistré dans ce navigateur. Exportez un JSON pour conserver une copie.');
    } catch {
      status('Sauvegarde locale indisponible. Exportez un JSON pour conserver votre fiche.');
    }
  }
  function update(key, value) {
    data[key] = value;
    copies(); refresh();
    status('Modification en cours d’enregistrement…');
    clearTimeout(saveTimer); saveTimer = setTimeout(save, 180);
  }
  for (const [pageIndex, page] of template.pages.entries()) {
    const wrap = document.createElement('section');
    wrap.className = 'page-wrap'; wrap.setAttribute('aria-label', page.label);
    const sheet = document.createElement('div');
    sheet.className = 'sheet'; sheet.dataset.template = template.id; sheet.dataset.page = String(pageIndex + 1);
    sheet.style.width = `${page.width}px`; sheet.style.height = `${page.height}px`;
    const image = document.createElement('img');
    image.className = 'background'; image.src = page.backgroundData; image.alt = ''; image.draggable = false;
    sheet.append(image);
    for (const field of page.fields) {
      const element = document.createElement(field.type === 'hotspot' ? 'button' : field.type === 'textarea' ? 'textarea' : 'input');
      element.className = field.className + (field.type === 'hotspot' ? ' hotspot' : '');
      element.dataset.key = field.key;
      element.title = field.label; element.setAttribute('aria-label', field.label);
      element.style.cssText = field.style || '';
      Object.assign(element.style, { position: 'absolute', left: `${field.x}px`, top: `${field.y}px`, width: `${field.w}px`, height: `${field.h}px` });
      if (field.type === 'hotspot') {
        element.type = 'button'; element.dataset.value = String(field.value); element.setAttribute('aria-pressed', 'false');
        element.addEventListener('click', () => update(field.key, data[field.key] === field.value ? (typeof field.value === 'number' ? 0 : '') : field.value));
      } else {
        if (element.tagName === 'INPUT') element.type = field.type === 'number' ? 'number' : 'text';
        if (field.type === 'number') { element.step = 'any'; element.inputMode = 'decimal'; }
        element.autocomplete = 'off'; element.spellcheck = false;
        element.readOnly = Boolean(field.readonly);
        if (field.readonly) element.tabIndex = -1;
        element.addEventListener('input', () => {
          if (field.readonly || element.validity.badInput) return;
          update(field.key, element.value === '' ? '' : field.type === 'number' ? element.valueAsNumber : element.value);
        });
      }
      if (!controls.has(field.key)) controls.set(field.key, []);
      controls.get(field.key).push({ element, field });
      sheet.append(element);
    }
    wrap.append(sheet); $('pages').append(wrap); wraps.push(wrap);
    const option = document.createElement('option'); option.value = String(pageIndex); option.textContent = `${pageIndex + 1} / ${template.pages.length} — ${page.label}`; $('page').append(option);
  }
  function setZoom(value, fit = false) {
    zoom = Math.max(20, Math.min(400, Number.isFinite(value) ? value : 100)); autoFit = fit;
    $('zoom').value = String(Math.round(zoom));
    wraps.forEach((wrap, i) => {
      wrap.style.width = `${template.pages[i].width * zoom / 100}px`;
      wrap.style.height = `${template.pages[i].height * zoom / 100}px`;
      wrap.firstElementChild.style.transform = `scale(${zoom / 100})`;
    });
  }
  function fit() {
    const page = template.pages[currentPage], viewport = $('viewport');
    setZoom(Math.floor(Math.min((viewport.clientWidth - 24) / page.width, (viewport.clientHeight - 24) / page.height) * 100), true);
  }
  function showPage(index) {
    currentPage = Math.max(0, Math.min(template.pages.length - 1, index));
    wraps.forEach((wrap, i) => { wrap.hidden = i !== currentPage; });
    $('page').value = String(currentPage); $('prev').disabled = !currentPage; $('next').disabled = currentPage === wraps.length - 1;
    $('viewport').scrollTo(0, 0); if (autoFit) fit();
  }
  $('page').addEventListener('change', event => showPage(Number(event.target.value)));
  $('prev').addEventListener('click', () => showPage(currentPage - 1));
  $('next').addEventListener('click', () => showPage(currentPage + 1));
  $('minus').addEventListener('click', () => setZoom(zoom - 10)); $('plus').addEventListener('click', () => setZoom(zoom + 10));
  $('zoom').addEventListener('change', event => setZoom(Number(event.target.value))); $('fit').addEventListener('click', fit);
  addEventListener('resize', () => { if (autoFit) fit(); });
  $('viewport').addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey) { event.preventDefault(); setZoom(zoom + (event.deltaY < 0 ? 10 : -10)); }
  }, { passive: false });
  addEventListener('keydown', event => {
    if (!event.ctrlKey && !event.metaKey) return;
    if (['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault(); if (event.key === '0') fit(); else setZoom(zoom + (event.key === '-' ? -10 : 10));
    }
  });
  $('zones').addEventListener('click', () => {
    const active = document.body.classList.toggle('zones'); $('zones').setAttribute('aria-pressed', String(active));
  });
  $('export').addEventListener('click', () => {
    save();
    const blob = new Blob([JSON.stringify({ format: 'interactive-character-sheet', version: 1, templateId: template.id, data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    const name = String(data['identity.name'] || 'personnage').replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 80);
    link.href = url; link.download = `reve-de-dragon-${name}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('import').addEventListener('click', () => $('file').click());
  $('file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.templateId && parsed.templateId !== template.id) throw Error('Ce JSON appartient à un autre modèle de fiche.');
      const imported = validate(parsed.data ?? parsed);
      // Ne remplacer la fiche qu'après validation complète du document.
      if (Object.entries(data).some(([key, value]) => !definitions.get(key)?.derive && !blank(value)) && !confirm('Remplacer les données de cette fiche par le JSON choisi ?')) return;
      data = imported; copies(); refresh(); save(); status('JSON importé et enregistré dans ce navigateur.');
    } catch (error) { status(`Import refusé : ${error.message}`); }
    finally { event.target.value = ''; }
  });
  $('reset').addEventListener('click', () => {
    if (!confirm('Effacer toutes les données de ce personnage ? Exportez un JSON pour en garder une copie.')) return;
    data = Object.create(null); copies(); refresh(); save(); status('Fiche réinitialisée.');
  });
  $('print').addEventListener('click', () => { save(); window.print(); });
  $('help').addEventListener('click', () => $('help-dialog').showModal());
  $('close-help').addEventListener('click', () => $('help-dialog').close());
  addEventListener('pagehide', save);
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) { const parsed = JSON.parse(stored); data = validate(parsed.data); status('Dernière fiche restaurée depuis ce navigateur.'); }
    else status('Fiche vierge. Sauvegarde automatique dans ce navigateur.');
  } catch { status('Sauvegarde locale indisponible ou illisible. Utilisez les exports JSON.'); }
  copies(); refresh(); showPage(0);
})();
