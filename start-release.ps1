# start-release.ps1
# Usage: .\start-release.ps1 -Version 0.1.0
param(
  [string]$Version
)

if(-not (Test-Path releases)) { New-Item -ItemType Directory -Path releases | Out-Null }

if(-not $Version){
  $pkg = Join-Path $PSScriptRoot "package.json"
  if(Test-Path $pkg){
    $json = Get-Content $pkg -Raw | ConvertFrom-Json
    $Version = $json.version
  } else { $Version = "0.0.0" }
}

$filename = "releases/silly-cats-game-v$Version.zip"
if(Test-Path $filename){ Remove-Item $filename }

Write-Host "Creating release zip: $filename"
Compress-Archive -Path (Join-Path $PSScriptRoot '*') -DestinationPath $filename -Force
Write-Host "Release created. You can attach $filename to a GitHub release."