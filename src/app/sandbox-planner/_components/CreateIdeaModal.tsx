/**
 * Create Idea modal.
 * Collects name (required), description (required), and optional project,
 * then calls the createIdea server action.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/app/projects/_components/modals/Modal";
import type { ProjectOption } from "@/types/sandbox-planner";
import { createIdea } from "../actions";
import { cn } from "@/lib/utils";

interface CreateIdeaModalProps {
  open: boolean;
  onClose: () => void;
  projects: ProjectOption[];
  /** Pre-select this project in the dropdown (from URL ?project= param). */
  defaultProjectId?: string;
}

/** Modal form for creating a new idea with early validation and submit state. */
export default function CreateIdeaModal({
  open,
  onClose,
  projects,
  defaultProjectId,
}: CreateIdeaModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");

  // Sync when defaultProjectId changes
  useEffect(() => {
    setProjectId(defaultProjectId ?? "");
  }, [defaultProjectId]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameValid = name.trim().length > 0;
  const descriptionValid = description.trim().length > 0;
  const canSubmit = nameValid && descriptionValid && !isSubmitting;

  function resetForm() {
    setName("");
    setDescription("");
    setProjectId(defaultProjectId ?? "");
    setError(null);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    const result = await createIdea({
      name: name.trim(),
      description: description.trim(),
      project_id: projectId || undefined,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    resetForm();
    onClose();
    router.refresh();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create Idea">
      <div className="px-6 pb-2 space-y-5">
        {/* Name */}
        <div>
          <label
            htmlFor="idea-name"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Name<span className="text-red-400">*</span>
          </label>
          <input
            id="idea-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name here..."
            disabled={isSubmitting}
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-sm bg-base text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "disabled:opacity-50",
              !nameValid && name.length > 0
                ? "border-red-400"
                : "border-border"
            )}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="idea-description"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Description<span className="text-red-400">*</span>
          </label>
          <textarea
            id="idea-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe here the main problem you are trying to solve..."
            rows={5}
            disabled={isSubmitting}
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-sm bg-base text-text-primary placeholder:text-text-muted resize-none",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "disabled:opacity-50",
              !descriptionValid && description.length > 0
                ? "border-red-400"
                : "border-border"
            )}
          />
        </div>

        {/* Project (optional) */}
        <div>
          <label
            htmlFor="idea-project"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Project
          </label>
          <select
            id="idea-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={isSubmitting}
            className={cn(
              "w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-base text-text-primary",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "disabled:opacity-50"
            )}
          >
            <option value="">Choose an option...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? "Untitled"}
              </option>
            ))}
          </select>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
            "border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:opacity-50"
          )}
        >
          Close
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "bg-accent text-white hover:bg-accent/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSubmitting ? "Creating..." : "Create"}
        </button>
      </div>
    </Modal>
  );
}
