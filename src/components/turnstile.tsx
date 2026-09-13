"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
    __turnstileLoaded?: boolean;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  theme = "auto",
}: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const cb = useRef({ onVerify, onExpire, onError });
  cb.current = { onVerify, onExpire, onError };

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    function render() {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme,
        callback: (token: string) => cb.current.onVerify(token),
        "expired-callback": () => cb.current.onExpire?.(),
        "error-callback": () => cb.current.onError?.(),
      });
    }

    if (window.turnstile) {
      render();
      return () => {
        cancelled = true;
      };
    }
    const existing = document.querySelector('script[data-turnstile]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", render, { once: true });
      return () => {
        cancelled = true;
        existing.removeEventListener("load", render);
      };
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = "1";
    script.addEventListener("load", render, { once: true });
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      script.removeEventListener("load", render);
    };
  }, [theme]);

  if (!SITE_KEY) {
    return <p className="text-xs text-muted-foreground">Turnstile not configured (NEXT_PUBLIC_TURNSTILE_SITE_KEY).</p>;
  }
  return <div ref={ref} />;
}
