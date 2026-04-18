# Helper script to encode GCP service account key for Railway

# Read the JSON file
$content = Get-Content "gcp-service-account-key.json" -Raw

# Convert to Base64
$base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))

# Copy to clipboard
$base64 | Set-Clipboard

Write-Host "✅ GCP Service Account Key encoded to Base64"
Write-Host "✅ Base64 string copied to clipboard"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Go to Railway dashboard"
Write-Host "2. Navigate to Variables"
Write-Host "3. Add new variable:"
Write-Host "   Name: GCP_SERVICE_ACCOUNT_BASE64"
Write-Host "   Value: Paste from clipboard (Ctrl+V)"
Write-Host ""
Write-Host "The base64 string is now in your clipboard!"
