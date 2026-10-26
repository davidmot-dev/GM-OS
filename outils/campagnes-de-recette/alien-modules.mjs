import * as maman from '../alien/modules/muthur/moteur.mjs';
import * as radar from '../alien/modules/detecteur/moteur.mjs';
import * as spatial from '../alien/modules/combat-spatial/moteur.mjs';
import { MODELES } from '../alien/modules/combat-spatial/catalogue.mjs';
import { DATE_RECETTE } from './archives-de-recette.mjs';
import { titreAlien } from './alien-scenario.mjs';
export { maman, radar, spatial };
export function preparerModulesAlien(pcs, { prefixe = 'recette-alien', energie = 5, engage = false } = {}) {
    // Horodatage de fabrication fixe, jamais une horloge de jeu dans l'application.
    const horloge = Date.now; Date.now = () => Date.parse(DATE_RECETTE);
    try {
        const mj = { role: 'mj' };
        let m = maman.creerEtat(), d = radar.creerEtat(), s = spatial.creerEtat();
        const cmdM = (id, charge) => { m = maman.appliquerCommande(m, { id, charge }, mj); };
        const cmdD = (id, charge) => { d = radar.appliquerCommande(d, { id, charge }, mj); };
        const cmdS = (id, charge) => { s = spatial.appliquerCommande(s, { id, charge }, mj); };
        for (const doc of [...m.documents]) cmdM('supprimer-dossier', { dossierId: doc.id });
        for (const p of [...m.protocoles]) cmdM('supprimer-protocole', { protocoleId: p.id });
        cmdM('configurer', { vaisseau: 'ISKRA / RELAIS ORPHÉE', statut: 'Relève attendue. Liaison thermique dégradée. RECETTE.', motDePasse: 'ORPHEE-ADMIN-TEST', crt: true, parasites: false });
        for (const pc of pcs) cmdM('preparer-operateur', { personnageId: pc.id, nom: pc.name });
        for (const [dossierId, titre, contenu, acces, code] of [
            ['mission', 'Ordre de relève', 'RECETTE ORPHÉE : assister les survivants, diagnostiquer la panne, préserver une route de retour. LIST puis READ mission.', 'equipage', ''],
            ['cargo', 'Contrat de récupération', 'CARGO-17 / RECETTE. Le contrat prévoit une caisse scellée et quatre passagers. Confronter au témoignage des six membres de relève.', 'code', 'CARGO-17'],
            ['ordre-prive', 'Copie confidentielle du contrat', 'SECRET_MODULE_ALIEN : l’ordre de purge masque une ouverture du conteneur avant l’appel. Document réservé à Maman et aux opérateurs administrateurs.', 'administrateur', ''],
        ]) cmdM('creer-dossier', { dossierId, titre, contenu, acces, code });
        for (let acte = 1; acte <= 3; acte++) {
            cmdM('dossier-acte', { scenario: titreAlien, acte, dossierId: `orphee-acte-${acte}`, titre: `Relève Orphée — acte ${acte}`,
                contenu: ['Le décompte de l’équipage ne correspond pas au contrat.', 'Le conteneur a été descellé avant la panne. Un passage peut être isolé sans condamner l’infirmerie.', 'La boîte noire peut être copiée ; le sauvetage et la récupération du conteneur sont deux décisions distinctes.'][acte - 1], acces: 'equipage', code: '' });
            for (const pc of pcs) cmdM('objectif-acte', { scenario: titreAlien, acte, personnageId: pc.id, texte: pc.objectifs[acte - 1] });
        }
        for (const [id, nom, code, effet] of [
            ['verrouiller', 'Isoler les portes', 'ORPHEE-LOCK', 'fermer-portes'], ['ouvrir', 'Ouvrir les portes', 'ORPHEE-OPEN', 'ouvrir-portes'],
            ['omega', 'Autodestruction de recette', 'ORPHEE-OMEGA', 'autodestruction'], ['stop', 'Annuler la séquence', 'ORPHEE-STOP', 'annuler-autodestruction'],
        ]) cmdM('enregistrer-protocole', { protocole: { id, nom, code, effet, message: `RECETTE : ${nom}. Décision de Maman.`, minutes: 13, actif: true, portee: 'equipage' } });
        cmdM('enregistrer-prereglage', { prereglageId: `${prefixe}-terminal`, nom: 'Orphée — terminal initial et trois actes' });

        // Plan métrique privé, distinct des plans illustratifs sans échelle de l'Atlas.
        const zones = [
            ['sas', 'Sas de relève', 0, 0, []], ['coursive', 'Coursive A', 25, 0, ['sas']], ['mess', 'Mess', 50, 0, ['coursive']],
            ['infirmerie', 'Infirmerie', 50, 25, ['mess']], ['labo', 'Laboratoire', 75, 0, ['mess']],
            ['gaine', 'Gaine de maintenance', 100, 0, ['labo']], ['hangar', 'Hangar externe', 125, 0, ['gaine']], ['reacteur', 'Échangeurs', 75, 25, ['labo']],
        ];
        for (const [id, nom, x, y, liens] of zones) cmdD('zone-discrete', { id: `${prefixe}-zone-${id}`, nom, x, y, liens: liens.map(l => `${prefixe}-zone-${l}`) });
        for (const pc of pcs) cmdD('pion-discret', { id: pc.id, nom: pc.name, zoneId: `${prefixe}-zone-sas`, humain: true, limite: 2, mobile: false, detectable: true });
        for (const [slug, nom, zone, humain, limite, mobile, detectable] of [
            ['creature', 'SECRET_MODULE_ALIEN — spécimen caché', 'labo', false, 3, false, true],
            ['boreal', 'Boréal immobile', 'infirmerie', true, 2, false, true],
            ['petit', 'Débris trop petits', 'gaine', false, 1, true, false],
            ['chariot', 'Chariot automatique', 'hangar', false, 2, true, true],
        ]) cmdD('pion-discret', { id: `${prefixe}-pion-${slug}`, nom, zoneId: `${prefixe}-zone-${zone}`, humain, limite, mobile, detectable });
        cmdD('regler-discret', { terrain: 'interieur', energie, porteurId: pcs[0].id });
        cmdD('mode-discret', { actif: true });
        cmdD('configurer', { intensite: 30, volume: 15, contacts: 2, proximite: 45, parasites: 5, crt: true, effetsParasites: false });
        cmdD('enregistrer-prereglage', { prereglageId: `${prefixe}-plan`, nom: 'Orphée — plan privé et M314 chargé' });
        cmdD('mode-discret', { actif: false });
        cmdD('enregistrer-prereglage', { prereglageId: `${prefixe}-mise-en-scene`, nom: 'Orphée — deux contacts de mise en scène' });
        cmdD('mode-discret', { actif: true });

        for (const [i, nom, modele, camp, transpondeur] of [[0, 'Iskra', 'corvus', 'joueurs', true], [1, 'Vautour', 'remorqueur', 'adverse', false]]) {
            const modeleDuLivre = MODELES.find(m => m.id === modele) ?? MODELES.find(m => m.id.includes('remorqueur'));
            if (!modeleDuLivre) throw new Error('Modèle du livre absent : ' + modele);
            cmdS('vaisseau', { nom, modele: modeleDuLivre.id, camp, signature: modeleDuLivre.signature, propulseurs: modeleDuLivre.propulseurs, coque: modeleDuLivre.coque, protection: modeleDuLivre.protection,
                armes: engage ? ['canon-electrique-leger', 'asat-courte', 'leurres-radar'] : modeleDuLivre.armes, transpondeur, ombilic: false });
            const v = s.vaisseaux[i];
            for (const [poste, pcIndex, base] of [['capitaine', 1, 7], ['senseurs', 0, 6], ['pilote', 2, 7], ['artilleur', -1, 5], ['ingenieur', 0, 7]]) {
                const pc = camp === 'joueurs' && pcIndex >= 0 ? pcs[pcIndex] : null;
                cmdS('poste', { vaisseauId: v.id, poste, personnageId: pc?.id ?? '', nom: pc?.name ?? (camp === 'joueurs' ? 'Célian Dorr (PNJ)' : 'Équipage du Vautour (PNJ)'), base, stress: 0, talent: false, synthetique: false });
            }
        }
        // Les UUID internes sont remplacés dans cette préparation par des clés stables valides.
        const remplacements = new Map();
        s.vaisseaux.forEach((v, i) => { remplacements.set(v.id, `${prefixe}-vaisseau-${i}`); v.armes.forEach((a, j) => remplacements.set(a.id, `${prefixe}-arme-${i}-${j}`)); });
        let json = JSON.stringify(s); for (const [ancien, neuf] of remplacements) json = json.replaceAll(ancien, neuf); s = JSON.parse(json);
        cmdS('enregistrer-prereglage', { prereglageId: `${prefixe}-vaisseaux`, nom: 'Iskra et Vautour — équipages prêts' });
        if (engage) {
            cmdS('demarrer-combat', { vaisseaux: s.vaisseaux.map(v => v.id), distance: 8, velociteJoueurs: 2, velociteAdverse: 2 });
            s.combat.initiative = Object.fromEntries(s.vaisseaux.map((v, i) => [v.id, i + 1]));
        }
        m = maman.arreterEffets(m); d = radar.arreterEffets(d);
        maman.validerEtat(m); radar.validerEtat(d); spatial.validerEtat(s);
        return { 'alien-muthur': { versionDonnees: 5, donnees: m }, 'alien-detecteur': { versionDonnees: 4, donnees: d }, 'alien-combat-spatial': { versionDonnees: 2, donnees: s } };
    } finally { Date.now = horloge; }
}
