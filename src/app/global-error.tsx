"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem", fontFamily: "system-ui" }}>
          <h2>Something went wrong</h2>
          <p style={{ opacity: 0.7 }}>{error.message}</p>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
