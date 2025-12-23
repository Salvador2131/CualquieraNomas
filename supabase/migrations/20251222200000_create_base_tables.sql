-- =====================================================
-- MIGRACIÓN BASE: CREAR TABLAS FUNDAMENTALES
-- =====================================================
-- Esta migración crea todas las tablas base que son necesarias
-- antes de ejecutar las migraciones de multi-tenant.
-- 
-- IMPORTANTE: Esta migración es idempotente (usa IF NOT EXISTS)
-- =====================================================

-- Crear extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLA USERS (Usuarios del sistema)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'worker' CHECK (role IN ('admin', 'worker', 'employer', 'superadmin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para users (condicionales)
SELECT create_index_if_column_exists('users', 'email', 'idx_users_email');
SELECT create_index_if_column_exists('users', 'role', 'idx_users_role');
SELECT create_index_if_column_exists('users', 'status', 'idx_users_status');

-- =====================================================
-- 2. TABLA WORKERS (Trabajadores)
-- =====================================================

CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL,
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    availability_status VARCHAR(20) DEFAULT 'available' 
        CHECK (availability_status IN ('available', 'busy', 'unavailable')),
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_events INTEGER DEFAULT 0,
    loyalty_level VARCHAR(20) DEFAULT 'bronze' 
        CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum')),
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para workers (condicionales)
SELECT create_index_if_column_exists('workers', 'user_id', 'idx_workers_user_id');
SELECT create_index_if_column_exists('workers', 'specialization', 'idx_workers_specialization');
SELECT create_index_if_column_exists('workers', 'availability_status', 'idx_workers_availability');
SELECT create_index_if_column_exists('workers', 'rating', 'idx_workers_rating');

-- =====================================================
-- 3. TABLA EMPLOYERS (Empleadores/Empresas)
-- =====================================================

CREATE TABLE IF NOT EXISTS employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_type VARCHAR(100),
    website VARCHAR(255),
    total_spent DECIMAL(12,2) DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employers_user_id ON employers(user_id);
CREATE INDEX IF NOT EXISTS idx_employers_company_name ON employers(company_name);
CREATE INDEX IF NOT EXISTS idx_employers_status ON employers(status);

-- =====================================================
-- 4. TABLA EVENTS (Eventos)
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_evento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    tipo_evento VARCHAR(100) NOT NULL,
    numero_invitados INTEGER NOT NULL,
    presupuesto_total DECIMAL(12,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'confirmado', 'en_progreso', 'completado', 'cancelado')),
    employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para events (condicionales)
SELECT create_index_if_column_exists('events', 'fecha_evento', 'idx_events_fecha_evento');
SELECT create_index_if_column_exists('events', 'event_date', 'idx_events_event_date');
SELECT create_index_if_column_exists('events', 'estado', 'idx_events_estado');
SELECT create_index_if_column_exists('events', 'status', 'idx_events_status');
SELECT create_index_if_column_exists('events', 'employer_id', 'idx_events_employer_id');
SELECT create_index_if_column_exists('events', 'tipo_evento', 'idx_events_tipo_evento');
SELECT create_index_if_column_exists('events', 'event_type', 'idx_events_event_type');

-- =====================================================
-- 5. TABLA PREREGISTRATIONS (Preregistros/Leads)
-- =====================================================

CREATE TABLE IF NOT EXISTS preregistrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    tipo_evento VARCHAR(100) NOT NULL,
    fecha_estimada DATE NOT NULL,
    numero_invitados INTEGER NOT NULL,
    presupuesto_estimado DECIMAL(10,2),
    mensaje TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices de preregistrations solo si las columnas existen
DO $$
BEGIN
    -- Índice para estado (si existe la columna)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'preregistrations' AND column_name = 'estado'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_preregistrations_estado ON preregistrations(estado);
    END IF;
    
    -- Índice para status (si existe la columna en lugar de estado)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'preregistrations' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_preregistrations_status ON preregistrations(status);
    END IF;
    
    -- Índice para fecha_estimada (si existe la columna)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'preregistrations' AND column_name = 'fecha_estimada'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_preregistrations_fecha_estimada ON preregistrations(fecha_estimada);
    END IF;
    
    -- Índice para event_date (si existe la columna en lugar de fecha_estimada)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'preregistrations' AND column_name = 'event_date'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_preregistrations_event_date ON preregistrations(event_date);
    END IF;
    
    -- Índice para email (si existe la columna)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'preregistrations' AND column_name = 'email'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_preregistrations_email ON preregistrations(email);
    END IF;
END $$;

-- =====================================================
-- 6. TABLA QUOTES (Cotizaciones)
-- =====================================================

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    number_of_guests INTEGER NOT NULL,
    location VARCHAR(255),
    description TEXT,
    total DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'sent', 'accepted', 'rejected', 'expired')),
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para quotes (condicionales)
SELECT create_index_if_column_exists('quotes', 'status', 'idx_quotes_status');
SELECT create_index_if_column_exists('quotes', 'event_date', 'idx_quotes_event_date');
SELECT create_index_if_column_exists('quotes', 'expiration_date', 'idx_quotes_expiration_date');

