"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateName, type NameFormState } from "./actions";
import styles from "./profile.module.css";

const initial: NameFormState = { status: "idle" };

export function NameForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState(updateName, initial);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === "saved") toast({ title: "Name saved", tone: "success", duration: 3000 });
  }, [state, toast]);

  return (
    <form action={action} className={styles.nameForm}>
      <Field
        label="Display name"
        hint="Shown on your profile. The account menu updates next time you sign in."
        error={state.status === "error" ? state.message : undefined}
        className={styles.nameField}
      >
        <Input name="name" defaultValue={state.name ?? defaultName} autoComplete="name" maxLength={60} required />
      </Field>
      <Button type="submit" variant="secondary" loading={pending} className={styles.nameSubmit}>
        Save name
      </Button>
    </form>
  );
}
