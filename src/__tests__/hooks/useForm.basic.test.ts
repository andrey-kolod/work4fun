// __tests__/hooks/useForm.basic.test.ts
import { renderHook, act } from '@testing-library/react';
import { useForm } from '@/hooks/useForm';

describe('useForm - Basic functionality', () => {
  it('should manage form state without validation schema', () => {
    const initialValues = { name: 'John', age: 25 };
    const { result } = renderHook(() => useForm(initialValues));

    // Проверяем инициализацию
    expect(result.current.formData).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});

    // Обновляем поле
    act(() => {
      result.current.updateField('name', 'Jane');
    });

    expect(result.current.formData.name).toBe('Jane');
    expect(result.current.formData.age).toBe(25);

    // Отмечаем поле как touched
    act(() => {
      result.current.setFieldTouched('name');
    });

    expect(result.current.touched.name).toBe(true);

    // Валидация без схемы всегда возвращает true
    let isValid = false;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(true);

    // Сброс формы
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('should handle multiple field updates', () => {
    const { result } = renderHook(() => useForm({ firstName: '', lastName: '' }));

    act(() => {
      result.current.updateField('firstName', 'John');
      result.current.updateField('lastName', 'Doe');
    });

    expect(result.current.formData.firstName).toBe('John');
    expect(result.current.formData.lastName).toBe('Doe');
  });
});
