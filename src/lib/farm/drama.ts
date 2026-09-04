/**
 * Spectator drama derived from public farm JSON.
 * Pure helpers — no writes. Safe for 8am tick; optional fields only.
 */
import type {
  ActionId,
  Agent,
  ExperimentRecord,
  FarmState,
  HistoryEntry,
  World,
} from "./types";

const DAILY_RATION = 2;

export type RiskLevel = "stable" | "tense" | "critical" | "dying";

export type SurvivalDrama = {
  level: RiskLevel;
  score: number; // 0 = fine, 100 = collapse-imminent
  daysOfCorn: number;
  daysToCollapseHint: string;
  headline: string;
  detail: string;
  factors: { id: string; label: string; tone: RiskLevel }[];
};

export type EraId = "seed" | "living" | "expanding" | "settlement";

export type EraMilestone = {
  id: string;
  label: string;
  done: boolean;
  hint: string;
};

export type EraLadder = {
  era: EraId;
  label: string;
  progress: number; // 0–100 toward next / full
  milestones: EraMilestone[];
  blurb: string;
};

export type MomentKind =
  | "harvest"
  | "near_collapse"
  | "ditch"
  | "ripe"
  | "sprout"
  | "drought"
  | "rain";

export type MomentBanner = {
  id: string;
  kind: MomentKind;
  title: string;
  body: string;
  tone: "good" | "warn" | "danger" | "info";
};

export type ConflictDrama = {
  diverge: boolean;
  chip: string;
  bobLine: string;
  aliceLine: string;
};

export type GhostExperiment = {
  number: number;
  days: number;
  reason: string | null;
  endedOn: string | null;
};

export type MemoryPlaque = {
  id: string;
  sourceExperiment: number;
  line: string;
};

function actionFamily(action: ActionId): string {
  switch (action) {
    case "draw_water":
    case "water_field":
      return "water";
    case "plant_seeds":
    case "harvest":
      return "crop";
    case "dig_irrigation":
      return "infra";
    case "chop_wood":
    case "scout":
      return "explore";
    case "store":
    case "rest":
    case "do_nothing":
      return "hold";
    default:
      return "other";
  }
}

function shortWhat(what: string): string {
  return what.replace(/\.$/, "").trim();
}

export function computeSurvival(farm: FarmState): SurvivalDrama {
  const { corn, water, seeds, fieldMoisture } = farm.resources;
  const daysOfCorn = Math.floor(corn / DAILY_RATION);
  const factors: SurvivalDrama["factors"] = [];

  let score = 0;

  // Food clock — dawn always takes 2
  if (daysOfCorn <= 1) {
    score += 45;
    factors.push({ id: "corn", label: `Corn: ${daysOfCorn} day left`, tone: "dying" });
  } else if (daysOfCorn <= 3) {
    score += 32;
    factors.push({ id: "corn", label: `Corn: ${daysOfCorn} days`, tone: "critical" });
  } else if (daysOfCorn <= 7) {
    score += 14;
    factors.push({ id: "corn", label: `Corn: ${daysOfCorn} days`, tone: "tense" });
  } else {
    factors.push({ id: "corn", label: `Corn: ${daysOfCorn} days`, tone: "stable" });
  }

  // Water cistern
  if (water <= 0) {
    score += 40;
    factors.push({ id: "water", label: "Cistern empty", tone: "dying" });
  } else if (water < 16) {
    score += 28;
    factors.push({ id: "water", label: `Water thin (${water})`, tone: "critical" });
  } else if (water < 32) {
    score += 12;
    factors.push({ id: "water", label: `Water ${water}`, tone: "tense" });
  } else {
    factors.push({ id: "water", label: `Water ${water}`, tone: "stable" });
  }

  // Field moisture while planted
  if (farm.field.planted && farm.field.cropStage !== "empty") {
    if (fieldMoisture < 15) {
      score += 22;
      factors.push({ id: "moisture", label: "Field cracking", tone: "critical" });
    } else if (fieldMoisture < 25) {
      score += 12;
      factors.push({ id: "moisture", label: `Moisture ${fieldMoisture}%`, tone: "tense" });
    }
  }

  // Seeds with empty field = future risk
  if (!farm.field.planted && seeds <= 0) {
    score += 18;
    factors.push({ id: "seeds", label: "No seeds left", tone: "critical" });
  } else if (seeds <= 2) {
    score += 8;
    factors.push({ id: "seeds", label: `Seeds ${seeds}`, tone: "tense" });
  }

  if (farm.weather === "drought") {
    score += 15;
    factors.push({ id: "weather", label: "Drought sky", tone: "critical" });
  }

  if (farm.collapse.waterZeroStreak > 0) {
    score += 25;
    factors.push({
      id: "streak",
      label: `Dry streak ${farm.collapse.waterZeroStreak}`,
      tone: "dying",
    });
  }

  score = Math.min(100, score);

  let level: RiskLevel = "stable";
  if (score >= 70) level = "dying";
  else if (score >= 45) level = "critical";
  else if (score >= 22) level = "tense";

  const headlines: Record<RiskLevel, string> = {
    stable: "Farm holding",
    tense: "Pressure rising",
    critical: "Near the edge",
    dying: "Collapse window",
  };

  const details: Record<RiskLevel, string> = {
    stable: `${daysOfCorn} days of corn at the dawn ration. The plot breathes.`,
    tense: `About ${daysOfCorn} dawn rations in the bin. Watch water and the row.`,
    critical: `Only ${daysOfCorn} day${daysOfCorn === 1 ? "" : "s"} of corn — one bad stretch ends it.`,
    dying: `Starvation or thirst is close. ${daysOfCorn} ration day${daysOfCorn === 1 ? "" : "s"} left.`,
  };

  return {
    level,
    score,
    daysOfCorn,
    daysToCollapseHint:
      daysOfCorn <= 0
        ? "No corn for dawn"
        : `~${daysOfCorn} day${daysOfCorn === 1 ? "" : "s"} to empty bin`,
    headline: headlines[level],
    detail: details[level],
    factors,
  };
}

