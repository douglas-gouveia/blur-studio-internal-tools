"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import type { Project, ProjectStatus, ProjectProgram, ProjectStage, UserProfile, Talent } from "@/types/projects";
import { STAGE_LABELS, STAGE_ORDER, PROGRAM_LABELS } from "@/types/projects";
import {
  createProject,
  updateProject,
  searchTalents,
  type ProjectInput,
} from "../../actions";
import CreateTalentModal from "./CreateTalentModal";

type TaskProgress = { totalEst: number; doneOrQaEst: number; doneEst: number };

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  profiles: UserProfile[];
  taskProgress?: TaskProgress | null;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "prospecting",  label: "Prospecting" },
  { value: "not_started",  label: "Not Started" },
  { value: "in_progress",  label: "In Progress" },
  { value: "done",         label: "Done" },
  { value: "blocked",      label: "Blocked" },
  { value: "archived",     label: "Archived" },
  { value: "lost_deal",    label: "Lost Deal" },
];

const PROGRAM_OPTIONS = Object.entries(PROGRAM_LABELS).map(([value, label]) => ({
  value: value as ProjectProgram,
  label,
}));

function getInitials(first: string | null, last: string | null): string {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-text-secondary">{label}</span>
        <span className="text-[11px] text-text-muted">{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ProjectModal({ open, onClose, project, profiles, taskProgress }: ProjectModalProps) {
  const router = useRouter();
  const isEdit = !!project;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createTalentOpen, setCreateTalentOpen] = useState(false);

  // Form state — all reset when modal opens or project changes
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("not_started");
  const [program, setProgram] = useState<ProjectProgram | "">("");
  const [stage, setStage] = useState<ProjectStage | "">("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("0.00");
  const [startEst, setStartEst] = useState("");
  const [endEst, setEndEst] = useState("");
  const [startReal, setStartReal] = useState("");
  const [endReal, setEndReal] = useState("");
  const [description, setDescription] = useState("");
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([]);
  const [autoProjectEst, setAutoProjectEst] = useState(false);
  const [autoMilestoneEst, setAutoMilestoneEst] = useState(false);
  const [autoProjectDates, setAutoProjectDates] = useState(false);
  const [autoMilestoneDates, setAutoMilestoneDates] = useState(false);

  // Recommended by
  const [recommendedBy, setRecommendedBy] = useState<"dev_agency_owner" | "client" | "">("");
  const [talentSearch, setTalentSearch] = useState("");
  const [talentResults, setTalentResults] = useState<Talent[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [talentDropdownOpen, setTalentDropdownOpen] = useState(false);
  const talentSearchRef = useRef<HTMLDivElement>(null);
  const [isSearching, startSearchTransition] = useTransition();

  // Reset all state when modal opens/closes or project changes
  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? "");
    setStatus(project?.status ?? "not_started");
    setProgram(project?.program ?? "");
    setStage(project?.stage ?? "");
    setEstimatedTime(project?.estimated_time?.toString() ?? "");
    setPrice(project?.price?.toString() ?? "");
    setCommission(project?.referrer_commission?.toString() ?? "0.00");
    setStartEst(project?.start_date_estimated ?? "");
    setEndEst(project?.end_date_estimated ?? "");
    setStartReal(project?.start_date_real ?? "");
    setEndReal(project?.end_date_real ?? "");
    setDescription(project?.description ?? "");
    setAuthorizedUsers(project?.authorized_users ?? []);
    setAutoProjectEst(project?.change_automatically_project_estimated_time ?? false);
    setAutoMilestoneEst(project?.change_automatically_milestone_estimated_time ?? false);
    setAutoProjectDates(project?.change_automatically_project_start_end_dates ?? false);
    setAutoMilestoneDates(project?.change_automatically_milestone_start_end_dates ?? false);
    setRecommendedBy(project?.talent_who_recommended_id ? "dev_agency_owner" : "");
    setSelectedTalent(null);
    setTalentSearch(project?.talent_who_recommended_id ? "" : "");
    setTalentResults([]);
    setError(null);
  }, [open, project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close talent dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (talentSearchRef.current && !talentSearchRef.current.contains(e.target as Node)) {
        setTalentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleTalentSearch(query: string) {
    setTalentSearch(query);
    setTalentDropdownOpen(true);
    if (!query.trim()) { setTalentResults([]); return; }
    startSearchTransition(async () => {
      const results = await searchTalents(query);
      setTalentResults(results);
    });
  }

  function handleSelectTalent(t: Talent) {
    setSelectedTalent(t);
    setTalentSearch(t.name ?? "");
    setTalentDropdownOpen(false);
  }

  const toggleUser = (id: string) => {
    setAuthorizedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    setError(null);
    if (!name.trim()) { setError("Name is required."); return; }

    const payload: ProjectInput = {
      name: name.trim(),
      status,
      program: (program || null) as ProjectProgram | null,
      stage: (stage || null) as ProjectStage | null,
      estimated_time: estimatedTime ? parseFloat(estimatedTime) : null,
      price: price ? parseFloat(price) : null,
      referrer_commission: commission ? parseFloat(commission) : null,
      start_date_estimated: startEst || null,
      end_date_estimated: endEst || null,
      start_date_real: startReal || null,
      end_date_real: endReal || null,
      description: description || null,
      authorized_users: authorizedUsers,
      change_automatically_project_estimated_time: autoProjectEst,
      change_automatically_milestone_estimated_time: autoMilestoneEst,
      change_automatically_project_start_end_dates: autoProjectDates,
      change_automatically_milestone_start_end_dates: autoMilestoneDates,
      talent_who_recommended_id: recommendedBy === "dev_agency_owner" ? (selectedTalent?.id ?? project?.talent_who_recommended_id ?? null) : null,
      company_that_recommended_id: project?.company_that_recommended_id ?? null,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateProject(project!.id, payload)
        : await createProject(payload);

      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  // Progress bar calculations
  const totalEst = taskProgress?.totalEst ?? 0;
  const doneOrQaEst = taskProgress?.doneOrQaEst ?? 0;
  const doneOnlyEst = taskProgress?.doneEst ?? 0;
  const realTime = project?.real_time ?? 0;
  const projEstTime = project?.estimated_time ?? 0;

  const schedPct = (() => {
    if (!startEst || !endEst) return 0;
    const start = new Date(startEst).getTime();
    const end   = new Date(endEst).getTime();
    const span  = end - start;
    if (span <= 0) return 0;
    return Math.min(100, Math.max(0, ((Date.now() - start) / span) * 100));
  })();

  return (
    <>
      <Modal open={open} onClose={onClose} title={isEdit ? "Edit Project" : "New Project"} width="max-w-2xl">
        <div className="px-6 pb-2 space-y-5 overflow-y-auto max-h-[75vh]">

          {/* Progress bars (edit mode only) */}
          {isEdit && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Progress Overview</h4>
              <ProgressBar label="Schedule (by dates)" value={schedPct} max={100} color="bg-blue-500" />
              <ProgressBar label="Tasks done or in QA (by est. time)" value={doneOrQaEst} max={totalEst} color="bg-green-500" />
              <ProgressBar label="Tasks fully done (by est. time)" value={doneOnlyEst} max={totalEst} color="bg-emerald-600" />
              <ProgressBar label="Hours used (real / estimated)" value={realTime} max={projEstTime} color="bg-orange-500" />
            </div>
          )}

          {/* Picture placeholder */}
          {isEdit && (
            <div className="flex justify-center pt-2">
              <div className="w-20 h-20 rounded-xl bg-muted border border-border flex items-center justify-center text-text-muted text-xs">
                {project?.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.picture} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  "Photo"
                )}
              </div>
            </div>
          )}

          {/* Name */}
          <Field label="Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Project name"
            />
          </Field>

          {/* Status + Authorized Users */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" required>
              <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="input-field">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Authorized Users">
              <div className="flex flex-wrap gap-1.5 p-2 bg-muted border border-border rounded-md min-h-[40px]">
                {profiles.map((p) => {
                  const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ") || "?";
                  const selected = authorizedUsers.includes(p.id);
                  const initials = getInitials(p.first_name, p.last_name);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      title={fullName}
                      onClick={() => toggleUser(p.id)}
                      className={`w-7 h-7 rounded-full text-[11px] font-semibold flex items-center justify-center overflow-hidden border-2 transition-all ${
                        selected ? "border-accent" : "border-transparent opacity-50"
                      }`}
                      style={{ background: selected ? "#3b82f6" : "#374151" }}
                    >
                      {p.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.picture} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white">{initials}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          {/* Program + Stage */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Program" required>
              <select value={program} onChange={(e) => setProgram(e.target.value as ProjectProgram | "")} className="input-field">
                <option value="">Select program…</option>
                {PROGRAM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Stage" required>
              <select value={stage} onChange={(e) => setStage(e.target.value as ProjectStage | "")} className="input-field">
                <option value="">Select stage…</option>
                {STAGE_ORDER.map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Est. time + Price */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estimated Time (h)">
              <input type="number" min="0" step="0.5" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} className="input-field" placeholder="0" />
            </Field>
            <Field label="Total Price ($)">
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="0.00" />
            </Field>
          </div>

          {/* Dates estimated */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date (Estimated)">
              <input type="date" value={startEst} onChange={(e) => setStartEst(e.target.value)} className="input-field" />
            </Field>
            <Field label="End Date (Estimated)">
              <input type="date" value={endEst} onChange={(e) => setEndEst(e.target.value)} className="input-field" />
            </Field>
          </div>

          {/* Dates real */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date (Real)">
              <input type="date" value={startReal} onChange={(e) => setStartReal(e.target.value)} className="input-field" />
            </Field>
            <Field label="End Date (Real)">
              <input type="date" value={endReal} onChange={(e) => setEndReal(e.target.value)} className="input-field" />
            </Field>
          </div>

          {/* Recommended by */}
          <Field label="Recommended by">
            <select
              value={recommendedBy}
              onChange={(e) => {
                setRecommendedBy(e.target.value as typeof recommendedBy);
                setSelectedTalent(null);
                setTalentSearch("");
                setTalentResults([]);
              }}
              className="input-field"
            >
              <option value="">None</option>
              <option value="dev_agency_owner">Dev. / Agency Owner</option>
              <option value="client">Client</option>
            </select>
          </Field>

          {/* Talent search — shown when Dev./Agency Owner selected */}
          {recommendedBy === "dev_agency_owner" && (
            <div className="space-y-3">
              <Field label="Dev. / Agency Owner">
                <div ref={talentSearchRef} className="relative">
                  <input
                    type="text"
                    value={talentSearch}
                    onChange={(e) => handleTalentSearch(e.target.value)}
                    onFocus={() => setTalentDropdownOpen(true)}
                    className="input-field"
                    placeholder="Search by name…"
                  />
                  {talentDropdownOpen && (talentResults.length > 0 || isSearching) && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-elevated border border-border rounded-md shadow-lg py-1 max-h-48 overflow-y-auto">
                      {isSearching && (
                        <p className="text-xs text-text-muted px-3 py-2">Searching…</p>
                      )}
                      {talentResults.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTalent(t)}
                          className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
                        >
                          {t.name ?? "Unnamed"}
                          {t.email && <span className="text-text-muted ml-2 text-xs">{t.email}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
              {selectedTalent && (
                <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                  <span className="text-sm text-text-primary">{selectedTalent.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedTalent(null); setTalentSearch(""); }}
                    className="text-text-muted hover:text-red-400 text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setCreateTalentOpen(true)}
                className="text-xs text-accent hover:underline"
              >
                Didn't find? Create new talent →
              </button>

              {/* Commission */}
              <Field label="Commission (%)">
                <input type="number" min="0" max="100" step="0.01" value={commission} onChange={(e) => setCommission(e.target.value)} className="input-field" placeholder="0.00" />
              </Field>
            </div>
          )}

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Toggle label="Change Automatically the Milestones' Estimated Time" value={autoMilestoneEst} onChange={setAutoMilestoneEst} />
            <Toggle label="Change Automatically the Milestones' Start Date and End Date" value={autoMilestoneDates} onChange={setAutoMilestoneDates} />
            <Toggle label="Change Automatically This Project's Estimated Time" value={autoProjectEst} onChange={setAutoProjectEst} />
            <Toggle label="Change Automatically This Project's Start Date and End Date" value={autoProjectDates} onChange={setAutoProjectDates} />
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="input-field resize-none"
              placeholder="Project description…"
            />
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-md bg-muted text-text-secondary text-sm font-medium hover:bg-border transition-colors">
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      <CreateTalentModal
        open={createTalentOpen}
        onClose={() => setCreateTalentOpen(false)}
        onCreated={(talent) => {
          setSelectedTalent(talent);
          setTalentSearch(talent.name ?? "");
          setCreateTalentOpen(false);
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

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${value ? "bg-accent" : "bg-muted border border-border"}`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
      <span className="text-xs text-text-secondary leading-tight">{label}</span>
    </div>
  );
}
