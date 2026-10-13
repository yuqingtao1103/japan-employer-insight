"use client";

import { useI18n } from "@/components/i18n-provider";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="space-y-3 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t.errorTitle}</h1>
      <p className="text-sm text-black/70 dark:text-white/70">{t.errorBody}</p>
      <button type="button" onClick={reset} className="text-sm underline">
        {t.errorRetry}
      </button>
    </div>
  );
}
