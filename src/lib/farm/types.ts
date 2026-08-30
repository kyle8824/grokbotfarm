export const WEATHERS = ["clear", "cloudy", "rain", "drought"] as const;
export type Weather = (typeof WEATHERS)[number];

export const LOCATIONS = ["house", "field", "forest", "pond", "storage"] as const;
export type LocationId = (typeof LOCATIONS)[number];

export const ACTIONS = [
  "rest",
  "draw_water",
  "water_field",
  "plant_seeds",
  "harvest",
  "chop_wood",
  "store",
  "scout",
  "dig_irrigation",
  "do_nothing",
] as const;
export type ActionId = (typeof ACTIONS)[number];

export const AGENT_IDS = ["bob", "alice"] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export const CROP_STAGES = ["empty", "seeded", "sprout", "growing", "ripe"] as const;
export type CropStage = (typeof CROP_STAGES)[number];

export const LOG_LAYERS = ["today", "decision", "consequence"] as const;
export type LogLayer = (typeof LOG_LAYERS)[number];

export const AI_ACTION_KEYS = ["agentId", "action", "location", "why", "expect"] as const;

/** The only JSON an agent is allowed to emit. Extra keys are illegal. */
export type AiAction = {
  agentId: AgentId;
  action: ActionId;
  location: LocationId;
  why: string;
  expect: string;
};

export type ActionRecord = {
  action: ActionId;
  location: LocationId;
  what: string;
  why: string;
  expect: string;
  result?: string | null;
  failure?: string | null;
};

export type Agent = {
  id: AgentId;
  name: string;
  disposition: "conservative" | "experimental";
  mark: string;
  location: LocationId;
  memories: string[];
  today: ActionRecord;
  yesterday: ActionRecord | null;
};

export type AgentsFile = {
  agents: Agent[];
};

export type FarmFailure = {
  message: "AI experiment failed";
  detail: string;
  experiment: number;
  day: number;
  reason: "water" | "food";
};

export type FarmState = {
  version: "0.1";
  experiment: number;
  day: number;
  weather: Weather;
  resources: {
    corn: number;
    water: number;
    wood: number;
    seeds: number;
    fieldMoisture: number;
  };
  field: {
    planted: boolean;
    cropStage: CropStage;
    hasIrrigation: boolean;
  };
  collapse: {
    waterZeroStreak: number;
  };
  metrics: {
    interventionsToday: number;
    aiDecisionsToday: number;
    humanDecisionsToday: number;
  };
  clock: {
    timezone: string;
    dayStartedOn: string;
    nextDecisionAt: string;
    nextDecisionLabel: string;
  };
  failure: FarmFailure | null;
};

export type HistoryEntry = {
  id: string;
  experiment: number;
  day: number;
  date: string;
  layer: LogLayer;
  agentId: AgentId | null;
  what: string;
  why: string | null;
  expect: string | null;
  result: string | null;
  failure: string | null;
};

export type HistoryFile = {
  entries: HistoryEntry[];
};

export type ExperimentRecord = {
  number: number;
  startedOn: string;
  endedOn: string | null;
  days: number;
  status: "running" | "collapsed";
  collapseReason: string | null;
  inheritedMemories: string[];
};

export type ExperimentsFile = {
  current: number;
  experiments: ExperimentRecord[];
};

export type World = {
  farm: FarmState;
  agents: AgentsFile;
  history: HistoryFile;
  experiments: ExperimentsFile;
};
