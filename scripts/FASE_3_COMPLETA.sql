-- =====================================================
-- FASE 3 COMPLETA: SISTEMAS ADICIONALES - SCHEMA SQL
-- =====================================================
-- Este archivo contiene TODAS las tablas y funciones de la Fase 3
-- Ejecutar después de la Fase 2 para evitar errores de dependencias

-- =====================================================
-- 1. SISTEMA DE CALENDARIO AVANZADO
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

-- =====================================================
-- 2. SISTEMA DE MENSAJERÍA Y CHAT
-- =====================================================

-- Tabla para conversaciones
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    conversation_type VARCHAR(20) NOT NULL CHECK (conversation_type IN ('direct', 'group', 'event', 'support', 'announcement')),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para participantes de conversaciones
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(conversation_id, user_id)
);

-- Tabla para mensajes
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'event_update', 'notification')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para archivos adjuntos
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para reacciones a mensajes
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thumbs_up', 'thumbs_down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction_type)
);

-- Tabla para mensajes leídos
CREATE TABLE IF NOT EXISTS message_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Tabla para plantillas de mensajes
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('event', 'worker', 'client', 'general', 'emergency')),
    subject TEXT,
    content TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. SISTEMA DE DOCUMENTOS Y ARCHIVOS
-- =====================================================

-- Tabla para documentos
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('contract', 'invoice', 'receipt', 'certificate', 'manual', 'template', 'report', 'other')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('legal', 'financial', 'operational', 'hr', 'client', 'event', 'training', 'other')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'draft')),
    is_public BOOLEAN DEFAULT FALSE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    encryption_key TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    parent_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para versiones de documentos
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    change_summary TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para permisos de documentos
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('read', 'write', 'admin', 'download')),
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(document_id, user_id, permission_type)
);

-- Tabla para etiquetas de documentos
CREATE TABLE IF NOT EXISTS document_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    tag_color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, tag_name)
);

-- Tabla para comentarios en documentos
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    page_number INTEGER,
    x_position NUMERIC(10, 2),
    y_position NUMERIC(10, 2),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para plantillas de documentos
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('contract', 'invoice', 'report', 'certificate', 'manual', 'other')),
    template_data JSONB NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de documentos
CREATE TABLE IF NOT EXISTS document_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'downloaded', 'shared', 'deleted', 'archived', 'restored')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SISTEMA DE INTEGRACIONES Y WEBHOOKS
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

-- =====================================================
-- 5. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para calendario
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

-- Índices para mensajería
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_event_id ON conversations(event_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_active ON message_templates(is_active);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_event_id ON documents(event_id);
CREATE INDEX IF NOT EXISTS idx_documents_worker_id ON documents(worker_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_version ON document_versions(version);

CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_permission_type ON document_permissions(permission_type);

CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag_name ON document_tags(tag_name);

CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_user_id ON document_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_document_templates_template_type ON document_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_is_active ON document_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_document_logs_document_id ON document_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_logs_created_at ON document_logs(created_at);

-- Índices para integraciones
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

-- =====================================================
-- 6. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Triggers para calendario
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

-- Triggers para mensajería
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para documentos
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_comments_updated_at
    BEFORE UPDATE ON document_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
    BEFORE UPDATE ON document_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para integraciones
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

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para calendario
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

-- Políticas RLS para mensajería
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = conversations.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all conversations" ON conversations
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view attachments in their conversations" ON message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE m.id = message_attachments.message_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage reactions in their conversations" ON message_reactions
    FOR ALL USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE m.id = message_reactions.message_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view message reads in their conversations" ON message_reads
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE m.id = message_reads.message_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage message templates" ON message_templates
    FOR ALL USING (auth.role() = 'admin');

-- Políticas RLS para documentos
CREATE POLICY "Admins can manage all documents" ON documents
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can view public documents" ON documents
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view documents they uploaded" ON documents
    FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can view documents they have permission for" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = documents.id
            AND user_id = auth.uid()
            AND permission_type IN ('read', 'write', 'admin', 'download')
        )
    );

CREATE POLICY "Users can manage documents they uploaded" ON documents
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all document versions" ON document_versions
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can view document versions they have access to" ON document_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            LEFT JOIN document_permissions dp ON d.id = dp.document_id
            WHERE d.id = document_versions.document_id
            AND (d.uploaded_by = auth.uid() OR d.is_public = true OR dp.user_id = auth.uid())
        )
    );

CREATE POLICY "Admins can manage document permissions" ON document_permissions
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can view their own document permissions" ON document_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage document tags" ON document_tags
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage document comments" ON document_comments
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can manage their own document comments" ON document_comments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage document templates" ON document_templates
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage document logs" ON document_logs
    FOR ALL USING (auth.role() = 'admin');

-- Políticas RLS para integraciones
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

-- =====================================================
-- 8. FUNCIONES ESPECÍFICAS DE LA FASE 3
-- =====================================================

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

