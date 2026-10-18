import { caseDe, distance, humide } from './carte.mjs';

const copie = v => JSON.parse(JSON.stringify(v));
const exiger = (v, texte = 'Commande TMR invalide.') => { if (!v) throw new Error(texte); };
const objet = v => !!v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
const entier = v => Number.isSafeInteger(v) && v >= 0 && v < 1_000_000_000;
const texte = (v, n) => typeof v === 'string' && v.length <= n;
const idValide = v => typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(v) && !['prototype', '__proto__', 'constructor'].includes(v);
function champs(o, cles) { exiger(objet(o) && Object.keys(o).length === cles.length && cles.every(k => Object.hasOwn(o, k))); }
const actions = ['monter', 'avancer', 'rester', 'descendre'];
const rythmes = ['normal', 'accelere'];
const typesNote = ['reserve', 'queue', 'souffle'];
export function creerEtat() { return { version: 2, voyageurs: [] }; }
function nouveau(id, nom) { return { id, nom, position: null, present: false, rythme: 'normal', etape: 0, demande: null, preparation: '', rencontre: '', notes: [], journal: [], ecriture: null }; }
function validerDemande(d) {
    champs(d, ['operationId', 'etape', 'action', 'cible', 'rythme']);
    exiger(idValide(d.operationId) && entier(d.etape) && actions.includes(d.action) && !!caseDe(d.cible) && rythmes.includes(d.rythme));
}
export function validerEtat(e) {
    champs(e, ['version', 'voyageurs']); exiger(e.version === 2 && Array.isArray(e.voyageurs) && e.voyageurs.length <= 256);
    exiger(new Set(e.voyageurs.map(v => v.id)).size === e.voyageurs.length);
    for (const v of e.voyageurs) {
        champs(v, ['id', 'nom', 'position', 'present', 'rythme', 'etape', 'demande', 'preparation', 'rencontre', 'notes', 'journal', 'ecriture']);
        exiger(idValide(v.id) && texte(v.nom, 40) && v.nom.trim() && (v.position === null || !!caseDe(v.position)) && typeof v.present === 'boolean'
            && (!v.present || v.position !== null) && rythmes.includes(v.rythme) && entier(v.etape) && texte(v.preparation, 2000) && texte(v.rencontre, 2000));
        if (v.demande !== null) { validerDemande(v.demande); exiger(v.demande.etape === v.etape); verifierTrajet(v, v.demande); }
        if (v.ecriture !== null) {
            const t = v.ecriture; champs(t, ['id', 'demande', 'empreinte', 'compteRendu', 'interrompue']); validerDemande(t.demande);
            exiger(idValide(t.id) && texte(t.empreinte, 4000) && t.empreinte.length > 0 && texte(t.compteRendu, 2000) && typeof t.interrompue === 'boolean');
            exiger(t.interrompue ? v.demande === null && !v.present : JSON.stringify(v.demande) === JSON.stringify(t.demande));
        }
        exiger(Array.isArray(v.notes) && v.notes.length <= 60 && new Set(v.notes.map(n => n.id)).size === v.notes.length);
        for (const n of v.notes) {
            champs(n, ['id', 'type', 'nom', 'caseId', 'texte']);
            exiger(idValide(n.id) && typesNote.includes(n.type) && texte(n.nom, 120) && n.nom.trim() && texte(n.texte, 2000)
                && (n.caseId === null || !!caseDe(n.caseId)) && (n.type !== 'reserve' || !!caseDe(n.caseId)));
        }
        exiger(Array.isArray(v.journal) && v.journal.length <= 60);
        for (const j of v.journal) {
            champs(j, ['operationId', 'etape', 'texte']); exiger(idValide(j.operationId) && entier(j.etape) && texte(j.texte, 2500));
        }
    }
}
function verifierTrajet(v, d) {
    exiger(v.position !== null, 'Le MJ doit d’abord placer ce demi-rêve.');
    exiger(d.etape === v.etape, 'Le voyage a changé. Relis la position actuelle.');
    if (d.action === 'monter') exiger(!v.present && d.cible === v.position, 'La montée retrouve le demi-rêve à sa dernière position.');
    else {
        exiger(v.present, 'Le demi-rêve n’est pas en voyage.');
        exiger(d.rythme === v.rythme, 'Le rythme se choisit avant la montée.');
        if (d.action === 'avancer') exiger(!v.rencontre && distance(v.position, d.cible) === 1, 'Résous la rencontre, puis choisis une case voisine.');
        else exiger(d.cible === v.position, 'Cette action conserve la position.');
        if (d.action === 'rester') exiger(!v.rencontre, 'Résous d’abord la rencontre en cours.');
    }
}
/** Livre 2.3.1 p. 182. Indications uniquement : aucune réserve n'est tenue ici. */
export function consequences(d) {
    const cout = d.action === 'descendre' ? { reve: 0, fatigue: 0 } : { reve: d.action === 'monter' ? (d.rythme === 'accelere' ? 2 : 1) : 0, fatigue: 1 };
    return { ...cout, rencontre: d.action !== 'descendre', humide: d.action !== 'descendre' && humide(d.cible) };
}
export function migrerEtat(e, version) {
    exiger(version === 1 || version === 2, 'Version TMR non prise en charge.');
    const s = copie(e);
    if (version === 1) {
        champs(s, ['version', 'voyageurs']); exiger(s.version === 1 && Array.isArray(s.voyageurs));
        s.version = 2;
        for (const v of s.voyageurs) { exiger(!Object.hasOwn(v, 'ecriture')); v.ecriture = null; }
    }
    validerEtat(s); return arreterEffets(s);
}
export function preparerContexte(e, personnages) {
    validerEtat(e); const s = copie(e);
    for (const v of s.voyageurs) {
        const p = personnages.find(p => p.id === v.id);
        if (p) v.nom = p.nom;
        else if (v.present || v.demande) { if (v.ecriture) v.ecriture.interrompue = true; v.present = false; v.demande = null; v.etape++; }
    }
    validerEtat(s); return s;
}
export function preparerLecteur(e, id, nom) {
    validerEtat(e); exiger(idValide(id) && texte(nom, 40) && nom.trim()); const s = copie(e);
    if (!s.voyageurs.some(v => v.id === id)) s.voyageurs.push(nouveau(id, nom));
    validerEtat(s); return s;
}
export function arreterEffets(e) {
    validerEtat(e); const s = copie(e);
    for (const v of s.voyageurs) if (v.present || v.demande) { if (v.ecriture) v.ecriture.interrompue = true; v.present = false; v.demande = null; v.etape++; }
    validerEtat(s); return s;
}
export function vuePour(e, lecteur, contexte = { personnages: [] }) {
    validerEtat(e); exiger(['mj', 'joueur'].includes(lecteur.role));
    if (lecteur.role === 'mj') return { role: 'mj', voyageurs: copie(e.voyageurs), personnages: copie(contexte.personnages) };
    exiger(idValide(lecteur.personnageId), 'Personnage requis.');
    const v = e.voyageurs.find(v => v.id === lecteur.personnageId);
    exiger(v, 'Demi-rêve non préparé.');
    const { preparation: _secret, ecriture: _transaction, ...publicDuVoyageur } = v;
    return { role: 'joueur', voyageur: { ...copie(publicDuVoyageur), ecritureEnCours: !!v.ecriture } };
}
export function appliquerCommande(e, commande, lecteur, contexte = { personnages: [] }) {
    validerEtat(e); champs(commande, ['id', 'charge']); exiger(['mj', 'joueur'].includes(lecteur.role));
    const charge = commande.charge; exiger(objet(charge));
    const mj = lecteur.role === 'mj';
    exiger(mj || ['proposer', 'annuler'].includes(commande.id), 'Commande réservée au MJ.');
    // Le personnage joueur vient du contexte établi par l'hôte, jamais de la charge.
    const personnageId = mj ? charge.personnageId : lecteur.personnageId;
    exiger(contexte.personnages.some(p => p.id === personnageId), 'Personnage absent de cette campagne.');
    const s = preparerLecteur(e, personnageId, contexte.personnages.find(p => p.id === personnageId).nom);
    const v = s.voyageurs.find(v => v.id === personnageId);
    exiger(!v.ecriture, 'Une écriture sur la fiche attend sa confirmation. Termine sa reprise avant une autre action.');
    const cles = attendues => champs(charge, mj ? ['personnageId', ...attendues] : attendues);
    switch (commande.id) {
        case 'engager-trajet': {
            cles(['operationId', 'transactionId', 'empreinte', 'compteRendu']);
            exiger(v.demande && v.demande.operationId === charge.operationId, 'Demande déjà traitée.');
            exiger(idValide(charge.transactionId) && texte(charge.empreinte, 4000) && charge.empreinte.length > 0 && texte(charge.compteRendu, 2000));
            v.ecriture = { id: charge.transactionId, demande: copie(v.demande), empreinte: charge.empreinte, compteRendu: charge.compteRendu, interrompue: false };
            break;
        }
        case 'positionner': {
            cles(['cible', 'etape']); exiger(!!caseDe(charge.cible) && charge.etape === v.etape);
            exiger(!v.present && !v.demande, 'Termine le voyage et la demande avant de corriger la position.');
            v.position = charge.cible; v.etape++; break;
        }
        case 'proposer': {
            cles(['operationId', 'etape', 'action', 'cible', 'rythme']);
            const { personnageId: _cible, ...d } = charge; validerDemande(d);
            // Même intention reçue deux fois : pas de seconde demande ni de progression.
            if (v.demande && JSON.stringify(v.demande) === JSON.stringify(d)) return s;
            exiger(!v.demande, 'Une demande attend déjà le MJ.'); verifierTrajet(v, d); v.demande = copie(d); break;
        }
        case 'annuler': {
            cles(['operationId']); exiger(v.demande && v.demande.operationId === charge.operationId, 'Demande déjà traitée.');
            v.demande = null; v.etape++; break;
        }
        case 'arbitrer': {
            cles(['operationId', 'accepter', 'ficheTraitee', 'compteRendu']);
            exiger(typeof charge.accepter === 'boolean' && typeof charge.ficheTraitee === 'boolean' && texte(charge.compteRendu, 2000));
            const d = v.demande; exiger(d && d.operationId === charge.operationId, 'Demande déjà traitée.'); verifierTrajet(v, d);
            if (charge.accepter) {
                exiger(charge.ficheTraitee, 'Confirme les coûts, jets et conséquences résolus sur la fiche.');
                v.position = d.cible; v.present = d.action !== 'descendre'; if (d.action === 'monter') v.rythme = d.rythme;
            }
            v.etape++;
            v.journal.push({ operationId: d.operationId, etape: v.etape, texte: `${charge.accepter ? 'Validé' : 'Refusé'} : ${d.action} ${d.cible}. ${charge.compteRendu}`.trim() });
            v.journal = v.journal.slice(-60); v.demande = null; break;
        }
        case 'preparer-rencontre': cles(['texte']); exiger(texte(charge.texte, 2000)); v.preparation = charge.texte; break;
        case 'publier-rencontre':
            cles(['texte']); exiger(texte(charge.texte, 2000) && charge.texte.trim() && v.present && !v.demande, 'Valide le trajet avant de publier sa rencontre.');
            v.rencontre = charge.texte; break;
        case 'terminer-rencontre':
            cles(['etape']); exiger(charge.etape === v.etape && !v.demande); v.rencontre = ''; v.etape++; break;
        case 'noter': {
            cles(['note']); const n = charge.note; champs(n, ['id', 'type', 'nom', 'caseId', 'texte']);
            const i = v.notes.findIndex(x => x.id === n.id); if (i >= 0) v.notes[i] = copie(n); else v.notes.push(copie(n)); break;
        }
        case 'retirer-note': cles(['noteId']); exiger(idValide(charge.noteId)); v.notes = v.notes.filter(n => n.id !== charge.noteId); break;
        default: throw new Error('Commande TMR inconnue.');
    }
    validerEtat(s); return s;
}

