/**
 * ICP Pill Selector.
 * Renders a horizontal row of selectable pill badges showing ICP persona names.
 * Optionally shows a completion badge (e.g. "2/3") for steps that track per-ICP progress.
 */
"use client";

import type { IdeaIcp } from "@/types/sandbox-planner";
import { cn } from "@/lib/utils";

interface IcpPillSelectorProps {
  icps: IdeaIcp[];
  selectedId: string | null;
  onSelect: (icpId: string) => void;
  /** Optional completion counts per ICP, keyed by ICP id. Format: "done/total". */
  completionBadges?: Record<string, string>;
}

/** Horizontal row of selectable ICP persona pills with optional completion indicators. */
export default function IcpPillSelector({
  icps,
  selectedId,
  onSelect,
  completionBadges,
}: IcpPillSelectorProps) {
  if (icps.length === 0) {
    return (
      <p className="text-sm text-text-muted italic">
        No ICPs generated yet. Run AI to generate them.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="ICP personas">
      {icps.map((icp) => {
        const isSelected = icp.id === selectedId;
        const badge = completionBadges?.[icp.id];

        return (
          <button
            key={icp.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(icp.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              isSelected
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-muted"
            )}
          >
            <span className="truncate max-w-48">{icp.name ?? "Unnamed"}</span>
            {badge && (
              <span
                className={cn(
                  "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-muted text-text-muted"
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
