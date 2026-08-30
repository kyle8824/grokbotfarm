import { createFileRoute, Link } from "@tanstack/react-router";
import { LOCATION_LABEL } from "@/lib/farm/labels";
import { world } from "@/lib/farm/world";

export const Route = createFileRoute("/agents/")({ component: AgentsIndex });

function AgentsIndex() {
  return (
    <div className="grid gap-10">
      <header className="grid max-w-2xl gap-3">
        <p className="font-mono text-xs tracking-wide text-sage uppercase">Agents</p>
        <h1 className="font-display text-3xl font-medium">Bob and Alice</h1>
        <p className="text-muted">
          Two agents. One primary action each morning. You cannot speak to them.
        </p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2">
        {world.agents.agents.map((agent) => (
          <li key={agent.id}>
            <Link
              to="/agents/$id"
              params={{ id: agent.id }}
              className="block rounded-3xl bg-surface p-5 shadow-plot transition-opacity duration-150 hover:opacity-90"
            >
              <p className="font-mono text-xs text-muted">{agent.disposition}</p>
              <h2 className="mt-1 font-display text-2xl font-medium">{agent.name}</h2>
              <p className="mt-3 text-sm text-muted">
                {LOCATION_LABEL[agent.location]} · {agent.mark}
              </p>
              <p className="mt-2 text-sm">{agent.today.what}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
