import { useState, useCallback } from "react";

interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isDirty: boolean;
}

interface UseFormOptions<T> {
  initialValues: T;
  validation?: (values: T) => Record<keyof T, string>;
  onSubmit: (values: T) => void | Promise<void>;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validation,
  onSubmit,
}: UseFormOptions<T>) => {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {} as Record<keyof T, string>,
    touched: {} as Record<keyof T, boolean>,
    isDirty: false,
  });

  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setFormState((prev) => {
        const newValues = { ...prev.values, [field]: value };
        const newErrors = validation ? validation(newValues) : prev.errors;
        const newTouched = { ...prev.touched, [field]: true };
        const isDirty = Object.keys(newTouched).some(
          (key) =>
            newTouched[key as keyof T] && newValues[key] !== initialValues[key],
        );

        return {
          values: newValues,
          errors: newErrors,
          touched: newTouched,
          isDirty,
        };
      });
    },
    [initialValues, validation],
  );

  const handleBlur = useCallback((field: keyof T) => {
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      const newErrors = validation
        ? validation(formState.values)
        : formState.errors;
      const hasErrors = Object.values(newErrors).some((error) => error);

      if (hasErrors) {
        setFormState((prev) => ({ ...prev, errors: newErrors }));
        return;
      }

      try {
        await onSubmit(formState.values);
        setFormState({
          values: initialValues,
          errors: {} as Record<keyof T, string>,
          touched: {} as Record<keyof T, boolean>,
          isDirty: false,
        });
      } catch (err) {
        console.error("Form submission error:", err);
      }
    },
    [formState.values, initialValues, validation, onSubmit],
  );

  const reset = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {} as Record<keyof T, string>,
      touched: {} as Record<keyof T, boolean>,
      isDirty: false,
    });
  }, [initialValues]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isDirty: formState.isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
};
