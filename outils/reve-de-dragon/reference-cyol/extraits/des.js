/* Extrait d'étude de « Les Terres Médianes du Rêve : Outils ».
 * Auteur : Cyol ; version du site corrigée par Kroc.
 * Source : https://scriptarium.org/RdD/tmr/js/tmr.js
 * Licence annoncée : CC BY 3.0 France — https://creativecommons.org/licenses/by/3.0/fr/
 * Modification Codex, 18/10/2026 : sélection de fonctions, notice ajoutée.
 * Corps des fonctions inchangés. Dépendances et limites : ../README.md.
 * Aucune intégration à GM-OS ; ne pas importer ces extraits dans l'application.
 */

function diceRoll(nDes, nFaces) {
    //On récupère le nombre global de possibilités dans faces
    var rollResultat = [];
    var aRoll;
    for (var i = 0; i < nDes; i++ ){
        aRoll = Math.floor(Math.random()*nFaces);
        rollResultat[rollResultat.length] = aRoll+1;
    }
    return (rollResultat);
}

function lanceD(nDes, nFaces, debutA1)
{
    if(typeof debutA1 === "undefined")
    {
        debutA1 = true;
    }
    var dResultat = 0;
    var d = diceRoll(nDes, nFaces);
    for(var i = 0; i< d.length; i++)
    {
        dResultat += d[i];
    }
    if(!debutA1)
    {
        dResultat--;
    }
    return dResultat;
}

function dDr()
{
    var resultat = 0;
    var dResultat;
    do
    {
        dResultat = lanceD(1, 8, false);
        resultat+=dResultat;
    } while(dResultat === 7);
    return resultat;
}
