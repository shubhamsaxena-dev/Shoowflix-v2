"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cx } from "@/lib/movie-utils";
import styles from "./auth.module.css";

/**
 * N single-digit boxes that behave like one field: typing moves forward, Backspace moves
 * back, arrows move between boxes, and pasting or SMS/email autofill ("123456") fills them all.
 * The first box carries autoComplete="one-time-code" so iOS and Android can offer the code.
 */
export function PinInput({
  length = 6,
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  autoFocus,
  describedBy,
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  describedBy?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focus = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const commit = (next: string, focusAt: number) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    focus(focusAt);
    if (clean.length === length) onComplete?.(clean);
  };

  /** Write `text` starting at box `i` (one typed digit, or a pasted/autofilled code). */
  const fill = (i: number, text: string) => {
    const incoming = text.replace(/\D/g, "");
    if (!incoming) return;
    // A full code always replaces everything, wherever it lands.
    if (incoming.length >= length) return commit(incoming, length - 1);
    // Digits stay contiguous: typing into an empty box past the end lands at the end.
    const start = Math.min(i, value.length);
    commit(value.slice(0, start) + incoming + value.slice(start + incoming.length), start + incoming.length);
  };

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
        focus(i);
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const onPaste = (i: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fill(i, e.clipboardData.getData("text"));
  };

  return (
    <div className={styles.pin} role="group" aria-label={`${length}-digit code`} aria-describedby={describedBy}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={cx(styles.pinBox, invalid ? styles.pinInvalid : undefined)}
          name={i === 0 ? "code" : undefined}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          // The first box accepts a whole code from autofill; the rest hold one digit.
          maxLength={i === 0 ? length : 1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => fill(i, e.target.value.replace(digit, "") || e.target.value)}
          onKeyDown={onKeyDown(i)}
          onPaste={onPaste(i)}
        />
      ))}
    </div>
  );
}
