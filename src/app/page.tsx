import Link from "next/link";
import { estimateTotalSeconds, listRecipes } from "@/lib/recipes";

// Reflect recipes created at runtime instead of freezing the seed set at build.
export const dynamic = "force-dynamic";

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export default function Home() {
  const recipes = listRecipes();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-paprika/15 px-3 py-1 text-xs font-medium text-paprika">
          PWA · Agentic Sous Chef
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Jacques</h1>
        <p className="max-w-prose text-lg text-neutral-400">
          A sous chef that coaches home cooks through recipes in real time — step-by-step guidance,
          on-the-fly visuals, and voice.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Recipes</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link
                href={`/api/recipes/${recipe.id}`}
                className="flex h-full flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 transition hover:border-paprika/60 hover:bg-neutral-900"
              >
                <span className="text-lg font-medium text-cream">{recipe.title}</span>
                <span className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
                  <span>
                    {recipe.servings} serving{recipe.servings === 1 ? "" : "s"}
                  </span>
                  <span>{recipe.steps.length} steps</span>
                  <span>{formatDuration(estimateTotalSeconds(recipe))}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto flex flex-col gap-2 border-t border-neutral-800 pt-6 text-sm text-neutral-500">
        <span className="font-medium text-neutral-400">API</span>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <Link className="hover:text-paprika" href="/api/health">
            GET /api/health
          </Link>
          <Link className="hover:text-paprika" href="/api/recipes">
            GET /api/recipes
          </Link>
        </div>
      </footer>
    </main>
  );
}
