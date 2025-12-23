# Script de PowerShell para configurar nuevo proyecto de Supabase
# Uso: .\scripts\configurar-supabase-nuevo.ps1

Write-Host "🔧 CONFIGURACIÓN DE NUEVO PROYECTO DE SUPABASE" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Verificar si existe .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ No se encontró .env.local" -ForegroundColor Red
    Write-Host "   Creando desde env.example..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env.local"
    Write-Host "   ✅ Archivo creado. Edítalo con tus credenciales." -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 INSTRUCCIONES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ve a https://supabase.com/dashboard" -ForegroundColor Yellow
Write-Host "2. Crea un nuevo proyecto o reactiva uno existente" -ForegroundColor Yellow
Write-Host "3. Ve a Settings > API" -ForegroundColor Yellow
Write-Host "4. Copia las siguientes credenciales:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   - Project URL → NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Blue
Write-Host "   - anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Blue
Write-Host "   - service_role key → SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Blue
Write-Host ""
Write-Host "5. Actualiza .env.local con las nuevas credenciales" -ForegroundColor Yellow
Write-Host "6. Ejecuta: node scripts/verificar-supabase-completo.js" -ForegroundColor Yellow
Write-Host ""

# Preguntar si quiere abrir el dashboard
$abrir = Read-Host "¿Quieres abrir el dashboard de Supabase en el navegador? (S/N)"
if ($abrir -eq "S" -or $abrir -eq "s" -or $abrir -eq "Y" -or $abrir -eq "y") {
    Start-Process "https://supabase.com/dashboard"
    Write-Host "✅ Dashboard abierto en el navegador" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 TIP: Después de configurar, ejecuta las migraciones en Supabase SQL Editor" -ForegroundColor Cyan
Write-Host ""
