/** Instruments propres aux postes. Uniquement la projection autorisée, aucune mesure inventée. */
import { createElement as h, useEffect, useState } from 'react';
import { POSTES, ETATS, EN_ATTENTE } from './postes.mjs';
import { Capteurs, nomAlerte } from './commun.mjs';

const titres = {
  commandement: ['01 / OPÉRATIONS', 'Table de commandement', 'Objectifs de mission'],
  science: ['02 / ASTROMÉTRIE', 'Laboratoire des capteurs', 'Contacts révélés'],
  ingenierie: ['03 / SYSTÈMES', 'Synoptique du vaisseau', 'Circuits supervisés'],
  communications: ['04 / SOUS-ESPACE', 'Centre des transmissions', 'Canaux de liaison'],
  navigation: ['05 / ASTROGATION', 'Cartographie de vol', 'Itinéraires proposés'],
  tactique: ['06 / SÉCURITÉ', 'Situation tactique', 'Contacts et périmètres'],
  medecine: ['07 / INFIRMERIE', 'Dossiers médicaux', 'Patients et prélèvements'],
};
const ton = etat => ['perturbe', 'brouille', 'risque', 'urgence', 'hostile', 'hors-service', 'bloque'].includes(etat) ? 'attention' : 'courant';
const etiquette = c => h('span', { className: `lcars-etat-element lcars-ton-${ton(c.etat)}` }, ETATS[c.etat]);
const titreSvg = (titre, enfants) => h('svg', { viewBox: '0 0 520 300', role: 'img', 'aria-label': titre }, enfants);
function Selection({ cibles, cible, choisir, poste, variante = '' }) {
  return h('div', { className: `lcars-selecteur lcars-selecteur-${variante || poste}`, role: 'group', 'aria-label': titres[poste][2] },
    !cibles.length && h('p', { className: 'lcars-vide' }, 'Aucun élément révélé par le MJ.'),
    cibles.map((c, i) => h('button', { key: c.id, type: 'button', className: `lcars-element lcars-ton-${ton(c.etat)}`,
      'aria-label': `${c.libelle} · ${ETATS[c.etat]}`, 'aria-pressed': cible?.id === c.id, onClick: () => choisir(c.id) },
    h('span', { className: 'lcars-index', 'aria-hidden': true }, `${POSTES[poste].code} / ${String(i + 1).padStart(2, '0')}`),
    h('strong', null, c.libelle), etiquette(c))));
}
function Fiche({ cible, libelle = 'Élément sélectionné' }) {
  return h('div', { className: 'lcars-fiche' }, h('p', { className: 'lcars-sur-titre' }, libelle),
    h('h4', null, cible?.libelle || 'En attente de données'), cible && etiquette(cible),
    h('p', null, cible?.description || 'Le MJ peut révéler les éléments de cette console.'));
}
function Instrument({ vue, poste, horloge = Date.now, children }) {
  const scan = vue.officier.scan, [actif, modifier] = useState(false);
  useEffect(() => {
    const reste = vue.effetsActifs && scan?.poste === poste ? scan.at + scan.duree - horloge() : 0;
    modifier(reste > 0); if (reste <= 0) return;
    const t = setTimeout(() => modifier(false), reste); return () => clearTimeout(t);
  }, [scan?.id, scan?.at, scan?.duree, poste, vue.effetsActifs, horloge]);
  return h('div', { className: `lcars-instrument${actif ? ' lcars-balayage' : ''}` }, children,
    h('p', { className: 'lcars-scan-statut', role: 'status' }, actif ? 'Traitement de la demande…' : scan?.poste === poste ? 'Transmission effectuée · résultat attendu du MJ' : 'Console prête'));
}
// Les positions et tracés servent de repères de sélection ; aucune distance ni valeur physique.
function Coque() {
  return h('g', { className: 'lcars-coque', 'aria-hidden': true },
    h('ellipse', { cx: 260, cy: 92, rx: 114, ry: 65 }), h('ellipse', { cx: 260, cy: 92, rx: 89, ry: 44 }),
    h('ellipse', { cx: 260, cy: 92, rx: 30, ry: 15 }), h('path', { d: 'M241 155L230 248Q260 274 290 248L279 155 M237 180L167 236 M283 180L353 236' }),
    h('rect', { x: 144, y: 154, width: 24, height: 128, rx: 12 }), h('rect', { x: 352, y: 154, width: 24, height: 128, rx: 12 }));
}
function Commandement(p) {
  const demandes = p.vue.demandes.filter(d => EN_ATTENTE.includes(d.statut));
  return h('div', { className: 'lcars-commandement' },
    h('div', { className: 'lcars-bande-commandement' }, h('div', null, h('span', null, 'POSTURE DE PASSERELLE'), h('strong', null, nomAlerte(p.vue.alerte.niveau))),
      h('div', null, h('strong', null, String(demandes.length).padStart(2, '0')), h('span', null, 'mes demandes en cours')),
      h('div', null, h('strong', null, String(p.vue.ordres.length).padStart(2, '0')), h('span', null, 'ordres accessibles'))),
    h(Instrument, p, h('div', { className: 'lcars-mission' }, h('p', { className: 'lcars-sur-titre' }, 'JOURNAL DE MISSION'),
      h(Selection, p), h(Fiche, { cible: p.cible, libelle: 'Objectif au premier plan' }))),
    h('div', { className: 'lcars-suivi-ordres' }, h('h4', null, 'Suivi des consignes'),
      !p.vue.ordres.length && h('p', { className: 'lcars-note' }, 'Aucun ordre transmis. Le formulaire ci-dessous permet de coordonner l’équipage.'),
      [...p.vue.ordres].reverse().slice(0, 3).map(o => h('article', { key: o.id }, h('p', null, o.texte), h('small', null, `Accusés : ${o.accuses.map(a => a.nom).join(', ') || 'en attente'}`)))));
}
function Science(p) {
  return h('div', { className: 'lcars-science' },
    h('div', { className: 'lcars-ecran-science' }, h(Capteurs, { cible: p.cible, poste: p.poste, scan: p.vue.officier.scan, effetsActifs: p.vue.effetsActifs, horloge: p.horloge }),
      h('div', { className: 'lcars-spectre', 'aria-hidden': true }, Array.from({ length: 36 }, (_, i) => h('i', { key: i, style: { height: `${12 + (i * 37 % 67)}%` } }))),
      h('p', { className: 'lcars-note' }, 'Spectre illustratif · aucune mesure acquise')),
    h('div', null, h(Selection, p), h(Fiche, { cible: p.cible, libelle: 'Objet de recherche' })));
}
function Ingenierie(p) {
  const i = Math.max(0, p.cibles.findIndex(c => c.id === p.cible?.id));
  return h('div', { className: 'lcars-ingenierie' },
    h(Instrument, p, titreSvg('Schéma des systèmes du vaisseau', [h(Coque, { key: 'coque' }),
      h('path', { key: 'circuit', className: 'lcars-circuit', d: i % 2 ? 'M260 95H110V220H156 M260 95H410V220H364' : 'M260 95V231H156 M260 231H364' }),
      h('circle', { key: 'noeud', cx: 260, cy: i % 2 ? 95 : 225, r: 17, className: `lcars-noeud lcars-ton-${ton(p.cible?.etat)}` }),
      h('text', { key: 'legende', x: 20, y: 28 }, 'USS / VUE DORSALE'), h('rect', { key: 'pulse', className: 'lcars-impulsion', x: 255, y: 186, width: 10, height: 28 })]),
      h('p', { className: 'lcars-schema-legende' }, 'Circuit sélectionné · schéma fonctionnel')),
    h('div', { className: 'lcars-systemes' }, h(Selection, p), h(Fiche, { cible: p.cible, libelle: 'Rapport du système' })));
}
function Communications(p) {
  const derniers = p.vue.demandes.filter(d => d.poste === p.poste && d.cibleId === p.cible?.id && d.rapport);
  const dernier = derniers[derniers.length - 1];
  return h('div', { className: 'lcars-communications' }, h(Selection, p),
    h('div', { className: 'lcars-recepteur' },
      h('div', { className: 'lcars-canal-titre' }, h('span', { className: 'lcars-voyant', 'aria-hidden': true }), h('h4', null, p.cible?.libelle || 'Aucun canal')),
      h(Instrument, p, titreSvg('Oscillogramme illustratif du canal sélectionné', [
        h('path', { key: 'axe', className: 'lcars-axes', d: 'M15 150H505 M260 35V265' }),
        h('path', { key: 'onde', className: `lcars-onde lcars-canal-${p.cible?.etat || 'ferme'}`, d: p.cible?.etat === 'ferme' ? 'M15 150H505' : 'M15 150H45L53 135L62 168L74 104L86 191L96 128L110 160H131L142 85L154 208L169 110L182 173L192 140H217L229 116L239 183L251 64L265 232L278 109L291 165L307 133L318 154H345L360 94L376 201L388 127L400 162H424L439 115L451 177L465 143L475 150H505' }),
        h('text', { key: 't', x: 16, y: 36 }, 'RÉCEPTION / SOUS-ESPACE'), h('rect', { key: 'pulse', className: 'lcars-impulsion', x: 255, y: 48, width: 3, height: 205 })])),
      h('p', { className: 'lcars-schema-legende' }, 'Signal illustratif · état de liaison défini par le MJ'),
      h('div', { className: 'lcars-transcription' }, h('p', { className: 'lcars-sur-titre' }, dernier ? 'DERNIÈRE RÉPONSE PRIVÉE' : 'CONTEXTE DU CANAL'),
        h('p', { className: 'lcars-texte-rapport' }, dernier?.rapport || p.cible?.description || 'En attente de liaison.'))));
}
const pointsRoutes = [[410, 70], [395, 245], [115, 55], [100, 240], [300, 38], [470, 170]];
function Navigation(p) {
  const selection = Math.max(0, p.cibles.findIndex(c => c.id === p.cible?.id));
  const [x, y] = pointsRoutes[selection % pointsRoutes.length];
  return h('div', { className: 'lcars-navigation' },
    h(Instrument, p, titreSvg('Carte schématique des itinéraires', [
      h('g', { key: 'grille', className: 'lcars-grille-spatiale' }, [60, 120, 180, 240].map(n => h('path', { key: n, d: `M0 ${n}H520 M${n * 2} 0V300` }))),
      h('path', { key: 'obstacle', className: 'lcars-zone', d: 'M299 91L365 100L390 149L347 181L304 150Z' }),
      h('text', { key: 'zone', x: 309, y: 132 }, 'ZONE'), h('text', { key: 'zone2', x: 307, y: 148 }, 'REPÈRE'),
      h('path', { key: 'route', className: 'lcars-route', d: `M180 207Q180 ${y} ${x} ${y}` }),
      h('circle', { key: 'arrivee', cx: x, cy: y, r: 14, className: 'lcars-arrivee' }),
      h('path', { key: 'vaisseau', d: 'M180 192L193 220L180 214L167 220Z', className: 'lcars-vaisseau' }),
      h('text', { key: 'depart', x: 118, y: 247 }, 'POSITION DE RÉFÉRENCE'),
      h('text', { key: 'cap', x: 16, y: 28 }, `NAV / TRAJET ${String(selection + 1).padStart(2, '0')}`),
      h('circle', { key: 'pulse', cx: x, cy: y, r: 22, className: 'lcars-impulsion lcars-arrivee' })]),
      h('p', { className: 'lcars-schema-legende' }, 'Tracé illustratif · positions et distances non mesurées')),
    h('div', { className: 'lcars-plans-vol' }, h(Selection, p), h(Fiche, { cible: p.cible, libelle: 'Plan de vol sélectionné' })));
}
function Tactique(p) {
  return h('div', { className: 'lcars-tactique' },
    h(Instrument, p, titreSvg('Périmètre tactique et contact sélectionné', [
      h('path', { key: 'secteurs', className: 'lcars-secteurs', d: 'M260 24L434 113L408 236L260 285L112 236L86 113Z M260 24V285 M86 113L408 236 M434 113L112 236' }),
      h('ellipse', { key: 'bulle', cx: 260, cy: 155, rx: 94, ry: 79, className: 'lcars-bouclier' }),
      h('path', { key: 'soi', className: 'lcars-vaisseau', d: 'M260 125L277 173L260 164L243 173Z' }),
      h('g', { key: 'contact', className: `lcars-reticule lcars-ton-${ton(p.cible?.etat)}` }, h('path', { d: 'M378 57H360V75 M396 57H414V75 M360 93V111H378 M396 111H414V93 M374 84H400 M387 71V97' })),
      h('text', { key: 'avant', x: 235, y: 18 }, 'AVANT'), h('text', { key: 'arriere', x: 230, y: 299 }, 'ARRIÈRE'),
      h('text', { key: 'cible', x: 332, y: 143 }, p.cible ? ETATS[p.cible.etat].toUpperCase() : 'VEILLE'),
      h('ellipse', { key: 'pulse', cx: 260, cy: 155, rx: 104, ry: 89, className: 'lcars-impulsion lcars-bouclier' })]),
      h('p', { className: 'lcars-schema-legende' }, 'Périmètre symbolique · aucun verrouillage automatique')),
    h('div', null, h(Selection, p), h(Fiche, { cible: p.cible, libelle: 'Évaluation du contact' })));
}
function Medecine(p) {
  return h('div', { className: 'lcars-medecine' }, h(Selection, p),
    h('div', { className: 'lcars-dossier' }, h('div', { className: 'lcars-dossier-entete' }, h('span', { 'aria-hidden': true }, '✚'),
      h('div', null, h('p', { className: 'lcars-sur-titre' }, 'DOSSIER INDIVIDUEL'), h('h4', null, p.cible?.libelle || 'Aucun dossier')), p.cible && etiquette(p.cible)),
    h('div', { className: 'lcars-examen' }, h(Instrument, p, titreSvg('Repère anatomique illustratif, sans données physiologiques', [
      h('circle', { key: 'tete', cx: 260, cy: 39, r: 22, className: 'lcars-anatomie' }),
      h('path', { key: 'corps', className: 'lcars-anatomie', d: 'M236 68Q260 60 284 68L318 139Q321 149 311 153Q303 156 297 145L280 109L282 171L296 266Q297 281 284 281Q275 281 272 268L260 198L248 268Q245 281 236 281Q223 281 224 266L238 171L240 109L223 145Q217 156 209 153Q199 149 202 139Z' }),
      h('path', { key: 'repere', className: 'lcars-reperes-med', d: 'M180 99H231 M288 99H340 M180 170H233 M287 170H340 M260 17V286' }),
      h('rect', { key: 'pulse', className: 'lcars-impulsion', x: 190, y: 105, width: 140, height: 4 }),
      h('text', { key: 'legende', x: 14, y: 28 }, 'BIO / EXAMEN')]))),
    h('div', { className: 'lcars-observations' }, h('p', { className: 'lcars-sur-titre' }, 'OBSERVATIONS TRANSMISES'),
      h('p', null, p.cible?.description || 'Le MJ peut révéler un patient ou un prélèvement.'),
      h('dl', null, h('dt', null, 'État clinique'), h('dd', null, p.cible ? ETATS[p.cible.etat] : 'Non communiqué'), h('dt', null, 'Mesures physiologiques'), h('dd', null, 'Non renseignées')),
      h('p', { className: 'lcars-note' }, 'Repère anatomique illustratif. Les découvertes et traitements sont arbitrés par le MJ.'))));
}
const ecrans = { commandement: Commandement, science: Science, ingenierie: Ingenierie, communications: Communications, navigation: Navigation, tactique: Tactique, medecine: Medecine };
export function ConsolePoste(props) {
  const [code, titre] = titres[props.poste];
  return h('section', { className: `lcars-console lcars-console-${props.poste}`, 'aria-label': titre, 'data-poste': props.poste },
    h('header', { className: 'lcars-instrument-entete' }, h('p', null, code), h('h3', null, titre)), h(ecrans[props.poste], props));
}