/** Raccord natif seulement : absent du manifeste et des commandes réseau.
 * Le reçu durable est vérifié par le domaine des fiches avant cet acquittement.
 * Une interruption ne supprime jamais l'intention avant de savoir si elle a été payée. */
export function terminerEcriture(e, personnageId, transactionId, appliquee, sortieForcee, detail) {
    validerEtat(e); exiger(typeof appliquee === 'boolean' && typeof sortieForcee === 'boolean' && texte(detail, 300));
    const s = copie(e), v = s.voyageurs.find(v => v.id === personnageId), t = v?.ecriture;
    exiger(t && t.id === transactionId, 'Écriture TMR déjà traitée ou absente.');
    const d = t.demande;
    if (appliquee) { v.position = d.cible; v.present = !t.interrompue && !sortieForcee && d.action !== 'descendre'; if (d.action === 'monter') v.rythme = d.rythme; }
    v.etape++; v.demande = null; v.ecriture = null;
    v.journal.push({ operationId: t.id, etape: v.etape, texte: `${appliquee ? 'Débit confirmé' : 'Annulé avant débit'} : ${d.action} ${d.cible}. ${detail} ${t.compteRendu}`.trim().slice(0, 2500) });
    v.journal = v.journal.slice(-60); validerEtat(s); return s;
}
