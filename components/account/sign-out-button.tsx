"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

export function SignOutButton({
  variant = "danger",
  size = "md",
  callbackUrl = "/",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  callbackUrl?: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      loading={pending}
      onClick={() => {
        setPending(true);
        void signOut({ callbackUrl });
      }}
    >
      {pending ? null : <LogOut aria-hidden />}
      Sign out
    </Button>
  );
}
