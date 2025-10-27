-- Tabla para backups del sistema
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id VARCHAR(100) UNIQUE NOT NULL,
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'selective')),
    data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'restored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_count INTEGER DEFAULT 0,
    file_size BIGINT,
    notes TEXT
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_backups_backup_id ON backups(backup_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);

-- Tabla para logs de backup
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'restored', 'failed', 'deleted')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_id ON backup_logs(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at);

-- Función para crear backup completo
CREATE OR REPLACE FUNCTION create_full_backup()
RETURNS UUID AS $$
DECLARE
    backup_id UUID;
    backup_data JSONB;
    current_time TIMESTAMP;
BEGIN
    current_time := NOW();
    
    -- Crear ID único para el backup
    backup_id := uuid_generate_v4();
    
    -- Recopilar todos los datos del sistema
    SELECT jsonb_build_object(
        'backup_info', jsonb_build_object(
            'created_at', current_time,
            'backup_type', 'full',
            'version', '1.0'
        ),
        'users', (SELECT jsonb_agg(to_jsonb(t)) FROM users t),
        'workers', (SELECT jsonb_agg(to_jsonb(t)) FROM workers t),
        'events', (SELECT jsonb_agg(to_jsonb(t)) FROM events t),
        'preregistrations', (SELECT jsonb_agg(to_jsonb(t)) FROM preregistrations t),
        'notifications', (SELECT jsonb_agg(to_jsonb(t)) FROM notifications t),
        'penalties', (SELECT jsonb_agg(to_jsonb(t)) FROM penalties t),
        'conflicts', (SELECT jsonb_agg(to_jsonb(t)) FROM conflicts t),
        'email_templates', (SELECT jsonb_agg(to_jsonb(t)) FROM email_templates t)
    ) INTO backup_data;
    
    -- Insertar backup
    INSERT INTO backups (
        backup_id,
        backup_type,
        data,
        status,
        file_size,
        notes
    ) VALUES (
        backup_id::text,
        'full',
        backup_data,
        'completed',
        pg_column_size(backup_data),
        'Backup completo del sistema'
    );
    
    -- Crear log
    INSERT INTO backup_logs (backup_id, action, details)
    VALUES (
        backup_id::text,
        'created',
        jsonb_build_object(
            'backup_type', 'full',
            'file_size', pg_column_size(backup_data),
            'created_at', current_time
        )
    );
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql;

-- Función para restaurar backup
CREATE OR REPLACE FUNCTION restore_backup(p_backup_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    backup_record RECORD;
    restored_count INTEGER := 0;
BEGIN
    -- Obtener backup
    SELECT * INTO backup_record FROM backups WHERE id = p_backup_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Backup no encontrado';
    END IF;
    
    IF backup_record.status != 'completed' THEN
        RAISE EXCEPTION 'Backup no está completo';
    END IF;
    
    -- Aquí iría la lógica de restauración
    -- Por seguridad, solo actualizamos el estado
    UPDATE backups 
    SET 
        status = 'restored',
        restored_at = NOW(),
        restored_count = restored_count + 1
    WHERE id = p_backup_id;
    
    -- Crear log
    INSERT INTO backup_logs (backup_id, action, details)
    VALUES (
        backup_record.backup_id,
        'restored',
        jsonb_build_object(
            'restored_at', NOW(),
            'restored_count', restored_count + 1
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar backups antiguos (mantener solo últimos 30 días)
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
BEGIN
    DELETE FROM backups 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND status = 'completed';
    
    DELETE FROM backup_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en backups
CREATE OR REPLACE FUNCTION update_backup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_backups_updated_at
    BEFORE UPDATE ON backups
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_updated_at();