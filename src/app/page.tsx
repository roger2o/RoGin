import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12 animate-fade-in-up">
        <h1
          className="text-5xl font-bold mb-3"
          style={{ color: 'var(--accent)' }}
        >
          RoGin
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Craft your perfect gin, one botanical at a time
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/builder" className="card p-6 block">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Recipe Builder
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Start from a previous batch or create something new with the AI gin
            distiller wizard. Enter your Juniper amount and build your blend.
          </p>
        </Link>

        <Link href="/log" className="card p-6 block">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Batch Log
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Browse your gin-making history. See what worked, what to try
            differently, and pick a batch as your next starting point.
          </p>
        </Link>

        <Link href="/builder?mode=wizard" className="card p-6 block">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            New Recipe Wizard
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Let an AI gin distiller guide you through creating a new recipe
            based on your taste preferences and past batches.
          </p>
        </Link>

        <Link href="/beginner" className="card p-6 block">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
            Beginner Guide
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            New to gin making? Start here with a simple single-jar infusion
            method and learn how botanicals shape flavour.
          </p>
        </Link>
      </div>
    </div>
  );
}
