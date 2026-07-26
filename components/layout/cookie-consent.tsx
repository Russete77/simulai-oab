"use client";

import { useState, useEffect } from "react";

const GA_ID = "G-S86LF7WYCL";
// Meta Pixel — só carrega se configurado (NEXT_PUBLIC_META_PIXEL_ID na Vercel).
// Sem isso, mídia paga no Meta/Instagram roda sem pixel de conversão.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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
      loadMetaPixel();
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

  function loadMetaPixel() {
    if (typeof window === "undefined" || !META_PIXEL_ID) return;
    if (document.getElementById("meta-pixel-script")) return;

    const w = window as any;
    if (!w.fbq) {
      w.fbq = function (...args: any[]) {
        (w.fbq.q = w.fbq.q || []).push(args);
      };
      w._fbq = w.fbq;
      w.fbq.push = w.fbq;
      w.fbq.loaded = true;
      w.fbq.version = "2.0";
      w.fbq.queue = [];
    }

    const script = document.createElement("script");
    script.id = "meta-pixel-script";
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.async = true;
    document.head.appendChild(script);

    w.fbq("init", META_PIXEL_ID);
    w.fbq("track", "PageView");
  }

  function handleAccept() {
    localStorage.setItem("cookie_consent", "accepted");
    setConsent("accepted");
    setVisible(false);
    loadGA4();
    loadMetaPixel();
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
