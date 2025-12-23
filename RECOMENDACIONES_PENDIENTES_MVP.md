# 📋 RECOMENDACIONES Y OPCIONES PARA PENDIENTES DEL MVP

**Fecha:** Diciembre 2025  
**Objetivo:** Proporcionar opciones técnicas claras para cada tarea pendiente del MVP

---

## 🎯 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

**Sugerencia:** Trabajar en este orden para maximizar valor y minimizar dependencias:

1. **Sistema de Calificaciones** (Más simple, base para otros)
2. **Sistema de Postulación y Asignación** (Core del negocio)
3. **Sistema de Certificados** (Mejora calidad de matching)
4. **Sistema de Chat** (Facilita coordinación)
5. **Sistema de Reportes de Incidencia** (Protección)
6. **Integración de Pagos** (Monetización)
7. **Frontend Completo** (Pulir experiencia)

---

## 1️⃣ SISTEMA DE CALIFICACIONES (Media Prioridad)

### 📊 **Estado Actual:**
- ✅ Tabla `event_ratings` creada
- ✅ Función SQL `calculate_worker_rating()` lista
- ❌ Falta UI y lógica de negocio

### 🎯 **Opciones de Implementación:**

#### **OPCIÓN A: Implementación Mínima (Recomendada para empezar)**
**Tiempo:** 2-3 días  
**Complejidad:** Baja

**Componentes:**
- Formulario simple post-evento (1 página)
- API `/api/events/[id]/rate` (POST)
- Cálculo automático de rating promedio
- Badge básico en perfil

**Ventajas:**
- Rápido de implementar
- Valor inmediato
- Base para mejoras futuras

**Desventajas:**
- UI básica
- Sin validaciones avanzadas

---

#### **OPCIÓN B: Implementación Completa**
**Tiempo:** 1 semana  
**Complejidad:** Media

**Componentes:**
- Formulario con validación en tiempo real
- Sistema de badges automáticos completo
- Historial de calificaciones
- Gráficos de rating en perfil
- Filtros por rating en búsqueda

**Ventajas:**
- Experiencia completa
- Más valor para usuarios
- Diferenciación competitiva

**Desventajas:**
- Más tiempo de desarrollo
- Más complejidad

---

#### **OPCIÓN C: Híbrida (Recomendada)**
**Tiempo:** 4-5 días  
**Complejidad:** Media-Baja

**Fase 1 (2 días):**
- Formulario básico
- API y cálculo de rating
- Badge simple

**Fase 2 (2-3 días):**
- Badges automáticos
- Filtros por rating
- Mejoras de UI

**Ventajas:**
- Entrega rápida de valor
- Iteración incremental
- Flexibilidad

---

### 🛠️ **Stack Técnico Recomendado:**

**Frontend:**
- React Hook Form para formulario
- Zod para validación (mínimo 10 palabras)
- Shadcn/ui Rating component (o crear uno simple)
- React Query para actualización optimista

**Backend:**
- API route: `/api/events/[id]/rate`
- Validación: evento completado, trabajador asignado
- Trigger SQL para actualizar rating promedio automáticamente

**Base de Datos:**
- Trigger en `event_ratings` para recalcular rating
- Vista materializada para ratings (opcional, para performance)

---

## 2️⃣ SISTEMA DE POSTULACIÓN Y ASIGNACIÓN (Alta Prioridad)

### 📊 **Estado Actual:**
- ✅ Tabla `event_workers` con campos necesarios
- ✅ Validaciones de disponibilidad en business rules
- ❌ Falta UI completa y flujo de postulación

### 🎯 **Opciones de Implementación:**

#### **OPCIÓN A: Flujo Simple (Recomendada para MVP)**
**Tiempo:** 1 semana  
**Complejidad:** Media

**Flujo:**
1. Empresa crea evento → Ve lista de trabajadores disponibles
2. Empresa selecciona trabajadores → Asigna directamente
3. Trabajador recibe notificación → Acepta/Rechaza
4. Si acepta: Chat se crea automáticamente

