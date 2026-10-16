import { createElement as h, useState } from 'react';
import { POSTES, ETATS, NIVEAUX, EN_ATTENTE, STATUTS } from './postes.mjs';
import { Cadre, Media, PieceJointe, Destinataires, bouton, champ, choix, caseACocher, carte, nomAlerte, useCommandes } from './commun.mjs';
import { EquipageNatif, ImportPreparation } from './preparation-native.mjs';
const optionsPostes = Object.entries(POSTES).map(([id, p]) => [id, p.nom]);

function Reponse({ demande, cible, envoyer, occupe, medias = true }) {
  const [texte, modifier] = useState(''), [partage, partager] = useState(false), [acceptee, accepter] = useState(true), [etat, changerEtat] = useState(''), [media, joindre] = useState(null), [lecture, lire] = useState(false);
  return h('form', { onSubmit: e => { e.preventDefault(); void envoyer('resoudre-demande', { demandeId: demande.id, texte, partageAutorise: partage, acceptee, media, nouvelEtat: etat || null }); } },
    h('h4', null, demande.cibleLibelle), h('p', null, POSTES[demande.poste].actions[demande.action]), h('p', { className: 'lcars-texte-rapport' }, demande.question || 'Aucun détail complémentaire.'),
    h('div', { className: 'lcars-actions' }, EN_ATTENTE.map(s => bouton(STATUTS[s], { key: s, disabled: occupe, 'aria-pressed': demande.statut === s, onClick: () => envoyer('qualifier-demande', { demandeId: demande.id, statut: s }) }))),
    bouton('Utiliser le rapport préparé', { disabled: occupe || !cible?.rapportPrepare, onClick: () => modifier(cible.rapportPrepare) }),
    champ('Rapport destiné à l’officier', { rows: 5, value: texte, onChange: e => modifier(e.target.value), maxLength: 4000, required: true, disabled: occupe }),
    caseACocher('Accepter l’intervention', acceptee, v => { accepter(v); if (!v) { changerEtat(''); partager(false); } }, occupe),
    caseACocher('Autoriser le partage à l’équipage', partage, partager, occupe || !acceptee),
    choix('État résultant de la cible', etat, changerEtat, [['', 'Conserver l’état actuel'], ...POSTES[demande.poste].etats.map(v => [v, ETATS[v]])], { disabled: occupe || !acceptee }),
    medias && h(PieceJointe, { valeur: media, changer: joindre, disabled: occupe, charger: lire }),
    h('button', { type: 'submit', disabled: occupe || lecture || !texte.trim(), className: 'lcars-primaire' }, 'Transmettre le rapport privé'));
}
function Cible({ cible, envoyer, occupe, enregistrer }) {
  const [v, modifier] = useState(cible || { id: '', poste: 'science', libelle: '', description: '', rapportPrepare: '', visible: false, etat: 'inconnu' }), [confirme, confirmer] = useState(false);
  const changer = cle => e => modifier({ ...v, [cle]: e.target.value });
  return h('form', { onSubmit: async e => { e.preventDefault(); if (await envoyer('preparer-cible', { cibleId: v.id, poste: v.poste, libelle: v.libelle, description: v.description, rapportPrepare: v.rapportPrepare, visible: v.visible, etat: v.etat })) enregistrer(v.id); } },
    champ('Identifiant de l’élément', { value: v.id, onChange: changer('id'), readOnly: !!cible, maxLength: 128, required: true, pattern: '[a-zA-Z0-9][a-zA-Z0-9._:-]*', disabled: occupe }),
    choix('Poste de l’élément', v.poste, s => modifier({ ...v, poste: s, etat: POSTES[s].etats[0] }), optionsPostes, { disabled: occupe || !!cible }),
    champ('Libellé visible', { value: v.libelle, onChange: changer('libelle'), maxLength: 100, required: true, disabled: occupe }),
    champ('Description visible', { value: v.description, onChange: changer('description'), rows: 3, maxLength: 2000, disabled: occupe }),
    choix('État de l’élément', v.etat, etat => modifier({ ...v, etat }), POSTES[v.poste].etats.map(s => [s, ETATS[s]]), { disabled: occupe }),
    champ('Rapport préparé — privé MJ', { value: v.rapportPrepare, onChange: changer('rapportPrepare'), rows: 5, maxLength: 4000, disabled: occupe }),
    caseACocher('Révéler aux titulaires du poste', v.visible, visible => modifier({ ...v, visible }), occupe),
    h('button', { type: 'submit', disabled: occupe }, cible ? 'Enregistrer l’élément' : 'Créer l’élément'),
    cible && h('div', { className: 'lcars-note' }, caseACocher('Confirmer la suppression de cet élément', confirme, confirmer, occupe),
      bouton('Supprimer cet élément', { disabled: occupe || !confirme, onClick: async () => { if (await envoyer('supprimer-cible', { cibleId: cible.id })) enregistrer(''); } }), h('p', null, 'Les demandes en attente seront annulées ; les rapports déjà transmis sont conservés.')));
}
function Publication({ envoyer, occupe, medias = true }) {
  const [titre, titrer] = useState(''), [texte, modifier] = useState(''), [dest, choisir] = useState([]), [media, joindre] = useState(null), [lecture, lire] = useState(false);
  return h('form', { onSubmit: async e => { e.preventDefault(); if (await envoyer('publier-rapport', { titre, texte, destinataires: dest, media })) { modifier(''); joindre(null); titrer(''); } } },
    champ('Titre du rapport', { value: titre, onChange: e => titrer(e.target.value), maxLength: 100, required: true }),
    champ('Contenu du rapport', { value: texte, onChange: e => modifier(e.target.value), rows: 4, maxLength: 4000, required: true }),
    h(Destinataires, { valeur: dest, changer: choisir }), medias && h(PieceJointe, { valeur: media, changer: joindre, charger: lire, disabled: occupe }),
    h('button', { type: 'submit', disabled: occupe || lecture || !dest.length || !texte.trim() || !titre.trim() }, 'Publier aux destinataires choisis'));
}
function Equipage({ vue, envoyer, occupe }) {
  const [nom, nommer] = useState(''), [identifiant, identifier] = useState('');
  return h('div', null, vue.officiers.map(p => h('article', { key: p.id, className: 'lcars-officier' }, h('h4', null, p.nom), h('div', { className: 'lcars-affectations' }, optionsPostes.map(([s, libelle]) =>
    h('div', { key: s }, caseACocher(`${libelle} pour ${p.nom}`, p.postes.includes(s), coche => envoyer('preparer-officier', { personnageId: p.id, nom: p.nom, postes: coche ? [...p.postes, s] : p.postes.filter(v => v !== s) }), occupe)))))),
    h('form', { onSubmit: async e => { e.preventDefault(); if (await envoyer('preparer-officier', { personnageId: identifiant, nom, postes: [] })) { nommer(''); identifier(''); } } },
      champ('Identifiant du nouvel officier', { value: identifiant, onChange: e => identifier(e.target.value), pattern: '[a-zA-Z0-9][a-zA-Z0-9._:-]*', maxLength: 128, required: true }),
      champ('Nom du nouvel officier', { value: nom, onChange: e => nommer(e.target.value), maxLength: 80, required: true }), h('button', { type: 'submit', disabled: occupe }, 'Ajouter l’officier')));
}
function Alertes({ vue, envoyer, occupe }) {
  const [niveau, choisir] = useState(vue.alerte.niveau), [texte, modifier] = useState(vue.alerte.texte), [secondes, compter] = useState('');
  return h('form', { onSubmit: e => { e.preventDefault(); void envoyer('changer-alerte', { niveau, texte, secondes: secondes === '' ? null : Number(secondes) }); } },
    choix('Niveau d’alerte', niveau, choisir, NIVEAUX.map(n => [n, nomAlerte(n)])),
    champ('Consigne d’alerte', { value: texte, onChange: e => modifier(e.target.value), rows: 3, maxLength: 1000 }),
    champ('Compte à rebours en secondes (facultatif)', { type: 'number', value: secondes, onChange: e => compter(e.target.value), min: 1, max: 3600, step: 1 }),
    h('button', { type: 'submit', disabled: occupe }, 'Publier l’alerte'), bouton('Arrêter les effets', { disabled: occupe, onClick: () => envoyer('couper-effets', {}) }),
    h('p', { className: 'lcars-note' }, vue.integration ? 'Alerte visuelle : le décompte ne résout pas automatiquement la situation.' : 'Le décompte terminé arrête la sirène sans résoudre automatiquement la situation. Les médias se lisent volontairement.'));
}
function Prereglages({ vue, envoyer, occupe }) {
  const [selection, choisir] = useState(''), [nom, nommer] = useState('');
  const preset = vue.prereglages.find(p => p.id === selection) || vue.prereglages[0];
  return h('div', null, choix('Préréglage de situation', preset?.id || '', choisir, vue.prereglages.length ? vue.prereglages.map(p => [p.id, p.nom]) : [['', 'Aucun préréglage']]),
    preset && h('div', null, h('p', null, preset.situation), h('p', null, `${nomAlerte(preset.niveau)} · ${preset.cibles.length} états d’éléments mémorisés`),
      h('p', { className: 'lcars-note' }, 'Appliquer remplace la situation, l’alerte et les états mémorisés. Affectations, demandes et rapports restent conservés ; les effets sont arrêtés.'),
      bouton('Appliquer ce préréglage', { disabled: occupe, onClick: () => envoyer('charger-prereglage', { prereglageId: preset.id }) }),
      bouton('Supprimer ce préréglage', { disabled: occupe, onClick: () => envoyer('supprimer-prereglage', { prereglageId: preset.id }) })),
    champ('Nom du préréglage', { value: nom, onChange: e => nommer(e.target.value), maxLength: 80 }),
    bouton('Enregistrer un nouveau préréglage', { disabled: occupe || !nom.trim(), onClick: () => envoyer('enregistrer-prereglage', { prereglageId: `preset-${Date.now()}`, nom }) }),
    preset && bouton('Mettre à jour ce préréglage', { disabled: occupe || !nom.trim(), onClick: () => envoyer('enregistrer-prereglage', { prereglageId: preset.id, nom }) }));
}
export function PupitreMJ({ vue, envoyerCommande, horloge }) {
  const { envoyer, occupe, erreur } = useCommandes(envoyerCommande);
  const [panneau, choisirPanneau] = useState('passerelle'), [filtre, filtrer] = useState('tous'), [selection, choisir] = useState(''), [cibleId, choisirCible] = useState(''), [archivage, confirmer] = useState(false);
  const attentes = vue.demandes.filter(d => EN_ATTENTE.includes(d.statut)), filtrees = attentes.filter(d => filtre === 'tous' || d.poste === filtre);
  const demande = filtrees.find(d => d.id === selection) || filtrees[0], cible = vue.cibles.find(c => c.id === cibleId);
  return h(Cadre, { vue, mj: true, erreur, envoyer, horloge },
    h('nav', { className: 'lcars-onglets', 'aria-label': 'Panneaux du pupitre' }, [['passerelle', 'Passerelle'], ['demandes', `Demandes (${attentes.length})`], ['preparation', 'Préparation'], ['diffusion', 'Diffusion'], ['prereglages', 'Préréglages'], ...(vue.integration ? [['import', 'Importer une préparation']] : [])].map(([id, nom]) => bouton(nom, { key: id, 'aria-pressed': panneau === id, onClick: () => choisirPanneau(id) }))),
    panneau === 'passerelle' && h('div', null,
      carte('Officiers et consoles', h(vue.integration ? EquipageNatif : Equipage, { vue, envoyer, occupe })),
      h('div', { className: 'lcars-grille' }, carte('Situation et alertes', h(Alertes, { vue, envoyer, occupe })),
        carte('Vaisseau', h('form', { onSubmit: e => { e.preventDefault(); const f = new FormData(e.currentTarget); void envoyer('configurer-vaisseau', { nom: f.get('nom'), immatriculation: f.get('immatriculation'), situation: f.get('situation') }); } },
          champ('Nom du vaisseau', { name: 'nom', defaultValue: vue.vaisseau.nom, maxLength: 80, required: true }), champ('Immatriculation', { name: 'immatriculation', defaultValue: vue.vaisseau.immatriculation, maxLength: 40, required: true }),
          champ('Situation partagée', { name: 'situation', defaultValue: vue.situation, rows: 4, maxLength: 2000 }), h('button', { type: 'submit', disabled: occupe }, 'Publier la situation'))))),
    panneau === 'demandes' && carte('Interventions de la passerelle', h('div', null,
      choix('Filtrer par poste', filtre, filtrer, [['tous', 'Tous les postes'], ...optionsPostes]),
      !demande ? h('p', null, 'Aucune demande en attente pour ce filtre.') : h('div', null,
        choix('Demande à traiter', demande.id, choisir, filtrees.map(d => [d.id, `${vue.officiers.find(p => p.id === d.personnageId)?.nom} · ${POSTES[d.poste].nom} · ${d.cibleLibelle} · ${POSTES[d.poste].actions[d.action]}`])),
        h(Reponse, { key: demande.id, demande, cible: vue.cibles.find(c => c.id === demande.cibleId), envoyer, occupe, medias: vue.integration?.medias !== false })),
      h('details', null, h('summary', null, 'Historique et archivage'), [...vue.demandes].reverse().map(d => h('p', { key: d.id }, `${d.cibleLibelle} · ${STATUTS[d.statut]}`)),
        caseACocher('Confirmer l’archivage des demandes résolues', archivage, confirmer), bouton('Archiver les demandes résolues', { disabled: occupe || !archivage, onClick: () => envoyer('archiver-demandes', {}) })))),
    panneau === 'preparation' && carte('Éléments par poste', h('div', null,
      choix('Élément préparé', cibleId, choisirCible, [['', 'Nouvel élément'], ...vue.cibles.map(c => [c.id, `${POSTES[c.poste].code} · ${c.libelle}${c.visible ? '' : ' · masqué'}`])]),
      h(Cible, { key: cible?.id || 'nouveau', cible, envoyer, occupe, enregistrer: choisirCible }))),
    panneau === 'diffusion' && h('div', null, carte('Publier un rapport ciblé', h(Publication, { envoyer, occupe, medias: vue.integration?.medias !== false })),
      carte('Rapports publiés', h('div', null, [...vue.publications].reverse().map(r => h('article', { key: r.id, className: 'lcars-rapport' },
        h('h4', null, r.titre), h('p', null, r.destinataires.map(d => POSTES[d]?.nom || 'Tout l’équipage').join(', ')), h('p', { className: 'lcars-texte-rapport' }, r.texte), h(Media, { media: r.media }),
        bouton('Retirer ce rapport', { disabled: occupe, onClick: () => envoyer('retirer-publication', { publicationId: r.id }) }))))),
      carte('Ordres et accusés', h('div', null, [...vue.ordres].reverse().map(o => h('article', { key: o.id, className: 'lcars-rapport' }, h('h4', null, o.auteur), h('p', null, o.texte), h('p', null, `Lu par : ${o.accuses.map(a => a.nom).join(', ') || 'aucun officier'}`)))))),
    panneau === 'prereglages' && carte('Préréglages de situation', h(Prereglages, { vue, envoyer, occupe })),
    panneau === 'import' && vue.integration && carte('Import de préparation LCARS', h(ImportPreparation, { envoyer, occupe })));
}
