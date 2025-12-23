-- =====================================================
-- SISTEMA DE SUSCRIPCIONES Y CONTROL SUPERADMIN
-- =====================================================
-- Esta migración agrega el sistema de suscripciones para trabajadores
-- y el control de acceso por superadmin

-- =====================================================
-- 1. AGREGAR CAMPOS DE SUSCRIPCIÓN A WORKERS
-- =====================================================

ALTER TABLE workers
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) DEFAULT 'free' 
  CHECK (subscription_type IN ('free', 'paid', 'trial'));

ALTER TABLE workers
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE workers
ADD COLUMN IF NOT EXISTS approved_by_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE workers
ADD COLUMN IF NOT EXISTS approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE workers
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE workers
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_workers_subscription_type ON workers(subscription_type);
CREATE INDEX IF NOT EXISTS idx_workers_approved ON workers(approved_by_admin);
CREATE INDEX IF NOT EXISTS idx_workers_subscription_end ON workers(subscription_end_date);

-- =====================================================
-- 2. AGREGAR CAMPOS DE SUSCRIPCIÓN A COMPANIES/EMPLOYERS
-- =====================================================

-- Agregar campos a la tabla employers (empresas)
ALTER TABLE employers
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial'
  CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled'));

ALTER TABLE employers
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'inicio'
  CHECK (subscription_plan IN ('inicio', 'crecimiento'));

ALTER TABLE employers
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE employers
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE employers
ADD COLUMN IF NOT EXISTS events_this_month INTEGER DEFAULT 0;

ALTER TABLE employers
ADD COLUMN IF NOT EXISTS events_limit_per_month INTEGER DEFAULT 5;

-- Índices
CREATE INDEX IF NOT EXISTS idx_employers_subscription_status ON employers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_employers_subscription_plan ON employers(subscription_plan);

-- =====================================================
-- 3. CREAR TABLA DE CERTIFICADOS DE TRABAJADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS worker_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    certificate_type VARCHAR(100) NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    certificate_file_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    ocr_data JSONB, -- Datos extraídos por OCR
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_certificates_worker_id ON worker_certificates(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_certificates_verified ON worker_certificates(verified);
CREATE INDEX IF NOT EXISTS idx_worker_certificates_organization_id ON worker_certificates(organization_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_worker_certificates_updated_at ON worker_certificates;
CREATE TRIGGER update_worker_certificates_updated_at
    BEFORE UPDATE ON worker_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. CREAR TABLA DE RATINGS (CALIFICACIONES)
-- =====================================================

CREATE TABLE IF NOT EXISTS event_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    rated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT NOT NULL CHECK (char_length(comment) >= 10),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_ratings_event_id ON event_ratings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_ratings_worker_id ON event_ratings(worker_id);
CREATE INDEX IF NOT EXISTS idx_event_ratings_organization_id ON event_ratings(organization_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_event_ratings_updated_at ON event_ratings;
CREATE TRIGGER update_event_ratings_updated_at
    BEFORE UPDATE ON event_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CREAR TABLA DE ASIGNACIONES DE EVENTOS (MEJORADA)
-- =====================================================

-- Si no existe, crear tabla event_workers con campos adicionales
CREATE TABLE IF NOT EXISTS event_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    role VARCHAR(100), -- 'mesero', 'coctelero', 'coordinador', etc.
    status VARCHAR(20) DEFAULT 'assigned' 
      CHECK (status IN ('assigned', 'accepted', 'rejected', 'completed', 'cancelled')),
    assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    payment_agreed DECIMAL(10, 2), -- Pago acordado para este evento
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, worker_id) -- Un trabajador no puede estar asignado dos veces al mismo evento
);

-- Agregar organization_id si la tabla ya existe pero no tiene la columna
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_workers') THEN
        -- Agregar columna si no existe
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'event_workers' AND column_name = 'organization_id'
        ) THEN
            ALTER TABLE event_workers 
            ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            
            -- Asignar organización por defecto a registros existentes
            UPDATE event_workers 
            SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid 
            WHERE organization_id IS NULL;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_workers_event_id ON event_workers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_workers_worker_id ON event_workers(worker_id);
CREATE INDEX IF NOT EXISTS idx_event_workers_status ON event_workers(status);

-- Crear índice de organization_id solo si la columna existe
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'event_workers' AND column_name = 'organization_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_event_workers_organization_id ON event_workers(organization_id);
    END IF;
