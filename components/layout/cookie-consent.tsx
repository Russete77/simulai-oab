"use client";

import { useState, useEffect } from "react";

const GA_ID = "G-S86LF7WYCL";

/**
 * Banner de consentimento de cookies (LGPD)
 * GA4 só é carregado após consentimento explícito do usuário.
 */
export function CookieConsent() {
  const [consent, setConsent] = useState<"pending" | "accepted" | "rejected">("pending");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent");
    if (stored === "accepted") {
      setConsent("accepted");
      loadGA4();
    } else if (stored === "rejected") {
      setConsent("rejected");
    } else {
      setVisible(true);
    }
  }, []);

  function loadGA4() {
    if (typeof window === "undefined") return;
    if (document.getElementById("ga4-script")) return;

    const script = document.createElement("script");
    script.id = "ga4-script";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag("js", new Date());
    gtag("config", GA_ID);
  }

  function handleAccept() {
    localStorage.setItem("cookie_consent", "accepted");
    setConsent("accepted");
    setVisible(false);
    loadGA4();
  }

  function handleReject() {
    localStorage.setItem("cookie_consent", "rejected");
    setConsent("rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-surface border-t border px-4 py-4 sm:px-6 shadow-2xl"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-300 flex-1">
          Usamos cookies de analytics (Google Analytics) para melhorar sua
          experiência. Nenhum dado pessoal é compartilhado com terceiros.{" "}
          <a href="/privacy" className="text-accent underline hover:text-accent">
            Saiba mais
          </a>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm text-gray-400 border rounded-lg hover:bg-surface-2 transition"
          >
            Recusar
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition font-medium"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

// Tipos globais para o window.dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}
