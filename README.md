# ERP Sistema de Gestión para Banquetes

Sistema completo de gestión empresarial para empresas de banquetes y eventos, desarrollado con Next.js, React, TypeScript y Supabase.

## 🚀 Características Principales

- **Dashboard Administrativo**: Estadísticas en tiempo real y gestión completa
- **Gestión de Trabajadores**: CRUD completo con filtros avanzados y calificaciones
- **Gestión de Empleadores**: Control de clientes y eventos
- **Calendario de Eventos**: Visualización y gestión de eventos
- **Sistema de Cotizaciones**: Calculadora automática de precios
- **Landing Page**: Página de marketing profesional
- **Galería de Eventos**: Showcase de trabajos realizados
- **Sistema de Preregistro**: Captación de leads
- **Autenticación**: Sistema de login con roles (Admin/Trabajador)

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI, Shadcn/ui
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Validación**: Zod
- **Testing**: Vitest

## Configuración de Supabase

### 1. Crear Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto con:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
\`\`\`

### 2. Configurar Base de Datos

En el SQL Editor de Supabase, ejecutar en orden:

1. **Crear tablas**: `scripts/create-tables.sql`
2. **Insertar datos**: `scripts/insert-data.sql`
3. **Tabla de preregistros**: Ver sección "SQL para Preregistros" abajo

### 3. Verificar Conexión

Una vez configurado, el dashboard mostrará:

- ✅ Datos reales de la base de datos
- ✅ Estadísticas actualizadas
- ✅ Mensaje de confirmación de conexión

### Obtener Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings > API
4. Copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

## 👥 Usuarios de Prueba

### Sistema de Autenticación

El sistema incluye usuarios de prueba para testing:

| Rol            | Email                | Contraseña  | Acceso                                     |
| -------------- | -------------------- | ----------- | ------------------------------------------ |
| **Admin**      | `admin@ejemplo.com`  | `admin123`  | Dashboard completo, gestión total          |
| **Trabajador** | `worker@ejemplo.com` | `worker123` | Dashboard de trabajador, eventos asignados |

### Cómo Usar

1. Ve a `/auth/login`
2. Usa cualquiera de las credenciales de arriba
3. El sistema te redirigirá automáticamente según tu rol

## 📊 SQL para Preregistros

Ejecuta este SQL en Supabase para habilitar el sistema de preregistros:

```sql
-- Tabla para preregistros
CREATE TABLE IF NOT EXISTS preregistrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    guest_count VARCHAR(50) NOT NULL,
    services TEXT[] NOT NULL,
    estimated_budget DECIMAL(12,2) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'contacted', 'converted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_preregistrations_email ON preregistrations(email);
CREATE INDEX IF NOT EXISTS idx_preregistrations_status ON preregistrations(status);
CREATE INDEX IF NOT EXISTS idx_preregistrations_event_date ON preregistrations(event_date);
CREATE INDEX IF NOT EXISTS idx_preregistrations_created_at ON preregistrations(created_at);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_preregistrations_updated_at
    BEFORE UPDATE ON preregistrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos preregistros de ejemplo
INSERT INTO preregistrations (full_name, email, phone, event_type, event_date, guest_count, services, estimated_budget, message, status) VALUES
('María González', 'maria.gonzalez@email.com', '+1234567890', 'boda', '2024-06-15', '101-200', ARRAY['catering', 'decoracion', 'personal'], 8500.00, 'Boda en jardín con temática romántica', 'pending'),
('Carlos Rodríguez', 'carlos.rodriguez@empresa.com', '+1234567891', 'corporativo', '2024-05-20', '51-100', ARRAY['catering', 'mobiliario', 'musica'], 4200.00, 'Evento de lanzamiento de producto', 'processed'),
('Ana Martínez', 'ana.martinez@email.com', '+1234567892', 'quinceañera', '2024-07-10', '101-200', ARRAY['catering', 'decoracion', 'personal', 'musica'], 7200.00, 'Quinceañera con temática de princesa', 'contacted'),
('Luis Fernández', 'luis.fernandez@email.com', '+1234567893', 'fiesta', '2024-08-05', '1-50', ARRAY['catering', 'musica'], 1800.00, 'Cumpleaños de 50 años', 'pending'),
('Patricia López', 'patricia.lopez@email.com', '+1234567894', 'boda', '2024-09-12', '200+', ARRAY['catering', 'decoracion', 'personal', 'musica', 'fotografia'], 15000.00, 'Boda de lujo en hotel', 'pending');
```

## 🚀 Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# El servidor estará disponible en http://localhost:3000
```

## 📱 Páginas Disponibles

- **`/`** - Dashboard principal
- **`/landing`** - Landing page de marketing
- **`/gallery`** - Galería de eventos
- **`/preregister`** - Formulario de preregistro
- **`/auth/login`** - Sistema de autenticación
- **`/workers`** - Gestión de trabajadores
- **`/employers`** - Gestión de empleadores
- **`/calendar`** - Calendario de eventos
- **`/quote`** - Calculadora de cotizaciones

## 🎯 Modelo de Negocio

**Single-tenant**: Sistema dedicado para una banquetera

- Precio sugerido: $500-2000/mes
- Personalización total
- Control completo de la plataforma
