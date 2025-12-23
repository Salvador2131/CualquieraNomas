import { useState, useEffect } from "react";
import { z } from "zod";

/**
 * Hook para validación en tiempo real de formularios
 */
export function useFormValidation<T extends z.ZodTypeAny>(
  schema: T,
  initialData?: Partial<z.infer<T>>
) {
  const [data, setData] = useState<Partial<z.infer<T>>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: any) => {
    try {
      // Crear un objeto temporal con solo el campo a validar
      const tempData = { ...data, [field]: value };

      // Validar el campo específico
      const fieldSchema = schema.shape?.[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }

      // Si no hay schema específico, intentar validar todo el objeto
      schema.parse(tempData);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find((e) => e.path.includes(field));
        if (fieldError) {
          setErrors((prev) => ({
            ...prev,
            [field]: fieldError.message,
          }));
          return false;
        }
      }
      return false;
    }
  };

  const handleChange = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));

    // Validar solo si el campo ya fue tocado
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, data[field]);
  };

  const validateAll = (): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          if (field) {
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);

        // Marcar todos los campos como tocados
        const allTouched: Record<string, boolean> = {};
        Object.keys(newErrors).forEach((key) => {
          allTouched[key] = true;
        });
        setTouched(allTouched);
      }
      return false;
    }
  };

  const reset = (newData?: Partial<z.infer<T>>) => {
    setData(newData || {});
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setData,
    isValid: Object.keys(errors).length === 0,
  };
}
