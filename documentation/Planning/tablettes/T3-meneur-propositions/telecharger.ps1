param([Parameter(Mandatory=$true)][string[]]$Noms)
$ErrorActionPreference='Stop'
foreach($nom in $Noms){
 $chemin=Join-Path $PSScriptRoot ($nom+'-reponse.json')
 $reponse=(Get-Content -Raw -Encoding UTF8 -LiteralPath $chemin | ConvertFrom-Json).result.structuredContent
 $ecran=@($reponse.outputComponents | Where-Object {$_.design} | ForEach-Object {$_.design.screens})[0]
 if(-not $ecran.htmlCode.downloadUrl){throw ('Export absent : '+$nom)}
 Invoke-WebRequest -Uri $ecran.htmlCode.downloadUrl -OutFile (Join-Path $PSScriptRoot ($nom+'-original.html')) -UseBasicParsing -TimeoutSec 180
 Write-Output ($nom+' : export téléchargé')
}
