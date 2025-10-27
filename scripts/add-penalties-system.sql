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

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_penalties_worker_id ON penalties(worker_id);
CREATE INDEX IF NOT EXISTS idx_penalties_event_id ON penalties(event_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON penalties(status);
CREATE INDEX IF NOT EXISTS idx_penalties_created_at ON penalties(created_at);
CREATE INDEX IF NOT EXISTS idx_penalties_penalty_type ON penalties(penalty_type);

-- Tabla para logs de penalizaciones
CREATE TABLE IF NOT EXISTS penalty_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    penalty_id UUID REFERENCES penalties(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('applied', 'resolved', 'appealed', 'expired', 'modified')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_penalty_logs_penalty_id ON penalty_logs(penalty_id);
CREATE INDEX IF NOT EXISTS idx_penalty_logs_created_at ON penalty_logs(created_at);

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

-- Índices para apelaciones
CREATE INDEX IF NOT EXISTS idx_penalty_appeals_penalty_id ON penalty_appeals(penalty_id);
CREATE INDEX IF NOT EXISTS idx_penalty_appeals_worker_id ON penalty_appeals(worker_id);
CREATE INDEX IF NOT EXISTS idx_penalty_appeals_status ON penalty_appeals(status);

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

-- Función para expirar penalizaciones automáticamente
CREATE OR REPLACE FUNCTION expire_old_penalties()
RETURNS void AS $$
BEGIN
    -- Marcar penalizaciones como expiradas
    UPDATE penalties 
    SET 
        status = 'expired',
        resolution_type = 'time_expired',
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE status = 'active' 
    AND created_at < NOW() - INTERVAL '1 day' * penalty_duration_days;
    
    -- Crear logs para penalizaciones expiradas
    INSERT INTO penalty_logs (penalty_id, action, details)
    SELECT 
        id,
        'expired',
        jsonb_build_object('expired_at', NOW())
    FROM penalties 
    WHERE status = 'expired' 
    AND resolved_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en penalties
CREATE OR REPLACE FUNCTION update_penalties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_penalties_updated_at
    BEFORE UPDATE ON penalties
    FOR EACH ROW
    EXECUTE FUNCTION update_penalties_updated_at();

-- Trigger para actualizar updated_at en penalty_appeals
CREATE TRIGGER update_penalty_appeals_updated_at
    BEFORE UPDATE ON penalty_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_penalties_updated_at();

-- Función para limpiar penalizaciones antiguas
CREATE OR REPLACE FUNCTION cleanup_old_penalties()
RETURNS void AS $$
BEGIN
    -- Eliminar logs de penalizaciones resueltas hace más de 1 año
    DELETE FROM penalty_logs 
    WHERE penalty_id IN (
        SELECT id FROM penalties 
        WHERE status IN ('resolved', 'expired') 
        AND resolved_at < NOW() - INTERVAL '1 year'
    );
    
    -- Eliminar apelaciones de penalizaciones resueltas hace más de 1 año
    DELETE FROM penalty_appeals 
    WHERE penalty_id IN (
        SELECT id FROM penalties 
        WHERE status IN ('resolved', 'expired') 
        AND resolved_at < NOW() - INTERVAL '1 year'
    );
    
    -- Eliminar penalizaciones resueltas hace más de 1 año
    DELETE FROM penalties 
    WHERE status IN ('resolved', 'expired') 
    AND resolved_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;