-- =====================================================
-- SISTEMA DE INTEGRACIONES Y WEBHOOKS - FASE 3
-- =====================================================

-- Tabla para integraciones externas
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('payment', 'calendar', 'email', 'sms', 'storage', 'crm', 'accounting', 'other')),
    provider VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'maintenance')),
    configuration JSONB NOT NULL,
    credentials JSONB,
    webhook_url TEXT,
    api_endpoint TEXT,
    is_encrypted BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency INTEGER DEFAULT 3600, -- segundos
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para sincronización de datos
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    details JSONB
);

-- Tabla para mapeo de datos externos
CREATE TABLE IF NOT EXISTS external_data_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    internal_id UUID NOT NULL,
    internal_type VARCHAR(50) NOT NULL CHECK (internal_type IN ('user', 'event', 'worker', 'document', 'payment')),
    external_data JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(integration_id, external_id, internal_type)
);

-- Tabla para plantillas de integración
CREATE TABLE IF NOT EXISTS integration_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    integration_type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    template_config JSONB NOT NULL,
    required_fields TEXT[],
    optional_fields TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_integrations_integration_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_created_by ON integrations(created_by);

CREATE INDEX IF NOT EXISTS idx_webhooks_integration_id ON webhooks(integration_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON webhooks(created_by);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at);

CREATE INDEX IF NOT EXISTS idx_external_data_mapping_integration_id ON external_data_mapping(integration_id);
CREATE INDEX IF NOT EXISTS idx_external_data_mapping_external_id ON external_data_mapping(external_id);
CREATE INDEX IF NOT EXISTS idx_external_data_mapping_internal_type ON external_data_mapping(internal_type);

