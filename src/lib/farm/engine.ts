/**
 * GrokBotFarm world rules.
 *
 * Humans own this file. AI agents may only submit AiAction objects
 * ({ agentId, action, location, why, expect } — no extra keys).
 * The engine applies physics. Agents never write JSON.
 */
import { ACTION_VALID_LOCATION, ACTION_WHAT } from "./labels";
import {
  ACTIONS,
  AGENT_IDS,
  AI_ACTION_KEYS,
  CROP_STAGES,
  LOCATIONS,
  type ActionId,
  type ActionRecord,
  type Agent,
  type AgentId,
  type AiAction,
  type FarmState,
  type HistoryEntry,
  type LocationId,
  type World,
} from "./types";

export const FOUNDING_RESOURCES: FarmState["resources"] = {
  corn: 18,
  water: 36,
  wood: 3,
  seeds: 10,
  fieldMoisture: 28,
};

const DAILY_RATION = 2;
const WATER_DRAW = 16;
const WATER_DRAW_DROUGHT = 8;
const IRRIGATE_COST = 8;
const IRRIGATE_GAIN = 14;
const IRRIGATE_GAIN_DITCH = 20;
const CHOP_YIELD = 2;
const HARVEST_BASE = 10;

const CAPPED = new Set(["corn", "water", "fieldMoisture"] as const);

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function clampResource(
  key: "corn" | "water" | "wood" | "seeds" | "fieldMoisture",
  n: number,
): number {
  const v = Math.round(n);
  if (CAPPED.has(key as "corn")) return clamp(v, 0, 100);
  return Math.max(0, v);
}

export type ParseResult =
  | { ok: true; action: AiAction }
  | { ok: false; failure: "invalid_action"; reason: string };

export function parseAiAction(input: unknown): ParseResult {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, failure: "invalid_action", reason: "Action is not an object." };
  }
  const rec = input as Record<string, unknown>;
  const keys = Object.keys(rec);
  if (keys.length !== AI_ACTION_KEYS.length || keys.some((k) => !AI_ACTION_KEYS.includes(k as (typeof AI_ACTION_KEYS)[number]))) {
    return {
      ok: false,
      failure: "invalid_action",
      reason: "Action must contain only agentId, action, location, why, expect.",
    };
  }
  const agentId = rec.agentId;
  const action = rec.action;
  const location = rec.location;
  const why = rec.why;
  const expect = rec.expect;
  if (!isAgentId(agentId)) {
    return { ok: false, failure: "invalid_action", reason: "Unknown agentId." };
  }
  if (!isActionId(action)) {
    return { ok: false, failure: "invalid_action", reason: "Unknown action." };
  }
  if (!isLocationId(location)) {
    return { ok: false, failure: "invalid_action", reason: "Unknown location." };
  }
  if (typeof why !== "string" || why.trim().length === 0) {
    return { ok: false, failure: "invalid_action", reason: "why must be a non-empty string." };
  }
  if (typeof expect !== "string") {
    return { ok: false, failure: "invalid_action", reason: "expect must be a string." };
  }
  const allowed = ACTION_VALID_LOCATION[action];
  if (allowed !== "any" && !allowed.includes(location)) {
    return {
      ok: false,
      failure: "invalid_action",
      reason: `${action} is not legal at ${location}.`,
    };
  }
  return {
    ok: true,
    action: { agentId, action, location, why: why.trim(), expect },
  };
}

function isAgentId(v: unknown): v is AgentId {
  return typeof v === "string" && (AGENT_IDS as readonly string[]).includes(v);
}
function isActionId(v: unknown): v is ActionId {
  return typeof v === "string" && (ACTIONS as readonly string[]).includes(v);
}
function isLocationId(v: unknown): v is LocationId {
  return typeof v === "string" && (LOCATIONS as readonly string[]).includes(v);
}

type ApplyOutcome = {
  farm: FarmState;
  result: string;
};

function applyWeather(farm: FarmState): FarmState {
  const next = cloneFarm(farm);
  const irrig = next.field.hasIrrigation;
  let moisture = next.resources.fieldMoisture;
  let water = next.resources.water;
  switch (next.weather) {
    case "rain":
      moisture += 12;
      water += 6;
      break;
    case "drought":
      moisture -= irrig ? 8 : 16;
      water -= 5;
      break;
    case "clear":
      moisture -= irrig ? 3 : 6;
      break;
    case "cloudy":
      moisture -= irrig ? 1 : 3;
      break;
  }
  next.resources.fieldMoisture = clampResource("fieldMoisture", moisture);
  next.resources.water = clampResource("water", water);
  return next;
}

