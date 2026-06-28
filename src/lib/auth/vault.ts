/**
 * Coordination keys for the vault gate (see `components/admin/VaultGate`).
 *
 * Both live in **sessionStorage**, which is scoped to a single tab and wiped
 * when that tab is closed — that is the whole mechanism behind "log out when
 * the tab closes". The login screen stamps these the moment a sign-in is
 * attempted; the gate reads them on the first dashboard paint.
 *
 * - `VAULT_TAB_KEY`   — "this tab has authenticated". Absent on a freshly
 *   opened tab, so the gate ends the session and forces a re-login.
 * - `VAULT_UNLOCK_KEY` — "play the full vault-opening sequence once". Consumed
 *   on the first paint after a successful sign-in.
 */
export const VAULT_TAB_KEY = "bunker.session.tab";
export const VAULT_UNLOCK_KEY = "bunker.session.unlock";
