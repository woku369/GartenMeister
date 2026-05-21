# scripts/clean-sharp-for-build.ps1
# Problematische Sharp-Pakete für Windows-Build entfernen

Write-Host "🧹 Cleaning problematic Sharp packages for Windows build..." -ForegroundColor Yellow

# Verzeichnisse die entfernt werden sollen
$sharpsToRemove = @(
    "node_modules\@img\sharp-darwin-arm64",
    "node_modules\@img\sharp-darwin-x64", 
    "node_modules\@img\sharp-linux-arm",
    "node_modules\@img\sharp-linux-arm64",
    "node_modules\@img\sharp-linux-x64",
    "node_modules\@img\sharp-linuxmusl-arm64",
    "node_modules\@img\sharp-linuxmusl-x64",
    "node_modules\@img\sharp-libvips-darwin-arm64",
    "node_modules\@img\sharp-libvips-darwin-x64",
    "node_modules\@img\sharp-libvips-linux-arm",
    "node_modules\@img\sharp-libvips-linux-arm64", 
    "node_modules\@img\sharp-libvips-linux-x64",
    "node_modules\@img\sharp-libvips-linuxmusl-arm64",
    "node_modules\@img\sharp-libvips-linuxmusl-x64",
    "node_modules\next\node_modules\@img\sharp-darwin-arm64",
    "node_modules\next\node_modules\@img\sharp-darwin-x64",
    "node_modules\next\node_modules\@img\sharp-linux-arm",
    "node_modules\next\node_modules\@img\sharp-linux-arm64",
    "node_modules\next\node_modules\@img\sharp-linux-x64",
    "node_modules\next\node_modules\@img\sharp-linuxmusl-arm64",
    "node_modules\next\node_modules\@img\sharp-linuxmusl-x64",
    "node_modules\next\node_modules\@img\sharp-libvips-darwin-arm64",
    "node_modules\next\node_modules\@img\sharp-libvips-darwin-x64",
    "node_modules\next\node_modules\@img\sharp-libvips-linux-arm",
    "node_modules\next\node_modules\@img\sharp-libvips-linux-arm64",
    "node_modules\next\node_modules\@img\sharp-libvips-linux-x64",
    "node_modules\next\node_modules\@img\sharp-libvips-linuxmusl-arm64",
    "node_modules\next\node_modules\@img\sharp-libvips-linuxmusl-x64"
)

$removedCount = 0
foreach ($dir in $sharpsToRemove) {
    if (Test-Path $dir) {
        Write-Host "  Removing: $dir" -ForegroundColor Gray
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        $removedCount++
    }
}

Write-Host "✅ Sharp cleanup completed. Removed $removedCount directories." -ForegroundColor Green
