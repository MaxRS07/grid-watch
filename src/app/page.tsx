export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
            Grid Watch
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-300">
            Advanced Valorant player performance stats and scouting analysis
          </p>
        </div>

        {/* Features Section */}
        <div className="mb-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
              Performance Analysis
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track kills, deaths, damage, and combat efficiency across matches and series with detailed round-by-round breakdowns.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
              Positioning Intelligence
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Analyze team coordination, positioning tendencies, and movement patterns to identify tactical strengths and weaknesses.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
              Trend Analysis
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track performance trends over time to identify improvement areas, consistency patterns, and momentum shifts.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
              AI-Powered Insights
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Get personalized recommendations and tactical insights powered by advanced analysis and machine learning.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-white">
            Ready to improve your game?
          </h2>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            Start analyzing player performance, series statistics, and tactical patterns with Grid Watch.
          </p>
          <a
            href="/players"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            View Players
          </a>
        </div>

        {/* GitHub Link */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Interested in the code?
          </p>
          <a
            href="https://github.com/MaxRS07/grid-watch"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.186.092-.923.35-1.554.636-1.911-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C19.138 20.194 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
