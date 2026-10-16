/** Banc local : les rôles simulés partagent une page. Ce sélecteur n'authentifie personne. */
import { createElement as h, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { appliquerCommande, vuePour } from './moteur.mjs';
import { creerFiction, mj } from './fiction.mjs';
import { cleSauvegarde, exporterConfiguration, lireConfiguration } from './configuration.mjs';
import { VueJoueur, PupitreMJ } from './vues.mjs';
import { bouton, choix } from './commun.mjs';
function initialiser() {
  try {
    const sauvegarde = localStorage.getItem(cleSauvegarde);
    if (sauvegarde === null) return { etat: creerFiction(), statut: 'Fiction de test prête. Les changements seront enregistrés dans ce navigateur.', bloque: false };
    try { return { etat: lireConfiguration(sauvegarde), statut: 'Atelier restauré ; sons, décompte et animations arrêtés.', bloque: false }; }
    catch { return { etat: creerFiction(), statut: 'Copie locale illisible conservée. Écriture suspendue : importe une copie valide ou recommence la fiction.', bloque: true }; }
  } catch { return { etat: creerFiction(), statut: 'Stockage local indisponible. Utilise l’export avant de fermer.', bloque: false }; }
}
function Atelier() {
  const [initial] = useState(initialiser), [etat, setEtat] = useState(initial.etat), [selection, choisir] = useState('pj:pj-tlen'), [generation, changerGeneration] = useState(0);
  const [statut, signaler] = useState(initial.statut), [erreur, signalerErreur] = useState(''), [candidat, preparer] = useState(null), [recommencer, confirmer] = useState(false);
  const courant = useRef(etat), bloque = useRef(initial.bloque), importNumero = useRef(0);
  const officier = etat.officiers.find(p => `pj:${p.id}` === selection) || etat.officiers[0];
  const roleMJ = selection === 'mj' || !officier;
  const lecteur = roleMJ ? mj : { role: 'joueur', personnageId: officier.id, appareilId: `atelier-${etat.officiers.indexOf(officier)}` };
  const vue = vuePour(etat, lecteur);
  function installer(suivant, remplacer = false) {
    courant.current = suivant; setEtat(suivant);
    if (bloque.current && !remplacer) return;
    try { localStorage.setItem(cleSauvegarde, JSON.stringify(exporterConfiguration(suivant))); bloque.current = false; signaler('Atelier enregistré automatiquement dans ce navigateur.'); }
    catch { signaler('Sauvegarde locale impossible ou pleine. La session reste ouverte ; exporte avant de fermer.'); }
  }
  async function envoyerCommande(commande) {
    try { installer(appliquerCommande(courant.current, commande, lecteur)); return { ok: true }; }
    catch (e) { return { ok: false, erreur: e.message || 'Commande refusée.' }; }
  }
  function exporter() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exporterConfiguration(courant.current), null, 2)], { type: 'application/json' }));
    const lien = document.createElement('a'); lien.href = url; lien.download = 'lcars-atelier.json'; document.body.append(lien); lien.click(); lien.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return h('main', null,
    h('header', { className: 'atelier-lcars' }, h('div', null, h('strong', null, 'Atelier LCARS · sept postes en test'), h('p', null, 'Fiction locale · aucun lien avec les campagnes GM-OS'), h('p', { role: 'status' }, statut)),
      choix('Vue de test', roleMJ ? 'mj' : `pj:${officier.id}`, choisir, [...etat.officiers.map(p => [`pj:${p.id}`, p.nom]), ['mj', 'Meneur de jeu']]),
      bouton('Recommencer la fiction', { onClick: () => confirmer(true) })),
    recommencer && h('section', { className: 'atelier-transfert', 'aria-label': 'Réinitialisation de l’atelier' }, h('p', null, 'Remplacer les essais locaux par la fiction initiale ? La préparation actuelle sera effacée de cet atelier.'),
      bouton('Oui, recommencer', { onClick: () => { installer(creerFiction(), true); preparer(null); confirmer(false); changerGeneration(generation + 1); signalerErreur(''); } }), bouton('Garder les essais', { onClick: () => confirmer(false) })),
    roleMJ && h('section', { className: 'atelier-transfert', 'aria-label': 'Sauvegarde de l’atelier' },
      h('div', { className: 'lcars-actions' }, bouton('Exporter l’atelier', { onClick: exporter }), h('label', null, 'Importer un atelier', h('input', { type: 'file', 'aria-label': 'Importer un atelier', accept: '.json,application/json', onChange: async e => {
        const n = ++importNumero.current, f = e.target.files?.[0]; e.target.value = ''; preparer(null); signalerErreur(''); if (!f) return;
        try { if (f.size > 16 * 1024 * 1024) throw new Error('Fichier trop volumineux.'); const v = lireConfiguration(await f.text()); if (n === importNumero.current) preparer(v); }
        catch (err) { if (n === importNumero.current) signalerErreur(err.message || 'Import refusé.'); }
      } }))),
      candidat && h('div', null, h('p', null, `${candidat.vaisseau.nom} · ${candidat.officiers.length} officiers · ${candidat.cibles.length} éléments. Remplacer la préparation et l’historique de cet atelier ?`),
        bouton('Remplacer l’atelier', { onClick: () => { installer(candidat, true); preparer(null); changerGeneration(generation + 1); } }), bouton('Annuler l’import', { onClick: () => preparer(null) })),
      erreur && h('p', { role: 'alert' }, erreur)),
    h(roleMJ ? PupitreMJ : VueJoueur, { key: `${roleMJ ? 'mj' : officier.id}-${vue.officier?.affectation ?? 0}-${generation}`, vue, envoyerCommande }));
}
createRoot(document.getElementById('atelier')).render(h(Atelier));
