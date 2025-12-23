-- =====================================================
-- VERIFICAR ESTADO DE RLS EN LAS TABLAS
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor para verificar
-- si RLS está habilitado y si hay políticas creadas
-- =====================================================

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
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Contar políticas por tabla
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
