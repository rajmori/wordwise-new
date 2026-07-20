# ─────────────────────────────────────────────────────────────
#  WordWise — Redeploy updated code to EC2 (fast, no re-setup)
#  Usage: .\deploy\redeploy.ps1 -KeyFile "C:\path\to\wordwise-key.pem" -EC2IP "1.2.3.4"
# ─────────────────────────────────────────────────────────────

param(
    [Parameter(Mandatory=$true)]
    [string]$KeyFile,

    [Parameter(Mandatory=$true)]
    [string]$EC2IP,

    [string]$EC2User = "ubuntu",
    [string]$AppDir  = "wordwise-server"
)

$ErrorActionPreference = "Stop"
$ServerSrc = Join-Path $PSScriptRoot "..\server"

Write-Host ""
Write-Host "======================================"
Write-Host "  WordWise Redeploy"
Write-Host "======================================"

# Upload changed source files (no node_modules, no .env overwrite)
Write-Host ""
Write-Host "[1/3] Uploading updated files..."

$dirsToUpload = @("config","controllers","middleware","middlewares","models","routes","utils","src")
foreach ($dir in $dirsToUpload) {
    $path = Join-Path $ServerSrc $dir
    if (Test-Path $path) {
        scp -i $KeyFile -o StrictHostKeyChecking=no -r $path "${EC2User}@${EC2IP}:~/$AppDir/" 2>&1 | Out-Null
        Write-Host "      $dir/"
    }
}

# Upload root JS file
scp -i $KeyFile -o StrictHostKeyChecking=no (Join-Path $ServerSrc "server.js") "${EC2User}@${EC2IP}:~/$AppDir/server.js" 2>&1 | Out-Null
Write-Host "      server.js"

# Upload package.json (in case deps changed)
scp -i $KeyFile -o StrictHostKeyChecking=no (Join-Path $ServerSrc "package.json") "${EC2User}@${EC2IP}:~/$AppDir/package.json" 2>&1 | Out-Null
Write-Host "      package.json"

# ── Re-install deps if package.json changed ───────────────────
Write-Host ""
Write-Host "[2/3] Installing any new dependencies..."
ssh -i $KeyFile -o StrictHostKeyChecking=no "${EC2User}@${EC2IP}" "cd ~/$AppDir && npm install --omit=dev --silent"

# ── Restart PM2 ───────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] Restarting app..."
ssh -i $KeyFile -o StrictHostKeyChecking=no "${EC2User}@${EC2IP}" "pm2 restart wordwise-server && pm2 status"

Write-Host ""
Write-Host "  ✅ Redeploy complete → http://${EC2IP}:3000"
Write-Host ""
