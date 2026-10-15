/** Validation pure du contrat v1, commune au CLI et a GM-OS. */
const IDENTIFIANT = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
// La v1 emploie trois entiers ; les préversions attendront un contrat ultérieur.
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const objet = valeur => valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur);
const chaine = (valeur, max) => typeof valeur === 'string' && valeur.trim().length > 0 && valeur.length <= max;

function champs(valeur, permis, requis, chemin, erreurs) {
  if (!objet(valeur)) { erreurs.push(`${chemin} : objet attendu.`); return false; }
  for (const nom of Object.keys(valeur)) {
    if (!permis.includes(nom)) erreurs.push(`${chemin}.${nom} : champ inconnu.`);
  }
  for (const nom of requis) {
    if (!Object.hasOwn(valeur, nom)) erreurs.push(`${chemin}.${nom} : champ requis.`);
  }
  return true;
}

export function validerLeManifeste(manifeste) {
  const erreurs = [];
  const obligatoires = ['versionContrat', 'id', 'libelle', 'version', 'versionDonnees', 'corpusCompatibles', 'commandes'];
  if (!champs(manifeste, [...obligatoires, 'description'], obligatoires, 'module', erreurs)) return erreurs;
  if (manifeste.versionContrat !== 1) erreurs.push('module.versionContrat : seule la version 1 est acceptée.');
  if (typeof manifeste.id !== 'string' || !IDENTIFIANT.test(manifeste.id) || manifeste.id.length > 80) erreurs.push('module.id : identifiant attendu (1 à 80 caractères).');
  if (!chaine(manifeste.libelle, 80)) erreurs.push('module.libelle : texte requis, 80 caractères au plus.');
  if (manifeste.description !== undefined && !chaine(manifeste.description, 600)) erreurs.push('module.description : texte requis, 600 caractères au plus.');
  if (typeof manifeste.version !== 'string' || !VERSION.test(manifeste.version)) erreurs.push('module.version : version X.Y.Z attendue.');
  if (!Number.isSafeInteger(manifeste.versionDonnees) || manifeste.versionDonnees < 1) erreurs.push('module.versionDonnees : entier positif attendu.');
  const corpus = manifeste.corpusCompatibles;
  if (!Array.isArray(corpus) || corpus.length < 1 || corpus.length > 32) {
    erreurs.push('module.corpusCompatibles : liste de 1 à 32 identifiants attendue.');
  } else {
    if (corpus.some(id => typeof id !== 'string' || id.length > 80 || !IDENTIFIANT.test(id))) erreurs.push('module.corpusCompatibles : identifiant invalide.');
    if (new Set(corpus).size !== corpus.length) erreurs.push('module.corpusCompatibles : doublon interdit.');
  }
  if (!Array.isArray(manifeste.commandes) || manifeste.commandes.length > 64) {
    erreurs.push('module.commandes : liste de 0 à 64 commandes attendue.');
  } else {
    const ids = new Set();
    manifeste.commandes.forEach((commande, index) => {
      const chemin = `module.commandes[${index}]`;
      if (!champs(commande, ['id', 'roles'], ['id', 'roles'], chemin, erreurs)) return;
      if (typeof commande.id !== 'string' || commande.id.length > 80 || !IDENTIFIANT.test(commande.id)) erreurs.push(`${chemin}.id : identifiant invalide.`);
      if (ids.has(commande.id)) erreurs.push(`${chemin}.id : doublon interdit.`);
      ids.add(commande.id);
      if (!Array.isArray(commande.roles) || commande.roles.length < 1 || commande.roles.length > 2
        || commande.roles.some(role => !['mj', 'joueur'].includes(role))
        || new Set(commande.roles).size !== commande.roles.length) erreurs.push(`${chemin}.roles : liste unique de mj et/ou joueur attendue.`);
    });
  }
  return erreurs;
}

/** Ce contrôle ne valide que le champ modulesDuJeu, pas tout GameDriver. */
export function validerLesReferences(references) {
  if (references === undefined) return [];
  if (!Array.isArray(references) || references.length > 32) return ['modulesDuJeu : liste de 0 à 32 références attendue.'];
  const erreurs = [], ids = new Set();
  references.forEach((reference, index) => {
    const chemin = `modulesDuJeu[${index}]`;
    if (!champs(reference, ['id', 'libelle'], ['id'], chemin, erreurs)) return;
    if (typeof reference.id !== 'string' || reference.id.length > 80 || !IDENTIFIANT.test(reference.id)) erreurs.push(`${chemin}.id : identifiant invalide.`);
    if (ids.has(reference.id)) erreurs.push(`${chemin}.id : doublon interdit.`);
    ids.add(reference.id);
    if (reference.libelle !== undefined && !chaine(reference.libelle, 80)) erreurs.push(`${chemin}.libelle : texte requis, 80 caractères au plus.`);
  });
  return erreurs;
}
