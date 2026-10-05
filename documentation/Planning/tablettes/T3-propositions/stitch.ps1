param(
    [Parameter(Mandatory = $true)][string]$Outil,
    [string]$ArgumentsJson = '{}',
    [string]$FichierArguments,
    [Parameter(Mandatory = $true)][string]$Sortie
)

# La clé reste en mémoire et ne figure jamais dans les exports ni les journaux.
$ErrorActionPreference = 'Stop'
$cleStitch = [Environment]::GetEnvironmentVariable('STITCH_API_KEY', 'Machine')
if (-not $cleStitch) { throw 'Clé Stitch absente du scope Machine.' }
if ($FichierArguments) { $ArgumentsJson = Get-Content -Raw -Encoding UTF8 -LiteralPath $FichierArguments }
$argumentsStitch = $ArgumentsJson | ConvertFrom-Json
$requeteStitch = @{ jsonrpc = '2.0'; id = 1; method = 'tools/call'; params = @{ name = $Outil; arguments = $argumentsStitch } } | ConvertTo-Json -Depth 50 -Compress
$entetesStitch = @{ 'X-Goog-Api-Key' = $cleStitch; Accept = 'application/json, text/event-stream' }
try {
    $reponseStitch = Invoke-WebRequest -Uri 'https://stitch.googleapis.com/mcp' -Method Post -Headers $entetesStitch -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($requeteStitch)) -UseBasicParsing -TimeoutSec 600
    [IO.File]::WriteAllText($Sortie, $reponseStitch.Content, [Text.UTF8Encoding]::new($false))
    Write-Output ('Réponse enregistrée : ' + $Sortie)
} catch {
    Write-Output ('Échec Stitch : ' + $_.Exception.GetType().Name)
    if ($_.Exception.Response) { Write-Output ('Statut HTTP : ' + [int]$_.Exception.Response.StatusCode) }
    exit 1
}
