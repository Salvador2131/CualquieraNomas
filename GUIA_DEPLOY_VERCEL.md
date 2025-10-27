# 🚀 GUÍA COMPLETA: DEPLOY A VERCEL

## 📋 REQUISITOS

- ✅ Código en GitHub (o GitLab/Bitbucket)
- ✅ Cuenta de Vercel
- ✅ Credenciales de Supabase listas

---

## 📝 PASO 1: PREPARAR EL REPOSITORIO

### Opción A: Si ya tienes Git configurado

```bash
# Verificar que todo está commitado
git status

# Si hay cambios sin commitear
git add .
git commit -m "Ready for Vercel deployment"

# Push a GitHub
git push origin main
```

### Opción B: Si aún no tienes Git configurado

```bash
# Inicializar repo
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "Initial commit - Ready for Vercel"

# Crear repo en GitHub y seguir instrucciones
# Luego hacer push
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

---

## 🌐 PASO 2: CREAR CUENTA EN VERCEL

### 1. Ir a Vercel

```
https://vercel.com
```

### 2. Registrarse

- Usa tu cuenta de GitHub
- Autoriza a Vercel acceder a tus repos

---

## 📤 PASO 3: DEPLOY DESDE VERCEL

### 1. Nuevo Proyecto

- Clic en "Add New Project"
- Selecciona tu repositorio

### 2. Configurar Variables de Entorno

**IMPORTANTE:** Antes de hacer deploy, configura las variables de entorno:

#### Variables Requeridas:

```
NEXT_PUBLIC_SUPABASE_URL=https://hjtarzunzoedgpsniqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=(tu-jwt-secret)
ENCRYPTION_KEY=(tu-encryption-key)
```

#### Cómo Configurar:

1. En el dashboard de Vercel
2. Ve a Settings → Environment Variables
3. Agrega cada variable:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://hjtarzunzoedgpsniqc.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdGFyenVuem9lZGdwYnNuaXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMTM4MzYsImV4cCI6MjA3MDY4OTgzNn0.0O4VQ5Dl3Rm15cC73MPc6DZUVBsRWP8LZ4wqMHZNh04

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdGFyenVuem9lZGdwYnNuaXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTExMzgzNiwiZXhwIjoyMDcwNjg5ODM2fQ.sb_publishable_gZ0f-x1z89Xs9LR5mVpYbw_HEaRvjGz

Name: JWT_SECRET
Value: (generar uno nuevo o usar el que tienes)

Name: ENCRYPTION_KEY
Value: (generar uno nuevo o usar el que tienes)
```

**Nota:** JWT_SECRET y ENCRYPTION_KEY están en tu archivo `.env.local`

### 3. Deploy

- Clic en "Deploy"
- Vercel automáticamente:
  - Detectará Next.js
  - Instalará dependencias
  - Hará build
  - Deployará

---

## ✅ PASO 4: VERIFICAR EL DEPLOY

### 1. Esperar el Build

Verás en pantalla:

```
✓ Building
✓ Starting...
✓ Ready
```

### 2. Tu URL Estará Lista

```
https://tu-proyecto.vercel.app
```

### 3. Verificar que Funciona

- Abre la URL en el navegador
- Prueba las páginas principales
- Verifica que las APIs funcionan

---

## 🔐 PASO 5: CONFIGURAR SUPABASE PARA PRODUCCIÓN

### 1. Habilitar CORS en Supabase

Supabase → Settings → API → CORS

Agregar:

```
https://tu-proyecto.vercel.app
http://localhost:3000
```

### 2. Verificar RLS (Row Level Security)

Supabase → Authentication → Policies

Asegúrate que las políticas de seguridad están configuradas para producción.

---

## 🐛 TROUBLESHOOTING

### Error: Build Failed

**Causa:** Variables de entorno faltantes

**Solución:**

1. Ve a Settings → Environment Variables
2. Verifica que todas las variables estén configuradas
3. Re-deploy

### Error: Supabase Connection Failed

**Causa:** URL de Supabase incorrecta o CORS no configurado

**Solución:**

1. Verifica la URL en variables de entorno
2. Configura CORS en Supabase
3. Verifica que las keys sean correctas

### Error: API 401 Unauthorized

**Causa:** Keys incorrectas

**Solución:**

1. Verifica ANON_KEY y SERVICE_ROLE_KEY
2. Regenera keys en Supabase si es necesario
3. Actualiza variables de entorno
4. Re-deploy

---

## 📊 MONITOREO

### Logs en Vercel

Vercel → Tu Proyecto → Logs

Aquí verás:

- Build logs
- Runtime logs
- Errores en producción

### Analytics

Vercel Analytics (opcional):

1. Ve a Settings → Analytics
2. Habilita Vercel Analytics
3. Verás métricas de tu app

---

## 🔄 DEPLOY AUTOMÁTICO

### Configurado por Defecto

Cada vez que hagas push a `main`:

1. Vercel detecta cambios
2. Hace build automático
3. Deploya nueva versión

### Preview Deploys

Para pull requests:

- Vercel crea un deploy preview
- URL única para revisar cambios
- No afecta producción

---

## 📋 CHECKLIST FINAL

- [ ] Código en GitHub
- [ ] Cuenta de Vercel creada
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso
- [ ] URL funcionando
- [ ] Supabase CORS configurado
- [ ] Pruebas en producción

---

## 🎉 ¡LISTO!

**Tu app estará en:** `https://tu-proyecto.vercel.app`

---

## 💡 TIPS ADICIONALES

### Custom Domain

1. Settings → Domains
2. Agregar tu dominio
3. Configurar DNS según instrucciones

### Environment Variables por Environment

- Development
- Preview
- Production

Configura diferentes variables para cada uno.

### Performance

- Vercel usa Edge Network
- Imágenes optimizadas automáticamente
- CDN global incluido

---

## 🆘 AYUDA

Si tienes problemas:

1. Revisa los logs en Vercel
2. Verifica variables de entorno
3. Comprueba Supabase Connection
4. Revisa la consola del navegador

**¡Todo listo para deploy!** 🚀
