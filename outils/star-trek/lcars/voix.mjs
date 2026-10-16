/** LCARS ne met pas ses annonces derrière une autre voix et lui cède la main. */
const courtiers = new WeakMap();
export function creerVoix({ synthese = globalThis.speechSynthesis, Parole = globalThis.SpeechSynthesisUtterance, signaler = () => {} } = {}) {
  if (!synthese || !Parole) return { parler: () => false, arreter() {}, detruire() {} };
  let courtier = courtiers.get(synthese);
  if (!courtier) {
    const parler = synthese.speak, annuler = synthese.cancel;
    courtier = { proprietaires: new Set(), enCours: null, parler, annulerOriginal: annuler };
    const liberer = () => { const ancien = courtier.enCours; courtier.enCours = null; if (ancien) annuler.call(synthese); };
    courtier.intercepter = phrase => { liberer(); parler.call(synthese, phrase); };
    courtier.annuler = () => { courtier.enCours = null; annuler.call(synthese); };
    // Les appels des autres outils gardent leur API et deviennent prioritaires.
    try { synthese.speak = courtier.intercepter; synthese.cancel = courtier.annuler; }
    catch {
      try { if (synthese.speak === courtier.intercepter) synthese.speak = parler; } catch { /* API non modifiable. */ }
      signaler('Coordination vocale indisponible ; les annonces LCARS restent désactivées.'); return { parler: () => false, arreter() {}, detruire() {} };
    }
    courtiers.set(synthese, courtier);
  }
  const proprietaire = {}; courtier.proprietaires.add(proprietaire);
  function arreter() {
    if (courtier.enCours?.proprietaire !== proprietaire) return;
    courtier.enCours = null; courtier.annulerOriginal.call(synthese);
  }
  function parler(texte) {
    if (!courtier.proprietaires.has(proprietaire) || courtier.enCours || synthese.speaking || synthese.pending) return false;
    const voix = synthese.getVoices?.().find(v => v.localService && /^fr(?:[-_]|$)/i.test(v.lang));
    if (synthese.getVoices && !voix) { signaler('Voix française locale indisponible ; le décompte visuel reste actif.'); return false; }
    const phrase = new Parole(texte); phrase.lang = voix?.lang || 'fr-FR'; if (voix) phrase.voice = voix;
    const acte = { proprietaire, phrase }; courtier.enCours = acte;
    const terminer = () => { if (courtier.enCours === acte) courtier.enCours = null; };
    phrase.onend = terminer; phrase.onerror = () => { terminer(); signaler('Annonce vocale indisponible.'); };
    try { courtier.parler.call(synthese, phrase); return true; } catch { terminer(); signaler('Annonce vocale indisponible.'); return false; }
  }
  function detruire() {
    arreter(); courtier.proprietaires.delete(proprietaire);
    if (courtier.proprietaires.size) return;
    if (synthese.speak === courtier.intercepter) synthese.speak = courtier.parler;
    if (synthese.cancel === courtier.annuler) synthese.cancel = courtier.annulerOriginal;
    courtiers.delete(synthese);
  }
  return { parler, arreter, detruire };
}
