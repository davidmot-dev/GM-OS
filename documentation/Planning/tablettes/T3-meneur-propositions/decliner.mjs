import {readFile,writeFile,appendFile} from 'node:fs/promises';
const dossier=new URL('.',import.meta.url);
for(const nom of process.argv.slice(2)){
 const reponse=JSON.parse(await readFile(new URL(`${nom}-telephone-reponse.json`,dossier),'utf8'));
 const ecran=reponse.result?.structuredContent?.outputComponents.flatMap(c=>c.design?.screens||[])[0];
 if(!ecran?.id)throw new Error(`Aucun écran ${nom}`);
 const prompt=`Décline UNIQUEMENT ce même écran ${nom} de la télécommande meneur en iPad Air paysage1180×820, utilisable aussi au pupitre1440×900. Même contenu et DESIGN.md que le téléphone, mêmes gestes. Le décor est exclusivement fictif du banc e2e T0, aucune donnée personnelle ou sauvegarde réelle. Navigation à gauche150px avec les8onglets entiers Pads, Dés, Sons, Scénario, Combat, Tableau, Notes, Messages ; pas les27modules du bureau. Ligne d’état compacte en haut : voyant appairé, R1 · Nel Varga, Couper le son avec appui700ms ; informations musique/ambiance/minuteur/non-lus uniquement si actives. Pas de bandeau de régie PC, ni mode performance joueur. Répartir réglages et cartes sur2ou3colonnes ; ${nom==='tableau'?'outils et couleurs restent accessibles, canevas remplit la surface restante':nom==='notes'?'six vues internes complètes, lecture large, garder les replis actes/scènes et la recherche coffre':nom==='messages'?'le fil remplit la hauteur et la saisie reste accessible, Tous montre tout le fil mais envoie au groupe':'noms et valeurs complets, actions visibles'}. Cibles≥44px, Inter lecture≥14, badges≥11, chiffres JetBrains Mono ; zoom autorisé. Contenu et surcouches défilent sans masquer navigation/état. Aucune illustration, fonction, compteur technique, horloge projetée joueur, recherche ou contenu supplémentaire inventé. C’est TOUT. N’ajoute rien.`;
 await writeFile(new URL(`${nom}-paysage-requete.json`,dossier),JSON.stringify({projectId:'14179472786712390673',selectedScreenIds:[ecran.id],deviceType:'TABLET',prompt},null,2));
 await appendFile(new URL('../../2026-10-05-prompts-stitch-tablettes-M1-M2.md',dossier),`\n## ${nom} — paysage\n\n\`\`\`text\n${prompt}\n\`\`\`\n`);
 console.log(`${nom}: ${ecran.id}`);
}
