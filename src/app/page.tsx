export default function Home() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">It works</p>
        <h1 className="mt-2 text-2xl font-semibold">Blank Cloudflare template</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Next.js on Cloudflare Workers (OpenNext) + D1/Drizzle + Workers AI + Queues. Replace this page with your
          app.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Health: <code>/api/health</code> · Cron: <code>/api/cron/heartbeat</code> (needs <code>CRON_SECRET</code>)
      </p>
    </div>
  );
}
