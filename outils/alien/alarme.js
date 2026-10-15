/* 15/10 : une seule sirène et une seule annonce par minute sur l'appareil choisi. */
(() => {
  'use strict';
  function creer({ audio, synthese = globalThis.speechSynthesis, Parole = globalThis.SpeechSynthesisUtterance,
    maintenant = Date.now, planifier = setInterval, retirer = clearInterval, signaler = () => {} }) {
    let minuterie = null, sequence = '', fin = 0, minuteAnnoncee = null, noeuds = null, parole = null, detruit = false;
    function couperSirene() {
      if (!noeuds) return;
      for (const n of [noeuds.oscillateur, noeuds.modulateur]) { try { n.stop(); } catch { /* Déjà arrêté. */ } }
      for (const n of Object.values(noeuds)) n.disconnect();
      noeuds = null;
    }
    function couperVoix() {
      if (parole) { parole.onend = null; parole.onerror = null; parole = null; synthese?.cancel(); }
    }
    function arreter() {
      if (minuterie !== null) retirer(minuterie);
      minuterie = null; couperSirene(); couperVoix(); sequence = ''; minuteAnnoncee = null; signaler('');
    }
    function parler(minutes) {
      const voix = synthese?.getVoices?.().find(v => v.localService === true && /^fr(?:[-_]|$)/i.test(v.lang));
      if (!voix || !Parole) { signaler('Voix française locale indisponible ; sirène et affichage restent actifs.'); return; }
      try {
        couperVoix();
        const annonce = new Parole(minutes > 0
          ? `Autodestruction. Il reste ${minutes} minute${minutes > 1 ? 's' : ''}. Évacuation immédiate.`
          : 'Compte à rebours terminé.');
        annonce.voice = voix; annonce.lang = voix.lang; annonce.rate = 0.85; annonce.pitch = 0.7; annonce.volume = 0.85;
        parole = annonce;
        if (noeuds) noeuds.volume.gain.setValueAtTime(0.008, audio.currentTime);
        const terminer = () => {
          if (parole !== annonce) return;
          parole = null;
          if (noeuds) noeuds.volume.gain.setValueAtTime(0.035, audio.currentTime);
        };
        annonce.onend = terminer;
        annonce.onerror = () => { terminer(); signaler('Annonce vocale indisponible sur cet appareil.'); };
        synthese.speak(annonce); minuteAnnoncee = minutes; signaler('');
      } catch { signaler('Annonce vocale indisponible sur cet appareil.'); }
    }
    function avancer() {
      if (!sequence || detruit) return;
      const restantes = Math.max(0, Math.ceil((fin - maintenant()) / 60000));
      if (restantes === 0) {
        if (minuterie !== null) retirer(minuterie);
        minuterie = null; couperSirene();
        if (minuteAnnoncee !== 0) parler(0);
        sequence = ''; return;
      }
      // Un onglet réveillé annonce l'échéance courante, sans rejouer les minutes manquées.
      if (restantes !== minuteAnnoncee) parler(restantes);
    }
    const voixPretes = () => { if (sequence && minuteAnnoncee === null) avancer(); };
    synthese?.addEventListener?.('voiceschanged', voixPretes);
    function suivre(autodestruction, finDuCompte, autorise) {
      if (detruit) return;
      if (!autorise || !autodestruction || !Number.isFinite(finDuCompte) || finDuCompte <= maintenant() || audio.state !== 'running') {
        arreter(); return;
      }
      if (sequence === autodestruction.id && fin === finDuCompte) return;
      arreter(); sequence = autodestruction.id; fin = finDuCompte;
      try {
        const oscillateur = audio.createOscillator(), modulateur = audio.createOscillator();
        const amplitude = audio.createGain(), volume = audio.createGain();
        noeuds = { oscillateur, modulateur, amplitude, volume };
        oscillateur.type = 'triangle'; oscillateur.frequency.value = 650;
        modulateur.type = 'sine'; modulateur.frequency.value = 0.5;
        amplitude.gain.value = 280; volume.gain.value = 0.035;
        modulateur.connect(amplitude); amplitude.connect(oscillateur.frequency);
        oscillateur.connect(volume); volume.connect(audio.destination);
        oscillateur.start(); modulateur.start();
      } catch { arreter(); signaler('Sirène indisponible sur cet appareil.'); return; }
      avancer(); if (sequence) minuterie = planifier(avancer, 1000);
    }
    function detruire() { arreter(); detruit = true; synthese?.removeEventListener?.('voiceschanged', voixPretes); }
    return Object.freeze({ suivre, arreter, detruire });
  }
  globalThis.AlienAlarme = Object.freeze({ creer });
})();
