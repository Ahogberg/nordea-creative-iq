import Link from "next/link";

// Okända adresser: en Nordea-sida i stället för Next:s standard-404.
export default function NotFound() {
  return (
    <main className="min-h-screen bg-nordea-bg flex items-center justify-center p-6">
      <div className="nordea-card max-w-md w-full p-10 text-center">
        <div className="nordea-eyebrow mb-3">404</div>
        <h1 className="nordea-display text-2xl text-nordea-deep">Sidan finns inte</h1>
        <p className="text-sm text-nordea-text-tertiary mt-2">
          Länken kan vara gammal, eller så har innehållet tagits bort.
        </p>
        <Link href="/dashboard" className="nordea-btn nordea-btn-primary mt-6">
          Till översikten
        </Link>
      </div>
    </main>
  );
}
