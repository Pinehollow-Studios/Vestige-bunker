"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVersion } from "./actions";

/**
 * Create-version trigger. Tap → inline version prompt → creates a draft row and
 * the action redirects into its editor. Mirrors NewAnnouncementButton.
 */
export function NewVersionButton() {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!version.trim() || pending) return;
    const value = version.trim();
    startTransition(async () => {
      const result = await createVersion(value);
      if (!result.ok) toast.error(result.message);
    });
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="bg-brand text-brand-fg hover:bg-brand-deep"
      >
        + New version
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        placeholder="0.1.3"
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") {
            setOpen(false);
            setVersion("");
          }
        }}
        className="h-9 w-32"
        disabled={pending}
      />
      <Button
        onClick={submit}
        size="sm"
        disabled={pending || !version.trim()}
        className="bg-brand text-brand-fg hover:bg-brand-deep"
      >
        {pending ? "Creating…" : "Create"}
      </Button>
      <Button
        onClick={() => {
          setOpen(false);
          setVersion("");
        }}
        size="sm"
        variant="ghost"
        disabled={pending}
      >
        Cancel
      </Button>
    </div>
  );
}
