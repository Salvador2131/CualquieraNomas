-- =====================================================
-- CREAR TABLAS FALTANTES: notifications y email_templates
-- =====================================================
-- Esta migración crea las tablas que faltan según el diagnóstico
-- =====================================================

-- =====================================================
-- 1. TABLA NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destinatario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_destinatario_id ON notifications(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notifications_leida ON notifications(leida);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);

-- Asignar organización por defecto a registros existentes (si hay)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        UPDATE notifications 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
        
        -- Hacer organization_id NOT NULL después de asignar valores
        ALTER TABLE notifications 
        ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;

-- =====================================================
-- 2. TABLA EMAIL_TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB, -- Variables disponibles para el template
    is_active BOOLEAN DEFAULT TRUE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_organization_id ON email_templates(organization_id);

-- Asignar organización por defecto a registros existentes (si hay)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        UPDATE email_templates 
        SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
        WHERE organization_id IS NULL;
        
        -- Hacer organization_id NOT NULL después de asignar valores
        ALTER TABLE email_templates 
        ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;

-- Trigger para updated_at en email_templates
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