**Componentes:**
- Página `/events/[id]/assign-workers` (búsqueda y selección)
- API `/api/events/[id]/assign` (POST)
- API `/api/workers/assignments/[id]/accept` (PUT)
- Notificaciones automáticas

**Ventajas:**
- Simple y directo
- Rápido de implementar
- Cubre caso de uso principal

**Desventajas:**
- No hay postulación previa de trabajadores
- Menos control para trabajadores

---

#### **OPCIÓN B: Flujo con Postulación (Más Completo)**
**Tiempo:** 2-3 semanas  
**Complejidad:** Alta

**Flujo:**
1. Empresa crea evento → Publica
2. Trabajadores ven eventos disponibles → Postulan (máx 3)
3. Empresa ve postulaciones → Selecciona y asigna
4. Trabajador acepta → Chat se crea

**Componentes:**
- Página `/workers/available-events` (lista de eventos)
- API `/api/events/[id]/apply` (POST) - Postulación
- API `/api/events/[id]/applications` (GET) - Ver postulaciones
- API `/api/events/[id]/assign` (POST) - Asignar desde postulaciones
- Límite de 3 postulaciones simultáneas

**Ventajas:**
- Más control para trabajadores
- Mejor matching (trabajadores interesados)
- Escalable

**Desventajas:**
- Más complejo
- Más tiempo de desarrollo

---

#### **OPCIÓN C: Híbrida (Recomendada para MVP)**
**Tiempo:** 1.5 semanas  
**Complejidad:** Media-Alta

**Fase 1 (1 semana):**
- Flujo simple (Opción A)
- Asignación directa

**Fase 2 (3-4 días):**
- Agregar postulación opcional
- Trabajadores pueden postular antes de ser asignados

**Ventajas:**
- Entrega rápida
- Permite iteración
- Flexibilidad

---

### 🛠️ **Stack Técnico Recomendado:**

**Frontend:**
- Página de búsqueda con filtros (React Hook Form)
- Componente de tarjetas de trabajadores
- Modal de confirmación de asignación
- Página de "Mis Asignaciones" para trabajadores

**Backend:**
- API `/api/workers/available` (GET) - Búsqueda con filtros
- API `/api/events/[id]/assign` (POST) - Asignar trabajadores
- API `/api/workers/assignments` (GET) - Ver asignaciones del trabajador
- API `/api/workers/assignments/[id]/accept` (PUT) - Aceptar/rechazar

**Validaciones:**
- Disponibilidad (usar `validateWorkerAvailability`)
- Límite de postulaciones (3 simultáneas)
- Capacidad del evento

**Notificaciones:**
- Email/Notificación al asignar
- Email/Notificación al aceptar
- Notificación a empresa cuando trabajador acepta

---

## 3️⃣ SISTEMA DE CERTIFICADOS Y OCR (Alta Prioridad)

### 📊 **Estado Actual:**
- ✅ Tabla `worker_certificates` creada
- ❌ Falta subida de archivos
- ❌ Falta OCR
- ❌ Falta verificación manual

### 🎯 **Opciones de Implementación:**

#### **OPCIÓN A: Sin OCR (Más Rápido)**
**Tiempo:** 3-4 días  
**Complejidad:** Baja

**Componentes:**
- Formulario de subida (PDF/Imagen)
- Almacenamiento en Supabase Storage
- Panel superadmin para ver y verificar manualmente
- Badge "Certificado Validado" cuando está verificado

**Ventajas:**
- Rápido de implementar
- Control total del superadmin
- Sin dependencias externas

**Desventajas:**
- Proceso manual
- No extrae datos automáticamente

---

#### **OPCIÓN B: Con OCR Básico (Recomendada)**
**Tiempo:** 1 semana  
**Complejidad:** Media

**Componentes:**
- Subida de archivos
- OCR usando Tesseract.js (cliente) o Google Cloud Vision (servidor)
- Extracción de datos básicos (nombre, fecha, institución)
- Superadmin revisa y corrige si es necesario
- Badge automático cuando verificado

