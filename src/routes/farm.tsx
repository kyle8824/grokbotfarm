import { createFileRoute, Link } from "@tanstack/react-router";
import { FarmMap } from "@/components/farm-map";
import { FailureNote, MetricsBlock, SlimActionCard } from "@/components/observe";
import { LOCATION_LABEL, WEATHER_LABEL } from "@/lib/farm/labels";
import { world } from "@/lib/farm/world";

export const Route = createFileRoute("/farm")({ component: FarmPage });

function FarmPage() {
  const { farm, agents } = world;

  return (
    <div className="grid gap-8">
      <header className="masthead-thin">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-mono text-xs tracking-wide text-sage uppercase">Farm</p>
          <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Living plot
          </h1>
          <p className="font-mono text-xs text-muted">
            Day {farm.day} · {WEATHER_LABEL[farm.weather]}
          </p>
        </div>
        <p className="font-mono text-xs text-muted sm:text-sm">
          Next decision · {farm.clock.nextDecisionLabel}
        </p>
      </header>

      <FarmMap />
      <FailureNote />
      <MetricsBlock compact />

      <section className="grid gap-3" aria-label="Agents today">
        <h2 className="font-mono text-xs tracking-wide text-muted uppercase">
          Agents now
        </h2>
        <div className="today-slim">
          {agents.agents.map((agent) => (
            <SlimActionCard key={agent.id} agent={agent} record={agent.today} />
          ))}
        </div>
        <ul className="grid gap-2 sm:hidden">
          {agents.agents.map((agent) => (
            <li key={agent.id} className="flex items-baseline justify-between gap-3 text-sm">
              <Link
                to="/agents/$id"
                params={{ id: agent.id }}
                className="font-medium underline-offset-4 hover:underline"
              >
                {agent.name}
              </Link>
              <span className="font-mono text-xs text-muted">
                {LOCATION_LABEL[agent.location]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
