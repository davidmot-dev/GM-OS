<#
.SYNOPSIS
    Prépare une tablette Fire (ou toute tablette Android) pour servir d'interface à GM-OS, par ADB.

.DESCRIPTION
    Chantier « La Fire HD 8 comme interface de GM-OS » — tâche T2 :
    documentation/Planning/2026-11-15-fire-hd8-interface.md (registre § 256).

    Ce que le script règle, et seulement ça :
      - l'écran reste allumé tant que la tablette est branchée (secteur ou USB) ;
      - le Wi-Fi ne se met jamais en veille ;
      - l'épinglage d'écran d'Android est rendu disponible (on épingle Firefox à la main) ;
      - avec -Adresse, Firefox s'ouvre sur GM-OS.

    Il affiche chaque réglage AVANT et APRÈS : il est idempotent, on peut le relancer.
    -Retablir remet les valeurs d'usine d'Android pour l'écran et l'épinglage.

    Il ne touche ni aux données de la tablette, ni à ses applications, ni à GM-OS.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File outils\fire\preparer-la-fire.ps1
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File outils\fire\preparer-la-fire.ps1 -Adresse 192.168.0.211:3001
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File outils\fire\preparer-la-fire.ps1 -Retablir
#>
param(
    # Adresse du poste GM-OS vue depuis la tablette (IP:port du SyncServer), par exemple 192.168.0.211:3001.
    [string]$Adresse,
    # Chemin ouvert dans Firefox avec -Adresse (« ?window=tablet » pour le Hub d'un joueur).
    [string]$Chemin = '/?window=tablet',
    # Remet les réglages d'usine au lieu de préparer la tablette.
    [switch]$Retablir
)

$ErrorActionPreference = 'Stop'

function Trouver-Adb {
    $commande = Get-Command adb -ErrorAction SilentlyContinue
    if ($commande) { return $commande.Source }
    $local = Join-Path $env:LOCALAPPDATA 'Android\platform-tools\adb.exe'
    if (Test-Path $local) { return $local }
    throw "ADB introuvable : installer les platform-tools de Google dans $local."
}

$adb = Trouver-Adb

$appareils = @(& $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '\tdevice$' })
if ($appareils.Count -ne 1) {
    throw "Il faut exactement une tablette branchée et autorisée (trouvé : $($appareils.Count)). Vérifier « Activer ADB » et la fenêtre « Autoriser le débogage USB »."
}
$modele = ((& $adb shell getprop ro.product.model) | Out-String).Trim()
$android = ((& $adb shell getprop ro.build.version.release) | Out-String).Trim()
Write-Host "Tablette : $modele, Android $android"

# Les réglages, avec leur valeur voulue et leur valeur d'usine.
# stay_on_while_plugged_in : 1 = secteur, 2 = USB, 4 = sans fil ; 3 = secteur ou USB.
#   Un chargeur « basse tension » se déclare en USB : 3 couvre les deux.
# wifi_sleep_policy : 2 = jamais en veille (déjà la valeur d'usine sur la Fire HD 8 de 2017).
# lock_to_app_enabled : 1 = l'épinglage d'écran est proposé dans la vue des applications récentes.
$reglages = @(
    @{ Espace = 'global'; Cle = 'stay_on_while_plugged_in'; Voulu = '3'; Usine = '0'; Sens = "Écran allumé quand la tablette est branchée" },
    @{ Espace = 'global'; Cle = 'wifi_sleep_policy';        Voulu = '2'; Usine = '2'; Sens = "Wi-Fi jamais en veille" },
    @{ Espace = 'system'; Cle = 'lock_to_app_enabled';      Voulu = '1'; Usine = '0'; Sens = "Épinglage d'écran disponible" }
)

function Lire($r) { ((& $adb shell settings get $r.Espace $r.Cle) | Out-String).Trim() }

$lignes = foreach ($r in $reglages) {
    $avant = Lire $r
    $cible = if ($Retablir) { $r.Usine } else { $r.Voulu }
    if ($avant -ne $cible) { & $adb shell settings put $r.Espace $r.Cle $cible | Out-Null }
    [pscustomobject]@{ Reglage = $r.Sens; Cle = "$($r.Espace) $($r.Cle)"; Avant = $avant; Apres = (Lire $r); Cible = $cible }
}
$lignes | Format-Table Reglage, Cle, Avant, Apres -AutoSize | Out-String | Write-Host

$echecs = @($lignes | Where-Object { $_.Apres -ne $_.Cible })
if ($echecs.Count) { throw "Réglage(s) non appliqué(s) : $(($echecs | ForEach-Object Cle) -join ', ')" }

$batterie = (& $adb shell dumpsys battery) -join "`n"
$niveau = if ($batterie -match 'level: (\d+)') { [int]$Matches[1] } else { -1 }
$secteur = $batterie -match 'AC powered: true'
if ($niveau -ge 0 -and $niveau -lt 20) { Write-Warning "Batterie à $niveau % : la brancher sur son chargeur secteur avant une séance." }
if (-not $secteur) { Write-Warning "Pas de chargeur secteur détecté : le port USB d'un PC charge à peine une Fire allumée." }

if ($Adresse -and -not $Retablir) {
    $url = "http://$Adresse$Chemin"
    & $adb shell input keyevent KEYCODE_WAKEUP | Out-Null
    & $adb shell am start -a android.intent.action.VIEW -d "'$url'" org.mozilla.firefox | Out-Null
    Write-Host "Firefox ouvert sur $url"
}

if (-not $Retablir) {
    Write-Host @"

À faire à la main sur la tablette, une seule fois :
  1. Dans Firefox, sur la page de GM-OS : menu (trois points) > « Ajouter à l'écran d'accueil ».
  2. Pour épingler Firefox : ouvrir GM-OS, toucher le bouton carré (applications récentes),
     puis l'épingle en bas de la carte de Firefox. Pour sortir : maintenir Retour et Carré ensemble.
"@
}
