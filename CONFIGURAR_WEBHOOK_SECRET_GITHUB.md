# 🔐 Configurar Secret para Webhook de GitHub → Vercel

## ❓ Problema

GitHub te está pidiendo un **"Secret"** al crear el webhook manualmente.

---

## ✅ Solución: Dejar el Secret Vacío (Recomendado)

**Para webhooks de Vercel, generalmente NO necesitas un secret** cuando se crean manualmente.

### Opción A: Dejar Vacío (Más Simple)

1. **En el campo "Secret" de GitHub:**

   - **Déjalo vacío** (no escribas nada)
   - Haz clic en **"Add webhook"**

2. **Esto debería funcionar** porque:

   - Vercel no requiere secret para webhooks creados manualmente
   - El deploy hook de Vercel ya tiene su propia autenticación
   - GitHub solo valida que la URL sea accesible

3. **Verificar que funciona:**
   - Después de crear el webhook, GitHub intentará enviar un "ping"
   - Deberías ver un ✅ verde que dice "We sent a ping payload to this endpoint"
   - Si ves un ❌ rojo, verifica que la URL del deploy hook sea correcta

---

## 🔐 Opción B: Generar un Secret (Si GitHub lo Requiere)

Si GitHub **requiere** que ingreses un secret (no te deja dejarlo vacío):

### Paso 1: Generar un Secret

Puedes generar un secret aleatorio. Ejecuta esto en tu terminal:

```bash
# En PowerShell (Windows)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))

# O simplemente usa un string aleatorio largo
# Ejemplo: "my-vercel-webhook-secret-2024-random-string-12345"
```

O usa un generador online: https://www.random.org/strings/

**Ejemplo de secret generado:**

```
aB3xK9mP2qR7vN4wT8yU6zA1bC5dE9fG
```

### Paso 2: Configurar el Secret en GitHub

1. **En el campo "Secret" de GitHub:**
   - Pega el secret que generaste
   - Haz clic en **"Add webhook"**

### Paso 3: Configurar el Secret en Vercel (Si es Necesario)

**⚠️ Nota:** Vercel generalmente NO requiere configurar el secret en su lado cuando usas deploy hooks. El secret es solo para que GitHub valide que las peticiones vienen de GitHub.

**Si Vercel te pide el secret:**

1. Ve a: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git
2. Busca la configuración del deploy hook
3. Si hay un campo para "Webhook Secret", pega el mismo secret que usaste en GitHub

**Pero normalmente NO necesitas hacer esto** - Vercel acepta webhooks sin secret.

---

## 🎯 Configuración Completa del Webhook

Aquí está la configuración completa paso a paso:

### 1. Ve a GitHub Webhooks

URL: https://github.com/Salvador2131/CualquieraNomas/settings/hooks

### 2. Haz clic en "Add webhook"

### 3. Configura el Webhook:

- **Payload URL:**

  ```
  https://api.vercel.com/v1/integrations/deploy/...
  ```

  (Pega la URL del deploy hook que copiaste de Vercel)

- **Content type:**

  ```
  application/json
  ```

- **Secret:**

  ```
  (Déjalo vacío O usa un secret generado)
  ```

- **Which events would you like to trigger this webhook?**

  - Selecciona: **"Just the push event"** (recomendado)
  - O: **"Let me select individual events"** y marca:
    - ✅ Push
    - ✅ Pull Request (opcional, para preview deployments)

- **Active:** ✅ (debe estar marcado)

### 4. Haz clic en "Add webhook"

### 5. Verificar que Funciona

Después de crear el webhook:

1. **GitHub intentará enviar un "ping"**

   - Deberías ver un ✅ verde: "We sent a ping payload to this endpoint"
   - Si ves un ❌ rojo, verifica:
     - Que la URL del deploy hook sea correcta
     - Que el deploy hook esté activo en Vercel

2. **Haz un push de prueba:**

   ```bash
   echo "# Test webhook con secret" >> README.md
   git add README.md
   git commit -m "test: Verificar webhook"
   git push origin main
   ```

3. **Verifica en Vercel:**

   - Deberías ver un nuevo deployment iniciándose automáticamente (dentro de 10-30 segundos)

4. **Verifica en GitHub:**
   - Ve a: Settings → Hooks → Tu webhook → Recent Deliveries
   - Deberías ver entregas con estado **200 OK**

---

## ❌ Si el Webhook Falla

### Error: "We couldn't deliver this payload"

**Posibles causas:**

1. **URL incorrecta:**

   - Verifica que la URL del deploy hook sea correcta
   - Asegúrate de copiar la URL completa desde Vercel

2. **Deploy hook no existe o está inactivo:**

   - Ve a Vercel → Settings → Git
   - Verifica que el deploy hook esté activo

3. **Problema de permisos:**
   - Verifica que Vercel tenga permisos en GitHub: https://github.com/settings/connections/applications

### Error: "Invalid secret" o "Secret mismatch"

**Solución:**

- Si usaste un secret, verifica que sea el mismo en ambos lados (si Vercel lo requiere)
- O simplemente elimina el secret y déjalo vacío

---

## ✅ Resumen

**Para la mayoría de casos:**

1. ✅ **Deja el Secret vacío** en GitHub
2. ✅ Usa la URL del deploy hook de Vercel
3. ✅ Content type: `application/json`
4. ✅ Events: "Just the push event"
5. ✅ Haz clic en "Add webhook"

**Esto debería funcionar sin problemas.**

---

**Documento creado:** `CONFIGURAR_WEBHOOK_SECRET_GITHUB.md`

**Siguiente paso:**

1. En GitHub, deja el campo "Secret" vacío
2. Completa los demás campos (Payload URL, Content type, Events)
3. Haz clic en "Add webhook"
4. Verifica que el ping sea exitoso (✅ verde)
