import { createFileRoute, Link } from "@tanstack/react-router";
import { FailureNote } from "@/components/observe";
import { LAYER_LABEL, formatDay } from "@/lib/farm/labels";
import type { HistoryEntry, LogLayer } from "@/lib/farm/types";
import { world } from "@/lib/farm/world";

export const Route = createFileRoute("/log")({ component: LogPage });

const LAYERS: LogLayer[] = ["today", "decision", "consequence"];

function agentName(id: HistoryEntry["agentId"]): string | null {
  if (!id) return null;
  return world.agents.agents.find((a) => a.id === id)?.name ?? id;
}

function LogPage() {
  const { farm, history } = world;
  const todayEntries = history.entries.filter(
    (e) => e.experiment === farm.experiment && e.day === farm.day,
  );

  return (
    <div className="grid gap-10">
      <header className="grid max-w-2xl gap-3">
        <p className="font-mono text-xs tracking-wide text-sage uppercase">Daily log</p>
        <h1 className="font-display text-3xl font-medium">Today / Decision / Consequence</h1>
        <p className="text-muted">
          Three layers. Today is the frame. Decision is the intent. Consequence
          is what the world did.
        </p>
        <p className="font-mono text-xs text-muted">
          {formatDay(farm.clock.dayStartedOn)} · Experiment #{farm.experiment} · Day {farm.day}
        </p>
      </header>

      <FailureNote />

      <div className="grid gap-12">
        {LAYERS.map((layer) => {
          const entries = todayEntries.filter((e) => e.layer === layer);
          return (
            <section key={layer} className="grid gap-4">
              <h2 className="font-display text-2xl font-medium">{LAYER_LABEL[layer]}</h2>
              {entries.length === 0 ? (
                <p className="text-sm text-muted">
                  {layer === "consequence"
                    ? "The engine has not resolved today's actions yet. Results appear next morning."
                    : "Nothing written in this layer."}
                </p>
              ) : (
                <ol className="grid gap-4">
                  {entries.map((entry) => (
                    <li key={entry.id} className="rounded-3xl bg-surface p-4 shadow-plot">
                      {entry.agentId ? (
                        <p className="mb-2 font-mono text-xs text-muted">
                          <Link
                            to="/agents/$id"
                            params={{ id: entry.agentId }}
                            className="underline-offset-4 hover:underline"
                          >
                            {agentName(entry.agentId)}
                          </Link>
                        </p>
                      ) : null}
                      <p>{entry.what}</p>
                      {entry.why ? (
                        <p className="mt-2 text-sm text-muted">
                          <span className="font-mono text-xs tracking-wide text-sage uppercase">
                            Why
                          </span>{" "}
                          {entry.why}
                        </p>
                      ) : null}
                      {entry.result ? (
                        <p className="mt-2 text-sm text-muted">
                          <span className="font-mono text-xs tracking-wide text-sage uppercase">
                            Result
                          </span>{" "}
                          {entry.result}
                        </p>
                      ) : null}
                      {entry.failure ? (
                        <p className="mt-2 font-mono text-xs text-muted">{entry.failure}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
