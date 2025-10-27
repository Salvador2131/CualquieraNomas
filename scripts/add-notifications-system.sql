-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Información del destinatario
  destinatario_id UUID, -- Puede ser user_id o email para clientes
  destinatario_tipo VARCHAR(20) NOT NULL CHECK (destinatario_tipo IN ('admin', 'worker', 'client')),
  destinatario_email VARCHAR(255), -- Para clientes que no tienen cuenta
  
  -- Contenido de la notificación
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'nuevo_evento', 'evento_aprobado', 'evento_rechazado', 'evento_cancelado',
    'asignacion_personal', 'checklist_completado', 'recordatorio_evento',
    'cambio_estado', 'nuevo_preregistro', 'mensaje_importante'
  )),
  
  -- Referencias
  evento_id UUID REFERENCES events(id) ON DELETE CASCADE,
  preregistro_id UUID REFERENCES preregistrations(id) ON DELETE CASCADE,
  
  -- Estado de la notificación
  leida BOOLEAN DEFAULT FALSE,
  enviada BOOLEAN DEFAULT FALSE,
  metodo_envio VARCHAR(20) DEFAULT 'sistema' CHECK (metodo_envio IN ('sistema', 'email', 'push')),
  
  -- Metadatos
  datos_adicionales JSONB,
  fecha_envio TIMESTAMP WITH TIME ZONE,
  fecha_lectura TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de plantillas de email
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  asunto VARCHAR(255) NOT NULL,
  contenido_html TEXT NOT NULL,
  contenido_texto TEXT,
  variables JSONB, -- Variables disponibles para la plantilla
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de configuración de notificaciones
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tipo_notificacion VARCHAR(50) NOT NULL,
  email_habilitado BOOLEAN DEFAULT TRUE,
  sistema_habilitado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tipo_notificacion)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_destinatario ON notifications(destinatario_id, destinatario_tipo);
