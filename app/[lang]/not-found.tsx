import Link from "next/link";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getDictionary();
  return (
    <div className="space-y-3 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t.notFound.title}</h1>
      <p className="text-sm text-black/70 dark:text-white/70">{t.notFound.body}</p>
      <Link href={localePath(locale, "/")} className="inline-block text-sm underline">
        {t.notFound.home}
      </Link>
    </div>
  );
}
