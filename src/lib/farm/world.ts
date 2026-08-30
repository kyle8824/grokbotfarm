import agentsJson from "../../../public/data/agents.json";
import experimentsJson from "../../../public/data/experiments.json";
import farmJson from "../../../public/data/farm.json";
import historyJson from "../../../public/data/history.json";
import type { Agent, AgentId, World } from "./types";

export const world: World = {
  farm: farmJson as World["farm"],
  agents: agentsJson as World["agents"],
  history: historyJson as World["history"],
  experiments: experimentsJson as World["experiments"],
};

export function getAgent(id: string): Agent | undefined {
  return world.agents.agents.find((a) => a.id === id);
}

export function agentsAt(location: Agent["location"]): Agent[] {
  return world.agents.agents.filter((a) => a.location === location);
}

export function isAgentId(id: string): id is AgentId {
  return id === "bob" || id === "alice";
}

export function experimentDayLine(): string {
  return `Experiment #${world.farm.experiment} · Day ${world.farm.day}`;
}

export function nextDecisionLine(): string {
  return `Next AI decision · ${world.farm.clock.nextDecisionLabel}`;
}
