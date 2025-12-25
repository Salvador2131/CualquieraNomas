# 🔧 Corregir .env.local - URL de Supabase Incorrecta

## ⚠️ Problema Detectado

El archivo `.env.local` tiene la URL de Supabase incorrecta:
- ❌ **Incorrecto:** `hjtarzunzoedgpsniqc` (con "gps")
- ✅ **Correcto:** `hjtarzunzoedgpbsniqc` (con "gpb")

## ✅ Solución

### Opción 1: Corregir Manualmente

1. Abre el archivo `.env.local` en tu editor
2. Busca la línea:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpsniqc.supabase.co
   ```
3. Cámbiala a:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpbsniqc.supabase.co
   ```
4. Guarda el archivo

### Opción 2: Usar PowerShell (Ya ejecutado)

```powershell
(Get-Content .env.local) -replace 'hjtarzunzoedgpsniqc', 'hjtarzunzoedgpbsniqc' | Set-Content .env.local
```

## ✅ Verificación

Después de corregir, ejecuta:

```bash
node scripts/verificar-conexiones.js
```

**Debería mostrar:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL: Configurada`
- ✅ `Conexión Supabase: ✅ OK`

---

**Nota:** El archivo `.env.local` no está en git (está en `.gitignore`), así que solo afecta tu entorno local.
