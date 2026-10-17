/* Extrait d'étude de « Les Terres Médianes du Rêve : Outils ».
 * Auteur : Cyol ; version du site corrigée par Kroc.
 * Source : https://scriptarium.org/RdD/tmr/js/tmr.js
 * Licence annoncée : CC BY 3.0 France — https://creativecommons.org/licenses/by/3.0/fr/
 * Modification Codex, 18/10/2026 : sélection de fonctions, notice ajoutée.
 * Corps des fonctions inchangés. Dépendances et limites : ../README.md.
 * Aucune intégration à GM-OS ; ne pas importer ces extraits dans l'application.
 */

function getPourcentageChance(carac, difficulte)
{
    if( difficulte < -16)
    {
        return 0;
    }
    else if( difficulte < -10)
    {
        return 1;
    }
    return Math.max(1,Math.floor(carac*(Math.max(0.25,(difficulte+10)/2))));
}

function getReussiteParticuliereSeuil(pourcentage, difficulte)
{
    if( difficulte < -10)
    {
        return 0;
    }
    return Math.max(1,Math.ceil(pourcentage*0.2));
}

function getReussiteSignificativeSeuil(pourcentage, difficulte)
{
    if( difficulte < -10)
    {
        return 0;
    }
    return Math.max(1, Math.floor(pourcentage*0.5));
}

function getEchecParticulierSeuil(pourcentage, difficulte)
{
    if( difficulte < -16)
    {
        return 0;
    }
    else if( difficulte < -10)
    {
        return 2;
    }
    return Math.min(101,100-(Math.floor((100-pourcentage)*0.2)));
}

function getEchecTotalSeuil(pourcentage, difficulte)
{
    if( difficulte < -10)
    {
        switch (difficulte)
        {
            case -11 :
                return 90;
                break;
            case -12 :
                return 70;
                break;
            case -13 :
                return 50;
                break;
            case -14 :
                return 30;
                break;
            case -15 :
                return 10;
                break;
            case -16 :
                return 2;
                break;
            default :
                return 1;
                break;
        }
    }
    return Math.min(101,100-(Math.floor((100-pourcentage)*0.1)));
}
