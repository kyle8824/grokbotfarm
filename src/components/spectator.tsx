import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  cliffhangerTease,
  computeConflict,
  computeEra,
  computeSurvival,
  detectMoments,
  formatCountdown,
  ghostExperiments,
  type MomentBanner,
  type RiskLevel,
} from "@/lib/farm/drama";
import { world } from "@/lib/farm/world";
import { cn } from "@/lib/utils";

function riskClass(level: RiskLevel): string {
  return `risk-${level}`;
}

export function SurvivalMeter() {
  const survival = computeSurvival(world.farm);
  return (
    <section
      className={cn("survival-meter", riskClass(survival.level))}
      aria-label="Farm survival risk"
    >
      <div className="survival-meter-head">
        <div>
          <p className="font-mono text-[10px] tracking-wide uppercase opacity-80">
            Survival
          </p>
          <h2 className="font-display text-xl font-medium tracking-tight sm:text-2xl">
            {survival.headline}
          </h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-wide uppercase opacity-80">
            Days to empty bin
          </p>
          <p className="font-display text-2xl tabular-nums leading-none sm:text-3xl">
            {survival.daysOfCorn}
          </p>
        </div>
      </div>
      <div className="survival-track" aria-hidden="true">
        <div
          className="survival-fill"
          style={{ width: `${Math.max(4, survival.score)}%` }}
        />
        <div className="survival-pulse" />
      </div>
      <p className="mt-2 text-sm opacity-90">{survival.detail}</p>
      <ul className="survival-factors">
        {survival.factors.map((f) => (
          <li key={f.id} className={cn("survival-factor", `tone-${f.tone}`)}>
            {f.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EraLadderBar() {
  const era = computeEra(world);
  return (
    <section className="era-ladder" aria-label="Farm era progress">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] tracking-wide text-muted uppercase">
            Era
          </p>
          <h2 className="font-display text-lg font-medium tracking-tight sm:text-xl">
            {era.label}
          </h2>
        </div>
        <p className="max-w-sm text-right font-mono text-[10px] text-muted sm:text-xs">
          {era.blurb}
        </p>
      </div>
      <div className="era-track" aria-hidden="true">
        <div className="era-fill" style={{ width: `${era.progress}%` }} />
        <div className="era-marks">
          <span data-era="seed" className={era.era !== "seed" || era.progress > 0 ? "lit" : ""}>
            Seed
          </span>
          <span
            data-era="living"
            className={
              era.era === "living" ||
              era.era === "expanding" ||
              era.era === "settlement"
                ? "lit"
                : ""
            }
          >
            Living
          </span>
          <span
            data-era="expanding"
            className={era.era === "expanding" || era.era === "settlement" ? "lit" : ""}
          >
            Expanding
          </span>
          <span data-era="settlement" className={era.era === "settlement" ? "lit" : ""}>
            Settlement
          </span>
        </div>
      </div>
      <ul className="era-milestones">
        {era.milestones.map((m) => (
          <li key={m.id} className={cn("era-milestone", m.done && "done")}>
            <span className="era-check" aria-hidden="true">
              {m.done ? "◆" : "◇"}
            </span>
            <span>{m.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CliffhangerClock() {
  const { farm, agents } = world;
  const target = Date.parse(farm.clock.nextDecisionAt);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ms = now === null ? Math.max(0, target - Date.now()) : Math.max(0, target - now);
  const cd = formatCountdown(ms);
  const tease = cliffhangerTease(agents.agents);

  return (
    <section
      className={cn("cliffhanger", cd.urgent && "cliffhanger-urgent")}
      aria-label="Next AI decision countdown"
    >
      <div className="cliffhanger-ep">
        <p className="font-mono text-[10px] tracking-wide uppercase">
          Episode · Day {farm.day}
        </p>
        <h2 className="font-display text-lg font-medium tracking-tight sm:text-xl">
          Next decision
        </h2>
      </div>
      <div className="cliffhanger-clock" aria-live="polite">
        <span className="cliffhanger-digits font-mono tabular-nums">
          {now === null ? farm.clock.nextDecisionLabel : cd.label}
        </span>
        <span className="font-mono text-[10px] text-muted uppercase">
          {farm.clock.nextDecisionLabel}
        </span>
      </div>
      <p className="cliffhanger-tease">{tease}</p>
    </section>
  );
}

function MomentCard({ moment }: { moment: MomentBanner }) {
  return (
    <article className={cn("moment-card", `moment-${moment.tone}`, `moment-kind-${moment.kind}`)}>
      <p className="font-mono text-[10px] tracking-wide uppercase opacity-80">
        Moment
      </p>
      <h3 className="font-display text-base font-medium tracking-tight sm:text-lg">
        {moment.title}
      </h3>
      <p className="mt-1 text-sm opacity-90">{moment.body}</p>
    </article>
  );
}

export function MomentBanners() {
  const moments = detectMoments(world);
  if (moments.length === 0) return null;
  return (
    <section className="moment-row" aria-label="Moments">
      {moments.map((m) => (
        <MomentCard key={m.id} moment={m} />
      ))}
    </section>
  );
}

export function ConflictChip() {
  const conflict = computeConflict(world.agents.agents);
  return (
    <div
      className={cn("conflict-chip", conflict.diverge ? "conflict-hot" : "conflict-cool")}
      role="status"
    >
      <span className="conflict-dot" aria-hidden="true" />
      <span>{conflict.chip}</span>
    </div>
  );
}

export function GhostStrip() {
  const ghosts = ghostExperiments(world.experiments.experiments);
  return (
    <section className="ghost-strip" aria-label="Past experiments">
      <p className="font-mono text-[10px] tracking-wide text-muted uppercase">
        Graveyard
      </p>
      {ghosts.length === 0 ? (
        <p className="ghost-empty">
          No ghosts yet — Experiment #{world.farm.experiment} still breathing.
        </p>
      ) : (
        <ul className="ghost-list">
          {ghosts.map((g) => (
            <li key={g.number} className="ghost-card">
              <span className="ghost-num">#{g.number}</span>
              <span className="ghost-days">{g.days}d</span>
              <span className="ghost-reason">
                {g.reason ?? "Collapsed"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SpectacleChrome() {
  return (
    <div className="spectacle-chrome">
      <CliffhangerClock />
      <SurvivalMeter />
      <EraLadderBar />
      <MomentBanners />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ConflictChip />
        <Link to="/log" className="log-tap">
          Open the log →
        </Link>
      </div>
      <GhostStrip />
    </div>
  );
}
