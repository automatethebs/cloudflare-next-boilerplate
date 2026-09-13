import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "my-app",
  description: "Blank Next.js + Cloudflare template.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen antialiased")}>
        <div className="flex min-h-screen flex-col">
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">{children}</main>
          <footer className="border-t px-4 py-4 text-xs text-muted-foreground">
            <div className="mx-auto max-w-3xl">© my-app</div>
          </footer>
        </div>
      </body>
    </html>
  );
}
