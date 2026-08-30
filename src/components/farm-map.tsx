import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LOCATION_LABEL, WEATHER_LABEL } from "@/lib/farm/labels";
import type { Agent, LocationId } from "@/lib/farm/types";
import { agentsAt, world } from "@/lib/farm/world";
import { cn } from "@/lib/utils";

function AgentFigure({ agent }: { agent: Agent }) {
  const isBob = agent.id === "bob";
  return (
    <Link
      to="/agents/$id"
      params={{ id: agent.id }}
      className="flex w-14 flex-col items-center gap-1 text-center transition-opacity duration-150 hover:opacity-80"
    >
      <svg viewBox="0 0 40 52" className="h-12 w-9" aria-hidden="true">
        {isBob ? (
          <>
            <ellipse cx="20" cy="11" rx="16" ry="3.5" className="fill-hat" />
            <rect x="12" y="3.5" width="16" height="8" rx="2" className="fill-hat" />
            <circle cx="20" cy="18" r="6.5" className="fill-fg" />
            <rect x="13" y="25" width="14" height="16" rx="3" className="fill-sage" />
          </>
        ) : (
          <>
            <polygon points="7,11 20,1 33,11 27,15 13,15" className="fill-bandana" />
            <circle cx="20" cy="18" r="6.5" className="fill-fg" />
            <rect x="13" y="25" width="14" height="16" rx="3" className="fill-sage-soft" />
          </>
        )}
        <ellipse cx="20" cy="49" rx="8" ry="2" className="fill-fg/15" />
      </svg>
      <span className="font-mono text-xs leading-none text-fg">{agent.name}</span>
    </Link>
  );
}

function ForestArt() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden="true">
      <polygon points="22,70 38,22 54,70" className="fill-sage" />
      <polygon points="48,70 68,10 88,70" className="fill-sage-soft" />
      <polygon points="72,70 90,28 108,70" className="fill-sage" />
      <rect x="35" y="70" width="6" height="6" className="fill-roof" />
      <rect x="63" y="70" width="8" height="6" className="fill-roof" />
      <rect x="87" y="70" width="6" height="6" className="fill-roof" />
    </svg>
  );
}

function FieldArt({ planted }: { planted: boolean }) {
  const rows = [18, 30, 42, 54, 66];
  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden="true">
      {rows.map((y) => (
        <g key={y}>
          <line
            x1="12"
            y1={y}
            x2="148"
            y2={y}
            className="stroke-sage-soft"
            strokeWidth="2"
          />
          {planted
            ? [28, 52, 76, 100, 124].map((x) => (
                <rect
                  key={x}
                  x={x}
                  y={y - 8}
                  width="3"
                  height="8"
                  className="fill-sage"
                />
              ))
            : null}
        </g>
      ))}
    </svg>
  );
}

function PondArt() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden="true">
      <ellipse cx="60" cy="42" rx="46" ry="24" className="fill-pond/70" />
      <ellipse cx="60" cy="42" rx="30" ry="14" className="fill-pond" />
      <ellipse cx="50" cy="36" rx="10" ry="4" className="fill-bg/30" />
    </svg>
  );
}

function HouseArt() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden="true">
      <polygon points="24,40 60,12 96,40" className="fill-roof" />
      <rect x="32" y="40" width="56" height="32" className="fill-sunken" />
      <rect x="52" y="50" width="16" height="22" className="fill-hat" />
    </svg>
  );
}

function StorageArt() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden="true">
      <rect x="22" y="28" width="76" height="8" className="fill-roof" />
      <rect x="26" y="36" width="68" height="30" className="fill-sunken" />
      <rect x="54" y="46" width="14" height="20" className="fill-hat" />
    </svg>
  );
}

const ART: Record<LocationId, (planted: boolean) => ReactNode> = {
  forest: () => <ForestArt />,
  field: (planted) => <FieldArt planted={planted} />,
  pond: () => <PondArt />,
  house: () => <HouseArt />,
  storage: () => <StorageArt />,
};

function Cell({
  id,
  planted,
}: {
  id: LocationId;
  planted: boolean;
}) {
  const here = agentsAt(id);
  return (
    <div className={cn("plot-cell", `plot-${id}`)}>
      <p className="pointer-events-none absolute left-2 top-2 z-10 rounded-sm bg-surface px-2 py-0.5 font-mono text-xs tracking-wide text-muted uppercase">
        {LOCATION_LABEL[id]}
      </p>
      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pt-6">
        {ART[id](planted)}
      </div>
      <div className="flex min-h-14 items-end justify-center gap-2 pb-2">
        {here.map((agent) => (
          <AgentFigure key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

export function FarmMap({ compact = false }: { compact?: boolean }) {
  const { farm, agents } = world;
  const bob = agents.agents.find((a) => a.id === "bob");
  const alice = agents.agents.find((a) => a.id === "alice");
  return (
    <figure className="grid gap-3">
      <div
        className={cn("plot", compact && "sm:min-h-80")}
        data-weather={farm.weather}
        role="img"
        aria-label={`Tiny farm map. Weather ${WEATHER_LABEL[farm.weather]}. Bob at ${LOCATION_LABEL[bob?.location ?? "house"]}. Alice at ${LOCATION_LABEL[alice?.location ?? "field"]}.`}
      >
        <Cell id="forest" planted={farm.field.planted} />
        <Cell id="field" planted={farm.field.planted} />
        <Cell id="pond" planted={farm.field.planted} />
        <Cell id="house" planted={farm.field.planted} />
        <Cell id="storage" planted={farm.field.planted} />
      </div>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs text-muted">
        <span>Weather · {WEATHER_LABEL[farm.weather]}</span>
        <span>
          Crop · {farm.field.cropStage}
          {farm.field.hasIrrigation ? " · irrigation" : ""}
        </span>
      </figcaption>
    </figure>
  );
}