-- Función para crear conversación
CREATE OR REPLACE FUNCTION create_conversation(
    p_title TEXT,
    p_conversation_type VARCHAR(20),
    p_event_id UUID DEFAULT NULL,
    p_participant_ids UUID[],
    p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    participant_id UUID;
BEGIN
    -- Crear conversación
    INSERT INTO conversations (
        title,
        conversation_type,
        event_id,
        created_by
    ) VALUES (
        p_title,
        p_conversation_type,
        p_event_id,
        p_created_by
    ) RETURNING id INTO conversation_id;
    
    -- Agregar participantes
    FOREACH participant_id IN ARRAY p_participant_ids LOOP
        INSERT INTO conversation_participants (
            conversation_id,
            user_id,
            role
        ) VALUES (
            conversation_id,
            participant_id,
            CASE WHEN participant_id = p_created_by THEN 'admin' ELSE 'member' END
        );
    END LOOP;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Función para enviar mensaje
CREATE OR REPLACE FUNCTION send_message(
    p_conversation_id UUID,
    p_sender_id UUID,
    p_content TEXT,
    p_message_type VARCHAR(20) DEFAULT 'text',
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_reply_to_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
BEGIN
    -- Verificar que el usuario es participante
    IF NOT EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = p_conversation_id
        AND user_id = p_sender_id
    ) THEN
        RAISE EXCEPTION 'User is not a participant in this conversation';
    END IF;
    
    -- Crear mensaje
    INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        message_type,
        metadata,
        reply_to_id
    ) VALUES (
        p_conversation_id,
        p_sender_id,
        p_content,
        p_message_type,
        p_metadata,
        p_reply_to_id
    ) RETURNING id INTO message_id;
    
    -- Actualizar última actividad de la conversación
    UPDATE conversations
    SET last_message_at = NOW()
    WHERE id = p_conversation_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- Función para subir documento
CREATE OR REPLACE FUNCTION upload_document(
    p_title TEXT,
    p_description TEXT,
    p_file_name TEXT,
    p_file_path TEXT,
    p_file_type VARCHAR(50),
    p_file_size BIGINT,
    p_mime_type VARCHAR(100),
    p_document_type VARCHAR(50),
    p_category VARCHAR(50),
    p_event_id UUID DEFAULT NULL,
    p_worker_id UUID DEFAULT NULL,
    p_uploaded_by UUID,
    p_is_public BOOLEAN DEFAULT FALSE,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    document_id UUID;
BEGIN
    INSERT INTO documents (
        title,
        description,
        file_name,
        file_path,
        file_type,
        file_size,
        mime_type,
        document_type,
        category,
        event_id,
        worker_id,
        uploaded_by,
        is_public,
        expires_at
    ) VALUES (
        p_title,
        p_description,
        p_file_name,
        p_file_path,
        p_file_type,
        p_file_size,
        p_mime_type,
        p_document_type,
        p_category,
        p_event_id,
        p_worker_id,
        p_uploaded_by,
        p_is_public,
        p_expires_at
    ) RETURNING id INTO document_id;
    
    -- Crear log
    INSERT INTO document_logs (document_id, action, user_id, details)
    VALUES (
        document_id,
        'created',
        p_uploaded_by,
        jsonb_build_object(
            'file_name', p_file_name,
            'file_size', p_file_size,
            'document_type', p_document_type
        )
    );
    
    RETURN document_id;
END;
$$ LANGUAGE plpgsql;

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
        credentials,
        p_webhook_url,
        p_api_endpoint,
        p_created_by
    ) RETURNING id INTO integration_id;
    
    RETURN integration_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. DATOS INICIALES DE LA FASE 3
-- =====================================================

-- Insertar plantillas de integración por defecto
INSERT INTO integration_templates (name, integration_type, provider, template_config, required_fields, optional_fields) VALUES
('Stripe Payment', 'payment', 'Stripe', '{"api_version": "2020-08-27", "webhook_events": ["payment_intent.succeeded", "payment_intent.payment_failed"]}', ARRAY['secret_key', 'publishable_key'], ARRAY['webhook_secret', 'test_mode']),
('Google Calendar', 'calendar', 'Google', '{"api_version": "v3", "scopes": ["https://www.googleapis.com/auth/calendar"]}', ARRAY['client_id', 'client_secret', 'refresh_token'], ARRAY['calendar_id']),
('SendGrid Email', 'email', 'SendGrid', '{"api_version": "v3", "endpoint": "https://api.sendgrid.com/v3/mail/send"}', ARRAY['api_key'], ARRAY['from_email', 'from_name']),
('Twilio SMS', 'sms', 'Twilio', '{"api_version": "2010-04-01", "endpoint": "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json"}', ARRAY['account_sid', 'auth_token', 'phone_number'], ARRAY['messaging_service_sid']),
('AWS S3 Storage', 'storage', 'AWS', '{"api_version": "2006-03-01", "region": "us-east-1"}', ARRAY['access_key_id', 'secret_access_key', 'bucket_name'], ARRAY['region', 'folder_prefix']);

-- =====================================================
-- FIN DE LA FASE 3 COMPLETA
-- =====================================================
