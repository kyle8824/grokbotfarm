import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { experimentDayLine, nextDecisionLine, world } from "@/lib/farm/world";
import { cn } from "@/lib/utils";

const linkClass = cn(
  "flex min-h-11 items-center justify-center px-2 text-sm text-muted transition-colors duration-150",
  "hover:text-fg sm:justify-start sm:px-3",
  "data-[status=active]:font-medium data-[status=active]:text-fg",
);
const activeClass = "text-fg font-medium";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <Link to="/" className="flex items-baseline gap-2">
              <span className="font-display text-xl font-medium tracking-tight sm:text-2xl">
                GrokBotFarm
              </span>
              <span className="font-mono text-xs text-faint">v0.1</span>
            </Link>
            <p className="font-mono text-xs text-muted sm:text-sm">{experimentDayLine()}</p>
          </div>
          <p className="font-mono text-xs text-sage sm:text-sm">{nextDecisionLine()}</p>
        </div>
        <nav aria-label="Observatory" className="border-t border-line">
          <ul className="mx-auto grid w-full max-w-5xl grid-cols-3 sm:flex sm:px-6">
            <li>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className={linkClass}
                activeProps={{ className: activeClass }}
              >
                Home
              </Link>
            </li>
            <li>
              <Link to="/farm" className={linkClass} activeProps={{ className: activeClass }}>
                Farm
              </Link>
            </li>
            <li>
              <Link to="/log" className={linkClass} activeProps={{ className: activeClass }}>
                Log
              </Link>
            </li>
            <li>
              <Link
                to="/agents/$id"
                params={{ id: "bob" }}
                className={linkClass}
                activeProps={{ className: activeClass }}
              >
                Bob
              </Link>
            </li>
            <li>
              <Link
                to="/agents/$id"
                params={{ id: "alice" }}
                className={linkClass}
                activeProps={{ className: activeClass }}
              >
                Alice
              </Link>
            </li>
            <li>
              <Link to="/history" className={linkClass} activeProps={{ className: activeClass }}>
                History
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>GrokBotFarm v0.1. Git is the database. No visitor controls.</p>
          <p>Experiment #{world.farm.experiment} is running.</p>
        </div>
      </footer>
    </div>
  );
}