CREATE INDEX IF NOT EXISTS idx_integration_templates_integration_type ON integration_templates(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_templates_provider ON integration_templates(provider);
CREATE INDEX IF NOT EXISTS idx_integration_templates_is_active ON integration_templates(is_active);

-- Triggers para updated_at
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_templates_updated_at
    BEFORE UPDATE ON integration_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage integrations" ON integrations
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage webhooks" ON webhooks
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can view webhook logs" ON webhook_logs
    FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Admins can view sync logs" ON sync_logs
    FOR SELECT USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage external data mapping" ON external_data_mapping
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage integration templates" ON integration_templates
    FOR ALL USING (auth.role() = 'admin');

-- Función para crear integración
CREATE OR REPLACE FUNCTION create_integration(
    p_name VARCHAR(100),
    p_integration_type VARCHAR(50),
    p_provider VARCHAR(100),
    p_configuration JSONB,
    p_credentials JSONB DEFAULT NULL,
    p_webhook_url TEXT DEFAULT NULL,
    p_api_endpoint TEXT DEFAULT NULL,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    integration_id UUID;
BEGIN
    INSERT INTO integrations (
        name,
        integration_type,
        provider,
        configuration,
        credentials,
        webhook_url,
        api_endpoint,
        created_by
    ) VALUES (
        p_name,
        p_integration_type,
        p_provider,
        p_configuration,
        p_credentials,
        p_webhook_url,
        p_api_endpoint,
        p_created_by
    ) RETURNING id INTO integration_id;
    
    RETURN integration_id;
END;
$$ LANGUAGE plpgsql;

-- Función para crear webhook
CREATE OR REPLACE FUNCTION create_webhook(
    p_name VARCHAR(100),
    p_url TEXT,
    p_events TEXT[],
    p_secret_key TEXT DEFAULT NULL,
    p_integration_id UUID DEFAULT NULL,
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    webhook_id UUID;
BEGIN
    INSERT INTO webhooks (
        name,
        url,
        events,
        secret_key,
        integration_id,
        created_by
    ) VALUES (
        p_name,
        p_url,
        p_events,
        p_secret_key,
        p_integration_id,
        p_created_by
    ) RETURNING id INTO webhook_id;
    
    RETURN webhook_id;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar webhook
CREATE OR REPLACE FUNCTION process_webhook(
    p_webhook_id UUID,
    p_event_type VARCHAR(50),
    p_payload JSONB
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    webhook_record RECORD;
    response_status INTEGER;
    response_body TEXT;
    response_time_ms INTEGER;
    start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    start_time := NOW();
    
    -- Obtener información del webhook
    SELECT * INTO webhook_record
    FROM webhooks
    WHERE id = p_webhook_id
    AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Webhook not found or inactive';
    END IF;
    
    -- Verificar que el evento está en la lista de eventos del webhook
    IF NOT (p_event_type = ANY(webhook_record.events)) THEN
        RAISE EXCEPTION 'Event type not allowed for this webhook';
    END IF;
    
    -- Crear log inicial
    INSERT INTO webhook_logs (
        webhook_id,
        event_type,
        payload,
        status
    ) VALUES (
        p_webhook_id,
        p_event_type,
        p_payload,
        'pending'
    ) RETURNING id INTO log_id;
    
    -- Aquí se haría la llamada HTTP real al webhook
    -- Por ahora simulamos una respuesta exitosa
    response_status := 200;
    response_body := '{"status": "success", "message": "Webhook processed"}';
    response_time_ms := EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000;
    
    -- Actualizar log con respuesta
    UPDATE webhook_logs
    SET response_status = response_status,
        response_body = response_body,
        response_time_ms = response_time_ms,
        status = 'success'
    WHERE id = log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Función para sincronizar datos
CREATE OR REPLACE FUNCTION sync_integration_data(
    p_integration_id UUID,
    p_sync_type VARCHAR(50) DEFAULT 'incremental'
)
RETURNS UUID AS $$
DECLARE
    sync_id UUID;
    integration_record RECORD;
    records_processed INTEGER := 0;
    records_success INTEGER := 0;
    records_failed INTEGER := 0;
BEGIN
    -- Obtener información de la integración
    SELECT * INTO integration_record
    FROM integrations
    WHERE id = p_integration_id
    AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Integration not found or inactive';
    END IF;
    
    -- Crear log de sincronización
    INSERT INTO sync_logs (
        integration_id,
        sync_type,
        status
    ) VALUES (
        p_integration_id,
        p_sync_type,
        'running'
    ) RETURNING id INTO sync_id;
    
    -- Aquí se implementaría la lógica de sincronización real
    -- Por ahora simulamos el proceso
    
    -- Simular procesamiento de registros
    records_processed := 100;
    records_success := 95;
    records_failed := 5;
    
    -- Actualizar log de sincronización
    UPDATE sync_logs
    SET status = 'completed',
        records_processed = records_processed,
        records_success = records_success,
        records_failed = records_failed,
        completed_at = NOW()
    WHERE id = sync_id;
    
    -- Actualizar última sincronización de la integración
    UPDATE integrations
    SET last_sync_at = NOW()
    WHERE id = p_integration_id;
    
    RETURN sync_id;
END;
$$ LANGUAGE plpgsql;

-- Función para mapear datos externos
CREATE OR REPLACE FUNCTION map_external_data(
    p_integration_id UUID,
    p_external_id VARCHAR(255),
    p_internal_id UUID,
    p_internal_type VARCHAR(50),
    p_external_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    mapping_id UUID;
BEGIN
    INSERT INTO external_data_mapping (
        integration_id,
        external_id,
        internal_id,
        internal_type,
        external_data
    ) VALUES (
        p_integration_id,
        p_external_id,
        p_internal_id,
        p_internal_type,
        p_external_data
    ) ON CONFLICT (integration_id, external_id, internal_type) DO UPDATE SET
        internal_id = EXCLUDED.internal_id,
        external_data = EXCLUDED.external_data,
        last_synced_at = NOW()
    RETURNING id INTO mapping_id;
    
    RETURN mapping_id;
END;
$$ LANGUAGE plpgsql;

-- Insertar plantillas de integración por defecto
INSERT INTO integration_templates (name, integration_type, provider, template_config, required_fields, optional_fields) VALUES
('Stripe Payment', 'payment', 'Stripe', '{"api_version": "2020-08-27", "webhook_events": ["payment_intent.succeeded", "payment_intent.payment_failed"]}', ARRAY['secret_key', 'publishable_key'], ARRAY['webhook_secret', 'test_mode']),
('Google Calendar', 'calendar', 'Google', '{"api_version": "v3", "scopes": ["https://www.googleapis.com/auth/calendar"]}', ARRAY['client_id', 'client_secret', 'refresh_token'], ARRAY['calendar_id']),
('SendGrid Email', 'email', 'SendGrid', '{"api_version": "v3", "endpoint": "https://api.sendgrid.com/v3/mail/send"}', ARRAY['api_key'], ARRAY['from_email', 'from_name']),
('Twilio SMS', 'sms', 'Twilio', '{"api_version": "2010-04-01", "endpoint": "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json"}', ARRAY['account_sid', 'auth_token', 'phone_number'], ARRAY['messaging_service_sid']),
('AWS S3 Storage', 'storage', 'AWS', '{"api_version": "2006-03-01", "region": "us-east-1"}', ARRAY['access_key_id', 'secret_access_key', 'bucket_name'], ARRAY['region', 'folder_prefix']);
