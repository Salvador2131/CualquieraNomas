-- =====================================================
-- HABILITAR RLS BÁSICO EN TODAS LAS TABLAS PÚBLICAS
-- =====================================================
-- Esta migración habilita RLS en todas las tablas para cumplir con
-- las recomendaciones de seguridad de Supabase.
-- 
-- IMPORTANTE: Las políticas son básicas y permisivas para desarrollo.
-- Para producción, usar las políticas completas de FASE 2.
-- =====================================================

-- Lista de todas las tablas que necesitan RLS
DO $$
DECLARE
    table_name TEXT;
    tables_to_enable_rls TEXT[] := ARRAY[
        'organizations',
        'users',
        'workers',
        'employers',
        'events',
        'preregistrations',
        'quotes',
        'worker_salaries',
        'penalties',
        'penalty_logs',
        'penalty_appeals',
        'conflicts',
        'conflict_logs',
        'backups',
        'backup_logs',
        'notifications',
        'notification_logs',
        'email_templates',
        'ratings',
        'messages',
        'payments',
        'worker_certificates',
        'event_ratings',
        'event_workers',
        'event_chats',
        'subscriptions',
        'incident_reports',
        'document_expiry_notifications',
        'document_validations',
        'document_validation_logs'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_enable_rls
    LOOP
        BEGIN
            -- Verificar si la tabla existe
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND information_schema.tables.table_name = table_name
            ) THEN
                -- Habilitar RLS (si no está ya habilitado, no causa error)
                EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
                
                -- Eliminar políticas existentes de desarrollo si existen (para evitar duplicados)
                EXECUTE format('DROP POLICY IF EXISTS "dev_select_all_%s" ON %I', table_name, table_name);
                EXECUTE format('DROP POLICY IF EXISTS "dev_insert_all_%s" ON %I', table_name, table_name);
                EXECUTE format('DROP POLICY IF EXISTS "dev_update_all_%s" ON %I', table_name, table_name);
                EXECUTE format('DROP POLICY IF EXISTS "dev_delete_all_%s" ON %I', table_name, table_name);
                
                -- También eliminar política antigua de organizations si existe
                IF table_name = 'organizations' THEN
                    BEGIN
                        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations';
                    EXCEPTION WHEN OTHERS THEN
                        -- Ignorar errores al eliminar política
                        NULL;
                    END;
                END IF;
                
                -- Crear políticas básicas permisivas para desarrollo
                -- Esto permite acceso completo mientras se desarrolla
                -- En producción, reemplazar con políticas específicas de FASE 2
                
                -- Política para SELECT: Permitir todo (ajustar en producción)
                BEGIN
                    EXECUTE format(
                        'CREATE POLICY "dev_select_all_%s" ON %I FOR SELECT USING (true)',
                        table_name, table_name
                    );
                EXCEPTION WHEN duplicate_object THEN
                    -- Política ya existe, continuar
                    NULL;
                END;
                
                -- Política para INSERT: Permitir todo (ajustar en producción)
                BEGIN
                    EXECUTE format(
                        'CREATE POLICY "dev_insert_all_%s" ON %I FOR INSERT WITH CHECK (true)',
                        table_name, table_name
                    );
                EXCEPTION WHEN duplicate_object THEN
                    -- Política ya existe, continuar
                    NULL;
                END;
                
                -- Política para UPDATE: Permitir todo (ajustar en producción)
                BEGIN
                    EXECUTE format(
                        'CREATE POLICY "dev_update_all_%s" ON %I FOR UPDATE USING (true) WITH CHECK (true)',
                        table_name, table_name
                    );
                EXCEPTION WHEN duplicate_object THEN
                    -- Política ya existe, continuar
                    NULL;
                END;
                
                -- Política para DELETE: Permitir todo (ajustar en producción)
                BEGIN
                    EXECUTE format(
                        'CREATE POLICY "dev_delete_all_%s" ON %I FOR DELETE USING (true)',
                        table_name, table_name
                    );
                EXCEPTION WHEN duplicate_object THEN
                    -- Política ya existe, continuar
                    NULL;
                END;
                
                RAISE NOTICE 'RLS habilitado en tabla: %', table_name;
            ELSE
                RAISE NOTICE 'Tabla no existe, saltando: %', table_name;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Si hay algún error con esta tabla, registrar y continuar con la siguiente
            RAISE WARNING 'Error procesando tabla %: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Estas políticas son PERMISIVAS y solo para desarrollo.
-- 
-- Para producción:
-- 1. Descomentar y ejecutar: 20251222222149_phase2_multi_tenant_rls_policies.sql
-- 2. Eliminar estas políticas de desarrollo
-- 3. Las políticas de FASE 2 reemplazarán estas políticas básicas
--
-- Las políticas de desarrollo permiten:
-- - SELECT: Cualquiera puede leer
-- - INSERT: Cualquiera puede insertar
-- - UPDATE: Cualquiera puede actualizar
-- - DELETE: Cualquiera puede eliminar
--
-- ⚠️  NO USAR EN PRODUCCIÓN SIN POLÍTICAS ADECUADAS
-- =====================================================
