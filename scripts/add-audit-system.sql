-- =====================================================
-- SISTEMA DE LOGS DE AUDITORÍA - FASE 2
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

-- Índices para optimización
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

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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

-- Función para registrar actividad de usuario
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_resource_type VARCHAR(50) DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_endpoint VARCHAR(200) DEFAULT NULL,
    p_method VARCHAR(10) DEFAULT NULL,
    p_status_code INTEGER DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_activity_logs (
        user_id,
        activity_type,
        resource_type,
        resource_id,
        endpoint,
        method,
        status_code,
        duration_ms,
        ip_address,
        user_agent,
        details
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_resource_type,
        p_resource_id,
        p_endpoint,
        p_method,
        p_status_code,
        p_duration_ms,
        p_ip_address,
        p_user_agent,
        p_details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar error
CREATE OR REPLACE FUNCTION log_error(
    p_error_type VARCHAR(50),
    p_error_code VARCHAR(20) DEFAULT NULL,
    p_error_message TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_request_id VARCHAR(100) DEFAULT NULL,
    p_endpoint VARCHAR(200) DEFAULT NULL,
    p_method VARCHAR(10) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO error_logs (
        error_type,
        error_code,
        error_message,
        stack_trace,
        user_id,
        request_id,
        endpoint,
        method,
        ip_address,
        user_agent,
        details
    ) VALUES (
        p_error_type,
        p_error_code,
        p_error_message,
        p_stack_trace,
        p_user_id,
        p_request_id,
        p_endpoint,
        p_method,
        p_ip_address,
        p_user_agent,
        p_details
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

-- Función para obtener estadísticas de logs
CREATE OR REPLACE FUNCTION get_log_statistics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'audit_logs', jsonb_build_object(
            'total', COUNT(*),
            'by_severity', jsonb_object_agg(severity, severity_count)
        ),
        'security_logs', jsonb_build_object(
            'total', COUNT(*),
            'by_risk_level', jsonb_object_agg(risk_level, risk_count)
        ),
        'error_logs', jsonb_build_object(
            'total', COUNT(*),
            'unresolved', COUNT(*) FILTER (WHERE resolved = false),
            'by_type', jsonb_object_agg(error_type, type_count)
        ),
        'performance_logs', jsonb_build_object(
            'total', COUNT(*),
            'average_duration', AVG(duration_ms),
            'max_duration', MAX(duration_ms)
        )
    )
    INTO stats
    FROM (
        SELECT 
            'audit' as log_type,
            severity,
            COUNT(*) as severity_count,
            NULL as risk_level,
            NULL as risk_count,
            NULL as error_type,
            NULL as type_count,
            NULL as resolved,
            NULL as duration_ms
        FROM audit_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY severity
        
        UNION ALL
        
        SELECT 
            'security' as log_type,
            NULL as severity,
            NULL as severity_count,
            risk_level,
            COUNT(*) as risk_count,
            NULL as error_type,
            NULL as type_count,
            NULL as resolved,
            NULL as duration_ms
        FROM security_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY risk_level
        
        UNION ALL
        
        SELECT 
            'error' as log_type,
            NULL as severity,
            NULL as severity_count,
            NULL as risk_level,
            NULL as risk_count,
            error_type,
            COUNT(*) as type_count,
            resolved,
            NULL as duration_ms
        FROM error_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY error_type, resolved
        
        UNION ALL
        
        SELECT 
            'performance' as log_type,
            NULL as severity,
            NULL as severity_count,
            NULL as risk_level,
            NULL as risk_count,
            NULL as error_type,
            NULL as type_count,
            NULL as resolved,
            duration_ms
        FROM performance_logs
        WHERE created_at BETWEEN p_start_date AND p_end_date
    ) combined_stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;
