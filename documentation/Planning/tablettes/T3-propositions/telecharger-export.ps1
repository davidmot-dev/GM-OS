param([Parameter(Mandatory=$true)][string]$Nom)
$ErrorActionPreference = 'Stop'
$dossierT3 = $PSScriptRoot
$reponseT3 = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $dossierT3 ($Nom + '-reponse.json')) | ConvertFrom-Json
$ecranT3 = @($reponseT3.result.structuredContent.outputComponents | ForEach-Object { $_.design.screens } | Where-Object { $_ })[0]
if (-not $ecranT3.htmlCode.downloadUrl) { throw 'Export HTML absent de la reponse Stitch.' }
Invoke-WebRequest -Uri $ecranT3.htmlCode.downloadUrl -OutFile (Join-Path $dossierT3 ($Nom + '-original.html')) -UseBasicParsing
Write-Output ($Nom + ' : HTML original telecharge.')
