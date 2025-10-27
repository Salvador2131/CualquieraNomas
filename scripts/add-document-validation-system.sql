-- Tabla para validaciones de documentos
CREATE TABLE IF NOT EXISTS document_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_card', 'health_certificate', 'food_handler_certificate', 'criminal_record', 'work_permit')),
    file_url TEXT NOT NULL,
    ocr_result JSONB,
    validation_result JSONB NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('valid', 'invalid', 'pending', 'expired')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    extracted_data JSONB,
    validation_errors TEXT[],
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_document_validations_worker_id ON document_validations(worker_id);
CREATE INDEX IF NOT EXISTS idx_document_validations_document_type ON document_validations(document_type);
CREATE INDEX IF NOT EXISTS idx_document_validations_status ON document_validations(status);
CREATE INDEX IF NOT EXISTS idx_document_validations_created_at ON document_validations(created_at);

-- Tabla para logs de validaciones
CREATE TABLE IF NOT EXISTS document_validation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_id UUID REFERENCES document_validations(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'validated', 'rejected', 'expired', 'updated')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_document_validation_logs_validation_id ON document_validation_logs(validation_id);
CREATE INDEX IF NOT EXISTS idx_document_validation_logs_created_at ON document_validation_logs(created_at);

-- Agregar campos de estado de documentos a la tabla workers
ALTER TABLE workers ADD COLUMN IF NOT EXISTS id_card_status VARCHAR(20) DEFAULT 'pending' CHECK (id_card_status IN ('pending', 'valid', 'invalid', 'expired'));
ALTER TABLE workers ADD COLUMN IF NOT EXISTS health_certificate_status VARCHAR(20) DEFAULT 'pending' CHECK (health_certificate_status IN ('pending', 'valid', 'invalid', 'expired'));
ALTER TABLE workers ADD COLUMN IF NOT EXISTS food_handler_certificate_status VARCHAR(20) DEFAULT 'pending' CHECK (food_handler_certificate_status IN ('pending', 'valid', 'invalid', 'expired'));
ALTER TABLE workers ADD COLUMN IF NOT EXISTS criminal_record_status VARCHAR(20) DEFAULT 'pending' CHECK (criminal_record_status IN ('pending', 'valid', 'invalid', 'expired'));
ALTER TABLE workers ADD COLUMN IF NOT EXISTS work_permit_status VARCHAR(20) DEFAULT 'pending' CHECK (work_permit_status IN ('pending', 'valid', 'invalid', 'expired'));

-- Índices para los nuevos campos
CREATE INDEX IF NOT EXISTS idx_workers_id_card_status ON workers(id_card_status);
CREATE INDEX IF NOT EXISTS idx_workers_health_certificate_status ON workers(health_certificate_status);
CREATE INDEX IF NOT EXISTS idx_workers_food_handler_certificate_status ON workers(food_handler_certificate_status);

-- Función para validar documentos automáticamente
CREATE OR REPLACE FUNCTION validate_document_automatically(
    p_worker_id UUID,
    p_document_type VARCHAR(50),
    p_file_url TEXT,
    p_ocr_result JSONB
)
RETURNS UUID AS $$
DECLARE
    validation_id UUID;
    validation_result JSONB;
    is_valid BOOLEAN;
    confidence_score DECIMAL(3,2);
    extracted_data JSONB;
    validation_errors TEXT[];
