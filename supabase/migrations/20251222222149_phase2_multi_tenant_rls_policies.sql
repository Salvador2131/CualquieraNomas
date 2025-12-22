-- =====================================================
-- FASE 2: MULTI-TENANT - POLÍTICAS RLS (Row Level Security)
-- =====================================================
-- NOTA: Esta migración está COMENTADA porque las RLS están desactivadas
-- en Supabase para desarrollo rápido antes de producción.
-- 
-- El filtrado por organization_id se realiza a nivel de aplicación (APIs)
-- que es suficiente para desarrollo y testing.
-- 
-- Para activar RLS en producción, descomentar esta migración y ejecutarla.
-- =====================================================

/*
-- POLÍTICAS RLS COMENTADAS - ACTIVAR EN PRODUCCIÓN
-- Esta migración actualiza las políticas RLS para filtrar por organization_id
-- Asegurando que los usuarios solo puedan acceder a datos de su organización

-- =====================================================
-- 1. ELIMINAR POLÍTICAS ANTIGUAS (si existen)
-- =====================================================

-- Eliminar políticas antiguas de users
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Eliminar políticas antiguas de preregistrations
DROP POLICY IF EXISTS "Anyone can create preregistrations" ON preregistrations;
DROP POLICY IF EXISTS "Admins can view all preregistrations" ON preregistrations;

-- Eliminar políticas antiguas de events
DROP POLICY IF EXISTS "Admins can view all events" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update all events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- Eliminar políticas antiguas de notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

-- Eliminar políticas antiguas de penalties
DROP POLICY IF EXISTS "Admins can manage penalties" ON penalties;
DROP POLICY IF EXISTS "Workers can view own penalties" ON penalties;

-- Eliminar políticas antiguas de conflicts
DROP POLICY IF EXISTS "Admins can manage conflicts" ON conflicts;

-- Eliminar políticas antiguas de backups
DROP POLICY IF EXISTS "Admins can manage backups" ON backups;

-- Eliminar políticas antiguas de workers
DROP POLICY IF EXISTS "Admins can manage workers" ON workers;
DROP POLICY IF EXISTS "Workers can view own data" ON workers;

-- Eliminar políticas antiguas de worker_salaries
DROP POLICY IF EXISTS "Admins can manage salaries" ON worker_salaries;
DROP POLICY IF EXISTS "Workers can view own salaries" ON worker_salaries;

-- =====================================================
-- 2. CREAR FUNCIÓN HELPER PARA OBTENER organization_id DEL USUARIO
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM users
  WHERE id = user_id;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. POLÍTICAS RLS PARA USERS
-- =====================================================

-- Usuarios pueden ver sus propios datos
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Usuarios pueden ver otros usuarios de su organización
CREATE POLICY "Users can view organization users" ON users
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Admins pueden gestionar usuarios de su organización
CREATE POLICY "Admins can manage organization users" ON users
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. POLÍTICAS RLS PARA PREREGISTRATIONS
-- =====================================================

-- Cualquiera puede crear preregistros (público)
CREATE POLICY "Anyone can create preregistrations" ON preregistrations
  FOR INSERT
  WITH CHECK (true);

-- Usuarios autenticados pueden ver preregistros de su organización
CREATE POLICY "Users can view organization preregistrations" ON preregistrations
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Admins pueden gestionar preregistros de su organización
CREATE POLICY "Admins can manage organization preregistrations" ON preregistrations
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 5. POLÍTICAS RLS PARA EVENTS
-- =====================================================

-- Usuarios pueden ver eventos de su organización
CREATE POLICY "Users can view organization events" ON events
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Admins pueden gestionar eventos de su organización
CREATE POLICY "Admins can manage organization events" ON events
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 6. POLÍTICAS RLS PARA NOTIFICATIONS
-- =====================================================

-- Usuarios pueden ver sus propias notificaciones de su organización
CREATE POLICY "Users can view own organization notifications" ON notifications
  FOR SELECT
  USING (
    destinatario_id = auth.uid()
    AND organization_id = get_user_organization_id(auth.uid())
  );

-- Sistema puede crear notificaciones para usuarios de la organización
CREATE POLICY "System can create organization notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

-- =====================================================
-- 7. POLÍTICAS RLS PARA PENALTIES
-- =====================================================

-- Trabajadores pueden ver sus propias penalizaciones de su organización
CREATE POLICY "Workers can view own organization penalties" ON penalties
  FOR SELECT
  USING (
    worker_id = auth.uid()
    AND organization_id = get_user_organization_id(auth.uid())
  );

-- Admins pueden gestionar penalizaciones de su organización
CREATE POLICY "Admins can manage organization penalties" ON penalties
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 8. POLÍTICAS RLS PARA PENALTY_LOGS
-- =====================================================

-- Usuarios pueden ver logs de penalizaciones de su organización
CREATE POLICY "Users can view organization penalty logs" ON penalty_logs
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Sistema puede crear logs de penalizaciones
CREATE POLICY "System can create organization penalty logs" ON penalty_logs
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

-- =====================================================
-- 9. POLÍTICAS RLS PARA PENALTY_APPEALS
-- =====================================================

-- Trabajadores pueden ver sus propias apelaciones
CREATE POLICY "Workers can view own appeals" ON penalty_appeals
  FOR SELECT
  USING (
    worker_id = auth.uid()
    AND organization_id = get_user_organization_id(auth.uid())
  );

-- Trabajadores pueden crear apelaciones
CREATE POLICY "Workers can create appeals" ON penalty_appeals
  FOR INSERT
  WITH CHECK (
    worker_id = auth.uid()
    AND organization_id = get_user_organization_id(auth.uid())
  );

-- Admins pueden gestionar apelaciones de su organización
CREATE POLICY "Admins can manage organization appeals" ON penalty_appeals
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 10. POLÍTICAS RLS PARA CONFLICTS
-- =====================================================

-- Usuarios pueden ver conflictos de su organización
CREATE POLICY "Users can view organization conflicts" ON conflicts
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Sistema puede crear conflictos
CREATE POLICY "System can create organization conflicts" ON conflicts
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Admins pueden gestionar conflictos de su organización
CREATE POLICY "Admins can manage organization conflicts" ON conflicts
  FOR UPDATE
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 11. POLÍTICAS RLS PARA CONFLICT_LOGS
-- =====================================================

-- Usuarios pueden ver logs de conflictos de su organización
CREATE POLICY "Users can view organization conflict logs" ON conflict_logs
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Sistema puede crear logs de conflictos
CREATE POLICY "System can create organization conflict logs" ON conflict_logs
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

-- =====================================================
-- 12. POLÍTICAS RLS PARA BACKUPS
-- =====================================================

-- Admins pueden gestionar backups de su organización
CREATE POLICY "Admins can manage organization backups" ON backups
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 13. POLÍTICAS RLS PARA BACKUP_LOGS
-- =====================================================

-- Usuarios pueden ver logs de backups de su organización
CREATE POLICY "Users can view organization backup logs" ON backup_logs
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Sistema puede crear logs de backups
CREATE POLICY "System can create organization backup logs" ON backup_logs
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
  );

-- =====================================================
-- 14. POLÍTICAS RLS PARA WORKERS
-- =====================================================

-- Trabajadores pueden ver sus propios datos
CREATE POLICY "Workers can view own data" ON workers
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND organization_id = get_user_organization_id(auth.uid())
  );

-- Usuarios pueden ver trabajadores de su organización
CREATE POLICY "Users can view organization workers" ON workers
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Admins pueden gestionar trabajadores de su organización
CREATE POLICY "Admins can manage organization workers" ON workers
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 15. POLÍTICAS RLS PARA WORKER_SALARIES
-- =====================================================

-- Trabajadores pueden ver sus propios salarios
CREATE POLICY "Workers can view own salaries" ON worker_salaries
  FOR SELECT
  USING (
    worker_id IN (
      SELECT id FROM workers
      WHERE user_id = auth.uid()
      AND organization_id = get_user_organization_id(auth.uid())
    )
  );

-- Admins pueden gestionar salarios de su organización
CREATE POLICY "Admins can manage organization salaries" ON worker_salaries
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 16. POLÍTICAS RLS PARA EMAIL_TEMPLATES
-- =====================================================

-- Usuarios pueden ver plantillas de email de su organización
CREATE POLICY "Users can view organization email templates" ON email_templates
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Admins pueden gestionar plantillas de email de su organización
CREATE POLICY "Admins can manage organization email templates" ON email_templates
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- FIN DE LA MIGRACIÓN FASE 2 (COMENTADA)
-- =====================================================
*/
