# 📋 INSTRUCCIONES PARA EJECUTAR SCRIPT QUOTES

## 🎯 PROBLEMA

Existe una tabla `quotes` antigua con estructura diferente a la requerida por la aplicación.

## ✅ SOLUCIÓN

Ejecutar el script **`3_CREAR_TABLA_QUOTES_FIXED.sql`** que:

1. Elimina la tabla antigua
2. Crea la nueva tabla con el esquema correcto
3. Crea índices y triggers

---

## 📝 PASOS PARA EJECUTAR

### 1. Abrir Supabase SQL Editor

```
https://supabase.com/dashboard/project/hjtarzunzoedgpsniqc/editor
```

### 2. Abrir el archivo

```
scripts/3_CREAR_TABLA_QUOTES_FIXED.sql
```

### 3. Copiar todo el contenido

(Ctrl+A, Ctrl+C o Cmd+A, Cmd+C)

### 4. Pegar en el SQL Editor de Supabase

(Ctrl+V o Cmd+V)

### 5. Ejecutar

(Clic en "Run" o F5)

### 6. Verificar resultado

Debería mostrar:

```
✅ Tabla quotes creada exitosamente con nuevo esquema
total_columnas: 17
```

---

## ⚠️ IMPORTANTE

- **Este script eliminará cualquier dato existente en la tabla quotes antigua**
- Si tienes datos importantes en quotes, respáldalos primero
- El script usa CASCADE para eliminar dependencias

---

## ✅ RESULTADO ESPERADO

Después de ejecutar:

- ✅ Tabla `quotes` creada con 17 columnas
- ✅ Índices creados (5 índices)
- ✅ Trigger para `updated_at` configurado
- ✅ API `/api/quotes` funcionará correctamente
- ✅ Página `/quote` funcionará correctamente

---

## 🔍 VERIFICACIÓN POST-EJECUCIÓN

Ejecutar en Supabase:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quotes'
ORDER BY ordinal_position;
```

Deberías ver 17 columnas incluyendo:

- client_name
- client_email
- subtotal
- taxes
- total
- expiration_date
- services (JSONB)

---

## ✅ LISTO PARA CONTINUAR

Una vez ejecutado, el sistema estará 100% funcional!
