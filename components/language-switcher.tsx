"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

// Links to the same page in the other language and remembers the choice.
export function LanguageSwitcher({
  target,
  label,
  title,
}: {
  target: Locale;
  label: string;
  title: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rest = pathname.replace(/^\/[^/]+/, "");
  const query = searchParams.toString();
  const href = `/${target}${rest}${query ? `?${query}` : ""}`;

  return (
    <Link
      href={href}
      title={title}
      lang={target === "zh" ? "zh-Hans" : "en"}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className="rounded-md border border-black/15 px-2 py-0.5 hover:border-black/50 dark:border-white/20 dark:hover:border-white/50"
    >
      {label}
    </Link>
  );
}
