"use client";

import { Moon, Sun } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { useTheme } from "@/hooks/use-theme";
import styles from "./profile.module.css";

export function ThemeSetting() {
  const { theme, setTheme } = useTheme();
  return (
    <div className={styles.chips} role="group" aria-label="Theme">
      <Chip pressed={theme === "dark"} onPressedChange={() => setTheme("dark")} icon={<Moon aria-hidden />}>
        Projection (dark)
      </Chip>
      <Chip pressed={theme === "light"} onPressedChange={() => setTheme("light")} icon={<Sun aria-hidden />}>
        Matinee (light)
      </Chip>
    </div>
  );
}