**Opciones de OCR:**
1. **Tesseract.js** (Cliente)
   - Gratis, open source
   - Procesa en el navegador
   - Menos preciso

2. **Google Cloud Vision API**
   - Más preciso
   - Requiere cuenta y pago
   - Procesa en servidor

3. **AWS Textract**
   - Muy preciso
   - Requiere cuenta AWS
   - Procesa en servidor

**Ventajas:**
- Automatización parcial
- Mejor experiencia
- Datos extraídos automáticamente

**Desventajas:**
- Requiere API externa (si usas Cloud Vision/Textract)
- Costo adicional (si usas servicio pago)

---

#### **OPCIÓN C: OCR Avanzado (Post-MVP)**
**Tiempo:** 2-3 semanas  
**Complejidad:** Alta

**Componentes:**
- OCR con múltiples proveedores
- Validación automática de certificados
- Integración con bases de datos de instituciones
- Verificación blockchain (futuro)

**Ventajas:**
- Máxima automatización
- Alta confiabilidad

**Desventajas:**
- Muy complejo
- Costo alto
- No necesario para MVP

---

### 🛠️ **Stack Técnico Recomendado (Opción B):**

**Frontend:**
- Componente de subida de archivos (react-dropzone)
- Preview del certificado
- Formulario para completar datos manualmente (si OCR falla)

**Backend:**
- API `/api/workers/certificates` (POST) - Subir certificado
- API `/api/workers/certificates/[id]/verify` (PUT) - Verificar (superadmin)
- Supabase Storage para archivos
- Google Cloud Vision API para OCR (opcional)

**Almacenamiento:**
- Supabase Storage bucket: `certificates`
- Estructura: `{worker_id}/{certificate_id}.pdf`

**OCR:**
- Si usas Tesseract.js: Procesar en cliente antes de subir
- Si usas Cloud Vision: Procesar en servidor después de subir

---

## 4️⃣ SISTEMA DE CHAT POR EVENTO (Media Prioridad)

### 📊 **Estado Actual:**
- ✅ Tabla `event_chats` creada
- ❌ Falta UI y lógica de tiempo real

### 🎯 **Opciones de Implementación:**

#### **OPCIÓN A: Chat con Polling (Más Simple)**
**Tiempo:** 3-4 días  
**Complejidad:** Baja

**Componentes:**
- API `/api/events/[id]/chat` (GET, POST)
- Interfaz de chat básica
- Polling cada 5-10 segundos para nuevos mensajes
- Indicadores de lectura básicos

**Ventajas:**
- Simple de implementar
- Sin dependencias externas
- Funciona con la infraestructura actual

**Desventajas:**
- No es tiempo real verdadero
- Más carga en servidor
- Peor experiencia de usuario

---

#### **OPCIÓN B: Chat con Supabase Realtime (Recomendada)**
**Tiempo:** 1 semana  
**Complejidad:** Media

**Componentes:**
- Supabase Realtime subscriptions
- Interfaz de chat moderna
- Indicadores de escritura
- Notificaciones de nuevos mensajes
- Historial de mensajes

**Ventajas:**
- Tiempo real verdadero
- Mejor experiencia
- Escalable
- Usa infraestructura de Supabase

**Desventajas:**
- Requiere configurar Realtime en Supabase
- Un poco más complejo

---

#### **OPCIÓN C: Chat con WebSockets Propio (No Recomendado para MVP)**
**Tiempo:** 2-3 semanas  
**Complejidad:** Alta

**Componentes:**
- Servidor WebSocket propio
- Gestión de conexiones
- Escalabilidad horizontal

**Ventajas:**
- Control total
- Personalizable

**Desventajas:**
- Muy complejo
- Requiere infraestructura adicional
- No necesario para MVP

---

### 🛠️ **Stack Técnico Recomendado (Opción B):**

