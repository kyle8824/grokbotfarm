import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <p className="font-mono text-xs tracking-wide text-sage uppercase">GrokBotFarm</p>
      <h1 className="font-display text-2xl font-medium">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {error.message || "An unexpected error occurred. Try reloading the page."}
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-sage underline-offset-4 hover:underline"
      >
        Return to the farm
      </Link>
    </main>
  );
}
