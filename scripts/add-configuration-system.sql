-- =====================================================
-- SISTEMA DE CONFIGURACIÓN AVANZADA - FASE 2
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

-- Índices para optimización
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

-- Triggers para updated_at
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

-- RLS
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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

-- Función para obtener preferencia de usuario
CREATE OR REPLACE FUNCTION get_user_preference(
    p_user_id UUID,
    p_preference_key VARCHAR(100)
)
RETURNS TEXT AS $$
DECLARE
    preference_value TEXT;
BEGIN
    SELECT preference_value INTO preference_value
    FROM user_preferences
    WHERE user_id = p_user_id AND preference_key = p_preference_key;
    
    RETURN preference_value;
END;
$$ LANGUAGE plpgsql;

-- Función para establecer preferencia de usuario
CREATE OR REPLACE FUNCTION set_user_preference(
    p_user_id UUID,
    p_preference_key VARCHAR(100),
    p_preference_value TEXT,
    p_preference_type VARCHAR(20)
)
RETURNS UUID AS $$
DECLARE
    preference_id UUID;
BEGIN
    INSERT INTO user_preferences (
        user_id,
        preference_key,
        preference_value,
        preference_type
    ) VALUES (
        p_user_id,
        p_preference_key,
        p_preference_value,
        p_preference_type
    )
    ON CONFLICT (user_id, preference_key) DO UPDATE SET
        preference_value = EXCLUDED.preference_value,
        preference_type = EXCLUDED.preference_type,
        updated_at = NOW()
    RETURNING id INTO preference_id;
    
    RETURN preference_id;
END;
$$ LANGUAGE plpgsql;

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
