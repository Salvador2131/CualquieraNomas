-- =====================================================
-- SCHEMA COMPLETO PARA ERP BANQUETES - SUPABASE
-- =====================================================
-- Este archivo contiene todas las tablas necesarias para el sistema ERP Banquetes
-- Ejecutar en orden para evitar errores de dependencias

-- =====================================================
-- 1. TABLAS BASE DEL SISTEMA
-- =====================================================

-- Tabla de usuarios (base para autenticación)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de preregistros (solicitudes de eventos)
CREATE TABLE IF NOT EXISTS preregistrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    tipo_evento TEXT NOT NULL,
    fecha_estimada DATE NOT NULL,
    numero_invitados INTEGER NOT NULL,
    presupuesto_estimado NUMERIC(10, 2),
    mensaje TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de eventos (eventos aprobados)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo_evento TEXT NOT NULL,
    fecha_evento DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    ubicacion TEXT NOT NULL,
    numero_invitados INTEGER NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_email TEXT NOT NULL,
    cliente_telefono TEXT,
    presupuesto_total NUMERIC(10, 2),
    estado TEXT DEFAULT 'planificacion' NOT NULL CHECK (estado IN ('planificacion', 'en_progreso', 'completado', 'cancelado')),
    servicios_contratados TEXT[],
    checklist JSONB DEFAULT '{}'::jsonb NOT NULL,
    trabajadores_asignados JSONB DEFAULT '[]'::jsonb NOT NULL,
    preregistro_id UUID REFERENCES preregistrations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destinatario_id UUID NOT NULL,
    destinatario_tipo TEXT NOT NULL CHECK (destinatario_tipo IN ('admin', 'worker', 'client')),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    preregistro_id UUID REFERENCES preregistrations(id) ON DELETE SET NULL,
    evento_id UUID REFERENCES events(id) ON DELETE SET NULL,
    datos_adicionales JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de plantillas de email
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    asunto TEXT NOT NULL,
    contenido_html TEXT NOT NULL,
    contenido_texto TEXT,
    variables TEXT[],
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SISTEMA DE PENALIZACIONES (FASE 1)
-- =====================================================

-- Tabla para penalizaciones por cancelaciones
CREATE TABLE IF NOT EXISTS penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    penalty_type VARCHAR(20) NOT NULL CHECK (penalty_type IN ('automatic', 'manual', 'appealed')),
    cancellation_type VARCHAR(20) NOT NULL CHECK (cancellation_type IN ('no_show', 'last_minute', 'short_notice', 'emergency', 'standard')),
    cancellation_reason TEXT,
    hours_before_event INTEGER,
    penalty_points INTEGER NOT NULL DEFAULT 0,
    penalty_duration_days INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'appealed', 'expired')),
    resolution_type VARCHAR(20) CHECK (resolution_type IN ('time_expired', 'admin_resolved', 'appeal_accepted', 'appeal_rejected')),
    admin_notes TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de penalizaciones
CREATE TABLE IF NOT EXISTS penalty_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    penalty_id UUID REFERENCES penalties(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('applied', 'resolved', 'appealed', 'expired', 'modified')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para apelaciones de penalizaciones
CREATE TABLE IF NOT EXISTS penalty_appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    penalty_id UUID REFERENCES penalties(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    appeal_reason TEXT NOT NULL,
    supporting_documents TEXT[],
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    admin_response TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. SISTEMA DE CONFLICTOS (FASE 1)
-- =====================================================

-- Tabla para conflictos de horarios
CREATE TABLE IF NOT EXISTS conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('time_overlap', 'double_booking', 'resource_conflict')),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    assignment1_id UUID,
    assignment2_id UUID,
    conflict_details JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'detected' CHECK (status IN ('detected', 'resolved', 'ignored')),
    resolution_type VARCHAR(50) CHECK (resolution_type IN ('reassign_worker', 'reschedule_event', 'cancel_assignment', 'manual_resolution')),
    resolution_details JSONB,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de conflictos
CREATE TABLE IF NOT EXISTS conflict_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conflict_id UUID REFERENCES conflicts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('detected', 'resolved', 'ignored', 'escalated')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SISTEMA DE BACKUP (FASE 1)
-- =====================================================

-- Tabla para backups del sistema
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id VARCHAR(100) UNIQUE NOT NULL,
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'selective')),
    data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'restored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_count INTEGER DEFAULT 0,
    file_size BIGINT,
    notes TEXT
);

-- Tabla para logs de backup
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'restored', 'failed', 'deleted')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. SISTEMA DE TRABAJADORES (FASE 1)
-- =====================================================

