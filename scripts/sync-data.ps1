<#
.SYNOPSIS
  Syncs latest data into the app for local/dev usage.

.DESCRIPTION
  1) Pulls latest changes from the upstream repo into your local main (if upstream is configured).
  2) Mirrors the root data/ folder into apps/captaincy-showdown/public/data/.

.NOTES
  - Run in a PowerShell terminal from anywhere; script resolves paths relative to itself.
  - Robocopy exit codes 0-7 are considered success.
  - Schedule this script via Windows Task Scheduler to run after the upstream refresh windows
    (Upstream updates: 05:00 & 17:00 UTC). Suggest running at 05:15 & 17:15 UTC.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/sync-data.ps1 -PushOrigin

.PARAMETER PushOrigin
  After pulling upstream into main, also push to your origin/main.
#>
[CmdletBinding()]
param(
  [switch]$PushOrigin
)

$ErrorActionPreference = 'Stop'

# Resolve repo root based on this script's location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

function Write-Info($msg) { Write-Host "[sync-data] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[sync-data] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[sync-data] $msg" -ForegroundColor Red }

# Ensure git repo
Push-Location $RepoRoot
try {
  $isRepo = (& git rev-parse --is-inside-work-tree) 2>$null
  if (-not $isRepo) { throw "Not inside a git repository: $RepoRoot" }
}
catch {
  Write-Err $_
  Pop-Location
  exit 1
}

# Try to update main from upstream if configured
try {
  $hasUpstream = $false
  $remotes = & git remote 2>$null
  if ($LASTEXITCODE -eq 0) {
    foreach ($r in $remotes) { if ($r.Trim() -eq 'upstream') { $hasUpstream = $true; break } }
  }

  if ($hasUpstream) {
    Write-Info "Fetching upstream..."
    & git fetch upstream --prune
    Write-Info "Switching to main..."
    & git switch main
    Write-Info "Pulling upstream/main (ff-only)..."
    & git pull --ff-only upstream main
    if ($LASTEXITCODE -ne 0) {
      Write-Warn "Fast-forward pull failed. Please resolve manually (rebase/merge)."
    }
    elseif ($PushOrigin) {
      Write-Info "Pushing to origin/main..."
      & git push origin main
    }
  }
  else {
    Write-Warn "No 'upstream' remote found. Skipping upstream sync."
  }
}
catch {
  Write-Warn "Git sync step encountered an issue: $_"
}

# Mirror data/ into app's public/data/
$RootData = Join-Path $RepoRoot 'data'
$AppData  = Join-Path $RepoRoot 'apps/captaincy-showdown/public/data'

if (-not (Test-Path $RootData)) { Write-Err "Source data folder not found: $RootData"; Pop-Location; exit 2 }
if (-not (Test-Path $AppData)) { New-Item -ItemType Directory -Force -Path $AppData | Out-Null }

Write-Info "Mirroring $RootData -> $AppData"
$robolog = Join-Path $env:TEMP "sync-data-$([DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')).log"

# /MIR: mirror, /R:1 /W:1: retry once, wait 1 sec; quiet logs; exclude git keepers
& robocopy $RootData $AppData /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /XF .gitkeep *>&1 | Tee-Object -FilePath $robolog | Out-Null
$rc = $LASTEXITCODE

# Robocopy return codes 0-7 are success
if ($rc -le 7) {
  Write-Info "Data sync complete (robocopy code $rc). Log: $robolog"
  Pop-Location
  exit 0
}
else {
  Write-Err "Robocopy failed with exit code $rc. See log: $robolog"
  Pop-Location
  exit $rc
}
