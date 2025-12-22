# 📋 Reglas de Negocio - Guía de Implementación

Este directorio contiene todas las reglas de negocio críticas para asegurar la operación correcta del sistema ERP.

## 🎯 Objetivo

Implementar validaciones y controles que garanticen:

- ✅ Integridad de datos financieros
- ✅ Prevención de errores operacionales
- ✅ Cumplimiento de reglas de negocio
- ✅ Seguridad y control de acceso
- ✅ Trazabilidad y auditoría

## 📁 Estructura

```
lib/business-rules/
├── README.md (este archivo)
├── financial.ts          # Validaciones financieras (cotizaciones, pagos)
├── assignments.ts         # Control de asignaciones de trabajadores
├── events.ts             # Validaciones de eventos
├── salaries.ts           # Control de salarios
├── quotes.ts             # Gestión de cotizaciones
├── conflicts.ts          # Prevención de conflictos
├── audit.ts              # Sistema de auditoría
├── authorization.ts      # Control de acceso por rol
└── transactions.ts      # Operaciones transaccionales
```

## 🚀 Cómo Usar

### 1. Importar la regla necesaria

```typescript
import { validateQuoteCalculation } from "@/lib/business-rules/financial";
```

### 2. Validar antes de guardar

```typescript
export const POST = async (request: NextRequest) => {
  const body = await request.json();

  // Validar reglas de negocio
  const validation = validateQuoteCalculation(body);

  if (!validation.isValid) {
    return NextResponse.json(
      {
        error: "Errores de validación",
        details: validation.errors,
      },
      { status: 400 }
    );
  }

  // Continuar con la creación...
};
```

### 3. Integrar en APIs existentes

Ver `LOGICAS_NEGOCIO_CRITICAS.md` para ejemplos completos de integración.

## 📝 Prioridades de Implementación

### ✅ Prioridad Alta (Implementar Primero)

1. **financial.ts** - Validaciones de cotizaciones y pagos
2. **assignments.ts** - Control de disponibilidad de trabajadores
3. **events.ts** - Validaciones de fechas y estados
4. **authorization.ts** - Control de acceso por rol

### ⚠️ Prioridad Media

5. **audit.ts** - Sistema de auditoría
6. **conflicts.ts** - Prevención de conflictos
7. **salaries.ts** - Validaciones de salarios

### ⚪ Prioridad Baja

8. **quotes.ts** - Auto-expiración de cotizaciones
9. **transactions.ts** - Operaciones transaccionales complejas

## 🧪 Testing

Cada regla debe tener tests unitarios:

```typescript
// __tests__/business-rules/financial.test.ts
import { validateQuoteCalculation } from "@/lib/business-rules/financial";

describe("validateQuoteCalculation", () => {
  it("debe rechazar cotizaciones con cálculos incorrectos", () => {
    const quote = {
      services: [{ quantity: 2, unit_price: 100, total: 200 }],
      subtotal: 200,
      taxes: 38, // Correcto: 200 * 0.19
      total: 238, // Correcto: 200 + 38
    };

    const result = validateQuoteCalculation(quote);
    expect(result.isValid).toBe(true);
  });
});
```

## 📚 Documentación

Ver `LOGICAS_NEGOCIO_CRITICAS.md` para documentación completa de cada regla.