-- =====================================================
-- 7. TABLA WORKER_SALARIES (Salarios de trabajadores)
-- =====================================================

CREATE TABLE IF NOT EXISTS worker_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    total_salary DECIMAL(12,2) NOT NULL,
    hours_worked DECIMAL(10,2) DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(worker_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_worker_salaries_worker_id ON worker_salaries(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_salaries_year_month ON worker_salaries(year, month);

-- =====================================================
-- 8. TABLA PENALTIES (Penalizaciones)
-- =====================================================

CREATE TABLE IF NOT EXISTS penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    penalty_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'applied', 'cancelled', 'appealed')),
    applied_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para penalties (condicionales)
SELECT create_index_if_column_exists('penalties', 'worker_id', 'idx_penalties_worker_id');
SELECT create_index_if_column_exists('penalties', 'status', 'idx_penalties_status');
SELECT create_index_if_column_exists('penalties', 'event_id', 'idx_penalties_event_id');

-- =====================================================
-- 9. TABLA PENALTY_LOGS (Logs de penalizaciones)
-- =====================================================

CREATE TABLE IF NOT EXISTS penalty_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    penalty_id UUID NOT NULL REFERENCES penalties(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penalty_logs_penalty_id ON penalty_logs(penalty_id);
CREATE INDEX IF NOT EXISTS idx_penalty_logs_created_at ON penalty_logs(created_at);

-- =====================================================
-- 10. TABLA PENALTY_APPEALS (Apelaciones de penalizaciones)
-- =====================================================

CREATE TABLE IF NOT EXISTS penalty_appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    penalty_id UUID NOT NULL REFERENCES penalties(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    appeal_reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para penalty_appeals (condicionales)
SELECT create_index_if_column_exists('penalty_appeals', 'penalty_id', 'idx_penalty_appeals_penalty_id');
SELECT create_index_if_column_exists('penalty_appeals', 'worker_id', 'idx_penalty_appeals_worker_id');
SELECT create_index_if_column_exists('penalty_appeals', 'status', 'idx_penalty_appeals_status');

-- =====================================================
-- 11. TABLA CONFLICTS (Conflictos de horarios)
-- =====================================================

CREATE TABLE IF NOT EXISTS conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' 
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'open' 
        CHECK (status IN ('open', 'resolved', 'ignored')),
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para conflicts (condicionales)
SELECT create_index_if_column_exists('conflicts', 'worker_id', 'idx_conflicts_worker_id');
SELECT create_index_if_column_exists('conflicts', 'event_id', 'idx_conflicts_event_id');
SELECT create_index_if_column_exists('conflicts', 'status', 'idx_conflicts_status');

-- =====================================================
-- 12. TABLA CONFLICT_LOGS (Logs de conflictos)
-- =====================================================

CREATE TABLE IF NOT EXISTS conflict_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conflict_id UUID NOT NULL REFERENCES conflicts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conflict_logs_conflict_id ON conflict_logs(conflict_id);
CREATE INDEX IF NOT EXISTS idx_conflict_logs_created_at ON conflict_logs(created_at);

-- =====================================================
-- 13. TABLA BACKUPS (Backups del sistema)
-- =====================================================

CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type VARCHAR(50) NOT NULL,
    backup_file_url TEXT,
    size_bytes BIGINT,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'completed', 'failed')),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para backups (condicionales)
