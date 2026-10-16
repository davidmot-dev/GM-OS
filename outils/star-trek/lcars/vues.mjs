import { createElement as h, useState } from 'react';
import { POSTES, STATUTS, EN_ATTENTE } from './postes.mjs';
import { Cadre, Media, bouton, champ, choix, carte, Destinataires, useCommandes } from './commun.mjs';
import { ConsolePoste } from './consoles.mjs';
export { PupitreMJ } from './pupitre.mjs';

function Intervention({ vue, poste, envoyer, occupe, horloge }) {
  const [selection, choisir] = useState(''), [action, changerAction] = useState(Object.keys(POSTES[poste].actions)[0]), [question, changerQuestion] = useState('');
  const cibles = vue.cibles.filter(c => c.poste === poste), cible = cibles.find(c => c.id === selection) || cibles[0];
  const attend = cible && vue.demandes.some(d => d.cibleId === cible.id && d.action === action && EN_ATTENTE.includes(d.statut));
  const formulaires = {
    commandement: ['Compte rendu demandé', 'Quelle information manque pour décider de la suite ?'],
    science: ['Programme de recherche', 'Que recherches-tu dans ce contact ou ce phénomène ?'],
    ingenierie: ['Équipe d’intervention', 'Quel diagnostic, quelle réparation ou quelle reconfiguration proposes-tu ?'],
    communications: ['Émetteur de sous-espace', 'Saisis le message à transmettre ou la demande de liaison.'],
    navigation: ['Préparer la manœuvre', 'Décris le cap ou la manœuvre proposés au commandant et au MJ.'],
    tactique: ['Posture tactique', 'Précise la cible, la posture et les précautions proposées.'],
    medecine: ['Protocole de prise en charge', 'Précise l’examen, l’analyse ou les soins que tu proposes.'],
  };
  return h('div', { className: `lcars-travail lcars-travail-${poste}` },
    h(ConsolePoste, { vue, poste, cible, cibles, choisir, horloge }),
    carte(formulaires[poste][0], h('form', { onSubmit: async e => {
      e.preventDefault(); if (cible && await envoyer('demander-intervention', { poste, cibleId: cible.id, action, question, affectation: vue.officier.affectation })) changerQuestion('');
    } }, choix('Cible de l’intervention', cible?.id || '', choisir, cibles.length ? cibles.map(c => [c.id, c.libelle]) : [['', 'Aucune cible révélée']], { disabled: occupe || !cibles.length }),
    h('p', { className: 'lcars-description' }, cible?.description || 'Le MJ peut révéler des éléments pour ce poste.'),
    choix('Action proposée', action, changerAction, Object.entries(POSTES[poste].actions), { disabled: occupe }),
    champ(poste === 'communications' ? 'Message ou demande' : 'Détails de l’intervention', { rows: 4, maxLength: 1000, value: question, onChange: e => changerQuestion(e.target.value), disabled: occupe,
      required: poste === 'communications' && action === 'transmettre', placeholder: formulaires[poste][1] }),
    h('p', { className: 'lcars-note' }, 'Proposition envoyée au MJ · résultat après arbitrage.'),
    h('button', { type: 'submit', className: 'lcars-primaire', disabled: occupe || !cible || attend }, attend ? 'Intervention en attente' : 'Transmettre l’intervention')), 'lcars-formulaire-poste'));
}
function Ordre({ envoyer, occupe, affectation }) {
  const [texte, modifier] = useState(''), [dest, choisir] = useState(['equipage']);
  return carte('Donner un ordre', h('form', { onSubmit: async e => { e.preventDefault(); if (await envoyer('donner-ordre', { texte, destinataires: dest, affectation })) modifier(''); } },
    champ('Texte de l’ordre', { rows: 3, value: texte, onChange: e => modifier(e.target.value), maxLength: 1000, required: true }),
    h(Destinataires, { valeur: dest, changer: choisir }), h('button', { type: 'submit', disabled: occupe || !dest.length || !texte.trim() }, 'Transmettre l’ordre')));
}
export function VueJoueur({ vue, envoyerCommande, horloge }) {
  const { envoyer, occupe, erreur } = useCommandes(envoyerCommande), [selection, choisir] = useState('');
  const poste = vue.officier.postes.includes(selection) ? selection : vue.officier.postes[0];
  const demandes = vue.demandes.filter(d => d.poste === poste);
  return h(Cadre, { vue, erreur, envoyer, horloge },
    h('nav', { className: 'lcars-onglets', 'aria-label': 'Consoles attribuées' }, vue.officier.postes.map(s => bouton(POSTES[s].nom, { key: s, 'aria-pressed': poste === s, onClick: () => choisir(s) }))),
    !poste ? carte('Affectation', h('p', null, 'Aucune console attribuée. Les rapports communs restent consultables.'))
      : h('div', null, h(Intervention, { key: poste, vue, poste, envoyer, occupe, horloge }),
        poste === 'commandement' && h(Ordre, { envoyer, occupe, affectation: vue.officier.affectation }),
        carte(poste === 'communications' ? 'Journal des transmissions' : 'Mes interventions', h('div', { role: 'log', 'aria-label': 'Mes interventions' },
          !demandes.length && h('p', { className: 'lcars-vide' }, 'Aucune intervention pour ce poste.'),
          [...demandes].reverse().map(d => h('article', { key: d.id, className: 'lcars-rapport' }, h('h4', null, d.cibleLibelle),
            h('p', { className: 'lcars-sur-titre' }, POSTES[d.poste].actions[d.action]), d.question && h('p', null, d.question), h('p', { className: 'lcars-etiquette' }, STATUTS[d.statut]),
            d.rapport && h('p', { className: 'lcars-texte-rapport' }, d.rapport), h(Media, { media: d.media }),
            EN_ATTENTE.includes(d.statut) && bouton('Annuler cette demande', { disabled: occupe, onClick: () => envoyer('annuler-demande', { demandeId: d.id, affectation: vue.officier.affectation }) }),
            d.statut === 'traitee' && (d.partageAutorise ? bouton(vue.publications.some(r => r.sourceId === d.id) ? 'Rapport partagé' : 'Partager à l’équipage', { disabled: occupe || vue.publications.some(r => r.sourceId === d.id), onClick: () => envoyer('partager-rapport', { demandeId: d.id, affectation: vue.officier.affectation }) }) : h('small', null, 'Rapport privé · partage non autorisé.'))))))),
    carte('Ordres de passerelle', h('div', null, !vue.ordres.length && h('p', { className: 'lcars-vide' }, 'Aucun ordre reçu.'), [...vue.ordres].reverse().map(o => h('article', { key: o.id, className: 'lcars-rapport' },
      h('h4', null, o.auteur), h('p', { className: 'lcars-texte-rapport' }, o.texte), h('p', { className: 'lcars-note' }, `Lu par : ${o.accuses.map(a => a.nom).join(', ') || 'aucun officier'}`),
      (o.destinataires.includes('equipage') || o.destinataires.some(s => vue.officier.postes.includes(s))) && bouton(o.accuses.some(a => a.personnageId === vue.officier.id) ? 'Lecture confirmée' : 'Accuser réception', { disabled: occupe || o.accuses.some(a => a.personnageId === vue.officier.id), onClick: () => envoyer('accuser-ordre', { ordreId: o.id, affectation: vue.officier.affectation }) }))))),
    carte('Rapports reçus', h('div', { role: 'log', 'aria-label': 'Rapports reçus' }, !vue.publications.length && h('p', { className: 'lcars-vide' }, 'Aucun rapport publié pour tes consoles.'),
      [...vue.publications].reverse().map(r => h('article', { key: r.id, className: 'lcars-rapport' }, h('h4', null, r.titre), h('p', { className: 'lcars-note' }, r.auteur), h('p', { className: 'lcars-texte-rapport' }, r.texte), h(Media, { media: r.media }))))));
}
