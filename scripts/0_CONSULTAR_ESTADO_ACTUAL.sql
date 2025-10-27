-- =====================================================
-- SCRIPT PARA CONSULTAR ESTADO ACTUAL DE SUPABASE
-- =====================================================
-- Ejecuta esto PRIMERO para ver qué tablas tienes y qué falta

-- 1. Ver todas las tablas existentes
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Contar cuántas tablas hay
SELECT 
    COUNT(*) as total_tablas
FROM pg_tables
WHERE schemaname = 'public';

-- 3. Ver extensión UUID instalada
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'uuid-ossp';

-- 4. Ver función update_updated_at_column
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'update_updated_at_column';

-- 5. Ver triggers en las tablas principales
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    tgtype
FROM pg_trigger
WHERE tgrelid::regclass::text LIKE ANY (ARRAY[
    'users',
    'workers', 
    'employers',
    'events',
    'event_workers',
    'worker_salaries',
    'calendar_events',
    'conversations',
    'messages',
    'documents',
    'notifications',
    'evaluations',
    'penalties'
])
ORDER BY table_name, trigger_name;

-- 6. Ver índices existentes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'workers', 'employers', 'events', 'event_workers',
        'worker_salaries', 'calendar_events', 'conversations', 'messages',
        'documents', 'notifications', 'evaluations', 'penalties'
    )
ORDER BY tablename, indexname;

-- 7. Ver constraints UNIQUE
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
    AND tc.table_name IN (
        'users', 'workers', 'employers', 'events', 'event_workers',
        'worker_salaries', 'worker_availability', 'messages'
    )
ORDER BY tc.table_name;

-- 8. Verificar RLS (Row Level Security)
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'workers', 'employers', 'events', 'event_workers',
        'worker_salaries', 'calendar_events', 'conversations', 'messages',
        'documents', 'notifications', 'evaluations', 'penalties'
    );

-- 9. Ver tablas clave que deberían existir
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
        THEN '✅ users existe' ELSE '❌ users NO existe' 
    END as estado_users,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workers') 
        THEN '✅ workers existe' ELSE '❌ workers NO existe' 
    END as estado_workers,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employers') 
        THEN '✅ employers existe' ELSE '❌ employers NO existe' 
    END as estado_employers,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') 
        THEN '✅ events existe' ELSE '❌ events NO existe' 
    END as estado_events,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'worker_salaries') 
        THEN '✅ worker_salaries existe' ELSE '❌ worker_salaries NO existe' 
    END as estado_worker_salaries,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') 
        THEN '✅ calendar_events existe' ELSE '❌ calendar_events NO existe' 
    END as estado_calendar_events,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') 
        THEN '✅ conversations existe' ELSE '❌ conversations NO existe' 
    END as estado_conversations,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') 
        THEN '✅ documents existe' ELSE '❌ documents NO existe' 
    END as estado_documents,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') 
        THEN '✅ notifications existe' ELSE '❌ notifications NO existe' 
    END as estado_notifications,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'preregistrations') 
        THEN '✅ preregistrations existe' ELSE '❌ preregistrations NO existe' 
    END as estado_preregistrations;

-- 10. RESUMEN: Ver estructura de tablas clave (columnas)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('users', 'workers', 'employers', 'events', 'event_workers', 'worker_salaries')
ORDER BY table_name, ordinal_position;

