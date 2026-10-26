import * as tmr from '../reve-de-dragon/tmr/moteur.mjs';
export function preparerModuleRdd(pcs) {
    let e = tmr.creerEtat();
    const contexte = { personnages: pcs.map(p => ({ id: p.id, nom: p.name })) };
    for (const p of pcs) {
        e = tmr.preparerLecteur(e, p.id, p.name);
        const cmd = (id, charge) => { e = tmr.appliquerCommande(e, { id, charge: { personnageId: p.id, ...charge } }, { role: 'mj' }, contexte); };
        cmd('positionner', { cible: p.caseTMR, etape: 0 });
        cmd('preparer-rencontre', { texte: `SECRET_MODULE_RDD : préparation privée de ${p.name}. Choisir le terrain de la case, tester la rencontre au d7 puis consulter le d100 dans Table-OS. Ne rien publier avant l’arbitrage.` });
    }
    tmr.validerEtat(e);
    return { 'rdd-tmr': { versionDonnees: 2, donnees: e } };
}
