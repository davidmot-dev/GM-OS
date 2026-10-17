# Interroge le carnet NotebookLM « Nephilim » époque par époque, et range les réponses brutes.
# Usage : python -I -X utf8 extraire_vecus.py <nlm.exe> <dossier de sortie>
import json, os, subprocess, sys, time

NLM, SORTIE = sys.argv[1], sys.argv[2]
CARNET = '9389872e-c46b-4cf1-bd6c-18bfccae13b8'
EPOQUES = [
    ('le-sentier-d-or', "Le Sentier d'or", 'La Chute de l\'Atlantide', 61),
    ('les-guerres-elementaires', 'Les Guerres élémentaires', 'Le Déluge', 63),
    ('les-guerres-elementaires', 'Les Guerres élémentaires', 'Les premières pierres dressées', 65),
    ('les-guerres-elementaires', 'Les Guerres élémentaires', 'Les premiers mégalithes', 67),
    ('les-compacts-secrets', 'Les Compacts secrets', 'Le sanctuaire des Tuatha Dé Danann', 69),
    ('les-compacts-secrets', 'Les Compacts secrets', "L'empire divin de Babylone", 71),
    ('les-compacts-secrets', 'Les Compacts secrets', "Le rêve d'Akhenaton", 73),
    ('l-hermetisme', "L'Hermétisme", 'La Mésopotamie des prédictions', 75),
    ('l-hermetisme', "L'Hermétisme", 'Le règne de Salomon', 77),
    ('l-hermetisme', "L'Hermétisme", 'La Syracuse des philosophes', 79),
    ('les-guerres-secretes', 'Les guerres secrètes', "L'empire de Carthage", 81),
    ('les-guerres-secretes', 'Les guerres secrètes', "L'empire de Rome", 83),
    ('les-guerres-secretes', 'Les guerres secrètes', "L'incident Jésus", 85),
    ('les-nouveaux-mondes', 'Les nouveaux mondes', 'Les Arthuriades', 87),
    ('les-nouveaux-mondes', 'Les nouveaux mondes', 'Al-Andalus', 89),
    ('les-nouveaux-mondes', 'Les nouveaux mondes', "L'An Mil", 91),
    ('le-grand-reveil', 'Le grand réveil', 'Les Arcanes de la Renaissance', 93),
    ('le-grand-reveil', 'Le grand réveil', 'La cour du Roi-Soleil', 95),
    ('le-grand-reveil', 'Le grand réveil', 'Les conspirations de la Révolution', 97),
    ('le-grand-reveil', 'Le grand réveil', 'Les vapeurs victoriennes', 99),
]
CONSIGNE = (
    "Livre 0 Quintessence, époque d'incarnation « {epoque} » (ère « {ere} », p. {page}) : "
    "rends UNIQUEMENT un objet JSON, sans texte autour, de la forme "
    '{{"epoque": "...", "dates_et_lieux": "...", "vecus": [{{"nom": "...", "ka": "Feu|Air|Eau|Terre|Lune", '
    '"description": "...", "page": 0}}]}}. '
    "Les cinq Vécus passés de cette époque, chacun avec son nom exact, son Ka-élément et sa "
    "description recopiée intégralement, sans résumer ni omettre."
)

os.makedirs(SORTIE, exist_ok=True)
for i, (slug, ere, epoque, page) in enumerate(EPOQUES):
    chemin = os.path.join(SORTIE, f'{i:02d}.json')
    if os.path.exists(chemin):
        continue
    question = CONSIGNE.format(epoque=epoque, ere=ere, page=page)
    for essai in range(3):
        r = subprocess.run([NLM, 'notebook', 'query', '-t', '240', CARNET, question, '--json'],
                           capture_output=True, text=True, encoding='utf-8')
        try:
            reponse = json.loads(r.stdout).get('answer', '')
        except Exception:
            reponse = ''
        if reponse:
            break
        time.sleep(10)
    json.dump({'ordre': i, 'slug': slug, 'ere': ere, 'epoque': epoque, 'page': page, 'reponse': reponse},
              open(chemin, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{i:02d} {epoque} : {len(reponse)} car.', flush=True)
