-- Tabla para notificaciones de vencimiento de documentos
CREATE TABLE IF NOT EXISTS document_expiry_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_card', 'health_certificate', 'food_handler_certificate', 'criminal_record', 'work_permit')),
    document_validation_id UUID REFERENCES document_validations(id) ON DELETE CASCADE,
    expiry_date DATE NOT NULL,
    days_until_expiry INTEGER NOT NULL,
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('advance_notice', 'reminder', 'warning', 'urgent', 'critical')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'dismissed')),
    delivery_method VARCHAR(20) CHECK (delivery_method IN ('email', 'sms', 'push', 'in_app')),
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_document_expiry_notifications_worker_id ON document_expiry_notifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_document_expiry_notifications_document_type ON document_expiry_notifications(document_type);
CREATE INDEX IF NOT EXISTS idx_document_expiry_notifications_status ON document_expiry_notifications(status);
CREATE INDEX IF NOT EXISTS idx_document_expiry_notifications_priority ON document_expiry_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_document_expiry_notifications_expiry_date ON document_expiry_notifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_document_expiry_notifications_created_at ON document_expiry_notifications(created_at);

-- Tabla para logs de notificaciones
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES document_expiry_notifications(id) ON DELETE CASCADE,
    delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('email', 'sms', 'push', 'in_app')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    details JSONB
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Función para generar notificaciones de vencimiento automáticamente
CREATE OR REPLACE FUNCTION generate_document_expiry_notifications()
RETURNS INTEGER AS $$
DECLARE
    document_record RECORD;
    days_until_expiry INTEGER;
    notification_type VARCHAR(20);
    priority VARCHAR(10);
    message_text TEXT;
    notifications_created INTEGER := 0;
    notification_days INTEGER[] := ARRAY[30, 15, 7, 3, 1];
    day_value INTEGER;
BEGIN
    -- Obtener documentos válidos con fecha de vencimiento
    FOR document_record IN
        SELECT 
            dv.id as validation_id,
            dv.worker_id,
            dv.document_type,
            dv.extracted_data,
            w.users.full_name as worker_name,
            w.users.email as worker_email,
            w.users.phone as worker_phone
        FROM document_validations dv
        JOIN workers w ON dv.worker_id = w.id
        JOIN users ON w.user_id = users.id
        WHERE dv.status = 'valid'
        AND dv.extracted_data->>'expiry_date' IS NOT NULL
        AND dv.extracted_data->>'expiry_date' != ''
    LOOP
        -- Calcular días hasta vencimiento
        days_until_expiry := (document_record.extracted_data->>'expiry_date')::DATE - CURRENT_DATE;
        
        -- Verificar si está en los días de notificación
        IF days_until_expiry = ANY(notification_days) THEN
            -- Determinar tipo y prioridad de notificación
            CASE days_until_expiry
                WHEN 1 THEN
                    notification_type := 'critical';
                    priority := 'critical';
                WHEN 3 THEN
                    notification_type := 'urgent';
                    priority := 'high';
                WHEN 7 THEN
                    notification_type := 'warning';
                    priority := 'medium';
                WHEN 15 THEN
                    notification_type := 'reminder';
                    priority := 'medium';
                WHEN 30 THEN
                    notification_type := 'advance_notice';
                    priority := 'low';
                ELSE
                    CONTINUE;
            END CASE;
            
            -- Generar mensaje
            message_text := generate_notification_message(
                document_record.document_type,
                days_until_expiry,
                document_record.worker_name
            );
            
            -- Verificar si ya existe notificación para este día
            IF NOT EXISTS (
                SELECT 1 FROM document_expiry_notifications 
                WHERE worker_id = document_record.worker_id
                AND document_type = document_record.document_type
                AND notification_type = notification_type
                AND expiry_date = (document_record.extracted_data->>'expiry_date')::DATE
            ) THEN
                -- Insertar notificación
                INSERT INTO document_expiry_notifications (
                    worker_id,
                    document_type,
                    document_validation_id,
                    expiry_date,
                    days_until_expiry,
                    notification_type,
                    priority,
                    status,
                    message
                ) VALUES (
                    document_record.worker_id,
                    document_record.document_type,
                    document_record.validation_id,
                    (document_record.extracted_data->>'expiry_date')::DATE,
                    days_until_expiry,
                    notification_type,
                    priority,
                    'pending',
                    message_text
                );
                
                notifications_created := notifications_created + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN notifications_created;
