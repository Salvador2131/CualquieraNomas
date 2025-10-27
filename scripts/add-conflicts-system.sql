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

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_conflicts_worker_id ON conflicts(worker_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_event_id ON conflicts(event_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON conflicts(severity);
CREATE INDEX IF NOT EXISTS idx_conflicts_detected_at ON conflicts(detected_at);

-- Tabla para logs de conflictos
CREATE TABLE IF NOT EXISTS conflict_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conflict_id UUID REFERENCES conflicts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('detected', 'resolved', 'ignored', 'escalated')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_conflict_logs_conflict_id ON conflict_logs(conflict_id);
CREATE INDEX IF NOT EXISTS idx_conflict_logs_created_at ON conflict_logs(created_at);

-- Función para detectar conflictos automáticamente
CREATE OR REPLACE FUNCTION detect_schedule_conflicts()
RETURNS void AS $$
DECLARE
    assignment_record RECORD;
    conflict_record RECORD;
    overlap_duration INTERVAL;
BEGIN
    -- Limpiar conflictos resueltos antiguos
    DELETE FROM conflicts WHERE status = 'resolved' AND resolved_at < NOW() - INTERVAL '7 days';
    
    -- Detectar solapamientos de horarios
    FOR assignment_record IN
        SELECT 
            ew1.id as assignment1_id,
            ew1.worker_id,
            ew1.event_id as event1_id,
            e1.fecha_evento,
            e1.hora_inicio as start1,
            e1.hora_fin as end1,
            ew2.id as assignment2_id,
            ew2.event_id as event2_id,
            e2.hora_inicio as start2,
            e2.hora_fin as end2
        FROM events e1
        JOIN events e2 ON e1.id < e2.id
        WHERE e1.trabajadores_asignados ? e2.trabajadores_asignados::text
        AND e1.fecha_evento = e2.fecha_evento
        AND (
            (e1.hora_inicio < e2.hora_fin AND e2.hora_inicio < e1.hora_fin)
        )
    LOOP
        -- Calcular duración del solapamiento
        overlap_duration := LEAST(assignment_record.end1, assignment_record.end2) - 
                           GREATEST(assignment_record.start1, assignment_record.start2);
        
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
                assignment_record.worker_id,
                assignment_record.event1_id,
                assignment_record.assignment1_id,
                assignment_record.assignment2_id,
                jsonb_build_object(
                    'overlap_duration', overlap_duration,
                    'event1_start', assignment_record.start1,
                    'event1_end', assignment_record.end1,
                    'event2_start', assignment_record.start2,
                    'event2_end', assignment_record.end2
                ),
                severity_level,
                'detected'
            ) ON CONFLICT DO NOTHING;
            
            -- Log del conflicto detectado
            INSERT INTO conflict_logs (conflict_id, action, details)
            SELECT id, 'detected', jsonb_build_object('auto_detected', true)
            FROM conflicts 
            WHERE assignment1_id = assignment_record.assignment1_id 
            AND assignment2_id = assignment_record.assignment2_id;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en conflicts
CREATE OR REPLACE FUNCTION update_conflicts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conflicts_updated_at
    BEFORE UPDATE ON conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_conflicts_updated_at();

-- Función para limpiar conflictos antiguos
CREATE OR REPLACE FUNCTION cleanup_old_conflicts()
RETURNS void AS $$
BEGIN
    DELETE FROM conflicts 
    WHERE status = 'resolved' 
    AND resolved_at < NOW() - INTERVAL '30 days';
    
    DELETE FROM conflict_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;