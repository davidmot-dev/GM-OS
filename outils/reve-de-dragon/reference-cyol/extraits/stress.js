/* Extrait d'étude de « Les Terres Médianes du Rêve : Outils ».
 * Auteur : Cyol ; version du site corrigée par Kroc.
 * Source : https://scriptarium.org/RdD/tmr/js/tmr.js
 * Licence annoncée : CC BY 3.0 France — https://creativecommons.org/licenses/by/3.0/fr/
 * Modification Codex, 18/10/2026 : sélection de fonctions, notice ajoutée.
 * Corps des fonctions inchangés. Dépendances et limites : ../README.md.
 * Aucune intégration à GM-OS ; ne pas importer ces extraits dans l'application.
 */

function gainXp(stress, pourcentage, jet, difficulte)
{
    if(typeof difficulte === "undefined")
    {
        difficulte = 0;
    }
    var tauxGain = 0.2;
    if(jet >= getEchecTotalSeuil(pourcentage, difficulte))
    {
        tauxGain = 0;
    }
    else if(jet >= getEchecParticulierSeuil(pourcentage, difficulte))
    {
        tauxGain = 0.1;
    }
    else if(jet <= pourcentage && jet <100)
    {
        tauxGain = 0.5;
        if (jet <= getReussiteSignificativeSeuil(pourcentage, difficulte))
        {
            tauxGain = 0.75;
            if( jet <= getReussiteParticuliereSeuil(pourcentage, difficulte))
            {
                tauxGain = 1;
                //On retente un jet, si Particulière ou Significative, ça donne une DoubleParticulière et 150% de gain de PX
                jet = lanceD(1, 100);
                if (jet <= getReussiteSignificativeSeuil(pourcentage, difficulte))
                {
                    tauxGain = 1.5;
                }
            }
        }
    }
    return Math.floor((stress*tauxGain));
}
