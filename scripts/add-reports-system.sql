-- =====================================================
-- SISTEMA DE REPORTES Y ANALYTICS - FASE 2
-- =====================================================

-- Tabla para reportes generados
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('events', 'workers', 'financial', 'performance', 'client_satisfaction', 'custom')),
    title TEXT NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    data JSONB NOT NULL,
    format VARCHAR(20) DEFAULT 'json' CHECK (format IN ('json', 'csv', 'pdf', 'excel')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_path TEXT,
    file_size BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para métricas del dashboard
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(20) NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'summary')),
    value NUMERIC NOT NULL,
    labels JSONB DEFAULT '{}'::jsonb,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para KPIs del sistema
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_name VARCHAR(100) NOT NULL,
    kpi_category VARCHAR(50) NOT NULL CHECK (kpi_category IN ('financial', 'operational', 'quality', 'client', 'worker')),
    current_value NUMERIC NOT NULL,
    target_value NUMERIC,
    unit VARCHAR(20),
    trend VARCHAR(20) CHECK (trend IN ('up', 'down', 'stable')),
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    calculation_method TEXT,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de reportes
CREATE TABLE IF NOT EXISTS report_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('generated', 'downloaded', 'shared', 'deleted', 'failed')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_metric_name ON dashboard_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_metric_type ON dashboard_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_period_start ON dashboard_metrics(period_start);

CREATE INDEX IF NOT EXISTS idx_kpis_kpi_name ON kpis(kpi_name);
CREATE INDEX IF NOT EXISTS idx_kpis_kpi_category ON kpis(kpi_category);
CREATE INDEX IF NOT EXISTS idx_kpis_period ON kpis(period);

CREATE INDEX IF NOT EXISTS idx_report_logs_report_id ON report_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_logs_created_at ON report_logs(created_at);

-- Triggers para updated_at
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at
    BEFORE UPDATE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage reports" ON reports
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage dashboard metrics" ON dashboard_metrics
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage KPIs" ON kpis
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage report logs" ON report_logs
    FOR ALL USING (auth.role() = 'admin');

-- Función para generar reporte de eventos
CREATE OR REPLACE FUNCTION generate_events_report(
    p_start_date DATE,
    p_end_date DATE,
    p_event_status TEXT DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    report_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'summary', jsonb_build_object(
            'total_events', COUNT(*),
            'total_revenue', COALESCE(SUM(presupuesto_total), 0),
            'average_guests', COALESCE(AVG(numero_invitados), 0),
            'period', jsonb_build_object(
                'start_date', p_start_date,
                'end_date', p_end_date
            )
        ),
        'events', jsonb_agg(
            jsonb_build_object(
                'id', id,
                'titulo', titulo,
                'tipo_evento', tipo_evento,
                'fecha_evento', fecha_evento,
                'estado', estado,
                'numero_invitados', numero_invitados,
                'presupuesto_total', presupuesto_total,
                'cliente_nombre', cliente_nombre,
                'created_at', created_at
            )
        )
    )
    INTO report_data
    FROM events
    WHERE fecha_evento BETWEEN p_start_date AND p_end_date
    AND (p_event_status IS NULL OR estado = p_event_status)
    AND (p_event_type IS NULL OR tipo_evento = p_event_type);
    
    RETURN report_data;
END;
$$ LANGUAGE plpgsql;

-- Función para generar reporte de trabajadores
CREATE OR REPLACE FUNCTION generate_workers_report(
    p_start_date DATE,
    p_end_date DATE,
    p_worker_role TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    report_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'summary', jsonb_build_object(
            'total_workers', COUNT(*),
            'active_workers', COUNT(*) FILTER (WHERE status = 'active'),
            'average_experience', COALESCE(AVG(experience_years), 0),
            'average_hourly_rate', COALESCE(AVG(hourly_rate), 0)
        ),
        'workers', jsonb_agg(
            jsonb_build_object(
                'id', w.id,
                'name', u.name,
                'email', u.email,
                'role', w.role,
                'experience_years', w.experience_years,
                'hourly_rate', w.hourly_rate,
                'status', w.status,
                'skills', w.skills,
                'created_at', w.created_at
            )
        )
    )
    INTO report_data
    FROM workers w
    JOIN users u ON w.user_id = u.id
    WHERE w.created_at::DATE BETWEEN p_start_date AND p_end_date
    AND (p_worker_role IS NULL OR w.role = p_worker_role);
    
    RETURN report_data;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular KPIs automáticamente
CREATE OR REPLACE FUNCTION calculate_kpis()
RETURNS void AS $$
DECLARE
    kpi_record RECORD;
    current_value NUMERIC;
BEGIN
    -- KPI: Total de eventos del mes
    SELECT COUNT(*) INTO current_value
    FROM events
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
    
    INSERT INTO kpis (kpi_name, kpi_category, current_value, target_value, unit, period, calculation_method)
    VALUES ('eventos_mes', 'operational', current_value, 50, 'eventos', 'monthly', 'COUNT de eventos creados en el mes actual')
    ON CONFLICT (kpi_name, period) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        last_calculated = NOW();
    
    -- KPI: Ingresos del mes
    SELECT COALESCE(SUM(presupuesto_total), 0) INTO current_value
    FROM events
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
    
    INSERT INTO kpis (kpi_name, kpi_category, current_value, target_value, unit, period, calculation_method)
    VALUES ('ingresos_mes', 'financial', current_value, 100000, 'pesos', 'monthly', 'SUM de presupuesto_total de eventos del mes actual')
    ON CONFLICT (kpi_name, period) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        last_calculated = NOW();
    
    -- KPI: Satisfacción promedio de clientes
    SELECT COALESCE(AVG(overall_rating), 0) INTO current_value
    FROM client_evaluations
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
    
    INSERT INTO kpis (kpi_name, kpi_category, current_value, target_value, unit, period, calculation_method)
    VALUES ('satisfaccion_clientes', 'quality', current_value, 4.5, 'puntos', 'monthly', 'AVG de overall_rating de evaluaciones de clientes del mes')
    ON CONFLICT (kpi_name, period) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        last_calculated = NOW();
    
    -- KPI: Trabajadores activos
    SELECT COUNT(*) INTO current_value
    FROM workers
    WHERE status = 'active';
    
    INSERT INTO kpis (kpi_name, kpi_category, current_value, target_value, unit, period, 'monthly', 'COUNT de trabajadores con status active')
    VALUES ('trabajadores_activos', 'operational', current_value, 20, 'trabajadores', 'monthly', 'COUNT de trabajadores con status active')
    ON CONFLICT (kpi_name, period) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;
