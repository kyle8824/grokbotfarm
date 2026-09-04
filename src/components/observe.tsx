import { Link } from "@tanstack/react-router";
import { formatAutonomy, formatAutonomySubline } from "@/lib/farm/engine";
import { LOCATION_LABEL } from "@/lib/farm/labels";
import type { ActionRecord, Agent, FarmState } from "@/lib/farm/types";
import { world } from "@/lib/farm/world";
import { cn } from "@/lib/utils";

export function MetricsBlock({ compact = false }: { compact?: boolean }) {
  const { farm } = world;

  return (
    <section
      aria-label="Metrics"
      className={cn(
        "grid gap-6 border-y border-line py-5 sm:grid-cols-2",
        compact && "py-4",
      )}
    >
      <div>
        <h2 className="font-mono text-xs tracking-wide text-muted uppercase">Human oversight</h2>
        <p className="mt-1 font-display text-2xl tabular-nums">
          {farm.metrics.interventionsToday}
        </p>
        <p className="mt-1 text-sm text-muted">interventions today</p>
      </div>
      <div>
        <h2 className="font-mono text-xs tracking-wide text-muted uppercase">Autonomy</h2>
        <p className="mt-1 font-display text-2xl tabular-nums">{formatAutonomy(farm)}</p>
        <p className="mt-1 text-sm text-muted">{formatAutonomySubline(farm)}</p>
      </div>
    </section>
  );
}

export function ActionBlock({
  agent,
  record,
  resultFallback,
}: {
  agent: Agent;
  record: ActionRecord;
  resultFallback: string;
}) {
  return (
    <article className="rounded-3xl bg-surface p-4 shadow-plot sm:p-5">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl font-medium">
          <Link
            to="/agents/$id"
            params={{ id: agent.id }}
            className="underline-offset-4 hover:underline"
          >
            {agent.name}
          </Link>
        </h3>
        <p className="font-mono text-xs text-muted">
          {agent.disposition} · {LOCATION_LABEL[record.location]}
        </p>
      </header>
      <dl className="grid gap-3">
        <div>
          <dt className="font-mono text-xs tracking-wide text-sage uppercase">What</dt>
          <dd className="mt-1 text-fg">{record.what}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-wide text-sage uppercase">Why</dt>
          <dd className="mt-1 text-fg">{record.why}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-wide text-sage uppercase">Result</dt>
          <dd className="mt-1 text-muted">{record.result ?? resultFallback}</dd>
        </div>
      </dl>
    </article>
  );
}

/** Compact WHAT/WHY card for map-first homepage and /farm. */
export function SlimActionCard({
  agent,
  record,
}: {
  agent: Agent;
  record: ActionRecord;
}) {
  return (
    <article className="today-slim-card">
      <header className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-medium">
          <Link
            to="/agents/$id"
            params={{ id: agent.id }}
            className="underline-offset-4 hover:underline"
          >
            {agent.name}
          </Link>
        </h3>
        <p className="font-mono text-[10px] tracking-wide text-muted uppercase">
          {LOCATION_LABEL[record.location]} · {agent.mark}
        </p>
      </header>
      <dl className="grid gap-2">
        <div>
          <dt className="font-mono text-[10px] tracking-wide text-sage uppercase">What</dt>
          <dd className="mt-0.5 text-sm text-fg">{record.what}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-wide text-sage uppercase">Why</dt>
          <dd className="mt-0.5 line-clamp-3 text-sm text-muted">{record.why}</dd>
        </div>
      </dl>
    </article>
  );
}

export function FailureNote() {
  const failure = world.farm.failure;
  if (!failure) return null;
  return (
    <section
      aria-label="Collapse"
      className="rounded-3xl bg-sunken p-6 shadow-plot sm:p-8"
    >
      <p className="font-mono text-sm tracking-wide text-sage uppercase">
        {failure.message}
      </p>
      <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Experiment #{failure.experiment} COLLAPSED
      </h2>
      <p className="mt-3 font-mono text-sm tabular-nums text-fg">Day {failure.day}</p>
      <p className="mt-3 text-lg text-fg">{failure.detail}</p>
    </section>
  );
}

export function InheritedMemories() {
  const current = world.experiments.experiments.find(
    (e) => e.number === world.experiments.current,
  );
  if (!current || current.inheritedMemories.length === 0) return null;
  const source = current.number - 1;
  return (
    <section aria-label="Inherited memory" className="grid gap-2">
      {current.inheritedMemories.map((line) => (
        <p key={line} className="text-fg">
          Inherited from Experiment #{source}: {line}
        </p>
      ))}
    </section>
  );
}

export function ResourceList({ farm }: { farm: FarmState }) {
  const rows = [
    { label: "Corn", value: farm.resources.corn, max: 100 },
    { label: "Water", value: farm.resources.water, max: 100 },
    { label: "Wood", value: farm.resources.wood, max: null },
    { label: "Seeds", value: farm.resources.seeds, max: null },
    { label: "Field moisture", value: farm.resources.fieldMoisture, max: 100, suffix: "%" },
  ] as const;

  return (
    <section aria-label="Resources">
      <h2 className="font-mono text-xs tracking-wide text-muted uppercase">Resources</h2>
      <ul className="mt-4 grid gap-3">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span>{row.label}</span>
              <span className="font-mono tabular-nums">
                {row.value}
                {"suffix" in row ? row.suffix : ""}
                {row.max !== null ? ` / ${row.max}` : ""}
              </span>
            </div>
            {row.max !== null ? (
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunken">
                <div
                  className="h-full rounded-full bg-sage"
                  style={{ width: `${Math.min(100, (row.value / row.max) * 100)}%` }}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
