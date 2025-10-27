-- =====================================================
-- FASE 2: SISTEMAS IMPORTANTES - SCHEMA SQL
-- =====================================================
-- Este archivo contiene las tablas y funciones de la Fase 2
-- Ejecutar después de la Fase 1 para evitar errores de dependencias

-- =====================================================
-- 1. SISTEMA DE EVALUACIONES
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

-- =====================================================
-- 2. SISTEMA DE REPORTES Y ANALYTICS
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

-- =====================================================
-- 3. SISTEMA DE CONFIGURACIÓN AVANZADA
-- =====================================================

-- Tabla para configuraciones del sistema
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) NOT NULL CHECK (config_type IN ('string', 'number', 'boolean', 'json', 'array')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('general', 'email', 'notifications', 'penalties', 'conflicts', 'backup', 'reports', 'evaluations')),
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    validation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para configuraciones de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT NOT NULL,
    preference_type VARCHAR(20) NOT NULL CHECK (preference_type IN ('string', 'number', 'boolean', 'json', 'array')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- Tabla para plantillas de configuración
CREATE TABLE IF NOT EXISTS configuration_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL,
    template_category VARCHAR(50) NOT NULL,
    template_data JSONB NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de configuración
CREATE TABLE IF NOT EXISTS configuration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID REFERENCES system_configurations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'restored')),
    old_value TEXT,
    new_value TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SISTEMA DE LOGS DE AUDITORÍA
-- =====================================================

