"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";
import type { Talent, TalentLevel, TalentAuthorityLevel } from "@/types/projects";
import { TALENT_LEVEL_LABELS, TALENT_AUTHORITY_LEVEL_LABELS } from "@/types/projects";
import { createTalent, searchCompanies, createCompany } from "../../actions";
import CreateCompanyModal from "./CreateCompanyModal";

interface CreateTalentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (talent: Talent) => void;
}

export default function CreateTalentModal({ open, onClose, onCreated }: CreateTalentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<TalentLevel | "">("");
  const [authorityLevel, setAuthorityLevel] = useState<TalentAuthorityLevel | "">("");

  // Company search
  const [companySearch, setCompanySearch] = useState("");
  const [companyResults, setCompanyResults] = useState<{ id: string; name: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [, startCompanySearch] = useTransition();

  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);

  function resetForm() {
    setFullName(""); setEmail(""); setLevel(""); setAuthorityLevel("");
    setCompanySearch(""); setCompanyResults([]); setSelectedCompanyId(null);
    setSelectedCompanyName(""); setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleCompanySearch(query: string) {
    setCompanySearch(query);
    setCompanyDropdownOpen(true);
    if (!query.trim()) { setCompanyResults([]); return; }
    startCompanySearch(async () => {
      const results = await searchCompanies(query);
      setCompanyResults(results);
    });
  }

  function handleSelectCompany(c: { id: string; name: string }) {
    setSelectedCompanyId(c.id);
    setSelectedCompanyName(c.name);
    setCompanySearch(c.name);
    setCompanyDropdownOpen(false);
  }

  function handleSave() {
    setError(null);
    if (!fullName.trim()) { setError("Full name is required."); return; }

    startTransition(async () => {
      const result = await createTalent({
        name: fullName.trim(),
        email: email.trim() || null,
        level: (level || null) as TalentLevel | null,
        authority_level: (authorityLevel || null) as TalentAuthorityLevel | null,
        current_company_id: selectedCompanyId,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.talent) {
        resetForm();
        onCreated(result.talent);
      }
    });
  }

  return (
    <>
      <Modal open={open} onClose={handleClose} title="Create Talent" width="max-w-lg">
        <div className="px-6 pb-2 space-y-4">
          <Field label="Full Name" required>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" placeholder="Full name" />
          </Field>

          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="email@example.com" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Level">
              <select value={level} onChange={(e) => setLevel(e.target.value as TalentLevel | "")} className="input-field">
                <option value="">Select level…</option>
                {Object.entries(TALENT_LEVEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Authority Level">
              <select value={authorityLevel} onChange={(e) => setAuthorityLevel(e.target.value as TalentAuthorityLevel | "")} className="input-field">
                <option value="">Select…</option>
                {Object.entries(TALENT_AUTHORITY_LEVEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Company */}
          <Field label="Current Company">
            <div className="relative">
              <input
                type="text"
                value={companySearch}
                onChange={(e) => handleCompanySearch(e.target.value)}
                onFocus={() => setCompanyDropdownOpen(true)}
                className="input-field"
                placeholder="Search company…"
              />
              {companyDropdownOpen && companyResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-elevated border border-border rounded-md shadow-lg py-1 max-h-40 overflow-y-auto">
                  {companyResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCompany(c)}
                      className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCompanyId && selectedCompanyName && (
              <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2 mt-1">
                <span className="text-sm text-text-primary">{selectedCompanyName}</span>
                <button type="button" onClick={() => { setSelectedCompanyId(null); setSelectedCompanyName(""); setCompanySearch(""); }} className="text-text-muted hover:text-red-400 text-xs">Remove</button>
              </div>
            )}
            <button type="button" onClick={() => setCreateCompanyOpen(true)} className="text-xs text-accent hover:underline mt-1">
              Didn't find? Create new company →
            </button>
          </Field>

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

      <CreateCompanyModal
        open={createCompanyOpen}
        onClose={() => setCreateCompanyOpen(false)}
        onCreated={(c) => {
          handleSelectCompany(c);
          setCreateCompanyOpen(false);
        }}
      />
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-secondary">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