SELECT create_index_if_column_exists('backups', 'status', 'idx_backups_status');
SELECT create_index_if_column_exists('backups', 'created_at', 'idx_backups_created_at');

-- =====================================================
-- 14. TABLA BACKUP_LOGS (Logs de backups)
-- =====================================================

CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID NOT NULL REFERENCES backups(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para backup_logs (condicionales)
SELECT create_index_if_column_exists('backup_logs', 'backup_id', 'idx_backup_logs_backup_id');
SELECT create_index_if_column_exists('backup_logs', 'created_at', 'idx_backup_logs_created_at');

-- =====================================================
-- 15. TABLA NOTIFICATIONS (Notificaciones)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destinatario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_destinatario_id ON notifications(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notifications_leida ON notifications(leida);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- 16. TABLA NOTIFICATION_LOGS (Logs de notificaciones)
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notification_logs (condicionales)
SELECT create_index_if_column_exists('notification_logs', 'notification_id', 'idx_notification_logs_notification_id');

-- =====================================================
-- 17. TABLA EMAIL_TEMPLATES (Plantillas de email)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB, -- Variables disponibles para el template
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para email_templates (condicionales)
SELECT create_index_if_column_exists('email_templates', 'name', 'idx_email_templates_name');
SELECT create_index_if_column_exists('email_templates', 'is_active', 'idx_email_templates_is_active');

-- =====================================================
-- 18. CREAR FUNCIÓN update_updated_at_column
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 19. CREAR TRIGGERS PARA updated_at
-- =====================================================

-- Trigger para users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para workers
DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
CREATE TRIGGER update_workers_updated_at
    BEFORE UPDATE ON workers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para employers
DROP TRIGGER IF EXISTS update_employers_updated_at ON employers;
CREATE TRIGGER update_employers_updated_at
    BEFORE UPDATE ON employers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para events
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para preregistrations
DROP TRIGGER IF EXISTS update_preregistrations_updated_at ON preregistrations;
CREATE TRIGGER update_preregistrations_updated_at
    BEFORE UPDATE ON preregistrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para quotes
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para worker_salaries
DROP TRIGGER IF EXISTS update_worker_salaries_updated_at ON worker_salaries;
CREATE TRIGGER update_worker_salaries_updated_at
    BEFORE UPDATE ON worker_salaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para penalties
DROP TRIGGER IF EXISTS update_penalties_updated_at ON penalties;
CREATE TRIGGER update_penalties_updated_at
    BEFORE UPDATE ON penalties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para penalty_appeals
DROP TRIGGER IF EXISTS update_penalty_appeals_updated_at ON penalty_appeals;
CREATE TRIGGER update_penalty_appeals_updated_at
    BEFORE UPDATE ON penalty_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para conflicts
DROP TRIGGER IF EXISTS update_conflicts_updated_at ON conflicts;
CREATE TRIGGER update_conflicts_updated_at
    BEFORE UPDATE ON conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para email_templates
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIN DE LA MIGRACIÓN BASE
-- =====================================================
-- Después de ejecutar esta migración, ejecuta en orden:
-- 1. 20251222215551_phase1_multi_tenant_organizations.sql
-- 2. 20251223000000_add_subscription_system.sql
-- 3. 20251223010000_add_rating_triggers.sql
-- 4. 20251223020000_enable_rls_basic.sql
-- =====================================================
