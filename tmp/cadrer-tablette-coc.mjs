import fs from 'node:fs';const p='e2e/clipCoc.spec.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace('<html lang="fr"><meta name="viewport"','<html lang="fr"><meta charset="utf-8"><meta name="viewport"');
s=s.replace('body{margin:0;background:radial-gradient','html,body{width:1440px;height:900px;overflow:hidden}body{margin:0;background:radial-gradient');
s=s.replace('border-radius:24px;overflow:hidden;box-shadow','border-radius:24px;overflow:clip;box-shadow');
s=s.replace("contentType:'text/html',body:contenuStage","contentType:'text/html; charset=utf-8',body:contenuStage");
s=s.replace('class RealisationTactile extends Realisation {',`class RealisationTactile extends Realisation {
    async viser(cible:Locator,attente=250){
        await super.viser(cible,0);
        await this.page.evaluate(()=>{window.scrollTo(0,0);const cadre=document.querySelector('.appareil');if(cadre){cadre.scrollTop=0;cadre.scrollLeft=0;}});
        await this.pause(attente);
    }`);
s=s.replace("await jeter(.375);await expect(resultat).toContainText('15');","await hasard(f,[.375,.175],()=>r.cliquer(panneau.getByRole('button',{name:'Lancer',exact:true})));await expect(resultat).toContainText('15');");
fs.writeFileSync(p,s);