END;
$$ LANGUAGE plpgsql;

-- Función para generar mensaje de notificación
CREATE OR REPLACE FUNCTION generate_notification_message(
    p_document_type VARCHAR(50),
    p_days_until_expiry INTEGER,
    p_worker_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    document_name TEXT;
    message_text TEXT;
BEGIN
    -- Obtener nombre del documento
    CASE p_document_type
        WHEN 'id_card' THEN document_name := 'Cédula de Identidad';
        WHEN 'health_certificate' THEN document_name := 'Certificado Médico';
        WHEN 'food_handler_certificate' THEN document_name := 'Certificado de Manipulador de Alimentos';
        WHEN 'criminal_record' THEN document_name := 'Antecedentes Penales';
        WHEN 'work_permit' THEN document_name := 'Permiso de Trabajo';
        ELSE document_name := p_document_type;
    END CASE;
    
    -- Generar mensaje según días restantes
    CASE p_days_until_expiry
        WHEN 1 THEN
            message_text := '🚨 URGENTE: ' || document_name || ' de ' || p_worker_name || ' vence HOY. Renovación inmediata requerida.';
        WHEN 3 THEN
            message_text := '⚠️ CRÍTICO: ' || document_name || ' de ' || p_worker_name || ' vence en ' || p_days_until_expiry || ' días. Renovación urgente requerida.';
        WHEN 7 THEN
            message_text := '⚠️ IMPORTANTE: ' || document_name || ' de ' || p_worker_name || ' vence en ' || p_days_until_expiry || ' días. Programar renovación.';
        WHEN 15 THEN
            message_text := '📋 RECORDATORIO: ' || document_name || ' de ' || p_worker_name || ' vence en ' || p_days_until_expiry || ' días. Considerar renovación.';
        WHEN 30 THEN
            message_text := '📅 AVISO: ' || document_name || ' de ' || p_worker_name || ' vence en ' || p_days_until_expiry || ' días. Planificar renovación.';
        ELSE
            message_text := '📄 NOTIFICACIÓN: ' || document_name || ' de ' || p_worker_name || ' vence en ' || p_days_until_expiry || ' días.';
    END CASE;
    
    RETURN message_text;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar notificaciones antiguas
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Eliminar notificaciones enviadas hace más de 30 días
    DELETE FROM document_expiry_notifications 
    WHERE status IN ('sent', 'delivered', 'dismissed')
    AND sent_at < NOW() - INTERVAL '30 days';
    
    -- Eliminar logs de notificaciones antiguas
    DELETE FROM notification_logs 
    WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en document_expiry_notifications
CREATE OR REPLACE FUNCTION update_document_expiry_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_expiry_notifications_updated_at
    BEFORE UPDATE ON document_expiry_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_document_expiry_notifications_updated_at();

-- Función para enviar notificaciones críticas inmediatamente
CREATE OR REPLACE FUNCTION send_critical_notifications()
RETURNS INTEGER AS $$
DECLARE
    notification_record RECORD;
    notifications_sent INTEGER := 0;
BEGIN
    -- Obtener notificaciones críticas pendientes
    FOR notification_record IN
        SELECT * FROM document_expiry_notifications
        WHERE status = 'pending'
        AND priority IN ('critical', 'high')
        AND days_until_expiry <= 3
    LOOP
        -- Simular envío de notificación (en producción integrar con servicios reales)
        UPDATE document_expiry_notifications 
        SET 
            status = 'sent',
            delivery_method = 'email',
            sent_at = NOW(),
            updated_at = NOW()
        WHERE id = notification_record.id;
        
        -- Crear log de notificación enviada
        INSERT INTO notification_logs (
            notification_id,
            delivery_method,
            status,
            sent_at,
            details
        ) VALUES (
            notification_record.id,
            'email',
            'sent',
            NOW(),
            jsonb_build_object(
                'message', notification_record.message,
                'priority', notification_record.priority,
                'auto_sent', true
            )
        );
        
        notifications_sent := notifications_sent + 1;
    END LOOP;
    
    RETURN notifications_sent;
END;
$$ LANGUAGE plpgsql;
