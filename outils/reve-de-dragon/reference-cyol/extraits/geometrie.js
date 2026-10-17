/* Extrait d'étude de « Les Terres Médianes du Rêve : Outils ».
 * Auteur : Cyol ; version du site corrigée par Kroc.
 * Source : https://scriptarium.org/RdD/tmr/js/tmr.js
 * Licence annoncée : CC BY 3.0 France — https://creativecommons.org/licenses/by/3.0/fr/
 * Modification Codex, 18/10/2026 : sélection de fonctions, notice ajoutée.
 * Corps des fonctions inchangés. Dépendances et limites : ../README.md.
 * Aucune intégration à GM-OS ; ne pas importer ces extraits dans l'application.
 */

function Hex(q, r, s) {
    return {q: q, r: r, s: s};
}

function OffsetCoord(col, row) {
    return {col: col, row: row};
}

function qoffset_from_cube(offset, h)
{
    var col = h.q;
    var row = h.r + Math.trunc((h.q + offset * (h.q & 1)) / 2);
    return OffsetCoord(col, row);
}

function qoffset_to_cube(offset, h)
{
    var q = h.col;
    var r = h.row - Math.trunc((h.col + offset * (h.col & 1)) / 2);
    var s = -q - r;
    return Hex(q, r, s);
}

function hex_length(hex)
{
    return Math.trunc((Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2);
}

function hex_add(a, b)
{
    return Hex(a.q + b.q, a.r + b.r, a.s + b.s);
}

function hex_subtract(a, b)
{
    return Hex(a.q - b.q, a.r - b.r, a.s - b.s);
}

function hex_distance(a, b)
{
    return hex_length(hex_subtract(a, b));
}

function offset_distance(a, b)
{
    var ac = qoffset_to_cube(offsetCol,a);
    var bc = qoffset_to_cube(offsetCol,b);
    return hex_distance(ac, bc);
}

function hex_hexaAPortee(a, porte)
{
    var results = [];
    for(var i = a.q-porte; i <= a.q +porte; i++)
    {
        for(var j = a.r-porte; j <= a.r+porte; j++)
        {
            for(var k = a.s-porte; k <= a.s+porte; k++)
            {
                if(i+j+k === 0)
                {
                    results.push(Hex(i,j,k));
                }
            }
        }
    }
    return results;
}

function offset_hexaAPortee(a, porte)
{
    var results = [];
    var ac = qoffset_to_cube(offsetCol,a);
    var results_hex = hex_hexaAPortee(ac, porte);
    for (var i = 0; i < results_hex.length; i++)
    {
        results[i] = qoffset_from_cube(offsetCol, results_hex[i]);
    }
    return results;
}
