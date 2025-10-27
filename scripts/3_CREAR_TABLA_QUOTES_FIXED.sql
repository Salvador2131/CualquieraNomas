-- =====================================================
-- TABLA: quotes (COTIZACIONES - VERSIÓN CORREGIDA)
-- =====================================================
-- Este script verifica si existe una tabla antigua y la reemplaza
-- con la nueva estructura requerida por la aplicación

-- PRIMERO: Verificar si existe la tabla antigua
DO $$
BEGIN
    -- Si existe la tabla antigua, eliminarla
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quotes'
    ) THEN
        -- Eliminar índices primero si existen
        DROP INDEX IF EXISTS idx_quotes_event_id;
        DROP INDEX IF EXISTS idx_quotes_status;
        DROP INDEX IF EXISTS idx_quotes_event_date;
        
        -- Eliminar tabla antigua
        DROP TABLE public.quotes CASCADE;
        
        RAISE NOTICE 'Tabla quotes antigua eliminada';
    END IF;
END
$$;

-- SEGUNDO: Crear la tabla con el esquema correcto
CREATE TABLE public.quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    event_type TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count >= 1),
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    services JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    taxes NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TERCERO: Crear índices
CREATE INDEX idx_quotes_client_email ON quotes(client_email);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_event_id ON quotes(event_id);
CREATE INDEX idx_quotes_event_date ON quotes(event_date);
CREATE INDEX idx_quotes_expiration_date ON quotes(expiration_date);

-- CUARTO: Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at 
    BEFORE UPDATE ON quotes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- QUINTO: Verificación final
SELECT 
    '✅ Tabla quotes creada exitosamente con nuevo esquema' as mensaje,
    COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'quotes';

