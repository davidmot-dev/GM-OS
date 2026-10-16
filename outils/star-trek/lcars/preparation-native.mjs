import { createElement as h, useRef, useState } from 'react';
import { lireConfiguration } from './configuration.mjs';
import { POSTES } from './postes.mjs';
import { bouton, choix, caseACocher } from './commun.mjs';
export function EquipageNatif({ vue, envoyer, occupe }) {
  const [selection, choisir] = useState('');
  const disponibles = vue.personnages.filter(p => !vue.officiers.some(o => o.id === p.id));
  const choisi = disponibles.find(p => p.id === selection) || disponibles[0];
  return h('div', null, h('p', { className: 'lcars-note' }, 'Attribue les consoles ici, puis ouvre séparément les accès dans Modules du jeu. Un personnage peut tenir plusieurs postes.'),
    vue.officiers.map(p => {
      const courant = vue.personnages.find(c => c.id === p.id);
      return h('article', { key: p.id, className: 'lcars-officier' }, h('h4', null, courant?.nom || p.nom),
        !courant ? h('p', { className: 'lcars-note' }, 'Ancien personnage de campagne · historique conservé, affectations retirées.')
          : h('div', { className: 'lcars-affectations' }, Object.entries(POSTES).map(([s, poste]) => h('div', { key: s, className: p.postes.includes(s) ? 'lcars-poste-attribue' : '' },
            caseACocher(`${poste.nom} pour ${courant.nom}`, p.postes.includes(s), coche => envoyer('preparer-officier',
              { personnageId: p.id, nom: courant.nom, postes: coche ? [...p.postes, s] : p.postes.filter(v => v !== s) }), occupe),
            p.postes.includes(s) && h('span', { className: 'lcars-affectation-statut' }, 'Attribué')))));
    }),
    disponibles.length > 0 && h('div', null,
      choix('Personnage à préparer', choisi?.id || '', choisir, disponibles.map(p => [p.id, p.nom]), { disabled: occupe || vue.officiers.length >= 16 }),
      bouton('Préparer ce personnage', { disabled: occupe || !choisi || vue.officiers.length >= 16, onClick: () => envoyer('preparer-officier', { personnageId: choisi.id, nom: choisi.nom, postes: [] }) })),
    vue.officiers.length >= 16 && h('p', { role: 'status' }, 'Limite atteinte : 16 officiers préparés, anciens auteurs compris. Aucun personnage supplémentaire ne sera créé.'),
    !vue.personnages.length && h('p', null, 'Ajoute des personnages à cette campagne pour préparer l’équipage.'));
}
export function ImportPreparation({ envoyer, occupe }) {
  const [configuration, choisir] = useState(null), [erreur, signaler] = useState(''), [confirme, confirmer] = useState(false), [lecture, lire] = useState(false);
  const sequence = useRef(0);
  async function charger(e) {
    const numero = ++sequence.current, fichier = e.target.files?.[0]; choisir(null); confirmer(false); signaler(''); lire(!!fichier);
    if (!fichier) return;
    try {
      if (fichier.size > 16 * 1024 * 1024) throw new Error('Fichier supérieur à 16 Mo.');
      const donnees = lireConfiguration(await fichier.text());
      if (numero === sequence.current) choisir({ moduleId: 'star-trek-lcars', versionDonnees: 2, donnees });
    } catch (e) { if (numero === sequence.current) signaler(e.message || 'Configuration illisible.'); }
    finally { if (numero === sequence.current) lire(false); }
  }
  return h('div', null,
    h('p', null, 'Importer la préparation d’un atelier LCARS remplace le vaisseau, les éléments et les préréglages. Les officiers fictifs et leurs échanges ne sont pas importés.'),
    h('label', null, 'Fichier de préparation LCARS', h('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Fichier de préparation LCARS', onChange: charger, disabled: occupe })),
    lecture && h('p', { role: 'status' }, 'Lecture de la préparation…'), erreur && h('p', { role: 'alert' }, erreur),
    configuration && h('div', null, h('h4', null, configuration.donnees.vaisseau.nom),
      h('p', null, `${configuration.donnees.cibles.length} éléments · ${configuration.donnees.prereglages.length} préréglages`),
      h('p', null, 'Les historiques et affectations LCARS actuels seront effacés ; les accès seront fermés et les effets arrêtés. Les autres données de campagne sont conservées. Exporte la sauvegarde GM-OS avant remplacement si tu veux garder ces échanges.'),
      caseACocher('Je confirme le remplacement de la préparation et des historiques LCARS', confirme, confirmer, occupe),
      bouton('Remplacer la préparation LCARS', { disabled: occupe || !confirme, onClick: async () => {
        if (await envoyer('importer-preparation', { configuration })) { choisir(null); confirmer(false); }
      } }), bouton('Annuler cet import', { disabled: occupe, onClick: () => { sequence.current++; choisir(null); confirmer(false); } })));
}
