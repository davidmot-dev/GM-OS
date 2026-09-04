# validate.ps1 - Local CI Validation Script for GM-OS
$ErrorActionPreference = "Stop"

function Write-Header ($text) {
    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
}

function Write-Success ($text) {
    Write-Host "  [OK] $text" -ForegroundColor Green
}

function Write-Failure ($text) {
    Write-Host "  [FAIL] $text" -ForegroundColor Red
}

try {
    # 1. Type Checking
    Write-Header "Etape 1 : Verification du Typage TypeScript"
    npx tsc -b
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Erreur de typage TypeScript."
        exit 1
    }
    Write-Success "Typage TypeScript valide."

    # 2. Linting
    Write-Header "Etape 2 : Analyse Statique (Linting)"
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] Des problemes de linting ont ete detectes dans le projet (non bloquant)." -ForegroundColor Yellow
    } else {
        Write-Success "Code propre (Linting OK)."
    }

    # 3. Unit & Integration Tests
    Write-Header "Etape 3 : Execution des Tests Unitaires et d'Integration"
    #
    # `--maxWorkers=4` n'est pas un reglage de confort : sans bride, vitest
    # ouvre autant de processus que la machine a de coeurs, et la suite devient
    # instable ici. Symptome deja paye deux fois -- 263 fichiers rendus en
    # echec sans qu'un seul test ait ete execute, puis, le 2026-09-04, un a
    # deux echecs qui SE DEPLACENT d'une execution a l'autre et disparaissent
    # des qu'on rejoue le fichier seul.
    #
    # Une CI qui echoue au hasard ne dit plus rien : on finit par la croire
    # quand elle passe et par la contourner quand elle bloque. C'est
    # exactement ce qu'il ne faut pas d'un garde-fou pose devant `git push`.
    npx vitest run --maxWorkers=4
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Des tests ont echoue."
        exit 1
    }
    Write-Success "Tous les tests sont passes avec succes."

    # 4. Production Build
    Write-Header "Etape 4 : Validation du Build de Production"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Le build de production a echoue."
        exit 1
    }
    Write-Success "Build de production reussi."

    Write-Header "RAPPORT GLOBAL DE VALIDATION"
    Write-Host "  Le code respecte tous les criteres de stabilite de GM-OS v6." -ForegroundColor Green
    Write-Host "  Pret pour l'integration.`n" -ForegroundColor Green
    exit 0

} catch {
    Write-Failure "Une erreur est survenue lors de la validation."
    exit 1
}
