import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).guide.metaTitle };
}

// Plain-language explainers for Japan-specific workplace terms and figures.
export default async function GuidePage() {
  const t = (await getDictionary()).guide;
  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-black/70 dark:text-white/70">{t.intro}</p>
      </header>

      <nav className="rounded-md border border-black/10 p-4 text-sm dark:border-white/15">
        <ul className="grid gap-1 sm:grid-cols-2">
          {t.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="underline">
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {t.sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-6 space-y-2">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          {section.body.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-black/80 dark:text-white/80">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
