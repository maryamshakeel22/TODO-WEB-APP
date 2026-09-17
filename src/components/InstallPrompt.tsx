"use client";
import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true); // Browser ke install prompt ko rok kar apna popup dikhayein
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 rounded-xl flex items-center gap-4 max-w-sm animate-fade-in">
      <div>
        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Install TaskTogether</h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Get quick access and instant notifications from your home screen!</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition"
        >
          Install
        </button>
        <button
          onClick={() => setVisible(false)}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold px-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}