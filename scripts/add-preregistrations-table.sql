-- Crear tabla de preregistros
CREATE TABLE IF NOT EXISTS preregistrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Información de contacto
  nombre_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  empresa VARCHAR(255),
  
  -- Detalles del evento
  tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN ('Boda', 'Corporativo', 'Fiesta', 'Quinceañera', 'Otro')),
  fecha_estimada DATE NOT NULL,
  numero_invitados INTEGER NOT NULL CHECK (numero_invitados > 0),
  ubicacion TEXT NOT NULL,
  servicios_requeridos TEXT[], -- Array de servicios
  presupuesto_estimado DECIMAL(10,2),
  comentarios_adicionales TEXT,
  
  -- Metadata
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
  id_administrador_asignado UUID REFERENCES users(id),
  historial_comentarios JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_preregistrations_estado ON preregistrations(estado);
CREATE INDEX IF NOT EXISTS idx_preregistrations_fecha_solicitud ON preregistrations(fecha_solicitud);
CREATE INDEX IF NOT EXISTS idx_preregistrations_email ON preregistrations(email);
CREATE INDEX IF NOT EXISTS idx_preregistrations_tipo_evento ON preregistrations(tipo_evento);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_preregistrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
CREATE TRIGGER trigger_update_preregistrations_updated_at
  BEFORE UPDATE ON preregistrations
  FOR EACH ROW
  EXECUTE FUNCTION update_preregistrations_updated_at();

-- Insertar datos de ejemplo
INSERT INTO preregistrations (
  nombre_completo,
  email,
  telefono,
  empresa,
  tipo_evento,
  fecha_estimada,
  numero_invitados,
  ubicacion,
  servicios_requeridos,
  presupuesto_estimado,
  comentarios_adicionales,
  estado
) VALUES 
(
  'María González',
  'maria.gonzalez@email.com',
  '+1-555-0101',
  'González & Asociados',
  'Boda',
  '2024-06-15',
  150,
  'Hotel Plaza, Salón Principal',
  ARRAY['catering', 'decoracion', 'musica', 'fotografia'],
  15000.00,
  'Boda de día completo, necesitamos coordinación completa',
  'pendiente'
),
(
  'Carlos Rodríguez',
  'carlos.rodriguez@techcorp.com',
  '+1-555-0102',
  'TechCorp Solutions',
  'Corporativo',
  '2024-07-20',
  80,
  'Centro de Convenciones, Auditorio A',
  ARRAY['catering', 'audiovisual', 'decoracion'],
  8000.00,
  'Evento de lanzamiento de producto, necesitamos tecnología audiovisual',
  'en_revision'
),
(
  'Ana Martínez',
  'ana.martinez@email.com',
  '+1-555-0103',
  NULL,
  'Quinceañera',
  '2024-08-10',
  120,
  'Salón de Fiestas El Dorado',
  ARRAY['catering', 'decoracion', 'musica', 'fotografia', 'entretenimiento'],
  12000.00,
  'Quinceañera temática de princesa, necesitamos decoración especial',
  'aprobado'
);

-- Comentarios sobre la tabla
COMMENT ON TABLE preregistrations IS 'Tabla para almacenar solicitudes de preregistro de eventos';
COMMENT ON COLUMN preregistrations.estado IS 'Estado del preregistro: pendiente, en_revision, aprobado, rechazado';
COMMENT ON COLUMN preregistrations.servicios_requeridos IS 'Array de servicios solicitados: catering, decoracion, musica, fotografia, etc.';
COMMENT ON COLUMN preregistrations.historial_comentarios IS 'JSON array con historial de comentarios y cambios de estado';