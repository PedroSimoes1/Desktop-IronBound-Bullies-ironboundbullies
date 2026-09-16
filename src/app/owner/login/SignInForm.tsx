"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type ActionResult } from "@/app/owner/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/controls";
import styles from "./login.module.css";

/**
 * The sign-in form.
 *
 * The only client component in the owner area that has to be one: it needs the
 * pending state while the server checks the password, which takes a deliberate
 * fraction of a second.
 *
 * autoComplete is set properly on both fields so a password manager fills them
 * and the owner never has to type a long password on a phone keyboard.
 */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? "Checking" : "Sign in"}
    </Button>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(signInAction, null);

  /**
   * The email is held here rather than left to the browser.
   *
   * React clears an uncontrolled field after a Server Action returns, so a
   * mistyped password would also wipe the email address. On a phone that means
   * typing it again every attempt, and the next submission arrives with an
   * empty email, so the owner is told to fill the form in instead of being told
   * the password was wrong. The password is deliberately not kept.
   */
  const [email, setEmail] = useState("");

  return (
    <form action={action} className={styles.form} noValidate>
      <input type="hidden" name="next" value={next} />

      <Field label="Email" requirement="none">
        {(ids) => (
          <Input
            {...ids}
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        )}
      </Field>

      <Field label="Password" requirement="none">
        {(ids) => <Input {...ids} type="password" name="password" autoComplete="current-password" required />}
      </Field>

      {state && !state.ok && (
        <p className={["body-sm", styles.error].join(" ")} role="alert">
          {state.message}
        </p>
      )}

      <div className={styles.submit}>
        <SubmitButton />
      </div>

      <p className={["body-sm", styles.help].join(" ")}>
        Accounts are set up by the site administrator. If you cannot get in, ask them to reset your password rather than trying again.
      </p>
    </form>
  );
}
