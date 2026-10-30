"""Essais de l'outil portable, avec des données entièrement fictives en dossier temporaire."""
import csv
import importlib.util
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from types import SimpleNamespace

ICI = Path(__file__).resolve().parent
SCRIPT = ICI / 'plugin/gmos-campagnes-tests/skills/campagnes-de-test/scripts/gmos_bundle.py'
spec = importlib.util.spec_from_file_location('bundle', SCRIPT)
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)


class Outil(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)
        self.state = {'campaign': {'id': 'test-c', 'name': 'Fiction de contrôle', 'system': 'test-driver'},
                      'players': [{'id': 'test-player', 'realName': 'Joueur fictif', 'characters': [{'id': 'test-pj', 'campaignId': 'test-c', 'systemId': 'test-driver', 'templateId': 'test-sheet', 'sheetData': {'force': 12}}]}],
                      'entities': [], 'sessions': [], 'atlasMaps': [], 'wikiEntries': [], 'timelineEvents': [], 'clues': [],
                      'requiredDriverData': [{'id': 'test-driver', 'version': '0.0.1'}], 'requiredTemplateData': [{'id': 'test-sheet', 'sections': []}]}
        self.args = SimpleNamespace(state=str(self.dir/'state.json'), assets=str(self.dir/'assets.json'), date='2026-10-30T12:00:00Z', gmos_version='6.5.0', output=str(self.dir/'test.gmos'))
        (self.dir/'state.json').write_bytes(b.json_octets(self.state)); (self.dir/'assets.json').write_text('[]')

    def build(self):
        (self.dir/'state.json').write_bytes(b.json_octets(self.state))
        return b.construire(self.args)

    def test_assemblage_relecture_et_determinisme(self):
        r = self.build(); self.assertTrue(r['valid']); self.assertEqual(r['characters'], 1)
        self.args.output = str(self.dir/'bis.gmos'); r2 = self.build(); self.assertEqual(r['sha256'], r2['sha256'])

    def test_aucun_ecrasement(self):
        r = self.build()
        with self.assertRaises(FileExistsError): self.build()
        self.assertEqual(b.sha(Path(self.args.output).read_bytes()), r['sha256'])

    def test_media_et_corruption(self):
        (self.dir/'plan.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"/>')
        (self.dir/'assets.json').write_bytes(b.json_octets([{'originalRef': 'plan.svg', 'relativePath': 'assets/plan.svg', 'source': 'plan.svg', 'mimeType': 'image/svg+xml'}]))
        self.assertTrue(self.build()['valid'])
        z,m,s,h=b.ouvrir(self.args.output)
        buf=io.BytesIO()
        with zipfile.ZipFile(buf,'w') as bad:
            for name in z.namelist(): bad.writestr(name, b'CORROMPU' if name=='assets/plan.svg' else z.read(name))
        z.close()
        with zipfile.ZipFile(buf) as bad: r=b.verifier(bad,m,s,h)
        self.assertFalse(r['valid']); self.assertTrue(any('SHA-256' in e for e in r['errors']))

    def test_traversee_archive_refusee(self):
        for name in ['../state.json', '/etc/secret', 'C:/secret', 'assets\\secret', 'assets/../secret', 'assets//secret']:
            with self.subTest(name=name), self.assertRaises(ValueError): b.chemin_sûr(name)

    def test_traversee_source_media_refusee(self):
        (self.dir/'assets.json').write_bytes(b.json_octets([{'originalRef':'x','relativePath':'assets/x','source':'../secret','mimeType':'image/png'}]))
        with self.assertRaises(ValueError): self.build()
        self.assertFalse(Path(self.args.output).exists())

    def test_mauvais_rattachement_pj(self):
        self.state['players'][0]['characters'][0]['campaignId']='autre'
        with self.assertRaisesRegex(ValueError,'autre campagne'): self.build()

    def test_ids_repetes(self):
        self.state['players'][0]['characters'] *= 2
        with self.assertRaisesRegex(ValueError,'IDs répétés'): self.build()

    def test_scene_lien_inconnu(self):
        self.state['scenes']=[{'id':'scene','lieuId':'lieu-inconnu'}]
        with self.assertRaisesRegex(ValueError,'référence inconnue'): self.build()

    def test_nan_refuse(self):
        with self.assertRaises(ValueError): b.json_lire(b'{"pv":NaN}')

    def test_date_sans_fuseau_refusee(self):
        self.args.date='2026-10-30T12:00:00'
        with self.assertRaisesRegex(ValueError,'fuseau'): self.build()

    def test_csv_initial_vierge(self):
        import subprocess,sys
        source=self.dir/'cas.json'; out=self.dir/'resultats.csv'
        source.write_bytes(b.json_octets([{'id':'A01','archive':'01.gmos','precondition':'Ressource 2','action':'Dépenser 1','attendu':'Ressource 1'}]))
        subprocess.run([sys.executable,str(SCRIPT),'cases','--source',str(source),'--output',str(out)],check=True,capture_output=True)
        rows=list(csv.DictReader(io.StringIO(out.read_text(encoding='utf-8-sig')),delimiter=';'))
        self.assertEqual(rows[0]['statut'],'NON TESTÉ'); self.assertEqual(rows[0]['preuve'],''); self.assertEqual(rows[0]['observe'],'')


if __name__=='__main__': unittest.main(verbosity=2)
