"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import styles from "./auth.module.css";

export function PasswordInput(props: Omit<InputProps, "type" | "leading" | "trailing">) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      leading={<Lock />}
      trailing={
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setVisible((v) => !v)}
          aria-label="Show password"
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </button>
      }
    />
  );
}