-- Tabla para logs de auditoría del sistema
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    details JSONB,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de seguridad
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('login', 'logout', 'failed_login', 'password_change', 'permission_denied', 'suspicious_activity', 'data_export', 'data_import')),
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id VARCHAR(100),
    details JSONB,
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'detected' CHECK (status IN ('detected', 'investigated', 'resolved', 'false_positive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de actividad de usuarios
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('page_view', 'api_call', 'data_creation', 'data_update', 'data_deletion', 'export', 'import', 'login', 'logout')),
    resource_type VARCHAR(50),
    resource_id UUID,
    endpoint VARCHAR(200),
    method VARCHAR(10),
    status_code INTEGER,
    duration_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de errores del sistema
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_type VARCHAR(50) NOT NULL CHECK (error_type IN ('database', 'api', 'validation', 'authentication', 'authorization', 'external_service', 'system')),
    error_code VARCHAR(20),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_id VARCHAR(100),
    endpoint VARCHAR(200),
    method VARCHAR(10),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de rendimiento
CREATE TABLE IF NOT EXISTS performance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation VARCHAR(100) NOT NULL,
    duration_ms INTEGER NOT NULL,
    memory_usage_mb NUMERIC(10, 2),
    cpu_usage_percent NUMERIC(5, 2),
    database_queries INTEGER,
    cache_hits INTEGER,
    cache_misses INTEGER,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(200),
    method VARCHAR(10),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para evaluaciones
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

-- Índices para reportes
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

-- Índices para configuración
CREATE INDEX IF NOT EXISTS idx_system_configurations_config_key ON system_configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_system_configurations_category ON system_configurations(category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_is_public ON system_configurations(is_public);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_preference_key ON user_preferences(preference_key);

CREATE INDEX IF NOT EXISTS idx_configuration_templates_template_name ON configuration_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_configuration_templates_template_category ON configuration_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_configuration_templates_is_default ON configuration_templates(is_default);

CREATE INDEX IF NOT EXISTS idx_configuration_logs_config_id ON configuration_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_configuration_logs_user_id ON configuration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_configuration_logs_created_at ON configuration_logs(created_at);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_risk_level ON security_logs(risk_level);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_endpoint ON user_activity_logs(endpoint);

CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_performance_logs_operation ON performance_logs(operation);
CREATE INDEX IF NOT EXISTS idx_performance_logs_user_id ON performance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON performance_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_logs_duration_ms ON performance_logs(duration_ms);

-- =====================================================
-- 6. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Triggers para evaluaciones
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

-- Triggers para reportes
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at
    BEFORE UPDATE ON kpis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para configuración
CREATE TRIGGER update_system_configurations_updated_at
    BEFORE UPDATE ON system_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuration_templates_updated_at
    BEFORE UPDATE ON configuration_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE worker_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para evaluaciones
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

-- Políticas RLS para reportes
CREATE POLICY "Admins can manage reports" ON reports
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage dashboard metrics" ON dashboard_metrics
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage KPIs" ON kpis
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage report logs" ON report_logs
    FOR ALL USING (auth.role() = 'admin');

-- Políticas RLS para configuración
CREATE POLICY "Admins can manage system configurations" ON system_configurations
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Public configurations are readable" ON system_configurations
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage configuration templates" ON configuration_templates
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage configuration logs" ON configuration_logs
    FOR ALL USING (auth.role() = 'admin');

-- Políticas RLS para auditoría
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security logs" ON security_logs
    FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Users can view own activity logs" ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
    FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Admins can view all error logs" ON error_logs
    FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Admins can view all performance logs" ON performance_logs
    FOR SELECT USING (auth.role() = 'admin');

-- =====================================================
-- 8. FUNCIONES ESPECÍFICAS DE LA FASE 2
-- =====================================================

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
    
    INSERT INTO kpis (kpi_name, kpi_category, current_value, target_value, unit, period, calculation_method)
    VALUES ('trabajadores_activos', 'operational', current_value, 20, 'trabajadores', 'monthly', 'COUNT de trabajadores con status active')
    ON CONFLICT (kpi_name, period) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para obtener configuración
CREATE OR REPLACE FUNCTION get_configuration(p_config_key VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    config_value TEXT;
BEGIN
    SELECT config_value INTO config_value
    FROM system_configurations
    WHERE config_key = p_config_key;
    
    RETURN config_value;
END;
$$ LANGUAGE plpgsql;

-- Función para establecer configuración
CREATE OR REPLACE FUNCTION set_configuration(
    p_config_key VARCHAR(100),
    p_config_value TEXT,
    p_config_type VARCHAR(20),
    p_category VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_is_encrypted BOOLEAN DEFAULT FALSE,
    p_is_public BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    config_id UUID;
BEGIN
    INSERT INTO system_configurations (
        config_key,
        config_value,
        config_type,
        category,
        description,
        is_encrypted,
        is_public
    ) VALUES (
        p_config_key,
        p_config_value,
        p_config_type,
        p_category,
        p_description,
        p_is_encrypted,
        p_is_public
    )
    ON CONFLICT (config_key) DO UPDATE SET
        config_value = EXCLUDED.config_value,
        config_type = EXCLUDED.config_type,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        is_encrypted = EXCLUDED.is_encrypted,
        is_public = EXCLUDED.is_public,
        updated_at = NOW()
    RETURNING id INTO config_id;
    
    RETURN config_id;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar auditoría
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id UUID,
    p_action VARCHAR(50),
    p_resource_type VARCHAR(50),
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        session_id,
        details,
        severity
    ) VALUES (
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_user_agent,
        p_session_id,
        p_details,
        p_severity
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Limpiar logs de auditoría más antiguos de 1 año
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Limpiar logs de seguridad más antiguos de 6 meses
    DELETE FROM security_logs WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- Limpiar logs de actividad más antiguos de 3 meses
    DELETE FROM user_activity_logs WHERE created_at < NOW() - INTERVAL '3 months';
    
    -- Limpiar logs de errores resueltos más antiguos de 1 mes
    DELETE FROM error_logs WHERE resolved = true AND resolved_at < NOW() - INTERVAL '1 month';
    
    -- Limpiar logs de rendimiento más antiguos de 1 mes
    DELETE FROM performance_logs WHERE created_at < NOW() - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. DATOS INICIALES DE LA FASE 2
-- =====================================================

-- Insertar configuraciones por defecto
INSERT INTO system_configurations (config_key, config_value, config_type, category, description, is_public) VALUES
('app_name', 'ERP Banquetes', 'string', 'general', 'Nombre de la aplicación', true),
('app_version', '1.0.0', 'string', 'general', 'Versión de la aplicación', true),
('timezone', 'America/Santiago', 'string', 'general', 'Zona horaria del sistema', true),
('date_format', 'DD/MM/YYYY', 'string', 'general', 'Formato de fecha', true),
('currency', 'CLP', 'string', 'general', 'Moneda del sistema', true),
('max_file_size', '10485760', 'number', 'general', 'Tamaño máximo de archivo en bytes (10MB)', false),
('backup_retention_days', '30', 'number', 'backup', 'Días de retención de backups', false),
('penalty_auto_apply', 'true', 'boolean', 'penalties', 'Aplicar penalizaciones automáticamente', false),
('conflict_auto_detect', 'true', 'boolean', 'conflicts', 'Detectar conflictos automáticamente', false),
('email_notifications_enabled', 'true', 'boolean', 'email', 'Habilitar notificaciones por email', false),
('evaluation_required_for_completion', 'false', 'boolean', 'evaluations', 'Evaluación requerida para completar evento', false),
('report_auto_generate', 'false', 'boolean', 'reports', 'Generar reportes automáticamente', false),
('dashboard_refresh_interval', '300', 'number', 'general', 'Intervalo de actualización del dashboard en segundos', false),
('notification_retention_days', '90', 'number', 'notifications', 'Días de retención de notificaciones', false),
('worker_evaluation_required', 'true', 'boolean', 'evaluations', 'Evaluación de trabajador requerida', false);

-- Insertar plantillas de configuración por defecto
INSERT INTO configuration_templates (template_name, template_category, template_data, description, is_default) VALUES
('default_email_settings', 'email', '{"smtp_host": "smtp.gmail.com", "smtp_port": 587, "smtp_secure": false, "from_name": "ERP Banquetes", "reply_to": "noreply@banquetes.com"}', 'Configuración por defecto de email', true),
('default_penalty_rules', 'penalties', '{"no_show": {"points": 50, "duration_days": 30}, "last_minute": {"points": 30, "duration_days": 14}, "short_notice": {"points": 15, "duration_days": 7}, "emergency": {"points": 5, "duration_days": 3}}', 'Reglas por defecto de penalizaciones', true),
('default_notification_settings', 'notifications', '{"email_enabled": true, "in_app_enabled": true, "push_enabled": false, "retention_days": 90}', 'Configuración por defecto de notificaciones', true),
('default_report_settings', 'reports', '{"auto_generate": false, "retention_days": 365, "formats": ["json", "csv"], "schedule": "monthly"}', 'Configuración por defecto de reportes', true);

-- =====================================================
-- FIN DE LA FASE 2
-- =====================================================