CREATE INDEX IF NOT EXISTS idx_notifications_evento ON notifications(evento_id);
CREATE INDEX IF NOT EXISTS idx_notifications_preregistro ON notifications(preregistro_id);
CREATE INDEX IF NOT EXISTS idx_notifications_leida ON notifications(leida);
CREATE INDEX IF NOT EXISTS idx_notifications_tipo ON notifications(tipo);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para updated_at
CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Insertar plantillas de email por defecto
INSERT INTO email_templates (nombre, asunto, contenido_html, contenido_texto, variables) VALUES 
(
  'nuevo_evento_worker',
  'Nuevo Evento Asignado - {{evento_titulo}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nuevo Evento Asignado</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">Nuevo Evento Asignado</h2>
    <p>Hola {{worker_nombre}},</p>
    <p>Se te ha asignado un nuevo evento:</p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">{{evento_titulo}}</h3>
      <p><strong>Fecha:</strong> {{evento_fecha}}</p>
      <p><strong>Hora:</strong> {{evento_hora}}</p>
      <p><strong>Ubicación:</strong> {{evento_ubicacion}}</p>
      <p><strong>Invitados:</strong> {{evento_invitados}}</p>
      <p><strong>Rol:</strong> {{worker_rol}}</p>
    </div>
    
    <p>Por favor revisa los detalles en tu dashboard y confirma tu disponibilidad.</p>
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="{{dashboard_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Ver Dashboard
      </a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Saludos,<br>
      Equipo ERP Banquetes
    </p>
  </div>
</body>
</html>',
  'Nuevo Evento Asignado - {{evento_titulo}}

Hola {{worker_nombre}},

Se te ha asignado un nuevo evento:

{{evento_titulo}}
Fecha: {{evento_fecha}}
Hora: {{evento_hora}}
Ubicación: {{evento_ubicacion}}
Invitados: {{evento_invitados}}
Rol: {{worker_rol}}

Por favor revisa los detalles en tu dashboard y confirma tu disponibilidad.

Dashboard: {{dashboard_url}}

Saludos,
Equipo ERP Banquetes',
  '["worker_nombre", "evento_titulo", "evento_fecha", "evento_hora", "evento_ubicacion", "evento_invitados", "worker_rol", "dashboard_url"]'::jsonb
),
(
  'evento_aprobado_cliente',
  'Tu Evento ha sido Aprobado - {{evento_titulo}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Evento Aprobado</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #059669;">¡Tu Evento ha sido Aprobado!</h2>
    <p>Hola {{cliente_nombre}},</p>
    <p>Nos complace informarte que tu solicitud de evento ha sido aprobada:</p>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="margin-top: 0; color: #059669;">{{evento_titulo}}</h3>
      <p><strong>Fecha:</strong> {{evento_fecha}}</p>
      <p><strong>Hora:</strong> {{evento_hora}}</p>
      <p><strong>Ubicación:</strong> {{evento_ubicacion}}</p>
      <p><strong>Invitados:</strong> {{evento_invitados}}</p>
    </div>
    
    <p>Nuestro equipo se pondrá en contacto contigo pronto para coordinar los detalles finales.</p>
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="{{contacto_url}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Contactar Equipo
      </a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      ¡Gracias por confiar en nosotros!<br>
      Equipo ERP Banquetes
    </p>
  </div>
</body>
</html>',
  '¡Tu Evento ha sido Aprobado!

Hola {{cliente_nombre}},

Nos complace informarte que tu solicitud de evento ha sido aprobada:

{{evento_titulo}}
Fecha: {{evento_fecha}}
Hora: {{evento_hora}}
Ubicación: {{evento_ubicacion}}
Invitados: {{evento_invitados}}

Nuestro equipo se pondrá en contacto contigo pronto para coordinar los detalles finales.

Contacto: {{contacto_url}}

¡Gracias por confiar en nosotros!
Equipo ERP Banquetes',
  '["cliente_nombre", "evento_titulo", "evento_fecha", "evento_hora", "evento_ubicacion", "evento_invitados", "contacto_url"]'::jsonb
),
(
  'nuevo_preregistro_admin',
  'Nueva Solicitud de Evento - {{cliente_nombre}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nueva Solicitud de Evento</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #dc2626;">Nueva Solicitud de Evento</h2>
    <p>Hola {{admin_nombre}},</p>
    <p>Se ha recibido una nueva solicitud de evento que requiere tu revisión:</p>
    
    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin-top: 0; color: #dc2626;">{{evento_titulo}}</h3>
      <p><strong>Cliente:</strong> {{cliente_nombre}}</p>
      <p><strong>Email:</strong> {{cliente_email}}</p>
      <p><strong>Teléfono:</strong> {{cliente_telefono}}</p>
      <p><strong>Fecha Estimada:</strong> {{evento_fecha}}</p>
      <p><strong>Invitados:</strong> {{evento_invitados}}</p>
      <p><strong>Presupuesto:</strong> ${{evento_presupuesto}}</p>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
      <a href="{{admin_dashboard_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Revisar Solicitud
      </a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Saludos,<br>
      Sistema ERP Banquetes
    </p>
  </div>
</body>
</html>',
  'Nueva Solicitud de Evento - {{cliente_nombre}}

Hola {{admin_nombre}},

Se ha recibido una nueva solicitud de evento que requiere tu revisión:

{{evento_titulo}}
Cliente: {{cliente_nombre}}
Email: {{cliente_email}}
Teléfono: {{cliente_telefono}}
Fecha Estimada: {{evento_fecha}}
Invitados: {{evento_invitados}}
Presupuesto: ${{evento_presupuesto}}

Revisar: {{admin_dashboard_url}}

Saludos,
Sistema ERP Banquetes',
  '["admin_nombre", "evento_titulo", "cliente_nombre", "cliente_email", "cliente_telefono", "evento_fecha", "evento_invitados", "evento_presupuesto", "admin_dashboard_url"]'::jsonb
);

-- Insertar configuraciones por defecto para usuarios existentes
INSERT INTO notification_settings (user_id, tipo_notificacion, email_habilitado, sistema_habilitado)
SELECT 
  u.id,
  'nuevo_evento',
  true,
  true
FROM users u
WHERE u.role = 'worker';

INSERT INTO notification_settings (user_id, tipo_notificacion, email_habilitado, sistema_habilitado)
SELECT 
  u.id,
  'nuevo_preregistro',
  true,
  true
FROM users u
WHERE u.role = 'admin';

-- Comentarios sobre las tablas
COMMENT ON TABLE notifications IS 'Sistema de notificaciones para usuarios y clientes';
COMMENT ON TABLE email_templates IS 'Plantillas de email para diferentes tipos de notificaciones';
COMMENT ON TABLE notification_settings IS 'Configuraciones de notificaciones por usuario';
COMMENT ON COLUMN notifications.destinatario_tipo IS 'Tipo de destinatario: admin, worker, client';
COMMENT ON COLUMN notifications.tipo IS 'Tipo de notificación: nuevo_evento, evento_aprobado, etc.';
COMMENT ON COLUMN notifications.metodo_envio IS 'Método de envío: sistema, email, push';
