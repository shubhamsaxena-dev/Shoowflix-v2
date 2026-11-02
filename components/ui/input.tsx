"use client";

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./input.module.css";

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required?: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** Read by Input/Select/Textarea so they wire up id, aria-describedby and aria-invalid automatically. */
export function useField() {
  return useContext(FieldContext);
}

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Override the generated control id. */
  id?: string;
  /** Element rendered at the right of the label row (e.g. "Forgot password?"). */
  labelAside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error, wired for screen readers. Wrap exactly one Input/Select/Textarea. */
export function Field({ label, hint, error, required, id, labelAside, className, children }: FieldProps) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <FieldContext.Provider value={{ id: controlId, describedBy, invalid: Boolean(error), required }}>
      <div className={cx(styles.field, className)} data-invalid={error ? "" : undefined}>
        <div className={styles.labelRow}>
          <label htmlFor={controlId} className={styles.label}>
            {label}
            {required ? (
              <span className={styles.required} aria-hidden>
                *
              </span>
            ) : null}
          </label>
          {labelAside}
        </div>
        {children}
        {error ? (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

export interface InputProps extends ComponentProps<"input"> {
  /** Icon or element rendered inside the input, left side. */
  leading?: ReactNode;
  /** Element rendered inside the input, right side (e.g. show-password button). */
  trailing?: ReactNode;
  invalid?: boolean;
}

export function Input({ leading, trailing, invalid, className, id, required, ...rest }: InputProps) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  return (
    <div className={cx(styles.control, leading ? styles.hasLeading : undefined, trailing ? styles.hasTrailing : undefined, className)}>
      {leading ? (
        <span className={styles.leading} aria-hidden>
          {leading}
        </span>
      ) : null}
      <input
        id={id ?? field?.id}
        required={required ?? field?.required}
        aria-invalid={isInvalid || undefined}
        aria-describedby={field?.describedBy}
        className={styles.input}
        {...rest}
      />
      {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
    </div>
  );
}

export function Textarea({ className, id, required, ...rest }: ComponentProps<"textarea">) {
  const field = useField();
  return (
    <textarea
      id={id ?? field?.id}
      required={required ?? field?.required}
      aria-invalid={field?.invalid || undefined}
      aria-describedby={field?.describedBy}
      className={cx(styles.input, styles.textarea, className)}
      {...rest}
    />
  );
}
