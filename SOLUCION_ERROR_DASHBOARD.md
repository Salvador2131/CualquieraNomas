# 🔧 Solución: Error de Conexión en Dashboard

## ❌ Problema

El dashboard muestra un error de conexión. Esto puede deberse a:

1. **RLS habilitado sin políticas** - Las tablas tienen RLS activo pero no hay políticas que permitan acceso
2. **Servidor no corriendo** - La aplicación no está ejecutándose
3. **Variables de entorno incorrectas** - Aunque ya corregimos el Project ID

## ✅ Solución 1: Verificar Estado de RLS

Ejecuta este SQL en Supabase SQL Editor para verificar el estado:

```sql
-- Verificar qué tablas tienen RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar políticas existentes
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Si RLS está habilitado pero NO hay políticas:**
- Ejecuta: `supabase/migrations/20251223020000_enable_rls_basic.sql`
- Esto creará políticas permisivas para desarrollo

## ✅ Solución 2: Deshabilitar RLS Temporalmente (Solo Desarrollo)

Si prefieres trabajar sin RLS por ahora:

```sql
-- Deshabilitar RLS en todas las tablas (SOLO PARA DESARROLLO)
DO $$
DECLARE
    table_name TEXT;
    tables_to_disable_rls TEXT[] := ARRAY[
        'users', 'workers', 'employers', 'events', 'preregistrations',
        'quotes', 'worker_salaries', 'penalties', 'penalty_logs',
        'penalty_appeals', 'conflicts', 'conflict_logs', 'backups',
        'backup_logs', 'notifications', 'notification_logs',
        'email_templates', 'ratings', 'messages', 'payments',
        'worker_certificates', 'event_ratings', 'event_workers',
        'event_chats', 'subscriptions', 'incident_reports',
        'document_expiry_notifications', 'document_validations',
        'document_validation_logs', 'organizations'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_disable_rls
    LOOP
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) THEN
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'RLS deshabilitado en: %', table_name;
        END IF;
    END LOOP;
END $$;
```

## ✅ Solución 3: Iniciar el Servidor

Si el servidor no está corriendo:

```bash
npm run dev
```

Luego visita: `http://localhost:3000`

## 🔍 Verificar el Error Específico

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña Network**
3. **Recarga el dashboard**
4. **Busca la petición a `/api/dashboard`**
5. **Revisa la respuesta** - debería mostrar el mensaje de error específico

## 📋 Mensajes de Error Comunes

### "Error de conexión con Supabase"
- **Causa:** Variables de entorno incorrectas o proyecto pausado
- **Solución:** Ya corregido el Project ID, verifica que el proyecto esté activo

### "Las tablas no existen"
- **Causa:** Migraciones no ejecutadas
- **Solución:** Ya ejecutaste las migraciones, esto no debería aparecer

### "Error de base de datos: permission denied"
- **Causa:** RLS bloqueando las consultas
- **Solución:** Ejecuta la migración de RLS básico (Solución 1)

### Sin respuesta / Timeout
- **Causa:** Servidor no corriendo
- **Solución:** Ejecuta `npm run dev`

## 🎯 Próximos Pasos

1. **Verifica el estado de RLS** (Solución 1)
2. **Si RLS está habilitado sin políticas** → Ejecuta la migración de RLS básico
3. **Si prefieres sin RLS** → Ejecuta el script de deshabilitar RLS (Solución 2)
4. **Inicia el servidor** → `npm run dev`
5. **Prueba el dashboard** → `http://localhost:3000`