END $$;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_event_workers_updated_at ON event_workers;
CREATE TRIGGER update_event_workers_updated_at
    BEFORE UPDATE ON event_workers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. CREAR TABLA DE CHATS POR EVENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS event_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_chats_event_id ON event_chats(event_id);
CREATE INDEX IF NOT EXISTS idx_event_chats_organization_id ON event_chats(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_chats_created_at ON event_chats(created_at);

-- =====================================================
-- 7. CREAR TABLA DE PAGOS
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('worker', 'company')),
    plan VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' 
      CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
    payment_method VARCHAR(50), -- 'card', 'transfer', 'webpay', 'free'
    payment_id VARCHAR(255), -- ID del pago en pasarela externa
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. CREAR TABLA DE REPORTES DE INCIDENCIAS
-- =====================================================

CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    reported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incident_type VARCHAR(50) NOT NULL 
      CHECK (incident_type IN ('no_show', 'late_arrival', 'poor_performance', 'other')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' 
      CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_reports_worker_id ON incident_reports(worker_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_organization_id ON incident_reports(organization_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_incident_reports_updated_at ON incident_reports;
CREATE TRIGGER update_incident_reports_updated_at
    BEFORE UPDATE ON incident_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. AGREGAR ROL SUPERADMIN A USERS
-- =====================================================

-- Agregar columna role si no existe y luego agregar constraint
DO $$
BEGIN
    -- Verificar que la tabla users existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Agregar columna role si no existe
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
            ALTER TABLE users 
            ADD COLUMN role VARCHAR(20) DEFAULT 'worker';
        END IF;
        
        -- Ahora que la columna existe (o ya existía), agregar/actualizar el constraint
        -- Primero eliminar el constraint si existe
        IF EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE table_name = 'users' 
            AND constraint_name = 'users_role_check'
        ) THEN
            ALTER TABLE users DROP CONSTRAINT users_role_check;
        END IF;
        
        -- Agregar el constraint
        ALTER TABLE users
        ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'worker', 'employer', 'superadmin'));
    END IF;
END $$;

-- =====================================================
-- 10. FUNCIÓN PARA CALCULAR RATING PROMEDIO DE TRABAJADOR
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_worker_rating(worker_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT COALESCE(AVG(score), 0)::DECIMAL(3,2)
    INTO avg_rating
    FROM event_ratings
    WHERE worker_id = worker_uuid;
    
    RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. FUNCIÓN PARA VERIFICAR SI TRABAJADOR TIENE ACCESO ACTIVO
-- =====================================================

CREATE OR REPLACE FUNCTION worker_has_active_access(worker_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    worker_record RECORD;
BEGIN
    SELECT subscription_type, subscription_end_date, approved_by_admin
    INTO worker_record
    FROM workers
    WHERE id = worker_uuid;
    
    -- Si no está aprobado, no tiene acceso
    IF NOT worker_record.approved_by_admin THEN
        RETURN FALSE;
    END IF;
    
    -- Si tiene suscripción gratuita, tiene acceso
    IF worker_record.subscription_type = 'free' THEN
        -- Verificar si la fecha de expiración no ha pasado (o es NULL = sin expiración)
        IF worker_record.subscription_end_date IS NULL OR worker_record.subscription_end_date > NOW() THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Si tiene suscripción pagada, verificar que esté activa
    IF worker_record.subscription_type = 'paid' THEN
        IF worker_record.subscription_end_date IS NULL OR worker_record.subscription_end_date > NOW() THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    -- Si tiene trial, verificar que no haya expirado
    IF worker_record.subscription_type = 'trial' THEN
        IF worker_record.subscription_end_date IS NULL OR worker_record.subscription_end_date > NOW() THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. FUNCIÓN PARA VERIFICAR LÍMITE DE EVENTOS DE EMPRESA
-- =====================================================

CREATE OR REPLACE FUNCTION company_can_create_event(company_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    company_record RECORD;
BEGIN
    SELECT subscription_status, events_this_month, events_limit_per_month
    INTO company_record
    FROM employers
    WHERE id = company_uuid;
    
    -- Si la suscripción no está activa, no puede crear eventos
    IF company_record.subscription_status != 'active' AND company_record.subscription_status != 'trial' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar límite de eventos
    IF company_record.events_this_month >= company_record.events_limit_per_month THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
