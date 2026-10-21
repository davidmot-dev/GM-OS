// Usage : node outils/alien/ameliorer-pilote-a6-a7.mjs "Export Dirvers/corriges/Alien_driver_gmos_a5.gmos-driver"
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
const source=process.argv[2];assert.ok(source,'Indiquer l’export A5 à conserver.');
const original=fs.readFileSync(source),archive=new AdmZip(original),state=JSON.parse(archive.readAsText('state.json'));
const p=state.gameDriver,fiche=state.sheetTemplate;assert.equal(p.corpusId,'alien');assert.ok(p.combat.alien?.survie);
const ids=[p.id,fiche.id],avant=fiche.sections.flatMap(s=>s.fields.map(f=>f.id));
p.combat.alien.actions=true;p.jet.alien.combat=p.combat.alien;
function exporter(lot,version){
    p.version=version;assert.deepEqual([p.id,fiche.id],ids);assert.deepEqual(fiche.sections.flatMap(s=>s.fields.map(f=>f.id)),avant);
    const manifest=JSON.parse(archive.readAsText('manifest.json'));manifest.exportedAt=new Date().toISOString();manifest.bundleId+=`-${lot}`;
    const zip=new AdmZip();for(const e of archive.getEntries())if(!['state.json','manifest.json'].includes(e.entryName))zip.addFile(e.entryName,e.getData());
    zip.addFile('state.json',Buffer.from(JSON.stringify(state,null,2)));zip.addFile('manifest.json',Buffer.from(JSON.stringify(manifest,null,2)));
    const sortie=`Export Dirvers/corriges/Alien_driver_gmos_${lot}.gmos-driver`;zip.writeZip(sortie);
    assert.deepEqual(JSON.parse(new AdmZip(sortie).readAsText('state.json')),state);assert.deepEqual(fs.readFileSync(source),original);
    fs.writeFileSync(`Export Dirvers/corriges/alien_state_${lot}.json`,JSON.stringify(state,null,2)+'\n');
    fs.mkdirSync(`scratch/alien-${lot}/pilotes`,{recursive:true});fs.copyFileSync(sortie,`scratch/alien-${lot}/pilotes/Alien.gmos-driver`);
    return {sortie,version,champs:avant.length,ids,originalInchange:true,sha256Source:crypto.createHash('sha256').update(original).digest('hex')};
}
const a6=exporter('a6','1.6.0');
p.combat.alien.progression={experience:'field-1786782929062',recit:'points_de_recit',fetiche:'objet_fetiche',camarade:'camarade',rival:'rival',esprit:'esprit',competences:Object.keys(p.jet.alien.competences)};
p.jet.alien.combat=p.combat.alien;
const px=fiche.sections.flatMap(s=>s.fields).find(f=>f.id===p.combat.alien.progression.experience);assert.ok(px);px.type='number';delete px.max;px.min=0;
for(const st of p.combat.statsToTrack??[])if(st.fieldId===p.combat.alien.stress)st.gestes=(st.gestes??[]).filter(g=>!g.libelle.toLowerCase().includes('fétiche'));
const a7=exporter('a7','1.7.0');
fs.writeFileSync('scratch/alien-a6-a7/export.json',JSON.stringify({a6,a7},null,2));console.log(JSON.stringify({a6,a7}));
