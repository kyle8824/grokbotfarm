import { createFileRoute, Link } from "@tanstack/react-router";
import { FarmMap } from "@/components/farm-map";
import { FailureNote } from "@/components/observe";
import { SpectacleChrome } from "@/components/spectator";
import { WEATHER_LABEL } from "@/lib/farm/labels";
import { world } from "@/lib/farm/world";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { farm } = world;

  return (
    <div className="spectacle-home grid gap-5">
      <header className="spectacle-masthead">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-wide text-sage uppercase">
              Live observatory · Exp #{farm.experiment}
            </p>
            <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Day {farm.day}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted">
              {WEATHER_LABEL[farm.weather]} · no visitor controls
            </p>
          </div>
          <Link to="/log" className="log-tap log-tap-hero">
            Log
          </Link>
        </div>
      </header>

      <FailureNote />

      <section className="grid gap-4" aria-label="Living world">
        <FarmMap spectacle />
        <SpectacleChrome />
      </section>

      <p className="spectacle-footnote font-mono text-[11px] text-faint">
        Two AI agents. One farm.{" "}
        <Link to="/history" className="text-sage underline-offset-4 hover:underline">
          History
        </Link>
        {" · "}
        <Link
          to="/agents/$id"
          params={{ id: "bob" }}
          className="text-sage underline-offset-4 hover:underline"
        >
          Bob
        </Link>
        {" · "}
        <Link
          to="/agents/$id"
          params={{ id: "alice" }}
          className="text-sage underline-offset-4 hover:underline"
        >
          Alice
        </Link>
      </p>
    </div>
  );
}
