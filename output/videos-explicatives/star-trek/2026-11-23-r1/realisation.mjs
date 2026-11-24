// Reçoit une Page Playwright ; aucune dépendance ni lancement d'application.
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
const sha = x => createHash('sha256').update(x).digest('hex');
export class Realisation {
  constructor(page, plan, lecture, {source, lectureFichier, modeRapide = false} = {}) {
    if (!page || !source || !lectureFichier || plan?.schemaVersion !== 2 || lecture?.mode !== 'texte') throw Error('Page, source, plan v2 et fichier lecture.json requis.');
    this.page = page; this.plan = plan; this.lecture = lecture; this.source = source;
    this.modeRapide = modeRapide; this.prises = []; this.origine = null; this.enSequence = false;
    if (sha(fs.readFileSync(lecture.planFichier)) !== lecture.planSha256) throw Error('Le plan a changé après préparation des textes.');
    if (JSON.stringify(JSON.parse(fs.readFileSync(lecture.planFichier,'utf8'))) !== JSON.stringify(plan)) throw Error('Plan en mémoire différent du fichier.');
    if (JSON.stringify(JSON.parse(fs.readFileSync(lectureFichier,'utf8'))) !== JSON.stringify(lecture)) throw Error('Lecture en mémoire différente du fichier.');
    this.lectureSha256 = sha(fs.readFileSync(lectureFichier));
  }
  async attendre(ms) { await this.page.waitForTimeout(this.modeRapide ? Math.min(ms, 30) : ms); }
  temps() { if (this.origine === null) throw Error('demarrer requis.'); return Math.round(performance.now() - this.origine); }
  async installer() {
    await this.page.evaluate(() => {
      if (document.getElementById('gmos-video-curseur')) return;
      const style = document.createElement('style');
      style.textContent = '#gmos-video-curseur{position:fixed;width:24px;height:24px;border:3px solid #ffd76b;border-radius:50%;background:#0006;z-index:2147483647;pointer-events:none;left:-100px;top:-100px;box-shadow:0 0 0 2px #17272c}#gmos-video-repere{position:fixed;inset:0;display:grid;place-items:center;background:#23383f;color:#fff;font:700 40px system-ui;z-index:2147483646;pointer-events:none}';
      document.head.append(style); const curseur = document.createElement('div');
      curseur.id = 'gmos-video-curseur'; document.body.append(curseur);
    });
  }
  async demarrer() {
    if (this.origine !== null) throw Error('Prise déjà démarrée.');
    await this.page.evaluate(() => { const r = document.createElement('div'); r.id = 'gmos-video-repere'; r.textContent = 'REPÈRE DE CALAGE — début du tournage'; document.body.append(r); });
    this.origine = performance.now(); await this.attendre(2000);
    await this.page.evaluate(() => document.getElementById('gmos-video-repere')?.remove());
  }
  async viser(locator) {
    await locator.waitFor({state:'visible'}); await locator.scrollIntoViewIfNeeded();
    await locator.evaluate(el => { for(let e=el.parentElement;e;e=e.parentElement) if(e.scrollLeft) e.scrollLeft=0; });
    const b = await locator.boundingBox(); if (!b) throw Error('Cible sans position visible.');
    await this.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, {steps: this.modeRapide ? 1 : 8});
    await this.page.evaluate(({x,y}) => { const c = document.getElementById('gmos-video-curseur'); if(c){c.style.left=x-12+'px';c.style.top=y-12+'px';} }, {x:b.x+b.width/2,y:b.y+b.height/2});
    await this.attendre(250);
  }
  async cliquer(locator) { await this.viser(locator); await locator.click(); await this.attendre(350); }
  async saisir(locator, texte) {
    await this.viser(locator);
    if (['number','range'].includes(await locator.getAttribute('type') ?? '')) await locator.fill(texte);
    else { await locator.fill(''); await locator.pressSequentially(texte,{delay:this.modeRapide?0:30}); }
    await this.attendre(350);
  }
  async lireCartes(phase) {
    const affichages = [];
    for (const carte of phase.cartes) {
      if (!Number.isFinite(carte.dureeMs) || carte.dureeMs < (this.plan.profilRythme==='dynamique-demande-David-2026-11-19'?7000:8700)) throw Error('Temps de lecture invalide.');
      const debutMs = this.temps();
      await this.attendre(carte.dureeMs);
      affichages.push({carteId:carte.id,debutMs,finMs:this.temps()});
    }
    return affichages;
  }
  async sequence(id, geste) {
    const s = this.plan.sequences[this.prises.length];
    if (this.enSequence || !s || s.id !== id || typeof geste !== 'function') throw Error('Ordre ou geste de séquence invalide : '+id);
    const l = this.lecture.sequences.find(x=>x.id===id); if(!l) throw Error('Textes manquants : '+id);
    this.enSequence = true;
    try {
      const debutMs = this.temps();
      const affichagesAvant = await this.lireCartes(l.avant);
      await this.attendre(this.plan.rythme.avantGesteMs);
      const debutActionMs = this.temps();
      const observation = await geste();
      if(typeof observation!=='string'||!observation.trim())throw Error('Observation vérifiée requise.');
      const finActionMs = this.temps();
      await this.attendre(this.plan.rythme.stabilisationResultatMs);
      const affichagesApres = await this.lireCartes(l.apres);
      await this.attendre(this.plan.rythme.apresResultatMs);
      this.prises.push({id,source:this.source,debutMs,finMs:this.temps(),debutActionMs,finActionMs,
        affichagesAvant,affichagesApres,observation,verifiee:true});
    } finally { this.enSequence = false; }
  }
  terminer() {
    if(this.enSequence || this.prises.length!==this.plan.sequences.length)throw Error('Tournage incomplet.');
    return {schemaVersion:2,mode:'texte',planSha256:this.lecture.planSha256,lectureSha256:this.lectureSha256,
      modeRapide:this.modeRapide,calageVerifie:false,decalageMs:null,
      note:'Renseigner le décalage du repère réellement observé et contrôler début/milieu/fin avant de valider le calage.',sequences:this.prises};
  }
}
