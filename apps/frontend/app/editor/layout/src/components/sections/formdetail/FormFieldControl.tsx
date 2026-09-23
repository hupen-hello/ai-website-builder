"use client";

import type { FormFieldData } from "../../../types/section";

type FormFieldControlProps = {
  field: FormFieldData;
  className: string;
  name?: string;
};

export default function FormFieldControl({
  field,
  className,
  name,
}: FormFieldControlProps) {
  if (field.type === "textarea") {
    return (
      <textarea
        name={name}
        className={`${className} min-h-28 py-3`}
        placeholder={field.placeholder ?? field.label}
        required
      />
    );
  }

  const isPhone = field.type === "tel";

  return (
    <input
      name={name}
      type={field.type === "email" ? "email" : isPhone ? "tel" : "text"}
      inputMode={isPhone ? "numeric" : undefined}
      pattern={isPhone ? "[0-9]*" : undefined}
      onInput={
        isPhone
          ? (event) => {
              event.currentTarget.value = event.currentTarget.value.replace(
                /\D/g,
                "",
              );
            }
          : undefined
      }
      className={className}
      placeholder={field.placeholder ?? field.label}
      required={field.type === "email" || isPhone}
    />
  );
}
