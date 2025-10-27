-- =====================================================
-- SISTEMA DE EVALUACIONES - FASE 2
-- =====================================================

-- Tabla para evaluaciones de trabajadores
CREATE TABLE IF NOT EXISTS worker_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    evaluation_type VARCHAR(20) NOT NULL CHECK (evaluation_type IN ('performance', 'skills', 'attitude', 'punctuality', 'teamwork')),
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comments TEXT,
    strengths TEXT[],
    areas_for_improvement TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'disputed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para evaluaciones de eventos
CREATE TABLE IF NOT EXISTS event_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    service_quality INTEGER NOT NULL CHECK (service_quality >= 1 AND service_quality <= 5),
    food_quality INTEGER NOT NULL CHECK (food_quality >= 1 AND food_quality <= 5),
    staff_performance INTEGER NOT NULL CHECK (staff_performance >= 1 AND staff_performance <= 5),
    venue_condition INTEGER NOT NULL CHECK (venue_condition >= 1 AND venue_condition <= 5),
    client_satisfaction INTEGER NOT NULL CHECK (client_satisfaction >= 1 AND client_satisfaction <= 5),
    comments TEXT,
    recommendations TEXT[],
    would_recommend BOOLEAN,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para evaluaciones de clientes
CREATE TABLE IF NOT EXISTS client_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    client_name TEXT,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    service_rating INTEGER NOT NULL CHECK (service_rating >= 1 AND service_rating <= 5),
    food_rating INTEGER NOT NULL CHECK (food_rating >= 1 AND food_rating <= 5),
    staff_rating INTEGER NOT NULL CHECK (staff_rating >= 1 AND staff_rating <= 5),
    venue_rating INTEGER NOT NULL CHECK (venue_rating >= 1 AND venue_rating <= 5),
    comments TEXT,
    suggestions TEXT,
    would_recommend BOOLEAN,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de evaluaciones
CREATE TABLE IF NOT EXISTS evaluation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL,
    evaluation_type VARCHAR(20) NOT NULL CHECK (evaluation_type IN ('worker', 'event', 'client')),
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'archived', 'disputed')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_worker_evaluations_worker_id ON worker_evaluations(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_evaluations_evaluator_id ON worker_evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_worker_evaluations_event_id ON worker_evaluations(event_id);
CREATE INDEX IF NOT EXISTS idx_worker_evaluations_evaluation_type ON worker_evaluations(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_worker_evaluations_score ON worker_evaluations(score);

CREATE INDEX IF NOT EXISTS idx_event_evaluations_event_id ON event_evaluations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_evaluations_evaluator_id ON event_evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_event_evaluations_overall_rating ON event_evaluations(overall_rating);

CREATE INDEX IF NOT EXISTS idx_client_evaluations_event_id ON client_evaluations(event_id);
CREATE INDEX IF NOT EXISTS idx_client_evaluations_client_email ON client_evaluations(client_email);
CREATE INDEX IF NOT EXISTS idx_client_evaluations_overall_rating ON client_evaluations(overall_rating);

CREATE INDEX IF NOT EXISTS idx_evaluation_logs_evaluation_id ON evaluation_logs(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_logs_created_at ON evaluation_logs(created_at);

-- Triggers para updated_at
CREATE TRIGGER update_worker_evaluations_updated_at
    BEFORE UPDATE ON worker_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_evaluations_updated_at
    BEFORE UPDATE ON event_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_evaluations_updated_at
    BEFORE UPDATE ON client_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE worker_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage worker evaluations" ON worker_evaluations
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Workers can view own evaluations" ON worker_evaluations
    FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Admins can manage event evaluations" ON event_evaluations
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage client evaluations" ON client_evaluations
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage evaluation logs" ON evaluation_logs
    FOR ALL USING (auth.role() = 'admin');

-- Función para calcular promedio de evaluaciones de trabajador
CREATE OR REPLACE FUNCTION calculate_worker_average_score(p_worker_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    avg_score NUMERIC;
BEGIN
    SELECT AVG(score)::NUMERIC(3,2)
    INTO avg_score
    FROM worker_evaluations
    WHERE worker_id = p_worker_id
    AND status = 'active';
    
    RETURN COALESCE(avg_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Función para calcular promedio de evaluaciones de evento
CREATE OR REPLACE FUNCTION calculate_event_average_score(p_event_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    avg_score NUMERIC;
BEGIN
    SELECT AVG(overall_rating)::NUMERIC(3,2)
    INTO avg_score
    FROM event_evaluations
    WHERE event_id = p_event_id
    AND status = 'active';
    
    RETURN COALESCE(avg_score, 0);
END;
$$ LANGUAGE plpgsql;