function countHarvests(history: HistoryEntry[]): number {
  return history.filter(
    (e) =>
      e.layer === "consequence" &&
      (e.what.toLowerCase().includes("harvest") ||
        (e.result ?? "").toLowerCase().includes("harvested")),
  ).length;
}

function everDugDitch(farm: FarmState, history: HistoryEntry[]): boolean {
  if (farm.field.hasIrrigation) return true;
  return history.some(
    (e) =>
      e.what.toLowerCase().includes("irrigation") ||
      (e.result ?? "").toLowerCase().includes("irrigation ditch"),
  );
}

export function computeEra(world: World): EraLadder {
  const { farm, history } = world;
  const harvests = countHarvests(history.entries);
  const ditch = everDugDitch(farm, history.entries);
  const stockpile = farm.resources.corn >= 30;
  const deepStock = farm.resources.corn >= 50 && farm.resources.wood >= 5;
  const days = farm.day;

  const milestones: EraMilestone[] = [
    {
      id: "survive3",
      label: "3 days alive",
      done: days >= 3,
      hint: "Clear the opening week",
    },
    {
      id: "ditch",
      label: "Irrigation ditch",
      done: ditch,
      hint: "Cut a ditch that holds moisture",
    },
    {
      id: "harvest",
      label: "First harvest",
      done: harvests >= 1,
      hint: "Get corn back into the bin",
    },
    {
      id: "stockpile",
      label: "Stockpile 30+",
      done: stockpile,
      hint: "Build a cushion past the ration",
    },
  ];

  const doneCount = milestones.filter((m) => m.done).length;

  let era: EraId = "seed";
  let label = "Seed";
  let blurb = "Two agents. Bare ground. Everything still reversible.";

  if (days >= 3 && (farm.field.planted || ditch)) {
    era = "living";
    label = "Living Farm";
    blurb = "Something is growing. The sky and the cistern matter every dawn.";
  }
  if (ditch && harvests >= 1) {
    era = "expanding";
    label = "Expanding";
    blurb = "Ditch cut. Harvest banked. The plot is learning to compound.";
  }
  if (ditch && harvests >= 2 && (stockpile || deepStock) && days >= 10) {
    era = "settlement";
    label = "Settlement";
    blurb = "A farm that might outlast a bad week. Rare.";
  }

  // Progress: seed 0-24, living 25-49, expanding 50-74, settlement 75-100
  // plus milestone fill within band
  const eraBase: Record<EraId, number> = {
    seed: 0,
    living: 25,
    expanding: 50,
    settlement: 75,
  };
  const within = Math.min(24, doneCount * 6 + Math.min(days, 8));
  const progress =
    era === "settlement"
      ? Math.min(100, 75 + doneCount * 5)
      : Math.min(eraBase[era] + within, eraBase[era] + 24);

  return { era, label, progress, milestones, blurb };
}

