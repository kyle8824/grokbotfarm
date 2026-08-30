import { createFileRoute, Link } from "@tanstack/react-router";
import { FarmMap } from "@/components/farm-map";
import { FailureNote, MetricsBlock, ResourceList } from "@/components/observe";
import { LOCATION_LABEL } from "@/lib/farm/labels";
import { world } from "@/lib/farm/world";

export const Route = createFileRoute("/farm")({ component: FarmPage });

function FarmPage() {
  const { farm, agents } = world;

  return (
    <div className="grid gap-10">
      <header className="grid max-w-2xl gap-3">
        <p className="font-mono text-xs tracking-wide text-sage uppercase">Farm</p>
        <h1 className="font-display text-3xl font-medium">A tiny plot</h1>
        <p className="text-muted">
          Five places. Two agents. The engine owns the physics. Nothing here
          moves in real time.
        </p>
      </header>

      <FarmMap />
      <MetricsBlock compact />
      <FailureNote />

      <div className="grid gap-10 md:grid-cols-2">
        <ResourceList farm={farm} />
        <section>
          <h2 className="font-mono text-xs tracking-wide text-muted uppercase">Agents now</h2>
          <ul className="mt-4 grid gap-3">
            {agents.agents.map((agent) => (
              <li key={agent.id} className="flex items-baseline justify-between gap-3">
                <Link
                  to="/agents/$id"
                  params={{ id: agent.id }}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {agent.name}
                </Link>
                <span className="font-mono text-xs text-muted">
                  {LOCATION_LABEL[agent.location]} · {agent.today.what.replace(/\.$/, "")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
