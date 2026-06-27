"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMode } from "./actions";

/**
 * Create-mode trigger. New modes ship disabled (a code mechanic is needed
 * before they do anything in the app), then are configured in the editor.
 */
export function NewModeButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim() || pending) return;
    const value = name.trim();
    startTransition(async () => {
      const result = await createMode(value);
      if (!result.ok) toast.error(result.message);
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" className="bg-brand text-brand-fg hover:bg-brand-deep">
        + New mode
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        placeholder="Ladder"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setOpen(false);
            setName("");
          }
        }}
        className="h-9 w-56"
        disabled={pending}
      />
      <Button onClick={submit} size="sm" disabled={pending || !name.trim()} className="bg-brand text-brand-fg hover:bg-brand-deep">
        {pending ? "Creating…" : "Create"}
      </Button>
      <Button onClick={() => { setOpen(false); setName(""); }} size="sm" variant="ghost" disabled={pending}>
        Cancel
      </Button>
    </div>
  );
}