export function detectMoments(world: World): MomentBanner[] {
  const { farm, agents, history } = world;
  const moments: MomentBanner[] = [];
  const survival = computeSurvival(farm);

  if (survival.level === "dying" || survival.level === "critical") {
    moments.push({
      id: "near-collapse",
      kind: "near_collapse",
      title: survival.level === "dying" ? "Collapse window open" : "Near the edge",
      body: survival.detail,
      tone: "danger",
    });
  }

  if (farm.field.cropStage === "ripe") {
    moments.push({
      id: "ripe",
      kind: "ripe",
      title: "Crop is ripe",
      body: "The ear is standing. Leave it too long and the ration still eats the bin.",
      tone: "good",
    });
  }

  if (farm.field.cropStage === "sprout" || farm.field.cropStage === "growing") {
    moments.push({
      id: "sprout",
      kind: "sprout",
      title: farm.field.cropStage === "sprout" ? "Sprout in the row" : "Crop climbing",
      body: `Moisture ${farm.resources.fieldMoisture}%${farm.field.hasIrrigation ? " · ditch holding" : ""}.`,
      tone: "info",
    });
  }

  const yesterdayHarvest = agents.agents.some(
    (a) => a.yesterday?.action === "harvest" || (a.yesterday?.result ?? "").toLowerCase().includes("harvested"),
  );
  const recentHarvest = history.entries
    .slice(-12)
    .some(
      (e) =>
        e.layer === "consequence" &&
        ((e.result ?? "").toLowerCase().includes("harvested") ||
          e.what.toLowerCase().includes("harvest")),
    );

  if (yesterdayHarvest || (recentHarvest && farm.day <= 6)) {
    moments.push({
      id: "harvest",
      kind: "harvest",
      title: "Harvest secured",
      body: "Corn moved from the row into storage. The bin breathed.",
      tone: "good",
    });
  }

  if (farm.field.hasIrrigation) {
    const ditchRecent = history.entries.some(
      (e) =>
        e.day >= farm.day - 2 &&
        ((e.result ?? "").toLowerCase().includes("irrigation ditch") ||
          e.what.toLowerCase().includes("dug irrigation")),
    );
    if (ditchRecent || farm.day <= 5) {
      moments.push({
        id: "ditch",
        kind: "ditch",
        title: "Irrigation ditch cut",
        body: "Clear days bleed slower. Every watering after this holds longer.",
        tone: "good",
      });
    }
  }

  if (farm.weather === "drought") {
    moments.push({
      id: "drought",
      kind: "drought",
      title: "Drought overhead",
      body: "Heat pulls hard. The cistern and the ditch are the only arguments left.",
      tone: "warn",
    });
  }

  if (farm.weather === "rain") {
    moments.push({
      id: "rain",
      kind: "rain",
      title: "Rain on the plot",
      body: "Sky is doing the watering. Pond and field both drink.",
      tone: "info",
    });
  }

  // Cap to keep spectacle readable
  const priority: MomentKind[] = [
    "near_collapse",
    "ripe",
    "harvest",
    "drought",
    "ditch",
    "sprout",
    "rain",
  ];
  moments.sort(
    (a, b) => priority.indexOf(a.kind) - priority.indexOf(b.kind),
  );
  return moments.slice(0, 3);
}

export function computeConflict(agents: Agent[]): ConflictDrama {
  const bob = agents.find((a) => a.id === "bob");
  const alice = agents.find((a) => a.id === "alice");
  if (!bob || !alice) {
    return { diverge: false, chip: "", bobLine: "", aliceLine: "" };
  }

  const bobLine = shortWhat(bob.today.what);
  const aliceLine = shortWhat(alice.today.what);
  const sameAction = bob.today.action === alice.today.action;
  const sameFamily = actionFamily(bob.today.action) === actionFamily(alice.today.action);
  const diverge = !sameAction;

  let chip = "";
  if (diverge && !sameFamily) {
    chip = `Disagree · ${bob.name} ${bobLine.toLowerCase()} · ${alice.name} ${aliceLine.toLowerCase()}`;
  } else if (diverge) {
    chip = `Split focus · ${bobLine} / ${aliceLine}`;
  } else {
    chip = `Aligned · both ${bobLine.toLowerCase()}`;
  }

  // Keep chip short for HUD
  if (chip.length > 72) {
    chip = diverge
      ? `Strategies diverge · ${bob.name} ≠ ${alice.name}`
      : `Aligned today`;
  }

  return { diverge, chip, bobLine, aliceLine };
}

export function ghostExperiments(experiments: ExperimentRecord[]): GhostExperiment[] {
  return experiments
    .filter((e) => e.status === "collapsed")
    .map((e) => ({
      number: e.number,
      days: e.days,
      reason: e.collapseReason,
      endedOn: e.endedOn,
    }));
}

export function memoryPlaques(
  experiments: ExperimentRecord[],
  current: number,
): MemoryPlaque[] {
  const cur = experiments.find((e) => e.number === current);
  if (!cur || cur.inheritedMemories.length === 0) return [];
  const source = current - 1;
  return cur.inheritedMemories.map((line, i) => ({
    id: `plaque-${source}-${i}`,
    sourceExperiment: source,
    line,
  }));
}

export function cliffhangerTease(agents: Agent[]): string {
  const lines = agents.map((a) => `${a.name}: ${shortWhat(a.today.what)}`);
  if (lines.length === 0) return "Waiting on the next dawn.";
  return `Today's bet · ${lines.join(" · ")}. Results land next morning.`;
}

export function formatCountdown(ms: number): {
  label: string;
  urgent: boolean;
  parts: { h: number; m: number; s: number };
} {
  if (ms <= 0) {
    return { label: "Decision window", urgent: true, parts: { h: 0, m: 0, s: 0 } };
  }
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const urgent = ms < 60 * 60 * 1000; // under 1h
  const label =
    h > 0
      ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
      : `${m}m ${String(s).padStart(2, "0")}s`;
  return { label, urgent, parts: { h, m, s } };
}
