"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Modal from "@/app/projects/_components/modals/Modal";
import { createClient } from "@/lib/supabase/client";
import { createUser, updateUser } from "../actions";
import type { UserRow, UserType } from "@/types/projects";
import { USER_TYPE_LABELS } from "@/types/projects";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Belgium",
  "Bolivia","Brazil","Canada","Chile","China","Colombia","Croatia","Czech Republic",
  "Denmark","Ecuador","Egypt","Ethiopia","Finland","France","Germany","Ghana",
  "Greece","Guatemala","Honduras","Hungary","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Japan","Jordan","Kenya","Lebanon","Malaysia",
  "Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Pakistan",
  "Panama","Paraguay","Peru","Philippines","Poland","Portugal","Romania","Russia",
  "Saudi Arabia","Serbia","Singapore","South Africa","South Korea","Spain",
  "Sweden","Switzerland","Taiwan","Thailand","Turkey","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uruguay","Venezuela","Vietnam",
];

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
}

export default function UserModal({ open, onClose, user }: Props) {
  const isEdit = !!user;
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [type, setType]           = useState<UserType>("client");
  const [country, setCountry]     = useState("United States");
  const [picture, setPicture]     = useState("");
  const [preview, setPreview]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [isPending, startTransition] = useTransition();

  // Populate form when editing
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setEmail(user.email ?? "");
      setType(user.type ?? "client");
      setCountry(user.country ?? "United States");
      setPicture(user.picture ?? "");
      setPreview(user.picture ?? "");
    } else {
      setFirstName(""); setLastName(""); setEmail("");
      setType("client"); setCountry("United States");
      setPicture(""); setPreview("");
    }
    setError("");
  }, [user, open]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPicture(data.publicUrl);
      setPreview(data.publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    if (!firstName.trim()) return setError("First name is required.");
    if (!lastName.trim())  return setError("Last name is required.");
    if (!isEdit && !email.trim()) return setError("Email is required.");
    setError("");

    startTransition(async () => {
      const result = isEdit
        ? await updateUser(user!.id, { first_name: firstName, last_name: lastName, type, country, picture })
        : await createUser({ first_name: firstName, last_name: lastName, email, type, country, picture });

      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <Modal open={open} onClose={onClose} width="max-w-lg">
      <div className="px-8 pt-10 pb-8 flex flex-col gap-6">
        {/* Avatar upload */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-28 h-28 rounded-full border-2 border-dashed border-border hover:border-accent flex items-center justify-center overflow-hidden transition-colors relative group"
            title="Click to upload an image"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-text-muted text-center leading-tight px-2">
                {uploading ? "Uploading…" : "Click to upload an image"}
              </span>
            )}
            {preview && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs">Change</span>
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* First + Last name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">First Name <span className="text-red-400">*</span></label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Last Name <span className="text-red-400">*</span></label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="input-field"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Email <span className="text-red-400">*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="johndoe@gmail.com"
            disabled={isEdit}
            className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Type <span className="text-red-400">*</span></label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as UserType)}
            className="input-field"
          >
            {(Object.entries(USER_TYPE_LABELS) as [UserType, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="input-field"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-md border border-border text-sm text-text-secondary hover:bg-muted transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || uploading}
            className="flex-1 px-4 py-2.5 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {isPending ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save" : "Create")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
