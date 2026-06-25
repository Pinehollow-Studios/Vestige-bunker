import { CommandTrigger } from "@/components/admin/CommandTrigger";
import { MobileNav } from "@/components/admin/MobileNav";
import { PageContext } from "@/components/admin/PageContext";
import { QuickCreate } from "@/components/admin/QuickCreate";
import { AttentionBell } from "@/components/admin/AttentionBell";
import { AccountMenu } from "@/components/admin/AccountMenu";
import { type AdminUser, adminDisplayLabel, adminInitials } from "@/lib/auth/requireAdmin";
import type { AdminEnvKey } from "@/lib/supabase/env";

type Props = {
  admin: AdminUser;
  env: AdminEnvKey;
  devSwitchEnabled: boolean;
  counts?: Record<string, number | undefined>;
};

export function TopBar({ admin, env, devSwitchEnabled, counts }: Props) {
  const label = adminDisplayLabel(admin);
  const initials = adminInitials(admin);
  const secondary = admin.username && admin.displayName ? `@${admin.username}` : admin.email ?? null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border/70 bg-paper-raised/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav counts={counts} />
        <PageContext />
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <CommandTrigger />
        <QuickCreate />
        <AttentionBell
          feedback={counts?.feedback}
          photos={counts?.photos}
          safeguarding={counts?.safeguarding}
        />
        <AccountMenu
          label={label}
          secondary={secondary}
          initials={initials}
          role={admin.role}
          env={env}
          devSwitchEnabled={devSwitchEnabled}
        />
      </div>
    </header>
  );
}
