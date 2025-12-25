# 🔧 Crear Deploy Hook Manualmente en Vercel

## ✅ Estado Actual

- ✅ Repositorio conectado: `Salvador2131/CualquieraNomas`
- ✅ Vercel te da la opción de crear un deploy hook manualmente
- ❌ El deploy hook no se creó automáticamente

---

## 🎯 Solución: Crear Deploy Hook Manualmente

Vercel te está dando la opción de crear el deploy hook manualmente. Esto es perfecto y funcionará igual de bien.

---

## 📋 Pasos Detallados

### PASO 1: Ir a la Configuración de Git

1. Ve a: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git

2. **Busca la sección "Deploy Hooks"**
   - Debería estar debajo de "Connected Repository"
   - O busca un botón que diga **"Create Deploy Hook"** o **"Add Deploy Hook"**

### PASO 2: Crear el Deploy Hook

1. **Haz clic en el botón para crear el deploy hook**
   - Puede decir: **"Create Deploy Hook"**, **"Add Deploy Hook"**, **"New Deploy Hook"**, o similar
   - O puede haber un campo donde puedas crear uno

2. **Configurar el Deploy Hook:**
   - **Name:** Puedes dejarlo como "Production Deploy Hook" o ponerle un nombre descriptivo
   - **Branch:** Selecciona `main` (o la branch de producción)
   - **Environment:** Selecciona `Production` (si te lo pide)

3. **Haz clic en "Create"** o **"Save"**

### PASO 3: Copiar la URL del Deploy Hook

Después de crear el deploy hook, Vercel te mostrará una URL que se ve así:

```
https://api.vercel.com/v1/integrations/deploy/...
```

**Esta URL es importante** - la necesitarás para configurar el webhook en GitHub.

---

## 🔗 PASO 4: Configurar Webhook en GitHub

Ahora necesitas crear el webhook en GitHub que apunte a la URL del deploy hook de Vercel.

### Opción A: Vercel lo Crea Automáticamente (Ideal)

A veces, después de crear el deploy hook en Vercel, Vercel automáticamente crea el webhook en GitHub. **Espera 1-2 minutos** y luego:

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/settings/hooks
2. **¿Ves un webhook de Vercel?**
   - Si SÍ → ✅ **¡Listo!** No necesitas hacer nada más
   - Si NO → Continúa con la Opción B

### Opción B: Crear Webhook Manualmente en GitHub

Si Vercel no creó el webhook automáticamente, créalo manualmente:

1. **Ve a la configuración de Webhooks en GitHub:**
   - URL: https://github.com/Salvador2131/CualquieraNomas/settings/hooks

2. **Haz clic en "Add webhook"**

3. **Configurar el Webhook:**
   - **Payload URL:** Pega la URL del deploy hook que copiaste de Vercel
     ```
     https://api.vercel.com/v1/integrations/deploy/...
     ```
   - **Content type:** Selecciona `application/json`
   - **Secret:** Deja vacío (o si Vercel te dio un secret, úsalo)
   - **Which events would you like to trigger this webhook?**
     - Selecciona: **"Just the push event"** (recomendado)
     - O: **"Let me select individual events"** y marca:
       - ✅ Push
       - ✅ Pull Request (opcional, para preview deployments)

4. **Haz clic en "Add webhook"**

5. **Verificar que funciona:**
   - GitHub intentará enviar un "ping" al webhook
   - Deberías ver un ✅ verde que dice "We sent a ping payload to this endpoint"
   - Si ves un ❌ rojo, verifica que la URL sea correcta

---

## ✅ Verificación Final

### Test 1: Verificar en Vercel

1. Ve a: https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git

2. **Deberías ver:**
   ```
   Deploy Hooks
   Production Deploy Hook:
   https://api.vercel.com/v1/integrations/deploy/...
   [Copy] [Delete]
   ```

### Test 2: Verificar en GitHub

1. Ve a: https://github.com/Salvador2131/CualquieraNomas/settings/hooks

2. **Deberías ver:**
   - Un webhook de Vercel (o el webhook que creaste)
   - Estado: ✅ Active
   - Última entrega: ✅ 200 OK (si hiciste el ping)

### Test 3: Deployment Automático

1. **Haz un pequeño cambio:**
   ```bash
   echo "# Test deploy hook manual" >> README.md
   git add README.md
   git commit -m "test: Verificar deploy hook manual"
   git push origin main
   ```

2. **Deberías ver:**
   - En Vercel Dashboard (dentro de 10-30 segundos): Un nuevo deployment se inicia automáticamente
   - En GitHub → Settings → Hooks → Recent Deliveries: Una entrega con estado **200 OK**

---

## 🎯 Resultado Esperado

Después de crear el deploy hook:

1. ✅ Deploy Hook creado en Vercel
2. ✅ Webhook configurado en GitHub (automático o manual)
3. ✅ Deployments automáticos funcionando
4. ✅ Cada push a `main` crea un deployment en Vercel

---

## ❌ Si Algo Sale Mal

### Problema: "No puedo encontrar la opción de crear deploy hook"

**Solución:**
- Asegúrate de estar en: `/settings/git`
- Busca en la sección "Deploy Hooks" o "Webhooks"
- Si no aparece, puede que necesites permisos de administrador

### Problema: "El webhook en GitHub da error 404 o 401"

**Solución:**
- Verifica que la URL del deploy hook sea correcta
- Asegúrate de copiar la URL completa desde Vercel
- Verifica que el deploy hook esté activo en Vercel

### Problema: "El deployment no se inicia automáticamente"

**Solución:**
- Verifica que el webhook esté activo en GitHub
- Revisa "Recent Deliveries" en GitHub para ver si hay errores
- Verifica que estés haciendo push a la branch correcta (`main`)
- Verifica que el deploy hook esté configurado para la branch `main`

---

## 📝 Notas Importantes

- **El deploy hook manual funciona igual** que uno automático
- **Puedes crear múltiples deploy hooks** para diferentes branches o entornos
- **El webhook en GitHub es necesario** para que los deployments sean automáticos
- **Si el webhook falla**, verifica los logs en GitHub → Settings → Hooks → Recent Deliveries

---

**Documento creado:** `CREAR_DEPLOY_HOOK_MANUAL.md`

**Siguiente paso:**
1. Ve a https://vercel.com/salvador-berniers-projects/cualquiera-nomas/settings/git
2. Busca la opción de crear deploy hook
3. Créalo y copia la URL
4. Configura el webhook en GitHub con esa URL
