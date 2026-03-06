"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";
import { createCompany } from "../../actions";

interface CreateCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (company: { id: string; name: string }) => void;
}

export default function CreateCompanyModal({ open, onClose, onCreated }: CreateCompanyModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");

  function handleClose() {
    setName(""); setWebsite(""); setError(null);
    onClose();
  }

  function handleSave() {
    setError(null);
    if (!name.trim()) { setError("Company name is required."); return; }
    startTransition(async () => {
      const result = await createCompany(name.trim(), website.trim() || null);
      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        handleClose();
        onCreated({ id: result.id, name: name.trim() });
      }
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create Company" width="max-w-md">
      <div className="px-6 pb-2 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Name<span className="text-red-400 ml-0.5">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Company name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Website</label>
          <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="input-field" placeholder="https://example.com" />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
        <button onClick={handleClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">
          Close
        </button>
        <button onClick={handleSave} disabled={isPending} className="px-6 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50">
          {isPending ? "Creating…" : "Create"}
        </button>
      </div>
    </Modal>
  );
}