-- Tabla de trabajadores (extensión de users)
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('garzon', 'bartender', 'cocinero', 'supervisor', 'coordinador')),
    skills TEXT[],
    experience_years INTEGER DEFAULT 0,
    hourly_rate NUMERIC(10, 2) DEFAULT 0,
    availability JSONB DEFAULT '{}',
    phone TEXT,
    address TEXT,
    emergency_contact JSONB DEFAULT '{}',
    documents TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de salarios de trabajadores
CREATE TABLE IF NOT EXISTS worker_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    hours_worked NUMERIC(10, 2) DEFAULT 0,
    hourly_rate NUMERIC(10, 2) DEFAULT 0,
    base_salary NUMERIC(10, 2) DEFAULT 0,
    overtime_hours NUMERIC(10, 2) DEFAULT 0,
    overtime_rate NUMERIC(10, 2) DEFAULT 0,
    bonuses NUMERIC(10, 2) DEFAULT 0,
    deductions NUMERIC(10, 2) DEFAULT 0,
    total_salary NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Índices para preregistrations
CREATE INDEX IF NOT EXISTS idx_preregistrations_estado ON preregistrations(estado);
CREATE INDEX IF NOT EXISTS idx_preregistrations_fecha ON preregistrations(fecha_estimada);

-- Índices para events
CREATE INDEX IF NOT EXISTS idx_events_estado ON events(estado);
CREATE INDEX IF NOT EXISTS idx_events_fecha ON events(fecha_evento);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_destinatario ON notifications(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_notifications_leida ON notifications(leida);
CREATE INDEX IF NOT EXISTS idx_notifications_tipo ON notifications(tipo);

-- Índices para penalties
CREATE INDEX IF NOT EXISTS idx_penalties_worker_id ON penalties(worker_id);
CREATE INDEX IF NOT EXISTS idx_penalties_event_id ON penalties(event_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON penalties(status);
CREATE INDEX IF NOT EXISTS idx_penalties_created_at ON penalties(created_at);
CREATE INDEX IF NOT EXISTS idx_penalties_penalty_type ON penalties(penalty_type);

-- Índices para penalty_logs
CREATE INDEX IF NOT EXISTS idx_penalty_logs_penalty_id ON penalty_logs(penalty_id);
CREATE INDEX IF NOT EXISTS idx_penalty_logs_created_at ON penalty_logs(created_at);

-- Índices para penalty_appeals
CREATE INDEX IF NOT EXISTS idx_penalty_appeals_penalty_id ON penalty_appeals(penalty_id);
CREATE INDEX IF NOT EXISTS idx_penalty_appeals_worker_id ON penalty_appeals(worker_id);
CREATE INDEX IF NOT EXISTS idx_penalty_appeals_status ON penalty_appeals(status);

-- Índices para conflicts
CREATE INDEX IF NOT EXISTS idx_conflicts_worker_id ON conflicts(worker_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_event_id ON conflicts(event_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_conflicts_detected_at ON conflicts(detected_at);

-- Índices para conflict_logs
CREATE INDEX IF NOT EXISTS idx_conflict_logs_conflict_id ON conflict_logs(conflict_id);
CREATE INDEX IF NOT EXISTS idx_conflict_logs_created_at ON conflict_logs(created_at);

-- Índices para backups
CREATE INDEX IF NOT EXISTS idx_backups_backup_id ON backups(backup_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);

-- Índices para backup_logs
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_id ON backup_logs(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at);

-- Índices para workers
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_role ON workers(role);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);

-- Índices para worker_salaries
CREATE INDEX IF NOT EXISTS idx_worker_salaries_worker_id ON worker_salaries(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_salaries_month_year ON worker_salaries(month, year);
CREATE INDEX IF NOT EXISTS idx_worker_salaries_status ON worker_salaries(status);

-- =====================================================
-- 7. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preregistrations_updated_at
    BEFORE UPDATE ON preregistrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_penalties_updated_at
    BEFORE UPDATE ON penalties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_penalty_appeals_updated_at
    BEFORE UPDATE ON penalty_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conflicts_updated_at
    BEFORE UPDATE ON conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at
    BEFORE UPDATE ON workers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_salaries_updated_at
    BEFORE UPDATE ON worker_salaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE preregistrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalty_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_salaries ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para users
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (auth.role() = 'admin');

-- Políticas básicas para preregistrations
CREATE POLICY "Anyone can create preregistrations" ON preregistrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all preregistrations" ON preregistrations
    FOR SELECT USING (auth.role() = 'admin');

-- Políticas básicas para events
CREATE POLICY "Admins can view all events" ON events
    FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Admins can insert events" ON events
    FOR INSERT WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Admins can update all events" ON events
    FOR UPDATE USING (auth.role() = 'admin');

CREATE POLICY "Admins can delete events" ON events
    FOR DELETE USING (auth.role() = 'admin');

-- Políticas básicas para notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = destinatario_id);

-- Políticas básicas para penalties
CREATE POLICY "Admins can manage penalties" ON penalties
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Workers can view own penalties" ON penalties
    FOR SELECT USING (auth.uid() = worker_id);

-- Políticas básicas para conflicts
CREATE POLICY "Admins can manage conflicts" ON conflicts
    FOR ALL USING (auth.role() = 'admin');

-- Políticas básicas para backups
CREATE POLICY "Admins can manage backups" ON backups
    FOR ALL USING (auth.role() = 'admin');

-- Políticas básicas para workers
CREATE POLICY "Admins can manage workers" ON workers
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Workers can view own data" ON workers
    FOR SELECT USING (auth.uid() = user_id);

-- Políticas básicas para worker_salaries
CREATE POLICY "Admins can manage salaries" ON worker_salaries
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Workers can view own salaries" ON worker_salaries
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM workers WHERE id = worker_salaries.worker_id));

-- =====================================================
-- 9. DATOS INICIALES
-- =====================================================

-- Insertar plantillas de email
INSERT INTO email_templates (nombre, asunto, contenido_html, contenido_texto, variables) VALUES
(
    'nuevo_preregistro_admin',
    'Nueva Solicitud de Evento - {{evento_titulo}}',
    '<h2>Nueva Solicitud de Evento</h2>
    <p>Hola {{admin_nombre}},</p>
    <p>Se ha recibido una nueva solicitud de evento:</p>
    <ul>
        <li><strong>Cliente:</strong> {{cliente_nombre}}</li>
        <li><strong>Email:</strong> {{cliente_email}}</li>
        <li><strong>Teléfono:</strong> {{cliente_telefono}}</li>
        <li><strong>Evento:</strong> {{evento_titulo}}</li>
        <li><strong>Fecha:</strong> {{evento_fecha}}</li>
        <li><strong>Invitados:</strong> {{evento_invitados}}</li>
        <li><strong>Presupuesto:</strong> ${{evento_presupuesto}}</li>
    </ul>
    <p><a href="{{admin_dashboard_url}}">Revisar en el Dashboard</a></p>',
    'Nueva Solicitud de Evento\n\nHola {{admin_nombre}},\n\nSe ha recibido una nueva solicitud de evento:\n\nCliente: {{cliente_nombre}}\nEmail: {{cliente_email}}\nTeléfono: {{cliente_telefono}}\nEvento: {{evento_titulo}}\nFecha: {{evento_fecha}}\nInvitados: {{evento_invitados}}\nPresupuesto: ${{evento_presupuesto}}\n\nRevisar en: {{admin_dashboard_url}}',
    ARRAY['admin_nombre', 'evento_titulo', 'cliente_nombre', 'cliente_email', 'cliente_telefono', 'evento_fecha', 'evento_invitados', 'evento_presupuesto', 'admin_dashboard_url']
),
(
    'evento_aprobado_cliente',
    '¡Tu Evento ha sido Aprobado! - {{evento_titulo}}',
    '<h2>¡Felicitaciones {{cliente_nombre}}!</h2>
    <p>Tu evento <strong>{{evento_titulo}}</strong> ha sido aprobado.</p>
    <ul>
        <li><strong>Fecha:</strong> {{evento_fecha}}</li>
        <li><strong>Hora:</strong> {{evento_hora}}</li>
        <li><strong>Ubicación:</strong> {{evento_ubicacion}}</li>
        <li><strong>Invitados:</strong> {{evento_invitados}}</li>
    </ul>
    <p>Nos pondremos en contacto contigo pronto para coordinar los detalles.</p>
    <p><a href="{{contacto_url}}">Contactar</a></p>',
    '¡Felicitaciones {{cliente_nombre}}!\n\nTu evento {{evento_titulo}} ha sido aprobado.\n\nFecha: {{evento_fecha}}\nHora: {{evento_hora}}\nUbicación: {{evento_ubicacion}}\nInvitados: {{evento_invitados}}\n\nNos pondremos en contacto contigo pronto para coordinar los detalles.\n\nContactar: {{contacto_url}}',
    ARRAY['cliente_nombre', 'evento_titulo', 'evento_fecha', 'evento_hora', 'evento_ubicacion', 'evento_invitados', 'contacto_url']
),
(
    'nuevo_evento_worker',
    'Nuevo Evento Asignado - {{evento_titulo}}',
    '<h2>Nuevo Evento Asignado</h2>
    <p>Hola {{worker_nombre}},</p>
    <p>Se te ha asignado un nuevo evento:</p>
    <ul>
        <li><strong>Evento:</strong> {{evento_titulo}}</li>
        <li><strong>Fecha:</strong> {{evento_fecha}}</li>
        <li><strong>Hora:</strong> {{evento_hora}}</li>
        <li><strong>Ubicación:</strong> {{evento_ubicacion}}</li>
        <li><strong>Invitados:</strong> {{evento_invitados}}</li>
        <li><strong>Tu Rol:</strong> {{worker_rol}}</li>
    </ul>
    <p><a href="{{dashboard_url}}">Ver en Dashboard</a></p>',
    'Nuevo Evento Asignado\n\nHola {{worker_nombre}},\n\nSe te ha asignado un nuevo evento:\n\nEvento: {{evento_titulo}}\nFecha: {{evento_fecha}}\nHora: {{evento_hora}}\nUbicación: {{evento_ubicacion}}\nInvitados: {{evento_invitados}}\nTu Rol: {{worker_rol}}\n\nVer en Dashboard: {{dashboard_url}}',
    ARRAY['worker_nombre', 'evento_titulo', 'evento_fecha', 'evento_hora', 'evento_ubicacion', 'evento_invitados', 'worker_rol', 'dashboard_url']
);

-- =====================================================
-- 10. FUNCIONES ESPECÍFICAS DEL SISTEMA
-- =====================================================

-- Función para aplicar penalización automática
CREATE OR REPLACE FUNCTION apply_automatic_penalty(
    p_worker_id UUID,
    p_event_id UUID,
    p_cancellation_type VARCHAR(20),
    p_hours_before_event INTEGER,
    p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    penalty_id UUID;
    penalty_points INTEGER;
    penalty_duration INTEGER;
    event_record RECORD;
BEGIN
    -- Obtener información del evento
    SELECT titulo, fecha_evento, hora_inicio INTO event_record
    FROM events WHERE id = p_event_id;
    
    -- Calcular penalización basada en el tipo
    CASE p_cancellation_type
        WHEN 'no_show' THEN
            penalty_points := 50;
            penalty_duration := 30;
        WHEN 'last_minute' THEN
            penalty_points := 30;
            penalty_duration := 14;
        WHEN 'short_notice' THEN
            penalty_points := 15;
            penalty_duration := 7;
        WHEN 'emergency' THEN
            penalty_points := 5;
            penalty_duration := 3;
        ELSE
            penalty_points := 10;
            penalty_duration := 5;
    END CASE;
    
    -- Insertar penalización
    INSERT INTO penalties (
        worker_id,
        event_id,
        penalty_type,
        cancellation_type,
        cancellation_reason,
        hours_before_event,
        penalty_points,
        penalty_duration_days,
        status,
        details
    ) VALUES (
        p_worker_id,
        p_event_id,
        'automatic',
        p_cancellation_type,
        p_cancellation_reason,
        p_hours_before_event,
        penalty_points,
        penalty_duration,
        'active',
        jsonb_build_object(
            'event_title', event_record.titulo,
            'event_date', event_record.fecha_evento,
            'event_time', event_record.hora_inicio,
            'calculated_at', NOW(),
            'penalty_rules', 'Penalización automática por cancelación'
        )
    ) RETURNING id INTO penalty_id;
    
    -- Crear log
    INSERT INTO penalty_logs (penalty_id, action, details)
    VALUES (
        penalty_id,
        'applied',
        jsonb_build_object(
            'penalty_points', penalty_points,
            'duration_days', penalty_duration,
            'automatic', true
        )
    );
    
    RETURN penalty_id;
END;
$$ LANGUAGE plpgsql;

-- Función para detectar conflictos automáticamente
CREATE OR REPLACE FUNCTION detect_schedule_conflicts()
RETURNS void AS $$
DECLARE
    event_record RECORD;
    conflict_record RECORD;
    overlap_duration INTERVAL;
BEGIN
    -- Limpiar conflictos resueltos antiguos
    DELETE FROM conflicts WHERE status = 'resolved' AND resolved_at < NOW() - INTERVAL '7 days';
    
    -- Detectar solapamientos de horarios
    FOR event_record IN
        SELECT 
            e1.id as event1_id,
            e1.titulo as event1_titulo,
            e1.fecha_evento,
            e1.hora_inicio as start1,
            e1.hora_fin as end1,
            e1.trabajadores_asignados as workers1,
            e2.id as event2_id,
            e2.titulo as event2_titulo,
            e2.hora_inicio as start2,
            e2.hora_fin as end2,
            e2.trabajadores_asignados as workers2
        FROM events e1
        JOIN events e2 ON e1.id < e2.id
        WHERE e1.fecha_evento = e2.fecha_evento
        AND e1.estado IN ('planificacion', 'en_progreso')
        AND e2.estado IN ('planificacion', 'en_progreso')
        AND (
            (e1.hora_inicio < e2.hora_fin AND e2.hora_inicio < e1.hora_fin)
        )
    LOOP
        -- Verificar si hay trabajadores en común
        IF event_record.workers1 ? event_record.workers2::text THEN
            -- Calcular duración del solapamiento
            overlap_duration := LEAST(event_record.end1, event_record.end2) - 
                               GREATEST(event_record.start1, event_record.start2);
            
            -- Determinar severidad
            DECLARE
                severity_level VARCHAR(20);
            BEGIN
                IF overlap_duration >= INTERVAL '4 hours' THEN
                    severity_level := 'critical';
                ELSIF overlap_duration >= INTERVAL '2 hours' THEN
                    severity_level := 'high';
                ELSIF overlap_duration >= INTERVAL '1 hour' THEN
                    severity_level := 'medium';
                ELSE
                    severity_level := 'low';
                END IF;
                
                -- Insertar conflicto si no existe
                INSERT INTO conflicts (
                    conflict_type,
                    worker_id,
                    event_id,
                    assignment1_id,
                    assignment2_id,
                    conflict_details,
                    severity,
                    status
                ) VALUES (
                    'time_overlap',
                    NULL, -- Se determinará basado en los trabajadores en común
                    event_record.event1_id,
                    event_record.event1_id,
                    event_record.event2_id,
                    jsonb_build_object(
                        'overlap_duration', overlap_duration,
                        'event1_start', event_record.start1,
                        'event1_end', event_record.end1,
                        'event2_start', event_record.start2,
                        'event2_end', event_record.end2,
                        'event1_title', event_record.event1_titulo,
                        'event2_title', event_record.event2_titulo
                    ),
                    severity_level,
                    'detected'
                ) ON CONFLICT DO NOTHING;
                
                -- Log del conflicto detectado
                INSERT INTO conflict_logs (conflict_id, action, details)
                SELECT id, 'detected', jsonb_build_object('auto_detected', true)
                FROM conflicts 
                WHERE assignment1_id = event_record.event1_id 
                AND assignment2_id = event_record.event2_id;
            END;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para crear backup completo
CREATE OR REPLACE FUNCTION create_full_backup()
RETURNS UUID AS $$
DECLARE
    backup_id UUID;
    backup_data JSONB;
    current_time TIMESTAMP;
BEGIN
    current_time := NOW();
    
    -- Crear ID único para el backup
    backup_id := uuid_generate_v4();
    
    -- Recopilar todos los datos del sistema
    SELECT jsonb_build_object(
        'backup_info', jsonb_build_object(
            'created_at', current_time,
            'backup_type', 'full',
            'version', '1.0'
        ),
        'users', (SELECT jsonb_agg(to_jsonb(t)) FROM users t),
        'events', (SELECT jsonb_agg(to_jsonb(t)) FROM events t),
        'preregistrations', (SELECT jsonb_agg(to_jsonb(t)) FROM preregistrations t),
        'notifications', (SELECT jsonb_agg(to_jsonb(t)) FROM notifications t),
        'penalties', (SELECT jsonb_agg(to_jsonb(t)) FROM penalties t),
        'conflicts', (SELECT jsonb_agg(to_jsonb(t)) FROM conflicts t),
        'email_templates', (SELECT jsonb_agg(to_jsonb(t)) FROM email_templates t),
        'workers', (SELECT jsonb_agg(to_jsonb(t)) FROM workers t),
        'worker_salaries', (SELECT jsonb_agg(to_jsonb(t)) FROM worker_salaries t)
    ) INTO backup_data;
    
    -- Insertar backup
    INSERT INTO backups (
        backup_id,
        backup_type,
        data,
        status,
        file_size,
        notes
    ) VALUES (
        backup_id::text,
        'full',
        backup_data,
        'completed',
        pg_column_size(backup_data),
        'Backup completo del sistema'
    );
    
    -- Crear log
    INSERT INTO backup_logs (backup_id, action, details)
    VALUES (
        backup_id::text,
        'created',
        jsonb_build_object(
            'backup_type', 'full',
            'file_size', pg_column_size(backup_data),
            'created_at', current_time
        )
    );
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================
