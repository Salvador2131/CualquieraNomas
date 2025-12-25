# 📋 Valores de Variables de Entorno para Vercel

## ✅ Valores Verificados desde `env.local.example`

### 🔓 Variables Públicas (NEXT_PUBLIC_*)
**Marcar en:** ✅ Production, ✅ Preview, ✅ Development

#### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://hjtarzunzoedgpbsniqc.supabase.co
```

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz
```

---

### 🔒 Variables Privadas
**Marcar SOLO en:** ✅ Production

#### 3. SUPABASE_SERVICE_ROLE_KEY
```
ADJYApVe1nGwmpkDs6UaDAYPrl4fbBVnudCati08FfiawMgCvdmblJZVFLMD+9f+Uw+k497GmkFjLUV58PQ+aw==
```

#### 4. JWT_SECRET
```
f254a2acda5e3353023c7aab1c06d24299bfffcffe5930e5e7ec4e38768c17c8
```

#### 5. ENCRYPTION_KEY
```
777dd0b344a2b5242169cafa80e7dda9
```

---

## 📝 Cómo Configurar en Vercel

### Paso 1: Ve a Environment Variables
1. Vercel Dashboard → Tu proyecto → **Settings** → **Environment Variables**

### Paso 2: Agregar Variables Públicas
Para cada variable pública (`NEXT_PUBLIC_*`):

1. Click en **"Add New"**
2. **Key:** `NEXT_PUBLIC_SUPABASE_URL`
3. **Value:** `https://hjtarzunzoedgpbsniqc.supabase.co`
4. **Marcar:** ✅ Production, ✅ Preview, ✅ Development
5. Click en **"Save"**

Repetir para:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz`

### Paso 3: Agregar Variables Privadas
Para cada variable privada:

1. Click en **"Add New"**
2. **Key:** `SUPABASE_SERVICE_ROLE_KEY`
3. **Value:** `ADJYApVe1nGwmpkDs6UaDAYPrl4fbBVnudCati08FfiawMgCvdmblJZVFLMD+9f+Uw+k497GmkFjLUV58PQ+aw==`
4. **Marcar SOLO:** ✅ Production (NO Preview, NO Development)
5. Click en **"Save"**

Repetir para:
- `JWT_SECRET` = `f254a2acda5e3353023c7aab1c06d24299bfffcffe5930e5e7ec4e38768c17c8`
- `ENCRYPTION_KEY` = `777dd0b344a2b5242169cafa80e7dda9`

---

## ⚠️ Nota sobre vercel.json

El archivo `vercel.json` tiene referencias a Vercel Secrets usando `@`:
```json
"env": {
  "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
  ...
}
```

**Tienes dos opciones:**

### Opción A: Usar Environment Variables (Recomendado)
- **NO uses** las referencias `@` en `vercel.json`
- Configura las variables directamente en Vercel Dashboard
- Esto es más simple y directo

### Opción B: Usar Vercel Secrets
- Crea los Secrets primero en Vercel Dashboard
- Luego las referencias `@` funcionarán
- Más complejo pero más organizado para equipos

**Recomendación:** Usa la Opción A (Environment Variables directas) para empezar de cero.

---

## ✅ Checklist de Configuración

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada (Production, Preview, Development)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada (Production, Preview, Development)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (SOLO Production)
- [ ] `JWT_SECRET` configurada (SOLO Production)
- [ ] `ENCRYPTION_KEY` configurada (SOLO Production)
- [ ] Todas las variables tienen los valores correctos
- [ ] Variables públicas están disponibles en todos los entornos
- [ ] Variables privadas están SOLO en Production

---

## 🔍 Verificación

Después de configurar, puedes verificar que funcionan:

1. Haz un deployment
2. En los Build Logs, verifica que no hay errores de variables faltantes
3. Visita tu app en Vercel
4. Debería conectarse correctamente a Supabase

---

**⚠️ IMPORTANTE:** 
- Estos valores vienen de `env.local.example`
- Si los rotaste después de la vulnerabilidad, usa los valores nuevos
- Verifica en Supabase Dashboard que el `service_role` key sea el correcto
