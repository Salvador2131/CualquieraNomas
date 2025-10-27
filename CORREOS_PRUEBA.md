# Correos de Prueba - ERP Banquetes

## 📧 Configuración de Email Principal

- **Email Principal**: lastsalva@gmail.com
- **Rol**: Administrador principal

## 👥 Usuarios de Prueba por Rol

### 🔑 Administradores

- **lastsalva@gmail.com** - Administrador principal
- **admin1@banquetes.com** - Administrador secundario
- **admin2@banquetes.com** - Administrador de eventos

### 👷 Trabajadores

- **worker1@banquetes.com** - Garzón principal
- **worker2@banquetes.com** - Bartender
- **worker3@banquetes.com** - Supervisor de eventos
- **worker4@banquetes.com** - Personal de cocina

### 👤 Clientes (Preregistros)

- **cliente1@ejemplo.com** - Cliente corporativo
- **cliente2@ejemplo.com** - Cliente particular
- **cliente3@ejemplo.com** - Cliente VIP

## ⚙️ Configuración .env.local

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Configuración de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Configuración de Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=lastsalva@gmail.com
SMTP_PASS=tu-app-password-aqui

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🔐 Configuración de Gmail

Para que funcione el email con Gmail:

1. **Habilitar 2FA** en tu cuenta de Google
2. **Generar App Password**:
   - Ve a Google Account > Security > 2-Step Verification
   - Busca "App passwords" y genera una nueva
   - Usa esa contraseña en `SMTP_PASS`

## 🧪 Flujo de Prueba

### 1. Preregistro Público

- Usar correos de clientes para enviar preregistros
- Verificar notificaciones en admin

### 2. Aprobación de Eventos

- Login como admin (lastsalva@gmail.com)
- Aprobar preregistros
- Verificar emails a clientes

### 3. Asignación de Trabajadores

- Crear eventos
- Asignar trabajadores
- Verificar notificaciones

### 4. Prueba de Email

- Usar el panel de configuración
- Enviar email de prueba a cualquier correo

## 📝 Notas Importantes

- **No usar correos reales** para pruebas en desarrollo
- **Gmail App Password** es diferente a la contraseña normal
- **Reiniciar servidor** después de cambiar .env.local
- **Verificar spam** si no llegan los emails

## 🔄 Estados de Prueba

### Preregistros

- Pendiente → En Revisión → Aprobado/Rechazado

### Eventos

- Planificación → En Progreso → Completado

### Notificaciones

- Sistema (in-app) + Email (opcional)

## 📊 Monitoreo

- **Logs del servidor** para errores de email
- **Panel de notificaciones** para estado en tiempo real
- **Base de datos** para verificar registros
