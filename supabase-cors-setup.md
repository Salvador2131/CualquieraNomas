# 🌐 CONFIGURACIÓN DE CORS EN SUPABASE PARA VERCEL

## 🎯 OBJETIVO

Configurar Supabase para permitir conexiones desde tu aplicación desplegada en Vercel.

## 📋 PASOS PASO A PASO

### 1. Ir al Dashboard de Supabase

```
https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc/settings/api
```

### 2. Buscar la sección "Additional Allowed URLs"

- Scroll hacia abajo hasta encontrar esta sección
- Debería estar cerca de la parte inferior de la página

### 3. Agregar URLs de Vercel

Click en **"+ Add URL"** y agregar:

#### URL de Producción:

```
https://cualquiera-nomas.vercel.app
```

o

```
https://cualquiera-nomas-[hash].vercel.app
```

#### URL de Desarrollo (opcional pero recomendado):

```
http://localhost:3000
```

### 4. Guardar cambios

- Click en **"Save"** después de agregar las URLs
- Los cambios se aplican inmediatamente

## 🔍 VERIFICACIÓN

### Verificar que CORS está configurado:

1. Ve a Settings → API
2. En "Additional Allowed URLs" deberías ver:
   - Tu URL de Vercel
   - http://localhost:3000 (si la agregaste)

### Probar la conexión:

```bash
# Desde tu aplicación en Vercel, deberías poder hacer:
curl https://hjtarzunzoedgpsniqc.supabase.co/rest/v1/
```

## ⚠️ PROBLEMAS COMUNES

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa**: URL de Vercel no está en la lista de URLs permitidas
**Solución**: Agregar la URL exacta de Vercel a "Additional Allowed URLs"

### Error: "Failed to connect to Supabase"

**Causa**: URL incorrecta o CORS mal configurado
**Solución**:

1. Verificar que la URL de Vercel sea correcta
2. Verificar que esté en la lista de URLs permitidas
3. Hacer redeploy en Vercel

### Error: "Invalid API key"

**Causa**: Variables de entorno incorrectas en Vercel
**Solución**: Verificar que las variables estén configuradas correctamente en Vercel

## 📝 NOTAS IMPORTANTES

### URLs que necesitas agregar:

- **Producción**: `https://tu-proyecto.vercel.app`
- **Preview**: `https://tu-proyecto-git-branch.vercel.app` (opcional)
- **Desarrollo**: `http://localhost:3000`

### Formato de URL:

- Debe incluir el protocolo (`https://` o `http://`)
- No debe terminar con `/`
- Debe ser la URL exacta de tu aplicación

### Cambios inmediatos:

- Los cambios en CORS se aplican inmediatamente
- No necesitas reiniciar nada en Supabase
- Puede tomar unos minutos en propagarse

## 🚀 DESPUÉS DE CONFIGURAR CORS

### 1. Probar la aplicación:

- Ve a tu URL de Vercel
- Intenta hacer login
- Verifica que el dashboard carga

### 2. Probar APIs:

```bash
# Probar endpoint de eventos
curl https://tu-proyecto.vercel.app/api/events

# Probar endpoint de workers
curl https://tu-proyecto.vercel.app/api/workers
```

### 3. Verificar logs:

- Ve a Vercel Dashboard → Tu Proyecto → Functions
- Revisa que no haya errores de CORS

## 📞 SOPORTE

Si sigues teniendo problemas:

1. **Verificar URL de Vercel**: Asegúrate de usar la URL correcta
2. **Verificar variables de entorno**: Que estén configuradas en Vercel
3. **Revisar logs**: Tanto en Vercel como en Supabase
4. **Hacer redeploy**: Después de cualquier cambio

## ✅ CHECKLIST FINAL

- [ ] URL de Vercel agregada a "Additional Allowed URLs"
- [ ] URL de localhost agregada (opcional)
- [ ] Cambios guardados en Supabase
- [ ] Variables de entorno configuradas en Vercel
- [ ] Redeploy hecho en Vercel
- [ ] Aplicación probada en producción
