# 🔒 Nota sobre RLS (Row Level Security) en Desarrollo

## ⚠️ Estado Actual

**RLS está desactivado** en la mayoría de las tablas para facilitar el desarrollo rápido.

El linter de Supabase reporta **26 tablas** sin RLS habilitado, lo cual es un **riesgo de seguridad** si la aplicación está en producción.

## 📋 Tablas Afectadas

Las siguientes tablas no tienen RLS habilitado:

1. `users`
2. `workers`
3. `employers`
4. `events`
5. `preregistrations`
6. `quotes`
7. `worker_salaries`
8. `penalties`
9. `penalty_logs`
10. `penalty_appeals`
11. `conflicts`
12. `conflict_logs`
13. `backups`
14. `backup_logs`
15. `notifications`
16. `notification_logs`
17. `ratings`
18. `messages`
19. `payments`
20. `worker_certificates`
21. `event_ratings`
22. `event_workers`
23. `event_chats`
24. `subscriptions`
25. `incident_reports`
26. `document_expiry_notifications`
27. `document_validations`
28. `document_validation_logs`

## 🛡️ Protección Actual

Aunque RLS está desactivado, el sistema tiene protección a nivel de aplicación:

- ✅ **Filtrado por `organization_id`** en todas las APIs
- ✅ **Autenticación requerida** en endpoints protegidos
- ✅ **Validación de permisos** por rol (admin, worker, employer)
- ✅ **Service Role Key** solo en servidor (no expuesta al cliente)

**Esto es suficiente para desarrollo**, pero **NO para producción**.

## 🔧 Soluciones

### Opción 1: Habilitar RLS Básico (Desarrollo)

Ejecuta la migración:
```sql
supabase/migrations/20251223020000_enable_rls_basic.sql
```

Esta migración:
- ✅ Habilita RLS en todas las tablas
- ✅ Crea políticas permisivas para desarrollo
- ✅ Cumple con las recomendaciones del linter
- ⚠️ **NO es segura para producción**

### Opción 2: Habilitar RLS Completo (Producción)

1. Descomentar la migración:
   ```
   supabase/migrations/20251222222149_phase2_multi_tenant_rls_policies.sql
   ```

2. Ejecutarla en Supabase SQL Editor

3. Eliminar las políticas de desarrollo de la Opción 1

Esta migración:
- ✅ Habilita RLS con políticas específicas por tabla
- ✅ Filtra por `organization_id`
- ✅ Respeta roles de usuario
- ✅ **Segura para producción**

### Opción 3: Mantener RLS Desactivado (Solo Desarrollo)

Si estás solo en desarrollo y no planeas ir a producción pronto:

- ✅ Mantén RLS desactivado
- ✅ Acepta las advertencias del linter
- ✅ Asegúrate de que las APIs filtren correctamente
- ⚠️ **Habilita RLS antes de producción**

## 📝 Recomendación

**Para desarrollo rápido:**
- Usa la **Opción 1** (RLS básico permisivo)
- Esto silencia las advertencias del linter
- Permite desarrollo sin restricciones

**Para producción:**
- Usa la **Opción 2** (RLS completo)
- Implementa políticas específicas
- Protege los datos adecuadamente

## 🚀 Próximos Pasos

1. **Ahora (Desarrollo):**
   - Ejecutar `20251223020000_enable_rls_basic.sql`
   - Verificar que el linter ya no reporte errores

2. **Antes de Producción:**
   - Ejecutar `20251222222149_phase2_multi_tenant_rls_policies.sql`
   - Eliminar políticas de desarrollo
   - Probar que todo funciona correctamente

## 📚 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS Linter](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
