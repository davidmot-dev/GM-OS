import fs from 'node:fs';
import path from 'node:path';
// Tables originales de fiction ; aucune table de règles du livre n'est remplacée.
const rumeurs = ['La station répond même lorsqu’elle est débranchée.', 'Une caisse porte le même numéro que la vanne du vieux plan.', 'Le gardien a retourné la lentille pour parler à la terre.', 'Alice a prêté son arrière-salle à une infirmière.', 'Une voix de trop répond dans les appels du Saint-Elme.', 'Le calque original se trouve encore aux archives.'];
export function tablesDeRecette() {
    return [
        { name: 'RECETTE Port-Lenoir — rumeurs', dice: '1d6', entries: rumeurs.map((description, i) => ({ min: i + 1, max: i + 1, title: `Rumeur ${i + 1}`, description })) },
        { name: 'RECETTE Port-Lenoir — incidents', dice: '1d6', entries: ['Le téléphone sonne sans être raccordé.', 'Un marin refuse de prononcer un nom.', 'La porte du hangar claque dans le vent.', 'Une coupure de courant efface la fin d’un appel.', 'Un témoin reconnaît un des investigateurs.', 'La marée ferme l’accès le plus court.'].map((description, i) => ({ min: i + 1, max: i + 1, title: `Incident ${i + 1}`, description, effect: 'Conséquence narrative à jouer ; aucun dommage chiffré automatique.' })) },
        { name: 'RECETTE Port-Lenoir — objets trouvés', dice: '1d6', entries: ['Carnet sec', 'Boîte d’allumettes', 'Petit outil', 'Bandages', 'Pièces du port', 'Clef sans étiquette'].map((name, i) => ({ min: i + 1, max: i + 1, title: name, description: 'Objet fictif de recette pour vérifier l’envoi au butin.', butin: [{ name, type: i === 4 ? 'currency' : 'item', quantite: i === 4 ? 7 : 1, rarity: 'common', weight: 0, value: 0, description: 'Aucun effet automatique sur les ressources CH.' }] })) },
    ];
}
export function ecrireTables(sortie) {
    const dossier = path.join(sortie, 'tables-a-importer'); fs.mkdirSync(dossier, { recursive: true });
    tablesDeRecette().forEach((t, i) => fs.writeFileSync(path.join(dossier, `${i + 1}-${['rumeurs', 'incidents', 'objets'][i]}.json`), JSON.stringify(t, null, 2) + '\n'));
}