BEGIN
    -- Procesar resultado OCR según tipo de documento
    CASE p_document_type
        WHEN 'id_card' THEN
            -- Validar cédula de identidad
            is_valid := (p_ocr_result->>'document_number') IS NOT NULL 
                       AND (p_ocr_result->>'full_name') IS NOT NULL
                       AND (p_ocr_result->>'birth_date') IS NOT NULL;
            confidence_score := (p_ocr_result->>'confidence')::DECIMAL(3,2);
            extracted_data := p_ocr_result->'fields';
            
            IF NOT is_valid THEN
                validation_errors := ARRAY['Campos requeridos no encontrados en la cédula'];
            END IF;
            
        WHEN 'health_certificate' THEN
            -- Validar certificado médico
            is_valid := (p_ocr_result->>'worker_name') IS NOT NULL 
                       AND (p_ocr_result->>'status') LIKE '%APTO%'
                       AND (p_ocr_result->>'expiry_date') IS NOT NULL;
            confidence_score := (p_ocr_result->>'confidence')::DECIMAL(3,2);
            extracted_data := p_ocr_result->'fields';
            
            IF NOT is_valid THEN
                validation_errors := ARRAY['Certificado médico inválido o vencido'];
            END IF;
            
        WHEN 'food_handler_certificate' THEN
            -- Validar certificado de manipulador
            is_valid := (p_ocr_result->>'worker_name') IS NOT NULL 
                       AND (p_ocr_result->>'expiry_date') IS NOT NULL
                       AND (p_ocr_result->>'issuing_authority') IS NOT NULL;
            confidence_score := (p_ocr_result->>'confidence')::DECIMAL(3,2);
            extracted_data := p_ocr_result->'fields';
            
            IF NOT is_valid THEN
                validation_errors := ARRAY['Certificado de manipulador inválido'];
            END IF;
            
        ELSE
            is_valid := FALSE;
            confidence_score := 0.0;
            extracted_data := '{}';
            validation_errors := ARRAY['Tipo de documento no soportado'];
    END CASE;
    
    -- Crear registro de validación
    INSERT INTO document_validations (
        worker_id,
        document_type,
        file_url,
        ocr_result,
        validation_result,
        status,
        confidence_score,
        extracted_data,
        validation_errors
    ) VALUES (
        p_worker_id,
        p_document_type,
        p_file_url,
        p_ocr_result,
        jsonb_build_object(
            'is_valid', is_valid,
            'confidence', confidence_score,
            'errors', validation_errors,
            'extracted_data', extracted_data
        ),
        CASE WHEN is_valid THEN 'valid' ELSE 'invalid' END,
        confidence_score,
        extracted_data,
        validation_errors
    ) RETURNING id INTO validation_id;
    
    -- Actualizar estado del documento en el perfil del trabajador
    UPDATE workers 
    SET 
        id_card_status = CASE WHEN p_document_type = 'id_card' AND is_valid THEN 'valid' ELSE id_card_status END,
        health_certificate_status = CASE WHEN p_document_type = 'health_certificate' AND is_valid THEN 'valid' ELSE health_certificate_status END,
        food_handler_certificate_status = CASE WHEN p_document_type = 'food_handler_certificate' AND is_valid THEN 'valid' ELSE food_handler_certificate_status END,
        criminal_record_status = CASE WHEN p_document_type = 'criminal_record' AND is_valid THEN 'valid' ELSE criminal_record_status END,
        work_permit_status = CASE WHEN p_document_type = 'work_permit' AND is_valid THEN 'valid' ELSE work_permit_status END,
        updated_at = NOW()
    WHERE id = p_worker_id;
    
    -- Crear log
    INSERT INTO document_validation_logs (validation_id, action, details)
    VALUES (
        validation_id,
        'validated',
        jsonb_build_object(
            'is_valid', is_valid,
            'confidence_score', confidence_score,
            'automatic', true
        )
    );
    
    RETURN validation_id;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar vencimiento de documentos
CREATE OR REPLACE FUNCTION check_document_expiry()
RETURNS void AS $$
BEGIN
    -- Marcar documentos vencidos
    UPDATE document_validations 
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE status = 'valid' 
    AND extracted_data->>'expiry_date' IS NOT NULL
    AND (extracted_data->>'expiry_date')::DATE < CURRENT_DATE;
    
    -- Actualizar estado en workers
    UPDATE workers 
    SET 
        health_certificate_status = CASE 
            WHEN health_certificate_status = 'valid' 
            AND EXISTS (
                SELECT 1 FROM document_validations 
                WHERE worker_id = workers.id 
                AND document_type = 'health_certificate' 
                AND status = 'expired'
            ) THEN 'expired' 
            ELSE health_certificate_status 
        END,
        food_handler_certificate_status = CASE 
            WHEN food_handler_certificate_status = 'valid' 
            AND EXISTS (
                SELECT 1 FROM document_validations 
                WHERE worker_id = workers.id 
                AND document_type = 'food_handler_certificate' 
                AND status = 'expired'
            ) THEN 'expired' 
            ELSE food_handler_certificate_status 
        END,
        updated_at = NOW();
    
    -- Crear logs para documentos expirados
    INSERT INTO document_validation_logs (validation_id, action, details)
    SELECT 
        id,
        'expired',
        jsonb_build_object('expired_at', NOW())
    FROM document_validations 
    WHERE status = 'expired' 
    AND updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en document_validations
CREATE OR REPLACE FUNCTION update_document_validations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_validations_updated_at
    BEFORE UPDATE ON document_validations
    FOR EACH ROW
    EXECUTE FUNCTION update_document_validations_updated_at();

-- Función para limpiar validaciones antiguas
CREATE OR REPLACE FUNCTION cleanup_old_document_validations()
RETURNS void AS $$
BEGIN
    -- Eliminar logs de validaciones antiguas
    DELETE FROM document_validation_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Eliminar validaciones inválidas antiguas
    DELETE FROM document_validations 
    WHERE status = 'invalid' 
    AND created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;
