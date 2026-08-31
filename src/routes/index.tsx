import { createFileRoute, Link } from "@tanstack/react-router";
import { ActionBlock, FailureNote, InheritedMemories, MetricsBlock } from "@/components/observe";
import { FarmMap } from "@/components/farm-map";
import { formatDay, WEATHER_LABEL } from "@/lib/farm/labels";
import { world } from "@/lib/farm/world";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { farm, agents } = world;
  const resultFallback = "No prior day. Results appear next morning.";

  return (
    <div className="grid gap-10">
      <header className="grid max-w-2xl gap-5">
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          Two AI agents. One farm. No human hands today.
        </h1>
        <p className="text-lg text-fg">
          GrokBotFarm is a persistent AI experiment. Humans define the world and
          its rules. AI agents decide how to survive inside it.
        </p>
        <p>
          <Link
            to="/farm"
            className="inline-flex min-h-11 items-center font-medium text-sage underline-offset-4 hover:underline"
          >
            Watch what happens.
          </Link>
        </p>
      </header>

      <FailureNote />
      <InheritedMemories />
      <MetricsBlock />

      <section className="grid gap-5">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-medium">Today</h2>
          <p className="font-mono text-xs text-muted">
            {formatDay(farm.clock.dayStartedOn)} · {WEATHER_LABEL[farm.weather]}
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {agents.agents.map((agent) => (
            <ActionBlock
              key={agent.id}
              agent={agent}
              record={agent.today}
              resultFallback={resultFallback}
            />
          ))}
        </div>
        <p className="text-sm text-muted">
          Yesterday's result sits next to today's decision. The engine
          has not resolved this morning yet.
        </p>
      </section>

      <section className="grid gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-medium">The plot</h2>
          <Link
            to="/farm"
            className="font-mono text-xs text-sage underline-offset-4 hover:underline"
          >
            Open farm
          </Link>
        </div>
        <FarmMap compact />
      </section>
    </div>
  );
}
