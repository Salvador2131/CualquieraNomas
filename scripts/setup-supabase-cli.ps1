# Script de configuración inicial de Supabase CLI (PowerShell)
# Uso: .\scripts\setup-supabase-cli.ps1

Write-Host "Configurando Supabase CLI..." -ForegroundColor Cyan
Write-Host ""

# Verificar que Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js no esta instalado" -ForegroundColor Red
    exit 1
}

# Verificar que npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: npm no esta instalado" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install

# Verificar que Supabase CLI está instalado
Write-Host "Verificando Supabase CLI..." -ForegroundColor Yellow

# Verificar si está en node_modules (método oficial)
if (Test-Path "node_modules\.bin\supabase.cmd") {
    $supabaseVersion = npx supabase --version 2>&1
    Write-Host "Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green
} else {
    Write-Host "Supabase CLI no encontrado en node_modules" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Instalando dependencias (esto instalara Supabase CLI)..." -ForegroundColor Cyan
    npm install
    Write-Host ""
    Write-Host "Dependencias instaladas" -ForegroundColor Green
    $supabaseVersion = npx supabase --version 2>&1
    Write-Host "Supabase CLI: $supabaseVersion" -ForegroundColor Green
}

Write-Host ""

# Verificar si ya está inicializado
if (Test-Path "supabase\config.toml") {
    Write-Host "Supabase ya esta inicializado" -ForegroundColor Yellow
    Write-Host "El archivo config.toml ya existe. Continuando..." -ForegroundColor Green
} else {
    Write-Host "Inicializando Supabase..." -ForegroundColor Yellow
    npx supabase init
}

Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Obten tu Project Ref de Supabase Dashboard"
Write-Host "2. Obten tu Access Token de: https://supabase.com/dashboard/account/tokens"
Write-Host "3. Ejecuta: npx supabase link --project-ref TU_PROJECT_REF"
Write-Host ""
Write-Host "4. Para crear una migracion:"
Write-Host "   npm run supabase:migration:new nombre_descriptivo"
Write-Host ""
Write-Host "5. Configura GitHub Secrets:"
Write-Host "   - SUPABASE_ACCESS_TOKEN"
Write-Host "   - SUPABASE_PROJECT_REF"
Write-Host "   - SUPABASE_DB_PASSWORD (opcional)"
Write-Host ""
Write-Host "Configuracion completada!" -ForegroundColor Green
