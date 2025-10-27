-- Crear tabla de eventos con checklist
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Información básica del evento
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN ('Boda', 'Corporativo', 'Fiesta', 'Quinceañera', 'Otro')),
  fecha_evento DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  ubicacion TEXT NOT NULL,
  numero_invitados INTEGER NOT NULL CHECK (numero_invitados > 0),
  
  -- Información del cliente
  cliente_nombre VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255) NOT NULL,
  cliente_telefono VARCHAR(20),
  cliente_empresa VARCHAR(255),
  
  -- Presupuesto y pagos
  presupuesto_total DECIMAL(10,2),
  presupuesto_pagado DECIMAL(10,2) DEFAULT 0,
  estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'parcial', 'completo')),
  
  -- Estado del evento
  estado VARCHAR(20) DEFAULT 'planificacion' CHECK (estado IN ('planificacion', 'en_progreso', 'completado', 'cancelado')),
  
  -- Checklist del evento (JSON)
  checklist JSONB DEFAULT '{
    "recursos_humanos": {
      "garzones_requeridos": 0,
      "garzones_asignados": 0,
      "bartenders_requeridos": 0,
      "bartenders_asignados": 0,
      "personal_cocina_requerido": 0,
      "personal_cocina_asignado": 0,
      "supervisores_requeridos": 0,
      "supervisores_asignados": 0,
      "completado": false
    },
    "equipamiento_mobiliario": {
      "mesas_sillas_requeridas": 0,
      "mesas_sillas_asignadas": 0,
      "manteleria_vajilla_requerida": false,
      "manteleria_vajilla_asignada": false,
      "equipos_especializados_requeridos": [],
      "equipos_especializados_asignados": [],
      "material_decoracion_requerido": [],
      "material_decoracion_asignado": [],
      "completado": false
    },
    "alimentacion_bebidas": {
      "menu_aprobado": false,
      "lista_bebidas_aprobada": false,
      "restricciones_alimenticias": [],
      "proveedores_confirmados": [],
      "completado": false
    },
    "aspectos_logisticos": {
      "transporte_equipos": false,
      "horarios_montaje": "",
      "horarios_desmontaje": "",
      "permisos_requeridos": [],
      "permisos_obtenidos": [],
      "plan_contingencia": "",
      "completado": false
    }
  }'::jsonb,
  
  -- Servicios contratados
  servicios_contratados TEXT[],
  
  -- Notas y comentarios
  notas_internas TEXT,
  notas_cliente TEXT,
  
  -- Referencia al preregistro original
  preregistro_id UUID REFERENCES preregistrations(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de asignaciones de trabajadores a eventos
CREATE TABLE IF NOT EXISTS event_worker_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol VARCHAR(100) NOT NULL, -- garzon, bartender, supervisor, etc.
  fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado VARCHAR(20) DEFAULT 'asignado' CHECK (estado IN ('asignado', 'confirmado', 'completado', 'cancelado')),
  notas TEXT,
  UNIQUE(event_id, worker_id, rol)
);

-- Crear tabla de tareas del checklist
CREATE TABLE IF NOT EXISTS event_checklist_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  categoria VARCHAR(50) NOT NULL, -- recursos_humanos, equipamiento_mobiliario, etc.
  tarea VARCHAR(255) NOT NULL,
  descripcion TEXT,
  completada BOOLEAN DEFAULT FALSE,
  responsable_id UUID REFERENCES users(id),
  fecha_limite DATE,
  fecha_completada TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_events_fecha_evento ON events(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_events_estado ON events(estado);
CREATE INDEX IF NOT EXISTS idx_events_cliente_email ON events(cliente_email);
CREATE INDEX IF NOT EXISTS idx_events_preregistro_id ON events(preregistro_id);
CREATE INDEX IF NOT EXISTS idx_event_worker_assignments_event_id ON event_worker_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_worker_assignments_worker_id ON event_worker_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_event_checklist_tasks_event_id ON event_checklist_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_checklist_tasks_categoria ON event_checklist_tasks(categoria);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Insertar datos de ejemplo
INSERT INTO events (
  titulo,
  descripcion,
  tipo_evento,
  fecha_evento,
  hora_inicio,
  hora_fin,
  ubicacion,
  numero_invitados,
  cliente_nombre,
  cliente_email,
  cliente_telefono,
  presupuesto_total,
  estado,
  servicios_contratados,
  notas_internas
) VALUES 
(
  'Boda María & Carlos',
  'Boda de día completo con ceremonia y recepción',
  'Boda',
  '2024-06-15',
  '16:00:00',
  '02:00:00',
  'Hotel Plaza, Salón Principal',
  150,
  'María González',
  'maria.gonzalez@email.com',
  '+1-555-0101',
  15000.00,
  'planificacion',
  ARRAY['catering', 'decoracion', 'musica', 'fotografia'],
  'Evento de alta prioridad, cliente VIP'
),
(
  'Evento Corporativo TechCorp',
  'Lanzamiento de producto con presentación ejecutiva',
  'Corporativo',
  '2024-07-20',
  '18:00:00',
  '22:00:00',
  'Centro de Convenciones, Auditorio A',
  80,
  'Carlos Rodríguez',
  'carlos.rodriguez@techcorp.com',
  '+1-555-0102',
  8000.00,
  'en_progreso',
  ARRAY['catering', 'audiovisual', 'decoracion'],
  'Necesita tecnología audiovisual especializada'
);

-- Comentarios sobre las tablas
COMMENT ON TABLE events IS 'Tabla principal de eventos con checklist integrado';
COMMENT ON TABLE event_worker_assignments IS 'Asignaciones de trabajadores a eventos específicos';
COMMENT ON TABLE event_checklist_tasks IS 'Tareas específicas del checklist por evento';
COMMENT ON COLUMN events.checklist IS 'JSON con el estado del checklist del evento';
COMMENT ON COLUMN events.estado IS 'Estado del evento: planificacion, en_progreso, completado, cancelado';
COMMENT ON COLUMN event_worker_assignments.rol IS 'Rol específico del trabajador en el evento';
