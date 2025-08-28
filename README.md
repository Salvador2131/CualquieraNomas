# Web erp system

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/lastsalva-9654s-projects/v0-web-erp-system)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/4y1iMh4StDc)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/lastsalva-9654s-projects/v0-web-erp-system](https://vercel.com/lastsalva-9654s-projects/v0-web-erp-system)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/4y1iMh4StDc](https://v0.app/chat/projects/4y1iMh4StDc)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

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
