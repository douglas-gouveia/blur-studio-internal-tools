"use client";

import { useState, useTransition } from "react";
import type { UserRow, UserType } from "@/types/projects";
import { USER_TYPE_LABELS } from "@/types/projects";
import { deleteUser, resendInvitation } from "../actions";
import UserModal from "./UserModal";
import Modal from "@/app/projects/_components/modals/Modal";

interface Props {
  users: UserRow[];
}

const TYPE_COLORS: Record<UserType, string> = {
  admin:       "bg-[#3b0764] text-[#d8b4fe]",
  manager:     "bg-[#1d3f7a] text-[#93c5fd]",
  operational: "bg-[#1c3557] text-[#7dd3fc]",
  developer:   "bg-[#14532d] text-[#86efac]",
  client:      "bg-[#27272a] text-[#a1a1aa]",
  qa:          "bg-[#422006] text-[#fde68a]",
  referrer:    "bg-[#4c1d95] text-[#c4b5fd]",
  lead:        "bg-[#7f1d1d] text-[#fca5a5]",
};

export default function UsersList({ users }: Props) {
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [userModal, setUserModal]     = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });

  const filtered = users.filter((u) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || u.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search user…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-muted border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-52"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-sm bg-muted border border-border rounded-md text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="all">All Types</option>
            {(Object.entries(USER_TYPE_LABELS) as [UserType, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
          <button
            onClick={() => setUserModal({ open: true, user: null })}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_1fr_140px_120px_160px_40px] gap-2 px-4 py-2 bg-elevated text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-border">
          <span>#</span>
          <span>Name</span>
          <span>Email</span>
          <span>Country</span>
          <span>Type</span>
          <span />
          <span />
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-sm">No users found.</p>
          </div>
        )}

        {filtered.map((user, idx) => (
          <UserRow
            key={user.id}
            user={user}
            idx={idx + 1}
            onEdit={() => setUserModal({ open: true, user })}
            onDelete={() => setDeleteModal({ open: true, user })}
          />
        ))}
      </div>

      {/* Modals */}
      <UserModal
        open={userModal.open}
        onClose={() => setUserModal({ open: false, user: null })}
        user={userModal.user}
      />
      <DeleteUserModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        user={deleteModal.user}
      />
    </div>
  );
}

// ── User row ───────────────────────────────────────────────────────────────────

function UserRow({
  user, idx, onEdit, onDelete,
}: {
  user: UserRow;
  idx: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [sending, startSend] = useTransition();
  const [sent, setSent]      = useState(false);

  const name    = [user.first_name, user.last_name].filter(Boolean).join(" ") || "—";
  const initial = name[0]?.toUpperCase() ?? "?";

  function handleResend() {
    startSend(async () => {
      await resendInvitation(user.email);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    });
  }

  return (
    <div
      className="grid grid-cols-[40px_1fr_1fr_140px_120px_160px_40px] gap-2 px-4 py-3 border-b border-border/50 items-center hover:bg-muted/30 transition-colors group cursor-pointer"
      onClick={onEdit}
    >
      <span className="text-xs text-text-muted">{idx}</span>

      {/* Name + avatar */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-accent text-white text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden border-2 border-elevated">
          {user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.picture} alt={name} className="w-full h-full object-cover" />
          ) : initial}
        </div>
        <span className="text-sm text-text-primary truncate">{name}</span>
      </div>

      {/* Email */}
      <span className="text-xs text-text-secondary truncate">{user.email}</span>

      {/* Country */}
      <span className="text-xs text-text-secondary truncate">{user.country ?? "—"}</span>

      {/* Type badge */}
      <span className={`status-badge text-[10px] ${user.type ? TYPE_COLORS[user.type] : "bg-muted text-text-muted"}`}>
        {user.type ? USER_TYPE_LABELS[user.type] : "—"}
      </span>

      {/* Resend invitation */}
      <button
        onClick={(e) => { e.stopPropagation(); handleResend(); }}
        disabled={sending}
        className="px-3 py-1 text-xs rounded-md bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {sending ? "Sending…" : sent ? "Sent!" : "Resend Invitation"}
      </button>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-1 text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        title="Delete user"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// ── Delete confirm modal ───────────────────────────────────────────────────────

function DeleteUserModal({
  open, onClose, user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleConfirm() {
    if (!user) return;
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-sm">
      <div className="px-6 py-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-text-primary">Delete User</h3>
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <span className="font-medium text-text-primary">
              {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email}
            </span>? This action cannot be undone.
          </p>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md border border-border text-sm text-text-secondary hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
