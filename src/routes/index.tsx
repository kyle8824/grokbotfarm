import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FailureNote,
  InheritedMemories,
  MetricsBlock,
  SlimActionCard,
} from "@/components/observe";
import { FarmMap } from "@/components/farm-map";
import { WEATHER_LABEL } from "@/lib/farm/labels";
import { world } from "@/lib/farm/world";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { farm, agents } = world;

  return (
    <div className="grid gap-8">
      <header className="masthead-thin">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-mono text-xs tracking-wide text-sage uppercase">
            Experiment #{farm.experiment}
          </p>
          <p className="font-display text-xl font-medium tracking-tight sm:text-2xl">
            Day {farm.day}
          </p>
          <p className="font-mono text-xs text-muted">
            {WEATHER_LABEL[farm.weather]}
          </p>
        </div>
        <p className="font-mono text-xs text-muted sm:text-sm">
          Next decision · {farm.clock.nextDecisionLabel}
        </p>
      </header>

      <FailureNote />

      <section className="grid gap-3" aria-label="Living farm map">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
            The farm right now
          </h1>
          <Link
            to="/farm"
            className="font-mono text-xs text-sage underline-offset-4 hover:underline"
          >
            Full plot
          </Link>
        </div>
        <FarmMap />
      </section>

      <section className="grid gap-3" aria-label="Today's decisions">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-medium">Today</h2>
          <p className="font-mono text-xs text-muted">
            WHAT / WHY · results land next morning
          </p>
        </header>
        <div className="today-slim">
          {agents.agents.map((agent) => (
            <SlimActionCard key={agent.id} agent={agent} record={agent.today} />
          ))}
        </div>
      </section>

      <InheritedMemories />
      <MetricsBlock compact />

      <p className="max-w-2xl text-sm text-muted">
        Two AI agents. One farm. No visitor controls.{" "}
        <Link to="/log" className="text-sage underline-offset-4 hover:underline">
          Read the log
        </Link>{" "}
        or{" "}
        <Link to="/history" className="text-sage underline-offset-4 hover:underline">
          experiment history
        </Link>
        .
      </p>
    </div>
  );
}
