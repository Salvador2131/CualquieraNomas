# 📚 Explicación: Nombre vs ID del Proyecto Supabase

## 🤔 ¿Por qué no se llama "CualquieraNomas"?

En Supabase, cada proyecto tiene **DOS cosas diferentes**:

### 1. **Nombre del Proyecto** (lo que tú eliges)
- Puede ser: `CualquieraNomas`, `Mi Proyecto`, `ERP Banquetes`, etc.
- Es solo para **identificación visual** en el dashboard
- Lo ves en la lista de proyectos

### 2. **Reference ID** (ID único del proyecto)
- Es un **código único** que Supabase genera automáticamente
- Ejemplo: `hjtarzunzoedgpsniqc`
- **NO puedes cambiarlo**
- Se usa en la URL del proyecto

## 📍 ¿Dónde aparece cada uno?

### En el Dashboard de Supabase:

```
┌─────────────────────────────────────┐
│  📁 CualquieraNomas          ← NOMBRE (lo que ves) │
│  ID: hjtarzunzoedgpbsniqc     ← REFERENCE ID        │
│  URL: hjtarzunzoedgpbsniqc.supabase.co              │
└─────────────────────────────────────┘
```

### En tu archivo `.env.local`:

```env
# La URL usa el Reference ID, NO el nombre
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpsniqc.supabase.co
#                                    ^^^^^^^^^^^^^^^^^^^^
#                                    Este es el Reference ID
```

## 🔍 ¿Dónde encontrar el Reference ID?

1. **En Supabase Dashboard:**
   - Ve a tu proyecto
   - Click en **Settings** (⚙️)
   - Click en **General**
   - Busca **"Reference ID"**
   - Ahí verás: `hjtarzunzoedgpbsniqc`

2. **En la URL del proyecto:**
   - La URL siempre es: `https://[REFERENCE-ID].supabase.co`
   - Ejemplo: `https://hjtarzunzoedgpbsniqc.supabase.co`

3. **En tu código:**
   - Está en `.env.local` como parte de la URL
   - También puede estar en `supabase/.temp/project-ref`

## ❌ ¿Qué está pasando ahora?

El error `ENOTFOUND hjtarzunzoedgpsniqc.supabase.co` significa:

1. **El proyecto existe** (tienes el ID correcto)
2. **Pero está PAUSADO** (no está activo)
3. Por eso no se puede conectar

## ✅ Solución

### Paso 1: Ve al Dashboard
1. Abre: https://supabase.com/dashboard
2. Inicia sesión

### Paso 2: Busca tu proyecto
- Busca por el **nombre**: `CualquieraNomas`
- O busca por el **Reference ID**: `hjtarzunzoedgpbsniqc`

### Paso 3: Verifica el estado
- Si dice **"Paused"** o **"Inactive"** → Click en **"Resume"**
- Si dice **"Active"** → El problema es otro (verificar URL)

### Paso 4: Si no encuentras el proyecto
- Puede que haya sido eliminado
- Necesitas crear uno nuevo
- El nuevo proyecto tendrá un **Reference ID diferente**
- Tendrás que actualizar `.env.local` con el nuevo ID

## 📝 Resumen Visual

```
┌─────────────────────────────────────────────────┐
│  PROYECTO SUPABASE                              │
├─────────────────────────────────────────────────┤
│  Nombre: CualquieraNomas  ← Lo que tú ves      │
│  ID: hjtarzunzoedgpbsniqc   ← Lo que usa la URL │
│  URL: https://hjtarzunzoedgpbsniqc.supabase.co   │
│  Estado: ⚠️ PAUSADO        ← El problema       │
└─────────────────────────────────────────────────┘
```

## 🎯 Próximos Pasos

1. **Ve a Supabase Dashboard**
2. **Busca el proyecto "CualquieraNomas"**
3. **Verifica si está pausado**
4. **Si está pausado, reactívalo**
5. **Ejecuta el diagnóstico nuevamente**

¿Necesitas ayuda para reactivar el proyecto o crear uno nuevo?