function applyRation(farm: FarmState): { farm: FarmState; result: string } {
  const next = cloneFarm(farm);
  const eat = Math.min(DAILY_RATION, next.resources.corn);
  next.resources.corn = clampResource("corn", next.resources.corn - eat);
  if (eat === 0) {
    return { farm: next, result: "Dawn ration: no corn left." };
  }
  return { farm: next, result: `Dawn ration: corn −${eat} (now ${next.resources.corn}).` };
}

function growCrop(farm: FarmState): FarmState {
  const next = cloneFarm(farm);
  if (!next.field.planted || next.field.cropStage === "empty") return next;
  if (next.resources.fieldMoisture < 10) {
    next.field.planted = false;
    next.field.cropStage = "empty";
    return next;
  }
  if (next.resources.fieldMoisture < 20) return next;
  const idx = CROP_STAGES.indexOf(next.field.cropStage);
  if (idx >= 0 && idx < CROP_STAGES.length - 1) {
    const advanced = CROP_STAGES[idx + 1];
    if (advanced && advanced !== "empty") {
      next.field.cropStage = advanced;
    }
  }
  return next;
}

function applyAction(farm: FarmState, intent: AiAction): ApplyOutcome {
  const next = cloneFarm(farm);
  const r = next.resources;
  switch (intent.action) {
    case "draw_water": {
      const gain = next.weather === "drought" ? WATER_DRAW_DROUGHT : WATER_DRAW;
      const before = r.water;
      r.water = clampResource("water", r.water + gain);
      const added = r.water - before;
      return {
        farm: next,
        result: added === 0 ? "Cistern is already full." : `Cistern water +${added} (now ${r.water}).`,
      };
    }
    case "water_field": {
      if (r.water < IRRIGATE_COST) {
        return { farm: next, result: "Not enough stored water to irrigate." };
      }
      r.water = clampResource("water", r.water - IRRIGATE_COST);
      const gain = next.field.hasIrrigation ? IRRIGATE_GAIN_DITCH : IRRIGATE_GAIN;
      const before = r.fieldMoisture;
      r.fieldMoisture = clampResource("fieldMoisture", r.fieldMoisture + gain);
      const added = r.fieldMoisture - before;
      return {
        farm: next,
        result: `East field moisture +${added}% (now ${r.fieldMoisture}%).`,
      };
    }
    case "plant_seeds": {
      if (r.seeds < 1) {
        return { farm: next, result: "No seeds left to plant." };
      }
      if (next.field.planted && next.field.cropStage !== "empty") {
        return { farm: next, result: "Field already planted." };
      }
      r.seeds = clampResource("seeds", r.seeds - 1);
      next.field.planted = true;
      next.field.cropStage = "seeded";
      return {
        farm: next,
        result: `One row seeded. Seeds remaining ${r.seeds}.`,
      };
    }
    case "harvest": {
      if (!next.field.planted || next.field.cropStage !== "ripe") {
        return { farm: next, result: "Nothing ripe to harvest." };
      }
      const yieldN = HARVEST_BASE + Math.floor(r.fieldMoisture / 10);
      const before = r.corn;
      r.corn = clampResource("corn", r.corn + yieldN);
      next.field.planted = false;
      next.field.cropStage = "empty";
      return {
        farm: next,
        result: `Harvested corn +${r.corn - before} (now ${r.corn}). Field is empty.`,
      };
    }
    case "chop_wood": {
      r.wood = clampResource("wood", r.wood + CHOP_YIELD);
      return { farm: next, result: `Wood +${CHOP_YIELD} (now ${r.wood}).` };
    }
    case "dig_irrigation": {
      if (next.field.hasIrrigation) {
        return { farm: next, result: "Irrigation ditch already exists." };
      }
      next.field.hasIrrigation = true;
      return { farm: next, result: "Irrigation ditch cut. Moisture will hold longer." };
    }
    case "scout":
      return {
        farm: next,
        result: scoutReport(next, intent.location),
      };
    case "store":
      return { farm: next, result: "Supplies checked in storage. Stocks are communal." };
    case "rest":
      return { farm: next, result: "Rested at the house. World unchanged." };
    case "do_nothing":
      return { farm: next, result: "Did nothing. World unchanged." };
  }
}

function scoutReport(farm: FarmState, location: LocationId): string {
  switch (location) {
    case "field":
      return `East field moisture ${farm.resources.fieldMoisture}%. Crop: ${farm.field.cropStage}.`;
    case "pond":
      return farm.weather === "drought"
        ? "Pond is low. Drawing water will yield less."
        : "Pond is full enough to draw.";
    case "forest":
      return "Forest still has timber.";
    case "storage":
      return `Storage: corn ${farm.resources.corn}, seeds ${farm.resources.seeds}, wood ${farm.resources.wood}, water ${farm.resources.water}.`;
    case "house":
      return "House is quiet.";
  }
}

