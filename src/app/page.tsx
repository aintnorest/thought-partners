export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-cream sm:text-5xl">Jacques</h1>
      <p className="max-w-prose text-lg text-neutral-400">Walkthrough UI lands at checkpoint 1.</p>
      <nav className="flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
        <a className="text-paprika hover:text-cream" href="/?fixture=1">
          Open fixture walkthrough
        </a>
        <a className="text-paprika hover:text-cream" href="/api/health">
          API health
        </a>
      </nav>
    </main>
  );
}
