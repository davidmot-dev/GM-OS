/* Dessin du même instrument dans l'atelier autonome et dans le Tablet Hub. */
(() => {
  'use strict';
  function creerRendu(canvas) {
    const ctx = canvas.getContext('2d');
    let signatureContacts = '', positionsContacts = [];
    return function dessiner(t, { parasites = true, mouvementReduit = false } = {}, temps = 0) {
      if (!ctx) return 0;
      const rect = canvas.getBoundingClientRect(), dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
      if (!rect.width || !rect.height) return 0;
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
      }
      const time = mouvementReduit ? 0 : temps;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width, h = rect.height, cx = w / 2, cy = h / 2, radius = Math.min(w, h) * .38;
      ctx.clearRect(0, 0, w, h); ctx.lineWidth = .8; ctx.strokeStyle = '#4a885338';
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, radius * i / 4, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();
      for (let i = 0; i < 60; i++) {
        const a = i * Math.PI / 30, r = radius + 6;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a) * (r + (i % 5 ? 3 : 7)), cy + Math.sin(a) * (r + (i % 5 ? 3 : 7))); ctx.stroke();
      }
      if (!t.power) return 0;
      const angle = time / (7000 - t.intensity * 40) * Math.PI * 2;
      for (let i = 30; i >= 0; i--) {
        const a = angle - i * .013; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, a, a + .015); ctx.closePath();
        ctx.fillStyle = 'rgba(128,228,157,' + (.17 * (1 - i / 31)) + ')'; ctx.fill();
      }
      ctx.strokeStyle = '#9bddae99'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius); ctx.stroke();
      const anomaly = t.anomalyUntil > Date.now(), signature = [t.seed, t.contacts, t.proximity, anomaly].join(':');
      if (signature !== signatureContacts) { positionsContacts = globalThis.AlienCore.positionsDuDetecteur(t, anomaly); signatureContacts = signature; }
      const count = positionsContacts.length, tone = t.intensity > 89 ? '#e7b17d' : '#b9f8c9';
      for (let i = 0; i < count; i++) {
        const point = positionsContacts[i], a = Math.atan2(point.y, point.x) + Math.sin(time / 800 + i) * t.intensity / 1000;
        const r = radius * Math.hypot(point.x, point.y), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        ctx.globalAlpha = mouvementReduit ? .9 : .6 + Math.sin(time / (500 - t.intensity * 3) + i) * .3;
        ctx.shadowColor = tone; ctx.shadowBlur = 14; ctx.fillStyle = tone; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = tone; ctx.globalAlpha = .12; ctx.beginPath(); ctx.arc(x, y, 8 + Math.sin(time / 600 + i) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#dcfce4'; ctx.beginPath(); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx + 4, cy + 4); ctx.closePath(); ctx.fill();
      if (t.noise > 0 && parasites && !mouvementReduit) {
        ctx.globalAlpha = t.noise / 100 * .17; ctx.fillStyle = '#98bd9f'; ctx.fillRect(0, (time * .09) % h, w, 3); ctx.globalAlpha = 1;
      }
      return count;
    };
  }
  globalThis.AlienDetecteur = Object.freeze({ creerRendu });
})();
