/* Extrait d'étude de « Les Terres Médianes du Rêve : Outils ».
 * Auteur : Cyol ; version du site corrigée par Kroc.
 * Source : https://scriptarium.org/RdD/tmr/js/tmr.js
 * Licence annoncée : CC BY 3.0 France — https://creativecommons.org/licenses/by/3.0/fr/
 * Modification Codex, 18/10/2026 : sélection de fonctions, notice ajoutée.
 * Corps des fonctions inchangés. Dépendances et limites : ../README.md.
 * Aucune intégration à GM-OS ; ne pas importer ces extraits dans l'application.
 */

function lanceNbAstral()
{
    var x = lanceD(1,12);

    $("#nbAstral").val(x).slider('refresh');
    $("#boutonNbAstral").blur();
    calculAstrologie();
}

function calculAstrologie()
{
    var nbAstral = parseInt($("#nbAstral").val());
    var heureNaissance = parseInt($("input[name=heureNaissance]:checked").val());
    dessineRoueAstrologique();
    if(!isNaN(heureNaissance))
    {
        var heureTresFavorable = nbAstral + heureNaissance;
        positionneHeures(heureTresFavorable);
    }
}

function dessineRoueAstrologique()
{
    var radius = (canvasAstrologie.height / 2);
    //Cercle extérieur
    var radiusExt = radius*0.9;
    contextAstrologie.beginPath();
    contextAstrologie.arc(0,0, radiusExt, 0, 2*Math.PI);
    contextAstrologie.fillStyle = "lightyellow";
    contextAstrologie.fill();
    //DemiCercle
    contextAstrologie.beginPath();
    contextAstrologie.arc(0,0, radiusExt, 0.5*Math.PI, 1.5*Math.PI);
    contextAstrologie.fillStyle = "lightblue";
    contextAstrologie.fill();

    //Cercle intérieur
    var radiusInt = radius*0.6;
    contextAstrologie.beginPath();
    contextAstrologie.arc(0,0, radiusInt, 0, 2*Math.PI);
    contextAstrologie.fillStyle = "#333";
    contextAstrologie.fill();

    var ang;
    var num;
    for ( num = 1; num <= 12; num++)
    {
        var imageHeure = new Image();
        imageHeure.src='img/rddHeure'+heureDesignation[num]+'.png';
        ang = (num-1) * Math.PI / 6;
        positionneAffichage(radiusExt, ang);
        //Le 0, 0 est le point central où l'image sera placée, on position donc x et y à respectivement -width/2 et -height/2 pour bien centrer l'image
        contextAstrologie.drawImage(imageHeure, -32, -27, 65, 55);
        reinitialisationPointOrigine(radiusExt, ang);
    }
}

function positionneAffichage(radius, ang)
{
    contextAstrologie.rotate(ang);
    contextAstrologie.translate(0, -radius*0.85);
    contextAstrologie.rotate(-ang);
}

function reinitialisationPointOrigine(radius, ang)
{
    //Remise en place du point de référence pour le calcul du suivant
    contextAstrologie.rotate(ang);
    contextAstrologie.translate(0, radius*0.85);
    contextAstrologie.rotate(-ang);
}

function positionneHeures(heureTresFavorable)
{
    while(heureTresFavorable > 12)
    {
        heureTresFavorable-=12;
    }
    var heureTresDefavorable = heureTresFavorable+6;
    if(heureTresDefavorable > 12)
    {
        heureTresDefavorable-=12;
    }
    var heureFavorable1 = heureTresFavorable+4;
    if(heureFavorable1 > 12)
    {
        heureFavorable1-=12;
    }
    var heureFavorable2 = heureTresFavorable+8;
    if(heureFavorable2 > 12)
    {
        heureFavorable2-=12;
    }
    var heureDefavorable1 = heureTresFavorable+3;
    if(heureDefavorable1 > 12)
    {
        heureDefavorable1-=12;
    }
    var heureDefavorable2 = heureTresFavorable+9;
    if(heureDefavorable2 > 12)
    {
        heureDefavorable2-=12;
    }


    var radius = (canvasAstrologie.height / 2);
    //Cercle intérieur
    var radiusInt = radius*0.55;
    var ang;
    contextAstrologie.font = radius*0.15 + "px arial";
    contextAstrologie.textBaseline="middle";
    contextAstrologie.textAlign="center";
    contextAstrologie.fillStyle = "#000";

    ang = (heureTresFavorable-1) * Math.PI / 6;
    positionneAffichage(radiusInt, ang);
    contextAstrologie.fillText("+4", 0, 0);
    reinitialisationPointOrigine(radiusInt, ang);

    ang = (heureTresDefavorable-1) * Math.PI / 6;
    positionneAffichage(radiusInt, ang);
    contextAstrologie.fillText("-4", 0, 0);
    reinitialisationPointOrigine(radiusInt, ang);

    ang = (heureDefavorable1-1) * Math.PI / 6;
    positionneAffichage(radiusInt, ang);
    contextAstrologie.fillText("-2", 0, 0);
    reinitialisationPointOrigine(radiusInt, ang);

    ang = (heureDefavorable2-1) * Math.PI / 6;
    positionneAffichage(radiusInt, ang);
    contextAstrologie.fillText("-2", 0, 0);
    reinitialisationPointOrigine(radiusInt, ang);

    ang = (heureFavorable1-1) * Math.PI / 6;
    positionneAffichage(radiusInt, ang);
    contextAstrologie.fillText("+2", 0, 0);
    reinitialisationPointOrigine(radiusInt, ang);

    ang = (heureFavorable2-1) * Math.PI / 6;
    positionneAffichage(radiusInt, ang);
    contextAstrologie.fillText("+2", 0, 0);
    reinitialisationPointOrigine(radiusInt, ang);
}
