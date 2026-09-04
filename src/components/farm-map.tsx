import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LOCATION_LABEL, WEATHER_LABEL } from "@/lib/farm/labels";
import type {
  Agent,
  CropStage,
  FarmState,
  LocationId,
  Weather,
} from "@/lib/farm/types";
import { agentsAt, world } from "@/lib/farm/world";
import { cn } from "@/lib/utils";

function truncateWhat(what: string, max = 42): string {
  const cleaned = what.replace(/\.$/, "").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function AgentFigure({ agent }: { agent: Agent }) {
  const isBob = agent.id === "bob";
  const bubble = truncateWhat(agent.today.what);
  return (
    <Link
      to="/agents/$id"
      params={{ id: agent.id }}
      className="agent-figure group relative flex w-16 flex-col items-center gap-1 text-center transition-opacity duration-150 hover:opacity-90"
    >
      <span className="agent-bubble" title={agent.today.what}>
        {bubble}
      </span>
      <svg
        viewBox="0 0 40 52"
        className="agent-sprite h-12 w-9"
        aria-hidden="true"
      >
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

function FieldArt({
  cropStage,
  hasIrrigation,
}: {
  cropStage: CropStage;
  hasIrrigation: boolean;
}) {
  const rows = [18, 30, 42, 54, 66];
  const xs = [28, 52, 76, 100, 124];

  return (
    <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden="true">
      {rows.map((y) => (
        <line
          key={`furrow-${y}`}
          x1="12"
          y1={y}
          x2="148"
          y2={y}
          className="stroke-sage-soft/70"
          strokeWidth="2"
        />
      ))}

      {hasIrrigation ? (
        <g className="irrigation-ditch" aria-hidden="true">
          <path
            d="M8 12 C 28 22, 48 8, 72 18 S 112 10, 152 22"
            fill="none"
            className="stroke-pond"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M8 12 C 28 22, 48 8, 72 18 S 112 10, 152 22"
            fill="none"
            className="stroke-pond"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>
      ) : null}

      {rows.map((y, rowIdx) => (
        <g key={`crops-${y}`} className="crop-row">
          {xs.map((x, colIdx) => {
            const key = `${y}-${x}`;
            if (cropStage === "empty") return null;
            if (cropStage === "seeded") {
              return (
                <circle
                  key={key}
                  cx={x + 1.5}
                  cy={y - 1}
                  r="1.6"
                  className="fill-roof/80"
                />
              );
            }
            if (cropStage === "sprout") {
              return (
                <g key={key} className="crop-sway" style={{ animationDelay: `${(rowIdx + colIdx) * 80}ms` }}>
                  <rect x={x + 1} y={y - 7} width="2" height="7" rx="1" className="fill-sage" />
                  <ellipse cx={x + 2} cy={y - 8} rx="2.2" ry="1.4" className="fill-sage-soft" />
                </g>
              );
            }
            if (cropStage === "growing") {
              return (
                <g key={key} className="crop-sway" style={{ animationDelay: `${(rowIdx + colIdx) * 70}ms` }}>
                  <rect x={x} y={y - 14} width="3" height="14" rx="1.5" className="fill-sage" />
                  <ellipse cx={x + 1.5} cy={y - 15} rx="4" ry="2.5" className="fill-sage-soft" />
                  <ellipse cx={x - 1} cy={y - 10} rx="2.5" ry="1.5" className="fill-sage" />
                </g>
              );
            }
            // ripe
            return (
              <g key={key} className="crop-sway" style={{ animationDelay: `${(rowIdx + colIdx) * 60}ms` }}>
                <rect x={x} y={y - 18} width="3" height="18" rx="1.5" className="fill-sage" />
                <ellipse cx={x + 1.5} cy={y - 20} rx="4.5" ry="3" className="fill-sage-soft" />
                <ellipse cx={x + 5} cy={y - 14} rx="3" ry="4" className="fill-hat" />
                <ellipse cx={x - 2} cy={y - 12} rx="2.2" ry="3" className="fill-hat/80" />
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

function PondArt({ water }: { water: number }) {
  const level = Math.max(0, Math.min(100, water)) / 100;
  const rx = 28 + level * 22;
  const ry = 14 + level * 12;
  const opacity = 0.35 + level * 0.55;
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden="true">
      <ellipse
        cx="60"
        cy="42"
        rx={rx + 8}
        ry={ry + 6}
        className="fill-pond/40 pond-ring"
        style={{ opacity: opacity * 0.7 }}
      />
      <ellipse
        cx="60"
        cy="42"
        rx={rx}
        ry={ry}
        className="fill-pond pond-body"
        style={{ opacity }}
      />
      <ellipse
        cx="50"
        cy={42 - ry * 0.25}
        rx={Math.max(6, rx * 0.28)}
        ry={Math.max(2.5, ry * 0.22)}
        className="fill-bg/35 pond-shine"
      />
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

function StorageArt({ corn, seeds }: { corn: number; seeds: number }) {
  const cornH = Math.max(2, Math.min(22, (corn / 100) * 22));
  const seedH = Math.max(2, Math.min(18, (seeds / 40) * 18));
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden="true">
      <rect x="22" y="28" width="76" height="8" className="fill-roof" />
      <rect x="26" y="36" width="68" height="30" className="fill-sunken" />
      <rect x="54" y="46" width="14" height="20" className="fill-hat" />
      {/* Corn bin */}
      <rect x="32" y={62 - cornH} width="14" height={cornH} rx="1" className="fill-hat" />
      <rect x="32" y="40" width="14" height="22" rx="1" className="fill-none stroke-fg/20" strokeWidth="1" />
      {/* Seed sack */}
      <rect x="78" y={62 - seedH} width="10" height={seedH} rx="2" className="fill-sage-soft" />
      <ellipse cx="83" cy={62 - seedH} rx="5" ry="2.5" className="fill-sage" />
    </svg>
  );
}

function RainOverlay() {
  return (
    <div className="rain-overlay" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="raindrop"
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 7) * 0.18}s`,
            animationDuration: `${0.9 + (i % 5) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function CloudOverlay() {
  return (
    <div className="cloud-overlay" aria-hidden="true">
      <span className="cloud cloud-a" />
      <span className="cloud cloud-b" />
      <span className="cloud cloud-c" />
    </div>
  );
}

function moistureTone(moisture: number): string {
  // Wet → greener/cooler; dry → warmer/dustier
  const m = Math.max(0, Math.min(100, moisture));
  if (m >= 70) return "field-wet";
  if (m >= 40) return "field-damp";
  if (m >= 20) return "field-dry";
  return "field-parched";
}

function Cell({
  id,
  farm,
}: {
  id: LocationId;
  farm: FarmState;
}) {
  const here = agentsAt(id);
  const art: Record<LocationId, ReactNode> = {
    forest: <ForestArt />,
    field: (
      <FieldArt
        cropStage={farm.field.cropStage}
        hasIrrigation={farm.field.hasIrrigation}
      />
    ),
    pond: <PondArt water={farm.resources.water} />,
    house: <HouseArt />,
    storage: (
      <StorageArt corn={farm.resources.corn} seeds={farm.resources.seeds} />
    ),
  };

  return (
    <div
      className={cn(
        "plot-cell",
        `plot-${id}`,
        id === "field" && moistureTone(farm.resources.fieldMoisture),
      )}
    >
      <p className="pointer-events-none absolute left-2 top-2 z-10 rounded-sm bg-surface/90 px-2 py-0.5 font-mono text-xs tracking-wide text-muted uppercase">
        {LOCATION_LABEL[id]}
      </p>
      {id === "field" && farm.field.hasIrrigation ? (
        <p className="pointer-events-none absolute right-2 top-2 z-10 rounded-sm bg-pond/15 px-2 py-0.5 font-mono text-[10px] tracking-wide text-pond uppercase">
          ditch
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pt-6">
        {art[id]}
      </div>
      <div className="relative z-10 flex min-h-16 items-end justify-center gap-2 pb-2">
        {here.map((agent) => (
          <AgentFigure key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function ResourceHud({ farm }: { farm: FarmState }) {
  const chips = [
    {
      label: "Corn",
      value: farm.resources.corn,
      max: 100,
      tone: "hud-corn",
    },
    {
      label: "Water",
      value: farm.resources.water,
      max: 100,
      tone: "hud-water",
    },
    {
      label: "Wood",
      value: farm.resources.wood,
      max: null as number | null,
      tone: "hud-wood",
    },
    {
      label: "Seeds",
      value: farm.resources.seeds,
      max: null as number | null,
      tone: "hud-seeds",
    },
    {
      label: "Moisture",
      value: farm.resources.fieldMoisture,
      max: 100,
      tone: "hud-moisture",
      suffix: "%",
    },
  ];

  return (
    <ul className="resource-hud" aria-label="Resources">
      {chips.map((chip) => {
        const pct =
          chip.max !== null
            ? Math.min(100, (chip.value / chip.max) * 100)
            : null;
        return (
          <li key={chip.label} className={cn("hud-chip", chip.tone)}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[10px] tracking-wide text-muted uppercase">
                {chip.label}
              </span>
              <span className="font-mono text-xs tabular-nums text-fg">
                {chip.value}
                {chip.suffix ?? ""}
                {chip.max !== null ? (
                  <span className="text-faint">/{chip.max}</span>
                ) : null}
              </span>
            </div>
            {pct !== null ? (
              <div className="hud-bar">
                <div className="hud-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            ) : (
              <div className="hud-bar hud-bar-empty" />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function weatherLabel(weather: Weather): string {
  return WEATHER_LABEL[weather];
}

export function FarmMap({
  compact = false,
  showHud = true,
}: {
  compact?: boolean;
  showHud?: boolean;
}) {
  const { farm, agents } = world;
  const bob = agents.agents.find((a) => a.id === "bob");
  const alice = agents.agents.find((a) => a.id === "alice");

  return (
    <figure className="grid gap-3">
      <div
        className={cn("plot", compact && "plot-compact")}
        data-weather={farm.weather}
        data-crop={farm.field.cropStage}
        role="img"
        aria-label={`Tiny farm map. Weather ${weatherLabel(farm.weather)}. Crop ${farm.field.cropStage}. Bob at ${LOCATION_LABEL[bob?.location ?? "house"]}. Alice at ${LOCATION_LABEL[alice?.location ?? "field"]}.`}
      >
        {(farm.weather === "rain" || farm.weather === "cloudy") && (
          <CloudOverlay />
        )}
        {farm.weather === "rain" ? <RainOverlay /> : null}
        <div className="weather-veil" aria-hidden="true" />
        <Cell id="forest" farm={farm} />
        <Cell id="field" farm={farm} />
        <Cell id="pond" farm={farm} />
        <Cell id="house" farm={farm} />
        <Cell id="storage" farm={farm} />
      </div>

      {showHud ? <ResourceHud farm={farm} /> : null}

      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs text-muted">
        <span>Weather · {weatherLabel(farm.weather)}</span>
        <span>
          Crop · {farm.field.cropStage}
          {farm.field.hasIrrigation ? " · irrigation" : ""}
          {" · "}
          moisture {farm.resources.fieldMoisture}%
        </span>
      </figcaption>
    </figure>
  );
}
