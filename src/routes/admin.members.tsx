import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  ShieldCheck,
  KeyRound,
  X,
  Copy,
  Check,
  Ban,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/bunker/Logo";
import { Panel } from "@/components/bunker/Panel";
import { BunkerButton } from "@/components/bunker/BunkerButton";
import { BunkerInput } from "@/components/bunker/BunkerInput";
import { getAdminSession, clearAdminSession } from "@/lib/admin-session";
import {
  adminListMembers,
  adminCreateMember,
  adminUpdateMember,
  adminSuspendMember,
  adminDeleteMember,
  type MemberRow,
  type MemberUpdates,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/members")({
  head: () => ({
    meta: [
      { title: "Admin — Members" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMembersPage,
});

const RANKS = ["Rookie", "OG", "BLACK"];
const STATUSES = ["active", "suspended"];
const ROLES = ["member", "admin"];

function AdminMembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [deleting, setDeleting] = useState<MemberRow | null>(null);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    passId: string;
    password: string;
  } | null>(null);
  const adminSession = getAdminSession();
  const currentAdminPassId = adminSession?.passId.trim().toUpperCase() ?? "";
  const activeAdminCount = useMemo(
    () => members.filter((m) => m.role === "admin" && m.status === "active").length,
    [members],
  );

  // Guard: must be admin
  useEffect(() => {
    if (!getAdminSession()) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  async function refresh() {
    setLoading(true);
    try {
      const rows = await adminListMembers();
      setMembers(rows);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load members";
      toast.error(msg);
      if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("not signed")) {
        clearAdminSession();
        navigate({ to: "/login" });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.pass_id.toLowerCase().includes(q) ||
        (m.player_name ?? "").toLowerCase().includes(q),
    );
  }, [members, search]);

  function handleLogout() {
    clearAdminSession();
    navigate({ to: "/login" });
  }

  function isSelf(m: MemberRow) {
    return m.pass_id.trim().toUpperCase() === currentAdminPassId;
  }

  function isLastActiveAdmin(m: MemberRow) {
    return m.role === "admin" && m.status === "active" && activeAdminCount <= 1;
  }

  async function handleSuspend(m: MemberRow) {
    if (isSelf(m)) {
      toast.error("You cannot suspend your own account");
      return;
    }
    if (isLastActiveAdmin(m)) {
      toast.error("Cannot suspend the last remaining admin");
      return;
    }
    setSuspendingId(m.id);
    try {
      await adminSuspendMember(m.id);
      toast.success(`${m.pass_id} suspended`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suspend failed");
    } finally {
      setSuspendingId(null);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 hud-grid opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--background)_78%)]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/8 bg-black/40 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden md:flex items-center gap-2 rounded-md border border-neon/40 bg-neon/5 px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-neon" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-neon">
              Admin Console
            </span>
          </div>
          <AdminTabs active="members" />
        </div>
        <div className="flex items-center gap-2">
          <BunkerButton
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </BunkerButton>
          <BunkerButton variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </BunkerButton>
        </div>
      </header>

      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex-1 max-w-md">
          <BunkerInput
            name="search"
            placeholder="Search by Pass ID or Player Name"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {filtered.length} / {members.length} Members
          </span>
          <BunkerButton onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Create Member
          </BunkerButton>
        </div>
      </div>

      {/* Table */}
      <main className="relative z-10 flex-1 overflow-hidden px-6 pb-6">
        <Panel className="flex h-full flex-col overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.6fr_0.6fr_0.8fr_0.8fr_1fr_1.6fr] gap-3 border-b border-white/8 bg-black/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <span>Pass ID</span>
            <span>Player Name</span>
            <span>Rank</span>
            <span>XP</span>
            <span>Gold</span>
            <span>Status</span>
            <span>Role</span>
            <span>Created</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Loading roster…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-6 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                No members found.
              </div>
            )}
            {!loading &&
              filtered.map((m) => {
                const self = isSelf(m);
                const lastAdmin = isLastActiveAdmin(m);
                const canDelete = !self && !lastAdmin;
                const canSuspend = !self && !lastAdmin && m.status === "active";
                return (
                <div
                  key={m.id}
                  className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.6fr_0.6fr_0.8fr_0.8fr_1fr_1.6fr] items-center gap-3 border-b border-white/5 px-4 py-2.5 text-sm text-foreground hover:bg-white/[0.02]"
                >
                  <span className="font-mono text-neon">{m.pass_id}</span>
                  <span className="truncate">{m.player_name ?? <em className="text-muted-foreground">— unset —</em>}</span>
                  <span className="font-mono uppercase tracking-widest text-xs">{m.rank}</span>
                  <span className="font-mono">{m.xp}</span>
                  <span className="font-mono">{m.gold}</span>
                  <span>
                    <span
                      className={cn(
                        "rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                        m.status === "active"
                          ? "bg-neon/15 text-neon"
                          : "bg-red-500/15 text-red-400",
                      )}
                    >
                      {m.status}
                    </span>
                  </span>
                  <span>
                    <span
                      className={cn(
                        "rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                        m.role === "admin"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-white/8 text-muted-foreground",
                      )}
                    >
                      {m.role}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex justify-end gap-1">
                    <BunkerButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(m)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </BunkerButton>
                    <button
                      type="button"
                      onClick={() => void handleSuspend(m)}
                      disabled={!canSuspend || suspendingId === m.id}
                      title={
                        self
                          ? "Cannot suspend your own account"
                          : lastAdmin
                            ? "Cannot suspend the last admin"
                            : m.status !== "active"
                              ? "Already suspended"
                              : "Suspend member"
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Ban className="h-3 w-3" />
                      {suspendingId === m.id ? "…" : "Suspend"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(m)}
                      disabled={!canDelete}
                      title={
                        self
                          ? "Cannot delete your own account"
                          : lastAdmin
                            ? "Cannot delete the last admin"
                            : "Delete member"
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-red-400 transition-colors hover:border-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
                );
              })}
          </div>
        </Panel>
      </main>

      {creating && (
        <CreateMemberDialog
          onClose={() => setCreating(false)}
          onCreated={(row, tempPassword) => {
            setCreating(false);
            setCreatedCredentials({ passId: row.pass_id, password: tempPassword });
            void refresh();
          }}
        />
      )}

      {editing && (
        <EditMemberDialog
          member={editing}
          canSuspend={!isSelf(editing) && !isLastActiveAdmin(editing) && editing.status === "active"}
          canDelete={!isSelf(editing) && !isLastActiveAdmin(editing)}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void refresh();
          }}
          onSuspend={async () => {
            const target = editing;
            setEditing(null);
            await handleSuspend(target);
          }}
          onDelete={() => {
            const target = editing;
            setEditing(null);
            setDeleting(target);
          }}
        />
      )}

      {createdCredentials && (
        <CredentialsDialog
          creds={createdCredentials}
          onClose={() => setCreatedCredentials(null)}
        />
      )}

      {deleting && (
        <DeleteMemberDialog
          member={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}

// -------------- Create Member Dialog --------------

function CreateMemberDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: MemberRow, tempPassword: string) => void;
}) {
  const [passId, setPassId] = useState("");
  const [password, setPassword] = useState("");
  const [rank, setRank] = useState("Rookie");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanPassId = passId.trim().toUpperCase();
    if (!cleanPassId) return setError("Pass ID is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setSubmitting(true);
    try {
      const row = await adminCreateMember({
        pass_id: cleanPassId,
        password,
        rank,
        status,
      });
      toast.success("Member created.");
      onCreated(row, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create member";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title="Create Member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        <BunkerInput
          name="pass_id"
          label="Stoner Pass ID"
          placeholder="e.g. STONER007"
          value={passId}
          onChange={(e) => setPassId(e.target.value)}
          required
        />
        <BunkerInput
          name="password"
          label="Temporary Password"
          type="text"
          icon={<KeyRound className="h-4 w-4" />}
          placeholder="min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Rank" value={rank} onChange={setRank} options={RANKS} />
          <SelectField label="Status" value={status} onChange={setStatus} options={STATUSES} />
        </div>
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs uppercase tracking-widest text-red-300">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <BunkerButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </BunkerButton>
          <BunkerButton type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create Member"}
          </BunkerButton>
        </div>
      </form>
    </ModalShell>
  );
}

// -------------- Edit Member Dialog --------------

function EditMemberDialog({
  member,
  canSuspend,
  canDelete,
  onClose,
  onSaved,
  onSuspend,
  onDelete,
}: {
  member: MemberRow;
  canSuspend: boolean;
  canDelete: boolean;
  onClose: () => void;
  onSaved: () => void;
  onSuspend: () => void | Promise<void>;
  onDelete: () => void;
}) {
  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState(member.player_name ?? "");
  const [characterId, setCharacterId] = useState(member.character_id ?? "");
  const [rank, setRank] = useState(member.rank);
  const [status, setStatus] = useState(member.status);
  const [role, setRole] = useState(member.role);
  const [xp, setXp] = useState(member.xp);
  const [gold, setGold] = useState(member.gold);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const updates: MemberUpdates = {
      player_name: playerName,
      character_id: characterId,
      rank,
      status,
      role,
      xp,
      gold,
    };
    if (password.trim().length > 0) {
      if (password.length < 6) {
        setError("New password must be at least 6 characters.");
        setSubmitting(false);
        return;
      }
      updates.password = password;
    }
    try {
      await adminUpdateMember(member.id, updates);
      toast.success("Member updated.");
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update member";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function applyXp(delta: number) {
    setXp((v) => Math.max(0, v + delta));
  }
  function applyGold(delta: number) {
    setGold((v) => Math.max(0, v + delta));
  }

  return (
    <ModalShell title={`Edit — ${member.pass_id}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        <BunkerInput
          name="password"
          label="Reset Password (leave blank to keep)"
          type="text"
          placeholder="min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <BunkerInput
            name="player_name"
            label="Player Name"
            placeholder="empty to reset"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <BunkerInput
            name="character_id"
            label="Character ID"
            placeholder="empty to reset"
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Rank" value={rank} onChange={setRank} options={RANKS} />
          <SelectField label="Status" value={status} onChange={setStatus} options={STATUSES} />
          <SelectField label="Role" value={role} onChange={setRole} options={ROLES} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberStepper label="XP" value={xp} onChange={setXp} onDelta={applyXp} />
          <NumberStepper label="Gold" value={gold} onChange={setGold} onDelta={applyGold} />
        </div>
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs uppercase tracking-widest text-red-300">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void onSuspend()}
              disabled={!canSuspend}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Ban className="h-3.5 w-3.5" />
              Suspend Member
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={!canDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-red-400 transition-colors hover:border-red-400 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Member
            </button>
          </div>
          <div className="flex gap-2">
            <BunkerButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </BunkerButton>
            <BunkerButton type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </BunkerButton>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

// -------------- Credentials Dialog --------------

function CredentialsDialog({
  creds,
  onClose,
}: {
  creds: { passId: string; password: string };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }
  return (
    <ModalShell title="Member Credentials" onClose={onClose}>
      <div className="flex flex-col gap-4 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon">
          Share these credentials with the customer.
        </p>
        <CredRow label="Stoner Pass ID" value={creds.passId} copiedKey="pass" copied={copied} onCopy={() => copy("pass", creds.passId)} />
        <CredRow label="Temporary Password" value={creds.password} copiedKey="pw" copied={copied} onCopy={() => copy("pw", creds.password)} />
        <div className="flex justify-end">
          <BunkerButton onClick={onClose}>Done</BunkerButton>
        </div>
      </div>
    </ModalShell>
  );
}

function CredRow({
  label,
  value,
  copiedKey,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copiedKey: string;
  copied: string | null;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/60 px-3 py-2">
        <span className="font-mono text-lg text-neon">{value}</span>
        <button
          type="button"
          onClick={onCopy}
          className="text-muted-foreground transition-colors hover:text-neon"
        >
          {copied === copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// -------------- Helpers --------------

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <Panel className="w-full max-w-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
          <span className="font-mono text-xs uppercase tracking-[0.4em] text-neon">
            {title}
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </Panel>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-white/10 bg-black/60 px-3 py-2 font-mono text-sm uppercase tracking-widest text-foreground focus:border-neon focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberStepper({
  label,
  value,
  onChange,
  onDelta,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  onDelta: (delta: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDelta(-100)}
          className="rounded-md border border-white/10 bg-black/60 px-2 py-1 font-mono text-xs text-muted-foreground hover:border-neon hover:text-neon"
        >
          -100
        </button>
        <button
          type="button"
          onClick={() => onDelta(-10)}
          className="rounded-md border border-white/10 bg-black/60 px-2 py-1 font-mono text-xs text-muted-foreground hover:border-neon hover:text-neon"
        >
          -10
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full rounded-md border border-white/10 bg-black/60 px-3 py-1.5 text-center font-mono text-sm text-foreground focus:border-neon focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onDelta(10)}
          className="rounded-md border border-white/10 bg-black/60 px-2 py-1 font-mono text-xs text-muted-foreground hover:border-neon hover:text-neon"
        >
          +10
        </button>
        <button
          type="button"
          onClick={() => onDelta(100)}
          className="rounded-md border border-white/10 bg-black/60 px-2 py-1 font-mono text-xs text-muted-foreground hover:border-neon hover:text-neon"
        >
          +100
        </button>
      </div>
    </div>
  );
}

// -------------- Delete Member Dialog --------------

function DeleteMemberDialog({
  member,
  onClose,
  onDeleted,
}: {
  member: MemberRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete =
    confirmText.trim().toUpperCase() === member.pass_id.trim().toUpperCase();

  async function handleDelete() {
    if (!canDelete) return;
    setError(null);
    setSubmitting(true);
    try {
      await adminDeleteMember(member.id);
      toast.success(`${member.pass_id} deleted`);
      onDeleted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title="Delete Member?" onClose={onClose}>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3 rounded-md border border-red-500/40 bg-red-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <div className="font-mono text-sm uppercase tracking-[0.25em] text-red-300">
              This action cannot be undone.
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              The member row will be permanently removed from the database. Related orders are kept.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 rounded-md border border-white/10 bg-black/40 p-3 text-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Pass ID
            </dt>
            <dd className="font-mono text-neon">{member.pass_id}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Player Name
            </dt>
            <dd className="truncate">
              {member.player_name ?? <em className="text-muted-foreground">— unset —</em>}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Role
            </dt>
            <dd className="font-mono uppercase tracking-widest text-xs">{member.role}</dd>
          </div>
        </dl>

        <BunkerInput
          name="confirm"
          label={`Type "${member.pass_id}" to confirm`}
          placeholder={member.pass_id}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoFocus
        />

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs uppercase tracking-widest text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <BunkerButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </BunkerButton>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={!canDelete || submitting}
            className="inline-flex items-center gap-2 rounded-md border border-red-500/60 bg-red-500/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.3em] text-red-300 transition-colors hover:border-red-400 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
            {submitting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
