/* Métadonnées et lecteur communs au module React et à l'atelier autonome. */
(() => {
  'use strict';
  const dureeSecondes = 775.701;
  function creer({ element, source, maintenant = Date.now, planifier = setInterval, retirer = clearInterval,
    signaler = () => {}, lectureChange = () => {} }) {
    let sequence = null, fin = 0, autoriseSon = false, minuterie = null, generation = 0, actif = false, termine = false, detruit = false;
    const ecouteurs = [];
    function ecouter(nom, fonction) { element.addEventListener(nom, fonction); ecouteurs.push([nom, fonction]); }
    function reglerSon() {
      const muet = !autoriseSon || !sequence || termine || detruit;
      if (element.muted !== muet) element.muted = muet;
    }
    function pause() { element.pause(); actif = false; lectureChange(false); }
    function arreter() {
      generation++; sequence = null; termine = false;
      if (minuterie !== null) retirer(minuterie);
      minuterie = null; element.muted = true; pause();
    }
    function finie() { generation++; termine = true; reglerSon(); pause(); if (minuterie !== null) retirer(minuterie); minuterie = null; signaler(''); }
    function synchroniser() {
      if (!sequence || detruit || termine) return false;
      const ecoule = Math.max(0, (maintenant() - sequence.startedAt) / 1000);
      const duree = Number.isFinite(element.duration) && element.duration > 0 ? element.duration : dureeSecondes;
      if (maintenant() >= fin || ecoule >= duree) { finie(); return false; }
      if (element.readyState >= 1 && Math.abs(element.currentTime - ecoule) > 1.5) {
        try { element.currentTime = ecoule; } catch { /* Le prochain événement média réessaiera. */ }
      }
      return true;
    }
    async function reprendre() {
      if (!synchroniser()) return;
      const appel = generation;
      reglerSon(); signaler(''); lectureChange(true);
      try {
        await element.play();
        if (detruit || appel !== generation || !sequence || termine) return;
        actif = true; lectureChange(true);
      } catch {
        if (detruit || appel !== generation || !sequence || termine) return;
        actif = false; lectureChange(false);
        signaler('Lecture automatique bloquée. Cliquer sur « Reprendre la vidéo ».');
      }
    }
    function suivre(autodestruction, finDuCompte, avecSon) {
      if (detruit) return;
      const changeSon = autoriseSon !== !!avecSon;
      autoriseSon = !!avecSon;
      if (!autodestruction || !Number.isFinite(finDuCompte)) { arreter(); return; }
      if (sequence?.id === autodestruction.id) {
        fin = finDuCompte; reglerSon();
        if (changeSon && !termine) void reprendre();
        return;
      }
      arreter(); sequence = autodestruction; fin = finDuCompte; termine = false;
      element.src = source; element.loop = false; element.playsInline = true; reglerSon();
      if (!synchroniser()) return;
      // Le film possède la priorité audio pendant son chargement puis sa lecture.
      lectureChange(true); signaler('');
      minuterie = planifier(synchroniser, 1000);
      void reprendre();
    }
    ecouter('loadedmetadata', () => { if (sequence && !termine) void reprendre(); });
    ecouter('ended', finie);
    ecouter('error', () => {
      if (!sequence || detruit) return;
      finie(); signaler('Vidéo indisponible ; le décompte et l’alarme restent actifs.');
    });
    ecouter('volumechange', reglerSon);
    function detruire() {
      arreter(); detruit = true;
      for (const [nom, fonction] of ecouteurs) element.removeEventListener(nom, fonction);
      element.removeAttribute('src'); element.load();
    }
    return Object.freeze({ suivre, reprendre, arreter, detruire, estEnLecture: () => actif });
  }
  globalThis.AlienVideoAlerte = Object.freeze({ dureeSecondes, creer });
})();