**Frontend:**
- Componente de chat con Supabase Realtime
- React Hook para suscripción
- UI moderna (similar a WhatsApp/Telegram)
- Scroll automático a nuevos mensajes

**Backend:**
- API `/api/events/[id]/chat` (GET) - Historial
- Supabase Realtime para mensajes nuevos
- Trigger en `event_chats` para notificaciones

**Configuración Supabase:**
- Habilitar Realtime en tabla `event_chats`
- Políticas RLS para acceso al chat

---

## 5️⃣ SISTEMA DE REPORTES DE INCIDENCIA (Media Prioridad)

### 📊 **Estado Actual:**
- ✅ Tabla `incident_reports` creada
- ❌ Falta UI y lógica de suspensión

### 🎯 **Opciones de Implementación:**

#### **OPCIÓN A: Implementación Básica (Recomendada)**
**Tiempo:** 3-5 días  
**Complejidad:** Baja

**Componentes:**
- Formulario de reporte en página de evento
- API `/api/incidents` (POST)
- Lógica de suspensión automática (3 reportes = 30 días)
- Notificación a superadmin
- Panel superadmin para ver y gestionar

**Ventajas:**
- Rápido de implementar
- Cubre necesidad principal
- Automatización básica

**Desventajas:**
- UI básica
- Sin sistema de apelaciones avanzado

---

#### **OPCIÓN B: Implementación Completa**
**Tiempo:** 1-2 semanas  
**Complejidad:** Media

**Componentes:**
- Todo de Opción A +
- Sistema de apelaciones
- Historial completo de reportes
- Notificaciones a trabajador
- Dashboard de métricas de incidencias

**Ventajas:**
- Experiencia completa
- Más justo para trabajadores

**Desventajas:**
- Más tiempo
- Más complejidad

---

### 🛠️ **Stack Técnico Recomendado (Opción A):**

**Frontend:**
- Modal de reporte en página de evento
- Selector de tipo de incidencia
- Textarea para descripción
- Confirmación antes de enviar

**Backend:**
- API `/api/incidents` (POST) - Crear reporte
- API `/api/incidents` (GET) - Listar (superadmin)
- API `/api/incidents/[id]/resolve` (PUT) - Resolver (superadmin)
- Función SQL para contar reportes y suspender automáticamente
- Trigger en `incident_reports` para notificar superadmin

**Lógica de Suspensión:**
- Función SQL que cuenta reportes en últimos 90 días
- Si >= 3: Actualizar `workers.suspended_until` (nuevo campo)
- Notificar superadmin y trabajador

---

## 6️⃣ INTEGRACIÓN DE PAGOS (Alta Prioridad)

### 📊 **Estado Actual:**
- ✅ Tabla `subscriptions` creada
- ❌ Falta integración con pasarela
- ❌ Falta UI de pagos

### 🎯 **Opciones de Pasarela de Pagos:**

#### **OPCIÓN A: Flow (Recomendada para Chile)**
**Tiempo:** 1-2 semanas  
**Complejidad:** Media

**Ventajas:**
- Específica para Chile
- Acepta múltiples métodos (tarjeta, transferencia, Webpay)
- Buena documentación
- Comisiones competitivas

**Desventajas:**
- Solo funciona en Chile
- Requiere cuenta comercial

**Implementación:**
- SDK de Flow
- Webhooks para confirmación
- Página de checkout
- Gestión de suscripciones recurrentes

---

#### **OPCIÓN B: Stripe**
**Tiempo:** 1-2 semanas  
**Complejidad:** Media

**Ventajas:**
- Internacional
- Muy confiable
- Excelente documentación
- Muchas features

**Desventajas:**
- Comisiones más altas
- Menos métodos de pago en Chile

**Implementación:**
- Stripe SDK
- Stripe Checkout o Elements
- Webhooks
- Suscripciones recurrentes

---

#### **OPCIÓN C: Webpay (Transbank)**
**Tiempo:** 1 semana  
**Complejidad:** Media-Alta

