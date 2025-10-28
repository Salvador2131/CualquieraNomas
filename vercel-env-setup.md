# 🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO EN VERCEL

## 📋 CHECKLIST DE VARIABLES REQUERIDAS

### Variables que DEBEN estar configuradas en Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpsniqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz
SUPABASE_SERVICE_ROLE_KEY=ADJYApVe1nGwmpkDs6UaDAYPrl4fbBVnudCati08FfiawMgCvdmblJZVFLMD+9f+Uw+k497GmkFjLUV58PQ+aw==
JWT_SECRET=f254a2acda5e3353023c7aab1c06d24299bfffcffe5930e5e7ec4e38768c17c8
ENCRYPTION_KEY=777dd0b344a2b5242169cafa80e7dda9
```

## 🚀 PASOS PARA CONFIGURAR EN VERCEL

### 1. Ir al Dashboard de Vercel

```
https://vercel.com/dashboard
```

### 2. Seleccionar tu proyecto

- Busca el proyecto "CualquieraNomas" o similar
- Click en el proyecto

### 3. Ir a Settings → Environment Variables

- En el menú lateral, click en "Settings"
- Click en "Environment Variables"

### 4. Agregar cada variable

Para cada variable de la lista de arriba:

1. Click en "Add New"
2. **Name**: `NEXT_PUBLIC_SUPABASE_URL`
3. **Value**: `https://hjtarzunzoedgpsniqc.supabase.co`
4. **Environment**: Seleccionar "Production", "Preview", y "Development"
5. Click "Save"

Repetir para todas las variables.

### 5. Redeploy

Después de agregar todas las variables:

- Click en "Deployments"
- Click en los tres puntos del último deployment
- Click "Redeploy"

## 🔍 VERIFICACIÓN

### Verificar que las variables están configuradas:

1. Ve a Settings → Environment Variables
2. Deberías ver todas las variables listadas
3. Cada una debe tener los 3 ambientes marcados (Production, Preview, Development)

### Verificar en el código:

Las variables estarán disponibles en:

- `process.env.NEXT_PUBLIC_SUPABASE_URL`
- `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `process.env.SUPABASE_SERVICE_ROLE_KEY`
- `process.env.JWT_SECRET`
- `process.env.ENCRYPTION_KEY`

## ⚠️ PROBLEMAS COMUNES

### Variable no encontrada

**Error**: `Missing Supabase environment variables`
**Solución**: Verificar que la variable esté configurada en Vercel

### Variable con valor incorrecto

**Error**: `Invalid Supabase URL format`
**Solución**: Verificar que la URL tenga el formato correcto

### Variables no sincronizadas

**Problema**: Cambios en variables no se reflejan
**Solución**: Hacer redeploy después de cambiar variables

## 📞 SOPORTE

Si tienes problemas:

1. Verifica que todas las variables estén en Vercel
2. Haz redeploy
3. Revisa los logs de Vercel para errores específicos
