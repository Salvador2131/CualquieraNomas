-- =====================================================
-- SISTEMA DE CALENDARIO AVANZADO - FASE 3
-- =====================================================

-- Tabla para eventos del calendario
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('event', 'meeting', 'reminder', 'holiday', 'maintenance', 'training')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    location TEXT,
    attendees JSONB DEFAULT '[]'::jsonb,
    recurring_rule JSONB,
    parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para recordatorios
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('email', 'push', 'sms', 'in_app')),
    trigger_time TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para disponibilidad de trabajadores
CREATE TABLE IF NOT EXISTS worker_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo, 6 = Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para excepciones de disponibilidad
CREATE TABLE IF NOT EXISTS availability_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para vacaciones y días libres
CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('vacation', 'sick_leave', 'personal', 'emergency', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);

CREATE INDEX IF NOT EXISTS idx_reminders_calendar_event_id ON reminders(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_trigger_time ON reminders(trigger_time);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

CREATE INDEX IF NOT EXISTS idx_worker_availability_worker_id ON worker_availability(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_availability_day_of_week ON worker_availability(day_of_week);

CREATE INDEX IF NOT EXISTS idx_availability_exceptions_worker_id ON availability_exceptions(worker_id);
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_exception_date ON availability_exceptions(exception_date);

CREATE INDEX IF NOT EXISTS idx_time_off_requests_worker_id ON time_off_requests(worker_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_start_date ON time_off_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);

-- Triggers para updated_at
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_availability_updated_at
    BEFORE UPDATE ON worker_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage all calendar events" ON calendar_events
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can view own calendar events" ON calendar_events
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all reminders" ON reminders
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage worker availability" ON worker_availability
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Workers can view own availability" ON worker_availability
    FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Admins can manage availability exceptions" ON availability_exceptions
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Workers can view own availability exceptions" ON availability_exceptions
    FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Admins can manage all time off requests" ON time_off_requests
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Workers can manage own time off requests" ON time_off_requests
    FOR ALL USING (auth.uid() = worker_id);

-- Función para verificar disponibilidad de trabajador
CREATE OR REPLACE FUNCTION check_worker_availability(
    p_worker_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
    day_of_week INTEGER;
    start_time TIME;
    end_time TIME;
    is_available BOOLEAN;
    has_exception BOOLEAN;
BEGIN
    -- Obtener día de la semana y horas
    day_of_week := EXTRACT(DOW FROM p_start_time);
    start_time := p_start_time::TIME;
    end_time := p_end_time::TIME;
    
    -- Verificar si hay excepción para esa fecha
    SELECT EXISTS(
        SELECT 1 FROM availability_exceptions
        WHERE worker_id = p_worker_id
        AND exception_date = p_start_time::DATE
        AND is_available = FALSE
    ) INTO has_exception;
    
    IF has_exception THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar disponibilidad regular
    SELECT EXISTS(
        SELECT 1 FROM worker_availability
        WHERE worker_id = p_worker_id
        AND day_of_week = day_of_week
        AND is_available = TRUE
        AND start_time <= start_time
        AND end_time >= end_time
    ) INTO is_available;
    
    RETURN is_available;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener eventos del calendario en un rango
CREATE OR REPLACE FUNCTION get_calendar_events(
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    events_data JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', title,
            'description', description,
            'start', start_date,
            'end', end_date,
            'all_day', all_day,
            'event_type', event_type,
            'priority', priority,
            'status', status,
            'location', location,
            'attendees', attendees,
            'created_by', created_by
        )
    )
    INTO events_data
    FROM calendar_events
    WHERE start_date >= p_start_date
    AND end_date <= p_end_date
    AND (p_user_id IS NULL OR created_by = p_user_id);
    
    RETURN COALESCE(events_data, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Función para crear evento recurrente
CREATE OR REPLACE FUNCTION create_recurring_event(
    p_title TEXT,
    p_description TEXT,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_recurring_rule JSONB,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
    current_date TIMESTAMP WITH TIME ZONE;
    end_recurrence TIMESTAMP WITH TIME ZONE;
    interval_days INTEGER;
BEGIN
    -- Crear evento principal
    INSERT INTO calendar_events (
        title,
        description,
        start_date,
        end_date,
        recurring_rule,
        created_by
    ) VALUES (
        p_title,
        p_description,
        p_start_date,
        p_end_date,
        p_recurring_rule,
        p_created_by
    ) RETURNING id INTO event_id;
    
    -- Procesar recurrencia
    current_date := p_start_date;
    end_recurrence := (p_recurring_rule->>'end_date')::TIMESTAMP WITH TIME ZONE;
    interval_days := (p_recurring_rule->>'interval_days')::INTEGER;
    
    WHILE current_date < end_recurrence LOOP
        current_date := current_date + (interval_days || ' days')::INTERVAL;
        
        INSERT INTO calendar_events (
            title,
            description,
            start_date,
            end_date,
            parent_event_id,
            created_by
        ) VALUES (
            p_title,
            p_description,
            current_date,
            current_date + (p_end_date - p_start_date),
            event_id,
            p_created_by
        );
    END LOOP;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;
