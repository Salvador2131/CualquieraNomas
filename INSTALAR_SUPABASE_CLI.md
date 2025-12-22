# 🔧 Instalar Supabase CLI en Windows

## ⚠️ Método Manual (Recomendado - Funciona Siempre)

Como los métodos automáticos no funcionaron, usaremos la descarga manual del binario.

---

## 📥 PASO 1: Descargar el Binario

1. **Abre tu navegador** y ve a:

   ```
   https://github.com/supabase/cli/releases/latest
   ```

2. **Busca la sección "Assets"** (haz clic en "Assets" para expandir)

3. **Descarga el archivo:**
   - `supabase_windows_amd64.zip` (para Windows 64-bit)
   - O `supabase_windows_arm64.zip` (si tienes Windows ARM)

---

## 📦 PASO 2: Extraer el Archivo

1. **Abre la carpeta de Descargas** (o donde descargaste el archivo)

2. **Haz clic derecho** en `supabase_windows_amd64.zip`

3. **Selecciona:** "Extraer todo..." o "Extract All..."

4. **Extrae a una carpeta fácil de recordar**, por ejemplo:

   ```
   C:\Tools\supabase\
   ```

5. **Dentro de la carpeta extraída**, encontrarás:
   - `supabase.exe`

---

## 🔧 PASO 3: Agregar al PATH (Opcional pero Recomendado)

### Opción A: Agregar al PATH del Sistema

1. **Presiona** `Win + R`

2. **Escribe:** `sysdm.cpl` y presiona Enter

3. **Click en:** "Variables de entorno" (botón abajo)

4. **En "Variables del sistema"**, busca y selecciona: `Path`

5. **Click en:** "Editar"

6. **Click en:** "Nuevo"

7. **Pega la ruta** donde está `supabase.exe`:

   ```
   C:\Tools\supabase
   ```

   (O la ruta que elegiste)

8. **Click en:** "Aceptar" en todas las ventanas

9. **Reinicia PowerShell** (cierra y abre de nuevo)

### Opción B: Usar sin PATH (Más Simple)

Si no quieres modificar el PATH, puedes usar el CLI con la ruta completa:

```powershell
C:\Tools\supabase\supabase.exe --version
```

O crear un alias en PowerShell (solo para la sesión actual):

```powershell
Set-Alias supabase "C:\Tools\supabase\supabase.exe"
```

---

## ✅ PASO 4: Verificar Instalación

**Abre PowerShell** y ejecuta:

```powershell
supabase --version
```

**O si no agregaste al PATH:**

```powershell
C:\Tools\supabase\supabase.exe --version
```

**Deberías ver algo como:**

```
supabase x.x.x
```

---

## 🎯 PASO 5: Continuar con la Configuración

Una vez instalado, continúa con los pasos en `PASOS_CONFIGURACION_SUPABASE.md`:

1. **PASO 2:** Verificar Supabase CLI
2. **PASO 3:** Ejecutar script de configuración
3. **PASO 4:** Obtener credenciales
4. **PASO 5:** Vincular proyecto
5. **PASO 6:** Configurar GitHub Secrets

---

## 🐛 Troubleshooting

### Error: "supabase no se reconoce como comando"

**Solución 1:** Verifica que agregaste la carpeta al PATH y reiniciaste PowerShell

**Solución 2:** Usa la ruta completa:

```powershell
C:\Tools\supabase\supabase.exe --version
```

**Solución 3:** Crea un alias temporal:

```powershell
Set-Alias supabase "C:\Tools\supabase\supabase.exe"
```

### Error: "No se puede ejecutar porque está bloqueado"

1. **Haz clic derecho** en `supabase.exe`
2. **Selecciona:** "Propiedades"
3. **En la pestaña "General"**, si ves "Desbloquear", haz clic ahí
4. **Click en:** "Aceptar"

### Error: "Windows protegió tu PC"

1. **Haz clic en:** "Más información"
2. **Click en:** "Ejecutar de todas formas"
3. Esto es normal para ejecutables descargados de GitHub

---

## 📚 Referencias

- **Repositorio oficial:** https://github.com/supabase/cli
- **Documentación:** https://supabase.com/docs/guides/cli
- **Releases:** https://github.com/supabase/cli/releases
