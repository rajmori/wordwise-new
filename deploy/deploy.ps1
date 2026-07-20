# ─────────────────────────────────────────────────────────────
#  WordWise — Deploy to EC2 (run from your local machine)
#  Usage: .\deploy\deploy.ps1 -KeyFile "C:\path\to\wordwise-key.pem" -EC2IP "1.2.3.4"
# ─────────────────────────────────────────────────────────────

param(
    [Parameter(Mandatory=$true)]
    [string]$KeyFile,       # Path to your .pem key file

    [Parameter(Mandatory=$true)]
    [string]$EC2IP,         # EC2 public IP address

    [string]$EC2User = "ubuntu",
    [string]$AppDir  = "wordwise-server"
)

$ErrorActionPreference = "Stop"
$ServerSrc = Join-Path $PSScriptRoot "..\server"

Write-Host ""
Write-Host "======================================"
Write-Host "  WordWise Deploy to EC2"
Write-Host "======================================"
Write-Host "  EC2 IP  : $EC2IP"
Write-Host "  Key file: $KeyFile"
Write-Host ""

# ── Fix .pem permissions (Windows requires this for SSH) ──────
Write-Host "[1/5] Fixing .pem file permissions..."
icacls $KeyFile /inheritance:r /grant:r "$($env:USERNAME):(R)" | Out-Null
Write-Host "      Done."

# ── Build exclude list ────────────────────────────────────────
$excludeFile = Join-Path $env:TEMP "rsync-exclude.txt"
@"
node_modules/
*.log
.env
__tests__/
prisma/
*.tar.gz
test-*.js
check-*.js
inspect-*.js
seed-*.js
migrate-*.js
update-*.js
verify-*.js
setup-stripe-product.js
gcp-service-account-key.json
encode-gcp-key.ps1
backend_stdout.log
backend_stderr.log
"@ | Set-Content $excludeFile

# ── Upload server files via SCP ───────────────────────────────
Write-Host ""
Write-Host "[2/5] Uploading server files to EC2..."
Write-Host "      (this may take a minute on first deploy)"

# Create remote directory
ssh -i $KeyFile -o StrictHostKeyChecking=no "${EC2User}@${EC2IP}" "mkdir -p ~/$AppDir"

# Upload using scp recursively, excluding node_modules
# Read exclude patterns and build scp-compatible approach
$filesToUpload = Get-ChildItem -Path $ServerSrc -Exclude "node_modules","*.log","prisma","__tests__" |
    Where-Object { $_.Name -notmatch '^(test-|check-|inspect-|seed-|migrate-|update-|verify-|setup-stripe|encode-gcp|backend_std)' }

foreach ($item in $filesToUpload) {
    if ($item.PSIsContainer) {
        scp -i $KeyFile -o StrictHostKeyChecking=no -r "$($item.FullName)" "${EC2User}@${EC2IP}:~/$AppDir/" 2>&1 | Out-Null
    } else {
        scp -i $KeyFile -o StrictHostKeyChecking=no "$($item.FullName)" "${EC2User}@${EC2IP}:~/$AppDir/" 2>&1 | Out-Null
    }
    Write-Host "      Uploaded: $($item.Name)"
}

# ── Upload .env separately ────────────────────────────────────
Write-Host ""
Write-Host "[3/5] Uploading .env file..."
$envPath = Join-Path $ServerSrc ".env"
if (Test-Path $envPath) {
    scp -i $KeyFile -o StrictHostKeyChecking=no $envPath "${EC2User}@${EC2IP}:~/$AppDir/.env"
    Write-Host "      .env uploaded."
} else {
    Write-Host "      WARNING: No .env found at $envPath"
    Write-Host "      You will need to create it manually on EC2."
}

# ── Upload setup script ───────────────────────────────────────
Write-Host ""
Write-Host "[4/5] Uploading setup script..."
$setupScript = Join-Path $PSScriptRoot "setup-ec2.sh"
scp -i $KeyFile -o StrictHostKeyChecking=no $setupScript "${EC2User}@${EC2IP}:~/setup-ec2.sh"
ssh -i $KeyFile -o StrictHostKeyChecking=no "${EC2User}@${EC2IP}" "chmod +x ~/setup-ec2.sh"
Write-Host "      Done."

# ── Run setup on EC2 ─────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Running setup on EC2..."
Write-Host "      (installing Node.js, PM2, npm deps — takes ~2 min)"
Write-Host ""
ssh -i $KeyFile -o StrictHostKeyChecking=no "${EC2User}@${EC2IP}" "bash ~/setup-ec2.sh"

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================"
Write-Host "  Deployment complete!"
Write-Host "======================================"
Write-Host ""
Write-Host "  API: http://${EC2IP}:3000"
Write-Host "  Admin login test:"
Write-Host "    POST http://${EC2IP}:3000/api/v1/admin/auth/login"
Write-Host ""
Write-Host "  To redeploy after code changes, run this script again."
Write-Host "  To SSH in: ssh -i `"$KeyFile`" ${EC2User}@${EC2IP}"
Write-Host ""