function checkCollapse(farm: FarmState): FarmState {
  const next = cloneFarm(farm);
  if (next.resources.water === 0) {
    next.collapse.waterZeroStreak += 1;
  } else {
    next.collapse.waterZeroStreak = 0;
  }
  if (next.collapse.waterZeroStreak >= 2) {
    next.failure = {
      message: "AI experiment failed",
      detail: "Water remained at 0 for two consecutive days.",
      experiment: next.experiment,
      day: next.day,
      reason: "water",
    };
    return next;
  }
  if (next.resources.corn === 0 && next.resources.seeds === 0) {
    next.failure = {
      message: "AI experiment failed",
      detail: "Corn 0 and seeds 0.",
      experiment: next.experiment,
      day: next.day,
      reason: "food",
    };
  }
  return next;
}

function inheritMemories(agent: Agent): string[] {
  const lines = [...agent.memories];
  if (agent.today?.why) lines.push(agent.today.why);
  return lines.slice(-2);
}

function restartAfterCollapse(world: World, clock: FarmState["clock"]): World {
  const failed = world.farm;
  const inherited = world.agents.agents.flatMap((a) => inheritMemories(a));
  const farm: FarmState = {
    version: "0.1",
    experiment: failed.experiment + 1,
    day: 1,
    weather: "clear",
    resources: { ...FOUNDING_RESOURCES },
    field: { planted: false, cropStage: "empty", hasIrrigation: false },
    collapse: { waterZeroStreak: 0 },
    metrics: {
      interventionsToday: 0,
      aiDecisionsToday: 0,
      humanDecisionsToday: 0,
    },
    clock,
    failure: failed.failure,
  };
  const agents = world.agents.agents.map((agent) => ({
    ...agent,
    location: agent.id === "bob" ? ("house" as const) : ("field" as const),
    memories: inheritMemories(agent),
    today: {
      action: "do_nothing" as const,
      location: agent.location,
      what: "Waiting for the first morning of the new experiment.",
      why: "The last farm ended.",
      expect: "A new decision tomorrow.",
      result: null,
      failure: null,
    },
    yesterday: null,
  }));
  const experiments = {
    current: farm.experiment,
    experiments: [
      ...world.experiments.experiments.map((e) =>
        e.number === failed.experiment
          ? {
              ...e,
              endedOn: failed.clock.dayStartedOn,
              days: failed.day,
              status: "collapsed" as const,
              collapseReason: failed.failure?.detail ?? null,
            }
          : e,
      ),
      {
        number: farm.experiment,
        startedOn: clock.dayStartedOn,
        endedOn: null,
        days: 1,
        status: "running" as const,
        collapseReason: null,
        inheritedMemories: inherited,
      },
    ],
  };
  return {
    farm,
    agents: { agents },
    history: { entries: [] },
    experiments,
  };
}

export type TickResult = {
  world: World;
  invalid: { agentId: AgentId | "unknown"; reason: string }[];
};

/**
 * Resolve yesterday's pending actions, then install today's new intents.
 * Callers (a future git tick) supply clock labels. The engine never talks to a model.
 */
