-- =====================================================
-- FASE 1: MULTI-TENANT - CREAR TABLA ORGANIZATIONS
-- =====================================================
-- Esta migración convierte el sistema de single-tenant a multi-tenant
-- agregando soporte para múltiples organizaciones/empresas

-- =====================================================
-- 1. CREAR TABLA ORGANIZATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_id VARCHAR(255),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);

-- Crear función update_updated_at_column si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. AGREGAR organization_id A TODAS LAS TABLAS
-- =====================================================
-- Empezamos agregando la columna como NULL para permitir datos existentes

-- Tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Tabla preregistrations
ALTER TABLE preregistrations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Tabla events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Tabla notifications (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabla email_templates (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        ALTER TABLE email_templates 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabla penalties
ALTER TABLE penalties 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Tabla penalty_logs
ALTER TABLE penalty_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Tabla penalty_appeals
ALTER TABLE penalty_appeals 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Tabla conflicts (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conflicts') THEN
        ALTER TABLE conflicts 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabla conflict_logs (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conflict_logs') THEN
        ALTER TABLE conflict_logs 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabla backups (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backups') THEN
        ALTER TABLE backups 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabla backup_logs (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_logs') THEN
        ALTER TABLE backup_logs 
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabla workers
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Tabla worker_salaries
ALTER TABLE worker_salaries 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- =====================================================
-- 3. CREAR ORGANIZACIÓN POR DEFECTO PARA DATOS EXISTENTES
-- =====================================================

-- Insertar organización por defecto
INSERT INTO organizations (id, name, slug, plan, status)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Organización Principal',
    'default',
    'premium',
    'active'
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 4. ASIGNAR DATOS EXISTENTES A LA ORGANIZACIÓN POR DEFECTO
-- =====================================================

UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE organization_id IS NULL;

UPDATE preregistrations 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE organization_id IS NULL;

UPDATE events 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE organization_id IS NULL;

-- Actualizar notifications (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        UPDATE notifications 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Actualizar email_templates (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        UPDATE email_templates 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Actualizar penalties (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'penalties') THEN
        UPDATE penalties 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Actualizar penalty_logs (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'penalty_logs') THEN
        UPDATE penalty_logs 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Actualizar penalty_appeals (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'penalty_appeals') THEN
        UPDATE penalty_appeals 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Actualizar conflicts (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conflicts') THEN
        UPDATE conflicts 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Actualizar conflict_logs (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conflict_logs') THEN
        UPDATE conflict_logs 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Actualizar backups (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backups') THEN
        UPDATE backups 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- Actualizar backup_logs (solo si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_logs') THEN
        UPDATE backup_logs 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
    END IF;
END $$;

UPDATE workers 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE organization_id IS NULL;

UPDATE worker_salaries 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE organization_id IS NULL;

-- =====================================================
-- 5. HACER organization_id NOT NULL (después de asignar datos)
-- =====================================================

ALTER TABLE users 
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE preregistrations 
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE events 
ALTER COLUMN organization_id SET NOT NULL;

-- Hacer organization_id NOT NULL solo si la tabla existe y tiene la columna
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'organization_id') THEN
        ALTER TABLE notifications ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_templates') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'organization_id') THEN
        ALTER TABLE email_templates ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'penalties') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'penalties' AND column_name = 'organization_id') THEN
        ALTER TABLE penalties ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'penalty_logs') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'penalty_logs' AND column_name = 'organization_id') THEN
        ALTER TABLE penalty_logs ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'penalty_appeals') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'penalty_appeals' AND column_name = 'organization_id') THEN
        ALTER TABLE penalty_appeals ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conflicts') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conflicts' AND column_name = 'organization_id') THEN
        ALTER TABLE conflicts ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conflict_logs') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conflict_logs' AND column_name = 'organization_id') THEN
        ALTER TABLE conflict_logs ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backups') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'backups' AND column_name = 'organization_id') THEN
        ALTER TABLE backups ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_logs') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'backup_logs' AND column_name = 'organization_id') THEN
        ALTER TABLE backup_logs ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;

ALTER TABLE workers 
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE worker_salaries 
ALTER COLUMN organization_id SET NOT NULL;

-- =====================================================
-- 6. CREAR ÍNDICES PARA organization_id
-- =====================================================

-- Índices para tablas que siempre existen
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_preregistrations_organization_id ON preregistrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_workers_organization_id ON workers(organization_id);
CREATE INDEX IF NOT EXISTS idx_worker_salaries_organization_id ON worker_salaries(organization_id);

-- Índices para tablas opcionales (solo si existen)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        CREATE INDEX IF NOT EXISTS idx_email_templates_organization_id ON email_templates(organization_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'penalties') THEN
        CREATE INDEX IF NOT EXISTS idx_penalties_organization_id ON penalties(organization_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'penalty_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_penalty_logs_organization_id ON penalty_logs(organization_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'penalty_appeals') THEN
        CREATE INDEX IF NOT EXISTS idx_penalty_appeals_organization_id ON penalty_appeals(organization_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conflicts') THEN
        CREATE INDEX IF NOT EXISTS idx_conflicts_organization_id ON conflicts(organization_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conflict_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_conflict_logs_organization_id ON conflict_logs(organization_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backups') THEN
        CREATE INDEX IF NOT EXISTS idx_backups_organization_id ON backups(organization_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_backup_logs_organization_id ON backup_logs(organization_id);
    END IF;
END $$;

-- =====================================================
-- 7. ACTUALIZAR POLÍTICAS RLS PARA MULTI-TENANT
-- =====================================================
-- Nota: Las políticas RLS se actualizarán en la FASE 2
-- Por ahora solo habilitamos RLS en organizations

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Política básica: Solo admins pueden ver todas las organizaciones
-- (Se actualizará en FASE 2 con contexto de usuario)
CREATE POLICY "Admins can view all organizations" ON organizations
    FOR SELECT USING (auth.role() = 'admin');

-- =====================================================
-- FIN DE LA MIGRACIÓN FASE 1
-- =====================================================
