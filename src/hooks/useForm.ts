// hooks/useForm.ts
import { useState, useCallback } from 'react';

interface UseFormReturn<T> {
  formData: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  updateField: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T) => void;
  validateForm: () => boolean;
  setFormData: (data: T) => void;
  resetForm: () => void;
}

export function useForm<T>(initialState: T, validationSchema?: any): UseFormReturn<T> {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ПЕРЕМЕЩАЕМ validateField ВВЕРХ, чтобы избежать ошибки доступа
  const validateField = useCallback(
    (field: string, value: any) => {
      if (!validationSchema) return;

      try {
        validationSchema.pick({ [field]: true }).parse({ [field]: value });
        setErrors((prev) => ({ ...prev, [field]: '' }));
      } catch (error) {
        if (error instanceof Error && 'errors' in error) {
          const zodError = error as any;
          if (zodError.errors && zodError.errors[0]) {
            setErrors((prev) => ({
              ...prev,
              [field]: zodError.errors[0].message || 'Invalid value',
            }));
          }
        } else {
          setErrors((prev) => ({
            ...prev,
            [field]: 'Invalid value',
          }));
        }
      }
    },
    [validationSchema]
  );

  const updateField = useCallback(
    (field: keyof T, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Валидация при изменении
      if (validationSchema && touched[field as string]) {
        validateField(field as string, value);
      }
    },
    [validationSchema, touched, validateField]
  ); // ДОБАВЛЯЕМ validateField в зависимости

  const setFieldTouched = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field as string]: true }));
      validateField(field as string, (formData as any)[field]);
    },
    [formData, validateField]
  );

  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      const newErrors: Record<string, string> = {};
      if (error instanceof Error && 'errors' in error) {
        const zodError = error as any;
        if (zodError.errors) {
          zodError.errors.forEach((err: any) => {
            if (err.path && err.path[0]) {
              newErrors[err.path[0]] = err.message;
            }
          });
        }
      }
      setErrors(newErrors);
      return false;
    }
  }, [formData, validationSchema]);

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  return {
    formData,
    errors,
    touched,
    updateField,
    setFieldTouched,
    validateForm,
    setFormData,
    resetForm,
  };
}
