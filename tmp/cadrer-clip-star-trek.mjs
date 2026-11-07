import fs from 'node:fs';
const p='e2e/clipStarTrek.spec.ts';let t=fs.readFileSync(p,'utf8');
t=t.replace("await r.montrer(ops.locator('[data-vaisseau=\"clip-drone\"]'),3000);await photo('12-breche');", "await r.montrer(ops.locator('[data-vaisseau=\"clip-drone\"] [data-boucliers]'),3000);await photo('12-breche');await r.montrer(ops.locator('[data-vaisseau=\"clip-drone\"] [data-breches]'),2800);");
t=t.replace("await r.montrer(defi,2800);await photo('14-defi');", "await r.legende('Un défi réunit plusieurs tâches clés et un budget d’intervalles.','La première tâche est cochée ; elle consomme deux intervalles, de six à quatre. Écourter une tâche coûte deux Impulsions.',3300);await r.montrer(defi,2800);await photo('14-defi');");
fs.writeFileSync(p,t);
