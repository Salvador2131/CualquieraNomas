-- =====================================================
-- SISTEMA DE DOCUMENTOS Y ARCHIVOS - FASE 3
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

-- Índices para optimización
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

-- Triggers para updated_at
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

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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

-- Función para crear nueva versión de documento
CREATE OR REPLACE FUNCTION create_document_version(
    p_document_id UUID,
    p_version VARCHAR(20),
    p_file_name TEXT,
    p_file_path TEXT,
    p_file_size BIGINT,
    p_change_summary TEXT,
    p_uploaded_by UUID
)
RETURNS UUID AS $$
DECLARE
    version_id UUID;
    current_version VARCHAR(20);
BEGIN
    -- Obtener versión actual
    SELECT version INTO current_version
    FROM documents
    WHERE id = p_document_id;
    
    -- Crear nueva versión
    INSERT INTO document_versions (
        document_id,
        version,
        file_name,
        file_path,
        file_size,
        change_summary,
        uploaded_by
    ) VALUES (
        p_document_id,
        p_version,
        p_file_name,
        p_file_path,
        p_file_size,
        p_change_summary,
        p_uploaded_by
    ) RETURNING id INTO version_id;
    
    -- Actualizar versión del documento
    UPDATE documents
    SET version = p_version,
        file_name = p_file_name,
        file_path = p_file_path,
        file_size = p_file_size,
        updated_at = NOW()
    WHERE id = p_document_id;
    
    -- Crear log
    INSERT INTO document_logs (document_id, action, user_id, details)
    VALUES (
        p_document_id,
        'updated',
        p_uploaded_by,
        jsonb_build_object(
            'version', p_version,
            'previous_version', current_version,
            'change_summary', p_change_summary
        )
    );
    
    RETURN version_id;
END;
$$ LANGUAGE plpgsql;

-- Función para otorgar permiso de documento
CREATE OR REPLACE FUNCTION grant_document_permission(
    p_document_id UUID,
    p_user_id UUID,
    p_permission_type VARCHAR(20),
    p_granted_by UUID,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    permission_id UUID;
BEGIN
    INSERT INTO document_permissions (
        document_id,
        user_id,
        permission_type,
        granted_by,
        expires_at
    ) VALUES (
        p_document_id,
        p_user_id,
        p_permission_type,
        p_granted_by,
        p_expires_at
    ) ON CONFLICT (document_id, user_id, permission_type) DO UPDATE SET
        granted_by = EXCLUDED.granted_by,
        granted_at = NOW(),
        expires_at = EXCLUDED.expires_at
    RETURNING id INTO permission_id;
    
    -- Crear log
    INSERT INTO document_logs (document_id, action, user_id, details)
    VALUES (
        p_document_id,
        'shared',
        p_granted_by,
        jsonb_build_object(
            'permission_type', p_permission_type,
            'granted_to', p_user_id
        )
    );
    
    RETURN permission_id;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar documentos
CREATE OR REPLACE FUNCTION search_documents(
    p_search_term TEXT,
    p_document_type VARCHAR(50) DEFAULT NULL,
    p_category VARCHAR(50) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    search_results JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', d.id,
            'title', d.title,
            'description', d.description,
            'file_name', d.file_name,
            'file_type', d.file_type,
            'file_size', d.file_size,
            'document_type', d.document_type,
            'category', d.category,
            'status', d.status,
            'is_public', d.is_public,
            'version', d.version,
            'uploaded_by', d.uploaded_by,
            'created_at', d.created_at,
            'tags', (
                SELECT jsonb_agg(tag_name)
                FROM document_tags
                WHERE document_id = d.id
            )
        )
    )
    INTO search_results
    FROM documents d
    WHERE d.status = 'active'
    AND (
        p_search_term IS NULL OR
        d.title ILIKE '%' || p_search_term || '%' OR
        d.description ILIKE '%' || p_search_term || '%' OR
        d.file_name ILIKE '%' || p_search_term || '%'
    )
    AND (p_document_type IS NULL OR d.document_type = p_document_type)
    AND (p_category IS NULL OR d.category = p_category)
    AND (
        p_user_id IS NULL OR
        d.uploaded_by = p_user_id OR
        d.is_public = true OR
        EXISTS (
            SELECT 1 FROM document_permissions dp
            WHERE dp.document_id = d.id
            AND dp.user_id = p_user_id
        )
    )
    ORDER BY d.created_at DESC;
    
    RETURN COALESCE(search_results, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
