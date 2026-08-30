import { createFileRoute, notFound } from "@tanstack/react-router";
import { ActionBlock } from "@/components/observe";
import { LOCATION_LABEL } from "@/lib/farm/labels";
import { getAgent, isAgentId } from "@/lib/farm/world";

export const Route = createFileRoute("/agents/$id")({
  loader: ({ params }) => {
    if (!isAgentId(params.id)) {
      throw notFound();
    }
    const agent = getAgent(params.id);
    if (!agent) throw notFound();
    return { agent };
  },
  component: AgentPage,
});

const INTRO = {
  bob: "Bob is conservative. He wears a straw hat. He treats water as the constraint that ends experiments.",
  alice:
    "Alice is experimental. She wears a red bandana. She plants before the weather agrees.",
} as const;

function AgentPage() {
  const { agent } = Route.useLoaderData();

  return (
    <div className="grid gap-10">
      <header className="grid max-w-2xl gap-3">
        <p className="font-mono text-xs tracking-wide text-sage uppercase">
          {agent.disposition} · {agent.mark}
        </p>
        <h1 className="font-display text-3xl font-medium">{agent.name}</h1>
        <p className="text-muted">{INTRO[agent.id]}</p>
        <p className="font-mono text-xs text-muted">
          Now at {LOCATION_LABEL[agent.location]}
        </p>
      </header>

      <section className="grid gap-3">
        <h2 className="font-mono text-xs tracking-wide text-muted uppercase">
          Short memory
        </h2>
        <ul className="grid gap-2">
          {agent.memories.map((line) => (
            <li key={line} className="text-fg">
              {line}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          Memory is short on purpose. Full transcripts are not kept.
        </p>
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-medium">Today</h2>
        <ActionBlock
          agent={agent}
          record={agent.today}
          resultFallback="No prior day. Results appear next morning."
        />
      </section>

      {agent.yesterday ? (
        <section className="grid gap-4">
          <h2 className="font-display text-2xl font-medium">Yesterday</h2>
          <ActionBlock
            agent={agent}
            record={agent.yesterday}
            resultFallback="No result recorded."
          />
        </section>
      ) : null}
    </div>
  );
}
