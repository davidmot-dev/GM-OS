import '../outils/campagnes-de-recette/charger-typescript.mjs';
import fs from 'node:fs';
import { DonneesDeFicheSchema } from '../src/types/donneesDeFiche.ts';
const r=DonneesDeFicheSchema.safeParse({_gmos_dune:{version:1,aventure:'Fiction de contrôle'}});
fs.mkdirSync('output/clips/dune',{recursive:true});
fs.writeFileSync('output/clips/dune/constat-validation.json',JSON.stringify({date:'2026-11-06',schema:'DonneesDeFicheSchema',champ:'_gmos_dune',accepte:r.success,erreurs:r.success?[]:r.error.issues.map(i=>({chemin:i.path,message:i.message})),portee:'Constat du schéma de sauvegarde ; aucun correctif applicatif dans le lot vidéo. La campagne fictive est semée en champs scalaires, puis ses métadonnées préparées dans le profil jetable.'},null,2)+'\n');
console.log(r.success?'accepté':'refus reproduit');
