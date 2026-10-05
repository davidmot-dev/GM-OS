import { readFile, writeFile } from 'node:fs/promises';
const dossier = new URL('.', import.meta.url);
for (const nom of process.argv.slice(2)) {
  const reponse = JSON.parse(await readFile(new URL(`${nom}-telephone-reponse.json`, dossier), 'utf8')).result.structuredContent;
  const ecran = reponse.outputComponents.flatMap(c => c.design?.screens || [])[0];
  if (!ecran?.id) throw new Error(`Écran absent : ${nom}`);
  const dispositions = {
    archives: 'Deux indices côte à côte, contenu complet, documents neutres. Le détail est une surcouche, jamais un troisième indice.',
    pnj: 'Un profil Superviseur Hale, silhouette neutre ; détail de profil large avec illustration neutre et biographie côte à côte. Aucun autre personnage.',
    lieux: 'Une carte de lieu Station Varn, emplacement pour son PNG de démonstration. Surcouche large plan à gauche, description à droite. Aucun nouveau lieu, aucun outil de zoom ou déplacement.',
    messages: 'Direct visible derrière un panneau de messagerie à droite, largeur environ 440 px ; messages, destinataires et champ lisibles, panneau ne masque pas le pied. Aucun nouveau contact ni message.',
    notifications: 'Direct en fond, seule carte Nouveau Message au-dessus du pied, badge 1 sur Messages. Toucher ouvre une messagerie à droite. Ne pas ajouter de centre de notifications ou de bouton d’effacement.'
  };
  const prompt = `Décline UNIQUEMENT cet écran ${nom} en iPad Air paysage 1180×820. Garder le même DESIGN.md, les mêmes contenus et gestes du téléphone. Le décor est exclusivement fictif du banc e2e T0, sans sauvegarde ni données personnelles. ${dispositions[nom]} En-tête GM-OS / Connecté / Mode performance ou qualité, horloge projetée fixe du téléphone, Alerte de la station 3/8 publique seulement. Navigation fixe complète : Direct, Archives, PNJ, Lieux, Inventaire, Cartes sur une rangée de six, puis Fiche, Notes, Messages, Quitter sur une rangée de quatre. Tous les libellés restent entiers. Contenu et surcouches scrollables au besoin, fermeture ≥44×44, corps ≥14, badges ≥11. Export HTML fonctionnel. N'invente aucune information technique, illustration, statistique, date de découverte, filtre, recherche, bouton d'édition ou nouvelle fonction. Les détails restent des surcouches fermables. C'est TOUT. N'ajoute rien.`;
  await writeFile(new URL(`${nom}-paysage-requete.json`, dossier), JSON.stringify({ projectId: '14179472786712390673', selectedScreenIds: [ecran.id], deviceType: 'TABLET', prompt }, null, 2));
}
