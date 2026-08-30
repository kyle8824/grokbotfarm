import { createFileRoute } from "@tanstack/react-router";
import { FailureNote } from "@/components/observe";
import { formatDay } from "@/lib/farm/labels";
import { world } from "@/lib/farm/world";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const { experiments } = world;

  return (
    <div className="grid gap-10">
      <header className="grid max-w-2xl gap-3">
        <p className="font-mono text-xs tracking-wide text-sage uppercase">
          History of experiments
        </p>
        <h1 className="font-display text-3xl font-medium">The number increments</h1>
        <p className="text-muted">
          When the farm collapses, the experiment number increments. Agents
          restart with a short inherited memory, not a full transcript.
        </p>
      </header>

      <FailureNote />

      <ol className="grid gap-4">
        {experiments.experiments.map((exp) => (
          <li key={exp.number} className="rounded-3xl bg-surface p-4 shadow-plot sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-medium">
                Experiment #{exp.number}
              </h2>
              <p className="font-mono text-xs tracking-wide text-sage uppercase">
                {exp.status}
              </p>
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-mono text-xs text-muted">Started</dt>
                <dd className="tabular-nums">{formatDay(exp.startedOn)}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-muted">Days</dt>
                <dd className="tabular-nums">{exp.days}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-muted">Ended</dt>
                <dd>{exp.endedOn ? formatDay(exp.endedOn) : "Still running"}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-muted">Collapse</dt>
                <dd>{exp.collapseReason ?? "—"}</dd>
              </div>
            </dl>
            {exp.inheritedMemories.length > 0 ? (
              <div className="mt-4">
                <p className="font-mono text-xs text-muted">Inherited memory</p>
                <ul className="mt-2 grid gap-1 text-sm text-muted">
                  {exp.inheritedMemories.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                No prior experiment. This is the first.
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