**Ventajas:**
- Muy popular en Chile
- Acepta tarjetas y transferencias

**Desventajas:**
- Documentación menos clara
- Más complejo de integrar
- Requiere certificados

---

#### **OPCIÓN D: Mercado Pago**
**Tiempo:** 1 semana  
**Complejidad:** Baja-Media

**Ventajas:**
- Fácil de integrar
- Popular en Latinoamérica
- Buena documentación

**Desventajas:**
- Comisiones variables
- Menos control

---

### 🛠️ **Stack Técnico Recomendado (Flow):**

**Frontend:**
- Página `/subscription/checkout`
- Formulario de pago
- Confirmación de pago
- Estado de suscripción

**Backend:**
- API `/api/payments/create-intent` (POST) - Crear intención de pago
- API `/api/payments/webhook` (POST) - Recibir webhooks
- API `/api/subscriptions` (GET) - Ver suscripciones del usuario
- Actualizar `subscriptions` y `workers`/`employers` según pago

**Flujo:**
1. Usuario inicia pago → Crear intención en Flow
2. Usuario completa pago → Flow envía webhook
3. Sistema actualiza suscripción → Notificar usuario

---

## 7️⃣ FRONTEND COMPLETO (Alta Prioridad)

### 📊 **Estado Actual:**
- ⚠️ Modo DEMO activo en varias páginas
- ✅ Componentes base creados
- ❌ Falta activar modo real
- ❌ Falta completar páginas

### 🎯 **Opciones de Implementación:**

#### **OPCIÓN A: Activar Modo Real Incremental**
**Tiempo:** 2-3 semanas  
**Complejidad:** Media

**Estrategia:**
1. Activar modo real página por página
2. Comenzar con las más simples
3. Probar cada una antes de continuar

**Orden Sugerido:**
1. Dashboard (métricas reales)
2. Página de trabajadores (lista y detalle)
3. Página de eventos (lista)
4. Página de eventos (crear/editar)
5. Página de cotizaciones
6. Página de preregistros

**Ventajas:**
- Menos riesgo
- Iteración incremental
- Fácil de probar

---

#### **OPCIÓN B: Activar Todo de Una Vez**
**Tiempo:** 1 semana  
**Complejidad:** Alta

**Estrategia:**
- Descomentar todo el código de modo real
- Probar todo simultáneamente
- Corregir errores masivamente

**Ventajas:**
- Más rápido
- Cambio completo

**Desventajas:**
- Más riesgo
- Más difícil de debuggear
- Puede romper muchas cosas

---

### 🛠️ **Stack Técnico:**

**Frontend:**
- React Query para data fetching
- Optimistic updates donde sea posible
- Loading states
- Error handling
- Formularios con React Hook Form + Zod

**Componentes Necesarios:**
- DataTable para listas (usar shadcn/ui)
- Formularios consistentes
- Modales para confirmaciones
- Toasts para notificaciones

---

## 📊 RESUMEN DE RECOMENDACIONES

### 🎯 **Orden de Implementación Recomendado:**

1. **Sistema de Calificaciones** (Opción C - Híbrida) - 4-5 días
2. **Sistema de Postulación** (Opción C - Híbrida) - 1.5 semanas
3. **Sistema de Certificados** (Opción B - Con OCR básico) - 1 semana
4. **Sistema de Chat** (Opción B - Supabase Realtime) - 1 semana
5. **Reportes de Incidencia** (Opción A - Básica) - 3-5 días
6. **Integración de Pagos** (Opción A - Flow) - 1-2 semanas
7. **Frontend Completo** (Opción A - Incremental) - 2-3 semanas

### ⏱️ **Tiempo Total Estimado:**
**6-8 semanas** para completar todos los pendientes del MVP

### 💡 **Recomendación Final:**
Empezar con **Sistema de Calificaciones** porque:
- Es el más simple
- Proporciona valor inmediato
- Es base para otros sistemas (badges, filtros)
- Permite ganar momentum

---

**¿Con cuál quieres empezar?** 🚀