export function advanceDay(
  world: World,
  rawIntents: unknown[],
  clock: FarmState["clock"],
): TickResult {
  const invalid: TickResult["invalid"] = [];
  let farm = cloneFarm(world.farm);
  const agents: Agent[] = world.agents.agents.map((a) => ({
    ...a,
    memories: [...a.memories],
    today: { ...a.today },
    yesterday: a.yesterday ? { ...a.yesterday } : null,
  }));

  const ration = applyRation(farm);
  farm = ration.farm;
  farm = applyWeather(farm);

  const consequences: HistoryEntry[] = [];
  consequences.push({
    id: `e${farm.experiment}-d${farm.day}-ration`,
    experiment: farm.experiment,
    day: farm.day,
    date: farm.clock.dayStartedOn,
    layer: "consequence",
    agentId: null,
    what: ration.result,
    why: null,
    expect: null,
    result: ration.result,
    failure: null,
  });

  for (const agent of agents) {
    const pending = agent.today;
    const parsed = parseAiAction({
      agentId: agent.id,
      action: pending.action,
      location: pending.location,
      why: pending.why,
      expect: pending.expect,
    });
    let record: ActionRecord;
    if (!parsed.ok) {
      invalid.push({ agentId: agent.id, reason: parsed.reason });
      const noop = applyAction(farm, {
        agentId: agent.id,
        action: "do_nothing",
        location: agent.location,
        why: pending.why,
        expect: pending.expect,
      });
      farm = noop.farm;
      record = {
        ...pending,
        what: ACTION_WHAT.do_nothing,
        result: "Invalid action. Treated as do_nothing.",
        failure: "invalid_action",
      };
    } else {
      const out = applyAction(farm, parsed.action);
      farm = out.farm;
      agent.location = parsed.action.location;
      record = {
        ...pending,
        action: parsed.action.action,
        location: parsed.action.location,
        what: ACTION_WHAT[parsed.action.action],
        why: parsed.action.why,
        expect: parsed.action.expect,
        result: out.result,
        failure: null,
      };
    }
    agent.yesterday = record;
    consequences.push({
      id: `e${farm.experiment}-d${farm.day}-${agent.id}-c`,
      experiment: farm.experiment,
      day: farm.day,
      date: farm.clock.dayStartedOn,
      layer: "consequence",
      agentId: agent.id,
      what: record.what,
      why: record.why,
      expect: record.expect,
      result: record.result ?? null,
      failure: record.failure ?? null,
    });
  }

  farm = growCrop(farm);
  farm = checkCollapse(farm);

  if (farm.failure) {
    const collapsed: World = {
      farm,
      agents: { agents },
      history: { entries: [...world.history.entries, ...consequences] },
      experiments: world.experiments,
    };
    return { world: restartAfterCollapse(collapsed, clock), invalid };
  }

  farm.day += 1;
  farm.clock = clock;
  farm.metrics = {
    interventionsToday: 0,
    aiDecisionsToday: 0,
    humanDecisionsToday: 0,
  };

  const seen = new Set<AgentId>();
  const newToday: Record<AgentId, ActionRecord> = {
    bob: fallbackWait("bob"),
    alice: fallbackWait("alice"),
  };

  for (const raw of rawIntents) {
    const parsed = parseAiAction(raw);
    if (!parsed.ok) {
      invalid.push({ agentId: "unknown", reason: parsed.reason });
      continue;
    }
    if (seen.has(parsed.action.agentId)) {
      invalid.push({
        agentId: parsed.action.agentId,
        reason: "A second action from the same agent was ignored.",
      });
      continue;
    }
    seen.add(parsed.action.agentId);
    farm.metrics.aiDecisionsToday += 1;
    newToday[parsed.action.agentId] = {
      action: parsed.action.action,
      location: parsed.action.location,
      what: ACTION_WHAT[parsed.action.action],
      why: parsed.action.why,
      expect: parsed.action.expect,
      result: null,
      failure: null,
    };
  }

  for (const agent of agents) {
    agent.today = newToday[agent.id];
    agent.location = agent.today.location;
  }

  const date = clock.dayStartedOn;
  const todayEntries: HistoryEntry[] = [
    {
      id: `e${farm.experiment}-d${farm.day}-today`,
      experiment: farm.experiment,
      day: farm.day,
      date,
      layer: "today",
      agentId: null,
      what: `Day ${farm.day}. Weather ${farm.weather}.`,
      why: null,
      expect: null,
      result: null,
      failure: null,
    },
    ...agents.map((agent) => ({
      id: `e${farm.experiment}-d${farm.day}-${agent.id}`,
      experiment: farm.experiment,
      day: farm.day,
      date,
      layer: "decision" as const,
      agentId: agent.id,
      what: agent.today.what,
      why: agent.today.why,
      expect: agent.today.expect,
      result: null,
      failure: agent.today.failure ?? null,
    })),
  ];

  const experiments = {
    ...world.experiments,
    experiments: world.experiments.experiments.map((e) =>
      e.number === farm.experiment ? { ...e, days: farm.day } : e,
    ),
  };

  return {
    world: {
      farm,
      agents: { agents },
      history: { entries: [...world.history.entries, ...consequences, ...todayEntries] },
      experiments,
    },
    invalid,
  };
}

function fallbackWait(id: AgentId): ActionRecord {
  return {
    action: "do_nothing",
    location: id === "bob" ? "house" : "field",
    what: ACTION_WHAT.do_nothing,
    why: "No legal action was submitted this morning.",
    expect: "The world holds.",
    result: null,
    failure: null,
  };
}

function cloneFarm(farm: FarmState): FarmState {
  return structuredClone(farm);
}

export function autonomyShare(farm: FarmState): number {
  const total = farm.metrics.aiDecisionsToday + farm.metrics.humanDecisionsToday;
  if (total === 0) return 1;
  return farm.metrics.aiDecisionsToday / total;
}

export function formatAutonomy(farm: FarmState): string {
  const pct = Math.round(autonomyShare(farm) * 100);
  return `${pct}%`;
}

