$files = @('frontend/estudante/index.html', 'frontend/sala/index.html')

foreach ($f in $files) {
    $c = Get-Content -Raw -Path $f
    $new = $c.Replace('https://atenaai-api.onrender.com', 'https://web-production-110f3.up.railway.app')
    Set-Content -Path $f -Value $new -NoNewline
    Write-Host "Updated: $f"
}